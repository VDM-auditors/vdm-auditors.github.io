/* ── VDM Questionnaire — interface polish ─────────────────────────────────
   Three small things the wizard's markup leans on:

     icons     Line icons drawn in the site's own stroke style, replacing the
               emoji the cards used to carry. Markup asks for one with
               <span data-icon="name"></span>; VDMUI.icon(name) returns the
               SVG string for code that builds HTML (mode.js).
     skeleton  The opening choice renders as placeholders until the web fonts
               are ready, so the first thing a client sees does not reflow.
     busy      A full-page overlay with a spinner while the PDF is generated —
               attachments are rasterised page by page and can take seconds.

   Loaded before mode.js, which reads VDMUI.icon() when it labels the mode.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // 24×24 paths, stroked with currentColor (Lucide-style geometry).
  const PATHS = {
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'file-plus': '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    homes: '<path d="M3 21V10l6-5 6 5v11"/><path d="M15 21V12l3-2.5 3 2.5v9"/><path d="M7 21v-5h4v5"/><path d="M2 21h20"/>',
    'file-check': '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>',
    check: '<polyline points="20 6 9 17 4 12"/>'
  };

  function icon(name) {
    return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
  }

  function drawIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  }

  /* ── skeleton → content ─────────────────────────────────────────────── */

  // Wait for the fonts, but never hold the page longer than this.
  const MAX_SKELETON_MS = 900;

  function reveal() {
    document.body.classList.remove('ui-loading');
  }

  /* ── busy overlay ───────────────────────────────────────────────────── */

  let overlay = null;

  // busy('message') shows the overlay; busy(false) hides it. Resolves once the
  // overlay has painted, so work started afterwards cannot freeze it unseen.
  function busy(message) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'ui-busy';
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.innerHTML = '<div class="ui-busy-box"><span class="ui-spinner"></span><p class="ui-busy-text"></p></div>';
      document.body.appendChild(overlay);
    }
    if (message === false) {
      overlay.classList.remove('show');
      return Promise.resolve();
    }
    overlay.querySelector('.ui-busy-text').textContent = message;
    overlay.classList.add('show');
    return new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
  }

  // The cards are clickable <div>s; let the keyboard reach and press them.
  function makeCardsKeyboardable() {
    document.querySelectorAll('.entity-card[onclick]').forEach(card => {
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    drawIcons();
    makeCardsKeyboardable();
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(r => setTimeout(r, MAX_SKELETON_MS))]).then(reveal, reveal);
  });

  window.VDMUI = { icon, drawIcons, busy };
})();
