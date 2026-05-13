/**
 * Orthodox Expedition — Marginalia v1
 * Chat 18 — Reading-lane marginalia rendering
 *
 * Renders C1-authored Marginalia speech bubbles in a band BELOW the
 * Gospel passage on bible-reader.html. Topic 00 only in v1.
 *
 * Source data: docs/content/topic-00-marginalia-v1.json
 *   42 bubbles across 15 sessions (00.1 → 00.15). C1 uses three
 *   placement_hint values: after_reading_start, middle_passage,
 *   after_reading_end. Sequence in the band: start → middle → end.
 *   before_reading and after_question are deferred (zero content
 *   in v1; renderer skips them gracefully).
 *
 * Architecture per Chat 18 Phase 1 orchestrator ruling:
 *   - Option A (D1 §2.2 canonical) — POST-PASSAGE BAND, not inline
 *     interleaved with verses.
 *   - Path A (no upstream URL edits) — session_id derived from URL
 *     params {book, chapter, vs, ve} matched against each session's
 *     parsed gospel_reference. All 15 references parse with the
 *     regex /^(.+?)\s+(\d+):(\d+)-(\d+)/.
 *
 * Per-bubble row layout (D1 §2.6 "portraits on left edge, banderoles
 * flowing right"): each bubble is a flex row with the speaker's
 * portrait on the left and the speech bubble (with left-pointing tail)
 * on the right. Both portraits appear naturally across the band when
 * both speakers have bubbles (all Topic 00 sessions). When a session
 * has only one speaker (no occurrences in Topic 00; forward-compat),
 * a companions strip renders at the top of the band so the
 * non-speaking companion is still present at 0.85 opacity per D1 §2.2.
 *
 * Per D1 §1.4 — witness-only, static portraits, no gaze-at-reader.
 * Per D1 §1.5 — prefers-reduced-motion compliance (CSS in bible-reader
 * + JS short-circuits the IntersectionObserver path).
 *
 * Defensive: silent failure on fetch, parse, or session mismatch.
 * The reading lane MUST NOT break if marginalia fails to load.
 *
 * Public API:
 *   window.Marginalia.mount(container, { sessionId } = {})
 *     - Returns Promise<boolean>: true if a band rendered, false if
 *       no matching session / load failure / no container.
 *     - Idempotent: any prior mount in the same container is cleared
 *       first.
 *     - sessionId is optional. When omitted, derived from URL.
 *   window.Marginalia.unmount()
 *     - Removes the active band element (and any stray
 *       [data-marginalia-mount=true] bands as defensive cleanup).
 */
(function () {
  'use strict';

  // Same prefix the service worker uses for STATIC_ASSETS so this path
  // is served from cache when offline.
  var JSON_URL = '/Orthodox-Expedition-/docs/content/topic-00-marginalia-v1.json';

  // Character portrait assets already in /assets/characters/ and in
  // sw.js STATIC_ASSETS as of v39. Relative paths so they resolve
  // correctly when bible-reader.html is served from GitHub Pages.
  var PORTRAIT_THEO         = 'assets/characters/theo-portrait.png';
  var PORTRAIT_CHRISTOPHER  = 'assets/characters/christopher-portrait.png';

  // Sequence order for bubble rendering inside the band.
  // before_reading and after_question are not authored in C1 v1; if a
  // future content batch uses them, they slot to the start/end
  // gracefully per these indices.
  var PLACEMENT_ORDER = {
    before_reading:      0,
    after_reading_start: 1,
    middle_passage:      2,
    after_reading_end:   3,
    after_question:      4
  };

  // Fallback book-name → book-code map. Used only if bible-reader's
  // global resolveBookId() is unavailable for any reason (e.g., if
  // marginalia.js is ever loaded on a page that doesn't include the
  // bible-reader JS). Covers all books referenced by C1's Topic 00
  // gospel_reference strings plus the most common forward-compat
  // entries. Bible-reader's JUMP_BOOK_MAP is preferred when present.
  var FALLBACK_BOOK_MAP = {
    'matthew':       'MAT', 'mt': 'MAT', 'matt': 'MAT',
    'mark':          'MRK', 'mk': 'MRK',
    'luke':          'LUK', 'lk': 'LUK',
    'john':          'JHN', 'jn': 'JHN',
    'acts':          'ACT',
    'romans':        'ROM',
    '1 corinthians': '1CO',
    '2 corinthians': '2CO',
    'galatians':     'GAL',
    'ephesians':     'EPH',
    'philippians':   'PHP',
    'colossians':    'COL',
    'hebrews':       'HEB',
    'james':         'JAS',
    '1 peter':       '1PE',
    '2 peter':       '2PE',
    '1 john':        '1JO',
    '2 john':        '2JO',
    '3 john':        '3JO',
    'jude':          'JUD',
    'revelation':    'REV',
    'genesis':       'GEN',
    'exodus':        'EXO',
    'psalms':        'PSA',
    'isaiah':        'ISA',
    '1 kings':       '1KI',
    '2 kings':       '2KI'
  };

  // Module-private caches. Reset on hard reload only.
  var _cachedJsonPromise = null;   // Promise<Object> — full marginalia JSON
  var _cachedIndex       = null;   // Map<session_id, { book_code, chapter, vs, ve, session }>
  var _activeBand        = null;   // The currently-mounted .marginalia-band element

  // ── Internal helpers ──────────────────────────────────────────────

  function _resolveBookCode(bookName) {
    if (typeof window.resolveBookId === 'function') {
      try {
        var code = window.resolveBookId(bookName);
        if (code) return code;
      } catch (_e) { /* fall through to fallback */ }
    }
    var norm = String(bookName || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return FALLBACK_BOOK_MAP[norm] || null;
  }

  // Parse a gospel_reference like "John 20:24-29 — Thomas Sees the
  // Risen Christ" into { book_code, chapter, vs, ve }. Returns null
  // on any parse failure or unknown book.
  function _parseGospelReference(ref) {
    if (!ref) return null;
    var m = String(ref).match(/^(.+?)\s+(\d+):(\d+)-(\d+)\b/);
    if (!m) return null;
    var bookCode = _resolveBookCode(m[1]);
    if (!bookCode) return null;
    var chapter = parseInt(m[2], 10);
    var vs      = parseInt(m[3], 10);
    var ve      = parseInt(m[4], 10);
    if (!Number.isFinite(chapter) || !Number.isFinite(vs) || !Number.isFinite(ve)) {
      return null;
    }
    return { book_code: bookCode, chapter: chapter, vs: vs, ve: ve };
  }

  // Fetch the marginalia JSON (cached by sw.js v43+) and build a
  // Map<session_id, parsedEntry>. Memoized; subsequent calls return
  // the cached index. On fetch/parse failure, returns null and
  // resets the cached promise so a later mount() may retry.
  async function _loadIndex() {
    if (_cachedIndex) return _cachedIndex;
    if (!_cachedJsonPromise) {
      _cachedJsonPromise = fetch(JSON_URL, { cache: 'default' }).then(function (r) {
        if (!r.ok) throw new Error('Marginalia JSON HTTP ' + r.status);
        return r.json();
      });
    }
    var data;
    try {
      data = await _cachedJsonPromise;
    } catch (_e) {
      _cachedJsonPromise = null;
      return null;
    }
    if (!data || !Array.isArray(data.sessions)) return null;
    var idx = new Map();
    data.sessions.forEach(function (s) {
      if (!s || !s.session_id) return;
      var ref = _parseGospelReference(s.gospel_reference);
      if (!ref) return;
      idx.set(s.session_id, {
        book_code: ref.book_code,
        chapter:   ref.chapter,
        vs:        ref.vs,
        ve:        ref.ve,
        session:   s
      });
    });
    _cachedIndex = idx;
    return idx;
  }

  // Match URL params {book, chapter, vs, ve} against the index. Exact
  // match on all four required — partial matches (e.g., chapter-only
  // links from free browsing) intentionally do not surface marginalia.
  function _deriveSessionIdFromUrl(index) {
    if (!index || index.size === 0) return null;
    try {
      var p   = new URLSearchParams(window.location.search);
      var bk  = p.get('book');
      var ch  = parseInt(p.get('chapter'), 10);
      var vs  = parseInt(p.get('vs'), 10);
      var ve  = parseInt(p.get('ve'), 10);
      if (!bk) return null;
      if (!Number.isFinite(ch) || !Number.isFinite(vs) || !Number.isFinite(ve)) return null;
      var entries = index.entries();
      var step;
      while (!(step = entries.next()).done) {
        var sessionId = step.value[0];
        var entry     = step.value[1];
        if (entry.book_code === bk
            && entry.chapter   === ch
            && entry.vs        === vs
            && entry.ve        === ve) {
          return sessionId;
        }
      }
    } catch (_e) { /* swallow */ }
    return null;
  }

  // Stable sort of bubbles by placement_hint per PLACEMENT_ORDER.
  // Unknown hints sort to the end. Preserves authoring order for
  // ties (defensive: C1 has at most 1 bubble per placement_hint
  // per session, so ties are not expected in v1).
  function _sortBubbles(bubbles) {
    var withIndex = (bubbles || []).map(function (b, i) {
      var order = PLACEMENT_ORDER[b && b.placement_hint];
      if (!Number.isFinite(order)) order = 999;
      return { b: b, order: order, i: i };
    });
    withIndex.sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return a.i - b.i;
    });
    return withIndex.map(function (x) { return x.b; });
  }

  // ── Rendering ──────────────────────────────────────────────────────

  function _buildPortrait(speaker, opts) {
    opts = opts || {};
    var img = document.createElement('img');
    img.className = 'marginalia-portrait marginalia-portrait-' + speaker;
    img.src = (speaker === 'christopher') ? PORTRAIT_CHRISTOPHER : PORTRAIT_THEO;
    img.alt = (speaker === 'christopher') ? 'Christopher' : 'Theo';
    img.setAttribute('aria-hidden', 'true');   // decorative; bubble carries the meaning
    img.setAttribute('draggable', 'false');
    img.setAttribute('loading', 'eager');
    if (opts.isNonSpeaking) img.classList.add('is-non-speaking');
    return img;
  }

  function _buildBubbleRow(bubble) {
    var speaker = (bubble.speaker === 'christopher') ? 'christopher' : 'theo';
    var row = document.createElement('div');
    row.className = 'marginalia-row marginalia-row-' + speaker;
    row.setAttribute('data-speaker', speaker);
    if (bubble.id) row.setAttribute('data-bubble-id', String(bubble.id));

    row.appendChild(_buildPortrait(speaker));

    var bub = document.createElement('div');
    bub.className = 'marginalia-bubble marginalia-bubble-' + speaker;
    (bubble.lines || []).forEach(function (line) {
      var ln = document.createElement('div');
      ln.className = 'marginalia-line';
      ln.textContent = String(line == null ? '' : line);
      bub.appendChild(ln);
    });
    row.appendChild(bub);
    return row;
  }

  function _renderBand(session) {
    if (!session) return null;
    var bubbles = _sortBubbles(session.bubbles || []);
    if (!bubbles.length) return null;

    var speakers = new Set();
    bubbles.forEach(function (b) {
      if (b && b.speaker) speakers.add(b.speaker);
    });

    var band = document.createElement('div');
    band.className = 'marginalia-band';
    band.setAttribute('data-marginalia-mount', 'true');
    band.setAttribute('data-session-id', session.session_id || '');
    band.setAttribute('role', 'complementary');
    band.setAttribute('aria-label', 'Theo and Christopher in the margin');

    // Companions strip — rendered only when one of the two speakers
    // has no bubbles, so the absent companion is still visually
    // present at 0.85 opacity per D1 §2.2. Topic 00 has no such
    // sessions; this code path is forward-compat.
    var theoActive        = speakers.has('theo');
    var christopherActive = speakers.has('christopher');
    if (!theoActive || !christopherActive) {
      var strip = document.createElement('div');
      strip.className = 'marginalia-companions';
      strip.appendChild(_buildPortrait('theo',        { isNonSpeaking: !theoActive }));
      strip.appendChild(_buildPortrait('christopher', { isNonSpeaking: !christopherActive }));
      band.appendChild(strip);
    }

    // Bubble rows in placement_hint sequence order.
    bubbles.forEach(function (b) {
      if (!b) return;
      band.appendChild(_buildBubbleRow(b));
    });

    return band;
  }

  // Scroll-reveal fade. Honors prefers-reduced-motion by skipping the
  // observer entirely and marking every row visible immediately.
  function _applyScrollReveal(band) {
    var rows = band.querySelectorAll('.marginalia-row');
    var reduced = false;
    try {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_e) { /* assume not reduced */ }

    if (reduced || typeof IntersectionObserver !== 'function') {
      rows.forEach(function (r) { r.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    rows.forEach(function (r) { io.observe(r); });
  }

  // ── Public API ─────────────────────────────────────────────────────

  async function mount(container, opts) {
    // Idempotent regardless of outcome — clear any prior mount first
    // so a no-match call still wipes a stale band.
    unmount();

    if (!container || typeof container.appendChild !== 'function') return false;
    opts = opts || {};

    var index;
    try {
      index = await _loadIndex();
    } catch (_e) {
      return false;
    }
    if (!index) return false;

    var sessionId = opts.sessionId || _deriveSessionIdFromUrl(index);
    if (!sessionId) return false;

    var entry = index.get(sessionId);
    if (!entry || !entry.session) return false;

    var band = _renderBand(entry.session);
    if (!band) return false;

    container.appendChild(band);
    _activeBand = band;
    _applyScrollReveal(band);
    return true;
  }

  function unmount() {
    if (_activeBand && _activeBand.parentNode) {
      _activeBand.parentNode.removeChild(_activeBand);
    }
    _activeBand = null;
    // Defensive sweep — remove any stray bands from earlier mounts
    // that may have been orphaned by a partial unmount path.
    var stray = document.querySelectorAll('[data-marginalia-mount="true"]');
    for (var i = 0; i < stray.length; i++) {
      if (stray[i].parentNode) stray[i].parentNode.removeChild(stray[i]);
    }
  }

  // Expose on window. Explicit assignment per the project's module
  // pattern (memory: "JS modules use `window.X = X` explicit bind").
  window.Marginalia = { mount: mount, unmount: unmount };
})();
