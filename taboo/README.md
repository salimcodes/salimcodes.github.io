# AfriTaboo: Phase 1 (Elicitation) form

Live at `https://salimoyinlola.com/taboo/` once pushed. It's a static page with no build step. Responses are stored in a **private GitHub repository** (`salimcodes/AfriTabooBench`) through a small Google Apps Script relay.

```
participant's browser ──POST──▶ Apps Script (holds the GitHub token) ──commit──▶ private repo AfriTabooBench
                                                                                   └─ GitHub Action rebuilds exports/*.csv
```

The data repo is separate on purpose. This website repo is public, so anything committed here can be read by anyone and is served on salimoyinlola.com. Participants' ethnicity and religion must not end up here.

## Files

| File | Purpose |
|---|---|
| `index.html` | The form: definition and consent → about you → taboos → review → thank-you |
| `app.js` | Form logic (validation, autosave, smart suggestions, submission queue) |
| `data.js` | Countries, ethnic-group and language suggestions, themes, religions |
| `i18n.js` | All interface text in English and French |
| `i18n-ar.js` | All interface text in Arabic (the page switches to right-to-left) |
| `config.js` | **The only front-end file you need to edit**: backend URL, contact email, form version |
| `backend/Code.gs` | Apps Script relay: validates each submission and commits it to the private repo |
| `backend/data-repo/` | Starter files to copy into the private data repo (exports builder and workflow) |

## Setup (about 10 minutes)

### 1. Private data repo ✅ done

[`salimcodes/AfriTabooBench`](https://github.com/salimcodes/AfriTabooBench) is private and contains the contents of `backend/data-repo/`: the exports script, the "Build exports" workflow (first run succeeded), and an empty `submissions/` folder. If you change files in `backend/data-repo/`, copy them across to that repo again.

### 2. Create a GitHub token that can only write to that repo

GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**:
- *Repository access*: **Only select repositories** → `AfriTabooBench`
- *Permissions → Repository → Contents*: **Read and write**. Nothing else is needed.
- Set an expiry date that runs past the end of data collection.

Copy the token. You'll only see it once.

### 3. Deploy the relay (Google Apps Script)

1. Go to [script.google.com](https://script.google.com) → **New project**. Paste in everything from `backend/Code.gs` and save.
2. Open **Project Settings (⚙) → Script properties** and add:
   | Property | Value |
   |---|---|
   | `GITHUB_TOKEN` | the token from step 2 |
   | `GITHUB_REPO` | `salimcodes/AfriTabooBench` |
   | `GITHUB_BRANCH` | `main` (optional) |
   | `MIRROR_TO_SHEET` | `true` (optional, only if you create the script from inside a Google Sheet via *Extensions → Apps Script* and want a live copy there too) |
3. Back in the editor, select **`testGitHub`** in the function dropdown and click **Run**. Authorise it; Google will warn the app is unverified, so click *Advanced → Go to project*. The log should say `Repo OK … private=true · push=true`.
4. Click **Deploy → New deployment → Web app**, with *Execute as*: **Me** and *Who has access*: **Anyone**. Copy the URL that ends in `/exec`.

### 4. Connect the form

Paste the URL into `config.js` and push this repo:
```js
ENDPOINT: "https://script.google.com/macros/s/XXXX/exec",
```
Submit one test response and check that `submissions/AT-…/….json` appears in `AfriTabooBench`, then `exports/` about a minute later.

> If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version** to keep the same URL.

Until `ENDPOINT` is set, the page runs in **local test mode**: submissions stay in the browser and can be downloaded as JSON.

## What lands in the data repo

```
submissions/<participant-id>/<submission-id>.json   one file per submission, never overwritten
exports/taboos.csv          one row per taboo, with the participant's country, ethnic group, languages and religion attached
exports/participants.csv    one row per participant (latest profile, number of taboos)
exports/submissions.csv     audit log, feedback, time taken, recruiter code
exports/SUMMARY.md          live counts by country, theme, ethnic group, religion
```

- **Safe retries.** If a participant's connection drops, the form retries later. The file name is the submission ID, so a retry never creates a duplicate.
- **Withdrawal.** Delete `submissions/<their ID>/` and push. The exports rebuild without them.
- **The token is never exposed.** It lives only in Apps Script's Script Properties; the web page only knows the `/exec` URL.

## Recruitment links

- `?ref=CODE` tags every submission with a recruiter or channel code, e.g. `/taboo/?ref=ke-salim` or `/taboo/?ref=whatsapp-ug`. Use it to track which recruiter or country channel is working (the "agree roles and who recruits from which countries" open item).
- `?lang=fr` opens the form in French and `?lang=ar` in Arabic (right-to-left). Otherwise the page follows the browser language, and people can switch at any time.
- `?uid=AT-XXXX-XX` pre-fills a participant ID, for example to send someone their own link for Phase 2.

## What the form collects

**Participant (asked once and remembered on the device):** a participant ID (generated automatically, e.g. `AT-7K3M-Q9`, with a check character so typos are caught), the country they identify with culturally, how long they lived in that country (to spot diaspora), ethnic group(s) (several allowed, or "prefer not to say"), languages with their first language marked, religion(s) plus the religion they were raised in, and optionally region, age band, urban or rural upbringing, and gender.

**Each taboo:**

- Required: the text in their own words, the language they wrote it in (detected automatically for English, French and Arabic, otherwise chosen by them), theme(s), who holds the taboo (family, ethnic group, religion, local area, country, several countries…), and how serious breaking it is.
- Optional: an English translation, which group or community it belongs to, who must follow it, whether it is still observed, whether they follow it themselves, what happens if it's broken or why it exists, when it applies, and how they learned it.

**Metadata:** time spent per taboo, whether the entry was edited, recruiter code, UI language, device type, and the form version.

## Smart features and the research reasons for them

- **Memory joggers.** Each theme has a prompt question but no example taboo, so we don't prime specific answers. Themes the person hasn't covered yet are shown first.
- **Theme suggestions** come from keywords in the text (English, French and Arabic). Any theme accepted from a suggestion is logged in `themes_from_suggestion`, so you can check whether the suggestions influenced the labels.
- **Writing nudges:** a warning if the text contains a phone number or email, a hint when one entry seems to hold several taboos (each needs to be rated on its own in Phase 2), a near-duplicate warning against their earlier entries, and a prompt to state clearly what must *not* be done.
- **Group pre-fill.** "Belongs to" is filled from the profile but can be changed, so people can report taboos of neighbouring groups they know well. Together with *scope*, this feeds RQ2 (country vs ethnic group vs religion).
- **Autosave and offline safety.** Drafts are saved on the device. If a submission fails it is queued and retried automatically, and each submission has an ID so retries never create duplicate rows.
- **Returning participants** keep their ID and profile, so they go straight to adding more taboos.
- **Data hygiene:** a honeypot field against bots, and server-side length limits and protection against spreadsheet formula injection.

## Before launch

- [ ] Create the private `AfriTabooBench` repo, the token and the relay (above), then send a test submission.
- [ ] Pilot with 3–5 people (Week 1 in the proposal), then bump `FORM_VERSION` if you change any questions.
- [ ] Confirm the ethics requirements and add a contact email.
- [ ] Have native speakers review the French (`i18n.js`) and Arabic (`i18n-ar.js`, `THEMES_AR` in `data.js`) text.
- [ ] Delete the test submission folder(s) from `AfriTabooBench`.
