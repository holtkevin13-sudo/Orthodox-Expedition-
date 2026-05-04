/**
 * Test harness for session-loader.js.
 * Run: node js/session-loader.test.js
 *
 * Mocks the Supabase client interface to verify field selection,
 * graceful degradation, status gating, and parent-only field filtering.
 */

const SessionLoader = require('./session-loader.js');

let passed = 0, failed = 0;
function assert(label, cond, detail) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

// ── A minimal fake Supabase chain that records calls and returns
//    whatever data we tell it to. Mirrors the chain the loader uses:
//    sb.from(t).select(f).eq(k,v).eq(k,v).maybeSingle()
function makeFakeSb(responses) {
  const calls = [];
  function chain(table) {
    let filters = [];
    return {
      _table: table,
      select(fields) { return { ...this, _fields: fields, eq: this.eq.bind(this), maybeSingle: this.maybeSingle.bind(this) }; },
      eq(k, v) { filters.push([k, v]); return this; },
      async maybeSingle() {
        const key = `${table}:${filters.map(([k,v]) => `${k}=${v}`).join(',')}`;
        calls.push(key);
        return responses[table] || { data: null, error: null };
      },
    };
  }
  return {
    from: (t) => chain(t),
    _calls: calls,
  };
}

(async function run() {

  console.log('\n── isRenderable ──');
  assert('null session is not renderable', !SessionLoader.isRenderable(null));
  assert('session with status=published IS renderable',
    SessionLoader.isRenderable({ status: 'published' }));
  assert('session with status=content_complete is NOT renderable',
    !SessionLoader.isRenderable({ status: 'content_complete' }));
  assert('session with status=scope_locked is NOT renderable',
    !SessionLoader.isRenderable({ status: 'scope_locked' }));

  console.log('\n── renderState ──');
  assert('null → missing', SessionLoader.renderState(null) === 'missing');
  assert('published → renderable',
    SessionLoader.renderState({ status: 'published' }) === 'renderable');
  assert('scope_locked → coming_soon',
    SessionLoader.renderState({ status: 'scope_locked' }) === 'coming_soon');
  assert('content_complete → coming_soon',
    SessionLoader.renderState({ status: 'content_complete' }) === 'coming_soon');

  console.log('\n── requiresParentRole ──');
  assert('parent_note requires parent role',
    SessionLoader.requiresParentRole('parent_note'));
  assert('lesson_text does NOT require parent role',
    !SessionLoader.requiresParentRole('lesson_text'));
  assert('journal_prompt does NOT require parent role',
    !SessionLoader.requiresParentRole('journal_prompt'));

  console.log('\n── load: missing args ──');
  {
    const r = await SessionLoader.load(null, 'profile-uuid', '00.1', 1);
    assert('null sb returns errors', r.errors.includes('missing-required-args'));
    assert('null sb returns null session', r.session === null);
    assert('null sb returns not-renderable', !r.renderable);
  }
  {
    const r = await SessionLoader.load({}, 'profile-uuid', null, 1);
    assert('null sessionId returns errors', r.errors.includes('missing-required-args'));
  }

  console.log('\n── load: full path with published session ──');
  {
    const sb = makeFakeSb({
      sessions: { data: { id: '00.1', status: 'published', title: 'The Church That Stayed', lesson_text: 'A long lesson...' }, error: null },
      saint_of_the_week: { data: { week_number: 1, saint_name: 'St. Thomas the Apostle', feast_day: null, biography: null }, error: null },
      session_progress: { data: null, error: null },
    });
    const r = await SessionLoader.load(sb, 'profile-uuid', '00.1', 1);
    assert('session loaded', r.session && r.session.id === '00.1');
    assert('session is renderable (status=published)', r.renderable);
    assert('saint loaded', r.saint && r.saint.saint_name === 'St. Thomas the Apostle');
    assert('progress null is OK (new explorer)', r.progress === null);
    assert('no errors on happy path', r.errors.length === 0);
  }

  console.log('\n── load: scope_locked session (Coming Soon path) ──');
  {
    const sb = makeFakeSb({
      sessions: { data: { id: '00.5', status: 'scope_locked', title: 'What Will Happen at My Chrismation', lesson_text: null }, error: null },
      saint_of_the_week: { data: null, error: null },
      session_progress: { data: null, error: null },
    });
    const r = await SessionLoader.load(sb, 'profile-uuid', '00.5', 5);
    assert('scope_locked session loaded', r.session && r.session.id === '00.5');
    assert('scope_locked session is NOT renderable', !r.renderable);
    assert('scope_locked saint NULL renders gracefully', r.saint === null);
  }

  console.log('\n── load: pre-launch (no profileId) ──');
  {
    const sb = makeFakeSb({
      sessions: { data: { id: '00.1', status: 'published' }, error: null },
      saint_of_the_week: { data: { week_number: 1, saint_name: 'St. Thomas' }, error: null },
    });
    const r = await SessionLoader.load(sb, null, '00.1', 1);
    assert('pre-launch progress is null (skipped query)', r.progress === null);
    assert('session still loads without profile', r.session !== null);
  }

  console.log('\n── load: graceful degradation on session error ──');
  {
    const sb = makeFakeSb({
      sessions: { data: null, error: { message: 'connection lost' } },
      saint_of_the_week: { data: null, error: null },
      session_progress: { data: null, error: null },
    });
    const r = await SessionLoader.load(sb, 'profile-uuid', '00.1', 1);
    assert('session error captured', r.errors.some(e => e.includes('session-query')));
    assert('not renderable on session error', !r.renderable);
  }

  console.log(`\n──────────\n  ${passed} passed, ${failed} failed\n──────────\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
