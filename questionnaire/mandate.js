/* ── VDM Questionnaire — Mandate module ──────────────────────────────────
   Board resolution mandating VDM to file the entity's beneficial ownership
   with the CIPC. The client fills the signing block, watches a live A4
   preview of the resolution, and signs it; the finished page is appended to
   the questionnaire PDF.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* The agent and the witness never change — they are VDM's own people. */
  const AGENT = {
    name: 'Leon van der Merwe',
    id: '680813 5004 08 3',
    email: 'cipro@vdmaudit.co.za',
    code: 'HLVDM3',
    firm: 'VDM Chartered Accountants'
  };
  const WITNESS = {
    name: 'HIRSCHBERG, RINA',
    id: '541130 0131 08 7',
    role: 'WITNESS'
  };

  const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

  /* Entity types that actually file beneficial ownership with the CIPC get the
     mandate ticked by default; the rest can still opt in. */
  const DEFAULT_ON = ['company', 'cc', 'npo'];

  const val = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let built = false;
  let lastType = null;
  let sigDataUrl = '';
  let sigSize = { w: 1, h: 1 };

  /* ── applicability ────────────────────────────────────────────────── */

  function applies(state) {
    return !!(state && state.entityType && state.entityType !== 'individual');
  }

  function included() {
    const cb = document.getElementById('mandate_include');
    return !!(cb && !cb.disabled && cb.checked);
  }

  /* ── people ───────────────────────────────────────────────────────── */

  /* "Chilombo Emmaneul Kalenga" → "KALENGA, CHILOMBO EMMANEUL" — the form the
     printed resolution uses under the signature line. */
  function formalName(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return (name || '').toUpperCase();
    const surname = parts.pop();
    return (surname + ', ' + parts.join(' ')).toUpperCase();
  }

  function signatories() {
    const get = window.getDirectorsForDocs;
    const dirs = (typeof get === 'function' ? get() : []) || [];
    return dirs.filter(d => d.name || d.id);
  }

  /* ── styles ───────────────────────────────────────────────────────── */

  const CSS = `
    .mandate-grid { display:grid; grid-template-columns: 1fr; gap:16px; }
    /* The wizard body is capped at 780px, which leaves no room for a readable
       A4 preview beside the fields — so on a wide screen this one step breaks
       out of that cap and runs side by side. */
    @media (min-width: 1140px) {
      #step5.mandate-wide { width: min(1320px, calc(100vw - 48px)); margin-left: 50%; transform: translateX(-50%); }
      .mandate-grid { grid-template-columns: 360px minmax(0, 1fr); align-items:start; }
    }
    .mandate-note { font-size:12px; line-height:1.6; color:var(--text-muted); margin:0 0 14px; }
    .mandate-const { background:var(--accent-bg); border:1px solid var(--border); border-radius:var(--radius-sm);
      padding:10px 12px; font-size:11.5px; line-height:1.7; color:var(--navy); }
    .mandate-const strong { display:block; font-size:10px; letter-spacing:.08em; text-transform:uppercase;
      color:var(--accent-dark); margin-bottom:3px; }
    .mandate-date-row { display:grid; grid-template-columns: 70px 1fr 90px; gap:10px; }
    .mandate-preview-wrap { background:#8C99AC; border-radius:var(--radius); padding:18px; overflow:auto; }
    .mandate-sheet { background:#fff; color:#000; max-width:720px; margin:0 auto; padding:46px 44px 56px;
      box-shadow:0 6px 28px rgba(0,0,0,.28); font-family:Arial, Helvetica, sans-serif;
      font-size:12.5px; line-height:1.45; }
    .mandate-sheet.is-off { opacity:.35; filter:grayscale(1); }
    .m-title { text-align:center; font-size:22px; font-weight:700; margin:0 0 14px; letter-spacing:.2px; }
    .m-meta { text-align:center; font-size:12px; margin:0 0 8px; }
    .m-company { text-align:center; font-size:12px; font-weight:700; margin:14px 0 16px; }
    .m-rule { border-top:2px solid #000; margin:6px 0; }
    .m-res { text-align:center; font-size:11.5px; font-weight:700; line-height:1.4; margin:8px 0; }
    .m-mandate { text-align:center; font-size:20px; font-weight:700; margin:18px 0 16px; }
    .m-h { font-size:12.5px; font-weight:700; margin:14px 0 3px; }
    .m-p { text-align:justify; margin:0 0 4px; }
    .m-signedat { margin:34px 0 0; font-size:12.5px; }
    .m-fill { display:inline-block; min-width:130px; border-bottom:1px solid #000; text-align:center;
      padding:0 6px; font-weight:400; }
    .m-fill.sm { min-width:52px; }
    .m-sigrow { display:flex; justify-content:space-between; gap:36px; margin-top:26px; }
    .m-sigcol { flex:1; min-width:0; }
    .m-sigink { height:52px; display:flex; align-items:flex-end; }
    .m-sigink img { max-height:52px; max-width:100%; }
    .m-sigline { border-top:1px solid #000; margin-bottom:3px; }
    .m-signame { text-align:center; font-size:11.5px; font-weight:700; line-height:1.5; }
    .m-sigid { text-align:center; font-size:11.5px; line-height:1.5; }
    .m-blank { color:#9aa4b2; }
  `;

  function injectCss() {
    if (document.getElementById('mandateStyles')) return;
    const s = document.createElement('style');
    s.id = 'mandateStyles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── build ────────────────────────────────────────────────────────── */

  function build(state) {
    injectCss();
    const container = document.getElementById('mandateContainer');
    if (!container) return;

    const step = document.getElementById('step5');
    if (step) step.classList.toggle('mandate-wide', applies(state));

    if (!applies(state)) {
      container.innerHTML = `<div class="card"><div class="card-body">
        <p class="mandate-note" style="margin:0">The CIPC beneficial ownership mandate is a resolution of a board or
        governing body, so it does not apply to an individual or sole proprietor. Continue to Sign &amp; Submit.</p>
      </div></div>`;
      built = false;
      return;
    }

    if (!built) {
      const now = new Date();
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            CIPC Beneficial Ownership Mandate
          </div>
          <div class="card-body">
            <p class="mandate-note">This resolution authorises VDM to lodge the entity's beneficial ownership
              information with the CIPC. Complete the signing block below — the preview on the right is exactly
              what will be added to your submission.</p>
            <div class="consent-check-row" id="mandateIncludeRow" onclick="VDMMandate.toggleInclude(event)">
              <input type="checkbox" id="mandate_include" onclick="event.stopPropagation(); VDMMandate.toggleInclude(event)">
              <label onclick="event.preventDefault(); event.stopPropagation();">Include this mandate with my submission.</label>
            </div>

            <div class="mandate-grid" style="margin-top:16px">
              <div>
                <div class="form-grid">
                  <div class="field span-2">
                    <label>Signed at <span class="req">*</span></label>
                    <input type="text" id="mandate_place" placeholder="Town / city, e.g. Johannesburg"
                      oninput="VDMMandate.refresh()">
                  </div>
                  <div class="field span-2">
                    <label>Date of signature</label>
                    <div class="mandate-date-row">
                      <select id="mandate_day" onchange="VDMMandate.refresh()"></select>
                      <select id="mandate_month" onchange="VDMMandate.refresh()"></select>
                      <input type="text" id="mandate_year" maxlength="4" inputmode="numeric"
                        oninput="VDMMandate.refresh()">
                    </div>
                  </div>
                  <div class="field span-2">
                    <label>Signing director <span class="req">*</span></label>
                    <select id="mandate_person" onchange="VDMMandate.onPerson()"></select>
                  </div>
                  <div class="field">
                    <label>Name as it appears on the resolution</label>
                    <input type="text" id="mandate_name" placeholder="SURNAME, FIRST NAMES"
                      oninput="VDMMandate.refresh()">
                  </div>
                  <div class="field">
                    <label>Identity number</label>
                    <input type="text" id="mandate_id" placeholder="YYMMDD XXXX XX X" oninput="VDMMandate.refresh()">
                  </div>
                  <div class="field span-2">
                    <label>Capacity</label>
                    <input type="text" id="mandate_capacity" placeholder="DIRECTOR" oninput="VDMMandate.refresh()">
                  </div>
                  <div class="field span-2">
                    <label>Signature <span class="req">*</span></label>
                    <div class="signature-field"><canvas id="mandate_sig_canvas" height="60"></canvas></div>
                    <button onclick="VDMMandate.clearSig()"
                      style="font-size:11px;color:var(--text-muted);background:none;border:none;cursor:pointer;margin-top:4px">✕ Clear</button>
                  </div>
                  <div class="field span-2">
                    <div class="mandate-const">
                      <strong>Fixed on this resolution</strong>
                      Agent: ${esc(AGENT.name)} · ID ${esc(AGENT.id)}<br>
                      ${esc(AGENT.email)} · CIPC code ${esc(AGENT.code)}<br>
                      Witness: ${esc(WITNESS.name)} · ID ${esc(WITNESS.id)}
                    </div>
                  </div>
                </div>
              </div>
              <div class="mandate-preview-wrap">
                <div class="mandate-sheet" id="mandateSheet"></div>
              </div>
            </div>
          </div>
        </div>`;

      /* day / month / year, prefilled from today but free to change */
      const daySel = document.getElementById('mandate_day');
      for (let d = 1; d <= 31; d++) {
        const o = document.createElement('option');
        o.value = String(d); o.textContent = ordinal(d);
        daySel.appendChild(o);
      }
      daySel.value = String(now.getDate());
      const monSel = document.getElementById('mandate_month');
      MONTHS.forEach((m, i) => {
        const o = document.createElement('option');
        o.value = String(i); o.textContent = m;
        monSel.appendChild(o);
      });
      monSel.value = String(now.getMonth());
      document.getElementById('mandate_year').value = String(now.getFullYear());

      const cb = document.getElementById('mandate_include');
      cb.checked = DEFAULT_ON.includes(state.entityType);
      document.getElementById('mandateIncludeRow').classList.toggle('checked', cb.checked);

      built = true;
      setTimeout(initSigCanvas, 120);
    }

    syncPeople(state);
    refresh();
  }

  function ordinal(d) {
    const s = ['th', 'st', 'nd', 'rd'], v = d % 100;
    return d + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function capacityLabel(state) {
    const map = { company: 'DIRECTOR', cc: 'MEMBER', npo: 'DIRECTOR', trust: 'TRUSTEE', school: 'DIRECTOR', bodycorp: 'TRUSTEE' };
    return map[state && state.entityType] || 'DIRECTOR';
  }

  /* Repopulate the signatory dropdown from step 3 without clobbering anything
     the client has already typed over. */
  function syncPeople(state) {
    const sel = document.getElementById('mandate_person');
    if (!sel) return;
    const people = signatories();
    const prev = sel.value;
    const typeChanged = lastType !== (state && state.entityType);
    lastType = state && state.entityType;
    sel.innerHTML = '';
    people.forEach((p, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = (p.name || '(unnamed)') + (p.capacity ? ' — ' + p.capacity : '');
      sel.appendChild(o);
    });
    const other = document.createElement('option');
    other.value = 'other'; other.textContent = 'Someone else / enter manually';
    sel.appendChild(other);
    sel.value = (prev && [...sel.options].some(o => o.value === prev)) ? prev : (people.length ? '0' : 'other');

    const label = sel.closest('.field').querySelector('label');
    if (label) label.innerHTML = 'Signing ' + capacityLabel(state).toLowerCase() + ' <span class="req">*</span>';

    /* A changed entity type means a different set of people and a different
       capacity, so re-pull the signatory rather than leaving the old one. */
    if (typeChanged) document.getElementById('mandate_capacity').value = capacityLabel(state);
    if (typeChanged || (!val('mandate_name') && !val('mandate_id'))) onPerson();
    if (!val('mandate_capacity')) document.getElementById('mandate_capacity').value = capacityLabel(state);
  }

  function onPerson() {
    const sel = document.getElementById('mandate_person');
    const people = signatories();
    const p = sel && sel.value !== 'other' ? people[Number(sel.value)] : null;
    if (p) {
      document.getElementById('mandate_name').value = formalName(p.name);
      document.getElementById('mandate_id').value = p.id || '';
      if (p.capacity) document.getElementById('mandate_capacity').value = String(p.capacity).toUpperCase();
    }
    refresh();
  }

  function toggleInclude(e) {
    const cb = document.getElementById('mandate_include');
    if (e && e.target !== cb) cb.checked = !cb.checked;
    document.getElementById('mandateIncludeRow').classList.toggle('checked', cb.checked);
    refresh();
  }

  /* ── signature pad ────────────────────────────────────────────────── */

  function initSigCanvas() {
    const canvas = document.getElementById('mandate_sig_canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 480;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1F2D45'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    let drawing = false;
    const stop = () => { if (drawing) { drawing = false; captureSig(); } };
    canvas.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    canvas.addEventListener('mousemove', e => { if (!drawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', e => {
      e.preventDefault(); drawing = true;
      const t = e.touches[0], r = canvas.getBoundingClientRect();
      ctx.beginPath(); ctx.moveTo(t.clientX - r.left, t.clientY - r.top);
    });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault(); if (!drawing) return;
      const t = e.touches[0], r = canvas.getBoundingClientRect();
      ctx.lineTo(t.clientX - r.left, t.clientY - r.top); ctx.stroke();
    });
    canvas.addEventListener('touchend', stop);
  }

  /* Store the signature cropped to its ink. A stroke covering a third of a wide
     pad would otherwise be scaled by the pad's aspect ratio and land on the
     page far too small. */
  function captureSig() {
    const canvas = document.getElementById('mandate_sig_canvas');
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) { sigDataUrl = ''; refresh(); return; }
    const pad = 4;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const crop = document.createElement('canvas');
    crop.width = cw; crop.height = ch;
    crop.getContext('2d').drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
    sigDataUrl = crop.toDataURL('image/png');
    sigSize = { w: cw, h: ch };
    refresh();
  }

  function clearSig() {
    const canvas = document.getElementById('mandate_sig_canvas');
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    sigDataUrl = '';
    refresh();
  }

  function hasSignature() { return !!sigDataUrl; }

  /* ── data ─────────────────────────────────────────────────────────── */

  function data() {
    const monthIdx = Number(val('mandate_month') || 0);
    return {
      company: val('ei_name'),
      regNo: val('ei_regno'),
      tel: val('ei_tel'),
      address: val('ei_registered') || val('ei_physical'),
      place: val('mandate_place'),
      day: val('mandate_day'),
      dayOrdinal: val('mandate_day') ? ordinal(Number(val('mandate_day'))) : '',
      month: MONTHS[monthIdx] || '',
      year: val('mandate_year'),
      name: val('mandate_name'),
      id: val('mandate_id'),
      capacity: (val('mandate_capacity') || 'DIRECTOR').toUpperCase()
    };
  }

  /* ── live preview ─────────────────────────────────────────────────── */

  function fill(text, cls) {
    const c = 'm-fill' + (cls ? ' ' + cls : '');
    return text
      ? `<span class="${c}">${esc(text)}</span>`
      : `<span class="${c} m-blank">&nbsp;</span>`;
  }

  function refresh() {
    const sheet = document.getElementById('mandateSheet');
    if (!sheet) return;
    const d = data();
    sheet.classList.toggle('is-off', !included());

    const yy = (d.year || '').slice(-2);
    const addr = esc(d.address || '').replace(/\n/g, '<br>');

    sheet.innerHTML = `
      <div class="m-title">${esc(d.company || 'ENTITY NAME')}</div>
      <div class="m-meta">Registration No.: ${esc(d.regNo || '—')}</div>
      <div class="m-meta">Telephone No.: ${esc(d.tel || '—')}</div>
      <div class="m-meta">Registered Address: ${addr || '—'}</div>
      <div class="m-company">("the Company")</div>
      <div class="m-rule"></div>
      <div class="m-res">RESOLUTION OF THE BOARD OF DIRECTORS OF THE COMPANY PASSED IN ACCORDANCE WITH THE
        PROVISIONS OF THE COMPANIES ACT 71 OF 2008 (AS AMENDED) ("the Act")</div>
      <div class="m-rule"></div>
      <div class="m-mandate">MANDATE</div>

      <div class="m-h">Introduction</div>
      <p class="m-p">The Board seeks to authorise ${esc(AGENT.name)}, ID number ${esc(AGENT.id)},
        (Email Address – ${esc(AGENT.email)}), with CIPC Customer Code ${esc(AGENT.code)} of ${esc(AGENT.firm)},
        (<b>"the Agent"</b>) to file the beneficial ownership information of the Company
        (<b>"the Beneficial Ownership"</b>) with the Companies and Intellectual Property Commission
        (<b>"the CIPC"</b>).</p>

      <div class="m-h">Waiver of Notice of Meeting</div>
      <p class="m-p">All of the directors of the Company hereby waive notice of this meeting in terms of
        Section 73(5)(a)(iii) of the Act, and further that the resolutions taken in terms hereof are taken in
        accordance with the provisions of section 74(1) of the Act.</p>

      <div class="m-h">Ordinary Resolution 1:</div>
      <p class="m-p">It is hereby resolved by the Board that the Agent be authorised to act on the Board's behalf,
        and further on behalf of the Company, to lodge the Beneficial Ownership and any other prescribed
        information and supporting documents with the CIPC.</p>
      <p class="m-p" style="margin-top:12px">Section 50(3A)(a) and Section 56(12) of the Act.</p>

      <div class="m-signedat">
        Signed at ${fill(d.place)} on this ${fill(d.dayOrdinal, 'sm')} day of ${fill(d.month)} 20${fill(yy, 'sm')}.
      </div>

      <div class="m-sigrow">
        <div class="m-sigcol">
          <div class="m-sigink">${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signature">` : ''}</div>
          <div class="m-sigline"></div>
          <div class="m-signame">${esc(d.name || 'SURNAME, FIRST NAMES')}</div>
          <div class="m-sigid">IDENTITY NUMBER: ${esc(d.id || '—')}</div>
          <div class="m-sigid">${esc(d.capacity)}</div>
        </div>
        <div class="m-sigcol">
          <div class="m-sigink"></div>
          <div class="m-sigline"></div>
          <div class="m-signame">${esc(WITNESS.name)}</div>
          <div class="m-sigid">IDENTITY NUMBER: ${esc(WITNESS.id)}</div>
          <div class="m-sigid">${esc(WITNESS.role)}</div>
        </div>
      </div>`;
  }

  /* ── PDF ──────────────────────────────────────────────────────────── */

  function appendToPdf(doc, opts) {
    if (!included()) return;
    window.VDMMandatePdf.render(doc, opts || {}, data(), { url: sigDataUrl, size: sigSize }, { AGENT, WITNESS });
  }

  /* Everything the resolution needs before it is worth putting in the PDF. */
  function validate() {
    if (!included()) return null;
    const d = data();
    if (!d.place) return 'Please enter the town or city where the mandate is signed.';
    if (!d.name) return 'Please enter the name of the person signing the mandate.';
    if (!d.year || !/^\d{4}$/.test(d.year)) return 'Please enter a four-digit year for the mandate signature date.';
    if (!hasSignature()) return 'Please sign the mandate before submitting.';
    return null;
  }

  /* ── summary for the notification payload ─────────────────────────── */

  function summary() {
    if (!included()) return { mandate_included: 'No' };
    const d = data();
    return {
      mandate_included: 'Yes',
      mandate_signed_at: d.place,
      mandate_date: `${d.dayOrdinal} ${d.month} ${d.year}`,
      mandate_signatory: d.name,
      mandate_signatory_id: d.id,
      mandate_signatory_capacity: d.capacity,
      mandate_signed: hasSignature() ? 'Yes' : 'No'
    };
  }

  window.VDMMandate = {
    build, refresh, applies, included, toggleInclude, onPerson,
    clearSig, hasSignature, validate, appendToPdf, summary, data
  };
})();
