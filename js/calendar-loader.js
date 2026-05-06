/**
 * Orthodox Expedition — Liturgical Calendar Loader
 *
 * Fetches one row from the liturgical_calendar table for a given date.
 * Tiny in-memory cache so the dashboard doesn't requery the same date.
 *
 * Public API:
 *   await CalendarLoader.load(sb, dateString) → { row, error }
 *   CalendarLoader.todayKey() → 'YYYY-MM-DD' for the local wall-clock day
 *
 * No DOM. No render logic. Just data access.
 */

const CalendarLoader = (() => {

  // ── IN-MEMORY CACHE ─────────────────────────────────────────────
  // Keyed by date string. Cleared on page reload (no persistence).
  // This prevents requerying the same date if multiple surfaces on
  // the same page need today's calendar row.
  const cache = new Map();

  // ── DATE HELPER ─────────────────────────────────────────────────
  // Returns 'YYYY-MM-DD' for the local wall-clock day. Important —
  // calendar rows are anchored to local dates, not UTC.
  function todayKey() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  // ── MAIN LOADER ─────────────────────────────────────────────────
  // Returns { row, error }. row is null when no calendar entry
  // exists for the date (e.g. out-of-range past/future) — that's
  // a graceful empty state, not an error.
  async function load(sb, dateString) {
    if (!sb) return { row: null, error: 'no-supabase-client' };
    if (!dateString) return { row: null, error: 'no-date' };

    if (cache.has(dateString)) {
      return { row: cache.get(dateString), error: null };
    }

    try {
      const { data, error } = await sb
        .from('liturgical_calendar')
        .select('calendar_date, liturgical_season, feast_name, feast_rank, fast_status, sunday_name, saint_commemorations, notes')
        .eq('calendar_date', dateString)
        .maybeSingle();

      if (error) {
        return { row: null, error: error.message || 'query-failed' };
      }

      cache.set(dateString, data || null);
      return { row: data || null, error: null };
    } catch (e) {
      return { row: null, error: e && e.message ? e.message : 'unknown' };
    }
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  return {
    load,
    todayKey,
    _cache: cache,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CalendarLoader;
