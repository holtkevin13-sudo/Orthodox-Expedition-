/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 2
   js/pilgrimages.js — Pilgrimage window helper + cache
   May 10, 2026

   PURPOSE
   When Nolan is on pilgrimage (a multi-day spiritual journey), the
   streak math should NOT punish him for missed days. Pilgrimages are
   the apex of the program — they shouldn't carry a streak-anxiety tax.

   The pilgrimages table holds 3 rows (Year 1/2/3) with start_date and
   end_date columns added by migration pilgrimage_window_columns_20260510.
   When today falls inside a pilgrimage window, the home page surfaces
   a quiet banner; streak settlement excludes pilgrimage days from the
   threshold calculation; the prayer streak preserves rather than
   resets.

   PUBLIC API (browser): window.Pilgrimages = { … }
   PUBLIC API (node/test): module.exports = Pilgrimages;

     loadPilgrimages(sb)              — async: fetch + cache all rows
     isActiveOn(sb, dateString)       — async: row|null for that ET day
     isActiveToday(sb)                — async: row|null for today (ET)
     getMostRecentEnded(sb, today)    — async: row|null whose end_date
                                        is yesterday relative to today
     clearCache()                     — clear module-scope cache (test
                                        helper)

   "Active" = start_date <= dateString <= end_date AND status !==
   'cancelled'. Both ends inclusive. Rows with NULL start_date or
   end_date are NEVER active (no window committed yet).

   ETERNAL CACHE / TTL
   loadPilgrimages caches the row set in module scope on first call.
   Subsequent calls return the cache unless clearCache() is invoked.
   Pilgrimage windows change rarely (Kevin sets them once per program
   year via the admin panel), so the cache is safe per page load.
   Future enhancement: 5-minute TTL or version-pointer invalidation.

   SCHEMA-TOUCHING SCOPE (Operational Learning #12)
     IN  : reads pilgrimages (id, name, location, status, start_date,
                              end_date, program_year, coin_value)
     OUT : NO writes — admin panel UI in admin.html owns the write path
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // Module-scope cache.
  let _cache = null;

  // ── PUBLIC: clearCache ───────────────────────────────────────────
  function clearCache() { _cache = null; }

  // ── PUBLIC: loadPilgrimages ──────────────────────────────────────
  async function loadPilgrimages(sb) {
    if (_cache) return _cache;
    if (!sb) return [];
    try {
      const res = await sb
        .from('pilgrimages')
        .select('id, program_year, name, location, status, start_date, end_date, coin_value, target_window')
        .order('program_year', { ascending: true });
      if (res.error) throw res.error;
      _cache = res.data || [];
      return _cache;
    } catch (e) {
      console.warn('Pilgrimages.loadPilgrimages failed:', e);
      return [];
    }
  }

  // ── INTERNAL: dateString comparison ──────────────────────────────
  // Works on 'YYYY-MM-DD' strings (lexicographic order matches
  // chronological order). Returns true iff a <= b.
  function _lte(a, b) { return a <= b; }

  // ── INTERNAL: is row active on dateString? ───────────────────────
  function _rowActiveOn(row, dateString) {
    if (!row || !dateString) return false;
    if (row.status === 'cancelled') return false;
    if (!row.start_date || !row.end_date) return false;
    return _lte(row.start_date, dateString) && _lte(dateString, row.end_date);
  }

  // ── PUBLIC: isActiveOn ───────────────────────────────────────────
  // Returns the active pilgrimage row for the given ET date string,
  // or null. If two pilgrimages overlap (data error), the lowest-
  // program_year wins (deterministic — and surfacing only one banner
  // is the right UX even if the dates conflict).
  async function isActiveOn(sb, dateString) {
    if (!dateString) return null;
    const rows = await loadPilgrimages(sb);
    for (const row of rows) {
      if (_rowActiveOn(row, dateString)) return row;
    }
    return null;
  }

  // ── PUBLIC: isActiveToday ────────────────────────────────────────
  async function isActiveToday(sb) {
    const today = (typeof window !== 'undefined' && window.WeekUtils)
      ? window.WeekUtils.todayKey()
      : (typeof require !== 'undefined' ? require('./week-utils.js').todayKey() : null);
    if (!today) return null;
    return isActiveOn(sb, today);
  }

  // ── PUBLIC: getMostRecentEnded ───────────────────────────────────
  // Returns the pilgrimage row whose end_date == (todayDate - 1 day),
  // i.e. the pilgrimage that ended yesterday. Used for the one-time
  // "Welcome home" banner on the day after a pilgrimage ends.
  // Returns null if no row matches.
  //
  //   sb         — supabase client
  //   todayDate  — Date or 'YYYY-MM-DD' string in ET (defaults to today)
  async function getMostRecentEnded(sb, todayDate) {
    const W = (typeof window !== 'undefined' && window.WeekUtils)
      ? window.WeekUtils
      : (typeof require !== 'undefined' ? require('./week-utils.js') : null);
    if (!W) return null;

    let todayKey;
    if (!todayDate) {
      todayKey = W.todayKey();
    } else if (typeof todayDate === 'string') {
      todayKey = todayDate;
    } else {
      todayKey = W.ymd(todayDate);
    }

    // Compute yesterday in ET.
    const todayParts = todayKey.split('-').map(Number);
    const todayDateObj = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2], 12, 0, 0));
    todayDateObj.setUTCDate(todayDateObj.getUTCDate() - 1);
    const yesterdayKey = W.ymd(todayDateObj);

    const rows = await loadPilgrimages(sb);
    for (const row of rows) {
      if (row.status === 'cancelled') continue;
      if (row.end_date === yesterdayKey) return row;
    }
    return null;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  const Pilgrimages = {
    loadPilgrimages:    loadPilgrimages,
    isActiveOn:         isActiveOn,
    isActiveToday:      isActiveToday,
    getMostRecentEnded: getMostRecentEnded,
    clearCache:         clearCache,
    // Internal helpers exposed for testing (not for production use).
    _internals: { _rowActiveOn: _rowActiveOn },
  };

  if (typeof window !== 'undefined') {
    window.Pilgrimages = Pilgrimages;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pilgrimages;
  }
})();
