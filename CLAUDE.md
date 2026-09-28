# VDM Auditors — Root CLAUDE.md

## Sub-module Guides

| Module | Guide |
|--------|-------|
| Client questionnaire (existing clients + new entity registration) | [questionnaire/CLAUDE.md](questionnaire/CLAUDE.md) |

> **One link for clients.** On 28 Sep 2026 the separate `new-entity-registration/` form
> and the `trust-deed-questionnaire/` redirect were merged into `questionnaire/`, which now
> opens by asking *New / Existing Client* or *Register a New Entity*. The password-gated
> landing page (`index.html`) was removed at the same time. Clerks send
> `https://vdm-auditors.github.io/questionnaire/` — do not re-create the separate forms.
> Their history is in git; the older standalone trust form is on the
> `archive/trust-deed-questionnaire` branch.

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
├── Audit_Logo.jpg          # Logo from the removed landing page — no longer referenced
├── logo.jpg                # Secondary logo asset — no longer referenced
├── vdm-mark.png            # No longer referenced
└── questionnaire/
    ├── index.html          # The wizard (HTML+CSS+JS) — both modes
    ├── mode.js             # Opening choice: existing client vs new entity; ?mode= / ?type= links
    ├── address-autocomplete.js  # HERE address lookup (Photon/OSM fallback) — autofills suburb/city/postal code
    ├── attachments.js      # Step 4 — uploads, QR/WebRTC phone capture, PDF embedding
    ├── mandate.js          # Step 5 (existing clients) — CIPC beneficial ownership mandate + live preview
    ├── mandate-pdf.js      # Step 5 — mandate page rendering into the jsPDF document
    ├── trust.js            # New trusts — deed fields, step-3 check, PDF section, trust-deed JSON
    ├── upload.html         # Phone-side capture page (opened via QR code)
    ├── logo.png
    ├── CLAUDE.md
    └── README.md
```

### Data flow — questionnaire

```
User picks New / Existing Client or Register a New Entity, fills the wizard
  → jsPDF (CDN) generates A4 PDF in browser
  → PDF downloads; user emails it to their VDM contact
     (no auto-send — user sends it from their own email client)
```

### External CDNs / links

| Asset | URL |
|-------|-----|
| Google Fonts | `https://fonts.googleapis.com` |
| jsPDF 2.5.1 | `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js` |
| docx 8.5.0 | `https://unpkg.com/docx@8.5.0/build/index.umd.js` |
| PeerJS 1.5.4 (questionnaire phone link) | `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js` |
| qrcodejs 1.0.0 | `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` |
| pdf.js 3.11.174 | `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` |
| HERE Autosuggest (address autocomplete) | `https://autosuggest.search.hereapi.com/v1/autosuggest` — needs a referrer-restricted key |
| Photon geocoder (autocomplete fallback) | `https://photon.komoot.io/api/` — no API key |
| Live form | `https://vdm-auditors.github.io/questionnaire/` |

---

## Dev Commands

```bash
# Preview locally — serve over http (file:// will not load the .js modules)
python -m http.server 8777
# then open http://127.0.0.1:8777/questionnaire/

# Deploy — this is a GitHub Pages static site; deploy = push to main
git add <files>
git commit -m "your message"
git push origin main
# GitHub Pages rebuilds automatically (no build step)
```

| Task | How |
|------|-----|
| Preview changes | Serve the repo and open `/questionnaire/` |
| Test print layout | Browser print preview (Ctrl+P), verify A4 |
| Deploy | `git push origin main` |
| Check Pages status | GitHub repo → Settings → Pages |

---

## Prohibitions

- NEVER embed secrets, API keys, or passwords in client-side JS
- NEVER auto-send email without explicit user confirmation (submit button + confirm step)
- NEVER run destructive git commands (`--force`, `reset --hard`, `checkout .`) without explicit user request
- NEVER create new files in the repo root — place code in its sub-directory (`questionnaire/`)
- NEVER split the questionnaire back into separate forms per client type — add a mode branch instead
- NEVER allow any single file to exceed 500 lines (split into modules)
- NEVER commit `.env` files or any credentials file
- NEVER modify `Audit_Logo.jpg` or `logo.jpg` without explicit instruction
