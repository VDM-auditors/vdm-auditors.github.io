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
    this.app = els.appContainer;
    this.toggleBar = els.toggleBar;
    this.toggleLabel = els.toggleLabel;
    this.modeLabel = els.modeLabel;
    this.documentOutput = els.documentOutput;
    this.previewPanel = els.previewPanel;
    this.generateDocFn = generateDocFn;

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
      if (this.modeLabel) this.modeLabel.textContent = 'Preview mode \u2014 document shown alongside the form';

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
      if (this.modeLabel) this.modeLabel.textContent = 'Editing mode \u2014 fill in the form, then generate';
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

    // Resolve ALL relative <img src> to absolute URLs before writing to the
    // popup window. A popup opened with window.open('') has about:blank as its
    // base URL, so relative paths like "images/letterhead-header.png" fail to
    // resolve and the letterhead/footer images disappear. Clone the DOM first
    // so we don't mutate the live preview, then rewrite every img.src using
    // the browser's own URL resolution against the current document.
    const cloned = output.cloneNode(true);
    cloned.querySelectorAll('img').forEach(img => {
      // Reading .src returns the already-resolved absolute URL
      const absolute = img.src;
      if (absolute) img.setAttribute('src', absolute);
    });
    const docContent = cloned.innerHTML;

    const baseHref = window.location.href;
    const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="${baseHref}">
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
    /* @page margin is 0 because each .doc-page/.cover-page is its own
       fixed-size A4 box with its own internal padding. Keeping @page
       margin at 0 avoids the browser adding its own header/footer space. */
    @page { margin: 0; size: A4; }

    /* Every logical page is locked to exactly one A4 sheet. overflow:hidden
       combined with the JS auto-fit below guarantees the letterhead and
       footer of any given .doc-page always appear on the SAME printed sheet
       — no matter how much or how little content is between them. */
    .doc-page {
      box-shadow: none !important;
      margin: 0 !important;
      page-break-after: always;
      page-break-inside: avoid;
      break-inside: avoid;
      max-width: 100% !important;
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      padding: 22mm 22mm 25mm 22mm !important;
      font-size: 9.5pt !important;
      line-height: 1.55 !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    .doc-page h2 {
      font-size: 10pt !important;
      margin: 6px 0 10px !important;
    }
    .doc-page h3 {
      font-size: 9.5pt !important;
      margin: 8px 0 4px !important;
    }
    .doc-page p {
      margin-bottom: 6px !important;
    }
    .doc-page ul {
      margin: 6px 0 8px 20px !important;
    }
    .doc-page ul li {
      margin-bottom: 5px !important;
    }
    .doc-page .page-header {
      margin-bottom: 20px !important;
      padding-bottom: 14px !important;
    }
    .doc-page .signature-block {
      margin-top: 28px !important;
    }
    .doc-page .compiler-block {
      margin-top: 18px !important;
    }
    /* Footer is always pushed to the bottom of its .doc-page container */
    .doc-page .letterhead-footer {
      margin-top: auto !important;
      padding-top: 24px !important;
      flex-shrink: 0 !important;
    }
    /* Signature/compiler blocks should not grow or stretch */
    .doc-page .signature-block,
    .doc-page .compiler-block {
      flex-shrink: 0 !important;
    }

    .cover-page {
      box-shadow: none !important;
      margin: 0 !important;
      page-break-after: always;
      break-inside: avoid;
      max-width: 100% !important;
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      padding: 22mm 22mm 22mm 22mm !important;
      font-size: 9.5pt !important;
      line-height: 1.55 !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    /* Info section fills available space but the table doesn't stretch
       infinitely — cap cell padding so sparse tables stay compact. */
    .cover-page .cover-title-block { flex-shrink: 0 !important; }
    .cover-page .cover-info-section {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .cover-page .cover-section-heading { flex-shrink: 0 !important; }
    .cover-page .cover-info-table {
      flex: 1 1 auto !important;
      height: auto !important;
      max-height: 100% !important;
    }
    .cover-page .cover-info-table td {
      padding-top: clamp(0.4em, 1.5vh, 0.9em) !important;
      padding-bottom: clamp(0.4em, 1.5vh, 0.9em) !important;
      vertical-align: middle !important;
    }

    .page-number { display: none; }

    /* Letterhead and footer sit within the .doc-page padding at natural
       aspect ratio. No negative margins, no bleed — clean and predictable. */
    .letterhead-img {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 0 10px 0 !important;
      height: auto !important;
      display: block !important;
      flex-shrink: 0 !important;
    }
    .letterhead-footer-img {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      height: auto !important;
      display: block !important;
    }
  </style>
</head>
<body>
  ${docContent}
  <scr` + `ipt>
    // ── AUTO-FIT + PRINT ──────────────────────────────────────────────
    // After all images load we measure each page's natural content height.
    // If it exceeds the fixed A4 height (297 mm) we wrap every child in a
    // zoom container so the content scales down to fit exactly one sheet.
    // This guarantees the letterhead and footer ALWAYS stay on the same
    // physical page in the PDF output.
    //
    // We use CSS zoom (not transform:scale) because zoom affects layout —
    // the browser's page-breaking algorithm sees the zoomed dimensions.
    // To keep the page visually at A4 we compensate width/height/padding
    // by dividing by the zoom ratio.

    function autoFitPages() {
      var pages = document.querySelectorAll('.doc-page, .cover-page');
      Array.prototype.forEach.call(pages, function(page) {
        var isCover = page.classList.contains('cover-page');
        var hasFooter = !!page.querySelector('.letterhead-footer');

        // ── 1. Measure natural (unconstrained) content height ──
        page.style.setProperty('height', 'auto', 'important');
        page.style.setProperty('min-height', '0', 'important');
        page.style.setProperty('max-height', 'none', 'important');
        page.style.setProperty('overflow', 'visible', 'important');

        // Force reflow, then read the actual rendered height
        var naturalH = page.getBoundingClientRect().height;

        // ── 2. Restore A4 lock ──
        page.style.setProperty('height', '297mm', 'important');
        page.style.setProperty('min-height', '297mm', 'important');
        page.style.removeProperty('max-height');
        page.style.setProperty('overflow', 'hidden', 'important');

        var targetH = page.getBoundingClientRect().height;

        // ── 3. Decide whether to zoom ──
        // Only zoom for GENTLE adjustments (max 12 % shrink).
        // If content overflows more than that, overflow:hidden clips
        // cleanly — better to lose a bit at the bottom than squish
        // text into an unreadable mess.
        // Exception: pages with a letterhead footer get a slightly
        // more generous allowance (max 18 %) because keeping the
        // header and footer on the same sheet is critical.
        if (naturalH > targetH * 1.005) {
          var ratio = targetH / naturalH;
          var minRatio = hasFooter ? 0.82 : 0.88;
          if (ratio < minRatio) {
            // Overflow too large — don't zoom; let overflow:hidden clip.
            return;
          }

          // Compensated dimensions so the page still maps to one A4 sheet
          // (zoom * compensated = original)
          var pTop  = isCover ? 22 : 22;
          var pBot  = isCover ? 22 : 25;
          var pH    = 22;  // horizontal padding

          page.style.setProperty('width',  (210 / ratio).toFixed(4) + 'mm', 'important');
          page.style.setProperty('height', (297 / ratio).toFixed(4) + 'mm', 'important');
          page.style.setProperty('min-height', (297 / ratio).toFixed(4) + 'mm', 'important');
          page.style.setProperty('padding',
            (pTop / ratio).toFixed(4) + 'mm ' +
            (pH   / ratio).toFixed(4) + 'mm ' +
            (pBot / ratio).toFixed(4) + 'mm ' +
            (pH   / ratio).toFixed(4) + 'mm', 'important');
          page.style.zoom = ratio;
        }
      });
    }

    window.onload = function() {
      var imgs = Array.prototype.slice.call(document.images || []);
      var pending = imgs.filter(function(img) { return !img.complete; });
      var fire = function() {
        setTimeout(function() {
          autoFitPages();
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 200);
        }, 250);
      };
      if (pending.length === 0) { fire(); return; }
      var remaining = pending.length;
      var done = function() {
        remaining--;
        if (remaining <= 0) fire();
      };
      pending.forEach(function(img) {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
      // Hard fallback in case some image hangs
      setTimeout(fire, 3000);
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
