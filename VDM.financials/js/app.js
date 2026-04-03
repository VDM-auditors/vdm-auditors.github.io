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

function _promptPage(totalPages) {
  const input = prompt(`Enter page number (1–${totalPages}), or "all" for every page:`, 'all');
  if (input === null) return null;
  const val = input.trim().toLowerCase();
  if (val === 'all' || val === '') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const n = parseInt(val);
  if (isNaN(n) || n < 1 || n > totalPages) {
    alert(`Invalid page number. Please enter a number between 1 and ${totalPages}.`);
    return null;
  }
  return [n - 1];
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

  if (selHeader) selHeader.addEventListener('change', function() {
    const val = this.value;
    this.selectedIndex = 0;
    const pages = _getPages();
    if (!pages) return;
    const idx = _promptPage(pages.length);
    if (!idx) return;

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

  if (selFooter) selFooter.addEventListener('change', function() {
    const val = this.value;
    this.selectedIndex = 0;
    const pages = _getPages();
    if (!pages) return;
    const idx = _promptPage(pages.length);
    if (!idx) return;

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
function insertSignatureSpace() {
  const pages = _getPages();
  if (!pages) return;
  const idx = _promptPage(pages.length);
  if (!idx) return;

  const nameVal = prompt('Name for signature line (leave blank for empty):','') ?? '';

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
