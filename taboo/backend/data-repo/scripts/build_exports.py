#!/usr/bin/env python3
"""Rebuild analysis-ready exports from submissions/<user_id>/<submission_id>.json.

Writes:
  exports/taboos.csv        one row per taboo, participant attributes attached
  exports/participants.csv  one row per participant (latest profile + counts)
  exports/submissions.csv   one row per submission (audit log, feedback)
  exports/SUMMARY.md        counts by country, ethnic group, religion, theme

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

    taboo_rows, seen = [], set()
    participants = {}
    sub_rows = []
    for r in records:
        p, m, uid = r.get("participant", {}), r.get("meta", {}), r.get("user_id", "")
        for t in r.get("taboos", []):
            if t.get("taboo_id") in seen:
                continue
            seen.add(t.get("taboo_id"))
            taboo_rows.append([t.get("taboo_id"), uid, r.get("submission_id"), r.get("received_at")]
                              + [j(t.get(k)) for k in T_FIELDS]
                              + [j(p.get(k)) for k in P_FIELDS]
                              + [m.get("ui_lang", ""), m.get("ref", ""), r.get("form_version", "")])
        prev = participants.get(uid, {"first_seen": r.get("received_at"), "n_sub": 0, "n_taboos": 0})
        participants[uid] = {**prev, "last_seen": r.get("received_at"), "n_sub": prev["n_sub"] + 1,
                             "n_taboos": prev["n_taboos"] + len(r.get("taboos", [])), "p": p, "ref": m.get("ref", "")}
        sub_rows.append([r.get("submission_id"), uid, r.get("received_at"), len(r.get("taboos", [])), r.get("feedback", ""),
                         m.get("duration_sec"), m.get("device"), m.get("ui_lang"), m.get("ref"), r.get("form_version")])

    write_csv(OUT / "taboos.csv",
              ["taboo_id", "user_id", "submission_id", "received_at"] + T_FIELDS + ["p_" + k for k in P_FIELDS]
              + ["ui_lang", "ref", "form_version"], taboo_rows)
    write_csv(OUT / "participants.csv",
              ["user_id", "first_seen", "last_seen", "n_submissions", "n_taboos"] + P_FIELDS + ["ref"],
              [[u, v["first_seen"], v["last_seen"], v["n_sub"], v["n_taboos"]] + [j(v["p"].get(k)) for k in P_FIELDS] + [v["ref"]]
               for u, v in participants.items()])
    write_csv(OUT / "submissions.csv",
              ["submission_id", "user_id", "received_at", "n_taboos", "feedback", "duration_sec", "device", "ui_lang", "ref", "form_version"],
              sub_rows)

    # Summary
    def country(p):
        return p.get("country_other") if p.get("country") == "Other" else p.get("country") or "?"
    by_country = Counter(country(v["p"]) for v in participants.values())
    taboos_by_country = Counter()
    themes = Counter()
    ethnic = Counter()
    religion = Counter()
    for r in records:
        for t in r.get("taboos", []):
            taboos_by_country[country(r.get("participant", {}))] += 1
            themes[t.get("primary_theme") or "?"] += 1
    for v in participants.values():
        for e in v["p"].get("ethnic_groups") or ["(not given)"]:
            ethnic[e] += 1
        for rel in v["p"].get("religions") or ["(not given)"]:
            religion[rel] += 1

    def table(title, counter, unit):
        lines = [f"### {title}", "", f"| | {unit} |", "|---|---:|"]
        lines += [f"| {k} | {n} |" for k, n in counter.most_common()]
        return "\n".join(lines) + "\n"

    raters_needed = 10
    summary = [
        "# AfriTaboo Phase 1: data summary", "",
        f"- **Participants:** {len(participants)}",
        f"- **Taboos:** {len(taboo_rows)}",
        f"- **Submissions:** {len(records)}",
        f"- **Countries:** {len(by_country)} (target: 10–15)",
        f"- **Last submission:** {records[-1]['received_at'] if records else '—'}", "",
        table("Participants by country", by_country, "participants"),
        table("Taboos by participant country", taboos_by_country, "taboos"),
        table("Primary theme", themes, "taboos"),
        table("Ethnic group (participants)", ethnic, "participants"),
        table("Religion (participants)", religion, "participants"),
        f"_Phase 2 planning: each taboo needs about {raters_needed} raters._", "",
    ]
    (OUT / "SUMMARY.md").write_text("\n".join(summary), encoding="utf-8")
    print(f"{len(records)} submissions, {len(participants)} participants, {len(taboo_rows)} taboos")


if __name__ == "__main__":
    main()
