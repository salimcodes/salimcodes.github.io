/**
 * AfriTaboo · Phase 1 backend (Google Apps Script relay → private GitHub repo)
 * ---------------------------------------------------------------------------
 * The form (a static page) POSTs each submission here. This script:
 *
 *   1. validates and cleans it,
 *   2. commits it to your PRIVATE data repo as
 *        submissions/<user_id>/<submission_id>.json
 *      (the GitHub token lives in Script Properties, never in the web page),
 *   3. optionally mirrors it into the Google Sheet the script is bound to.
 *
 * Script Properties (Project Settings → Script properties):
 *   GITHUB_TOKEN    fine-grained token: only the data repo, "Contents: Read and write"
 *   GITHUB_REPO     e.g. salimcodes/AfriTabooBench
 *   GITHUB_BRANCH   optional, default "main"
 *   MIRROR_TO_SHEET optional, "true" to also write rows into the bound Sheet
 *
 * After editing: Deploy → Manage deployments → Edit → Version: New version.
 * Run `testGitHub` from the editor once to check the token and repo.
 */

const LIMITS = { maxTaboos: 60, maxText: 2000, maxShort: 300 };
const UID_RE = /^AT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/;

/* ------------------------------------------------------------------ HTTP */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "stats") {
    const props = PropertiesService.getScriptProperties();
    return json_({ ok: true, taboos: Number(props.getProperty("COUNT_TABOOS") || 0), submissions: Number(props.getProperty("COUNT_SUBMISSIONS") || 0) });
  }
  return json_({ ok: true, service: "afritaboo-phase1" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return json_({ ok: false, error: "busy" }); }
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.action !== "submit") return json_({ ok: false, error: "bad_action" });
    if (!UID_RE.test(String(body.user_id || ""))) return json_({ ok: false, error: "bad_user_id" });
    if (!body.consent || !body.consent.read || !body.consent.share) return json_({ ok: false, error: "no_consent" });
    if (!/^[A-Za-z0-9-]{8,64}$/.test(String(body.submission_id || ""))) return json_({ ok: false, error: "bad_submission_id" });

    const record = clean_(body);
    if (!record.taboos.length) return json_({ ok: false, error: "no_taboos" });

    const cfg = config_();
    let isNew = true;

    // 1) Source of truth: the private GitHub repo.
    if (cfg.token && cfg.repo) {
      const res = commitRecord_(cfg, record);
      if (!res.ok) return json_({ ok: false, error: res.error }); // client keeps it queued and retries
      isNew = !res.duplicate;
    }

    // 2) Optional mirror in Google Sheets. A failure here must not lose the submission.
    if (cfg.mirror) {
      try { mirrorToSheet_(record); } catch (err) { console.error("sheet mirror failed: " + err); }
    }

    if (!cfg.token && !cfg.mirror) return json_({ ok: false, error: "backend_not_configured" });

    if (isNew) bumpCounters_(record.taboos.length);
    return json_({ ok: true, saved: record.taboos.length, duplicate: !isNew });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err).slice(0, 200) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ GitHub */

function config_() {
  const p = PropertiesService.getScriptProperties();
  return {
    token: p.getProperty("GITHUB_TOKEN") || "",
    repo: (p.getProperty("GITHUB_REPO") || "").trim(),
    branch: (p.getProperty("GITHUB_BRANCH") || "main").trim(),
    mirror: String(p.getProperty("MIRROR_TO_SHEET") || "").toLowerCase() === "true"
  };
}

function gh_(cfg, method, path, payload) {
  const opts = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      Authorization: "Bearer " + cfg.token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  };
  if (payload) { opts.contentType = "application/json"; opts.payload = JSON.stringify(payload); }
  const res = UrlFetchApp.fetch("https://api.github.com/repos/" + cfg.repo + path, opts);
  let data = null; try { data = JSON.parse(res.getContentText()); } catch (e) { /* ignore */ }
  return { code: res.getResponseCode(), data: data };
}

function commitRecord_(cfg, record) {
  const path = "submissions/" + record.user_id + "/" + record.submission_id + ".json";
  const content = Utilities.base64Encode(JSON.stringify(record, null, 2) + "\n", Utilities.Charset.UTF_8);
  const res = gh_(cfg, "put", "/contents/" + path, {
    message: "Add submission " + record.submission_id.slice(0, 8) + " (" + record.taboos.length + " taboos)",
    content: content,
    branch: cfg.branch,
    committer: { name: "AfriTaboo form", email: "afritaboo-form@users.noreply.github.com" }
  });
  if (res.code === 201 || res.code === 200) return { ok: true };
  // 422 without a sha means the file already exists: this is a retry of a saved submission.
  if (res.code === 422) return { ok: true, duplicate: true };
  console.error("GitHub " + res.code + ": " + JSON.stringify(res.data));
  return { ok: false, error: "github_" + res.code };
}

/** Run this once from the Apps Script editor to check your settings. */
function testGitHub() {
  const cfg = config_();
  if (!cfg.token || !cfg.repo) throw new Error("Set GITHUB_TOKEN and GITHUB_REPO in Project Settings → Script properties.");
  const repo = gh_(cfg, "get", "");
  if (repo.code !== 200) throw new Error("Cannot read repo " + cfg.repo + " (HTTP " + repo.code + "). Check the token's repository access.");
  if (!repo.data.private) console.warn("WARNING: " + cfg.repo + " is PUBLIC. Participant data should go to a private repo.");
  console.log("Read OK: " + repo.data.full_name + " · private=" + repo.data.private + " · branch=" + cfg.branch);

  // Real write test: create and immediately delete a throwaway branch (no commits, no files).
  // (repo.data.permissions describes the token OWNER's access, not the token's, so it can't be trusted here.)
  const head = gh_(cfg, "get", "/git/ref/heads/" + encodeURIComponent(cfg.branch));
  if (head.code !== 200) throw new Error("Branch '" + cfg.branch + "' not found (HTTP " + head.code + ").");
  const testRef = "afritaboo-write-test-" + Date.now();
  const made = gh_(cfg, "post", "/git/refs", { ref: "refs/heads/" + testRef, sha: head.data.object.sha });
  if (made.code !== 201) {
    throw new Error("Token can READ but cannot WRITE (HTTP " + made.code + "). Edit the token on GitHub → Repository permissions → Contents: 'Read and write', then run this again.");
  }
  gh_(cfg, "delete", "/git/refs/heads/" + testRef);
  console.log("Write OK: the form can save submissions to " + cfg.repo + ".");
}

/* ------------------------------------------------------------------ cleaning */

function clean_(b) {
  const p = b.participant || {}, m = b.meta || {}, c = b.consent || {};
  return {
    schema: 1,
    submission_id: short_(b.submission_id, 64),
    user_id: String(b.user_id),
    received_at: new Date().toISOString(),
    form_version: short_(b.form_version, 40),
    consent: { age: !!c.age, read: !!c.read, sensitive: !!c.sensitive, share: !!c.share, at: short_(c.at, 40) },
    participant: {
      country: short_(p.country), country_other: short_(p.country_other),
      residence: short_(p.residence), residence_other: short_(p.residence_other),
      years_in_country: short_(p.years_in_country),
      ethnic_groups: arr_(p.ethnic_groups), ethnic_prefer_not: !!p.ethnic_prefer_not,
      languages: arr_(p.languages), first_language: short_(p.first_language),
      religions: arr_(p.religions), religion_detail: short_(p.religion_detail), religion_raised: short_(p.religion_raised),
      region: short_(p.region), age_band: short_(p.age_band), settlement: short_(p.settlement), gender: short_(p.gender),
      phase2_interest: !!p.phase2_interest
    },
    taboos: (Array.isArray(b.taboos) ? b.taboos : []).slice(0, LIMITS.maxTaboos)
      .filter(function (t) { return t && long_(t.text).length >= 3; })
      .map(function (t) {
        return {
          taboo_id: short_(t.taboo_id, 64),
          text: long_(t.text), text_language: short_(t.text_language), translation_en: long_(t.translation_en),
          themes: arr_(t.themes), primary_theme: short_(t.primary_theme), theme_other: short_(t.theme_other),
          suggested_themes: arr_(t.suggested_themes), themes_from_suggestion: arr_(t.themes_from_suggestion),
          scope: arr_(t.scope), belongs_to: short_(t.belongs_to), strength: short_(t.strength),
          applies_to: arr_(t.applies_to), observed_today: short_(t.observed_today), personal_observance: short_(t.personal_observance),
          consequence: long_(t.consequence), context: long_(t.context), learned_from: arr_(t.learned_from),
          time_spent_sec: num_(t.time_spent_sec), edited: !!t.edited, created_at: short_(t.created_at, 40)
        };
      }),
    feedback: long_(b.feedback),
    meta: {
      ui_lang: short_(m.ui_lang, 10), ref: short_(m.ref, 60), started_at: short_(m.started_at, 40), submitted_at: short_(m.submitted_at, 40),
      duration_sec: num_(m.duration_sec), device: short_(m.device, 20), browser_lang: short_(m.browser_lang, 20),
      previous_submissions: num_(m.previous_submissions)
    }
  };
}

function bumpCounters_(n) {
  const p = PropertiesService.getScriptProperties();
  p.setProperty("COUNT_TABOOS", String(Number(p.getProperty("COUNT_TABOOS") || 0) + n));
  p.setProperty("COUNT_SUBMISSIONS", String(Number(p.getProperty("COUNT_SUBMISSIONS") || 0) + 1));
}

/* ------------------------------------------------------------------ optional Sheet mirror */

const SHEET_COLS = {
  taboos: ["taboo_id", "user_id", "submission_id", "received_at", "text", "text_language", "translation_en", "primary_theme", "themes", "theme_other",
    "scope", "belongs_to", "strength", "applies_to", "observed_today", "personal_observance", "consequence", "context", "learned_from",
    "p_country", "p_country_other", "p_ethnic_groups", "p_languages", "p_first_language", "p_religions", "p_region", "p_settlement", "p_age_band", "p_gender",
    "suggested_themes", "themes_from_suggestion", "time_spent_sec", "edited", "ref", "form_version"]
};

function mirrorToSheet_(r) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return; // standalone script: nothing to mirror into
  let sh = ss.getSheetByName("taboos");
  if (!sh) {
    sh = ss.insertSheet("taboos");
    sh.getRange(1, 1, 1, SHEET_COLS.taboos.length).setValues([SHEET_COLS.taboos]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  const existing = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (x) { existing[x[0]] = true; });
  const p = r.participant, j = function (a) { return (a || []).join("; "); };
  const rows = r.taboos.filter(function (t) { return !existing[t.taboo_id]; }).map(function (t) {
    return [t.taboo_id, r.user_id, r.submission_id, r.received_at, t.text, t.text_language, t.translation_en, t.primary_theme, j(t.themes), t.theme_other,
      j(t.scope), t.belongs_to, t.strength, j(t.applies_to), t.observed_today, t.personal_observance, t.consequence, t.context, j(t.learned_from),
      p.country, p.country_other, j(p.ethnic_groups), j(p.languages), p.first_language, j(p.religions), p.region, p.settlement, p.age_band, p.gender,
      j(t.suggested_themes), j(t.themes_from_suggestion), t.time_spent_sec, t.edited ? "yes" : "", r.meta.ref, r.form_version].map(safe_);
  });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/* ------------------------------------------------------------------ helpers */

function short_(v, max) { return String(v == null ? "" : v).slice(0, max || LIMITS.maxShort).trim(); }
function long_(v) { return String(v == null ? "" : v).slice(0, LIMITS.maxText).trim(); }
function arr_(v) { return (Array.isArray(v) ? v : []).slice(0, 20).map(function (x) { return short_(x, 120); }).filter(String); }
function num_(v) { const n = Number(v); return v === null || v === "" || !isFinite(n) ? null : n; }
function safe_(v) { return (typeof v === "string" && /^[=+\-@\t\r]/.test(v)) ? "'" + v : v; } // block formula injection
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
