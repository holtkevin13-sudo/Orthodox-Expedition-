/**
 * Test harness for calendar-card.js.
 * Run: node js/calendar-card.test.js
 */

const CalendarCard = require('./calendar-card.js');

let passed = 0, failed = 0;
function assert(label, cond, detail) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

console.log('\n── EMPTY STATE ──');
assert('null row returns empty string', CalendarCard.render(null) === '');
assert('undefined row returns empty string', CalendarCard.render(undefined) === '');

console.log('\n── FAST LABEL TRANSLATION ──');
assert('strict → "Strict fast"',
  CalendarCard._internals.fastLabel('strict') === 'Strict fast');
assert('wine_oil → "Wine and oil allowed"',
  CalendarCard._internals.fastLabel('wine_oil') === 'Wine and oil allowed');
assert('fish_allowed → "Fish allowed"',
  CalendarCard._internals.fastLabel('fish_allowed') === 'Fish allowed');
assert('dairy_allowed → "Dairy allowed"',
  CalendarCard._internals.fastLabel('dairy_allowed') === 'Dairy allowed');
assert('no_fast → null (omit line)',
  CalendarCard._internals.fastLabel('no_fast') === null);
assert('unknown status → null',
  CalendarCard._internals.fastLabel('weirdo') === null);

console.log('\n── FEAST TIER STYLING ──');
{
  const t = CalendarCard._internals.feastTier('great');
  assert('great tier eyebrow', t.eyebrow === 'Great Feast');
  assert('great tier shows ornament', t.showOrnament === true);
  assert('great tier accent is gold-bright', t.accent === '#ffd700');
}
{
  const t = CalendarCard._internals.feastTier('major');
  assert('major tier eyebrow', t.eyebrow === 'Feast Day');
  assert('major tier shows ornament', t.showOrnament === true);
  assert('major tier accent is gold-light', t.accent === '#f0c96e');
}
{
  const t = CalendarCard._internals.feastTier('minor');
  assert('minor tier eyebrow', t.eyebrow === 'Commemoration');
  assert('minor tier hides ornament', t.showOrnament === false);
}
{
  const t = CalendarCard._internals.feastTier(null);
  // null falls through to minor (defensive default — caller should hide
  // the feast block when feast_name is null, so this code path shouldn't
  // run anyway, but fallback to minor is the safe default).
  assert('null rank falls through to minor-style defaults',
    t.showOrnament === false && t.accent === '#c9922a');
}

console.log('\n── HAPPY-PATH RENDER ──');
{
  const html = CalendarCard.render({
    date: '2026-08-09',
    liturgical_season: 'After Pentecost',
    feast_name: 'Herman of Alaska, Wonderworker',
    feast_rank: 'major',
    fast_status: 'wine_oil',
    sunday_name: null,
    saint_commemorations: ['St. Herman of Alaska', 'Holy Apostle Matthias'],
    notes: 'A blessed feast for North America.',
  });
  assert('feast title rendered', html.includes('Herman of Alaska, Wonderworker'));
  assert('feast eyebrow "Feast Day" for major',
    html.includes('Feast Day'));
  assert('season rendered', html.includes('After Pentecost'));
  assert('fast translated', html.includes('Wine and oil allowed'));
  assert('saints list rendered', html.includes('St. Herman of Alaska'));
  assert('saints heading', html.includes('Commemorated Today'));
  assert('second saint rendered', html.includes('Holy Apostle Matthias'));
  assert('notes rendered', html.includes('A blessed feast for North America.'));
}

console.log('\n── GREAT FEAST RENDER ──');
{
  const html = CalendarCard.render({
    date: '2026-08-15',
    liturgical_season: 'Dormition',
    feast_name: 'Dormition of the Theotokos',
    feast_rank: 'great',
    fast_status: 'no_fast',
    sunday_name: null,
    saint_commemorations: [],
    notes: null,
  });
  assert('great-tier eyebrow', html.includes('Great Feast'));
  assert('feast title rendered', html.includes('Dormition of the Theotokos'));
  assert('no_fast omits fast line', !html.includes('No fast'));
  assert('empty saints array hides saints block',
    !html.includes('Commemorated Today'));
  assert('null notes hides notes block',
    !html.includes('class="lc-notes"'));
}

console.log('\n── SUNDAY-NAME FALLBACK ──');
{
  // Edge case: feast_name is NULL but sunday_name is present
  const html = CalendarCard.render({
    date: '2026-05-31',
    liturgical_season: 'Pentecost',
    feast_name: null,
    feast_rank: null,
    fast_status: 'no_fast',
    sunday_name: 'Sunday of the Holy Fathers',
    saint_commemorations: [],
    notes: null,
  });
  assert('sunday_name surfaces in feast slot',
    html.includes('Sunday of the Holy Fathers'));
}

console.log('\n── NO FEAST, ONLY SEASON + SAINTS ──');
{
  const html = CalendarCard.render({
    date: '2026-06-15',
    liturgical_season: "Apostles' Fast",
    feast_name: null,
    feast_rank: null,
    fast_status: 'fish_allowed',
    sunday_name: null,
    saint_commemorations: ['St. Augustine of Hippo'],
    notes: null,
  });
  assert('no feast block when feast_name and sunday_name both null',
    !html.includes('lc-feast-title'));
  assert('season still rendered (escaped apostrophe is expected)',
    html.includes('Apostles&#39; Fast'));
  assert('fast translated to "Fish allowed"', html.includes('Fish allowed'));
  assert('single saint still rendered', html.includes('St. Augustine of Hippo'));
}

console.log('\n── CHEESEFARE WEEK (dairy_allowed) ──');
{
  const html = CalendarCard.render({
    date: '2027-02-23',
    liturgical_season: 'Cheesefare Week',
    feast_name: null,
    feast_rank: null,
    fast_status: 'dairy_allowed',
    sunday_name: null,
    saint_commemorations: [],
    notes: null,
  });
  assert('dairy_allowed translated', html.includes('Dairy allowed'));
}

console.log('\n── HTML ESCAPING ──');
{
  const html = CalendarCard.render({
    date: '2026-12-25',
    liturgical_season: 'Nativity',
    feast_name: 'St. <Special> & "Friends"',
    feast_rank: 'great',
    fast_status: 'no_fast',
    sunday_name: null,
    saint_commemorations: ["O'Saint"],
    notes: null,
  });
  assert('feast name escaped', html.includes('&lt;Special&gt;'));
  assert('quotes escaped', html.includes('&quot;Friends&quot;'));
  assert('apostrophe escaped in saint', html.includes('O&#39;Saint'));
}

console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
process.exit(failed > 0 ? 1 : 0);
