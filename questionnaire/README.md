# VDM Audit — New / Current Client Questionnaire

A professional, fully self-contained client onboarding form for **VDM Audit** (Est. 1965). Built as a single HTML file that requires no server, no database, and no installation — open it in any browser and it works.

---

## Overview

This form guides new and existing clients through a structured 5-step onboarding process, collecting all information required for registration and compliance purposes. On completion, it generates a professionally formatted PDF that is automatically emailed to the VDM Audit team.

---

## Features

### 5-Step Wizard
| Step | Description |
|------|-------------|
| **1 — Entity Type** | Select organisation type, contact details, and services required |
| **2 — Entity Info** | Date, entity name, registration and tax reference numbers, addresses, responsible persons |
| **3 — Details** | Entity-specific people and information (directors, trustees, members, etc.) |
| **4 — Attachments** | Upload an ID document for each person, plus any additional supporting documents |
| **5 — Sign & Submit** | Signature capture and final declaration for each responsible person |

### Attachments

Every person captured in step 3 gets their own upload slot, and there is an
**Additional Attachments** slot for share certificates, proof of address, trust deeds
or anything else. Images and PDFs are accepted (max 12 MB per file) and each one is
appended to the generated PDF as its own page.

There are three ways to add a document:

- **Upload** — choose a file, or drag one onto the slot
- **Take Photo** — on a phone or tablet, opens the camera directly
- **Scan with Phone** — on a computer, shows a QR code; scan it with the phone camera,
  photograph the document on the phone, and it appears on the computer instantly

Documents are never uploaded to a VDM server. The phone sends the photo directly to
the computer over an encrypted peer-to-peer connection, and everything stays in the
browser until it is written into the PDF.

### Supported Entity Types

| Type | Description |
|------|-------------|
| 🏢 **Company** | Pty Ltd / Ltd — directors and shareholders |
| 🤝 **CC** | Close Corporation — members |
| 🌱 **NPO** | Non-Profit Organisation — directors, objectives, appointment method |
| 👤 **Individual** | Personal / Sole Proprietor |
| ⚖️ **Trust** | Trust Registration — donor, independent trustee, trustees, beneficiaries |
| 🏫 **School** | School or Educational Institution |
| 🏘️ **Body Corporate** | Sectional Title Scheme / Home Owners Association |

### Services Selection
Each entity type shows only the services relevant to it:

- **Company / CC / NPO** — Audit, Financial Statements, Payroll, Annual CIPC License, Income Tax, VAT, PAYE, UIF, Compensation Commissioner
- **Body Corporate** — Audit, Financial Statements, Income Tax (incl. provisional)
- **Individual** — Financial Statements, Income Tax, VAT, PAYE, UIF, Compensation Commissioner, Estate Administration, Wills
- **School** — Audit, Income Tax, VAT, PAYE, UIF, Compensation Commissioner
- **Trust** — Financial Statements, Income Tax, VAT, PAYE (incl. EMP501), UIF Declarations, Compensation Commissioner, Beneficial Ownership Register

### PDF Generation
- Fully formatted A4 PDF generated entirely in the browser using [jsPDF](https://github.com/parallax/jsPDF)
- Includes VDM Audit logo banner, entity badge, all form data, and captured signatures
- PDF is attached to an email and sent directly to `riekie@vdmaudit.co.za`

### Other Features
- **Step pill navigation** — click any completed step pill at the top to jump back to it
- **Signature capture** — canvas-based signature pad per signatory, with clear button
- **Marital status & spouse details** — toggle-based spouse section per person
- **Tax instruction toggle** — Yes/No income tax filing instruction per person
- **Beneficiary designation** — Income and Capital beneficiary flags per trust trustee
- **Trust legal notice** — Mandatory independent trustee requirement displayed prominently
- **Fully responsive** — works on desktop and mobile browsers
- **No dependencies to install** — all libraries loaded from CDN, works offline once cached

---

## Deployment

### GitHub Pages (Recommended)

1. Create a new **public** repository on [github.com](https://github.com)
2. Upload `client-intake-form.html` and **rename it to `index.html`**
3. Go to **Settings → Pages → Branch: main → Save**
4. Your form will be live at:
   ```
   https://yourusername.github.io/your-repo-name/
   ```

> The form is entirely client-side — no server or backend required.

### Local Use

Simply open `client-intake-form.html` (or `index.html`) in any modern browser. No build step, no dependencies to install.

```bash
# macOS
open index.html

# Windows
start index.html
```

---

## Technical Details

| Property | Value |
|----------|-------|
| File type | Single self-contained HTML file |
| File size | ~206 KB |
| PDF library | jsPDF (via CDN) |
| Fonts | DM Sans, DM Serif Display (Google Fonts) |
| No framework | Vanilla HTML, CSS, JavaScript only |
| Browser support | All modern browsers (Chrome, Firefox, Edge, Safari) |

---

## Customisation

All configuration is inside the single `index.html` file.

| What to change | Where to find it |
|----------------|-----------------|
| Logo image | Search `header-logo` — replace the `src` with your image URL or base64 |
| Recipient email | Search `riekie@vdmaudit.co.za` — replace with any email address |
| Accent / brand colours | Search `:root {` — edit `--navy` and `--accent` CSS variables |
| Entity types shown | Search `selectEntity` — add or remove entity card blocks |
| Services listed | Search `svc_company_group` — edit the checkbox labels per group |

---

## Project Structure

```
index.html          ← The entire application (HTML + CSS + JS in one file)
README.md           ← This file
```

---

## Legal Notice

> Clients are advised that no new trusts may be registered without an independent trustee — a person who is not a beneficiary and has no family or blood relation to any other trustee, beneficiary, or the founder of the trust.

---

## About VDM Audit

VDM Audit has been providing professional auditing, accounting, and tax services since **1965**. This form is for onboarding new and existing clients across all entity types serviced by the firm.

For queries, contact: **chraetenlategan@gmail.com**
