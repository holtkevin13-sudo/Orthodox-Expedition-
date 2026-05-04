/**
 * Orthodox Expedition — Name-Day Banner
 *
 * Renders a banner above the liturgical-context block when today's
 * date matches the explorer's patron saint feast day.
 *
 * Universal by design — the banner activates for any patron whose
 * feast day is registered in the PATRONS table below. The banner
 * content is patron-specific (icon, traditional Greek greeting form,
 * the saint's English name), so each patron has its own copy block.
 *
 * Pass B scope (per orchestrator dispatch): St. Herman of Alaska
 * for Aug 9 (option C — heavier name-day state). Other patrons can
 * be added by extending the PATRONS map below — the render path
 * itself stays universal.
 *
 * Public API:
 *   NameDayBanner.render(today, profile) → HTML string (or '')
 *
 * Inputs:
 *   today   — Date object (uses local wall-clock month/day)
 *   profile — { patron_saint: string | null, full_name: string | null }
 *
 * Returns the banner HTML string, or empty string if today is not
 * the explorer's patron's feast day. Caller drops it in.
 */

const NameDayBanner = (() => {

  // ── PATRON FEAST REGISTRY ───────────────────────────────────────
  // Keyed on a normalized form of the patron_saint string. The
  // matchPatron() helper handles common variations ("St. Herman",
  // "Saint Herman", "Herman of Alaska", "St Herman of Alaska").
  //
  // To add a new patron: add a new entry. The render path is
  // universal — only the copy block below is patron-specific.
  const PATRONS = {
    'herman_of_alaska': {
      mmdd: '08-09',
      english_name: 'St. Herman of Alaska',
      icon_symbol: '☩',     // placeholder — Kevin will swap in image asset
      greek_greeting: 'Χρόνια πολλά',
      greek_translit: 'Chronia polla',  // for screen readers
      one_line: 'A monk of the cold north, the first canonized saint of the New World.',
      journal_prompt: 'St. Herman lived a life of hidden prayer on a far island. What does it mean to be a saint when no one is watching?',
      // Match any of these (case-insensitive, normalized)
      aliases: [
        'st. herman',
        'saint herman',
        'st herman',
        'herman of alaska',
        'st. herman of alaska',
        'saint herman of alaska',
        'st herman of alaska',
      ],
    },
  };

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

  // ── PATRON MATCHING ─────────────────────────────────────────────
  // Normalize a patron_saint string and look up against aliases.
  // Returns the matching patron entry or null.
  function matchPatron(patronString) {
    if (!patronString) return null;
    const norm = String(patronString).trim().toLowerCase();
    for (const key of Object.keys(PATRONS)) {
      const patron = PATRONS[key];
      if (patron.aliases.includes(norm)) return patron;
    }
    return null;
  }

  // ── DATE HELPER ─────────────────────────────────────────────────
  function todayMMDD(today) {
    const d = today instanceof Date ? today : new Date();
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── FIRST NAME HELPER ───────────────────────────────────────────
  // Pull the first name from full_name. Falls back to "you" — never
  // a generic "explorer" or pseudonym.
  function firstName(profile) {
    if (!profile || !profile.full_name) return 'you';
    const trimmed = String(profile.full_name).trim();
    if (!trimmed) return 'you';
    return trimmed.split(/\s+/)[0];
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────
  function render(today, profile) {
    if (!profile) return '';

    const patron = matchPatron(profile.patron_saint);
    if (!patron) return '';

    const mmdd = todayMMDD(today);
    if (mmdd !== patron.mmdd) return '';

    const name = firstName(profile);

    return `
      <div class="name-day-banner" style="
        margin-bottom:1.5rem;
        padding:1.5rem 1.25rem;
        background:linear-gradient(160deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02));
        border:1.5px solid rgba(255,215,0,0.4);
        border-radius:14px;
        box-shadow:0 0 28px rgba(255,215,0,0.18);
        text-align:center;
      ">
        <div class="ndb-icon" style="
          font-size:3rem;
          color:#ffd700;
          line-height:1;
          margin-bottom:0.5rem;
          text-shadow:0 0 22px rgba(255,215,0,0.55);
        ">${esc(patron.icon_symbol)}</div>

        <div class="ndb-eyebrow" style="
          font-family:'Cinzel',serif;
          font-size:0.7rem;
          letter-spacing:0.25em;
          color:rgba(255,215,0,0.75);
          text-transform:uppercase;
          margin-bottom:0.4rem;
          font-weight:600;
        ">Your Name Day</div>

        <div class="ndb-greeting" style="
          font-family:'Cinzel Decorative',serif;
          font-size:clamp(1.3rem, 5vw, 1.65rem);
          color:#ffd700;
          line-height:1.25;
          margin-bottom:0.4rem;
        ">Happy name day, ${esc(name)}</div>

        <div class="ndb-greek" lang="el" style="
          font-family:'Crimson Text',serif;
          font-size:1.25rem;
          color:rgba(244,232,193,0.92);
          font-style:italic;
          margin-bottom:0.85rem;
        " title="${esc(patron.greek_translit)}">${esc(patron.greek_greeting)}</div>

        <div class="ndb-saint" style="
          font-family:'Cinzel',serif;
          font-size:0.78rem;
          letter-spacing:0.1em;
          color:rgba(244,232,193,0.75);
          text-transform:uppercase;
          margin-bottom:0.5rem;
          font-weight:600;
        ">${esc(patron.english_name)}</div>

        <div class="ndb-blurb" style="
          font-family:'Crimson Text',serif;
          font-style:italic;
          font-size:0.95rem;
          color:rgba(244,232,193,0.78);
          line-height:1.55;
          max-width:440px;
          margin:0 auto 1.1rem auto;
        ">${esc(patron.one_line)}</div>

        ${patron.journal_prompt ? `
          <a href="journal.html?prompt=name_day&patron=${encodeURIComponent(patron.english_name)}" class="ndb-journal-btn" style="
            display:inline-block;
            padding:0.65rem 1.4rem;
            background:rgba(255,215,0,0.15);
            border:1px solid rgba(255,215,0,0.4);
            border-radius:10px;
            font-family:'Cinzel',serif;
            font-size:0.78rem;
            letter-spacing:0.1em;
            color:#ffd700;
            text-decoration:none;
            text-transform:uppercase;
            font-weight:600;
            min-height:42px;
          ">A Journal Entry for Today</a>
        ` : ''}
      </div>
    `;
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  return {
    render,
    _internals: { matchPatron, todayMMDD, firstName, PATRONS },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = NameDayBanner;
