/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Chat 20
   js/saint-cards.js — Iconography Literacy + Saint Bio Micro-Cards
   May 13, 2026

   PURPOSE
   Implements the saint micro-card system specified in D5
   (docs/design/iconography-saint-bio-micro-cards.md). Two
   integrated features in one module:

     (A) Iconography literacy primer — six foundational lessons
         (halo / hands / held / robes / Greek / gaze) delivered
         inline on the first six unique saint cards an explorer
         opens. Banner above callout #1; tracked per-explorer.

     (B) Saint micro-cards — tap a saint name on the home
         Liturgical Calendar drawer → modal opens with the
         saint's icon, 150-250-word narrator-voiced life story,
         and 2-3 visual-literacy callouts. Reopen from Field
         Manual "Saints I've Met" archive.

   PUBLIC API
     SaintCards.loadCorpus(sb) async
       → Returns { slugs:Set, byKey:Map, bySlug:Map, iconLessons }
       → Fail-soft on 404 / parse error: returns empty corpus,
         logs one console.debug, never throws.

     SaintCards.resolveSlug(name)  → slug | null
       → Normalize the LC string per D5 §7.3 and look up.

     SaintCards.hasCard(slug)      → bool
       → True iff slug resolves to a corpus saint.

     SaintCards.openCard(slug, ctx) async
       → Mounts the modal on top of the LC drawer. Reads explorer
         state to compute lessonNumber. Calls markSaintMet on
         close (first-tap-only logic is inside markSaintMet).

     SaintCards.markSaintMet(sb, explorerId, slug) async → bool
       → Idempotent per slug. On first call: appends
         {slug, first_met_at} to saints_met AND appends the next
         lesson number (≤6) to iconography_lessons_seen.

     SaintCards.hasMet(slug)         → bool   (synchronous, cache)
     SaintCards.nextLessonNumber()   → 1..6 | null (synchronous)

     SaintCards.loadArchiveFor(sb, explorerId) async → archive[]
     SaintCards.renderArchive(target, items, opts)

   STATE STORAGE (per-explorer)
   Written to profiles.onboarding_state JSONB (same column the
   welcome flow uses — Chat S precedent). Two new top-level keys:

     onboarding_state.saints_met = [
       { slug: "constantine-and-helen",
         first_met_at: "2026-05-21T09:42:00.000Z" },
       ...
     ]
     onboarding_state.iconography_lessons_seen = [1, 2, 3]

   ARCHITECTURE LOCKS HONORED (D1 + D5)
     • Witness-only — no character speaker inside cards
     • English-default; Greek only on Lesson 5 inscriptions
       (rendered via GFS Neohellenic where the corpus supplies it)
     • Father Nicholas deferred — no priestly voice in any card
     • Mom never authored as a speaker
     • prefers-reduced-motion respected (no fades/transforms)

   OPERATIONAL LEARNINGS HONORED
     #3  Discovery before code — slug-match algorithm reflects
         live-corpus literal forms captured in Chat 20 discovery
     #4  Schema-first — onboarding_state JSONB shape verified
         against live profiles row before writing
     #5  Liturgical-corpus literal verification — alternate_names
         arrays must include actual saint_commemorations strings,
         not assumed forms (orchestrator-routed to C3)
     #14 CSS classes over UA [hidden] for tap affordance
     #15 Structural fit over surface concept

   GRACEFUL DEGRADATION
   Absent JSON corpus or icon assets:
     • Corpus loader resolves to empty {slugs:Set(), byKey:Map()}.
     • LC drawer renders saint names as plain text (no underline,
       no ✦, no tap target).
     • Field Manual archive shows empty-state copy.
     • Icon <img> falls back to a parchment SVG placeholder via
       onerror.
     No console warnings or errors. One console.debug breadcrumb
     on 404 corpus fetch (per orchestrator Q-NEW-2 ruling).
   ───────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── CONSTANTS ────────────────────────────────────────────────────

  // Same path prefix the service worker uses for STATIC_ASSETS so
  // this is served from cache when offline (sw.js v49+).
  var JSON_URL = '/Orthodox-Expedition-/docs/content/saints/topic-00-saints-v1.json';

  // Byzantine palette per D5 visual register (do not deviate).
  var COLOR_GOLD       = '#C9A84C';
  var COLOR_DEEP_RED   = '#8B1A1A';
  var COLOR_NAVY       = '#1B2A4A';
  var COLOR_CREAM      = '#F5ECD7';
  var COLOR_PARCHMENT  = '#F0E4C8';

  // Parchment placeholder shown when the icon PNG is absent (per
  // dispatch §7 graceful-degrade + orchestrator A-4). Single SVG
  // data-URL: parchment-tone fill + faint Byzantine cross + the
  // word "Icon coming" in Cinzel-ish small caps. Sized 600×780 to
  // match the target icon dimensions per D5 §5.3.
  var ICON_PLACEHOLDER_DATAURL = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 780" preserveAspectRatio="xMidYMid meet">' +
    '<defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#F4E8C1"/>' +
    '<stop offset="100%" stop-color="#E8D5A0"/>' +
    '</linearGradient></defs>' +
    '<rect width="600" height="780" fill="url(#p)"/>' +
    '<g fill="none" stroke="#C9A84C" stroke-width="2" opacity="0.45">' +
      '<rect x="20" y="20" width="560" height="740" rx="6"/>' +
    '</g>' +
    '<g fill="#8B1A1A" opacity="0.42">' +
      '<rect x="288" y="280" width="24" height="220"/>' +
      '<rect x="220" y="340" width="160" height="20"/>' +
      '<rect x="240" y="300" width="120" height="12"/>' +
      '<path d="M250 480 L350 480 L340 510 L260 510 Z"/>' +
    '</g>' +
    '<text x="300" y="600" text-anchor="middle" ' +
          'font-family="Georgia,serif" font-size="22" fill="#8B1A1A" ' +
          'letter-spacing="6" opacity="0.7">ICON COMING</text>' +
    '</svg>'
  );

  // Lesson banner text per D5 §3.4 + §4.1 layout.
  function _lessonBannerText(n) {
    return 'How to read icons \u2014 Lesson ' + n + ' of 6';
  }

  // ── MODULE STATE ─────────────────────────────────────────────────

  var _corpusPromise   = null;  // Promise<corpus> — memoized fetch
  var _corpus          = null;  // Resolved corpus once loaded
  var _stateByExplorer = new Map();  // explorerId → state snapshot
  var _activeOverlay   = null;  // Currently-mounted .sc-overlay
  var _injectedCSS     = false;

  // Empty corpus default — what we return when 404 / parse error /
  // absent saints array. Engineering must not throw on any of these.
  function _emptyCorpus() {
    return {
      slugs:           new Set(),
      byKey:           new Map(),   // normalized_key → slug
      bySlug:          new Map(),   // slug → saint object
      iconLessons:     null,        // 6-lesson metadata header (or null)
      raw:             null         // full original JSON (or null)
    };
  }

  // ── NORMALIZATION + SLUG MATCHING (D5 §7.3) ─────────────────────

  // Honorifics stripped from the leading edge of a normalized
  // calendar string. Ordered longest-first so prefixes don't
  // collide (e.g., "our righteous father" must match before "father").
  // Matched only at start-of-string, after a single space normalization.
  var LEADING_HONORIFICS = [
    'our father among the saints ',
    'our righteous father ',
    'our holy father ',
    'the holy hieromartyr ',
    'the holy martyr ',
    'the holy ',
    'holy hieromartyr ',
    'holy martyr ',
    'holy ',
    'venerable ',
    'righteous father ',
    'righteous ',
    'father ',
    'bishop ',
    'saints ',
    'saint ',
    'sts. ',
    'sts ',
    'st. ',
    'st '
  ];

  // Trailing-title patterns stripped from the tail of the
  // normalized string. Pre-honorific stripping these are common
  // tails on Orthodox calendar entries.
  var TRAILING_TITLES_RE = [
    /,?\s+equal[- ]to[- ]the[- ]?apostles?$/i,
    /,?\s+patriarch of [a-z .'-]+$/i,
    /,?\s+archbishop of [a-z .'-]+$/i,
    /,?\s+bishop of [a-z .'-]+$/i,
    /,?\s+metropolitan of [a-z .'-]+$/i,
    /,?\s+abbot of [a-z .'-]+$/i,
    /,?\s+the wonderworker$/i,
    /,?\s+the (great|new|elder|younger|confessor|forerunner|theologian|philosopher)$/i,
    /,?\s+the holy apostle$/i,
    /,?\s+of [a-z .'-]+$/i      // "of Glendalough", "of Hippo", etc. — last because broadest
  ];

  // Normalize a raw calendar/display string per D5 §7.3 algorithm.
  // Returns the normalized lookup key (lowercase, hyphenated,
  // alphanumeric-plus-hyphen only). Empty input → empty string.
  function _normalize(raw) {
    if (raw == null) return '';
    var s = String(raw);

    // Lowercase + initial whitespace collapse + trim
    s = s.toLowerCase().replace(/\s+/g, ' ').trim();

    // Strip diacritics (NFD then drop combining-mark chars)
    if (typeof s.normalize === 'function') {
      try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
      catch (_e) { /* graceful — older runtimes */ }
    }

    // Strip leading honorific (one pass — longest-first ordering
    // means we don't loop)
    for (var i = 0; i < LEADING_HONORIFICS.length; i++) {
      var pref = LEADING_HONORIFICS[i];
      if (s.indexOf(pref) === 0) { s = s.substring(pref.length); break; }
    }

    // Strip trailing title patterns (one pass each — comma may
    // remain after .of-pattern fires; we then strip dangling
    // punctuation below)
    for (var j = 0; j < TRAILING_TITLES_RE.length; j++) {
      var prev = s;
      s = s.replace(TRAILING_TITLES_RE[j], '');
      // If a replacement fired, re-trim and stop further pattern matches
      // so we don't strip "of Tarsus" off something that legitimately
      // ends in "of-something" (e.g., a paired card slug shouldn't be
      // doubly trimmed). Conservative: one trailing strip per string.
      if (prev !== s) break;
    }

    // Collapse whitespace again post-strips
    s = s.replace(/\s+/g, ' ').trim();

    // Hyphenate spaces, then strip everything that isn't a-z 0-9 or hyphen
    s = s.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Collapse runs of multiple hyphens to one; trim hyphens at edges
    s = s.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

    return s;
  }

  // Public: resolve any raw name (LC string, display, slug,
  // alternate_name, etc.) to a corpus slug if recognized.
  function resolveSlug(name) {
    if (!_corpus) return null;
    var key = _normalize(name);
    if (!key) return null;
    var slug = _corpus.byKey.get(key);
    return slug || null;
  }

  function hasCard(slug) {
    if (!_corpus || !slug) return false;
    return _corpus.bySlug.has(slug);
  }

  // ── CORPUS LOAD (mirrors marginalia loader pattern) ─────────────

  // Public: load and memoize the corpus. Idempotent. Fail-soft on
  // every error mode — returns empty corpus, never throws. Caches
  // the result so LC tap path doesn't re-fetch on each saint open.
  async function loadCorpus(/* sb */) {
    if (_corpus) return _corpus;
    if (!_corpusPromise) {
      _corpusPromise = fetch(JSON_URL, { cache: 'default' })
        .then(function (r) {
          if (r.status === 404) {
            // Orchestrator Q-NEW-2: silent debug breadcrumb only.
            try { console.debug('[saint-cards] corpus not yet authored (404)'); } catch (_e) {}
            return null;
          }
          if (!r.ok) {
            try { console.debug('[saint-cards] corpus HTTP ' + r.status); } catch (_e) {}
            return null;
          }
          return r.json();
        })
        .catch(function (_e) {
          // Network or parse failure — silent per Q-NEW-2.
          try { console.debug('[saint-cards] corpus fetch failed (graceful)'); } catch (_eb) {}
          return null;
        });
    }

    var data;
    try {
      data = await _corpusPromise;
    } catch (_e) {
      data = null;
    }

    if (!data || !Array.isArray(data.saints)) {
      _corpus = _emptyCorpus();
      return _corpus;
    }

    var bySlug = new Map();
    var byKey  = new Map();
    var slugs  = new Set();

    data.saints.forEach(function (s) {
      if (!s || !s.slug) return;
      bySlug.set(s.slug, s);
      slugs.add(s.slug);
      // The slug itself is a key
      var slugKey = _normalize(s.slug);
      if (slugKey) byKey.set(slugKey, s.slug);
      // display_name is a key
      if (s.display_name) {
        var dnKey = _normalize(s.display_name);
        if (dnKey) byKey.set(dnKey, s.slug);
      }
      // alternate_names[] entries are keys
      if (Array.isArray(s.alternate_names)) {
        s.alternate_names.forEach(function (alt) {
          var k = _normalize(alt);
          if (k) byKey.set(k, s.slug);
        });
      }
    });

    _corpus = {
      slugs:       slugs,
      byKey:       byKey,
      bySlug:      bySlug,
      iconLessons: Array.isArray(data.iconography_lessons) ? data.iconography_lessons : null,
      raw:         data
    };
    return _corpus;
  }

  // ── STATE READ / WRITE (profiles.onboarding_state JSONB) ────────
  // Mirrors welcome-flow.js pattern: read-merge-write. RLS allows
  // explorer to update own row (auth.uid() = id). For admin views,
  // the dashboard never *writes* to a non-self profile — admin can
  // only render Nolan's archive, not tap saints as Nolan. So writes
  // here are always self-writes (explorerId === current user's
  // profile.id at the call site).

  async function _readOnboardingState(sb, explorerId) {
    if (!sb || !explorerId) return null;
    try {
      var resp = await sb
        .from('profiles')
        .select('onboarding_state')
        .eq('id', explorerId)
        .single();
      if (resp.error) {
        // Likely RLS denial (admin reading non-self) — graceful.
        return null;
      }
      return (resp.data && resp.data.onboarding_state) || {};
    } catch (_e) {
      return null;
    }
  }

  async function _writeOnboardingState(sb, explorerId, merged) {
    if (!sb || !explorerId || !merged) return false;
    try {
      var resp = await sb
        .from('profiles')
        .update({ onboarding_state: merged })
        .eq('id', explorerId);
      if (resp.error) return false;
      return true;
    } catch (_e) {
      return false;
    }
  }

  // Refresh and cache the explorer's state. Sync helpers (hasMet,
  // nextLessonNumber) read this cache, so callers must await this
  // before consulting them on first use.
  async function _refreshStateCache(sb, explorerId) {
    if (!explorerId) return null;
    var state = await _readOnboardingState(sb, explorerId);
    if (!state) state = {};
    _stateByExplorer.set(explorerId, {
      saintsMet:  Array.isArray(state.saints_met) ? state.saints_met.slice() : [],
      lessonsSeen: Array.isArray(state.iconography_lessons_seen) ? state.iconography_lessons_seen.slice() : [],
      raw:         state
    });
    return _stateByExplorer.get(explorerId);
  }

  function _stateFor(explorerId) {
    if (!explorerId) return { saintsMet: [], lessonsSeen: [] };
    return _stateByExplorer.get(explorerId) || { saintsMet: [], lessonsSeen: [] };
  }

  // Synchronous — reads cache only. Callers responsible for an
  // earlier _refreshStateCache (openCard does this in its prelude).
  function hasMet(slug, explorerId) {
    var st = _stateFor(explorerId);
    return st.saintsMet.some(function (e) { return e && e.slug === slug; });
  }

  function nextLessonNumber(explorerId) {
    var st = _stateFor(explorerId);
    var seen = new Set(st.lessonsSeen);
    for (var n = 1; n <= 6; n++) {
      if (!seen.has(n)) return n;
    }
    return null;
  }

  // First-tap-only state mutation. Idempotent per slug. On the FIRST
  // call for a given (explorerId, slug):
  //   • Append {slug, first_met_at:nowISO} to saints_met
  //   • If iconography_lessons_seen.length < 6, append the next
  //     lesson number atomically (per D5 §3.3 + orchestrator OQ-5)
  // On second+ call: returns true without mutation.
  async function markSaintMet(sb, explorerId, slug) {
    if (!sb || !explorerId || !slug) return false;

    // Always refresh — race-safety: if another tab made the write,
    // we want fresh state before the merge.
    var snap = await _refreshStateCache(sb, explorerId);
    if (!snap) return false;

    if (snap.saintsMet.some(function (e) { return e && e.slug === slug; })) {
      // Already met — idempotent no-op.
      return true;
    }

    var nowIso = new Date().toISOString();
    var newSaints  = snap.saintsMet.slice();
    newSaints.push({ slug: slug, first_met_at: nowIso });

    var newLessons = snap.lessonsSeen.slice();
    var lessonsSet = new Set(newLessons);
    var nextLesson = null;
    for (var n = 1; n <= 6; n++) {
      if (!lessonsSet.has(n)) { nextLesson = n; break; }
    }
    if (nextLesson !== null) newLessons.push(nextLesson);

    var merged = Object.assign({}, snap.raw || {}, {
      saints_met:                  newSaints,
      iconography_lessons_seen:    newLessons
    });

    var ok = await _writeOnboardingState(sb, explorerId, merged);
    if (ok) {
      _stateByExplorer.set(explorerId, {
        saintsMet:   newSaints,
        lessonsSeen: newLessons,
        raw:         merged
      });
    }
    return ok;
  }

  // ── CSS INJECTION ────────────────────────────────────────────────

  function _injectCSS() {
    if (_injectedCSS) return;
    if (typeof document === 'undefined') return;
    _injectedCSS = true;
    var css = [
      // ── Tap affordance (used in LC drawer — applied to <li> and
      //    <div class="lc-card-feast-name"> via lc-saint-tappable
      //    class) ─────────────────────────────────────────────────
      '.lc-saint-tappable{',
      '  cursor: pointer;',
      '  position: relative;',
      '  padding-right: 1.25rem;',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '.lc-saint-tappable::after{',
      '  content: "\\2726";', /* ✦ */
      '  position: absolute;',
      '  right: 0.25rem;',
      '  top: 50%;',
      '  transform: translateY(-50%);',
      '  color: ' + COLOR_GOLD + ';',
      '  font-size: 0.85em;',
      '  pointer-events: none;',
      '  font-variant-emoji: text;',
      '}',
      '.lc-saint-tappable .lc-saint-name,',
      '.lc-card-feast-name.lc-saint-tappable{',
      '  text-decoration: underline;',
      '  text-decoration-color: ' + COLOR_GOLD + ';',
      '  text-underline-offset: 3px;',
      '  text-decoration-thickness: 1px;',
      '}',
      '.lc-saint-tappable:focus{ outline: 2px solid ' + COLOR_GOLD + '; outline-offset: 2px; }',

      // ── Saint card overlay (z-index 10000 — sits above LC drawer
      //    at 9999 per orchestrator OQ-8) ──────────────────────────
      '.sc-overlay{',
      '  position: fixed; inset: 0;',
      '  background: rgba(11, 17, 32, 0.78);',
      '  backdrop-filter: blur(2px);',
      '  -webkit-backdrop-filter: blur(2px);',
      '  z-index: 10000;',
      '  opacity: 0;',
      '  transition: opacity 240ms ease;',
      '  display: flex; align-items: flex-start; justify-content: center;',
      '}',
      '.sc-overlay.sc-in{ opacity: 1; }',
      '.sc-overlay.sc-out{ opacity: 0; transition-duration: 200ms; }',
      '.sc-scroll{',
      '  width: 100%; height: 100%;',
      '  overflow-y: auto;',
      '  -webkit-overflow-scrolling: touch;',
      '  display: flex; align-items: flex-start; justify-content: center;',
      '  padding: 2rem 1rem;',
      '  box-sizing: border-box;',
      '}',
      '.sc-card{',
      '  max-width: 560px; width: 100%;',
      '  background: linear-gradient(180deg, ' + COLOR_CREAM + ' 0%, #EFE3C6 100%);',
      '  border: 1px solid rgba(201, 168, 76, 0.55);',
      '  border-radius: 10px;',
      '  padding: 1.25rem 1.25rem 1.25rem;',
      '  box-shadow: 0 18px 48px rgba(11, 17, 32, 0.5);',
      '  color: ' + COLOR_NAVY + ';',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  transform: scale(0.96);',
      '  transition: transform 240ms ease;',
      '  position: relative;',
      '}',
      '.sc-overlay.sc-in .sc-card{ transform: scale(1); }',
      '@media (min-width: 1024px){ .sc-card{ max-width: 640px; } }',
      '@media (min-width: 1366px){ .sc-card{ max-width: 720px; } }',

      // ── Card header (close + eyebrow + date) ──────────────────
      '.sc-card-head{',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  gap: 0.5rem;',
      '  margin-bottom: 0.35rem;',
      '}',
      '.sc-card-close{',
      '  width: 32px; height: 32px;',
      '  display: inline-flex; align-items: center; justify-content: center;',
      '  background: transparent;',
      '  border: 1px solid rgba(201, 168, 76, 0.5);',
      '  border-radius: 50%;',
      '  color: ' + COLOR_GOLD + ';',
      '  font-size: 1rem;',
      '  cursor: pointer;',
      '  font-family: "Cinzel", Georgia, serif;',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '.sc-card-close:focus{ outline: 2px solid ' + COLOR_GOLD + '; outline-offset: 2px; }',
      '.sc-card-eyebrow{',
      '  flex: 1;',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.68rem;',
      '  letter-spacing: 0.18em;',
      '  text-transform: uppercase;',
      '  color: ' + COLOR_DEEP_RED + ';',
      '  text-align: center;',
      '}',
      '.sc-card-head-spacer{ width: 32px; }',

      // ── Icon image (centered) ─────────────────────────────────
      '.sc-card-icon-wrap{',
      '  display: flex; justify-content: center;',
      '  margin: 0.5rem 0 1rem;',
      '}',
      '.sc-card-icon{',
      '  width: 200px; height: 260px;',
      '  object-fit: cover;',
      '  border: 1px solid rgba(201, 168, 76, 0.45);',
      '  border-radius: 6px;',
      '  background: ' + COLOR_PARCHMENT + ';',
      '  box-shadow: 0 8px 22px rgba(11, 17, 32, 0.22);',
      '}',
      '@media (max-width: 480px){ .sc-card-icon{ width: 160px; height: 208px; } }',
      '@media (min-width: 1024px){ .sc-card-icon{ width: 220px; height: 286px; } }',
      '@media (min-width: 1366px){ .sc-card-icon{ width: 240px; height: 312px; } }',

      // ── Name + honorific block ────────────────────────────────
      '.sc-card-name{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 1.25rem;',
      '  font-weight: 600;',
      '  text-align: center;',
      '  color: ' + COLOR_NAVY + ';',
      '  margin: 0 0 0.2rem;',
      '  line-height: 1.2;',
      '}',
      '.sc-card-honorific{',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  font-style: italic;',
      '  font-size: 0.92rem;',
      '  text-align: center;',
      '  color: rgba(27, 42, 74, 0.78);',
      '  margin: 0 0 1rem;',
      '}',

      // ── Life story body ───────────────────────────────────────
      '.sc-card-body{',
      '  font-size: 1.02rem;',
      '  line-height: 1.55;',
      '  color: ' + COLOR_NAVY + ';',
      '  margin: 0 0 1.1rem;',
      '  white-space: pre-line;',
      '}',

      // ── Iconography lesson banner (cards 1-6 only) ────────────
      '.sc-lesson-banner{',
      '  text-align: center;',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.72rem;',
      '  letter-spacing: 0.18em;',
      '  text-transform: uppercase;',
      '  color: ' + COLOR_GOLD + ';',
      '  margin: 0 0 0.5rem;',
      '  padding: 0.45rem 0.5rem;',
      '  border-top: 1px solid rgba(201, 168, 76, 0.4);',
      '  border-bottom: 1px solid rgba(201, 168, 76, 0.4);',
      '  background: rgba(201, 168, 76, 0.08);',
      '}',
      '.sc-lesson-banner-mark{ display: inline-block; margin: 0 0.4rem; }',

      // ── Callouts ──────────────────────────────────────────────
      '.sc-callouts{ display: flex; flex-direction: column; gap: 0.75rem; }',
      '.sc-callout{',
      '  background: rgba(244, 232, 193, 0.55);',
      '  border: 1px solid rgba(201, 168, 76, 0.35);',
      '  border-radius: 6px;',
      '  padding: 0.65rem 0.85rem;',
      '}',
      '.sc-callout-title{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.78rem;',
      '  letter-spacing: 0.12em;',
      '  text-transform: uppercase;',
      '  color: ' + COLOR_GOLD + ';',
      '  margin: 0 0 0.35rem;',
      '}',
      '.sc-callout-body{',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  font-style: italic;',
      '  font-size: 0.95rem;',
      '  line-height: 1.5;',
      '  color: ' + COLOR_NAVY + ';',
      '  margin: 0;',
      '}',

      // ── Footer flourish ───────────────────────────────────────
      '.sc-card-foot{',
      '  margin-top: 1.1rem;',
      '  text-align: center;',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.7rem;',
      '  letter-spacing: 0.18em;',
      '  color: rgba(139, 26, 26, 0.78);',
      '}',
      '.sc-card-foot-rule{',
      '  display: block;',
      '  margin: 0 auto 0.5rem;',
      '  color: ' + COLOR_GOLD + ';',
      '  letter-spacing: 0.4em;',
      '}',
      '.sc-card-foot-line{ font-style: italic; }',

      // ── prefers-reduced-motion ────────────────────────────────
      '@media (prefers-reduced-motion: reduce){',
      '  .sc-overlay{ transition: none !important; }',
      '  .sc-card{ transition: none !important; transform: none !important; }',
      '}',

      // ── Field Manual "Saints I\'ve Met" archive ───────────────
      '.saints-archive-section{ padding: 0 1.25rem 3rem 1.75rem; }',
      '.saints-archive-header{',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  margin-bottom: 0.875rem;',
      '}',
      '.saints-archive-title{',
      '  font-family: "Cinzel", serif;',
      '  font-size: 0.65rem;',
      '  letter-spacing: 0.2em;',
      '  color: rgba(61, 31, 8, 0.78);',
      '  text-transform: uppercase;',
      '}',
      '.saints-archive-count{',
      '  font-family: "Cinzel", serif;',
      '  font-size: 0.62rem;',
      '  letter-spacing: 0.15em;',
      '  color: rgba(61, 31, 8, 0.55);',
      '}',
      '.saints-archive-empty{',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  font-style: italic;',
      '  font-size: 0.95rem;',
      '  color: rgba(61, 31, 8, 0.65);',
      '  background: rgba(255, 255, 255, 0.4);',
      '  border: 1px dashed rgba(61, 31, 8, 0.18);',
      '  border-radius: 10px;',
      '  padding: 1rem;',
      '  text-align: center;',
      '}',
      '.saints-archive-item{',
      '  display: flex; gap: 0.85rem;',
      '  align-items: center;',
      '  background: rgba(255, 255, 255, 0.45);',
      '  border: 1px solid rgba(61, 31, 8, 0.12);',
      '  border-radius: 10px;',
      '  padding: 0.65rem 0.85rem;',
      '  margin-bottom: 0.55rem;',
      '  cursor: pointer;',
      '  -webkit-tap-highlight-color: transparent;',
      '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);',
      '}',
      '.saints-archive-item.read-only{ cursor: default; }',
      '.saints-archive-thumb{',
      '  width: 80px; height: 104px;',
      '  flex-shrink: 0;',
      '  object-fit: cover;',
      '  border: 1px solid rgba(201, 168, 76, 0.45);',
      '  border-radius: 4px;',
      '  background: ' + COLOR_PARCHMENT + ';',
      '}',
      '.saints-archive-text{ flex: 1; min-width: 0; }',
      '.saints-archive-name{',
      '  font-family: "Cinzel", serif;',
      '  font-size: 1rem;',
      '  color: ' + COLOR_DEEP_RED + ';',
      '  margin: 0 0 0.15rem;',
      '  line-height: 1.25;',
      '}',
      '.saints-archive-honor{',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  font-style: italic;',
      '  font-size: 0.85rem;',
      '  color: rgba(61, 31, 8, 0.7);',
      '  margin: 0 0 0.15rem;',
      '}',
      '.saints-archive-date{',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  font-size: 0.75rem;',
      '  color: rgba(61, 31, 8, 0.55);',
      '  margin: 0;',
      '}'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.setAttribute('data-saint-cards', 'v1');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ── HTML BUILDERS ────────────────────────────────────────────────

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _longDateForCommemoration(mmdd) {
    if (!mmdd) return '';
    var parts = String(mmdd).split('-');
    if (parts.length !== 2) return '';
    var MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
    var m = parseInt(parts[0], 10);
    var d = parseInt(parts[1], 10);
    if (!m || !d || m < 1 || m > 12) return '';
    return MONTHS[m - 1] + ' ' + d;
  }

  function _buildCardHTML(saint, lessonNumber) {
    var icon = saint.icon || {};
    var iconSrc = icon.asset_path || '';
    var iconAlt = icon.alt_text || ('Orthodox icon of ' + (saint.display_name || saint.slug || 'saint'));
    var date    = _longDateForCommemoration(saint.commemoration_date);
    var honorific = saint.honorific || '';

    var calloutsHtml = '';
    if (Array.isArray(saint.callouts) && saint.callouts.length > 0) {
      calloutsHtml = saint.callouts.map(function (c, idx) {
        var bannerHtml = '';
        // Banner appears ONLY above callout #0 AND only on cards 1-6
        // (lessonNumber non-null means this is one of the first six
        // unique cards this explorer has opened).
        if (idx === 0 && lessonNumber !== null && lessonNumber !== undefined) {
          bannerHtml = ''
            + '<div class="sc-lesson-banner">'
            +   '<span class="sc-lesson-banner-mark">\u2726</span>'
            +   _esc(_lessonBannerText(lessonNumber))
            +   '<span class="sc-lesson-banner-mark">\u2726</span>'
            + '</div>';
        }
        return bannerHtml
          + '<div class="sc-callout">'
          +   '<div class="sc-callout-title">' + _esc(c.title || '') + '</div>'
          +   '<p class="sc-callout-body">' + _esc(c.body || '') + '</p>'
          + '</div>';
      }).join('');
    }

    var eyebrowText = date
      ? '\u2726 \u00a0 The Day \u00a0 \u2726 \u00a0\u00a0 ' + _esc(date)
      : '\u2726 \u00a0 The Day \u00a0 \u2726';

    return ''
      + '<div class="sc-card-head">'
      +   '<div class="sc-card-head-spacer"></div>'
      +   '<div class="sc-card-eyebrow">' + eyebrowText + '</div>'
      +   '<button type="button" class="sc-card-close" id="sc-card-close" aria-label="Close saint card">\u2715</button>'
      + '</div>'
      + '<div class="sc-card-icon-wrap">'
      +   '<img class="sc-card-icon" id="sc-card-icon" '
      +        'src="' + _esc(iconSrc) + '" '
      +        'alt="' + _esc(iconAlt) + '" '
      +        'data-fallback="1" />'
      + '</div>'
      + '<h2 class="sc-card-name">' + _esc(saint.display_name || '') + '</h2>'
      + (honorific
          ? '<p class="sc-card-honorific">' + _esc(honorific) + (date ? ' \u00b7 ' + _esc(date) : '') + '</p>'
          : (date ? '<p class="sc-card-honorific">' + _esc(date) + '</p>' : ''))
      + '<div class="sc-card-body">' + _esc(saint.life_story || '') + '</div>'
      + '<div class="sc-callouts">' + calloutsHtml + '</div>'
      + '<div class="sc-card-foot">'
      +   '<span class="sc-card-foot-rule">\u2726 \u2014 \u2629 \u2014 \u2726</span>'
      +   '<span class="sc-card-foot-line">Glory to God for all things.</span>'
      + '</div>';
  }

  // ── MODAL OPEN / CLOSE ──────────────────────────────────────────

  function _dismissOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('sc-in');
    overlay.classList.add('sc-out');
    // Restore body scroll if no other modal underneath demands lock.
    // We use a data-attribute to track the prior overflow value.
    var prior = overlay.getAttribute('data-prior-overflow') || '';
    setTimeout(function () {
      if (overlay && overlay.parentNode) overlay.remove();
      // Only restore body overflow if THIS was the topmost lock.
      // If the LC drawer is still open it will keep body.overflow
      // = 'hidden' on its own; otherwise restore the saved value.
      var lcStillOpen = document.querySelector('.lc-overlay');
      if (!lcStillOpen) {
        document.body.style.overflow = prior;
      }
    }, 240);
    if (_activeOverlay === overlay) _activeOverlay = null;
  }

  // Public: open a saint card modal. `slug` must be a corpus slug
  // (caller resolves first via resolveSlug). `ctx` must contain at
  // least { sb, explorerId }; optional ctx.skipMark suppresses the
  // markSaintMet write (used when re-opening from the archive — the
  // explorer has already been registered as having met this saint).
  async function openCard(slug, ctx) {
    if (!slug) return;
    if (!_corpus) await loadCorpus(ctx && ctx.sb);
    var saint = _corpus && _corpus.bySlug.get(slug);
    if (!saint) return;

    ctx = ctx || {};
    var sb         = ctx.sb || null;
    var explorerId = ctx.explorerId || null;
    var skipMark   = !!ctx.skipMark;

    _injectCSS();

    // Compute lessonNumber BEFORE marking met. This is critical so
    // that on the FIRST tap of card #1, lessonNumber resolves to 1
    // (state is currently empty), banner renders Lesson 1, then
    // markSaintMet appends lesson 1 to state for next time.
    var lessonNumber = null;
    if (explorerId && !skipMark) {
      // Refresh state then check if this saint has been met. If
      // already met (re-open from archive or LC re-tap), no banner.
      await _refreshStateCache(sb, explorerId);
      if (!hasMet(slug, explorerId)) {
        lessonNumber = nextLessonNumber(explorerId);
      }
    }

    var overlay = document.createElement('div');
    overlay.className = 'sc-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Saint ' + (saint.display_name || ''));
    overlay.setAttribute('data-slug', slug);

    overlay.innerHTML = ''
      + '<div class="sc-scroll">'
      +   '<div class="sc-card" role="document">'
      +     _buildCardHTML(saint, lessonNumber)
      +   '</div>'
      + '</div>';

    // Save prior overflow so we restore correctly. If LC is open it
    // has already set body.overflow='hidden'; we layer on top.
    overlay.setAttribute('data-prior-overflow', document.body.style.overflow || '');
    document.body.style.overflow = 'hidden';

    document.body.appendChild(overlay);
    _activeOverlay = overlay;

    // Force reflow so the opacity transition fires
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetWidth;
    overlay.classList.add('sc-in');

    // ── Close affordances ──────────────────────────────────────
    function dismiss() { _dismissOverlay(overlay); }

    var closeBtn = overlay.querySelector('#sc-card-close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);

    // Tap on backdrop or scroll wrapper (outside the card)
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay || ev.target.classList.contains('sc-scroll')) {
        dismiss();
      }
    });

    // Escape key (per-modal, doesn't cascade — orchestrator OQ-4)
    function onKey(ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
        window.removeEventListener('keydown', onKey, true);
        dismiss();
      }
    }
    // capture-phase so we beat the LC drawer's escape handler
    window.addEventListener('keydown', onKey, true);

    // Swipe-down close (mobile) — single-touch, ≥80px vertical drag
    var touchStartY = null;
    overlay.addEventListener('touchstart', function (ev) {
      if (ev.touches && ev.touches.length === 1) {
        touchStartY = ev.touches[0].clientY;
      } else {
        touchStartY = null;
      }
    }, { passive: true });
    overlay.addEventListener('touchend', function (ev) {
      if (touchStartY == null) return;
      var endY = (ev.changedTouches && ev.changedTouches[0]) ? ev.changedTouches[0].clientY : null;
      if (endY != null && (endY - touchStartY) >= 80) {
        // Only fire on backdrop swipe — avoid hijacking scroll inside
        // the card. If the target is the scroll/overlay we accept.
        var target = ev.target;
        if (target === overlay || target.classList.contains('sc-scroll')) {
          dismiss();
        }
      }
      touchStartY = null;
    }, { passive: true });

    // ── Icon image fallback to parchment placeholder on error ──
    var iconImg = overlay.querySelector('#sc-card-icon');
    if (iconImg) {
      iconImg.addEventListener('error', function () {
        if (iconImg.getAttribute('data-fallback') === '1') {
          iconImg.setAttribute('data-fallback', '0');
          iconImg.src = ICON_PLACEHOLDER_DATAURL;
        }
      });
      // Empty asset_path → trigger error immediately
      if (!iconImg.getAttribute('src')) {
        iconImg.src = ICON_PLACEHOLDER_DATAURL;
        iconImg.setAttribute('data-fallback', '0');
      }
    }

    // Focus the close button for keyboard users
    try { if (closeBtn && closeBtn.focus) closeBtn.focus({ preventScroll: true }); } catch (_e) {}

    // ── First-tap state mutation (fire-and-forget; UI shows
    //    immediately, write completes in background per dispatch
    //    pattern). The lessonNumber for the rendered banner was
    //    already computed pre-write, so the visual state matches
    //    what gets persisted. ────────────────────────────────────
    if (sb && explorerId && !skipMark) {
      markSaintMet(sb, explorerId, slug).catch(function (_e) { /* graceful */ });
    }
  }

  // ── ARCHIVE (Field Manual "Saints I've Met") ────────────────────

  // Read the saints_met array for a given explorer (admin views
  // an explorer's archive without writing). Returns an array of
  // hydrated archive items sorted reverse-chronologically by
  // first_met_at. Items whose slug doesn't resolve to a corpus
  // saint are filtered out (defensive — corpus may shrink across
  // versions, archive should not show ghosts).
  async function loadArchiveFor(sb, explorerId) {
    if (!sb || !explorerId) return [];
    if (!_corpus) await loadCorpus(sb);

    var state = await _readOnboardingState(sb, explorerId);
    if (!state || !Array.isArray(state.saints_met)) return [];

    var items = [];
    state.saints_met.forEach(function (e) {
      if (!e || !e.slug) return;
      var saint = _corpus.bySlug.get(e.slug);
      if (!saint) return;
      items.push({
        slug:           e.slug,
        first_met_at:   e.first_met_at || null,
        display_name:   saint.display_name || e.slug,
        honorific:      saint.honorific || '',
        icon_src:       (saint.icon && saint.icon.asset_path) || '',
        icon_alt:       (saint.icon && saint.icon.alt_text) || ('Icon of ' + (saint.display_name || e.slug))
      });
    });

    items.sort(function (a, b) {
      var ta = a.first_met_at ? Date.parse(a.first_met_at) : 0;
      var tb = b.first_met_at ? Date.parse(b.first_met_at) : 0;
      return tb - ta;
    });
    return items;
  }

  // Render archive into a target element. opts:
  //   { isAdminView: bool, viewerName: string,
  //     readOnly: bool (default = isAdminView),
  //     sb: SupabaseClient, explorerId: id (for reopen tap) }
  function renderArchive(target, items, opts) {
    if (!target) return;
    opts = opts || {};
    _injectCSS();

    var headerCountEl = document.getElementById('saints-archive-count');
    var headerTitleEl = document.getElementById('saints-archive-title');

    if (headerTitleEl && opts.viewerName && opts.isAdminView) {
      headerTitleEl.textContent = opts.viewerName + "'s Saints Archive";
    }

    if (!items || items.length === 0) {
      var emptyMsg;
      if (opts.isAdminView) {
        var who = opts.viewerName || 'This explorer';
        emptyMsg = who + " hasn't met any saints yet.";
      } else {
        emptyMsg = "You haven't met any saints yet. Tap a saint name on the home calendar to begin.";
      }
      target.innerHTML = '<div class="saints-archive-empty">' + _esc(emptyMsg) + '</div>';
      if (headerCountEl) headerCountEl.textContent = '';
      return;
    }

    if (headerCountEl) {
      headerCountEl.textContent = items.length + (items.length === 1 ? ' saint' : ' saints');
    }

    var readOnly = (opts.readOnly !== undefined) ? !!opts.readOnly : !!opts.isAdminView;

    var html = items.map(function (it) {
      var dateText = '';
      if (it.first_met_at) {
        try {
          // Format as "May 21, 2026" in user's locale
          var d = new Date(it.first_met_at);
          if (!isNaN(d.getTime())) {
            var MONTHS = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
            dateText = 'First met: ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
          }
        } catch (_e) { /* graceful */ }
      }
      return ''
        + '<div class="saints-archive-item' + (readOnly ? ' read-only' : '') + '" '
        +      'data-slug="' + _esc(it.slug) + '" '
        +      (readOnly ? '' : 'role="button" tabindex="0" aria-label="Reopen saint ' + _esc(it.display_name) + '" ')
        +      '>'
        +   '<img class="saints-archive-thumb" src="' + _esc(it.icon_src) + '" alt="' + _esc(it.icon_alt) + '" data-fallback="1" />'
        +   '<div class="saints-archive-text">'
        +     '<div class="saints-archive-name">' + _esc(it.display_name) + '</div>'
        +     (it.honorific ? '<div class="saints-archive-honor">' + _esc(it.honorific) + '</div>' : '')
        +     (dateText ? '<div class="saints-archive-date">' + _esc(dateText) + '</div>' : '')
        +   '</div>'
        + '</div>';
    }).join('');

    target.innerHTML = html;

    // Wire thumb error → parchment placeholder
    var thumbs = target.querySelectorAll('.saints-archive-thumb');
    Array.prototype.forEach.call(thumbs, function (img) {
      img.addEventListener('error', function () {
        if (img.getAttribute('data-fallback') === '1') {
          img.setAttribute('data-fallback', '0');
          img.src = ICON_PLACEHOLDER_DATAURL;
        }
      });
      if (!img.getAttribute('src')) {
        img.src = ICON_PLACEHOLDER_DATAURL;
        img.setAttribute('data-fallback', '0');
      }
    });

    // Wire reopen tap (own view only — admin views are read-only
    // per D5 §9.5)
    if (!readOnly && opts.sb && opts.explorerId) {
      var itemsEls = target.querySelectorAll('.saints-archive-item');
      Array.prototype.forEach.call(itemsEls, function (el) {
        function reopen() {
          var slug = el.getAttribute('data-slug');
          if (!slug) return;
          openCard(slug, {
            sb:         opts.sb,
            explorerId: opts.explorerId,
            skipMark:   true   // don't re-fire lesson banner (D5 §9.4)
          });
        }
        el.addEventListener('click', reopen);
        el.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            reopen();
          }
        });
      });
    }
  }

  // ── EXPORTS ──────────────────────────────────────────────────────

  var SaintCards = {
    loadCorpus:         loadCorpus,
    resolveSlug:        resolveSlug,
    hasCard:            hasCard,
    openCard:           openCard,
    markSaintMet:       markSaintMet,
    hasMet:             hasMet,
    nextLessonNumber:   nextLessonNumber,
    loadArchiveFor:     loadArchiveFor,
    renderArchive:      renderArchive,
    /* exposed for testing / orchestrator audit only */
    _normalize:         _normalize,
    _refreshStateCache: _refreshStateCache
  };

  if (typeof window !== 'undefined') {
    window.SaintCards = SaintCards;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaintCards;
  }
})();
