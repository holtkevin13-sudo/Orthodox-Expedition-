/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Prayer System Lane 3
   js/prayer-rollup.js — Sunday-night weekly rollup
   May 8, 2026

   PURPOSE
   The per-routine reward is 0 coins (Lane 2 zeroed daily prayer
   mission coins; routine completion auto-marks them with no coin
   drop). The Sunday-night rollup IS the reward: each completed
   week awards 5 × morning_count + 5 × evening_count, capped at
   70 coins/week (5×7 + 5×7).

   When Nolan opens the app on a new Monday-or-later, any
   prayer_streak_weekly row whose week_start_date < this week's
   Monday and whose settled_at IS NULL is settled in-place:
     - profiles.coins + lifetime_coins bumped by coins_awarded
     - row.settled_at + coins_awarded set
   Then a quiet parchment celebration appears on screen for the
   most-recent settled non-zero week (one celebration max per open).

   IDEMPOTENCY
   The settle UPDATE is gated on `settled_at IS NULL`, so two tabs
   firing simultaneously produce exactly one effective settle
   (last-writer's RETURNING is empty). Zero-completion weeks still
   settle (set settled_at + coins_awarded=0) but never trigger a
   celebration — "you prayed 0 times last week, glory to God" would
   be tone-deaf per orchestrator guidance.

   Public API: window.PrayerRollup.run(supabaseClient, profileId).
   Helpers: getCurrentMonday(date), ymd(date) — also useful for the
   prayers.html state machine when it UPSERTs the current week's row.
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── DATE HELPERS ─────────────────────────────────────────────────

  /**
   * Returns the Date of the Monday at-or-before `d`, normalized to
   * local-midnight. Sunday is treated as the END of the week (so
   * Sun → previous Mon), matching the Mon-fresh / Sun-end model.
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

  // ── RUN ──────────────────────────────────────────────────────────

  /**
   * Idempotent. Safe to call on every page load.
   *   sb         — supabase-js v2 client
   *   profileId  — explorer profile uuid
   * Returns { ok: bool, settled: int, reason?, error? }
   */
  async function run(sb, profileId) {
    if (!sb || !profileId) return { ok: false, reason: 'not-initialized', settled: 0 };

    const today = new Date();
    const currentMondayKey = ymd(getCurrentMonday(today));

    // 1. Find unsettled past-week rows for this explorer.
    let rows;
    try {
      const res = await sb
        .from('prayer_streak_weekly')
        .select('*')
        .eq('explorer_id', profileId)
        .is('settled_at', null)
        .lt('week_start_date', currentMondayKey)
        .order('week_start_date', { ascending: true });
      if (res.error) throw res.error;
      rows = res.data || [];
    } catch (e) {
      console.warn('PrayerRollup: query failed (graceful skip):', e);
      return { ok: false, reason: 'query-failed', settled: 0, error: e };
    }

    if (rows.length === 0) {
      return { ok: true, settled: 0 };
    }

    // 2. Settle each in chronological order.
    const settled = [];
    for (const row of rows) {
      const coins = 5 * (row.morning_count || 0) + 5 * (row.evening_count || 0);
      const nowIso = new Date().toISOString();

      let updatedRow = null;
      try {
        // Race-safe: only one concurrent caller wins the update.
        const upd = await sb
          .from('prayer_streak_weekly')
          .update({ settled_at: nowIso, coins_awarded: coins })
          .eq('id', row.id)
          .is('settled_at', null)
          .select()
          .maybeSingle();
        if (upd.error) throw upd.error;
        updatedRow = upd.data;
      } catch (e) {
        console.warn('PrayerRollup: settle update failed (skip row):', e, row);
        continue;
      }

      if (!updatedRow) {
        // Another tab won the race — fine.
        continue;
      }

      // 3. Bump profile coins iff there is anything to award.
      if (coins > 0) {
        try {
          // Read-then-write. Trigger asymmetry per Lane 2/3 / Operational
          // Learning #4: profiles.coins must be bumped from client; no
          // log_prayer_streak_coins trigger exists.
          const profRes = await sb
            .from('profiles')
            .select('coins, lifetime_coins')
            .eq('id', profileId)
            .single();
          if (profRes.error) throw profRes.error;
          const prof = profRes.data || { coins: 0, lifetime_coins: 0 };
          const bumpRes = await sb
            .from('profiles')
            .update({
              coins:          (prof.coins          || 0) + coins,
              lifetime_coins: (prof.lifetime_coins || 0) + coins,
            })
            .eq('id', profileId);
          if (bumpRes.error) throw bumpRes.error;
        } catch (e) {
          console.warn('PrayerRollup: profile coin bump failed (continuing):', e);
          // Don't roll back the settle — better to over-show than double-count.
          // Re-running rollup will not re-settle this row (settled_at now set).
        }
      }

      settled.push(Object.assign({}, row, {
        settled_at:    updatedRow.settled_at,
        coins_awarded: coins,
      }));
    }

    // 4. Show celebration for the most-recent NON-ZERO settled row that
    //    has not yet been celebrated. Per dispatch: "show only the most
    //    recent — don't queue multiple celebrations" + "zero weeks never
    //    celebrate — tone-deaf." Both rules respected.
    const candidates = settled.filter(r =>
      (r.coins_awarded || 0) > 0 && !r.celebration_shown_at
    );
    if (candidates.length > 0) {
      const target = candidates[candidates.length - 1];
      try {
        await showCelebration(sb, target);
      } catch (e) {
        console.warn('PrayerRollup: celebration display failed:', e);
      }
    }

    return { ok: true, settled: settled.length };
  }

  // ── CELEBRATION OVERLAY ──────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById('prayer-rollup-css')) return;
    const style = document.createElement('style');
    style.id = 'prayer-rollup-css';
    style.textContent = [
      '.pr-celebration{',
      '  position:fixed;top:0;left:0;right:0;z-index:1000;',
      '  display:flex;justify-content:center;',
      '  padding:1.25rem 1rem 0;',
      '  pointer-events:none;',
      '  transform:translateY(-115%);',
      '  transition:transform 480ms cubic-bezier(0.22,1,0.36,1);',
      '}',
      '.pr-celebration.prc-in{transform:translateY(0);}',
      '.pr-celebration.prc-out{transform:translateY(-115%);transition-duration:280ms;}',
      '.pr-celebration .prc-card{',
      '  pointer-events:auto;',
      '  max-width:460px;width:100%;',
      '  background:linear-gradient(160deg,rgba(244,232,193,0.18),rgba(232,213,160,0.10));',
      '  border:1.5px solid rgba(201,146,42,0.55);',
      '  border-radius:14px;',
      '  padding:1.4rem 1.4rem 1.2rem;',
      '  text-align:center;',
      '  backdrop-filter:blur(18px);',
      '  -webkit-backdrop-filter:blur(18px);',
      '  box-shadow:0 14px 40px rgba(0,0,0,0.5),inset 0 0 0 1px rgba(244,232,193,0.06);',
      '}',
      '.pr-celebration .prc-marks{',
      '  font-family:"Cinzel",serif;',
      '  color:rgba(240,201,110,0.88);',
      '  letter-spacing:0.4em;font-size:0.78rem;',
      '  margin-bottom:0.45rem;',
      '  font-variant-emoji:text;',
      '}',
      '.pr-celebration .prc-title{',
      '  font-family:"Cinzel Decorative",serif;',
      '  color:#f0c96e;',
      '  font-size:1.25rem;line-height:1.2;',
      '  margin-bottom:0.85rem;',
      '  font-weight:400;',
      '}',
      '.pr-celebration .prc-body{',
      '  font-family:"Crimson Text",serif;',
      '  color:rgba(244,232,193,0.95);',
      '  font-size:1rem;line-height:1.55;',
      '  margin-bottom:0.65rem;',
      '}',
      '.pr-celebration .prc-coin-line{',
      '  margin:0.85rem 0 0.6rem;',
      '}',
      '.pr-celebration .prc-coin-text{',
      '  display:inline-block;',
      '  font-family:"Cinzel",serif;',
      '  font-size:1.15rem;letter-spacing:0.1em;',
      '  font-weight:700;',
      '  color:#ffd700;',
      '  text-shadow:0 0 14px rgba(255,215,0,0.45);',
      '  animation:prc-shimmer 2.4s ease-out 0.4s 1;',
      '  font-variant-emoji:text;',
      '}',
      '@keyframes prc-shimmer{',
      '  0%  {opacity:0.55;text-shadow:0 0 0 rgba(255,215,0,0);}',
      '  45% {opacity:1;text-shadow:0 0 22px rgba(255,215,0,0.85);}',
      '  100%{opacity:1;text-shadow:0 0 14px rgba(255,215,0,0.45);}',
      '}',
      '.pr-celebration .prc-glory{',
      '  font-family:"Crimson Text",serif;',
      '  font-style:italic;',
      '  color:rgba(244,232,193,0.85);',
      '  font-size:0.95rem;line-height:1.5;',
      '  margin-bottom:1.1rem;',
      '}',
      '.pr-celebration .prc-continue{',
      '  padding:0.7rem 1.6rem;',
      '  min-height:48px;',
      '  background:linear-gradient(135deg,#c9922a,#ffd700);',
      '  border:none;border-radius:10px;',
      '  font-family:"Cinzel",serif;',
      '  font-size:0.78rem;',
      '  letter-spacing:0.18em;',
      '  text-transform:uppercase;',
      '  color:#0e0800;font-weight:700;',
      '  cursor:pointer;',
      '  box-shadow:0 4px 18px rgba(255,215,0,0.22);',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '.pr-celebration .prc-continue:active{transform:scale(0.97);}',
      '@media (prefers-reduced-motion: reduce){',
      '  .pr-celebration{transition:none;}',
      '  .pr-celebration .prc-coin-text{animation:none;}',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function showCelebration(sb, row) {
    return new Promise(function (resolve) {
      injectCSS();
      const overlay = document.createElement('div');
      overlay.className = 'pr-celebration';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'prc-title');

      const m = row.morning_count || 0;
      const e = row.evening_count || 0;
      const total = row.coins_awarded || 0;
      const morningWord = m === 1 ? 'morning' : 'mornings';
      const eveningWord = e === 1 ? 'evening' : 'evenings';
      const coinWord    = total === 1 ? 'Saint Coin' : 'Saint Coins';

      // Build content (text injection — controlled fields, not user-supplied)
      overlay.innerHTML = ''
        + '<div class="prc-card">'
        + '  <div class="prc-marks">\u2726\uFE0E &nbsp; \u2726\uFE0E</div>'
        + '  <div class="prc-title" id="prc-title">Last Week in Prayer</div>'
        + '  <div class="prc-body">Last week you prayed '
        +      '<strong>' + m + '</strong> ' + morningWord
        +      ' and <strong>' + e + '</strong> ' + eveningWord + '.</div>'
        + '  <div class="prc-coin-line"><span class="prc-coin-text">'
        +      '\u2726\uFE0E +' + total + ' ' + coinWord + ' \u2726\uFE0E'
        +    '</span></div>'
        + '  <div class="prc-glory">Glory to God for your faithfulness.</div>'
        + '  <button class="prc-continue" type="button">Continue</button>'
        + '</div>';

      document.body.appendChild(overlay);
      // Force a reflow before adding the .prc-in class so the transform
      // transition actually fires (instead of starting in its end state).
      // eslint-disable-next-line no-unused-expressions
      overlay.offsetWidth;
      overlay.classList.add('prc-in');

      let dismissed = false;
      async function dismiss() {
        if (dismissed) return;
        dismissed = true;
        overlay.classList.remove('prc-in');
        overlay.classList.add('prc-out');
        setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 320);
        try {
          await sb
            .from('prayer_streak_weekly')
            .update({ celebration_shown_at: new Date().toISOString() })
            .eq('id', row.id);
        } catch (err) {
          console.warn('PrayerRollup: celebration_shown_at update failed:', err);
        }
        resolve();
      }

      overlay.querySelector('.prc-continue').addEventListener('click', dismiss);
      overlay.querySelector('.prc-card').addEventListener('click', function (ev) {
        // Tap anywhere on the card dismisses; specific button handler above
        // covers the explicit Continue tap.
        if (ev.target.closest('.prc-continue')) return;
        dismiss();
      });
      // Keyboard: Enter / Space / Escape all dismiss.
      function onKey(ev) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape') {
          ev.preventDefault();
          window.removeEventListener('keydown', onKey);
          dismiss();
        }
      }
      window.addEventListener('keydown', onKey);
    });
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  window.PrayerRollup = {
    run: run,
    getCurrentMonday: getCurrentMonday,
    ymd: ymd,
  };
})();
