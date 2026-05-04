/**
 * Test harness for prayers.js — pure-logic checks (no Supabase calls).
 * Run: node js/prayers.test.js
 */

const fs = require('fs');
const path = require('path');

// Shim fetch for node + load JSON synchronously for the test.
const prayerJson = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config', 'daily-prayers.json'), 'utf8'
));
global.fetch = async () => ({ json: async () => prayerJson });

const Prayers = require('./prayers.js');

let passed = 0, failed = 0;
function assert(label, cond, detail) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

(async function run() {

  console.log('\n── VARIANT SELECTION (pre/post Chrismation) ──');
  assert('null state → pre_chrismation',
    Prayers.variantForState(null) === 'pre_chrismation');
  assert('Topic 00 session 00.1 → pre_chrismation',
    Prayers.variantForState({ current_session_id: '00.1' }) === 'pre_chrismation');
  assert('Topic 00 session 00.5 → pre_chrismation',
    Prayers.variantForState({ current_session_id: '00.5' }) === 'pre_chrismation');
  assert('Topic 00 session 00.6 → full (Chrismation week)',
    Prayers.variantForState({ current_session_id: '00.6' }) === 'full');
  assert('Topic 00 session 00.10 → full',
    Prayers.variantForState({ current_session_id: '00.10' }) === 'full');
  assert('Year 1 session 1.1 → full',
    Prayers.variantForState({ current_session_id: '1.1' }) === 'full');
  assert('Year 3 session 3.20 → full',
    Prayers.variantForState({ current_session_id: '3.20' }) === 'full');

  console.log('\n── INIT ──');
  await Prayers.init(null, null);
  assert('init resolves and prayer JSON loads',
    Prayers._internals.MORNING_MISSION_KEY === 'daily_morning_prayer');

  console.log('\n── RENDER PRAYER PAGE ──');
  {
    const html = Prayers.renderPrayer('morning', 'pre_chrismation');
    assert('renders morning title', html.includes('Morning Prayers'));
    assert('renders Lord\'s Prayer (pre-Chrismation)',
      html.includes('Our Father, who art in heaven'));
    assert('does NOT include Symbol of Faith in pre-Chrismation morning',
      !html.includes('I believe in one God'));
    assert('includes the "I Have Prayed" button',
      html.includes('I Have Prayed This Morning'));
    assert('includes return link', html.includes('Return'));
  }

  {
    const html = Prayers.renderPrayer('morning', 'full');
    assert('renders Symbol of Faith in full morning variant',
      html.includes('I believe in one God'));
    assert('renders "Having Risen from Sleep"',
      html.includes('Having risen from sleep'));
    assert('renders Heavenly King',
      html.includes('O Heavenly King'));
  }

  {
    const html = Prayers.renderPrayer('evening', 'full');
    assert('renders evening Trisagion',
      html.includes('Holy God, Holy Mighty'));
    assert('renders Theotokion (evening)',
      html.includes('It is truly meet to bless thee, O Theotokos'));
  }

  console.log('\n── RENDER PANEL (week.html small card) ──');
  {
    const html = Prayers.renderPanel(
      { day_kind: 'day1', current_session_id: '1.5' },
      { morning: true, evening: false, streak: 3 }
    );
    assert('panel shows morning ✓ when complete', html.includes('✓'));
    assert('panel shows evening ○ when not complete', html.includes('○'));
    assert('panel shows streak count', html.includes('3 days'));
  }
  {
    const html = Prayers.renderPanel(
      { day_kind: 'pre_launch' },
      null
    );
    assert('pre-launch panel shows "Prayer Before the Journey"',
      html.includes('Prayer Before the Journey'));
    assert('pre-launch panel does NOT show streak',
      !html.includes('faithful prayer'));
  }
  {
    const html = Prayers.renderPanel(
      { day_kind: 'sunday', current_session_id: '1.5' },
      { morning: false, evening: false, streak: 0 }
    );
    assert('zero-streak panel shows no streak line',
      !html.includes('faithful prayer'));
  }

  console.log('\n── DAY-KEY HELPER ──');
  const k = Prayers._internals.todayKey();
  assert('todayKey is YYYY-MM-DD format',
    /^\d{4}-\d{2}-\d{2}$/.test(k), `got: ${k}`);

  console.log('\n── HTML ESCAPING ──');
  assert('esc() escapes <',
    Prayers._internals.esc('<script>') === '&lt;script&gt;');
  assert('esc() escapes &',
    Prayers._internals.esc('a & b') === 'a &amp; b');
  assert('esc() handles null',
    Prayers._internals.esc(null) === '');

  console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
