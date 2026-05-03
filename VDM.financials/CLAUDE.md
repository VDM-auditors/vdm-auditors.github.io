# VDM.financials — CLAUDE.md

Financial statements generator app. Vanilla JS, no framework, deployed as GitHub Pages static site.

---

## Architecture Map

### Directory tree

```
VDM.financials/
├── index.html              # App shell: form inputs, toolbar, preview panel
├── css/
│   └── styles.css          # Layout (split-view / form-only), print styles, A4 lock
├── js/
│   ├── app.js              # Entry point: instantiates all classes, wires globals
│   ├── config.js           # ENTITY_CONFIG, accountingPolicies[], IMPORTER_CONFIGS
│   ├── DocumentGenerator.js  # Builds A4 HTML pages from form state (~177 KB)
│   ├── EntityManager.js      # Entity type state, directors list, loan certs, shareholders
│   ├── PreviewManager.js     # Split-view toggle, print trigger, edit-preview mode
│   ├── CalendarPicker.js     # Year-end / prev-year date picker
│   ├── ExcelImporter.js      # SecInfo .xlsx import — wraps BaseImporter
│   ├── BaseImporter.js       # Shared Excel cell-reading utilities
│   └── utils.js             # getVal(), formatNumber(), toTitleCase(), getRadio()
├── images/
│   ├── letterhead-header.png       # CA letterhead header
│   ├── letterhead-footer.png       # CA letterhead footer
│   ├── Audit-letterhead-header.png # Audit letterhead header
│   ├── Audit-letterhead-footer.png # Audit letterhead footer
│   └── logo.jpg
├── Dummy data/             # Test PDFs — NEVER commit this directory
└── .claude/                # Claude Code project config
```

### JS load order (index.html `<script>` tags)

```
config.js → utils.js → EntityManager.js → CalendarPicker.js
  → DocumentGenerator.js → PreviewManager.js → ExcelImporter.js → app.js
```

`app.js` must load last — it creates all instances.

### Data flow

```
User fills form fields (index.html DOM)
  ↓
EntityManager  — tracks entity type, directors, loan certs, shareholders, sub-states
  ↓
DocumentGenerator.generate()  — reads DOM via getVal()/getRadio(), returns HTML string
  ↓
#document-output innerHTML   — live preview rendered in browser
  ↓
PreviewManager  — toggles split-view / form-only, triggers window.print()
  ↓ (optional)
ExcelImporter   — reads SecInfo .xlsx, populates form fields, then re-runs generate()
```

### Entity types supported

| Key | Label | Reports allowed |
|-----|-------|-----------------|
| `company` | Company (Pty) Ltd | compilation, review, audit |
| `cc` | Close Corporation | compilation, review, audit |
| `trust` | Trust | compilation |
| `npo` | NPO | review, audit |
| `attorneys` | Attorneys / Incorporated | audit |
| `school` | School | audit |
| `church` | Church | audit |
| `club` | Club / Association | audit |
| `bc` | Body Corporate | audit |

### Letterhead constants (config.js)

```javascript
CA_LETTERHEAD    = "images/letterhead-header.png"
AUDIT_LETTERHEAD = "images/Audit-letterhead-header.png"
LETTERHEAD_FOOTER_IMG = "images/letterhead-footer.png"
AUDIT_FOOTER_IMG      = "images/Audit-letterhead-footer.png"
```

---

## Dev Commands

```bash
# Preview app locally
start VDM.financials/index.html

# Deploy
git add VDM.financials/
git commit -m "your message"
git push origin main

# Test print layout
# 1. Open in Chrome
# 2. Fill a test entity
# 3. Click Generate, then Print (Ctrl+P)
# 4. Verify A4 page count and margins
```

| Task | Steps |
|------|-------|
| Local preview | Open `index.html` in browser |
| Test Excel import | Drag a SecInfo .xlsx onto the importer drop zone |
| Test print | Ctrl+P → verify A4, check page breaks |
| Deploy | `git push origin main` |

---

## Prohibitions

- NEVER embed secrets, passwords, or API keys in any JS file
- NEVER auto-send email without explicit user confirmation
- NEVER run destructive git commands without explicit user request
- NEVER create new files in the repo root
- NEVER allow any single JS file to exceed 500 lines — split into modules if needed
- NEVER commit `Dummy data/` — contains sensitive test PDFs
- NEVER alter `config.js` entity types without verifying `DocumentGenerator.js` templates still match
- NEVER break the JS load order — `app.js` must remain last
- NEVER remove the A4 size lock from `styles.css` — print layout depends on it
