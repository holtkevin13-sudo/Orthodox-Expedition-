/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 4b + Chat 2A + Chat 20-IMPL-A
                       + Wave 2 Lead + Chat 20-IMPL-B
   js/missions.js — Daily mission hub (Missions surface)
   May 13, 2026 · Chat 20-IMPL-B revision

   PURPOSE
   Renders the "Today's Missions" daily-action hub. Each mission
   row is a state-bearing surface. After Chat 20-IMPL-A, all five
   lanes (M/W/F) or four lanes (T/Th/Sat/Sun) render as UNIFORM
   trail-marker rows — same icon-name-sub-coins-indicator grammar,
   tap-to-leave behavior.

   Chat 20-IMPL-B (May 13, 2026) MIGRATED the Reading-lane Stage 2
   reflect surface (textarea + submit + skip) FROM this module's
   inline expand panel INTO bible-reader.html where the Gospel is
   still visible while Nolan reflects. The atomic +5 commit (read
   + reflect in a single INSERT) lives in js/reading-reflect-panel.js.
   The localStorage flag dance (oe_bible_reader_visited_*) is
   retired. Reading state on Missions hub simplifies to:
     pending | reflected | pilgrimage
   The 'read-not-reflected' state is no longer possible — by the
   time a reading_completions row exists for today, Nolan has
   either fully reflected (atomic path) or recorded the reading
   alone via "Just record the reading" (skip-pastorally, +3, lane
   closes per OQ-1 ruling A). Either way the row → 'reflected'.

   The Day Complete lane is replaced by a TROPHY CHIP (.mh-trophy)
   with three visual states (locked / unlock-pending / paid) plus
   pilgrimage. The locked → paid transition fires a celebration
   choreography: chip morph + coin-rain + iOS haptic + counter
   advance + +10 toast + coin-strip tick.

   Wave 2 Lead REINSTATES the T/Th journaling lane as
   "Session Journal" — distinct from the reading reflection (which
   is the +2 Stage 2 of the Reading lane and uses generic prompts
   from journal_prompts). Session Journal uses SESSION-SPECIFIC
   prompts from session_reflection_prompts, awards +5 on text
   submission, writes to field_journal with the canonical
   category='session_reflection'. Day cadence after Wave 2:
     M/W/F  : reading, prayer, memo, session,         trophy (5/5)
     T/Th   : reading, prayer, memo, session_journal, trophy (5/5)
     Sat/Sun: reading, prayer, memo,                  trophy (4/4)
   The retired-then-revived data layer lives in js/reflection-lane.js
   (loadPrompt / getTodayEntry / saveEntry); this module owns the
   trail-marker chrome + inline expand panel for visual parity with
   the reading lane. Existing field_journal rows with
   category='session_reflection' from before Wave 2 remain visible
   in journal.html (preserved historical artifact).

   The progress counter relocates from BOTTOM of the panel to the
   eyebrow band at TOP — momentum-during-work, not reward-after-
   work (Phase 1 friction #8).

   The topmost incomplete lane gets a subtle gold pulse (.mh-row-
   next-up, 2.8s loop) — quiet executive-function scaffolding,
   honors prefers-reduced-motion with a static brighter border.

   IA POSITION
   • Home  → status & welcome dashboard
   • MISSIONS → daily action hub (this module)
   • Topics → study material + Feast of the Week
   • Scriptures → free reading (bible-reader, browsable)
   • Field Manual → past reflections archive

   PUBLIC API (browser): window.Missions = { … }

     getMissionsForDay(dateString)
         → ['reading','prayer','memorization', slot4?, 'day_complete']
         M/W/F  : reading, prayer, memo, session,         day_complete  (5/5)
         T/Th   : reading, prayer, memo, session_journal, day_complete  (5/5)
         Sat/Sun: reading, prayer, memo,                  day_complete  (4/4)

     loadTodaysState(sb, explorerId, familyId, today)
         → {
             reading:        'pending'|'reflected'|'pilgrimage',
             prayer:         'pending'|'complete'|'pilgrimage',
             memorization:   'pending'|'complete'|'not_applicable'|'pilgrimage',
             session:        'pending'|'complete'|'pilgrimage'|null,
             sessionJournal: 'pending'|'complete'|'pilgrimage'|null,
             dayComplete:    'locked'|'unlock-pending'|'paid'|'pilgrimage'|null,
             pendingDayCompletePayout: bool,
             readingStageRow: reading_completions row|null,
             dayCompleteRow:  day_complete_bonus row|null,
             sessionJournalEntryRow: field_journal row|null,
             sessionJournalPrompt:   session_reflection_prompts row|null,
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
     ReadingQuest — commitReadCompletion / commitReflectCompletion
                    (Stage 1 / Stage 2 coin commits; preserved
                     verbatim until 20-IMPL-B moves the reflect
                     surface into bible-reader.html)
     ReflectionLane — loadPrompt / getTodayEntry / saveEntry
                    (Wave 2 Lead — pure-data helpers for the
                     reinstated T/Th Session Journal lane)
     (DailyAnchorCard module remains loaded but is no longer
      consumed by this surface in 20-IMPL-A. Render path simplifies
      to a self-contained trail-marker row sub-line.)
     (Wave 2 Lead: ReflectionLane is reloaded by missions.html; its
      mount() is no longer called, but its pure-data helpers power
      the inline Session Journal lane chrome owned by this module.)

   Op Learnings honored:
     #1  Surgical str_replace — render-path rewrite, data-layer
         preserved
     #4  Schema-first — reading_completions, day_complete_bonus,
         field_journal shapes unchanged
     #7  ET timezone via WeekUtils
     #13 Staged deliverables
     #15 CSS rules over UA [hidden]: style="display:none" toggle
     #16 Structural mirror — trail-marker row pattern uniform
         across all lanes
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

  // Chat 20-IMPL-B: _readingFlagKey + _readingFlagSet retired with
  // the oe_bible_reader_visited_* flag. The reading_completions
  // row is now the sole source of truth for Reading lane state.

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
    // Wave 2 Lead · Lane structure (Session Journal lane reinstated
    // on T/Th, Curriculum lane daily +5 wired upstream at the
    // session-day event source):
    //   M/W/F   → reading, prayer, memo, session,         day_complete (5/5)
    //   T/Th    → reading, prayer, memo, session_journal, day_complete (5/5)
    //   Sat/Sun → reading, prayer, memo,                  day_complete (4/4)
    // Q7 ruling preserved: weekend has no slot-4 task; Lord's Day
    // rhythm honored by the 4/4 denominator. The trophy chip (Day
    // Complete) is the FINAL lane every day — on 4/4 days it sits
    // at slot 4 by position; no missing slot, just a smaller
    // denominator. Trophy unlock-pending detection runs across all
    // OTHER lanes (taskCount = totalCount-1), so the trophy locked
    // sub-line auto-reads "unlock at 4/4" on M/W/F + T/Th and
    // "unlock at 3/3" on Sat/Sun without further branching here.
    const base = ['reading', 'prayer', 'memorization'];
    if (dow === 1 || dow === 3 || dow === 5) return base.concat(['session', 'day_complete']);          // M/W/F: 5/5
    if (dow === 2 || dow === 4)               return base.concat(['session_journal', 'day_complete']); // T/Th : 5/5
    return base.concat(['day_complete']);                                                              // Sat/Sun: 4/4
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

  // (Chat 20-IMPL-A: _loadReflectionToday helper removed — T/Th
  // reflection lane retired. Existing field_journal rows with
  // category='session_reflection' remain visible in journal.html;
  // we simply no longer create new ones from this surface.)

  // Chat 20-IMPL-B · Reading state loader.
  // Returns the full reading_completions row for today (or null) so
  // the caller can distinguish:
  //   • row == null               → state 'pending' (or 'pilgrimage')
  //   • row exists                → state 'reflected'
  // Per OQ-1 ruling A, BOTH the atomic happy-path (read_at +
  // reflected_at + reflection_text) and the skip-pastorally path
  // (read_at only) close the lane for the day. Either row →
  // 'reflected' on the Missions hub.
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
  // WAVE 2 LEAD · SESSION JOURNAL LANE HELPERS  (T/Th only)
  // ═════════════════════════════════════════════════════════════════
  // The Session Journal lane reinstates the retired T/Th journaling
  // slot. Data layer lives in js/reflection-lane.js (Wave 2 Lead-
  // exposed pure-data helpers: loadPrompt, getTodayEntry, saveEntry).
  // The trail-marker chrome + inline expand panel live here for
  // visual parity with the other IMPL-A lanes (.mh-reading-* family).

  // Resolve 'tue' | 'thu' | null from an ET dow integer (0=Sun..6=Sat).
  function _dayKindFromDow(dow) {
    if (dow === 2) return 'tue';
    if (dow === 4) return 'thu';
    return null;
  }

  // Did Nolan write a Session Journal entry today? Delegates to
  // ReflectionLane.getTodayEntry, which performs an ET-day-bounded
  // SELECT on field_journal where category='session_reflection'.
  // Returns the entry row | null. Graceful null when ReflectionLane
  // module is not loaded.
  async function _loadTodaysSessionJournal(sb, explorerId, todayKey) {
    if (typeof window === 'undefined' || !window.ReflectionLane
        || typeof window.ReflectionLane.getTodayEntry !== 'function') {
      return null;
    }
    try {
      return await window.ReflectionLane.getTodayEntry(sb, explorerId, todayKey);
    } catch (e) {
      console.warn('Missions._loadTodaysSessionJournal failed (graceful):', e);
      return null;
    }
  }

  // Fetch the Session Journal prompt row for the given session + day
  // kind. Returns { id, prompt_text, display_order } | null. Graceful
  // null when ReflectionLane module is not loaded, when sessionId is
  // unknown, or when no active prompt is seeded for this slot
  // (pre-content-seeding fallback — Topic 00 corpus has all 30
  // (15×2) rows active as of May 13, 2026).
  async function _loadSessionJournalPrompt(sb, sessionId, dayKind) {
    if (!sessionId || (dayKind !== 'tue' && dayKind !== 'thu')) return null;
    if (typeof window === 'undefined' || !window.ReflectionLane
        || typeof window.ReflectionLane.loadPrompt !== 'function') {
      return null;
    }
    try {
      return await window.ReflectionLane.loadPrompt(sb, sessionId, dayKind);
    } catch (e) {
      console.warn('Missions._loadSessionJournalPrompt failed (graceful):', e);
      return null;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC: loadTodaysState
  // ═════════════════════════════════════════════════════════════════

  async function loadTodaysState(sb, explorerId, familyId, today) {
    today = today || _todayKey();
    const dow = _dowET(new Date());
    const dayKind = _dayKindFromDow(dow);
    const missionsForDay = getMissionsForDay(today);

    // Parallel: pilgrimage check + lane data
    // Chat 20-IMPL-A: reflectionDone fetch removed (T/Th reflection
    // lane retired). Day Complete remains last in the parallel list.
    // Wave 2 Lead: sessionJournalEntryRow rejoins the parallel list,
    // gated on T/Th (returns null on M/W/F/Sat/Sun).
    const [
      pilgrimageActive,
      prayerStatus,
      memDidToday,
      currentVerse,
      readingStageRow,
      anchorData,
      activeSession,
      dayCompleteRow,
      sessionJournalEntryRow,
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
      missionsForDay.indexOf('day_complete') >= 0
        ? _loadDayCompleteToday(sb, explorerId, today) : Promise.resolve(null),
      missionsForDay.indexOf('session_journal') >= 0
        ? _loadTodaysSessionJournal(sb, explorerId, today) : Promise.resolve(null),
    ]);

    const isPilgrimage = !!pilgrimageActive;

    // ── Resolve each mission's state ──────────────────────────────

    // Reading mission state machine (Chat 20-IMPL-B — simplified).
    //   pilgrimage → 'pilgrimage'
    //   Any row in reading_completions for today → 'reflected'
    //     Per OQ-1 ruling A: both the atomic happy-path (+5, read_at
    //     + reflected_at) and the skip-pastorally path (+3, read_at
    //     only) CLOSE the lane for the day. The Reading row on the
    //     Missions hub shows ✓ complete in either case. Re-visit to
    //     bible-reader same day renders a read-only "Today's
    //     reflection" or skip-closed gentle note tile.
    //   Otherwise → 'pending'
    let readingState;
    if (isPilgrimage) {
      readingState = 'pilgrimage';
    } else if (readingStageRow) {
      readingState = 'reflected';
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

    // Reflection mission state (T/Th) — RETIRED per Chat 20-IMPL-A,
    // RE-PROVISIONED as 'sessionJournal' below per Wave 2 Lead.
    // The legacy state.reflection key is no longer populated and is
    // removed from the return shape; downstream code reads
    // state.sessionJournal instead.

    // Session Journal lane state (Wave 2 Lead, T/Th only).
    //   not in missionsForDay → null (M/W/F + Sat/Sun)
    //   pilgrimage → 'pilgrimage' (no submit UI, no +5 paid)
    //   field_journal entry exists for today → 'complete'
    //   otherwise → 'pending'
    let sessionJournalState;
    if (missionsForDay.indexOf('session_journal') < 0) {
      sessionJournalState = null;
    } else if (isPilgrimage) {
      sessionJournalState = 'pilgrimage';
    } else if (sessionJournalEntryRow) {
      sessionJournalState = 'complete';
    } else {
      sessionJournalState = 'pending';
    }

    // Sequential follow-up: fetch the prompt only when we need it
    // for render (state is 'pending' AND we know which session is
    // active). One extra round-trip on T/Th-pending days; skipped
    // on M/W/F/Sat/Sun and on T/Th when already complete/pilgrimage.
    let sessionJournalPrompt = null;
    if (sessionJournalState === 'pending' && activeSession && dayKind) {
      sessionJournalPrompt = await _loadSessionJournalPrompt(sb, activeSession.id, dayKind);
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
      // Wave 2 Lead: sessionJournalState joins the "other lanes
      // complete" predicate. On T/Th, all 4 task lanes (reading,
      // prayer, memo, session_journal) must finish before the
      // trophy unlocks.
      const otherStates = [readingState, prayerState, memState, sessionState, sessionJournalState];
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
    // totalCount (full bar). Otherwise: 'not_applicable' (memo with
    // no weekly verse seeded) counts toward the DENOMINATOR always
    // AND toward the NUMERATOR once every other completable lane
    // is done (Chat 19 B2 — so "0/5" displays at day-start and
    // "5/5 ✓" displays at day-end even on no-verse weeks).
    // Finishing states:
    //   • 'reflected'      → reading two-stage final
    //   • 'paid'           → Day Complete bonus already awarded
    //   • 'unlock-pending' → bonus about to commit; count as done
    //                        so the progress card doesn't briefly
    //                        flash an intermediate "n-1 of n" frame
    let completedCount = 0;
    let totalCount = 0;

    // Chat 19 B2: memo auto-credits the numerator once every other
    // completable lane is done. Mirrors the Day Complete unlock-
    // pending check above (same definition of "other lanes
    // complete") so the two flip together at end-of-day on no-
    // verse weekdays — display goes 4/5 → 5/5 ✓.
    function _isLaneDone(s) {
      return s === 'complete' || s === 'reflected' || s === 'pilgrimage';
    }
    // Wave 2 Lead: sessionJournalState joins the sibling-lane list
    // alongside reading/prayer/session, so memo auto-credit waits for
    // every completable lane on T/Th too.
    const _memAutoComplete = (memState === 'not_applicable') &&
      [readingState, prayerState, sessionState, sessionJournalState]
        .every(s => s == null || _isLaneDone(s));

    function tally(state, autoComplete) {
      if (state == null) return; // skip lanes not present this dow
      totalCount++; // 'not_applicable' now counts toward denominator
      if (autoComplete ||
          state === 'complete' ||
          state === 'reflected' ||
          state === 'pilgrimage' ||
          state === 'paid' ||
          state === 'unlock-pending') {
        completedCount++;
      }
    }
    tally(readingState,        false);
    tally(prayerState,         false);
    tally(memState,            _memAutoComplete);
    tally(sessionState,        false);
    tally(sessionJournalState, false);
    tally(dayCompleteState,    false);

    return {
      reading: readingState,
      prayer:  prayerState,
      memorization: memState,
      session: sessionState,
      sessionJournal: sessionJournalState,
      dayComplete: dayCompleteState,
      pendingDayCompletePayout,
      readingStageRow,
      dayCompleteRow,
      sessionJournalEntryRow,
      sessionJournalPrompt,
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

  // Section title above the daily list + progress chip below it.
  // Chat 20-IMPL-A: progress counter relocates from BOTTOM of the
  // panel to TOP — momentum-during-work, not reward-after-work
  // (Phase 1 friction #8). The chip stays visible as Nolan works.
  function _renderEyebrow(today, completedCount, totalCount, isPilgrimage) {
    return `
      <div class="mh-eyebrow">
        <div class="mh-eyebrow-title">Today's Missions</div>
        <div class="mh-eyebrow-day">${esc(_formatDayLabel(today))}</div>
      </div>
      ${_renderProgressChip(completedCount, totalCount, isPilgrimage)}
    `;
  }

  // Progress chip in the eyebrow band — "X of Y today" + bar.
  // Pilgrimage day: replaces the fraction with "Pilgrimage rest"
  // copy and hides the bar (CSS handles via .is-rest).
  function _renderProgressChip(completedCount, totalCount, isPilgrimage) {
    if (isPilgrimage) {
      return `
        <div class="mh-progress-chip is-rest" id="mh-progress-chip">
          <span class="mh-progress-count">Pilgrimage rest</span>
        </div>
      `;
    }
    if (!totalCount || totalCount <= 0) return '';
    const pct = Math.round((completedCount / totalCount) * 100);
    const allDone = completedCount >= totalCount;
    const completeClass = allDone ? ' is-complete' : '';
    const cap = allDone ? ' ✓' : ' today';
    return `
      <div class="mh-progress-chip${completeClass}" id="mh-progress-chip">
        <span class="mh-progress-count" id="mh-progress-count">
          <span class="mh-pc-num" id="mh-pc-num" data-count="${completedCount}">${completedCount}</span>
          of
          <span class="mh-pc-total">${totalCount}</span>${cap}
        </span>
        <div class="mh-progress-bar"><div class="mh-progress-fill" style="width:${pct}%"></div></div>
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

  // ★ READING BLOCK (Chat 20-IMPL-B) — trail-marker row only.
  // Post-migration the Reading lane is a single tap-row whose
  // href routes to bible-reader.html?source=expedition; the Reflect
  // Panel mounts there (js/reading-reflect-panel.js). No inline
  // expand panel below the row on Missions — that surface is fully
  // retired in 20-IMPL-B. State machine collapses to:
  //   pending     → "<gospel ref> · Read & reflect"  (○ indicator)
  //   reflected   → "<gospel ref> · read & reflected" (✓ indicator)
  //                  Both atomic-commit and skip-pastorally rows
  //                  land here per OQ-1 ruling A.
  //   pilgrimage  → "Read at your own pace this week" (✦ indicator)
  function _renderReadingBlock(state, opts) {
    const row = opts && opts.row || null;
    const gospelHref = _buildGospelHref(row);
    const gospelRef = _gospelRefFromRow(row);
    const refLabel = gospelRef || 'Today\'s Gospel';

    // State-aware sub-line + indicator + tap target.
    let sub, indicator, stateClass;
    switch (state) {
      case 'pilgrimage':
        sub = 'Read at your own pace this week';
        indicator = '<span class="mh-row-indicator mh-ri-pilgrimage" aria-label="On pilgrimage">✦</span>';
        stateClass = 'mh-state-pilgrimage';
        break;
      case 'reflected':
        sub = `${refLabel} · read & reflected`;
        indicator = '<span class="mh-row-indicator mh-ri-done" aria-label="Complete">✓</span>';
        stateClass = 'mh-state-complete';
        break;
      default: // 'pending'
        sub = `${refLabel} · Read & reflect`;
        indicator = '<span class="mh-row-indicator mh-ri-pending" aria-label="Pending">○</span>';
        stateClass = 'mh-state-pending';
    }

    const rowHtml = `
      <a class="mh-row mh-row-reading ${stateClass}" id="mh-row-reading" href="${esc(gospelHref)}">
        <div class="mh-row-icon">📖</div>
        <div class="mh-row-body">
          <div class="mh-row-name">Today's Gospel Reading</div>
          <div class="mh-row-sub">${esc(sub)}</div>
        </div>
        ${state === 'pilgrimage' || state === 'reflected'
            ? ''
            : '<div class="mh-row-coins">+5</div>'}
        ${indicator}
      </a>
    `;

    return `
      <div class="mh-reading-block" data-state="${esc(state)}">
        ${rowHtml}
      </div>
    `;
  }

  // (Chat 20-IMPL-A: prior _readingPilgrimageHTML and
  // _readingCompleteNoQuestionHTML helpers retired — pilgrimage
  // and completion states are now expressed via the trail-marker
  // row sub-line, not via dedicated mini-cards.)

  // Generic mission row. Whole row is a tappable <a>.
  // Chat 20-IMPL-A: coin chip defaults to '+5' on incomplete states
  // for visual consistency across trail markers (Phase 1 friction #4
  // — Stage 2 reward parity). Hidden on complete/pilgrimage/na
  // since the indicator already telegraphs the state.
  // Op Learning #15 — visible state via class names; row hidden via
  // inline `display:none` if ever needed (here it isn't — we render
  // null states as `not_applicable` rows or skip entirely).
  function _renderMissionRow(opts) {
    const {
      id, href, icon, name, sub, state,
    } = opts;
    // Right-side state indicator glyph
    let indicator;
    switch (state) {
      case 'complete':     indicator = '<span class="mh-row-indicator mh-ri-done" aria-label="Complete">✓</span>'; break;
      case 'pilgrimage':   indicator = '<span class="mh-row-indicator mh-ri-pilgrimage" aria-label="On pilgrimage">✦</span>'; break;
      case 'not_applicable': indicator = '<span class="mh-row-indicator mh-ri-na" aria-label="Not applicable">—</span>'; break;
      default:             indicator = '<span class="mh-row-indicator mh-ri-pending" aria-label="Pending">○</span>';
    }
    const showCoins = (state !== 'complete' && state !== 'pilgrimage' && state !== 'not_applicable');
    const coinsLabel = (typeof opts.coinsLabel === 'string') ? opts.coinsLabel : '+5';
    const stateClass = `mh-state-${state}`;
    return `
      <a class="mh-row ${stateClass}" id="mh-row-${esc(id)}" href="${esc(href)}">
        <div class="mh-row-icon">${icon}</div>
        <div class="mh-row-body">
          <div class="mh-row-name">${esc(name)}</div>
          <div class="mh-row-sub">${esc(sub)}</div>
        </div>
        ${showCoins ? `<div class="mh-row-coins">${esc(coinsLabel)}</div>` : ''}
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

    // Chat 20-IMPL-A: parity coin chip with other trail markers.
    const showCoins = (sessionState !== 'complete' && sessionState !== 'pilgrimage');
    const coinsHtml = showCoins ? '<div class="mh-row-coins">+5</div>' : '';

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
        ${coinsHtml}
        ${indicator}
      </a>
    `;
  }

  // Chat 20-IMPL-A — closing line, rendered ONLY below the trophy
  // chip when state.dayComplete === 'paid' (or 'pilgrimage'). The
  // prior _renderProgress at the BOTTOM of the panel goes away
  // entirely; the counter lives in the eyebrow band now
  // (_renderProgressChip).
  function _renderClosingLine(dayCompleteState, profile) {
    const firstName = (profile && profile.name)
      ? String(profile.name).trim().split(/\s+/)[0]
      : 'friend';
    if (dayCompleteState === 'paid') {
      return `
        <div class="mh-closing-line">
          Glory to God for all things, ${esc(firstName)}. <span aria-hidden="true">☦&#xFE0E;</span> See you tomorrow.
        </div>
      `;
    }
    if (dayCompleteState === 'pilgrimage') {
      return `
        <div class="mh-closing-line mh-closing-line-rest">
          Walk in peace. Your streak walks with you.
        </div>
      `;
    }
    return '';
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
  // RENDER HELPERS (Chat 2A render + Chat 20-IMPL-B simplifications)
  //   • Reading lane — trail-marker row only (Stage 2 form retired)
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

  // (Chat 20-IMPL-B: _renderReadingReadNotReflectedHTML retired. The
  // Stage 2 reflect surface — portrait + prompt + textarea + submit
  // — moved into bible-reader.html via js/reading-reflect-panel.js
  // so Nolan reflects while the Gospel is still visible. The atomic
  // +5 commit (read + reflect in a single INSERT) lives there.
  // Reading lane on the Missions hub is now a pure trail-marker
  // row with no inline panel.)

  // (Chat 20-IMPL-A: _renderReadingReflectedHTML retired. The
  // reflected state is now expressed by the trail-marker row's
  // sub-line ("<gospel ref> · read & reflected") with a green ✓
  // indicator. No separate saved-card surface on the missions
  // page — Nolan re-opens bible-reader from the row link to see
  // his saved reflection echoed back, OR opens the Field Manual.)

  // ★ TROPHY CHIP (Chat 20-IMPL-A · replaces _renderDayCompleteLane).
  // "Today's Devotion" as a celebratory CAP at the bottom of the
  // task-row stack, distinct register from task rows:
  //   • Locked         → compact ~60px, parchment-dim, lock glyph,
  //                       sub-line "unlock at N/N"
  //   • Unlock-pending → gold-pulse 1.0s transitional; mount() then
  //                       commits the +10 bonus and refresh re-
  //                       renders this chip as 'paid'
  //   • Paid           → taller ~80px, gold-burst, three ✦ ornaments,
  //                       +10 coin pip + "Glory to God for all things"
  //   • Pilgrimage     → gentle parchment-warm rest tile
  //
  // The taskCount param expresses the denominator for the locked
  // sub-line — task lanes excluding the trophy itself.
  function _renderTrophyChip(state, taskCount) {
    const n = Number(taskCount) || 4; // safe default
    if (state === 'pilgrimage') {
      return `
        <div class="mh-trophy mh-trophy-pilgrimage" id="mh-row-day_complete">
          <div class="mh-trophy-glyph" aria-hidden="true">&#x2726;&#xFE0E;</div>
          <div class="mh-trophy-body">
            <div class="mh-trophy-title">Today's Devotion</div>
            <div class="mh-trophy-sub">Pilgrimage rest — your streak walks with you.</div>
          </div>
        </div>
      `;
    }
    if (state === 'unlock-pending') {
      return `
        <div class="mh-trophy mh-trophy-pending" id="mh-row-day_complete" data-state="unlock-pending">
          <div class="mh-trophy-glyph" aria-hidden="true">&#x2726;&#xFE0E;</div>
          <div class="mh-trophy-body">
            <div class="mh-trophy-title">Today's Devotion is complete — your bonus is on its way…</div>
          </div>
        </div>
      `;
    }
    if (state === 'paid') {
      return `
        <div class="mh-trophy mh-trophy-paid" id="mh-row-day_complete" data-state="paid">
          <div class="mh-trophy-glyph" aria-hidden="true">&#x2726;&#xFE0E;</div>
          <div class="mh-trophy-body">
            <div class="mh-trophy-ornament-row" aria-hidden="true">
              <span>&#x2726;&#xFE0E;</span>
              <span>&#x2726;&#xFE0E;</span>
              <span>&#x2726;&#xFE0E;</span>
            </div>
            <div class="mh-trophy-title">Today's Devotion</div>
            <div class="mh-trophy-sub">Glory to God for all things.</div>
          </div>
          <div class="mh-trophy-coins" aria-label="10 coin bonus">+10 <span aria-hidden="true">☦&#xFE0E;</span></div>
        </div>
      `;
    }
    // locked (default)
    return `
      <div class="mh-trophy mh-trophy-locked" id="mh-row-day_complete">
        <div class="mh-trophy-glyph" aria-hidden="true">&#x2726;&#xFE0E;</div>
        <div class="mh-trophy-body">
          <div class="mh-trophy-title">Today's Devotion · unlock at ${esc(String(n))}/${esc(String(n))}</div>
        </div>
        <div class="mh-trophy-lock" aria-hidden="true">🔒</div>
      </div>
    `;
  }

  // ═════════════════════════════════════════════════════════════════
  // WAVE 2 LEAD · SESSION JOURNAL LANE RENDER  (T/Th only)
  // ═════════════════════════════════════════════════════════════════
  // The Session Journal lane mirrors the reading-lane block pattern:
  //   • outer .mh-journal-block wrapping a trail-marker .mh-row
  //   • optional .mh-journal-expand panel rendered below when
  //     state is 'pending' (carries the prompt + textarea + submit)
  // Coin chip on pending = +5 (parity with reading +5 total).
  // Row is a plain <div> (not <a>): there's nowhere to navigate —
  // tapping focuses the textarea via _wireSessionJournalSubmit.

  // ═════════════════════════════════════════════════════════════════
  // SESSION JOURNAL DRAFT PERSISTENCE (DP-micro · May 13, 2026)
  // ═════════════════════════════════════════════════════════════════
  // Mirrors js/reading-reflect-panel.js's wireDraftPersistence.
  // Survives navigation / app-kill until Nolan submits.
  // localStorage key: oe_draft_session_journal_{explorerId}_{todayKey}
  // Date portion lets the per-page sweep orphan-clean previous-day
  // keys (see missions.html sibling IIFE).

  function _sessionJournalDraftKey(explorerId, today) {
    return 'oe_draft_session_journal_' + explorerId + '_' + today;
  }

  // Restore-on-mount + debounced save (200ms) on the Session
  // Journal textarea. Only invoked when the pending block has
  // placed #mh-session-journal-textarea in the DOM (NOT pilgrimage,
  // NOT complete). Independent of the existing refreshEnabled
  // listener wired in _wireSessionJournalSubmit.
  function _wireSessionJournalDraftPersistence(innerSlot, ctx) {
    const ta = innerSlot.querySelector('#mh-session-journal-textarea');
    if (!ta) return;
    const KEY = _sessionJournalDraftKey(ctx.explorerId, ctx.today);
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) ta.value = saved;
    } catch (_e) { /* graceful — quota / private-mode */ }
    let _saveT;
    ta.addEventListener('input', () => {
      clearTimeout(_saveT);
      _saveT = setTimeout(() => {
        try {
          const v = String(ta.value || '').trim();
          if (v.length === 0) localStorage.removeItem(KEY);
          else                localStorage.setItem(KEY, v);
        } catch (_e) { /* graceful */ }
      }, 200);
    });
  }

  function _renderSessionJournalBlock(state, opts) {
    const promptRow    = (opts && opts.promptRow)    || null;
    const entryRow     = (opts && opts.entryRow)     || null;
    const sessionTitle = (opts && opts.sessionTitle) || '';

    let sub, indicator, stateClass, showCoins;
    switch (state) {
      case 'pilgrimage':
        sub = 'Your journal waits';
        indicator = '<span class="mh-row-indicator mh-ri-pilgrimage" aria-label="On pilgrimage">&#x2726;&#xFE0E;</span>';
        stateClass = 'mh-state-pilgrimage';
        showCoins = false;
        break;
      case 'complete':
        sub = entryRow && entryRow.entry_text
          ? 'Today\u2019s reflection is saved'
          : 'Today\u2019s reflection is saved';
        indicator = '<span class="mh-row-indicator mh-ri-done" aria-label="Complete">&#x2713;</span>';
        stateClass = 'mh-state-complete';
        showCoins = false;
        break;
      default: // 'pending'
        sub = sessionTitle ? `Reflect on ${sessionTitle}` : 'Today\u2019s reflection';
        indicator = '<span class="mh-row-indicator mh-ri-pending" aria-label="Pending">&#x25CB;</span>';
        stateClass = 'mh-state-pending';
        showCoins = true;
    }

    const coinsHtml = showCoins ? '<div class="mh-row-coins">+5</div>' : '';
    const rowHtml = `
      <div class="mh-row mh-row-session-journal ${stateClass}" id="mh-row-session_journal">
        <div class="mh-row-icon">&#x270D;&#xFE0E;</div>
        <div class="mh-row-body">
          <div class="mh-row-name">Session Journal</div>
          <div class="mh-row-sub">${esc(sub)}</div>
        </div>
        ${coinsHtml}
        ${indicator}
      </div>
    `;

    if (state === 'pending') {
      return `
        <div class="mh-journal-block" data-state="pending">
          ${rowHtml}
          <div class="mh-journal-expand" id="mh-session-journal-content"></div>
        </div>
      `;
    }
    return `
      <div class="mh-journal-block" data-state="${esc(state)}">
        ${rowHtml}
      </div>
    `;
  }

  // Inner pending-state body — portrait + prompt + textarea + submit.
  // Reuses the .mh-portrait-block + .mh-rrp-text + .mh-reading-input-block
  // + .mh-reading-textarea + .mh-reading-submit-btn classes for visual
  // parity with the reading Stage 2 inline form (per OQ-5: keep .rl-*
  // and reading-* CSS as canonical; no new class family needed).
  function _renderSessionJournalPendingHTML(opts) {
    const promptText = (opts && opts.promptText) || '';
    return `
      <div class="mh-journal-stage" data-stage="pending">
        ${promptText ? `
          <div class="mh-reading-prompt-block">
            <div class="mh-portrait-block">
              <img class="mh-portrait" src="/Orthodox-Expedition-/assets/characters/theo-portrait.png" alt="Theo">
              <div class="mh-portrait-speaker">Theo asks&#x2026;</div>
            </div>
            <div class="mh-rrp-text">${esc(promptText)}</div>
          </div>
        ` : `
          <div class="mh-journal-empty mh-rrp-text">A reflection prompt is being prepared for this session. Write whatever you\u2019re carrying today &#x2014; your entry still counts.</div>
        `}
        <div class="mh-reading-input-block">
          <label class="mh-rri-label" for="mh-session-journal-textarea">Your reflection</label>
          <textarea
            id="mh-session-journal-textarea"
            class="mh-reading-textarea"
            rows="3"
            placeholder="Even a sentence is enough\u2026"
            aria-describedby="mh-session-journal-input-help"
          ></textarea>
          <div id="mh-session-journal-input-help" class="mh-rri-help">+5 coins on save.</div>
          <button type="button" class="mh-reading-submit-btn" data-mh-action="session-journal-submit" disabled>Save reflection</button>
        </div>
      </div>
    `;
  }

  // Wire the Session Journal submit handler on the in-line panel.
  // Pattern (originally mirrored from the now-retired
  // _wireReadingReflectSubmit; same pattern now lives in
  // js/reading-reflect-panel.js): enable on non-empty input,
  // disable + label "Saving…" during the write, on success delegate
  // to ReflectionLane.saveEntry (field_journal insert + +5 profile
  // coin bump, both idempotent), write the activity_log row for
  // parent-admin visibility, then refresh the hub so the row
  // collapses to the ✓ complete state. Failure re-enables with an
  // inline soft error.
  function _wireSessionJournalSubmit(innerSlot, ctx) {
    const ta  = innerSlot.querySelector('#mh-session-journal-textarea');
    const btn = innerSlot.querySelector('[data-mh-action="session-journal-submit"]');
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
      btn.textContent = 'Saving\u2026';
      try {
        if (!window.ReflectionLane || typeof window.ReflectionLane.saveEntry !== 'function') {
          throw new Error('ReflectionLane.saveEntry unavailable');
        }
        const res = await window.ReflectionLane.saveEntry(ctx.sb, {
          explorerId: ctx.explorerId,
          today:      ctx.today,
          promptText: ctx.promptText || '',
          text:       text,
        });
        if (res && (res.ok || res.alreadySaved)) {
          // DP-micro · clear draft on success FIRST so the
          // post-refresh re-render of the lane (in any future
          // path that re-creates the textarea before refresh
          // completes) sees an empty key. Covers both res.ok
          // (fresh write) and res.alreadySaved (cross-tab race).
          try { localStorage.removeItem(_sessionJournalDraftKey(ctx.explorerId, ctx.today)); }
          catch (_e) { /* graceful */ }
          // Activity-log breadcrumb for parent-admin visibility (OQ-12).
          // Non-fatal — failure here does not affect the lane state.
          // Skipped on alreadySaved (no fresh write happened).
          if (!res.alreadySaved) {
            try {
              await ctx.sb.from('activity_log').insert({
                explorer_id: ctx.explorerId,
                amount: 5,
                reason: `[session_journal_daily] ${ctx.sessionId || ''} ${ctx.dayKind || ''}`.trim(),
              });
            } catch (logErr) {
              console.warn('[Missions] session-journal activity_log write failed (non-fatal):', logErr);
            }
          }
          await refresh();
          return;
        }
        throw new Error('ReflectionLane.saveEntry returned not-ok');
      } catch (err) {
        console.warn('Session Journal submit failed:', err);
        btn.disabled = false;
        btn.textContent = 'Save reflection';
        let errEl = innerSlot.querySelector('.mh-journal-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.className = 'mh-journal-error mh-reading-error';
          errEl.setAttribute('role', 'alert');
          btn.parentNode.insertBefore(errEl, btn.nextSibling);
        }
        errEl.textContent = 'Saving failed \u2014 please try again.';
      }
    });
  }

  // (Chat 20-IMPL-A: _renderReflectionSlotShell removed — T/Th
  // reflection lane retires; no slot to mount ReflectionLane into.)

  // ═════════════════════════════════════════════════════════════════
  // CHAT 20-IMPL-A · CELEBRATION ORCHESTRATOR + NEXT-UP PULSE
  // ═════════════════════════════════════════════════════════════════

  // Quick check for prefers-reduced-motion. Used to skip the
  // motion-heavy coin-rain on accessibility-sensitive devices.
  function _prefersReducedMotion() {
    try {
      return typeof window !== 'undefined' &&
             window.matchMedia &&
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_e) { return false; }
  }

  // Coin-rain: short ✦ shower from above the page. 8 particles by
  // default, randomized horizontal positions + staggered delays so
  // they don't all hit the GPU at frame 1. Uses the existing
  // #coin-rain container + .coin-p elements + @keyframes coinFall
  // (all defined in missions.html — wired here for the first time).
  function _fireCoinRain(particleCount, glyph) {
    if (_prefersReducedMotion()) return; // Note F: skip entirely
    const container = document.getElementById('coin-rain');
    if (!container) return;
    const count = Number(particleCount) || 8;
    // U+2726 BLACK FOUR POINTED STAR + U+FE0E text-variant defense.
    const g = glyph || '\u2726\uFE0E';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'coin-p';
      p.style.fontVariantEmoji = 'text';
      p.style.left = (10 + Math.random() * 80) + '%';
      p.style.animationDelay = (Math.random() * 0.7) + 's';
      p.textContent = g;
      container.appendChild(p);
      // Each particle self-cleans after the animation ends so the
      // container doesn't accumulate DOM nodes.
      const _cleanup = () => { try { p.remove(); } catch (_e) {} };
      p.addEventListener('animationend', _cleanup, { once: true });
      // Belt-and-suspenders: clear after 4s even if event misses.
      setTimeout(_cleanup, 4000);
    }
  }

  // Floating "+10 ☦" toast that rises ~24px and fades over 1200ms.
  // Anchored to the coin-strip's value position so it reads as a
  // visual extension of the coin balance changing.
  function _fireToast(text, anchorEl) {
    if (!text) return;
    const anchor = anchorEl || document.getElementById('coin-val');
    if (!anchor) return;
    let rect;
    try { rect = anchor.getBoundingClientRect(); } catch (_e) { return; }
    if (!rect) return;
    const toast = document.createElement('div');
    toast.className = 'mh-coin-toast';
    toast.textContent = text;
    toast.style.left = (rect.left + window.scrollX + rect.width / 2) + 'px';
    toast.style.top  = (rect.top  + window.scrollY) + 'px';
    toast.style.transform = 'translate(-50%, -100%)';
    document.body.appendChild(toast);
    const _cleanup = () => { try { toast.remove(); } catch (_e) {} };
    toast.addEventListener('animationend', _cleanup, { once: true });
    setTimeout(_cleanup, 2000);
  }

  // iOS haptic — single short pulse via navigator.vibrate. PWA-safe
  // on iOS 17+, gracefully no-ops elsewhere. Reduced-motion users
  // STILL get haptic (it's not a motion concern).
  function _fireHaptic(pattern) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern == null ? 25 : pattern);
      }
    } catch (_e) { /* graceful */ }
  }

  // Six-element celebration choreography (Phase 2 §6).
  // Sequence assumes:
  //   • The day_complete_bonus row has just been committed (caller
  //     gates this on a successful _commitDayCompleteBonus call).
  //   • The trophy chip in the current DOM is in 'unlock-pending'
  //     state OR will be replaced shortly by 'paid' via refresh().
  //   • The container variable points at the missions hub DOM.
  //
  // We do NOT touch the trophy chip DOM directly here — the caller
  // sequence is: commit → _runCelebration() → refresh() → the
  // refresh re-renders the trophy in 'paid' state with the
  // mhTrophyPaidEntry keyframe firing automatically.
  //
  // The toast + coin-rain + haptic + counter animation all fire
  // INSIDE this function. The counter animation reads the current
  // .mh-pc-num element from the eyebrow progress chip.
  //
  // Idempotency: callers gate on state.pendingDayCompletePayout
  // which is true only on the mount transitioning from locked → paid.
  // Subsequent mounts of the same day see state.dayComplete='paid'
  // and skip the celebration entirely.
  async function _runCelebration(opts) {
    const o = opts || {};
    // t=0..t=100ms: pre-pause. Let the brain register "all task
    // lanes are now ✓" before celebration begins. (Per Phase 2 §6
    // human-perceptual-beat reasoning.)
    await new Promise(r => setTimeout(r, 100));

    // t=180ms: iOS haptic (single 25ms pulse). Lands during the
    // chip morph window, reinforcing without competing.
    setTimeout(() => _fireHaptic(25), 80);

    // t=200ms: +10 ☦ floating toast over coin-strip-val.
    setTimeout(() => {
      const anchor = document.getElementById('coin-val');
      _fireToast('+10 \u2626\uFE0E', anchor);
    }, 100);

    // t=250ms: coin-rain begins (8 ✦ particles, staggered).
    setTimeout(() => _fireCoinRain(8, '\u2726\uFE0E'), 150);

    // t=700ms: counter animates 4 → 5 (handled by refresh()'s
    // animateCountUp pass — see mount() for the wiring). We just
    // wait long enough here for the celebration to settle before
    // the caller invokes refresh().
    await new Promise(r => setTimeout(r, 600));
    // Return; caller calls refresh() to render the paid trophy chip.
  }

  // Apply the .mh-row-next-up class to the topmost incomplete row.
  // Phase 2 §7 selector logic:
  //   1. Walk rows in DISPLAY ORDER (reading, prayer, memo, session).
  //   2. complete | reflected | pilgrimage | paid → COMPLETE
  //      not_applicable → SKIP (auto-credited, treat as complete)
  //      pending → INCOMPLETE
  //   3. Find FIRST incomplete row; add class.
  //   4. Edge cases: all complete → no pulse; pilgrimage → no pulse;
  //      trophy chip never gets pulse (different register).
  function _applyNextUpPulse(container, state) {
    if (!container || !state) return;
    if (state.pilgrimage) return; // pilgrimage rest — quiet
    const order = [
      { id: 'reading',         s: state.reading },
      { id: 'prayer',          s: state.prayer },
      { id: 'memorization',    s: state.memorization },
      { id: 'session',         s: state.session },
      { id: 'session_journal', s: state.sessionJournal },
    ];
    function _isLaneComplete(s) {
      return s === 'complete' || s === 'reflected' ||
             s === 'pilgrimage' || s === 'paid' || s === 'not_applicable';
    }
    for (const lane of order) {
      if (lane.s == null) continue; // not present this dow
      if (_isLaneComplete(lane.s)) continue;
      // First incomplete lane — apply the pulse.
      const rowEl = container.querySelector(`#mh-row-${lane.id}`);
      if (rowEl) rowEl.classList.add('mh-row-next-up');
      return;
    }
    // No incomplete row → no pulse (trophy chip carries its own
    // register if it's in unlock-pending or paid state).
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

    // Build HTML (Wave 2 Lead lane order; Chat 20-IMPL-B simplified
    // the Reading block):
    //   1. Eyebrow (includes progress chip — Phase 2 §3)
    //   2. Pilgrimage banner
    //   3. Reading block (trail-marker row only — Stage 2 reflect
    //      surface lives on bible-reader.html post-20-IMPL-B)
    //   4. Prayer row
    //   5. Memorization row
    //   6. Session row (M/W/F only)
    //   7. Session Journal block (T/Th only — trail-marker row +
    //      optional inline expand for the prompt + textarea + submit
    //      when state is 'pending'). Wave 2 Lead.
    //   8. Trophy chip (every day; states: locked / unlock-pending /
    //      paid / pilgrimage)
    //   9. Closing line (only when paid or pilgrimage)
    const parts = [];
    parts.push(_renderEyebrow(today, state.completedCount, state.totalCount, !!state.pilgrimage));
    parts.push(_renderPilgrimageBanner(state.pilgrimage));
    parts.push(_renderReadingBlock(state.reading, { row: state.readingAnchorRow }));

    parts.push(_renderMissionRow({
      id: 'prayer',
      href: 'prayers.html?pray=' + (window.WeekUtils && window.WeekUtils.hourET(new Date()) < 12 ? 'morning' : 'evening'),
      icon: '🕊️',
      name: 'Pray today',
      sub: state.prayer === 'complete' ? 'Today\'s prayer is offered'
         : state.prayer === 'pilgrimage' ? 'Your prayer walks with you'
         : 'Morning or evening',
      state: state.prayer,
    }));

    let memSub;
    if (state.memorization === 'not_applicable') {
      memSub = 'No verse this week';
    } else if (state.memorization === 'complete') {
      memSub = state.currentVerse ? state.currentVerse.reference + ' · learned' : 'Learned';
    } else if (state.memorization === 'pilgrimage') {
      memSub = 'The verse waits gently';
    } else {
      memSub = state.currentVerse ? state.currentVerse.reference : 'This week\'s verse';
    }
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

    // Session Journal lane (T/Th only — null on M/W/F + Sat/Sun).
    // Wave 2 Lead. Renders after Session row so the slot-4 position
    // visually parallels Session's slot-4 on M/W/F.
    if (state.sessionJournal !== null) {
      parts.push(_renderSessionJournalBlock(state.sessionJournal, {
        sessionTitle: state.activeSession ? state.activeSession.title : '',
        promptRow:    state.sessionJournalPrompt,
        entryRow:     state.sessionJournalEntryRow,
      }));
    }

    // Trophy chip (every day, last in stack). The taskCount is the
    // lane count EXCLUDING the trophy itself — total minus 1 — so
    // the locked sub-line reads accurately ("unlock at 4/4" on
    // M/W/F; "unlock at 3/3" on T/Th and weekends).
    if (state.dayComplete !== null) {
      const taskCount = Math.max(0, (state.totalCount || 0) - 1);
      parts.push(_renderTrophyChip(state.dayComplete, taskCount));
    }

    // Closing line (paid or pilgrimage only).
    parts.push(_renderClosingLine(state.dayComplete, opts.profile));

    container.innerHTML = parts.join('');

    // ── Reading lane (Chat 20-IMPL-B) ────────────────────────────
    // No inline mount step. The Reading row is a pure trail-marker
    // whose href routes to bible-reader.html?source=expedition. The
    // Reflect Panel (js/reading-reflect-panel.js) is mounted by
    // bible-reader.html and handles the atomic +5 commit, the
    // skip-pastorally +3 path, and the 1.5s redirect back to here.

    // ── Mount Session Journal inner content per state (Wave 2 Lead) ──
    // Only the 'pending' state mounts an expand panel; 'complete' and
    // 'pilgrimage' express themselves fully via the row itself.
    if (state.sessionJournal === 'pending') {
      const innerSlot = container.querySelector('#mh-session-journal-content');
      if (innerSlot) {
        const promptText = state.sessionJournalPrompt
          ? state.sessionJournalPrompt.prompt_text
          : '';
        innerSlot.innerHTML = _renderSessionJournalPendingHTML({
          promptText,
        });
        // DP-micro · restore draft + arm debounced save BEFORE
        // the submit handler wires. Independent of the existing
        // refreshEnabled input listener in _wireSessionJournalSubmit.
        _wireSessionJournalDraftPersistence(innerSlot, {
          explorerId, today,
        });
        _wireSessionJournalSubmit(innerSlot, {
          sb, explorerId, familyId, today,
          sessionId:  state.activeSession ? state.activeSession.id : null,
          dayKind:    _dayKindFromDow(dow),
          promptText,
        });
      }
    }

    // ── Apply next-up pulse to topmost incomplete lane ────────────
    _applyNextUpPulse(container, state);

    // ── Day Complete bonus payout (idempotent on transition) ─────
    // When all other lanes are complete and no day_complete_bonus row
    // exists yet, the state machine flagged pendingDayCompletePayout.
    // Commit +10 coins (UNIQUE constraint handles race), fire the
    // celebration choreography, then refresh so the trophy chip re-
    // renders in 'paid' state and the closing line appears.
    if (state.pendingDayCompletePayout) {
      try {
        const res = await _commitDayCompleteBonus(sb, explorerId, familyId, today);
        if (res && (res.ok || res.duplicate)) {
          // Fire the six-element celebration sequence (Phase 2 §6).
          // Then tail-call refresh — recursion bounded because next
          // loadTodaysState pass sees the bonus row and short-circuits.
          await _runCelebration({ container });
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
        // 'reflected' (final state in two-stage). 'dayComplete'
        // transitions to 'paid' on bonus payout.
        // Wave 2 Lead: 'sessionJournal' key added; transitions to
        // 'complete' on text submit.
        ['prayer','memorization','session','sessionJournal','reading','dayComplete'].forEach(k => {
          const prev = _priorStates[k];
          const cur  = state[k];
          if (prev === cur) return;
          if (cur === 'complete' || cur === 'reflected' || cur === 'paid') {
            newlyComplete.push(k);
          }
        });
        newlyComplete.forEach(k => {
          // Row ID lookup. Chat 20-IMPL-A: reading row is now
          // #mh-row-reading (not the old #mh-reading-card outer).
          // Wave 2 Lead: sessionJournal row is #mh-row-session_journal.
          let rowId;
          if (k === 'dayComplete')          rowId = '#mh-row-day_complete';
          else if (k === 'sessionJournal')  rowId = '#mh-row-session_journal';
          else                              rowId = `#mh-row-${k}`;
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
      sessionJournal: state.sessionJournal,
      dayComplete: state.dayComplete,
    };
  }

  // (Chat 20-IMPL-B: _wireReadingReflectSubmit retired. The Stage 2
  // submit handler — disable/save/refresh + soft-error pattern — is
  // now part of js/reading-reflect-panel.js, scoped to the panel on
  // bible-reader.html. Missions hub no longer wires any inline
  // submit for the Reading lane.)

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
      _hasQuestion,
      _gospelTeaser, _loadActiveSession, _loadDailyAnchorData,
      _loadReadingStageRow,
      _loadDayCompleteToday, _commitDayCompleteBonus,
      _sessionDoneToday,
      // Chat 20-IMPL-A render helpers
      _renderEyebrow, _renderProgressChip, _renderPilgrimageBanner,
      _renderReadingBlock,
      _renderMissionRow, _renderSessionRow,
      _renderClosingLine,
      _renderTrophyChip,
      _gospelRefFromRow,
      _animateCountUp, _microCelebrate,
      // Chat 20-IMPL-A celebration + next-up
      _prefersReducedMotion,
      _fireCoinRain, _fireToast, _fireHaptic,
      _runCelebration,
      _applyNextUpPulse,
      // (Chat 20-IMPL-B: _readingFlagKey, _readingFlagSet,
      // _renderReadingReadNotReflectedHTML, _wireReadingReflectSubmit
      // retired. Reading Stage 2 surface lives in
      // js/reading-reflect-panel.js on bible-reader.html.)
      // Wave 2 Lead — Session Journal lane (T/Th)
      _dayKindFromDow,
      _loadTodaysSessionJournal,
      _loadSessionJournalPrompt,
      _renderSessionJournalBlock,
      _renderSessionJournalPendingHTML,
      _wireSessionJournalSubmit,
      // DP-micro · Session Journal draft persistence
      _sessionJournalDraftKey,
      _wireSessionJournalDraftPersistence,
    },
  };

  if (typeof window !== 'undefined') window.Missions = Missions;
  if (typeof module !== 'undefined' && module.exports) module.exports = Missions;
})();
