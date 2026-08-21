# VDM Audit — New Entity Registration Questionnaire

A form for clients who want VDM Audit to **register a new entity** — a company, CC, NPO,
trust, school or body corporate that does not exist yet.

Live at: **https://vdm-auditors.github.io/new-entity-registration/**

---

## How it differs from the Client Questionnaire

The [Client Questionnaire](https://vdm-auditors.github.io/questionnaire/) is for entities
that are **already registered** — it asks for the registration number, tax reference, VAT
and PAYE numbers the client already has.

This form is for the step before that. A brand-new entity has none of those numbers yet,
so they are simply not asked for. The entity name is captured as a **proposed** name, and
there is no CIPC beneficial ownership mandate step — that is handled separately once the
entity has actually been registered.

Everything else is the same form: same look, same steps, same attachments and signature
capture.

---

## The 5 Steps

| Step | Description |
|------|-------------|
| **1 — Entity Type** | Select organisation type, contact details, and services required |
| **2 — Entity Info** | Date, proposed entity name, addresses, principal business activity, responsible persons |
| **3 — Details** | Entity-specific people (directors, shareholders, members, trustees, beneficiaries) |
| **4 — Attachments** | Upload an ID document for each person, plus any supporting documents |
| **5 — Sign & Submit** | Signature capture and final declaration for each responsible person |

---

## Attachments

Every person captured in step 3 gets their own upload slot, plus an **Additional
Attachments** slot for anything else. Images and PDFs are accepted, and each one is
appended to the generated PDF as its own page.

Three ways to add a document:

- **Upload** — choose a file, or drag one onto the slot
- **Take Photo** — on a phone or tablet, opens the camera directly
- **Scan with Phone** — on a computer, shows a QR code; scan it with the phone camera,
  photograph the document, and it appears on the computer instantly

Documents are never uploaded to a VDM server. The phone sends the photo directly to the
computer over an encrypted peer-to-peer connection, and everything stays in the browser
until it is written into the PDF.

---

## Supported Entity Types

| Type | Description |
|------|-------------|
| 🏢 **Company** | Pty Ltd / Ltd — directors and shareholders |
| 🤝 **CC** | Close Corporation — members |
| 🌱 **NPO** | Non-Profit Organisation — directors, objectives, appointment method |
| 👤 **Individual** | Personal / Sole Proprietor |
| ⚖️ **Trust** | Trust Registration — donor, independent trustee, trustees, beneficiaries |
| 🏫 **School** | School or Educational Institution |
| 🏘️ **Body Corporate** | Sectional Title Scheme / Home Owners Association |

---

## Output

On completion the form generates a formatted A4 PDF entirely in the browser — VDM Audit
logo banner, entity badge, all captured data, signatures, and one page per attachment.
The client picks a VDM recipient from the dropdown and sends it from their own email
client. Nothing is sent automatically.

If **Income Tax** is among the selected services, a SARS Public Officer appointment and
Special Power of Attorney are also generated as Word documents, with the tax reference
numbers left blank for completion once SARS allocates them.

---

## Legal Notice

> Clients are advised that no new trusts may be registered without an independent trustee —
> a person who is not a beneficiary and has no family or blood relation to any other
> trustee, beneficiary, or the founder of the trust.

---

## About VDM Audit

VDM Audit has been providing professional auditing, accounting, and tax services since
**1965**.
