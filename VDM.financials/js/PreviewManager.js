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

  // ── Live update (stub — generate on button) ─────────────────────────────

  liveUpdate() {
    this.generateDocFn();
  }
}
