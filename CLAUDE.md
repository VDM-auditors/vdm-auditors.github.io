# VDM Auditors — Root CLAUDE.md

## Sub-module Guides

| Module | Guide |
|--------|-------|
| Wills wizard | [Wills/CLAUDE.md](Wills/CLAUDE.md) |
| Client questionnaire | [questionnaire/CLAUDE.md](questionnaire/CLAUDE.md) |

> **Moved out:** the Financial Statements generator that used to live in
> `VDM.financials/` is now the `web/` directory of the **VDM-auditors/PolicyGenerator**
> repo, where it has been rebuilt as an Electron desktop app. Do not re-add it here.
> Its full pre-migration history is preserved on the `archive/pages-site` branch of
> that repo.

---

## Architecture Map

### Directory tree

```
vdm-auditors.github.io/
├── index.html              # Password-gated landing page (links to all tools)
├── Audit_Logo.jpg          # Primary logo used in lock screen
├── logo.jpg                # Secondary logo asset
├── Wills/
│   ├── index.html          # Self-contained Wills wizard (HTML+CSS+JS)
│   └── logo.png
├── questionnaire/
│   ├── index.html          # Self-contained client intake form (HTML+CSS+JS)
│   ├── logo.png
│   └── README.md
```

### Data flow — questionnaire / Wills

```
User fills multi-step wizard (index.html, self-contained)
  → jsPDF (CDN) generates A4 PDF in browser
  → User selects recipient email from dropdown
  → mailto: link opens with PDF attachment prompt
     (no server send — user confirms in email client)
```

### External CDNs / links

| Asset | URL |
|-------|-----|
| Google Fonts (root, Wills, questionnaire) | `https://fonts.googleapis.com` |
| jsPDF 2.5.1 | `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js` |
| docx 8.5.0 | `https://unpkg.com/docx@8.5.0/build/index.umd.js` |
| Report-an-issue form | `https://forms.gle/GRYHkhGMrYoMonrF6` |
| Live site | `https://vdm-auditors.github.io/` |

---

## Dev Commands

```bash
# Preview locally — open any HTML file directly in browser
start index.html
start Wills/index.html
start questionnaire/index.html

# Deploy — this is a GitHub Pages static site; deploy = push to main
git add <files>
git commit -m "your message"
git push origin main
# GitHub Pages rebuilds automatically (no build step)

# Check deployed site
# https://vdm-auditors.github.io/
```

| Task | How |
|------|-----|
| Preview changes | Open HTML file in browser |
| Test print layout | Browser print preview (Ctrl+P), verify A4 |
| Deploy | `git push origin main` |
| Check Pages status | GitHub repo → Settings → Pages |

---

## Prohibitions

- NEVER embed secrets, API keys, or passwords in client-side JS
- NEVER auto-send email without explicit user confirmation (submit button + confirm step)
- NEVER run destructive git commands (`--force`, `reset --hard`, `checkout .`) without explicit user request
- NEVER create new files in the repo root — place code in its sub-directory (`Wills/`, `questionnaire/`)
- NEVER allow any single file to exceed 500 lines (split into modules)
- NEVER commit `.env` files or any credentials file
- NEVER modify `Audit_Logo.jpg` or `logo.jpg` without explicit instruction — they are used across all pages
