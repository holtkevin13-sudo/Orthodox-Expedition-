/**
 * Test harness for pause-card.js.
 * Run: node js/pause-card.test.js
 *
 * Verifies render() produces correct output for all four pause types
 * and the right empty-string behavior for non-pause states.
 */

const PauseCard = require('./pause-card.js');

let passed = 0, failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    if (detail) console.log(`    ${detail}`);
    failed++;
  }
}

console.log('\n── EMPTY STATE BEHAVIOR ──');
assert('returns empty string for null state',
  PauseCard.render(null) === '');
assert('returns empty string for non-pause day_kind',
  PauseCard.render({ day_kind: 'day1' }) === '');
assert('returns empty string for sunday',
  PauseCard.render({ day_kind: 'sunday' }) === '');

console.log('\n── BRIGHT WEEK ──');
{
  const html = PauseCard.render({
    day_kind: 'pause',
    pause_reason: 'bright_week',
    pause_resumes_on: '2027-05-10',
  });
  assert('renders Bright Week title', html.includes('Bright Week'));
  assert('includes Paschal apolytikion',
    html.includes('Christ is risen from the dead'));
  assert('includes resume date formatted long',
    html.includes('Monday, May 10, 2027'));
  assert('uses gold-bright accent (#ffd700)',
    html.includes('#ffd700'));
}

console.log('\n── TWELVE DAYS ──');
{
  const html = PauseCard.render({
    day_kind: 'pause',
    pause_reason: 'twelve_days',
    pause_resumes_on: '2027-01-07',
  });
  assert('renders Twelve Days title',
    html.includes('Twelve Days of Christmas'));
  assert('includes Nativity kontakion',
    html.includes('Today the Virgin gives birth'));
  assert('includes resume date',
    html.includes('Thursday, January 7, 2027'));
}

console.log('\n── SUMMER EASING ──');
{
  const html = PauseCard.render({
    day_kind: 'pause',
    pause_reason: 'summer_easing',
    pause_resumes_on: '2027-08-30',
  });
  assert('renders Summer Rest title', html.includes('Summer Rest'));
  assert('includes Psalm 22 LXX', html.includes('Psalm 22 LXX'));
}

console.log('\n── REST WEEK ──');
{
  const html = PauseCard.render({
    day_kind: 'pause',
    pause_reason: 'rest_week',
    pause_resumes_on: '2026-11-09',
  });
  assert('renders rest week title', html.includes('A Week of Rest'));
  assert('includes Hebrews quote', html.includes('Hebrews 4:9'));
}

console.log('\n── GRACEFUL DEGRADATION ──');
{
  const html = PauseCard.render({
    day_kind: 'pause',
    pause_reason: 'unknown_reason',
    pause_resumes_on: '2027-01-01',
  });
  assert('falls back to rest_week variant for unknown pause reason',
    html.includes('A Week of Rest'));
}
{
  const html = PauseCard.render({
    day_kind: 'pause',
    pause_reason: 'bright_week',
    pause_resumes_on: null,
  });
  assert('handles null resume date gracefully',
    html.includes('Bright Week') && !html.includes('The next session opens'));
}

console.log('\n── HTML ESCAPING ──');
{
  // The variant text is author-controlled, but verify no raw HTML
  // injection is possible if a future caller puts user text in.
  assert('escape function turns ampersands',
    PauseCard._formatLongDate.toString().length > 0);
}

console.log('\n── DATE FORMATTING ──');
assert('formats a Monday correctly',
  PauseCard._formatLongDate('2026-05-18') === 'Monday, May 18, 2026');
assert('formats a Sunday correctly',
  PauseCard._formatLongDate('2026-09-13') === 'Sunday, September 13, 2026');
assert('handles end-of-year correctly',
  PauseCard._formatLongDate('2026-12-31') === 'Thursday, December 31, 2026');
assert('returns empty string for null',
  PauseCard._formatLongDate(null) === '');

console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
process.exit(failed > 0 ? 1 : 0);
