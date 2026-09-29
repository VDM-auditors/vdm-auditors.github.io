/* ── VDM Questionnaire — New-trust module ───────────────────────────────
   Everything the wizard does differently when a NEW trust is registered
   (VDMMode.isNew() — an existing trust keeps the plain fields in index.html):
   the step-3 fields, the check before leaving step 3, and the trust section
   of the PDF. The PDF is the only output — no data file is downloaded.

   This absorbed the separate trust-deed-questionnaire (28 Sep 2026).

   Uses globals from index.html: makeRadioGroup, selectRadio, makeTaxToggle,
   radioVal, taxVal.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const val = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const COLORS = { trust: '#5C3A1E', indep: '#4A3060', trustee: '#1A3560', ben: '#263A52' };
  let counts = { trustees: 1, beneficiaries: 1 };

  /* ── markup ────────────────────────────────────────────────────────── */

  function field(id, label, opts = {}) {
    const { type = 'text', req, placeholder = '', span2, value = '', hint } = opts;
    const star = req ? ' <span class="req">*</span>' : '';
    const input = type === 'textarea'
      ? `<textarea id="${id}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
      : `<input type="${type}" id="${id}" placeholder="${esc(placeholder)}" value="${esc(value)}">`;
    const help = hint ? `<p class="field-hint">${hint}</p>` : '';
    return `<div class="field${span2 ? ' span-2' : ''}" data-for="${id}"><label for="${id}">${label}${star}</label>${input}${help}<p class="field-msg" hidden></p></div>`;
  }

  function select(id, label, options, opts = {}) {
    const html = options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
    return `<div class="field${opts.span2 ? ' span-2' : ''}" data-for="${id}"><label for="${id}">${label}</label><select id="${id}">${html}</select></div>`;
  }

  const subhead = text => `<div class="section-divider"></div><p class="trust-subhead">${text}</p>`;

  function card(title, color, body) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<div class="card-header" style="background:${color}">${title}</div><div class="card-body">${body}</div>`;
    return el;
  }

  function block(title, color, body) {
    const el = document.createElement('div');
    el.className = 'person-block';
    el.innerHTML = `<div class="person-block-header" style="background:${color}">${title}</div><div class="person-block-body">${body}</div>`;
    return el;
  }

  /* The settlor's name is asked as first names + surname: J401 section 5 wants
     them apart, and a full name cannot be split back reliably ("VAN DER
     MERWE"). The hidden _fullname is composed from the two so that everything
     else in the form — attachments, signing, the Word documents — keeps
     reading one name. */
  function nameFields(prefix, split) {
    if (!split) return field(`${prefix}_fullname`, 'Full Names &amp; Surname', { req: true, span2: true, placeholder: 'As per ID document' });
    return field(`${prefix}_first`, 'First Names', { req: true, placeholder: 'As per ID document' })
      + field(`${prefix}_surname`, 'Surname', { req: true, placeholder: 'As per ID document' })
      + `<input type="hidden" id="${prefix}_fullname">`;
  }

  function personFields(prefix, split = false) {
    return `<div class="form-grid">${nameFields(prefix, split)}`
      + field(`${prefix}_id`, 'ID Number', { req: true, placeholder: '13-digit RSA ID or passport' })
      + field(`${prefix}_id_issue`, 'ID — Date of Issue', { type: 'date' })
      + field(`${prefix}_taxnr`, 'Income Tax Number')
      + field(`${prefix}_tel`, 'Telephone Number', { type: 'tel', placeholder: '0XX XXX XXXX' })
      + field(`${prefix}_email`, 'Email Address', { type: 'email', span2: true })
      + field(`${prefix}_postal`, 'Postal Address', { type: 'textarea', span2: true, placeholder: 'P.O. Box or street address' })
      + field(`${prefix}_residential`, 'Residential Address', { type: 'textarea', span2: true, placeholder: 'Street address, suburb, city, code' })
      + `</div>${subhead('Marital Status')}<div class="marital-inline">`
      + select(`${prefix}_marital`, 'Marital Status', [['', '— Select —'], ['Married', 'Married'], ['Unmarried', 'Unmarried'], ['Divorced', 'Divorced'], ['Widow/Widower', 'Widow/Widower']])
      + select(`${prefix}_cop`, 'Community of Property', [['', '— Select —'], ['In Community of Property', 'In Community of Property'], ['Out of Community of Property', 'Out of Community of Property']])
      + field(`${prefix}_mardate`, 'Marriage Date', { type: 'date' })
      + `</div>${subhead('Spouse Details')}<div class="form-grid">`
      + field(`${prefix}_sp_name`, 'Spouse — Full Names &amp; Surname', { span2: true, placeholder: 'As per ID document' })
      + field(`${prefix}_sp_id`, 'Spouse — ID Number', { placeholder: '13-digit RSA ID' })
      + field(`${prefix}_sp_id_issue`, 'Spouse — ID Date of Issue', { type: 'date' })
      + field(`${prefix}_sp_tax`, 'Spouse — Income Tax Nr')
      + field(`${prefix}_sp_tel`, 'Spouse — Telephone', { type: 'tel', placeholder: '0XX XXX XXXX' })
      + field(`${prefix}_sp_email`, 'Spouse — Email', { type: 'email', span2: true })
      + `</div>${subhead('Our Instruction')}${makeTaxToggle(prefix)}`;
  }

  function donorFields() {
    return personFields('donor_1', true)
      + subhead('For the Master’s Office')
      + `<div class="form-grid">${field('donor_1_nationality', 'Nationality', { req: true, value: 'SOUTH AFRICAN' })}</div>`
      + `<label class="svc-check trust-check"><input type="checkbox" id="donor_1_is_trustee"><span class="svc-box"></span>The donor is also one of the trustees</label>`
      + `<p class="field-hint">If so, please list the donor again under Trustees below.</p>`;
  }

  function beneficiaryFields(prefix) {
    return `<div class="form-grid">`
      + select(`${prefix}_type`, 'Type', [['INDIVIDUAL', 'Individual'], ['ORGANISATION', 'Organisation']])
      + field(`${prefix}_dob`, 'Date of Birth', { type: 'date' })
      + field(`${prefix}_fullname`, 'Full Names &amp; Surname / Organisation Name', { req: true, span2: true, placeholder: 'As per ID document or registration' })
      + field(`${prefix}_id`, 'ID / Passport / Registration No.', { req: true })
      + field(`${prefix}_id_issue`, 'ID — Date of Issue', { type: 'date' })
      + field(`${prefix}_taxnr`, 'Income Tax Number')
      + field(`${prefix}_tel`, 'Telephone Number', { type: 'tel' })
      + field(`${prefix}_email`, 'Email Address', { type: 'email', span2: true })
      + `</div><div class="form-grid" style="margin-top:8px">`
      + `<div class="field"><label>Income Beneficiary</label><div class="radio-group">${makeRadioGroup(prefix + '_ben_income', ['Yes', 'No'])}</div></div>`
      + `<div class="field"><label>Capital Beneficiary</label><div class="radio-group">${makeRadioGroup(prefix + '_ben_capital', ['Yes', 'No'])}</div></div>`
      + select(`${prefix}_minor`, 'Minor or Mentally Incapacitated', [['NO', 'No'], ['YES', 'Yes']], { span2: true })
      + `</div><div class="form-grid guardian-fields" id="${prefix}_guardian_wrap" hidden style="margin-top:8px">`
      + field(`${prefix}_guardian_name`, 'Guardian / Curator — Full Names')
      + field(`${prefix}_guardian_id`, 'Guardian / Curator — ID / Passport')
      + `</div>`;
  }

  /* ── step 3 ────────────────────────────────────────────────────────── */

  function buildStep(container, state) {
    counts = { trustees: state.counts.trustees, beneficiaries: state.counts.beneficiaries };

    container.appendChild(card('⚖️ Trust Registration', COLORS.trust,
      `<div class="notice trust-notice"><strong>⚠ Important Note:</strong> No new trusts may be registered without an independent trustee.</div>`
      + `<p class="trust-intro">These answers are used to draft the trust deed and the Master’s forms. Please give every name exactly as it appears on the identity document — a wrong digit in an ID number follows the deed all the way to signature.</p>`));

    container.appendChild(card('Donor / Founder (Settlor)', COLORS.trust,
      `<p class="trust-intro">The donor is the person who donates the founding amount to the trust. The trust deed calls this person the settlor.</p>`));
    container.appendChild(block('🏛️ Donor / Founder', COLORS.trust, donorFields()));

    container.appendChild(card('Independent Trustee', COLORS.indep,
      `<div class="notice" style="border-color:#6B4A8A;color:#4A3060;background:#F5F0FB;">ℹ️ The independent trustee must not be a beneficiary and must not be related by family or blood to any other trustee, beneficiary, or the founder. This is the person who swears the affidavit for the Master.</div>`));
    container.appendChild(block('⚖️ Independent Trustee', COLORS.indep, personFields('indep_trustee_1')));

    container.appendChild(card('Trustees Information', COLORS.trustee,
      `<p class="trust-intro">The trustees administer the trust. List every trustee other than the independent trustee — including the donor, if the donor is also a trustee.</p>`));
    for (let i = 1; i <= counts.trustees; i++) {
      container.appendChild(block(`👤 Trustee ${i}`, COLORS.trustee, personFields(`trustee_${i}`)));
    }

    container.appendChild(card('Beneficiaries Information', COLORS.ben,
      `<p class="trust-intro">The people the trust is for. The children of the beneficiaries, and their children, are covered by the deed automatically — you do not need to name them here. If a trustee or the donor is also a beneficiary, list them here as well.</p>`
      + `<p class="trust-intro">The trust deed names the first two beneficiaries; any others are listed on the Master’s form J450.</p>`));
    for (let i = 1; i <= counts.beneficiaries; i++) {
      container.appendChild(block(`🎯 Beneficiary ${i}`, COLORS.ben, beneficiaryFields(`ben_${i}`)));
    }

    container.appendChild(card('If Everyone Named Has Died', COLORS.trust,
      `<p class="trust-intro">The deed must say who inherits in the unlikely event that every beneficiary and all of their descendants have died. Name the person whose intestate heirs would then receive the trust — usually one of the beneficiaries.</p>`
      + `<div class="form-grid">`
      + `<div class="field span-2"><label for="trust_heirs_copy">Copy from a person above</label><select id="trust_heirs_copy"><option value="">— Choose, or type below —</option></select></div>`
      + field('trust_heirs_name', 'Intestate Heirs Of — Full Name', { req: true })
      + field('trust_heirs_id', 'Intestate Heirs Of — ID Number', { req: true, placeholder: '13-digit RSA ID' })
      + `</div>`));

    container.appendChild(card('Trust Assets, Bank &amp; Notes', COLORS.trust,
      `<div class="form-grid">`
      + field('trust_main_asset', 'Main Asset', { placeholder: 'e.g. Property, investments' })
      + field('trust_asset_town', 'Town Where the Trust’s Assets Are', { req: true, placeholder: 'e.g. Standerton' })
      + field('trust_bank', 'Bank Name', { placeholder: 'e.g. FNB, ABSA, Standard Bank' })
      + field('trust_duration', 'How Long the Trust Will Run', { value: 'INDEFINITE', hint: 'Usually INDEFINITE — leave it unless the trust is meant to end on a set date.' })
      + field('trust_notes', 'Special Notes', { type: 'textarea', span2: true, placeholder: 'Any special instructions or notes...' })
      + `</div>`));

    const blocker = document.createElement('div');
    blocker.id = 'trust_blocker';
    blocker.className = 'notice trust-blocker';
    blocker.hidden = true;
    container.appendChild(blocker);

    wire(container);
  }

  function wire(container) {
    container.addEventListener('input', e => {
      if (e.target.id === 'donor_1_first' || e.target.id === 'donor_1_surname') {
        document.getElementById('donor_1_fullname').value = [val('donor_1_first'), val('donor_1_surname')].filter(Boolean).join(' ');
      }
      const wrap = e.target.closest('.field.invalid, .field.warn');
      if (wrap) paintField(wrap.dataset.for, true);
    });
    container.addEventListener('change', e => {
      const m = e.target.id.match(/^(ben_\d+)_minor$/);
      if (m) document.getElementById(m[1] + '_guardian_wrap').hidden = e.target.value !== 'YES';
      if (e.target.id === 'trust_heirs_copy' && e.target.value) {
        const [name, id] = [val(e.target.value + '_fullname'), val(e.target.value + '_id')];
        document.getElementById('trust_heirs_name').value = name;
        document.getElementById('trust_heirs_id').value = id;
        paintField('trust_heirs_name', true); paintField('trust_heirs_id', true);
      }
    });
    container.addEventListener('focusout', e => { if (e.target.id) paintField(e.target.id, true); });
    const copy = document.getElementById('trust_heirs_copy');
    copy.addEventListener('focus', () => fillCopyOptions(copy));
    copy.addEventListener('mousedown', () => fillCopyOptions(copy));
  }

  function people() {
    const out = [['donor_1', 'Donor / Founder']];
    out.push(['indep_trustee_1', 'Independent Trustee']);
    for (let i = 1; i <= counts.trustees; i++) out.push([`trustee_${i}`, `Trustee ${i}`]);
    for (let i = 1; i <= counts.beneficiaries; i++) out.push([`ben_${i}`, `Beneficiary ${i}`]);
    return out;
  }

  function fillCopyOptions(sel) {
    const named = people().filter(([p]) => val(p + '_fullname'));
    sel.innerHTML = '<option value="">— Choose, or type below —</option>'
      + named.map(([p, label]) => `<option value="${p}">${esc(val(p + '_fullname'))} (${label})</option>`).join('');
  }

  /* ── the check before leaving step 3 ───────────────────────────────── */

  // 13 digits, plausible YYMMDD, Luhn check digit — as the deed app validates.
  function isSaIdValid(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (d.length !== 13) return false;
    const mm = Number(d.slice(2, 4)), dd = Number(d.slice(4, 6));
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let n = Number(d[12 - i]);
      if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }

  // What the deed and the Master's forms cannot do without.
  function requiredIds() {
    const ids = ['donor_1_first', 'donor_1_surname', 'donor_1_id', 'donor_1_nationality',
      'indep_trustee_1_fullname', 'indep_trustee_1_id'];
    for (let i = 1; i <= counts.trustees; i++) ids.push(`trustee_${i}_fullname`, `trustee_${i}_id`);
    for (let i = 1; i <= counts.beneficiaries; i++) ids.push(`ben_${i}_fullname`, `ben_${i}_id`);
    ids.push('trust_heirs_name', 'trust_heirs_id', 'trust_asset_town');
    return ids;
  }

  // Checked against the SA ID rule, but only warned about: a foreign trustee's
  // passport number is a legitimate answer the checksum would reject.
  function isSaIdField(id) {
    if (/^ben_\d+_id$/.test(id)) return val(id.replace(/_id$/, '_type')) !== 'ORGANISATION';
    return /^(donor_1|indep_trustee_1|trustee_\d+)_id$/.test(id) || id === 'trust_heirs_id';
  }

  function problem(id) {
    if (requiredIds().includes(id) && !val(id)) return { block: true, msg: 'This answer is needed to register the trust.' };
    if (isSaIdField(id) && val(id) && !isSaIdValid(val(id))) {
      return { block: false, msg: 'This does not look like a valid South African ID number — please check it. Ignore this for a passport number.' };
    }
    return null;
  }

  // `touchedOnly`: blur/typing repaints a field the client has been in, but
  // never turns an untouched field red before they have tried to continue.
  function paintField(id, touchedOnly) {
    const wrap = document.querySelector(`#peopleContainer .field[data-for="${id}"]`);
    if (!wrap) return;
    if (touchedOnly) wrap.dataset.touched = '1';
    const p = wrap.dataset.touched ? problem(id) : null;
    const msg = wrap.querySelector('.field-msg');
    wrap.classList.toggle('invalid', Boolean(p && p.block));
    wrap.classList.toggle('warn', Boolean(p && !p.block));
    if (msg) { msg.hidden = !p; msg.textContent = p ? p.msg : ''; }
  }

  function check() {
    const ids = [...new Set([...requiredIds(), ...people().map(([p]) => p + '_id')])];
    let first = null, blocking = 0;
    ids.forEach(id => {
      const wrap = document.querySelector(`#peopleContainer .field[data-for="${id}"]`);
      if (wrap) wrap.dataset.touched = '1';
      paintField(id);
      const p = problem(id);
      if (p && p.block) { blocking++; if (!first) first = id; }
    });
    const blocker = document.getElementById('trust_blocker');
    if (blocker) {
      blocker.hidden = blocking === 0;
      blocker.textContent = blocking === 1 ? 'One answer on this page still needs attention.' : `${blocking} answers on this page still need attention.`;
    }
    if (first) document.getElementById(first).focus();
    return blocking === 0;
  }

  /* ── PDF ───────────────────────────────────────────────────────────── */

  function renderPdf(p) {
    const BROWN = [92, 58, 30], PURPLE = [74, 48, 96], BEN = [38, 58, 82];
    const person = prefix => {
      p.fieldFull('Full Names & Surname', val(prefix + '_fullname'));
      p.fieldRow([['ID Number', val(prefix + '_id')], ['ID — Date of Issue', val(prefix + '_id_issue')]]);
      p.fieldRow([['Income Tax Number', val(prefix + '_taxnr')], ['Telephone', val(prefix + '_tel')]]);
      p.fieldRow([['Email Address', val(prefix + '_email')], ['Marital Status', val(prefix + '_marital')]]);
      p.fieldFull('Postal Address', val(prefix + '_postal'));
      p.fieldFull('Residential Address', val(prefix + '_residential'));
      const sp = val(prefix + '_sp_name');
      if (sp) {
        p.divider(); p.fieldFull('Spouse Name', sp);
        p.fieldRow([['Spouse ID', val(prefix + '_sp_id')], ['Spouse — ID Date of Issue', val(prefix + '_sp_id_issue')]]);
        p.fieldRow([['Spouse Tax', val(prefix + '_sp_tax')], ['Spouse Tel', val(prefix + '_sp_tel')]]);
      }
      p.yesNoBadge('File Personal Income Tax Returns?', taxVal(prefix));
    };

    p.sectionHeader('Trust Registration', BROWN);
    p.personHeader('Donor / Founder (Settlor)', BROWN);
    p.fieldRow([['First Names', val('donor_1_first')], ['Surname', val('donor_1_surname')]]);
    p.fieldRow([['Nationality', val('donor_1_nationality')], ['Donor Is Also a Trustee', isChecked('donor_1_is_trustee') ? 'Yes' : 'No']]);
    person('donor_1');
    p.divider();
    p.personHeader('Independent Trustee', PURPLE);
    person('indep_trustee_1');

    p.sectionHeader('Trustees Information', p.MIDBLUE);
    for (let i = 1; i <= counts.trustees; i++) {
      p.personHeader(`Trustee ${i}`, p.MIDBLUE); person(`trustee_${i}`);
      if (i < counts.trustees) p.divider();
    }

    p.sectionHeader('Beneficiaries Information', p.MIDBLUE);
    for (let i = 1; i <= counts.beneficiaries; i++) {
      const b = `ben_${i}`;
      p.personHeader(`Beneficiary ${i}${i <= 2 ? ' — named in the deed' : ' — J450 only'}`, BEN);
      p.fieldFull('Full Names & Surname / Organisation Name', val(b + '_fullname'));
      p.fieldRow([['Type', val(b + '_type')], ['Date of Birth', val(b + '_dob')]]);
      p.fieldRow([['ID / Passport / Registration', val(b + '_id')], ['ID — Date of Issue', val(b + '_id_issue')]]);
      p.fieldRow([['Income Tax Number', val(b + '_taxnr')], ['Telephone', val(b + '_tel')]]);
      p.fieldFull('Email Address', val(b + '_email'));
      p.fieldRow([['Income Beneficiary', radioVal(b + '_ben_income') || '—'], ['Capital Beneficiary', radioVal(b + '_ben_capital') || '—']]);
      if (val(b + '_minor') === 'YES') {
        p.fieldRow([['Minor / Incapacitated', 'Yes'], ['Guardian / Curator', val(b + '_guardian_name')]]);
        p.fieldFull('Guardian — ID / Passport', val(b + '_guardian_id'));
      }
      if (i < counts.beneficiaries) p.divider();
    }

    p.sectionHeader('If Everyone Named Has Died — Intestate Heirs Of', BROWN);
    p.fieldRow([['Full Name', val('trust_heirs_name')], ['ID Number', val('trust_heirs_id')]]);

    p.sectionHeader('Trust Assets & Notes', BROWN);
    p.fieldRow([['Main Asset', val('trust_main_asset')], ['Town Where Assets Are', val('trust_asset_town')]]);
    p.fieldRow([['Bank Name', val('trust_bank')], ['Duration of the Trust', val('trust_duration')]]);
    const notes = val('trust_notes');
    if (notes) p.fieldFull('Special Notes', notes);
  }

  function isChecked(id) { const el = document.getElementById(id); return Boolean(el && el.checked); }

  window.VDMTrust = { buildStep, check, renderPdf };
})();
