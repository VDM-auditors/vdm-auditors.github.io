/* ── VDM Questionnaire — Attachments module ──────────────────────────────
   Handles: per-person ID document uploads, additional attachments,
   phone-camera capture via QR + WebRTC (PeerJS), and PDF embedding.
   Files never leave the browser: desktop ⇄ phone is peer-to-peer.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const CDN = {
    peer: 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
    qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  };

  /* Where the phone should open the capture page. When the desktop page is opened
     from disk (file://) or from a dev server on localhost, that address means
     nothing to a phone — fall back to the deployed copy. The peer link itself is
     origin-independent, so a phone on the live site still connects back here. */
  const LIVE_UPLOAD_URL = 'https://vdm-auditors.github.io/new-entity-registration/upload.html';

  const MAX_IMAGE_PX = 1800;
  const JPEG_QUALITY = 0.82;
  const MAX_FILE_BYTES = 12 * 1024 * 1024;

  /* slotId -> [{ name, mime, dataUrl, size }] */
  const store = {};
  let slots = [];
  let peer = null, phoneConn = null, activeSlot = null;
  const incoming = {};

  const isPhone = () => window.matchMedia('(pointer:coarse)').matches;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const val = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  /* ── which people need an ID document ─────────────────────────────── */
  function personSlots(state) {
    const out = [];
    const push = (prefix, label) => out.push({ id: prefix, label, prefix, kind: 'id' });
    const many = (prefix, n, label) => { for (let i = 1; i <= n; i++) push(`${prefix}_${i}`, `${label} ${i}`); };
    const c = state.counts;
    switch (state.entityType) {
      case 'company': many('dir', c.directors, 'Director'); many('shr', c.shareholders, 'Shareholder'); break;
      case 'cc': many('mem', c.members, 'Member'); break;
      case 'npo': many('npod', c.npo_directors, 'Director'); break;
      case 'individual': push('ind_1', 'Individual / Sole Proprietor'); break;
      case 'trust':
        push('donor_1', 'Donor / Founder');
        push('indep_trustee_1', 'Independent Trustee');
        many('trustee', c.trustees, 'Trustee');
        many('ben', c.beneficiaries, 'Beneficiary');
        break;
      case 'bodycorp': many('bct', c.bc_trustees, 'Trustee'); break;
      case 'school': break;
    }
    return out;
  }

  function slotTitle(slot) {
    if (slot.kind !== 'id') return slot.label;
    const name = val(slot.prefix + '_fullname');
    return name ? `${slot.label} — ${name}` : slot.label;
  }

  /* ── build the step ───────────────────────────────────────────────── */
  function build(state) {
    const container = document.getElementById('attachmentsContainer');
    if (!container) return;
    slots = personSlots(state);
    slots.push({ id: 'additional', label: 'Additional Attachments', kind: 'extra' });

    const intro = document.createElement('div');
    intro.className = 'card';
    intro.innerHTML = `<div class="card-header">Supporting Documents</div><div class="card-body">
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:10px">Upload a photo or PDF of each person's identity document, plus any other supporting documents (share certificates, proof of address, trust deed, resolutions). Everything you add here is appended to the PDF at the end.</p>
      <div class="notice">${isPhone()
        ? '📱 Tap <strong>Take Photo</strong> to use your camera, or <strong>Upload</strong> to pick an existing image or PDF.'
        : '💡 On a computer, use <strong>Upload</strong> — or click <strong>Scan with Phone</strong> to photograph a document with your phone and have it appear here instantly.'}</div>
      <p style="color:var(--text-muted);font-size:12px;margin-top:10px">Accepted: JPG, PNG, HEIC, WEBP and PDF · max 12&nbsp;MB per file · all files stay in your browser and are only written into your PDF.</p>
    </div>`;
    container.innerHTML = '';
    container.appendChild(intro);

    const idSlots = slots.filter(s => s.kind === 'id');
    if (idSlots.length) {
      const idCard = document.createElement('div');
      idCard.className = 'card';
      idCard.innerHTML = `<div class="card-header">Identity Documents</div><div class="card-body" id="attachIdBody"></div>`;
      container.appendChild(idCard);
      const body = document.getElementById('attachIdBody');
      idSlots.forEach(s => body.appendChild(slotEl(s)));
    }

    const extraCard = document.createElement('div');
    extraCard.className = 'card';
    extraCard.innerHTML = `<div class="card-header accent">Additional Attachments</div><div class="card-body" id="attachExtraBody"><p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">Share certificates, proof of address, bank confirmation letters, trust deeds, resolutions — anything else you would like us to have.</p></div>`;
    container.appendChild(extraCard);
    document.getElementById('attachExtraBody').appendChild(slotEl(slots.find(s => s.kind === 'extra')));

    slots.forEach(s => renderPreviews(s.id));
  }

  function slotEl(slot) {
    const wrap = document.createElement('div');
    wrap.className = 'attach-slot';
    wrap.id = 'attachslot_' + slot.id;
    const phoneBtn = isPhone()
      ? `<label class="attach-btn">📷 Take Photo<input type="file" accept="image/*" capture="environment" hidden onchange="VDMAttach.onPick('${slot.id}', this)"></label>`
      : `<button type="button" class="attach-btn ghost" onclick="VDMAttach.startPhone('${slot.id}')">📱 Scan with Phone</button>`;
    wrap.innerHTML = `
      <div class="attach-slot-head">
        <span class="attach-title">${esc(slotTitle(slot))}${slot.kind === 'id' ? ' — ID Document' : ''}</span>
        <span class="attach-count" id="attachcount_${slot.id}">No files</span>
      </div>
      <div class="attach-actions">
        <label class="attach-btn">⬆ Upload<input type="file" accept="image/*,application/pdf" multiple hidden onchange="VDMAttach.onPick('${slot.id}', this)"></label>
        ${phoneBtn}
      </div>
      <div class="attach-previews" id="attachprev_${slot.id}"></div>`;
    wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('dragging'); });
    wrap.addEventListener('dragleave', () => wrap.classList.remove('dragging'));
    wrap.addEventListener('drop', e => {
      e.preventDefault(); wrap.classList.remove('dragging');
      addFiles(slot.id, [...(e.dataTransfer.files || [])]);
    });
    return wrap;
  }

  /* ── file intake ──────────────────────────────────────────────────── */
  function onPick(slotId, input) {
    addFiles(slotId, [...input.files]);
    input.value = '';
  }

  async function addFiles(slotId, files) {
    for (const file of files) {
      if (!file) continue;
      if (file.size > MAX_FILE_BYTES) { alert(`"${file.name}" is larger than 12 MB. Please compress it or take a new photo.`); continue; }
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(file.name);
      if (!isPdf && !isImg) { alert(`"${file.name}" is not an image or PDF.`); continue; }
      try {
        const entry = isPdf ? await readPdf(file) : await readImage(file);
        (store[slotId] = store[slotId] || []).push(entry);
      } catch (e) {
        alert(`Could not read "${file.name}". Please try a different file.`);
      }
    }
    renderPreviews(slotId);
  }

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
    });
  }

  async function readPdf(file) {
    return { name: file.name, mime: 'application/pdf', dataUrl: await readAsDataURL(file), size: file.size };
  }

  async function readImage(file) {
    return downscale(await readAsDataURL(file), file.name);
  }

  function downscale(dataUrl, name) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve({ name: name || 'photo.jpg', mime: 'image/jpeg', dataUrl: out, size: Math.round(out.length * 0.75), w: canvas.width, h: canvas.height });
      };
      img.onerror = () => reject(new Error('decode failed'));
      img.src = dataUrl;
    });
  }

  function removeFile(slotId, i) {
    if (!store[slotId]) return;
    store[slotId].splice(i, 1);
    renderPreviews(slotId);
  }

  function renderPreviews(slotId) {
    const host = document.getElementById('attachprev_' + slotId);
    const count = document.getElementById('attachcount_' + slotId);
    if (!host) return;
    const files = store[slotId] || [];
    if (count) count.textContent = files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'No files';
    host.innerHTML = files.map((f, i) => `
      <div class="attach-thumb">
        ${f.mime === 'application/pdf'
        ? `<div class="attach-thumb-pdf">PDF</div>`
        : `<img src="${f.dataUrl}" alt="">`}
        <div class="attach-thumb-name" title="${esc(f.name)}">${esc(f.name)}</div>
        <button type="button" class="attach-thumb-x" title="Remove" onclick="VDMAttach.removeFile('${slotId}', ${i})">✕</button>
      </div>`).join('');
  }

  /* ── phone capture over WebRTC ────────────────────────────────────── */
  async function startPhone(slotId) {
    activeSlot = slotId;
    openModal('Preparing secure link…');
    try {
      await Promise.all([loadScript(CDN.peer), loadScript(CDN.qr)]);
    } catch (e) {
      return modalError('Could not load the phone-link component. Please check your internet connection, or use Upload instead.');
    }
    if (peer && !peer.destroyed && peer.id) return showQr(peer.id);
    try {
      peer = new Peer(null, { debug: 0 });
    } catch (e) {
      return modalError('Phone linking is unavailable in this browser. Please use Upload instead.');
    }
    peer.on('open', id => showQr(id));
    peer.on('error', () => modalError('The phone link could not be established. Please use Upload instead.'));
    peer.on('connection', conn => {
      phoneConn = conn;
      conn.on('open', () => setModalStatus('📱 Phone connected — take a photo on your phone.', true));
      conn.on('data', d => handlePhoneData(d));
      conn.on('close', () => setModalStatus('Phone disconnected.', false));
    });
  }

  function handlePhoneData(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'start') { incoming[msg.id] = { name: msg.name, mime: msg.mime, parts: [] }; setModalStatus('Receiving document…', true); return; }
    if (msg.t === 'chunk') { const f = incoming[msg.id]; if (f) f.parts.push(msg.d); return; }
    if (msg.t === 'end') {
      const f = incoming[msg.id]; if (!f) return;
      delete incoming[msg.id];
      const dataUrl = f.parts.join('');
      const target = activeSlot || 'additional';
      const finish = entry => {
        (store[target] = store[target] || []).push(entry);
        renderPreviews(target);
        setModalStatus('✓ Received. You can send another, or close this window.', true);
        if (phoneConn && phoneConn.open) phoneConn.send({ t: 'ack' });
      };
      if (f.mime === 'application/pdf') finish({ name: f.name, mime: 'application/pdf', dataUrl, size: dataUrl.length });
      else downscale(dataUrl, f.name).then(finish).catch(() => setModalStatus('That photo could not be read. Please try again.', false));
    }
  }

  /* ── QR modal ─────────────────────────────────────────────────────── */
  function openModal(status) {
    let m = document.getElementById('attachQrModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'attachQrModal';
      m.className = 'attach-modal';
      m.innerHTML = `<div class="attach-modal-box">
        <button type="button" class="attach-modal-x" onclick="VDMAttach.closeModal()">✕</button>
        <h3>Scan with your phone</h3>
        <p class="attach-modal-sub">Open your phone camera and point it at this code. Your phone opens a page where you can photograph the document — it appears here automatically.</p>
        <div class="attach-qr" id="attachQrBox"></div>
        <p class="attach-modal-status" id="attachQrStatus"></p>
        <p class="attach-modal-link">If your camera does not offer to open a link, type this address into your phone browser:<br><span id="attachQrLink"></span></p>
        <p class="attach-modal-fine">The document is sent directly from your phone to this computer. It is not uploaded to any VDM server.</p>
      </div>`;
      m.addEventListener('click', e => { if (e.target === m) closeModal(); });
      document.body.appendChild(m);
    }
    document.getElementById('attachQrBox').innerHTML = '';
    setModalStatus(status, true);
    m.style.display = 'flex';
  }

  function uploadPageUrl() {
    const host = location.hostname;
    const unreachable = location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '';
    return unreachable ? LIVE_UPLOAD_URL : new URL('upload.html', location.href).href;
  }

  function showQr(id) {
    const box = document.getElementById('attachQrBox');
    if (!box) return;
    const base = uploadPageUrl();
    const url = base + '#' + id;
    box.innerHTML = '';
    box.dataset.url = url;
    new QRCode(box, { text: url, width: 208, height: 208, colorDark: '#0D1F3C', colorLight: '#FFFFFF' });
    const link = document.getElementById('attachQrLink');
    if (link) link.textContent = url;
    setModalStatus('Waiting for your phone…', true);
  }

  function setModalStatus(text, ok) {
    const el = document.getElementById('attachQrStatus');
    if (el) { el.textContent = text; el.className = 'attach-modal-status' + (ok ? '' : ' err'); }
  }

  function modalError(text) {
    const box = document.getElementById('attachQrBox');
    if (box) box.innerHTML = '';
    setModalStatus(text, false);
  }

  function closeModal() {
    const m = document.getElementById('attachQrModal');
    if (m) m.style.display = 'none';
  }

  /* ── PDF output ───────────────────────────────────────────────────── */
  function allFiles() {
    const out = [];
    slots.forEach(s => (store[s.id] || []).forEach(f => out.push({ title: slotTitle(s) + (s.kind === 'id' ? ' — ID Document' : ''), file: f })));
    return out;
  }

  const hasAny = () => allFiles().length > 0;

  function summary() {
    const o = {};
    slots.forEach(s => { const f = store[s.id] || []; if (f.length) o['Attachment — ' + slotTitle(s)] = f.map(x => x.name).join(', '); });
    return o;
  }

  async function pdfPagesToImages(dataUrl) {
    await loadScript(CDN.pdfjs);
    const lib = window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker;
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const pdf = await lib.getDocument({ data: bytes }).promise;
    const images = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      // intent 'print' keeps pdf.js off requestAnimationFrame, which never fires
      // while the tab is in the background — otherwise generation can hang.
      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport, intent: 'print' });
      await Promise.race([
        task.promise,
        new Promise((_, rej) => setTimeout(() => { task.cancel(); rej(new Error('render timeout')); }, 20000))
      ]);
      images.push({ dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), w: canvas.width, h: canvas.height, page: p, pages: pdf.numPages });
    }
    return images;
  }

  /* Appends one page per attachment (or per PDF page) to a jsPDF doc. */
  async function appendToPdf(doc, opt) {
    const files = allFiles();
    if (!files.length) return;
    opt = opt || {};
    const W = opt.W || 210, H = opt.H || 297, margin = opt.margin || 14;
    const NAVY = [31, 45, 69], ACCENT = [200, 169, 81], WHITE = [255, 255, 255], TEXTMUT = [90, 106, 128];

    const imagePage = (title, sub, img) => {
      doc.addPage();
      doc.setFillColor(...NAVY); doc.roundedRect(margin, 14, W - margin * 2, 8, 1, 1, 'F');
      doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text(String(title).toUpperCase(), margin + 4, 19.5);
      doc.setTextColor(...TEXTMUT); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text(String(sub), margin, 27);
      const availW = W - margin * 2, availH = H - 46;
      const ratio = Math.min(availW / img.w, availH / img.h);
      const w = img.w * ratio, h = img.h * ratio;
      const x = margin + (availW - w) / 2, y = 30;
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.4);
      doc.rect(x - 1, y - 1, w + 2, h + 2, 'D');
      doc.addImage(img.dataUrl, 'JPEG', x, y, w, h);
    };

    for (const { title, file } of files) {
      if (file.mime === 'application/pdf') {
        try {
          const pages = await pdfPagesToImages(file.dataUrl);
          pages.forEach(p => imagePage(title, `${file.name} — page ${p.page} of ${p.pages}`, p));
        } catch (e) {
          doc.addPage();
          doc.setFontSize(9); doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold');
          doc.text(String(title).toUpperCase(), margin, 20);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
          doc.text(`Attached PDF "${file.name}" could not be rendered — please request it separately.`, margin, 28);
        }
      } else {
        const img = file.w ? file : await new Promise(res => { const i = new Image(); i.onload = () => res(Object.assign({}, file, { w: i.width, h: i.height })); i.src = file.dataUrl; });
        imagePage(title, file.name, img);
      }
    }
  }

  window.VDMAttach = { build, onPick, addFiles, removeFile, startPhone, closeModal, hasAny, summary, appendToPdf, allFiles };
})();
