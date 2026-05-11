/**
 * Orthodox Expedition — Reading Quest
 *
 * Dispatch 3b · Question Card UI + Engagement Loop
 *
 * Mounts the daily "Theo or Christopher asks…" question card on
 * home.html, immediately under the daily anchor card. The card only
 * appears once Nolan has tapped through to bible-reader.html (via
 * the gospel teaser on the daily anchor card) and returned — that
 * "I have read today's gospel" signal is carried by a localStorage
 * flag set by a tiny pagehide hook in bible-reader.html.
 *
 * State machine, computed from three inputs (today's question
 * payload, the localStorage flag, and the reading_completions row):
 *
 *   A.  No question for today → render nothing. (Outside launch
 *       window dates, or future expansions before orchestrator
 *       populates a batch.)
 *   B.  Question exists, no flag yet → render nothing. The daily
 *       anchor card is the only "tap to read" surface; pre-read,
 *       this slot is invisible to avoid spoiling the question.
 *   C.  Flag set, no completion row → render the question card
 *       per format (multiple_choice / free_text / chips).
 *   D.  Completion row exists, was_correct=true OR row has
 *       reflection_text → render the celebratory "completed" card
 *       (smaller portrait, closing line, earned coin pip,
 *       reveal_context for MC, reflection echoed for free_text/chips).
 *   E.  Completion row exists with skipped_pastorally=true → render
 *       the gentle "you still showed up" card. Zero coin pip.
 *
 * Coin schedule (matches dispatch §COIN AWARDING):
 *   • MC try-1 correct                       → +5
 *   • MC try-2 correct                       → +4
 *   • MC try-3 correct OR MC try-3 wrong     → +3 (floor)
 *   • free_text save                         → +5
 *   • chips non-escape select                 → +5
 *   • chips escape ("Something else…")       → opens textarea
 *                                              then +5 on save
 *   • pastoral skip                          → +0
 *
 * Field Manual integration (free_text + chips-escape only):
 *   On submit, a field_journal row is written using the existing
 *   schema (no source/title/body/calendar_date columns exist; closest
 *   equivalents are used per the approved Dispatch 3b Deviation 2):
 *     category   = 'expedition_log'
 *     entry_text = "Reflection on <gospel.reference>\n\n<text>"
 *     explorer_id= current explorer
 *     tool_type  = 'pen'
 *     tool_color = '#1a0f00'
 *     highlight, stamps = null
 *
 * Idempotency:
 *   Insert into reading_completions has UNIQUE(explorer_id,
 *   calendar_date). A duplicate-key error (Postgres 23505) is
 *   treated as "already completed" and triggers a re-mount that
 *   reads the existing row — coins are NEVER awarded on the
 *   retry path. The order is row-insert-first, coin-award-second,
 *   so a failed row insert (for any reason) leaves coins untouched.
 *
 * Public API:
 *   ReadingQuest.mount(container, {
 *     sb,          // Supabase client
 *     explorerId,  // current explorer profile.id (uuid)
 *     familyId,    // current explorer profile.family_id (uuid)
 *     today,       // 'YYYY-MM-DD' ET key (WeekUtils.todayKey())
 *     row,         // liturgical_calendar row with daily_readings,
 *                  // OR null
 *   })
 *
 * The mount call is idempotent for purposes of re-render: calling
 * it again with the same inputs reads the current DB + localStorage
 * state and produces the right markup without side-effects.
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════

  // ── HTML escape ────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Capitalize speaker name for the "asks…" label ─────────────
  function capSpeaker(s) {
    if (!s) return '';
    const str = String(s);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // ── ET today key (no WeekUtils dependency — self-contained) ────
  // Used only as a fallback if `today` is not passed in to mount();
  // home.html always supplies it via WeekUtils.todayKey().
  function todayKeyET() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year:     'numeric',
      month:    '2-digit',
      day:      '2-digit',
    }).formatToParts(new Date()).reduce((o, x) => (o[x.type] = x.value, o), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  // ── Portrait paths ────────────────────────────────────────────
  // Relative paths resolved against home.html's location. Confirmed
  // to exist in /assets/characters/ in the repo (Dispatch 3b discovery).
  const PORTRAIT = {
    theo:        'assets/characters/theo-portrait.png',
    christopher: 'assets/characters/christopher-portrait.png',
  };

  // ── LocalStorage flag (bible-reader → reading-quest signal) ────
  function flagKey(today) {
    return `oe_bible_reader_visited_${today}`;
  }
  function isFlagSet(today) {
    try { return localStorage.getItem(flagKey(today)) === '1'; }
    catch (_e) { return false; }
  }
  function clearFlag(today) {
    try { localStorage.removeItem(flagKey(today)); } catch (_e) { /* graceful */ }
  }

  // ── Question payload validator ─────────────────────────────────
  // Returns the question object if it has the minimum valid shape,
  // otherwise null. Per dispatch §SCHEMA REFERENCE: speaker/format/
  // setup are universally required; MC also requires answers,
  // right_answer_index, and reveal_context; chips requires answers.
  function getQuestion(row) {
    if (!row || !row.daily_readings || !row.daily_readings.question) return null;
    const q = row.daily_readings.question;
    if (!q.speaker || !q.format || !q.setup) return null;
    if (q.format === 'multiple_choice') {
      if (!Array.isArray(q.answers) || q.answers.length < 2) return null;
      if (typeof q.right_answer_index !== 'number') return null;
      if (q.right_answer_index < 0 || q.right_answer_index >= q.answers.length) return null;
      if (!q.reveal_context) return null;
    } else if (q.format === 'chips') {
      if (!Array.isArray(q.answers) || q.answers.length < 2) return null;
    } else if (q.format !== 'free_text') {
      return null;
    }
    if (q.speaker !== 'theo' && q.speaker !== 'christopher') return null;
    return q;
  }

  // ── Chips escape-hatch detector ────────────────────────────────
  // Per dispatch + verified against launch-window data: only the
  // LAST chip is the escape hatch, and only when its label contains
  // "type it" or "Something else" (case-insensitive).
  function isChipEscapeHatch(label) {
    if (!label) return false;
    return /type it/i.test(label) || /something else/i.test(label);
  }

  // ── Gospel reference for the journal prefix ────────────────────
  // Defensive: gospel may or may not be populated; the field is
  // optional for the entry text prefix (no prefix → just the
  // user's text).
  function getGospelReference(row) {
    if (!row || !row.daily_readings || !row.daily_readings.gospel) return null;
    return row.daily_readings.gospel.reference || null;
  }

  // ── MC coin schedule (5/4/3 floor) ─────────────────────────────
  function coinsForMC(tryNum) {
    if (tryNum === 1) return 5;
    if (tryNum === 2) return 4;
    return 3;
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA ACCESS
  // ═══════════════════════════════════════════════════════════════

  // ── Today's completion row, if any ─────────────────────────────
  async function fetchTodayCompletion(sb, explorerId, today) {
    try {
      const { data, error } = await sb
        .from('reading_completions')
        .select('id, calendar_date, question_format, tries_used, was_correct, coins_earned, reflection_text, skipped_pastorally')
        .eq('explorer_id', explorerId)
        .eq('calendar_date', today)
        .maybeSingle();
      if (error) {
        console.warn('[ReadingQuest] fetchTodayCompletion error:', error);
        return null;
      }
      return data || null;
    } catch (e) {
      console.warn('[ReadingQuest] fetchTodayCompletion threw:', e);
      return null;
    }
  }

  // ── Insert completion row + (on success) award coins ───────────
  // Order is intentional: row first, coins second. If the row insert
  // fails (duplicate via UNIQUE constraint, or any other reason),
  // coins are NEVER touched. On success, coins are awarded via the
  // canonical direct profile-bump pattern (matches prayer-rollup.js,
  // quiz-runner.js, topic-00-day.js, session-rollup.js).
  //
  // Returns { ok: bool, duplicate: bool, row: object|null }.
  async function commitCompletion(sb, payload, explorerId, coinsToAward) {
    try {
      const { data, error } = await sb
        .from('reading_completions')
        .insert(payload)
        .select()
        .single();
      if (error) {
        // Postgres unique-violation = 23505. Treat as benign duplicate.
        const isDuplicate = (error.code === '23505') ||
                            (error.message && /duplicate/i.test(error.message));
        if (isDuplicate) {
          return { ok: false, duplicate: true, row: null };
        }
        console.warn('[ReadingQuest] commitCompletion insert error:', error);
        return { ok: false, duplicate: false, row: null };
      }

      // Row insert succeeded — now award coins (if any).
      if (coinsToAward > 0) {
        try {
          const profRes = await sb
            .from('profiles')
            .select('coins, lifetime_coins')
            .eq('id', explorerId)
            .single();
          const prof = profRes.data || { coins: 0, lifetime_coins: 0 };
          await sb.from('profiles').update({
            coins:          (prof.coins          || 0) + coinsToAward,
            lifetime_coins: (prof.lifetime_coins || 0) + coinsToAward,
          }).eq('id', explorerId);
        } catch (coinErr) {
          // Coin-award failure is non-fatal for the engagement state
          // (the completion row is already saved). Log + continue.
          console.warn('[ReadingQuest] coin award failed (non-fatal):', coinErr);
        }
      }
      return { ok: true, duplicate: false, row: data };
    } catch (e) {
      console.warn('[ReadingQuest] commitCompletion threw:', e);
      return { ok: false, duplicate: false, row: null };
    }
  }

  // ── Public no-question completion wrapper ──────────────────────
  // Used when liturgical_calendar.daily_readings.question is null
  // for `today`. The user has read the Gospel (the localStorage flag
  // was set by bible-reader's pagehide hook), so we log a completion
  // with a flat coin reward and let the unique constraint handle
  // idempotency. Mirrors the prayer / memorization lane ethos:
  // engagement is worth a coin, the question is bonus rigor.
  //
  // Args:
  //   sb           — supabase client
  //   opts.explorerId, opts.familyId, opts.today (YYYY-MM-DD ET)
  //   opts.coins   — coin reward (defaults to 5; orchestrator-set)
  //
  // Returns the same shape as commitCompletion:
  //   { ok: bool, duplicate: bool, row: object|null }
  // Caller should treat ok=false+duplicate=true as success (the row
  // already exists from an earlier mount; coins were awarded then).
  async function commitNoQuestionCompletion(sb, opts) {
    opts = opts || {};
    const explorerId = opts.explorerId;
    const familyId   = opts.familyId;
    const today      = opts.today;
    const coins      = (typeof opts.coins === 'number') ? opts.coins : 5;
    if (!sb || !explorerId || !familyId || !today) {
      return { ok: false, duplicate: false, row: null };
    }
    const payload = {
      explorer_id:        explorerId,
      family_id:          familyId,
      calendar_date:      today,
      question_format:    null,
      tries_used:         null,
      was_correct:        null,
      coins_earned:       coins,
      reflection_text:    null,
      skipped_pastorally: false,
    };
    return commitCompletion(sb, payload, explorerId, coins);
  }

  // ── Write reflection to field_journal ──────────────────────────
  // Per approved Deviation 2: category='expedition_log', entry_text
  // prefixed with "Reflection on <gospel.reference>\n\n", defaults
  // for tool_type/tool_color matching journal.html's pen-ink-black
  // defaults. Failure is non-fatal — the reading_completions row is
  // the canonical record of the reflection.
  async function writeJournalEntry(sb, explorerId, gospelRef, reflectionText) {
    const safeText = String(reflectionText || '').trim();
    if (!safeText) return; // shouldn't happen — caller validates >5 chars
    const prefix = gospelRef ? `Reflection on ${gospelRef}\n\n` : '';
    try {
      const { error } = await sb.from('field_journal').insert({
        explorer_id: explorerId,
        category:    'expedition_log',
        entry_text:  prefix + safeText,
        tool_type:   'pen',
        tool_color:  '#1a0f00',
        highlight:   null,
        stamps:      null,
      });
      if (error) {
        console.warn('[ReadingQuest] field_journal write error (non-fatal):', error);
      }
    } catch (e) {
      console.warn('[ReadingQuest] field_journal write threw (non-fatal):', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — SHARED FRAGMENTS
  // ═══════════════════════════════════════════════════════════════

  // ── Card shell ─────────────────────────────────────────────────
  // Wraps every state in a consistent .rq-card frame. completed=true
  // adds a faded-border treatment via .rq-card--completed.
  function shellOpen({ speaker, completed, small }) {
    const portraitSrc = PORTRAIT[speaker] || PORTRAIT.theo;
    const portraitClass = small ? 'rq-portrait rq-portrait--small' : 'rq-portrait';
    const cardClasses = ['rq-card'];
    if (completed) cardClasses.push('rq-card--completed');
    return `
      <div class="${cardClasses.join(' ')}">
        <div class="rq-header">
          <img class="${portraitClass}" src="${esc(portraitSrc)}" alt="${esc(capSpeaker(speaker))}" />
          <div class="rq-speaker">${esc(capSpeaker(speaker))} ${completed ? 'says…' : 'asks…'}</div>
        </div>
    `;
  }

  function shellClose() {
    return `</div>`;
  }

  // ── Setup paragraph ────────────────────────────────────────────
  function setupHtml(question) {
    return `<div class="rq-setup">${esc(question.setup)}</div>`;
  }

  // ── Try counter (MC only) ──────────────────────────────────────
  function triesHtml(tryNum) {
    return `<div class="rq-tries">Try ${tryNum} of 3</div>`;
  }

  // ── Skip link (always available pre-completion) ────────────────
  function skipHtml() {
    return `<button type="button" class="rq-skip-link" data-rq-skip="1">I'll come back to this</button>`;
  }

  // ── Coin pip (completed states) ────────────────────────────────
  function coinPipHtml(n) {
    if (n <= 0) return '';
    return `<div class="rq-coin-pip" aria-label="${n} Saint Coins earned"><span class="rq-coin-glyph">✦</span>+${n}</div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — ACTIVE QUESTION STATES (C)
  // ═══════════════════════════════════════════════════════════════

  // ── MC question render ─────────────────────────────────────────
  function renderMC(container, question, tryNum, wrongIndices) {
    const wrong = wrongIndices || new Set();
    const pills = question.answers.map((a, i) => {
      const cls = wrong.has(i) ? 'rq-pill-btn rq-pill-btn--wrong' : 'rq-pill-btn';
      const dis = wrong.has(i) ? 'disabled' : '';
      return `<button type="button" class="${cls}" data-rq-mc-idx="${i}" ${dis}>${esc(a)}</button>`;
    }).join('');

    container.innerHTML =
      shellOpen({ speaker: question.speaker }) +
      setupHtml(question) +
      `<div class="rq-pills">${pills}</div>` +
      triesHtml(tryNum) +
      skipHtml() +
      shellClose();
  }

  // ── Free-text question render ──────────────────────────────────
  function renderFreeText(container, question, opts) {
    // opts.prefilled is used by chips-escape ("Something else — type it")
    // to optionally seed the textarea; left empty in pure free_text mode.
    const prefilled = (opts && opts.prefilled) || '';
    container.innerHTML =
      shellOpen({ speaker: question.speaker }) +
      setupHtml(question) +
      `<textarea class="rq-textarea" data-rq-textarea="1" maxlength="500"
                placeholder="Type your reflection…">${esc(prefilled)}</textarea>` +
      `<div class="rq-textarea-meta">
         <span class="rq-textarea-hint">A sentence or two is plenty.</span>
         <button type="button" class="rq-save-btn" data-rq-save="1" disabled>Save reflection</button>
       </div>` +
      skipHtml() +
      shellClose();
  }

  // ── Chips question render ──────────────────────────────────────
  function renderChips(container, question) {
    const chips = question.answers.map((label, i) => {
      const isEscape = (i === question.answers.length - 1) && isChipEscapeHatch(label);
      const extra = isEscape ? ' rq-chip--escape' : '';
      return `<button type="button" class="rq-chip${extra}"
                      data-rq-chip-idx="${i}"
                      data-rq-chip-escape="${isEscape ? '1' : '0'}">${esc(label)}</button>`;
    }).join('');
    container.innerHTML =
      shellOpen({ speaker: question.speaker }) +
      setupHtml(question) +
      `<div class="rq-chips">${chips}</div>` +
      skipHtml() +
      shellClose();
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — COMPLETED STATES (D, E)
  // ═══════════════════════════════════════════════════════════════

  // ── MC completed ───────────────────────────────────────────────
  function renderCompletedMC(question, completion) {
    const correctIdx = question.right_answer_index;
    const correctLabel = question.answers[correctIdx];
    const reveal = question.reveal_context || '';
    const closing = completion.was_correct
      ? `See you tomorrow, friend.`
      : `Now you know. See you tomorrow, friend.`;
    const correctHint = completion.was_correct
      ? ''
      : `<div class="rq-correct-hint">The answer was <strong>${esc(correctLabel)}</strong>.</div>`;

    return shellOpen({ speaker: question.speaker, completed: true, small: true }) +
      correctHint +
      `<div class="rq-reveal">${esc(reveal)}</div>` +
      `<div class="rq-closing">${esc(closing)}</div>` +
      coinPipHtml(completion.coins_earned) +
      shellClose();
  }

  // ── Free-text / chips completed ────────────────────────────────
  function renderCompletedTextual(question, completion) {
    const reflection = completion.reflection_text || '';
    const isChips = completion.question_format === 'chips';
    const echoLabel = isChips ? 'You chose' : 'You wrote';
    return shellOpen({ speaker: question.speaker, completed: true, small: true }) +
      `<div class="rq-closing">Saved to your Field Manual.</div>` +
      `<div class="rq-reflection-echo">
         <div class="rq-reflection-label">${esc(echoLabel)}:</div>
         <div class="rq-reflection-text">${esc(reflection)}</div>
       </div>` +
      coinPipHtml(completion.coins_earned) +
      shellClose();
  }

  // ── Pastoral-skip completed ────────────────────────────────────
  function renderCompletedPastoral(question) {
    return shellOpen({ speaker: question.speaker, completed: true, small: true }) +
      `<div class="rq-pastoral">No coins this time, but you still showed up. The Lord sees you.</div>` +
      shellClose();
  }

  // ── Completion-state dispatcher ────────────────────────────────
  function renderCompleted(container, question, completion) {
    if (completion.skipped_pastorally) {
      container.innerHTML = renderCompletedPastoral(question);
      return;
    }
    if (completion.question_format === 'multiple_choice') {
      container.innerHTML = renderCompletedMC(question, completion);
      return;
    }
    // free_text and chips share the textual-echo completed state
    container.innerHTML = renderCompletedTextual(question, completion);
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT WIRING
  // ═══════════════════════════════════════════════════════════════

  // ── Wire active-question container ─────────────────────────────
  // Delegated click listener on the card; reads data-rq-* attrs
  // to figure out which action fired. Internal state (tryNum,
  // wrongIndices, chosen chip-escape mode) is closed over here.
  function wireActiveQuestion(container, question, ctx) {
    const { sb, explorerId, familyId, today, row, remount } = ctx;
    let tryNum = 1;
    const wrongIndices = new Set();
    // For chips-escape: once user taps the escape chip, we re-render
    // as free_text and ignore further chip events on the old DOM.
    let chipsEscapeArmed = false;

    async function handlePastoralSkip() {
      const payload = {
        explorer_id:        explorerId,
        family_id:          familyId,
        calendar_date:      today,
        question_format:    null,
        tries_used:         null,
        was_correct:        null,
        coins_earned:       0,
        reflection_text:    null,
        skipped_pastorally: true,
      };
      const res = await commitCompletion(sb, payload, explorerId, 0);
      // Always re-mount — whether the insert was a fresh success OR a
      // duplicate (idempotent path), the DB is now the source of truth
      // and the re-mount will render the right completed state.
      if (!res.ok && !res.duplicate) {
        console.warn('[ReadingQuest] pastoral-skip persistence failed; re-mounting anyway');
      }
      await remount();
    }

    async function handleMCAnswer(idx) {
      if (typeof idx !== 'number' || idx < 0 || idx >= question.answers.length) return;
      if (wrongIndices.has(idx)) return; // already-disabled pill clicked
      const isCorrect = (idx === question.right_answer_index);

      if (isCorrect) {
        const coins = coinsForMC(tryNum);
        const payload = {
          explorer_id:        explorerId,
          family_id:          familyId,
          calendar_date:      today,
          question_format:    'multiple_choice',
          tries_used:         tryNum,
          was_correct:        true,
          coins_earned:       coins,
          reflection_text:    null,
          skipped_pastorally: false,
        };
        const res = await commitCompletion(sb, payload, explorerId, coins);
        if (!res.ok && !res.duplicate) {
          console.warn('[ReadingQuest] MC correct persistence failed');
        }
        await remount();
        return;
      }

      // Wrong answer
      wrongIndices.add(idx);
      if (tryNum < 3) {
        tryNum += 1;
        renderMC(container, question, tryNum, wrongIndices);
        return;
      }
      // tryNum === 3 and still wrong → floor coins (3), persist, complete
      const payload = {
        explorer_id:        explorerId,
        family_id:          familyId,
        calendar_date:      today,
        question_format:    'multiple_choice',
        tries_used:         3,
        was_correct:        false,
        coins_earned:       3,
        reflection_text:    null,
        skipped_pastorally: false,
      };
      const res = await commitCompletion(sb, payload, explorerId, 3);
      if (!res.ok && !res.duplicate) {
        console.warn('[ReadingQuest] MC try-3 wrong persistence failed');
      }
      await remount();
    }

    async function handleFreeTextSave() {
      const ta = container.querySelector('[data-rq-textarea="1"]');
      if (!ta) return;
      const txt = (ta.value || '').trim();
      if (txt.length < 6) return; // button should already be disabled
      const gospelRef = getGospelReference(row);

      // Decide stored question_format:
      // - if we got here from the chips-escape path, persist 'chips'
      //   (so the completed-state echo says "You chose" — wait, no,
      //   chips-escape is a free-form reflection that started from a
      //   chips question. The user-facing semantic is "free text".
      //   But the question's original format is 'chips'. We persist
      //   the QUESTION's format so the analytics/back-fill match the
      //   source question shape. The completed-state echo currently
      //   says "You chose" for chips — but in escape mode the chosen
      //   thing is the typed text, which fits "You chose" awkwardly.
      //   Cleanest call: persist as the question's actual format
      //   ('chips') but customize the completed echo. We keep it
      //   simple: 'chips' persisted means chips question; the echo
      //   shows the user's text either way. Tracked as a UI nuance.
      const fmt = (question.format === 'chips') ? 'chips' : 'free_text';

      const payload = {
        explorer_id:        explorerId,
        family_id:          familyId,
        calendar_date:      today,
        question_format:    fmt,
        tries_used:         null,
        was_correct:        null,
        coins_earned:       5,
        reflection_text:    txt,
        skipped_pastorally: false,
      };
      const res = await commitCompletion(sb, payload, explorerId, 5);
      if (res.ok) {
        // Best-effort journal write (non-fatal)
        await writeJournalEntry(sb, explorerId, gospelRef, txt);
      } else if (!res.duplicate) {
        console.warn('[ReadingQuest] free-text persistence failed');
      }
      await remount();
    }

    async function handleChipSelect(idx, isEscape) {
      if (chipsEscapeArmed) return; // already transitioned to textarea mode
      const label = question.answers[idx];
      if (!label) return;

      if (isEscape) {
        // Transition to textarea (free_text-like) without persisting.
        // Re-render in-place; rewire below by recursing-via-remount-less
        // local render (avoids losing closure state on tryNum etc., which
        // aren't relevant here anyway).
        chipsEscapeArmed = true;
        renderFreeText(container, question, { prefilled: '' });
        // No remount — wiring is handled by the outer event delegation,
        // which sees the new data-rq-save/data-rq-textarea attrs.
        // The textarea's input handler is attached via the same
        // delegation pattern below.
        return;
      }

      // Non-escape chip — persist as chips selection, +5 coins.
      const payload = {
        explorer_id:        explorerId,
        family_id:          familyId,
        calendar_date:      today,
        question_format:    'chips',
        tries_used:         null,
        was_correct:        null,
        coins_earned:       5,
        reflection_text:    label,
        skipped_pastorally: false,
      };
      const res = await commitCompletion(sb, payload, explorerId, 5);
      if (!res.ok && !res.duplicate) {
        console.warn('[ReadingQuest] chip-select persistence failed');
      }
      await remount();
    }

    // Single delegated listener on the container. Survives the chips→
    // textarea re-render because the listener is on the container itself,
    // not on individual children.
    container.addEventListener('click', async (ev) => {
      const t = ev.target;
      if (!t || !(t instanceof Element)) return;

      if (t.matches('[data-rq-skip="1"]')) {
        await handlePastoralSkip();
        return;
      }
      if (t.matches('[data-rq-mc-idx]')) {
        const idx = parseInt(t.getAttribute('data-rq-mc-idx'), 10);
        await handleMCAnswer(idx);
        return;
      }
      if (t.matches('[data-rq-save="1"]')) {
        await handleFreeTextSave();
        return;
      }
      if (t.matches('[data-rq-chip-idx]')) {
        const idx = parseInt(t.getAttribute('data-rq-chip-idx'), 10);
        const isEscape = t.getAttribute('data-rq-chip-escape') === '1';
        await handleChipSelect(idx, isEscape);
        return;
      }
    });

    // Textarea input handler — enables Save button when text > 5 chars.
    // Delegated via 'input' bubbling so it works after chips→textarea
    // transition without re-wiring.
    container.addEventListener('input', (ev) => {
      const t = ev.target;
      if (!t || !(t instanceof Element)) return;
      if (!t.matches('[data-rq-textarea="1"]')) return;
      const btn = container.querySelector('[data-rq-save="1"]');
      if (!btn) return;
      const len = (t.value || '').trim().length;
      if (len > 5) btn.removeAttribute('disabled');
      else         btn.setAttribute('disabled', 'disabled');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN MOUNT
  // ═══════════════════════════════════════════════════════════════

  async function mount(container, options) {
    if (!container) return;
    const opts = options || {};
    const { sb, explorerId, familyId, row } = opts;
    const today = opts.today || todayKeyET();

    // Defensive: required ctx missing → render nothing
    if (!sb || !explorerId || !familyId) {
      container.innerHTML = '';
      return;
    }

    // No question for today → State A (render nothing; clear stale flag)
    const question = getQuestion(row);
    if (!question) {
      if (isFlagSet(today)) clearFlag(today);
      container.innerHTML = '';
      return;
    }

    // Closure-stable re-mount helper for handlers above.
    async function remount() {
      await mount(container, options);
    }

    // Completion row exists → State D or E
    const completion = await fetchTodayCompletion(sb, explorerId, today);
    if (completion) {
      renderCompleted(container, question, completion);
      return;
    }

    // Not completed; flag not set → State B (haven't read yet; render nothing)
    if (!isFlagSet(today)) {
      container.innerHTML = '';
      return;
    }

    // State C — active question, render per format
    const ctx = { sb, explorerId, familyId, today, row, remount };
    switch (question.format) {
      case 'multiple_choice':
        renderMC(container, question, 1, new Set());
        wireActiveQuestion(container, question, ctx);
        break;
      case 'free_text':
        renderFreeText(container, question, {});
        wireActiveQuestion(container, question, ctx);
        break;
      case 'chips':
        renderChips(container, question);
        wireActiveQuestion(container, question, ctx);
        break;
      default:
        // Unknown format — defensive, render nothing
        container.innerHTML = '';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  const ReadingQuest = {
    mount,
    commitNoQuestionCompletion,
    _internals: {
      esc,
      capSpeaker,
      todayKeyET,
      PORTRAIT,
      flagKey,
      isFlagSet,
      clearFlag,
      getQuestion,
      isChipEscapeHatch,
      getGospelReference,
      coinsForMC,
      // render helpers (exposed for unit tests)
      renderMC,
      renderFreeText,
      renderChips,
      renderCompletedMC,
      renderCompletedTextual,
      renderCompletedPastoral,
      renderCompleted,
    },
  };

  // Browser global
  if (typeof window !== 'undefined') {
    window.ReadingQuest = ReadingQuest;
  }
  // Node test export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReadingQuest;
  }
})();
