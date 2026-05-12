/**
 * Orthodox Expedition — Daily Prayers Module
 *
 * Renders the morning and evening prayer surfaces. Tracks completion via
 * the existing mission_completions table. Computes the weekly prayer streak.
 *
 * Two prayer sets — pre-Chrismation (simpler) and full (post-Chrismation,
 * including the Symbol of Faith). Switches automatically based on the
 * explorer's current_session_id from the day-state machine.
 *
 * Public API:
 *   await Prayers.init()                       — load prayer JSON
 *   Prayers.renderPrayer(timeOfDay, ...)       — return HTML string for full prayer page
 *   Prayers.renderPanel(state, status)         — small "today's prayers" card for week.html
 *   await Prayers.markComplete(timeOfDay)      — log a completion to mission_completions
 *   await Prayers.getTodayStatus(sb?, profileId?) — { morning: bool, evening: bool }
 *     args optional; falls back to closure (sb/profileId set by init())
 *   await Prayers.getStreak(opts?)             — integer (consecutive intact weeks)
 *   await Prayers.getFullCrownEligibility(ws?) — bool (current week 14/14 eligible)
 *
 * No DOM mutation in this module beyond returning strings. Caller drops them in.
 *
 * DISPATCH 2 (May 10, 2026) — getStreak() rewrite to locked architecture:
 *   • Streak unit = consecutive intact SETTLED weeks (not days).
 *   • A week is intact if 5+/7 days had EITHER morning OR evening prayer.
 *   • A 4/7 week with grace_used = false is rescued (grace_used flips to true).
 *   • A 4/7 week with grace_used = true OR a <4/7 week breaks the streak.
 *   • Pilgrimage days are excluded from the threshold entirely (Surface C).
 *   • Display copy on renderPanel is now "X weeks of faithful prayer" (was days).
 *   • The current in-progress week is NEVER counted (it can't yet be intact);
 *     it also never breaks the count (settlement happens at the next Sunday).
 *   • Pre-launch / pre-first-rollup: streak === 0; renderPanel hides the line.
 */

const Prayers = (() => {

  // ── STATE ────────────────────────────────────────────────────────
  let prayerSet = null;       // loaded JSON
  let sb = null;              // Supabase client (provided by caller)
  let profileId = null;       // explorer profile id (provided by caller)

  // Mission keys — must match the rows seeded in the production DB.
  // (Kept as constants here so callers can't typo them.)
  const MORNING_MISSION_KEY = 'daily_morning_prayer';
  const EVENING_MISSION_KEY = 'daily_evening_prayer';

  // ── INIT ─────────────────────────────────────────────────────────
  async function init(supabaseClient, currentProfileId) {
    sb = supabaseClient || null;
    profileId = currentProfileId || null;
    if (!prayerSet) {
      const res = await fetch('config/daily-prayers.json');
      prayerSet = await res.json();
    }
    return prayerSet;
  }

  // ── DETERMINE WHICH PRAYER SET TO USE ────────────────────────────
  // Pre-Chrismation = before session 00.6 (numeric compare).
  function variantForState(state) {
    if (!state || !state.current_session_id) return 'pre_chrismation';
    const id = state.current_session_id;
    // Topic 00 sessions are '00.1', '00.2', ... '00.15'. Year 1+ are '1.1' etc.
    // Anything in Year 1+ is post-Chrismation. Within Topic 00, compare numerically.
    if (!id.startsWith('00.')) return 'full';
    const n = parseInt(id.slice(3), 10);
    return n >= 6 ? 'full' : 'pre_chrismation';
  }

  // ── HTML ESCAPE ──────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── DATE HELPER ──────────────────────────────────────────────────
  function todayKey() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  // ── RENDER A FULL PRAYER PAGE ────────────────────────────────────
  // timeOfDay: 'morning' | 'evening'
  // variant:   'pre_chrismation' | 'full'
  function renderPrayer(timeOfDay, variant) {
    if (!prayerSet) return '<div>Prayers not loaded.</div>';
    const block = prayerSet[timeOfDay];
    if (!block) return '<div>No prayers found.</div>';
    const sequence = block[variant] || block.pre_chrismation;

    let html = `
      <div class="prayer-container">
        <div class="prayer-header">
          <div class="prayer-eyebrow">Daily Prayer</div>
          <h1 class="prayer-title">${esc(block.title)}</h1>
          <div class="prayer-subtitle">${esc(block.subtitle)}</div>
        </div>
    `;

    for (const item of sequence) {
      if (item.type === 'rubric') {
        html += `<div class="rubric">${esc(item.text)}</div>`;
      } else if (item.type === 'prayer') {
        html += `<div class="prayer-block">`;
        html += `<h2 class="prayer-name">${esc(item.title)}</h2>`;
        if (item.subtitle) {
          html += `<div class="prayer-name-sub">${esc(item.subtitle)}</div>`;
        }
        for (const line of item.lines) {
          html += `<p class="prayer-line">${esc(line)}</p>`;
        }
        html += `</div>`;
      } else if (item.type === 'closing') {
        html += `<div class="closing-block">`;
        for (const line of item.lines) {
          html += `<p class="closing-line">${esc(line)}</p>`;
        }
        html += `</div>`;
      }
    }

    html += `
        <div class="prayer-actions">
          <button id="mark-prayer-done" class="prayer-done-btn" data-time="${esc(timeOfDay)}">
            ${timeOfDay === 'morning' ? 'I Have Prayed This Morning' : 'I Have Prayed This Evening'}
          </button>
          <a href="week.html" class="prayer-back">Return</a>
        </div>
      </div>
    `;
    return html;
  }

  // ── RENDER THE SMALL PANEL FOR week.html ─────────────────────────
  // status: { morning: bool, evening: bool, streak: int }
  function renderPanel(state, status) {
    status = status || { morning: false, evening: false, streak: 0 };
    const isPreLaunch = state && state.day_kind === 'pre_launch';
    if (isPreLaunch) {
      // Soft pre-launch placeholder.
      return `
        <div class="prayer-panel">
          <div class="prayer-panel-eyebrow">A Prayer Before the Journey</div>
          <div class="prayer-panel-row">
            <a href="prayers.html?time=morning" class="prayer-link">Begin with a morning prayer</a>
          </div>
        </div>
      `;
    }
    const morningMark = status.morning ? '✓' : '○';
    const eveningMark = status.evening ? '✓' : '○';
    const morningClass = status.morning ? 'done' : '';
    const eveningClass = status.evening ? 'done' : '';
    const streakLine = status.streak > 0
      ? `<div class="prayer-panel-streak">${status.streak} week${status.streak === 1 ? '' : 's'} of faithful prayer</div>`
      : '';
    return `
      <div class="prayer-panel">
        <div class="prayer-panel-eyebrow">Today's Prayers</div>
        <div class="prayer-panel-row">
          <a href="prayers.html?time=morning" class="prayer-link ${morningClass}">
            <span class="prayer-mark">${morningMark}</span>
            <span class="prayer-label">Morning Prayer</span>
          </a>
          <a href="prayers.html?time=evening" class="prayer-link ${eveningClass}">
            <span class="prayer-mark">${eveningMark}</span>
            <span class="prayer-label">Evening Prayer</span>
          </a>
        </div>
        ${streakLine}
      </div>
    `;
  }

  // ── MARK A PRAYER COMPLETE ───────────────────────────────────────
  // Writes to mission_completions using the existing day_key dedup logic.
  async function markComplete(timeOfDay) {
    if (!sb || !profileId) return { ok: false, reason: 'not-initialized' };
    const missionKey = timeOfDay === 'morning' ? MORNING_MISSION_KEY : EVENING_MISSION_KEY;

    // Find the mission row by its key. If Chat 2's migration hasn't run yet,
    // this will return nothing — we degrade gracefully.
    const { data: missions, error: mErr } = await sb
      .from('missions')
      .select('id')
      .eq('key', missionKey)
      .limit(1);
    if (mErr || !missions || !missions.length) {
      return { ok: false, reason: 'mission-not-found', detail: 'Chat 2 migration likely not yet applied' };
    }
    const missionId = missions[0].id;

    // Check if already completed today.
    const dayKey = todayKey();
    const { data: existing } = await sb
      .from('mission_completions')
      .select('id')
      .eq('explorer_id', profileId)
      .eq('mission_id', missionId)
      .eq('day_key', dayKey)
      .limit(1);
    if (existing && existing.length) {
      return { ok: true, alreadyCompleted: true };
    }

    // Insert.
    const { error: iErr } = await sb
      .from('mission_completions')
      .insert([{
        explorer_id: profileId,
        mission_id: missionId,
        day_key: dayKey,
        completed_at: new Date().toISOString(),
      }]);
    if (iErr) return { ok: false, reason: 'insert-failed', error: iErr };
    return { ok: true, alreadyCompleted: false };
  }

  // ── GET TODAY'S COMPLETION STATUS ────────────────────────────────
  async function getTodayStatus(sbArg, profileIdArg) {
    // Args take precedence; closure-set sb/profileId (from init()) are
    // the back-compat fallback. Callers that supply args directly
    // (e.g. missions.js Missions.loadTodaysState) do not require a
    // prior Prayers.init() call. Callers that omit args (e.g.
    // prayers.html after Prayers.init(sb, profile.id)) continue to
    // work via closure.
    const _sb = sbArg || sb;
    const _profileId = profileIdArg || profileId;
    if (!_sb || !_profileId) return { morning: false, evening: false };
    const dayKey = todayKey();

    const { data: missions } = await _sb
      .from('missions')
      .select('id, key')
      .in('key', [MORNING_MISSION_KEY, EVENING_MISSION_KEY]);
    if (!missions || missions.length === 0) {
      return { morning: false, evening: false };
    }

    const missionMap = {};
    missions.forEach(m => { missionMap[m.id] = m.key; });

    const { data: completions } = await _sb
      .from('mission_completions')
      .select('mission_id')
      .eq('explorer_id', _profileId)
      .eq('day_key', dayKey)
      .in('mission_id', Object.keys(missionMap));

    const status = { morning: false, evening: false };
    (completions || []).forEach(c => {
      const key = missionMap[c.mission_id];
      if (key === MORNING_MISSION_KEY) status.morning = true;
      if (key === EVENING_MISSION_KEY) status.evening = true;
    });
    return status;
  }

  // ── COMPUTE THE STREAK ───────────────────────────────────────────
  // Dispatch 2 (locked architecture): consecutive INTACT WEEKS.
  //
  //   A week is INTACT if:
  //     either-prayer days >= 5
  //     OR either-prayer days == 4 AND grace_used == true (rescue)
  //   A week is BROKEN if:
  //     either-prayer days == 4 AND grace_used == false  → could rescue, but
  //       this is a read-only computation; if no grace persisted yet, the
  //       walk treats it as rescuable (grace would flip on settlement).
  //       But here we count it ONLY as intact if grace_used is already true,
  //       to keep getStreak() pure (no side-effects). Settlement (in
  //       prayer-rollup.js or a future Dispatch 5 path) flips the flag.
  //     either-prayer days <= 3
  //   The current in-progress week is NEVER counted toward the streak
  //   (still mid-flight) and never breaks it.
  //   Pilgrimage days are excluded from the threshold entirely.
  //
  //   Walk back from the LAST CLOSED week (the Saturday-or-earlier most
  //   recently completed) up to lookbackWeeks. Stop on the first broken
  //   week. Return the count.
  //
  //   opts (all optional):
  //     today          — Date for testability; defaults to now
  //     lookbackWeeks  — int, default 12
  async function getStreak(opts) {
    if (!sb || !profileId) return 0;
    opts = opts || {};
    const W = (typeof window !== 'undefined' && window.WeekUtils) || null;
    if (!W) {
      // WeekUtils must be loaded; if it isn't, we can't compute weekly
      // streak math safely. Return 0 rather than risk a wrong answer.
      console.warn('Prayers.getStreak: WeekUtils not loaded; returning 0');
      return 0;
    }
    const today = opts.today || new Date();
    const lookbackWeeks = opts.lookbackWeeks || 12;

    // 1. Resolve mission ids for morning/evening keys.
    const { data: missions } = await sb
      .from('missions')
      .select('id, key')
      .in('key', [MORNING_MISSION_KEY, EVENING_MISSION_KEY]);
    if (!missions || missions.length < 2) return 0;
    const missionMap = {};
    missions.forEach(m => { missionMap[m.id] = m.key; });

    // 2. Window: from (lookbackWeeks weeks ago) up through the LAST CLOSED
    //    week. The current in-progress week is excluded from streak math.
    const currentWeekStart = W.getWeekStart(today);                  // this week's Sunday
    const lastClosedWeekStart = W.addDays(currentWeekStart, -7);      // prior Sunday
    const oldestWeekStart = W.addDays(currentWeekStart, -7 * lookbackWeeks);
    const oldestKey = W.ymd(oldestWeekStart);
    const lastClosedKey = W.ymd(lastClosedWeekStart);

    // If the last closed week is already older than ANY recorded
    // mission_completion, the streak is 0 (no settled weeks yet).

    // 3. Pull mission_completions for the lookback window.
    const lookbackOldestKey = W.ymd(W.addDays(oldestWeekStart, -1));  // 1 day cushion
    const { data: completions } = await sb
      .from('mission_completions')
      .select('mission_id, day_key')
      .eq('explorer_id', profileId)
      .gte('day_key', lookbackOldestKey)
      .in('mission_id', Object.keys(missionMap));

    // 4. Pull prayer_streak_weekly grace flags for the same window.
    let graceByWeek = {};
    try {
      const { data: rows } = await sb
        .from('prayer_streak_weekly')
        .select('week_start_date, grace_used')
        .eq('explorer_id', profileId)
        .gte('week_start_date', oldestKey)
        .lte('week_start_date', lastClosedKey);
      (rows || []).forEach(r => { graceByWeek[r.week_start_date] = !!r.grace_used; });
    } catch (e) {
      console.warn('Prayers.getStreak: grace flag read failed (assuming false):', e);
    }

    // 5. Build day → either-prayer-completed map.
    const eitherByDay = {};
    (completions || []).forEach(c => {
      eitherByDay[c.day_key] = true;
    });

    // 6. Pull pilgrimage rows (cached helper).
    let pilgrimRows = [];
    if (typeof window !== 'undefined' && window.Pilgrimages) {
      try {
        pilgrimRows = await window.Pilgrimages.loadPilgrimages(sb);
      } catch (_e) { /* graceful: no pilgrim data → no exclusions */ }
    }
    function _pilgrimOn(dateKey) {
      for (let i = 0; i < pilgrimRows.length; i++) {
        const row = pilgrimRows[i];
        if (row.status === 'cancelled') continue;
        if (!row.start_date || !row.end_date) continue;
        if (row.start_date <= dateKey && dateKey <= row.end_date) return true;
      }
      return false;
    }

    // 7. Walk back week-by-week from lastClosedWeekStart.
    let streak = 0;
    let cursor = lastClosedWeekStart;
    for (let w = 0; w < lookbackWeeks; w++) {
      const weekStartKey = W.ymd(cursor);
      // Count either-prayer days and pilgrimage days in this week.
      let eitherDays = 0;
      let pilgrimDays = 0;
      for (let d = 0; d < 7; d++) {
        const dKey = W.ymd(W.addDays(cursor, d));
        if (_pilgrimOn(dKey)) {
          pilgrimDays++;
          continue;
        }
        if (eitherByDay[dKey]) eitherDays++;
      }
      const activeDays = 7 - pilgrimDays;
      const graceUsed = !!graceByWeek[weekStartKey];

      // All-pilgrimage week: streak is preserved (neither counted nor broken)
      if (activeDays === 0) {
        // Don't increment; don't break. Move on to the prior week.
        cursor = W.addDays(cursor, -7);
        continue;
      }

      // Threshold scaling: 5/7 of active days, with floor of 1 if activeDays
      // is small. Standard week (activeDays=7): need ≥5 either-days for clean
      // intact, or ≥4 with grace for rescued intact.
      const intactThreshold = Math.max(1, Math.ceil(activeDays * 5 / 7));   // 5 when activeDays=7
      const rescueThreshold = Math.max(1, intactThreshold - 1);              // 4 when activeDays=7

      let intact = false;
      if (eitherDays >= intactThreshold) {
        intact = true;
      } else if (eitherDays >= rescueThreshold && graceUsed) {
        intact = true;
      }

      if (intact) {
        streak++;
        cursor = W.addDays(cursor, -7);
      } else {
        // First broken week stops the walk.
        break;
      }
    }
    return streak;
  }

  // ── FULL CROWN ELIGIBILITY ───────────────────────────────────────
  // Dispatch 2: helper for Dispatch 5's Sunday Celebration variant.
  // Returns true if the given week (defaults to last-closed) had BOTH
  // morning AND evening prayers on every one of the 7 days. Pilgrim
  // days are still required to have both prayers — Full Crown is the
  // optional perfection path; pilgrim grace doesn't apply here.
  //
  //   weekStart  — Date | 'YYYY-MM-DD' | undefined (defaults to last-closed)
  async function getFullCrownEligibility(weekStart) {
    if (!sb || !profileId) return false;
    const W = (typeof window !== 'undefined' && window.WeekUtils) || null;
    if (!W) return false;
    let weekStartDate;
    if (!weekStart) {
      weekStartDate = W.addDays(W.getCurrentWeekStart(), -7);
    } else if (typeof weekStart === 'string') {
      const [y, m, d] = weekStart.split('-').map(Number);
      weekStartDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    } else {
      weekStartDate = weekStart;
    }
    const startKey = W.ymd(weekStartDate);
    const endKey = W.ymd(W.addDays(weekStartDate, 6));

    const { data: missions } = await sb
      .from('missions')
      .select('id, key')
      .in('key', [MORNING_MISSION_KEY, EVENING_MISSION_KEY]);
    if (!missions || missions.length < 2) return false;
    const missionMap = {};
    missions.forEach(m => { missionMap[m.id] = m.key; });

    const { data: completions } = await sb
      .from('mission_completions')
      .select('mission_id, day_key')
      .eq('explorer_id', profileId)
      .gte('day_key', startKey)
      .lte('day_key', endKey)
      .in('mission_id', Object.keys(missionMap));

    const byDay = {};
    (completions || []).forEach(c => {
      const slot = missionMap[c.mission_id];
      if (!byDay[c.day_key]) byDay[c.day_key] = { morning: false, evening: false };
      byDay[c.day_key][slot === MORNING_MISSION_KEY ? 'morning' : 'evening'] = true;
    });

    for (let d = 0; d < 7; d++) {
      const dKey = W.ymd(W.addDays(weekStartDate, d));
      const day = byDay[dKey];
      if (!day || !day.morning || !day.evening) return false;
    }
    return true;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  return {
    init,
    renderPrayer,
    renderPanel,
    markComplete,
    getTodayStatus,
    getStreak,
    getFullCrownEligibility,
    variantForState,
    _internals: { todayKey, esc, MORNING_MISSION_KEY, EVENING_MISSION_KEY },
  };
})();

if (typeof window !== 'undefined') window.Prayers = Prayers;
if (typeof module !== 'undefined' && module.exports) module.exports = Prayers;
