# questionnaire — CLAUDE.md

Client onboarding intake form for VDM Audit. Fully self-contained single HTML file, deployed on GitHub Pages.

---

## Architecture Map

### Directory tree

```
questionnaire/
├── index.html      # Wizard application: HTML + CSS + JS
├── attachments.js  # Step 4 — file uploads, phone (QR/WebRTC) capture, PDF embedding
├── mandate.js      # Step 5 — CIPC beneficial ownership mandate: fields, live preview, signature
├── mandate-pdf.js  # Step 5 — draws the mandate page into the jsPDF document
├── upload.html     # Phone-side capture page opened by scanning the QR code
├── logo.png        # VDM Audit logo used in form header and generated PDF
└── README.md       # User-facing documentation
```

### What index.html contains

| Layer | Description |
|-------|-------------|
| `<style>` | All CSS — responsive layout, 6-step wizard, attachment slots, signature pad, print styles |
| `<body>` | 6-step wizard form, attachment containers, signature canvas per signatory, submit / send section |
| `<script>` | All JS — wizard navigation, PDF generation (jsPDF), docx generation, mailto dispatch |

### 6-step wizard flow

| Step | Content |
|------|---------|
| 1 — Entity Type | Organisation type selector, contact details, services required |
| 2 — Entity Info | Date, entity name, registration/tax numbers, addresses, responsible persons |
| 3 — Details | Entity-specific people (directors, trustees, members, etc.) |
| 4 — Attachments | One ID-document slot per person + free-form additional attachments (`attachments.js`) |
| 5 — Mandate | CIPC beneficial ownership resolution — live A4 preview, place/date, signatory, signature (`mandate.js`) |
| 6 — Sign & Submit | Signature capture (canvas) per person, declaration, send |

### Mandate (step 5)

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
User completes 6-step wizard (DOM inputs + attachments + mandate + canvas signatures)
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

### Staff email recipients (dropdown in Step 4)

Emails are listed in the `<select>` in the form — all `@vdmaudit.co.za` addresses. They are not secrets (displayed to user). Do not move them to a config file or backend.

---

## Dev Commands

```bash
# Preview locally
start questionnaire/index.html

# Deploy
git add questionnaire/index.html
git commit -m "your message"
git push origin main

# Test PDF generation
# 1. Open index.html in browser
# 2. Complete all 6 steps (use test/dummy data only)
# 3. Capture a signature on the canvas
# 4. Select a recipient, click generate — verify PDF looks correct
# 5. Do NOT send to real recipients during testing
```

| Task | Steps |
|------|-------|
| Local preview | Open `questionnaire/index.html` in browser |
| Test full flow | Complete all 6 steps → attach a file → sign the mandate → capture signature → verify PDF |
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
- NEVER add form fields to any page of the PDF other than the mandate page
