/* ── VDM Questionnaire — Mandate, PDF rendering ──────────────────────────
   Draws the CIPC beneficial ownership resolution onto a jsPDF page, laid out
   to match the printed mandate VDM sends out. Owned by mandate.js, which
   supplies the filled-in data and the client's signature.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* Lay out a paragraph that mixes regular and bold runs, justified like the
     printed resolution. Returns the y position after the last line. */
  function richPara(doc, segs, x, y, maxW, lh, size) {
    doc.setFontSize(size);

    /* A word is a list of runs. A run only starts a new word where the source
       actually had whitespace, so ("the Agent") stays glued to its brackets. */
    const words = [];
    let open = false;
    segs.forEach(s => {
      doc.setFont('helvetica', s.b ? 'bold' : 'normal');
      String(s.t).split(/(\s+)/).forEach(piece => {
        if (piece === '') return;
        if (/^\s+$/.test(piece)) { open = false; return; }
        const run = { t: piece, b: !!s.b, w: doc.getTextWidth(piece) };
        if (open) words[words.length - 1].runs.push(run);
        else { words.push({ runs: [run] }); open = true; }
      });
    });
    words.forEach(w => { w.w = w.runs.reduce((a, r) => a + r.w, 0); });

    doc.setFont('helvetica', 'normal');
    const sp = doc.getTextWidth(' ');

    const lines = [];
    let cur = [], curW = 0;
    words.forEach(w => {
      if (cur.length && curW + sp + w.w > maxW) { lines.push(cur); cur = []; curW = 0; }
      curW += (cur.length ? sp : 0) + w.w;
      cur.push(w);
    });
    if (cur.length) lines.push(cur);

    lines.forEach((ln, i) => {
      let gap = sp;
      if (i < lines.length - 1 && ln.length > 1) {
        gap = (maxW - ln.reduce((a, w) => a + w.w, 0)) / (ln.length - 1);
        if (gap > sp * 3) gap = sp;
      }
      let cx = x;
      ln.forEach(w => {
        w.runs.forEach(r => {
          doc.setFont('helvetica', r.b ? 'bold' : 'normal');
          doc.text(r.t, cx, y);
          cx += r.w;
        });
        cx += gap;
      });
      y += lh;
    });
    doc.setFont('helvetica', 'normal');
    return y;
  }

  /* Draw the mandate on a fresh page. `d` is the filled-in resolution data,
     `sig` the cropped signature image, `parties` the fixed agent and witness. */
  function render(doc, opts, d, sig, parties) {
    const AGENT = parties.AGENT, WITNESS = parties.WITNESS;
    const W = opts.W || 210;
    const margin = opts.margin || 20;
    const cw = W - margin * 2;
    const cx = W / 2;

    doc.addPage();
    doc.setTextColor(0, 0, 0);

    let y = 34;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
    doc.text((d.company || 'ENTITY NAME').toUpperCase(), cx, y, { align: 'center', maxWidth: cw });
    y += 10;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
    doc.text('Registration No.: ' + (d.regNo || '—'), cx, y, { align: 'center' }); y += 6.5;
    doc.text('Telephone No.: ' + (d.tel || '—'), cx, y, { align: 'center' }); y += 6.5;

    const addrLines = doc.splitTextToSize('Registered Address: ' + (d.address || '—').replace(/\n+/g, ', '), cw);
    addrLines.forEach(l => { doc.text(l, cx, y, { align: 'center' }); y += 5.2; });
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('("the Company")', cx, y, { align: 'center' });
    y += 7;

    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.7);
    doc.line(margin, y, W - margin, y); y += 6;

    doc.setFontSize(9.8);
    doc.text('RESOLUTION OF THE BOARD OF DIRECTORS OF THE COMPANY PASSED IN ACCORDANCE WITH THE', cx, y, { align: 'center' }); y += 4.6;
    doc.text('PROVISIONS OF THE COMPANIES ACT 71 OF 2008 (AS AMENDED) ("the Act")', cx, y, { align: 'center' }); y += 4;
    doc.line(margin, y, W - margin, y); y += 12;

    doc.setFontSize(17);
    doc.text('MANDATE', cx, y, { align: 'center' }); y += 11;

    doc.setFontSize(10.5);
    doc.text('Introduction', margin, y); y += 5;
    y = richPara(doc, [
      { t: `The Board seeks to authorise ${AGENT.name}, ID number ${AGENT.id}, (Email Address – ${AGENT.email}), with CIPC Customer Code ${AGENT.code} of ${AGENT.firm}, (` },
      { t: '"the Agent"', b: true },
      { t: ') to file the beneficial ownership information of the Company (' },
      { t: '"the Beneficial Ownership"', b: true },
      { t: ') with the Companies and Intellectual Property Commission (' },
      { t: '"the CIPC"', b: true },
      { t: ').' }
    ], margin, y, cw, 4.9, 10.5);
    y += 6;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
    doc.text('Waiver of Notice of Meeting', margin, y); y += 5;
    y = richPara(doc, [{
      t: 'All of the directors of the Company hereby waive notice of this meeting in terms of Section 73(5)(a)(iii) of the Act, and further that the resolutions taken in terms hereof are taken in accordance with the provisions of section 74(1) of the Act.'
    }], margin, y, cw, 4.9, 10.5);
    y += 6;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
    doc.text('Ordinary Resolution 1:', margin, y); y += 5;
    y = richPara(doc, [{
      t: "It is hereby resolved by the Board that the Agent be authorised to act on the Board's behalf, and further on behalf of the Company, to lodge the Beneficial Ownership and any other prescribed information and supporting documents with the CIPC."
    }], margin, y, cw, 4.9, 10.5);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.text('Section 50(3A)(a) and Section 56(12) of the Act.', margin, y);
    y += 18;

    /* ── Signed at … on this … day of … 20 … ── */
    doc.setLineWidth(0.3);
    const segLine = (label, text, x, width) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      doc.text(label, x, y);
      const lx = x + doc.getTextWidth(label) + 1.5;
      doc.line(lx, y + 1.2, lx + width, y + 1.2);
      if (text) doc.text(text, lx + width / 2, y - 0.4, { align: 'center' });
      return lx + width + 2;
    };
    let x = margin;
    x = segLine('Signed at ', d.place, x, 46);
    x = segLine(' on this ', d.dayOrdinal, x, 15);
    x = segLine(' day of ', d.month, x, 32);
    x = segLine(' 20', (d.year || '').slice(-2), x, 10);
    doc.text('.', x, y);
    y += 24;

    /* ── signature blocks ── */
    const colW = 76;
    const leftX = margin;
    const rightX = W - margin - colW;

    if (sig.url) {
      let h = 15, w = h * (sig.size.w / sig.size.h);
      if (w > colW - 10) { w = colW - 10; h = w * (sig.size.h / sig.size.w); }
      try { doc.addImage(sig.url, 'PNG', leftX + 6, y - h - 1, w, h); } catch (e) { /* ignore */ }
    }

    doc.setLineWidth(0.4);
    doc.line(leftX, y, leftX + colW, y);
    doc.line(rightX, y, rightX + colW, y);
    y += 5;

    const block = (bx, name, idNum, role) => {
      let by = y;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(name, bx + colW / 2, by, { align: 'center', maxWidth: colW });
      by += 4.8;
      doc.setFont('helvetica', 'normal');
      doc.text('IDENTITY NUMBER:  ' + (idNum || '—'), bx + colW / 2, by, { align: 'center', maxWidth: colW });
      by += 4.8;
      doc.text(role, bx + colW / 2, by, { align: 'center', maxWidth: colW });
    };
    block(leftX, d.name || '', d.id, d.capacity);
    block(rightX, WITNESS.name, WITNESS.id, WITNESS.role);
  }

  window.VDMMandatePdf = { render };
})();
