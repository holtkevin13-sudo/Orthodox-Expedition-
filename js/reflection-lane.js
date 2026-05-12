/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Chat 2A
   js/reflection-lane.js — T/Th in-line reflection lane
   May 11, 2026

   PURPOSE
   Renders the Tuesday/Thursday reflection lane IN-LINE on the
   Missions surface. Mirrors the architectural pattern of
   ReadingQuest.mount(): the module owns its data fetch + render
   + submit + write + coin award. Missions.js orchestrates the
   slot; this module executes inside it.

   DAY-OF-WEEK GATE
   Active only on Tuesday and Thursday (ET). Saturday/Sunday and
   M/W/F mount-callers should not invoke this module (those days
   have no reflection lane — Sat/Sun = 4/4 denominator per Q7;
   M/W/F's slot-4 is the catechesis session, not reflection).
   This module self-protects: if dayKind is not 'tue'|'thu', the
   render returns an empty string.

   STATES
   1. pilgrimage         — pilgrimage rest copy (gentle, no coins)
   2. complete           — saved entry preview (after submit)
   3. empty-state-pre-2B — no session_reflection_prompts row exists
                           for the current session + day_kind →
                           parchment placeholder + "Mark reflected"
                           skip button (writes sentinel field_journal
                           row, awards +0)
   4. pending            — prompt + textarea + submit button

   DATA WRITES
   Submit       → field_journal: category='session_reflection',
                  entry_text='<prompt>\n\n<text>',
                  + profiles.coins += 5 (orchestrator-locked)
   Skip pre-2B  → field_journal: category='session_reflection',
                  entry_text='[skipped — prompts pending]',
                  + 0 coins (sentinel survives device switch +
                  visible to parent admin review per Q5 ruling)

   IDEMPOTENCY
   Same-day re-mount: if a field_journal row with category=
   'session_reflection' exists for today's ET window, the lane
   renders the complete state. No double-write, no double-coin.

   PUBLIC API (browser): window.ReflectionLane = { … }

     mount(container, options)
       options = { sb, explorerId, familyId, today, dayKind,
                   sessionId, sessionTitle, isPilgrimage, onComplete }
       - dayKind: 'tue' | 'thu' (caller's responsibility; render is
         no-op for other values)
       - sessionId: current session ID (e.g. '00.1'); used to fetch
         the matching prompt row
       - sessionTitle: optional display label
       - onComplete: optional callback invoked after a successful
         submit/skip so missions.js can refresh the day-progress
         + Day Complete lane

     getStateForToday(sb, explorerId, today)
       → 'complete' | 'pending'
       Pure read; used by missions.js loadTodaysState to compute
       the lane's contribution to the daily denominator without
       fully mounting.

   Op Learnings honored:
     #4  Schema-first — session_reflection_prompts + field_journal
         shapes verified via information_schema before this
         module was written
     #7  ET timezone via WeekUtils + Intl.DateTimeFormat
     #13 Staged delivery — module self-contained, no cross-file edits
     #15 CSS rules over UA [hidden]: visible state via class names
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ═════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═════════════════════════════════════════════════════════════════

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ET-bounded day window for "did Nolan reflect today?" checks.
  // Mirrors missions.js _loadJournaledToday pattern (UTC-04:00 is
  // ET offset for the launch window May–Aug 2026 in EDT). For a
  // post-DST-fallback world, WeekUtils handles offsets — but we
  // duplicate the literal here to keep this module independent.
  function _etDayBounds(todayKey) {
    const [y, m, d] = todayKey.split('-').map(n => parseInt(n, 10));
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${y}-${pad(m)}-${pad(d)}T00:00:00-04:00`;
    const endStr   = `${y}-${pad(m)}-${pad(d)}T23:59:59-04:00`;
    return { startStr, endStr };
  }

  // Detect whether a same-day session_reflection field_journal row
  // already exists for this explorer. Returns the entry row if so,
  // null otherwise. Includes the sentinel '[skipped...]' rows.
  async function _loadTodaysReflection(sb, explorerId, todayKey) {
    try {
      const { startStr, endStr } = _etDayBounds(todayKey);
      const res = await sb.from('field_journal')
        .select('id, entry_text, created_at')
        .eq('explorer_id', explorerId)
        .eq('category', 'session_reflection')
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .order('created_at', { ascending: false })
        .limit(1);
      if (res.error) {
        console.warn('[ReflectionLane] _loadTodaysReflection error (graceful):', res.error);
        return null;
      }
      return (res.data && res.data.length > 0) ? res.data[0] : null;
    } catch (e) {
      console.warn('[ReflectionLane] _loadTodaysReflection threw (graceful):', e);
      return null;
    }
  }

  // Fetch the prompt row for the given session + day_kind. Returns
  // the first active row by display_order, or null when no row
  // exists (the empty-state pre-2B condition).
  async function _loadPromptForSlot(sb, sessionId, dayKind) {
    if (!sb || !sessionId || (dayKind !== 'tue' && dayKind !== 'thu')) {
      return null;
    }
    try {
      const res = await sb.from('session_reflection_prompts')
        .select('id, prompt_text, display_order')
        .eq('session_id', sessionId)
        .eq('day_kind', dayKind)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1);
      if (res.error) {
        console.warn('[ReflectionLane] _loadPromptForSlot error (graceful):', res.error);
        return null;
      }
      return (res.data && res.data.length > 0) ? res.data[0] : null;
    } catch (e) {
      console.warn('[ReflectionLane] _loadPromptForSlot threw (graceful):', e);
      return null;
    }
  }

  // Sentinel text emitted by the empty-state skip path. Detected by
  // _isSentinelEntry so the saved-state render shows the right copy.
  const SKIP_SENTINEL_TEXT = '[skipped — prompts pending]';
  function _isSentinelEntry(row) {
    return !!(row && row.entry_text === SKIP_SENTINEL_TEXT);
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC: getStateForToday — used by missions.js loadTodaysState
  // ═════════════════════════════════════════════════════════════════

  // Pure read; returns 'complete' if any session_reflection row
  // (including the skip sentinel) exists for today, else 'pending'.
  async function getStateForToday(sb, explorerId, today) {
    if (!sb || !explorerId || !today) return 'pending';
    const row = await _loadTodaysReflection(sb, explorerId, today);
    return row ? 'complete' : 'pending';
  }

  // ═════════════════════════════════════════════════════════════════
  // COMMIT — submit (+5 coins) and skip-sentinel (+0)
  // ═════════════════════════════════════════════════════════════════

  // Write the reflection + award coins. Returns { ok, alreadySaved,
  // coinsAwarded, entryText }. The "alreadySaved" path fires when a
  // same-day row already exists — defensive against double-submit.
  async function _saveReflection(sb, opts) {
    const explorerId = opts.explorerId;
    const today      = opts.today;
    const promptText = String(opts.promptText || '').trim();
    const text       = String(opts.text || '').trim();
    if (!sb || !explorerId || !today || !text) {
      return { ok: false, alreadySaved: false, coinsAwarded: false, entryText: '' };
    }
    // Idempotent guard.
    const existing = await _loadTodaysReflection(sb, explorerId, today);
    if (existing) {
      return { ok: true, alreadySaved: true, coinsAwarded: false, entryText: existing.entry_text };
    }
    const entryText = promptText ? `${promptText}\n\n${text}` : text;
    try {
      const insertRes = await sb.from('field_journal').insert({
        explorer_id: explorerId,
        category:    'session_reflection',
        entry_text:  entryText,
        tool_type:   'pen',
        tool_color:  '#1a0f00',
        highlight:   null,
        stamps:      null,
      });
      if (insertRes.error) {
        console.warn('[ReflectionLane] save insert error:', insertRes.error);
        return { ok: false, alreadySaved: false, coinsAwarded: false, entryText: '' };
      }
    } catch (e) {
      console.warn('[ReflectionLane] save threw:', e);
      return { ok: false, alreadySaved: false, coinsAwarded: false, entryText: '' };
    }
    // Award +5 coins via the canonical read-then-write pattern.
    let coinsAwarded = false;
    try {
      const profRes = await sb.from('profiles')
        .select('coins, lifetime_coins')
        .eq('id', explorerId)
        .single();
      const prof = profRes.data || { coins: 0, lifetime_coins: 0 };
      const upd = await sb.from('profiles').update({
        coins:          (prof.coins          || 0) + 5,
        lifetime_coins: (prof.lifetime_coins || 0) + 5,
      }).eq('id', explorerId);
      if (!upd.error) coinsAwarded = true;
    } catch (e) {
      console.warn('[ReflectionLane] coin award failed (non-fatal):', e);
    }
    return { ok: true, alreadySaved: false, coinsAwarded, entryText };
  }

  // Sentinel skip path. Writes the canonical SKIP_SENTINEL_TEXT row,
  // awards 0 coins, and survives device switches so parent review
  // sees the day was "marked" even without a real entry. Used only
  // when no session_reflection_prompts row exists for the current
  // session+day_kind (Chat 2B not yet seeded).
  async function _saveSkipSentinel(sb, opts) {
    const explorerId = opts.explorerId;
    const today      = opts.today;
    if (!sb || !explorerId || !today) {
      return { ok: false, alreadySaved: false };
    }
    const existing = await _loadTodaysReflection(sb, explorerId, today);
    if (existing) {
      return { ok: true, alreadySaved: true };
    }
    try {
      const insertRes = await sb.from('field_journal').insert({
        explorer_id: explorerId,
        category:    'session_reflection',
        entry_text:  SKIP_SENTINEL_TEXT,
        tool_type:   'pen',
        tool_color:  '#1a0f00',
        highlight:   null,
        stamps:      null,
      });
      if (insertRes.error) {
        console.warn('[ReflectionLane] sentinel insert error:', insertRes.error);
        return { ok: false, alreadySaved: false };
      }
    } catch (e) {
      console.warn('[ReflectionLane] sentinel threw:', e);
      return { ok: false, alreadySaved: false };
    }
    return { ok: true, alreadySaved: false };
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER — state fragments
  // ═════════════════════════════════════════════════════════════════

  function _renderShell(innerHtml, stateClass) {
    return `
      <div class="rl-card ${stateClass || ''}" data-rl-root>
        <div class="rl-card-eyebrow">★ Today's Reflection</div>
        ${innerHtml}
      </div>
    `;
  }

  function _renderPilgrimage() {
    return _renderShell(`
      <div class="rl-pilgrimage">
        <div class="rl-pilgrimage-icon">✦</div>
        <div class="rl-pilgrimage-text">Reflections rest this week. Your streak walks with you.</div>
      </div>
    `, 'rl-state-pilgrimage');
  }

  function _renderEmptyStatePreSeeding(sessionTitle) {
    const titlePart = sessionTitle ? ` for ${esc(sessionTitle)}` : '';
    return _renderShell(`
      <div class="rl-empty">
        <div class="rl-empty-icon" aria-hidden="true">✦</div>
        <div class="rl-empty-title">Reflection prompt arriving soon</div>
        <div class="rl-empty-body">
          A reflection prompt${titlePart} will be here when Topic 00 fully launches.
          For today, you can mark this lane reflected and move on.
        </div>
        <button type="button" class="rl-skip-btn" data-rl-action="skip">Mark reflected</button>
      </div>
    `, 'rl-state-empty');
  }

  function _renderPending(promptText) {
    return _renderShell(`
      <div class="rl-prompt-block">
        <div class="rl-prompt-eyebrow">Today's Question</div>
        <div class="rl-prompt-text">${esc(promptText)}</div>
      </div>
      <div class="rl-input-block">
        <label class="rl-input-label" for="rl-textarea">Your reflection</label>
        <textarea
          id="rl-textarea"
          class="rl-textarea"
          rows="4"
          placeholder="Write a sentence or two…"
          aria-describedby="rl-input-help"
        ></textarea>
        <div id="rl-input-help" class="rl-input-help">Even one sentence counts. +5 coins on submit.</div>
        <button type="button" class="rl-submit-btn" data-rl-action="submit" disabled>Save reflection</button>
      </div>
    `, 'rl-state-pending');
  }

  function _renderComplete(entryRow) {
    const isSentinel = _isSentinelEntry(entryRow);
    const previewText = isSentinel
      ? 'Reflected today.'
      : (() => {
          const t = String((entryRow && entryRow.entry_text) || '');
          const split = t.indexOf('\n\n');
          return split >= 0 ? t.slice(split + 2) : t;
        })();
    return _renderShell(`
      <div class="rl-saved">
        <div class="rl-saved-eyebrow">${isSentinel ? 'Marked reflected' : 'Saved today'}</div>
        <div class="rl-saved-text">${esc(previewText)}</div>
      </div>
    `, 'rl-state-complete');
  }

  // ═════════════════════════════════════════════════════════════════
  // MAIN MOUNT
  // ═════════════════════════════════════════════════════════════════

  async function mount(container, options) {
    if (!container) return;
    const opts = options || {};
    const { sb, explorerId, familyId, today, dayKind, sessionId, sessionTitle, isPilgrimage, onComplete } = opts;

    // Self-protective gate: only Tue/Thu have this lane.
    if (dayKind !== 'tue' && dayKind !== 'thu') {
      container.innerHTML = '';
      return;
    }
    if (!sb || !explorerId || !familyId || !today) {
      container.innerHTML = '';
      return;
    }

    // Pilgrimage rest copy short-circuits everything.
    if (isPilgrimage) {
      container.innerHTML = _renderPilgrimage();
      return;
    }

    // Existing-entry check + prompt lookup in parallel.
    const [existingEntry, promptRow] = await Promise.all([
      _loadTodaysReflection(sb, explorerId, today),
      _loadPromptForSlot(sb, sessionId, dayKind),
    ]);

    if (existingEntry) {
      container.innerHTML = _renderComplete(existingEntry);
      return;
    }

    // No prompt seeded yet → empty-state with skip path.
    if (!promptRow || !promptRow.prompt_text) {
      container.innerHTML = _renderEmptyStatePreSeeding(sessionTitle);
      _wireSkipButton(container, { sb, explorerId, familyId, today, onComplete });
      return;
    }

    // Normal pending → prompt + textarea + submit.
    container.innerHTML = _renderPending(promptRow.prompt_text);
    _wireSubmitButton(container, {
      sb, explorerId, familyId, today,
      promptText: promptRow.prompt_text,
      onComplete,
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // INTERACTION WIRING
  // ═════════════════════════════════════════════════════════════════

  function _wireSubmitButton(container, ctx) {
    const ta  = container.querySelector('#rl-textarea');
    const btn = container.querySelector('[data-rl-action="submit"]');
    if (!ta || !btn) return;

    // Enable submit only when the textarea has at least 1 non-whitespace char.
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
      btn.textContent = 'Saving…';
      const res = await _saveReflection(ctx.sb, {
        explorerId: ctx.explorerId,
        today:      ctx.today,
        promptText: ctx.promptText,
        text,
      });
      if (!res.ok) {
        btn.disabled = false;
        btn.textContent = 'Save reflection';
        // Inline soft error — keep the user's text.
        let errEl = container.querySelector('.rl-error');
        if (!errEl) {
          errEl = document.createElement('div');
          errEl.className = 'rl-error';
          errEl.setAttribute('role', 'alert');
          btn.parentNode.insertBefore(errEl, btn.nextSibling);
        }
        errEl.textContent = 'Saving failed — please try again.';
        return;
      }
      // Success: re-render the complete state, then notify parent.
      container.innerHTML = _renderComplete({ entry_text: res.entryText || text });
      if (typeof ctx.onComplete === 'function') {
        try { ctx.onComplete(); } catch (_e) { /* defensive */ }
      }
    });
  }

  function _wireSkipButton(container, ctx) {
    const btn = container.querySelector('[data-rl-action="skip"]');
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Marking…';
      const res = await _saveSkipSentinel(ctx.sb, {
        explorerId: ctx.explorerId,
        today:      ctx.today,
      });
      if (!res.ok) {
        btn.disabled = false;
        btn.textContent = 'Mark reflected';
        return;
      }
      // Render the complete state with the sentinel preview.
      container.innerHTML = _renderComplete({ entry_text: SKIP_SENTINEL_TEXT });
      if (typeof ctx.onComplete === 'function') {
        try { ctx.onComplete(); } catch (_e) { /* defensive */ }
      }
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  const ReflectionLane = {
    mount,
    getStateForToday,
    _internals: {
      esc,
      _etDayBounds,
      _loadTodaysReflection,
      _loadPromptForSlot,
      _isSentinelEntry,
      SKIP_SENTINEL_TEXT,
      _renderShell,
      _renderPilgrimage,
      _renderEmptyStatePreSeeding,
      _renderPending,
      _renderComplete,
    },
  };

  if (typeof window !== 'undefined') window.ReflectionLane = ReflectionLane;
  if (typeof module !== 'undefined' && module.exports) module.exports = ReflectionLane;
})();
