# questionnaire — CLAUDE.md

Client onboarding intake form for VDM Audit. Fully self-contained single HTML file, deployed on GitHub Pages.

---

## Architecture Map

### Directory tree

```
questionnaire/
├── index.html      # Wizard application: HTML + CSS + JS
├── attachments.js  # Step 4 — file uploads, phone (QR/WebRTC) capture, PDF embedding
├── upload.html     # Phone-side capture page opened by scanning the QR code
├── logo.png        # VDM Audit logo used in form header and generated PDF
└── README.md       # User-facing documentation
```

### What index.html contains

| Layer | Description |
|-------|-------------|
| `<style>` | All CSS — responsive layout, 5-step wizard, attachment slots, signature pad, print styles |
| `<body>` | 5-step wizard form, attachment containers, signature canvas per signatory, submit / send section |
| `<script>` | All JS — wizard navigation, PDF generation (jsPDF), docx generation, mailto dispatch |

### 5-step wizard flow

| Step | Content |
|------|---------|
| 1 — Entity Type | Organisation type selector, contact details, services required |
| 2 — Entity Info | Date, entity name, registration/tax numbers, addresses, responsible persons |
| 3 — Details | Entity-specific people (directors, trustees, members, etc.) |
| 4 — Attachments | One ID-document slot per person + free-form additional attachments (`attachments.js`) |
| 5 — Sign & Submit | Signature capture (canvas) per person, declaration, send |

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
User completes 5-step wizard (DOM inputs + attachments + canvas signatures)
  ↓
JS collects all values into a data object
  ↓
jsPDF (CDN) generates A4 PDF entirely in browser
  (includes logo banner, entity badge, all form fields, signatures,
   and one appended page per attachment)
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
# 2. Complete all 5 steps (use test/dummy data only)
# 3. Capture a signature on the canvas
# 4. Select a recipient, click generate — verify PDF looks correct
# 5. Do NOT send to real recipients during testing
```

| Task | Steps |
|------|-------|
| Local preview | Open `questionnaire/index.html` in browser |
| Test full flow | Complete all 5 steps → attach a file → capture signature → verify PDF |
| Test phone capture | Open step 4 → Scan with Phone. From `file://` or `localhost` the QR points at the **deployed** `upload.html` (a phone cannot reach your machine), so `upload.html` must already be pushed for the scan to work. |
| Deploy | `git push origin main` |
| Add/remove staff email | Edit the `<select>` options in Step 4 of `index.html` |

---

## Prohibitions

- NEVER embed secrets, API keys, or passwords in client-side JS
- NEVER auto-send email without explicit user confirmation — the mailto: pattern is intentional; user must send manually from their email client
- NEVER run destructive git commands without explicit user request
- NEVER create new files in the repo root
- NEVER allow `index.html` to exceed 500 lines without splitting CSS/JS into separate files
- NEVER commit any filled-in test forms, PDFs, or attachment images containing real client personal information
- NEVER route attachments through a server or third-party store — the phone-to-desktop link is peer-to-peer by design (POPIA)
- NEVER replace the mailto: send pattern with a server-side send without a full security review
- NEVER remove the staff email dropdown validation — recipient must be selected before send is enabled
