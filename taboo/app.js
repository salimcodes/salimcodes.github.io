/* AfriTaboo · Phase 1 elicitation form */
(function () {
  "use strict";

  const CFG = window.AFRITABOO_CONFIG || {};
  const DATA = window.AFRITABOO_DATA;
  const I18N = window.AFRITABOO_I18N;
  const ENDPOINT = (CFG.ENDPOINT || "").trim();
  const KEY = "afritaboo.v1";
  const OUTBOX = "afritaboo.outbox.v1";
  const ARCHIVE = "afritaboo.archive.v1";
  const MAX_TABOOS = CFG.MAX_TABOOS_PER_SUBMISSION || 40;
  const MIN_SUGGESTED = CFG.SUGGESTED_MIN_TABOOS || 3;

  /* ---------------------------------------------------------- utils */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nowISO = () => new Date().toISOString();
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const uuid = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); });

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ------------------------------------------- participant IDs (with checksum) */
  const ALPH = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 symbols, no 0/1/I/L/O
  function checksum(s) { let t = 0; for (let i = 0; i < s.length; i++) t += (i + 1) * ALPH.indexOf(s[i]); return ALPH[t % 31]; }
  function newUid() {
    const a = new Uint32Array(5);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 1e9));
    let s = ""; for (const x of a) s += ALPH[x % 31];
    return "AT-" + s.slice(0, 4) + "-" + s[4] + checksum(s);
  }
  function normUid(v) {
    const m = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^AT/, "");
    if (m.length !== 6) return null;
    for (const ch of m) if (ALPH.indexOf(ch) < 0) return null;
    const body = m.slice(0, 5);
    if (checksum(body) !== m[5]) return null;
    return "AT-" + body.slice(0, 4) + "-" + body[4] + m[5];
  }

  /* ---------------------------------------------------------- state */
  function blankTaboo() {
    return {
      id: uuid(), text: "", text_language: "", text_language_other: "", lang_touched: false,
      translation_en: "", themes: [], theme_other: "", suggested_themes: [], themes_from_suggestion: [],
      scope: [], belongs_to: "", belongs_touched: false, strength: "",
      applies_to: [], observed_today: "", personal_observance: "",
      consequence: "", context: "", learned_from: [], started_at: null, created_at: null, edited: false
    };
  }
  function blankState() {
    return {
      v: 1, lang: null, uid: null, consent: null,
      profile: { ethnic_groups: [], languages: [], religions: [] },
      taboos: [], draft: blankTaboo(), editingId: null, editBackup: null,
      maxStep: 0, step: 0, startedAt: nowISO(), ref: "", feedback: "", phase2: false, submittedCount: 0
    };
  }
  let S = store.get(KEY, null);
  if (!S || S.v !== 1) S = blankState();
  S.draft = Object.assign(blankTaboo(), S.draft || {});

  const params = new URLSearchParams(location.search);
  if (params.get("ref")) S.ref = params.get("ref").slice(0, 60);
  const paramUid = normUid(params.get("uid"));

  let savedFlashTimer;
  const save = debounce(() => {
    if (store.set(KEY, S) && S.step === 2 && S.draft.text) {
      const el = $("#draftSaved"); el.hidden = false; clearTimeout(savedFlashTimer);
      savedFlashTimer = setTimeout(() => (el.hidden = true), 1600);
    }
  }, 350);
  const saveNow = () => store.set(KEY, S);

  /* ---------------------------------------------------------- i18n */
  let LANG = (params.get("lang") || S.lang || (navigator.language || "en")).slice(0, 2).toLowerCase();
  if (!I18N[LANG]) LANG = "en";
  function t(key, vars) {
    let s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
    return s;
  }
  const opt = (group, id) => (I18N[LANG].opt[group] || {})[id] || I18N.en.opt[group][id] || id;
  const themeLabel = (id) => { const th = DATA.THEMES.find((x) => x.id === id); return th ? th[LANG] || th.en : id; };
  const relLabel = (id) => { const r = DATA.RELIGIONS.find((x) => x.id === id); return r ? r[LANG] || r.en : id; };

  function applyI18n() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    $$("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
    if (CFG.CONTACT_EMAIL) {
      const c = $("#contactLine"); c.hidden = false;
      c.innerHTML = esc(t("contact")) + ' <a href="mailto:' + esc(CFG.CONTACT_EMAIL) + '">' + esc(CFG.CONTACT_EMAIL) + "</a>";
    }
    renderAllDynamic();
  }

  /* ---------------------------------------------------------- toast */
  let toastTimer;
  function toast(msg, action) {
    const el = $("#toast");
    el.innerHTML = "<span>" + esc(msg) + "</span>";
    if (action) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = action.label;
      b.onclick = () => { action.fn(); el.hidden = true; };
      el.appendChild(b);
    }
    el.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), action ? 6000 : 2800);
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { /* ignore */ }
      ta.remove(); return ok;
    }
  }

  /* ---------------------------------------------------------- navigation */
  const PROGRESS = [6, 30, 62, 88, 100];
  function go(n, opts = {}) {
    if (n > S.maxStep + 1 && n !== 4) return;
    S.step = n; if (n < 4) S.maxStep = Math.max(S.maxStep, n);
    $$(".step").forEach((sec) => (sec.hidden = Number(sec.dataset.step) !== n));
    $("#stepNav").hidden = n === 4;
    $$("#stepNav li").forEach((li) => {
      const i = Number(li.dataset.step);
      li.classList.toggle("current", i === n);
      li.classList.toggle("done", i < n || (i <= S.maxStep && i !== n));
      li.classList.toggle("reachable", !!(i <= S.maxStep && S.consent));
    });
    $("#progressBar").style.width = PROGRESS[n] + "%";
    if (n === 1) fillProfile();
    if (n === 2) { renderComposer(); renderList(); }
    if (n === 3) renderReview();
    if (!opts.noHistory) { try { history.pushState({ step: n }, "", "#" + ["welcome", "about-you", "taboos", "review", "done"][n]); } catch (e) { /* ignore */ } }
    window.scrollTo({ top: 0, behavior: "smooth" });
    const h = $("#step" + n + " h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    saveNow();
  }
  window.addEventListener("popstate", (e) => {
    const n = e.state && typeof e.state.step === "number" ? e.state.step : 0;
    if (S.step === 4) return go(2, { noHistory: true });
    if (n === 4) return;
    if (n === 3 && !S.taboos.length) return go(2, { noHistory: true });
    if (n === 0 || S.consent) go(n, { noHistory: true });
  });
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) { e.preventDefault(); go(Number(g.dataset.go)); return; }
    const li = e.target.closest("#stepNav li.reachable");
    if (li) {
      const target = Number(li.dataset.step);
      if (target === 3 && !S.taboos.length) return;
      go(target);
    }
  });

  /* ---------------------------------------------------------- step 0: consent */
  function initWelcome() {
    const hasProfile = S.uid && S.consent && S.profile.country && (S.profile.languages || []).length;
    $("#returning").hidden = !hasProfile;
    if (hasProfile) $("#returningId").textContent = S.uid;
    if (paramUid && !hasProfile) {
      $("#existingId").value = paramUid;
      $("#existingId").closest("details").open = true;
    }
    if (CFG.SHOW_PUBLIC_COUNT && ENDPOINT) {
      fetch(ENDPOINT + "?action=stats", { method: "GET" })
        .then((r) => r.json())
        .then((d) => { if (d && d.ok && d.taboos > 0) { const el = $("#publicCount"); el.dataset.n = d.taboos; el.textContent = t("publicCount", { n: d.taboos.toLocaleString() }); el.hidden = false; } })
        .catch(() => {});
    }
  }
  $("#continueReturning").addEventListener("click", () => go(2));
  $("#startFresh").addEventListener("click", () => {
    const keepLang = LANG, keepRef = S.ref;
    S = blankState(); S.lang = keepLang; S.ref = keepRef; saveNow();
    $("#returning").hidden = true;
    $("#consentForm").reset();
    toast("✓");
  });
  $("#consentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const boxes = ["c_age", "c_read", "c_sensitive", "c_share"];
    const allOk = boxes.every((n) => f.elements[n].checked);
    const err = $("#consentError");
    if (!allOk) { err.textContent = t("consentError"); err.hidden = false; return; }
    const typed = $("#existingId").value.trim();
    if (typed) {
      const id = normUid(typed);
      if (!id) { err.textContent = t("badId"); err.hidden = false; $("#existingId").focus(); return; }
      if (id !== S.uid) { S.uid = id; }
    }
    err.hidden = true;
    if (!S.uid) S.uid = newUid();
    S.consent = { age: true, read: true, sensitive: true, share: true, at: nowISO(), form_version: CFG.FORM_VERSION };
    go(1);
  });

  /* ---------------------------------------------------------- step 1: profile */
  const countryByName = (n) => DATA.COUNTRIES.find((c) => c.name === n);

  function fillSelect(sel, options, value) {
    sel.innerHTML = options.map((o) => `<option value="${esc(o.v)}"${o.disabled ? " disabled" : ""}>${esc(o.l)}</option>`).join("");
    if (value != null) sel.value = value;
  }
  function renderProfileSelects() {
    const p = S.profile;
    const cs = DATA.COUNTRIES.map((c) => ({ v: c.name, l: c.name }));
    fillSelect($("#country"), [{ v: "", l: t("selectPh") }, ...cs, { v: "__other", l: t("countryOtherOpt") }], p.country || "");
    const rel = DATA.RELIGIONS.filter((r) => r.id !== "prefer_not").map((r) => ({ v: r.id, l: r[LANG] || r.en }));
    fillSelect($("#religionRaised"), [{ v: "", l: t("sameAsAbove") }, ...rel], p.religion_raised || "");
    $("#religionGrid").innerHTML = DATA.RELIGIONS.map((r) =>
      `<label class="check"><input type="checkbox" name="religion" value="${r.id}"${(p.religions || []).includes(r.id) ? " checked" : ""}/> <span>${esc(r[LANG] || r.en)}</span></label>`
    ).join("");
    const ab = $("#ageBand"); ab.options[0].textContent = t("selectPh");
  }

  function updateCountryDependent() {
    const c = countryByName($("#country").value);
    const eth = c ? c.ethnic : DATA.COUNTRIES.flatMap((x) => x.ethnic);
    $("#ethnicList").innerHTML = [...new Set(eth)].map((x) => `<option value="${esc(x)}">`).join("");
    const langs = [...new Set([...(c ? c.languages : []), ...DATA.COMMON_LANGUAGES, ...DATA.COUNTRIES.flatMap((x) => x.languages)])];
    $("#langList").innerHTML = langs.map((x) => `<option value="${esc(x)}">`).join("");
    $("#countryOther").hidden = $("#country").value !== "__other";
  }

  /* Tag input component */
  function TagInput(root, getArr, setArr, opts = {}) {
    const list = $(".tag-list", root);
    const input = $("input", root);
    const max = opts.max || 8;
    const render = () => {
      const arr = getArr();
      list.innerHTML = arr.map((v, i) =>
        `<span class="tag${i === 0 && opts.firstBadge ? " tag-first" : ""}" data-i="${i}">` +
        (opts.firstBadge ? `<button type="button" class="tag-main" data-act="first" title="${esc(t("makeFirst"))}">${esc(v)}${i === 0 ? ` <small>${esc(t("firstLang"))}</small>` : ""}</button>` : `<span>${esc(v)}</span>`) +
        `<button type="button" class="tag-x" data-act="x" aria-label="${esc(t("remove"))} ${esc(v)}">×</button></span>`
      ).join("");
      input.disabled = !!(opts.isDisabled && opts.isDisabled());
      root.classList.toggle("disabled", input.disabled);
    };
    const add = (raw) => {
      const vals = String(raw).split(/[,;]/).map((x) => x.trim().replace(/\s+/g, " ")).filter(Boolean);
      if (!vals.length) return false;
      const arr = getArr().slice();
      for (const v of vals) {
        if (arr.length >= max) break;
        if (!arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v.slice(0, 80));
      }
      setArr(arr); input.value = ""; render(); opts.onChange && opts.onChange(); return true;
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "," || e.key === ";") { if (input.value.trim()) { e.preventDefault(); add(input.value); } else if (e.key === "Enter") e.preventDefault(); }
      else if (e.key === "Backspace" && !input.value) { const arr = getArr().slice(); arr.pop(); setArr(arr); render(); opts.onChange && opts.onChange(); }
    });
    input.addEventListener("input", (e) => {
      // Picking an item from the datalist inserts it in one go: add it immediately.
      if (!e.inputType || e.inputType === "insertReplacementText") {
        const dl = input.list; const v = input.value.trim();
        if (dl && Array.from(dl.options).some((o) => o.value === v)) add(v);
      }
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const i = Number(b.closest(".tag").dataset.i); const arr = getArr().slice();
      if (b.dataset.act === "x") arr.splice(i, 1);
      else if (b.dataset.act === "first" && i > 0) arr.unshift(arr.splice(i, 1)[0]);
      setArr(arr); render(); opts.onChange && opts.onChange();
    });
    return { render, flush: () => (input.value.trim() ? (add(input.value), true) : false), input };
  }

  const ethnicTags = TagInput($("#ethnicTags"), () => S.profile.ethnic_groups || [], (a) => (S.profile.ethnic_groups = a), {
    max: 6, isDisabled: () => !!S.profile.ethnic_prefer_not, onChange: save
  });
  const langTags = TagInput($("#langTags"), () => S.profile.languages || [], (a) => (S.profile.languages = a), {
    max: 8, firstBadge: true, onChange: save
  });

  function fillProfile() {
    const p = S.profile, f = $("#profileForm");
    $("#uidDisplay").textContent = S.uid || "";
    renderProfileSelects();
    $("#countryOther").value = p.country_other || "";
    $("#ethnicPreferNot").checked = !!p.ethnic_prefer_not;
    $("#religionDetail").value = p.religion_detail || "";
    $("#region").value = p.region || "";
    $("#ageBand").value = p.age_band || "";
    ["years_in_country", "settlement", "gender"].forEach((n) => {
      $$(`input[name="${n}"]`, f).forEach((r) => (r.checked = r.value === p[n]));
    });
    updateCountryDependent();
    ethnicTags.render(); langTags.render();
  }

  function collectProfile() {
    const p = S.profile, f = $("#profileForm");
    p.country = $("#country").value;
    p.country_other = p.country === "__other" ? $("#countryOther").value.trim() : "";
    p.ethnic_prefer_not = $("#ethnicPreferNot").checked;
    p.religions = $$('input[name="religion"]:checked', f).map((x) => x.value);
    p.religion_detail = $("#religionDetail").value.trim();
    p.religion_raised = $("#religionRaised").value;
    p.region = $("#region").value.trim();
    p.age_band = $("#ageBand").value;
    ["years_in_country", "settlement", "gender"].forEach((n) => {
      const r = $(`input[name="${n}"]:checked`, f); p[n] = r ? r.value : "";
    });
  }

  $("#profileForm").addEventListener("change", (e) => {
    const tgt = e.target;
    if (tgt.name === "religion") {
      // "Prefer not to say" and "No religion" are exclusive with the others.
      const excl = ["prefer_not", "none"];
      const boxes = $$('input[name="religion"]');
      if (tgt.checked && excl.includes(tgt.value)) boxes.forEach((b) => { if (b !== tgt) b.checked = false; });
      else if (tgt.checked) boxes.forEach((b) => { if (excl.includes(b.value)) b.checked = false; });
    }
    if (tgt.id === "country") updateCountryDependent();
    if (tgt.id === "ethnicPreferNot") { S.profile.ethnic_prefer_not = tgt.checked; ethnicTags.render(); }
    collectProfile(); save();
  });
  $("#profileForm").addEventListener("input", debounce(() => { collectProfile(); save(); }, 300));

  $("#profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const notes = [];
    if (ethnicTags.flush()) notes.push(t("pendingTagAdded", { v: S.profile.ethnic_groups.slice(-1)[0] }));
    if (langTags.flush()) notes.push(t("pendingTagAdded", { v: S.profile.languages.slice(-1)[0] }));
    collectProfile();
    const p = S.profile, errs = [];
    let focus = null;
    if (!p.country) { errs.push(t("errCountry")); focus = focus || $("#country"); }
    else if (p.country === "__other" && !p.country_other) { errs.push(t("errCountryOther")); focus = focus || $("#countryOther"); }
    if (!p.ethnic_prefer_not && !(p.ethnic_groups || []).length) { errs.push(t("errEthnic")); focus = focus || $("#ethnicInput"); }
    if (!(p.languages || []).length) { errs.push(t("errLang")); focus = focus || $("#langInput"); }
    if (!(p.religions || []).length) { errs.push(t("errReligion")); focus = focus || $("#religionGrid input"); }
    const box = $("#profileError");
    if (errs.length) { box.innerHTML = errs.map(esc).join("<br>"); box.hidden = false; focus && focus.focus(); return; }
    box.hidden = true;
    if (notes.length) toast(notes.join(" "));
    // Refresh the default "belongs to" in the composer if the user hasn't edited it.
    if (!S.draft.belongs_touched) S.draft.belongs_to = defaultBelongsTo();
    go(2);
  });

  $("#copyId").addEventListener("click", async () => { if (await copyText(S.uid)) toast(t("copied") + ": " + S.uid); });
  $("#copyId2").addEventListener("click", async () => { if (await copyText(S.uid)) toast(t("copied") + ": " + S.uid); });

  /* ---------------------------------------------------------- step 2: taboo composer */
  const SCOPE = ["family", "ethnic", "religion", "local", "country", "multi_country", "other_group", "unsure"];
  const STRENGTH = ["forbidden", "strong", "mild", "depends"];
  const OBSERVED = ["widely", "some", "rarely", "unsure"];
  const PERSONAL = ["yes", "sometimes", "no", "na"];
  const APPLIES = ["everyone", "women", "men", "children", "pregnant", "elders", "married", "inlaws", "bereaved", "visitors", "leaders", "other"];
  const LEARNED = ["family", "elders", "religion", "community", "peers", "school", "media", "experience"];

  function countryDisplay(p = S.profile) {
    return p.country === "__other" ? p.country_other : p.country || "";
  }
  function defaultBelongsTo() {
    const p = S.profile;
    if (!p.ethnic_prefer_not && (p.ethnic_groups || []).length) return p.ethnic_groups.join(" / ") + (countryDisplay() ? " (" + countryDisplay() + ")" : "");
    return countryDisplay();
  }

  function langOptions() {
    const seen = new Set(); const out = [];
    const push = (v) => { const k = v.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push({ v, l: v }); } };
    (S.profile.languages || []).forEach(push);
    push("English"); push("French"); push("Arabic");
    return [{ v: "", l: t("selectPh") }, ...out, { v: "__mixed", l: t("codeSwitched") }, { v: "__other", l: t("otherLang") }];
  }

  function renderChips(container, ids, labelFn, selected, { badgeFirst = false, cls = "" } = {}) {
    container.innerHTML = ids.map((id) => {
      const i = selected.indexOf(id);
      const on = i >= 0;
      return `<button type="button" class="chip ${cls}${on ? " on" : ""}" data-id="${id}" aria-pressed="${on}">${esc(labelFn(id))}${badgeFirst && i === 0 && selected.length > 1 ? ` <small>${esc(t("mainTheme"))}</small>` : ""}</button>`;
    }).join("");
  }
  function renderPills(container, name, ids, group, value) {
    container.innerHTML = ids.map((id) =>
      `<label><input type="radio" name="${name}" value="${id}"${value === id ? " checked" : ""}/><span>${esc(opt(group, id))}</span></label>`
    ).join("");
  }
  function renderChecks(container, name, ids, group, selected) {
    container.innerHTML = ids.map((id) =>
      `<label class="check"><input type="checkbox" name="${name}" value="${id}"${selected.includes(id) ? " checked" : ""}/> <span>${esc(opt(group, id))}</span></label>`
    ).join("");
  }
  function toggleIn(arr, id, exclusive = []) {
    const i = arr.indexOf(id);
    if (i >= 0) { arr.splice(i, 1); return arr; }
    if (exclusive.includes(id)) return [id];
    const out = arr.filter((x) => !exclusive.includes(x)); out.push(id); return out;
  }

  function renderThemeChips() {
    const d = S.draft;
    renderChips($("#themeChips"), DATA.THEMES.map((x) => x.id), themeLabel, d.themes, { badgeFirst: true });
    $("#themeOther").hidden = !d.themes.includes("other");
  }

  function renderComposer() {
    const d = S.draft;
    $("#composerTitle").textContent = S.editingId ? t("editingTaboo", { n: S.taboos.findIndex((x) => x.id === S.editingId) + 1 }) : t("newTaboo");
    $("#addTaboo").textContent = S.editingId ? t("saveChanges") : t("addTaboo");
    $("#cancelEdit").hidden = !S.editingId;
    $("#tabooText").value = d.text;
    $("#translation").value = d.translation_en;
    $("#themeOther").value = d.theme_other;
    $("#consequence").value = d.consequence;
    $("#context").value = d.context;
    if (!d.belongs_touched && !d.belongs_to) d.belongs_to = defaultBelongsTo();
    $("#belongsTo").value = d.belongs_to;
    fillSelect($("#textLang"), langOptions(), d.text_language);
    if ($("#textLang").value !== d.text_language) { $("#textLang").value = ""; d.text_language = ""; }
    $("#textLangOther").value = d.text_language_other;
    $("#textLangOther").hidden = d.text_language !== "__other";
    renderThemeChips();
    renderChecks($("#scopeGrid"), "scope", SCOPE, "scope", d.scope);
    renderPills($("#strengthPills"), "strength", STRENGTH, "strength", d.strength);
    renderChips($("#appliesChips"), APPLIES, (id) => opt("applies", id), d.applies_to);
    renderPills($("#observedPills"), "observed", OBSERVED, "observed", d.observed_today);
    renderPills($("#personalPills"), "personal", PERSONAL, "personal", d.personal_observance);
    renderChips($("#learnedChips"), LEARNED, (id) => opt("learned", id), d.learned_from);
    const hasMore = d.applies_to.length || d.observed_today || d.personal_observance || d.consequence || d.context || d.learned_from.length;
    if (hasMore) $("#moreDetails").open = true;
    updateTextMeta(); updateTranslationVisibility(); updateSuggestions(); updateNudges();
    renderJogger();
    $("#tabooError").hidden = true;
  }

  function updateTextMeta() {
    const n = $("#tabooText").value.length;
    $("#textCount").textContent = n + " / 1500";
  }
  function updateTranslationVisibility() {
    const v = S.draft.text_language;
    const show = !!v && v.toLowerCase() !== "english";
    $("#translationField").hidden = !show;
  }

  /* --- smart helpers: theme suggestion, language guess, nudges --- */
  const SUFX = ["", "s", "es", "d", "ed", "ing", "en", "er", "ers", "ting", "ning", "ness", "e"];
  const AR_RE = /[؀-ۿ]/;
  // Arabic: drop diacritics and tatweel, unify alef/ya/ta-marbuta spellings, so "الأكْل" ~ "الاكل".
  const arNorm = (s) => s.replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
  const norm = (s) => " " + arNorm(String(s).toLowerCase().normalize("NFC")).replace(/[^\p{L}\p{N}'\- ]+/gu, " ").replace(/\s+/g, " ").trim() + " ";
  // Arabic attaches و/ف and ال/ب/ل/ك to the front of words: try the word with and without them.
  const arStems = (w) => { const out = new Set([w]); const a = w.replace(/^[وف]/, ""); out.add(a); out.add(a.replace(/^(بال|كال|لل|ال|ب|ل|ك)/, "")); return [...out].filter((x) => x.length >= 2); };
  const AR_SUFX = ["", "ه", "ات", "ين", "ون", "ي", "ها", "هم", "ان"];
  function scoreThemes(text) {
    const padded = norm(text); const words = padded.trim().split(" ").filter(Boolean);
    const scores = [];
    for (const th of DATA.THEMES) {
      let sc = 0;
      for (let k of th.kw) {
        k = arNorm(k.trim().toLowerCase()); if (!k) continue;
        if (/[\s-]/.test(k)) { if (padded.includes(" " + k)) sc += 2; continue; }
        if (AR_RE.test(k)) {
          for (const w of words) if (arStems(w).some((x) => k.length <= 3 ? AR_SUFX.some((s) => x === k + s) : x.startsWith(k))) sc++;
          continue;
        }
        for (const w of words) {
          if (k.length <= 4 ? SUFX.some((s) => w === k + s) : w.startsWith(k)) sc++;
        }
      }
      if (sc) scores.push([th.id, sc]);
    }
    return scores.sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  }
  function updateSuggestions() {
    const d = S.draft;
    const ranked = scoreThemes(d.text + " " + d.translation_en);
    d.suggested_themes = ranked.slice(0, 4);
    const show = ranked.filter((id) => !d.themes.includes(id)).slice(0, 3);
    $("#themeSuggest").hidden = !show.length;
    renderChips($("#themeSuggestChips"), show, (id) => "+ " + themeLabel(id), [], { cls: "chip-suggest" });
  }

  const STOP_EN = new Set("the and is are to of you your it not must never do don't doesn't a an in for be should when someone people they their with on if or at by from this that".split(" "));
  const STOP_FR = new Set("le la les et est sont de des du un une pas ne il elle on jamais doit faut pour dans que qui quand au aux se ce cette nous vous leur ou en avec sur".split(" "));
  function guessLanguage(text) {
    const letters = String(text).replace(/[^\p{L}]/gu, "");
    if (letters.length >= 12) {
      const ar = (letters.match(/[؀-ۿ]/g) || []).length / letters.length;
      if (ar > 0.85) return "Arabic";
      if (ar > 0.15) return ""; // Arabic mixed with another language: let the person choose
    }
    const words = norm(text).trim().split(" ").filter(Boolean);
    if (words.length < 4) return null;
    let en = 0, fr = 0;
    words.forEach((w) => { if (STOP_EN.has(w)) en++; if (STOP_FR.has(w)) fr++; });
    const re = en / words.length, rf = fr / words.length;
    if (re >= 0.18 && re > rf * 1.5) return "English";
    if (rf >= 0.18 && rf > re * 1.5) return "French";
    return words.length >= 6 ? "" : null; // "" = probably neither, ask the person
  }
  function autoLanguage() {
    const d = S.draft;
    if (d.lang_touched) return;
    const g = guessLanguage(d.text);
    if (g === null) return;
    const sel = $("#textLang");
    const match = Array.from(sel.options).find((o) => o.value.toLowerCase() === g.toLowerCase());
    const val = g && match ? match.value : "";
    if (val !== d.text_language) {
      d.text_language = val; sel.value = val;
      $("#textLangOther").hidden = true;
      updateTranslationVisibility();
    }
  }

  const NEG = /(\bnot\b|n't|\bnever\b|\bno\b|\bnobody\b|\bforbid|\btaboo|\bavoid|\babominat|\bmustn|\bprohibit|\bnot allowed|\bbad luck|\bdisrespect|\bne\b|\bpas\b|\bjamais\b|\binterdi|\btabou|\béviter|\bproscrit|\bhar[aā]m|\bèèwọ̀|\beewo|\bnsọ|\bnso\b|\bmwiko|\bmiko\b|\bkatazwa|\bila\b|\bzila)/i;
  function grams(s) {
    s = " " + String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim() + " ";
    const g = new Map(); for (let i = 0; i < s.length - 2; i++) { const k = s.substr(i, 3); g.set(k, (g.get(k) || 0) + 1); }
    return g;
  }
  function similarity(a, b) {
    const A = grams(a), B = grams(b); let inter = 0, na = 0, nb = 0;
    A.forEach((v) => (na += v)); B.forEach((v) => (nb += v));
    A.forEach((v, k) => { if (B.has(k)) inter += Math.min(v, B.get(k)); });
    return na + nb ? (2 * inter) / (na + nb) : 0;
  }
  function updateNudges() {
    const d = S.draft, out = [];
    // Arabic-Indic digits (٠-٩, ۰-۹) count as digits for the phone-number check.
    const txt = d.text.trim().replace(/[٠-٩۰-۹]/g, (c) => String(c.charCodeAt(0) & 0xF));
    if (txt) {
      const phoneLike = (txt.match(/\+?\d[\d\s().-]{7,}\d/g) || []).some((m) => m.replace(/\D/g, "").length >= 9);
      if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(txt) || phoneLike) out.push(["warn", t("nudgePII")]);
      const listLines = txt.split(/\n/).filter((l) => /^\s*(\d+[.)]|[-•*])\s+/.test(l)).length;
      if (listLines >= 2 || /\b(secondly|another one is|also,? (it is|you|we)|deuxièmement|autre tabou)\b/i.test(txt) || /(ثانيا|محظور اخر|من المحظورات ايضا)/.test(arNorm(txt))) out.push(["info", t("nudgeMulti")]);
      let best = 0, bestIdx = -1;
      S.taboos.forEach((x, i) => { if (x.id === S.editingId) return; const s = similarity(txt, x.text); if (s > best) { best = s; bestIdx = i; } });
      if (best >= 0.6 && txt.length > 15) out.push(["info", t("nudgeDup", { n: bestIdx + 1 })]);
      if (txt.length < 40) out.push(["soft", t("nudgeShort")]);
      else if (["english", "french"].includes((d.text_language || "").toLowerCase()) && !NEG.test(txt)) out.push(["soft", t("nudgeNoNeg")]);
    }
    $("#nudges").innerHTML = out.map(([k, m]) => `<p class="nudge nudge-${k}">${m}</p>`).join("");
  }
  const slowNudges = debounce(updateNudges, 900);
  const slowSuggest = debounce(() => { updateSuggestions(); autoLanguage(); }, 300);

  /* --- memory jogger --- */
  let joggerOffset = 0, joggerActive = null;
  function renderJogger() {
    const themes = DATA.THEMES.filter((x) => x.id !== "other");
    const covered = new Set(S.taboos.flatMap((x) => x.themes));
    // Prefer areas the person hasn't covered yet.
    const ordered = [...themes.filter((x) => !covered.has(x.id)), ...themes.filter((x) => covered.has(x.id))];
    const n = window.innerWidth < 560 ? 5 : 8;
    const slice = []; for (let i = 0; i < Math.min(n, ordered.length); i++) slice.push(ordered[(joggerOffset + i) % ordered.length]);
    renderChips($("#joggerChips"), slice.map((x) => x.id), themeLabel, joggerActive ? [joggerActive] : [], { cls: "chip-jog" });
    const q = $("#joggerQ");
    const th = DATA.THEMES.find((x) => x.id === joggerActive);
    q.hidden = !th; if (th) q.textContent = th["p" + LANG] || th.pen;
  }
  $("#shuffleJogger").addEventListener("click", () => { joggerOffset += window.innerWidth < 560 ? 5 : 8; joggerActive = null; renderJogger(); });
  $("#joggerChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    joggerActive = joggerActive === b.dataset.id ? null : b.dataset.id; renderJogger();
    if (joggerActive && !S.draft.text) $("#tabooText").focus();
  });

  /* --- composer events --- */
  $("#tabooText").addEventListener("input", (e) => {
    const d = S.draft; d.text = e.target.value; if (!d.started_at) d.started_at = Date.now();
    updateTextMeta(); slowSuggest(); slowNudges(); save();
  });
  $("#tabooText").addEventListener("blur", () => { updateSuggestions(); autoLanguage(); updateNudges(); });
  $("#translation").addEventListener("input", (e) => { S.draft.translation_en = e.target.value; slowSuggest(); save(); });
  $("#textLang").addEventListener("change", (e) => {
    S.draft.text_language = e.target.value; S.draft.lang_touched = true;
    $("#textLangOther").hidden = e.target.value !== "__other";
    if (e.target.value === "__other") $("#textLangOther").focus();
    updateTranslationVisibility(); updateNudges(); save();
  });
  $("#textLangOther").addEventListener("input", (e) => { S.draft.text_language_other = e.target.value; save(); });
  $("#themeOther").addEventListener("input", (e) => { S.draft.theme_other = e.target.value; save(); });
  $("#consequence").addEventListener("input", (e) => { S.draft.consequence = e.target.value; save(); });
  $("#context").addEventListener("input", (e) => { S.draft.context = e.target.value; save(); });
  $("#belongsTo").addEventListener("input", (e) => { S.draft.belongs_to = e.target.value; S.draft.belongs_touched = true; save(); });

  $("#themeChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const d = S.draft; d.themes = toggleIn(d.themes.slice(), b.dataset.id);
    d.themes_from_suggestion = d.themes_from_suggestion.filter((x) => d.themes.includes(x));
    renderThemeChips(); updateSuggestions(); save();
    if (b.dataset.id === "other" && d.themes.includes("other")) $("#themeOther").focus();
  });
  $("#themeSuggestChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const d = S.draft; if (!d.themes.includes(b.dataset.id)) { d.themes.push(b.dataset.id); d.themes_from_suggestion.push(b.dataset.id); }
    renderThemeChips(); updateSuggestions(); save();
  });
  $("#scopeGrid").addEventListener("change", (e) => {
    const d = S.draft;
    d.scope = toggleIn(d.scope.slice(), e.target.value, ["unsure"]);
    renderChecks($("#scopeGrid"), "scope", SCOPE, "scope", d.scope);
    if (e.target.value === "other_group" && d.scope.includes("other_group") && !d.belongs_touched) {
      d.belongs_to = ""; $("#belongsTo").value = ""; $("#belongsTo").focus();
    }
    save();
  });
  $("#strengthPills").addEventListener("change", (e) => { S.draft.strength = e.target.value; save(); });
  $("#observedPills").addEventListener("change", (e) => { S.draft.observed_today = e.target.value; save(); });
  $("#personalPills").addEventListener("change", (e) => { S.draft.personal_observance = e.target.value; save(); });
  $("#appliesChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    S.draft.applies_to = toggleIn(S.draft.applies_to.slice(), b.dataset.id, ["everyone"]);
    renderChips($("#appliesChips"), APPLIES, (id) => opt("applies", id), S.draft.applies_to); save();
  });
  $("#learnedChips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    S.draft.learned_from = toggleIn(S.draft.learned_from.slice(), b.dataset.id);
    renderChips($("#learnedChips"), LEARNED, (id) => opt("learned", id), S.draft.learned_from); save();
  });
  $("#tabooForm").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitDraft(); }
  });
  $("#tabooForm").addEventListener("submit", (e) => { e.preventDefault(); commitDraft(); });
  $("#cancelEdit").addEventListener("click", () => {
    S.editingId = null; S.draft = S.editBackup || blankTaboo(); S.editBackup = null;
    renderComposer(); renderList(); saveNow();
  });

  function validateDraft() {
    const d = S.draft, errs = []; let focus = null;
    if (d.text.trim().length < 10) { errs.push(t("errText")); focus = focus || $("#tabooText"); }
    if (!d.text_language || (d.text_language === "__other" && !d.text_language_other.trim())) { errs.push(t("errTextLang")); focus = focus || $("#textLang"); }
    if (!d.themes.length) { errs.push(t("errTheme")); focus = focus || $("#themeChips .chip"); }
    else if (d.themes.includes("other") && !d.theme_other.trim()) { errs.push(t("errThemeOther")); focus = focus || $("#themeOther"); }
    if (!d.scope.length) { errs.push(t("errScope")); focus = focus || $("#scopeGrid input"); }
    if (!d.strength) { errs.push(t("errStrength")); focus = focus || $("#strengthPills input"); }
    return { errs, focus };
  }

  function commitDraft() {
    const isEdit = !!S.editingId;
    if (!isEdit && S.taboos.length >= MAX_TABOOS) { showTabooError([t("errTooMany")]); return false; }
    const { errs, focus } = validateDraft();
    if (errs.length) { showTabooError(errs); focus && focus.focus(); return false; }
    const d = S.draft;
    d.text = d.text.trim(); d.translation_en = d.translation_en.trim();
    if (isEdit) {
      const i = S.taboos.findIndex((x) => x.id === S.editingId);
      d.edited = true; S.taboos[i] = d;
      S.draft = S.editBackup || blankTaboo(); S.editBackup = null; S.editingId = null;
      toast(t("updated"));
    } else {
      d.created_at = nowISO();
      d.time_spent_sec = d.started_at ? Math.round((Date.now() - d.started_at) / 1000) : null;
      S.taboos.push(d);
      // Carry over sensible defaults so the next entry is quicker.
      const next = blankTaboo();
      next.text_language = d.lang_touched ? d.text_language : "";
      next.lang_touched = d.lang_touched; next.text_language_other = d.text_language_other;
      next.belongs_to = d.belongs_to; next.belongs_touched = d.belongs_touched;
      S.draft = next;
      toast(t("added"));
    }
    $("#moreDetails").open = false; joggerActive = null;
    saveNow(); renderComposer(); renderList();
    $("#tabooText").focus();
    return true;
  }
  function showTabooError(errs) {
    const box = $("#tabooError"); box.innerHTML = errs.map(esc).join("<br>"); box.hidden = false;
  }

  function tabooSummaryHTML(x, i, { actions = true, full = false } = {}) {
    const lang = x.text_language === "__mixed" ? t("codeSwitched") : x.text_language === "__other" ? x.text_language_other : x.text_language;
    const themes = x.themes.map((id) => `<span class="mini-chip">${esc(id === "other" && x.theme_other ? x.theme_other : themeLabel(id))}</span>`).join("");
    const meta = [opt("strength", x.strength), x.scope.map((s) => opt("scope", s)).join(", "), lang].filter(Boolean).map(esc).join(" · ");
    const extra = full ? [
      x.translation_en && `<p class="tr">“${esc(x.translation_en)}”</p>`,
      x.belongs_to && `<p class="sub"><b>${esc(t("belongsTo"))}</b> ${esc(x.belongs_to)}</p>`,
      x.applies_to.length && `<p class="sub"><b>${esc(t("appliesTo"))}</b> ${esc(x.applies_to.map((a) => opt("applies", a)).join(", "))}</p>`,
      x.consequence && `<p class="sub"><b>${esc(t("consequence"))}</b> ${esc(x.consequence)}</p>`,
      x.context && `<p class="sub"><b>${esc(t("context"))}</b> ${esc(x.context)}</p>`
    ].filter(Boolean).join("") : "";
    return `<li class="taboo-item${S.editingId === x.id ? " editing" : ""}" data-id="${x.id}">
      <span class="num">${i + 1}</span>
      <div class="taboo-body">
        <p class="taboo-text${full ? "" : " clamp"}">${esc(x.text)}</p>
        ${extra}
        <div class="taboo-meta">${themes}<span class="meta-text">${meta}</span></div>
      </div>
      ${actions ? `<div class="taboo-actions"><button type="button" class="linkbtn" data-act="edit">${esc(t("edit"))}</button><button type="button" class="linkbtn danger" data-act="del">${esc(t("remove"))}</button></div>` : ""}
    </li>`;
  }

  function renderList() {
    const n = S.taboos.length;
    $("#tabooList").innerHTML = S.taboos.map((x, i) => tabooSummaryHTML(x, i)).join("");
    $("#listCount").textContent = n;
    $("#emptyList").hidden = n > 0;
    $("#listEncourage").textContent = n === 0 ? "" : n < MIN_SUGGESTED ? t("encourage1") : t("encourage3");
    $("#toReview").disabled = n === 0 && !S.draft.text.trim();
  }
  $("#tabooList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const id = b.closest(".taboo-item").dataset.id;
    const i = S.taboos.findIndex((x) => x.id === id); if (i < 0) return;
    if (b.dataset.act === "edit") {
      if (!S.editingId) S.editBackup = S.draft;
      S.editingId = id; S.draft = JSON.parse(JSON.stringify(S.taboos[i]));
      renderComposer(); renderList(); saveNow();
      $("#tabooForm").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("#tabooText").focus({ preventScroll: true }), 300);
    } else if (b.dataset.act === "del") {
      const [removed] = S.taboos.splice(i, 1);
      if (S.editingId === id) { S.editingId = null; S.draft = S.editBackup || blankTaboo(); S.editBackup = null; renderComposer(); }
      saveNow(); renderList();
      toast(t("removed"), { label: t("undo"), fn: () => { S.taboos.splice(i, 0, removed); saveNow(); renderList(); } });
    }
  });

  $("#toReview").addEventListener("click", () => {
    if (S.draft.text.trim() && !S.editingId) {
      if (window.confirm(t("unfinished"))) { if (!commitDraft()) return; }
    } else if (S.editingId) {
      if (!commitDraft()) return;
    }
    if (!S.taboos.length) { showTabooError([t("errNone")]); return; }
    go(3);
  });

  /* ---------------------------------------------------------- step 3: review & submit */
  const YEARS = { all_most: "yearsAll", about_half: "yearsHalf", less_half: "yearsLess", never: "yearsNever" };
  const SETTLE = { city: "setCity", town: "setTown", rural: "setRural", mixed: "setMixed" };
  const GENDER = { woman: "gWoman", man: "gMan", self: "gSelf", prefer_not: "preferNot" };

  function renderReview() {
    const p = S.profile, ng = t("notGiven");
    const rows = [
      ["rvCountry", countryDisplay()],
      ["rvYears", p.years_in_country ? t(YEARS[p.years_in_country]) : ""],
      ["rvEthnic", p.ethnic_prefer_not ? t("preferNot") : (p.ethnic_groups || []).join(", ")],
      ["rvLang", (p.languages || []).join(", ")],
      ["rvReligion", (p.religions || []).map(relLabel).join("; ") + (p.religion_detail ? " (" + p.religion_detail + ")" : "")],
      ["rvRaised", p.religion_raised ? relLabel(p.religion_raised) : ""],
      ["rvRegion", p.region],
      ["rvAge", p.age_band === "prefer_not" ? t("preferNot") : p.age_band],
      ["rvSettle", p.settlement ? t(SETTLE[p.settlement]) : ""],
      ["rvGender", p.gender ? t(GENDER[p.gender]) : ""]
    ];
    $("#reviewProfile").innerHTML = rows.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${esc(v || ng)}</dd></div>`).join("");
    $("#reviewList").innerHTML = S.taboos.map((x, i) => tabooSummaryHTML(x, i, { actions: false, full: true })).join("");
    $("#reviewCount").textContent = S.taboos.length;
    $("#feedback").value = S.feedback || "";
    $("#phase2Interest").checked = !!S.phase2;
    $("#submitError").hidden = true;
  }
  $("#feedback").addEventListener("input", (e) => { S.feedback = e.target.value; save(); });
  $("#phase2Interest").addEventListener("change", (e) => { S.phase2 = e.target.checked; save(); });

  function deviceType() {
    try { return window.matchMedia("(pointer:coarse)").matches ? "touch" : "desktop"; } catch (e) { return ""; }
  }
  function buildPayload() {
    const p = S.profile;
    const resolveLang = (x) => x.text_language === "__mixed" ? "code-switched" : x.text_language === "__other" ? (x.text_language_other || "other") : x.text_language;
    return {
      action: "submit",
      submission_id: uuid(),
      form_version: CFG.FORM_VERSION || "",
      user_id: S.uid,
      consent: S.consent,
      participant: {
        country: p.country === "__other" ? "Other" : p.country,
        country_other: p.country_other || "",
        // "Where do you live now?" was removed in p1-2026.11.25; keys kept empty so the record schema and CSV columns stay stable.
        residence: "",
        residence_other: "",
        years_in_country: p.years_in_country || "",
        ethnic_groups: p.ethnic_prefer_not ? [] : (p.ethnic_groups || []),
        ethnic_prefer_not: !!p.ethnic_prefer_not,
        languages: p.languages || [],
        first_language: (p.languages || [])[0] || "",
        religions: p.religions || [],
        religion_detail: p.religion_detail || "",
        religion_raised: p.religion_raised || "",
        region: p.region || "",
        age_band: p.age_band || "",
        settlement: p.settlement || "",
        gender: p.gender || "",
        phase2_interest: !!S.phase2
      },
      taboos: S.taboos.map((x) => ({
        taboo_id: x.id,
        text: x.text,
        text_language: resolveLang(x),
        translation_en: x.translation_en || "",
        themes: x.themes,
        primary_theme: x.themes[0] || "",
        theme_other: x.theme_other || "",
        suggested_themes: x.suggested_themes || [],
        themes_from_suggestion: x.themes_from_suggestion || [],
        scope: x.scope,
        belongs_to: x.belongs_to || "",
        strength: x.strength,
        applies_to: x.applies_to,
        observed_today: x.observed_today || "",
        personal_observance: x.personal_observance || "",
        consequence: x.consequence || "",
        context: x.context || "",
        learned_from: x.learned_from,
        time_spent_sec: x.time_spent_sec ?? null,
        edited: !!x.edited,
        created_at: x.created_at
      })),
      feedback: S.feedback || "",
      meta: {
        ui_lang: LANG,
        ref: S.ref || "",
        started_at: S.startedAt,
        submitted_at: nowISO(),
        duration_sec: Math.round((Date.now() - new Date(S.startedAt).getTime()) / 1000),
        device: deviceType(),
        browser_lang: navigator.language || "",
        previous_submissions: S.submittedCount || 0
      }
    };
  }

  async function send(payload) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      // text/plain avoids a CORS preflight, which Apps Script does not answer.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    const data = await res.json();
    if (!data || !data.ok) throw new Error((data && data.error) || "server_error");
    return data;
  }
  let flushing = false;
  async function flushOutbox() {
    if (!ENDPOINT || flushing) return true;
    flushing = true;
    let box = store.get(OUTBOX, []);
    for (const item of box.slice()) {
      try { await send(item); box = box.filter((x) => x.submission_id !== item.submission_id); store.set(OUTBOX, box); }
      catch (e) { break; }
    }
    flushing = false;
    renderOutboxBanner();
    return box.length === 0;
  }
  function renderOutboxBanner() {
    const n = store.get(OUTBOX, []).length;
    $("#outboxBanner").hidden = !(ENDPOINT && n);
    if (n) $("#outboxText").textContent = t("outboxPending", { n });
  }
  $("#retryOutbox").addEventListener("click", () => flushOutbox());
  window.addEventListener("online", () => flushOutbox());

  let lastPayloads = [];
  $("#submitAll").addEventListener("click", async () => {
    const btn = $("#submitAll");
    if (btn.disabled) return;
    if (!S.taboos.length) { go(2); return; }
    const n = S.taboos.length;
    const honeypot = $("#hp_website").value;
    const payload = buildPayload();
    btn.disabled = true; btn.textContent = t("submitting");
    let queued = false;
    if (honeypot) {
      // Silently drop bot submissions.
    } else if (!ENDPOINT) {
      const arch = store.get(ARCHIVE, []); arch.push(payload); store.set(ARCHIVE, arch);
    } else {
      const box = store.get(OUTBOX, []); box.push(payload); store.set(OUTBOX, box);
      const ok = await flushOutbox();
      queued = !ok;
    }
    lastPayloads = [payload];
    S.submittedCount = (S.submittedCount || 0) + n;
    S.taboos = []; S.draft = blankTaboo(); S.editingId = null; S.editBackup = null; S.feedback = "";
    S.startedAt = nowISO(); S.maxStep = 2;
    saveNow();
    btn.disabled = false; btn.textContent = t("submit");
    $("#doneText").textContent = t("doneText", { n });
    $("#doneText").dataset.n = n;
    $("#uidDone").textContent = S.uid;
    $("#doneQueued").hidden = !queued;
    $("#downloadBtn").hidden = !(queued || !ENDPOINT);
    go(4);
  });

  $("#addMore").addEventListener("click", () => go(2));
  $("#shareBtn").addEventListener("click", async () => {
    const url = location.origin + location.pathname + (S.ref ? "?ref=" + encodeURIComponent(S.ref) : "");
    const text = t("shareText");
    if (navigator.share) { try { await navigator.share({ title: "AfriTaboo", text, url }); return; } catch (e) { /* fall through */ } }
    if (await copyText(text + " " + url)) toast(t("linkCopied"));
  });
  $("#downloadBtn").addEventListener("click", () => {
    const all = [...store.get(ARCHIVE, []), ...store.get(OUTBOX, [])];
    const data = all.length ? all : lastPayloads;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "afritaboo-" + (S.uid || "submission") + ".json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  /* ---------------------------------------------------------- language switch */
  $$(".lang button").forEach((b) => b.addEventListener("click", () => {
    if (S.step === 1) collectProfile();
    LANG = b.dataset.lang; S.lang = LANG; saveNow(); applyI18n();
  }));
  function renderAllDynamic() {
    renderOutboxBanner();
    const pc = $("#publicCount"); if (pc.dataset.n) pc.textContent = t("publicCount", { n: Number(pc.dataset.n).toLocaleString() });
    const dt = $("#doneText"); if (dt.dataset.n) dt.textContent = t("doneText", { n: dt.dataset.n });
    if (S.step === 1) fillProfile();
    if (S.step === 2) { renderComposer(); renderList(); }
    if (S.step === 3) renderReview();
  }

  /* ---------------------------------------------------------- boot */
  $("#testBanner").hidden = !!ENDPOINT;
  window.addEventListener("beforeunload", saveNow);
  window.addEventListener("resize", debounce(() => { if (S.step === 2) renderJogger(); }, 200));
  initWelcome();
  fillProfile(); // populates country-dependent suggestion lists, even for returning participants
  applyI18n();
  // Resume where the person left off (but never past consent, and never on the "done" screen).
  const resume = S.consent ? Math.min(S.step || 0, 3) : 0;
  go(resume === 3 && !S.taboos.length ? 2 : resume, { noHistory: true });
  try { history.replaceState({ step: S.step }, "", location.search + "#" + ["welcome", "about-you", "taboos", "review", "done"][S.step]); } catch (e) { /* ignore */ }
  flushOutbox();
})();
