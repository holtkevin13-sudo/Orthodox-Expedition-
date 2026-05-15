/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Chat 23
   js/field-journal-static.js — Static Field Journal corpus loader
   May 14, 2026

   PURPOSE
   Loads static-JSON Field Journal corpora (paired-diptych entries
   authored in canon by Theo and Christopher) from the on-disk
   /docs/content/field-journal/ tree. Returns date-keyed entry
   lookup; rendering stays in the consumer surface (journal.html).

   Per orchestrator OQ-2 (Chat 23) ruling: canon character entries
   live in static JSON, NOT in public.field_journal rows. The
   schema extension (author / surface_on_day_of / source_artifact)
   columns are reserved for forward-compat; deploy-time data lives
   here.

   v1 corpus loaded:
     /docs/content/field-journal/reception-day-entries-v1.json
       → 2 entries for 2026-06-19 (Theo + Christopher chrismation
         day diptych authored by C4)

   PUBLIC API
     FieldJournalStatic.loadCorpus() async
       → Idempotent fetch + memoize. Returns
         { byDate: Map<YYYY-MM-DD, entry[]>, raw }
       → Fail-soft on 404 / parse / network error: empty corpus,
         one console.debug breadcrumb, never throws.

     FieldJournalStatic.getReceptionDayEntries(dateKey, opts) async
       → Returns ordered entry array for the given ET date key
         ('YYYY-MM-DD'). Ordering: surface_on_day_of:true first
         (Theo's "the morning of" entry), then siblings in their
         JSON declaration order. Empty array when no entries.

     FieldJournalStatic.hasReceptionDayDiptych(dateKey)
       → Synchronous bool. Returns true iff the corpus is loaded
         AND ≥1 entry exists for dateKey. Must call loadCorpus()
         first (async); returns false before load completes.

   ARCHITECTURE LOCKS HONORED (D1 + C4 JSON metadata)
     §1.4 witness-only — entries authored in canon, never address
          reader; loader is pure data, never injects framing
     §1.6 English-default + rare Greek — Greek segments arrive
          inside body text + metadata (greek_segments[]); consumer
          renders per D1 §11.6 spec
     §1.7 Father Nicholas deferred — corpus references priest as
          "Father" only, never names a character; loader passes
          through
     §1.8 Mom present-in-world, never speaker — corpus honors;
          loader passes through verbatim
     §11.7 Pascha-gold reservation — corpus carries gold:false on
          chrismation formula; consumer enforces ink-brown
          regardless (defense-in-depth, per orchestrator note)

   OPERATIONAL LEARNINGS HONORED
     #2  Verified, not inferred — JSON_URL matches actual repo path
     #3  Discovery before code — module shape mirrors Chat 20
         js/saint-cards.js after live audit
     #13 Graceful absence — fail-soft, no thrown errors, no
         console noise beyond one debug breadcrumb on 404

   GRACEFUL DEGRADATION
   Absent or unreachable JSON:
     • loadCorpus resolves to empty {byDate:Map(), raw:null}
     • hasReceptionDayDiptych returns false for every dateKey
     • getReceptionDayEntries returns [] for every dateKey
     Consumer surface (journal.html) skips diptych render entirely;
     normal Field Manual archive renders without disruption.
   ───────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── CONSTANTS ────────────────────────────────────────────────────

  // Same path prefix the service worker uses for STATIC_ASSETS so
  // this is served from cache when offline (sw.js v51+).
  var JSON_URL =
    '/Orthodox-Expedition-/docs/content/field-journal/' +
    'reception-day-entries-v1.json';

  // ── MODULE STATE (memoized) ──────────────────────────────────────

  var _corpus = null;           // resolved corpus or empty-corpus
  var _corpusPromise = null;    // in-flight fetch promise

  function _emptyCorpus() {
    return {
      byDate: new Map(),  // 'YYYY-MM-DD' → entry[]
      raw:    null
    };
  }

  // ── CORPUS LOAD (mirrors saint-cards loader pattern) ─────────────

  // Public: load and memoize the corpus. Idempotent. Fail-soft on
  // every error mode — returns empty corpus, never throws.
  async function loadCorpus() {
    if (_corpus) return _corpus;
    if (!_corpusPromise) {
      _corpusPromise = fetch(JSON_URL, { cache: 'default' })
        .then(function (r) {
          if (r.status === 404) {
            try {
              console.debug('[field-journal-static] corpus not yet authored (404)');
            } catch (_e) {}
            return null;
          }
          if (!r.ok) {
            try {
              console.debug('[field-journal-static] corpus HTTP ' + r.status);
            } catch (_e) {}
            return null;
          }
          return r.json();
        })
        .catch(function (_e) {
          // Network or parse failure — silent breadcrumb only.
          try {
            console.debug('[field-journal-static] corpus fetch failed (graceful)');
          } catch (_eb) {}
          return null;
        });
    }

    var data;
    try {
      data = await _corpusPromise;
    } catch (_e) {
      data = null;
    }

    if (!data || !Array.isArray(data.entries)) {
      _corpus = _emptyCorpus();
      return _corpus;
    }

    var byDate = new Map();

    data.entries.forEach(function (e) {
      if (!e || !e.date) return;
      var bucket = byDate.get(e.date);
      if (!bucket) {
        bucket = [];
        byDate.set(e.date, bucket);
      }
      bucket.push(e);
    });

    // Stable per-date ordering: surface_on_day_of:true first
    // (canonical "morning of" entry — Theo on 2026-06-19), then
    // remaining siblings in original JSON declaration order. This
    // matches orchestrator OQ-2 ruling D (Theo first; Christopher
    // second; both as adjacent items in the date-ordered archive
    // list per D1 §4.5).
    byDate.forEach(function (bucket) {
      // Stable sort: items with surface_on_day_of:true sort
      // before items with surface_on_day_of:false/null. Within
      // each group, original order preserved (Array.prototype.sort
      // in modern engines is stable).
      bucket.sort(function (a, b) {
        var aFlag = a && a.surface_on_day_of === true ? 0 : 1;
        var bFlag = b && b.surface_on_day_of === true ? 0 : 1;
        return aFlag - bFlag;
      });
    });

    _corpus = {
      byDate: byDate,
      raw:    data
    };
    return _corpus;
  }

  // ── PUBLIC: getReceptionDayEntries ──────────────────────────────
  // Returns ordered entry array for the given ET date key. Async
  // because it ensures corpus is loaded; synchronous for cached
  // calls. Empty array when no entries for the date.
  async function getReceptionDayEntries(dateKey /*, opts */) {
    if (!dateKey) return [];
    if (!_corpus) await loadCorpus();
    var bucket = _corpus && _corpus.byDate.get(dateKey);
    return Array.isArray(bucket) ? bucket.slice() : [];
  }

  // ── PUBLIC: hasReceptionDayDiptych ──────────────────────────────
  // Synchronous bool — useful for render-time gating after a prior
  // loadCorpus() await. Before corpus loads, returns false (callers
  // should await loadCorpus first if they need a true answer).
  function hasReceptionDayDiptych(dateKey) {
    if (!_corpus || !dateKey) return false;
    var bucket = _corpus.byDate.get(dateKey);
    return Array.isArray(bucket) && bucket.length > 0;
  }

  // ── PUBLIC API EXPORT ───────────────────────────────────────────

  var FieldJournalStatic = {
    loadCorpus:               loadCorpus,
    getReceptionDayEntries:   getReceptionDayEntries,
    hasReceptionDayDiptych:   hasReceptionDayDiptych
  };

  if (typeof window !== 'undefined') {
    window.FieldJournalStatic = FieldJournalStatic;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldJournalStatic;
  }
})();
