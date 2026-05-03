# questionnaire — CLAUDE.md

Client onboarding intake form for VDM Audit. Fully self-contained single HTML file, deployed on GitHub Pages.

---

## Architecture Map

### Directory tree

```
questionnaire/
├── index.html    # Entire application: HTML + CSS + JS in one file
├── logo.png      # VDM Audit logo used in form header and generated PDF
└── README.md     # User-facing documentation
```

### What index.html contains

| Layer | Description |
|-------|-------------|
| `<style>` | All CSS — responsive layout, 4-step wizard, signature pad, print styles |
| `<body>` | 4-step wizard form, signature canvas per signatory, submit / send section |
| `<script>` | All JS — wizard navigation, PDF generation (jsPDF), docx generation, mailto dispatch |

### 4-step wizard flow

| Step | Content |
|------|---------|
| 1 — Entity Info | Date, entity name, registration/tax numbers, addresses, responsible persons |
| 2 — Entity Type | Organisation type selector, contact details, services required |
| 3 — Details | Entity-specific people (directors, trustees, members, etc.) |
| 4 — Sign & Submit | Signature capture (canvas) per person, declaration, send |

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
User completes 4-step wizard (DOM inputs + canvas signatures)
  ↓
JS collects all values into a data object
  ↓
jsPDF (CDN) generates A4 PDF entirely in browser
  (includes logo banner, entity badge, all form fields, signatures)
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
# 2. Complete all 4 steps (use test/dummy data only)
# 3. Capture a signature on the canvas
# 4. Select a recipient, click generate — verify PDF looks correct
# 5. Do NOT send to real recipients during testing
```

| Task | Steps |
|------|-------|
| Local preview | Open `questionnaire/index.html` in browser |
| Test full flow | Complete all 4 steps → capture signature → verify PDF |
| Deploy | `git push origin main` |
| Add/remove staff email | Edit the `<select>` options in Step 4 of `index.html` |

---

## Prohibitions

- NEVER embed secrets, API keys, or passwords in client-side JS
- NEVER auto-send email without explicit user confirmation — the mailto: pattern is intentional; user must send manually from their email client
- NEVER run destructive git commands without explicit user request
- NEVER create new files in the repo root
- NEVER allow `index.html` to exceed 500 lines without splitting CSS/JS into separate files
- NEVER commit any filled-in test forms or PDFs containing real client personal information
- NEVER replace the mailto: send pattern with a server-side send without a full security review
- NEVER remove the staff email dropdown validation — recipient must be selected before send is enabled
