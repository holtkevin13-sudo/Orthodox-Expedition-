// js/topic-00-day.js
// ─────────────────────────────────────────────────────────────────────────────
// Topic 00 Monday / Wednesday / Friday rendering + completion logic.
//
// The Wave 2 Lane 2 build. Replaces the earlier "light-model" single-button
// completion. Topic 00 sessions now follow the M/W/F cadence:
//
//   Monday    — family teaching from sessions.lesson_text
//                Kevin reads with Nolan; "I read this with my dad" button
//                writes session_progress.day_1_completed_at and awards 75 coins.
//
//   Wednesday — Nolan independent: download the handout PDF, then answer the
//                in-app verification question. gates_completion=true questions
//                must be answered correctly before day_2_completed_at writes.
//                On correct, awards 75 coins; writes a handout_completions row.
//
//   Friday    — Nolan independent: launches the Friday quiz (Lane 3 owns the
//                quiz UI itself). Day 3 completion is written by Lane 3 after
//                quiz submission.
//
// Coin economy ceiling per session: 75 + 75 + max-80 = 230.
//
// Coin rollup: this module writes directly to activity_log on each award,
// matching the rows that the existing log_*_coins triggers produce on other
// completion tables (session_progress and handout_completions have no such
// triggers — verified May 5 2026; see Lane 2 completion summary).
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
  function formatLessonText(text) {
    if (!text) return '';
    const paragraphs = String(text).split(/\n\s*\n/);
    return paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  }
  function nowIso() {
    return new Date().toISOString();
  }

  // ── data loader ────────────────────────────────────────────────────────────
  // Loads the handout row + the Friday quiz row for the given session.
  // Both are read-only fetches, fail-open to null so render still degrades
  // gracefully if anything goes wrong.
  async function load(sb, sessionId) {
    let handout = null;
    let fridayQuiz = null;
    try {
      const { data, error } = await sb
        .from('session_handouts')
        .select('id, session_id, title, coin_value, pdf_url, verification_questions, reflection_prompt')
        .eq('session_id', sessionId)
        .maybeSingle();
      if (!error) handout = data || null;
    } catch (e) {
      console.warn('[topic00] handout fetch failed', e);
    }
    try {
      const { data, error } = await sb
        .from('session_quizzes')
        .select('id, session_id, quiz_type, title, description, coins_per_question, coins_per_question_retake, max_attempts, display_order')
        .eq('session_id', sessionId)
        .eq('quiz_type', 'friday')
        .maybeSingle();
      if (!error) fridayQuiz = data || null;
    } catch (e) {
      console.warn('[topic00] friday quiz fetch failed', e);
    }
    return { handout, fridayQuiz };
  }

  // ── progress helpers ───────────────────────────────────────────────────────
  function dayDone(progress, n) {
    if (!progress) return false;
    return !!progress[`day_${n}_completed_at`];
  }
  function weekFullyComplete(progress) {
    return progress && progress.day_1_completed_at && progress.day_2_completed_at && progress.day_3_completed_at;
  }

  // ── 3-dot day rail ─────────────────────────────────────────────────────────
  // Mon / Wed / Fri progress visualization. Active day is highlighted; done
  // days show a checkmark; future days dim.
  function renderDayRail(state, progress) {
    const days = [
      { n: 1, label: 'Monday',    short: 'Day 1 · Teach',   active: state.day_kind === 'day1' },
      { n: 2, label: 'Wednesday', short: 'Day 2 · Work',    active: state.day_kind === 'day2' },
      { n: 3, label: 'Friday',    short: 'Day 3 · Reflect', active: state.day_kind === 'day3' },
    ];
    const tabs = days.map((d) => {
      const done = dayDone(progress, d.n);
      const cls = ['day-tab'];
      if (d.active) cls.push('active');
      if (done) cls.push('done');
      const mark = done ? '<span class="day-mark" aria-hidden="true">✓</span>' : '';
      return `<div class="${cls.join(' ')}" role="tab" aria-selected="${d.active}"><span class="day-label">${esc(d.label)}</span>${esc(d.short)}${mark}</div>`;
    }).join('');
    return `<div class="day-tabs day-rail" role="tablist" aria-label="This week's three days">${tabs}</div>`;
  }

  // ── Monday view ────────────────────────────────────────────────────────────
  function renderMonday(sess, handout, progress) {
    const isDone = dayDone(progress, 1);
    const lessonHtml = sess.lesson_text
      ? `<div class="lesson-body">${formatLessonText(sess.lesson_text)}</div>`
      : '<p style="font-style:italic;color:rgba(244,232,193,0.55);">(lesson text not yet written)</p>';

    const discussionItems = [sess.discussion_q1, sess.discussion_q2, sess.discussion_q3].filter(
      (q) => q && q.trim().length > 0
    );
    const discussionHtml = discussionItems.length
      ? `<ol class="discussion-questions">${discussionItems.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`
      : '';

    const parentLinkHtml = `
      <div class="artifact-slot parent-link-slot" data-slot="parent_companion_link" style="background:rgba(44,22,84,0.2);">
        <div class="artifact-icon">✦</div>
        <div class="artifact-title">For Your Father</div>
        <div class="artifact-blurb">A teaching guide is available with discussion questions and notes for this lesson.</div>
        <a href="parent-companion.html?session=${esc(sess.id)}" class="reading-link">Open the Parent's Companion →</a>
      </div>`;

    const buttonLabel = isDone
      ? '✓ I read this with my dad'
      : 'I read this with my dad';

    return `
      <div class="main-frame" data-day="1">
        <div class="day-heading">${esc(sess.title)}</div>
        <div class="day-subheading">Monday — Day 1 · The teaching day, with your dad</div>

        <div class="artifact-slot" data-slot="lesson">
          <div class="artifact-icon">📖</div>
          <div class="artifact-title">The Lesson</div>
          ${lessonHtml}
        </div>

        ${discussionHtml ? `
        <div class="artifact-slot" data-slot="discussion_questions">
          <div class="artifact-icon">✦</div>
          <div class="artifact-title">To Talk About With Your Father</div>
          ${discussionHtml}
        </div>` : ''}

        ${parentLinkHtml}

        <button class="complete-btn" data-action="t00-day1" data-session-id="${esc(sess.id)}" ${isDone ? 'data-complete="true" disabled' : ''}>
          ${buttonLabel}
        </button>
        ${isDone ? '<div class="reward-line">✦ 75 Saint Coins earned for Day 1</div>' : '<div class="reward-hint">Tap when you and your father have read the lesson together. (+75 Saint Coins)</div>'}
      </div>
    `;
  }

  // ── Wednesday view ─────────────────────────────────────────────────────────
  // Uses session_handouts.pdf_url + verification_questions JSONB.
  // Renders ONE question at a time (currently exactly 1 per Topic 00 handout,
  // but iterates the array so future multi-question handouts also work).
  function renderWednesday(sess, handout, progress) {
    const isDone = dayDone(progress, 2);

    if (!handout) {
      return `
        <div class="main-frame" data-day="2">
          <div class="day-heading">${esc(sess.title)}</div>
          <div class="day-subheading">Wednesday — Day 2 · Independent work</div>
          <div class="artifact-slot placeholder">
            <div class="artifact-icon">⌛</div>
            <div class="artifact-title">This week's handout is being prepared</div>
            <div class="artifact-blurb">Check back soon — the printable handout for this week will appear here when it's ready.</div>
          </div>
        </div>
      `;
    }

    const pdfHref = handout.pdf_url ? esc(handout.pdf_url) : '#';
    const pdfDownload = handout.pdf_url
      ? `<a href="${pdfHref}" class="pdf-download-btn" target="_blank" rel="noopener" download>
           <span class="pdf-icon">📄</span>
           <span class="pdf-text">
             <span class="pdf-title">Download Today's Handout</span>
             <span class="pdf-subtitle">A printable PDF — print it, fill it in by hand, then come back here.</span>
           </span>
           <span class="pdf-arrow">↓</span>
         </a>`
      : `<div class="artifact-blurb" style="color:rgba(244,232,193,0.55);">(handout PDF will be ready soon)</div>`;

    const questions = Array.isArray(handout.verification_questions) ? handout.verification_questions : [];
    const verifyHtml = questions.length
      ? renderVerificationBlock(questions, isDone)
      : `<div class="artifact-blurb" style="color:rgba(244,232,193,0.55);">(verification question will be ready soon)</div>`;

    const reflectionHtml = handout.reflection_prompt
      ? `<div class="artifact-slot" data-slot="reflection_prompt">
           <div class="artifact-icon">✎</div>
           <div class="artifact-title">A Reflection for Your Field Manual</div>
           <div class="artifact-blurb" style="font-style:normal;color:rgba(244,232,193,0.85);font-size:1rem;line-height:1.65;margin-bottom:0.8rem;">${esc(handout.reflection_prompt)}</div>
           <a href="journal.html?session=${esc(sess.id)}&prompt=session" class="reading-link">Open Field Manual →</a>
           <div class="artifact-note" style="margin-top:0.5rem;font-size:0.78rem;color:rgba(201,146,42,0.55);font-style:italic;">You can also write this reflection on your printed handout — whichever feels right.</div>
         </div>`
      : '';

    return `
      <div class="main-frame" data-day="2">
        <div class="day-heading">${esc(sess.title)}</div>
        <div class="day-subheading">Wednesday — Day 2 · Working through the handout, on your own</div>

        <div class="artifact-slot" data-slot="handout_pdf">
          <div class="artifact-icon">📋</div>
          <div class="artifact-title">${esc(handout.title || 'This Week\'s Handout')}</div>
          <div class="artifact-blurb" style="margin-bottom:0.9rem;">Open this handout, print it if you can, and work through every section. When you're done, come back here and answer the question below.</div>
          ${pdfDownload}
        </div>

        <div class="artifact-slot verify-slot" data-slot="verification" data-handout-id="${esc(handout.id)}" data-session-id="${esc(sess.id)}" data-coin-value="${esc(handout.coin_value || 75)}">
          <div class="artifact-icon">◈</div>
          <div class="artifact-title">A Question From Your Handout</div>
          <div class="artifact-blurb" style="margin-bottom:0.9rem;font-style:normal;color:rgba(244,232,193,0.7);">Answer this from the work you just did on your handout.</div>
          ${verifyHtml}
        </div>

        ${reflectionHtml}

        ${isDone
          ? '<div class="reward-line">✦ 75 Saint Coins earned for Day 2</div>'
          : '<div class="reward-hint">Day 2 will mark complete after you answer the question correctly. (+75 Saint Coins)</div>'}
      </div>
    `;
  }

  function renderVerificationBlock(questions, alreadyComplete) {
    return questions.map((q, qi) => {
      const opts = (q.options || []).map((opt, oi) =>
        `<label class="verify-option${alreadyComplete && oi === q.correct_index ? ' already-correct' : ''}">
           <input type="radio" name="verify-q-${qi}" value="${oi}" ${alreadyComplete ? 'disabled' : ''} ${alreadyComplete && oi === q.correct_index ? 'checked' : ''}>
           <span class="verify-option-letter">${String.fromCharCode(65 + oi)}</span>
           <span class="verify-option-text">${esc(opt)}</span>
         </label>`).join('');
      return `
        <div class="verify-question" data-q-index="${qi}" data-correct-index="${esc(q.correct_index)}" data-gates="${q.gates_completion ? 'true' : 'false'}" data-explanation="${esc(q.explanation || '')}">
          <div class="verify-question-text">${esc(q.question)}</div>
          <div class="verify-options">${opts}</div>
          <div class="verify-feedback" aria-live="polite"></div>
          ${alreadyComplete
            ? `<div class="verify-feedback verify-feedback-correct verify-feedback-locked">${esc(q.explanation || 'Correct.')}</div>`
            : `<button type="button" class="verify-submit-btn" data-action="t00-verify-submit">Check My Answer</button>`}
        </div>
      `;
    }).join('');
  }

  // ── Friday view ────────────────────────────────────────────────────────────
  // Lane 2 owns the launcher. Lane 3 owns assess.html and the actual quiz.
  // Lane 3 contract: assess.html?session={id}&type=friday — Lane 3 reads
  // session_quizzes WHERE session_id={id} AND quiz_type='friday', renders
  // the 8 quiz_questions, writes quiz_attempts (which trigger-rolls coins
  // via log_quiz_attempt_coins), and on submit writes
  // session_progress.day_3_completed_at.
  function renderFriday(sess, fridayQuiz, progress) {
    const isDone = dayDone(progress, 3);
    const isComplete = weekFullyComplete(progress);

    if (!fridayQuiz) {
      return `
        <div class="main-frame" data-day="3">
          <div class="day-heading">${esc(sess.title)}</div>
          <div class="day-subheading">Friday — Day 3 · The week's quiz</div>
          <div class="artifact-slot placeholder">
            <div class="artifact-icon">⌛</div>
            <div class="artifact-title">This week's quiz is being prepared</div>
            <div class="artifact-blurb">Check back soon — the Friday quiz for this week will appear here when it's ready.</div>
          </div>
        </div>
      `;
    }

    const launcherHref = `assess.html?session=${encodeURIComponent(sess.id)}&type=friday`;
    const cpq = fridayQuiz.coins_per_question || 10;
    const cpqr = fridayQuiz.coins_per_question_retake || 5;
    const maxA = fridayQuiz.max_attempts || 2;
    const numQ = 8; // verified in pre-scan: every Topic 00 Friday quiz has 8 questions

    return `
      <div class="main-frame" data-day="3">
        <div class="day-heading">${esc(sess.title)}</div>
        <div class="day-subheading">Friday — Day 3 · Closing the week with a short quiz</div>

        <div class="artifact-slot quiz-launcher-slot" data-slot="friday_quiz">
          <div class="artifact-icon">◈</div>
          <div class="artifact-title">${esc(fridayQuiz.title || 'Friday Quiz')}</div>
          ${fridayQuiz.description ? `<div class="artifact-blurb" style="font-style:normal;color:rgba(244,232,193,0.85);margin-bottom:0.9rem;">${esc(fridayQuiz.description)}</div>` : ''}
          <div class="quiz-meta">
            <div class="quiz-meta-item"><span class="quiz-meta-label">Questions</span><span class="quiz-meta-value">${numQ}</span></div>
            <div class="quiz-meta-item"><span class="quiz-meta-label">Each correct</span><span class="quiz-meta-value">+${cpq} coins</span></div>
            <div class="quiz-meta-item"><span class="quiz-meta-label">Tries allowed</span><span class="quiz-meta-value">${maxA}</span></div>
            <div class="quiz-meta-item"><span class="quiz-meta-label">If you retake</span><span class="quiz-meta-value">+${cpqr} per fix</span></div>
          </div>
          ${isDone
            ? `<a href="${esc(launcherHref)}" class="quiz-launcher-btn done">✓ Quiz Complete · Review</a>`
            : `<a href="${esc(launcherHref)}" class="quiz-launcher-btn">Begin the Friday Quiz →</a>`}
          <div class="artifact-note" style="margin-top:0.7rem;font-size:0.78rem;color:rgba(201,146,42,0.55);font-style:italic;">
            ${isDone
              ? 'You\'ve already completed this quiz. You can revisit it to see your answers.'
              : 'Take your time. Read each question carefully. There\'s no rush.'}
          </div>
        </div>

        ${isComplete
          ? `<div class="week-complete-banner">
               <div class="week-complete-icon">☩</div>
               <div class="week-complete-text">
                 <div class="week-complete-title">This week is complete</div>
                 <div class="week-complete-sub">Glory to God. Rest well, then we begin again Monday.</div>
               </div>
             </div>`
          : ''}
      </div>
    `;
  }

  // ── Rest day view (Tue/Thu) ────────────────────────────────────────────────
  // Shown on Tuesday and Thursday — between-day rest. Lifts the day rail to
  // give Nolan a sense of where he is in the week.
  function renderRestDay(state, sess, progress) {
    const between = state.day_kind === 'between_sessions';
    if (!between) return null; // not our slot
    const day1Done = dayDone(progress, 1);
    const day2Done = dayDone(progress, 2);
    let nextLabel = '';
    let nextNote = '';
    if (!day1Done) {
      nextLabel = 'Monday';
      nextNote = 'Day 1 hasn\'t been marked yet — you can come back to it when you\'re with your father.';
    } else if (!day2Done) {
      nextLabel = 'Wednesday';
      nextNote = 'Wednesday brings the handout and a question from it. See you then.';
    } else {
      nextLabel = 'Friday';
      nextNote = 'Friday closes the week with a short quiz. See you then.';
    }
    return `
      <div class="calm-frame">
        <div class="calm-icon">✦</div>
        <div class="calm-title">A Quiet Day</div>
        <div class="calm-text">${esc(sess?.title ? `This week's session, "${sess.title}", continues on ${nextLabel}.` : `The next teaching day is ${nextLabel}.`)} ${esc(nextNote)}</div>
        <div class="calm-quote">You can revisit your Field Manual, practice your memorization, or read a saint's life.</div>
      </div>
    `;
  }

  // ── top-level render ───────────────────────────────────────────────────────
  // Returns the full inner HTML for the Topic 00 main slot, branching by
  // day_kind. Sat/Sun/pre-launch/pause are still routed by week.html — this
  // function is only called for Mon/Wed/Fri/Tue/Thu in Topic 00 weeks.
  function render(state, sessionData, ctx) {
    const sess = sessionData?.session;
    const progress = sessionData?.progress || null;

    // Coming-soon and missing fall through to the existing renderState helpers
    // in week.html. We assume render() is called only with a renderable session.
    if (!sess) {
      return `
        <div class="main-frame">
          <div class="day-heading">This Week's Lesson</div>
          <div class="day-subheading">Take it gently — read, reflect, write</div>
          <div class="artifact-slot placeholder">
            <div class="artifact-icon">📖</div>
            <div class="artifact-title">Awaiting this week's content</div>
            <div class="artifact-blurb">The lesson for this week will appear here when it is ready.</div>
          </div>
        </div>
      `;
    }

    const handout = ctx?.handout || null;
    const fridayQuiz = ctx?.fridayQuiz || null;

    if (state.day_kind === 'day1') return renderMonday(sess, handout, progress);
    if (state.day_kind === 'day2') return renderWednesday(sess, handout, progress);
    if (state.day_kind === 'day3') return renderFriday(sess, fridayQuiz, progress);
    if (state.day_kind === 'between_sessions') return renderRestDay(state, sess, progress) || '';
    return ''; // sat/sun/pre_launch/pause routed elsewhere
  }

  // ── completion handlers ────────────────────────────────────────────────────
  // Shared write helpers. RLS is "auth.uid() = explorer_id"; we always write
  // explorer_id = profileId (the logged-in user's UUID).
  //
  // Idempotency: we use upsert with onConflict on the unique index. We also
  // pre-read the row to decide whether the click is a fresh completion (and
  // therefore should award coins + write activity_log) or a no-op replay.
  async function writeMondayCompletion(sb, profileId, sessionId, coinAmount, sessionTitle) {
    // 1. Read existing progress row, if any
    const { data: existing, error: readErr } = await sb
      .from('session_progress')
      .select('id, day_1_completed_at, coins_awarded')
      .eq('explorer_id', profileId)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (readErr) {
      console.error('[topic00] read progress failed', readErr);
      throw readErr;
    }

    // Already done → no-op
    if (existing && existing.day_1_completed_at) {
      return { newlyAwarded: false, coinsThisCall: 0 };
    }

    const ts = nowIso();
    if (existing) {
      // 2a. Update existing row — bump coins_awarded and stamp day_1
      const { error: updErr } = await sb
        .from('session_progress')
        .update({
          day_1_completed_at: ts,
          coins_awarded: (existing.coins_awarded || 0) + coinAmount,
        })
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      // 2b. Insert fresh row
      const { error: insErr } = await sb
        .from('session_progress')
        .insert({
          explorer_id: profileId,
          session_id: sessionId,
          day_1_completed_at: ts,
          coins_awarded: coinAmount,
        });
      if (insErr) throw insErr;
    }

    // 3. Activity log entry for coin rollup
    try {
      await sb.from('activity_log').insert({
        explorer_id: profileId,
        amount: coinAmount,
        reason: `[session_monday] ${sessionId}${sessionTitle ? ' — ' + sessionTitle : ''}`,
      });
    } catch (e) {
      console.warn('[topic00] activity_log monday write failed (non-fatal)', e);
    }

    // 4. Optimistic profile coin bump for immediate UI freshness
    await bumpProfileCoins(sb, profileId, coinAmount);

    return { newlyAwarded: true, coinsThisCall: coinAmount };
  }

  async function writeWednesdayCompletion(sb, profileId, sessionId, handout, chosenAnswers) {
    const coinAmount = handout.coin_value || 75;
    const handoutId = handout.id;
    const sessionTitle = null; // sessionTitle passed elsewhere

    // 1. Has handout already been completed by this explorer?
    const { data: existingComp, error: readErr } = await sb
      .from('handout_completions')
      .select('id, coins_awarded')
      .eq('handout_id', handoutId)
      .eq('explorer_id', profileId)
      .maybeSingle();
    if (readErr) {
      console.error('[topic00] read handout_completions failed', readErr);
      throw readErr;
    }
    if (existingComp) {
      // Already done. Still ensure session_progress.day_2 is stamped (defensive)
      await stampSessionProgressDay(sb, profileId, sessionId, 2, 0);
      return { newlyAwarded: false, coinsThisCall: 0 };
    }

    // 2. Insert fresh handout_completions row
    const { error: insErr } = await sb.from('handout_completions').insert({
      handout_id: handoutId,
      explorer_id: profileId,
      coins_awarded: coinAmount,
      verification_answers: chosenAnswers,
    });
    if (insErr) throw insErr;

    // 3. Stamp session_progress.day_2_completed_at (and bump session-level coins_awarded too)
    await stampSessionProgressDay(sb, profileId, sessionId, 2, coinAmount);

    // 4. Activity log entry
    try {
      await sb.from('activity_log').insert({
        explorer_id: profileId,
        amount: coinAmount,
        reason: `[session_wednesday] ${sessionId} — handout completed`,
      });
    } catch (e) {
      console.warn('[topic00] activity_log wednesday write failed (non-fatal)', e);
    }

    // 5. Profile coin bump
    await bumpProfileCoins(sb, profileId, coinAmount);

    return { newlyAwarded: true, coinsThisCall: coinAmount };
  }

  // Stamp session_progress.day_N_completed_at and add `coinDelta` to coins_awarded.
  // Creates the row if it doesn't exist. coinDelta may be 0 for "just stamp".
  async function stampSessionProgressDay(sb, profileId, sessionId, n, coinDelta) {
    const colTs = `day_${n}_completed_at`;
    const { data: existing, error: readErr } = await sb
      .from('session_progress')
      .select('id, ' + colTs + ', coins_awarded')
      .eq('explorer_id', profileId)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (readErr) throw readErr;
    const ts = nowIso();
    if (existing) {
      if (existing[colTs]) return; // already stamped
      const update = {};
      update[colTs] = ts;
      update.coins_awarded = (existing.coins_awarded || 0) + coinDelta;
      const { error: updErr } = await sb
        .from('session_progress')
        .update(update)
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      const insert = {
        explorer_id: profileId,
        session_id: sessionId,
        coins_awarded: coinDelta,
      };
      insert[colTs] = ts;
      const { error: insErr } = await sb.from('session_progress').insert(insert);
      if (insErr) throw insErr;
    }
  }

  async function bumpProfileCoins(sb, profileId, amount) {
    if (!amount || amount <= 0) return;
    try {
      const { data: prof, error: readErr } = await sb
        .from('profiles')
        .select('coins, lifetime_coins')
        .eq('id', profileId)
        .maybeSingle();
      if (readErr || !prof) return; // best-effort; not fatal
      const { error: updErr } = await sb
        .from('profiles')
        .update({
          coins: (prof.coins || 0) + amount,
          lifetime_coins: (prof.lifetime_coins || 0) + amount,
          updated_at: nowIso(),
        })
        .eq('id', profileId);
      if (updErr) console.warn('[topic00] profile coin bump failed (non-fatal)', updErr);
    } catch (e) {
      console.warn('[topic00] profile coin bump exception (non-fatal)', e);
    }
  }

  // ── DOM event wiring ───────────────────────────────────────────────────────
  // Wires up Monday "I read this with my dad" + Wednesday verification submit.
  // Friday is just an anchor — no JS needed.
  function attachHandlers(sb, profileId, sessionData, ctx) {
    if (!sb) return;
    document.addEventListener('click', async (e) => {
      // Monday day 1 completion
      const mondayBtn = e.target.closest('button[data-action="t00-day1"]');
      if (mondayBtn) {
        e.preventDefault();
        if (mondayBtn.disabled) return;
        if (mondayBtn.getAttribute('data-complete') === 'true') return;
        if (!profileId) {
          inlineError(mondayBtn, 'You\'re not signed in — please sign in to mark this complete.');
          return;
        }
        const sessionId = mondayBtn.getAttribute('data-session-id');
        const original = mondayBtn.textContent;
        mondayBtn.disabled = true;
        mondayBtn.textContent = 'Saving...';
        try {
          const result = await writeMondayCompletion(
            sb, profileId, sessionId, 75,
            sessionData?.session?.title || null
          );
          mondayBtn.setAttribute('data-complete', 'true');
          mondayBtn.textContent = '✓ I read this with my dad';
          mondayBtn.disabled = true;
          // Replace hint with reward line
          const main = mondayBtn.closest('.main-frame');
          if (main) {
            const hint = main.querySelector('.reward-hint');
            if (hint) {
              hint.outerHTML = `<div class="reward-line${result.newlyAwarded ? ' reward-line-flash' : ''}">✦ 75 Saint Coins earned for Day 1</div>`;
            }
            const railTab = document.querySelectorAll('.day-rail .day-tab')[0];
            if (railTab && !railTab.classList.contains('done')) {
              railTab.classList.add('done');
              const mark = document.createElement('span');
              mark.className = 'day-mark';
              mark.setAttribute('aria-hidden', 'true');
              mark.textContent = '✓';
              railTab.appendChild(mark);
            }
          }
        } catch (err) {
          console.error('[topic00] monday completion failed', err);
          mondayBtn.disabled = false;
          mondayBtn.textContent = original;
          inlineError(mondayBtn, 'Could not save just now — please try again.');
        }
        return;
      }

      // Wednesday verification submit
      const verifyBtn = e.target.closest('button[data-action="t00-verify-submit"]');
      if (verifyBtn) {
        e.preventDefault();
        await handleVerifySubmit(sb, profileId, sessionData, ctx, verifyBtn);
        return;
      }
    });
  }

  async function handleVerifySubmit(sb, profileId, sessionData, ctx, verifyBtn) {
    const verifySlot = verifyBtn.closest('.verify-slot');
    if (!verifySlot) return;
    if (!profileId) {
      inlineError(verifyBtn, 'You\'re not signed in — please sign in to submit your answer.');
      return;
    }
    const handout = ctx?.handout;
    if (!handout) {
      inlineError(verifyBtn, 'The handout for this week isn\'t loaded — try refreshing.');
      return;
    }

    const questionEls = Array.from(verifySlot.querySelectorAll('.verify-question'));
    const chosen = [];
    let allCorrect = true;
    let firstWrongFeedback = null;

    for (const qEl of questionEls) {
      const radios = Array.from(qEl.querySelectorAll('input[type="radio"]'));
      const checked = radios.find((r) => r.checked);
      if (!checked) {
        // No selection on a question
        const fb = qEl.querySelector('.verify-feedback');
        if (fb) {
          fb.textContent = 'Please choose an answer.';
          fb.className = 'verify-feedback verify-feedback-prompt';
        }
        return;
      }
      const choice = parseInt(checked.value, 10);
      const correctIdx = parseInt(qEl.getAttribute('data-correct-index'), 10);
      const gates = qEl.getAttribute('data-gates') === 'true';
      const explanation = qEl.getAttribute('data-explanation') || '';
      chosen.push({ q_index: parseInt(qEl.getAttribute('data-q-index'), 10), choice, correct: choice === correctIdx });

      const fb = qEl.querySelector('.verify-feedback');
      if (choice === correctIdx) {
        if (fb) {
          fb.textContent = explanation || 'Correct!';
          fb.className = 'verify-feedback verify-feedback-correct';
        }
      } else {
        if (gates) allCorrect = false;
        if (fb) {
          fb.textContent = explanation
            ? `Not quite right. ${explanation}`
            : 'Not quite right — take another look at your handout and try again.';
          fb.className = 'verify-feedback verify-feedback-wrong';
        }
        if (!firstWrongFeedback) firstWrongFeedback = qEl;
      }
    }

    if (!allCorrect) {
      // Allow retry. Don't write completion. Surface a soft retry prompt.
      verifyBtn.textContent = 'Try Again';
      // Scroll the first wrong into view if present
      if (firstWrongFeedback && firstWrongFeedback.scrollIntoView) {
        firstWrongFeedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // All gates_completion answers correct → write completion
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Saving...';
    try {
      const result = await writeWednesdayCompletion(
        sb, profileId, sessionData.session.id, handout, chosen
      );
      // Lock the radios + replace button with confirmation
      verifySlot.querySelectorAll('input[type="radio"]').forEach((r) => { r.disabled = true; });
      verifyBtn.outerHTML = '<div class="verify-confirmed">✓ Day 2 marked complete</div>';
      const main = verifySlot.closest('.main-frame');
      if (main) {
        const hint = main.querySelector('.reward-hint');
        if (hint) {
          hint.outerHTML = `<div class="reward-line${result.newlyAwarded ? ' reward-line-flash' : ''}">✦ 75 Saint Coins earned for Day 2</div>`;
        }
        const railTab = document.querySelectorAll('.day-rail .day-tab')[1];
        if (railTab && !railTab.classList.contains('done')) {
          railTab.classList.add('done');
          const mark = document.createElement('span');
          mark.className = 'day-mark';
          mark.setAttribute('aria-hidden', 'true');
          mark.textContent = '✓';
          railTab.appendChild(mark);
        }
      }
    } catch (err) {
      console.error('[topic00] wednesday completion failed', err);
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Check My Answer';
      inlineError(verifyBtn, 'Could not save just now — please try again.');
    }
  }

  function inlineError(anchorEl, message) {
    if (!anchorEl) return;
    let host = anchorEl.parentElement;
    if (!host) return;
    const old = host.querySelector('.t00-error-line');
    if (old) old.remove();
    const div = document.createElement('div');
    div.className = 't00-error-line';
    div.textContent = message;
    div.style.cssText = 'margin-top:0.6rem;font-family:Cinzel,serif;font-size:0.72rem;letter-spacing:0.1em;color:rgba(244,180,180,0.9);text-align:center;text-transform:uppercase;';
    host.appendChild(div);
    setTimeout(() => { try { div.remove(); } catch (e) {} }, 5000);
  }

  // ── exposed API ────────────────────────────────────────────────────────────
  window.Topic00Day = {
    load,
    render,
    renderDayRail,
    attachHandlers,
    weekFullyComplete,
    dayDone,
  };
})();
