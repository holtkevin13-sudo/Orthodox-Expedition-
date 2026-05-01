/**
 * Orthodox Expedition — Pause Card
 *
 * Given a pause-state object from DayState.compute(), produces an HTML
 * fragment for the pause card. Four variants: Bright Week, Twelve Days,
 * summer easing, rest week. Each has its own accent, icon, and quote.
 *
 * No DOM mutation. No fetch. Returns a string the caller drops in.
 *
 * Usage:
 *   const html = PauseCard.render(state);
 *   document.getElementById('pause-slot').innerHTML = html;
 */

const PauseCard = (() => {

  // ── PAUSE COPY BANK ──────────────────────────────────────────────
  // Four variants. Each has a title, sub-text (one paragraph), an Orthodox
  // quote (kept short), an attribution line, an icon symbol, and an accent
  // color (used as a subtle border/glow on the card).
  //
  // Texts are scriptural or liturgical — public domain, no Chat 1 voice
  // call required. If Chat 1 wants to adjust them, single-source edit here.

  const VARIANTS = {
    bright_week: {
      title: 'Bright Week',
      icon: '✦',
      accent: '#ffd700',           // --gold-bright
      sub_text: 'This week the Church rests in the light of the Resurrection. No new lessons — only joy. Greet your father and your priest with "Christ is Risen!" and listen for the answer.',
      quote: 'Christ is risen from the dead, by death trampling down upon death, and to those in the tombs He has granted life.',
      quote_attribution: 'Paschal Apolytikion',
    },

    twelve_days: {
      title: 'The Twelve Days of Christmas',
      icon: '☩',
      accent: '#c9922a',           // --gold
      sub_text: 'The Church keeps the Feast of the Nativity for twelve full days. No new lessons in this season — only wonder. Look at the icon. Sing the troparion. The Word became flesh.',
      quote: 'Today the Virgin gives birth to Him who is above all being, and the earth offers a cave to Him whom no one can approach.',
      quote_attribution: 'Kontakion of the Nativity',
    },

    summer_easing: {
      title: 'Summer Rest',
      icon: '☀',
      accent: '#f0c96e',           // --gold-light
      sub_text: 'The wheel of the liturgical year turns slowly through summer. Daily prayer continues, and the Saint of the Week is still posted — but no new sessions until the Church New Year. Read. Visit church. Rest.',
      quote: 'The Lord shepherds me, and I shall lack nothing. In a place of green pasture, there He has made me to dwell.',
      quote_attribution: 'Psalm 22 LXX',
    },

    rest_week: {
      title: 'A Week of Rest',
      icon: '◈',
      accent: '#c9922a',           // --gold
      sub_text: 'The Expedition rests this week. Daily prayer continues. The Saint of the Week is still here. No new lesson — but you can review your Field Manual or practice your memorization.',
      quote: 'There remains, then, a Sabbath rest for the people of God.',
      quote_attribution: 'Hebrews 4:9',
    },
  };

  // ── DATE FORMATTING ──────────────────────────────────────────────

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function formatLongDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  // ── HTML ESCAPE ──────────────────────────────────────────────────
  // Defensive — quotes/sub_text are author-controlled here, but if a
  // future caller passes user-derived strings we should not be the
  // weakest link.

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── RENDER ───────────────────────────────────────────────────────

  function render(state) {
    if (!state || state.day_kind !== 'pause') return '';

    const variant = VARIANTS[state.pause_reason] || VARIANTS.rest_week;
    const resumesOn = formatLongDate(state.pause_resumes_on);

    return `
<div class="pause-card" style="
  max-width: 540px;
  margin: 1.5rem auto;
  padding: 2rem 1.75rem;
  background: linear-gradient(160deg, rgba(244, 232, 193, 0.04), rgba(244, 232, 193, 0.01));
  border: 1.5px solid ${variant.accent}33;
  border-radius: 16px;
  box-shadow: 0 0 32px ${variant.accent}1a;
  text-align: center;
  font-family: 'Crimson Text', serif;
">
  <div style="
    font-size: 2.75rem;
    color: ${variant.accent};
    margin-bottom: 0.5rem;
    text-shadow: 0 0 16px ${variant.accent}66;
  ">${esc(variant.icon)}</div>

  <h2 style="
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(1.3rem, 4.5vw, 1.7rem);
    color: #f0c96e;
    margin: 0 0 0.25rem 0;
    text-shadow: 0 0 14px rgba(201, 146, 42, 0.3);
  ">${esc(variant.title)}</h2>

  <div style="
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: rgba(201, 146, 42, 0.5);
    text-transform: uppercase;
    margin-bottom: 1.25rem;
  ">The Expedition Rests</div>

  <p style="
    color: rgba(244, 232, 193, 0.75);
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0 0 1.5rem 0;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
  ">${esc(variant.sub_text)}</p>

  <blockquote style="
    margin: 1.5rem auto;
    padding: 1rem 1.25rem;
    max-width: 420px;
    border-left: 2px solid ${variant.accent}66;
    font-family: 'Caveat', cursive, 'Crimson Text', serif;
    font-size: 1.05rem;
    color: rgba(244, 232, 193, 0.85);
    font-style: italic;
    line-height: 1.55;
    text-align: left;
  ">
    ${esc(variant.quote)}
    <footer style="
      font-family: 'Cinzel', serif;
      font-style: normal;
      font-size: 0.65rem;
      letter-spacing: 0.15em;
      color: rgba(201, 146, 42, 0.5);
      text-transform: uppercase;
      margin-top: 0.5rem;
      text-align: right;
    ">— ${esc(variant.quote_attribution)}</footer>
  </blockquote>

  ${resumesOn ? `
  <div style="
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(201, 146, 42, 0.15);
    font-family: 'Cinzel', serif;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    color: rgba(201, 146, 42, 0.6);
    text-transform: uppercase;
  ">
    The next session opens<br>
    <span style="
      font-family: 'Cinzel Decorative', serif;
      font-size: 0.95rem;
      color: ${variant.accent};
      letter-spacing: 0.05em;
      text-transform: none;
      display: inline-block;
      margin-top: 0.4rem;
    ">${esc(resumesOn)}</span>
  </div>
  ` : ''}
</div>
    `.trim();
  }

  // ── PUBLIC API ───────────────────────────────────────────────────

  return {
    render,
    // Exposed for tests / overrides:
    _variants: VARIANTS,
    _formatLongDate: formatLongDate,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PauseCard;
