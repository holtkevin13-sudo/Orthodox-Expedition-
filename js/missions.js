/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 4b + Chat 2A
   js/missions.js — Daily mission hub (Missions surface)
   May 11, 2026 · Chat 2A revision

   PURPOSE
   Renders the "Today's Missions" daily-action hub. Each mission
   row is a state-bearing surface; the reading mission is special:
   it hosts the Daily Anchor Card teaser (pending), an in-line
   two-stage reading+reflect form (read-not-reflected / reflected),
   or pilgrimage rest copy. Chat 2A also adds a fifth lane — the
   Day Complete bonus — and renames the T/Th 'journal' lane to
   'reflection', backed by the new reflection-lane.js module.

   IA POSITION
   • Home  → status & welcome dashboard
   • MISSIONS → daily action hub (this module)
   • Topics → study material + Feast of the Week
   • Scriptures → free reading (bible-reader, browsable)
   • Field Manual → past reflections archive

   The reading mission CARD hosts:
     - Daily Anchor Card  (js/daily-anchor-card.js)  pending state
     - In-line two-stage reflect form                read-not-reflected
     - Saved-state preview                           reflected
   The T/Th reflection slot hosts:
     - reflection-lane.js mount                      Chat 2A
   This module orchestrates; the lane modules execute.

   PUBLIC API (browser): window.Missions = { … }

     getMissionsForDay(dateString)
         → ['reading','prayer','memorization', slot4?, 'day_complete']
         M/W/F  : reading, prayer, memorization, session,    day_complete  (5/5)
         T/Th   : reading, prayer, memorization, reflection, day_complete  (5/5)
         Sat/Sun: reading, prayer, memorization,             day_complete  (4/4)

     loadTodaysState(sb, explorerId, familyId, today)
         → {
             reading:      'pending'|'read-not-reflected'|'reflected'|'pilgrimage',
             prayer:       'pending'|'complete'|'pilgrimage',
             memorization: 'pending'|'complete'|'not_applicable'|'pilgrimage',
             session:      'pending'|'complete'|'pilgrimage'|null,
             reflection:   'pending'|'complete'|'pilgrimage'|null,
             dayComplete:  'locked'|'unlock-pending'|'paid'|'pilgrimage'|null,
             pendingDayCompletePayout: bool,
             readingStageRow: reading_completions row|null,
             dayCompleteRow:  day_complete_bonus row|null,
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
    // Chat 2A · Lane structure:
    //   M/W/F  → reading, prayer, memo, session, day_complete    (5/5)
    //   T/Th   → reading, prayer, memo, reflection, day_complete (5/5)
    //   Sat/Sun → reading, prayer, memo, day_complete            (4/4)
    // Q7 ruling: weekend has no slot-4 task; Lord's Day rhythm is
    // honored by the 4/4 denominator. Day Complete is the FINAL
    // lane every day — on weekends it sits at slot 4 by position
    // (no missing slot, just a smaller denominator).
    const base = ['reading', 'prayer', 'memorization'];
    if (dow === 1 || dow === 3 || dow === 5) return base.concat(['session', 'day_complete']);   // M/W/F: 5/5
    if (dow === 2 || dow === 4) return base.concat(['reflection', 'day_complete']);              // T/Th : 5/5
    return base.concat(['day_complete']);                                                        // Sat/Sun: 4/4
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
          .like('id','00.%')
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

  // Did Nolan write a reflection today? (T/Th reflection mission state.)
  // Chat 2A: switches from category='expedition_log' + ILIKE pattern
  // to the new prescriptive category='session_reflection' per Q9 ruling.
  // Includes the skip-sentinel row (entry_text='[skipped — prompts
  // pending]') so the lane reads 'complete' on Tue/Thu even pre-2B.
  async function _loadReflectionToday(sb, explorerId, todayKey) {
    try {
      const [y, m, d] = todayKey.split('-').map(n => parseInt(n, 10));
      const dayStartET = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T00:00:00-04:00`;
      const dayEndET   = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T23:59:59-04:00`;

      const res = await sb.from('field_journal')
        .select('id')
        .eq('explorer_id', explorerId)
        .eq('category', 'session_reflection')
        .gte('created_at', dayStartET)
        .lte('created_at', dayEndET)
        .limit(1);

      if (res.error) throw res.error;
      return !!(res.data && res.data.length > 0);
    } catch (e) {
      console.warn('Missions._loadReflectionToday failed (graceful):', e);
      return false;
    }
  }

  // Chat 2A · Two-stage reading state loader.
  // Returns the full reading_completions row for today (or null) so
  // the caller can distinguish:
  //   • row == null               → state 'pending' (or 'pilgrimage')
  //   • row.read_at && !reflected_at → state 'read-not-reflected'
  //   • row.read_at && row.reflected_at → state 'reflected'
  // The flagSet localStorage check remains a fallback for the first
  // ever Stage-1 commit (the moment after Nolan returns from
  // bible-reader, before the DB row exists). commitReadCompletion
  // clears the flag, so DB is the source of truth thereafter.
  async function _loadReadingStageRow(sb, explorerId, todayKey) {
    try {
      const res = await sb.from('reading_completions')
        .select('id, read_at, reflected_at, coins_earned, reflection_text, skipped_pastorally')
        .eq('explorer_id', explorerId)
        .eq('calendar_date', todayKey)
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data || null;
    } catch (e) {
      console.warn('Missions._loadReadingStageRow failed (graceful):', e);
      return null;
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

  // Chat 2A · Has the Day Complete bonus already been awarded today?
  // Idempotent guard for the +10 payout. Returns the row when present
  // (so the caller can render the unlocked Day Complete lane with the
  // canonical awarded_at), else null.
  async function _loadDayCompleteToday(sb, explorerId, todayKey) {
    try {
      const res = await sb.from('day_complete_bonus')
        .select('id, awarded_at, coins_earned')
        .eq('explorer_id', explorerId)
        .eq('calendar_date', todayKey)
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data || null;
    } catch (e) {
      console.warn('Missions._loadDayCompleteToday failed (graceful):', e);
      return null;
    }
  }

  // Chat 2A · Commit the Day Complete bonus (+10 coins) idempotently.
  // Pattern mirrors ReadingQuest.commitCompletion: INSERT first, then
  // award coins; a 23505 unique-violation = already paid today, no
  // coins awarded on the retry path. Caller invokes ONLY on the
  // transition from "not all complete" → "all complete" detected at
  // mount time, but the UNIQUE constraint is the canonical guard.
  // Returns { ok, duplicate, row }.
  async function _commitDayCompleteBonus(sb, explorerId, familyId, todayKey) {
    if (!sb || !explorerId || !familyId || !todayKey) {
      return { ok: false, duplicate: false, row: null };
    }
    try {
      const insertRes = await sb.from('day_complete_bonus')
        .insert({
          explorer_id:   explorerId,
          family_id:     familyId,
          calendar_date: todayKey,
          coins_earned:  10,
        })
        .select()
        .single();
      if (insertRes.error) {
        const isDup = (insertRes.error.code === '23505') ||
                      (insertRes.error.message && /duplicate/i.test(insertRes.error.message));
        if (isDup) return { ok: false, duplicate: true, row: null };
        console.warn('Missions._commitDayCompleteBonus insert error:', insertRes.error);
        return { ok: false, duplicate: false, row: null };
      }
      // Award +10 coins via the canonical read-then-write pattern.
      try {
        const profRes = await sb.from('profiles')
          .select('coins, lifetime_coins')
          .eq('id', explorerId)
          .single();
        const prof = profRes.data || { coins: 0, lifetime_coins: 0 };
        await sb.from('profiles').update({
          coins:          (prof.coins          || 0) + 10,
          lifetime_coins: (prof.lifetime_coins || 0) + 10,
        }).eq('id', explorerId);
      } catch (coinErr) {
        console.warn('Missions._commitDayCompleteBonus coin award failed (non-fatal):', coinErr);
      }
      return { ok: true, duplicate: false, row: insertRes.data };
    } catch (e) {
      console.warn('Missions._commitDayCompleteBonus threw:', e);
      return { ok: false, duplicate: false, row: null };
    }
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
      readingStageRow,
      anchorData,
      activeSession,
      reflectionDone,
      dayCompleteRow,
    ] = await Promise.all([
      window.Pilgrimages && typeof window.Pilgrimages.isActiveToday === 'function'
        ? window.Pilgrimages.isActiveToday(sb).catch(() => null) : Promise.resolve(null),
      window.Prayers && typeof window.Prayers.getTodayStatus === 'function'
        ? window.Prayers.getTodayStatus(sb, explorerId).catch(() => ({morning:false,evening:false})) : Promise.resolve({morning:false,evening:false}),
      window.Memorization && typeof window.Memorization.didTodayCount === 'function'
        ? window.Memorization.didTodayCount(sb, explorerId).catch(() => false) : Promise.resolve(false),
      window.Memorization && typeof window.Memorization.getCurrentVerse === 'function'
        ? window.Memorization.getCurrentVerse(sb, familyId).catch(() => null) : Promise.resolve(null),
      _loadReadingStageRow(sb, explorerId, today),
      _loadDailyAnchorData(sb, today),
      _loadActiveSession(sb, explorerId),
      missionsForDay.indexOf('reflection') >= 0
        ? _loadReflectionToday(sb, explorerId, today) : Promise.resolve(false),
      missionsForDay.indexOf('day_complete') >= 0
        ? _loadDayCompleteToday(sb, explorerId, today) : Promise.resolve(null),
    ]);

    const isPilgrimage = !!pilgrimageActive;

    // ── Resolve each mission's state ──────────────────────────────

    // Reading mission state machine (Chat 2A two-stage).
    //   pilgrimage → 'pilgrimage'
    //   DB row with reflected_at → 'reflected'  (Stage 2 done)
    //   DB row with only read_at → 'read-not-reflected'  (Stage 1 done)
    //   Flag set but no row     → 'read-not-reflected' transient;
    //                              mount() commits Stage 1 + refreshes
    //   Otherwise               → 'pending'
    let readingState;
    if (isPilgrimage) {
      readingState = 'pilgrimage';
    } else if (readingStageRow && readingStageRow.reflected_at) {
      readingState = 'reflected';
    } else if (readingStageRow && readingStageRow.read_at) {
      readingState = 'read-not-reflected';
    } else if (_readingFlagSet(today)) {
      readingState = 'read-not-reflected';
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

    // Reflection mission state (T/Th only; Chat 2A rename of 'journal').
    // 'reflectionDone' = true when ANY session_reflection field_journal
    // row exists for today (including the skip sentinel).
    let reflectionState;
    if (missionsForDay.indexOf('reflection') < 0) {
      reflectionState = null;
    } else if (isPilgrimage) {
      reflectionState = 'pilgrimage';
    } else if (reflectionDone) {
      reflectionState = 'complete';
    } else {
      reflectionState = 'pending';
    }

    // Day Complete state (Chat 2A, every day).
    //   pilgrimage → 'pilgrimage' (no payout; pilgrimage is rest)
    //   bonus row exists → 'paid'
    //   all other lanes complete and no bonus row → 'unlock-pending'
    //                       (mount() commits +10 and refreshes)
    //   else → 'locked'
    let dayCompleteState;
    let pendingDayCompletePayout = false;
    if (missionsForDay.indexOf('day_complete') < 0) {
      dayCompleteState = null;
    } else if (isPilgrimage) {
      dayCompleteState = 'pilgrimage';
    } else if (dayCompleteRow) {
      dayCompleteState = 'paid';
    } else {
      const otherStates = [readingState, prayerState, memState, sessionState, reflectionState];
      function _isTaskComplete(s) {
        return s === 'complete' || s === 'reflected' || s === 'pilgrimage';
      }
      const allOtherComplete = otherStates.every(s => s === null || s === 'not_applicable' || _isTaskComplete(s));
      if (allOtherComplete) {
        dayCompleteState = 'unlock-pending';
        pendingDayCompletePayout = true;
      } else {
        dayCompleteState = 'locked';
      }
    }

    // ── Tally completed / total for the progress card ─────────────
    // Pilgrimage: every lane reads 'pilgrimage' so completedCount =
    // totalCount (full bar). Otherwise: tally non-applicable as both
    // numerator- and denominator-exempt. New finishing states:
    //   • 'reflected'      → reading two-stage final
    //   • 'paid'           → Day Complete bonus already awarded
    //   • 'unlock-pending' → bonus about to commit; count as done
    //                        so the progress card doesn't briefly
    //                        flash an intermediate "n-1 of n" frame
    let completedCount = 0;
    let totalCount = 0;
    function tally(state) {
      if (state == null || state === 'not_applicable') return; // skip
      totalCount++;
      if (state === 'complete' ||
          state === 'reflected' ||
          state === 'pilgrimage' ||
          state === 'paid' ||
          state === 'unlock-pending') {
        completedCount++;
      }
    }
    tally(readingState);
    tally(prayerState);
    tally(memState);
    tally(sessionState);
    tally(reflectionState);
    tally(dayCompleteState);

    return {
      reading: readingState,
      prayer:  prayerState,
      memorization: memState,
      session: sessionState,
      reflection: reflectionState,
      dayComplete: dayCompleteState,
      pendingDayCompletePayout,
      readingStageRow,
      dayCompleteRow,
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

  // ★ ORPHANED BY CHAT 2A — kept defined for rollback safety only.
  // Previously rendered the "✓ Today's Gospel — read · +5" mini-card
  // for no-question days. The Chat 2A two-stage reading model
  // (read +3 / reflect +2) supersedes it; mount() no longer calls
  // this function and it is not exported via _internals. Removal
  // can happen in a future cleanup dispatch once Chat 2A is
  // verified stable in production.
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
  // CHAT 2A · NEW RENDER HELPERS
  //   • Reading two-stage in-line states (read-not-reflected, reflected)
  //   • Day Complete lane (lane 5; distinct from task rows)
  // ═════════════════════════════════════════════════════════════════

  // Build the gospel reference string from a liturgical_calendar row's
  // daily_readings.gospel. e.g. "John 11:47-54" or "John 14" when
  // verses absent. Returns '' when unavailable.
  function _gospelRefFromRow(row) {
    const g = (row && row.daily_readings && row.daily_readings.gospel) || null;
    if (!g) return '';
    const book = g.book_name || g.book_code || '';
    const ch = g.chapter;
    if (!book || ch == null || ch === '') return '';
    const vs = g.verse_start;
    const ve = g.verse_end;
    const vsOk = (vs !== null && vs !== undefined && vs !== '' && Number(vs) > 0);
    const veOk = (ve !== null && ve !== undefined && ve !== '' && Number(ve) > 0);
    if (vsOk && veOk) return `${book} ${ch}:${vs}-${ve}`;
    return `${book} ${ch}`;
  }

  // ★ READING — Stage-1-done, Stage-2-pending inline card.
  // Shows: ✓ gospel read pip (link back to re-read), reflection prompt,
  // textarea, submit button. Submit is the Stage 2 commit path.
  function _renderReadingReadNotReflectedHTML(opts) {
    const promptText = (opts && opts.promptText) || '';
    const gospelHref = _buildGospelHref(opts && opts.row);
    const gospelRef  = _gospelRefFromRow(opts && opts.row);
    const refLabel   = gospelRef ? esc(gospelRef) : 'Today\'s Gospel';
    return `
      <div class="mh-reading-stage" data-stage="read-not-reflected">
        <a class="mh-reading-readpip" href="${esc(gospelHref)}">
          <span class="mh-rrp-check" aria-hidden="true">✓</span>
          <span class="mh-rrp-label">${refLabel} &middot; read</span>
          <span class="mh-rrp-coins" aria-label="3 coins earned">+3</span>
        </a>
        ${promptText ? `
          <div class="mh-reading-prompt-block">
            <div class="mh-portrait-block">
              <img class="mh-portrait" src="/Orthodox-Expedition-/assets/characters/theo-portrait.png" alt="Theo">
              <div class="mh-portrait-speaker">Theo asks…</div>
            </div>
            <div class="mh-rrp-text">${esc(promptText)}</div>
          </div>
        ` : ''}
        <div class="mh-reading-input-block">
          <label class="mh-rri-label" for="mh-reading-textarea">Your reflection</label>
          <textarea
            id="mh-reading-textarea"
            class="mh-reading-textarea"
            rows="3"
            placeholder="Even a sentence is enough…"
            aria-describedby="mh-reading-input-help"
          ></textarea>
          <div id="mh-reading-input-help" class="mh-rri-help">+2 coins on save (gospel reading totals +5).</div>
          <button type="button" class="mh-reading-submit-btn" data-mh-action="reflect-submit" disabled>Save reflection</button>
        </div>
      </div>
    `;
  }

  // ★ READING — fully reflected card (Stage 1 + Stage 2 both done).
  // Shows the gospel pip (still tappable to re-read) and the saved
  // reflection text in a collapsed preview.
  function _renderReadingReflectedHTML(opts) {
    const reflectionText = String((opts && opts.reflectionText) || '').trim();
    const gospelHref = _buildGospelHref(opts && opts.row);
    const gospelRef  = _gospelRefFromRow(opts && opts.row);
    const refLabel   = gospelRef ? esc(gospelRef) : 'Today\'s Gospel';
    const preview    = reflectionText
      ? `<div class="mh-reading-saved-text">${esc(reflectionText)}</div>`
      : '';
    return `
      <div class="mh-reading-stage" data-stage="reflected">
        <a class="mh-reading-readpip" href="${esc(gospelHref)}">
          <span class="mh-rrp-check" aria-hidden="true">✓</span>
          <span class="mh-rrp-label">${refLabel} &middot; read</span>
        </a>
        <div class="mh-reading-saved">
          <div class="mh-reading-saved-eyebrow">Reflection saved &middot; <span class="mh-rrp-coins">+5 total</span></div>
          ${preview}
        </div>
      </div>
    `;
  }

  // ★ DAY COMPLETE LANE — slot 5 (or slot 4 on Sat/Sun). Distinct
  // visual from the task rows: ✦-glyph centered, gold gradient,
  // celebratory but not loud. States:
  //   'locked'         → dimmed placeholder, eyebrow-only
  //   'unlock-pending' → rendered like 'paid'; mount() commits
  //   'paid'           → unlocked celebration (✦ + +10 pip)
  //   'pilgrimage'     → ✦ rest tile, no coins
  function _renderDayCompleteLane(state) {
    if (state === 'pilgrimage') {
      return `
        <div class="mh-daycomplete mh-dc-pilgrimage" id="mh-row-day_complete">
          <div class="mh-dc-glyph" aria-hidden="true">✦</div>
          <div class="mh-dc-body">
            <div class="mh-dc-title">Day Complete</div>
            <div class="mh-dc-sub">Pilgrimage rest — your streak walks with you.</div>
          </div>
        </div>
      `;
    }
    if (state === 'paid' || state === 'unlock-pending') {
      return `
        <div class="mh-daycomplete mh-dc-paid" id="mh-row-day_complete" data-state="${esc(state)}">
          <div class="mh-dc-glyph" aria-hidden="true">✦</div>
          <div class="mh-dc-body">
            <div class="mh-dc-title">Day Complete</div>
            <div class="mh-dc-sub">All missions offered today. Glory to God for all things.</div>
          </div>
          <div class="mh-dc-coins" aria-label="10 coin bonus">+10</div>
        </div>
      `;
    }
    // locked (default)
    return `
      <div class="mh-daycomplete mh-dc-locked" id="mh-row-day_complete">
        <div class="mh-dc-glyph" aria-hidden="true">✦</div>
        <div class="mh-dc-body">
          <div class="mh-dc-title">Day Complete</div>
          <div class="mh-dc-sub">Finish today's missions to unlock the +10 bonus.</div>
        </div>
        <div class="mh-dc-lock" aria-hidden="true">🔒</div>
      </div>
    `;
  }

  // ★ REFLECTION SLOT SHELL — empty container that ReflectionLane
  // mounts into post-render. Single inline DOM node keyed off the
  // lane id so we can find it from mount() and pass it to
  // ReflectionLane.mount(slotEl, opts).
  function _renderReflectionSlotShell() {
    return `<div class="mh-reflection-slot" id="mh-reflection-slot"></div>`;
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

    // Build HTML (Chat 2A lane order):
    //   1. Eyebrow + pilgrimage banner
    //   2. Reading mission shell (★ prominent)
    //   3. Prayer row
    //   4. Memorization row
    //   5. Slot 4 — Session (M/W/F) OR Reflection slot shell (T/Th) OR absent (Sat/Sun)
    //   6. Day Complete lane (every day)
    //   7. Progress card
    const parts = [];
    parts.push(_renderEyebrow(today));
    parts.push(_renderPilgrimageBanner(state.pilgrimage));
    parts.push(_renderReadingMissionShell(state.reading));

    parts.push(_renderMissionRow({
      id: 'prayer',
      href: 'prayers.html?pray=' + (window.WeekUtils && window.WeekUtils.hourET(new Date()) < 12 ? 'morning' : 'evening'),
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

    // Reflection slot (T/Th only) — ReflectionLane.mount() fills it
    // post-renderInnerHTML. Slot is empty in markup; module owns
    // everything inside #mh-reflection-slot.
    if (state.reflection !== null) {
      parts.push(_renderReflectionSlotShell());
    }

    // Day Complete lane (every day).
    if (state.dayComplete !== null) {
      parts.push(_renderDayCompleteLane(state.dayComplete));
    }

    parts.push(_renderProgress(state.completedCount, state.totalCount, !!state.pilgrimage));

    container.innerHTML = parts.join('');

    // ── Mount the inner reading-mission content per state ────────
    const innerSlot = container.querySelector('#mh-reading-content');
    if (innerSlot) {
      if (state.reading === 'pilgrimage') {
        innerSlot.innerHTML = _readingPilgrimageHTML();
      } else if (state.reading === 'pending') {
        // Pending → DailyAnchorCard (gospel teaser + tap-to-read).
        // Tap on the gospel link sets the localStorage flag on close
        // (via bible-reader's pagehide hook). On the next mount the
        // flag flips state to 'read-not-reflected' and we commit
        // Stage 1 here.
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
      } else if (state.reading === 'read-not-reflected') {
        // Stage-1-done, Stage-2-pending. If readingStageRow is null,
        // the localStorage flag is the only "read" signal — fire
        // commitReadCompletion (Stage 1) which writes the DB row,
        // awards +3, and clears the flag (DB becomes source of truth).
        const needsStage1Commit = !state.readingStageRow;
        if (needsStage1Commit
            && window.ReadingQuest
            && typeof window.ReadingQuest.commitReadCompletion === 'function') {
          try {
            await window.ReadingQuest.commitReadCompletion(sb, {
              explorerId, familyId, today, coins: 3,
            });
          } catch (e) {
            console.warn('ReadingQuest.commitReadCompletion failed (graceful):', e);
          }
        }
        innerSlot.innerHTML = _renderReadingReadNotReflectedHTML({
          row: state.readingAnchorRow,
          promptText: state.todaysPrompt,
        });
        _wireReadingReflectSubmit(innerSlot, {
          sb, explorerId, familyId, today,
          gospelRef: _gospelRefFromRow(state.readingAnchorRow),
        });
      } else if (state.reading === 'reflected') {
        innerSlot.innerHTML = _renderReadingReflectedHTML({
          row: state.readingAnchorRow,
          reflectionText: (state.readingStageRow && state.readingStageRow.reflection_text) || '',
        });
      }
    }

    // ── Mount the reflection lane (T/Th only) ─────────────────────
    const reflectionSlot = container.querySelector('#mh-reflection-slot');
    if (reflectionSlot && state.reflection !== null
        && window.ReflectionLane && typeof window.ReflectionLane.mount === 'function') {
      const dayKind = (dow === 2) ? 'tue' : (dow === 4) ? 'thu' : null;
      try {
        await window.ReflectionLane.mount(reflectionSlot, {
          sb, explorerId, familyId, today,
          dayKind,
          sessionId:    state.activeSession ? state.activeSession.id : null,
          sessionTitle: state.activeSession ? state.activeSession.title : null,
          isPilgrimage: !!state.pilgrimage,
          onComplete:   refresh,
        });
      } catch (e) {
        console.warn('ReflectionLane.mount failed (graceful):', e);
      }
    }

    // ── Day Complete bonus payout (idempotent on transition) ─────
    // When all other lanes are complete and no day_complete_bonus row
    // exists yet, the state machine flagged pendingDayCompletePayout.
    // Commit +10 coins (UNIQUE constraint handles race) and trigger
    // a refresh so the lane re-renders in 'paid' state.
    if (state.pendingDayCompletePayout) {
      try {
        const res = await _commitDayCompleteBonus(sb, explorerId, familyId, today);
        if (res && (res.ok || res.duplicate)) {
          // Tail-call refresh — recursion is bounded: after this
          // commit, dayCompleteRow exists so pendingDayCompletePayout
          // is false on the next loadTodaysState pass.
          await refresh();
          return;
        }
      } catch (e) {
        console.warn('Day Complete bonus commit failed (graceful):', e);
      }
    }

    // ── 10/10 polish: count-up animation + micro-celebration ─────
    // If we re-entered Missions and the completed count went up,
    // animate the number and flash the newly-completed row(s).
    if (_priorCompletedCount !== null && state.completedCount > _priorCompletedCount) {
      const numEl = container.querySelector('#mh-pc-num');
      _animateCountUp(numEl, _priorCompletedCount, state.completedCount);
      if (_priorStates) {
        const newlyComplete = [];
        // Per-lane transition keys. The 'reading' key transitions to
        // 'reflected' (final state in two-stage). 'dayComplete' transitions
        // to 'paid' on bonus payout.
        ['prayer','memorization','session','reflection','reading','dayComplete'].forEach(k => {
          const prev = _priorStates[k];
          const cur  = state[k];
          if (prev === cur) return;
          if (cur === 'complete' || cur === 'reflected' || cur === 'paid') {
            newlyComplete.push(k);
          }
        });
        newlyComplete.forEach(k => {
          let rowId;
          if (k === 'reading') rowId = '#mh-reading-card';
          else if (k === 'dayComplete') rowId = '#mh-row-day_complete';
          else rowId = `#mh-row-${k}`;
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
      reflection: state.reflection,
      dayComplete: state.dayComplete,
    };
  }

  // ── Wire the Stage-2 (reflect) submit handler on the in-line card.
  // Mirrors ReflectionLane's submit pattern: enable on non-empty input,
  // disable + label "Saving…" during the write, on success call
  // ReadingQuest.commitReflectCompletion and refresh the hub. Failure
  // re-enables with an inline soft error.
  function _wireReadingReflectSubmit(innerSlot, ctx) {
    const ta  = innerSlot.querySelector('#mh-reading-textarea');
    const btn = innerSlot.querySelector('[data-mh-action="reflect-submit"]');
    if (!ta || !btn) return;
    function refreshEnabled() {
      const v = String(ta.value || '').trim();
      btn.disabled = (v.length === 0);
    }
    ta.addEventListener('input', refreshEnabled);
    refreshEnabled();
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      const text = String(ta.value || '').trim();
      if (!text) return;
      btn.disabled = true;
      btn.textContent = 'Saving…';
      try {
        if (!window.ReadingQuest || typeof window.ReadingQuest.commitReflectCompletion !== 'function') {
          throw new Error('ReadingQuest.commitReflectCompletion unavailable');
        }
        const res = await window.ReadingQuest.commitReflectCompletion(ctx.sb, {
          explorerId:      ctx.explorerId,
          today:           ctx.today,
          reflectionText:  text,
          gospelRef:       ctx.gospelRef || null,
          coinsDelta:      2,
          cumulativeCoins: 5,
        });
        if (res && (res.ok || res.alreadyReflected)) {
          await refresh();
          return;
        }
        throw new Error('commitReflectCompletion returned not-ok');
      } catch (err) {
        console.warn('reading Stage 2 submit failed:', err);
        btn.disabled = false;
        btn.textContent = 'Save reflection';
        let errEl = innerSlot.querySelector('.mh-reading-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.className = 'mh-reading-error';
          errEl.setAttribute('role', 'alert');
          btn.parentNode.insertBefore(errEl, btn.nextSibling);
        }
        errEl.textContent = 'Saving failed — please try again.';
      }
    });
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
      _loadReflectionToday, _loadReadingStageRow,
      _loadDayCompleteToday, _commitDayCompleteBonus,
      _sessionDoneToday,
      _renderEyebrow, _renderPilgrimageBanner,
      _renderReadingMissionShell, _readingPilgrimageHTML,
      _renderMissionRow, _renderSessionRow, _renderProgress,
      _animateCountUp, _microCelebrate,
      _gospelRefFromRow,
      _renderReadingReadNotReflectedHTML,
      _renderReadingReflectedHTML,
      _renderDayCompleteLane,
      _renderReflectionSlotShell,
      _wireReadingReflectSubmit,
    },
  };

  if (typeof window !== 'undefined') window.Missions = Missions;
  if (typeof module !== 'undefined' && module.exports) module.exports = Missions;
})();
