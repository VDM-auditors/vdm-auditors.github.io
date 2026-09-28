# questionnaire — CLAUDE.md

Client intake form for VDM Audit, deployed on GitHub Pages at
`https://vdm-auditors.github.io/questionnaire/`. It is the **only** link clerks send out:
it covers both existing clients and new entities that still have to be registered.

---

## Two modes (`mode.js`)

The first screen (`#step0`) asks one question, and `VDMMode.isNew()` drives every
difference from there on. On 28 Sep 2026 this replaced the separate
`new-entity-registration/` form and the `trust-deed-questionnaire/` redirect.

| Area | New / Existing Client (`existing`) | Register a New Entity (`new`) |
|------|------------------------------------|-------------------------------|
| Steps | 6 — Mandate is step 5 | 5 — step 5 is skipped (`goStep(5)` jumps to 6) |
| Step 2 numbers | Registration / Tax / VAT / UIF / PAYE | **none** — they do not exist yet |
| Entity name | one field | up to **four proposed names in priority order** |
| Trust, step 3 | plain fields in `index.html` | `trust.js` — deed fields, blocking check |
| PDF | owner-password locked, fillable mandate page | **flat**, no encryption, no AcroForm fields |
| PDF title / file | `New / Current Client Questionnaire`, `VDM_Questionnaire_…` | `New Entity Registration Questionnaire`, `VDM_Entity_Registration_…` |
| Extra download | — | a new trust also gets `VDM_Trust_Deed_Data_<name>.json` |
| SARS POA / public officer docx | real reference numbers | blank; registration number reads "To be allocated" |

- **Markup** that belongs to one mode carries `existing-only` or `new-only`; the
  `mode-new` body class hides the other. Prefer that over JS show/hide.
- **Logic** branches on `VDMMode.isNew()`. Mode-dependent wording (header, PDF title,
  mail subject, file prefix) lives in the `TEXT` table in `mode.js`.
- **Changing mode** ("Change" on step 1) keeps what was typed but resets
  `maxStepReached`, because steps 3–6 are built differently per mode.
- **Direct links** skip the question: `?mode=new`, `?mode=existing`, and
  `?type=<entity>` preselects a card (e.g. `?mode=new&type=trust`).

---

## Architecture Map

### Directory tree

```
questionnaire/
├── index.html      # Wizard application: HTML + CSS + JS
├── mode.js         # Step 0 — existing client vs new entity; ?mode= / ?type= links
├── address-autocomplete.js  # HERE lookup (Photon fallback) on every address field
├── attachments.js  # Step 4 — file uploads, phone (QR/WebRTC) capture, PDF embedding
├── mandate.js      # Step 5 — CIPC beneficial ownership mandate: fields, live preview, signature
├── mandate-pdf.js  # Step 5 — draws the mandate page into the jsPDF document
├── trust.js        # New trusts only — step-3 fields + check, PDF section, trust-deed JSON
├── upload.html     # Phone-side capture page opened by scanning the QR code
├── logo.png        # VDM Audit logo used in form header and generated PDF
└── README.md       # User-facing documentation
```

### What index.html contains

| Layer | Description |
|-------|-------------|
| `<style>` | All CSS — responsive layout, mode chooser, wizard, attachment slots, signature pad, print styles |
| `<body>` | Mode chooser (step 0), wizard steps 1–6, attachment containers, signature canvas per signatory, submit / send section |
| `<script>` | All JS — wizard navigation, PDF generation (jsPDF), docx generation, mailto dispatch |

### Wizard flow

| Step | Content |
|------|---------|
| 0 — Choice | New / Existing Client or Register a New Entity (`mode.js`) |
| 1 — Entity Type | Organisation type selector, contact details, services required |
| 2 — Entity Info | Date, entity name (ranked proposed names for a new entity), registration/tax numbers (existing only), addresses, responsible persons |
| 3 — Details | Entity-specific people (directors, trustees, members, etc.) |
| 4 — Attachments | One ID-document slot per person + free-form additional attachments (`attachments.js`) |
| 5 — Mandate | **Existing clients only.** CIPC beneficial ownership resolution — live A4 preview, place/date, signatory, signature (`mandate.js`) |
| 6 — Sign & Submit | Signature capture (canvas) per person, declaration, send |

### Proposed names in priority order (step 2, new entities)

A name reservation carries up to four candidate names, considered strictly in order — the
first available one is reserved. Step 2 captures them as a ranked list: `ei_name`,
`ei_name_2`, `ei_name_3`, `ei_name_4`, listed in `NAME_CHOICE_IDS`. Up/down arrows on each
row call `moveNameChoice(i, delta)`, which **swaps the input values** rather than moving
DOM nodes, so the ids stay bound to their rank.

`ei_name` is index 0 and is therefore always the first choice — and it is the one name
field an existing client sees. The PDF title, mail subject, download file name and both
Word documents read `ei_name` directly.

The ranked list only appears in new mode for **company, CC, NPO and trust** — the types
that reserve a name — via the `names-reserve` body class set in `updateEntityInfoLabels()`.
Everyone else sees row 1 alone as an ordinary name field. `individual` uses `ei_name` for a
person's name, so the row-1 field can never be hidden or renamed away.

### New trusts (`trust.js`)

Only when `VDMMode.isNew()`. An **existing** trust keeps the plain donor / independent
trustee / trustee / beneficiary fields built inline in `buildPeopleStep()` — it already has
a deed, so none of the deed questions apply.

- **Step 3** (`buildStep`) — donor/founder (the deed's *settlor*, asked as first names +
  surname, with a hidden `donor_1_fullname` composed from them so attachments, signing and
  the Word documents still read one name), nationality, "donor is also a trustee", the
  independent trustee, trustees, beneficiaries (type, date of birth, minor + guardian), the
  intestate-heirs person (deed clause 18.1), and the town / duration of the trust.
- **The step-3 check** (`check`, via `leaveDetailsStep()`) blocks on the answers the deed and
  Master's forms cannot do without, and only *warns* on a failed SA ID checksum — a foreign
  trustee's passport number is a legitimate answer.
- **Output** — the PDF section (`renderPdf`) plus a second download,
  `VDM_Trust_Deed_Data_<name>.json` (`snapshot`). That file is the shape
  `trust-doc-generator/js/menu/loader.js` reads, keyed by the ids in
  `trust-doc-generator/5. Deed/Trust-Deed/js/templates/schema.js`. Mapping: trustee 1/2 →
  `first_`/`second_trustee_*`, trustees 3+ → `additional_trustees`, the independent trustee
  block → `independent_trustee_*` directly (so `independent_trustee` is always `null`),
  beneficiary 1/2 → `husband_`/`wife_beneficiary_*`, beneficiaries 3+ →
  `rows.additional_beneficiaries`. The client emails the JSON with the PDF.

### Mandate (step 5, existing clients only)

`mandate.js` owns the step. It reuses the entity details from step 2 and the people from
step 3 — nothing is re-typed — and renders a live A4 preview of the resolution that
updates on every keystroke. The client picks the town, the day / month / year (prefilled
with today, all three editable), the signing director, and signs on a canvas.

Two things on the resolution are **constant and must not become inputs**: the Agent
(Leon van der Merwe, ID 680813 5004 08 3, `cipro@vdmaudit.co.za`, CIPC code HLVDM3) and
the right-hand witness block (HIRSCHBERG, RINA — ID 541130 0131 08 7 — WITNESS).

Ticked by default for **company / CC / NPO** — the types that actually file beneficial
ownership with the CIPC. Trust, school and body corporate can opt in, but note the
boilerplate still reads "board of directors". Never shown for `individual`: a board
resolution has no meaning there.

On submit the mandate is drawn by `mandate-pdf.js` as one page of the questionnaire PDF,
placed after the signing blocks and before the attachment pages. `VDMMandate.validate()`
blocks submission if the mandate is included but unsigned or incomplete.

#### Editable fields and document protection

The mandate page is the **only** editable part of the PDF — it carries 14 AcroForm text
fields (`mandate_company`, `mandate_registration`, `mandate_telephone`, `mandate_address`,
`mandate_place`, `mandate_day`, `mandate_month`, `mandate_year`, and `_name` / `_id` /
`_capacity` for both `mandate_signatory` and `mandate_witness`). Every other page is flat.
The witness block is editable too, so VDM can send the mandate out under someone other than
the standing witness.

Fields are positioned by baseline, not by box: `field()` in `mandate-pdf.js` converts the y
a `doc.text()` call would have used into a box top, using a measured fit of how jsPDF
centres text in a widget. Changing that fit shifts every value on the page — re-measure
against static text before touching it. The address is multiline and its line breaks are
computed with `splitTextToSize` and baked into the value, because a reader wraps a
multiline field on its own metrics and overruns the margin.

The whole PDF is created with `encryption: { ownerPassword: MANDATE_OWNER_PASSWORD,
userPermissions: ['print', 'annot-forms'] }`. It **opens with no password**; the password
is only needed to alter the document. `annot-forms` is what keeps the fields fillable and
lets a witness drop in a Fill & Sign signature.

This protection is a guardrail against accidental edits, **not security**. The password is
plainly visible in `index.html`, and jsPDF's handler is 40-bit RC4, which any commodity tool
strips in seconds. Never describe it to a client as securing the document.

### Attachments (step 4)

`attachments.js` owns the whole step. It builds one upload slot per person derived from
`state.entityType` / `state.counts` (the same list the details step uses), plus an
**Additional Attachments** slot that takes any number of files.

Three ways to add a file:

| Route | How |
|-------|-----|
| Upload / drag-drop | `<input type="file">` or drop onto the slot — images and PDFs |
| Take Photo | On touch devices, `capture="environment"` opens the camera directly |
| Scan with Phone | Desktop shows a QR code, phone opens `upload.html`, file streams over a **WebRTC data channel** (PeerJS) straight into the desktop page |

Nothing is uploaded to a VDM server: images are downscaled to 1800 px JPEG in the
browser and held in memory only. On submit, `VDMAttach.appendToPdf(doc, ...)` adds one
page per image; PDF attachments are rasterised page-by-page with pdf.js (rendered with
`intent: 'print'` so generation does not stall in a background tab).

### Supported entity types

| Type | People |
|------|--------|
| Company (Pty) | Directors, shareholders |
| CC | Members |
| NPO | Directors |
| Individual | Single person |
| Trust | Donor, independent trustee, trustees, beneficiaries |
| School | SGB members |
| Body Corporate | Trustees |

### Data flow

```
User picks a mode, completes the wizard (DOM inputs + attachments + mandate if existing + canvas signatures)
  ↓
JS collects all values into a data object
  ↓
jsPDF (CDN) generates A4 PDF entirely in browser
  (includes logo banner, entity badge, all form fields, signatures,
   the mandate page, and one appended page per attachment)
  ↓
User selects recipient from staff email dropdown
  ↓
mailto: link opens email client with PDF attached
  ↓
User confirms and sends manually
  (NO auto-send, NO server-side send)
```

### External CDNs / fonts

| Asset | URL |
|-------|-----|
| jsPDF 2.5.1 | `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js` |
| PeerJS 1.5.4 (phone link, lazy-loaded) | `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js` |
| qrcodejs 1.0.0 (lazy-loaded) | `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` |
| pdf.js 3.11.174 (lazy-loaded) | `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` |
| docx 8.5.0 | `https://unpkg.com/docx@8.5.0/build/index.umd.js` |
| Google Fonts (DM Sans, DM Serif Display) | `https://fonts.googleapis.com` |
| HERE Autosuggest (address autocomplete) | `https://autosuggest.search.hereapi.com/v1/autosuggest` — needs a referrer-restricted key |
| Photon geocoder (autocomplete fallback) | `https://photon.komoot.io/api/` — no API key |

### Staff email recipients (dropdown in Step 4)

Emails are listed in the `<select>` in the form — all `@vdmaudit.co.za` addresses. They are not secrets (displayed to user). Do not move them to a config file or backend.

---

## Dev Commands

```bash
# Preview locally
python -m http.server 8777   # then open http://127.0.0.1:8777/questionnaire/ (file:// will not load the .js modules)

# Deploy
git add questionnaire/index.html
git commit -m "your message"
git push origin main

# Test PDF generation
# 1. Open index.html in browser
# 2. Pick a mode, complete every step (use test/dummy data only)
# 3. Capture a signature on the canvas
# 4. Select a recipient, click generate — verify PDF looks correct
# 5. Do NOT send to real recipients during testing
```

| Task | Steps |
|------|-------|
| Local preview | Open `questionnaire/index.html` in browser |
| Test full flow | Run both modes (and a new trust). Existing: complete all 6 steps → attach a file → sign the mandate → capture signature → verify PDF |
| Test phone capture | Open step 4 → Scan with Phone. From `file://` or `localhost` the QR points at the **deployed** `upload.html` (a phone cannot reach your machine), so `upload.html` must already be pushed for the scan to work. |
| Deploy | `git push origin main` |
| Add/remove staff email | Edit the `<select>` options in Step 4 of `index.html` |

---

## Prohibitions

- NEVER embed secrets, API keys, or passwords in client-side JS. The one deliberate exception is
  `MANDATE_OWNER_PASSWORD` — a PDF permissions password that has to be applied in the browser and
  guards nothing but the document's own wording. Do not treat it as a precedent for real credentials
- NEVER auto-send email without explicit user confirmation — the mailto: pattern is intentional; user must send manually from their email client
- NEVER run destructive git commands without explicit user request
- NEVER create new files in the repo root
- NEVER allow `index.html` to exceed 500 lines without splitting CSS/JS into separate files
- NEVER commit any filled-in test forms, PDFs, or attachment images containing real client personal information
- NEVER route attachments through a server or third-party store — the phone-to-desktop link is peer-to-peer by design (POPIA)
- NEVER replace the mailto: send pattern with a server-side send without a full security review
- NEVER remove the staff email dropdown validation — recipient must be selected before send is enabled
- NEVER put a link on the header logo — this page is sent to clients and must not lead them into the internal VDM menu
- NEVER turn the mandate's Agent or witness details into wizard inputs — they are fixed VDM identities
  (they are editable in the generated PDF, which is a separate thing)
- NEVER add form fields to any page of the PDF other than the mandate page, and never add
  them or encryption to a new-entity PDF — it has no mandate and is meant to be flat
- NEVER show registration, tax, VAT, PAYE or UIF fields in new-entity mode — the entity has none
- NEVER add or rename a key in `VDMTrust.snapshot()` without the same id existing in the deed
  schema in `trust-doc-generator` — the workspace reports unknown ids and drops them
- NEVER split this back into separate forms per client type — clerks must have one link

---

## Address autocomplete (`address-autocomplete.js`)

Every address field — `ei_physical`, `ei_registered`, `ei_postal`, `ei_postal_reg`
and each person's `_postal` / `_residential` — gets a suggestion dropdown backed by
the **HERE Autosuggest** geocoder, with Photon (OpenStreetMap) as a fallback. Picking
a suggestion fills in the suburb, city and **postal code** the user would otherwise
have to remember.

- **Needs a HERE API key.** Set `window.HERE_CONFIG = { apiKey: '...' }` *before* the
  script tag (it is already stubbed in `index.html`). The key ships in client-side JS
  because this is a static site, so restrict it in the HERE console to the Geocoding &
  Search API and to the referrer `https://vdm-auditors.github.io/*`.
- **Photon is the fallback.** With no key, or if HERE returns an error / runs out of
  quota, it drops to the keyless `photon.komoot.io` instance so the form keeps working
  — just with OSM's thinner ZA house-number coverage.
- **Why not OSM:** Photon searches OpenStreetMap, whose ZA house numbers are patchy
  outside a few metro suburbs. HERE carries a commercial ZA address set and flags
  surveyed positions — `resultType: houseNumber` with `houseNumberType: PA` — which
  the dropdown badges as **Verified** and ranks first.
- **Geolocation bias.** On first focus of an address field the browser asks for the
  user's position and passes it as HERE's `at=` anchor, so "Main" resolves to the Main
  Road in their town. Denied or unavailable falls back to a country centroid.
- **Field binding is by id suffix**, through one delegated `input` listener on
  `document`. Dynamically rendered person blocks are picked up automatically; do not
  add per-field wiring. Opt a field out with `data-no-autocomplete="true"`.
- **South Africa first:** the first query is filtered to `in=countryCode:ZAF`, falling
  back to an unfiltered search only when that returns nothing (foreign directors).
- **Result is one comma-separated line**, never multi-line: the mandate page reads
  only the first line of the residential address, so a wrapped address would silently
  drop the suburb and postal code there.
- OSM administrative names are cleaned before insertion — `Johannesburg Ward 124`
  is dropped, `Emfuleni Local Municipality` becomes `Emfuleni`.
- A failed request closes the dropdown silently; typing by hand always works.
