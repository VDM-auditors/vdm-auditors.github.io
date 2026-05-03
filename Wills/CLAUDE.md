# Wills — CLAUDE.md

Last Will and Testament guided wizard. Fully self-contained single HTML file, deployed on GitHub Pages.

---

## Architecture Map

### Directory tree

```
Wills/
├── index.html    # Entire application: HTML + CSS + JS in one file
└── logo.png      # VDM Audit logo used in lock screen and document header
```

### What index.html contains

| Layer | Description |
|-------|-------------|
| `<style>` | All CSS — responsive layout, password lock screen, wizard steps, print styles |
| `<body>` | Password lock screen overlay, multi-step wizard form, document preview |
| `<script>` | All JS — lock screen logic, wizard navigation, PDF generation, mailto dispatch |

### Password lock screen

Matching pattern to root `index.html`. Password checked client-side in JS. Users unlock before accessing the wizard.

Note: Client-side password is security by obscurity only — not suitable for truly sensitive data.

### Data flow

```
User unlocks (password check in JS)
  ↓
Multi-step wizard form (DOM inputs)
  ↓
JS collects all field values into data object
  ↓
PDF generated in browser (jsPDF or equivalent — all inline)
  ↓
User clicks "Send" — mailto: link opens email client
  ↓
User confirms and sends manually in their email client
  (NO auto-send, NO server-side send)
```

### External CDNs / fonts

| Asset | Source |
|-------|--------|
| Google Fonts (DM Sans, DM Serif Display) | `https://fonts.googleapis.com` |

No other external dependencies — PDF generation is inline JS or not present in this module.

---

## Dev Commands

```bash
# Preview locally
start Wills/index.html

# Deploy
git add Wills/index.html
git commit -m "your message"
git push origin main

# Test print / PDF
# 1. Open index.html in browser
# 2. Enter password, complete all wizard steps
# 3. Review generated document before sending
```

| Task | Steps |
|------|-------|
| Local preview | Open `Wills/index.html` in browser |
| Test full flow | Enter password → complete wizard → verify document output |
| Deploy | `git push origin main` |
| Test on mobile | Open in browser DevTools mobile emulation |

---

## Prohibitions

- NEVER embed secrets, API keys, or real passwords in client-side JS
- NEVER auto-send email without explicit user confirmation (user must click Send in their email client)
- NEVER run destructive git commands without explicit user request
- NEVER create new files in the repo root
- NEVER allow `index.html` to exceed 500 lines without splitting CSS/JS into separate files
- NEVER commit any client data or test files containing personal information
- NEVER remove or alter the password lock screen without explicit instruction
- NEVER bypass the "user confirms send" step — the mailto: pattern is intentional
