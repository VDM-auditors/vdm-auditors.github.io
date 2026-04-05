// app.js — Initialisation: creates instances, wires up globals
// Depends on: config.js, utils.js, EntityManager.js, CalendarPicker.js,
//             DocumentGenerator.js, PreviewManager.js, ExcelImporter.js

// ── Live update stub (triggers on generate) ──
function liveUpdate() { /* update on generate */ }

// ── Create instances ──
const entityManager = new EntityManager(liveUpdate);

const CAL_CONFIG = createCalConfig({
  autoFillPrevYear: () => entityManager.autoFillPrevYear(),
  liveUpdate: liveUpdate
});
const calendarPicker = new CalendarPicker(CAL_CONFIG);

const documentGenerator = new DocumentGenerator(entityManager);

const previewManager = new PreviewManager({
  appContainer:   document.getElementById('app-container'),
  toggleBar:      document.getElementById('mode-toggle-bar'),
  toggleLabel:    document.getElementById('toggle-label'),
  modeLabel:      document.getElementById('mode-label'),
  documentOutput: document.getElementById('document-output'),
  previewPanel:   document.querySelector('.preview-panel')
}, generateDoc);

const excelImporter = new ExcelImporter(entityManager);

// ── Generate & preview ──
function generateAndPreview() {
  generateDoc();
  previewManager.previewVisible = true;
  previewManager._applyPreviewMode();
}

function generateDoc() {
  const html = documentGenerator.generate();
  const output = document.getElementById('document-output');
  const placeholder = document.getElementById('placeholder');
  if (output) {
    output.innerHTML = html;
    output.classList.add('visible');
  }
  if (placeholder) placeholder.style.display = 'none';
  document.getElementById('btn-print')?.classList.add('visible');
  // Reset edit mode — preview is read-only until user clicks Edit Preview
  const btnEdit = document.getElementById('btn-edit-preview');
  if (btnEdit) {
    btnEdit.classList.add('visible');
    btnEdit.classList.remove('active');
    btnEdit.textContent = '✏️ Edit Preview';
  }
  document.getElementById('edit-toolbar')?.classList.remove('visible');
}

function toggleEditPreview() {
  const output = document.getElementById('document-output');
  const btn = document.getElementById('btn-edit-preview');
  const toolbar = document.getElementById('edit-toolbar');
  if (!output || !btn) return;
  const pages = output.querySelectorAll('.doc-page, .cover-page');
  const isEditing = btn.classList.contains('active');
  if (isEditing) {
    // Turn OFF editing
    pages.forEach(p => p.removeAttribute('contenteditable'));
    btn.classList.remove('active');
    btn.textContent = '✏️ Edit Preview';
    toolbar?.classList.remove('visible');
  } else {
    // Turn ON editing
    pages.forEach(p => p.setAttribute('contenteditable', 'true'));
    btn.classList.add('active');
    btn.textContent = '✏️ Stop Editing';
    toolbar?.classList.add('visible');
  }
}

// ── Formatting toolbar commands ──
function execFmt(command) {
  document.execCommand(command, false, null);
}
function execFmtVal(command, value) {
  if (value) document.execCommand(command, false, value);
}

// ── Format Painter ──
let _fmtPainterStyles = null;

function toggleFormatPainter() {
  const btn = document.getElementById('btn-fmt-painter');
  if (_fmtPainterStyles) {
    // Cancel
    _fmtPainterStyles = null;
    btn.classList.remove('tb-active');
    document.getElementById('document-output')?.classList.remove('fmt-painter-cursor');
    return;
  }
  // Capture styles from current selection
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) {
    alert('Select some text first to copy its formatting.');
    return;
  }
  const node = sel.anchorNode?.parentElement;
  if (!node) return;
  const cs = window.getComputedStyle(node);
  _fmtPainterStyles = {
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    textDecoration: cs.textDecoration,
    fontSize: cs.fontSize,
    color: cs.color
  };
  btn.classList.add('tb-active');
  document.getElementById('document-output')?.classList.add('fmt-painter-cursor');

  // Listen for the next mouseup inside the preview to apply
  const output = document.getElementById('document-output');
  output.addEventListener('mouseup', function applyPaint() {
    output.removeEventListener('mouseup', applyPaint);
    const s = window.getSelection();
    if (!s.rangeCount || s.isCollapsed || !_fmtPainterStyles) {
      _fmtPainterStyles = null;
      btn.classList.remove('tb-active');
      output.classList.remove('fmt-painter-cursor');
      return;
    }
    const range = s.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontWeight = _fmtPainterStyles.fontWeight;
    span.style.fontStyle = _fmtPainterStyles.fontStyle;
    span.style.textDecoration = _fmtPainterStyles.textDecoration;
    span.style.fontSize = _fmtPainterStyles.fontSize;
    span.style.color = _fmtPainterStyles.color;
    range.surroundContents(span);
    _fmtPainterStyles = null;
    btn.classList.remove('tb-active');
    output.classList.remove('fmt-painter-cursor');
  });
}

// ── Page number toggle ──
function togglePageNumbers() {
  const output = document.getElementById('document-output');
  const btn = document.getElementById('btn-page-numbers');
  if (!output) return;
  const isShowing = btn.classList.contains('tb-active');
  const nums = output.querySelectorAll('.page-number');
  if (isShowing) {
    nums.forEach(el => el.style.display = 'none');
    btn.classList.remove('tb-active');
  } else {
    nums.forEach(el => el.style.display = 'block');
    btn.classList.add('tb-active');
  }
}

// ── Undo / Redo with snapshot fallback for DOM mutations ──
let _undoStack = [];
let _redoStack = [];

function _saveSnapshot() {
  const output = document.getElementById('document-output');
  if (!output) return;
  _undoStack.push(output.innerHTML);
  if (_undoStack.length > 30) _undoStack.shift(); // cap memory
  _redoStack = [];
}

function toolbarUndo() {
  const output = document.getElementById('document-output');
  if (!output) return;
  // Try native undo first
  if (document.queryCommandEnabled('undo')) {
    document.execCommand('undo', false, null);
  }
  // Fallback: snapshot undo
  if (_undoStack.length) {
    _redoStack.push(output.innerHTML);
    output.innerHTML = _undoStack.pop();
    // Re-enable contenteditable on restored pages
    output.querySelectorAll('.doc-page, .cover-page').forEach(p => p.setAttribute('contenteditable', 'true'));
  }
}

function toolbarRedo() {
  const output = document.getElementById('document-output');
  if (!output) return;
  if (document.queryCommandEnabled('redo')) {
    document.execCommand('redo', false, null);
  }
  if (_redoStack.length) {
    _undoStack.push(output.innerHTML);
    output.innerHTML = _redoStack.pop();
    output.querySelectorAll('.doc-page, .cover-page').forEach(p => p.setAttribute('contenteditable', 'true'));
  }
}

// ── Letterhead & Footer insertion ──
function _getPages() {
  const output = document.getElementById('document-output');
  if (!output) return null;
  const pages = output.querySelectorAll('.doc-page, .cover-page');
  return pages.length ? pages : null;
}

// ── Styled input modal (replaces browser prompt) ──
function _styledPrompt(title, hint, placeholder) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'ps-input-overlay';
    overlay.innerHTML = `
      <div class="ps-input-modal">
        <h3>${title}</h3>
        <p class="ps-input-hint">${hint || ''}</p>
        <input type="text" placeholder="${placeholder || ''}" autofocus>
        <div class="ps-actions">
          <button class="ps-btn ps-btn-cancel">Cancel</button>
          <button class="ps-btn ps-btn-apply">OK</button>
        </div>
      </div>`;

    const input = overlay.querySelector('input');
    const apply = () => { const v = input.value; overlay.remove(); resolve(v); };
    const cancel = () => { overlay.remove(); resolve(null); };

    overlay.querySelector('.ps-btn-apply').addEventListener('click', apply);
    overlay.querySelector('.ps-btn-cancel').addEventListener('click', cancel);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') apply(); if (e.key === 'Escape') cancel(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) cancel(); });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => input.focus());
  });
}

// ── Visual page selector (replaces old prompt) ──
function _selectPages(pages, actionLabel) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'page-selector-overlay';

    // Build page label for each card
    function _pageLabel(page, i) {
      const h2 = page.querySelector('h2');
      if (h2) return h2.textContent.trim().substring(0, 22);
      if (page.classList.contains('cover-page')) return 'Cover Page';
      return 'Page ' + (i + 1);
    }

    const selected = new Set();

    function render() {
      const cards = overlay.querySelectorAll('.ps-page-card');
      cards.forEach(c => {
        const idx = +c.dataset.idx;
        c.classList.toggle('selected', selected.has(idx));
      });
      overlay.querySelector('.ps-btn-apply').disabled = selected.size === 0;
      // highlight pages in preview
      Array.from(pages).forEach((p, i) => {
        p.classList.toggle('page-selected-glow', selected.has(i));
      });
    }

    function cleanup() {
      Array.from(pages).forEach(p => p.classList.remove('page-selected-glow'));
      overlay.remove();
    }

    // Build cards with thumbnail placeholders
    let gridHTML = '';
    for (let i = 0; i < pages.length; i++) {
      gridHTML += `<div class="ps-page-card" data-idx="${i}">
        <div class="ps-thumb-wrap" data-thumb-idx="${i}"></div>
        <div class="ps-card-footer">
          <span class="ps-card-num">${i + 1}</span>
          <span class="ps-card-label">${_pageLabel(pages[i], i)}</span>
        </div>
      </div>`;
    }

    overlay.innerHTML = `
      <div class="page-selector-modal">
        <h3>${actionLabel || 'Select Pages'}</h3>
        <p class="ps-subtitle">Click pages to select, then apply</p>
        <div class="ps-grid">${gridHTML}</div>
        <div class="ps-actions">
          <button class="ps-select-all">Select All</button>
          <button class="ps-btn ps-btn-cancel">Cancel</button>
          <button class="ps-btn ps-btn-apply" disabled>Apply</button>
        </div>
      </div>`;

    // Render mini thumbnails by cloning pages
    requestAnimationFrame(() => {
      overlay.querySelectorAll('.ps-thumb-wrap').forEach(wrap => {
        const idx = +wrap.dataset.thumbIdx;
        const page = pages[idx];
        const clone = page.cloneNode(true);
        clone.removeAttribute('contenteditable');
        clone.classList.remove('page-selected-glow');

        // Measure thumb container
        const wrapW = wrap.offsetWidth || 120;
        const pageW = page.offsetWidth || 740;
        const scale = wrapW / pageW;

        clone.style.cssText = `
          width: ${pageW}px;
          min-height: auto;
          margin: 0;
          padding: 20px 24px;
          box-shadow: none;
          pointer-events: none;
          font-size: 9.5pt;
          line-height: 1.4;
          position: absolute;
          top: 0; left: 0;
          transform: scale(${scale});
          transform-origin: top left;
        `;
        clone.className = page.className + ' ps-thumb-inner';
        wrap.appendChild(clone);
      });
    });

    // Card clicks
    overlay.querySelectorAll('.ps-page-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = +card.dataset.idx;
        if (selected.has(idx)) selected.delete(idx); else selected.add(idx);
        render();
      });
    });

    // Select All
    overlay.querySelector('.ps-select-all').addEventListener('click', () => {
      if (selected.size === pages.length) {
        selected.clear();
      } else {
        for (let i = 0; i < pages.length; i++) selected.add(i);
      }
      render();
    });

    // Cancel
    overlay.querySelector('.ps-btn-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    // Apply
    overlay.querySelector('.ps-btn-apply').addEventListener('click', () => {
      const result = Array.from(selected).sort((a, b) => a - b);
      cleanup();
      resolve(result);
    });

    // Close on overlay background click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { cleanup(); resolve(null); }
    });

    document.body.appendChild(overlay);
    render();
  });
}

function _applyHeaderImage(src, pageIndices, pages) {
  _saveSnapshot();
  pageIndices.forEach(idx => {
    const page = pages[idx];
    const existing = page.querySelector('.letterhead-img');
    if (existing) {
      existing.src = src;
    } else {
      const img = document.createElement('img');
      img.className = 'letterhead-img';
      img.src = src;
      img.alt = 'Letterhead';
      page.insertBefore(img, page.firstChild);
    }
  });
}

function _applyFooterImage(src, pageIndices, pages) {
  _saveSnapshot();
  pageIndices.forEach(idx => {
    const page = pages[idx];
    const existing = page.querySelector('.letterhead-footer-img');
    if (existing) {
      existing.src = src;
    } else {
      let footer = page.querySelector('.letterhead-footer');
      if (!footer) {
        footer = document.createElement('div');
        footer.className = 'letterhead-footer';
        page.appendChild(footer);
      }
      const img = document.createElement('img');
      img.className = 'letterhead-footer-img';
      img.src = src;
      img.alt = 'Footer';
      footer.innerHTML = '';
      footer.appendChild(img);
    }
  });
}

// Wire up the header/footer dropdowns
document.addEventListener('DOMContentLoaded', () => {
  const selHeader = document.getElementById('sel-header');
  const selFooter = document.getElementById('sel-footer');
  const uploadHeader = document.getElementById('upload-header');
  const uploadFooter = document.getElementById('upload-footer');

  if (selHeader) selHeader.addEventListener('change', async function() {
    const val = this.value;
    this.selectedIndex = 0;
    const pages = _getPages();
    if (!pages) return;
    const idx = await _selectPages(pages, 'Insert Letterhead');
    if (!idx || !idx.length) return;

    if (val === '__upload') {
      uploadHeader.onchange = function() {
        if (!this.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => _applyHeaderImage(e.target.result, idx, pages);
        reader.readAsDataURL(this.files[0]);
        this.value = '';
      };
      uploadHeader.click();
    } else {
      _applyHeaderImage(val, idx, pages);
    }
  });

  if (selFooter) selFooter.addEventListener('change', async function() {
    const val = this.value;
    this.selectedIndex = 0;
    const pages = _getPages();
    if (!pages) return;
    const idx = await _selectPages(pages, 'Insert Footer');
    if (!idx || !idx.length) return;

    if (val === '__upload') {
      uploadFooter.onchange = function() {
        if (!this.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => _applyFooterImage(e.target.result, idx, pages);
        reader.readAsDataURL(this.files[0]);
        this.value = '';
      };
      uploadFooter.click();
    } else {
      _applyFooterImage(val, idx, pages);
    }
  });
});

// ── Insert Signature Space ──
async function insertSignatureSpace() {
  const pages = _getPages();
  if (!pages) return;
  const idx = await _selectPages(pages, 'Insert Signature');
  if (!idx || !idx.length) return;

  const nameVal = await _styledPrompt(
    'Signature Line',
    'Enter a name to display below the line, or leave blank.',
    'e.g. J. van der Merwe'
  ) ?? '';

  _saveSnapshot();
  idx.forEach(i => {
    const page = pages[i];
    const sigHtml = document.createElement('div');
    sigHtml.className = 'signature-block';
    sigHtml.innerHTML = `
      <div style="min-height:50px;"></div>
      <div style="border-bottom:1px solid #333;width:220px;margin-bottom:6px;">&nbsp;</div>
      <div class="sig-name">${nameVal || '&nbsp;'}</div>`;
    // Insert before footer if present, otherwise at end
    const footer = page.querySelector('.letterhead-footer');
    if (footer) {
      page.insertBefore(sigHtml, footer);
    } else {
      page.appendChild(sigHtml);
    }
  });
}

// ── Upload Word Document ──
function uploadWordDoc() {
  const output = document.getElementById('document-output');
  if (!output) { alert('Generate a document first before importing.'); return; }

  const fileInput = document.getElementById('upload-word');
  fileInput.onchange = async function () {
    const file = this.files[0];
    if (!file) return;
    this.value = '';

    // Show loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-selector-overlay';
    overlay.innerHTML = `
      <div class="page-selector-modal" style="text-align:center;">
        <div class="ps-upload-status">
          <div class="ps-spinner"></div>
          <p>Importing <strong>${file.name}</strong>…</p>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer }, {
        styleMap: [
          "p[style-name='Heading 1'] => h2:fresh",
          "p[style-name='Heading 2'] => h3:fresh",
          "p[style-name='Heading 3'] => h4:fresh"
        ]
      });

      const html = result.value;
      if (!html || !html.trim()) {
        overlay.remove();
        alert('The document appears to be empty or could not be read.');
        return;
      }

      _saveSnapshot();

      // Split content into pages at <h2> boundaries or create a single page
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const sections = [];
      let currentSection = [];

      wrapper.childNodes.forEach(node => {
        if (node.nodeName === 'H2' && currentSection.length > 0) {
          sections.push(currentSection);
          currentSection = [];
        }
        currentSection.push(node);
      });
      if (currentSection.length) sections.push(currentSection);

      // Count existing pages for numbering
      const existingPages = output.querySelectorAll('.doc-page, .cover-page');
      let pageNum = existingPages.length + 1;

      sections.forEach(nodes => {
        const page = document.createElement('div');
        page.className = 'doc-page';
        nodes.forEach(n => page.appendChild(n.cloneNode(true)));

        // Add page number
        const pgNum = document.createElement('div');
        pgNum.className = 'page-number';
        pgNum.textContent = pageNum++;
        page.appendChild(pgNum);

        // If in edit mode, make editable
        const editBtn = document.getElementById('btn-edit-preview');
        if (editBtn && editBtn.classList.contains('active')) {
          page.setAttribute('contenteditable', 'true');
        }

        output.appendChild(page);
      });

      overlay.remove();
    } catch (err) {
      overlay.remove();
      console.error('Word import error:', err);
      alert('Failed to import the document. Please ensure it is a valid .docx file.');
    }
  };
  fileInput.click();
}

// ── Reorder Pages (Drag & Drop) ──
function reorderPages() {
  const output = document.getElementById('document-output');
  if (!output) return;
  const pages = output.querySelectorAll('.doc-page, .cover-page');
  if (!pages.length) { alert('No pages to reorder. Generate a document first.'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'page-selector-overlay';

  function _pageLabel(page, i) {
    const h2 = page.querySelector('h2');
    if (h2) return h2.textContent.trim().substring(0, 22);
    if (page.classList.contains('cover-page')) return 'Cover Page';
    return 'Page ' + (i + 1);
  }

  // Build ordered list of page references
  const pageOrder = Array.from(pages);

  function buildGrid() {
    let html = '';
    pageOrder.forEach((page, i) => {
      html += `<div class="reorder-card" data-reorder-idx="${i}" draggable="true">
        <div class="ps-thumb-wrap" data-reorder-thumb="${i}"></div>
        <div class="reorder-footer">
          <span class="reorder-num">${i + 1}</span>
          <span class="reorder-label">${_pageLabel(page, i)}</span>
          <span class="reorder-grip">⠿</span>
        </div>
      </div>`;
    });
    return html;
  }

  overlay.innerHTML = `
    <div class="page-selector-modal">
      <h3>Reorder Pages</h3>
      <p class="ps-subtitle">Drag and drop pages to reorder them</p>
      <div class="reorder-grid" id="reorder-grid">${buildGrid()}</div>
      <div class="ps-actions">
        <button class="ps-btn ps-btn-cancel">Cancel</button>
        <button class="ps-btn ps-btn-apply">Apply Order</button>
      </div>
    </div>`;

  const grid = overlay.querySelector('#reorder-grid');
  let dragIdx = null;

  function renderThumbs() {
    overlay.querySelectorAll('.ps-thumb-wrap[data-reorder-thumb]').forEach(wrap => {
      const idx = +wrap.dataset.reorderThumb;
      const page = pageOrder[idx];
      if (!page || wrap.childElementCount) return;
      const clone = page.cloneNode(true);
      clone.removeAttribute('contenteditable');
      clone.classList.remove('page-selected-glow');
      const wrapW = wrap.offsetWidth || 130;
      const pageW = page.offsetWidth || 740;
      const scale = wrapW / pageW;
      clone.style.cssText = `
        width: ${pageW}px; min-height:auto; margin:0;
        padding:20px 24px; box-shadow:none; pointer-events:none;
        font-size:9.5pt; line-height:1.4;
        position:absolute; top:0; left:0;
        transform:scale(${scale}); transform-origin:top left;
      `;
      clone.className = page.className + ' ps-thumb-inner';
      wrap.appendChild(clone);
    });
  }

  function rebuildGridDOM() {
    grid.innerHTML = buildGrid();
    attachDragListeners();
    requestAnimationFrame(renderThumbs);
  }

  function attachDragListeners() {
    const cards = grid.querySelectorAll('.reorder-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', e => {
        dragIdx = +card.dataset.reorderIdx;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox
        e.dataTransfer.setData('text/plain', dragIdx);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        grid.querySelectorAll('.reorder-card').forEach(c => c.classList.remove('drag-over'));
        dragIdx = null;
      });

      card.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const targetIdx = +card.dataset.reorderIdx;
        if (targetIdx !== dragIdx) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const targetIdx = +card.dataset.reorderIdx;
        if (dragIdx === null || dragIdx === targetIdx) return;

        // Swap in the order array
        const moved = pageOrder.splice(dragIdx, 1)[0];
        pageOrder.splice(targetIdx, 0, moved);
        dragIdx = null;
        rebuildGridDOM();
      });
    });

    // Touch support for mobile
    let touchDragIdx = null;
    let touchClone = null;
    let touchTarget = null;

    cards.forEach(card => {
      card.addEventListener('touchstart', e => {
        touchDragIdx = +card.dataset.reorderIdx;
        card.classList.add('dragging');

        // Create visual drag clone
        touchClone = card.cloneNode(true);
        touchClone.style.cssText = `
          position:fixed; z-index:99999; pointer-events:none;
          width:${card.offsetWidth}px; opacity:0.85;
          transform:rotate(2deg); box-shadow:0 8px 24px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(touchClone);
        const t = e.touches[0];
        touchClone.style.left = (t.clientX - card.offsetWidth / 2) + 'px';
        touchClone.style.top = (t.clientY - 40) + 'px';
      }, { passive: true });

      card.addEventListener('touchmove', e => {
        if (touchClone) {
          const t = e.touches[0];
          touchClone.style.left = (t.clientX - touchClone.offsetWidth / 2) + 'px';
          touchClone.style.top = (t.clientY - 40) + 'px';

          // Find card under touch
          const el = document.elementFromPoint(t.clientX, t.clientY);
          const targetCard = el?.closest('.reorder-card');
          grid.querySelectorAll('.reorder-card').forEach(c => c.classList.remove('drag-over'));
          if (targetCard && +targetCard.dataset.reorderIdx !== touchDragIdx) {
            targetCard.classList.add('drag-over');
            touchTarget = +targetCard.dataset.reorderIdx;
          } else {
            touchTarget = null;
          }
        }
        e.preventDefault();
      }, { passive: false });

      card.addEventListener('touchend', () => {
        if (touchClone) {
          touchClone.remove();
          touchClone = null;
        }
        grid.querySelectorAll('.reorder-card').forEach(c => {
          c.classList.remove('dragging');
          c.classList.remove('drag-over');
        });
        if (touchDragIdx !== null && touchTarget !== null && touchDragIdx !== touchTarget) {
          const moved = pageOrder.splice(touchDragIdx, 1)[0];
          pageOrder.splice(touchTarget, 0, moved);
          rebuildGridDOM();
        }
        touchDragIdx = null;
        touchTarget = null;
      });
    });
  }

  // Cancel
  overlay.querySelector('.ps-btn-cancel').addEventListener('click', () => overlay.remove());

  // Apply
  overlay.querySelector('.ps-btn-apply').addEventListener('click', () => {
    _saveSnapshot();

    // Re-append pages in new order
    pageOrder.forEach((page, i) => {
      output.appendChild(page);
      // Update page numbers
      const pgNum = page.querySelector('.page-number');
      if (pgNum) pgNum.textContent = i + 1;
    });

    overlay.remove();
  });

  // Close on background click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  attachDragListeners();
  requestAnimationFrame(renderThumbs);
}

// ── Toolbar Help ──
function showToolbarHelp() {
  const overlay = document.createElement('div');
  overlay.className = 'page-selector-overlay';
  overlay.innerHTML = `
    <div class="help-modal">
      <h3>Toolbar Guide</h3>
      <p class="help-subtitle">A quick overview of every tool available in the editing toolbar</p>

      <div class="help-section">
        <div class="help-section-title">Text Formatting</div>

        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text" style="font-weight:900;">B</span></div>
          <div class="help-text"><strong>Bold</strong><span>Make selected text bold</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text" style="font-style:italic;">I</span></div>
          <div class="help-text"><strong>Italic</strong><span>Italicise selected text</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text" style="text-decoration:underline;">U</span></div>
          <div class="help-text"><strong>Underline</strong><span>Underline selected text</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text" style="text-decoration:line-through;">S</span></div>
          <div class="help-text"><strong>Strikethrough</strong><span>Strike through selected text</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 3H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M12 9v4"/><path d="M8 17h8l-4 4-4-4z"/></svg>
          </div>
          <div class="help-text"><strong>Format Painter</strong><span>Copy formatting from one selection and apply it to another. Click once to activate, then select target text.</span></div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">Alignment &amp; Size</div>

        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          </div>
          <div class="help-text"><strong>Align Left</strong><span>Align selected text to the left margin</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </div>
          <div class="help-text"><strong>Align Centre</strong><span>Centre-align selected text</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <div class="help-text"><strong>Justify</strong><span>Justify text so it aligns evenly on both left and right margins</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text">Aa</span></div>
          <div class="help-text"><strong>Font Size</strong><span>Change the font size of selected text. Choose from 8pt, 10pt, 12pt, 14pt, 18pt, or 24pt.</span></div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">Document Elements</div>

        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text">Hdr</span></div>
          <div class="help-text"><strong>Insert Letterhead</strong><span>Add a letterhead image to the top of selected pages. Choose a preset (CA or Audit) or upload your own image.</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text">Ftr</span></div>
          <div class="help-text"><strong>Insert Footer</strong><span>Add a footer image to the bottom of selected pages. Choose a preset (CA or Audit) or upload your own image.</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon"><span class="help-icon-text" style="font-weight:900;">#</span></div>
          <div class="help-text"><strong>Page Numbers</strong><span>Toggle page numbers on or off at the bottom of each page</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18.5l3.5-3.5c.83-.83 2.17-.83 3 0s.83 2.17 0 3L6 21.5H3v-3z"/><line x1="2" y1="22" x2="22" y2="22"/></svg>
          </div>
          <div class="help-text"><strong>Signature Line</strong><span>Insert a signature block with an optional name label on selected pages. Placed above the footer if one exists.</span></div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">Pages</div>

        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
          </div>
          <div class="help-text"><strong>Import Word Document</strong><span>Upload a .docx file to append its content as new pages at the end of the document. Headings are used to split content into separate pages.</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><path d="M17 8h2a1 1 0 0 1 1 1v2"/><polyline points="20 8 17 8 17 5"/><path d="M7 16H5a1 1 0 0 0-1 1v2"/><polyline points="4 16 7 16 7 19"/></svg>
          </div>
          <div class="help-text"><strong>Reorder Pages</strong><span>Open a visual page sorter. Drag and drop page thumbnails to rearrange them, then click Apply to confirm the new order.</span></div>
        </div>
      </div>

      <div class="help-section">
        <div class="help-section-title">History</div>

        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </div>
          <div class="help-text"><strong>Undo</strong><span>Reverse the last change you made to the document</span></div>
        </div>
        <div class="help-row">
          <div class="help-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
          </div>
          <div class="help-text"><strong>Redo</strong><span>Re-apply a change that was undone</span></div>
        </div>
      </div>

      <div class="help-close-wrap">
        <button class="ps-btn ps-btn-apply" id="help-close-btn">Got it</button>
      </div>
    </div>`;

  overlay.querySelector('#help-close-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── Initialise on load ──
entityManager.onReportTypeChange();
entityManager.addDirector();
entityManager.addDirector();
entityManager.buildPolicyChecklist();
entityManager.onCompilerSignerChange();

document.addEventListener('DOMContentLoaded', () => {
  entityManager.onCompilerSignerChange();
});

// Wire bank "Other" live input
document.addEventListener('input', function (e) {
  if (e.target.id === 'bankOther') {
    document.getElementById('bankName').value = e.target.value;
    liveUpdate();
  }
});

// Init calendar close-on-click-outside
calendarPicker.init();

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL WRAPPERS — bridge inline onclick/onchange handlers to class instances
// ══════════════════════════════════════════════════════════════════════════════

// EntityManager — entity switching & form controls
function selectEntity(el, type)        { entityManager.selectEntity(el, type); }
function toggleAttReg()                { entityManager.toggleAttReg(); }
function autoFillPrevYear()            { entityManager.autoFillPrevYear(); }
function updateBank()                  { entityManager.updateBank(); }
function updateDividend()              { entityManager.updateDividend(); }
function updateParent()                { entityManager.updateParent(); }
function onTradingAsToggle()           { entityManager.onTradingAsToggle(); }
function onCompilerSignerChange()      { entityManager.onCompilerSignerChange(); }

// EntityManager — directors, shareholders, loan certs
function addDirector()                 { entityManager.addDirector(); }
function removeDirector(id)            { entityManager.removeDirector(id); }
function addShareholder()              { entityManager.addShareholder(); }
function removeShareholder(idx)        { entityManager.removeShareholder(idx); }
function onShareholderTypeChange(idx)  { entityManager.onShareholderTypeChange(idx); }
function addLoanCert()                 { entityManager.addLoanCert(); }
function removeLoanCert(idx)           { entityManager.removeLoanCert(idx); }

// EntityManager — report type & sub-option handlers
function onReportTypeChange()          { entityManager.onReportTypeChange(); }
function onAuditTypeChange()           { entityManager.onAuditTypeChange(); }
function onSchoolAuditTypeChange()     { entityManager.onSchoolAuditTypeChange(); }
function onAttOpinionTypeChange()      { entityManager.onAttOpinionTypeChange(); }
function onReviewTypeChange()          { entityManager.onReviewTypeChange(); }
function onReviewQualifiedBasisChange(){ entityManager.onReviewQualifiedBasisChange(); }
function onCompilationTypeChange()     { entityManager.onCompilationTypeChange(); }

// EntityManager — preparer & school preparer
function updatePreparerPreview()           { entityManager.updatePreparerPreview(); }
function onPreparerCapacityChange()        { entityManager.onPreparerCapacityChange(); }
function updateSchoolPreparerPreview()     { entityManager.updateSchoolPreparerPreview(); }
function onSchoolPreparerCapacityChange()  { entityManager.onSchoolPreparerCapacityChange(); }

// EntityManager — engagement letter
function toggleEngagementTypes()       { entityManager.toggleEngagementTypes(); }
function onEngagementTypesChange()     { entityManager.onEngagementTypesChange(); }
function onEngagementSignerChange(selectId) { entityManager.onEngagementSignerChange(selectId); }

// EntityManager — body corporate & trust
function onBcEventsChange()            { entityManager.onBcEventsChange(); }
function onBcMgmtRulesChange()         { entityManager.onBcMgmtRulesChange(); }
function onTrustDeedChange()           { entityManager.onTrustDeedChange(); }

// Church Step 7 toggle
function toggleChurchStep7() {
  const hide = document.querySelector('input[name="churchPolicies"]:checked')?.value === 'no';
  document.getElementById('step7-block').style.display = hide ? 'none' : '';
  document.getElementById('step7-divider').style.display = hide ? 'none' : '';
}

// EntityManager — accounting policies
function selectAllPolicies(checked)    { entityManager.selectAllPolicies(checked); }
function togglePolicy(id)              { entityManager.togglePolicy(id); }
function onSubItemChange(sid)          { entityManager.onSubItemChange(sid); }
function onRateSelect(sid)             { entityManager.onRateSelect(sid); }
function onPpeResidualToggle()         { entityManager.onPpeResidualToggle(); }

// CalendarPicker
function toggleCal(calId)              { calendarPicker.toggleCal(calId); }

// PreviewManager
function togglePreview()               { previewManager.togglePreview(); }
function printDocument()               { previewManager.printDocument(); }

// ExcelImporter
function importSecInfo(input)          { excelImporter.importSecInfo(input); }
