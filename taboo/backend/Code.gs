/**
 * AfriTaboo · Phase 1 backend (Google Apps Script)
 * -------------------------------------------------
 * Receives submissions from the elicitation form and writes them to the
 * Google Sheet this script is bound to. Creates three tabs on first use:
 *
 *   participants : one row per participant ID (updated on every submission)
 *   taboos       : one row per taboo (long format, ready for analysis)
 *   submissions  : one row per submission (audit log + feedback)
 *
 * Setup: see ../README.md. In short: Extensions → Apps Script in a new Sheet,
 * paste this file, Deploy → New deployment → Web app → Execute as "Me",
 * Who has access "Anyone", then put the /exec URL in config.js.
 */

const SHEETS = {
  participants: [
    "user_id", "first_seen", "last_seen", "n_submissions", "n_taboos",
    "country", "country_other", "residence", "residence_other", "years_in_country",
    "ethnic_groups", "ethnic_prefer_not", "languages", "first_language",
    "religions", "religion_detail", "religion_raised",
    "region", "age_band", "settlement", "gender", "phase2_interest",
    "ref", "ui_lang", "consent_at", "form_version"
  ],
  taboos: [
    "taboo_id", "user_id", "submission_id", "received_at", "created_at",
    "text", "text_language", "translation_en",
    "primary_theme", "themes", "theme_other", "suggested_themes", "themes_from_suggestion",
    "scope", "belongs_to", "strength",
    "applies_to", "observed_today", "personal_observance",
    "consequence", "context", "learned_from",
    // Participant attributes copied onto each taboo row for easy filtering.
    "p_country", "p_country_other", "p_ethnic_groups", "p_languages", "p_first_language", "p_religions", "p_region", "p_settlement", "p_age_band", "p_gender",
    "time_spent_sec", "edited", "ui_lang", "ref", "form_version"
  ],
  submissions: [
    "submission_id", "user_id", "received_at", "n_taboos", "n_new", "feedback",
    "duration_sec", "device", "browser_lang", "ui_lang", "ref", "previous_submissions", "form_version"
  ]
};

const LIMITS = { maxTaboos: 60, maxText: 2000, maxShort: 300 };

/* ------------------------------------------------------------------ HTTP */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "stats") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const t = ss.getSheetByName("taboos");
    const p = ss.getSheetByName("participants");
    return json_({
      ok: true,
      taboos: t ? Math.max(0, t.getLastRow() - 1) : 0,
      participants: p ? Math.max(0, p.getLastRow() - 1) : 0
    });
  }
  return json_({ ok: true, service: "afritaboo-phase1" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: "busy" });
  }
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.action !== "submit") return json_({ ok: false, error: "bad_action" });

    const uid = String(body.user_id || "");
    if (!/^AT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/.test(uid)) return json_({ ok: false, error: "bad_user_id" });
    if (!body.consent || !body.consent.read || !body.consent.share) return json_({ ok: false, error: "no_consent" });

    const taboos = Array.isArray(body.taboos) ? body.taboos.slice(0, LIMITS.maxTaboos) : [];
    if (!taboos.length) return json_({ ok: false, error: "no_taboos" });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = {};
    Object.keys(SHEETS).forEach(function (name) { sh[name] = ensureSheet_(ss, name, SHEETS[name]); });

    const now = new Date();
    const p = body.participant || {};
    const m = body.meta || {};
    const subId = short_(body.submission_id, 64);

    // Idempotency: a retried submission must not create duplicate rows.
    if (subId && columnHas_(sh.submissions, 1, subId)) return json_({ ok: true, duplicate: true, saved: 0 });

    const existingTaboos = columnSet_(sh.taboos, 1);
    const rows = [];
    taboos.forEach(function (t) {
      const id = short_(t.taboo_id, 64);
      if (!id || existingTaboos[id]) return;
      const text = long_(t.text);
      if (text.length < 3) return;
      rows.push([
        id, uid, subId, now, short_(t.created_at, 40),
        text, short_(t.text_language), long_(t.translation_en),
        short_(t.primary_theme), list_(t.themes), short_(t.theme_other), list_(t.suggested_themes), list_(t.themes_from_suggestion),
        list_(t.scope), short_(t.belongs_to), short_(t.strength),
        list_(t.applies_to), short_(t.observed_today), short_(t.personal_observance),
        long_(t.consequence), long_(t.context), list_(t.learned_from),
        short_(p.country), short_(p.country_other), list_(p.ethnic_groups), list_(p.languages), short_(p.first_language), list_(p.religions), short_(p.region), short_(p.settlement), short_(p.age_band), short_(p.gender),
        num_(t.time_spent_sec), t.edited ? "yes" : "", short_(m.ui_lang), short_(m.ref), short_(body.form_version)
      ].map(safe_));
    });
    if (rows.length) {
      sh.taboos.getRange(sh.taboos.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    upsertParticipant_(sh.participants, uid, now, rows.length, p, m, body);

    sh.submissions.appendRow([
      subId, uid, now, taboos.length, rows.length, long_(body.feedback),
      num_(m.duration_sec), short_(m.device), short_(m.browser_lang), short_(m.ui_lang), short_(m.ref), num_(m.previous_submissions), short_(body.form_version)
    ].map(safe_));

    return json_({ ok: true, saved: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err).slice(0, 200) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ helpers */

function upsertParticipant_(sheet, uid, now, nNew, p, m, body) {
  const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
  let rowIdx = -1;
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === uid) { rowIdx = i + 2; break; }

  let firstSeen = now, nSub = 1, nTab = nNew;
  if (rowIdx > 0) {
    const prev = sheet.getRange(rowIdx, 1, 1, 5).getValues()[0];
    firstSeen = prev[1] || now;
    nSub = (Number(prev[3]) || 0) + 1;
    nTab = (Number(prev[4]) || 0) + nNew;
  }
  const row = [
    uid, firstSeen, now, nSub, nTab,
    short_(p.country), short_(p.country_other), short_(p.residence), short_(p.residence_other), short_(p.years_in_country),
    list_(p.ethnic_groups), p.ethnic_prefer_not ? "yes" : "", list_(p.languages), short_(p.first_language),
    list_(p.religions), short_(p.religion_detail), short_(p.religion_raised),
    short_(p.region), short_(p.age_band), short_(p.settlement), short_(p.gender), p.phase2_interest ? "yes" : "",
    short_(m.ref), short_(m.ui_lang), short_(body.consent && body.consent.at, 40), short_(body.form_version)
  ].map(safe_);
  if (rowIdx > 0) sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
}

function ensureSheet_(ss, name, headers) {
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    s.setFrozenRows(1);
    // Keep IDs and text as plain text so Sheets never reinterprets them.
    s.getRange("A:A").setNumberFormat("@");
  }
  return s;
}

function columnSet_(sheet, col) {
  const out = {};
  if (sheet.getLastRow() < 2) return out;
  sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues().forEach(function (r) { if (r[0]) out[r[0]] = true; });
  return out;
}
function columnHas_(sheet, col, value) { return !!columnSet_(sheet, col)[value]; }

function short_(v, max) { return String(v == null ? "" : v).slice(0, max || LIMITS.maxShort).trim(); }
function long_(v) { return String(v == null ? "" : v).slice(0, LIMITS.maxText).trim(); }
function list_(v) { return Array.isArray(v) ? v.map(function (x) { return short_(x, 120); }).filter(String).join("; ") : short_(v); }
function num_(v) { const n = Number(v); return isFinite(n) ? n : ""; }
// Prevent spreadsheet formula injection from user-typed text.
function safe_(v) { return (typeof v === "string" && /^[=+\-@\t\r]/.test(v)) ? "'" + v : v; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
