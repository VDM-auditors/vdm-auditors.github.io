/* ------------------------------------------------------------------
   Address autocomplete — HERE Autosuggest, with Photon (OSM) fallback
   ------------------------------------------------------------------
   Attaches a suggestion dropdown to every address field in the wizard.
   Picking a suggestion writes back a single comma-separated line:
       12 Main Street, Melville, Johannesburg, 2430

   Single line (not multi-line) on purpose — the mandate page reads only
   the first line of the residential address, so a wrapped address would
   silently lose its suburb / city / postal code there.

   Fields are matched by id suffix and bound through a delegated listener,
   so dynamically rendered person blocks (directors, trustees, ...) are
   picked up without any extra wiring.

   Why HERE and not OSM
   --------------------
   Photon searches OpenStreetMap, whose house-number coverage in South
   Africa is thin outside a few metro suburbs — street-level hits were
   fine, exact house numbers often were not. HERE carries a commercial
   ZA address set with real point addresses, and flags them: a result of
   type `houseNumber` with houseNumberType `PA` is a surveyed position
   rather than an interpolation along the street.

   Setup — set this before the script loads:

       window.HERE_CONFIG = { apiKey: 'your-here-api-key' };

   The key ships in client-side JS because this is a static site, so lock
   it down in the HERE platform console: restrict it to the Geocoding &
   Search API and to the referrer https://vdm-auditors.github.io/*.

   With no key set, this silently falls back to the keyless public Photon
   instance — so the form keeps working if the key is missing, blocked or
   over quota, just with the old accuracy.
------------------------------------------------------------------- */
(function () {
  'use strict';

  var CFG = window.HERE_CONFIG || {};
  var HERE_KEY = CFG.apiKey || window.HERE_API_KEY || '';
  var HERE_ENDPOINT = CFG.endpoint || 'https://autosuggest.search.hereapi.com/v1/autosuggest';

  var PCFG = window.PHOTON_CONFIG || {};
  var PHOTON_ENDPOINT = PCFG.endpoint || 'https://photon.komoot.io/api/';

  // Photon needs a hard box or "Main Street" returns Maine, USA. HERE is
  // filtered by country code instead, which is exact.
  var ZA_BBOX = '16.3,-35.0,33.0,-22.0';
  var ZA_LAT = -29.0;
  var ZA_LON = 24.0;

  var MIN_CHARS = 3;
  var DEBOUNCE_MS = 300;
  var LIMIT = 6;

  // Any field whose id ends with one of these gets autocomplete.
  var SUFFIXES = ['_physical', '_registered', '_postal', '_postal_reg', '_residential'];

  function isAddressField(el) {
    if (!el || !el.id) return false;
    if (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT') return false;
    if (el.dataset.noAutocomplete === 'true') return false;
    for (var i = 0; i < SUFFIXES.length; i++) {
      if (el.id.slice(-SUFFIXES[i].length) === SUFFIXES[i]) return true;
    }
    return false;
  }

  /* ---------------- location bias ---------------- */

  // HERE requires a spatial anchor on every autosuggest call. Default to
  // the middle of the country, then narrow to the user's actual position
  // once they allow it — that is what makes "Main" resolve to the Main
  // Road in their town rather than the biggest one in the country.
  var bias = { lat: ZA_LAT, lon: ZA_LON, precise: false };
  var askedForLocation = false;

  function requestLocation() {
    if (askedForLocation || !navigator.geolocation) return;
    askedForLocation = true;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        bias = { lat: pos.coords.latitude, lon: pos.coords.longitude, precise: true };
      },
      function () { /* denied or unavailable — country-wide bias stands */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }

  /* ---------------- styles ---------------- */

  var STYLE = [
    '.addr-ac-list{position:fixed;z-index:9999;background:var(--card,#fff);',
    'border:1px solid var(--border,#D4DCE8);border-radius:var(--radius-sm,4px);',
    'box-shadow:var(--shadow-md,0 4px 20px rgba(13,31,60,.12));',
    'max-height:280px;overflow-y:auto;display:none;padding:4px}',
    '.addr-ac-list.open{display:block}',
    '.addr-ac-item{padding:8px 10px;cursor:pointer;border-radius:3px;line-height:1.35}',
    '.addr-ac-item:hover,.addr-ac-item.active{background:var(--accent-bg,#FBF7ED)}',
    '.addr-ac-main{font-size:13px;color:var(--text,#0D1F3C);font-weight:600}',
    '.addr-ac-sub{font-size:11px;color:var(--text-muted,#5A6E8A);margin-top:2px}',
    '.addr-ac-tag{display:inline-block;margin-left:6px;padding:1px 5px;border-radius:2px;',
    'font-size:9px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;',
    'color:var(--accent-text,#8A6D24);background:var(--accent-bg,#FBF7ED);',
    'border:1px solid var(--accent,#C9A961);vertical-align:middle}',
    '.addr-ac-note{padding:8px 10px;font-size:11px;color:var(--text-muted,#5A6E8A)}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  /* ---------------- dropdown ---------------- */

  var list = document.createElement('div');
  list.className = 'addr-ac-list';
  list.setAttribute('role', 'listbox');
  document.body.appendChild(list);

  var activeField = null;
  var results = [];
  var cursor = -1;
  var timer = null;
  var seq = 0;

  function close() {
    list.classList.remove('open');
    activeField = null;
    results = [];
    cursor = -1;
  }

  function position(field) {
    var r = field.getBoundingClientRect();
    list.style.left = r.left + 'px';
    list.style.top = (r.bottom + 4) + 'px';
    list.style.width = r.width + 'px';
  }

  function note(field, text) {
    list.innerHTML = '<div class="addr-ac-note">' + text + '</div>';
    position(field);
    list.classList.add('open');
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function join(parts) {
    var out = [], seen = {};
    for (var i = 0; i < parts.length; i++) {
      var p = (parts[i] || '').trim();
      if (!p) continue;
      var k = p.toLowerCase();
      if (seen[k]) continue;
      seen[k] = true;
      out.push(p);
    }
    return out.join(', ');
  }

  // SA boundary names nobody writes on an envelope.
  function cleanSuburb(d) {
    d = (d || '').trim();
    return /ward\s*\d+/i.test(d) ? '' : d;
  }

  function cleanTown(c) {
    return (c || '').trim().replace(/\s+(Local|Metropolitan|District)\s+Municipality$/i, '');
  }

  /* ---------------- HERE adapter ---------------- */

  // Autosuggest mixes in "chainQuery"/"categoryQuery" rows that are search
  // refinements, not addresses — they carry an href instead of an address.
  var HERE_RANK = {
    houseNumber: 0, place: 1, intersection: 2, street: 3,
    addressBlock: 4, locality: 5, administrativeArea: 6
  };

  function hereUsable(item) {
    return !!(item && item.address && HERE_RANK[item.resultType] !== undefined);
  }

  function hereNormalise(item) {
    var a = item.address || {};
    var street = a.street || '';
    var line = street ? ((a.houseNumber ? a.houseNumber + ' ' : '') + street) : '';
    var foreign = a.countryCode && a.countryCode !== 'ZAF';
    // For a POI the title is the place name and the street is the road —
    // keep both, the way it would be written on a letterhead.
    var isPoi = item.resultType === 'place' && item.title && item.title !== line;

    return {
      lead: isPoi ? join([item.title, line]) : (line || item.title || ''),
      suburb: cleanSuburb(a.district || a.subdistrict),
      town: cleanTown(a.city || a.county),
      postcode: a.postalCode || '',
      region: a.state || '',
      country: foreign ? (a.countryName || '') : '',
      // A surveyed point address, as opposed to a position interpolated
      // along the street from the numbers on either side of it.
      exact: item.resultType === 'houseNumber' && item.houseNumberType === 'PA',
      rank: HERE_RANK[item.resultType]
    };
  }

  function hereQuery(q, restrictToZA) {
    var url = HERE_ENDPOINT +
      '?q=' + encodeURIComponent(q) +
      '&at=' + bias.lat.toFixed(5) + ',' + bias.lon.toFixed(5) +
      '&limit=' + (LIMIT * 3) +
      '&lang=en-ZA' +
      '&apiKey=' + encodeURIComponent(HERE_KEY);
    if (restrictToZA) url += '&in=countryCode:ZAF';

    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        var items = ((d && d.items) || []).filter(hereUsable).map(hereNormalise);
        // Stable sort — pull exact house numbers above localities, but
        // otherwise leave HERE's own relevance order alone.
        items.forEach(function (it, i) { it._i = i; });
        items.sort(function (a, b) { return (a.rank - b.rank) || (a._i - b._i); });
        return items.slice(0, LIMIT);
      });
  }

  /* ---------------- Photon adapter (fallback) ---------------- */

  function photonNormalise(f) {
    var p = f.properties || {};
    var line = p.street ? ((p.housenumber ? p.housenumber + ' ' : '') + p.street) : '';
    var isPoi = p.name && p.street && p.name !== p.street;
    var foreign = p.countrycode && p.countrycode !== 'ZA';
    return {
      lead: isPoi ? join([p.name, line]) : (line || p.name || ''),
      suburb: cleanSuburb(p.district),
      town: cleanTown(p.city || p.county),
      postcode: p.postcode || '',
      region: p.state || '',
      country: foreign ? (p.country || '') : '',
      exact: false,
      rank: 0
    };
  }

  function photonQuery(q, restrictToZA) {
    var url = PHOTON_ENDPOINT + '?q=' + encodeURIComponent(q) + '&limit=' + LIMIT + '&lang=en';
    url += restrictToZA
      ? '&bbox=' + ZA_BBOX
      : '&lat=' + bias.lat.toFixed(5) + '&lon=' + bias.lon.toFixed(5);
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { return ((d && d.features) || []).map(photonNormalise); });
  }

  /* ---------------- formatting ---------------- */

  function formatAddress(a) {
    return join([a.lead, a.suburb, a.town, a.postcode, a.country]);
  }

  function labelFor(a) {
    var sub = join([a.suburb, a.town, a.region, a.postcode, a.country]);
    return { main: a.lead || sub, sub: a.lead ? sub : '', exact: a.exact };
  }

  /* ---------------- rendering ---------------- */

  function render(field) {
    if (!results.length) { note(field, 'No matching address found'); return; }
    var html = '';
    for (var i = 0; i < results.length; i++) {
      var l = labelFor(results[i]);
      html += '<div class="addr-ac-item' + (i === cursor ? ' active' : '') + '" data-i="' + i + '" role="option">' +
        '<div class="addr-ac-main">' + esc(l.main) +
        (l.exact ? '<span class="addr-ac-tag">Verified</span>' : '') + '</div>' +
        (l.sub ? '<div class="addr-ac-sub">' + esc(l.sub) + '</div>' : '') +
        '</div>';
    }
    list.innerHTML = html;
    position(field);
    list.classList.add('open');
  }

  function choose(i) {
    if (!activeField || !results[i]) return;
    var field = activeField;
    field.value = formatAddress(results[i]);
    close();
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ---------------- search ---------------- */

  // One switch for the whole file: keyed HERE if configured, else Photon.
  var lookup = HERE_KEY ? hereQuery : photonQuery;

  function search(field) {
    var q = field.value.trim();
    if (q.length < MIN_CHARS) { close(); return; }

    var mine = ++seq;
    activeField = field;
    note(field, 'Searching…');

    // ZA-only first; fall back worldwide for foreign directors / shareholders.
    lookup(q, true)
      .then(function (items) { return items.length ? items : lookup(q, false); })
      .catch(function (err) {
        // Key rejected, quota gone, HERE down — drop to Photon rather than
        // leaving the user with a dead dropdown.
        if (lookup !== photonQuery) {
          console.warn('HERE autosuggest failed, falling back to Photon:', err);
          return photonQuery(q, true).then(function (items) {
            return items.length ? items : photonQuery(q, false);
          });
        }
        throw err;
      })
      .then(function (items) {
        if (mine !== seq || activeField !== field) return;
        results = items;
        cursor = -1;
        render(field);
      })
      .catch(function () {
        if (mine !== seq || activeField !== field) return;
        // Offline, or every geocoder is down — typing by hand still works.
        close();
      });
  }

  /* ---------------- events (delegated) ---------------- */

  // Ask for location on first contact with an address field, not on page
  // load — a permission prompt the moment the wizard opens reads badly.
  document.addEventListener('focusin', function (e) {
    if (isAddressField(e.target)) requestLocation();
  });

  document.addEventListener('input', function (e) {
    if (!isAddressField(e.target)) return;
    clearTimeout(timer);
    var field = e.target;
    timer = setTimeout(function () { search(field); }, DEBOUNCE_MS);
  });

  document.addEventListener('keydown', function (e) {
    if (!activeField || e.target !== activeField || !list.classList.contains('open')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return;
      e.preventDefault();
      cursor += (e.key === 'ArrowDown' ? 1 : -1);
      if (cursor < 0) cursor = results.length - 1;
      if (cursor >= results.length) cursor = 0;
      render(activeField);
    } else if (e.key === 'Enter') {
      if (cursor >= 0) { e.preventDefault(); choose(cursor); }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  list.addEventListener('mousedown', function (e) {
    // mousedown, not click — the field blurs before a click would fire.
    var item = e.target.closest('.addr-ac-item');
    if (!item) return;
    e.preventDefault();
    choose(parseInt(item.dataset.i, 10));
  });

  document.addEventListener('focusout', function (e) {
    if (e.target === activeField) setTimeout(close, 120);
  });

  window.addEventListener('scroll', function () {
    if (activeField && list.classList.contains('open')) position(activeField);
  }, true);

  window.addEventListener('resize', function () { close(); });
})();
