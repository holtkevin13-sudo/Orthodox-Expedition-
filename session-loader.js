/**
 * Orthodox Expedition — Session Loader
 *
 * Single source for fetching session + saint of the week + the explorer's
 * session_progress for a given week. The dashboard calls one function and
 * gets one consolidated object to render against.
 *
 * Why one module: the dashboard needs three Supabase queries that map to
 * one logical "what's this week's content?" question. Centralizing here
 * means only one place to maintain the field-shape contract and the
 * graceful-degradation rules.
 *
 * Public API:
 *   await SessionLoader.load(sb, profileId, sessionId, weekNumber)
 *     → { session, saint, progress, renderable }
 *
 *   SessionLoader.isRenderable(session) → boolean
 *
 *   SessionLoader.requiresParentRole(field) → boolean   [helper]
 */

const SessionLoader = (() => {

  // ── STATUS GATES ─────────────────────────────────────────────────
  // Per Chat 1 dispatch: only render lesson_text and full content when
  // status='published'. Earlier statuses get a 'Coming soon' framing.
  const RENDERABLE_STATUSES = new Set(['published']);

  function isRenderable(session) {
    if (!session) return false;
    return RENDERABLE_STATUSES.has(session.status);
  }

  // ── FIELD ROLE GATING ────────────────────────────────────────────
  // The parent_note field is parent-only. Even though the loader returns
  // it (admin/parent surfaces need it), the explorer surface must filter.
  const PARENT_ONLY_FIELDS = new Set(['parent_note']);

  function requiresParentRole(field) {
    return PARENT_ONLY_FIELDS.has(field);
  }

  // ── MAIN LOADER ──────────────────────────────────────────────────
  // Fetches in parallel; degrades gracefully if any one query fails.
  // Returns a consolidated object regardless of whether profileId is null
  // (e.g., during the pre-launch countdown).
  async function load(sb, profileId, sessionId, weekNumber) {
    const result = {
      session: null,
      saint: null,
      progress: null,
      renderable: false,
      errors: [],
    };

    if (!sb || !sessionId) {
      result.errors.push('missing-required-args');
      return result;
    }

    // Fire all three queries in parallel. profileId may be null
    // (pre-launch / not logged in) — the progress query is skipped.
    const sessionQuery = sb
      .from('sessions')
      .select(`
        id, status, title, description, scope_summary,
        lesson_text, parent_note, journal_prompt,
        key_concepts,
        discussion_q1, discussion_q2, discussion_q3,
        reading_reference, reading_url, reading_note,
        liturgical_connection,
        sunday_liturgy_pointer,
        personal_activity, family_activity,
        program_year, phase, week_number, order_index,
        topic_id, liturgical_anchor
      `)
      .eq('id', sessionId)
      .maybeSingle();

    const saintQuery = (typeof weekNumber === 'number')
      ? sb
          .from('saint_of_the_week')
          .select('week_number, saint_name, feast_day, biography, quote, takeaway, paired_session_id, icon_url')
          .eq('week_number', weekNumber)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const progressQuery = profileId
      ? sb
          .from('session_progress')
          .select('session_id, profile_id, day_1_completed_at, day_2_completed_at, day_3_completed_at, sunday_liturgy_observed_at, completed_at')
          .eq('profile_id', profileId)
          .eq('session_id', sessionId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    try {
      const [sessionRes, saintRes, progressRes] = await Promise.all([
        sessionQuery, saintQuery, progressQuery
      ]);

      if (sessionRes.error) {
        result.errors.push('session-query: ' + sessionRes.error.message);
      } else {
        result.session = sessionRes.data || null;
      }

      if (saintRes.error) {
        result.errors.push('saint-query: ' + saintRes.error.message);
      } else {
        result.saint = saintRes.data || null;
      }

      if (progressRes.error) {
        result.errors.push('progress-query: ' + progressRes.error.message);
      } else {
        result.progress = progressRes.data || null;
      }

    } catch (e) {
      result.errors.push('load-failed: ' + (e && e.message ? e.message : 'unknown'));
    }

    result.renderable = isRenderable(result.session);
    return result;
  }

  // ── CONVENIENCE: GET A SESSION'S RENDER STATE ────────────────────
  // Returns one of: 'renderable' | 'coming_soon' | 'missing'
  // Used by the dashboard to decide whether to show real content,
  // a "coming soon" placeholder, or a not-found state.
  function renderState(session) {
    if (!session) return 'missing';
    if (isRenderable(session)) return 'renderable';
    return 'coming_soon';
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  return {
    load,
    isRenderable,
    requiresParentRole,
    renderState,
    _internals: {
      RENDERABLE_STATUSES,
      PARENT_ONLY_FIELDS,
    },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SessionLoader;
