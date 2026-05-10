/**
 * Orthodox Expedition — Liturgical Calendar Card
 *
 * Pure render function. Takes a liturgical_calendar row (or null)
 * and returns an HTML string for the liturgical-context block on
 * week.html. No DOM mutation — caller drops the string in.
 *
 * Visual hierarchy by feast_rank:
 *   great   → most prominent (largest type, gold accent)
 *   major   → prominent but secondary (above minor)
 *   minor   → present, restrained
 *   NULL    → feast block hidden; season/saints/fast still render
 *
 * Fast status translation (5-state enum → explorer-facing language):
 *   strict          → 'Strict fast'
 *   wine_oil        → 'Wine and oil allowed'
 *   fish_allowed    → 'Fish allowed'
 *   dairy_allowed   → 'Dairy allowed'      (Cheesefare Week — special)
 *   no_fast         → fast line omitted entirely
 *
 * Public API:
 *   CalendarCard.render(row) → HTML string
 */

const CalendarCard = (() => {

  // ── HTML ESCAPE ─────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── FAST STATUS TRANSLATION ─────────────────────────────────────
  // Returns null when the fast line should be omitted (no_fast).
  function fastLabel(status) {
    switch (status) {
      case 'strict':        return 'Strict fast';
      case 'wine_oil':      return 'Wine and oil allowed';
      case 'fish_allowed':  return 'Fish allowed';
      case 'dairy_allowed': return 'Dairy allowed';
      case 'no_fast':       return null;
      default:              return null;
    }
  }

  // ── FEAST TIER STYLING ──────────────────────────────────────────
  // Returns an object describing the visual treatment for the feast block.
  function feastTier(rank) {
    if (rank === 'great') {
      return {
        eyebrow: 'Great Feast',
        titleSize: '1.35rem',
        accent: '#ffd700',         // --gold-bright
        glow: '0 0 18px rgba(255,215,0,0.35)',
        showOrnament: true,
        borderOpacity: 0.45,
      };
    }
    if (rank === 'major') {
      return {
        eyebrow: 'Feast Day',
        titleSize: '1.15rem',
        accent: '#f0c96e',         // --gold-light
        glow: '0 0 12px rgba(240,201,110,0.3)',
        showOrnament: true,
        borderOpacity: 0.3,
      };
    }
    // minor (or anything else)
    return {
      eyebrow: 'Commemoration',
      titleSize: '1rem',
      accent: '#c9922a',           // --gold
      glow: 'none',
      showOrnament: false,
      borderOpacity: 0.18,
    };
  }

  // ── SAINT COMMEMORATIONS ────────────────────────────────────────
  // Returns null when array is empty/null — caller hides the block.
  function renderSaintsList(saints) {
    if (!Array.isArray(saints) || saints.length === 0) return null;
    return saints.map(s => `<li>${esc(s)}</li>`).join('');
  }

  // ── DAILY READINGS ──────────────────────────────────────────────
  // Optional block: epistle / gospel / matins gospel references.
  // Renders nothing if daily_readings is empty/null/missing — backward-
  // compatible for dates outside the populated overlap window.
  // Display-only this dispatch; tap-to-deep-link is Dispatch 3 territory.
  function renderReadingsBlock(daily) {
    if (!daily || typeof daily !== 'object') return '';
    const ep = daily.epistle && daily.epistle.reference ? daily.epistle.reference : null;
    const gp = daily.gospel && daily.gospel.reference ? daily.gospel.reference : null;
    const mg = daily.matins_gospel && daily.matins_gospel.reference ? daily.matins_gospel.reference : null;
    if (!ep && !gp && !mg) return '';

    // One reading row: small Cinzel eyebrow label + Crimson Text reference.
    function row(label, ref, dim) {
      if (!ref) return '';
      const opacity = dim ? 0.62 : 0.88;
      return `
        <div class="lc-reading" style="
          display:flex;
          justify-content:space-between;
          align-items:baseline;
          gap:0.75rem;
          padding:0.35rem 0;
        ">
          <div class="lc-reading-label" style="
            font-family:'Cinzel',serif;
            font-size:0.62rem;
            letter-spacing:0.18em;
            color:rgba(201,146,42,0.6);
            text-transform:uppercase;
            font-weight:600;
            white-space:nowrap;
          ">${esc(label)}</div>
          <div class="lc-reading-ref" style="
            font-family:'Crimson Text',serif;
            font-style:italic;
            font-size:0.92rem;
            color:rgba(244,232,193,${opacity});
            text-align:right;
            line-height:1.35;
          ">${esc(ref)}</div>
        </div>
      `;
    }

    return `
      <div class="lc-readings" style="
        margin-bottom:0.75rem;
        padding:0.6rem 1rem 0.5rem;
        border:1px solid rgba(201,146,42,0.18);
        border-radius:8px;
        background:rgba(27,42,74,0.18);
      ">
        <div class="lc-readings-eyebrow" style="
          font-family:'Cinzel',serif;
          font-size:0.65rem;
          letter-spacing:0.18em;
          color:rgba(201,146,42,0.6);
          text-transform:uppercase;
          margin-bottom:0.3rem;
          text-align:center;
          font-weight:600;
        ">Today's Readings</div>
        ${row('Gospel', gp, false)}
        ${row('Epistle', ep, false)}
        ${row('Matins Gospel', mg, true)}
      </div>
    `;
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────
  function render(row) {
    if (!row) {
      // Out-of-range or missing — render nothing (caller will hide).
      return '';
    }

    // ── FEAST BLOCK ──────────────────────────────────────────────
    // Show feast or sunday_name if either is present. feast_name takes
    // priority; sunday_name is the fallback for Sunday rows that aren't
    // also feasts (per the spec edge-case rule).
    let feastBlock = '';
    const feastTitle = row.feast_name || row.sunday_name;
    if (feastTitle) {
      const tier = feastTier(row.feast_rank);
      feastBlock = `
        <div class="lc-feast" style="
          margin-bottom:1rem;
          padding:0.85rem 1rem;
          border:1px solid ${tier.accent}${Math.round(tier.borderOpacity*255).toString(16).padStart(2,'0')};
          border-radius:10px;
          background:linear-gradient(160deg, ${tier.accent}0a, ${tier.accent}03);
          ${tier.glow !== 'none' ? `box-shadow:${tier.glow};` : ''}
          text-align:center;
        ">
          ${tier.showOrnament ? `<div class="lc-ornament" style="
            font-family:'Cinzel Decorative',serif;
            font-size:1.5rem;
            color:${tier.accent};
            line-height:1;
            margin-bottom:0.4rem;
          ">☩</div>` : ''}
          <div class="lc-feast-eyebrow" style="
            font-family:'Cinzel',serif;
            font-size:0.7rem;
            letter-spacing:0.2em;
            color:rgba(201,146,42,0.65);
            text-transform:uppercase;
            margin-bottom:0.3rem;
            font-weight:600;
          ">${esc(tier.eyebrow)}</div>
          <div class="lc-feast-title" style="
            font-family:'Cinzel Decorative',serif;
            font-size:${tier.titleSize};
            color:${tier.accent};
            line-height:1.25;
          ">${esc(feastTitle)}</div>
        </div>
      `;
    }

    // ── SEASON LINE ─────────────────────────────────────────────
    // Always present (season is non-nullable per Chat 4 contract).
    const seasonBlock = row.liturgical_season ? `
      <div class="lc-season" style="
        font-family:'Cinzel',serif;
        font-size:0.78rem;
        letter-spacing:0.1em;
        color:rgba(201,146,42,0.75);
        text-transform:uppercase;
        text-align:center;
        margin-bottom:0.75rem;
        font-weight:600;
      ">${esc(row.liturgical_season)}</div>
    ` : '';

    // ── FAST LINE ───────────────────────────────────────────────
    const fast = fastLabel(row.fast_status);
    const fastBlock = fast ? `
      <div class="lc-fast" style="
        font-family:'Crimson Text',serif;
        font-style:italic;
        font-size:0.95rem;
        color:rgba(244,232,193,0.78);
        text-align:center;
        margin-bottom:0.75rem;
      ">${esc(fast)}</div>
    ` : '';

    // ── SAINTS LIST ─────────────────────────────────────────────
    const saintsHtml = renderSaintsList(row.saint_commemorations);
    const saintsBlock = saintsHtml ? `
      <div class="lc-saints" style="
        margin-bottom:0.75rem;
        padding:0.75rem 1rem;
        background:rgba(107,26,26,0.12);
        border:1px solid rgba(201,146,42,0.18);
        border-radius:8px;
      ">
        <div class="lc-saints-eyebrow" style="
          font-family:'Cinzel',serif;
          font-size:0.65rem;
          letter-spacing:0.18em;
          color:rgba(201,146,42,0.6);
          text-transform:uppercase;
          margin-bottom:0.4rem;
          text-align:center;
          font-weight:600;
        ">Commemorated Today</div>
        <ul class="lc-saints-list" style="
          list-style:none;
          padding:0;
          margin:0;
          font-family:'Crimson Text',serif;
          font-size:0.95rem;
          line-height:1.55;
          color:rgba(244,232,193,0.88);
          text-align:center;
        ">${saintsHtml}</ul>
      </div>
    ` : '';

    // ── NOTES LINE ──────────────────────────────────────────────
    // Lower visual weight than feast/season per spec.
    const notesBlock = row.notes ? `
      <div class="lc-notes" style="
        font-family:'Crimson Text',serif;
        font-style:italic;
        font-size:0.88rem;
        color:rgba(244,232,193,0.6);
        text-align:center;
        line-height:1.5;
        margin-bottom:0.5rem;
      ">${esc(row.notes)}</div>
    ` : '';

    // ── DAILY READINGS BLOCK ────────────────────────────────────
    // Optional — renders empty string when row.daily_readings is
    // missing or empty (out-of-overlap dates, pre-populate state).
    const readingsBlock = renderReadingsBlock(row.daily_readings);

    // ── ASSEMBLE ────────────────────────────────────────────────
    const allBlocks = `${feastBlock}${seasonBlock}${fastBlock}${saintsBlock}${readingsBlock}${notesBlock}`;
    if (!allBlocks.trim()) return '';

    return `
      <div class="lc-wrapper" style="
        margin-bottom:1.5rem;
        padding:0.5rem 0;
      ">${allBlocks}</div>
    `;
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  return {
    render,
    _internals: { esc, fastLabel, feastTier, renderSaintsList, renderReadingsBlock },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CalendarCard;
