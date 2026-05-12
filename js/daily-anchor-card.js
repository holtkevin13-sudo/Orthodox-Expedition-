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
 * Dispatch 3a — Lectionary on Daily Anchor Card:
 *   When `row.daily_readings.gospel` is populated, the verse sub-card
 *   surfaces today's gospel reading (eyebrow "Today's Gospel",
 *   reference like "John 11:47-54", a ~35-word teaser of the gospel
 *   text with liturgical lead-ins stripped, and a deep-link to
 *   bible-reader at the gospel's book + chapter). When the gospel
 *   payload is absent or malformed, the verse sub-card falls back to
 *   the existing daily_verses rotation — identical to pre-3a UX on
 *   dates outside ICS coverage. The framing line, body line, and
 *   prompt sub-card are untouched by 3a.
 *
 * Public API:
 *   DailyAnchorCard.render({ row, verse, prompt, today, explorerName })
 *     → HTML string
 *
 * Inputs:
 *   row          — liturgical_calendar row or null. Expected to include
 *                  `daily_readings` JSONB when available; absence
 *                  cleanly falls through to the verse pool.
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

  // ─────────────────────────────────────────────────────────────────
  // LECTIONARY TEASER HELPERS (Dispatch 3a)
  // ─────────────────────────────────────────────────────────────────

  // ── GOSPEL LEAD-IN PATTERNS ──────────────────────────────────────
  // Orthodox lectionary gospel texts conventionally open with a brief
  // liturgical lead-in identifying the speaker or scene-setting context
  // ("At that time, ...", "The Lord said to his disciples, ..."). For
  // a compact home-card teaser, the lead-in burns word budget without
  // adding context, so we strip the first matching pattern.
  //
  // Order matters: most-specific (longest) prefix first so that, e.g.,
  // "The Lord said to his disciples, " wins before "The Lord said, "
  // grabs a too-short prefix. Matched case-insensitively.
  //
  // The list combines the dispatch's specified patterns with the
  // actually-occurring corpus variants discovered via SQL audit of
  // liturgical_calendar.daily_readings (May 8 → Aug 31, 2026 coverage).
  // Notably the corpus uses "the Jews" rather than "those Jews" — both
  // included so the strip is robust across data and dispatch literals.
  const GOSPEL_LEAD_INS = [
    // Most-specific / longest first
    'The Lord said to the Jews who had believed in him, ',
    'The Lord said to the Jews who had come to him, ',
    'The Lord said to the Jews who came to him, ',
    'The Lord said to those Jews who came to him, ',
    'The Lord said to his own disciples, ',
    'The Lord said to his disciples: ',
    'The Lord said to his disciples, ',
    'The Lord said this parable: ',
    'The Lord said this parable, ',
    'The Lord said, ',
    'At that time, ',
    'Brethren, ',
  ];

  // ── stripLeadIn ──────────────────────────────────────────────────
  // Case-insensitive prefix match. Strips the first matching pattern
  // from the front of `text`. Also strips any subsequent leading
  // whitespace and opening quote characters (straight " or curly “)
  // so the teaser flows as a narrative excerpt rather than an
  // orphaned-quote fragment.
  //
  // Returns the stripped text. If no pattern matches, returns the
  // original text unchanged.
  function stripLeadIn(text) {
    if (!text) return '';
    const s = String(text);
    const lower = s.toLowerCase();
    for (let i = 0; i < GOSPEL_LEAD_INS.length; i++) {
      const pat = GOSPEL_LEAD_INS[i];
      if (lower.startsWith(pat.toLowerCase())) {
        let rest = s.slice(pat.length);
        // Strip leading whitespace and opening quote chars.
        rest = rest.replace(/^[\s"\u201C]+/, '');
        return rest;
      }
    }
    return s;
  }

  // ── capitalizeFirstAlpha ─────────────────────────────────────────
  // After stripping a lead-in, the remaining first character is
  // sometimes a lowercase letter from mid-sentence narrative
  // (e.g., "the chief priests..." after stripping "At that time, ").
  // This helper uppercases the first alphabetic character so the
  // teaser reads as a properly-cased sentence.
  function capitalizeFirstAlpha(s) {
    if (!s) return '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      // Alphabetic test: a letter has distinct upper/lower forms.
      if (c.toLowerCase() !== c.toUpperCase()) {
        return s.slice(0, i) + c.toUpperCase() + s.slice(i + 1);
      }
    }
    return s;
  }

  // ── buildGospelTeaser ────────────────────────────────────────────
  // Produces the home-card teaser from full gospel text:
  //   1. Strip liturgical lead-in (and any opening quote).
  //   2. Capitalize first alphabetic char of the remainder.
  //   3. Take first `wordCount` whitespace-separated tokens.
  //   4. Trim trailing punctuation that reads poorly before an
  //      ellipsis (commas, semicolons, colons).
  //   5. Append a Unicode ellipsis (…) iff the text was truncated.
  //
  // wordCount defaults to 35 per the dispatch's spec ("first ~30-40
  // words" with the example showing ~35).
  function buildGospelTeaser(text, wordCount) {
    const n = (typeof wordCount === 'number' && wordCount > 0) ? wordCount : 35;
    const stripped = stripLeadIn(text);
    const capped = capitalizeFirstAlpha(stripped);
    if (!capped) return '';
    const tokens = capped.split(/\s+/).filter(Boolean);
    if (tokens.length <= n) {
      // No truncation needed; return as-is (the full passage fit).
      return capped.trim();
    }
    let head = tokens.slice(0, n).join(' ');
    // Strip trailing read-poorly-before-ellipsis punctuation.
    head = head.replace(/[,;:]+$/, '');
    return head + '\u2026'; // U+2026 HORIZONTAL ELLIPSIS
  }

  // ── renderLectionaryGospel ───────────────────────────────────────
  // Renders the gospel sub-card. Returns the HTML string on success,
  // or null when the gospel payload is incomplete (which lets render()
  // fall back to the daily_verses verse sub-card).
  //
  // Required gospel fields: reference, text, book_code, chapter.
  // Optional gospel fields: verse_start, verse_end — when both are
  // present, they are appended to the bible-reader URL as &vs=N&ve=N
  // so bible-reader.html's Today's Reading mode (Dispatch 3c) can
  // scroll to and highlight the day's verse range. If either is
  // null/undefined/empty, both are omitted and bible-reader falls
  // back to chapter-level open (existing 3a behavior preserved).
  //
  // Reuses existing `.dac-sub`, `.dac-sub-eyebrow`, `.dac-verse-text`,
  // `.dac-verse-ref`, and `.dac-sub-cta` CSS classes — no new CSS
  // required. The eyebrow ("Today's Gospel") is the only visual
  // addition vs the daily_verses sub-card.
  function renderLectionaryGospel(gospel) {
    if (!gospel) return null;
    const ref       = gospel.reference;
    const text      = gospel.text;
    const bookCode  = gospel.book_code;
    const chapter   = gospel.chapter;
    if (!ref || !text || !bookCode || chapter == null || chapter === '') {
      return null;
    }
    const teaser = buildGospelTeaser(text, 35);
    if (!teaser) return null;

    // Dispatch 3c: optional verse-range params. Include only when both
    // ends are present and parseable as positive integers — a half-
    // range or non-numeric value would produce an invalid Today's
    // Reading mode in bible-reader, so omit and fall back to chapter
    // level. Both ends are coerced to strings via encodeURIComponent.
    const vs = gospel.verse_start;
    const ve = gospel.verse_end;
    const vsOk = (vs !== null && vs !== undefined && vs !== '' && Number(vs) > 0);
    const veOk = (ve !== null && ve !== undefined && ve !== '' && Number(ve) > 0);
    let href = `bible-reader.html?book=${encodeURIComponent(bookCode)}`
             + `&chapter=${encodeURIComponent(chapter)}`
             + `&source=expedition`;
    if (vsOk && veOk) {
      href += `&vs=${encodeURIComponent(vs)}&ve=${encodeURIComponent(ve)}`;
    }
    return `
      <a class="dac-sub dac-verse-sub dac-gospel-sub" href="${esc(href)}">
        <div class="dac-sub-eyebrow">Today's Gospel</div>
        <div class="dac-verse-text">${esc(teaser)}</div>
        <div class="dac-verse-ref">${esc(ref)}</div>
        <div class="dac-sub-cta">
          <span>Read this passage</span>
          <span class="dac-sub-arrow" aria-hidden="true">›</span>
        </div>
      </a>
    `;
  }

  // ── renderDailyVerseFallback ─────────────────────────────────────
  // Renders the daily_verses sub-card (existing pre-3a behavior).
  // Returns the HTML string when the verse row has all required
  // fields, or empty string when it doesn't (in which case the verse
  // sub-card is simply omitted from the card — same as before).
  //
  // Extracted from the original inline render block so the
  // lectionary-vs-fallback decision in render() reads cleanly.
  function renderDailyVerseFallback(verse) {
    if (!verse) return '';
    if (!verse.reference || !verse.text || !verse.bible_book_code || verse.bible_chapter == null) {
      return '';
    }
    const href = `bible-reader.html?book=${encodeURIComponent(verse.bible_book_code)}`
               + `&chapter=${encodeURIComponent(verse.bible_chapter)}`
               + `&source=expedition`;
    return `
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

    // ── VERSE SUB-CARD (Dispatch 3a: lectionary-first) ───────────
    // Lectionary gospel takes precedence when row.daily_readings.gospel
    // is fully populated. Otherwise, fall back to the daily_verses
    // rotation (existing pre-3a UX). Either failure path yields '' so
    // the card simply omits the verse sub-card when there is nothing
    // to render — matches pre-existing graceful behavior.
    let verseHtml = '';
    if (row && row.daily_readings && row.daily_readings.gospel) {
      const lectionaryHtml = renderLectionaryGospel(row.daily_readings.gospel);
      if (lectionaryHtml) {
        verseHtml = lectionaryHtml;
      } else {
        // Gospel payload present but incomplete — fall back rather
        // than show nothing. Preserves the verse sub-card surface
        // on misshapen data.
        verseHtml = renderDailyVerseFallback(verse);
      }
    } else {
      verseHtml = renderDailyVerseFallback(verse);
    }

    // ── PROMPT SUB-CARD ──────────────────────────────────────────
    // Visual reference only post-Chat-2A. The reflection INPUT moves
    // to missions.js's reading two-stage lane (Stage 2 = reflect).
    // We keep the prompt visible here so Nolan sees "what's coming"
    // pre-read, but no longer deep-links to journal.html — the
    // reading lane on Missions is the canonical write surface.
    let promptHtml = '';
    if (prompt && prompt.prompt_text) {
      promptHtml = `
        <div class="dac-sub dac-prompt-sub dac-prompt-sub-static">
          <div class="dac-sub-eyebrow">Today's Reflection</div>
          <div class="dac-prompt-text">${esc(prompt.prompt_text)}</div>
          <div class="dac-sub-cta dac-sub-cta-hint">
            <span>Reflect after reading the Gospel</span>
          </div>
        </div>
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
    _internals: {
      esc,
      todayMMDD,
      todayISO,
      inPreLaunchGap,
      resolveHeadCopy,
      // Lectionary helpers (Dispatch 3a) — exposed for tests
      stripLeadIn,
      capitalizeFirstAlpha,
      buildGospelTeaser,
      renderLectionaryGospel,
      renderDailyVerseFallback,
      GOSPEL_LEAD_INS,
    },
  };
})();

if (typeof window !== 'undefined') window.DailyAnchorCard = DailyAnchorCard;
if (typeof module !== 'undefined' && module.exports) module.exports = DailyAnchorCard;
