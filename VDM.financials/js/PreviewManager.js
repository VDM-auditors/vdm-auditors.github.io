// ── PreviewManager ─────────────────────────────────────────────────────────
// Handles preview toggling (split-view / form-only), printing, and live
// update orchestration.  Works directly with DOM — no imports required.
// ────────────────────────────────────────────────────────────────────────────

class PreviewManager {
  /**
   * @param {Object}          els
   * @param {HTMLElement}      els.appContainer      – #app-container
   * @param {HTMLElement}      els.toggleBar         – #mode-toggle-bar
   * @param {HTMLElement}      els.toggleLabel       – #toggle-label
   * @param {HTMLElement}      els.modeLabel         – #mode-label
   * @param {HTMLElement}      els.documentOutput    – #document-output
   * @param {HTMLElement|null} els.previewPanel      – .preview-panel
   * @param {Function}         generateDocFn         – reference to generateDoc()
   */
  constructor(els, generateDocFn) {
    this.app            = els.appContainer;
    this.toggleBar      = els.toggleBar;
    this.toggleLabel    = els.toggleLabel;
    this.modeLabel      = els.modeLabel;
    this.documentOutput = els.documentOutput;
    this.previewPanel   = els.previewPanel;
    this.generateDocFn  = generateDocFn;

    this.previewVisible = false;
  }

  // ── Toggle between split-view and form-only ──────────────────────────────

  togglePreview() {
    this.previewVisible = !this.previewVisible;
    this._applyPreviewMode();
  }

  /** Internal — applies the current previewVisible state to the DOM. */
  _applyPreviewMode() {
    if (this.previewVisible) {
      // Measure only the sticky toggle bar height (header scrolls away)
      const usedHeight = this.toggleBar ? this.toggleBar.offsetHeight : 44;
      const avail = window.innerHeight - usedHeight;
      this.app.style.height = avail + 'px';

      this.app.classList.remove('form-only');
      this.app.classList.add('split-view');
      if (this.toggleLabel) this.toggleLabel.textContent = 'Hide Preview';
      if (this.modeLabel)   this.modeLabel.textContent   = 'Preview mode \u2014 document shown alongside the form';

      // Scroll preview to top
      if (this.documentOutput && this.documentOutput.classList.contains('visible')) {
        setTimeout(() => {
          const preview = this.previewPanel || document.querySelector('.preview-panel');
          if (preview) preview.scrollTop = 0;
        }, 60);
      }
    } else {
      this.app.style.height = '';
      this.app.classList.remove('split-view');
      this.app.classList.add('form-only');
      if (this.toggleLabel) this.toggleLabel.textContent = 'Show Preview';
      if (this.modeLabel)   this.modeLabel.textContent   = 'Editing mode \u2014 fill in the form, then generate';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Convenience: generate the document then switch to preview mode.
   */
  generateAndPreview() {
    this.generateDocFn();
    this.previewVisible = true;
    this._applyPreviewMode();
  }

  // ── Print Document ───────────────────────────────────────────────────────
  // Opens a dedicated print window so ALL pages render regardless of scroll
  // position or container overflow — solves the "only current page prints" bug.

  printDocument() {
    const output = this.documentOutput;
    if (!output || !output.classList.contains('visible')) {
      alert('Please generate a document first before printing.');
      return;
    }

    // Collect all <style> elements from the main page
    const allStyles = Array.from(document.querySelectorAll('style'))
      .map(s => s.outerHTML)
      .join('\n');

    // Collect all <link rel="stylesheet"> (Google Fonts etc.)
    const allLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => l.outerHTML)
      .join('\n');

    const docContent = output.innerHTML;

    const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VDM Financial Statement</title>
  ${allLinks}
  ${allStyles}
  <style>
    /* Print window overrides — ensure all pages render fully */
    body { margin: 0; padding: 0; background: white; }
    .app, .preview-panel, #document-output {
      display: block !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .doc-page {
      box-shadow: none !important;
      margin: 0 !important;
      page-break-after: always;
      page-break-inside: avoid;
      max-width: 100% !important;
      width: 100% !important;
      padding: 18mm 20mm 20mm !important;
      font-size: 9pt !important;
      line-height: 1.45 !important;
      min-height: 100vh !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
    }
    .cover-page {
      box-shadow: none !important;
      margin: 0 !important;
      page-break-after: always;
      max-width: 100% !important;
      width: 100% !important;
      padding: 18mm 20mm 20mm !important;
      min-height: 100vh !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
    }
    .page-number { display: none; }
    .letterhead-img {
      width: calc(100% + 40mm) !important;
      margin-left: -20mm !important;
      margin-top: -18mm !important;
      object-fit: contain !important;
    }
    .letterhead-footer-img {
      width: calc(100% + 40mm) !important;
      margin-left: -20mm !important;
      margin-bottom: -20mm !important;
      object-fit: contain !important;
    }
    @page { margin: 0; size: A4; }
  </style>
</head>
<body>
  ${docContent}
  <scr` + `ipt>
    // Auto-print once fonts and images have loaded
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 500);
      }, 600);
    };
  </scr` + `ipt>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Pop-up blocked \u2014 please allow pop-ups for this page and try again.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();
  }

  // ── Export as Word Document ──────────────────────────────────────────────
  // Wraps generated HTML in a Word-compatible document and triggers download.

  exportWord() {
    const output = this.documentOutput;
    if (!output || !output.classList.contains('visible')) {
      alert('Please generate a document first.');
      return;
    }

    // Clone the output so we can modify images without affecting the preview
    const clone = output.cloneNode(true);

    // Convert all images to base64 using fetch for reliability
    const images = clone.querySelectorAll('img');
    const origImages = output.querySelectorAll('img');
    const promises = Array.from(images).map((img, i) => {
      return new Promise(resolve => {
        if (img.src.startsWith('data:')) { resolve(); return; }
        // Use the original rendered image to draw on canvas (already loaded)
        const orig = origImages[i];
        if (orig && orig.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = orig.naturalWidth;
            canvas.height = orig.naturalHeight;
            canvas.getContext('2d').drawImage(orig, 0, 0);
            img.src = canvas.toDataURL('image/png');
          } catch(e) { /* fallback: fetch */ }
          if (img.src.startsWith('data:')) { resolve(); return; }
        }
        // Fallback: fetch as blob and convert
        fetch(img.src)
          .then(r => r.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => { img.src = reader.result; resolve(); };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve());
      });
    });

    Promise.all(promises).then(() => {
      const docContent = clone.innerHTML;

      const coName = document.getElementById('coName')?.value?.trim() || 'Document';
      const safeFileName = coName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');

      const wordHTML = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="VDM Financials">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm 15mm 20mm;
    }
    body {
      font-family: Calibri, 'Poppins', sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #111;
      margin: 0;
      padding: 0;
    }

    /* ── Page containers ── */
    .doc-page, .cover-page {
      page-break-before: always;
      page-break-after: always;
    }
    .doc-page:first-child, .cover-page:first-child {
      page-break-before: auto;
    }

    /* ── Letterhead & footer images ── */
    .letterhead-img {
      width: 100%;
      display: block;
      margin-bottom: 6px;
    }
    .letterhead-footer {
      margin-top: 30px;
      text-align: center;
    }
    .letterhead-footer-img {
      width: 100%;
      display: block;
    }

    /* ── Page header (company name block) ── */
    .page-header {
      text-align: left;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 0.5px solid #bbb;
    }
    .co-name {
      font-size: 11.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }
    .co-reg {
      font-size: 9pt;
      font-style: italic;
    }
    .co-trading-as {
      font-size: 9pt;
      font-style: italic;
      margin-bottom: 3px;
    }

    /* ── Headings ── */
    h2 {
      font-size: 10pt;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 6px 0 10px;
      font-weight: bold;
    }
    h2.center-heading {
      text-align: center;
    }
    h3 {
      font-size: 9.5pt;
      font-style: italic;
      font-weight: bold;
      margin: 8px 0 4px;
    }

    /* ── Body text ── */
    p {
      margin: 0 0 6px 0;
      text-align: justify;
    }
    ul {
      margin: 6px 0 8px 20px;
    }
    ul li {
      margin-bottom: 5px;
      text-align: justify;
    }

    /* ── Underline headings ── */
    .underline-heading {
      font-size: 9.5pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 12px 0 6px;
      text-transform: uppercase;
      font-style: normal;
    }

    /* ── Signature / compiler blocks ── */
    .signature-block {
      margin-top: 28px;
    }
    .sig-line {
      display: inline-block;
      width: 220px;
      border-bottom: 1px solid #333;
      margin-right: 40px;
      margin-bottom: 18px;
    }
    .sig-name {
      font-weight: bold;
      font-size: 9pt;
      margin-top: 3px;
    }
    .compiler-block {
      margin-top: 18px;
      font-weight: bold;
    }
    .compiler-block p {
      margin: 0;
      text-align: left;
    }

    /* ── Policy entries ── */
    .policy-entry {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .policy-entry .underline-heading {
      margin-top: 10px;
    }

    /* ── Cover page ── */
    .cover-title-block {
      text-align: left;
      margin-bottom: 0;
      padding-bottom: 14px;
      border-bottom: 2px solid #111;
    }
    .cover-title-block .co-name {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .cover-title-block .co-reg {
      font-size: 10pt;
      font-style: italic;
      margin-bottom: 6px;
    }
    .cover-title-block .cover-year {
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 0.04em;
      margin-top: 6px;
    }
    .cover-title-block .cover-subtitle {
      font-size: 10pt;
      margin-top: 2px;
      letter-spacing: 0.03em;
    }
    .cover-section-heading {
      font-size: 10pt;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 4px;
      font-weight: bold;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
    }
    .cover-info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 4px;
    }
    .cover-info-table tr {
      border-bottom: 1px solid #eee;
    }
    .cover-info-table tr:last-child {
      border-bottom: none;
    }
    .cover-info-table td {
      padding: 12px 4px;
      vertical-align: middle;
      line-height: 1.45;
    }
    .cover-info-table td:first-child {
      font-weight: bold;
      width: 42%;
      color: #222;
    }
    .cover-info-table td:last-child {
      color: #333;
    }
    .cover-footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 8.5pt;
      color: #555;
      text-align: center;
    }

    /* ── Tables (financial) ── */
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 4pt 6pt; vertical-align: top; }

    /* ── Hide page numbers (Word handles its own) ── */
    .page-number { display: none; }

    img { max-width: 100%; }
  </style>
</head>
<body>
  ${docContent}
</body>
</html>`;

      const blob = new Blob(['\ufeff' + wordHTML], {
        type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileName}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ── Live update (stub — generate on button) ─────────────────────────────

  liveUpdate() {
    this.generateDocFn();
  }
}
