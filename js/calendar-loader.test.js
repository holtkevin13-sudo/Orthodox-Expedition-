/**
 * Test harness for calendar-loader.js.
 * Run: node js/calendar-loader.test.js
 */

const CalendarLoader = require('./calendar-loader.js');

let passed = 0, failed = 0;
function assert(label, cond, detail) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

function makeFakeSb(responses, callsLog) {
  return {
    from(table) {
      let dateFilter = null;
      return {
        select() { return this; },
        eq(field, value) { if (field === 'date') dateFilter = value; return this; },
        async maybeSingle() {
          if (callsLog) callsLog.push(dateFilter);
          if (responses[dateFilter]) return responses[dateFilter];
          return { data: null, error: null };
        },
      };
    },
  };
}

(async function run() {

  console.log('\n── todayKey ──');
  const k = CalendarLoader.todayKey();
  assert('todayKey is YYYY-MM-DD format',
    /^\d{4}-\d{2}-\d{2}$/.test(k), `got: ${k}`);

  console.log('\n── load: missing args ──');
  {
    const r = await CalendarLoader.load(null, '2026-05-18');
    assert('null sb returns error', r.error === 'no-supabase-client');
  }
  {
    const r = await CalendarLoader.load({}, null);
    assert('null date returns error', r.error === 'no-date');
  }

  console.log('\n── load: happy path ──');
  {
    CalendarLoader._cache.clear();
    const sb = makeFakeSb({
      '2026-05-18': { data: {
        date: '2026-05-18',
        liturgical_season: 'Pentecost',
        feast_name: null,
        feast_rank: null,
        fast_status: 'no_fast',
        sunday_name: null,
        saint_commemorations: ['St. Job the Long-Suffering'],
        notes: null,
      }, error: null },
    });
    const r = await CalendarLoader.load(sb, '2026-05-18');
    assert('row loaded', r.row && r.row.date === '2026-05-18');
    assert('liturgical_season passed through', r.row.liturgical_season === 'Pentecost');
    assert('saint_commemorations is array', Array.isArray(r.row.saint_commemorations));
    assert('no error on happy path', r.error === null);
  }

  console.log('\n── load: cache hits ──');
  {
    CalendarLoader._cache.clear();
    const calls = [];
    const sb = makeFakeSb({
      '2026-05-18': { data: { date: '2026-05-18', liturgical_season: 'Pentecost' }, error: null },
    }, calls);
    await CalendarLoader.load(sb, '2026-05-18');
    await CalendarLoader.load(sb, '2026-05-18');
    await CalendarLoader.load(sb, '2026-05-18');
    assert('three loads, one query (cache hit)', calls.length === 1, `calls: ${calls.length}`);
  }

  console.log('\n── load: out-of-range date returns null gracefully ──');
  {
    CalendarLoader._cache.clear();
    const sb = makeFakeSb({
      // No entry for 2030-01-01 — fakeSb returns { data: null, error: null }
    });
    const r = await CalendarLoader.load(sb, '2030-01-01');
    assert('out-of-range returns null row', r.row === null);
    assert('out-of-range returns no error', r.error === null);
  }

  console.log('\n── load: query error captured ──');
  {
    CalendarLoader._cache.clear();
    const sb = makeFakeSb({
      '2026-05-18': { data: null, error: { message: 'connection lost' } },
    });
    const r = await CalendarLoader.load(sb, '2026-05-18');
    assert('error message surfaced', r.error === 'connection lost');
    assert('row is null on error', r.row === null);
  }

  console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
