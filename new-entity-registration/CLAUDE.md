# new-entity-registration — CLAUDE.md

Registration intake form for entities that **do not exist yet**. Cloned from
[`questionnaire/`](../questionnaire/CLAUDE.md) and kept deliberately identical in style,
layout and code structure. Deployed on GitHub Pages at
`https://vdm-auditors.github.io/new-entity-registration/`.

---

## Relationship to `questionnaire/`

`questionnaire/` onboards entities that are **already registered** — they arrive with a
registration number, tax reference and trading history. This form covers the step before
that: registering the entity in the first place.

The two are **independent copies, not a shared codebase**. A fix in one does not reach the
other. When changing shared behaviour (wizard nav, attachments, PDF layout, styling),
check whether the same change belongs in `questionnaire/` and apply it there too.

### What differs from `questionnaire/`

| Area | `questionnaire/` | here |
|------|------------------|------|
| Steps | 6 (Mandate is step 5) | **5** — no mandate step |
| Registration / Tax / VAT / UIF / PAYE fields | present in step 2 | **removed** — they do not exist yet |
| Entity name | "Entity Name" | "**Proposed** Entity Name" / "Proposed Trust Name" |
| PDF encryption | owner-password locked, mandate page fillable | **none** — the PDF is flat, no AcroForm fields |
| Files | `mandate.js`, `mandate-pdf.js` | not present |
| PDF filename | `VDM_Questionnaire_…` | `VDM_Entity_Registration_…` |
| SARS POA docx | fills real tax reference numbers | reference numbers left blank, registration number reads "To be allocated" |

Everything else — the seven entity types, the people/details step, attachments with
QR phone capture, signature capture, consent, the mailto send pattern — is unchanged.

---

## Architecture Map

```
new-entity-registration/
├── index.html      # Wizard application: HTML + CSS + JS
├── attachments.js  # Step 4 — file uploads, phone (QR/WebRTC) capture, PDF embedding
├── upload.html     # Phone-side capture page opened by scanning the QR code
├── logo.png        # VDM Audit logo used in form header and generated PDF
└── README.md       # User-facing documentation
```

### 5-step wizard flow

| Step | Content |
|------|---------|
| 1 — Entity Type | Organisation type selector, contact details, services required |
| 2 — Entity Info | Date, proposed entity name, addresses, responsible persons |
| 3 — Details | Entity-specific people (directors, trustees, members, etc.) |
| 4 — Attachments | One ID-document slot per person + free-form additional attachments (`attachments.js`) |
| 5 — Sign & Submit | Signature capture (canvas) per person, declaration, send |

### Attachments (step 4)

Identical to `questionnaire/`: three routes in (upload/drag-drop, camera on touch devices,
QR + WebRTC from a phone), nothing touches a VDM server, images downscaled to 1800 px JPEG
in the browser and appended one page each to the PDF.

`LIVE_UPLOAD_URL` in `attachments.js` points at
`https://vdm-auditors.github.io/new-entity-registration/upload.html` — the copy in **this**
folder. If the folder is ever renamed, that constant must move with it or the QR scan will
open the wrong form's capture page.

### Data flow

```
User completes 5-step wizard (DOM inputs + attachments + canvas signatures)
  ↓
JS collects all values into a data object
  ↓
jsPDF (CDN) generates a flat A4 PDF entirely in browser
  (logo banner, entity badge, all form fields, signatures,
   and one appended page per attachment)
  ↓
User selects recipient from staff email dropdown
  ↓
mailto: link opens email client with PDF attached
  ↓
User confirms and sends manually  (NO auto-send, NO server-side send)
```

### External CDNs / fonts

Same set as `questionnaire/`: jsPDF 2.5.1, docx 8.5.0, PeerJS 1.5.4 (lazy),
qrcodejs 1.0.0 (lazy), pdf.js 3.11.174 (lazy), Google Fonts (DM Sans, DM Serif Display).

---

## Dev Commands

```bash
# Preview — must be served over http, not opened as file://,
# or attachments.js will not load
python -m http.server 8777
# then open http://127.0.0.1:8777/new-entity-registration/
```

| Task | How |
|------|-----|
| Local preview | Serve the repo over http and open this folder (see above) |
| Test full flow | Complete all 5 steps → attach a file → capture a signature → verify PDF |
| Test phone capture | Step 4 → Scan with Phone. From localhost the QR points at the **deployed** `upload.html`, so it must already be pushed for the scan to work |
| Deploy | `git push origin main` |
| Add/remove staff email | Edit the `<select>` options in the send section of `index.html` |

---

## Prohibitions

- NEVER re-add registration, tax, VAT, PAYE or UIF number fields — the entity being
  registered has none, which is the entire reason this form exists
- NEVER add AcroForm fields or PDF encryption here — the mandate page was the only thing
  that needed them, and it is gone. A flat PDF is the intended output
- NEVER embed secrets, API keys or passwords in client-side JS
- NEVER auto-send email without explicit user confirmation — the mailto: pattern is
  intentional; the user must send manually from their email client
- NEVER allow `index.html` to exceed 500 lines without splitting CSS/JS into separate files
- NEVER commit filled-in test forms, PDFs or attachment images containing real client
  personal information
- NEVER route attachments through a server or third-party store — the phone-to-desktop
  link is peer-to-peer by design (POPIA)
- NEVER put a link on the header logo — this page is sent to clients and must not lead
  them into the internal VDM menu
- NEVER remove the staff email dropdown validation — a recipient must be selected before
  send is enabled
