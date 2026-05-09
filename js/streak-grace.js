/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Repair B
   js/streak-grace.js — Once-per-week grace tokens for streaks
   May 8, 2026

   PURPOSE
   ADHD failure-mode prevention. Without grace, a single missed prayer
   tap (forgot before bed, friend's house, hard day) resets the streak
   to zero — repeated weekly, that kills engagement. Grace silently
   absorbs ordinary human imperfection without making Nolan feel like
   he failed.

   TWO INDEPENDENT POOLS, ONE TOKEN EACH PER CALENDAR WEEK (Mon-Sun):
     1. Prayer streak — covered by `prayer_streak_weekly.grace_used`
     2. Weekly session ladder — covered by the `weekly_session_grace`
        table (1 row per explorer per week, lazily created)

   WEEK BOUNDARY
   Local-time Monday at 00:00, matching prayer_streak_weekly's existing
   `week_start_date` keying. Both grace pools clear automatically every
   Monday because new-week rows default `grace_used=false` (or simply
   don't exist yet, which reads as "untouched").

   READ-TIME / WRITE-TIME SPLIT
   • Detection is read-time. The streak walker observes which days had
     misses; persistence happens lazily.
   • The Sunday rollup (js/prayer-rollup.js) is NOT touched. Grace is
     evaluated BEFORE the rollup makes its broken/intact decision —
     by the streak computation the moment the page loads.

   TWO MISSES IN A WEEK = WEEK BROKEN
   No extra punitive UI per dispatch. The pip stays (grace was used);
   the streak resets at the natural rollup boundary as it would have
   without grace.

   PURE FUNCTIONS (testable, framework-free):
     ymd(d)                          — local YYYY-MM-DD
     getCurrentMonday(d)             — Monday at-or-before d, midnight
     classifyDay(dayStatus)          — 'both' | 'half' | 'none'
     computePrayerStreak(byDay, today, lookbackDays)
                                     — { streak, weeksWithGrace[] }
     evaluateSessionWeek(progressRow, today, weekStartDate)
                                     — { missedDaysSoFar, graceShouldBeUsed,
                                         weekBroken }

   SIDE-EFFECTS (Supabase calls):
     persistPrayerGrace(sb, profileId, weekStartDate)
     persistSessionGrace(sb, profileId, weekStartDate)
     readPrayerGraceFlag(sb, profileId, weekStartDate)
     readSessionGraceFlag(sb, profileId, weekStartDate)

   PUBLIC API (browser): window.StreakGrace = { …all of the above… }
   PUBLIC API (node/test): module.exports = StreakGrace;

   Schema decision rationale (Op Learning #12):
   Pattern (A) on prayer_streak_weekly was chosen because that row
   already exists per (explorer, week) and tracks the same identity
   tuple — adding a single boolean is the minimum-touch path. Pattern
   (B) — a separate `weekly_session_grace` table — was chosen for the
   session ladder because there is currently NO existing per-week
   session-rollup table to extend. Symmetric (explorer_id,
   week_start_date) keying and RLS posture across both surfaces.
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── DATE HELPERS ─────────────────────────────────────────────────

  /** YYYY-MM-DD in LOCAL time. Matches prayer-rollup.js's ymd() exactly. */
  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /**
   * Returns the Date of the Monday at-or-before `d`, normalized to
   * local-midnight. Sunday treated as END of the week (Sun → previous
   * Mon). Identical to prayer-rollup.js's getCurrentMonday().
   */
  function getCurrentMonday(d) {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    const dow = out.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = (dow === 0) ? -6 : 1 - dow;
    out.setDate(out.getDate() + diff);
    return out;
  }

  /** Classify a day's prayer status. */
  function classifyDay(dayStatus) {
    if (!dayStatus) return 'none';
    const m = !!dayStatus.morning;
    const e = !!dayStatus.evening;
    if (m && e) return 'both';
    if (m || e) return 'half';
    return 'none';
  }

  // ── PRAYER STREAK — STRICT-WITH-GRACE ────────────────────────────

  /**
   * Walk back from `today` and count consecutive streak-eligible days.
   *
   * RULES
   *   • A streak day is one where BOTH morning AND evening prayer
   *     were completed.
   *   • A "half-miss day" (one of two prayers done) within a week
   *     that has NOT yet used grace also counts — grace is consumed.
   *   • A second half-miss in the same week BREAKS the streak.
   *   • A "full-miss day" (zero prayers) ALWAYS breaks. Two missed
   *     slots in one day exceeds the once-per-week budget.
   *   • Today is special: NEVER breaks on its own — Nolan may still
   *     pray. Today increments the streak only if both today's
   *     prayers are done; a half-or-zero today neither breaks nor
   *     increments.
   *
   * INPUT
   *   byDay         — { 'YYYY-MM-DD': { morning: bool, evening: bool }, ... }
   *   today         — Date (defaults to new Date())
   *   lookbackDays  — int (default 60). 60 is plenty; longer streaks
   *                   need a different surface anyway.
   *
   * OUTPUT
   *   { streak: int,
   *     weeksWithGrace: [ 'YYYY-MM-DD' (Monday key), ... ]   }
   *
   * `weeksWithGrace` is the set of week-Monday keys where this walk
   * observed a half-miss (i.e., grace was consumed, persisted or not
   * yet). Caller decides whether to write back to the DB.
   */
  function computePrayerStreak(byDay, today, lookbackDays) {
    today = today || new Date();
    lookbackDays = lookbackDays || 60;

    let streak = 0;
    const weeksWithGrace = {};
    const cursor = new Date(today);

    for (let i = 0; i < lookbackDays; i++) {
      const dKey = ymd(cursor);
      const cls = classifyDay(byDay[dKey]);
      const weekKey = ymd(getCurrentMonday(cursor));

      if (i === 0) {
        // TODAY: never break. Increment only if both done.
        if (cls === 'both') {
          streak++;
        } else if (cls === 'half') {
          // Today's evening (or morning) may simply not be due yet.
          // Don't consume grace and don't break — but don't increment
          // either; today isn't a "completed" streak day yet.
        } else {
          // 'none' — Nolan may still pray today; don't break.
        }
      } else {
        if (cls === 'both') {
          streak++;
        } else if (cls === 'half') {
          // Past day, half-miss. Consume grace if available for this week.
          if (!weeksWithGrace[weekKey]) {
            weeksWithGrace[weekKey] = true;
            streak++;
          } else {
            // Grace already consumed by a more-recent half-miss in this
            // same week — second miss breaks.
            break;
          }
        } else {
          // 'none' = full miss = two missed slots = always breaks.
          break;
        }
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      streak: streak,
      weeksWithGrace: Object.keys(weeksWithGrace),
    };
  }

  // ── SESSION WEEK — MISS DETECTION ────────────────────────────────

  /**
   * Evaluate the active session's M/W/F state for the current calendar
   * week. Pure function; takes a session_progress row plus today's
   * date and the week's Monday.
   *
   * INPUT
   *   progressRow  — { day_1_completed_at, day_2_completed_at,
   *                    day_3_completed_at } | null
   *   today        — Date
   *   weekStart    — Date (Monday of current calendar week)
   *
   * OUTPUT
   *   { missedDaysSoFar:    int (0-3),
   *     graceShouldBeUsed:  bool — at least one M/W/F day is past
   *                                without completion,
   *     weekBroken:         bool — two or more of M/W/F missed }
   *
   * "Past without completion" means: the natural calendar day for that
   * slot (Mon, Wed, or Fri of `weekStart`) is strictly before today,
   * AND the corresponding day_N_completed_at is null/missing.
   *
   * Today itself is never counted as a miss — Nolan can still complete
   * it. (e.g., it's Wednesday at 3pm and the handout isn't done yet —
   * not a miss until Thursday.)
   */
  function evaluateSessionWeek(progressRow, today, weekStart) {
    const SLOTS = [
      { dayOffset: 0, field: 'day_1_completed_at' }, // Mon
      { dayOffset: 2, field: 'day_2_completed_at' }, // Wed
      { dayOffset: 4, field: 'day_3_completed_at' }, // Fri
    ];

    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    let missed = 0;
    SLOTS.forEach(function (s) {
      const slotDate = new Date(weekStart);
      slotDate.setDate(slotDate.getDate() + s.dayOffset);
      slotDate.setHours(0, 0, 0, 0);
      const isPast = slotDate < todayMidnight;
      const completed = !!(progressRow && progressRow[s.field]);
      if (isPast && !completed) missed++;
    });

    return {
      missedDaysSoFar:   missed,
      graceShouldBeUsed: missed >= 1,
      weekBroken:        missed >= 2,
    };
  }

  // ── PERSISTENCE — PRAYER ─────────────────────────────────────────

  /**
   * UPSERT prayer_streak_weekly's grace_used = true for a given week.
   * Idempotent. Skips DB write if flag is already true. Best-effort
   * (does not throw on failure — caller should rely on the read flag
   * to render UI; if the write fails, the next page load retries).
   *
   * Returns { ok: bool, wrote: bool, error?: any }.
   */
  async function persistPrayerGrace(sb, profileId, weekStartDate) {
    if (!sb || !profileId || !weekStartDate) {
      return { ok: false, wrote: false };
    }
    try {
      // Read first to avoid an unnecessary write.
      const existing = await sb
        .from('prayer_streak_weekly')
        .select('id, grace_used')
        .eq('explorer_id', profileId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (existing.error) throw existing.error;

      if (existing.data && existing.data.grace_used === true) {
        return { ok: true, wrote: false };
      }

      if (existing.data) {
        // Row exists; flip the flag.
        const upd = await sb
          .from('prayer_streak_weekly')
          .update({ grace_used: true })
          .eq('id', existing.data.id);
        if (upd.error) throw upd.error;
        return { ok: true, wrote: true };
      }

      // No row yet — create one. (Edge case: half-miss observed before
      // any prayer was ever recorded for this week, which is unusual but
      // harmless. Default morning_count/evening_count = 0.)
      const ins = await sb
        .from('prayer_streak_weekly')
        .insert([{
          explorer_id:     profileId,
          week_start_date: weekStartDate,
          grace_used:      true,
          morning_count:   0,
          evening_count:   0,
        }]);
      if (ins.error) throw ins.error;
      return { ok: true, wrote: true };
    } catch (e) {
      console.warn('StreakGrace.persistPrayerGrace failed:', e);
      return { ok: false, wrote: false, error: e };
    }
  }

  /** Read the current value. Returns false if row missing or read fails. */
  async function readPrayerGraceFlag(sb, profileId, weekStartDate) {
    if (!sb || !profileId || !weekStartDate) return false;
    try {
      const res = await sb
        .from('prayer_streak_weekly')
        .select('grace_used')
        .eq('explorer_id', profileId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (res.error) throw res.error;
      return !!(res.data && res.data.grace_used);
    } catch (e) {
      console.warn('StreakGrace.readPrayerGraceFlag failed:', e);
      return false;
    }
  }

  // ── PERSISTENCE — SESSION ────────────────────────────────────────

  /**
   * UPSERT weekly_session_grace.grace_used = true for a given week.
   * Lazy row creation: row only exists once the first miss is detected.
   * Idempotent. Best-effort.
   */
  async function persistSessionGrace(sb, profileId, weekStartDate) {
    if (!sb || !profileId || !weekStartDate) {
      return { ok: false, wrote: false };
    }
    try {
      const existing = await sb
        .from('weekly_session_grace')
        .select('id, grace_used')
        .eq('explorer_id', profileId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (existing.error) throw existing.error;

      if (existing.data && existing.data.grace_used === true) {
        return { ok: true, wrote: false };
      }

      if (existing.data) {
        const upd = await sb
          .from('weekly_session_grace')
          .update({ grace_used: true })
          .eq('id', existing.data.id);
        if (upd.error) throw upd.error;
        return { ok: true, wrote: true };
      }

      const ins = await sb
        .from('weekly_session_grace')
        .insert([{
          explorer_id:     profileId,
          week_start_date: weekStartDate,
          grace_used:      true,
        }]);
      if (ins.error) throw ins.error;
      return { ok: true, wrote: true };
    } catch (e) {
      console.warn('StreakGrace.persistSessionGrace failed:', e);
      return { ok: false, wrote: false, error: e };
    }
  }

  /** Read the current session-grace flag for a given week. */
  async function readSessionGraceFlag(sb, profileId, weekStartDate) {
    if (!sb || !profileId || !weekStartDate) return false;
    try {
      const res = await sb
        .from('weekly_session_grace')
        .select('grace_used')
        .eq('explorer_id', profileId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (res.error) throw res.error;
      return !!(res.data && res.data.grace_used);
    } catch (e) {
      console.warn('StreakGrace.readSessionGraceFlag failed:', e);
      return false;
    }
  }

  // ── PUBLIC API ───────────────────────────────────────────────────

  const StreakGrace = {
    // Pure helpers
    ymd:                  ymd,
    getCurrentMonday:     getCurrentMonday,
    classifyDay:          classifyDay,
    computePrayerStreak:  computePrayerStreak,
    evaluateSessionWeek:  evaluateSessionWeek,
    // Side-effects
    persistPrayerGrace:   persistPrayerGrace,
    persistSessionGrace:  persistSessionGrace,
    readPrayerGraceFlag:  readPrayerGraceFlag,
    readSessionGraceFlag: readSessionGraceFlag,
  };

  if (typeof window !== 'undefined') {
    window.StreakGrace = StreakGrace;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreakGrace;
  }
})();
