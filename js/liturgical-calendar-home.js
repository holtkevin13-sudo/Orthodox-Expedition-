/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Chat 3
   js/liturgical-calendar-home.js — "This Week in the Church"
   May 11, 2026

   PURPOSE
   A 7-day at-a-glance mini-calendar on home.html, surfacing the
   liturgical week. Each day-cell shows ONE primary signal (feast,
   saint, fast indicator, or gospel reference) in priority order.
   Tap any day → full-viewport drawer with the day's complete
   liturgical detail: feast, season, fast status, all commemorated
   saints, scripture references, and notes.

   PLACEMENT
   Sits BELOW the Family Devotional Thread card (Chat 5) and ABOVE
   the Today's Progress dashboard (Dispatch 4b) on home.html. A
   quiet contextual layer — status, not action.

   DATA SOURCE
   Read-only from `liturgical_calendar` (existing table; no new
   schema). Verified columns:
     calendar_date            date  NOT NULL
     liturgical_season        text
     feast_name               text
     feast_rank               text  ('great'|'major'|'minor')
     fast_status              text  (5-value bounded enum, verified)
     sunday_name              text  (populated only on Sundays)
     saint_commemorations     text[]
     notes                    text
     daily_readings           jsonb (gospel/epistle/matins_gospel)

   DAY-CELL SIGNAL HIERARCHY (one atom per compact cell)
   Approved by orchestrator (Chat 3 discovery — corpus-refined from
   the dispatch's draft once it was clear feast_name carries the
   day's headline saint on minor-rank days):
     1. sunday_name populated         → show sunday_name
     2. feast_rank IN ('great','major') → show feast_name
     3. fast_status active AND minor-rank → fast glyph + feast_name
     4. feast_rank='minor' with feast_name → show feast_name
     5. Fallback                       → daily_readings.gospel.reference

   VISUAL VOCABULARY
     • Today-cell:   2px gold border + gold-tinted bg
     • Sunday-cell:  subtle gold gradient bg (today subsumes)
     • Major feast:  ☩ glyph top-right + gold top border
     • Fast day:     ◐ glyph top-right + muted-purple tint
     • Compact:      day-letter + date-number + line-clamp:2 atom

   ARCHITECTURE LOCKS HONORED
     #1 Sunday-anchored week (Sun → Sat) via WeekUtils
     #7 All date math via Intl.DateTimeFormat America/New_York
        through window.WeekUtils — NEVER raw Date methods
    #15 IA: this surface is HOME=status, not action

   OP LEARNINGS HONORED
     #4  Schema-first — information_schema verified pre-write
     #5  Liturgical premise content verified against actual
         corpus (caught dispatch's 'fast_kind' → real
         'fast_status'; humanization built from DISTINCT values
         actually present in 1094-row corpus)
    #15  CSS class names beat UA [hidden]; injectCSS authors rules
    #16  Data shape match — single-row-per-day with array+jsonb
         columns; drawer renders defensively against any null
         optional field

   PUBLIC API (browser): window.LiturgicalCalendarHome = { … }

     mount(container, options)
       options = { sb }
       Renders eyebrow + 7-day grid into container. Idempotent.
       Wires tap-handlers for the drawer. Graceful on data error
       (container emptied; warn logged).
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ═════════════════════════════════════════════════════════════════
  // CONSTANTS — humanization maps built from DISTINCT actual values
  // in liturgical_calendar (1094 rows, verified during Chat 3
  // discovery). Bounded enum; no unknown values present.
  // ═════════════════════════════════════════════════════════════════

  const FAST_LABELS = {
    no_fast:        'No fast',
    strict:         'Strict fast',
    fish_allowed:   'Fish, wine & oil allowed',
    wine_oil:       'Wine & oil allowed',
    dairy_allowed:  'Dairy, fish, wine & oil allowed',
  };

  const RANK_LABELS = {
    great: 'Great Feast',
    major: 'Major Feast',
    minor: 'Commemoration',
  };

  const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

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

  // 'YYYY-MM-DD' → "May 21" (no year, ET-stable). UTC-noon anchor
  // avoids cross-timezone date drift, matching feast-of-week.js.
  function _shortDate(ymd) {
    try {
      const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day:   'numeric',
      }).format(dt);
    } catch (_e) {
      return ymd;
    }
  }

  // 'YYYY-MM-DD' → "Thursday, May 21"
  function _longDate(ymd) {
    try {
      const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long',
        month:   'long',
        day:     'numeric',
      }).format(dt);
    } catch (_e) {
      return ymd;
    }
  }

  function _dayLetter(i) { return DAY_LETTERS[i % 7]; }
  function _dayName(i)   { return DAY_NAMES[i % 7]; }

  function _isFastActive(fast_status) {
    return !!fast_status && fast_status !== 'no_fast';
  }

  function _isMajorFeast(feast_rank) {
    return feast_rank === 'great' || feast_rank === 'major';
  }

  // ── SIGNAL HIERARCHY — orchestrator-approved (Chat 3 Q2) ─────────
  // Returns { kind, text } describing the single primary atom to
  // display in the compact cell. If row is null (missing data for
  // that day), returns a placeholder.
  function _cellSignal(row) {
    if (!row) return { kind: 'empty', text: '' };
    if (row.sunday_name) {
      return { kind: 'sunday', text: row.sunday_name };
    }
    if (_isMajorFeast(row.feast_rank) && row.feast_name) {
      return { kind: 'feast', text: row.feast_name };
    }
    if (_isFastActive(row.fast_status) && row.feast_rank === 'minor' && row.feast_name) {
      return { kind: 'fast-saint', text: row.feast_name };
    }
    if (row.feast_rank === 'minor' && row.feast_name) {
      return { kind: 'saint', text: row.feast_name };
    }
    // Fallback — non-empty gospel reference if available.
    const gospelRef = row.daily_readings && row.daily_readings.gospel && row.daily_readings.gospel.reference;
    if (gospelRef) return { kind: 'gospel-ref', text: gospelRef };
    return { kind: 'empty', text: '' };
  }

  // ═════════════════════════════════════════════════════════════════
  // DATA LOAD
  // ═════════════════════════════════════════════════════════════════

  async function loadWeek(sb) {
    const W = _W();
    if (!W) throw new Error('WeekUtils unavailable');
    const start   = W.getCurrentWeekStart();
    const end     = W.getCurrentWeekEnd();
    const startKey = W.ymd(start);
    const endKey   = W.ymd(end);
    const res = await sb.from('liturgical_calendar')
      .select('calendar_date,liturgical_season,feast_name,feast_rank,fast_status,sunday_name,saint_commemorations,notes,daily_readings')
      .gte('calendar_date', startKey)
      .lte('calendar_date', endKey)
      .order('calendar_date', { ascending: true });
    if (res.error) throw res.error;
    return res.data || [];
  }

  // Build 7 cell-state objects (one per day Sun→Sat), even for days
  // missing from the DB (synthesized as null-row).
  function _buildWeekCells(rows) {
    const W = _W();
    const start    = W.getCurrentWeekStart();
    const todayKey = W.todayKey();
    const byKey = Object.create(null);
    (rows || []).forEach(r => { byKey[r.calendar_date] = r; });

    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d   = W.addDays(start, i);
      const key = W.ymd(d);
      cells.push({
        index:    i,
        ymd:      key,
        isToday:  key === todayKey,
        isSunday: i === 0,
        row:      byKey[key] || null,
      });
    }
    return cells;
  }

  // ═════════════════════════════════════════════════════════════════
  // CSS INJECTION (once per page load)
  // ═════════════════════════════════════════════════════════════════

  let _cssInjected = false;

  function injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;

    const css = [
      /* ── Mini-calendar surface (home.html status surface) ── */
      '.lc-section{',
      '  margin: 0.75rem 0 1rem;',
      '  font-family: "Crimson Text", Georgia, serif;',
      '}',
      '.lc-eyebrow{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.7rem;',
      '  letter-spacing: 0.15em;',
      '  text-transform: uppercase;',
      '  color: #C9A84C;',
      '  text-align: center;',
      '  margin-bottom: 0.5rem;',
      '  opacity: 0.85;',
      '}',
      '.lc-grid{',
      '  display: grid;',
      '  grid-template-columns: repeat(7, minmax(0, 1fr));',
      '  gap: 4px;',
      '  width: 100%;',
      '}',
      '.lc-cell{',
      '  position: relative;',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: flex-start;',
      '  padding: 0.4rem 0.25rem 0.5rem;',
      '  min-height: 88px;',
      '  background: rgba(245, 236, 215, 0.4);', /* cream parchment */
      '  border: 1px solid rgba(201, 168, 76, 0.2);', /* faint gold */
      '  border-radius: 6px;',
      '  cursor: pointer;',
      '  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;',
      '  text-align: center;',
      '  overflow: hidden;',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '.lc-cell:active{ transform: scale(0.97); }',
      '.lc-cell:hover{ border-color: rgba(201, 168, 76, 0.45); }',

      /* Day-letter and date number */
      '.lc-cell-dayletter{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.7rem;',
      '  letter-spacing: 0.1em;',
      '  color: #1B2A4A;',
      '  opacity: 0.7;',
      '  margin-bottom: 0.1rem;',
      '}',
      '.lc-cell-datenum{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 1.05rem;',
      '  font-weight: 600;',
      '  color: #1B2A4A;',
      '  line-height: 1;',
      '  margin-bottom: 0.3rem;',
      '}',

      /* Atom label — line-clamp 2 so long saint names don't break layout */
      '.lc-cell-atom{',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  font-size: 0.7rem;',
      '  line-height: 1.15;',
      '  color: #1B2A4A;',
      '  opacity: 0.85;',
      '  display: -webkit-box;',
      '  -webkit-line-clamp: 2;',
      '  -webkit-box-orient: vertical;',
      '  overflow: hidden;',
      '  word-break: break-word;',
      '  hyphens: auto;',
      '}',

      /* Top-right glyph slot (feast ☩ or fast ◐) */
      '.lc-cell-glyph{',
      '  position: absolute;',
      '  top: 2px;',
      '  right: 4px;',
      '  font-size: 0.85rem;',
      '  line-height: 1;',
      '}',
      '.lc-cell-glyph.lc-glyph-feast{ color: #C9A84C; }', /* gold */
      '.lc-cell-glyph.lc-glyph-fast{  color: #4C3366; opacity: 0.7; }', /* muted purple */

      /* Sunday-cell — gold gradient (Lord's Day) */
      '.lc-cell.lc-is-sunday{',
      '  background: linear-gradient(',
      '    180deg,',
      '    rgba(201, 168, 76, 0.18) 0%,',
      '    rgba(245, 236, 215, 0.5) 100%',
      '  );',
      '  border-color: rgba(201, 168, 76, 0.35);',
      '}',

      /* Fast-day — muted purple tint (subordinate to today/feast cues) */
      '.lc-cell.lc-is-fast{',
      '  background: rgba(76, 51, 102, 0.18);',
      '}',
      '.lc-cell.lc-is-sunday.lc-is-fast{',
      '  /* sunday + fast: keep purple tint on top, slight gold border kept */',
      '  background: rgba(76, 51, 102, 0.18);',
      '}',

      /* Major-feast — gold top border (subtle visual elevation) */
      '.lc-cell.lc-is-feast{',
      '  border-top: 2px solid #C9A84C;',
      '  padding-top: calc(0.4rem - 1px);',
      '}',

      /* Today-cell — gold border + warm bg; subsumes Sunday gradient */
      '.lc-cell.lc-is-today{',
      '  border: 2px solid #C9A84C;',
      '  background: rgba(201, 168, 76, 0.12);',
      '  padding: calc(0.4rem - 1px) calc(0.25rem - 1px) calc(0.5rem - 1px);',
      '}',
      '.lc-cell.lc-is-today.lc-is-feast{',
      '  /* today + feast: keep both signals, gold border already present */',
      '  border-top-width: 2px;',
      '}',
      '.lc-cell.lc-is-today .lc-cell-dayletter,',
      '.lc-cell.lc-is-today .lc-cell-datenum{',
      '  opacity: 1;',
      '  font-weight: 700;',
      '}',

      /* Narrow-viewport refinement (iPhone portrait) */
      '@media (max-width: 420px){',
      '  .lc-cell{ min-height: 76px; padding: 0.3rem 0.15rem 0.35rem; }',
      '  .lc-cell-dayletter{ font-size: 0.62rem; }',
      '  .lc-cell-datenum{ font-size: 0.95rem; }',
      '  .lc-cell-atom{ font-size: 0.62rem; -webkit-line-clamp: 2; }',
      '  .lc-grid{ gap: 3px; }',
      '}',

      /* ── DRAWER OVERLAY (full-viewport, clones sunday-celebration scaffold) */
      '.lc-overlay{',
      '  position: fixed; inset: 0;',
      '  background: rgba(11, 17, 32, 0.78);',
      '  backdrop-filter: blur(2px);',
      '  -webkit-backdrop-filter: blur(2px);',
      '  z-index: 9999;',
      '  opacity: 0;',
      '  transition: opacity 240ms ease;',
      '  display: flex;',
      '  align-items: flex-start;',
      '  justify-content: center;',
      '}',
      '.lc-overlay.lc-in{ opacity: 1; }',
      '.lc-overlay.lc-out{ opacity: 0; transition-duration: 200ms; }',
      '.lc-scroll{',
      '  width: 100%; height: 100%;',
      '  overflow-y: auto;',
      '  -webkit-overflow-scrolling: touch;',
      '  display: flex; align-items: flex-start; justify-content: center;',
      '  padding: 2rem 1rem;',
      '  box-sizing: border-box;',
      '}',
      '.lc-card{',
      '  max-width: 560px; width: 100%;',
      '  background: linear-gradient(180deg, #F5ECD7 0%, #EFE3C6 100%);',
      '  border: 1px solid rgba(201, 168, 76, 0.55);',
      '  border-radius: 10px;',
      '  padding: 1.5rem 1.25rem 1.25rem;',
      '  box-shadow: 0 18px 48px rgba(11, 17, 32, 0.45);',
      '  color: #1B2A4A;',
      '  font-family: "Crimson Text", Georgia, serif;',
      '  transform: scale(0.96);',
      '  transition: transform 240ms ease;',
      '}',
      '.lc-overlay.lc-in .lc-card{ transform: scale(1); }',
      '.lc-card-eyebrow{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.68rem;',
      '  letter-spacing: 0.18em;',
      '  text-transform: uppercase;',
      '  color: #8B1A1A;',
      '  text-align: center;',
      '  margin-bottom: 0.35rem;',
      '}',
      '.lc-card-date{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 1.25rem;',
      '  font-weight: 600;',
      '  text-align: center;',
      '  color: #1B2A4A;',
      '  margin-bottom: 0.25rem;',
      '}',
      '.lc-card-season{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.7rem;',
      '  letter-spacing: 0.12em;',
      '  text-transform: uppercase;',
      '  text-align: center;',
      '  color: #C9A84C;',
      '  margin-bottom: 1rem;',
      '}',
      '.lc-card-feast{',
      '  text-align: center;',
      '  margin: 0 0 1rem;',
      '}',
      '.lc-card-feast-name{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 1.05rem;',
      '  color: #8B1A1A;',
      '  line-height: 1.25;',
      '}',
      '.lc-card-feast-rank{',
      '  font-size: 0.78rem;',
      '  color: #1B2A4A;',
      '  opacity: 0.7;',
      '  margin-top: 0.15rem;',
      '  letter-spacing: 0.05em;',
      '}',
      '.lc-card-divider{',
      '  border: 0;',
      '  border-top: 1px solid rgba(201, 168, 76, 0.4);',
      '  margin: 0.9rem 0;',
      '}',
      '.lc-card-section-title{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.72rem;',
      '  letter-spacing: 0.15em;',
      '  text-transform: uppercase;',
      '  color: #C9A84C;',
      '  margin-bottom: 0.35rem;',
      '}',
      '.lc-card-readings{',
      '  display: flex; flex-direction: column; gap: 0.25rem;',
      '  font-size: 0.95rem;',
      '}',
      '.lc-card-reading-row{',
      '  display: flex;',
      '  justify-content: space-between;',
      '  gap: 0.5rem;',
      '}',
      '.lc-card-reading-label{',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.78rem;',
      '  letter-spacing: 0.08em;',
      '  color: #1B2A4A;',
      '  opacity: 0.75;',
      '}',
      '.lc-card-reading-ref{',
      '  font-size: 0.95rem;',
      '  color: #1B2A4A;',
      '  text-align: right;',
      '}',
      '.lc-card-saints{',
      '  list-style: none; padding: 0; margin: 0;',
      '  display: flex; flex-direction: column; gap: 0.2rem;',
      '}',
      '.lc-card-saints li{',
      '  font-size: 0.95rem;',
      '  color: #1B2A4A;',
      '  padding-left: 0.9rem;',
      '  text-indent: -0.9rem;',
      '}',
      '.lc-card-saints li::before{',
      '  content: "\\2020";', /* † */
      '  color: #8B1A1A;',
      '  margin-right: 0.4rem;',
      '}',
      '.lc-card-fast{',
      '  font-size: 0.95rem;',
      '  color: #1B2A4A;',
      '}',
      '.lc-card-fast-glyph{',
      '  color: #4C3366;',
      '  margin-right: 0.4rem;',
      '}',
      '.lc-card-notes{',
      '  font-style: italic;',
      '  font-size: 0.92rem;',
      '  color: #1B2A4A;',
      '  opacity: 0.85;',
      '}',
      '.lc-card-close{',
      '  display: block;',
      '  margin: 1.2rem auto 0;',
      '  padding: 0.55rem 1.4rem;',
      '  background: #1B2A4A;',
      '  color: #F5ECD7;',
      '  border: 1px solid #C9A84C;',
      '  border-radius: 6px;',
      '  font-family: "Cinzel", Georgia, serif;',
      '  font-size: 0.85rem;',
      '  letter-spacing: 0.08em;',
      '  cursor: pointer;',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '.lc-card-close:active{ transform: translateY(1px); }',
      '.lc-card-empty{',
      '  text-align: center;',
      '  color: #1B2A4A;',
      '  opacity: 0.7;',
      '  font-style: italic;',
      '  padding: 1rem 0;',
      '}',

      '@media (prefers-reduced-motion: reduce){',
      '  .lc-overlay{ transition: none; }',
      '  .lc-overlay .lc-card{ transition: none; transform: none; }',
      '  .lc-cell{ transition: none; }',
      '}',
    ].join('\n');

    const style = document.createElement('style');
    style.setAttribute('data-lc-styles', 'true');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ═════════════════════════════════════════════════════════════════
  // GRID RENDER
  // ═════════════════════════════════════════════════════════════════

  function _renderCell(cell) {
    const row    = cell.row;
    const signal = _cellSignal(row);
    const dateNum = cell.ymd.slice(8); /* "DD" */
    const dateNumStripped = String(parseInt(dateNum, 10));

    const isFast        = row ? _isFastActive(row.fast_status) : false;
    const isMajorFeast  = row ? _isMajorFeast(row.feast_rank) : false;
    const cellClasses   = ['lc-cell'];
    if (cell.isSunday)  cellClasses.push('lc-is-sunday');
    if (isFast)         cellClasses.push('lc-is-fast');
    if (isMajorFeast)   cellClasses.push('lc-is-feast');
    if (cell.isToday)   cellClasses.push('lc-is-today');

    /* Glyph priority: major feast ☩ wins over fast ◐ (both are
       possible in theory but mutually exclusive in practice for
       any "feast day"; fast still tints background). */
    let glyphHtml = '';
    if (isMajorFeast) {
      glyphHtml = '<span class="lc-cell-glyph lc-glyph-feast" aria-hidden="true">\u2629</span>'; /* ☩ */
    } else if (isFast) {
      glyphHtml = '<span class="lc-cell-glyph lc-glyph-fast" aria-hidden="true">\u25D0</span>';   /* ◐ */
    }

    const ariaLabel = row
      ? _longDate(cell.ymd) + (signal.text ? ' — ' + signal.text : '')
      : _longDate(cell.ymd);

    return ''
      + '<button type="button" class="' + cellClasses.join(' ') + '"'
      +   ' data-lc-ymd="' + esc(cell.ymd) + '"'
      +   ' aria-label="' + esc(ariaLabel) + '">'
      +   glyphHtml
      +   '<span class="lc-cell-dayletter">' + _dayLetter(cell.index) + '</span>'
      +   '<span class="lc-cell-datenum">' + esc(dateNumStripped) + '</span>'
      +   '<span class="lc-cell-atom">' + esc(signal.text) + '</span>'
      + '</button>';
  }

  function _renderGrid(container, cells, onCellTap) {
    const html = ''
      + '<div class="lc-section">'
      +   '<div class="lc-eyebrow">This Week in the Church</div>'
      +   '<div class="lc-grid" role="list">'
      +     cells.map(_renderCell).join('')
      +   '</div>'
      + '</div>';
    container.innerHTML = html;

    /* Wire taps. Delegate from grid for simplicity. */
    const grid = container.querySelector('.lc-grid');
    if (grid) {
      grid.addEventListener('click', function (ev) {
        const btn = ev.target.closest('button.lc-cell');
        if (!btn) return;
        const ymd = btn.getAttribute('data-lc-ymd');
        const cell = cells.find(c => c.ymd === ymd);
        if (cell) onCellTap(cell);
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // DRAWER (full-viewport overlay; clones sunday-celebration scaffold)
  // ═════════════════════════════════════════════════════════════════

  function _renderDrawerBody(cell) {
    const row = cell.row;
    if (!row) {
      return ''
        + '<div class="lc-card-eyebrow">\u2726 &nbsp; The Day &nbsp; \u2726</div>'
        + '<div class="lc-card-date">' + esc(_longDate(cell.ymd)) + '</div>'
        + '<div class="lc-card-empty">No liturgical entry recorded for this day.</div>';
    }

    const seasonHtml = row.liturgical_season
      ? '<div class="lc-card-season">' + esc(row.liturgical_season) + '</div>'
      : '';

    let feastBlock = '';
    if (row.feast_name && (_isMajorFeast(row.feast_rank) || row.sunday_name)) {
      /* Major/Sunday feast — render in red Cinzel with rank label */
      const headline = row.sunday_name && _isMajorFeast(row.feast_rank)
        ? row.feast_name                      /* feast wins over Sunday name when both populated and feast is major */
        : (row.sunday_name || row.feast_name);
      const rankLabel = RANK_LABELS[row.feast_rank] || '';
      feastBlock = ''
        + '<div class="lc-card-feast">'
        +   '<div class="lc-card-feast-name">' + esc(headline) + '</div>'
        +   (rankLabel ? '<div class="lc-card-feast-rank">' + esc(rankLabel) + '</div>' : '')
        + '</div>';
    } else if (row.feast_name) {
      /* Minor commemoration — still surface as the day's headline */
      feastBlock = ''
        + '<div class="lc-card-feast">'
        +   '<div class="lc-card-feast-name">' + esc(row.feast_name) + '</div>'
        +   '<div class="lc-card-feast-rank">Commemoration</div>'
        + '</div>';
    }

    /* Fast block */
    let fastBlock = '';
    if (row.fast_status) {
      const label = FAST_LABELS[row.fast_status] || row.fast_status;
      const active = _isFastActive(row.fast_status);
      fastBlock = ''
        + '<hr class="lc-card-divider" />'
        + '<div class="lc-card-section-title">Fasting</div>'
        + '<div class="lc-card-fast">'
        +   (active ? '<span class="lc-card-fast-glyph" aria-hidden="true">\u25D0</span>' : '')
        +   esc(label)
        + '</div>';
    }

    /* Readings block — references only (full text lives in bible-reader) */
    const dr = row.daily_readings || {};
    const epistleRef = dr.epistle && dr.epistle.reference;
    const gospelRef  = dr.gospel  && dr.gospel.reference;
    const matinsRef  = dr.matins_gospel && dr.matins_gospel.reference;

    let readingsBlock = '';
    if (epistleRef || gospelRef || matinsRef) {
      const rows = [];
      if (epistleRef) {
        rows.push('<div class="lc-card-reading-row">'
          + '<span class="lc-card-reading-label">Epistle</span>'
          + '<span class="lc-card-reading-ref">' + esc(epistleRef) + '</span></div>');
      }
      if (gospelRef) {
        rows.push('<div class="lc-card-reading-row">'
          + '<span class="lc-card-reading-label">Gospel</span>'
          + '<span class="lc-card-reading-ref">' + esc(gospelRef) + '</span></div>');
      }
      if (matinsRef) {
        rows.push('<div class="lc-card-reading-row">'
          + '<span class="lc-card-reading-label">Matins Gospel</span>'
          + '<span class="lc-card-reading-ref">' + esc(matinsRef) + '</span></div>');
      }
      readingsBlock = ''
        + '<hr class="lc-card-divider" />'
        + '<div class="lc-card-section-title">Scripture Readings</div>'
        + '<div class="lc-card-readings">' + rows.join('') + '</div>';
    }

    /* Saints block — full list (no truncation, per orchestrator Q9) */
    let saintsBlock = '';
    const saints = Array.isArray(row.saint_commemorations) ? row.saint_commemorations : [];
    if (saints.length > 0) {
      saintsBlock = ''
        + '<hr class="lc-card-divider" />'
        + '<div class="lc-card-section-title">Also Commemorated</div>'
        + '<ul class="lc-card-saints">'
        +   saints.map(s => '<li>' + esc(s) + '</li>').join('')
        + '</ul>';
    }

    /* Notes block — only if non-null */
    let notesBlock = '';
    if (row.notes) {
      notesBlock = ''
        + '<hr class="lc-card-divider" />'
        + '<div class="lc-card-notes">' + esc(row.notes) + '</div>';
    }

    return ''
      + '<div class="lc-card-eyebrow">\u2726 &nbsp; The Day &nbsp; \u2726</div>'
      + '<div class="lc-card-date">' + esc(_longDate(cell.ymd)) + '</div>'
      + seasonHtml
      + feastBlock
      + fastBlock
      + readingsBlock
      + saintsBlock
      + notesBlock;
  }

  function _openDrawer(cell) {
    const overlay = document.createElement('div');
    overlay.className = 'lc-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', _longDate(cell.ymd) + ' — liturgical detail');

    overlay.innerHTML = ''
      + '<div class="lc-scroll">'
      +   '<div class="lc-card">'
      +     _renderDrawerBody(cell)
      +     '<button type="button" class="lc-card-close" id="lc-card-close">Close</button>'
      +   '</div>'
      + '</div>';

    document.body.appendChild(overlay);

    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /* Force reflow so the .lc-in opacity transition fires */
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetWidth;
    overlay.classList.add('lc-in');

    let dismissed = false;
    function _dismiss() {
      if (dismissed) return;
      dismissed = true;
      window.removeEventListener('keydown', onKey);
      overlay.classList.remove('lc-in');
      overlay.classList.add('lc-out');
      document.body.style.overflow = priorOverflow || '';
      setTimeout(function () {
        if (overlay.parentNode) overlay.remove();
      }, 240);
    }

    function onKey(ev) {
      if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        _dismiss();
      }
    }
    window.addEventListener('keydown', onKey);

    /* Tap on backdrop (outside the card) also dismisses */
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay || ev.target.classList.contains('lc-scroll')) {
        _dismiss();
      }
    });

    const closeBtn = overlay.querySelector('#lc-card-close');
    if (closeBtn) closeBtn.addEventListener('click', _dismiss);

    /* Focus close button for keyboard users */
    try { if (closeBtn && closeBtn.focus) closeBtn.focus({ preventScroll: true }); } catch (_e) {}
  }

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC: mount
  // ═════════════════════════════════════════════════════════════════

  async function mount(container, opts) {
    if (!container) return;
    const sb = opts && opts.sb;
    if (!sb) {
      console.warn('LiturgicalCalendarHome.mount: missing sb');
      return;
    }
    if (!_W()) {
      console.warn('LiturgicalCalendarHome.mount: WeekUtils unavailable');
      return;
    }

    injectCSS();

    /* Render skeleton immediately to reserve layout space */
    container.innerHTML = '<div class="lc-section"><div class="lc-eyebrow">This Week in the Church</div><div class="lc-grid" aria-busy="true"></div></div>';

    let rows = [];
    try {
      rows = await loadWeek(sb);
    } catch (e) {
      console.warn('LiturgicalCalendarHome.loadWeek failed (graceful):', e);
      container.innerHTML = '';
      return;
    }

    const cells = _buildWeekCells(rows);
    _renderGrid(container, cells, _openDrawer);
  }

  // ═════════════════════════════════════════════════════════════════
  // EXPORTS
  // ═════════════════════════════════════════════════════════════════

  const LiturgicalCalendarHome = {
    mount:        mount,
    loadWeek:     loadWeek,
    /* Exposed for testing / orchestrator audit only */
    _cellSignal:  _cellSignal,
    _buildWeekCells: _buildWeekCells,
    FAST_LABELS:  FAST_LABELS,
    RANK_LABELS:  RANK_LABELS,
  };

  if (typeof window !== 'undefined') {
    window.LiturgicalCalendarHome = LiturgicalCalendarHome;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiturgicalCalendarHome;
  }
})();
