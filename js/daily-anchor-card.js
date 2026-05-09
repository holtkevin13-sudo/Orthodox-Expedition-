/**
 * Orthodox Expedition — Daily Anchor Card ("Today We Celebrate")
 *
 * Pure render function. Takes today's liturgical_calendar row (or null),
 * a daily verse row, a journal prompt row, and a Date, and returns the
 * HTML string for the home.html devotional anchor between today-card
 * and rank-hero.
 *
 * Sister surface to js/calendar-card.js (which renders the full
 * liturgical context block on week.html). This card is intentionally
 * narrower in purpose: liturgical-season eyebrow, principal feast/saint
 * line, a Bible verse with deep-link to bible-reader, and a journal
 * prompt with deep-link to journal.html. No fast info, no full saint
 * list — those live on week.html's calendar card.
 *
 * Saint-list expansion (Repair I):
 *   When `feast_name` is null but `saint_commemorations` has entries,
 *   the body line surfaces up to two saints rather than only the
 *   first. 1 saint → "X". 2 saints → "X and Y". 3+ saints →
 *   "X, Y + N more" (truncated count keeps the card compact for
 *   ADHD-first scannability; full list still lives on week.html's
 *   calendar card).
 *
 * Aug 9 (St. Herman) flourish:
 *   On exactly 08-09 the card adopts a "name day" treatment — the
 *   eyebrow becomes "Name Day", the framing line becomes "Χρόνια
 *   πολλά, Nolan" (Greek decorative phrase), and the body says
 *   "Today the Church celebrates your patron saint, St. Herman of
 *   Alaska." The verse + prompt sub-cards still rotate normally.
 *
 * Path B fallback (May 8-17, 2026 pre-launch gap):
 *   When `row` is null, the eyebrow falls back to "Paschal Season"
 *   (the season Pascha 2026 → Pentecost 2026 covers), the framing
 *   line becomes "✦ Christ is Risen! ✦", and the body becomes the
 *   pre-launch teaser. Outside the gap window, null `row` → no
 *   eyebrow + universal-day fallback.
 *
 * Public API:
 *   DailyAnchorCard.render({ row, verse, prompt, today, explorerName })
 *     → HTML string
 *
 * Inputs:
 *   row          — liturgical_calendar row or null
 *   verse        — daily_verses row (reference, text, bible_book_code,
 *                  bible_chapter) or null
 *   prompt       — journal_prompts row ({ prompt_text }) or null
 *   today        — Date object (uses local wall-clock month/day)
 *   explorerName — string (first name) or null; used only on Aug 9
 *                  for the name-day greeting
 */

const DailyAnchorCard = (() => {

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

  // ── DATE HELPER ─────────────────────────────────────────────────
  // Returns 'MM-DD' from a Date (local wall clock).
  function todayMMDD(today) {
    const d = today instanceof Date ? today : new Date();
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── DATE HELPER (ISO) ───────────────────────────────────────────
  // Returns 'YYYY-MM-DD' from a Date (local wall clock).
  function todayISO(today) {
    const d = today instanceof Date ? today : new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── PRE-LAUNCH GAP WINDOW ───────────────────────────────────────
  // 2026-05-08 through 2026-05-17 inclusive. liturgical_calendar has
  // zero rows here. Path B fallback uses Paschal-season copy.
  function inPreLaunchGap(today) {
    const iso = todayISO(today);
    return iso >= '2026-05-08' && iso <= '2026-05-17';
  }

  // ── HEAD-OF-CARD COPY RESOLVER ──────────────────────────────────
  // Centralizes the eyebrow / framing / body decision so the render
  // path stays linear. Returns:
  //   {
  //     eyebrow, framing, body,
  //     greatFeast: bool,    // whether to apply the great-feast
  //                          // visual elevation (heavier border, +10% body)
  //     nameDay:    bool,    // Aug 9 name-day flourish active
  //   }
  function resolveHeadCopy({ row, today, explorerName }) {
    const mmdd = todayMMDD(today);

    // ── Aug 9 St. Herman name-day flourish ───────────────────────
    // Hard-coded date match; doesn't depend on calendar row content.
    if (mmdd === '08-09') {
      const greekDecorative = 'Χρόνια πολλά';
      const name = explorerName ? `, ${explorerName}` : '';
      return {
        eyebrow:   'Name Day',
        framing:   `${greekDecorative}${name}`,
        body:      'Today the Church celebrates your patron saint, St. Herman of Alaska.',
        greatFeast: true,
        nameDay:    true,
      };
    }

    // ── Calendar-row driven (the common case) ────────────────────
    if (row) {
      const eyebrow = row.liturgical_season || null;
      let body = row.feast_name || null;
      if (!body && Array.isArray(row.saint_commemorations) && row.saint_commemorations.length > 0) {
        // Saint-list expansion (Repair I): surface up to two saints
        // when `feast_name` is null. Three or more → first two plus a
        // truncated count, keeping the card compact (full list lives
        // on week.html's calendar card).
        const saints = row.saint_commemorations;
        if (saints.length === 1) {
          body = saints[0];
        } else if (saints.length === 2) {
          body = `${saints[0]} and ${saints[1]}`;
        } else {
          body = `${saints[0]}, ${saints[1]} + ${saints.length - 2} more`;
        }
      }
      // Last-line fallback if still nothing
      if (!body) {
        body = (eyebrow === 'Paschal Season')
          ? 'Christ is Risen!'
          : 'A new day to walk with God.';
      }
      return {
        eyebrow,
        framing:   'Today We Celebrate',
        body,
        greatFeast: row.feast_rank === 'great',
        nameDay:    false,
      };
    }

    // ── Path B graceful fallback (no calendar row) ───────────────
    if (inPreLaunchGap(today)) {
      return {
        eyebrow:    'Paschal Season',
        framing:    'Christ is Risen!',
        body:       'The journey begins Monday, May 18.',
        greatFeast: false,
        nameDay:    false,
      };
    }

    // ── Out-of-data fallback (post-2029, future expansion) ───────
    return {
      eyebrow:    null,
      framing:    'A new day to walk with God',
      body:       null,
      greatFeast: false,
      nameDay:    false,
    };
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────
  function render({ row, verse, prompt, today, explorerName } = {}) {
    const head = resolveHeadCopy({ row, today, explorerName });

    // ── EYEBROW ──────────────────────────────────────────────────
    const eyebrowHtml = head.eyebrow ? `
      <div class="dac-eyebrow">${esc(head.eyebrow)}</div>
    ` : '';

    // ── FRAMING LINE (with ornaments) ────────────────────────────
    // Greek-script framing on Aug 9 gets lang="el" for screen readers.
    const framingLang = head.nameDay ? ' lang="el"' : '';
    const framingHtml = `
      <div class="dac-framing"${framingLang}>
        <span class="dac-orn" aria-hidden="true">&#x2726;&#xFE0E;</span>
        <span class="dac-framing-text">${esc(head.framing)}</span>
        <span class="dac-orn" aria-hidden="true">&#x2726;&#xFE0E;</span>
      </div>
    `;

    // ── BODY ─────────────────────────────────────────────────────
    const bodyHtml = head.body ? `
      <div class="dac-body${head.greatFeast ? ' dac-body-great' : ''}">${esc(head.body)}</div>
    ` : '';

    // ── VERSE SUB-CARD ───────────────────────────────────────────
    // Tappable; deep-links to bible-reader.html with source=expedition
    // so the bible-reader's expedition banner activates.
    let verseHtml = '';
    if (verse && verse.reference && verse.text && verse.bible_book_code && verse.bible_chapter) {
      const href = `bible-reader.html?book=${encodeURIComponent(verse.bible_book_code)}`
                 + `&chapter=${encodeURIComponent(verse.bible_chapter)}`
                 + `&source=expedition`;
      verseHtml = `
        <a class="dac-sub dac-verse-sub" href="${esc(href)}">
          <div class="dac-verse-text">&ldquo;${esc(verse.text)}&rdquo;</div>
          <div class="dac-verse-ref">— ${esc(verse.reference)}</div>
          <div class="dac-sub-cta">
            <span>Read this passage</span>
            <span class="dac-sub-arrow" aria-hidden="true">›</span>
          </div>
        </a>
      `;
    }

    // ── PROMPT SUB-CARD ──────────────────────────────────────────
    // Tappable; deep-links to journal.html with prompt=daily mode
    // and the prompt text URL-encoded. journal.html surfaces it via
    // the existing coming-home-banner pattern (see applySessionPrompt).
    let promptHtml = '';
    if (prompt && prompt.prompt_text) {
      const href = `journal.html?prompt=daily&text=${encodeURIComponent(prompt.prompt_text)}`;
      promptHtml = `
        <a class="dac-sub dac-prompt-sub" href="${esc(href)}">
          <div class="dac-sub-eyebrow">Today's Reflection</div>
          <div class="dac-prompt-text">${esc(prompt.prompt_text)}</div>
          <div class="dac-sub-cta">
            <span>Write in your Field Manual</span>
            <span class="dac-sub-arrow" aria-hidden="true">›</span>
          </div>
        </a>
      `;
    }

    // ── ASSEMBLE ─────────────────────────────────────────────────
    const greatClass = head.greatFeast ? ' dac-great' : '';
    const nameDayClass = head.nameDay ? ' dac-name-day' : '';
    return `
      <div class="dac-inner${greatClass}${nameDayClass}">
        ${eyebrowHtml}
        ${framingHtml}
        ${bodyHtml}
        ${verseHtml}
        ${promptHtml}
      </div>
    `;
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  return {
    render,
    _internals: { esc, todayMMDD, todayISO, inPreLaunchGap, resolveHeadCopy },
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = DailyAnchorCard;
