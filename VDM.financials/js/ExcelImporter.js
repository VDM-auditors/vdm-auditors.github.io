// ExcelImporter.js — Dispatcher that detects entity type and delegates to BaseImporter
// Depends on: utils.js, config.js (IMPORTER_CONFIGS), BaseImporter.js

class ExcelImporter {
  constructor(entityManager) {
    this.em = entityManager;
  }

  setField(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  }

  importSecInfo(input) {
    const file = input.files[0];
    if (!file) return;
    const status = document.getElementById('import-status');
    status.style.display = 'block';
    status.style.color = 'var(--ink-light)';
    status.textContent = 'Reading file\u2026';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];

        function cell(ref) {
          const c = ws[ref];
          if (!c) return '';
          if (c.t === 'd' && c.v instanceof Date) {
            const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            return `${c.v.getDate()} ${months[c.v.getMonth()]} ${c.v.getFullYear()}`;
          }
          return (c.v != null ? String(c.v) : '').trim();
        }

        function fmtAddr(raw) {
          if (!raw) return '';
          return raw.replace(/\\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean).join(', ');
        }

        // Detect entity type from name (try all layout positions)
        const entityName = (cell('I8') || cell('H8') || cell('G8') || '').toUpperCase();

        let detectedType = 'company';
        if (/\(PTY\)|\bPTY\b|\(EDMS\)|\bEDMS\b|\bBPK\b|\bLTD\b|\bLIMITED\b/.test(entityName)) detectedType = 'company';
        else if (/\bCC\b|\bBK\b/.test(entityName)) detectedType = 'cc';
        else if (/\bTRUST\b/.test(entityName)) detectedType = 'trust';
        else if (/\bNPC\b|\bNPO\b/.test(entityName)) detectedType = 'npo';
        else if (/\bINC\b|\bINCORPORATED\b/.test(entityName)) detectedType = 'attorneys';
        else if (/\bSCHOOL\b|\bSKOOL\b/.test(entityName)) detectedType = 'school';
        else if (/\bBODY\s*CORPORATE\b/.test(entityName)) detectedType = 'bc';
        else if (/\bCHURCH\b|\bKERK\b|\bGEMEENTE\b/.test(entityName)) detectedType = 'church';
        else if (/\bCLUB\b/.test(entityName)) detectedType = 'club';

        const imported = BaseImporter.extract(detectedType, cell, fmtAddr, this.setField.bind(this), this.em);

        status.style.color = 'var(--success)';
        status.textContent = `Imported (${detectedType}): ${imported.join(', ')}.`;

        this.em.liveUpdate();
      } catch (err) {
        status.style.color = '#c0392b';
        status.textContent = 'Error reading file: ' + err.message;
        console.error('Import error:', err);
      }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  }
}
