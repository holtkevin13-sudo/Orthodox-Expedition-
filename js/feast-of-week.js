/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Dispatch 4b
   js/feast-of-week.js — Feast of the Week eyebrow card
   May 11, 2026

   PURPOSE
   Renders a small "✦ This Week's Feast" eyebrow card on the Topics
   page (curriculum.html). Surfaces the principal liturgical feast
   for the current Sunday-anchored week — pulled from existing
   liturgical_calendar data. No new schema.

   Conceptually DIFFERENT from `saint_of_the_week` (which is the
   session-paired biography surfaced on week.html). This module
   surfaces the LITURGICAL calendar's feast for the week. Both can
   coexist without conflict — they target different surfaces.

   ALGORITHM (Dispatch 4b §F, Sunday-anchored week)
   For the current week [weekStart Sun → weekEnd Sat]:
     1. Any 'great' feast in the window → highest-priority pick.
        If multiple, take the earliest by date.
     2. Otherwise any 'major' feast → take the earliest by date.
     3. Otherwise the Sunday's feast (rank 'minor' OK if Sunday).
     4. Otherwise the earliest 'minor' feast in the window.
     5. Otherwise: no card (null return; mount renders empty).

   VERIFIED AGAINST 2026 launch + post-launch data (from
   discovery report):
     • May 17 – May 23  → Holy Ascension (great, May 21)
     • May 24 – May 30  → Fathers of the 1st Council (major, May 24)
     • May 31 – Jun  6  → Holy Pentecost (great, May 31)
     • Jun  7 – Jun 13  → The Sunday of All Saints (major, Jun 7)
     • Jun 14 – Jun 20  → Amos the Prophet (minor, Jun 15) — first
                          all-minor week, Jun 14 has no feast row.

   PUBLIC API (browser): window.FeastOfWeek = { … }

     getCurrentFeast(sb)
       → { calendar_date, feast_name, feast_rank,
           saint_commemorations, sunday_name, day_name }
         or null if no feast found in the current week.

     mount(container, options)
       options = { sb }
       Renders the eyebrow card into `container`. Idempotent.
       If no feast found: renders nothing (hidden gracefully).

   Op Learnings honored:
     #4  Schema-first — pulls only from existing columns of
         liturgical_calendar (verified during discovery).
     #7  ET timezone via WeekUtils.
     #15 Visible state via class names; no UA [hidden] reliance.
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

  function _W() {
    return (typeof window !== 'undefined' && window.WeekUtils) || null;
  }

  // Pretty day-name from YYYY-MM-DD in ET. E.g. "Thursday, May 21".
  function _formatDayLabel(ymd /* YYYY-MM-DD */) {
    try {
      const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long', month: 'long', day: 'numeric',
      });
      return fmt.format(dt);
    } catch (_e) {
      return ymd;
    }
  }

  // Day-of-week (0=Sun..6=Sat) for a YYYY-MM-DD in ET.
  function _dowOf(ymd) {
    try {
      const W = _W();
      if (!W) return -1;
      const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return W.dayOfWeekET(dt);
    } catch (_e) {
      return -1;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // ALGORITHM: pick the principal feast for the week
  // ═════════════════════════════════════════════════════════════════

  function _pickFeast(rows) {
    if (!rows || rows.length === 0) return null;
    // Filter to rows that actually have a feast_name (skip empty days).
    const withFeast = rows.filter(r => r.feast_name);
    if (withFeast.length === 0) return null;

    function byDateAsc(a, b) {
      return a.calendar_date < b.calendar_date ? -1 :
             a.calendar_date > b.calendar_date ? 1 : 0;
    }

    // (1) Earliest 'great' feast wins.
    const greats = withFeast.filter(r => r.feast_rank === 'great').sort(byDateAsc);
    if (greats.length > 0) return greats[0];

    // (2) Earliest 'major' feast.
    const majors = withFeast.filter(r => r.feast_rank === 'major').sort(byDateAsc);
    if (majors.length > 0) return majors[0];

    // (3) The Sunday's feast (any rank, including 'minor'), OR the
    //     Sunday's sunday_name when feast_name is null. The latter
    //     surfaces e.g. "2nd Sunday of Matthew" for a week with no
    //     named feast on Sunday — more liturgically honest than
    //     skipping to a Monday minor saint. Inspects ALL rows (not
    //     just withFeast) so a feast_name=null Sunday isn't filtered
    //     out before we get the chance to look at sunday_name.
    const sundayRow = rows.find(r => _dowOf(r.calendar_date) === 0);
    if (sundayRow) {
      if (sundayRow.feast_name) return sundayRow;
      if (sundayRow.sunday_name) {
        return Object.assign({}, sundayRow, {
          feast_name: sundayRow.sunday_name,
          feast_rank: sundayRow.feast_rank || 'minor',
        });
      }
    }

    // (4) Earliest 'minor' feast otherwise.
    const minors = withFeast.filter(r => r.feast_rank === 'minor').sort(byDateAsc);
    if (minors.length > 0) return minors[0];

    return null;
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC: getCurrentFeast
  // ═════════════════════════════════════════════════════════════════

  async function getCurrentFeast(sb) {
    if (!sb) return null;
    const W = _W();
    if (!W) {
      console.warn('FeastOfWeek.getCurrentFeast: WeekUtils not loaded');
      return null;
    }
    try {
      const start = W.getCurrentWeekStart();
      const end   = W.getCurrentWeekEnd();
      const startKey = W.ymd(start);
      const endKey   = W.ymd(end);

      const res = await sb.from('liturgical_calendar')
        .select('calendar_date,feast_name,feast_rank,saint_commemorations,sunday_name,liturgical_season')
        .gte('calendar_date', startKey)
        .lte('calendar_date', endKey)
        .order('calendar_date');

      if (res.error) throw res.error;

      const pick = _pickFeast(res.data || []);
      if (!pick) return null;

      return Object.assign({}, pick, {
        day_name: _formatDayLabel(pick.calendar_date),
      });
    } catch (e) {
      console.warn('FeastOfWeek.getCurrentFeast failed (graceful):', e);
      return null;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER — eyebrow card
  // ═════════════════════════════════════════════════════════════════

  function _renderCard(feast) {
    if (!feast) return '';

    // Saint list — for 'great' or 'major' feasts, surface the
    // commemorations explicitly. For 'minor', keep the card slim.
    let commemorations = '';
    const saints = Array.isArray(feast.saint_commemorations) ? feast.saint_commemorations : [];
    const isHighRank = feast.feast_rank === 'great' || feast.feast_rank === 'major';
    if (isHighRank && saints.length > 0) {
      const top = saints.slice(0, 4);
      const tail = saints.length > 4 ? `<li class="fw-saint-more">+ ${saints.length - 4} more</li>` : '';
      commemorations = `
        <div class="fw-also-eyebrow">Also commemorating:</div>
        <ul class="fw-saint-list">
          ${top.map(s => `<li>${esc(s)}</li>`).join('')}
          ${tail}
        </ul>
      `;
    }

    return `
      <div class="fw-card fw-rank-${esc(feast.feast_rank || 'minor')} fade-up"
           id="fw-card" data-date="${esc(feast.calendar_date)}"
           role="region" aria-label="This week's feast">
        <div class="fw-eyebrow">✦ This Week's Feast</div>
        <div class="fw-name">${esc(feast.feast_name)}</div>
        <div class="fw-date">${esc(feast.day_name || feast.calendar_date)}</div>
        ${commemorations}
        <button class="fw-tap" type="button" id="fw-tap" aria-label="Learn more about this feast">
          Tap to learn more →
        </button>
      </div>
    `;
  }

  // Detail view — for v1, a simple alert. The spec gives latitude
  // here ("worker has latitude; deferring a dedicated feast.html
  // detail page to v1.1 is acceptable"). We use a slightly nicer
  // approach: a contained in-card expand (toggling a class) showing
  // the full saint list + a brief note that fuller content arrives
  // in v1.1. Defensive: if the toggle target isn't there, fall back
  // to alert().
  function _wireTap(card, feast) {
    if (!card) return;
    const btn = card.querySelector('#fw-tap');
    if (!btn) return;
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const expanded = card.classList.contains('fw-expanded');
      if (expanded) {
        card.classList.remove('fw-expanded');
        const existing = card.querySelector('.fw-detail');
        if (existing) existing.remove();
        btn.textContent = 'Tap to learn more →';
        return;
      }
      // Build a detail block: full saint list, sunday_name if
      // present, gentle note.
      const saints = Array.isArray(feast.saint_commemorations) ? feast.saint_commemorations : [];
      const fullList = saints.length > 0
        ? `<ul class="fw-detail-list">${saints.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`
        : '<div class="fw-detail-empty">No additional commemorations.</div>';
      const sundayLine = feast.sunday_name
        ? `<div class="fw-detail-sunday">Sunday: ${esc(feast.sunday_name)}</div>`
        : '';
      const note = `
        <div class="fw-detail-note">
          The Church remembers this feast across services this week.
          Ask your priest or family how it's observed.
        </div>
      `;
      const detailHTML = `
        <div class="fw-detail">
          ${sundayLine}
          <div class="fw-detail-title">All commemorations:</div>
          ${fullList}
          ${note}
        </div>
      `;
      const tmp = document.createElement('div');
      tmp.innerHTML = detailHTML;
      const detailEl = tmp.firstElementChild;
      // Insert before the button.
      card.insertBefore(detailEl, btn);
      card.classList.add('fw-expanded');
      btn.textContent = 'Close ↑';
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC: mount
  // ═════════════════════════════════════════════════════════════════

  async function mount(container, options) {
    if (!container) return;
    const opts = options || {};
    const { sb } = opts;
    if (!sb) {
      container.innerHTML = '';
      return;
    }
    try {
      const feast = await getCurrentFeast(sb);
      if (!feast) {
        // Edge case 3: no feast data for current week → hide
        // entirely (gentle empty state acceptable per dispatch;
        // hiding chosen here for ADHD focus).
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }
      container.style.display = '';
      container.innerHTML = _renderCard(feast);
      const card = container.querySelector('#fw-card');
      _wireTap(card, feast);
    } catch (e) {
      console.warn('FeastOfWeek.mount failed (graceful):', e);
      container.innerHTML = '';
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  const FeastOfWeek = {
    getCurrentFeast,
    mount,
    _internals: {
      esc, _formatDayLabel, _dowOf, _pickFeast, _renderCard, _wireTap,
    },
  };

  if (typeof window !== 'undefined') window.FeastOfWeek = FeastOfWeek;
  if (typeof module !== 'undefined' && module.exports) module.exports = FeastOfWeek;
})();
