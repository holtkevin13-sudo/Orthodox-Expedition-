/**
 * Orthodox Expedition — Reading Reflect Panel
 * Chat 20-IMPL-B · May 13, 2026
 *
 * Migrates the Reading-lane Stage-2 reflect surface from missions.html
 * (the inline expand form that appeared below the Reading row when
 * state was 'read-not-reflected') onto bible-reader.html, where the
 * Gospel text is still visible while Nolan reflects.
 *
 * RETIRES the oe_bible_reader_visited_{date} localStorage flag
 * dance. The two prior commits (Stage 1 +3 on return from bible-
 * reader, Stage 2 +2 on missions textarea submit) collapse into a
 * single atomic write here. No half-done state is possible.
 *
 * Atomic commit pattern:
 *   On submit, a single INSERT into reading_completions sets
 *     read_at = now(), reflected_at = now(),
 *     reflection_text = trimmed input, coins_earned = 5
 *   profiles.coins + lifetime_coins bump by +5 in one UPDATE.
 *   Non-fatal: field_journal row (category 'reading_reflection')
 *   Non-fatal: activity_log row reason='[reading_atomic] {ref}'
 *
 *   On UNIQUE 23505 (a pre-IMPL-B half-state Stage 1 row already
 *   exists for today) the panel falls back to an UPDATE-with-guard
 *   path mirroring the legacy commitReflectCompletion, bumping +2
 *   instead of +5 so the cumulative day total still lands at +5.
 *
 * Skip path ("Just record the reading"):
 *   Delegates to window.ReadingQuest.commitReadCompletion(sb, {…, coins:3}).
 *   No reflection_text, no reflected_at, +3 coins. Per OQ-1 ruling A
 *   the lane CLOSES at +3 — re-visit renders read-only "Skipped"
 *   tile, no path to add a late reflection that day.
 *
 * Idempotent re-visit (OQ-2 ruling a):
 *   If reading_completions has a row for today, render a read-only
 *   parchment tile echoing the saved reflection (or the skipped
 *   gentle note). No submit/skip controls.
 *
 * Pilgrimage day (OQ-6):
 *   Renders a quiet "Pilgrimage rest" tile (no submit, no coins).
 *   Mirrors js/reflection-lane.js _renderPilgrimage copy.
 *
 * Mount gate (OQ-9):
 *   The host bible-reader.html only invokes this module when the
 *   initial URL carries ?source=expedition. Free Scriptures browsing
 *   never surfaces a reflect panel.
 *
 * family_id resolution (OQ-10):
 *   bible-reader.html supplies supabaseUser only. The panel SELECTs
 *   profiles.family_id WHERE id = supabaseUser.id once on mount and
 *   caches in module scope. Single round trip per page load.
 *
 * Public API:
 *   window.ReadingReflectPanel.mount(slot, ctx)
 *     slot — DOM element to render into (becomes the panel host)
 *     ctx  — { sb, explorerId, today, gospelRef }
 *     Returns: Promise<void>. Idempotent: re-mount produces the
 *     correct state from a fresh load of reading_completions.
 *
 * Op Learning #7 honored — ET date math via a self-contained
 * todayKeyET() helper (matches js/reading-quest.js pattern; no
 * WeekUtils dependency required on bible-reader.html).
 */
(function () {
  'use strict';

  // ── HTML escape ──────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── ET today key (self-contained, no WeekUtils dependency) ───────
  function todayKeyET() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year:     'numeric',
      month:    '2-digit',
      day:      '2-digit',
    }).formatToParts(new Date()).reduce((o, x) => (o[x.type] = x.value, o), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  // ── Day-of-year for prompt rotation (mirrors missions.js pattern) ─
  function dayOfYear(d) {
    d = d || new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  // ── Cached lookups (per page load) ───────────────────────────────
  let _cachedFamilyId = null;
  let _cachedPrompt   = null;
  let _cachedPilgrim  = undefined;  // undefined = unchecked; null = none; row = active

  // ── Resolve family_id for the explorer (one-shot per page) ───────
  async function resolveFamilyId(sb, explorerId) {
    if (_cachedFamilyId) return _cachedFamilyId;
    try {
      const { data, error } = await sb.from('profiles')
        .select('family_id')
        .eq('id', explorerId)
        .maybeSingle();
      if (error || !data || !data.family_id) return null;
      _cachedFamilyId = data.family_id;
      return _cachedFamilyId;
    } catch (_e) { return null; }
  }

  // ── Resolve today's prompt (mirrors missions.js DOY rotation) ────
  async function resolveTodaysPrompt(sb) {
    if (_cachedPrompt !== null) return _cachedPrompt;
    try {
      const { data, error } = await sb.from('journal_prompts')
        .select('prompt_text')
        .eq('is_active', true)
        .order('display_order');
      if (error || !data || data.length === 0) return null;
      const doy = dayOfYear();
      _cachedPrompt = data[(doy - 1 + data.length) % data.length];
      return _cachedPrompt;
    } catch (_e) { return null; }
  }

  // ── Check today's pilgrimage state (inline; no Pilgrimages module) ─
  async function isPilgrimageToday(sb, today) {
    if (_cachedPilgrim !== undefined) return _cachedPilgrim;
    try {
      const { data, error } = await sb.from('pilgrimages')
        .select('id, status, start_date, end_date')
        .lte('start_date', today)
        .gte('end_date',   today)
        .neq('status', 'cancelled')
        .limit(1);
      if (error) { _cachedPilgrim = null; return null; }
      _cachedPilgrim = (data && data.length) ? data[0] : null;
      return _cachedPilgrim;
    } catch (_e) { _cachedPilgrim = null; return null; }
  }

  // ── Load today's reading_completions row (or null) ───────────────
  async function loadTodaysRow(sb, explorerId, today) {
    try {
      const { data, error } = await sb.from('reading_completions')
        .select('id, read_at, reflected_at, coins_earned, reflection_text, skipped_pastorally')
        .eq('explorer_id', explorerId)
        .eq('calendar_date', today)
        .maybeSingle();
      if (error) return null;
      return data || null;
    } catch (_e) { return null; }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════

  // Outer shell — same parchment frame for all states.
  function renderShell(innerHtml, extraClass) {
    return `
      <section class="brp-panel ${extraClass || ''}" data-brp-root>
        <header class="brp-eyebrow">★ Today's Reflection</header>
        ${innerHtml}
      </section>
    `;
  }

  function renderPilgrimage() {
    return renderShell(`
      <div class="brp-pilgrimage">
        <div class="brp-pilgrimage-icon" aria-hidden="true">&#x2726;&#xFE0E;</div>
        <div class="brp-pilgrimage-text">Reflections rest this week. Your streak walks with you.</div>
      </div>
    `, 'brp-state-pilgrimage');
  }

  function renderPending(promptText, gospelRef) {
    const promptBlock = promptText
      ? `
        <div class="brp-prompt-block">
          <div class="brp-portrait-block">
            <img class="brp-portrait" src="/Orthodox-Expedition-/assets/characters/theo-portrait.png" alt="Theo">
            <div class="brp-portrait-speaker">Theo asks&#x2026;</div>
          </div>
          <div class="brp-prompt-text">${esc(promptText)}</div>
        </div>`
      : '';
    const refTag = gospelRef
      ? `<div class="brp-ref-tag" aria-label="Today's Gospel reference">${esc(gospelRef)}</div>`
      : '';
    return renderShell(`
      ${refTag}
      ${promptBlock}
      <div class="brp-input-block">
        <label class="brp-input-label" for="brp-textarea">Your reflection</label>
        <textarea
          id="brp-textarea"
          class="brp-textarea"
          rows="4"
          placeholder="Even a sentence is enough&#x2026;"
          aria-describedby="brp-input-help"
        ></textarea>
        <div id="brp-input-help" class="brp-input-help">+5 coins on save (the gospel reading and your reflection together).</div>
        <button type="button" class="brp-submit-btn" data-brp-action="submit" disabled>Save reflection</button>
        <button type="button" class="brp-skip-link" data-brp-action="skip-open">Maybe later</button>
      </div>
      <div class="brp-skip-modal" id="brpSkipModal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="brpSkipTitle">
        <div class="brp-skip-modal-backdrop" data-brp-action="skip-cancel"></div>
        <div class="brp-skip-modal-card">
          <div class="brp-skip-modal-title" id="brpSkipTitle">Your reflection helps your heart hear.</div>
          <div class="brp-skip-modal-sub">Skip today?</div>
          <div class="brp-skip-modal-actions">
            <button type="button" class="brp-skip-modal-primary" data-brp-action="skip-cancel">Keep reflecting</button>
            <button type="button" class="brp-skip-modal-ghost" data-brp-action="skip-confirm">Just record the reading</button>
          </div>
        </div>
      </div>
    `, 'brp-state-pending');
  }

  function renderSaved(row) {
    // Idempotent re-visit display. Two flavors:
    //   1. Full reflection (reflected_at set, reflection_text present)
    //   2. Skip-closed (read_at set, reflected_at null) — gentle note
    const isSkipClosed = !row.reflected_at && row.read_at;
    if (isSkipClosed) {
      return renderShell(`
        <div class="brp-saved">
          <div class="brp-saved-ribbon">
            <span class="brp-saved-check" aria-hidden="true">&#x2713;</span>
            <span>Today's reading recorded</span>
          </div>
          <div class="brp-saved-note">The Gospel sits with you today. Tomorrow's reflection is waiting.</div>
        </div>
      `, 'brp-state-saved brp-saved-skip');
    }
    const safeText = String(row.reflection_text || '').trim();
    return renderShell(`
      <div class="brp-saved">
        <div class="brp-saved-ribbon">
          <span class="brp-saved-check" aria-hidden="true">&#x2713;</span>
          <span>Today's reflection</span>
        </div>
        <div class="brp-saved-text">${esc(safeText)}</div>
      </div>
    `, 'brp-state-saved');
  }

  // ═══════════════════════════════════════════════════════════════
  // COMMIT PATHS
  // ═══════════════════════════════════════════════════════════════

  // Atomic happy-path commit: single INSERT, single +5 coin bump,
  // non-fatal field_journal + activity_log. Returns {ok, coinsDelta}.
  async function commitAtomicReflection(sb, ctx) {
    const { explorerId, familyId, today, gospelRef, text } = ctx;
    const nowIso = new Date().toISOString();

    // ── 1. Try the atomic INSERT (happy path) ──────────────────────
    let coinsDelta = 5;
    let path = 'insert';
    try {
      const { error } = await sb.from('reading_completions').insert({
        explorer_id:        explorerId,
        family_id:          familyId,
        calendar_date:      today,
        read_at:            nowIso,
        reflected_at:       nowIso,
        reflection_text:    text,
        coins_earned:       5,
        skipped_pastorally: false,
      });
      if (error) {
        const isDup = (error.code === '23505') ||
                      (error.message && /duplicate/i.test(error.message));
        if (!isDup) {
          console.warn('[ReadingReflectPanel] atomic INSERT error:', error);
          return { ok: false, coinsDelta: 0 };
        }
        // 23505 fallback — Stage 1 row from a pre-IMPL-B half-state
        // exists. Mirror commitReflectCompletion: UPDATE-with-guard.
        path = 'update_fallback';
        coinsDelta = 2;
        const { data: upd, error: updErr } = await sb.from('reading_completions')
          .update({
            reflected_at:    nowIso,
            reflection_text: text,
            coins_earned:    5,
          })
          .eq('explorer_id', explorerId)
          .eq('calendar_date', today)
          .is('reflected_at', null)
          .select();
        if (updErr) {
          console.warn('[ReadingReflectPanel] UPDATE fallback error:', updErr);
          return { ok: false, coinsDelta: 0 };
        }
        if (!upd || upd.length === 0) {
          // Either already-reflected (idempotent — treat as success,
          // no coin bump) or row missing entirely (defensive).
          return { ok: true, coinsDelta: 0, alreadyReflected: true };
        }
      }
    } catch (e) {
      console.warn('[ReadingReflectPanel] atomic commit threw:', e);
      return { ok: false, coinsDelta: 0 };
    }

    // ── 2. Profile coin bump ───────────────────────────────────────
    try {
      const { data: prof } = await sb.from('profiles')
        .select('coins, lifetime_coins')
        .eq('id', explorerId)
        .single();
      const cur = prof || { coins: 0, lifetime_coins: 0 };
      await sb.from('profiles').update({
        coins:          (cur.coins          || 0) + coinsDelta,
        lifetime_coins: (cur.lifetime_coins || 0) + coinsDelta,
      }).eq('id', explorerId);
    } catch (coinErr) {
      console.warn('[ReadingReflectPanel] coin bump failed (non-fatal):', coinErr);
    }

    // ── 3. field_journal — non-fatal ───────────────────────────────
    try {
      const prefix = gospelRef ? `Gospel Reflection on ${gospelRef}\n\n` : '';
      await sb.from('field_journal').insert({
        explorer_id: explorerId,
        category:    'reading_reflection',
        entry_text:  prefix + text,
        tool_type:   'pen',
        tool_color:  '#1a0f00',
        highlight:   null,
        stamps:      null,
      });
    } catch (jrnErr) {
      console.warn('[ReadingReflectPanel] field_journal write failed (non-fatal):', jrnErr);
    }

    // ── 4. activity_log breadcrumb (OQ-11 ruling A) ────────────────
    try {
      const refTag = gospelRef ? ` ${gospelRef}` : '';
      await sb.from('activity_log').insert({
        explorer_id: explorerId,
        amount:      5,
        reason:      `[reading_atomic]${refTag}`,
      });
    } catch (logErr) {
      console.warn('[ReadingReflectPanel] activity_log write failed (non-fatal):', logErr);
    }

    return { ok: true, coinsDelta, path };
  }

  // Skip path: delegate to ReadingQuest.commitReadCompletion (+3),
  // then write activity_log [reading_skip] breadcrumb.
  async function commitSkip(sb, ctx) {
    const { explorerId, familyId, today, gospelRef } = ctx;
    let ok = false;
    try {
      if (window.ReadingQuest && typeof window.ReadingQuest.commitReadCompletion === 'function') {
        const res = await window.ReadingQuest.commitReadCompletion(sb, {
          explorerId, familyId, today, coins: 3,
        });
        ok = !!(res && (res.ok || res.duplicate));
      } else {
        // Defensive fallback if ReadingQuest unavailable: direct INSERT
        const nowIso = new Date().toISOString();
        const { error } = await sb.from('reading_completions').insert({
          explorer_id:        explorerId,
          family_id:          familyId,
          calendar_date:      today,
          read_at:            nowIso,
          reflected_at:       null,
          reflection_text:    null,
          coins_earned:       3,
          skipped_pastorally: false,
        });
        const isDup = error && (error.code === '23505' ||
                                (error.message && /duplicate/i.test(error.message)));
        ok = !error || isDup;
        if (ok && !isDup) {
          const { data: prof } = await sb.from('profiles')
            .select('coins, lifetime_coins').eq('id', explorerId).single();
          const cur = prof || { coins: 0, lifetime_coins: 0 };
          await sb.from('profiles').update({
            coins:          (cur.coins          || 0) + 3,
            lifetime_coins: (cur.lifetime_coins || 0) + 3,
          }).eq('id', explorerId);
        }
      }
    } catch (e) {
      console.warn('[ReadingReflectPanel] skip commit threw:', e);
      return { ok: false };
    }

    // activity_log breadcrumb (OQ-11 ruling A)
    if (ok) {
      try {
        const refTag = gospelRef ? ` ${gospelRef}` : '';
        await sb.from('activity_log').insert({
          explorer_id: explorerId,
          amount:      3,
          reason:      `[reading_skip]${refTag}`,
        });
      } catch (logErr) {
        console.warn('[ReadingReflectPanel] activity_log skip write failed (non-fatal):', logErr);
      }
    }
    return { ok };
  }

  // ═══════════════════════════════════════════════════════════════
  // WIRE HANDLERS
  // ═══════════════════════════════════════════════════════════════

  function redirectToMissions() {
    setTimeout(() => {
      try { window.location.href = 'missions.html'; }
      catch (_e) { /* defensive */ }
    }, 1500);
  }

  function wireSubmitButton(host, ctx) {
    const ta  = host.querySelector('#brp-textarea');
    const btn = host.querySelector('[data-brp-action="submit"]');
    if (!ta || !btn) return;
    function refreshEnabled() {
      const v = String(ta.value || '').trim();
      btn.disabled = (v.length === 0);
    }
    ta.addEventListener('input', refreshEnabled);
    refreshEnabled();
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      const text = String(ta.value || '').trim();
      if (!text) return;
      btn.disabled = true;
      btn.textContent = 'Saving\u2026';
      const res = await commitAtomicReflection(ctx.sb, {
        explorerId: ctx.explorerId,
        familyId:   ctx.familyId,
        today:      ctx.today,
        gospelRef:  ctx.gospelRef,
        text,
      });
      if (res && res.ok) {
        // Soft saved-state nudge while the 1.5s hold elapses.
        ta.disabled = true;
        btn.textContent = 'Saved \u2713';
        redirectToMissions();
        return;
      }
      // Soft error — re-enable + surface inline message.
      btn.disabled = false;
      btn.textContent = 'Save reflection';
      let errEl = host.querySelector('.brp-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'brp-error';
        errEl.setAttribute('role', 'alert');
        btn.parentNode.insertBefore(errEl, btn.nextSibling);
      }
      errEl.textContent = 'Saving failed \u2014 please try again.';
    });
  }

  function wireSkipFlow(host, ctx) {
    const openBtn   = host.querySelector('[data-brp-action="skip-open"]');
    const modal     = host.querySelector('#brpSkipModal');
    const cancelEls = host.querySelectorAll('[data-brp-action="skip-cancel"]');
    const confirm   = host.querySelector('[data-brp-action="skip-confirm"]');
    if (!openBtn || !modal || !confirm) return;

    function openModal() {
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('is-open');
    }
    function closeModal() {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('is-open');
      const ta = host.querySelector('#brp-textarea');
      if (ta) ta.focus();
    }

    openBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    cancelEls.forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
    });
    confirm.addEventListener('click', async (e) => {
      e.preventDefault();
      confirm.disabled = true;
      confirm.textContent = 'Recording\u2026';
      const res = await commitSkip(ctx.sb, {
        explorerId: ctx.explorerId,
        familyId:   ctx.familyId,
        today:      ctx.today,
        gospelRef:  ctx.gospelRef,
      });
      if (res && res.ok) {
        confirm.textContent = 'Recorded \u2713';
        redirectToMissions();
        return;
      }
      confirm.disabled = false;
      confirm.textContent = 'Just record the reading';
      // No inline error UI in the modal — the user can dismiss and retry.
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC: mount
  // ═══════════════════════════════════════════════════════════════

  async function mount(slot, ctx) {
    if (!slot) return;
    ctx = ctx || {};
    const sb         = ctx.sb;
    const explorerId = ctx.explorerId;
    const today      = ctx.today || todayKeyET();
    const gospelRef  = ctx.gospelRef || null;

    if (!sb || !explorerId) {
      slot.innerHTML = '';
      return;
    }

    // 1. Pilgrimage gate.
    const pilgrim = await isPilgrimageToday(sb, today);
    if (pilgrim) {
      slot.innerHTML = renderPilgrimage();
      return;
    }

    // 2. Existing row gate (any row → idempotent read-only display).
    //    Per OQ-1 ruling A + OQ-2 ruling a: full reflection or skip-
    //    closed row both render in read-only state.
    const existingRow = await loadTodaysRow(sb, explorerId, today);
    if (existingRow) {
      slot.innerHTML = renderSaved(existingRow);
      return;
    }

    // 3. Pending state — need family_id and today's prompt.
    const familyId = await resolveFamilyId(sb, explorerId);
    if (!familyId) {
      // Defensive: without family_id we cannot INSERT. Render nothing
      // rather than a broken panel; this is an account-config edge case.
      slot.innerHTML = '';
      return;
    }
    const promptRow = await resolveTodaysPrompt(sb);
    const promptText = promptRow ? promptRow.prompt_text : '';

    slot.innerHTML = renderPending(promptText, gospelRef);
    wireSubmitButton(slot, {
      sb, explorerId, familyId, today, gospelRef,
    });
    wireSkipFlow(slot, {
      sb, explorerId, familyId, today, gospelRef,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  const ReadingReflectPanel = {
    mount,
    _internals: {
      esc, todayKeyET, dayOfYear,
      resolveFamilyId, resolveTodaysPrompt, isPilgrimageToday,
      loadTodaysRow, commitAtomicReflection, commitSkip,
      renderShell, renderPilgrimage, renderPending, renderSaved,
    },
  };

  if (typeof window !== 'undefined') {
    window.ReadingReflectPanel = ReadingReflectPanel;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReadingReflectPanel;
  }
})();
