/**
 * Orthodox Expedition — Game Utilities
 * Include this in every game file AFTER the Supabase script tag
 * Usage: await GameUtils.init()  then  await GameUtils.awardCoins(won)
 */

const SUPABASE_URL = 'https://ksfnsryfmkafwirzgjoe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzZm5zcnlmbWthZndpcnpnam9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODM4MTcsImV4cCI6MjA5MTI1OTgxN30.mHQty44WBnjQY8BJ8KbPk_pp-yTcOaifGxCZPUO4xpY';

const GameUtils = (() => {
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
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
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

  // ── AWARD COINS (Session Games Only) ─────────────────────────
  // gameId: string identifier for this game
  // won: boolean — did they win (score >= 80%)?
  // gameTitle: display name for the activity log
  async function awardCoins(gameId, won, gameTitle) {
    if (!sb || !profile) return { awarded: 0, alreadyPlayed: false };

    const alreadyPlayed = await hasPlayedToday(gameId);
    if (alreadyPlayed) return { awarded: 0, alreadyPlayed: true };

    const playCoins = 10;
    const winCoins  = won ? 20 : 0;
    const total     = playCoins + winCoins;

    const newCoins    = (profile.coins    || 0) + total;
    const newLifetime = (profile.lifetime_coins || 0) + total;

    const logEntries = [
      {
        explorer_id: profile.id,
        amount:      playCoins,
        reason:      `Game played: ${gameId}`,
        created_at:  new Date().toISOString(),
      }
    ];
    if (won) {
      logEntries.push({
        explorer_id: profile.id,
        amount:      winCoins,
        reason:      `Game won: ${gameId}`,
        created_at:  new Date().toISOString(),
      });
    }

    await Promise.all([
      sb.from('profiles').update({
        coins:         newCoins,
        lifetime_coins: newLifetime,
      }).eq('id', profile.id),
      sb.from('activity_log').insert(logEntries),
    ]);

    profile.coins         = newCoins;
    profile.lifetime_coins = newLifetime;

    return { awarded: total, alreadyPlayed: false, won };
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

  function showCoinReminder(gameId, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    hasPlayedToday(gameId).then(already => {
      if (already) {
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

  return { init, awardCoins, hasPlayedToday, getProfile, coinRain, showCoinReminder, getCoinStatus };
})();
