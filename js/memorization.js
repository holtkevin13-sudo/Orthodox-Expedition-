/**
 * Orthodox Expedition — Memorization Lane (Lane 5)
 *
 * Dispatch 4a · Memorization Lane Foundation
 *
 * STRUCTURAL MIRROR OF Reading (js/reading.js). Per Op Learning #16
 * (Dispatch 3c discovery), canonical pattern mirrors are determined
 * by structural fit — not surface concept. Memorization is a per-day
 * boolean event (one "I tried it today" tap per day, +5 coins), so
 * its streak walker is identical in shape to Reading's, which is in
 * turn the structural sibling of weekly_session_grace.
 *
 *   reading_completions          ↔  verse_practice_completions
 *   weekly_reading_streak        ↔  weekly_memorization_streak
 *   Reading.getStreak()          ↔  Memorization.getStreak()
 *   persistReadingGrace          ↔  persistMemorizationGrace
 *
 * THE LANE 5 DIVERGENCE
 *   Reading content lives on liturgical_calendar.daily_readings as
 *   per-day JSONB payloads. Memorization content is per-WEEK, family-
 *   authored, and lives on the new weekly_verses table. So this
 *   module exposes a small verse-fetch surface in addition to the
 *   streak math:
 *     • getVerseForWeek(sb, familyId, weekStartDate)
 *     • getCurrentVerse(sb, familyId)
 *     • didTodayCount(sb, explorerId)
 *     • practiceToday(sb, explorerId, familyId)
 *     • getStreak(sb, explorerId, opts?)
 *
 * COIN AWARD PATTERN (practiceToday)
 *   Mirrors the canonical commitCompletion() in js/reading-quest.js
 *   (lines 213-255). Row insert first, profile coin-bump second. A
 *   23505 unique-violation on the insert is treated as the benign
 *   duplicate case (already-practiced today, idempotent no-op, zero
 *   coins). Coin-award failure is non-fatal — the completion row is
 *   the canonical record.
 *
 * STREAK MATH (getStreak)
 *   Identical to Reading.getStreak():
 *     • Window: from (lookbackWeeks × 7 days ago) up through the
 *       LAST CLOSED week. Current in-progress week is NEVER counted
 *       and NEVER breaks.
 *     • Threshold: Math.max(1, Math.ceil(activeDays × 5 / 7))
 *     • Rescue:   Math.max(1, intactThreshold - 1) with one
 *                 grace token per week (lazy persist).
 *     • Pilgrimage days excluded via Pilgrimages.isActiveOn.
 *     • All-pilgrimage weeks preserve streak (neither count nor
 *       break).
 *
 *   getStreak(sb, explorerId, opts?) accepts a thin shim signature
 *   matching the Dispatch 4a spec. opts mirror Reading.getStreak:
 *     • today (Date)
 *     • lookbackWeeks (int, default 12)
 *     • noGracePersist (bool, default false)
 *
 *   Returns 0 if sb/profileId missing, WeekUtils not loaded, or any
 *   unrecoverable read error.
 */

const Memorization = (() => {
  'use strict';

  // ── INTERNAL: WeekUtils handle ─────────────────────────────────
  function _WU() {
    return (typeof window !== 'undefined' && window.WeekUtils) || null;
  }

  // ── PUBLIC: getVerseForWeek ────────────────────────────────────
  // Returns the verse assigned to a given (family, week_start_date),
  // or null if none. Returns null on read error (graceful — caller
  // should render the empty state).
  async function getVerseForWeek(sb, familyId, weekStartDate) {
    if (!sb || !familyId || !weekStartDate) return null;
    try {
      const res = await sb
        .from('weekly_verses')
        .select('id, reference, verse_text, week_start_date')
        .eq('family_id', familyId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data || null;
    } catch (e) {
      console.warn('Memorization.getVerseForWeek failed:', e);
      return null;
    }
  }

  // ── PUBLIC: getCurrentVerse ────────────────────────────────────
  // Convenience: looks up the verse for the current ET week-start.
  async function getCurrentVerse(sb, familyId) {
    const W = _WU();
    if (!W) {
      console.warn('Memorization.getCurrentVerse: WeekUtils not loaded');
      return null;
    }
    const weekStartKey = W.ymd(W.getWeekStart(new Date()));
    return getVerseForWeek(sb, familyId, weekStartKey);
  }

  // ── PUBLIC: didTodayCount ──────────────────────────────────────
  // Returns true iff a verse_practice_completions row exists for
  // (explorer, today). Best-effort: read failure returns false so
  // the UI defaults to the practice-available state.
  async function didTodayCount(sb, explorerId) {
    if (!sb || !explorerId) return false;
    const W = _WU();
    if (!W) return false;
    try {
      const today = W.todayKey();
      const res = await sb
        .from('verse_practice_completions')
        .select('id')
        .eq('explorer_id', explorerId)
        .eq('calendar_date', today)
        .maybeSingle();
      if (res.error) throw res.error;
      return !!res.data;
    } catch (e) {
      console.warn('Memorization.didTodayCount failed:', e);
      return false;
    }
  }

  // ── PUBLIC: practiceToday ──────────────────────────────────────
  // Idempotent. Inserts the row first; on 23505 duplicate, treats
  // as already-done with zero coins (no double-award). On success,
  // bumps profile.coins + lifetime_coins by +5 via the canonical
  // direct-bump pattern from reading-quest.js commitCompletion.
  //
  // Returns { ok, alreadyDone, coinsAwarded }.
  async function practiceToday(sb, explorerId, familyId) {
    if (!sb || !explorerId || !familyId) {
      return { ok: false, alreadyDone: false, coinsAwarded: 0 };
    }
    const W = _WU();
    if (!W) {
      return { ok: false, alreadyDone: false, coinsAwarded: 0 };
    }
    const today = W.todayKey();
    const COINS = 5;

    // Step 1: insert completion row. UNIQUE catches duplicates.
    try {
      const ins = await sb
        .from('verse_practice_completions')
        .insert([{
          explorer_id:  explorerId,
          family_id:    familyId,
          calendar_date: today,
          coins_earned: COINS,
        }])
        .select()
        .single();

      if (ins.error) {
        const isDup = (ins.error.code === '23505') ||
                      (ins.error.message && /duplicate/i.test(ins.error.message));
        if (isDup) {
          return { ok: true, alreadyDone: true, coinsAwarded: 0 };
        }
        console.warn('Memorization.practiceToday insert error:', ins.error);
        return { ok: false, alreadyDone: false, coinsAwarded: 0 };
      }
    } catch (e) {
      console.warn('Memorization.practiceToday insert threw:', e);
      return { ok: false, alreadyDone: false, coinsAwarded: 0 };
    }

    // Step 2: bump coins. Non-fatal on failure (the completion row
    // is already saved and is the canonical record).
    try {
      const profRes = await sb
        .from('profiles')
        .select('coins, lifetime_coins')
        .eq('id', explorerId)
        .single();
      const prof = profRes.data || { coins: 0, lifetime_coins: 0 };
      await sb.from('profiles').update({
        coins:          (prof.coins          || 0) + COINS,
        lifetime_coins: (prof.lifetime_coins || 0) + COINS,
      }).eq('id', explorerId);
    } catch (coinErr) {
      console.warn('Memorization.practiceToday coin award failed (non-fatal):', coinErr);
    }

    return { ok: true, alreadyDone: false, coinsAwarded: COINS };
  }

  // ── PUBLIC: getStreak ──────────────────────────────────────────
  // Structural mirror of Reading.getStreak (js/reading.js:79-239).
  // See module-level comment block for the canonical-pattern
  // rationale. Walks verse_practice_completions on-the-fly, computes
  // per-week intactness against the 5/7-of-active-days threshold with
  // grace rescue at threshold-1. Pilgrimage exclusion via
  // Pilgrimages.isActiveOn. Lazy grace persistence (write-back on
  // observation of a 4/7 past week that hasn't yet consumed grace).
  async function getStreak(sb, explorerId, opts) {
    if (!sb || !explorerId) return 0;
    opts = opts || {};
    const W = _WU();
    if (!W) {
      console.warn('Memorization.getStreak: WeekUtils not loaded; returning 0');
      return 0;
    }
    const today          = opts.today || new Date();
    const lookbackWeeks  = opts.lookbackWeeks || 12;
    const noGracePersist = !!opts.noGracePersist;

    // 1. Window: lookbackWeeks back through the LAST CLOSED week.
    const currentWeekStart    = W.getWeekStart(today);
    const lastClosedWeekStart = W.addDays(currentWeekStart, -7);
    const oldestWeekStart     = W.addDays(currentWeekStart, -7 * lookbackWeeks);
    const oldestKey           = W.ymd(oldestWeekStart);
    const lastClosedKey       = W.ymd(lastClosedWeekStart);

    // 2. Pull verse_practice_completions with a one-day cushion
    //    (mirrors Reading.getStreak step 2).
    const lookbackOldestKey = W.ymd(W.addDays(oldestWeekStart, -1));
    let completions = [];
    try {
      const res = await sb
        .from('verse_practice_completions')
        .select('calendar_date')
        .eq('explorer_id', explorerId)
        .gte('calendar_date', lookbackOldestKey);
      if (res.error) throw res.error;
      completions = res.data || [];
    } catch (e) {
      console.warn('Memorization.getStreak: verse_practice_completions read failed; returning 0:', e);
      return 0;
    }

    // 3. Pull weekly_memorization_streak.grace_used for the same window.
    const graceByWeek = {};
    try {
      const res = await sb
        .from('weekly_memorization_streak')
        .select('week_start_date, grace_used')
        .eq('explorer_id', explorerId)
        .gte('week_start_date', oldestKey)
        .lte('week_start_date', lastClosedKey);
      if (res.error) throw res.error;
      (res.data || []).forEach(r => {
        graceByWeek[r.week_start_date] = !!r.grace_used;
      });
    } catch (e) {
      // Graceful: treat all as grace-not-yet-used.
      console.warn('Memorization.getStreak: grace flag read failed (assuming false):', e);
    }

    // 4. Day → completed map.
    const completedByDay = {};
    completions.forEach(c => {
      if (c && c.calendar_date) completedByDay[c.calendar_date] = true;
    });

    // 5. Pilgrimage rows (cached helper).
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

      // All-pilgrimage week preserves streak.
      if (activeDays === 0) {
        cursor = W.addDays(cursor, -7);
        continue;
      }

      // Threshold math: 5/7 of active days, floor 1.
      const intactThreshold = Math.max(1, Math.ceil(activeDays * 5 / 7));
      const rescueThreshold = Math.max(1, intactThreshold - 1);

      let intact = false;

      if (completedDays >= intactThreshold) {
        intact = true;
      } else if (completedDays >= rescueThreshold) {
        if (graceUsed) {
          intact = true;
        } else if (!noGracePersist) {
          // LAZY GRACE PERSIST — one token per week (Pattern B,
          // Dispatch 2 architecture). Best-effort fire-and-forget.
          intact = true;
          if (typeof window !== 'undefined'
              && window.StreakGrace
              && typeof window.StreakGrace.persistMemorizationGrace === 'function') {
            try {
              window.StreakGrace.persistMemorizationGrace(sb, explorerId, weekStartKey);
              graceByWeek[weekStartKey] = true;
            } catch (_e) { /* graceful */ }
          }
        }
        // else: noGracePersist & grace not yet used → no rescue.
      }

      if (intact) {
        streak++;
        cursor = W.addDays(cursor, -7);
      } else {
        // First broken week stops the walk.
        break;
      }
    }
    return streak;
  }

  // ── PUBLIC API ─────────────────────────────────────────────────
  return {
    getVerseForWeek,
    getCurrentVerse,
    didTodayCount,
    practiceToday,
    getStreak,
  };
})();

if (typeof window !== 'undefined') window.Memorization = Memorization;
if (typeof module !== 'undefined' && module.exports) module.exports = Memorization;
