/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 2
   js/week-utils.js — Centralized Sunday-anchor week-boundary helper
   May 10, 2026

   PURPOSE
   Single source of truth for week-boundary math across the app. Sunday
   is the start of the week; Saturday is the end. Settlement boundary
   is Sunday evening. All date arithmetic runs against the family's
   America/New_York (ET) calendar — not UTC and not the host's local
   timezone. The Lord's Day frames the week.

   PUBLIC API (browser): window.WeekUtils = { … }
   PUBLIC API (node/test): module.exports = WeekUtils;

     getWeekStart(d)         — Date — Sunday at-or-before d (ET)
     getWeekEnd(d)           — Date — Saturday at-or-after d (ET)
     getCurrentWeekStart()   — convenience: getWeekStart(new Date())
     getCurrentWeekEnd()     — convenience: getWeekEnd(new Date())
     ymd(d)                  — string — 'YYYY-MM-DD' (ET calendar date)
     todayKey()              — string — 'YYYY-MM-DD' for today (ET)
     addDays(d, n)           — Date — d + n days, ET-stable
     dayOfWeekET(d)          — int 0-6 — weekday in ET (0=Sun..6=Sat)

   IMPLEMENTATION NOTE
   All returned Date objects are anchored at UTC-noon of the target ET
   calendar day. UTC-noon is unambiguously the same calendar day in ET
   (ET is UTC-4 or UTC-5; noon UTC = 7-8 AM ET, clearly the same day),
   so when these Dates are projected back to an ET calendar string via
   ymd(), they round-trip correctly regardless of the host's timezone.

   This pattern matches games/game-utils.js's existing getCurrentMondayET
   approach and resolves cross-tz issues that would otherwise surface
   if Nolan's iPad ever switched timezones (e.g., during a future
   pilgrimage out of state).
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const TZ = 'America/New_York';

  // ── INTERNAL: parts of d in ET ───────────────────────────────────
  function _partsET(d) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      weekday: 'short',
    });
    const parts = fmt.formatToParts(d);
    const get = (t) => parts.find(p => p.type === t).value;
    return {
      yyyy: get('year'),
      mm:   get('month'),
      dd:   get('day'),
      dow:  get('weekday'), // 'Sun', 'Mon', ...
    };
  }

  const DOW_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // ── INTERNAL: UTC-noon Date from ET calendar parts ───────────────
  // Returns a Date object that, when projected back to ET via _partsET,
  // yields the same yyyy/mm/dd. UTC-noon is unambiguously mid-day in
  // ET (ET = UTC-4 or UTC-5; noon UTC = 7-8 AM ET). Safe across DST.
  function _utcNoon(yyyy, mm, dd) {
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0, 0));
  }

  // ── PUBLIC: dayOfWeekET ──────────────────────────────────────────
  function dayOfWeekET(d) {
    return DOW_MAP[_partsET(d || new Date()).dow];
  }

  // ── PUBLIC: ymd ──────────────────────────────────────────────────
  // 'YYYY-MM-DD' in the ET calendar. Identical for any Date that lands
  // on the same ET calendar day, regardless of the host's tz.
  function ymd(d) {
    const p = _partsET(d || new Date());
    return p.yyyy + '-' + p.mm + '-' + p.dd;
  }

  // ── PUBLIC: todayKey ─────────────────────────────────────────────
  function todayKey() {
    return ymd(new Date());
  }

  // ── PUBLIC: addDays ──────────────────────────────────────────────
  // Returns a Date n days after `d` in the ET calendar. Result is
  // anchored at UTC-noon of the target ET day, so ymd(result) returns
  // the expected calendar string. Negative n is fine (subtract days).
  function addDays(d, n) {
    const p = _partsET(d || new Date());
    const out = _utcNoon(p.yyyy, p.mm, p.dd);
    out.setUTCDate(out.getUTCDate() + Number(n || 0));
    return out;
  }

  // ── PUBLIC: getWeekStart ─────────────────────────────────────────
  // Returns the Sunday at-or-before d (in ET), anchored at UTC-noon.
  // If d is itself a Sunday in ET, returns a Date keyed on that Sunday.
  function getWeekStart(d) {
    const p = _partsET(d || new Date());
    const dow = DOW_MAP[p.dow]; // 0=Sun..6=Sat
    const out = _utcNoon(p.yyyy, p.mm, p.dd);
    if (dow === 0) return out;
    out.setUTCDate(out.getUTCDate() - dow);
    return out;
  }

  // ── PUBLIC: getWeekEnd ───────────────────────────────────────────
  // Returns the Saturday at-or-after d (in ET), anchored at UTC-noon.
  function getWeekEnd(d) {
    const start = getWeekStart(d);
    start.setUTCDate(start.getUTCDate() + 6);
    return start;
  }

  // ── PUBLIC: getCurrentWeekStart / getCurrentWeekEnd ──────────────
  function getCurrentWeekStart() { return getWeekStart(new Date()); }
  function getCurrentWeekEnd()   { return getWeekEnd(new Date()); }

  // ── PUBLIC API ───────────────────────────────────────────────────
  const WeekUtils = {
    getWeekStart:        getWeekStart,
    getWeekEnd:          getWeekEnd,
    getCurrentWeekStart: getCurrentWeekStart,
    getCurrentWeekEnd:   getCurrentWeekEnd,
    ymd:                 ymd,
    todayKey:            todayKey,
    addDays:             addDays,
    dayOfWeekET:         dayOfWeekET,
  };

  if (typeof window !== 'undefined') {
    window.WeekUtils = WeekUtils;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeekUtils;
  }
})();
