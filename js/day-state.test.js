/**
 * Test harness for day-state.js.
 * Run: node js/day-state.test.js
 *
 * Pure node, no test framework needed. Prints PASS/FAIL.
 */

const fs = require('fs');
const path = require('path');

const DayState = require('./day-state.js');
const spine = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config', 'program-spine.json'), 'utf8'
));

let passed = 0, failed = 0;

function test(label, dateStr, expected) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const today = new Date(y, m - 1, d);
  const got = DayState.compute(today, spine);

  let ok = true;
  const mismatches = [];
  for (const k of Object.keys(expected)) {
    if (got[k] !== expected[k]) {
      ok = false;
      mismatches.push(`  ${k}: expected ${JSON.stringify(expected[k])}, got ${JSON.stringify(got[k])}`);
    }
  }

  if (ok) {
    console.log(`  ✓ ${label} (${dateStr})`);
    passed++;
  } else {
    console.log(`  ✗ ${label} (${dateStr})`);
    mismatches.forEach(m => console.log(m));
    failed++;
  }
}

console.log('\n── PRE-LAUNCH ──');
test('day before launch', '2026-05-17', {
  day_kind: 'pre_launch',
  phase: 'pre_launch',
  current_session_id: null,
  next_session_starts_on: '2026-05-18',
});
test('months before launch', '2026-01-01', {
  day_kind: 'pre_launch',
  phase: 'pre_launch',
});

console.log('\n── TOPIC 00 (M/W/F three-day model — same cadence as Year 1+) ──');
test('launch day, Monday May 18', '2026-05-18', {
  day_kind: 'day1',
  phase: 'topic_00',
  current_session_id: '00.1',
  session_week_number: 1,
  is_topic_00: true,
  uses_three_day_model: true,
  is_study_day: true,
});
test('Topic 00 Wednesday', '2026-05-20', {
  day_kind: 'day2',
  phase: 'topic_00',
  current_session_id: '00.1',
  is_study_day: true,
});
test('Topic 00 Friday', '2026-05-22', {
  day_kind: 'day3',
  phase: 'topic_00',
  current_session_id: '00.1',
});
test('Topic 00 Sunday', '2026-05-24', {
  day_kind: 'sunday',
  phase: 'topic_00',
  current_session_id: '00.1',
  is_study_day: false,
});
test('Topic 00 Saturday', '2026-05-23', {
  day_kind: 'saturday',
  phase: 'topic_00',
  current_session_id: '00.1',
  is_study_day: false,
});
test('Topic 00 last week (Aug 24)', '2026-08-24', {
  day_kind: 'day1',
  phase: 'topic_00',
  current_session_id: '00.15',
  session_week_number: 15,
});

console.log('\n── YEAR 1 (three-day model — Mon/Wed/Fri tabs active) ──');
test('Year 1 launch Tuesday Sept 1', '2026-09-01', {
  day_kind: 'between_sessions',
  phase: 'year_1',
  current_session_id: '1.1',
  uses_three_day_model: true,
  is_study_day: false,
});
test('Year 1 Day 1 (first Monday)', '2026-09-07', {
  day_kind: 'day1',
  phase: 'year_1',
  current_session_id: '1.2',
  session_week_number: 2,
  is_study_day: true,
});
test('Year 1 Day 2 (Wednesday)', '2026-09-09', {
  day_kind: 'day2',
  phase: 'year_1',
  current_session_id: '1.2',
  is_study_day: true,
});
test('Year 1 Day 3 (Friday)', '2026-09-11', {
  day_kind: 'day3',
  phase: 'year_1',
  current_session_id: '1.2',
  is_study_day: true,
});
test('Year 1 Tuesday (between sessions)', '2026-09-08', {
  day_kind: 'between_sessions',
  phase: 'year_1',
  current_session_id: '1.2',
  is_study_day: false,
});
test('Year 1 Sunday', '2026-09-13', {
  day_kind: 'sunday',
  phase: 'year_1',
  current_session_id: '1.2',
});
test('Year 1 Saturday', '2026-09-12', {
  day_kind: 'saturday',
  phase: 'year_1',
  current_session_id: '1.2',
});

console.log('\n── PAUSES ──');
test('Christmas Day (Twelve Days pause)', '2026-12-25', {
  day_kind: 'pause',
  phase: 'year_1',
  pause_reason: 'twelve_days',
  pause_resumes_on: '2027-01-07',
  is_study_day: false,
});
test('New Year\'s Day (still in Twelve Days)', '2027-01-01', {
  day_kind: 'pause',
  pause_reason: 'twelve_days',
});
test('First day after Twelve Days (Thu Jan 7) — awaiting session 1.18', '2027-01-07', {
  day_kind: 'between_sessions',
  phase: 'year_1',
  current_session_id: '1.18',
  pause_reason: null,
});
test('First Day 1 of new session (Mon Jan 11)', '2027-01-11', {
  day_kind: 'day1',
  phase: 'year_1',
  current_session_id: '1.18',
});
test('Bright Week pause (May 5, 2027)', '2027-05-05', {
  day_kind: 'pause',
  pause_reason: 'bright_week',
  pause_resumes_on: '2027-05-10',
});
test('Summer easing 2027', '2027-07-15', {
  day_kind: 'pause',
  pause_reason: 'summer_easing',
});

console.log('\n── PHASE TRANSITION ──');
test('Last Topic 00 day (Aug 31)', '2026-08-31', {
  day_kind: 'day1',
  phase: 'topic_00',
  current_session_id: '00.15',
});
test('First Year 1 day (Sept 1)', '2026-09-01', {
  phase: 'year_1',
  current_session_id: '1.1',
});

console.log('\n── EDGE CASES ──');
test('Date far past program', '2030-01-01', {
  day_kind: 'between_sessions',
  phase: 'post_program',
});

console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
process.exit(failed > 0 ? 1 : 0);
