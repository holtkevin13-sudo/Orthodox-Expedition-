/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Chat 19
   js/streak-heatmap.js — GitHub-style contribution heatmap on home
   May 13, 2026

   PURPOSE
   Renders a Sunday-anchored week × day-of-week grid on the home
   dashboard showing Nolan's daily engagement across the Topic 00
   run. Each cell colored by the ratio of TASK lanes completed that
   day (trophy lane shown as a separate gold-ring overlay). A
   streak counter alongside the grid reads the longest active run
   of fully-completed days ending today or yesterday. Pilgrimage
   days render with a ✦ glyph and extend the streak.

   PUBLIC API (browser): window.StreakHeatmap = { mount }
     mount(slot, ctx) async
       ctx = { sb, explorerId, familyId, today?, mode? }
       Renders into `slot`. Idempotent. Safe under repeated calls
       (visibility-change refresh path mirrors HomeDashboard).

   LANE PREDICATES (mirrored from missions.js — Op Learning #4)
     reading       row in reading_completions (explorer, date)
     prayer        ANY mission_completions row where (explorer,
                   day_key) AND mission is daily_morning_prayer
                   OR daily_evening_prayer
     memo          row in verse_practice_completions (explorer,
                   date) — applicable only when a weekly_verses
                   row exists for that week's Sunday-anchored start
     session       M/W/F only: session_progress.day_N_completed_at
                   IS NOT NULL where N maps from dow (1→1, 3→2, 5→3)
                   AND its ET-date matches the cell date
     session_jrnl  T/Th only: field_journal row with
                   category='session_reflection' whose created_at
                   ET-date matches the cell date
     trophy        row in day_complete_bonus (explorer, date) —
                   rendered as a 1.5px inset gold ring, NOT part of
                   the intensity ramp
     pilgrimage    pilgrimages row covers the cell date inclusive
                   AND status<>'cancelled' (NOT pilgrimage_
                   completions; that's a one-row-per-event table —
                   per OQ-10)

   STREAK DEFINITION (per OQ-2, OQ-3)
     Engaged-day = tasksDone === tasksRequired (full task completion)
     Pilgrimage  = counts as engaged (extends streak, OQ-2)
     Partial day = breaks streak (OQ-3), cell still renders at
                   partial intensity
     Anchor       = today if today is engaged, else yesterday (today
                   in-flight should not break a yesterday-anchored
                   streak)
     Walk back day-by-day from anchor; first non-engaged non-
     pilgrimage day terminates the count.

   MODES (per OQ-1, OQ-8)
     'compact' (default) — last 6 weeks rolling, but no further
                           back than launch week (avoids pre-launch
                           noise in the first weeks of Topic 00).
     'full'              — launch week through Topic 00 end's
                           Saturday (≤15 weeks).
     Toggle re-renders without re-fetching (data set is small;
     a full Topic 00 fetch covers both modes).

   OPERATIONAL LEARNINGS HONORED
     #1  Surgical str_replace
     #4  Schema-first — lane predicates verified in Phase 1
     #7  Date math via WeekUtils America/New_York todayKey/addDays
     #10 Query-first ground truth
     #15 CSS classes over UA [hidden]
     #18 wc -l delta declared at deploy
     #20 Worker authoritative on project state (OQ-9, OQ-10 caught)
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── CONSTANTS ────────────────────────────────────────────────────
  const LAUNCH_DATE        = '2026-05-18';   // Topic 00 launch (Mon)
  const TOPIC_00_END_DATE  = '2026-08-31';   // Topic 00 final week ends
  const COMPACT_WEEKS      = 6;              // last-6-weeks default view
  const SESSION_JOURNAL_COINS = 5;           // Wave 2 lead per-entry

  // Mode persists across re-mounts in the same session. The mode
  // toggle stays sticky as Nolan navigates away and back.
  let _currentMode = 'compact';

  // ── HELPERS ──────────────────────────────────────────────────────

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
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  // Parse 'YYYY-MM-DD' into a Date object anchored at UTC-noon so
  // ymd() round-trips reliably under any host tz (mirrors WeekUtils).
  function _parseYmd(s) {
    const parts = s.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
  }

  // Add n days to a 'YYYY-MM-DD' string in ET, returning a new string.
  function _addDaysToYmd(s, n) {
    const W = _W();
    if (!W) return s;
    return W.ymd(W.addDays(_parseYmd(s), n));
  }

  // dow 0..6 (Sun..Sat) from a YYYY-MM-DD string.
  function _dowFromYmd(s) {
    const W = _W();
    if (!W) {
      const d = _parseYmd(s);
      return d.getUTCDay();
    }
    return W.dayOfWeekET(_parseYmd(s));
  }

  // Sunday-of-week 'YYYY-MM-DD' from a date string.
  function _weekStartYmd(s) {
    const W = _W();
    if (!W) return s;
    return W.ymd(W.getWeekStart(_parseYmd(s)));
  }

  // Format a tooltip date label. First-of-month gets the year for
  // orientation (per OQ-5).
  function _formatTooltipDate(ymdStr) {
    const parts = ymdStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayNum = d.getUTCDate();
    const monthName = monthNames[d.getUTCMonth()];
    if (dayNum === 1) return monthName + ' 1, ' + d.getUTCFullYear();
    return monthName + ' ' + dayNum;
  }

  // Required task-lane count for a given ET dow (mirrors missions.js
  // getMissionsForDay minus the trophy slot).
  function _tasksRequiredForDow(dow) {
    // M/W/F (1,3,5): reading, prayer, memo, session  → 4
    // T/Th  (2,4)  : reading, prayer, memo, session_journal → 4
    // Sat/Sun (0,6): reading, prayer, memo → 3
    if (dow === 0 || dow === 6) return 3;
    return 4;
  }

  // Map dow → session_progress day_N column. Returns null on non-
  // M/W/F.
  function _sessionDayColFromDow(dow) {
    if (dow === 1) return 'day_1_completed_at';
    if (dow === 3) return 'day_2_completed_at';
    if (dow === 5) return 'day_3_completed_at';
    return null;
  }

  // ═════════════════════════════════════════════════════════════════
  // DATA FETCH
  // ═════════════════════════════════════════════════════════════════

  async function _fetchData(sb, explorerId, familyId, fetchStartKey, fetchEndKey) {
    // Returns null when the requested window is fully in the future
    // (e.g., pre-launch with today < LAUNCH_DATE).
    if (!sb || !explorerId || fetchStartKey > fetchEndKey) {
      return {
        readingRows: [], prayerRows: [], verseRows: [],
        sessionRows: [], journalRows: [], trophyRows: [],
        pilgRows: [], weeklyVerseRows: [],
      };
    }

    // Step 1: resolve the two prayer mission IDs. Keys are stable
    // (verified Phase 1).
    let prayerMissionIds = [];
    try {
      const mres = await sb.from('missions')
        .select('id, key')
        .in('key', ['daily_morning_prayer', 'daily_evening_prayer']);
      prayerMissionIds = (mres.data || []).map(m => m.id);
    } catch (e) {
      console.warn('StreakHeatmap: prayer mission ID lookup failed (graceful):', e);
    }

    // Loose UTC bound for tstz columns. Buffer ±1 day to absorb
    // any ET-vs-UTC drift; client-side ET-day buckets in _buildDayMap.
    const lowerTs = _addDaysToYmd(fetchStartKey, -1) + 'T00:00:00Z';
    const upperTs = _addDaysToYmd(fetchEndKey,    1) + 'T23:59:59Z';

    // 8 parallel selects. Each table is tiny over a 105-day window.
    const [readingRes, prayerRes, verseRes, sessionRes, journalRes,
           trophyRes, pilgRes, weeklyVerseRes] = await Promise.all([
      sb.from('reading_completions')
        .select('calendar_date, coins_earned')
        .eq('explorer_id', explorerId)
        .gte('calendar_date', fetchStartKey)
        .lte('calendar_date', fetchEndKey),

      prayerMissionIds.length
        ? sb.from('mission_completions')
            .select('day_key, coins_awarded, mission_id')
            .eq('explorer_id', explorerId)
            .in('mission_id', prayerMissionIds)
            .gte('day_key', fetchStartKey)
            .lte('day_key', fetchEndKey)
        : Promise.resolve({ data: [], error: null }),

      sb.from('verse_practice_completions')
        .select('calendar_date, coins_earned')
        .eq('explorer_id', explorerId)
        .gte('calendar_date', fetchStartKey)
        .lte('calendar_date', fetchEndKey),

      sb.from('session_progress')
        .select('session_id, coins_awarded, day_1_completed_at, day_2_completed_at, day_3_completed_at')
        .eq('explorer_id', explorerId),
      // Note: session rows are small (≤15 for Topic 00); fetch all
      // and bucket client-side by ET-date.

      sb.from('field_journal')
        .select('created_at')
        .eq('explorer_id', explorerId)
        .eq('category', 'session_reflection')
        .gte('created_at', lowerTs)
        .lte('created_at', upperTs),

      sb.from('day_complete_bonus')
        .select('calendar_date, coins_earned')
        .eq('explorer_id', explorerId)
        .gte('calendar_date', fetchStartKey)
        .lte('calendar_date', fetchEndKey),

      sb.from('pilgrimages')
        .select('id, status, start_date, end_date')
        .neq('status', 'cancelled'),
      // OQ-10: pilgrimages, not pilgrimage_completions.

      familyId
        ? sb.from('weekly_verses')
            .select('week_start_date')
            .eq('family_id', familyId)
            .gte('week_start_date', fetchStartKey)
            .lte('week_start_date', fetchEndKey)
        : Promise.resolve({ data: [], error: null }),
    ]);

    function _ok(res, label) {
      if (res && res.error) {
        console.warn('StreakHeatmap: ' + label + ' query error (graceful):', res.error);
        return [];
      }
      return (res && res.data) || [];
    }

    return {
      readingRows:      _ok(readingRes,      'reading_completions'),
      prayerRows:       _ok(prayerRes,       'mission_completions(prayer)'),
      verseRows:        _ok(verseRes,        'verse_practice_completions'),
      sessionRows:      _ok(sessionRes,      'session_progress'),
      journalRows:      _ok(journalRes,      'field_journal'),
      trophyRows:       _ok(trophyRes,       'day_complete_bonus'),
      pilgRows:         _ok(pilgRes,         'pilgrimages'),
      weeklyVerseRows:  _ok(weeklyVerseRes,  'weekly_verses'),
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // PER-DAY AGGREGATION
  // ═════════════════════════════════════════════════════════════════

  function _buildDayMap(data, gridStartKey, gridEndKey, todayKey) {
    const W = _W();
    if (!W) return new Map();

    // Index per-date lookups for O(1) cell-build.
    const readingByDate  = new Set();
    const readingCoins   = new Map();
    for (const r of data.readingRows) {
      if (!r.calendar_date) continue;
      readingByDate.add(r.calendar_date);
      readingCoins.set(r.calendar_date,
        (readingCoins.get(r.calendar_date) || 0) + (r.coins_earned || 0));
    }

    const prayerByDate = new Set();
    const prayerCoins  = new Map();
    for (const r of data.prayerRows) {
      if (!r.day_key) continue;
      prayerByDate.add(r.day_key);
      prayerCoins.set(r.day_key,
        (prayerCoins.get(r.day_key) || 0) + (r.coins_awarded || 0));
    }

    const verseByDate = new Set();
    const verseCoins  = new Map();
    for (const r of data.verseRows) {
      if (!r.calendar_date) continue;
      verseByDate.add(r.calendar_date);
      verseCoins.set(r.calendar_date,
        (verseCoins.get(r.calendar_date) || 0) + (r.coins_earned || 0));
    }

    // Session completions: bucket each populated day_N_completed_at
    // by its ET calendar date. Heuristic coin attribution: divide
    // session.coins_awarded evenly across the completed day_N stamps
    // (best-effort tooltip signal; total sums correctly across the
    // week even if the per-day split is approximate).
    const sessionByDate = new Set();
    const sessionCoins  = new Map();
    for (const sr of data.sessionRows) {
      const completedTimestamps = [];
      if (sr.day_1_completed_at) completedTimestamps.push(sr.day_1_completed_at);
      if (sr.day_2_completed_at) completedTimestamps.push(sr.day_2_completed_at);
      if (sr.day_3_completed_at) completedTimestamps.push(sr.day_3_completed_at);
      if (completedTimestamps.length === 0) continue;
      const totalCoins = sr.coins_awarded || 0;
      const perDayShare = Math.floor(totalCoins / completedTimestamps.length);
      for (const ts of completedTimestamps) {
        const dt = new Date(ts);
        if (isNaN(dt.getTime())) continue;
        const etDate = W.ymd(dt);
        if (etDate >= gridStartKey && etDate <= gridEndKey) {
          sessionByDate.add(etDate);
          sessionCoins.set(etDate,
            (sessionCoins.get(etDate) || 0) + perDayShare);
        }
      }
    }

    // Session journal entries: ET-date bucket from created_at.
    const journalByDate = new Set();
    for (const r of data.journalRows) {
      if (!r.created_at) continue;
      const dt = new Date(r.created_at);
      if (isNaN(dt.getTime())) continue;
      const etDate = W.ymd(dt);
      if (etDate >= gridStartKey && etDate <= gridEndKey) {
        journalByDate.add(etDate);
      }
    }

    // Trophy.
    const trophyByDate = new Set();
    const trophyCoins  = new Map();
    for (const r of data.trophyRows) {
      if (!r.calendar_date) continue;
      trophyByDate.add(r.calendar_date);
      trophyCoins.set(r.calendar_date,
        (trophyCoins.get(r.calendar_date) || 0) + (r.coins_earned || 0));
    }

    // Weekly verses: weeks that have a verse seeded → memo applicable.
    const weekHasVerse = new Set();
    for (const r of data.weeklyVerseRows) {
      if (r.week_start_date) weekHasVerse.add(r.week_start_date);
    }

    // Pilgrimage predicate (mirrors Pilgrimages._rowActiveOn — OQ-10).
    function _isPilgrimage(dateStr) {
      for (const p of data.pilgRows) {
        if (!p.start_date || !p.end_date) continue;
        if (p.status === 'cancelled') continue;
        if (p.start_date <= dateStr && dateStr <= p.end_date) return true;
      }
      return false;
    }

    // Walk each day in [gridStartKey, gridEndKey].
    const map = new Map();
    let cursor = gridStartKey;
    let guard = 0;
    while (cursor <= gridEndKey && guard < 400) {
      guard++;
      const dow         = _dowFromYmd(cursor);
      const isToday     = cursor === todayKey;
      const isFuture    = cursor > todayKey;
      const isPreLaunch = cursor < LAUNCH_DATE;
      const pilgrimage  = _isPilgrimage(cursor);

      const reading       = readingByDate.has(cursor);
      const prayer        = prayerByDate.has(cursor);
      const memo          = verseByDate.has(cursor);
      const memoApplicable = weekHasVerse.has(_weekStartYmd(cursor));
      const trophy        = trophyByDate.has(cursor);

      const sessionCol = _sessionDayColFromDow(dow);
      let session        = null;
      let sessionJournal = null;
      if (sessionCol !== null) {
        // M/W/F
        session = sessionByDate.has(cursor);
      } else if (dow === 2 || dow === 4) {
        // T/Th
        sessionJournal = journalByDate.has(cursor);
      }

      // Tally task lanes required + done. Pilgrimage day satisfies
      // every task lane it touches (per OQ-2 — pilgrimage is rest,
      // counts as engaged).
      let required = 0;
      let done     = 0;
      // Reading
      required++;
      if (reading || pilgrimage) done++;
      // Prayer
      required++;
      if (prayer || pilgrimage) done++;
      // Memo (drop entirely from required when not applicable —
      // mirrors missions.js 'not_applicable' lane for past-day
      // settled state; no auto-credit fan-in needed for historical
      // days)
      if (memoApplicable) {
        required++;
        if (memo || pilgrimage) done++;
      }
      // Session (M/W/F)
      if (session !== null) {
        required++;
        if (session || pilgrimage) done++;
      }
      // Session journal (T/Th)
      if (sessionJournal !== null) {
        required++;
        if (sessionJournal || pilgrimage) done++;
      }

      // Coins total (rough — see _fetchData comment).
      let coinsTotal = 0;
      coinsTotal += readingCoins.get(cursor) || 0;
      coinsTotal += prayerCoins.get(cursor)  || 0;
      coinsTotal += verseCoins.get(cursor)   || 0;
      coinsTotal += sessionCoins.get(cursor) || 0;
      coinsTotal += trophyCoins.get(cursor)  || 0;
      if (sessionJournal === true) coinsTotal += SESSION_JOURNAL_COINS;

      map.set(cursor, {
        date: cursor,
        dow, isToday, isFuture, isPreLaunch,
        reading, prayer, memo, memoApplicable,
        session, sessionJournal,
        trophy, pilgrimage,
        tasksRequired: required,
        tasksDone: done,
        coinsTotal,
      });

      cursor = _addDaysToYmd(cursor, 1);
    }

    return map;
  }

  // ═════════════════════════════════════════════════════════════════
  // STREAK MATH
  // ═════════════════════════════════════════════════════════════════

  function _isEngaged(state) {
    if (!state) return false;
    if (state.pilgrimage) return true;     // OQ-2: extends streak
    if (state.tasksRequired <= 0) return false;
    return state.tasksDone === state.tasksRequired;
  }

  // Returns integer ≥ 0. Walks back day-by-day from the anchor.
  // Anchor = today if today engaged, else yesterday (today in-flight
  // doesn't break a yesterday-anchored streak).
  function _computeStreak(dayMap, todayKey) {
    if (!dayMap || dayMap.size === 0) return 0;

    const today = dayMap.get(todayKey);
    let anchorKey;
    if (today && _isEngaged(today)) {
      anchorKey = todayKey;
    } else {
      anchorKey = _addDaysToYmd(todayKey, -1);
    }

    // Don't walk before launch.
    if (anchorKey < LAUNCH_DATE) return 0;

    let streak = 0;
    let cursor = anchorKey;
    let guard = 0;
    while (cursor >= LAUNCH_DATE && guard < 200) {
      guard++;
      const state = dayMap.get(cursor);
      if (state && _isEngaged(state)) {
        streak++;
        cursor = _addDaysToYmd(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════

  // Map (tasksDone / tasksRequired) → intensity class i0..i4.
  // i0 = no engagement; i4 = full task completion.
  // Threshold tuning notes (M/W/F + T/Th have 4 task lanes; Sat/Sun
  // has 3 — both ramps should feel monotonically "more gold" as
  // engagement rises):
  //   4 lanes: 1→i1 (0.25), 2→i2 (0.50), 3→i3 (0.75), 4→i4
  //   3 lanes: 1→i1 (0.33), 2→i3 (0.67), 3→i4
  // The 0.60 i3-threshold catches Sat/Sun 2/3 as "almost full"
  // rather than "medium" (closer match to the visual reality of
  // 1 lane remaining on a 3-lane day).
  function _intensityClass(done, req) {
    if (req <= 0 || done <= 0) return 'sh-cell--i0';
    const ratio = done / req;
    if (ratio >= 0.999) return 'sh-cell--i4';
    if (ratio >= 0.60)  return 'sh-cell--i3';
    if (ratio >= 0.40)  return 'sh-cell--i2';
    return 'sh-cell--i1';
  }

  // Build the tooltip text per OQ-5.
  function _tooltipText(state) {
    if (!state) return '';
    const datePart = _formatTooltipDate(state.date);
    const todayPrefix = state.isToday ? 'Today · ' : '';
    if (state.isPreLaunch) {
      return datePart + ' · before launch';
    }
    if (state.isFuture) {
      return datePart + ' · upcoming';
    }
    if (state.pilgrimage) {
      return todayPrefix + datePart + ' · ✦ Pilgrimage rest';
    }
    const total   = state.tasksRequired;
    const done    = state.tasksDone;
    const coins   = state.coinsTotal;
    if (done === 0 && total > 0) {
      return todayPrefix + datePart + ' · 0 of ' + total + ' · no activity';
    }
    if (done < total) {
      return todayPrefix + datePart + ' · ' + done + ' of ' + total + ' · partial';
    }
    // Full completion. Trophy ring may or may not be present.
    const check = state.trophy ? ' ✓' : '';
    const coinsLabel = coins > 0 ? ' · ' + coins + ' coins' : '';
    return todayPrefix + datePart + ' · ' + done + ' of ' + total + check + coinsLabel;
  }

  // Render one cell <div>. Returns HTML string.
  function _renderCell(state) {
    const cls = ['sh-cell'];
    if (state.isPreLaunch) {
      cls.push('sh-cell--prelaunch');
    } else if (state.isFuture) {
      cls.push('sh-cell--future');
    } else if (state.pilgrimage) {
      cls.push('sh-cell--pilg');
    } else {
      cls.push(_intensityClass(state.tasksDone, state.tasksRequired));
      if (state.trophy) cls.push('sh-cell--trophy');
    }
    if (state.isToday) cls.push('sh-cell--today');
    const tooltip = _tooltipText(state);
    const interactive = !state.isPreLaunch && !state.isFuture;
    const attrs = [
      'class="' + cls.join(' ') + '"',
      'data-date="' + esc(state.date) + '"',
      'data-tooltip="' + esc(tooltip) + '"',
    ];
    if (interactive) attrs.push('tabindex="0"');
    return '<div ' + attrs.join(' ') + '></div>';
  }

  // Build the week-row list for the given grid range. weeks are
  // Sunday-anchored; the first cell of each row is dow=0.
  function _weekRows(dayMap, gridStartKey, gridEndKey) {
    const rows = [];
    // Start from the Sunday of the first week.
    let weekStart = _weekStartYmd(gridStartKey);
    let guard = 0;
    while (weekStart <= gridEndKey && guard < 30) {
      guard++;
      const cells = [];
      for (let i = 0; i < 7; i++) {
        const dayKey = _addDaysToYmd(weekStart, i);
        const state = dayMap.get(dayKey);
        if (!state) {
          // Day outside the date map (e.g., first week's pre-grid-
          // start days). Render as a placeholder pre-launch cell.
          cells.push('<div class="sh-cell sh-cell--prelaunch" ' +
                     'data-date="' + esc(dayKey) + '"></div>');
        } else {
          cells.push(_renderCell(state));
        }
      }
      rows.push('<div class="sh-week">' + cells.join('') + '</div>');
      weekStart = _addDaysToYmd(weekStart, 7);
    }
    return rows.join('');
  }

  function _renderDowHeader() {
    return '<div class="sh-dow-header">' +
           '<span>S</span><span>M</span><span>T</span>' +
           '<span>W</span><span>T</span><span>F</span><span>S</span>' +
           '</div>';
  }

  function _renderCounter(streak, isPreLaunch) {
    if (isPreLaunch) {
      return '<div class="sh-counter sh-counter--prelaunch">' +
             'Topic 00 begins May 18</div>';
    }
    if (streak <= 0) {
      return '<div class="sh-counter sh-counter--zero">' +
             '<span class="sh-cn-mark">✧</span> ' +
             '<span class="sh-cn-label">Your streak begins today</span></div>';
    }
    return '<div class="sh-counter">' +
           '<span class="sh-cn-mark">✧</span> ' +
           '<span class="sh-cn-label">Current streak:</span> ' +
           '<strong class="sh-cn-num">' + streak + '</strong>' +
           '<span class="sh-cn-unit"> ' +
             (streak === 1 ? 'day' : 'days') +
           '</span></div>';
  }

  function _renderToggle(mode, hasEnoughWeeksToToggle) {
    if (!hasEnoughWeeksToToggle) return '';
    const label = (mode === 'compact')
      ? 'View full Topic 00 →'
      : '← Show last 6 weeks';
    return '<button type="button" class="sh-mode-toggle" ' +
           'data-mode-toggle="1">' + esc(label) + '</button>';
  }

  // ═════════════════════════════════════════════════════════════════
  // GRID RANGE COMPUTATION
  // ═════════════════════════════════════════════════════════════════

  // Returns { gridStartKey, gridEndKey, fetchStartKey, fetchEndKey,
  //          isPreLaunch, hasEnoughWeeksToToggle }.
  // gridStartKey/gridEndKey define the rendered grid (Sunday-snapped
  // on both ends). fetchStart/EndKey define the DB read range — never
  // earlier than LAUNCH_DATE, never later than today.
  function _computeRange(mode, todayKey) {
    const isPreLaunch = todayKey < LAUNCH_DATE;

    if (isPreLaunch) {
      // Render the launch week only — first week of Topic 00.
      const gridStartKey = _weekStartYmd(LAUNCH_DATE);              // Sun May 17
      const gridEndKey   = _addDaysToYmd(gridStartKey, 6);           // Sat May 23
      return {
        gridStartKey,
        gridEndKey,
        fetchStartKey: LAUNCH_DATE,
        fetchEndKey:   LAUNCH_DATE, // empty range guard
        isPreLaunch:   true,
        hasEnoughWeeksToToggle: false,
      };
    }

    // Sunday of today's week is the natural end-anchor.
    const thisWeekSun = _weekStartYmd(todayKey);
    const thisWeekSat = _addDaysToYmd(thisWeekSun, 6);

    // Launch week's Sunday — earliest grid start.
    const launchWeekSun = _weekStartYmd(LAUNCH_DATE);

    // Topic 00 end's Saturday — latest grid end in full mode.
    const topicEndSat = (function () {
      const sun = _weekStartYmd(TOPIC_00_END_DATE);
      return _addDaysToYmd(sun, 6);
    })();

    let gridStartKey, gridEndKey;
    if (mode === 'full') {
      gridStartKey = launchWeekSun;
      gridEndKey   = topicEndSat;
    } else {
      // Compact: last COMPACT_WEEKS weeks, but no further back than
      // launch week. The denominator is real elapsed weeks.
      const compactStart = _addDaysToYmd(thisWeekSun, -7 * (COMPACT_WEEKS - 1));
      gridStartKey = (compactStart < launchWeekSun) ? launchWeekSun : compactStart;
      gridEndKey   = thisWeekSat;
    }

    // Number of weeks in the full view, for toggle visibility.
    const fullWeeks = Math.round(
      (_parseYmd(topicEndSat) - _parseYmd(launchWeekSun)) / (1000 * 60 * 60 * 24 * 7)
    ) + 1;
    // Compact-vs-full only matters when full has more weeks than compact.
    const hasEnoughWeeksToToggle = fullWeeks > COMPACT_WEEKS;

    return {
      gridStartKey,
      gridEndKey,
      fetchStartKey: launchWeekSun,
      fetchEndKey:   (todayKey < gridEndKey) ? todayKey : gridEndKey,
      isPreLaunch:   false,
      hasEnoughWeeksToToggle,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // TOOLTIP + TOGGLE WIRING
  // ═════════════════════════════════════════════════════════════════

  function _wireInteractions(host, onToggle) {
    if (!host) return;

    const tooltipEl = host.querySelector('.sh-tooltip');

    function showTooltipAt(cell) {
      if (!tooltipEl || !cell) return;
      const text = cell.getAttribute('data-tooltip') || '';
      if (!text) return hideTooltip();
      tooltipEl.textContent = text;
      tooltipEl.removeAttribute('hidden');
      // Position above the cell, centered.
      const hostRect = host.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const ttX = (cellRect.left + cellRect.width / 2) - hostRect.left;
      const ttY = cellRect.top - hostRect.top - 4;
      tooltipEl.style.left = ttX + 'px';
      tooltipEl.style.top  = ttY + 'px';
    }
    function hideTooltip() {
      if (!tooltipEl) return;
      tooltipEl.setAttribute('hidden', '');
    }

    // Pointer events (desktop hover + touch tap).
    host.addEventListener('pointerover', (e) => {
      const cell = e.target && e.target.closest && e.target.closest('.sh-cell');
      if (!cell) return;
      if (cell.classList.contains('sh-cell--future') ||
          cell.classList.contains('sh-cell--prelaunch')) return;
      showTooltipAt(cell);
    });
    host.addEventListener('pointerout', (e) => {
      const cell = e.target && e.target.closest && e.target.closest('.sh-cell');
      if (!cell) return;
      // Hide on leaving a cell into non-cell space.
      const to = e.relatedTarget;
      if (to && to.closest && to.closest('.sh-cell')) return;
      hideTooltip();
    });
    // Touch: tap to show, tap-outside to dismiss.
    host.addEventListener('click', (e) => {
      const cell = e.target && e.target.closest && e.target.closest('.sh-cell');
      if (cell) {
        if (cell.classList.contains('sh-cell--future') ||
            cell.classList.contains('sh-cell--prelaunch')) {
          hideTooltip();
          return;
        }
        showTooltipAt(cell);
      } else {
        hideTooltip();
      }
    });

    // Mode toggle.
    const toggleBtn = host.querySelector('[data-mode-toggle]');
    if (toggleBtn && typeof onToggle === 'function') {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideTooltip();
        onToggle();
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN MOUNT
  // ═════════════════════════════════════════════════════════════════

  async function mount(slot, ctx) {
    if (!slot) return;
    const opts = ctx || {};
    const sb         = opts.sb;
    const explorerId = opts.explorerId;
    const familyId   = opts.familyId;
    const todayKey   = opts.today || _todayKey();

    // Mode precedence: caller override > module-scope sticky > 'compact'.
    if (opts.mode === 'compact' || opts.mode === 'full') {
      _currentMode = opts.mode;
    }

    if (!sb || !explorerId) {
      slot.innerHTML = '';
      return;
    }
    if (!_W()) {
      // WeekUtils is a hard dependency — render nothing rather than
      // half-state.
      slot.innerHTML = '';
      console.warn('StreakHeatmap.mount: WeekUtils not loaded; skipping');
      return;
    }

    const range = _computeRange(_currentMode, todayKey);

    const data = await _fetchData(
      sb, explorerId, familyId,
      range.fetchStartKey, range.fetchEndKey
    );

    const dayMap = _buildDayMap(
      data, range.gridStartKey, range.gridEndKey, todayKey
    );

    const streak = range.isPreLaunch ? 0 : _computeStreak(dayMap, todayKey);

    const counterHTML = _renderCounter(streak, range.isPreLaunch);
    const gridHTML    =
      '<div class="sh-grid">' +
        _renderDowHeader() +
        _weekRows(dayMap, range.gridStartKey, range.gridEndKey) +
      '</div>';
    const toggleHTML  = range.isPreLaunch
      ? ''
      : _renderToggle(_currentMode, range.hasEnoughWeeksToToggle);
    const tooltipHTML = '<div class="sh-tooltip" hidden></div>';

    const wrapClasses = ['sh-wrap'];
    if (range.isPreLaunch) wrapClasses.push('sh-wrap--prelaunch');

    slot.innerHTML =
      '<section class="' + wrapClasses.join(' ') + '" aria-label="Engagement heatmap">' +
        '<div class="sh-eyebrow">✦ Daily Engagement</div>' +
        counterHTML +
        gridHTML +
        toggleHTML +
        tooltipHTML +
      '</section>';

    // Wire interactions — tooltip + mode toggle. Toggle invokes
    // mount() again with the opposite mode (no re-fetch needed by
    // the data layer, but easier to keep mount() as the single entry
    // point — the marginal cost is one extra fetch and the data set
    // is tiny).
    const wrap = slot.querySelector('.sh-wrap');
    _wireInteractions(wrap, async () => {
      _currentMode = (_currentMode === 'compact') ? 'full' : 'compact';
      await mount(slot, Object.assign({}, opts, { mode: _currentMode }));
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  const StreakHeatmap = {
    mount: mount,
    // Exposed for tests + the orchestrator's Phase 2 sanity query path.
    _internals: {
      LAUNCH_DATE, TOPIC_00_END_DATE, COMPACT_WEEKS,
      _computeRange, _buildDayMap, _computeStreak,
      _isEngaged, _intensityClass, _tooltipText,
      _tasksRequiredForDow, _sessionDayColFromDow,
      _formatTooltipDate, _weekStartYmd, _addDaysToYmd,
    },
  };

  if (typeof window !== 'undefined') window.StreakHeatmap = StreakHeatmap;
  if (typeof module !== 'undefined' && module.exports) module.exports = StreakHeatmap;
})();
