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
    // ── PAGINATOR + PRINT ─────────────────────────────────────────────
    // For each .doc-page whose content exceeds the locked A4 height,
    // overflowing children are MOVED into a new continuation .doc-page
    // placed immediately after it. The continuation page receives a
    // CLONED letterhead at the top and a CLONED letterhead-footer at
    // the bottom (same images as the source) so every printed sheet
    // shows BOTH the header and the footer — never one without the
    // other. The section heading (h2) and any signature/compiler
    // blocks are NOT cloned: they appear only on their original page.
    //
    // Atomic blocks (.signature-block, .compiler-block, .policy-entry,
    // .page-header, tables) are kept whole — never split internally.
    // If a single child is taller than one full page on its own, the
    // page is left intact and a gentle CSS-zoom fallback shrinks it
    // enough to fit (last resort, only ~5 % cases).

    function isLeadingNode(el) {
      if (!el || !el.classList) return false;
      return el.classList.contains('letterhead-img') ||
             el.classList.contains('page-header');
    }
    function isTrailingNode(el) {
      if (!el || !el.classList) return false;
      return el.classList.contains('letterhead-footer');
    }
    function isPerPageOnly(el) {
      // Don't duplicate page numbers onto continuation sheets
      return el && el.classList && el.classList.contains('page-number');
    }

    function splitOverflowingPage(page, depth) {
      if (depth > 25) return; // safety against infinite recursion

      var children = Array.prototype.slice.call(page.children);

      // Identify the leading run (letterhead/page-header) at the top
      var leadEnd = 0;
      while (leadEnd < children.length && isLeadingNode(children[leadEnd])) {
        leadEnd++;
      }
      // Identify the trailing run (letterhead-footer) at the bottom
      var trailStart = children.length;
      while (trailStart > leadEnd && isTrailingNode(children[trailStart - 1])) {
        trailStart--;
      }

      var leading  = children.slice(0, leadEnd);
      var middle   = children.slice(leadEnd, trailStart);
      var trailing = children.slice(trailStart);

      if (middle.length < 2) return; // nothing meaningful to split

      // Measure natural overflow with the page temporarily un-locked
      var prevH  = page.style.height;
      var prevMn = page.style.minHeight;
      var prevMx = page.style.maxHeight;
      var prevOv = page.style.overflow;
      page.style.setProperty('height', 'auto', 'important');
      page.style.setProperty('min-height', '0', 'important');
      page.style.setProperty('max-height', 'none', 'important');
      page.style.setProperty('overflow', 'visible', 'important');

      var naturalH = page.getBoundingClientRect().height;

      // Restore the A4 lock for child-position measurements
      page.style.height    = prevH;
      page.style.minHeight = prevMn;
      page.style.maxHeight = prevMx;
      page.style.overflow  = prevOv;

      var lockedH = page.getBoundingClientRect().height;
      if (naturalH <= lockedH + 1) return; // fits — nothing to do

      // Compute the y-coordinate at which middle content must end:
      // bottom of the page minus padding minus footer height.
      var pageRect = page.getBoundingClientRect();
      var styles = window.getComputedStyle(page);
      var pBot = parseFloat(styles.paddingBottom) || 0;
      var trailingH = 0;
      trailing.forEach(function(t) {
        trailingH += t.getBoundingClientRect().height;
      });
      var maxBottom = pageRect.top + lockedH - pBot - trailingH;

      // Find first middle child whose bottom edge crosses maxBottom
      var cutoff = -1;
      for (var i = 0; i < middle.length; i++) {
        var rect = middle[i].getBoundingClientRect();
        if (rect.bottom > maxBottom) { cutoff = i; break; }
      }

      // Need at least one middle element to remain on the source page.
      // If even the first middle child overflows, we can't split safely
      // (it would create an empty leading page). Leave for the zoom
      // fallback to handle.
      if (cutoff <= 0) return;

      // Build the continuation page — same tag/class/inline-style
      var newPage = document.createElement('div');
      newPage.className = page.className;
      var inlineStyle = page.getAttribute('style');
      if (inlineStyle) newPage.setAttribute('style', inlineStyle);

      // Clone leading nodes (letterhead, page-header) — visual identity
      leading.forEach(function(el) {
        newPage.appendChild(el.cloneNode(true));
      });

      // Move overflowing middle children into the continuation page.
      // Strip per-page-only nodes (e.g. .page-number) — they belong to
      // the original page only.
      for (var j = cutoff; j < middle.length; j++) {
        if (isPerPageOnly(middle[j])) {
          if (middle[j].parentNode) {
            middle[j].parentNode.removeChild(middle[j]);
          }
        } else {
          newPage.appendChild(middle[j]);
        }
      }

      // Clone trailing nodes (footer) onto the continuation page so
      // BOTH letterhead and footer are always present on every sheet.
      trailing.forEach(function(el) {
        newPage.appendChild(el.cloneNode(true));
      });

      // Insert the continuation page immediately after the source
      page.parentNode.insertBefore(newPage, page.nextSibling);

      // Recurse — the continuation may itself overflow
      splitOverflowingPage(newPage, (depth || 0) + 1);
    }

    function paginatePages() {
      // Cover pages are not paginated — they're designed as a single sheet
      var pages = Array.prototype.slice.call(
        document.querySelectorAll('.doc-page')
      );
      pages.forEach(function(p) { splitOverflowingPage(p, 0); });
    }

    // Last-resort fallback for any page that STILL overflows after
    // pagination (e.g. one giant atomic child taller than a page).
    function autoFitResidual() {
      var pages = document.querySelectorAll('.doc-page, .cover-page');
      Array.prototype.forEach.call(pages, function(page) {
        var isCover = page.classList.contains('cover-page');

        page.style.setProperty('height', 'auto', 'important');
        page.style.setProperty('min-height', '0', 'important');
        page.style.setProperty('max-height', 'none', 'important');
        page.style.setProperty('overflow', 'visible', 'important');
        var naturalH = page.getBoundingClientRect().height;

        page.style.setProperty('height', '297mm', 'important');
        page.style.setProperty('min-height', '297mm', 'important');
        page.style.removeProperty('max-height');
        page.style.setProperty('overflow', 'hidden', 'important');
        var targetH = page.getBoundingClientRect().height;

        if (naturalH > targetH * 1.005) {
          var ratio = targetH / naturalH;
          if (ratio < 0.80) return; // too extreme — let it clip

          var pTop = 22, pBot = isCover ? 22 : 25, pH = 22;
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
          paginatePages();
          autoFitResidual();
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

  // ── Export to Microsoft Word ─────────────────────────────────────────────
  // Builds a .doc file (Word-compatible HTML) from the current preview and
  // triggers a download. Uses the standard "Word HTML" wrapper so MS Word
  // opens it natively with formatting, images and page breaks preserved.

  exportToWord() {
    const output = this.documentOutput;
    if (!output || !output.classList.contains('visible')) {
      alert('Please generate a document first before exporting to Word.');
      return;
    }

    // Collect page styles so the exported document keeps its look.
    const allStyles = Array.from(document.querySelectorAll('style'))
      .map(s => s.outerHTML)
      .join('\n');
    const allLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => l.outerHTML)
      .join('\n');

    // Resolve relative <img src> to absolute URLs (same reasoning as print).
    const cloned = output.cloneNode(true);
    cloned.querySelectorAll('img').forEach(img => {
      const absolute = img.src;
      if (absolute) img.setAttribute('src', absolute);
    });
    const docContent = cloned.innerHTML;

    // Word recognises this MIME-style header and the xmlns:w / xmlns:o
    // declarations, plus the <!--[if gte mso 9]> Word-only @page block which
    // sets A4 size and margins inside Word.
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>VDM Financial Statement</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  ${allLinks}
  ${allStyles}
  <style>
    @page WordSection1 {
      size: 210mm 297mm;
      margin: 22mm 22mm 25mm 22mm;
      mso-page-orientation: portrait;
    }
    div.WordSection1 { page: WordSection1; }
    body { font-family: Calibri, Arial, sans-serif; }
    .doc-page, .cover-page { page-break-after: always; }
    .doc-page:last-child, .cover-page:last-child { page-break-after: auto; }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${docContent}
  </div>
</body>
</html>`;

    // Word HTML files are best served as application/msword with a UTF-8 BOM
    // so non-ASCII characters render correctly when Word opens the file.
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'VDM-Financial-Statement.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── Live update (stub — generate on button) ─────────────────────────────

  liveUpdate() {
    this.generateDocFn();
  }
}
