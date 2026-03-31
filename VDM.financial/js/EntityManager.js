// EntityManager.js — Manages directors, shareholders, loan certs, entity switching
// Depends on: config.js (ENTITY_CONFIG, accountingPolicies), utils.js (getVal, getRadio, toggleVisible, toTitleCase)

class EntityManager {
  constructor(liveUpdate) {
    this.liveUpdate = liveUpdate;

    // ── State ──
    this.directors = [];
    this.directorCount = 0;
    this.currentEntityType = '';
    this.loanCertCount = 0;
    this.shareholderCount = 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DIRECTOR FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  addDirector() {
    this.directorCount++;
    const id = this.directorCount;
    this.directors.push({ id, initials: '', surname: '' });

    const list = document.getElementById('directors-list');
    const entry = document.createElement('div');
    entry.className = 'director-entry';
    entry.id = `dir-entry-${id}`;
    entry.innerHTML = `
    <div class="field-group" style="margin-bottom:0">
      <label style="margin-bottom:4px">Initials</label>
      <input type="text" id="dir-init-${id}" placeholder="e.g. LJ" oninput="liveUpdate()" style="margin-bottom:0" autocomplete="off">
    </div>
    <div class="field-group" style="margin-bottom:0">
      <label style="margin-bottom:4px">Surname</label>
      <input type="text" id="dir-sur-${id}" placeholder="e.g. Mthembu" oninput="liveUpdate()" style="margin-bottom:0" autocomplete="off">
    </div>
    <button class="btn-remove" onclick="removeDirector(${id})" title="Remove">\u00d7</button>
    <div class="field-group" style="margin-bottom:0; grid-column:1/-1;">
      <label style="margin-bottom:4px">ID Number (optional)</label>
      <input type="text" id="dir-id-${id}" placeholder="e.g. 600124 5672 08 6" oninput="formatIdNumber(this); liveUpdate()" style="margin-bottom:0" autocomplete="off" maxlength="16">
    </div>
  `;
    list.appendChild(entry);
  }

  removeDirector(id) {
    this.directors = this.directors.filter(d => d.id !== id);
    document.getElementById(`dir-entry-${id}`)?.remove();
    this.liveUpdate();
  }

  getDirectors() {
    return this.directors.map(d => {
      const init = (document.getElementById(`dir-init-${d.id}`)?.value || '').trim().toUpperCase();
      const sur = toTitleCase((document.getElementById(`dir-sur-${d.id}`)?.value || '').trim());
      const idNo = (document.getElementById(`dir-id-${d.id}`)?.value || '').trim();
      return { init, sur, full: init && sur ? `${init} ${sur}` : '', idNo };
    }).filter(d => d.full);
  }

  formatDirectorList(dirs) {
    if (!dirs.length) return '[DIRECTOR NAMES]';
    if (dirs.length === 1) return dirs[0].full;
    if (dirs.length === 2) return `${dirs[0].full} and ${dirs[1].full}`;
    return dirs.slice(0, -1).map(d => d.full).join(', ') + ', and ' + dirs[dirs.length - 1].full;
  }

  getPronoun(dirs, terms) {
    // For a single director use "his/her" if the entity type doesn't mandate "their"
    if (dirs.length === 1) return 'their';
    return 'their';
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ENTITY TERMS
  // ══════════════════════════════════════════════════════════════════════════════

  getEntityTerms() {
    const type = this.currentEntityType || 'company';
    const cfg = ENTITY_CONFIG[type] || ENTITY_CONFIG.company;
    const acts = {
      company: 'Companies Act 71 of 2008',
      cc: 'Close Corporations Act 69 of 1984',
      npo: 'Non-Profit Organisations Act 71 of 1997',
      trust: 'Trust Property Control Act 57 of 1988',
      church: '',
      school: 'South African Schools Act 84 of 1996',
      club: '',
      bc: 'Sectional Titles Schemes Management Act 8 of 2011'
    };
    return {
      plural: cfg.pluralTerm,
      singular: cfg.singularTerm,
      pronoun: 'their',
      body: 'The ' + cfg.pluralTerm.toLowerCase(),
      report_to: cfg.reportTo,
      act: acts[type] || 'Companies Act 71 of 2008',
      role: cfg.singularTerm.toLowerCase()
    };
  }

  // Returns singular or plural terms depending on director count
  getTermsForCount(baseTerms, count) {
    if (count === 1) {
      // Singular overrides
      const singularBody = {
        'The directors': 'The director',
        'The members': 'The member',
        'The trustees': 'The trustee',
      };
      return {
        ...baseTerms,
        plural: baseTerms.singular,
        body: singularBody[baseTerms.body] || baseTerms.body,
        bodyPlain: baseTerms.singular,
      };
    }
    return baseTerms;
  }

  updateEntityType() {
    const terms = this.getEntityTerms();
    document.getElementById('directors-section-title').textContent = terms.plural;
    this.liveUpdate();
  }

  updateDividend() {
    const val = getRadio('dividends');
    const group = document.getElementById('dividend-amount-group');
    group.classList.toggle('visible', val === 'declared');
    this.liveUpdate();
  }

  updateParent() {
    const val = getRadio('parentCo');
    document.getElementById('parent-group').classList.toggle('visible', val === 'has');
    this.liveUpdate();
  }

  updateBank() {
    const sel = document.getElementById('bankSelect').value;
    const otherInput = document.getElementById('bankOther');
    const hidden = document.getElementById('bankName');
    if (sel === 'other') {
      otherInput.style.display = 'block';
      hidden.value = otherInput.value;
    } else {
      otherInput.style.display = 'none';
      hidden.value = sel;
    }
    this.liveUpdate();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ENTITY SWITCHING
  // ══════════════════════════════════════════════════════════════════════════════

  selectEntity(el, type) {
    // Deselect all cards
    document.querySelectorAll('.entity-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    this.currentEntityType = type;

    const cfg = ENTITY_CONFIG[type];

    // Update labels and placeholders
    document.getElementById('label-entityName').textContent = cfg.nameLabel;
    document.getElementById('companyName').placeholder = cfg.namePlaceholder;
    document.getElementById('label-regNumber').textContent = cfg.regLabel;
    document.getElementById('regNumber').placeholder = cfg.regPlaceholder;

    // Attorneys: show reg number toggle, reset if switching away
    const isAttorneys = (type === 'attorneys');
    document.getElementById('att-reg-toggle-group').style.display = isAttorneys ? 'block' : 'none';
    if (!isAttorneys) {
      document.getElementById('reg-number-group').style.display = '';
    } else {
      this.toggleAttReg();
    }

    // Update governing body section title
    document.getElementById('directors-section-title').textContent = cfg.bodyTitle;

    // Update add button label
    const addBtn = document.querySelector('.btn-add');
    if (addBtn) addBtn.textContent = cfg.addBtnLabel;

    // Show/hide report type options based on entity
    const allowed = cfg.allowedReports || ['compilation', 'review', 'audit'];
    const reportLabels = { compilation: 'Independent Compilation', review: 'Independent Review', audit: 'Audit' };
    const reportRadios = document.querySelectorAll('input[name="reportType"]');
    reportRadios.forEach(r => {
      const pill = r.closest('.option-pill');
      if (pill) pill.style.display = allowed.includes(r.value) ? 'flex' : 'none';
    });
    // Auto-select the first allowed report type
    const currentReport = getRadio('reportType');
    if (!allowed.includes(currentReport)) {
      const firstAllowed = document.querySelector(`input[name="reportType"][value="${allowed[0]}"]`);
      if (firstAllowed) firstAllowed.checked = true;
    }
    // Show/hide CC-specific form sections
    const isCC = (type === 'cc');
    document.getElementById('share-capital-group').style.display = isCC ? 'none' : '';
    document.getElementById('parent-co-group').style.display = isCC ? 'none' : '';
    document.getElementById('parent-group').style.display = isCC ? 'none' : '';
    // Update dividend labels for CC (capital distribution)
    document.getElementById('dividends-label').textContent = isCC ? 'Capital Distribution' : 'Dividends';
    document.getElementById('dividend-pill-none').querySelector('input').nextSibling.textContent = isCC ? ' No capital distribution declared or paid' : ' No dividend declared or paid';
    document.getElementById('dividend-pill-declared').querySelector('input').nextSibling.textContent = isCC ? ' Capital distribution declared/paid' : ' Dividend declared/paid';

    this.onReportTypeChange();

    // Hide Step 6 (Specific Matters) for School, NPO, BC, Club, Church, Trust, Attorneys — not applicable
    const hideStep6 = (type === 'school' || type === 'npo' || type === 'bc' || type === 'club' || type === 'church' || type === 'trust' || type === 'attorneys');
    document.getElementById('step6-block').style.display = hideStep6 ? 'none' : '';
    document.getElementById('step6-divider').style.display = hideStep6 ? 'none' : '';

    // Hide Step 7 (Accounting Policies) for Attorneys, or for Church when policies=no
    const hideStep7 = (type === 'attorneys') || (type === 'church' && document.querySelector('input[name="churchPolicies"]:checked')?.value === 'no');
    document.getElementById('step7-block').style.display = hideStep7 ? 'none' : '';
    document.getElementById('step7-divider').style.display = hideStep7 ? 'none' : '';

    // Show BC-specific Step 6 only for Body Corporate
    const isBc = (type === 'bc');
    document.getElementById('step6-bc-block').style.display = isBc ? 'block' : 'none';
    document.getElementById('step6-bc-divider').style.display = isBc ? 'block' : 'none';

    // Show Trust-specific Step 6 (Minutes) only for Trust
    const isTrust = (type === 'trust');
    document.getElementById('step6-trust-block').style.display = isTrust ? 'block' : 'none';
    document.getElementById('step6-trust-divider').style.display = isTrust ? 'block' : 'none';

    // Show church policies toggle only for Church
    const isChurch = (type === 'church');
    document.getElementById('church-policies-block').style.display = isChurch ? 'block' : 'none';
    document.getElementById('church-policies-divider').style.display = isChurch ? 'block' : 'none';

    // Loan Certificates — Company, CC and Trust only
    const showLoanCert = (type === 'company' || type === 'cc' || type === 'trust');
    document.getElementById('loan-cert-block').style.display = showLoanCert ? 'block' : 'none';
    document.getElementById('loan-cert-divider').style.display = showLoanCert ? 'block' : 'none';

    // Minutes — Company only (2 pages: directors + shareholders)
    const showMinutes = (type === 'company');
    document.getElementById('minutes-block').style.display = showMinutes ? 'block' : 'none';
    document.getElementById('minutes-divider').style.display = showMinutes ? 'block' : 'none';

    // CC Minutes — CC only (1 page: members AGM)
    const showCCMinutes = (type === 'cc');
    document.getElementById('cc-minutes-block').style.display = showCCMinutes ? 'block' : 'none';
    document.getElementById('cc-minutes-divider').style.display = showCCMinutes ? 'block' : 'none';

    this.liveUpdate();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LOAN CERTIFICATE FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  addLoanCert() {
    this.loanCertCount++;
    const idx = this.loanCertCount;
    const container = document.getElementById('loan-cert-list');
    const card = document.createElement('div');
    card.id = `loan-cert-card-${idx}`;
    card.style.cssText = 'background:var(--panel);border:1.5px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:12px;position:relative;';
    card.innerHTML = `
    <button type="button" onclick="removeLoanCert(${idx})" title="Remove" style="position:absolute;top:10px;right:12px;background:none;border:none;cursor:pointer;font-size:16px;color:var(--ink-light);line-height:1;">\u2715</button>
    <div style="font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--ink-light);margin-bottom:10px;">Certificate ${idx}</div>

    <div class="field-group" style="margin-bottom:10px;">
      <label>Loan / From / (To)</label>
      <input type="text" id="lc-name-${idx}" placeholder="e.g. Yo Khan Mahomed" oninput="liveUpdate()" style="text-transform:capitalize;">
      <p class="hint">Name of the borrower or lender as it should appear on the certificate.</p>
    </div>

    <div class="field-group" style="margin-bottom:10px;">
      <label>Balance Type</label>
      <div class="options-group">
        <label class="option-pill">
          <input type="radio" name="lc-balance-${idx}" value="credit" checked onchange="liveUpdate()"> Credit Balance
        </label>
        <label class="option-pill">
          <input type="radio" name="lc-balance-${idx}" value="debit" onchange="liveUpdate()"> Debit Balance
        </label>
      </div>
    </div>

    <div class="field-group" style="margin-bottom:10px;">
      <label>Amount (R)</label>
      <input type="text" id="lc-amount-${idx}" placeholder="e.g. 73 660.05" oninput="liveUpdate()">
    </div>

    <div class="field-group" style="margin-bottom:0;">
      <label>Date Signed <span style="font-weight:400;color:#9090b0;font-size:11px;">(leave blank if not yet signed)</span></label>
      <input type="text" id="lc-date-${idx}" placeholder="e.g. STANDERTON, 14 MARCH 2025" oninput="liveUpdate()">
      <p class="hint">Enter the signing place and date, or leave blank for a blank signature line.</p>
    </div>
  `;
    container.appendChild(card);
  }

  removeLoanCert(idx) {
    const card = document.getElementById(`loan-cert-card-${idx}`);
    if (card) card.remove();
  }

  getLoanCerts() {
    const certs = [];
    for (let i = 1; i <= this.loanCertCount; i++) {
      if (!document.getElementById(`loan-cert-card-${i}`)) continue; // removed
      const name = toTitleCase((document.getElementById(`lc-name-${i}`)?.value || '').trim());
      const balance = document.querySelector(`input[name="lc-balance-${i}"]:checked`)?.value || 'credit';
      const amount = (document.getElementById(`lc-amount-${i}`)?.value || '').trim();
      const date = (document.getElementById(`lc-date-${i}`)?.value || '').trim().toUpperCase();
      certs.push({ name, balance, amount, date });
    }
    return certs;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SHAREHOLDER FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  addShareholder() {
    this.shareholderCount++;
    const idx = this.shareholderCount;
    const container = document.getElementById('shareholder-list');
    const card = document.createElement('div');
    card.id = `sh-card-${idx}`;
    card.style.cssText = 'background:var(--panel);border:1.5px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:12px;position:relative;';
    card.innerHTML = `
    <button type="button" onclick="removeShareholder(${idx})" title="Remove" style="position:absolute;top:10px;right:12px;background:none;border:none;cursor:pointer;font-size:16px;color:var(--ink-light);line-height:1;">\u2715</button>
    <div style="font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--ink-light);margin-bottom:10px;">Shareholder ${idx}</div>

    <div class="field-group" style="margin-bottom:10px;">
      <label>Shareholder Name</label>
      <input type="text" id="sh-name-${idx}" placeholder="e.g. Dt Boardman or Acme (Pty) Ltd" oninput="liveUpdate()" style="text-transform:capitalize;">
    </div>

    <div class="field-group" style="margin-bottom:10px;">
      <label>Type</label>
      <div class="options-group">
        <label class="option-pill">
          <input type="radio" name="sh-type-${idx}" value="individual" checked onchange="onShareholderTypeChange(${idx})"> Individual (signs personally)
        </label>
        <label class="option-pill">
          <input type="radio" name="sh-type-${idx}" value="entity" onchange="onShareholderTypeChange(${idx})"> Entity (company / trust / CC)
        </label>
      </div>
    </div>

    <div id="sh-proxy-box-${idx}" style="display:none;">
      <div class="field-group" style="margin-bottom:0;">
        <label>Proxy Representative <span style="font-weight:400;color:#9090b0;font-size:11px;">(signs on behalf of the entity)</span></label>
        <input type="text" id="sh-proxy-${idx}" placeholder="e.g. Pietie Van Der Merwe" oninput="liveUpdate()" style="text-transform:capitalize;">
        <p class="hint">Signature line will read: "<em>PROXY NAME</em> on behalf of <em>SHAREHOLDER NAME</em>"</p>
      </div>
    </div>
  `;
    container.appendChild(card);
  }

  removeShareholder(idx) {
    const card = document.getElementById(`sh-card-${idx}`);
    if (card) card.remove();
  }

  onShareholderTypeChange(idx) {
    const type = document.querySelector(`input[name="sh-type-${idx}"]:checked`)?.value;
    const box = document.getElementById(`sh-proxy-box-${idx}`);
    if (box) box.style.display = (type === 'entity') ? 'block' : 'none';
  }

  getShareholders() {
    const list = [];
    for (let i = 1; i <= this.shareholderCount; i++) {
      if (!document.getElementById(`sh-card-${i}`)) continue;
      const name = toTitleCase((document.getElementById(`sh-name-${i}`)?.value || '').trim());
      const type = document.querySelector(`input[name="sh-type-${i}"]:checked`)?.value || 'individual';
      const proxy = toTitleCase((document.getElementById(`sh-proxy-${i}`)?.value || '').trim());
      if (name) list.push({ name, type, proxy });
    }
    return list;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // POLICY FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  buildPolicyChecklist() {
    const container = document.getElementById('policy-checklist');
    accountingPolicies.forEach(p => {
      const div = document.createElement('div');
      div.className = 'policy-item';
      div.id = 'pi-' + p.id;

      let subHtml = '';
      if (p.subItems && !p.isBio) {
        // PPE-style: checkbox + label + rate dropdown + optional custom input
        subHtml = `<div class="policy-subitems">` +
          p.subItems.map(s => {
            if (s.isLandAndBuildings) {
              return `
          <div class="policy-subitem-row" id="row-${s.id}">
            <label class="policy-subitem-check">
              <input type="checkbox" id="${s.id}" onchange="liveUpdate()">
              <span>${s.label}</span>
            </label>
          </div>`;
            }
            const opts = s.rateOptions.map(r =>
              `<option value="${r}">${r}</option>`
            ).join('');
            return `
          <div class="policy-subitem-row" id="row-${s.id}">
            <label class="policy-subitem-check">
              <input type="checkbox" id="${s.id}" onchange="onSubItemChange('${s.id}'); liveUpdate()">
              <span>${s.label}</span>
            </label>
            <div class="policy-subitem-rate" id="rate-wrap-${s.id}" style="display:none;">
              <select id="sel-${s.id}" onchange="onRateSelect('${s.id}'); liveUpdate()">
                ${opts}
              </select>
              <input type="text" id="custom-${s.id}" placeholder="Enter %" style="display:none;width:80px;margin-left:6px;" oninput="liveUpdate()">
            </div>
          </div>`;
          }).join('') +
          `</div>`;
      } else if (p.subItems && p.isBio) {
        // Biological assets: simple checkboxes with labels
        subHtml = `<div class="policy-subitems">` +
          p.subItems.map(s => `
          <label class="policy-subitem-check">
            <input type="checkbox" id="${s.id}" onchange="liveUpdate()">
            <span>${s.label}</span>
          </label>`).join('') +
          `</div>`;
      }

      div.innerHTML = `
      <label class="policy-header">
        <input type="checkbox" id="${p.id}" onchange="togglePolicy('${p.id}')">
        <span class="policy-label">${p.label}</span>
      </label>
      <div class="policy-body">${p.text || ''}${subHtml}</div>
    `;
      container.appendChild(div);
    });
  }

  onSubItemChange(sid) {
    const cb = document.getElementById(sid);
    const rateWrap = document.getElementById('rate-wrap-' + sid);
    if (rateWrap) rateWrap.style.display = cb.checked ? 'flex' : 'none';
  }

  onRateSelect(sid) {
    const sel = document.getElementById('sel-' + sid);
    const custom = document.getElementById('custom-' + sid);
    if (sel.value === 'Other') {
      custom.style.display = 'inline-block';
    } else {
      custom.style.display = 'none';
    }
  }

  togglePolicy(id) {
    const cb = document.getElementById(id);
    const item = document.getElementById('pi-' + id);
    item.classList.toggle('checked', cb.checked);
  }

  selectAllPolicies(checked) {
    accountingPolicies.forEach(p => {
      const cb = document.getElementById(p.id);
      if (cb) {
        cb.checked = checked;
        const item = document.getElementById('pi-' + p.id);
        if (item) item.classList.toggle('checked', checked);
      }
      // Also toggle sub-items visibility
      if (p.subItems && !p.isBio) {
        p.subItems.forEach(s => {
          const scb = document.getElementById(s.id);
          if (scb) {
            scb.checked = checked;
            if (!s.isLandAndBuildings) {
              const rw = document.getElementById('rate-wrap-' + s.id);
              if (rw) rw.style.display = checked ? 'flex' : 'none';
            }
          }
        });
      }
    });
    this.liveUpdate();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REPORT TYPE FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  onReportTypeChange() {
    const type = getRadio('reportType');
    const isSchool = this.currentEntityType === 'school';
    const isAttorneys = this.currentEntityType === 'attorneys';
    const needsPreparer = (type === 'review' || type === 'audit') && !isSchool && !isAttorneys;

    document.getElementById('report-sub-audit').style.display = (type === 'audit' && !isSchool && !isAttorneys) ? 'block' : 'none';
    document.getElementById('report-sub-audit-school').style.display = (type === 'audit' && isSchool) ? 'block' : 'none';
    document.getElementById('report-sub-audit-attorneys').style.display = (type === 'audit' && isAttorneys) ? 'block' : 'none';
    document.getElementById('report-sub-review').style.display = (type === 'review') ? 'block' : 'none';
    document.getElementById('report-sub-compilation').style.display = (type === 'compilation') ? 'block' : 'none';

    // Show/hide preparer block and update signer label
    const preparerBlock = document.getElementById('preparer-block');
    const signerLabel = document.getElementById('label-signer');
    if (preparerBlock) preparerBlock.style.display = needsPreparer ? 'block' : 'none';
    if (signerLabel) {
      signerLabel.textContent = type === 'compilation'
        ? 'Compiler / Signatory'
        : 'VDM Signatory (Reviewer / Auditor)';
    }

    // Show engagement letter question for all report types (except school)
    const engBlock = document.getElementById('engagement-block');
    if (engBlock) engBlock.style.display = (!isSchool) ? 'block' : 'none';
    this.toggleEngagementTypes();

    this.updatePreparerPreview();
    this.liveUpdate();
  }

  toggleEngagementTypes() {
    const show = getRadio('engagementLetter') === 'yes';
    document.getElementById('engagement-types-panel').style.display = show ? 'block' : 'none';
    const isAtt = this.currentEntityType === 'attorneys';
    document.getElementById('engagement-types-standard').style.display = isAtt ? 'none' : 'block';
    document.getElementById('engagement-types-attorneys').style.display = isAtt ? 'block' : 'none';
    if (!show) {
      document.getElementById('engTypeAccounting').checked = false;
      document.getElementById('engTypeReview').checked = false;
      document.getElementById('engTypeAudit').checked = false;
    }
  }

  onAttOpinionTypeChange() {
    const t = getRadio('attOpinionType');
    toggleVisible('att-modified-box', t === 'modified');
    toggleVisible('att-disclaimer-box', t === 'disclaimer');
    this.liveUpdate();
  }

  toggleAttReg() {
    const show = getRadio('attHasReg') === 'yes';
    document.getElementById('reg-number-group').style.display = show ? '' : 'none';
    if (!show) document.getElementById('regNumber').value = '';
    this.liveUpdate();
  }

  onAuditTypeChange() {
    const t = getRadio('auditType');
    toggleVisible('audit-qualified-box', t === 'qualified');
    toggleVisible('audit-emphasis-box', t === 'emphasis');
    toggleVisible('audit-disclaimer-box', t === 'disclaimer');
    toggleVisible('audit-other-box', t === 'other');
    this.liveUpdate();
  }

  onSchoolAuditTypeChange() {
    const t = getRadio('schoolAuditType');
    toggleVisible('school-audit-qualified-box', t === 'qualified');
    const otherBox = document.getElementById('school-audit-other-box');
    if (otherBox) otherBox.classList.toggle('visible', t === 'unqualified' || t === 'qualified');
    toggleVisible('school-audit-disclaimer-box', t === 'disclaimer');
    this.liveUpdate();
  }

  onSchoolPreparerCapacityChange() {
    const v = document.getElementById('schoolPreparerCapacity')?.value;
    const otherInput = document.getElementById('schoolPreparerCapacityOther');
    if (otherInput) otherInput.style.display = (v === 'other') ? 'block' : 'none';
    this.updateSchoolPreparerPreview();
  }

  updateSchoolPreparerPreview() {
    const name = (document.getElementById('schoolPreparerName')?.value || '').trim();
    const capEl = document.getElementById('schoolPreparerCapacity');
    const capRaw = capEl?.value || 'financial officer';
    const capOther = (document.getElementById('schoolPreparerCapacityOther')?.value || '').trim();
    const cap = capRaw === 'other' ? (capOther || '\u2026') : capRaw;
    const preview = document.getElementById('school-preparer-preview');
    if (preview) {
      preview.textContent = name
        ? `The financial statements were prepared under the supervision of ${name} in their capacity as ${cap}.`
        : '';
    }
  }

  onPreparerCapacityChange() {
    const v = document.getElementById('preparerCapacity')?.value;
    const otherInput = document.getElementById('preparerCapacityOther');
    if (otherInput) otherInput.style.display = (v === 'other') ? 'block' : 'none';
    this.updatePreparerPreview();
  }

  onBcEventsChange() {
    const v = getRadio('bcEvents');
    toggleVisible('bc-events-box', v === 'custom');
    this.liveUpdate();
  }

  onBcMgmtRulesChange() {
    const v = getRadio('bcMgmtRules');
    toggleVisible('bc-mgmt-rules-box', v === 'custom');
    this.liveUpdate();
  }

  onTrustDeedChange() {
    const v = getRadio('trustDeedChanges');
    toggleVisible('trust-deed-box', v === 'custom');
    this.liveUpdate();
  }

  updatePreparerPreview() {
    const name = (document.getElementById('preparerName')?.value || '').trim();
    const capEl = document.getElementById('preparerCapacity');
    const capRaw = capEl?.value || 'financial officer';
    const capOther = (document.getElementById('preparerCapacityOther')?.value || '').trim();
    const cap = capRaw === 'other' ? (capOther || '\u2026') : capRaw;
    const preview = document.getElementById('preparer-preview');
    if (preview) {
      preview.textContent = name
        ? `The financial statements were prepared under the supervision of ${name} in their capacity as ${cap}.`
        : '';
    }
  }

  onReviewTypeChange() {
    const t = getRadio('reviewType');
    toggleVisible('review-qualified-box', t === 'qualified');
    if (t === 'qualified') this.onReviewQualifiedBasisChange();
    this.liveUpdate();
  }

  onReviewQualifiedBasisChange() {
    const b = getRadio('reviewQualifiedBasis');
    toggleVisible('review-qualified-insolvent-box', b === 'insolvent');
    toggleVisible('review-qualified-custom-box', b === 'custom');
    this.liveUpdate();
  }

  onCompilationTypeChange() {
    const t = getRadio('compilationType');
    toggleVisible('compilation-insolvent-box', t === 'insolvent');
    toggleVisible('compilation-other-box', t === 'other');
    this.liveUpdate();
  }

  getReportSubState() {
    const type = getRadio('reportType');
    if (type === 'audit') {
      if (this.currentEntityType === 'school') {
        const sub = getRadio('schoolAuditType');
        return {
          reportType: 'audit',
          entityType: 'school',
          subType: sub,
          qualifiedText: document.getElementById('schoolAuditQualifiedText')?.value.trim() || '',
          otherText: document.getElementById('schoolAuditOtherText')?.value.trim() || '',
          disclaimerText: document.getElementById('schoolAuditDisclaimerText')?.value.trim() || '',
        };
      }
      const sub = getRadio('auditType');
      return {
        reportType: 'audit',
        subType: sub,
        qualifiedText: document.getElementById('auditQualifiedText')?.value.trim() || '',
        emphasisText: document.getElementById('auditEmphasisText')?.value.trim() || '',
        disclaimerText: document.getElementById('auditDisclaimerText')?.value.trim() || '',
        otherText: document.getElementById('auditOtherText')?.value.trim() || '',
      };
    }
    if (type === 'review') {
      const sub = getRadio('reviewType');
      const qualifiedBasis = getRadio('reviewQualifiedBasis');
      return {
        reportType: 'review',
        subType: sub,
        qualifiedBasis: qualifiedBasis,
        qualifiedText: document.getElementById('reviewQualifiedText')?.value.trim() || '',
        reviewAccLoss: document.getElementById('reviewAccLoss')?.value.trim() || '',
        reviewExcessLiab: document.getElementById('reviewExcessLiab')?.value.trim() || '',
      };
    }
    // compilation
    const sub = getRadio('compilationType');
    return {
      reportType: 'compilation',
      subType: sub,
      insolventText: document.getElementById('compilationInsolventText')?.value.trim() || '',
      otherText: document.getElementById('compilationOtherText')?.value.trim() || '',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AUTO-FILL PREVIOUS YEAR
  // ══════════════════════════════════════════════════════════════════════════════

  autoFillPrevYear() {
    const raw = document.getElementById('yearEnd').value.trim();
    if (!raw) return;
    const months = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let day = null, month = null, year = null;
    const named = raw.match(/^(\d{1,2}\s+)?([A-Za-z]+)\s+(\d{4})$/);
    if (named) {
      day = named[1] ? named[1].trim() : null;
      month = months[named[2].toLowerCase()];
      year = parseInt(named[3]);
    }
    if (!month) {
      const slashed = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/) || raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (slashed) {
        const a = parseInt(slashed[1]), b = parseInt(slashed[2]), c = parseInt(slashed[3]);
        if (a > 31) { year = a; month = b; day = c; }
        else { day = a; month = b; year = c; }
      }
    }
    if (!month || !year) return;
    const prevField = document.getElementById('prevYearEnd');
    prevField.value = day ? `${day} ${monthNames[month]} ${year - 1}` : `${monthNames[month]} ${year - 1}`;
  }
}
