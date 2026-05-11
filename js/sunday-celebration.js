/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 5
   js/sunday-celebration.js — Sunday Celebration Overlay
   May 11, 2026

   PURPOSE
   The canonical weekly reverent moment. When Nolan opens the app on
   Sunday (or any later day before he's dismissed this week's
   celebration), a calm full-viewport overlay acknowledges what God
   gave him to celebrate from the last closed week: streak ticks
   that held, lanes that hit their intactness threshold, and the
   week's feast remembered.

   Felt like Sunday in church: gentle, reverent, not gamified. A
   moment to pause and notice before the new week begins.

   ONE-PER-WEEK SEMANTICS
   Once dismissed, the overlay marks celebration_shown_at on
   whichever streak rows applied to last closed week. shouldShow
   returns false until a new closed week appears.

   DATA SHAPE DIVERGENCE (Op Learning #16)
   The three lanes have structurally different settlement tables:

     prayer_streak_weekly    — rich: morning_count + evening_count
                               inline on the streak row itself.
     weekly_reading_streak   — thin: grace_used flag only. Per-day
                               completions live on
                               reading_completions.calendar_date.
     weekly_memorization_streak — thin: grace_used flag only. Per-day
                               completions live on
                               verse_practice_completions.calendar_date.

   This is by design (memorization is the structural mirror of
   reading, not prayer — Op Learning #16, Dispatch 3c). loadData()
   fans out per-lane queries to honor each lane's data shape.

   PRAYER "DAYS" FRAMING
   Prayer is stored as AM/PM event counts, not distinct days. The
   celebration is honest to the data: "Prayed X mornings and Y
   evenings" (matches existing prayer-rollup wording verbatim).
   Reading + memorization use "X of 7 days" framing because their
   tables are per-day boolean events.

   COIN TOTALS
   Omitted. Settlement still bumps coins silently (via
   prayer-rollup.js's preserved settlement logic). The streak number
   is the recognition; coins appear in the lifetime total naturally.

   RELATIONSHIP TO prayer-rollup.js
   Dispatch 5 replaces prayer-rollup's standalone "+N Saint Coins"
   slide-down overlay (now disabled) with this unified reverent
   moment. PrayerRollup.run() still fires silently to settle
   past-week rows + bump coins; only the showCelebration call is
   short-circuited.

   PUBLIC API (browser): window.SundayCelebration = { … }

     shouldShow(sb, explorerId)            — Promise<boolean>
     loadData(sb, explorerId, familyId)    — Promise<{prayer,reading,memorization,feast}>
     show(options)                         — Promise<void>  (mounts overlay,
                                              resolves on dismiss)
     dismiss(sb, explorerId)               — Promise<void>  (writes celebration_shown_at)

   Op Learnings honored:
     #1   Surgical scope — no edits to lane modules, walkers, or
          Missions/Topics IA.
     #4   Schema-first — migration applied + verified before this
          file was written.
     #7   ET timezone via WeekUtils throughout.
     #13  Staged delivery via present_files.
     #15  CSS class names beat UA [hidden]; injectCSS authors rules.
     #16  Data shape match (per-lane query strategy) determined in
          discovery; reading/memo mirror weekly_session_grace pattern.
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ═════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═════════════════════════════════════════════════════════════════

  function _W() {
    return (typeof window !== 'undefined' && window.WeekUtils) || null;
  }

  function _esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Returns {lastClosedStart, lastClosedEnd} as ymd strings (ET).
  // lastClosed = (currentWeekStart - 7) → that week's Saturday.
  function _lastClosedWeekKeys(today) {
    const W = _W();
    if (!W) return null;
    const currentWeekStart    = W.getWeekStart(today || new Date());
    const lastClosedWeekStart = W.addDays(currentWeekStart, -7);
    const lastClosedWeekEnd   = W.addDays(lastClosedWeekStart, 6);
    return {
      start: W.ymd(lastClosedWeekStart),
      end:   W.ymd(lastClosedWeekEnd),
    };
  }

  // Big calendar date label for the overlay header — "Sunday, May 24".
  function _formatBigDate(today) {
    try {
      const W = _W();
      const todayKey = W && typeof W.todayKey === 'function'
        ? W.todayKey()
        : (function () {
            const d = today || new Date();
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          })();
      const [y, m, d] = todayKey.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long', month: 'long', day: 'numeric',
      });
      return fmt.format(dt);
    } catch (_e) {
      return '';
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // shouldShow — decide whether the overlay should mount this load
  // ═════════════════════════════════════════════════════════════════

  /**
   * Returns true iff there is at least one streak row for last closed
   * week that has non-zero activity and has not yet been dismissed.
   *
   * Logic:
   *   • If we're STILL in the in-progress current week and no prior
   *     week has settled, returns false (nothing to celebrate).
   *   • If at least one lane has a row for last closed week with
   *     celebration_shown_at IS NULL AND has non-zero days/counts,
   *     returns true.
   *   • If all eligible last-week rows have been dismissed
   *     (celebration_shown_at IS NOT NULL) → false.
   *   • Mid-week before any Sunday has occurred (no settled rows
   *     yet) → false naturally.
   */
  async function shouldShow(sb, explorerId) {
    if (!sb || !explorerId) return false;
    const W = _W();
    if (!W) return false;

    const keys = _lastClosedWeekKeys(new Date());
    if (!keys) return false;

    // ── Prayer: read prayer_streak_weekly directly for last closed
    //    week. Treat the row as "celebration-worthy" if it has any
    //    completions and has not been dismissed yet.
    let prayerCandidate = false;
    try {
      const res = await sb
        .from('prayer_streak_weekly')
        .select('morning_count, evening_count, celebration_shown_at')
        .eq('explorer_id', explorerId)
        .eq('week_start_date', keys.start)
        .maybeSingle();
      if (!res.error && res.data) {
        const m = res.data.morning_count || 0;
        const e = res.data.evening_count || 0;
        if ((m + e) > 0 && !res.data.celebration_shown_at) {
          prayerCandidate = true;
        }
      }
    } catch (_e) { /* graceful: missing row is fine */ }

    // ── Reading: thin streak row + per-day completions count.
    //    Treat as celebration-worthy if any reading_completions exist
    //    last week and the streak row's celebration_shown_at is null
    //    (or no streak row exists — falls through to "no celebration"
    //    in that case because there's no row to mark dismissed; we
    //    avoid false-positives that can't be cleared).
    let readingCandidate = false;
    try {
      const sr = await sb
        .from('weekly_reading_streak')
        .select('celebration_shown_at')
        .eq('explorer_id', explorerId)
        .eq('week_start_date', keys.start)
        .maybeSingle();
      if (!sr.error && sr.data && !sr.data.celebration_shown_at) {
        // Streak row exists + not yet dismissed. Check for actual reading
        // days last week.
        const cr = await sb
          .from('reading_completions')
          .select('calendar_date')
          .eq('explorer_id', explorerId)
          .gte('calendar_date', keys.start)
          .lte('calendar_date', keys.end);
        if (!cr.error && (cr.data || []).length > 0) {
          readingCandidate = true;
        }
      }
    } catch (_e) { /* graceful */ }

    // ── Memorization: same shape as reading.
    let memCandidate = false;
    try {
      const sr = await sb
        .from('weekly_memorization_streak')
        .select('celebration_shown_at')
        .eq('explorer_id', explorerId)
        .eq('week_start_date', keys.start)
        .maybeSingle();
      if (!sr.error && sr.data && !sr.data.celebration_shown_at) {
        const cr = await sb
          .from('verse_practice_completions')
          .select('calendar_date')
          .eq('explorer_id', explorerId)
          .gte('calendar_date', keys.start)
          .lte('calendar_date', keys.end);
        if (!cr.error && (cr.data || []).length > 0) {
          memCandidate = true;
        }
      }
    } catch (_e) { /* graceful */ }

    return prayerCandidate || readingCandidate || memCandidate;
  }

  // ═════════════════════════════════════════════════════════════════
  // loadData — gather last-week summary across lanes + feast
  // ═════════════════════════════════════════════════════════════════

  /**
   * Returns:
   *   {
   *     dateLabel:     'Sunday, May 24',
   *     weekStartKey:  'YYYY-MM-DD',
   *     prayer:        { morning_count, evening_count, streak } | null,
   *     reading:       { daysCompleted, streak }                | null,
   *     memorization:  { daysCompleted, streak }                | null,
   *     feast:         { feast_name, sunday_name, feast_rank,
   *                      day_name, calendar_date }              | null,
   *   }
   *
   * Lane keys are null when that lane has no non-zero data for last
   * closed week (the renderer will skip those rows).
   */
  async function loadData(sb, explorerId, familyId) {
    if (!sb || !explorerId) return null;
    const W = _W();
    if (!W) return null;

    const today = new Date();
    const keys  = _lastClosedWeekKeys(today);
    if (!keys) return null;

    // ── Parallel: 5 reads + 3 streak walkers ────────────────────────
    const [
      prayerRow,
      readingDays,
      memDays,
      feast,
      prayerStreak,
      readingStreak,
      memStreak,
    ] = await Promise.all([
      // 1. Prayer last-week row (counts come from here).
      sb.from('prayer_streak_weekly')
        .select('morning_count, evening_count')
        .eq('explorer_id', explorerId)
        .eq('week_start_date', keys.start)
        .maybeSingle()
        .then(r => (r.error ? null : r.data))
        .catch(() => null),

      // 2. Reading distinct days last week.
      sb.from('reading_completions')
        .select('calendar_date')
        .eq('explorer_id', explorerId)
        .gte('calendar_date', keys.start)
        .lte('calendar_date', keys.end)
        .then(r => {
          if (r.error || !r.data) return 0;
          const seen = Object.create(null);
          r.data.forEach(row => { if (row.calendar_date) seen[row.calendar_date] = true; });
          return Object.keys(seen).length;
        })
        .catch(() => 0),

      // 3. Memorization distinct days last week.
      sb.from('verse_practice_completions')
        .select('calendar_date')
        .eq('explorer_id', explorerId)
        .gte('calendar_date', keys.start)
        .lte('calendar_date', keys.end)
        .then(r => {
          if (r.error || !r.data) return 0;
          const seen = Object.create(null);
          r.data.forEach(row => { if (row.calendar_date) seen[row.calendar_date] = true; });
          return Object.keys(seen).length;
        })
        .catch(() => 0),

      // 4. This week's feast (FeastOfWeek queries the current ET week).
      (window.FeastOfWeek && typeof window.FeastOfWeek.getCurrentFeast === 'function')
        ? window.FeastOfWeek.getCurrentFeast(sb).catch(() => null)
        : Promise.resolve(null),

      // 5. Prayer streak (walks through last closed week — excludes
      //    in-progress current week, so the count IS last-closed-week's
      //    streak).
      (window.Prayers && typeof window.Prayers.getStreak === 'function')
        ? window.Prayers.getStreak().catch(() => 0)
        : Promise.resolve(0),

      // 6. Reading streak.
      (window.Reading && typeof window.Reading.getStreak === 'function')
        ? window.Reading.getStreak({ noGracePersist: true }).catch(() => 0)
        : Promise.resolve(0),

      // 7. Memorization streak.
      (window.Memorization && typeof window.Memorization.getStreak === 'function')
        ? window.Memorization.getStreak(sb, explorerId, { familyId, noGracePersist: true }).catch(() => 0)
        : Promise.resolve(0),
    ]);

    // Compose lane summaries — null out lanes with zero data so the
    // renderer can skip them cleanly.
    const m = (prayerRow && prayerRow.morning_count) || 0;
    const e = (prayerRow && prayerRow.evening_count) || 0;
    const prayer = ((m + e) > 0)
      ? { morning_count: m, evening_count: e, streak: Number(prayerStreak) || 0 }
      : null;

    const reading = (readingDays > 0)
      ? { daysCompleted: readingDays, streak: Number(readingStreak) || 0 }
      : null;

    const memorization = (memDays > 0)
      ? { daysCompleted: memDays, streak: Number(memStreak) || 0 }
      : null;

    return {
      dateLabel:    _formatBigDate(today),
      weekStartKey: keys.start,
      prayer:       prayer,
      reading:      reading,
      memorization: memorization,
      feast:        feast || null,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // CSS — author rules in-module, Byzantine palette
  // ═════════════════════════════════════════════════════════════════

  function _injectCSS() {
    if (document.getElementById('sunday-celebration-css')) return;
    const style = document.createElement('style');
    style.id = 'sunday-celebration-css';
    style.textContent = [
      // Full-viewport overlay — z-index 9999 matches welcome-flow.
      '.sc-overlay{',
      '  position:fixed;inset:0;z-index:9999;',
      '  background:rgba(11,14,22,0.965);',
      '  backdrop-filter:blur(2px);',
      '  -webkit-backdrop-filter:blur(2px);',
      '  display:flex;align-items:center;justify-content:center;',
      '  padding:env(safe-area-inset-top,0) env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0);',
      '  opacity:0;',
      '  transition:opacity 600ms ease-out;',
      '  -webkit-tap-highlight-color:transparent;',
      '  font-family:"Crimson Text","Times New Roman",serif;',
      '  color:#F5ECD7;',
      '  -webkit-font-smoothing:antialiased;',
      '  -moz-osx-font-smoothing:grayscale;',
      '}',
      '.sc-overlay.sc-in{opacity:1;}',
      '.sc-overlay.sc-out{opacity:0;transition-duration:280ms;}',

      // Scroll wrapper — handles tall content on small screens.
      '.sc-scroll{',
      '  width:100%;height:100%;',
      '  overflow-y:auto;',
      '  -webkit-overflow-scrolling:touch;',
      '  display:flex;align-items:flex-start;justify-content:center;',
      '  padding:2rem 1rem;box-sizing:border-box;',
      '}',
      '@media (min-height:700px){',
      '  .sc-scroll{align-items:center;}',
      '}',

      // Parchment scroll card.
      '.sc-card{',
      '  max-width:480px;width:100%;',
      '  background:',
      '    linear-gradient(160deg,rgba(244,232,193,0.16),rgba(232,213,160,0.08)),',
      '    radial-gradient(ellipse at top,rgba(201,168,76,0.10),transparent 60%);',
      '  border:1.5px solid rgba(201,146,42,0.55);',
      '  border-radius:14px;',
      '  padding:1.75rem 1.5rem 1.5rem;',
      '  text-align:center;',
      '  backdrop-filter:blur(18px);',
      '  -webkit-backdrop-filter:blur(18px);',
      '  box-shadow:',
      '    0 14px 40px rgba(0,0,0,0.5),',
      '    inset 0 0 0 1px rgba(244,232,193,0.06),',
      '    inset 0 0 60px rgba(201,168,76,0.04);',
      '  transform:scale(0.96);',
      '  transition:transform 600ms cubic-bezier(0.22,1,0.36,1);',
      '}',
      '.sc-overlay.sc-in .sc-card{transform:scale(1);}',

      // Eyebrow — gold marks.
      '.sc-eyebrow{',
      '  font-family:"Cinzel",serif;',
      '  color:rgba(240,201,110,0.88);',
      '  letter-spacing:0.4em;font-size:0.78rem;',
      '  margin-bottom:0.6rem;',
      '  font-variant-emoji:text;',
      '  text-transform:uppercase;',
      '}',

      // Big date.
      '.sc-date{',
      '  font-family:"Cinzel Decorative","Cinzel",serif;',
      '  color:#f0c96e;',
      '  font-size:1.45rem;line-height:1.2;',
      '  margin-bottom:1.4rem;',
      '  font-weight:400;',
      '}',

      // "Last week, Nolan:" framing.
      '.sc-framing{',
      '  font-family:"Crimson Text",serif;',
      '  font-style:italic;',
      '  color:rgba(244,232,193,0.85);',
      '  font-size:1rem;line-height:1.5;',
      '  margin-bottom:1rem;',
      '}',

      // Lane rows.
      '.sc-lanes{',
      '  text-align:left;',
      '  margin:0 auto 1.25rem;',
      '  max-width:340px;',
      '  display:flex;flex-direction:column;gap:0.85rem;',
      '}',
      '.sc-lane{',
      '  display:flex;align-items:flex-start;gap:0.75rem;',
      '}',
      '.sc-lane-icon{',
      '  flex:0 0 auto;',
      '  font-size:1.5rem;line-height:1.2;',
      '  font-variant-emoji:text;',
      '  width:1.8rem;text-align:center;',
      '  color:rgba(240,201,110,0.95);',
      '}',
      '.sc-lane-body{flex:1 1 auto;min-width:0;}',
      '.sc-lane-line{',
      '  font-family:"Crimson Text",serif;',
      '  color:rgba(244,232,193,0.95);',
      '  font-size:1rem;line-height:1.4;',
      '}',
      '.sc-lane-line strong{',
      '  color:#f0c96e;',
      '  font-weight:600;',
      '}',
      '.sc-lane-streak{',
      '  font-family:"Cinzel",serif;',
      '  color:rgba(240,201,110,0.78);',
      '  font-size:0.78rem;letter-spacing:0.08em;',
      '  margin-top:0.1rem;',
      '  font-variant-emoji:text;',
      '}',

      // Section divider — gold hairline.
      '.sc-divider{',
      '  border:none;border-top:1px solid rgba(201,146,42,0.32);',
      '  margin:1.25rem auto;',
      '  max-width:240px;',
      '}',

      // Feast block.
      '.sc-feast-label{',
      '  font-family:"Cinzel",serif;',
      '  color:rgba(240,201,110,0.78);',
      '  letter-spacing:0.18em;font-size:0.72rem;',
      '  text-transform:uppercase;',
      '  margin-bottom:0.35rem;',
      '}',
      '.sc-feast-name{',
      '  font-family:"Cinzel Decorative","Cinzel",serif;',
      '  color:#f0c96e;',
      '  font-size:1.05rem;line-height:1.35;',
      '  font-weight:400;',
      '  font-variant-emoji:text;',
      '}',
      '.sc-feast-day{',
      '  font-family:"Crimson Text",serif;',
      '  color:rgba(244,232,193,0.75);',
      '  font-size:0.85rem;font-style:italic;',
      '  margin-top:0.2rem;',
      '}',

      // Closing reverence.
      '.sc-glory{',
      '  font-family:"Crimson Text",serif;',
      '  font-style:italic;',
      '  color:rgba(244,232,193,0.92);',
      '  font-size:1rem;line-height:1.5;',
      '  margin-bottom:0.35rem;',
      '}',
      '.sc-glory-attr{',
      '  font-family:"Crimson Text",serif;',
      '  color:rgba(244,232,193,0.65);',
      '  font-size:0.85rem;',
      '  margin-bottom:1.5rem;',
      '}',

      // Continue button.
      '.sc-continue{',
      '  display:block;width:100%;',
      '  padding:0.85rem 1.6rem;',
      '  min-height:48px;',
      '  background:linear-gradient(135deg,#c9922a,#ffd700);',
      '  border:none;border-radius:10px;',
      '  font-family:"Cinzel",serif;',
      '  font-size:0.82rem;',
      '  letter-spacing:0.2em;',
      '  text-transform:uppercase;',
      '  color:#0e0800;font-weight:700;',
      '  cursor:pointer;',
      '  box-shadow:0 4px 18px rgba(255,215,0,0.22);',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '.sc-continue:active{transform:scale(0.97);}',

      // Reduced-motion: no transforms, no opacity transition.
      '@media (prefers-reduced-motion: reduce){',
      '  .sc-overlay{transition:none;}',
      '  .sc-overlay .sc-card{transition:none;transform:none;}',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ═════════════════════════════════════════════════════════════════
  // show — build DOM, animate in, return Promise that resolves on dismiss
  // ═════════════════════════════════════════════════════════════════

  /**
   * options = { sb, explorerId, familyId, data?: pre-loaded data }
   * Returns Promise<void> resolved after the user dismisses + DB
   * writes complete.
   */
  async function show(options) {
    options = options || {};
    const { sb, explorerId, familyId } = options;
    if (!sb || !explorerId) return;

    const data = options.data || await loadData(sb, explorerId, familyId);
    if (!data) return;

    // Defensive: if every lane is null AND there's no feast, there's
    // nothing meaningful to show. Bail without marking anything shown.
    if (!data.prayer && !data.reading && !data.memorization && !data.feast) {
      return;
    }

    _injectCSS();

    return new Promise(function (resolve) {
      // Build overlay DOM.
      const overlay = document.createElement('div');
      overlay.className = 'sc-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'sc-date');

      const laneRowsHtml = _renderLaneRows(data);
      const feastHtml    = _renderFeast(data.feast);
      const showDivider1 = (data.prayer || data.reading || data.memorization);
      const showDivider2 = !!data.feast;

      overlay.innerHTML = ''
        + '<div class="sc-scroll">'
        + '  <div class="sc-card">'
        + '    <div class="sc-eyebrow">\u2726\uFE0E &nbsp; A New Week &nbsp; \u2726\uFE0E</div>'
        + '    <div class="sc-date" id="sc-date">' + _esc(data.dateLabel) + '</div>'
        + '    <div class="sc-framing">Last week, Nolan:</div>'
        + '    <div class="sc-lanes">' + laneRowsHtml + '</div>'
        + (showDivider1 && (showDivider2 || true) ? '<hr class="sc-divider" />' : '')
        + feastHtml
        + (feastHtml ? '<hr class="sc-divider" />' : '')
        + '    <div class="sc-glory">"Glory to God for all things."</div>'
        + '    <div class="sc-glory-attr">— St. John Chrysostom</div>'
        + '    <button class="sc-continue" type="button" id="sc-continue">Continue \u2192</button>'
        + '  </div>'
        + '</div>';

      document.body.appendChild(overlay);

      // Lock body scroll while overlay is open.
      const priorOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Force reflow so the .sc-in opacity transition fires.
      // eslint-disable-next-line no-unused-expressions
      overlay.offsetWidth;
      overlay.classList.add('sc-in');

      let dismissed = false;
      async function _doDismiss() {
        if (dismissed) return;
        dismissed = true;
        window.removeEventListener('keydown', onKey);
        overlay.classList.remove('sc-in');
        overlay.classList.add('sc-out');

        // Animate out, then remove. Restore scroll immediately so the
        // dashboard underneath is interactive during the fade.
        document.body.style.overflow = priorOverflow || '';
        setTimeout(function () {
          if (overlay.parentNode) overlay.remove();
        }, 320);

        // DB writes — fire-and-forget for the resolve, but await for
        // best-effort completion so the next page load sees the
        // dismissal.
        try {
          await dismiss(sb, explorerId, data.weekStartKey);
        } catch (err) {
          console.warn('SundayCelebration: dismiss DB write failed:', err);
        }
        resolve();
      }

      function onKey(ev) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape') {
          ev.preventDefault();
          _doDismiss();
        }
      }
      window.addEventListener('keydown', onKey);

      const btn = overlay.querySelector('#sc-continue');
      if (btn) btn.addEventListener('click', _doDismiss);
    });
  }

  function _renderLaneRows(data) {
    const rows = [];

    if (data.prayer) {
      const m = data.prayer.morning_count || 0;
      const e = data.prayer.evening_count || 0;
      const mWord = (m === 1) ? 'morning' : 'mornings';
      const eWord = (e === 1) ? 'evening' : 'evenings';
      const streakWord = (data.prayer.streak === 1) ? 'week' : 'weeks';
      rows.push(''
        + '<div class="sc-lane">'
        + '  <div class="sc-lane-icon">\uD83D\uDD4A\uFE0E</div>' // 🕊
        + '  <div class="sc-lane-body">'
        + '    <div class="sc-lane-line">Prayed <strong>' + m + '</strong> ' + mWord
        +        ' and <strong>' + e + '</strong> ' + eWord + '</div>'
        + (data.prayer.streak > 0
            ? '    <div class="sc-lane-streak">\u2713 Prayer streak: ' + data.prayer.streak + ' ' + streakWord + '</div>'
            : '')
        + '  </div>'
        + '</div>'
      );
    }

    if (data.reading) {
      const dc = data.reading.daysCompleted || 0;
      const streakWord = (data.reading.streak === 1) ? 'week' : 'weeks';
      rows.push(''
        + '<div class="sc-lane">'
        + '  <div class="sc-lane-icon">\uD83D\uDCD6</div>' // 📖
        + '  <div class="sc-lane-body">'
        + '    <div class="sc-lane-line">Read God\u2019s Word <strong>' + dc + '</strong> of <strong>7</strong> days</div>'
        + (data.reading.streak > 0
            ? '    <div class="sc-lane-streak">\u2713 Reading streak: ' + data.reading.streak + ' ' + streakWord + '</div>'
            : '')
        + '  </div>'
        + '</div>'
      );
    }

    if (data.memorization) {
      const dc = data.memorization.daysCompleted || 0;
      const streakWord = (data.memorization.streak === 1) ? 'week' : 'weeks';
      rows.push(''
        + '<div class="sc-lane">'
        + '  <div class="sc-lane-icon">\uD83D\uDCDC</div>' // 📜
        + '  <div class="sc-lane-body">'
        + '    <div class="sc-lane-line">Practiced the verse <strong>' + dc + '</strong> of <strong>7</strong> days</div>'
        + (data.memorization.streak > 0
            ? '    <div class="sc-lane-streak">\u2713 Memorization streak: ' + data.memorization.streak + ' ' + streakWord + '</div>'
            : '')
        + '  </div>'
        + '</div>'
      );
    }

    return rows.join('');
  }

  function _renderFeast(feast) {
    if (!feast) return '';
    const headline = feast.feast_name || feast.sunday_name || '';
    if (!headline) return '';
    const dayLine = feast.day_name ? '<div class="sc-feast-day">' + _esc(feast.day_name) + '</div>' : '';
    return ''
      + '<div class="sc-feast">'
      + '  <div class="sc-feast-label">This Week\u2019s Feast</div>'
      + '  <div class="sc-feast-name">\u2726\uFE0E ' + _esc(headline) + '</div>'
      +    dayLine
      + '</div>';
  }

  // ═════════════════════════════════════════════════════════════════
  // dismiss — write celebration_shown_at across applicable lanes
  // ═════════════════════════════════════════════════════════════════

  /**
   * Marks last-closed-week's streak rows as celebrated AND piggybacks
   * a silent UPDATE for ANY older un-celebrated rows (multi-week
   * catch-up: dispatch §D.7 — show most recent, silently mark older
   * shown).
   */
  async function dismiss(sb, explorerId, lastClosedWeekStartKey) {
    if (!sb || !explorerId) return;
    const W = _W();
    if (!W) return;
    const nowIso = new Date().toISOString();

    const targetKey = lastClosedWeekStartKey
      || (function () {
          const k = _lastClosedWeekKeys(new Date());
          return k ? k.start : null;
        })();
    if (!targetKey) return;

    // Three lanes × two writes each (last-week + older-silent).
    // Run in parallel; any individual failure is non-fatal (logged).
    const writes = [];

    // PRAYER ─────────────────────────────────────────────────────────
    writes.push(
      sb.from('prayer_streak_weekly')
        .update({ celebration_shown_at: nowIso })
        .eq('explorer_id', explorerId)
        .eq('week_start_date', targetKey)
        .is('celebration_shown_at', null)
        .then(r => { if (r.error) throw r.error; })
        .catch(err => console.warn('SundayCelebration: prayer dismiss failed:', err))
    );
    writes.push(
      sb.from('prayer_streak_weekly')
        .update({ celebration_shown_at: nowIso })
        .eq('explorer_id', explorerId)
        .lt('week_start_date', targetKey)
        .is('celebration_shown_at', null)
        .then(r => { if (r.error) throw r.error; })
        .catch(err => console.warn('SundayCelebration: prayer silent-catchup failed:', err))
    );

    // READING ────────────────────────────────────────────────────────
    writes.push(
      sb.from('weekly_reading_streak')
        .update({ celebration_shown_at: nowIso })
        .eq('explorer_id', explorerId)
        .eq('week_start_date', targetKey)
        .is('celebration_shown_at', null)
        .then(r => { if (r.error) throw r.error; })
        .catch(err => console.warn('SundayCelebration: reading dismiss failed:', err))
    );
    writes.push(
      sb.from('weekly_reading_streak')
        .update({ celebration_shown_at: nowIso })
        .eq('explorer_id', explorerId)
        .lt('week_start_date', targetKey)
        .is('celebration_shown_at', null)
        .then(r => { if (r.error) throw r.error; })
        .catch(err => console.warn('SundayCelebration: reading silent-catchup failed:', err))
    );

    // MEMORIZATION ───────────────────────────────────────────────────
    writes.push(
      sb.from('weekly_memorization_streak')
        .update({ celebration_shown_at: nowIso })
        .eq('explorer_id', explorerId)
        .eq('week_start_date', targetKey)
        .is('celebration_shown_at', null)
        .then(r => { if (r.error) throw r.error; })
        .catch(err => console.warn('SundayCelebration: memorization dismiss failed:', err))
    );
    writes.push(
      sb.from('weekly_memorization_streak')
        .update({ celebration_shown_at: nowIso })
        .eq('explorer_id', explorerId)
        .lt('week_start_date', targetKey)
        .is('celebration_shown_at', null)
        .then(r => { if (r.error) throw r.error; })
        .catch(err => console.warn('SundayCelebration: memorization silent-catchup failed:', err))
    );

    await Promise.all(writes);
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  const SundayCelebration = {
    shouldShow: shouldShow,
    loadData:   loadData,
    show:       show,
    dismiss:    dismiss,
    _internals: {
      lastClosedWeekKeys: _lastClosedWeekKeys,
      formatBigDate:      _formatBigDate,
    },
  };

  if (typeof window !== 'undefined') window.SundayCelebration = SundayCelebration;
  if (typeof module !== 'undefined' && module.exports) module.exports = SundayCelebration;
})();
