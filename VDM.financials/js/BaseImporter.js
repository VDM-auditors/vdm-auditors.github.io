// BaseImporter.js — Single data-driven importer that replaces all 9 entity-specific importers.
// Depends on: config.js (IMPORTER_CONFIGS), utils.js (mapSigner, parseName, calcPrevYearEnd, toTitleCase)

class BaseImporter {
  static extract(type, cell, fmtAddr, setField, em) {
    const cfg = IMPORTER_CONFIGS[type];
    if (!cfg) return [];
    const L = cfg.layout;

    // ── Entity name ──
    const entityName = cell(L.entityNameCell) || '';
    setField('companyName', entityName);

    // ── Registration number ──
    const regNo = cell(L.regNoCell) || '';
    if (!cfg.regOptional || regNo) setField('regNumber', regNo);

    // ── Year end ──
    const yearEndStr = cell(L.yearEndCell) || '';
    setField('yearEnd', yearEndStr);
    const prevYear = calcPrevYearEnd(yearEndStr);
    if (prevYear) setField('prevYearEnd', prevYear);

    // ── Nature of business ──
    if (cfg.importNature && L.natureCell) {
      const mainObj = cell(L.natureCell);
      if (mainObj && !/NO RESTRICTION/i.test(mainObj)) {
        setField('natureBusiness', mainObj.toLowerCase());
      }
    }

    // ── Addresses ──
    setField('postalAddress', fmtAddr(cell(L.postalCell)));
    setField('regAddress', fmtAddr(cell(L.regAddrCell)));
    setField('businessAddress', fmtAddr(cell(L.businessCell)));

    // ── Partner → VDM Signatory ──
    const signerVal = mapSigner(cell(L.partnerCell));
    if (signerVal) {
      const el = document.getElementById('compilerSigner');
      if (el) el.value = signerVal;
    }

    // ── Select entity type ──
    const ecCard = document.getElementById(cfg.ecId);
    if (ecCard) em.selectEntity(ecCard, type);

    // ── Directors / Trustees / Members ──
    document.getElementById('directors-list').innerHTML = '';
    em.directors = [];
    em.directorCount = 0;

    let headerRow = 0;
    for (let r = L.headerSearchStart; r <= L.headerSearchEnd; r++) {
      const val = cell(L.headerCol + r);
      if (val && cfg.headerPattern.test(val.trim())) {
        headerRow = r;
        break;
      }
    }

    let peopleImported = 0;
    if (headerRow) {
      let dataRow = headerRow + 2;
      while (dataRow < headerRow + 20) {
        const name = cell(L.nameCol + dataRow);
        if (!name) break;
        if (cfg.stopPattern && cfg.stopPattern.test(name.trim())) break;

        const { initials, surname } = parseName(name);
        const idNo = cell(L.idCol + dataRow) || '';

        em.addDirector();
        const idx = em.directorCount;
        setField(`dir-init-${idx}`, initials);
        setField(`dir-sur-${idx}`, surname);
        setField(`dir-id-${idx}`, idNo);
        peopleImported++;
        dataRow++;
      }
    }

    // ── Shareholders (company only) ──
    if (cfg.importShareholders) {
      document.getElementById('shareholder-list').innerHTML = '';
      em.shareholderCount = 0;

      let shHeaderRow = 0;
      for (let r = 40; r <= 80; r++) {
        const val = cell('C' + r) || cell('D' + r);
        if (val && /^(ORDINARY\s+)?SHARE\s*HOLDERS?$/i.test(val.trim())) {
          shHeaderRow = r;
          break;
        }
      }

      if (shHeaderRow) {
        let shRow = shHeaderRow + 2;
        while (shRow < shHeaderRow + 30) {
          const shName = cell('C' + shRow) || cell('D' + shRow);
          if (!shName) break;
          if (/^(ORDINARY|PREFERENCE)\s+SHARE/i.test(shName.trim()) || /^\d+$/.test(shName.trim())) {
            shRow++;
            continue;
          }
          em.addShareholder();
          const idx = em.shareholderCount;
          setField(`sh-name-${idx}`, toTitleCase(shName));
          if (/\bPTY\b|\bLTD\b|\bCC\b|\bTRUST\b|\bINC\b/i.test(shName)) {
            const radio = document.querySelector(`input[name="sh-type-${idx}"][value="entity"]`);
            if (radio) { radio.checked = true; em.onShareholderTypeChange(idx); }
          }
          shRow++;
        }
      }
    }

    // ── Summary ──
    const imported = [];
    if (entityName) imported.push(cfg.labels.name);
    if (regNo) imported.push(cfg.labels.reg);
    if (yearEndStr) imported.push('year end');
    if (fmtAddr(cell(L.postalCell))) imported.push('postal address');
    if (fmtAddr(cell(L.regAddrCell))) imported.push('registered address');
    if (peopleImported > 0) imported.push(peopleImported + ' ' + cfg.labels.people);
    if (cfg.importShareholders && em.shareholderCount > 0) imported.push(em.shareholderCount + ' shareholder(s)');
    return imported;
  }
}
