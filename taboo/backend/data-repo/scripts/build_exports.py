#!/usr/bin/env python3
"""Rebuild analysis-ready exports from submissions/<user_id>/<submission_id>.json.

Writes:
  exports/taboos.csv        one row per taboo, participant attributes attached
  exports/participants.csv  one row per participant (latest profile + counts)
  exports/submissions.csv   one row per submission (audit log, feedback)
  exports/SUMMARY.md        counts by country, ethnic group, religion, theme
Literature sources (literature/*.json) are merged into all exports and totals; every row has a
`source_type` column (participant / researcher-entry / literature) plus source_id, citation and page.

Standard library only. Run from the repo root:  python scripts/build_exports.py
"""
import csv
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUB = ROOT / "submissions"
OUT = ROOT / "exports"


def j(v):
    v = "; ".join(v) if isinstance(v, list) else ("" if v is None else v)
    # Stop spreadsheet apps from executing user text as a formula.
    if isinstance(v, str) and v[:1] in ("=", "+", "-", "@", "\t", "\r"):
        v = "'" + v
    return v


def load():
    records = []
    for f in sorted(SUB.glob("*/*.json")):
        try:
            records.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception as e:  # keep going; report the bad file
            print(f"skip {f}: {e}", file=sys.stderr)
    records.sort(key=lambda r: r.get("received_at", ""))
    return records


def write_csv(path, header, rows):
    # utf-8-sig so Excel opens accented and non-Latin text correctly
    with path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)


def main():
    OUT.mkdir(exist_ok=True)
    records = load()

    P_FIELDS = ["country", "country_other", "residence", "residence_other", "years_in_country", "ethnic_groups",
                "ethnic_prefer_not", "languages", "first_language", "religions", "religion_detail", "religion_raised",
                "region", "age_band", "settlement", "gender", "phase2_interest"]
    T_FIELDS = ["text", "text_language", "translation_en", "primary_theme", "themes", "theme_other", "scope",
                "belongs_to", "strength", "applies_to", "observed_today", "personal_observance", "consequence",
                "context", "learned_from", "suggested_themes", "themes_from_suggestion", "time_spent_sec", "edited",
                "created_at"]

    # Every row carries its provenance so the sources can always be filtered apart:
    #   participant       filled in on the form by the participant
    #   researcher-entry  typed in by the research team for a consenting participant (meta.ref)
    #   literature        taken from a published source (literature/<source>.json), with citation and page
    SRC_COLS = ["source_type", "source_id", "citation", "page"]

    def source_type(r):
        return "researcher-entry" if (r.get("meta") or {}).get("ref") == "researcher-entry" else "participant"

    # Literature sources are loaded as pseudo-contributors: source_id acts as user_id and submission_id.
    LIT = ROOT / "literature"
    lit_sources = []
    for f in sorted(LIT.glob("*.json")) if LIT.exists() else []:
        try:
            lit_sources.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception as e:
            print(f"skip {f}: {e}", file=sys.stderr)

    def lit_profile(s):
        return {"country": s.get("country", ""), "ethnic_groups": [s["culture"]] if s.get("culture") else [],
                "languages": [s["language"]] if s.get("language") else [], "first_language": s.get("language", "")}

    taboo_rows, seen = [], set()
    participants = {}
    sub_rows = []
    for r in records:
        p, m, uid, st = r.get("participant", {}), r.get("meta", {}), r.get("user_id", ""), source_type(r)
        for t in r.get("taboos", []):
            if t.get("taboo_id") in seen:
                continue
            seen.add(t.get("taboo_id"))
            taboo_rows.append([t.get("taboo_id"), uid, r.get("submission_id"), r.get("received_at")]
                              + [j(t.get(k)) for k in T_FIELDS]
                              + [j(p.get(k)) for k in P_FIELDS]
                              + [m.get("ui_lang", ""), m.get("ref", ""), r.get("form_version", "")]
                              + [st, "", "", ""])
        prev = participants.get(uid, {"first_seen": r.get("received_at"), "n_sub": 0, "n_taboos": 0})
        participants[uid] = {**prev, "last_seen": r.get("received_at"), "n_sub": prev["n_sub"] + 1,
                             "n_taboos": prev["n_taboos"] + len(r.get("taboos", [])), "p": p, "ref": m.get("ref", ""),
                             "source_type": st, "citation": ""}
        sub_rows.append([r.get("submission_id"), uid, r.get("received_at"), len(r.get("taboos", [])), r.get("feedback", ""),
                         m.get("duration_sec"), m.get("device"), m.get("ui_lang"), m.get("ref"), r.get("form_version"), st])

    lit_count = 0
    for s in lit_sources:
        sid, cite, added, p = s.get("source_id", ""), s.get("citation", ""), s.get("added_at", ""), lit_profile(s)
        for t in s.get("taboos", []):
            if t.get("taboo_id") in seen:
                continue
            seen.add(t.get("taboo_id"))
            lit_count += 1
            row_t = {**t, "context": t.get("article_section", ""), "created_at": added}
            taboo_rows.append([t.get("taboo_id"), sid, sid, added]
                              + [j(row_t.get(k)) for k in T_FIELDS]
                              + [j(p.get(k)) for k in P_FIELDS]
                              + ["", "literature", ""]
                              + ["literature", sid, j(cite), t.get("page", "")])
        participants[sid] = {"first_seen": added, "last_seen": added, "n_sub": 1, "n_taboos": len(s.get("taboos", [])),
                             "p": p, "ref": "literature", "source_type": "literature", "citation": cite}
        sub_rows.append([sid, sid, added, len(s.get("taboos", [])), s.get("entry_note", ""), None, "", "", "literature", "", "literature"])

    write_csv(OUT / "taboos.csv",
              ["taboo_id", "user_id", "submission_id", "received_at"] + T_FIELDS + ["p_" + k for k in P_FIELDS]
              + ["ui_lang", "ref", "form_version"] + SRC_COLS, taboo_rows)
    write_csv(OUT / "participants.csv",
              ["user_id", "first_seen", "last_seen", "n_submissions", "n_taboos"] + P_FIELDS + ["ref", "source_type", "citation"],
              [[u, v["first_seen"], v["last_seen"], v["n_sub"], v["n_taboos"]] + [j(v["p"].get(k)) for k in P_FIELDS]
               + [v["ref"], v["source_type"], j(v["citation"])] for u, v in participants.items()])
    write_csv(OUT / "submissions.csv",
              ["submission_id", "user_id", "received_at", "n_taboos", "feedback", "duration_sec", "device", "ui_lang", "ref",
               "form_version", "source_type"], sub_rows)

    # Summary (all sources together, with the split by source shown first)
    def country(p):
        return p.get("country_other") if p.get("country") == "Other" else p.get("country") or "?"
    people = {u: v for u, v in participants.items() if v["source_type"] != "literature"}
    by_country = Counter(country(v["p"]) for v in participants.values())
    taboos_by_country, themes, ethnic, religion = Counter(), Counter(), Counter(), Counter()
    by_source = Counter(row[-4] for row in taboo_rows)
    for row in taboo_rows:
        pc = {"country": row[4 + len(T_FIELDS)], "country_other": row[5 + len(T_FIELDS)]}
        taboos_by_country[country(pc)] += 1
        themes[row[4 + T_FIELDS.index("primary_theme")] or "?"] += 1
    for v in participants.values():
        for e in v["p"].get("ethnic_groups") or ["(not given)"]:
            ethnic[e] += 1
    for v in people.values():
        for rel in v["p"].get("religions") or ["(not given)"]:
            religion[rel] += 1

    def table(title, counter, unit):
        lines = [f"### {title}", "", f"| | {unit} |", "|---|---:|"]
        lines += [f"| {k} | {n} |" for k, n in counter.most_common()]
        return "\n".join(lines) + "\n"

    raters_needed = 10
    lit_lines = ["## Literature sources", "",
                 "Included in the totals and in `taboos.csv` with `source_type = literature` (filter on that column to exclude them). "
                 "Each counts as one contributor under its source ID.", ""]
    lit_lines += [f"- **{s.get('source_id')}** ({s.get('culture')}, {s.get('country')}): {len(s.get('taboos', []))} taboos. {s.get('citation')}"
                  for s in lit_sources] or ["- none yet"]
    summary = [
        "# AfriTaboo Phase 1: data summary", "",
        f"- **Contributors:** {len(participants)} ({len(people)} participants + {len(lit_sources)} literature source(s))",
        f"- **Taboos:** {len(taboo_rows)} (participant: {by_source['participant']} · researcher-entry: {by_source['researcher-entry']}"
        f" · literature: {by_source['literature']})",
        f"- **Submissions:** {len(records)} (+ {len(lit_sources)} literature source(s))",
        f"- **Countries:** {len(by_country)} (target: 10–15)",
        f"- **Last submission:** {records[-1]['received_at'] if records else '—'}", "",
        table("Contributors by country", by_country, "contributors"),
        table("Taboos by country", taboos_by_country, "taboos"),
        table("Primary theme", themes, "taboos"),
        table("Ethnic group (contributors)", ethnic, "contributors"),
        table("Religion (participants)", religion, "participants"),
        f"_Phase 2 planning: each taboo needs about {raters_needed} raters._", "",
        *lit_lines, "",
    ]
    (OUT / "SUMMARY.md").write_text("\n".join(summary), encoding="utf-8")
    old = OUT / "literature_taboos.csv"
    if old.exists():
        old.unlink()  # superseded: literature rows now live in taboos.csv
    print(f"{len(records)} submissions, {len(people)} participants + {len(lit_sources)} literature, {len(taboo_rows)} taboos ({lit_count} literature)")


if __name__ == "__main__":
    main()
