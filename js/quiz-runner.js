// js/quiz-runner.js
// ─────────────────────────────────────────────────────────────────────────────
// Wave 2 Lane 3 — assessment UI runner.
//
// Renders Friday quizzes (8 questions) and monthly tests (12 questions) for
// Topic 00 sessions. Reached via week.html's "Begin the Friday Quiz" launcher
// (Lane 2) at:
//
//   assess.html?session={session_id}&type=friday
//   assess.html?session={session_id}&type=monthly_test
//
// Database contract (all verified live May 6 2026 against ksfnsryfmkafwirzgjoe):
//
//   READ:  session_quizzes        (1 row per session_id+quiz_type, UNIQUE)
//          quiz_questions         (8 for friday, 12 for monthly_test, ORDER BY display_order)
//          quiz_attempts          (existing rows for this explorer+quiz, to choose render mode)
//          session_progress       (to know if day_3 is already stamped)
//
//   WRITE: quiz_attempts          (one row per question per attempt; trigger
//                                  log_quiz_attempt_coins → activity_log row
//                                  for every coins_awarded > 0)
//          session_progress       (UPSERT day_3_completed_at on submission)
//          profiles               (manual bump of coins + lifetime_coins by
//                                  the sum of awarded coins this submission;
//                                  see "trigger asymmetry" note below)
//
// COIN ECONOMY (locked Wave 1B — verified via column-comment + topic-level pre-scan):
//   • First attempt:  coins_per_question (10 for Topic 00) per correct answer
//   • Retake:         coins_per_question_retake (5 for Topic 00) per question
//                     wrong-on-first-attempt that is correct-on-retake. The
//                     coins_awarded stored on retake rows is a DELTA (the
//                     additional coins earned beyond the first attempt).
//   • max_attempts:   2  (one retake allowed)
//   • Ceiling per Friday quiz first-attempt-perfect: 8 × 10 = 80 coins
//   • Monthly-test variant uses identical math, just 12 questions.
//
// TRIGGER ASYMMETRY (verified via pg_proc inspection May 6 2026):
//   The log_quiz_attempt_coins trigger writes a row to activity_log for every
//   quiz_attempts insert with coins_awarded > 0. It does NOT bump
//   profiles.coins or profiles.lifetime_coins — none of the log_*_coins
//   triggers in this database do. So the dispatch's claim that "the trigger
//   handles activity_log + lifetime_coins automatically" is half right: it
//   handles activity_log only. To keep Nolan's bazaar balance in sync with
//   his earned coins (the same UI invariant Lane 2 maintains for M/W),
//   quiz-runner manually bumps profiles.coins + profiles.lifetime_coins by
//   the SUM of coins awarded this submission. activity_log is left to the
//   trigger so it isn't double-written. This is the same pattern Lane 2's
//   topic-00-day.js uses for Mon/Wed completions, just with the activity_log
//   write removed because the trigger covers it for quiz_attempts.
//
// IDEMPOTENCY:
//   quiz_attempts has no UNIQUE constraint on (explorer_id, question_id,
//   attempt_number) — only PK on id. So we cannot rely on the database to
//   reject a double-submit. quiz-runner pre-reads existing attempts and:
//     • Returns "already complete" view when attempt_number=2 exists for any
//       question, OR when attempt_number=1 exists with all-correct.
//     • Returns "retake offer" view when attempt_number=1 exists with
//       wrong-on-first answers and no attempt_number=2.
//     • Returns "fresh quiz" view when no attempts exist.
//   Submit handlers also disable the button on click to guard against
//   double-tap before the network round-trip lands.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── small utilities ────────────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function nowIso() { return new Date().toISOString(); }
  function getParam(name) {
    try {
      const v = new URLSearchParams(window.location.search).get(name);
      return v ? String(v) : '';
    } catch (e) { return ''; }
  }

  // ── config / constants ─────────────────────────────────────────────────────
  // Type-specific framing strings; numbers come from the DB row, never hardcoded.
  const TYPE_LABELS = {
    friday:        { day_subheading: 'Friday — Day 3 · The week\'s quiz',
                     short_kind:     'Friday Quiz',
                     close_eyebrow:  'Week Complete' },
    monthly_test:  { day_subheading: 'Monthly Test · A look back over the last few weeks',
                     short_kind:     'Monthly Test',
                     close_eyebrow:  'Monthly Test Complete' },
  };

  // ── data loader ────────────────────────────────────────────────────────────
  // One round of fetches at page boot. Returns everything needed to render
  // the right view. Fail-open on any single query — callers degrade
  // gracefully into a friendly error state.
  async function load(sb, profileId, sessionId, quizType) {
    const out = {
      sessionId, quizType,
      session: null,
      quiz: null,
      questions: [],
      attempts: [],
      progress: null,
      errors: [],
    };

    if (!sb) { out.errors.push('no-supabase-client'); return out; }
    if (!sessionId) { out.errors.push('no-session-id'); return out; }
    if (!quizType) { out.errors.push('no-quiz-type'); return out; }
    if (!TYPE_LABELS[quizType]) { out.errors.push('unsupported-quiz-type'); return out; }

    // Session title (for header framing)
    try {
      const { data, error } = await sb
        .from('sessions')
        .select('id, title, status')
        .eq('id', sessionId)
        .maybeSingle();
      if (!error) out.session = data || null;
    } catch (e) { out.errors.push('session-fetch-failed'); }

    // Quiz config
    try {
      const { data, error } = await sb
        .from('session_quizzes')
        .select('id, session_id, quiz_type, title, description, coins_per_question, coins_per_question_retake, max_attempts')
        .eq('session_id', sessionId)
        .eq('quiz_type', quizType)
        .maybeSingle();
      if (error) { out.errors.push('quiz-fetch: ' + error.message); }
      else { out.quiz = data || null; }
    } catch (e) { out.errors.push('quiz-fetch-exception'); }

    if (!out.quiz) return out; // nothing else to fetch usefully

    // Questions, in display order
    try {
      const { data, error } = await sb
        .from('quiz_questions')
        .select('id, quiz_id, question_text, options, correct_index, explanation, display_order')
        .eq('quiz_id', out.quiz.id)
        .order('display_order', { ascending: true });
      if (error) { out.errors.push('questions-fetch: ' + error.message); }
      else { out.questions = Array.isArray(data) ? data : []; }
    } catch (e) { out.errors.push('questions-fetch-exception'); }

    // Existing attempts (only when logged in)
    if (profileId) {
      try {
        const qIds = out.questions.map((q) => q.id);
        if (qIds.length) {
          const { data, error } = await sb
            .from('quiz_attempts')
            .select('id, explorer_id, question_id, attempt_number, selected_index, is_correct, coins_awarded, attempted_at')
            .eq('explorer_id', profileId)
            .in('question_id', qIds);
          if (error) { out.errors.push('attempts-fetch: ' + error.message); }
          else { out.attempts = Array.isArray(data) ? data : []; }
        }
      } catch (e) { out.errors.push('attempts-fetch-exception'); }

      try {
        const { data, error } = await sb
          .from('session_progress')
          .select('id, explorer_id, session_id, day_1_completed_at, day_2_completed_at, day_3_completed_at, coins_awarded')
          .eq('explorer_id', profileId)
          .eq('session_id', sessionId)
          .maybeSingle();
        if (!error) out.progress = data || null;
      } catch (e) { /* non-fatal */ }
    }

    return out;
  }

  // ── attempt-state derivation ───────────────────────────────────────────────
  // Bucket the existing quiz_attempts rows by question_id and attempt_number.
  // Returns:
  //   firstByQ       — Map<question_id, attempt-row|null> for attempt 1
  //   secondByQ      — Map<question_id, attempt-row|null> for attempt 2
  //   firstAttemptDone   — true iff every question has an attempt 1 row
  //   firstAllCorrect    — true iff firstAttemptDone AND every attempt 1 was correct
  //   retakeOffered      — firstAttemptDone AND some wrong AND no attempt-2 yet AND max_attempts>1
  //   secondAttemptDone  — true iff every wrong-on-first question has an attempt 2 row
  //   coinsFromFirst     — sum of coins_awarded across attempt-1 rows
  //   coinsFromRetake    — sum of coins_awarded across attempt-2 rows (deltas)
  //   totalCoins         — coinsFromFirst + coinsFromRetake
  //   wrongOnFirstQuestionIds — array of question ids the user got wrong on attempt 1
  function deriveState(quiz, questions, attempts) {
    const firstByQ = new Map();
    const secondByQ = new Map();
    for (const a of attempts) {
      if (a.attempt_number === 1) firstByQ.set(a.question_id, a);
      else if (a.attempt_number === 2) secondByQ.set(a.question_id, a);
    }
    const firstAttemptDone = questions.length > 0 && questions.every((q) => firstByQ.has(q.id));
    const firstAllCorrect = firstAttemptDone && questions.every((q) => {
      const r = firstByQ.get(q.id);
      return r && r.is_correct === true;
    });
    const wrongOnFirstQuestionIds = questions
      .filter((q) => firstAttemptDone && firstByQ.get(q.id) && firstByQ.get(q.id).is_correct === false)
      .map((q) => q.id);

    const maxA = quiz?.max_attempts || 2;
    const retakeOffered = firstAttemptDone && !firstAllCorrect && wrongOnFirstQuestionIds.length > 0
                          && wrongOnFirstQuestionIds.every((qid) => !secondByQ.has(qid))
                          && maxA > 1;

    // "secondAttemptDone" — for retake-finished detection. We require a second
    // attempt row for every question that was wrong on first (the retake set).
    const secondAttemptDone = wrongOnFirstQuestionIds.length > 0
                              && wrongOnFirstQuestionIds.every((qid) => secondByQ.has(qid));

    let coinsFromFirst = 0, coinsFromRetake = 0;
    for (const a of attempts) {
      const c = a.coins_awarded || 0;
      if (a.attempt_number === 1) coinsFromFirst += c;
      else if (a.attempt_number === 2) coinsFromRetake += c;
    }
    return {
      firstByQ, secondByQ,
      firstAttemptDone, firstAllCorrect, retakeOffered, secondAttemptDone,
      wrongOnFirstQuestionIds,
      coinsFromFirst, coinsFromRetake,
      totalCoins: coinsFromFirst + coinsFromRetake,
    };
  }

  // ── view selectors ─────────────────────────────────────────────────────────
  // Decide which top-level view to render based on derived state. Pure, no IO.
  function selectView(profileId, ctx) {
    if (!ctx.quiz)        return 'no-quiz';
    if (!ctx.questions || !ctx.questions.length) return 'no-questions';
    if (!profileId)       return 'sign-in-needed';

    const s = deriveState(ctx.quiz, ctx.questions, ctx.attempts);
    if (!s.firstAttemptDone)            return 'fresh-attempt';
    if (s.firstAllCorrect)              return 'completed-perfect';
    if (s.secondAttemptDone)            return 'completed-retake';
    if (s.retakeOffered)                return 'retake-offer';
    return 'completed-no-retake'; // fallback (e.g. max_attempts=1 with wrong)
  }

  // ── HTML renderers ─────────────────────────────────────────────────────────
  function renderHeader(ctx) {
    const sessTitle = ctx.session?.title || ctx.sessionId;
    const labels = TYPE_LABELS[ctx.quizType] || TYPE_LABELS.friday;
    const numQ = ctx.questions ? ctx.questions.length : 0;
    return `
      <div class="quiz-header">
        <a href="week.html" class="back-link">← Back to the week</a>
        <div class="quiz-eyebrow">${esc(labels.short_kind)}</div>
        <h1 class="quiz-title">${esc(ctx.quiz?.title || labels.short_kind)}</h1>
        <div class="quiz-session-tag">${esc(sessTitle)}</div>
        ${ctx.quiz?.description ? `<div class="quiz-description">${esc(ctx.quiz.description)}</div>` : ''}
        <div class="quiz-meta-row">
          <span class="quiz-meta-chip">${numQ} question${numQ === 1 ? '' : 's'}</span>
          <span class="quiz-meta-chip">+${ctx.quiz?.coins_per_question || 10} coins each</span>
          <span class="quiz-meta-chip">${ctx.quiz?.max_attempts || 2} ${ (ctx.quiz?.max_attempts || 2) === 1 ? 'try' : 'tries'} allowed</span>
        </div>
      </div>
    `;
  }

  function renderError(title, body) {
    return `
      <div class="quiz-header"><a href="week.html" class="back-link">← Back to the week</a></div>
      <div class="quiz-card error-card">
        <div class="quiz-card-icon">⚠</div>
        <div class="quiz-card-title">${esc(title)}</div>
        <div class="quiz-card-body">${esc(body)}</div>
      </div>
    `;
  }

  function renderSignInNeeded() {
    return `
      <div class="quiz-header"><a href="index.html" class="back-link">← Sign in</a></div>
      <div class="quiz-card">
        <div class="quiz-card-icon">☩</div>
        <div class="quiz-card-title">Please sign in to take the quiz</div>
        <div class="quiz-card-body">Your answers and Saint Coins are saved to your account, so you'll need to be signed in.</div>
      </div>
    `;
  }

  // Fresh attempt — shows all questions, all radios live, single Submit button.
  function renderFreshAttempt(ctx) {
    const questionsHtml = ctx.questions.map((q, idx) => renderQuestionCard(q, idx, /*locked*/ false, /*selectedIndex*/ null, /*revealCorrect*/ false)).join('');
    return `
      ${renderHeader(ctx)}
      <form id="quiz-form" data-mode="first" data-quiz-id="${esc(ctx.quiz.id)}" data-session-id="${esc(ctx.sessionId)}" data-quiz-type="${esc(ctx.quizType)}" autocomplete="off" novalidate>
        ${questionsHtml}
        <div class="quiz-progress-summary"><span class="progress-counter" data-role="answered-counter">0 of ${ctx.questions.length} answered</span></div>
        <button type="button" class="quiz-submit-btn" id="quiz-submit-btn" disabled>Submit Quiz</button>
        <div class="quiz-form-error" id="quiz-form-error" role="alert"></div>
      </form>
    `;
  }

  // Retake — shows ONLY the questions wrong on first, with the original
  // wrong selection visible in muted form so Nolan sees what he picked
  // before. Live radios let him pick a new answer.
  function renderRetakeAttempt(ctx, derived) {
    const wrongQs = ctx.questions.filter((q) => derived.wrongOnFirstQuestionIds.includes(q.id));
    const questionsHtml = wrongQs.map((q, idx) => {
      const firstRow = derived.firstByQ.get(q.id);
      const previouslyChosen = firstRow ? firstRow.selected_index : null;
      return renderQuestionCardForRetake(q, idx, previouslyChosen);
    }).join('');
    return `
      ${renderHeader(ctx)}
      <div class="quiz-card retake-banner">
        <div class="quiz-card-icon">✦</div>
        <div class="quiz-card-title">Take another look at these</div>
        <div class="quiz-card-body">You answered ${derived.wrongOnFirstQuestionIds.length} ${derived.wrongOnFirstQuestionIds.length === 1 ? 'question' : 'questions'} differently than the answer key. Read each one again — your earlier choice is shown in grey. If you change your answer and get it right, you'll earn ${ctx.quiz.coins_per_question_retake || 5} extra Saint Coin${(ctx.quiz.coins_per_question_retake || 5) === 1 ? '' : 's'} for each one.</div>
      </div>
      <form id="quiz-form" data-mode="retake" data-quiz-id="${esc(ctx.quiz.id)}" data-session-id="${esc(ctx.sessionId)}" data-quiz-type="${esc(ctx.quizType)}" autocomplete="off" novalidate>
        ${questionsHtml}
        <div class="quiz-progress-summary"><span class="progress-counter" data-role="answered-counter">0 of ${wrongQs.length} answered</span></div>
        <button type="button" class="quiz-submit-btn" id="quiz-submit-btn" disabled>Submit Retake</button>
        <div class="quiz-form-error" id="quiz-form-error" role="alert"></div>
      </form>
    `;
  }

  // Renders a single question card for the live (unanswered) state.
  function renderQuestionCard(q, idx, locked, selectedIndex, revealCorrect) {
    const opts = (q.options || []).map((opt, oi) => {
      const isCorrect = oi === q.correct_index;
      const isSelected = oi === selectedIndex;
      const cls = ['quiz-option'];
      if (revealCorrect && isCorrect) cls.push('option-correct');
      if (revealCorrect && isSelected && !isCorrect) cls.push('option-wrong-pick');
      if (!revealCorrect && isSelected) cls.push('option-selected');
      const checked = isSelected ? 'checked' : '';
      const disabled = locked ? 'disabled' : '';
      const letter = String.fromCharCode(65 + oi);
      const mark = (revealCorrect && isCorrect) ? '<span class="option-mark">✓</span>'
                  : (revealCorrect && isSelected && !isCorrect) ? '<span class="option-mark">✕</span>'
                  : '';
      return `
        <label class="${cls.join(' ')}">
          <input type="radio" name="q-${esc(q.id)}" value="${oi}" ${checked} ${disabled}>
          <span class="option-letter">${letter}</span>
          <span class="option-text">${esc(opt)}</span>
          ${mark}
        </label>
      `;
    }).join('');
    const explanationHtml = revealCorrect
      ? `<div class="quiz-explanation">${esc(q.explanation || '')}</div>`
      : '';
    return `
      <div class="quiz-question" data-question-id="${esc(q.id)}" data-correct-index="${esc(q.correct_index)}">
        <div class="quiz-question-counter">Question ${idx + 1}</div>
        <div class="quiz-question-text">${esc(q.question_text)}</div>
        <div class="quiz-options">${opts}</div>
        ${explanationHtml}
      </div>
    `;
  }

  // Retake card: shows the user's first-attempt pick muted, and live radios
  // for a second pick.
  function renderQuestionCardForRetake(q, idx, previousIndex) {
    const opts = (q.options || []).map((opt, oi) => {
      const wasPrevious = oi === previousIndex;
      const cls = ['quiz-option', 'quiz-option-retake'];
      if (wasPrevious) cls.push('option-was-picked');
      const letter = String.fromCharCode(65 + oi);
      const wasMark = wasPrevious ? '<span class="option-was-mark">your earlier pick</span>' : '';
      return `
        <label class="${cls.join(' ')}">
          <input type="radio" name="q-${esc(q.id)}" value="${oi}">
          <span class="option-letter">${letter}</span>
          <span class="option-text">${esc(opt)}</span>
          ${wasMark}
        </label>
      `;
    }).join('');
    return `
      <div class="quiz-question retake-question" data-question-id="${esc(q.id)}" data-correct-index="${esc(q.correct_index)}">
        <div class="quiz-question-counter">Question ${idx + 1} of the retake</div>
        <div class="quiz-question-text">${esc(q.question_text)}</div>
        <div class="quiz-options">${opts}</div>
      </div>
    `;
  }

  // Completed view — shows every question with the user's first-attempt pick,
  // the correct answer marked, and the explanation. Used for both
  // perfect-on-first and after-retake completion.
  function renderCompletedView(ctx, derived, mode) {
    const questionsHtml = ctx.questions.map((q, idx) => {
      const firstRow = derived.firstByQ.get(q.id);
      const secondRow = derived.secondByQ.get(q.id);
      // Show the most recent attempt. If there's a retake row, use that as the "selected".
      // Otherwise use the first attempt.
      const finalSelected = secondRow ? secondRow.selected_index :
                            (firstRow ? firstRow.selected_index : null);
      const finalCorrect = secondRow ? secondRow.is_correct :
                           (firstRow ? firstRow.is_correct : false);
      return renderCompletedQuestion(q, idx, finalSelected, finalCorrect, !!secondRow, firstRow);
    }).join('');

    const numQ = ctx.questions.length;
    const correctAfter = ctx.questions.filter((q) => {
      const sec = derived.secondByQ.get(q.id);
      const fst = derived.firstByQ.get(q.id);
      const r = sec || fst;
      return r && r.is_correct === true;
    }).length;
    const correctOnFirst = ctx.questions.filter((q) => derived.firstByQ.get(q.id)?.is_correct === true).length;

    let scoreLine = '';
    if (mode === 'perfect') {
      scoreLine = `You answered all ${numQ} correctly on your first try. <strong class="score-strong">+${derived.totalCoins} Saint Coins</strong>.`;
    } else if (mode === 'after-retake') {
      const fixedOnRetake = correctAfter - correctOnFirst;
      scoreLine = `First try: ${correctOnFirst} of ${numQ} correct (+${derived.coinsFromFirst} coins). Retake: ${fixedOnRetake} more correct (+${derived.coinsFromRetake} coins). <strong class="score-strong">Total: ${derived.totalCoins} Saint Coins.</strong>`;
    } else {
      scoreLine = `You answered ${correctAfter} of ${numQ} correctly. <strong class="score-strong">+${derived.totalCoins} Saint Coins</strong>.`;
    }

    const labels = TYPE_LABELS[ctx.quizType] || TYPE_LABELS.friday;
    return `
      ${renderHeader(ctx)}
      <div class="quiz-completion-banner ${mode === 'perfect' ? 'banner-perfect' : ''}">
        <div class="completion-icon">☩</div>
        <div class="completion-eyebrow">${esc(labels.close_eyebrow)}</div>
        <div class="completion-score">${scoreLine}</div>
      </div>
      <div id="quiz-review">${questionsHtml}</div>
      <div class="quiz-bottom-actions">
        <a href="week.html" class="quiz-back-btn">← Back to the week</a>
      </div>
    `;
  }

  function renderCompletedQuestion(q, idx, selectedIndex, isCorrect, wasRetake, firstRow) {
    const opts = (q.options || []).map((opt, oi) => {
      const isOptCorrect = oi === q.correct_index;
      const isOptSelected = oi === selectedIndex;
      const cls = ['quiz-option', 'quiz-option-locked'];
      if (isOptCorrect) cls.push('option-correct');
      if (isOptSelected && !isOptCorrect) cls.push('option-wrong-pick');
      const letter = String.fromCharCode(65 + oi);
      const mark = isOptCorrect ? '<span class="option-mark">✓</span>'
                  : (isOptSelected && !isOptCorrect) ? '<span class="option-mark">✕</span>'
                  : '';
      return `
        <label class="${cls.join(' ')}">
          <input type="radio" name="q-${esc(q.id)}" value="${oi}" ${isOptSelected ? 'checked' : ''} disabled>
          <span class="option-letter">${letter}</span>
          <span class="option-text">${esc(opt)}</span>
          ${mark}
        </label>
      `;
    }).join('');

    // Retake-history line — show that this was answered differently the first time
    let retakeNote = '';
    if (wasRetake && firstRow && firstRow.selected_index !== selectedIndex) {
      const prevLetter = String.fromCharCode(65 + (firstRow.selected_index || 0));
      retakeNote = `<div class="retake-history-line">First try you chose ${prevLetter}. On retake you chose ${String.fromCharCode(65 + (selectedIndex || 0))}.</div>`;
    }

    return `
      <div class="quiz-question quiz-question-locked ${isCorrect ? 'q-correct' : 'q-wrong'}" data-question-id="${esc(q.id)}">
        <div class="quiz-question-counter">Question ${idx + 1} ${isCorrect ? '· correct' : '· not quite'}</div>
        <div class="quiz-question-text">${esc(q.question_text)}</div>
        <div class="quiz-options">${opts}</div>
        ${retakeNote}
        <div class="quiz-explanation">${esc(q.explanation || '')}</div>
      </div>
    `;
  }

  // Top-level render — decides the view and emits HTML.
  function render(profileId, ctx) {
    if (ctx.errors && ctx.errors.length && !ctx.quiz) {
      return renderError('Could not load this quiz', 'Something went wrong reading the quiz from the database. Try going back to the week and clicking the launcher again.');
    }
    const view = selectView(profileId, ctx);

    switch (view) {
      case 'no-quiz':
        return renderError('This quiz isn\'t ready yet', 'It looks like the Friday quiz for this session isn\'t fully set up. Go back to the week and try again later.');
      case 'no-questions':
        return renderError('No questions found', 'The quiz exists but has no questions yet. Go back to the week and try again later.');
      case 'sign-in-needed':
        return renderSignInNeeded();
      case 'fresh-attempt':
        return renderFreshAttempt(ctx);
      case 'retake-offer': {
        const d = deriveState(ctx.quiz, ctx.questions, ctx.attempts);
        // Render the completed-after-first first as a review, with retake form below.
        // Simpler UX: just show the retake form directly.
        return renderRetakeAttempt(ctx, d);
      }
      case 'completed-perfect': {
        const d = deriveState(ctx.quiz, ctx.questions, ctx.attempts);
        return renderCompletedView(ctx, d, 'perfect');
      }
      case 'completed-retake': {
        const d = deriveState(ctx.quiz, ctx.questions, ctx.attempts);
        return renderCompletedView(ctx, d, 'after-retake');
      }
      case 'completed-no-retake': {
        const d = deriveState(ctx.quiz, ctx.questions, ctx.attempts);
        return renderCompletedView(ctx, d, 'first-only');
      }
      default:
        return renderError('Unknown state', 'We hit an unexpected case rendering this quiz. Reload the page or go back to the week.');
    }
  }

  // ── DOM event wiring ───────────────────────────────────────────────────────
  // Wires up radio-change tracking (for the Submit button enable) and the
  // submit-click handler that does the actual write.
  function attachHandlers(sb, profileId, ctx) {
    const form = document.getElementById('quiz-form');
    if (!form) return; // no live form (completed view, error, etc.)

    const submitBtn = document.getElementById('quiz-submit-btn');
    const counterEl = form.querySelector('[data-role="answered-counter"]');
    const errEl = document.getElementById('quiz-form-error');

    const expectedQuestionIds = Array.from(form.querySelectorAll('.quiz-question'))
      .map((el) => el.getAttribute('data-question-id'));

    function recountAnswered() {
      const total = expectedQuestionIds.length;
      let answered = 0;
      for (const qid of expectedQuestionIds) {
        if (form.querySelector(`input[name="q-${qid}"]:checked`)) answered += 1;
      }
      if (counterEl) counterEl.textContent = `${answered} of ${total} answered`;
      if (submitBtn) {
        if (answered === total) {
          submitBtn.disabled = false;
          submitBtn.classList.add('ready');
        } else {
          submitBtn.disabled = true;
          submitBtn.classList.remove('ready');
        }
      }
      // Update visual selection class on parent labels
      form.querySelectorAll('.quiz-option').forEach((label) => {
        const input = label.querySelector('input[type="radio"]');
        if (!input) return;
        if (input.checked) label.classList.add('option-selected');
        else label.classList.remove('option-selected');
      });
    }

    form.addEventListener('change', (e) => {
      if (e.target && e.target.matches('input[type="radio"]')) {
        recountAnswered();
        if (errEl) errEl.textContent = '';
      }
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (submitBtn.disabled) return;
        if (!profileId) {
          if (errEl) errEl.textContent = 'Please sign in to submit this quiz.';
          return;
        }

        // Collect answers
        const mode = form.getAttribute('data-mode'); // 'first' or 'retake'
        const selections = [];
        for (const qid of expectedQuestionIds) {
          const checked = form.querySelector(`input[name="q-${qid}"]:checked`);
          if (!checked) {
            if (errEl) errEl.textContent = 'Please answer every question before submitting.';
            return;
          }
          selections.push({ question_id: qid, selected_index: parseInt(checked.value, 10) });
        }

        submitBtn.disabled = true;
        submitBtn.classList.remove('ready');
        const original = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        if (errEl) errEl.textContent = '';

        try {
          if (mode === 'first') {
            await submitFirstAttempt(sb, profileId, ctx, selections);
          } else {
            await submitRetake(sb, profileId, ctx, selections);
          }
          // On success: reload so the loader picks up the new attempts/progress
          // and renders the appropriate completion view.
          window.location.reload();
        } catch (err) {
          console.error('[quiz-runner] submission failed', err);
          submitBtn.disabled = false;
          submitBtn.textContent = original;
          if (errEl) errEl.textContent = 'We couldn\'t save your answers just now. Please try again.';
        }
      });
    }

    // Initial paint
    recountAnswered();
  }

  // ── submission writers ─────────────────────────────────────────────────────
  // First-attempt write: 1 quiz_attempts row per question (attempt_number=1),
  // coins_awarded = coins_per_question if correct, 0 otherwise.
  // The trigger writes activity_log per row with coins>0 automatically.
  // Then UPSERT session_progress.day_3_completed_at.
  // Then bump profiles.coins + lifetime_coins by the total.
  async function submitFirstAttempt(sb, profileId, ctx, selections) {
    const quiz = ctx.quiz;
    const cpq = quiz.coins_per_question || 10;

    // Pre-read existing attempts to avoid double-write on retried submission.
    const qIds = ctx.questions.map((q) => q.id);
    const { data: existing, error: readErr } = await sb
      .from('quiz_attempts')
      .select('id, question_id, attempt_number')
      .eq('explorer_id', profileId)
      .in('question_id', qIds);
    if (readErr) throw readErr;
    const existingFirst = new Set((existing || [])
      .filter((r) => r.attempt_number === 1)
      .map((r) => r.question_id));

    // Build rows for any question that doesn't already have an attempt-1 row.
    const correctByQ = new Map(ctx.questions.map((q) => [q.id, q.correct_index]));
    const rows = [];
    let totalAwarded = 0;
    for (const sel of selections) {
      if (existingFirst.has(sel.question_id)) continue;
      const correctIdx = correctByQ.get(sel.question_id);
      const isCorrect = (sel.selected_index === correctIdx);
      const award = isCorrect ? cpq : 0;
      totalAwarded += award;
      rows.push({
        explorer_id: profileId,
        question_id: sel.question_id,
        attempt_number: 1,
        selected_index: sel.selected_index,
        is_correct: isCorrect,
        coins_awarded: award,
      });
    }

    if (rows.length) {
      const { error: insErr } = await sb.from('quiz_attempts').insert(rows);
      if (insErr) throw insErr;
    }

    // Stamp day_3_completed_at on session_progress.
    await stampDay3(sb, profileId, ctx.sessionId, totalAwarded);

    // Bump profile coin counters (trigger writes activity_log; not coins).
    if (totalAwarded > 0) await bumpProfileCoins(sb, profileId, totalAwarded);

    return { totalAwarded };
  }

  // Retake write: 1 quiz_attempts row per WRONG-on-first question, with
  // attempt_number=2 and coins_awarded set as DELTA per locked rule:
  //   correct on retake → +coins_per_question_retake (5)
  //   wrong  on retake  → 0
  // We do NOT re-write attempt-1 rows or undo their coins.
  async function submitRetake(sb, profileId, ctx, selections) {
    const quiz = ctx.quiz;
    const cpqr = quiz.coins_per_question_retake || 5;

    const qIds = ctx.questions.map((q) => q.id);
    const { data: existing, error: readErr } = await sb
      .from('quiz_attempts')
      .select('id, question_id, attempt_number, is_correct')
      .eq('explorer_id', profileId)
      .in('question_id', qIds);
    if (readErr) throw readErr;
    const firstByQ = new Map();
    const secondByQ = new Map();
    for (const r of existing || []) {
      if (r.attempt_number === 1) firstByQ.set(r.question_id, r);
      else if (r.attempt_number === 2) secondByQ.set(r.question_id, r);
    }

    // Eligible retake set: first attempt was wrong, no second-attempt row yet.
    const correctByQ = new Map(ctx.questions.map((q) => [q.id, q.correct_index]));
    const rows = [];
    let totalAwarded = 0;
    for (const sel of selections) {
      const fr = firstByQ.get(sel.question_id);
      if (!fr || fr.is_correct === true) continue; // not wrong on first; skip
      if (secondByQ.has(sel.question_id)) continue;  // already retaken; skip
      const correctIdx = correctByQ.get(sel.question_id);
      const isCorrect = (sel.selected_index === correctIdx);
      const award = isCorrect ? cpqr : 0;
      totalAwarded += award;
      rows.push({
        explorer_id: profileId,
        question_id: sel.question_id,
        attempt_number: 2,
        selected_index: sel.selected_index,
        is_correct: isCorrect,
        coins_awarded: award,
      });
    }

    if (rows.length) {
      const { error: insErr } = await sb.from('quiz_attempts').insert(rows);
      if (insErr) throw insErr;
    }

    // Day 3 should already be stamped from first submission; idempotent re-stamp is a no-op.
    await stampDay3(sb, profileId, ctx.sessionId, totalAwarded);

    if (totalAwarded > 0) await bumpProfileCoins(sb, profileId, totalAwarded);

    return { totalAwarded };
  }

  // UPSERT session_progress.day_3_completed_at + add coinDelta to coins_awarded.
  // Idempotent: if day_3_completed_at is already set, only the coins delta is
  // applied (so retake coins still roll up into the session-level total).
  async function stampDay3(sb, profileId, sessionId, coinDelta) {
    const { data: existing, error: readErr } = await sb
      .from('session_progress')
      .select('id, day_3_completed_at, coins_awarded')
      .eq('explorer_id', profileId)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (readErr) throw readErr;
    const ts = nowIso();
    if (existing) {
      const update = {};
      if (!existing.day_3_completed_at) update.day_3_completed_at = ts;
      if (coinDelta && coinDelta > 0) {
        update.coins_awarded = (existing.coins_awarded || 0) + coinDelta;
      }
      if (Object.keys(update).length === 0) return; // nothing to do
      const { error: updErr } = await sb
        .from('session_progress')
        .update(update)
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      const insert = {
        explorer_id: profileId,
        session_id: sessionId,
        day_3_completed_at: ts,
        coins_awarded: coinDelta || 0,
      };
      const { error: insErr } = await sb.from('session_progress').insert(insert);
      if (insErr) throw insErr;
    }
  }

  // Manual profile coin bump. Trigger asymmetry note in module header explains
  // why this is needed despite the dispatch saying otherwise.
  async function bumpProfileCoins(sb, profileId, amount) {
    if (!amount || amount <= 0) return;
    try {
      const { data: prof, error: readErr } = await sb
        .from('profiles')
        .select('coins, lifetime_coins')
        .eq('id', profileId)
        .maybeSingle();
      if (readErr || !prof) return;
      const { error: updErr } = await sb
        .from('profiles')
        .update({
          coins: (prof.coins || 0) + amount,
          lifetime_coins: (prof.lifetime_coins || 0) + amount,
          updated_at: nowIso(),
        })
        .eq('id', profileId);
      if (updErr) console.warn('[quiz-runner] profile coin bump failed (non-fatal)', updErr);
    } catch (e) {
      console.warn('[quiz-runner] profile coin bump exception (non-fatal)', e);
    }
  }

  // ── public API ─────────────────────────────────────────────────────────────
  window.QuizRunner = {
    load,
    render,
    attachHandlers,
    deriveState,
    selectView,
    getParam,
    TYPE_LABELS,
  };
})();
