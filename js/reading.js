/**
 * Orthodox Expedition — Reading Lane
 *
 * Dispatch 3c · Reading Streak + Verse-Range + Sunday Settlement
 *
 * Pattern B mirror of the session-lane streak pattern. Reading is
 * structurally analogous to SESSIONS (per-day boolean events), not
 * to PRAYER (AM/PM duality). The canonical mirror determined by
 * data shape + event cardinality is weekly_session_grace, not
 * prayer_streak_weekly — see Op Learning #16.
 *
 * Reading.getStreak() walks reading_completions on-the-fly,
 * computing per-week intactness with the canonical 5/7-of-active
 * days threshold (Math.max(1, Math.ceil(activeDays * 5/7))) and
 * grace rescue at threshold-1. Pilgrimage days are excluded from
 * the active-day window via Pilgrimages.isActiveOn.
 *
 * STRUCTURAL MIRROR OF Prayers.getStreak() (js/prayers.js:281-407)
 *   • Same window math: from oldestWeekStart through
 *     lastClosedWeekStart (current in-progress week is NEVER
 *     counted and NEVER breaks).
 *   • Same pilgrimage exclusion via Pilgrimages.isActiveOn.
 *   • Same threshold math via Math.max(1, Math.ceil(activeDays*5/7))
 *     and rescue at intactThreshold - 1 (floored at 1).
 *   • Same "all-pilgrimage week preserves streak" semantic
 *     (activeDays === 0 → continue without increment or break).
 *
 * LAZY GRACE PERSISTENCE — DIVERGENCE FROM Prayers.getStreak()
 *   Prayers.getStreak observes graceUsed from DB and rescues only
 *   when graceUsed=true (legacy streak-grace.js daily walker is
 *   the writer for prayer). Reading has no such legacy walker, so
 *   when a 4/7 past week is encountered with graceUsed=false, the
 *   walker consumes that week's grace by calling
 *   StreakGrace.persistReadingGrace fire-and-forget. Each week's
 *   grace is independent (1 per week per lane per Dispatch 2
 *   architecture), so per-week lazy consume is bounded and the
 *   idempotent persist makes it safe to re-run.
 *
 *   Pass opts.noGracePersist === true to disable the side-effect
 *   for tests / read-only callers.
 *
 * Public API:
 *   await Reading.init(sb, profileId)         — stash sb + profile
 *   await Reading.getStreak(opts?)            — integer
 *
 * opts (all optional):
 *   today           — Date (defaults to new Date())
 *   lookbackWeeks   — int (default 12)
 *   noGracePersist  — bool (default false; true disables lazy
 *                     grace persistence, useful for read-only
 *                     callers and tests)
 *
 * Reading.getStreak() returns 0 if:
 *   • init has not been called (sb / profileId missing)
 *   • WeekUtils is not loaded (cannot compute week boundaries safely)
 *   • any unrecoverable read error
 *
 * The current in-progress week is NEVER counted in the streak (it
 * can't yet be intact) and NEVER breaks it (settlement is by the
 * Sunday boundary). Pre-launch / no-history: returns 0.
 */

const Reading = (() => {

  // ── STATE ────────────────────────────────────────────────────────
  let sb = null;
  let profileId = null;

  // ── INIT ─────────────────────────────────────────────────────────
  async function init(supabaseClient, currentProfileId) {
    sb = supabaseClient || null;
    profileId = currentProfileId || null;
    return true;
  }

  // ── GET STREAK ───────────────────────────────────────────────────
  // Mirrors Prayers.getStreak() structurally. See module-level
  // comment block for the canonical-pattern rationale.
  async function getStreak(opts) {
    if (!sb || !profileId) return 0;
    opts = opts || {};
    const W = (typeof window !== 'undefined' && window.WeekUtils) || null;
    if (!W) {
      console.warn('Reading.getStreak: WeekUtils not loaded; returning 0');
      return 0;
    }
    const today          = opts.today || new Date();
    const lookbackWeeks  = opts.lookbackWeeks || 12;
    const noGracePersist = !!opts.noGracePersist;

    // 1. Window: from (lookbackWeeks weeks ago) up through the LAST
    //    CLOSED week. The current in-progress week is excluded from
    //    streak math (mirrors Prayers.getStreak comment block).
    const currentWeekStart     = W.getWeekStart(today);
    const lastClosedWeekStart  = W.addDays(currentWeekStart, -7);
    const oldestWeekStart      = W.addDays(currentWeekStart, -7 * lookbackWeeks);
    const oldestKey            = W.ymd(oldestWeekStart);
    const lastClosedKey        = W.ymd(lastClosedWeekStart);

    // 2. Pull reading_completions for the lookback window
    //    (one-day cushion so the boundary date isn't accidentally
    //    excluded — matches Prayers.getStreak step 3).
    const lookbackOldestKey = W.ymd(W.addDays(oldestWeekStart, -1));
    let completions = [];
    try {
      const res = await sb
        .from('reading_completions')
        .select('calendar_date')
        .eq('explorer_id', profileId)
        .gte('calendar_date', lookbackOldestKey);
      if (res.error) throw res.error;
      completions = res.data || [];
    } catch (e) {
      console.warn('Reading.getStreak: reading_completions read failed; returning 0:', e);
      return 0;
    }

    // 3. Pull weekly_reading_streak.grace_used flags for the same
    //    window.
    const graceByWeek = {};
    try {
      const res = await sb
        .from('weekly_reading_streak')
        .select('week_start_date, grace_used')
        .eq('explorer_id', profileId)
        .gte('week_start_date', oldestKey)
        .lte('week_start_date', lastClosedKey);
      if (res.error) throw res.error;
      (res.data || []).forEach(r => {
        graceByWeek[r.week_start_date] = !!r.grace_used;
      });
    } catch (e) {
      // Graceful: if grace table read fails, treat all weeks as
      // grace-not-yet-used. The walker may then lazy-consume grace
      // and the next page load will see persisted state.
      console.warn('Reading.getStreak: grace flag read failed (assuming false):', e);
    }

    // 4. Build day → completed map.
    const completedByDay = {};
    completions.forEach(c => {
      if (c && c.calendar_date) completedByDay[c.calendar_date] = true;
    });

    // 5. Pull pilgrimage rows (cached helper). Same shape as
    //    Prayers.getStreak step 6.
    let pilgrimRows = [];
    if (typeof window !== 'undefined' && window.Pilgrimages) {
      try {
        pilgrimRows = await window.Pilgrimages.loadPilgrimages(sb);
      } catch (_e) { /* graceful: no pilgrim data → no exclusions */ }
    }
    function _pilgrimOn(dateKey) {
      for (let i = 0; i < pilgrimRows.length; i++) {
        const row = pilgrimRows[i];
        if (row.status === 'cancelled') continue;
        if (!row.start_date || !row.end_date) continue;
        if (row.start_date <= dateKey && dateKey <= row.end_date) return true;
      }
      return false;
    }

    // 6. Walk back week-by-week from lastClosedWeekStart.
    let streak = 0;
    let cursor = lastClosedWeekStart;
    for (let w = 0; w < lookbackWeeks; w++) {
      const weekStartKey = W.ymd(cursor);

      // Count completed-reading days and pilgrimage days in this week.
      let completedDays = 0;
      let pilgrimDays   = 0;
      for (let d = 0; d < 7; d++) {
        const dKey = W.ymd(W.addDays(cursor, d));
        if (_pilgrimOn(dKey)) {
          pilgrimDays++;
          continue;
        }
        if (completedByDay[dKey]) completedDays++;
      }
      const activeDays = 7 - pilgrimDays;
      const graceUsed  = !!graceByWeek[weekStartKey];

      // All-pilgrimage week: streak preserved (neither counted nor
      // broken). Move on to the prior week. Matches Prayers.getStreak.
      if (activeDays === 0) {
        cursor = W.addDays(cursor, -7);
        continue;
      }

      // Threshold scaling: 5/7 of active days, floor of 1.
      //   activeDays=7 → intact=5, rescue=4
      //   activeDays=4 → intact=3, rescue=2 (Wed-Fri pilgrimage)
      //   activeDays=1 → intact=1, rescue=1 (single-eligible-day week)
      // Identical math to Prayers.getStreak step 7.
      const intactThreshold = Math.max(1, Math.ceil(activeDays * 5 / 7));
      const rescueThreshold = Math.max(1, intactThreshold - 1);

      let intact = false;

      if (completedDays >= intactThreshold) {
        // Clean intact — no grace needed.
        intact = true;
      } else if (completedDays >= rescueThreshold) {
        if (graceUsed) {
          // Grace already persisted for this week → rescue.
          intact = true;
        } else if (!noGracePersist) {
          // LAZY GRACE PERSIST — divergence from Prayers.getStreak.
          // 1-per-week-per-lane independence (each week starts with
          // its own grace token). Consuming this week's grace makes
          // the next walk read graceUsed=true and rescue without
          // re-writing. Best-effort; fire-and-forget.
          intact = true;
          if (typeof window !== 'undefined'
              && window.StreakGrace
              && typeof window.StreakGrace.persistReadingGrace === 'function') {
            try {
              window.StreakGrace.persistReadingGrace(sb, profileId, weekStartKey);
              // Update in-memory map so a subsequent same-call iteration
              // (defensive — wouldn't normally re-visit the same week)
              // reads the consumed state.
              graceByWeek[weekStartKey] = true;
            } catch (_e) { /* graceful */ }
          }
        }
        // else: noGracePersist=true and grace not yet used → don't
        // rescue (read-only mode). Falls through to break.
      }

      if (intact) {
        streak++;
        cursor = W.addDays(cursor, -7);
      } else {
        // First broken week stops the walk. Same as Prayers.getStreak.
        break;
      }
    }
    return streak;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  return {
    init,
    getStreak,
  };
})();

if (typeof window !== 'undefined') window.Reading = Reading;
if (typeof module !== 'undefined' && module.exports) module.exports = Reading;
