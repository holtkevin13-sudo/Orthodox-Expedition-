/**
 * Test harness for name-day-banner.js.
 * Run: node js/name-day-banner.test.js
 */

const NameDayBanner = require('./name-day-banner.js');

let passed = 0, failed = 0;
function assert(label, cond, detail) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

console.log('\n── matchPatron (alias normalization) ──');
const m = NameDayBanner._internals.matchPatron;
assert('null returns null', m(null) === null);
assert('empty string returns null', m('') === null);
assert('"St. Herman" matches', m('St. Herman') !== null);
assert('"Saint Herman" matches', m('Saint Herman') !== null);
assert('"Herman of Alaska" matches', m('Herman of Alaska') !== null);
assert('"St. Herman of Alaska" matches', m('St. Herman of Alaska') !== null);
assert('"saint herman of alaska" (lowercase) matches', m('saint herman of alaska') !== null);
assert('"St Herman of Alaska" (no period) matches', m('St Herman of Alaska') !== null);
assert('"  St. Herman  " (whitespace) matches', m('  St. Herman  ') !== null);
assert('"St. Nicholas" does NOT match', m('St. Nicholas') === null);
assert('"Herman" alone does NOT match', m('Herman') === null);

console.log('\n── todayMMDD ──');
const dec25 = new Date(2026, 11, 25);
assert('Dec 25 → "12-25"',
  NameDayBanner._internals.todayMMDD(dec25) === '12-25');
const aug9 = new Date(2026, 7, 9);
assert('Aug 9 → "08-09"',
  NameDayBanner._internals.todayMMDD(aug9) === '08-09');

console.log('\n── firstName ──');
const fn = NameDayBanner._internals.firstName;
assert('null profile → "you"', fn(null) === 'you');
assert('no name → "you"', fn({}) === 'you');
assert('empty name → "you"', fn({ name: '' }) === 'you');
assert('whitespace-only name → "you"', fn({ name: '   ' }) === 'you');
assert('"Nolan Holt" → "Nolan"', fn({ name: 'Nolan Holt' }) === 'Nolan');
assert('"Nolan" → "Nolan"', fn({ name: 'Nolan' }) === 'Nolan');
assert('"  Nolan  Holt  " → "Nolan"', fn({ name: '  Nolan  Holt  ' }) === 'Nolan');

console.log('\n── render: returns empty when not applicable ──');
{
  const aug9 = new Date(2026, 7, 9);
  // null profile
  assert('null profile returns empty',
    NameDayBanner.render(aug9, null) === '');
  // profile without patron
  assert('profile with no patron_saint returns empty',
    NameDayBanner.render(aug9, { name: 'Nolan' }) === '');
  // profile with non-matching patron
  assert('profile with St. Nicholas returns empty',
    NameDayBanner.render(aug9, { patron_saint: 'St. Nicholas', name: 'Nolan' }) === '');
}

console.log('\n── render: empty when wrong date ──');
{
  const sep15 = new Date(2026, 8, 15);
  const html = NameDayBanner.render(sep15, { patron_saint: 'St. Herman', name: 'Nolan' });
  assert('Sept 15 with St. Herman patron returns empty', html === '');
}

console.log('\n── render: full Aug 9 happy path ──');
{
  const aug9 = new Date(2026, 7, 9);
  const html = NameDayBanner.render(aug9, {
    patron_saint: 'St. Herman of Alaska',
    name: 'Nolan Holt',
  });
  assert('happy path renders something', html.length > 0);
  assert('contains "Happy name day, Nolan"',
    html.includes('Happy name day, Nolan'));
  assert('contains Greek greeting "Χρόνια πολλά"',
    html.includes('Χρόνια πολλά'));
  assert('contains St. Herman name',
    html.includes('St. Herman of Alaska'));
  assert('contains journal-entry link',
    html.includes('journal.html?prompt=name_day'));
  assert('encodes patron name in journal URL',
    html.includes(encodeURIComponent('St. Herman of Alaska')));
  assert('contains transliteration as title attribute',
    html.includes('Chronia polla'));
  assert('lang="el" attribute on Greek block',
    html.includes('lang="el"'));
}

console.log('\n── render: name fallback ──');
{
  const aug9 = new Date(2026, 7, 9);
  const html = NameDayBanner.render(aug9, {
    patron_saint: 'St. Herman',
    // no name
  });
  assert('"Happy name day, you" when no name', html.includes('Happy name day, you'));
}

console.log('\n── render: alias matching works in render path ──');
{
  const aug9 = new Date(2026, 7, 9);
  const variants = ['Saint Herman', 'Herman of Alaska', 'st herman of alaska'];
  for (const v of variants) {
    const html = NameDayBanner.render(aug9, { patron_saint: v, name: 'Nolan' });
    assert(`"${v}" still renders banner`, html.includes('Happy name day'));
  }
}

console.log('\n── render: HTML escaping in name ──');
{
  const aug9 = new Date(2026, 7, 9);
  const html = NameDayBanner.render(aug9, {
    patron_saint: 'St. Herman',
    name: '<script>alert(1)</script>',
  });
  assert('script tag escaped in name',
    html.includes('&lt;script&gt;') && !html.includes('<script>alert(1)'));
}

console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
process.exit(failed > 0 ? 1 : 0);
