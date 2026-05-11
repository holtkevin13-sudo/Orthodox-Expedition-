/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 4b
   js/missions.js — Daily mission hub (Missions surface)
   May 11, 2026

   PURPOSE
   Renders the new "Today's Missions" daily-action hub. Each mission
   row is a state-bearing surface that routes to its lane page when
   tapped. The reading mission is special: it's a state machine
   surface that hosts either the Daily Anchor Card teaser (pending),
   the Reading Quest question card (read-not-answered), or a
   completed acknowledgement (complete).

   IA POSITION (Dispatch 4b)
   • Home  → status & welcome dashboard
   • MISSIONS → daily action hub (this module)
   • Topics → study material + Feast of the Week
   • Scriptures → free reading (bible-reader, browsable)
   • Field Manual → past reflections archive

   The reading mission CARD on this surface is the relocated home
   of TWO previously-home-anchored surfaces:
     - Daily Anchor Card  (js/daily-anchor-card.js — Lane A)
     - Reading Quest      (js/reading-quest.js     — Lane 3 question)
   This module does not refactor those; it just chooses which to
   mount in which sub-state.

   PUBLIC API (browser): window.Missions = { … }

     getMissionsForDay(dateString)
         → ['reading','prayer','memorization','session'|'journal'?]
         M/W/F: reading, prayer, memorization, session
         T/Th : reading, prayer, memorization, journal
         Sat/Sun: reading, prayer, memorization

     loadTodaysState(sb, explorerId, familyId, today)
         → {
             reading:      'pending'|'read-not-answered'|'complete'|'pilgrimage'|'complete-no-question',
             prayer:       'pending'|'complete'|'pilgrimage',
             memorization: 'pending'|'complete'|'not_applicable'|'pilgrimage',
             session:      'pending'|'complete'|null,
             journal:      'pending'|'complete'|null,
             completedCount: int,
             totalCount: int,
             pilgrimage: row|null,
             activeSession: {id,title,coins,progressRow}|null,
             currentVerse: {reference,...}|null,
             todaysPrompt: string,
             readingAnchorRow: liturgical_calendar row|null
           }

     mount(container, options)
         options = { sb, explorerId, familyId, profile }
         Renders the entire daily-hub UI into `container`.
         Idempotent: re-mount produces the same state from a fresh
         load. Stores options + container for refresh().

     refresh()
         Re-mounts using the last (container, options) pair. Used
         after a state change (e.g., Nolan returns from prayers.html
         and we want to refresh the row).

   DEPENDENCIES (window globals; defensive checks throughout)
     WeekUtils    — ET timezone, dayOfWeekET, todayKey
     Pilgrimages  — isActiveToday
     Prayers      — getTodayStatus (derive prayedToday = morning||evening)
     Memorization — didTodayCount, getCurrentVerse
     ReadingQuest — mount (inline, into our reading-quest-mount slot)
     DailyAnchorCard — render (HTML string into our anchor slot)

   Op Learnings honored:
     #4  Schema-first — all queries verified against
         information_schema before this module was written
     #7  ET timezone via WeekUtils
     #13 Staged deliverables
     #15 CSS rules over UA [hidden]: style="display:none" toggle
     #16 Structural mirror — mirrors the pattern home.html uses
         (parallel data load → render section by section)
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

  // Day-of-week as 0-6 (0=Sun..6=Sat) in ET via WeekUtils.
  // Falls back to host getDay() if WeekUtils not loaded (defensive).
  function _dowET(d) {
    const W = _W();
    if (W && typeof W.dayOfWeekET === 'function') return W.dayOfWeekET(d || new Date());
    return new Date().getDay();
  }

  // ET YYYY-MM-DD key for today (or for a given Date).
  function _todayKey() {
    const W = _W();
    if (W && typeof W.todayKey === 'function') return W.todayKey();
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Pretty day-name (Mon/Tue/...) + long-form month-day in ET.
  // Avoids the "weekday rolls overnight in UTC" trap by using ET
  // formatToParts.
  function _formatDayLabel(today /* YYYY-MM-DD */) {
    try {
      const [y, m, d] = today.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long', month: 'long', day: 'numeric',
      });
      return fmt.format(dt); // e.g. "Tuesday, May 19"
    } catch (_e) {
      return today;
    }
  }

  // Reading-quest's flag key — kept in lockstep with reading-quest.js:122.
  function _readingFlagKey(today) { return `oe_bible_reader_visited_${today}`; }
  function _readingFlagSet(today) {
    try { return localStorage.getItem(_readingFlagKey(today)) === '1'; }
    catch (_e) { return false; }
  }

  // Inspect liturgical_calendar row for question payload — mirrors
  // reading-quest.js:138.
  function _hasQuestion(row) {
    return !!(row && row.daily_readings && row.daily_readings.question);
  }

  // Build a bible-reader deep-link URL from a liturgical_calendar
  // row's gospel payload. Mirrors the URL pattern produced by
  // js/daily-anchor-card.js renderLectionaryGospel (book + chapter
  // + source=expedition, optional vs/ve when both are present).
  // Falls back to a plain bible-reader.html link when the gospel
  // payload is incomplete — still tappable, still useful.
  function _buildGospelHref(row) {
    const gospel = (row && row.daily_readings && row.daily_readings.gospel) || null;
    if (!gospel) return 'bible-reader.html';
    const bookCode = gospel.book_code;
    const chapter  = gospel.chapter;
    if (!bookCode || chapter == null || chapter === '') return 'bible-reader.html';
    let href = `bible-reader.html?book=${encodeURIComponent(bookCode)}`
             + `&chapter=${encodeURIComponent(chapter)}`
             + `&source=expedition`;
    const vs = gospel.verse_start;
    const ve = gospel.verse_end;
    const vsOk = (vs !== null && vs !== undefined && vs !== '' && Number(vs) > 0);
    const veOk = (ve !== null && ve !== undefined && ve !== '' && Number(ve) > 0);
    if (vsOk && veOk) {
      href += `&vs=${encodeURIComponent(vs)}&ve=${encodeURIComponent(ve)}`;
    }
    return href;
  }

  // Strip liturgical lead-ins from gospel text for the teaser line.
  // Same pattern daily-anchor-card uses, kept minimal here.
  function _gospelTeaser(text) {
    if (!text) return '';
    let t = String(text).trim();
    t = t.replace(/^(at\s+that\s+time[,]?\s+|the\s+lord\s+said[,]?\s+|in\s+those\s+days[,]?\s+)/i, '');
    if (t.length > 180) t = t.slice(0, 177).replace(/\s+\S*$/, '') + '…';
    return t;
  }

  // ═════════════════════════════════════════════════════════════════
  // DAY-OF-WEEK → MISSION ID LIST
  // ═════════════════════════════════════════════════════════════════

  function getMissionsForDay(dateString) {
    // dateString optional; defaults to today (ET).
    let dow;
    if (dateString) {
      try {
        const [y, m, d] = dateString.split('-').map(n => parseInt(n, 10));
        const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        dow = _dowET(dt);
      } catch (_e) {
        dow = _dowET(new Date());
      }
    } else {
      dow = _dowET(new Date());
    }

    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const base = ['reading', 'prayer', 'memorization'];
    if (dow === 1 || dow === 3 || dow === 5) return base.concat(['session']);   // M/W/F
    if (dow === 2 || dow === 4) return base.concat(['journal']);                 // T/Th
    return base;                                                                  // Sat/Sun
  }

  // ═════════════════════════════════════════════════════════════════
  // PARALLEL DATA LOAD
  // ═════════════════════════════════════════════════════════════════

  // Load active session (mastery-based, mirrors home.html:loadData).
  async function _loadActiveSession(sb, explorerId) {
    try {
      const [masteryRes, progressRes, sessionsRes] = await Promise.all([
        sb.from('topic_mastery').select('*').eq('explorer_id', explorerId).order('topic_id'),
        sb.from('session_progress')
          .select('session_id, day_1_completed_at, day_2_completed_at, day_3_completed_at')
          .eq('explorer_id', explorerId),
        sb.from('sessions')
          .select('id,title,topic_id,coins,order_index')
          .order('topic_id').order('order_index'),
      ]);

      const mastery = masteryRes.data || [];
      const progressRows = progressRes.data || [];
      const allSessions = sessionsRes.data || [];

      const completed = progressRows
        .filter(s => s.day_1_completed_at && s.day_2_completed_at && s.day_3_completed_at)
        .map(s => s.session_id);

      // Match home.html's active-session lookup pattern:
      // (1) mastery row with status available|pending → its topic
      // (2) Else fall back to first incomplete session in topic 0.
      const activeMastery = mastery.find(m => m.status === 'available' || m.status === 'pending');
      let nextSession = null;
      if (activeMastery) {
        const activeTopicId = parseInt(activeMastery.topic_id, 10);
        const topicSessions = allSessions
          .filter(s => parseInt(s.topic_id, 10) === activeTopicId)
          .sort((a, b) => a.order_index - b.order_index);
        nextSession = topicSessions.find(s => !completed.includes(s.id)) || null;
      }
      if (!nextSession) {
        nextSession = allSessions.find(s => parseInt(s.topic_id, 10) === 0 && !completed.includes(s.id)) || null;
      }
      if (!nextSession) return null;

      const progressRow = progressRows.find(p => p.session_id === nextSession.id) || null;
      return {
        id: nextSession.id,
        title: nextSession.title,
        coins: nextSession.coins,
        progressRow,
      };
    } catch (e) {
      console.warn('Missions._loadActiveSession failed (graceful):', e);
      return null;
    }
  }

  // Replicates loadDailyAnchorCard's three parallel queries — the
  // calendar row drives both the Daily Anchor Card AND the Reading
  // Quest. Day-of-year derives the verse/prompt rotation index.
  async function _loadDailyAnchorData(sb, todayKey) {
    try {
      const now = new Date();
      const doy = (() => {
        const start = new Date(now.getFullYear(), 0, 0);
        return Math.floor((now - start) / 86400000);
      })();

      const [calRes, versesRes, promptsRes] = await Promise.all([
        sb.from('liturgical_calendar')
          .select('calendar_date,liturgical_season,feast_name,feast_rank,sunday_name,saint_commemorations,daily_readings')
          .eq('calendar_date', todayKey).maybeSingle(),
        sb.from('daily_verses')
          .select('reference,text,bible_book_code,bible_chapter')
          .eq('is_active', true).order('display_order'),
        sb.from('journal_prompts')
          .select('prompt_text')
          .eq('is_active', true).order('display_order'),
      ]);

      const verses  = versesRes.data  || [];
      const prompts = promptsRes.data || [];
      const verse   = verses.length  ? verses[(doy - 1 + verses.length)  % verses.length]  : null;
      const prompt  = prompts.length ? prompts[(doy - 1 + prompts.length) % prompts.length] : null;

      return {
        row: calRes && calRes.data ? calRes.data : null,
        verse,
        prompt,
      };
    } catch (e) {
      console.warn('Missions._loadDailyAnchorData failed (graceful):', e);
      return { row: null, verse: null, prompt: null };
    }
  }

  // Did Nolan write a reflection today? (T/Th journal mission state)
  // entry_text LIKE 'Reflection:%' is the launch convention; matches
  // both the 3b reading reflection prefix AND the new journal-mission
  // page's save pattern. Dispatch 4b §G.
  async function _loadJournaledToday(sb, explorerId, todayKey) {
    try {
      // Day-bound on created_at via the ET window. Cheapest: pull
      // the day's row(s) and pattern-match in JS.
      const [y, m, d] = todayKey.split('-').map(n => parseInt(n, 10));
      const dayStartET = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T00:00:00-04:00`;
      const dayEndET   = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T23:59:59-04:00`;

      const res = await sb.from('field_journal')
        .select('entry_text,created_at')
        .eq('explorer_id', explorerId)
        .eq('category', 'expedition_log')
        .gte('created_at', dayStartET)
        .lte('created_at', dayEndET)
        .ilike('entry_text', 'Reflection:%')
        .limit(1);

      if (res.error) throw res.error;
      return !!(res.data && res.data.length > 0);
    } catch (e) {
      console.warn('Missions._loadJournaledToday failed (graceful):', e);
      return false;
    }
  }

  // Did Nolan finish reading + question today? (single SELECT;
  // mirrors Reading.getStreak's internal day lookup.)
  async function _loadReadCompleteToday(sb, explorerId, todayKey) {
    try {
      const res = await sb.from('reading_completions')
        .select('id')
        .eq('explorer_id', explorerId)
        .eq('calendar_date', todayKey)
        .maybeSingle();
      if (res.error) throw res.error;
      return !!res.data;
    } catch (e) {
      console.warn('Missions._loadReadCompleteToday failed (graceful):', e);
      return false;
    }
  }

  // Did Nolan complete today's session day? (M/W/F slot lookup.)
  function _sessionDoneToday(progressRow, dow) {
    if (!progressRow) return false;
    if (dow === 1) return !!progressRow.day_1_completed_at;
    if (dow === 3) return !!progressRow.day_2_completed_at;
    if (dow === 5) return !!progressRow.day_3_completed_at;
    return false;
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC: loadTodaysState
  // ═════════════════════════════════════════════════════════════════

  async function loadTodaysState(sb, explorerId, familyId, today) {
    today = today || _todayKey();
    const dow = _dowET(new Date());
    const missionsForDay = getMissionsForDay(today);

    // Parallel: pilgrimage check + lane data
    const [
      pilgrimageActive,
      prayerStatus,
      memDidToday,
      currentVerse,
      readCompleteToday,
      anchorData,
      activeSession,
      journaledToday,
    ] = await Promise.all([
      window.Pilgrimages && typeof window.Pilgrimages.isActiveToday === 'function'
        ? window.Pilgrimages.isActiveToday(sb).catch(() => null) : Promise.resolve(null),
      window.Prayers && typeof window.Prayers.getTodayStatus === 'function'
        ? window.Prayers.getTodayStatus(sb, explorerId).catch(() => ({morning:false,evening:false})) : Promise.resolve({morning:false,evening:false}),
      window.Memorization && typeof window.Memorization.didTodayCount === 'function'
        ? window.Memorization.didTodayCount(sb, explorerId).catch(() => false) : Promise.resolve(false),
      window.Memorization && typeof window.Memorization.getCurrentVerse === 'function'
        ? window.Memorization.getCurrentVerse(sb, familyId).catch(() => null) : Promise.resolve(null),
      _loadReadCompleteToday(sb, explorerId, today),
      _loadDailyAnchorData(sb, today),
      _loadActiveSession(sb, explorerId),
      missionsForDay.indexOf('journal') >= 0
        ? _loadJournaledToday(sb, explorerId, today) : Promise.resolve(false),
    ]);

    const isPilgrimage = !!pilgrimageActive;

    // ── Resolve each mission's state ──────────────────────────────

    // Reading mission state machine
    let readingState;
    if (isPilgrimage) {
      readingState = 'pilgrimage';
    } else if (readCompleteToday) {
      // DB has a completion row. Distinguish by whether today's
      // liturgical_calendar row carries a question payload:
      //   • with question → 'complete' (ReadingQuest renders the
      //     reveal view from the stored answer).
      //   • without question → 'complete-no-question' (the always-
      //     clickable ✓ tile; the idempotent log+coin write in mount
      //     becomes a no-op on subsequent visits via the unique
      //     constraint on reading_completions).
      readingState = _hasQuestion(anchorData.row) ? 'complete' : 'complete-no-question';
    } else if (_readingFlagSet(today)) {
      // Per Pause #2 (a): visited counts as complete EVEN on dates
      // with no question payload (post-Jun-14 unless content
      // extended). Otherwise, the user has read and now needs to
      // answer the question.
      if (_hasQuestion(anchorData.row)) {
        readingState = 'read-not-answered';
      } else {
        readingState = 'complete-no-question';
      }
    } else {
      readingState = 'pending';
    }

    // Prayer mission state
    let prayerState;
    if (isPilgrimage) prayerState = 'pilgrimage';
    else if (prayerStatus && (prayerStatus.morning || prayerStatus.evening)) prayerState = 'complete';
    else prayerState = 'pending';

    // Memorization mission state
    let memState;
    if (isPilgrimage) memState = 'pilgrimage';
    else if (!currentVerse) memState = 'not_applicable';
    else if (memDidToday) memState = 'complete';
    else memState = 'pending';

    // Session mission state (M/W/F only)
    let sessionState;
    if (missionsForDay.indexOf('session') < 0) {
      sessionState = null;
    } else if (isPilgrimage) {
      sessionState = 'pilgrimage';
    } else if (activeSession && _sessionDoneToday(activeSession.progressRow, dow)) {
      sessionState = 'complete';
    } else {
      sessionState = 'pending';
    }

    // Journal mission state (T/Th only)
    let journalState;
    if (missionsForDay.indexOf('journal') < 0) {
      journalState = null;
    } else if (isPilgrimage) {
      journalState = 'pilgrimage';
    } else if (journaledToday) {
      journalState = 'complete';
    } else {
      journalState = 'pending';
    }

    // ── Tally completed / total for the progress card ─────────────
    // Pilgrimage: count all as "rest" — completedCount = totalCount
    // (full bar). Otherwise: tally non-applicable as both denominator-
    // exempt and numerator-exempt.
    let completedCount = 0;
    let totalCount = 0;
    function tally(state) {
      if (state == null || state === 'not_applicable') return; // skip
      totalCount++;
      if (state === 'complete' || state === 'complete-no-question' || state === 'pilgrimage') completedCount++;
    }
    tally(readingState);
    tally(prayerState);
    tally(memState);
    tally(sessionState);
    tally(journalState);

    return {
      reading: readingState,
      prayer:  prayerState,
      memorization: memState,
      session: sessionState,
      journal: journalState,
      completedCount,
      totalCount,
      pilgrimage: pilgrimageActive,
      activeSession,
      currentVerse,
      todaysPrompt: anchorData.prompt ? anchorData.prompt.prompt_text : null,
      readingAnchorRow: anchorData.row,
      readingAnchorVerse: anchorData.verse,
      readingAnchorPrompt: anchorData.prompt,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER — sub-components
  // ═════════════════════════════════════════════════════════════════

  // Section title above the daily list. Format: "Today's Missions"
  // + day-name eyebrow.
  function _renderEyebrow(today) {
    return `
      <div class="mh-eyebrow">
        <div class="mh-eyebrow-title">Today's Missions</div>
        <div class="mh-eyebrow-day">${esc(_formatDayLabel(today))}</div>
      </div>
    `;
  }

  // Pilgrimage banner (Pause #5 = a: fresh instance, no shared module)
  function _renderPilgrimageBanner(pilgrimage) {
    if (!pilgrimage) return '';
    const name = pilgrimage.name || 'Pilgrimage';
    const range = (pilgrimage.start_date && pilgrimage.end_date)
      ? ` (${esc(pilgrimage.start_date)} to ${esc(pilgrimage.end_date)})`
      : '';
    return `
      <div class="mh-pilgrimage-banner">
        <div class="mh-pb-icon">🚶</div>
        <div class="mh-pb-text">
          <div class="mh-pb-title">On Pilgrimage — ${esc(name)}</div>
          <div class="mh-pb-detail">Quests pause${range}. Your streak walks with you.</div>
        </div>
      </div>
    `;
  }

  // ★ READING MISSION CARD — state-dependent reading mission renderer.
  // Returns OUTER HTML (the card frame); the actual content slot is
  // marked with #mh-reading-content for post-render mounting of
  // ReadingQuest or DailyAnchorCard.
  function _renderReadingMissionShell(state) {
    return `
      <div class="mh-reading-card mh-card-prominent" id="mh-reading-card" data-state="${esc(state)}">
        <div class="mh-card-eyebrow">★ Today's Gospel Reading</div>
        <div id="mh-reading-content"></div>
      </div>
    `;
  }

  // For pilgrimage: render gentle rest copy in place of gospel content.
  function _readingPilgrimageHTML() {
    return `
      <div class="mh-reading-pilgrimage">
        <div class="mh-rp-icon">✦</div>
        <div class="mh-rp-text">Read at your own pace this week — your streak walks with you.</div>
      </div>
    `;
  }

  // For complete-no-question: a small, ALWAYS-CLICKABLE "✓ Today's
  // Gospel — read · +5" mini-card. Tap re-opens bible-reader at
  // today's Gospel for re-reading (DB row already logged on the
  // first mount entering this state; unique constraint prevents
  // double-log). Coin reward is flat +5 (Chat 1 Decision 1).
  function _readingCompleteNoQuestionHTML(row) {
    const href = _buildGospelHref(row);
    return `
      <a class="mh-reading-done-mini" href="${esc(href)}">
        <div class="mh-rdm-check">✓</div>
        <div class="mh-rdm-text">Today's Gospel — read &middot; <span class="mh-rdm-coins">+5</span></div>
      </a>
    `;
  }

  // Generic mission row. Whole row is a tappable <a>.
  // Op Learning #15 — visible state via class names; row hidden via
  // inline `display:none` if ever needed (here it isn't — we render
  // null states as `not_applicable` rows or skip entirely).
  function _renderMissionRow(opts) {
    const {
      id, href, icon, name, sub, state, coinsLabel,
    } = opts;
    const stateClass = `mh-state-${state}`;
    // Right-side state indicator glyph
    let indicator;
    switch (state) {
      case 'complete':     indicator = '<span class="mh-row-indicator mh-ri-done" aria-label="Complete">✓</span>'; break;
      case 'pilgrimage':   indicator = '<span class="mh-row-indicator mh-ri-pilgrimage" aria-label="On pilgrimage">✦</span>'; break;
      case 'not_applicable': indicator = '<span class="mh-row-indicator mh-ri-na" aria-label="Not applicable">—</span>'; break;
      default:             indicator = '<span class="mh-row-indicator mh-ri-pending" aria-label="Pending">○</span>';
    }
    return `
      <a class="mh-row ${stateClass}" id="mh-row-${esc(id)}" href="${esc(href)}">
        <div class="mh-row-icon">${icon}</div>
        <div class="mh-row-body">
          <div class="mh-row-name">${esc(name)}</div>
          <div class="mh-row-sub">${esc(sub)}</div>
        </div>
        ${coinsLabel ? `<div class="mh-row-coins">${esc(coinsLabel)}</div>` : ''}
        ${indicator}
      </a>
    `;
  }

  // SESSION ROW — special row with M/W/F day-rail (Pause #1 = B).
  // Preserves the catch-up logic from home.html's renderTodayCard
  // verbatim. Tap routes to week.html (the session detail surface).
  function _renderSessionRow(activeSession, sessionState, dow) {
    if (!activeSession) {
      // Defensive: no active session known — fall back to a neutral
      // row that still navigates to curriculum (Topics) so Nolan
      // can pick where to resume.
      return _renderMissionRow({
        id: 'session', href: 'curriculum.html', icon: '🎓',
        name: 'Today\'s session', sub: 'Open Topics to choose where to resume',
        state: sessionState || 'pending',
      });
    }

    const p = activeSession.progressRow;
    const allThree = p && p.day_1_completed_at && p.day_2_completed_at && p.day_3_completed_at;

    // Today's M/W/F slot index: Mon=1, Wed=2, Fri=3, else 0.
    const todayDayN = dow === 1 ? 1 : dow === 3 ? 2 : dow === 5 ? 3 : 0;

    // Mirrors home.html:2113-2126 — catch-up logic for past slots.
    function isSlotPast(n, currentDow) {
      const slotDow = n === 1 ? 1 : n === 2 ? 3 : 5;
      if (currentDow === 0) return true;
      return slotDow < currentDow;
    }
    function pickCatchUpDay(progress, currentDow) {
      if (isSlotPast(1, currentDow) && !(progress && progress.day_1_completed_at)) return 1;
      if (progress && progress.day_1_completed_at && isSlotPast(2, currentDow) && !progress.day_2_completed_at) return 2;
      if (progress && progress.day_1_completed_at && progress.day_2_completed_at && isSlotPast(3, currentDow) && !progress.day_3_completed_at) return 3;
      return null;
    }
    function dotClass(progress, n, catchUpDay) {
      if (progress && progress[`day_${n}_completed_at`]) return 'done';
      if (catchUpDay !== null && catchUpDay !== undefined && n === catchUpDay) return 'catch-up';
      if (catchUpDay !== null && catchUpDay !== undefined) return 'future';
      if (n === todayDayN) return 'today';
      return 'future';
    }
    function dotMarkup(progress, n, label, catchUpDay) {
      const cls = dotClass(progress, n, catchUpDay);
      const glyph = cls === 'done' ? '✓' : (cls === 'catch-up' ? '↺' : '');
      return `<span class="mh-day-pair">`+
        `<span class="mh-day-dot mh-day-${cls}" aria-label="Day ${n} (${label}) ${cls}">${glyph}</span>`+
        `<span class="mh-day-dot-label" aria-hidden="true">${label}</span>`+
        `</span>`;
    }

    const catchUpDay = pickCatchUpDay(p, dow);
    const stateClass = `mh-state-${sessionState}`;
    const completeClass = allThree ? ' mh-session-complete' : '';

    let indicator;
    if (sessionState === 'complete') indicator = '<span class="mh-row-indicator mh-ri-done">✓</span>';
    else if (sessionState === 'pilgrimage') indicator = '<span class="mh-row-indicator mh-ri-pilgrimage">✦</span>';
    else indicator = '<span class="mh-row-indicator mh-ri-pending">○</span>';

    return `
      <a class="mh-row mh-row-session ${stateClass}${completeClass}" id="mh-row-session" href="week.html">
        <div class="mh-row-icon">🎓</div>
        <div class="mh-row-body">
          <div class="mh-row-name">Today's session</div>
          <div class="mh-row-sub">${esc(activeSession.id + ' — ' + activeSession.title)}</div>
          <div class="mh-day-rail" role="group" aria-label="Mon Wed Fri progress for this session">
            ${dotMarkup(p, 1, 'Mon', catchUpDay)}
            ${dotMarkup(p, 2, 'Wed', catchUpDay)}
            ${dotMarkup(p, 3, 'Fri', catchUpDay)}
          </div>
        </div>
        ${indicator}
      </a>
    `;
  }

  // Progress bar + celebration line (when all done).
  function _renderProgress(completedCount, totalCount, isPilgrimage) {
    if (totalCount === 0) return '';
    const pct = Math.round((completedCount / totalCount) * 100);
    const allDone = completedCount >= totalCount && !isPilgrimage;
    const restMode = isPilgrimage;
    return `
      <div class="mh-progress" id="mh-progress">
        <div class="mh-progress-row">
          <span class="mh-progress-label">Today's Progress</span>
          <span class="mh-progress-count" id="mh-progress-count">
            <span class="mh-pc-num" id="mh-pc-num" data-count="${completedCount}">${completedCount}</span>
            of
            <span class="mh-pc-total">${totalCount}</span>
            ${allDone ? ' ✓' : ' today'}
          </span>
        </div>
        <div class="mh-progress-bar"><div class="mh-progress-fill" style="width:${pct}%"></div></div>
        ${allDone ? `
          <div class="mh-celebration-line">
            Glory to God for all things, Nolan. ☦ See you tomorrow.
          </div>
        ` : ''}
        ${restMode ? `
          <div class="mh-celebration-line mh-celebration-rest">
            Walk in peace. Your streak walks with you.
          </div>
        ` : ''}
      </div>
    `;
  }

  // ═════════════════════════════════════════════════════════════════
  // 10/10 POLISH — animations & micro-celebrations
  // ═════════════════════════════════════════════════════════════════

  // Count-up animation: animates a number element from `from` to `to`
  // over ~600ms, eased.
  function _animateCountUp(el, from, to) {
    if (!el) return;
    if (from === to) { el.textContent = String(to); return; }
    const start = performance.now();
    const dur = 600;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = String(v);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = String(to);
    }
    requestAnimationFrame(step);
  }

  // Micro-celebration on a row that just transitioned to complete:
  // gold flash + check pulse, ~600ms.
  function _microCelebrate(rowEl) {
    if (!rowEl) return;
    rowEl.classList.add('mh-row-celebrate');
    setTimeout(() => { rowEl.classList.remove('mh-row-celebrate'); }, 700);
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN MOUNT
  // ═════════════════════════════════════════════════════════════════

  // Module-scope refresh memo.
  let _lastMountContainer = null;
  let _lastMountOptions   = null;
  // Track prior completed count so we know whether to animate up
  // and which row(s) to micro-celebrate on transition.
  let _priorCompletedCount = null;
  let _priorStates = null;

  async function mount(container, options) {
    if (!container) return;
    const opts = options || {};
    const { sb, explorerId, familyId } = opts;
    if (!sb || !explorerId || !familyId) {
      container.innerHTML = '<div class="mh-empty">Missions hub unavailable.</div>';
      return;
    }

    _lastMountContainer = container;
    _lastMountOptions   = opts;

    const today = _todayKey();
    const dow = _dowET(new Date());
    const state = await loadTodaysState(sb, explorerId, familyId, today);

    // Build HTML
    const parts = [];
    parts.push(_renderEyebrow(today));
    parts.push(_renderPilgrimageBanner(state.pilgrimage));
    parts.push(_renderReadingMissionShell(state.reading));

    // Other mission rows — render in canonical order: prayer, memo,
    // session-or-journal.
    parts.push(_renderMissionRow({
      id: 'prayer',
      href: 'prayers.html',
      icon: '🕊️',
      name: 'Pray today',
      sub: state.prayer === 'complete' ? 'Today\'s prayer is offered' : 'Morning or evening',
      state: state.prayer,
    }));

    const memSub = state.memorization === 'not_applicable'
      ? 'No verse this week'
      : (state.currentVerse ? state.currentVerse.reference : 'This week\'s verse');
    parts.push(_renderMissionRow({
      id: 'memorization',
      href: 'memorization.html',
      icon: '📜',
      name: 'This week\'s verse',
      sub: memSub,
      state: state.memorization,
    }));

    if (state.session !== null) {
      parts.push(_renderSessionRow(state.activeSession, state.session, dow));
    }

    if (state.journal !== null) {
      parts.push(_renderMissionRow({
        id: 'journal',
        href: 'journal-mission.html',
        icon: '📝',
        name: 'Reflection',
        sub: state.journal === 'complete'
          ? 'Today\'s reflection is written'
          : 'A short note about today',
        state: state.journal,
      }));
    }

    parts.push(_renderProgress(state.completedCount, state.totalCount, !!state.pilgrimage));

    container.innerHTML = parts.join('');

    // ── Mount the inner reading-mission content per state ────────
    const innerSlot = container.querySelector('#mh-reading-content');
    if (innerSlot) {
      if (state.reading === 'pilgrimage') {
        innerSlot.innerHTML = _readingPilgrimageHTML();
      } else if (state.reading === 'complete-no-question') {
        // No-question day: the user has read the Gospel (localStorage
        // flag set by bible-reader's pagehide hook) but there's no
        // question payload to answer. Log a completion row + award
        // flat +5 coins via the ReadingQuest wrapper (idempotent —
        // unique constraint blocks dupes on re-mount). Render the
        // tile as an always-clickable anchor so re-reads are free.
        if (window.ReadingQuest
            && typeof window.ReadingQuest.commitNoQuestionCompletion === 'function') {
          try {
            await window.ReadingQuest.commitNoQuestionCompletion(sb, {
              explorerId, familyId, today, coins: 5,
            });
          } catch (e) {
            console.warn('ReadingQuest.commitNoQuestionCompletion failed (graceful):', e);
          }
        }
        innerSlot.innerHTML = _readingCompleteNoQuestionHTML(state.readingAnchorRow);
      } else if (state.reading === 'pending') {
        // Pending → full DailyAnchorCard. Anchor card brings the
        // gospel teaser AND the deep-link to bible-reader. Tap on
        // the gospel link sets the localStorage flag on close
        // (via bible-reader's pagehide hook).
        if (window.DailyAnchorCard && typeof window.DailyAnchorCard.render === 'function') {
          try {
            const explorerName = (opts.profile && opts.profile.name)
              ? String(opts.profile.name).trim().split(/\s+/)[0]
              : null;
            const html = window.DailyAnchorCard.render({
              row: state.readingAnchorRow,
              verse: state.readingAnchorVerse,
              prompt: state.readingAnchorPrompt,
              today: new Date(),
              explorerName,
            });
            innerSlot.innerHTML = html || '';
          } catch (e) {
            console.warn('DailyAnchorCard.render failed (graceful):', e);
            innerSlot.innerHTML = '';
          }
        }
      } else {
        // 'read-not-answered' or 'complete' → mount ReadingQuest.
        // ReadingQuest renders the active question or its own
        // "Done today" reveal view, depending on DB + flag state.
        if (window.ReadingQuest && typeof window.ReadingQuest.mount === 'function') {
          try {
            await window.ReadingQuest.mount(innerSlot, {
              sb,
              explorerId,
              familyId,
              today,
              row: state.readingAnchorRow,
            });
          } catch (e) {
            console.warn('ReadingQuest.mount failed (graceful):', e);
            innerSlot.innerHTML = '';
          }
        }
      }
    }

    // ── 10/10 polish: count-up animation + micro-celebration ─────
    // If we re-entered Missions and the completed count went up,
    // animate the number and flash the newly-completed row(s).
    if (_priorCompletedCount !== null && state.completedCount > _priorCompletedCount) {
      const numEl = container.querySelector('#mh-pc-num');
      _animateCountUp(numEl, _priorCompletedCount, state.completedCount);
      // Identify newly-complete rows by comparing prior state map.
      if (_priorStates) {
        const newlyComplete = [];
        ['prayer','memorization','session','journal','reading'].forEach(k => {
          if (_priorStates[k] !== 'complete' && state[k] === 'complete') newlyComplete.push(k);
          if (_priorStates[k] !== 'complete-no-question' && state[k] === 'complete-no-question') newlyComplete.push(k);
        });
        newlyComplete.forEach(k => {
          const rowId = (k === 'reading') ? '#mh-reading-card' : `#mh-row-${k}`;
          const rowEl = container.querySelector(rowId);
          _microCelebrate(rowEl);
        });
      }
    }
    _priorCompletedCount = state.completedCount;
    _priorStates = {
      reading: state.reading,
      prayer: state.prayer,
      memorization: state.memorization,
      session: state.session,
      journal: state.journal,
    };
  }

  async function refresh() {
    if (!_lastMountContainer || !_lastMountOptions) return;
    await mount(_lastMountContainer, _lastMountOptions);
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  const Missions = {
    getMissionsForDay,
    loadTodaysState,
    mount,
    refresh,
    _internals: {
      esc, _W, _dowET, _todayKey, _formatDayLabel,
      _readingFlagKey, _readingFlagSet, _hasQuestion,
      _gospelTeaser, _loadActiveSession, _loadDailyAnchorData,
      _loadJournaledToday, _loadReadCompleteToday, _sessionDoneToday,
      _renderEyebrow, _renderPilgrimageBanner,
      _renderReadingMissionShell, _readingPilgrimageHTML,
      _readingCompleteNoQuestionHTML, _renderMissionRow,
      _renderSessionRow, _renderProgress, _animateCountUp,
      _microCelebrate,
    },
  };

  if (typeof window !== 'undefined') window.Missions = Missions;
  if (typeof module !== 'undefined' && module.exports) module.exports = Missions;
})();
