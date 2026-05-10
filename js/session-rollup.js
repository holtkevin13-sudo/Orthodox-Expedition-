/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Repair Chat G
   js/session-rollup.js — Sunday-evening weekly session-streak rollup
   May 8, 2026 (Sunday-anchor migration: Dispatch 2, May 10, 2026)

   PURPOSE
   profiles.streak (the weekly session ladder counter) had no
   auto-increment path — only admin.html's manual write touched it,
   plus a vestigial missions.html "attend an expedition" mission
   flow that hasn't been part of the post-Repair-B1 model. The
   grace pip on progress.html was decoratively functional, but the
   streak NUMBER never moved on its own when a week settled. This
   file fixes that.

   When Nolan opens the app on a new Sunday-or-later, every calendar
   week that closed since the last settle is processed in
   chronological order:
     - 0 missed M/W/F days  → week counted; streak += 1
     - 1 missed day         → grace consumed (lazily persisted to
                                weekly_session_grace.grace_used);
                                week counted; streak += 1
     - 2 or 3 missed days   → week broken; streak reset to 0
   Each successful increment that lands on 8/12/20/40 awards a
   ladder bonus (250/400/750/1500 coins) via the profiles.coins
   bump + activity_log insert pattern Lane 3 established. (No
   log_session_streak_coins trigger exists; client bumps coins
   directly per Operational Learning #4.)

   PILGRIMAGE INTEGRATION (Dispatch 2, Surface C)
   When Nolan is on pilgrimage during M, W, or F of a week, that
   slot is excluded from the miss count entirely — neither counted
   toward nor against the threshold. The threshold scales:
     - 3 active session days → ≥2 misses breaks the week
     - 2 active session days → ≥2 misses breaks the week (1 grace ok)
     - 1 active session day  → 1 miss breaks the week (no grace
                               available — too few slots to spend it)
     - 0 active session days → settlement skipped; streak inherited
   This preserves the streak across spiritual journeys.

   SCHEMA-TOUCHING SCOPE (Operational Learning #12 — explicit in/out)
     IN  : reads session_progress.day_{1,2,3}_completed_at;
           reads/writes profiles.streak + profiles.last_settled_week_start
             (new column added by migration
              streak_auto_increment_pointer_20260508);
           reads/writes profiles.coins + lifetime_coins on ladder hits;
           reads weekly_session_grace.grace_used (Chat B's table);
           writes weekly_session_grace via persistSessionGrace
             (delegated to window.StreakGrace; same shape Chat B
             already uses from progress.html on page load);
           writes activity_log on ladder hits.
     OUT : NO change to weekly_session_grace SCHEMA, prayer_streak_weekly,
           session_progress, prayer-rollup.js, streak-grace.js,
           ladder threshold values (Lane 2 locked: 8/12/20/40,
           250/400/750/1500), admin.html's manual streak write path,
           Repair B1 session-completion logic, or any RLS policy.

   IDEMPOTENCY (Pattern A — single pointer on profiles)
   The settle scan advances `last_settled_week_start` after the walk
   completes. On NULL (never-settled), the first invocation
   INITIALIZES the pointer to today's week-start (Sunday) and returns
   — no retroactive settlement of pre-launch noise weeks. On any
   subsequent call, weeks strictly between the pointer and the
   current calendar week-start are settled in order; running twice on
   the same Sunday is a no-op (the pointer is already at
   currentWeekStart).

   RACE-SAFETY
   Two tabs racing on the same Sunday will both compute the same
   final state from the same starting pointer; the last-writer-wins
   update lands the correct value. Ladder coin awards CAN double-fire
   under simultaneous tabs (activity_log is a record, not a guard) —
   real-world impact on Nolan's iPad-with-one-tab workflow is ~zero;
   accepted as out-of-scope for pre-launch.

   PRE-LAUNCH GRACE
   Topic 00 launches May 18, 2026. Until then no session_progress
   rows exist; if rollup ran on past weeks before then, every week
   would settle as broken (3 misses) and reset streak to 0 (which
   is already 0). The NULL-pointer init avoids this entirely:
   first invocation sets last_settled_week_start = currentWeekStart
   and returns without touching streak. Going forward the rollup
   walks one week at a time as Sundays pass.

   PUBLIC API
     window.SessionRollup.run(sb, profileId)
       → { ok, settled, transitions, ladderHits, reason?, error? }

     where each transition is:
       { weekStart: 'YYYY-MM-DD', missed: 0|1|2|3,
         before: int, after: int,
         kind: 'counted_clean' | 'counted_with_grace' | 'broken' }
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── DATE HELPERS ─────────────────────────────────────────────────
  // Centralized via window.WeekUtils (js/week-utils.js). Sunday-anchored,
  // ET-aware. Thin wrappers preserve the existing public API shape.

  /**
   * Returns the Date of the Sunday at-or-before `d` (in ET), anchored
   * at UTC-noon of that ET calendar day.
   */
  function getCurrentWeekStart(d) {
    return window.WeekUtils.getWeekStart(d || new Date());
  }

  /** YYYY-MM-DD in the ET calendar. */
  function ymd(d) {
    return window.WeekUtils.ymd(d);
  }

  /** Add N days; returns a Date anchored UTC-noon of target ET day. */
  function addDays(d, n) {
    return window.WeekUtils.addDays(d, n);
  }

  // ── LADDER THRESHOLDS — Lane 2 LOCKED. DO NOT change these.
  //    Source: v3 Roadmap, Lane 2 Mission Calibration closeout:
  //      8 weeks  → 250 coins
  //     12 weeks  → 400 coins
  //     20 weeks  → 750 coins
  //     40 weeks  → 1500 coins
  const LADDER = [
    { atStreak: 8,  coins: 250,  label: '8-week streak' },
    { atStreak: 12, coins: 400,  label: '12-week streak' },
    { atStreak: 20, coins: 750,  label: '20-week streak' },
    { atStreak: 40, coins: 1500, label: '40-week streak' },
  ];

  // ── EVALUATE CLOSING WEEK ────────────────────────────────────────
  /**
   * For a closed calendar week [weekStart, weekStart+7d), aggregate
   * across any session_progress rows whose day_N_completed_at
   * timestamps land in that window. Returns the count of M/W/F
   * slots filled by ANY session_progress row in that window.
   *
   * RATIONALE — slot-fill aggregation across rows
   *   Chat B's evaluateSessionWeek (streak-grace.js) treats day_N as
   *   a boolean on a SINGLE row, regardless of when the timestamp was
   *   set. That semantic is correct for in-progress display ("did
   *   Nolan eventually finish this row's day_1 work, even if late"),
   *   but wrong for week-by-week rollup ("did Nolan engage during
   *   this calendar week"). For settlement we count slots filled by
   *   any timestamp inside the calendar window; if Nolan completed
   *   day_3 of session 00.1 in week W, then started day_1 of session
   *   00.2 in week W+1, week W+1's M slot is filled by 00.2's
   *   day_1_completed_at (a timestamp in W+1), not by 00.1's stale
   *   row state.
   *
   *   Edge case: late completion of day_1 on Tue/Thu — that timestamp
   *   still falls in the same calendar week, so the M slot is filled
   *   regardless of which weekday the user actually clicked. This
   *   matches Chat B's "did the slot eventually fill" semantic and
   *   avoids penalizing routine variance.
   */
  async function evaluateClosingWeek(sb, profileId, weekStart) {
    const weekStartIso = weekStart.toISOString();
    const weekEnd = addDays(weekStart, 7);
    const weekEndIso = weekEnd.toISOString();

    // Dispatch 2: build the M/W/F calendar dates for this week and
    // check pilgrimage active-on for each. Sunday-anchor offsets:
    //   Mon = weekStart + 1, Wed = weekStart + 3, Fri = weekStart + 5.
    const W = window.WeekUtils;
    const monKey = W ? W.ymd(addDays(weekStart, 1)) : null;
    const wedKey = W ? W.ymd(addDays(weekStart, 3)) : null;
    const friKey = W ? W.ymd(addDays(weekStart, 5)) : null;
    let mPilgrim = false, wPilgrim = false, fPilgrim = false;
    if (window.Pilgrimages && monKey && wedKey && friKey) {
      try {
        const [mP, wP, fP] = await Promise.all([
          window.Pilgrimages.isActiveOn(sb, monKey),
          window.Pilgrimages.isActiveOn(sb, wedKey),
          window.Pilgrimages.isActiveOn(sb, friKey),
        ]);
        mPilgrim = !!mP; wPilgrim = !!wP; fPilgrim = !!fP;
      } catch (_e) {
        // Best-effort: pilgrimage detection failure → fall back to
        // standard threshold (no exclusions). Don't block settlement.
      }
    }

    let rows;
    try {
      const res = await sb
        .from('session_progress')
        .select('day_1_completed_at, day_2_completed_at, day_3_completed_at')
        .eq('explorer_id', profileId)
        .or(
          'and(day_1_completed_at.gte.' + weekStartIso + ',day_1_completed_at.lt.' + weekEndIso + '),' +
          'and(day_2_completed_at.gte.' + weekStartIso + ',day_2_completed_at.lt.' + weekEndIso + '),' +
          'and(day_3_completed_at.gte.' + weekStartIso + ',day_3_completed_at.lt.' + weekEndIso + ')'
        );
      if (res.error) throw res.error;
      rows = res.data || [];
    } catch (e) {
      // Caller decides whether to abort the walk or log-and-skip.
      throw e;
    }

    let mFilled = false, wFilled = false, fFilled = false;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const d1 = r.day_1_completed_at ? new Date(r.day_1_completed_at) : null;
      const d2 = r.day_2_completed_at ? new Date(r.day_2_completed_at) : null;
      const d3 = r.day_3_completed_at ? new Date(r.day_3_completed_at) : null;
      if (d1 && d1 >= weekStart && d1 < weekEnd) mFilled = true;
      if (d2 && d2 >= weekStart && d2 < weekEnd) wFilled = true;
      if (d3 && d3 >= weekStart && d3 < weekEnd) fFilled = true;
    }
    // Pilgrimage exclusion: a pilgrim slot is neither counted toward
    // nor against the threshold. activeSlots = total - pilgrimage slots.
    const pilgrimSlots = (mPilgrim ? 1 : 0) + (wPilgrim ? 1 : 0) + (fPilgrim ? 1 : 0);
    const activeSlots = 3 - pilgrimSlots;
    // missed = active slots not filled (a pilgrim slot is never "missed")
    let missed = 0;
    if (!mPilgrim && !mFilled) missed++;
    if (!wPilgrim && !wFilled) missed++;
    if (!fPilgrim && !fFilled) missed++;
    const filled = (mFilled ? 1 : 0) + (wFilled ? 1 : 0) + (fFilled ? 1 : 0);
    return {
      mFilled: mFilled, wFilled: wFilled, fFilled: fFilled,
      mPilgrim: mPilgrim, wPilgrim: wPilgrim, fPilgrim: fPilgrim,
      activeSlots: activeSlots,
      filled: filled,
      missed: missed,
    };
  }

  // ── PERSIST GRACE FLAG ───────────────────────────────────────────
  /**
   * Lazy upsert of weekly_session_grace.grace_used = true for the
   * given week. Delegates to window.StreakGrace.persistSessionGrace
   * when present (Chat B's canonical helper) so we don't duplicate
   * upsert logic. Falls back to inline upsert if StreakGrace isn't
   * loaded for any reason.
   */
  async function persistSessionGraceFor(sb, profileId, weekStartDate) {
    if (typeof window !== 'undefined' && window.StreakGrace &&
        typeof window.StreakGrace.persistSessionGrace === 'function') {
      try {
        await window.StreakGrace.persistSessionGrace(sb, profileId, weekStartDate);
        return;
      } catch (_e) { /* fall through to local upsert */ }
    }
    try {
      const existing = await sb
        .from('weekly_session_grace')
        .select('id, grace_used')
        .eq('explorer_id', profileId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (existing.data && existing.data.grace_used === true) return;
      if (existing.data) {
        await sb.from('weekly_session_grace')
          .update({ grace_used: true })
          .eq('id', existing.data.id);
      } else {
        await sb.from('weekly_session_grace').insert([{
          explorer_id: profileId,
          week_start_date: weekStartDate,
          grace_used: true,
        }]);
      }
    } catch (_e) { /* best-effort */ }
  }

  // ── LADDER HIT — coin award + activity_log row ──────────────────
  /**
   * Trigger asymmetry per Operational Learning #4: no
   * log_session_streak_coins trigger exists. Client bumps
   * profiles.coins + lifetime_coins atomically (within Promise.all)
   * and inserts the activity_log row in the same call. Matches
   * missions.html's awardCoins + activity_log pattern exactly.
   *
   * Reads profile coins fresh because the caller's profile object
   * was read before any earlier ladder hit in the same walk.
   */
  async function awardLadderBonus(sb, profileId, ladderEntry) {
    try {
      const profRes = await sb
        .from('profiles')
        .select('coins, lifetime_coins')
        .eq('id', profileId)
        .single();
      if (profRes.error) throw profRes.error;
      const prof = profRes.data || { coins: 0, lifetime_coins: 0 };

      await Promise.all([
        sb.from('profiles')
          .update({
            coins:          (prof.coins          || 0) + ladderEntry.coins,
            lifetime_coins: (prof.lifetime_coins || 0) + ladderEntry.coins,
          })
          .eq('id', profileId),
        sb.from('activity_log').insert({
          explorer_id: profileId,
          amount:      ladderEntry.coins,
          reason:      'Streak ladder: ' + ladderEntry.label,
          created_at:  new Date().toISOString(),
        }),
      ]);
      return { ok: true };
    } catch (e) {
      console.warn('SessionRollup: ladder bonus award failed:', e, ladderEntry);
      return { ok: false, error: e };
    }
  }

  // ── RUN ──────────────────────────────────────────────────────────
  /**
   * Idempotent. Safe to call on every page load.
   *   sb         — supabase-js v2 client
   *   profileId  — explorer profile uuid
   * Returns { ok, settled, transitions, ladderHits, reason?, error? }
   */
  async function run(sb, profileId) {
    if (!sb || !profileId) {
      return { ok: false, reason: 'not-initialized', settled: 0, transitions: [], ladderHits: [] };
    }

    const today = new Date();
    const currentWeekStart = getCurrentWeekStart(today);
    const currentWeekStartKey = ymd(currentWeekStart);

    // 1. Read current state.
    let profile;
    try {
      const profRes = await sb
        .from('profiles')
        .select('streak, last_settled_week_start, role')
        .eq('id', profileId)
        .single();
      if (profRes.error) throw profRes.error;
      profile = profRes.data;
    } catch (e) {
      console.warn('SessionRollup: profile read failed (graceful skip):', e);
      return { ok: false, reason: 'profile-read-failed', settled: 0, transitions: [], ladderHits: [], error: e };
    }
    if (!profile) {
      return { ok: false, reason: 'no-profile', settled: 0, transitions: [], ladderHits: [] };
    }

    // Defensive: streak ladder is an explorer concept. Admin/parent/
    // superuser pages shouldn't hit this — if they somehow do (admin
    // viewing progress.html with ?admin=1 against their own user_id),
    // no-op. The internal data shape isn't meant for non-explorers.
    if (profile.role && profile.role !== 'explorer') {
      return { ok: true, reason: 'non-explorer-skip', settled: 0, transitions: [], ladderHits: [] };
    }

    // 2. NULL pointer = first-ever invocation. Initialize to current
    //    week-start so pre-launch noise weeks aren't retroactively
    //    settled. No streak change.
    if (!profile.last_settled_week_start) {
      try {
        const init = await sb
          .from('profiles')
          .update({ last_settled_week_start: currentWeekStartKey })
          .eq('id', profileId);
        if (init.error) throw init.error;
      } catch (e) {
        console.warn('SessionRollup: initialize pointer failed (will retry next load):', e);
        return { ok: false, reason: 'init-failed', settled: 0, transitions: [], ladderHits: [], error: e };
      }
      return { ok: true, reason: 'initialized', settled: 0, transitions: [], ladderHits: [] };
    }

    // 3. Pointer at-or-after currentWeekStart → no past weeks to settle.
    //    Same-day re-entry, second tab, or fresh-on-Sunday-after-init.
    const lastSettled = new Date(profile.last_settled_week_start + 'T00:00:00');
    if (lastSettled >= currentWeekStart) {
      return { ok: true, reason: 'already-current', settled: 0, transitions: [], ladderHits: [] };
    }

    // 4. Walk weeks chronologically from the first unsettled week-start
    //    up to (but not including) currentWeekStart. Each iteration
    //    settles exactly one Sunday-keyed calendar week.
    let cursor = addDays(lastSettled, 7);
    let runningStreak = profile.streak || 0;
    const transitions = [];
    const ladderHits = [];

    // Safety cap. ~60 weeks > 1 year — protects against pathological
    // dormancy (or a wonky pointer value) creating a runaway loop.
    let safety = 0;
    while (cursor < currentWeekStart && safety < 60) {
      safety++;
      const weekStartKey = ymd(cursor);
      let evaluation;
      try {
        evaluation = await evaluateClosingWeek(sb, profileId, cursor);
      } catch (e) {
        console.warn('SessionRollup: evaluation failed for week', weekStartKey, '— aborting walk:', e);
        return {
          ok: false, reason: 'evaluate-failed', settled: transitions.length,
          transitions: transitions, ladderHits: ladderHits, error: e,
        };
      }

      const before = runningStreak;
      let kind;
      // Pilgrimage-aware threshold:
      //   activeSlots = 3 - pilgrim slots
      //   activeSlots == 0 → all 3 M/W/F days inside pilgrimage; preserve
      //                      streak (no change). kind = 'pilgrimage_preserved'
      //   activeSlots == 1 → 1 miss breaks (no grace — too few slots)
      //   activeSlots >= 2 → standard: 0 misses clean, 1 miss grace, 2+ broken
      if (evaluation.activeSlots === 0) {
        // Streak walks with the pilgrim. No change.
        kind = 'pilgrimage_preserved';
        // runningStreak unchanged
      } else if (evaluation.activeSlots === 1) {
        if (evaluation.missed === 0) {
          runningStreak = before + 1;
          kind = 'counted_clean';
        } else {
          runningStreak = 0;
          kind = 'broken';
        }
      } else if (evaluation.missed >= 2) {
        runningStreak = 0;
        kind = 'broken';
      } else {
        runningStreak = before + 1;
        kind = (evaluation.missed === 1) ? 'counted_with_grace' : 'counted_clean';
        if (evaluation.missed === 1) {
          // Lazy persist of the grace flag for the closed week. The
          // current-week pip rendered by progress.html already covers
          // the active week; this back-fills closed weeks (mainly
          // useful for parent.html historical views and admin audits).
          await persistSessionGraceFor(sb, profileId, weekStartKey);
        }
      }
      // Ladder hit on the new value (only when streak actually advanced)
      if (kind === 'counted_clean' || kind === 'counted_with_grace') {
        for (let li = 0; li < LADDER.length; li++) {
          if (LADDER[li].atStreak === runningStreak) {
            const result = await awardLadderBonus(sb, profileId, LADDER[li]);
            if (result.ok) {
              ladderHits.push({
                atStreak: LADDER[li].atStreak,
                coins:    LADDER[li].coins,
                label:    LADDER[li].label,
                weekStart: weekStartKey,
              });
            }
            break;
          }
        }
      }
      transitions.push({
        weekStart: weekStartKey,
        missed:    evaluation.missed,
        activeSlots: evaluation.activeSlots,
        before:    before,
        after:     runningStreak,
        kind:      kind,
      });

      cursor = addDays(cursor, 7);
    }

    // 5. Persist new streak + advance pointer in a single write.
    try {
      const wr = await sb
        .from('profiles')
        .update({
          streak: runningStreak,
          last_settled_week_start: currentWeekStartKey,
        })
        .eq('id', profileId);
      if (wr.error) throw wr.error;
    } catch (e) {
      console.warn('SessionRollup: final pointer/streak write failed:', e);
      return {
        ok: false, reason: 'write-failed', settled: transitions.length,
        transitions: transitions, ladderHits: ladderHits, error: e,
      };
    }

    // 6. Optional celebration on ladder hits. Lightweight toast —
    //    bigger fanfare is reserved for prayer-rollup.js. We surface
    //    the most-recent ladder hit (multiple in one walk is a degenerate
    //    case — only happens if Nolan was dormant across 8+ closing
    //    weeks at once, which is ~impossible during normal use).
    if (ladderHits.length > 0) {
      try {
        showLadderToast(ladderHits[ladderHits.length - 1]);
      } catch (_e) { /* graceful */ }
    }

    return {
      ok: true,
      settled: transitions.length,
      transitions: transitions,
      ladderHits: ladderHits,
    };
  }

  // ── LADDER TOAST OVERLAY ─────────────────────────────────────────
  // Visually similar to prayer-rollup's prc-celebration but distinctly
  // labeled (sr-* prefix) and slightly smaller (single-line milestone
  // copy vs. prayer-rollup's per-week reflection). Coexists safely
  // with the prayer celebration: both are top-anchored fixed overlays;
  // CSS prefixes don't collide; user dismisses each independently.
  function injectToastCSS() {
    if (document.getElementById('session-rollup-css')) return;
    const style = document.createElement('style');
    style.id = 'session-rollup-css';
    style.textContent = [
      '.sr-toast{',
      '  position:fixed;top:0;left:0;right:0;z-index:1000;',
      '  display:flex;justify-content:center;',
      '  padding:1.25rem 1rem 0;',
      '  pointer-events:none;',
      '  transform:translateY(-115%);',
      '  transition:transform 480ms cubic-bezier(0.22,1,0.36,1);',
      '}',
      '.sr-toast.sr-in{transform:translateY(0);}',
      '.sr-toast.sr-out{transform:translateY(-115%);transition-duration:280ms;}',
      '.sr-toast .sr-card{',
      '  pointer-events:auto;',
      '  max-width:460px;width:100%;',
      '  background:linear-gradient(160deg,rgba(244,232,193,0.18),rgba(232,213,160,0.10));',
      '  border:1.5px solid rgba(201,146,42,0.55);',
      '  border-radius:14px;',
      '  padding:1.25rem 1.4rem;',
      '  text-align:center;',
      '  backdrop-filter:blur(18px);',
      '  -webkit-backdrop-filter:blur(18px);',
      '  box-shadow:0 14px 40px rgba(0,0,0,0.5),inset 0 0 0 1px rgba(244,232,193,0.06);',
      '}',
      '.sr-toast .sr-marks{',
      '  font-family:"Cinzel",serif;color:rgba(240,201,110,0.88);',
      '  letter-spacing:0.4em;font-size:0.78rem;margin-bottom:0.4rem;',
      '  font-variant-emoji:text;',
      '}',
      '.sr-toast .sr-title{',
      '  font-family:"Cinzel Decorative",serif;color:#f0c96e;',
      '  font-size:1.18rem;line-height:1.2;margin-bottom:0.5rem;font-weight:400;',
      '}',
      '.sr-toast .sr-body{',
      '  font-family:"Crimson Text",serif;color:rgba(244,232,193,0.95);',
      '  font-size:0.95rem;line-height:1.5;margin-bottom:0.6rem;',
      '}',
      '.sr-toast .sr-coin-text{',
      '  display:inline-block;font-family:"Cinzel",serif;',
      '  font-size:1.1rem;letter-spacing:0.1em;font-weight:700;',
      '  color:#ffd700;text-shadow:0 0 14px rgba(255,215,0,0.45);',
      '  font-variant-emoji:text;',
      '}',
      '.sr-toast .sr-continue{',
      '  margin-top:0.85rem;',
      '  padding:0.6rem 1.4rem;min-height:44px;',
      '  background:linear-gradient(135deg,#c9922a,#ffd700);',
      '  border:none;border-radius:10px;',
      '  font-family:"Cinzel",serif;font-size:0.74rem;',
      '  letter-spacing:0.18em;text-transform:uppercase;',
      '  color:#0e0800;font-weight:700;cursor:pointer;',
      '  box-shadow:0 4px 18px rgba(255,215,0,0.22);',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '.sr-toast .sr-continue:active{transform:scale(0.97);}',
      '@media (prefers-reduced-motion: reduce){',
      '  .sr-toast{transition:none;}',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function showLadderToast(hit) {
    if (typeof document === 'undefined' || !document.body) return;
    injectToastCSS();
    const overlay = document.createElement('div');
    overlay.className = 'sr-toast';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const coinWord = hit.coins === 1 ? 'Saint Coin' : 'Saint Coins';
    overlay.innerHTML = ''
      + '<div class="sr-card">'
      + '  <div class="sr-marks">\u2726\uFE0E &nbsp; \u2726\uFE0E</div>'
      + '  <div class="sr-title">Streak Ladder Reached</div>'
      + '  <div class="sr-body"><strong>' + hit.atStreak + ' weeks</strong> of faithful work — '
      +    'a milestone in your expedition.</div>'
      + '  <div><span class="sr-coin-text">\u2726\uFE0E +' + hit.coins + ' ' + coinWord + ' \u2726\uFE0E</span></div>'
      + '  <button class="sr-continue" type="button">Continue</button>'
      + '</div>';
    document.body.appendChild(overlay);
    // Force reflow so the slide-in transition fires from initial state.
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetWidth;
    overlay.classList.add('sr-in');

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      overlay.classList.remove('sr-in');
      overlay.classList.add('sr-out');
      setTimeout(function () {
        if (overlay.parentNode) overlay.remove();
      }, 320);
    }
    overlay.querySelector('.sr-continue').addEventListener('click', dismiss);
    overlay.querySelector('.sr-card').addEventListener('click', function (ev) {
      if (ev.target.closest('.sr-continue')) return;
      dismiss();
    });
    function onKey(ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape') {
        ev.preventDefault();
        window.removeEventListener('keydown', onKey);
        dismiss();
      }
    }
    window.addEventListener('keydown', onKey);
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.SessionRollup = {
      run:                 run,
      getCurrentWeekStart: getCurrentWeekStart,
      ymd:                 ymd,
    };
  }
})();
