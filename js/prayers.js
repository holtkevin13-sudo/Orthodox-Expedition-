/**
 * Orthodox Expedition — Daily Prayers Module
 *
 * Renders the morning and evening prayer surfaces. Tracks completion via
 * the existing mission_completions table. Computes the daily prayer streak.
 *
 * Two prayer sets — pre-Chrismation (simpler) and full (post-Chrismation,
 * including the Symbol of Faith). Switches automatically based on the
 * explorer's current_session_id from the day-state machine.
 *
 * Public API:
 *   await Prayers.init()                  — load prayer JSON
 *   Prayers.renderPrayer(timeOfDay, ...)  — return HTML string for full prayer page
 *   Prayers.renderPanel(state, status)    — small "today's prayers" card for week.html
 *   await Prayers.markComplete(timeOfDay) — log a completion to mission_completions
 *   await Prayers.getTodayStatus()        — { morning: bool, evening: bool }
 *   await Prayers.getStreak()             — integer
 *
 * No DOM mutation in this module beyond returning strings. Caller drops them in.
 */

const Prayers = (() => {

  // ── STATE ────────────────────────────────────────────────────────
  let prayerSet = null;       // loaded JSON
  let sb = null;              // Supabase client (provided by caller)
  let profileId = null;       // explorer profile id (provided by caller)

  // Mission ids — these will be inserted by Chat 2's migration (see below).
  // Until then, mission lookups will fail gracefully.
  const MORNING_MISSION_KEY = 'morning_prayer';
  const EVENING_MISSION_KEY = 'evening_prayer';

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
      ? `<div class="prayer-panel-streak">${status.streak} day${status.streak === 1 ? '' : 's'} of faithful prayer</div>`
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
      .eq('profile_id', profileId)
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
        profile_id: profileId,
        mission_id: missionId,
        day_key: dayKey,
        completed_at: new Date().toISOString(),
      }]);
    if (iErr) return { ok: false, reason: 'insert-failed', error: iErr };
    return { ok: true, alreadyCompleted: false };
  }

  // ── GET TODAY'S COMPLETION STATUS ────────────────────────────────
  async function getTodayStatus() {
    if (!sb || !profileId) return { morning: false, evening: false };
    const dayKey = todayKey();

    const { data: missions } = await sb
      .from('missions')
      .select('id, key')
      .in('key', [MORNING_MISSION_KEY, EVENING_MISSION_KEY]);
    if (!missions || missions.length === 0) {
      return { morning: false, evening: false };
    }

    const missionMap = {};
    missions.forEach(m => { missionMap[m.id] = m.key; });

    const { data: completions } = await sb
      .from('mission_completions')
      .select('mission_id')
      .eq('profile_id', profileId)
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
  // Walk back from today; count unbroken consecutive days where BOTH
  // morning and evening prayers were marked complete.
  // Uses a 60-day lookback window — anything longer is outside the sane
  // streak range and we'd want a different surface for it anyway.
  async function getStreak() {
    if (!sb || !profileId) return 0;

    const { data: missions } = await sb
      .from('missions')
      .select('id, key')
      .in('key', [MORNING_MISSION_KEY, EVENING_MISSION_KEY]);
    if (!missions || missions.length < 2) return 0;

    const missionMap = {};
    missions.forEach(m => { missionMap[m.id] = m.key; });

    // Pull last 60 days of completions.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const cutoffStr = cutoff.toISOString().slice(0,10);

    const { data: completions } = await sb
      .from('mission_completions')
      .select('mission_id, day_key')
      .eq('profile_id', profileId)
      .gte('day_key', cutoffStr)
      .in('mission_id', Object.keys(missionMap));

    // Build a map: day_key -> {morning: bool, evening: bool}
    const byDay = {};
    (completions || []).forEach(c => {
      const key = missionMap[c.mission_id];
      if (!byDay[c.day_key]) byDay[c.day_key] = { morning: false, evening: false };
      byDay[c.day_key][key === MORNING_MISSION_KEY ? 'morning' : 'evening'] = true;
    });

    // Walk back from today.
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 60; i++) {
      const dKey = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
      const day = byDay[dKey];
      // Today is special: don't break the streak just because today's evening
      // prayer hasn't been said yet. Only count today if BOTH are done; if
      // today has at least one done, streak continues from yesterday.
      if (i === 0) {
        if (day && day.morning && day.evening) streak++;
        // else don't increment but don't break either — streak stands.
      } else {
        if (day && day.morning && day.evening) streak++;
        else break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  return {
    init,
    renderPrayer,
    renderPanel,
    markComplete,
    getTodayStatus,
    getStreak,
    variantForState,
    _internals: { todayKey, esc, MORNING_MISSION_KEY, EVENING_MISSION_KEY },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Prayers;
