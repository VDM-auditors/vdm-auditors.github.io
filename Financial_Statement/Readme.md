# VDM — Financial Statement Policy Generator

## Overview

A **single-file HTML application** (~440 KB, ~4 400 lines) that generates South African financial statement policy documents for VDM Chartered Accountants / VDM Audit. The user fills in a form on the left; a rendered document preview appears on the right. The final document can be printed or saved as a PDF directly from the browser.

---

## How to Use

Open `index.html` in any modern browser — no server or build step required. Everything (CSS, JS, images) is self-contained.

---

## UI Modes

| Mode | Description |
|------|-------------|
| **Form-only** | Default. Full-width form, no preview panel. |
| **Split-view** | Toggled via the sticky toolbar button. Form on the left (420 px fixed), live-rendered document on the right. Both panels scroll independently. |

---

## File Structure (for Claude)

The file is divided into three logical blocks. When making targeted edits, reference these line ranges:

| Block | Lines | Content |
|-------|-------|---------|
| **CSS** | 8 – 707 | All styles: layout, form, preview, document pages, print rules |
| **HTML** | 708 – 1 584 | Page skeleton, sticky toolbar, form panel, preview panel |
| **JavaScript** | 1 605 – 4 398 | All application logic (see table below) |

### JavaScript Sections

| Section | Approx. Lines | Purpose |
|---------|---------------|---------|
| Letterhead images | 1 605 – 1 608 | Two base64 JPEG constants: `CA_LETTERHEAD`, `AUDIT_LETTERHEAD` |
| State | 1 609 – 1 612 | `directors[]`, `directorCount` |
| Accounting policies data | 1 613 – 1 768 | `accountingPolicies` array — all policy objects with ids, labels, text |
| `buildPolicyChecklist()` | 1 769 | Renders the policy checklist into the form |
| `onSubItemChange()` / `onRateSelect()` / `togglePolicy()` / `selectAllPolicies()` | 1 821 – 1 865 | Policy UI callbacks |
| `autoFillPrevYear()` | 1 867 | Calculates and fills the previous year-end date |
| `updateBank()` | 1 893 | Populates bank branch/account fields from dropdown |
| `ENTITY_CONFIG` | 1 908 | Large object mapping entity type → terminology, visible fields, document pages |
| `selectEntity()` | 2 021 | Activates an entity type card, shows/hides conditional fields |
| Report type logic | 2 119 – 2 336 | `onReportTypeChange()`, sub-type toggles, engagement type logic |
| Utility helpers | 2 337 – 2 476 | `getVal()`, `getRadio()`, `formatNumber()`, `getEntityTerms()`, `getTermsForCount()`, director management, `formatDirectorList()`, `getPronoun()` |
| `printDocument()` | 2 478 | Opens a new window and triggers browser print |
| `togglePreview()` / `applyPreviewMode()` | 2 563 – 2 602 | Switches between form-only and split-view |
| `generateDoc()` | 2 613 – 4 398 | **Main document builder** — assembles all pages into HTML string |

### Inside `generateDoc()` — Page Builders

| Inner function / comment | Purpose |
|--------------------------|---------|
| `sigBlock(dirs)` | Director/member/trustee signature block |
| `caLetterhead()` / `auditLetterhead()` | Inserts the appropriate letterhead image |
| `compilerBlock()` / `auditorBlock()` | Compiler/auditor sign-off blocks |
| `preparerSentence()` | Generates the preparer sentence based on capacity |
| **PAGE 0** | Cover page |
| **PAGE 1** | CA Declaration |
| **PAGE 2** | Directors' Responsibilities |
| **PAGE 3** | Compilation Report |
| **PAGE 3a** | Independent Reviewer's Report |
| **PAGE 3b** | Independent Auditor's Report |
| **PAGE 4** | Directors' / Members' Report |
| **PAGE 5+** | Accounting Policies (multi-page, auto-paginated) |
| `buildPolicyText(p)` | Renders a single policy entry to HTML |
| `flushPolicyPage(items, pageNum)` | Wraps a batch of policies into a document page |
| Body Corporate pages | Trustees' Responsibilities, Trustees' Report |
| Attorneys pages | Trust Account Assurance Report |
| Engagement letter builders | `buildAccountingEngagementLetter()`, `buildReviewEngagementLetter()`, `buildAuditEngagementLetter()`, `buildAttorneysEngagementLetter()` |
| Trust Minutes | Trust minutes page |
| CC Minutes | Close Corporation AGM minutes page |
| Company Minutes | Directors' Meeting + Shareholders' AGM pages |

---

## Supported Entity Types

Each entity type activates a specific set of form fields and document pages, controlled by `ENTITY_CONFIG`:

- Company (Pty Ltd)
- Close Corporation (CC)
- Trust
- Body Corporate
- Church / NPO
- School
- Attorneys Practice

---

## Supported Report Types

- **Compilation** (standard, sole proprietor variant)
- **Review** (standard, qualified basis variant)
- **Audit** (standard, school, attorneys trust account)

Each type shows/hides its own sub-options and generates different document pages.

---

## Accounting Policies

Defined in the `accountingPolicies` array. Each policy has:

```js
{
  id: 'pol_xxx',           // unique identifier
  label: '1.x Policy Name',
  originalNum: '1.x',
  text: '...',             // body text
  subItems: [...],         // optional — depreciation rate selectors, sub-policies
  textSuffix: '...',       // optional — appended after sub-items
  isBio: true              // optional — biological assets flag
}
```

Policies shown in the document are determined by which checkboxes the user selects in the form.

---

## CSS Variables (Design Tokens)

Defined in `:root` at the top of the `<style>` block:

| Variable | Value | Use |
|----------|-------|-----|
| `--ink` | `#1a1a2e` | Primary dark text / header background |
| `--ink-light` | `#4a4a6a` | Secondary text |
| `--gold` | `#c9a84c` | Accent / borders / buttons |
| `--gold-light` | `#f0dfa0` | Light gold highlight |
| `--cream` | `#faf8f3` | Page background |
| `--white` | `#ffffff` | Card backgrounds |
| `--border` | `#e2ddd3` | Dividers |
| `--success` | `#2d7a4f` | Success states |
| `--panel` | `#f4f1ea` | Panel backgrounds |

---

## Key HTML IDs (for Targeted Edits)

| ID | Element |
|----|---------|
| `document-output` | Container where generated document HTML is injected |
| `placeholder` | "Fill in the form" placeholder shown before generation |
| `entity-type-cards` | Entity selection card group |
| `report-type` | Report type radio group |
| `step1-block` through `step8-block` | Form step sections |
| `policy-checklist` | Accounting policies checklist container |
| `preview-panel` | Right-hand preview pane |
| `form-panel` | Left-hand form pane |
| `.app` | Root layout div (gets `.form-only` or `.split-view` class) |
| `.mode-toggle-bar` | Sticky toolbar with the preview toggle button |

---

## Printing / PDF Output

`printDocument()` opens a new browser window, injects the generated HTML with a minimal print stylesheet, and calls `window.print()`. The document is designed for **A4 portrait**, using `@media print` rules that:

- Force `page-break-before` between document pages
- Hide UI chrome
- Set exact margins and font sizes for print

---

## Fonts

Loaded from Google Fonts:

- **Libre Baskerville** — headings, logo mark, formal document text
- **Poppins** — UI labels, form elements, body text

---

## Tips for Working with Claude on This File

Because this file is large, always paste only the relevant section when requesting changes:

- **CSS change?** Paste only the relevant CSS rule block, with its surrounding comment (e.g. `/* ── FORM PANEL ── */`).
- **Policy text change?** Paste only the relevant object from `accountingPolicies`.
- **Page layout change?** Paste only the relevant inner function from `generateDoc()` (e.g. the `// ── PAGE 3 ──` block).
- **Form field change?** Paste only the relevant `<div>` block from the HTML form panel.
- **Entity config change?** Paste only the relevant key from `ENTITY_CONFIG`.

Always ask Claude to **return only the changed snippet**, not the full file, then paste it back manually.
