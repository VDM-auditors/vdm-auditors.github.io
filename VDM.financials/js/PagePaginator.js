// ── PagePaginator ──────────────────────────────────────────────────────────
// Splits overflowing .doc-page elements so that every page shows both its
// letterhead header and footer.  Used by PreviewManager for live preview
// pagination.
// ────────────────────────────────────────────────────────────────────────────

class PagePaginator {
  constructor(container) {
    this.container = container;
  }

  paginate() {
    if (!this.container) return;

    // Undo previous pagination: move content from continuation pages back,
    // then remove the empty shells, so re-pagination starts fresh.
    this.container.querySelectorAll('.doc-page[data-continuation]').forEach(cont => {
      const prev = cont.previousElementSibling;
      if (prev && prev.classList.contains('doc-page')) {
        const footer = prev.querySelector('.letterhead-footer');
        Array.from(cont.children).forEach(child => {
          if (this._isLeading(child) || this._isTrailing(child)) return;
          if (footer) prev.insertBefore(child, footer);
          else prev.appendChild(child);
        });
      }
      cont.remove();
    });

    const pages = Array.from(this.container.querySelectorAll('.doc-page'));
    pages.forEach(page => this._splitPage(page, 0));
  }

  _isLeading(el) {
    return el && el.classList &&
      (el.classList.contains('letterhead-img') || el.classList.contains('page-header'));
  }

  _isTrailing(el) {
    return el && el.classList &&
      (el.classList.contains('letterhead-footer') || el.classList.contains('page-number'));
  }

  _splitPage(page, depth) {
    if (depth > 25) return;

    const children = Array.from(page.children);

    let leadEnd = 0;
    while (leadEnd < children.length && this._isLeading(children[leadEnd])) leadEnd++;

    let trailStart = children.length;
    while (trailStart > leadEnd && this._isTrailing(children[trailStart - 1])) trailStart--;

    const leading  = children.slice(0, leadEnd);
    const middle   = children.slice(leadEnd, trailStart);
    const trailing = children.slice(trailStart);

    if (middle.length < 2) return;

    const saved = {
      h: page.style.height, mn: page.style.minHeight,
      mx: page.style.maxHeight, ov: page.style.overflow
    };
    page.style.setProperty('height', 'auto', 'important');
    page.style.setProperty('min-height', '0', 'important');
    page.style.setProperty('max-height', 'none', 'important');
    page.style.setProperty('overflow', 'visible', 'important');

    const naturalH = page.getBoundingClientRect().height;

    page.style.height    = saved.h;
    page.style.minHeight = saved.mn;
    page.style.maxHeight = saved.mx;
    page.style.overflow  = saved.ov;

    const lockedH = page.getBoundingClientRect().height;
    if (naturalH <= lockedH + 1) return;

    const pageRect = page.getBoundingClientRect();
    const styles   = window.getComputedStyle(page);
    const pBot     = parseFloat(styles.paddingBottom) || 0;
    let trailingH  = 0;
    trailing.forEach(t => { trailingH += t.getBoundingClientRect().height; });
    const maxBottom = pageRect.top + lockedH - pBot - trailingH;

    let cutoff = -1;
    for (let i = 0; i < middle.length; i++) {
      if (middle[i].getBoundingClientRect().bottom > maxBottom) { cutoff = i; break; }
    }

    if (cutoff <= 0) return;

    const newPage = document.createElement('div');
    newPage.className = page.className;
    newPage.setAttribute('data-continuation', 'true');
    const inlineStyle = page.getAttribute('style');
    if (inlineStyle) newPage.setAttribute('style', inlineStyle);

    leading.forEach(el => newPage.appendChild(el.cloneNode(true)));

    for (let j = cutoff; j < middle.length; j++) {
      if (middle[j].classList && middle[j].classList.contains('page-number')) {
        middle[j].parentNode.removeChild(middle[j]);
      } else {
        newPage.appendChild(middle[j]);
      }
    }

    trailing.forEach(el => {
      if (!el.classList.contains('page-number'))
        newPage.appendChild(el.cloneNode(true));
    });

    page.parentNode.insertBefore(newPage, page.nextSibling);

    this._splitPage(newPage, depth + 1);
  }
}
