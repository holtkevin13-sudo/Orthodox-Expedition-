/**
 * Orthodox Expedition — Game Utilities
 * Include this in every game file AFTER the Supabase script tag
 * Usage: await GameUtils.init()  then  await GameUtils.awardCoins(won)
 *
 * ─── Repair Q (May 9, 2026 — Item 14) ────────────────────────────
 * Added a 150-coin/week aggregate cap on coins earned across all 8 coin-
 * awarding games, boundaried Monday–Sunday in America/New_York. The cap
 * layers ON TOP of the existing per-game daily throttle (max 30/game/day
 * via hasPlayedToday) — both checks fire on every play. Once reached,
 * awardCoins returns { awarded: 0, weeklyCapReached: true } and no DB
 * write occurs.
 *
 * Partial-credit boundary: if remaining < playCoins+winCoins, awarded is
 * trimmed via Math.min and weeklyCapReached is set true so the gentle
 * cap-reached toast can render on the boundary play. Activity-log rows
 * are split to sum to the actual `total` awarded, preserving the audit
 * invariant that SUM(activity_log.amount) == profile.coins delta.
 *
 * Schema dependency: profiles.weekly_game_coins_used (int NOT NULL DEFAULT 0)
 *                  + profiles.last_game_week_start (date, nullable)
 * Migration: game_coin_weekly_cap_20260509
 *
 * Bonus fix: todayKey() now resolves America/New_York date instead of UTC,
 * so the per-game daily throttle and the weekly cap share boundary moments.
 * (Per dispatch: only todayKey() is updated; hasPlayedToday's threshold
 * construction is untouched per the "do not modify the per-game daily
 * throttle" constraint. Residual ~4hr UTC slop in the daily throttle
 * window is acceptable — false-positive throttle, not false-negative.)
 */

const SUPABASE_URL = 'https://ksfnsryfmkafwirzgjoe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZm5zcnlmbWthZndpcnpnam9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODM4MTcsImV4cCI6MjA5MTI1OTgxN30.mHQty44WBnjQY8BJ8KbPk_pp-yTcOaifGxCZPUO4xpY';

const GameUtils = (() => {
  // Repair Q: weekly cap value. Locked by Repair P games audit.
  const WEEKLY_GAME_COIN_CAP = 150;

  let sb = null;
  let profile = null;

  // ── INIT ─────────────────────────────────────────────────────
  async function init() {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
      const timer = new Promise(r => setTimeout(() => r(null), 4000));
      const res   = await Promise.race([sb.auth.getSession(), timer]);
      const session = res?.data?.session ?? null;

      if (!session) {
        window.location.href = '../index.html';
        return null;
      }

      const { data: prof } = await sb.from('profiles')
        .select('*').eq('id', session.user.id).single();

      if (!prof) {
        window.location.href = '../index.html';
        return null;
      }

      profile = prof;
      return prof;
    } catch (e) {
      console.error('GameUtils init error:', e);
      return null;
    }
  }

  // ── TODAY KEY ─────────────────────────────────────────────────
  // Repair Q: switched from UTC to America/New_York. Same intent as the
  // weekly cap rollover — a single timezone for both the per-game daily
  // throttle and the new weekly cap so they share boundary moments.
  function todayKey() {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return fmt.format(new Date()); // "YYYY-MM-DD" in NY local time
  }

  // ── CURRENT MONDAY (ET) ───────────────────────────────────────
  // Repair Q: returns YYYY-MM-DD of the current ET-week's Monday. The
  // weekday math runs on the ET calendar date (built from todayKey()),
  // so it's stable regardless of the device's local timezone.
  function getCurrentMondayET() {
    const todayET = todayKey(); // "YYYY-MM-DD" in ET
    const [y, m, d] = todayET.split('-').map(Number);
    // Anchor as UTC-noon to neutralize any local-tz parsing interference;
    // we only care about the calendar weekday of the ET date.
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dow = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = (dow === 0) ? -6 : 1 - dow;
    date.setUTCDate(date.getUTCDate() + diff);
    const yy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return yy + '-' + mm + '-' + dd;
  }

  // ── EFFECTIVE WEEKLY USED (rollover-aware, no DB write) ──────
  // Repair Q: returns the weekly_game_coins_used value the explorer
  // *would* have after a rollover check, given the local profile cache.
  // 0 if last_game_week_start is NULL or stale; profile's stored value
  // otherwise. Used by both awardCoins (write path) and the public
  // getRemainingWeeklyGameCoins helper (read path).
  function effectiveWeeklyUsed(currentMondayKey) {
    if (!profile) return 0;
    if (profile.last_game_week_start !== currentMondayKey) return 0;
    return profile.weekly_game_coins_used || 0;
  }

  // ── CHECK IF ALREADY PLAYED TODAY ────────────────────────────
  async function hasPlayedToday(gameId) {
    if (!sb || !profile) return false;
    const { data } = await sb.from('activity_log')
      .select('id')
      .eq('explorer_id', profile.id)
      .eq('reason', `Game played: ${gameId}`)
      .gte('created_at', todayKey() + 'T00:00:00.000Z')
      .limit(1);
    return data && data.length > 0;
  }

  // ── REMAINING WEEKLY GAME COINS (public, read-only) ──────────
  // Repair Q: rollover-aware remaining-quota helper for surfaces that
  // need to render cap state (showCoinReminder, future home/missions
  // pills if Kevin ever wants them). Does NOT write — the rollover write
  // happens inside awardCoins on the next play.
  function getRemainingWeeklyGameCoins() {
    if (!profile) return WEEKLY_GAME_COIN_CAP;
    const used = effectiveWeeklyUsed(getCurrentMondayET());
    const remaining = WEEKLY_GAME_COIN_CAP - used;
    return remaining < 0 ? 0 : remaining;
  }

  // ── AWARD COINS (Session Games Only) ─────────────────────────
  // gameId: string identifier for this game
  // won: boolean — did they win (score >= 80%)?
  // gameTitle: display name for the activity log
  //
  // Return shape (Repair Q-extended):
  //   { awarded:int, alreadyPlayed:bool, won:bool, weeklyCapReached:bool }
  // weeklyCapReached is true when (a) cap blocked the award entirely
  // (awarded === 0), OR (b) the boundary trimmed the award (awarded > 0
  // but less than playCoins+winCoins).
  async function awardCoins(gameId, won, gameTitle) {
    if (!sb || !profile) return { awarded: 0, alreadyPlayed: false, won: !!won, weeklyCapReached: false };

    // Per-game daily throttle (unchanged).
    const alreadyPlayed = await hasPlayedToday(gameId);
    if (alreadyPlayed) return { awarded: 0, alreadyPlayed: true, won: !!won, weeklyCapReached: false };

    // Repair Q: weekly cap rollover-aware check.
    const currentMondayKey = getCurrentMondayET();
    const usedThisWeek = effectiveWeeklyUsed(currentMondayKey);
    const remaining = WEEKLY_GAME_COIN_CAP - usedThisWeek;

    // Cap-check branch: full block, no DB write.
    if (remaining <= 0) {
      return { awarded: 0, alreadyPlayed: false, won: !!won, weeklyCapReached: true };
    }

    const playCoins    = 10;
    const winCoins     = won ? 20 : 0;
    const desiredAward = playCoins + winCoins;
    const total        = Math.min(desiredAward, remaining); // partial credit on the boundary

    const newCoins       = (profile.coins          || 0) + total;
    const newLifetime    = (profile.lifetime_coins || 0) + total;
    const newWeeklyUsed  = usedThisWeek + total; // already rollover-aware via effectiveWeeklyUsed

    // Build activity_log entries that sum to `total`. Preserves the
    // SUM(amount) == coins-delta invariant on the partial-credit boundary
    // (where desiredAward > total). The "Game played" row is always
    // present so hasPlayedToday continues to work as the daily throttle.
    const nowIso = new Date().toISOString();
    const logEntries = [];
    let amountRemaining = total;
    const playAmount = Math.min(playCoins, amountRemaining);
    if (playAmount > 0) {
      logEntries.push({
        explorer_id: profile.id,
        amount:      playAmount,
        reason:      `Game played: ${gameId}`,
        created_at:  nowIso,
      });
      amountRemaining -= playAmount;
    }
    if (won && amountRemaining > 0) {
      logEntries.push({
        explorer_id: profile.id,
        amount:      amountRemaining,
        reason:      `Game won: ${gameId}`,
        created_at:  nowIso,
      });
      amountRemaining = 0;
    }

    // Atomic-shape UPDATE: bumps coins/lifetime AND sets the weekly-cap
    // pointer columns in the same statement. last_game_week_start is set
    // unconditionally to currentMondayKey so a stale prior-week pointer
    // is brought forward as part of the award write (the rollover).
    await Promise.all([
      sb.from('profiles').update({
        coins:                   newCoins,
        lifetime_coins:          newLifetime,
        weekly_game_coins_used:  newWeeklyUsed,
        last_game_week_start:    currentMondayKey,
      }).eq('id', profile.id),
      sb.from('activity_log').insert(logEntries),
    ]);

    profile.coins                  = newCoins;
    profile.lifetime_coins         = newLifetime;
    profile.weekly_game_coins_used = newWeeklyUsed;
    profile.last_game_week_start   = currentMondayKey;

    return {
      awarded:          total,
      alreadyPlayed:    false,
      won:              !!won,
      weeklyCapReached: total < desiredAward, // true iff boundary trimmed
    };
  }

  // ── GET PROFILE ───────────────────────────────────────────────
  function getProfile() { return profile; }

  // ── COIN RAIN ─────────────────────────────────────────────────
  function coinRain(containerId = 'coin-rain', amount = 30) {
    const c = document.getElementById(containerId);
    if (!c) return;
    const n = Math.min(Math.floor(amount / 5) + 4, 18);
    const symbols = ['✦', '◈', '☩', '⊕'];
    const colors  = ['#ffd700', '#f0c96e', '#c9922a'];
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.style.cssText = `
          position:absolute;top:-60px;font-size:1.5rem;
          left:${Math.random() * 92}vw;
          color:${colors[Math.floor(Math.random() * colors.length)]};
          animation:coinFall ${1.2 + Math.random() * 1.8}s linear forwards;
          filter:drop-shadow(0 0 6px #ffd700);
          pointer-events:none;
        `;
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        c.appendChild(el);
        setTimeout(() => el.remove(), 3500);
      }, i * 70);
    }
  }

  // ── COIN REMINDER ─────────────────────────────────────────────
  async function getCoinStatus(gameId) {
    if (!sb || !profile) return { earned: false };
    const already = await hasPlayedToday(gameId);
    return { earned: already };
  }

  // showCoinReminder renders the pre-game status pill. Three states,
  // with cap-reached taking precedence over already-played-today (because
  // "come back tomorrow" is misleading when the user is capped — they
  // need to wait until Monday for the pool to refresh).
  function showCoinReminder(gameId, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    hasPlayedToday(gameId).then(already => {
      const remaining = getRemainingWeeklyGameCoins();
      const capReached = remaining <= 0;

      if (capReached) {
        // Repair Q: gentle cap-reached state. Same parchment palette as
        // the already-played pill (muted gold + cream), never red, never
        // punitive. Frames Monday as the refresh moment.
        el.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:0.4rem;
          background:rgba(201,146,42,0.08);border:1px solid rgba(201,146,42,0.2);
          border-radius:8px;padding:0.4rem 0.75rem;
          font-family:'Cinzel',serif;font-size:0.62rem;color:rgba(201,146,42,0.5);">
            ✦ This week's game-coin pool is full — come back Monday for a fresh pool!
          </div>`;
      } else if (already) {
        el.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:0.4rem;
          background:rgba(201,146,42,0.08);border:1px solid rgba(201,146,42,0.2);
          border-radius:8px;padding:0.4rem 0.75rem;
          font-family:'Cinzel',serif;font-size:0.62rem;color:rgba(201,146,42,0.5);">
            ✦ Coins already earned today — come back tomorrow!
          </div>`;
      } else {
        el.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;gap:0.4rem;
          background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.2);
          border-radius:8px;padding:0.4rem 0.75rem;
          font-family:'Cinzel',serif;font-size:0.62rem;color:rgba(134,239,172,0.7);">
            ⚔ Earn 10 coins for playing · 20 for winning
          </div>`;
      }
    });
  }

  return {
    init,
    awardCoins,
    hasPlayedToday,
    getProfile,
    coinRain,
    showCoinReminder,
    getCoinStatus,
    getRemainingWeeklyGameCoins, // Repair Q: public read-only helper
  };
})();
