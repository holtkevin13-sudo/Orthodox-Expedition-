/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Repair Chat G
   js/session-rollup.js — Sunday-night weekly session-streak rollup
   May 8, 2026

   PURPOSE
   profiles.streak (the weekly session ladder counter) had no
   auto-increment path — only admin.html's manual write touched it,
   plus a vestigial missions.html "attend an expedition" mission
   flow that hasn't been part of the post-Repair-B1 model. The
   grace pip on progress.html was decoratively functional, but the
   streak NUMBER never moved on its own when a week settled. This
   file fixes that.

   When Nolan opens the app on a new Monday-or-later, every calendar
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
   INITIALIZES the pointer to today's Monday and returns — no
   retroactive settlement of pre-launch noise weeks. On any
   subsequent call, weeks strictly between the pointer and the
   current calendar Monday are settled in order; running twice on
   the same Monday is a no-op (the pointer is already at
   currentMonday).

   RACE-SAFETY
   Two tabs racing on the same Monday will both compute the same
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
   first invocation sets last_settled_week_start = currentMonday
   and returns without touching streak. Going forward the rollup
   walks one week at a time as Mondays pass.

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
  // Inlined for self-containment (matched character-for-character
  // against prayer-rollup.js / streak-grace.js helpers); intentionally
  // not require()'d so a load-order glitch on streak-grace.js doesn't
  // break this file.

  /**
   * Returns the Date of the Monday at-or-before `d`, normalized to
   * local-midnight. Sunday is treated as the END of the week
   * (Sun → previous Mon), matching the Mon-fresh / Sun-end model
   * used everywhere else in the codebase.
   */
  function getCurrentMonday(d) {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    const dow = out.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = (dow === 0) ? -6 : 1 - dow;
    out.setDate(out.getDate() + diff);
    return out;
  }

  /** YYYY-MM-DD in local time (date-only ISO suffix-safe). */
  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /** Add N days; returns a fresh Date at local-midnight. */
  function addDays(d, n) {
    const out = new Date(d);
    out.setDate(out.getDate() + n);
    out.setHours(0, 0, 0, 0);
    return out;
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
    const filled = (mFilled ? 1 : 0) + (wFilled ? 1 : 0) + (fFilled ? 1 : 0);
    return {
      mFilled: mFilled, wFilled: wFilled, fFilled: fFilled,
      filled: filled,
      missed: 3 - filled,
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
    const currentMonday = getCurrentMonday(today);
    const currentMondayKey = ymd(currentMonday);

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
    //    Monday so pre-launch noise weeks aren't retroactively
    //    settled. No streak change.
    if (!profile.last_settled_week_start) {
      try {
        const init = await sb
          .from('profiles')
          .update({ last_settled_week_start: currentMondayKey })
          .eq('id', profileId);
        if (init.error) throw init.error;
      } catch (e) {
        console.warn('SessionRollup: initialize pointer failed (will retry next load):', e);
        return { ok: false, reason: 'init-failed', settled: 0, transitions: [], ladderHits: [], error: e };
      }
      return { ok: true, reason: 'initialized', settled: 0, transitions: [], ladderHits: [] };
    }

    // 3. Pointer at-or-after currentMonday → no past weeks to settle.
    //    Same-day re-entry, second tab, or fresh-on-Monday-after-init.
    const lastSettled = new Date(profile.last_settled_week_start + 'T00:00:00');
    if (lastSettled >= currentMonday) {
      return { ok: true, reason: 'already-current', settled: 0, transitions: [], ladderHits: [] };
    }

    // 4. Walk weeks chronologically from the first unsettled Monday up
    //    to (but not including) currentMonday. Each iteration settles
    //    exactly one Monday-keyed calendar week.
    let cursor = addDays(lastSettled, 7);
    let runningStreak = profile.streak || 0;
    const transitions = [];
    const ladderHits = [];

    // Safety cap. ~60 weeks > 1 year — protects against pathological
    // dormancy (or a wonky pointer value) creating a runaway loop.
    let safety = 0;
    while (cursor < currentMonday && safety < 60) {
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
      if (evaluation.missed >= 2) {
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
        // Ladder hit on the new value?
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
          last_settled_week_start: currentMondayKey,
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
      run:              run,
      getCurrentMonday: getCurrentMonday,
      ymd:              ymd,
    };
  }
})();
