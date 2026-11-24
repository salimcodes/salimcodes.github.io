# AfriTaboo: Phase 1 (Elicitation) form

Live at `https://salimoyinlola.com/taboo/` once pushed. It's a static page (no build step), and responses go to a Google Sheet through a small Google Apps Script.

## Files

| File | Purpose |
|---|---|
| `index.html` | The form: consent → about you → taboos → review → thank-you |
| `app.js` | Form logic (validation, autosave, smart suggestions, submission queue) |
| `data.js` | Countries, ethnic-group and language suggestions, themes, religions |
| `i18n.js` | All interface text in English and French |
| `config.js` | **The only file you need to edit**: backend URL, contact email, form version |
| `backend/Code.gs` | Google Apps Script that writes responses into a Google Sheet |

## Connect it to Google Sheets (about 5 minutes)

1. Create a new Google Sheet, for example "AfriTaboo Phase 1 responses".
2. In the Sheet, go to **Extensions → Apps Script**. Delete the placeholder code, paste in everything from `backend/Code.gs`, and save.
3. Click **Deploy → New deployment**, choose the type **Web app**, and set:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
4. Authorise when prompted. Google will warn that the app is unverified; this is expected for your own script, so click *Advanced → Go to project*.
5. Copy the **Web app URL** (it ends in `/exec`) and paste it into `config.js`:
   ```js
   ENDPOINT: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. Optionally set `CONTACT_EMAIL` in `config.js` for withdrawal requests, then commit and push.

The Sheet gets three tabs on the first submission:

- **taboos**: one row per taboo (long format), with the participant's country, ethnic group, languages and religion copied onto each row so you can filter and pivot directly.
- **participants**: one row per participant ID, updated if they come back and add more.
- **submissions**: an audit log with optional feedback and time taken.

To analyse the data, use *File → Download → CSV* on the `taboos` tab.

> If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version**. This keeps the same URL. Creating a *new deployment* instead gives you a new URL.

Until `ENDPOINT` is set, the page runs in **local test mode**: a banner says so, submissions stay in the browser, and the thank-you screen offers a JSON download.

## Recruitment links

- `?ref=CODE` tags every submission with a recruiter or channel code, e.g. `/taboo/?ref=ke-salim` or `/taboo/?ref=whatsapp-ug`. Use it to track which recruiter or country channel is working (the "agree roles and who recruits from which countries" open item).
- `?lang=fr` opens the form in French. Otherwise the page follows the browser language, and people can switch at any time.
- `?uid=AT-XXXX-XX` pre-fills a participant ID, for example to send someone their own link for Phase 2.

## What the form collects

**Participant (asked once and remembered on the device):** a participant ID (generated automatically, e.g. `AT-7K3M-Q9`, with a check character so typos are caught), the country they identify with culturally, where they live now, how long they lived in that country (to spot diaspora), ethnic group(s) (several allowed, or "prefer not to say"), languages with their first language marked, religion(s) plus the religion they were raised in, and optionally region, age band, urban or rural upbringing, and gender.

**Each taboo:**

- Required: the text in their own words, the language they wrote it in (detected automatically for English and French, otherwise chosen by them), theme(s), who holds the taboo (family, ethnic group, religion, local area, country, several countries…), and how serious breaking it is.
- Optional: an English translation, which group or community it belongs to, who must follow it, whether it is still observed, whether they follow it themselves, what happens if it's broken or why it exists, when it applies, and how they learned it.

**Metadata:** time spent per taboo, whether the entry was edited, recruiter code, UI language, device type, and the form version.

## Smart features and the research reasons for them

- **Memory joggers.** Each theme has a prompt question but no example taboo, so we don't prime specific answers. Themes the person hasn't covered yet are shown first.
- **Theme suggestions** come from keywords in the text (English and French). Any theme accepted from a suggestion is logged in `themes_from_suggestion`, so you can check whether the suggestions influenced the labels.
- **Writing nudges:** a warning if the text contains a phone number or email, a hint when one entry seems to hold several taboos (each needs to be rated on its own in Phase 2), a near-duplicate warning against their earlier entries, and a prompt to state clearly what must *not* be done.
- **Group pre-fill.** "Belongs to" is filled from the profile but can be changed, so people can report taboos of neighbouring groups they know well. Together with *scope*, this feeds RQ2 (country vs ethnic group vs religion).
- **Autosave and offline safety.** Drafts are saved on the device. If a submission fails it is queued and retried automatically, and each submission has an ID so retries never create duplicate rows.
- **Returning participants** keep their ID and profile, so they go straight to adding more taboos.
- **Data hygiene:** a honeypot field against bots, and server-side length limits and protection against spreadsheet formula injection.

## Before launch

- [ ] Paste the Apps Script URL into `config.js` and send a test submission.
- [ ] Pilot with 3–5 people (Week 1 in the proposal), then bump `FORM_VERSION` if you change any questions.
- [ ] Confirm the ethics requirements and add a contact email.
- [ ] Delete the test rows from the Sheet.
