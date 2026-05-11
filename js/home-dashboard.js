/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 4b
   js/home-dashboard.js — Home status dashboard
   May 11, 2026

   PURPOSE
   The new home page is a calm status dashboard, not an action hub.
   This module renders three small surfaces:

     (1) Today's Progress Card     — big "X of Y today" + bar
     (2) Primary CTA Button        — state-aware copy ("→ Today's
                                     Missions" / "→ See today's
                                     missions" / "✦ On Pilgrimage —
                                     Streaks Walk With You")
     (3) Compact Streak Row        — small inline strip showing
                                     Prayer/Reading/Verse streaks

   IA POSITION (Dispatch 4b)
   • HOME (this module) → status & welcome dashboard
   • Missions           → daily action hub
   • Topics             → study material + Feast of the Week

   Data is the SAME as Missions.loadTodaysState — we delegate to
   that function for "X of Y" and pilgrimage state, so the home
   and missions views can never drift.

   PUBLIC API (browser): window.HomeDashboard = { … }

     mount(container, options)
       options = { sb, explorerId, familyId, profile }
       Renders dashboard into `container`. Idempotent.

   Op Learnings honored:
     #4  Schema-first — relies on Missions.loadTodaysState which
         was schema-verified before being written
     #7  ET timezone via WeekUtils (transitively, through Missions)
     #15 CSS rules over UA [hidden]: visible state via classes;
         inline display:none only where needed
     #16 Structural reuse — Missions is the single source of truth
         for daily state; this module RENDERS that state in a
         home-appropriate way
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ═════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═════════════════════════════════════════════════════════════════

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _W() {
    return (typeof window !== 'undefined' && window.WeekUtils) || null;
  }

  function _todayKey() {
    const W = _W();
    if (W && typeof W.todayKey === 'function') return W.todayKey();
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Day name + month/day in ET.
  function _formatDayLabel(today /* YYYY-MM-DD */) {
    try {
      const [y, m, d] = today.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long', month: 'long', day: 'numeric',
      });
      return fmt.format(dt);
    } catch (_e) {
      return today;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER — sub-components
  // ═════════════════════════════════════════════════════════════════

  // (1) Today's Progress Card — the big animated count.
  function _renderProgressCard(completedCount, totalCount, todayLabel) {
    const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    return `
      <div class="hd-progress-card fade-up" id="hd-progress-card">
        <div class="hd-pc-eyebrow">✦ Today's Progress</div>
        <div class="hd-pc-count">
          <span class="hd-pc-num" id="hd-pc-num">${completedCount}</span>
          <span class="hd-pc-sep">of</span>
          <span class="hd-pc-total">${totalCount}</span>
          <span class="hd-pc-today">today</span>
          ${completedCount >= totalCount && totalCount > 0 ? '<span class="hd-pc-check">✓</span>' : ''}
        </div>
        <div class="hd-pc-bar"><div class="hd-pc-fill" style="width:${pct}%"></div></div>
        <div class="hd-pc-day">${esc(todayLabel)}</div>
      </div>
    `;
  }

  // (2) Primary CTA — state-aware (one of three copy variants).
  // Per the 10/10 polish #4:
  //   • Pending:    "→ Today's Missions"        (gold, prominent)
  //   • All done:   "→ See today's missions"    (subtler gold)
  //   • Pilgrimage: "✦ On Pilgrimage — Streaks Walk With You"
  //                 (parchment treatment)
  function _renderCTA(completedCount, totalCount, isPilgrimage) {
    if (isPilgrimage) {
      return `
        <a class="hd-cta hd-cta-pilgrimage fade-up" href="missions.html" id="hd-cta">
          <span class="hd-cta-mark">✦</span>
          <span class="hd-cta-label">On Pilgrimage — Streaks Walk With You</span>
        </a>
      `;
    }
    const allDone = totalCount > 0 && completedCount >= totalCount;
    if (allDone) {
      return `
        <a class="hd-cta hd-cta-done fade-up" href="missions.html" id="hd-cta">
          <span class="hd-cta-arrow">→</span>
          <span class="hd-cta-label">See today's missions</span>
        </a>
      `;
    }
    return `
      <a class="hd-cta hd-cta-pending fade-up" href="missions.html" id="hd-cta">
        <span class="hd-cta-arrow">→</span>
        <span class="hd-cta-label">Today's Missions</span>
      </a>
    `;
  }

  // (3) Compact Streak Row — three small inline streak counters.
  // Pulls streak values from the canonical lane modules.
  async function _loadStreaks(sb, explorerId, familyId) {
    const noopP = (v) => Promise.resolve(v);
    const [prayerStreak, readingStreak, memStreak] = await Promise.all([
      (window.Prayers && typeof window.Prayers.getStreak === 'function')
        ? window.Prayers.getStreak().catch(() => 0) : noopP(0),
      (window.Reading && typeof window.Reading.getStreak === 'function')
        ? window.Reading.getStreak().catch(() => 0) : noopP(0),
      (window.Memorization && typeof window.Memorization.getStreak === 'function')
        ? window.Memorization.getStreak(sb, explorerId, { familyId }).catch(() => 0) : noopP(0),
    ]);
    return {
      prayer:       Number(prayerStreak)  || 0,
      reading:      Number(readingStreak) || 0,
      memorization: Number(memStreak)     || 0,
    };
  }

  function _renderStreakRow(streaks) {
    function tile(icon, label, val) {
      return `
        <div class="hd-streak-tile">
          <div class="hd-st-icon">${icon}</div>
          <div class="hd-st-meta">
            <div class="hd-st-label">${esc(label)}</div>
            <div class="hd-st-val">${val} wk</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="hd-streak-row fade-up" id="hd-streak-row">
        ${tile('🕊️', 'Prayer',  streaks.prayer)}
        ${tile('📖', 'Reading', streaks.reading)}
        ${tile('📜', 'Verse',   streaks.memorization)}
      </div>
    `;
  }

  // ═════════════════════════════════════════════════════════════════
  // 10/10 POLISH — count-up animation
  // ═════════════════════════════════════════════════════════════════

  function _animateCountUp(el, from, to) {
    if (!el) return;
    if (from === to) { el.textContent = String(to); return; }
    const start = performance.now();
    const dur = 600;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = String(v);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = String(to);
    }
    requestAnimationFrame(step);
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN MOUNT
  // ═════════════════════════════════════════════════════════════════

  // Track prior completedCount so we can animate up across re-mounts
  // (e.g. when Nolan returns from a lane page and missions count went
  // up while he was away).
  let _priorCompletedCount = null;

  async function mount(container, options) {
    if (!container) return;
    const opts = options || {};
    const { sb, explorerId, familyId } = opts;
    if (!sb || !explorerId || !familyId) {
      container.innerHTML = '';
      return;
    }
    if (!window.Missions || typeof window.Missions.loadTodaysState !== 'function') {
      // Defensive: missions.js must be loaded for this module to
      // work. Render nothing rather than half-state.
      container.innerHTML = '';
      console.warn('HomeDashboard.mount: Missions module not loaded; skipping');
      return;
    }

    const today = _todayKey();
    const dayLabel = _formatDayLabel(today);

    // Parallel: today's mission state + streaks
    const [state, streaks] = await Promise.all([
      window.Missions.loadTodaysState(sb, explorerId, familyId, today),
      _loadStreaks(sb, explorerId, familyId),
    ]);

    const isPilgrimage = !!state.pilgrimage;

    container.innerHTML = [
      _renderProgressCard(state.completedCount, state.totalCount, dayLabel),
      _renderCTA(state.completedCount, state.totalCount, isPilgrimage),
      _renderStreakRow(streaks),
    ].join('');

    // Animate the count up if we re-mounted with a higher number
    // than last time (e.g. Nolan completed a lane and came back).
    if (_priorCompletedCount !== null && state.completedCount > _priorCompletedCount) {
      const numEl = container.querySelector('#hd-pc-num');
      _animateCountUp(numEl, _priorCompletedCount, state.completedCount);
    }
    _priorCompletedCount = state.completedCount;
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  const HomeDashboard = {
    mount,
    _internals: {
      esc, _todayKey, _formatDayLabel,
      _renderProgressCard, _renderCTA, _renderStreakRow,
      _loadStreaks, _animateCountUp,
    },
  };

  if (typeof window !== 'undefined') window.HomeDashboard = HomeDashboard;
  if (typeof module !== 'undefined' && module.exports) module.exports = HomeDashboard;
})();
