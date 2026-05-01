/**
 * Orthodox Expedition — Day-State Machine
 *
 * Pure, side-effect-free module that answers: "what day is it for the explorer,
 * in the program, right now?" Used by week.html and any day-aware surface.
 *
 * Inputs:
 *   - today: a Date (defaults to now)
 *   - spine: the parsed program-spine.json (loaded once by the caller)
 *
 * Output: a state object documented at the bottom of this file.
 *
 * No DOM. No Supabase. No fetch. Just date math and program structure.
 */

const DayState = (() => {

  // ── DATE UTILITIES ───────────────────────────────────────────────
  // We treat all dates as local-date strings (YYYY-MM-DD) to avoid
  // timezone surprises. The program is anchored to the family's local
  // wall-clock days, not UTC.

  function toDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function fromDateString(s) {
    // s is 'YYYY-MM-DD'. Parse as local date (NOT UTC).
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function dayOfWeek(d) {
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    return d.getDay();
  }

  function isBetween(date, startStr, endStr) {
    const s = fromDateString(startStr);
    const e = fromDateString(endStr);
    return date >= s && date <= e;
  }

  // ── PAUSE CHECK ──────────────────────────────────────────────────
  // Returns the matching pause object or null.

  function findActivePause(today, spine) {
    for (const p of spine.pauses) {
      if (isBetween(today, p.starts_on, p.ends_on)) return p;
    }
    return null;
  }

  function findNextPauseEnd(today, spine) {
    // For pauses currently active, return when they resume.
    const active = findActivePause(today, spine);
    if (!active) return null;
    const end = fromDateString(active.ends_on);
    const next = new Date(end);
    next.setDate(next.getDate() + 1);
    return toDateString(next);
  }

  // ── PHASE LOOKUP ─────────────────────────────────────────────────

  function findPhase(today, spine) {
    for (const phase of spine.phases) {
      if (isBetween(today, phase.starts_on, phase.ends_on)) return phase;
    }
    return null;
  }

  function findCurrentWeek(today, phase) {
    // A session "owns" its 7-day window: Monday through the next Sunday.
    // - If today is inside that window, that session is current.
    // - If today is past a session's Sunday and before the next session's
    //   Monday (a between-sessions gap, e.g. just after a pause ended),
    //   the *next* upcoming session is current — Nolan is awaiting it.
    // - If today is past every session's Sunday, the last session is current
    //   (end-of-phase trailing state).
    let lastEnded = null;
    for (const w of phase.weeks) {
      const wkMon = fromDateString(w.starts_monday);
      const wkEnd = new Date(wkMon);
      wkEnd.setDate(wkEnd.getDate() + 6); // Sunday at the end of that week
      if (today >= wkMon && today <= wkEnd) return w; // inside this week
      if (today < wkMon) return w; // not yet started — this is the next upcoming session
      lastEnded = w;
    }
    return lastEnded;
  }

  // ── DAY-WITHIN-WEEK CLASSIFICATION ───────────────────────────────

  function classifyDayInThreeDayModel(dow) {
    // dow: 0=Sun ... 6=Sat
    // Day 1 = Monday, Day 2 = Wednesday, Day 3 = Friday.
    // Other weekdays are 'between_sessions' study-day buffers — work that
    // wasn't finished on the canonical day shows up; nothing new is forced.
    switch (dow) {
      case 0: return 'sunday';
      case 1: return 'day1';
      case 2: return 'between_sessions';
      case 3: return 'day2';
      case 4: return 'between_sessions';
      case 5: return 'day3';
      case 6: return 'saturday';
    }
  }

  function classifyDayInTopic00(dow) {
    // Topic 00 has no day tabs — Mon-Fri are all "the week's content is
    // open, work on it whenever". Sun/Sat keep their normal meanings.
    switch (dow) {
      case 0: return 'sunday';
      case 6: return 'saturday';
      default: return 'topic00_open';
    }
  }

  // ── PROGRAM-WEEK INDEX ───────────────────────────────────────────
  // 1-based index of the Monday-anchored week from the launch date.

  function programWeekIndex(today, spine) {
    const launch = fromDateString(spine.launch_date);
    // Find Monday of launch week.
    const launchMonday = new Date(launch);
    while (launchMonday.getDay() !== 1) {
      launchMonday.setDate(launchMonday.getDate() - 1);
    }
    // Find Monday of this week.
    const thisMonday = new Date(today);
    while (thisMonday.getDay() !== 1) {
      thisMonday.setDate(thisMonday.getDate() - 1);
    }
    const ms = thisMonday - launchMonday;
    if (ms < 0) return 0; // pre-launch
    const days = Math.round(ms / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7) + 1;
  }

  // ── MAIN ENTRY POINT ─────────────────────────────────────────────

  function compute(today, spine) {
    // Normalize today to a local date object at midnight.
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 1. Pre-launch check.
    const launch = fromDateString(spine.launch_date);
    if (t < launch) {
      return {
        day_kind: 'pre_launch',
        phase: 'pre_launch',
        program_week: 0,
        current_session_id: null,
        session_week_number: null,
        pause_reason: null,
        pause_resumes_on: null,
        is_study_day: false,
        is_topic_00: false,
        uses_three_day_model: false,
        next_session_starts_on: spine.launch_date,
      };
    }

    // 2. Pause check.
    const activePause = findActivePause(t, spine);
    if (activePause) {
      const phaseObj = findPhase(t, spine);
      return {
        day_kind: 'pause',
        phase: phaseObj ? phaseObj.id : 'pause',
        program_week: programWeekIndex(t, spine),
        current_session_id: null,
        session_week_number: null,
        pause_reason: activePause.reason,
        pause_resumes_on: findNextPauseEnd(t, spine),
        is_study_day: false,
        is_topic_00: phaseObj ? phaseObj.id === 'topic_00' : false,
        uses_three_day_model: phaseObj ? phaseObj.uses_three_day_model : false,
        next_session_starts_on: findNextPauseEnd(t, spine),
      };
    }

    // 3. Phase check.
    const phaseObj = findPhase(t, spine);
    if (!phaseObj) {
      // Past the end of all phases — program complete.
      return {
        day_kind: 'between_sessions',
        phase: 'post_program',
        program_week: programWeekIndex(t, spine),
        current_session_id: null,
        session_week_number: null,
        pause_reason: null,
        pause_resumes_on: null,
        is_study_day: false,
        is_topic_00: false,
        uses_three_day_model: false,
        next_session_starts_on: null,
      };
    }

    // 4. Find this week within the phase.
    const week = findCurrentWeek(t, phaseObj);
    if (!week) {
      // In phase but before its first week (rare, but possible during a gap).
      return {
        day_kind: 'between_sessions',
        phase: phaseObj.id,
        program_week: programWeekIndex(t, spine),
        current_session_id: null,
        session_week_number: null,
        pause_reason: null,
        pause_resumes_on: null,
        is_study_day: false,
        is_topic_00: phaseObj.id === 'topic_00',
        uses_three_day_model: phaseObj.uses_three_day_model,
        next_session_starts_on: phaseObj.weeks[0]?.starts_monday ?? null,
      };
    }

    // 5. Classify the day within the week.
    const dow = dayOfWeek(t);
    const dayKind = phaseObj.uses_three_day_model
      ? classifyDayInThreeDayModel(dow)
      : classifyDayInTopic00(dow);

    return {
      day_kind: dayKind,
      phase: phaseObj.id,
      program_week: programWeekIndex(t, spine),
      current_session_id: week.session_id,
      session_week_number: week.week_number,
      pause_reason: null,
      pause_resumes_on: null,
      is_study_day: ['day1', 'day2', 'day3', 'topic00_open'].includes(dayKind),
      is_topic_00: phaseObj.id === 'topic_00',
      uses_three_day_model: phaseObj.uses_three_day_model,
      next_session_starts_on: null,
    };
  }

  // ── PUBLIC API ───────────────────────────────────────────────────

  return {
    compute,
    // Exposed for tests:
    _internals: {
      toDateString,
      fromDateString,
      dayOfWeek,
      isBetween,
      findActivePause,
      findPhase,
      findCurrentWeek,
      classifyDayInThreeDayModel,
      classifyDayInTopic00,
      programWeekIndex,
    },
  };
})();

// Export for browser globals + module systems.
if (typeof module !== 'undefined' && module.exports) module.exports = DayState;

/*
 * STATE OBJECT REFERENCE
 * ──────────────────────
 * {
 *   day_kind: 'day1' | 'day2' | 'day3' | 'sunday' | 'saturday'
 *           | 'pause' | 'pre_launch' | 'between_sessions' | 'topic00_open',
 *   phase: 'topic_00' | 'year_1' | 'year_2' | 'year_3'
 *        | 'pre_launch' | 'pause' | 'post_program',
 *   program_week: integer,
 *   current_session_id: string | null,
 *   session_week_number: integer | null,
 *   pause_reason: 'bright_week' | 'twelve_days' | 'summer_easing' | 'rest_week' | null,
 *   pause_resumes_on: 'YYYY-MM-DD' | null,
 *   is_study_day: boolean,
 *   is_topic_00: boolean,
 *   uses_three_day_model: boolean,
 *   next_session_starts_on: 'YYYY-MM-DD' | null,
 * }
 *
 * RECOMMENDED USAGE
 * ─────────────────
 *   <script src="config/program-spine.json"></script>  // or fetch
 *   <script src="js/day-state.js"></script>
 *
 *   const state = DayState.compute(new Date(), spine);
 *   if (state.day_kind === 'pre_launch') renderCountdown(state);
 *   else if (state.day_kind === 'pause') renderPauseCard(state);
 *   else if (state.is_topic_00) renderTopic00View(state);
 *   else renderThreeDayView(state);
 */
