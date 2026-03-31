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
}

// ── Initialise on load ──
entityManager.onReportTypeChange();
entityManager.addDirector();
entityManager.addDirector();
entityManager.buildPolicyChecklist();

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

// CalendarPicker
function toggleCal(calId)              { calendarPicker.toggleCal(calId); }

// PreviewManager
function togglePreview()               { previewManager.togglePreview(); }
function printDocument()               { previewManager.printDocument(); }

// ExcelImporter
function importSecInfo(input)          { excelImporter.importSecInfo(input); }
