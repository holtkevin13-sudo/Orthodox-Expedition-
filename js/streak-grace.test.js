/* ─────────────────────────────────────────────────────────────────
   js/streak-grace.test.js — Repair B unit tests

   Runs under node (no browser). Per Op Learning #11, tests load the
   actual module via `require('./streak-grace.js')` so any rename or
   signature change breaks the build, not the runtime.

   Run:  node js/streak-grace.test.js
   ─────────────────────────────────────────────────────────────── */

const SG = require('./streak-grace.js');

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label, detail || ''); }
}

// ── ymd / getCurrentMonday ───────────────────────────────────────
const may8 = new Date(2026, 4, 8);   // Fri May 8 2026
const may4 = new Date(2026, 4, 4);   // Mon May 4 2026
const may10 = new Date(2026, 4, 10); // Sun May 10 2026
const may11 = new Date(2026, 4, 11); // Mon May 11 2026

ok('ymd local', SG.ymd(may8) === '2026-05-08');
ok('Monday from Friday', SG.ymd(SG.getCurrentMonday(may8)) === '2026-05-04');
ok('Monday is itself', SG.ymd(SG.getCurrentMonday(may4)) === '2026-05-04');
ok('Sunday → previous Monday', SG.ymd(SG.getCurrentMonday(may10)) === '2026-05-04');
ok('Next Monday rolls over', SG.ymd(SG.getCurrentMonday(may11)) === '2026-05-11');

// ── classifyDay ──────────────────────────────────────────────────
ok('both', SG.classifyDay({ morning:true, evening:true }) === 'both');
ok('half (morning only)', SG.classifyDay({ morning:true, evening:false }) === 'half');
ok('half (evening only)', SG.classifyDay({ morning:false, evening:true }) === 'half');
ok('none', SG.classifyDay({ morning:false, evening:false }) === 'none');
ok('null → none', SG.classifyDay(null) === 'none');
ok('undefined → none', SG.classifyDay(undefined) === 'none');

// ── computePrayerStreak ──────────────────────────────────────────
function dayMap(entries) {
  const m = {};
  entries.forEach(e => { m[e[0]] = { morning: e[1], evening: e[2] }; });
  return m;
}

// Case 1: 5 perfect days back from Friday May 8 — streak should be 5
//         (today both done) up through Mon May 4 also both. May 3 (Sun)
//         missing — but we stop at the streak break.
{
  const byDay = dayMap([
    ['2026-05-08', true, true],
    ['2026-05-07', true, true],
    ['2026-05-06', true, true],
    ['2026-05-05', true, true],
    ['2026-05-04', true, true],
    // 05-03 missing (Sun) — last week
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  ok('5 perfect days = streak 5', r.streak === 5, 'got '+r.streak);
  ok('no grace consumed', r.weeksWithGrace.length === 0);
}

// Case 2: Half-miss on Wednesday inside the current week → grace
//         absorbs, streak still counts the half day.
{
  const byDay = dayMap([
    ['2026-05-08', true, true],   // Fri (today)  — both
    ['2026-05-07', true, true],   // Thu — both
    ['2026-05-06', true, false],  // Wed — half (only morning)
    ['2026-05-05', true, true],   // Tue — both
    ['2026-05-04', true, true],   // Mon — both
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  ok('half-miss day with grace = streak 5', r.streak === 5, 'got '+r.streak);
  ok('grace consumed for current week', r.weeksWithGrace.indexOf('2026-05-04') !== -1);
}

// Case 3: Two half-miss days in same week → streak breaks at 2nd
//         (second-most-recent in walk order).
{
  const byDay = dayMap([
    ['2026-05-08', true, true],   // Fri — both
    ['2026-05-07', true, false],  // Thu — half  (1st miss in walk, grace absorbed)
    ['2026-05-06', true, false],  // Wed — half  (2nd miss → break)
    ['2026-05-05', true, true],
    ['2026-05-04', true, true],
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  // walk: Fri (both, +1), Thu (half, grace absorbs, +1), Wed (half, break)
  ok('two half-misses in week = streak 2', r.streak === 2, 'got '+r.streak);
}

// Case 4: Full miss day → always breaks regardless of grace.
{
  const byDay = dayMap([
    ['2026-05-08', true, true],
    ['2026-05-07', true, true],
    ['2026-05-06', false, false],   // Wed — full miss (no grace can absorb)
    ['2026-05-05', true, true],
    ['2026-05-04', true, true],
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  ok('full miss always breaks = streak 2', r.streak === 2, 'got '+r.streak);
  ok('full miss does not consume grace', r.weeksWithGrace.length === 0);
}

// Case 5: Today not yet prayed → don't break, don't increment.
//         Streak should equal yesterday's running count.
{
  const byDay = dayMap([
    // 05-08 Fri (today) — no entry, none
    ['2026-05-07', true, true],
    ['2026-05-06', true, true],
    ['2026-05-05', true, true],
    ['2026-05-04', true, true],
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  ok('today none but past 4 days perfect = streak 4', r.streak === 4, 'got '+r.streak);
}

// Case 6: Today half (morning done, evening pending) → today doesn't
//         break or increment, but past days still count. No grace
//         consumed for today's half (today is special).
{
  const byDay = dayMap([
    ['2026-05-08', true, false],   // Fri (today) morning only
    ['2026-05-07', true, true],
    ['2026-05-06', true, true],
    ['2026-05-05', true, true],
    ['2026-05-04', true, true],
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  ok('today half = streak 4 (past 4 days)', r.streak === 4, 'got '+r.streak);
  ok('today half does not consume grace', r.weeksWithGrace.length === 0);
}

// Case 7: Half-miss in CURRENT week + half-miss in LAST week →
//         each week independently has grace, streak survives both.
{
  const byDay = dayMap([
    ['2026-05-08', true, true],   // Fri (this week)
    ['2026-05-07', true, true],
    ['2026-05-06', true, false],  // Wed (this week) half — grace absorbs
    ['2026-05-05', true, true],
    ['2026-05-04', true, true],   // Mon (this week)
    ['2026-05-03', true, true],   // Sun (last week)
    ['2026-05-02', true, false],  // Sat (last week) half — grace absorbs (different week)
    ['2026-05-01', true, true],
    ['2026-04-30', true, true],
    ['2026-04-29', true, true],
    ['2026-04-28', true, true],
    ['2026-04-27', true, true],
  ]);
  const r = SG.computePrayerStreak(byDay, may8, 30);
  ok('grace per week independent = streak 12', r.streak === 12, 'got '+r.streak);
  ok('two distinct weeks consumed grace', r.weeksWithGrace.length === 2);
}

// ── evaluateSessionWeek ──────────────────────────────────────────
const weekStart = SG.getCurrentMonday(may8); // Mon May 4

// Case 1: Mon and Wed completed by Friday → no miss.
{
  const progress = {
    day_1_completed_at: '2026-05-04T10:00:00Z',
    day_2_completed_at: '2026-05-06T10:00:00Z',
    day_3_completed_at: null,
  };
  const r = SG.evaluateSessionWeek(progress, may8, weekStart);
  // Fri (today) day_3 not yet due as "past" — today not counted as miss.
  ok('Mon+Wed done, Fri today = 0 miss', r.missedDaysSoFar === 0, 'got '+r.missedDaysSoFar);
  ok('no grace needed', r.graceShouldBeUsed === false);
  ok('no week broken', r.weekBroken === false);
}

// Case 2: Mon completed, Wed missed (today is Friday).
{
  const progress = {
    day_1_completed_at: '2026-05-04T10:00:00Z',
    day_2_completed_at: null,
    day_3_completed_at: null,
  };
  const r = SG.evaluateSessionWeek(progress, may8, weekStart);
  // Fri (today): Mon=past+done, Wed=past+missed=miss, Fri=today (skipped).
  ok('Wed missed = 1 miss', r.missedDaysSoFar === 1, 'got '+r.missedDaysSoFar);
  ok('grace pip should show', r.graceShouldBeUsed === true);
  ok('week not broken (only 1 miss)', r.weekBroken === false);
}

// Case 3: Both Mon and Wed missed by Friday → week broken.
{
  const progress = {
    day_1_completed_at: null,
    day_2_completed_at: null,
    day_3_completed_at: null,
  };
  const r = SG.evaluateSessionWeek(progress, may8, weekStart);
  ok('Mon+Wed missed = 2 misses', r.missedDaysSoFar === 2, 'got '+r.missedDaysSoFar);
  ok('grace used', r.graceShouldBeUsed === true);
  ok('week broken', r.weekBroken === true);
}

// Case 4: Null progress row (no session_progress yet) on Tuesday — Mon
//         is the only past slot; it's missed.
{
  const tue = new Date(2026, 4, 5);
  const r = SG.evaluateSessionWeek(null, tue, weekStart);
  ok('Tuesday with no progress = 1 miss (Mon)', r.missedDaysSoFar === 1, 'got '+r.missedDaysSoFar);
  ok('grace used Tuesday', r.graceShouldBeUsed === true);
  ok('week not broken Tuesday', r.weekBroken === false);
}

// Case 5: Monday morning, no progress yet → 0 misses (Mon hasn't passed).
{
  const monMorning = new Date(2026, 4, 4, 8, 0); // Mon 8am
  const r = SG.evaluateSessionWeek(null, monMorning, weekStart);
  ok('Mon morning no progress = 0 miss (today not past)', r.missedDaysSoFar === 0, 'got '+r.missedDaysSoFar);
  ok('Mon morning no grace', r.graceShouldBeUsed === false);
}

// Case 6: Saturday with everything done → 0 misses, no grace.
{
  const sat = new Date(2026, 4, 9);
  const progress = {
    day_1_completed_at: '2026-05-04T10:00:00Z',
    day_2_completed_at: '2026-05-06T10:00:00Z',
    day_3_completed_at: '2026-05-08T10:00:00Z',
  };
  const r = SG.evaluateSessionWeek(progress, sat, weekStart);
  ok('Sat all done = 0 miss', r.missedDaysSoFar === 0);
  ok('Sat all done = no grace', r.graceShouldBeUsed === false);
}

console.log('\n' + pass + ' pass, ' + fail + ' fail');
if (fail > 0) process.exit(1);
