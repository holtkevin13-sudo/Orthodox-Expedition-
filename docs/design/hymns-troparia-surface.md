# HYMNS / TROPARIA SURFACE
## Design Brief — The Orthodox Expedition

**Status:** v1 design specification — ground truth for the engineering and content-authoring chats that will land the surface
**Date:** May 15, 2026
**Author:** Designer Chat D9 (Phase 2)
**Consumed by:** C6 content-authoring dispatch (single batched dispatch authoring 42 universal hymns), worker engineering dispatch (single dispatch implementing the JSON corpus loader, render slots in saint card + feast-of-week + Sunday tone cell, and sw.js bump)
**Target landing:** End of June 2026 / first week July 2026 — post-launch enhancement, not a hard-deadline workstream
**Revision history:**
  - 2026-05-15 — Phase 1 diagnostic + 6 OQs + 7 PBs submitted to orchestrator
  - 2026-05-15 — Orchestrator rulings received; Phase 2 spec authored

---

## 0. EXECUTIVE SUMMARY

The Hymns / Troparia Surface brings Orthodox liturgical hymnody — apolytikia, kontakia, and the Resurrectional troparia of the eight tones — into The Orthodox Expedition as a first-class catechetical content tier alongside saint cards, feast-of-the-week, weekly verses, and Gospel readings. The surface ships v1 as text-only (English-primary, polytonic Greek as register-marker beneath) with a forward-compatible audio scaffold that lets Kevin populate recordings incrementally over v1.1 without requiring a new engineering dispatch.

The v1 corpus is 42 universal hymns: 8 Resurrectional troparia + 8 Resurrectional kontakia (the eight tones of the Octoechos) + 12 apolytikia + 12 kontakia for the great feasts + the Paschal troparion + the Paschal kontakion. The 15 saint apolytikia tier (C6c) defers to v1.1, where it grows naturally with the saints corpus as Topics 1+ ship.

Hymnody is encountered contextually — apolytikia surface inside saint card modals on the saint's feast day; festal apolytikia and kontakia surface inside the feast-of-the-week card; the Resurrectional tone-of-the-week surfaces inline on the Sunday cell of the home Liturgical Calendar drawer. No standalone `/hymns.html` page lands in v1; aggregation into a future "Today" companion surface (Addition 3) preserves library-mode access without locking in a destination Nolan would not visit organically at age 10.

The most significant design ruling in D9 is the formalization of the **Category 1 / Category 2 register split** for canonical Greek liturgical text. The existing `COMIC_DESIGN_BRIEF.md` §11.6 register (Greek first and larger, English smaller as gloss) was authored against short canonical phrases — every cited example is 1–4 words. Extending that treatment to multi-paragraph hymn texts misapplies a spec written for dialogue-tier phrases. Category 2 (long-form hymnody) inverts the visual hierarchy: English primary, Greek polytonic beneath as register-marker. §6 below codifies. Post-launch repo-audit folds the Category distinction back into `COMIC_DESIGN_BRIEF.md` §11.6 itself so future dispatches see the canonical version (per Op Learning #27).

---

## 1. THEOLOGICAL + LITURGICAL CONTEXT

Orthodox formation is fundamentally liturgical. The Latin maxim **lex orandi, lex credendi** — *the law of prayer is the law of belief* — names a discipline the Eastern tradition has practiced unbroken since the early Church: doctrine is taught primarily through what is sung in worship, and only secondarily through catechism or theological treatise. The hymnody of the Orthodox Church is not decoration on the liturgy; it is the catechism the Church sings.

This matters for The Orthodox Expedition because Nolan is being formed inside the Orthodox Christian tradition, not merely instructed about it. The Bible, the saint's life, the icon, and the hymn are four convergent surfaces of the same formation. Removing the hymn tier would leave a gap that no amount of well-written session text can fill: the *sung* tradition is a different mode of knowing.

Three liturgical structures govern the hymn corpus:

**The Octoechos** (Greek *Ὀκτώηχος*, "eight tones") is the eight-week cycle of Resurrectional hymnody that rotates weekly through Ordinary Time. Each Sunday is sung in one of the eight tones; the cycle resets every eight weeks. Tone 1 begins each year on the first Sunday after Pentecost. The Resurrectional troparion and kontakion of the week's tone are the principal hymns sung at Saturday vespers and the Sunday Divine Liturgy. The Octoechos was substantially formed by St. John of Damascus in the 8th century and has been sung essentially unchanged since.

**The Twelve Great Feasts** (plus Pascha, the "Feast of Feasts") are the principal fixed and movable celebrations of the liturgical year. Each great feast has its own apolytikion (the dismissal hymn that names the feast's central mystery) and kontakion (a longer poetic meditation, traditionally attributed to St. Romanos the Melodist or the kontakion's later development). On the feast itself and through its afterfeast period, the festal hymns displace or supplement the Sunday Resurrectional cycle.

**Pascha** stands apart. Bright Week (the Pascha-to-Thomas-Sunday octave) suspends the Octoechos entirely; only Paschal hymnody is sung. The Paschal Troparion — *Christ is risen from the dead, trampling down death by death, and to those in the tombs granting life* — is sung at every service for the forty days of the Paschal Season until Ascension, and is the single most catechetically dense moment in the entire Orthodox liturgical year. It is for this reason that the visual treatment honors it with Byzantine Gold per `COMIC_DESIGN_BRIEF.md` §11.7 (extended in D9 §6 below to the full troparion text, not only the opening exclamation).

The hymn corpus the Expedition surfaces is therefore not a museum exhibit but the same hymnody Nolan will sing every Sunday in St. Demetrios for the rest of his life. The surface's catechetical purpose is to let the sung tradition begin shaping him before he can read the Greek, before he can analyze the doctrine — through the patient repetition of texts that have shaped Orthodox Christians for a millennium and more.

---

## 2. CORPUS SCOPE v1

Per OQ-2 ruling (Path D hybrid + phasing), the v1 corpus is **42 universal hymns** across two JSON files. "Universal" means time-stable and not coupled to any per-explorer or per-family state — the Paschal Troparion is the same hymn regardless of who is praying it. The 15-hymn saint apolytikia tier defers to v1.1 where it grows with the saints corpus as Topics 1+ ship; surfacing saint apolytikia against the current ~15-entry saints corpus would create a synchronization burden as that corpus expands.

### 2.1 File 1 — `/docs/content/hymns/resurrectional-tones-v1.json` (16 entries)

Eight tones; troparion + kontakion per tone:

| Tone | Slug (troparion) | Slug (kontakion) |
|---|---|---|
| 1 | `resurrectional-troparion-tone-1` | `resurrectional-kontakion-tone-1` |
| 2 | `resurrectional-troparion-tone-2` | `resurrectional-kontakion-tone-2` |
| 3 | `resurrectional-troparion-tone-3` | `resurrectional-kontakion-tone-3` |
| 4 | `resurrectional-troparion-tone-4` | `resurrectional-kontakion-tone-4` |
| Plagal 1 (5) | `resurrectional-troparion-tone-5` | `resurrectional-kontakion-tone-5` |
| Plagal 2 (6) | `resurrectional-troparion-tone-6` | `resurrectional-kontakion-tone-6` |
| Grave (7) | `resurrectional-troparion-tone-7` | `resurrectional-kontakion-tone-7` |
| Plagal 4 (8) | `resurrectional-troparion-tone-8` | `resurrectional-kontakion-tone-8` |

The Greek tradition numbers tones 1–4 (πρῶτος, δεύτερος, τρίτος, τέταρτος) and 5–8 as "plagal" (πλάγιος πρῶτος, πλάγιος δεύτερος, βαρύς, πλάγιος τέταρτος). The slug uses 1–8 numbering for engineering simplicity; the rendered display name uses the canonical tone-naming convention per C6 authoring discretion.

### 2.2 File 2 — `/docs/content/hymns/festal-hymns-v1.json` (26 entries)

The 12 great feasts plus Pascha, apolytikion + kontakion each:

| Feast (English) | Date | Slug (apolytikion) | Slug (kontakion) |
|---|---|---|---|
| Pascha (Resurrection) | Movable | `paschal-troparion` | `paschal-kontakion` |
| Nativity of the Theotokos | Sep 8 | `apolytikion-nativity-theotokos` | `kontakion-nativity-theotokos` |
| Exaltation of the Cross | Sep 14 | `apolytikion-exaltation-cross` | `kontakion-exaltation-cross` |
| Entry of the Theotokos | Nov 21 | `apolytikion-entry-theotokos` | `kontakion-entry-theotokos` |
| Nativity of Christ | Dec 25 | `apolytikion-nativity-christ` | `kontakion-nativity-christ` |
| Theophany | Jan 6 | `apolytikion-theophany` | `kontakion-theophany` |
| Meeting of Our Lord | Feb 2 | `apolytikion-meeting-lord` | `kontakion-meeting-lord` |
| Annunciation | Mar 25 | `apolytikion-annunciation` | `kontakion-annunciation` |
| Entry into Jerusalem | Movable | `apolytikion-palm-sunday` | `kontakion-palm-sunday` |
| Holy Ascension | Movable | `apolytikion-ascension` | `kontakion-ascension` |
| Holy Pentecost | Movable | `apolytikion-pentecost` | `kontakion-pentecost` |
| Transfiguration | Aug 6 | `apolytikion-transfiguration` | `kontakion-transfiguration` |
| Dormition of the Theotokos | Aug 15 | `apolytikion-dormition` | `kontakion-dormition` |

Note that `paschal-troparion` is the unique slug eligible for Byzantine Gold rendering per §6 below; defense-in-depth enforcement in the consumer renderer hardcodes this so the gold treatment cannot drift to other entries through JSON authoring error (mirrors the Chat 23 `fj-greek` `!important` enforcement of the chrismation-formula body-ink rule).

### 2.3 Deferred to v1.1

- `/docs/content/hymns/saint-apolytikia-v1.json` (~15 entries, coupled to saints corpus growth)
- Lenten Triodion proper hymns (~30 entries, separate corpus tier)
- Pentecostarion Sundays proper hymns (~7 entries, separate corpus tier)
- Hours / Compline / Vespers complete texts
- Akathist hymns
- Penitential canon of St. Andrew of Crete

---

## 3. TRANSLATION SOURCE POLICY

Translation source discipline is non-negotiable. The hymn corpus is the Church's voice; sourcing it from non-Orthodox or generic-ecumenical translations would be a category error analogous to citing a Protestant catechism in an Orthodox catechetical text.

### 3.1 Primary source — Greek Orthodox Archdiocese Digital Chant Stand (GOA DCS)

GOA Digital Chant Stand (`dcs.goarch.org`) — formerly AGES Initiatives, acquired by the Greek Orthodox Archdiocese of America in 2021 with Fr. Seraphim Dedes joining the Archdiocesan Staff as Digital Liturgical Content Manager and Liturgical Translator — is the primary source for v1 corpus authoring.

The translation register is contemporary liturgical English, faithful to the Greek source, with imprimatur from the Greek Orthodox Archdiocese. The DCS makes both Greek (in polytonic form) and English texts freely accessible. The license terms read in full:

> *The translations, rubrics, Greek and English texts are for the purposes of worship only and are subject to change without notice and should not be construed as a commitment by the authors, translators, developers, and personnel associated with their publication.*

This is a worship-use grant, not a permissive open-redistribution license. Use within The Orthodox Expedition is acceptable for the following reasons:

- The app is a single-family catechetical PWA (Nolan + Holts).
- It is non-commercial and not redistributed beyond the family.
- Catechetical formation in the Orthodox tradition *is* preparation for worship — the use case is within the spirit of the worship-use grant.
- Parish bulletins, home prayer books, and parish service handouts use these same translations under the same grant. The Expedition's pattern of use is materially identical.

If the app architecture ever expands to multi-family scope (a v2.0+ direction occasionally discussed in project context), translation licensing requires explicit revisit. v1 and v1.1 are within scope.

### 3.2 Secondary cross-check — Orthodox Church in America (OCA)

OCA (`oca.org`) maintains canonical English translations of the great-feast troparia and the eight Resurrectional tones, freely accessible. OCA's translation register is slightly more archaic than GOA DCS (it preserves "Thee/Thou" in some texts) but is theologically equivalent. C6 authoring uses OCA as a cross-check on every GOA DCS rendering, and notes where the two diverge in render_note metadata so future readers can see the editorial trail.

### 3.3 Fallback only — Holy Cross Orthodox Press

Holy Cross Orthodox Press service books are the gold-standard scholarly Orthodox liturgical translations in English, but they are commercially licensed publications. C6 authoring uses Holy Cross *only* for hymns where neither GOA DCS nor OCA provides a free rendering. v1 corpus is expected to draw 100% from GOA DCS + OCA; Holy Cross fallback is reserved as a contingency.

### 3.4 Sources explicitly NOT used

- Protestant or generic-ecumenical translations (categorically excluded — see §1)
- AI-generated translations (theologically irresponsible for canonical liturgical text)
- Folk-translation websites of uncertain provenance (license uncertain; accuracy uncertain)
- Wikipedia or general reference sites (not authoritative for liturgical content)

### 3.5 Per-entry attribution

Every hymn corpus entry carries a `source` object naming the primary translation source, the secondary cross-check source, the URL or citation, and a free-text `render_note` capturing any editorial decision (e.g., "GOA DCS uses 'Loving One'; OCA uses 'Lover of Mankind'; authored as 'Lover of Mankind' per parish use at St. Demetrios"). The source attribution is consumed by the C6 author and by any future review; it does not surface to Nolan.

---

## 4. POLYTONIC GREEK TEXT DISCIPLINE

Every Greek text in the v1 corpus is verified polytonic per codepoint. This is the same discipline applied to the D6 chrismation certificate (the *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* formula) and D7 baptism certificate (the *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ…* formula, including the Υἱοῦ rough-breathing-on-iota correction caught in Phase 2 review).

### 4.1 Polytonic versus monotonic — why it matters

Modern Greek as written on most of the open web is **monotonic** — a single acute-accent system adopted by the Greek state in 1982 for civil use. The Orthodox Church uses **polytonic** — the historic system with acute, grave, and circumflex accents; smooth and rough breathings; the iota subscript on long vowels; and the diaeresis where needed. Liturgical Greek is invariably published in polytonic form; service books, parish bulletins, and the Digital Chant Stand all use polytonic.

Concrete example:

| Form | Text |
|---|---|
| Monotonic (modern civil Greek) | Χριστός ανέστη εκ νεκρών… |
| Polytonic (liturgical Greek) | Χριστὸς ἀνέστη ἐκ νεκρῶν… |

The polytonic form carries the marks of breathing (the smooth breathing on ἀ and ἐ) and the historical accent shift (Χριστὸς grave, not acute, because followed by ἀνέστη without intervening punctuation). The monotonic form drops these distinctions. For the Expedition's catechetical purpose, polytonic is correct because it is what Nolan will see in the parish service book and in Orthodox liturgical texts for the rest of his life.

### 4.2 Codepoint verification process (C6 will execute)

For each Greek text in the corpus, the C6 content author:

1. Sources the canonical polytonic form from GOA DCS (primary).
2. Cross-checks against OCA where available.
3. For each Greek glyph carrying a diacritic, inspects the codepoint against the Unicode Greek and Greek Extended ranges:
   - U+0370–U+03FF (Greek and Coptic)
   - U+1F00–U+1FFF (Greek Extended — polytonic diacritics)
4. Verifies specifically: smooth breathing (psili, U+1F00 family) vs rough breathing (dasia, U+1F01 family); acute (oxia) vs grave (varia); circumflex (perispomeni); iota subscript on long vowels (the most commonly dropped diacritic in non-liturgical sources).
5. Captures the verified codepoint string in a `render_note` field if any glyph required adjudication (mirrors the D7 Υἱοῦ correction practice).

**Canonical-equivalent codepoints (Unicode normalization note):** The simple-vowel-with-acute glyphs have two valid codepoints each under polytonic Greek — the modern *tonos* form (U+03AC `ά`, U+03AD `έ`, U+03AE `ή`, U+03AF `ί`, U+03CC `ό`, U+03CD `ύ`, U+03CE `ώ`) and the legacy *oxia* form (U+1F71, U+1F73, U+1F75, U+1F77, U+1F79, U+1F7B, U+1F7D). These pairs are **canonically equivalent** under Unicode NFC normalization; GFS Neohellenic renders them identically. C6 author normalizes to whichever form GOA DCS emits in the source page (typically tonos); the corpus uses one form consistently per file for reviewability. Also note the punctuation distinction: liturgical Greek semicolon-equivalent is the **ano teleia** U+0387 (`·`), NOT the Latin middle dot U+00B7 — these glyphs are visually identical but semantically distinct, and the corpus uses U+0387 inside Greek text and U+00B7 only inside English-context attribution separators.

### 4.3 Rendering — GFS Neohellenic via `unicode-range`

The polytonic font is already font-asset-landed via Chat 22 per `COMIC_DESIGN_BRIEF.md` §11.5. GFS Neohellenic engages automatically for Greek and Greek Extended codepoints via the `unicode-range` fallthrough already declared in the `--font-body` stack. The hymn surface inherits the rendering automatically without any per-surface @font-face declaration; the woff2 file is already in `sw.js` STATIC_ASSETS from v50.

The certificate surfaces (D6/D7) use scoped-local @font-face declarations per the Chat 22 CATCH-3 pattern to avoid global `--font-body` variable contamination. The hymn surface, because it operates within the regular app shell, uses the global stack — Greek codepoints fall through to GFS Neohellenic automatically; non-Greek codepoints render in Crimson Text.

---

## 5. SURFACE ARCHITECTURE

Per OQ-1 ruling, the hymn surface lives inline within three existing surfaces. There is no `/hymns.html` standalone page in v1.

### 5.1 Saint card modal — apolytikion render slot (v1.1)

The saint card modal (`js/saint-cards.js`, `_buildCardHTML`) builds its HTML as a linear sequence: head → icon → name → honorific → body (life_story) → callouts → foot. A new render slot lands between `.sc-card-body` and `.sc-callouts`:

```
.sc-card-body              (existing — life_story prose)
.sc-card-apolytikion       (NEW — slot for saint's apolytikion, when present)
.sc-callouts               (existing — iconography callouts)
```

The slot renders only when the saint's corpus entry includes a non-null `apolytikion` field. This requires:

- An additive extension to the saint corpus JSON schema: each saint entry gains an optional `apolytikion` field referencing a hymn slug, or `null`. The schema change is forward-compatible — saint cards without the field render as today.
- A render slot in `_buildCardHTML` that fetches the apolytikion from `window.HymnsStatic.getBySaintSlug(saint.slug)` and renders the hymn block per §6 below.
- Defers to v1.1 (after C6c authoring) so the saint corpus extension and the apolytikion content land in the same release.

### 5.2 Feast-of-the-week card — apolytikion + kontakion expandable block (v1)

The feast-of-the-week card (`js/feast-of-week.js`, mounted at `#feast-of-week-mount` on `curriculum.html`) currently renders as a Cinzel-headed eyebrow card showing the principal feast for the current Sunday-anchored week. A new block lands beneath the feast name when the feast has a corpus apolytikion (matched by date):

```
.fw-card                   (existing)
  .fw-name                 (existing — feast name)
  .fw-saints               (existing — saint commemorations row)
  .fw-hymns                (NEW — apolytikion + kontakion, tap-to-expand)
```

The hymn block is collapsed by default (showing only "✦ The hymn of this feast"); tap expands to reveal the full apolytikion + kontakion rendered per §6 below. The tap-to-expand pattern keeps the eyebrow card visually concise on first paint while making the hymns one tap away.

The match key is the feast date. `HymnsStatic.getByFeastDate(dateKey)` returns `{apolytikion, kontakion} | null`. For the 13 fixed and movable great feasts plus Pascha, the date-to-slug mapping lives in the corpus loader; movable feast dates are computed once at corpus load relative to the Pascha 2026 anchor (and re-derive yearly).

### 5.3 Sunday cell tone display — home liturgical calendar drawer (v1)

The home Liturgical Calendar drawer (`js/liturgical-calendar-home.js`) renders one cell per day, with the Sunday cell currently showing the Sunday name and feast information. A new tone subscript lands on Sunday cells during Ordinary Time:

```
.lc-card-day-name          (existing — "Sunday, May 31")
.lc-card-feast-name        (existing — "Holy Pentecost")
.lc-card-tone              (NEW — "Tone N · ✦ Tap for the hymn of the week")
```

The tone subscript appears only when `HymnsStatic.getTone(dateKey)` returns a non-null tone number (see §7 — tone is suspended during Bright Week, Pentecostarion, Triodion, and great-feast windows). Tap on the cell reveals the Resurrectional troparion + kontakion of that tone in a small drop-down panel rendered per §6 below.

### 5.4 What does not change

- No new bottom-nav tab. Nav stays at five tabs (Home / Missions / Topics / Scriptures / Field Manual).
- No new HTML files. All three surfaces mount via JS extensions to existing modules.
- No new Supabase schema. Corpus is pure JSON per OQ-6 ruling.

---

## 6. DISPLAY REGISTER

This section codifies the **Category 1 / Category 2 register split** for canonical Greek liturgical text. Per the orchestrator's OQ-5 ruling, the Category extension applies beyond D9 scope to all future long-form Greek liturgical content (Lenten Triodion, Pentecostarion, the Cherubic Hymn, the Akathist, etc.); a post-launch repo-audit chat will fold this section back into `COMIC_DESIGN_BRIEF.md` §11.6 itself so future dispatches read the canonical version (Op Learning #27).

### 6.1 Category 1 — short canonical Greek phrases

**Scope:** canonical Greek phrases inside character dialogue (Marginalia / Vita Strip / Field Journal speech), inside certificate sacramental formulas, inside saint card iconography Lesson 5 inscriptions, or anywhere else a phrase of ~10 words or fewer appears as a register-marker in otherwise English content.

**Examples cited in current canonical specs:**
- `Χριστὸς ἀνέστη! / Ἀληθῶς ἀνέστη!` (Pascha exclamation — `COMIC_DESIGN_BRIEF.md` §11.7)
- `Δόξα τῷ Θεῷ` (closing doxology — §11)
- `Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου` (chrismation formula — D6)
- `Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ…` (baptism formula — D7)
- `Κύριε ἐλέησον`, `Ἄξιος`, `Καλώς όρισες` (§11 enumerated)

**Render treatment** (`COMIC_DESIGN_BRIEF.md` §11.6 as written, unchanged):

| Property | Greek line | English caption beneath |
|---|---|---|
| Face | GFS Neohellenic (via unicode-range) | Crimson Text Italic |
| Size | 1.15× of surrounding body text | 0.85× of surrounding body text |
| Color | Body ink (`#3A2817`); Byzantine Gold for Pascha exclamation only | Body ink at 80% opacity |
| Weight | Regular | Italic |
| Alignment | Center-aligned | Center-aligned beneath the Greek |
| Vertical gap | — | 4–6px beneath Greek |

The Greek dominates visually; the English sits beneath as gloss. This is the right treatment for a 4-word phrase a 10-year-old can absorb as a single visual unit.

### 6.2 Category 2 — long-form liturgical hymn texts (NEW IN D9)

**Scope:** apolytikia, kontakia, troparia, and any other multi-line liturgical hymn text running ~20 words or more. The D9 corpus is entirely Category 2.

**Why a new tier:** The `COMIC_DESIGN_BRIEF.md` §11.6 examples are all 1–4 words. A 10-year-old can absorb a 4-word polytonic phrase as a visual unit; he cannot read 80 words of polytonic Greek and absorb meaning. The §11.6 treatment (Greek primary, English smaller as gloss) breaks the cognitive accessibility model for long-form hymnody. The Category extension preserves the §11.6 register-marker discipline (Greek IS present and visible as the source language) while inverting the visual hierarchy to make the English the readable surface for Nolan.

**Render treatment** (D9 §6.2 canonical):

| Property | English line(s) — PRIMARY | Greek line(s) — REGISTER-MARKER |
|---|---|---|
| Face | Crimson Text Regular | GFS Neohellenic (via unicode-range) |
| Size | 1.0em of surrounding body text | 0.92em of surrounding body text |
| Color | Body ink `#3A2817`; Byzantine Gold `#C9A84C` for `paschal-troparion` slug ONLY (defense-in-depth) | Same color as paired English line |
| Weight | Regular | Italic |
| Alignment | Left-aligned for prose flow; center-aligned for ceremonial framing | Center-aligned beneath the English |
| Vertical gap | — | 8px beneath English, 12–16px above source attribution |
| Line height | 1.5 | 1.4 (tighter, because register-marker tier) |
| Opacity | 100% | 78% (register-marker subordination) |

The English block reads first and primary. The Greek polytonic block beneath reads as the source-language marker — visually subordinated but unmistakably present. A small source attribution line sits beneath both (e.g., "*Apolytikion of Holy Pentecost · Greek Orthodox Archdiocese*"), in Crimson Text Italic 0.78em, body ink at 60% opacity.

### 6.3 Pascha-gold reservation (extended in D9 §6.3)

Per `COMIC_DESIGN_BRIEF.md` §11.7, Byzantine Gold `#C9A84C` is reserved exclusively for the resurrection exclamation. In D9 the reservation is **extended to the full text of the Paschal Troparion** (both the English and Greek lines, full body, not only the opening exclamation). The extension is theologically coherent — the full troparion *is* the resurrection exclamation expanded into its complete liturgical form.

**Defense-in-depth enforcement** (engineering dispatch implements): the consumer renderer hardcodes gold-eligibility to `slug === 'paschal-troparion'`. Any `gold: true` flag drift in other JSON entries is ignored at render time; only the canonical Paschal Troparion slug receives gold. This mirrors the Chat 23 `.fj-greek` inline `color: #3A2817 !important` enforcement of the chrismation-formula body-ink rule.

The Paschal Kontakion (slug `paschal-kontakion`), though paschal in content, renders in body ink per §6.2. Gold is reserved for the troparion only because the troparion is the canonical exclamation. Diluting gold across paschal hymns generally would cheapen the treatment — the same reasoning §11.7 already articulated for other Greek phrases.

---

## 7. TONE-OF-THE-WEEK COMPUTATION

Per OQ-3 ruling, tone-of-the-week is computed at runtime in JavaScript. No database storage. The algorithm is a deterministic function of date relative to a per-year Pascha anchor.

### 7.1 Algorithm

```
HymnsStatic.getTone(dateKey)  →  tone number 1..8  |  null

  1. Resolve dateKey to a Date in America/New_York (existing WeekUtils
     pattern; consistent with Op Learning #7 ET-alignment).

  2. Determine liturgical phase:
       a. Pascha date table lookup (hardcoded in module, 2026–2030).
       b. If date is in [Pascha, Pascha + 6]:        return null  (Bright Week)
       c. If date is in [Pascha + 7, Pentecost]:     return null  (Pentecostarion)
       d. If date is in [Pentecost + 1, Pentecost + 6]: return null  (Trinity Week — no tone yet)
       e. If date is in Triodion period
          [10th Sunday before Pascha, Pascha − 1]:   return null  (Triodion)
       f. If date falls on or within a great-feast afterfeast window
          where the festal cycle displaces the tone: return null
          (rare; see 7.3 great-feast exceptions)
       g. Otherwise — Ordinary Time:
            weeks_since_pentecost = floor((date − Pentecost) / 7)
            tone = ((weeks_since_pentecost - 1) mod 8) + 1
            return tone  (1..8)
```

### 7.2 Pascha anchor table 2026–2030

```javascript
const PASCHA = {
  2026: '2026-04-12',
  2027: '2027-05-02',
  2028: '2028-04-16',
  2029: '2029-04-08',
  2030: '2030-04-28'
};
```

Beyond 2030 the table extends as the corpus matures. Each year's Pentecost = Pascha + 49 days. The module recomputes both per `dateKey`.

### 7.3 Great-feast exceptions

When a Sunday falls on or within the principal afterfeast window of a great feast, the tone display is suppressed in favor of the festal hymns. For v1 the simplest rule: if the Sunday cell's `feast_rank === 'great'`, suppress the tone subscript and show the festal hymn block instead. This covers the cases that matter (a "Tone 3" subscript on Holy Pentecost Sunday would be liturgically incorrect — Pentecost is sung in its own proper hymns).

### 7.4 Worked spot-checks

For C6 + engineering review:

| Date | ET day | Phase | Expected `getTone()` |
|---|---|---|---|
| 2026-04-12 | Sunday | Pascha | `null` (Bright Week start) |
| 2026-04-19 | Sunday | Pentecostarion (Thomas Sunday) | `null` |
| 2026-05-31 | Sunday | Pentecost | `null` (great feast) |
| 2026-06-07 | Sunday | Ordinary Time, week 1 | **Tone 1** |
| 2026-06-14 | Sunday | Ordinary Time, week 2 | **Tone 2** |
| 2026-08-02 | Sunday | Ordinary Time, week 9 | **Tone 1** (cycle reset) |
| 2026-08-15 | Saturday | Dormition great feast | `null` (festal) |
| 2027-02-21 | Sunday | Sunday of the Publican and Pharisee | `null` (Triodion start) |

The first surface-visible tone in the launch window is **Tone 1 on Sun Jun 7, 2026** — the first Sunday after Pentecost. This is three weeks after the May 18 launch.

### 7.5 Out of scope for v1

The Octoechos cycle is "active" only ~30 weeks/year (Ordinary Time). The other ~22 weeks the surface shows festal hymns, Pentecostarion hymns (deferred to v1.1), or Triodion hymns (deferred to v1.1) where they exist, or no tone display at all. This is honest scope; PB-4 acknowledged.

---

## 8. CORPUS SHAPE

Per OQ-6 ruling, pure JSON corpus at `/docs/content/hymns/`. Three files per §2 (two ship in v1; one defers to v1.1).

### 8.1 Top-level shape (per file)

```json
{
  "version": "v1",
  "corpus_id": "festal-hymns-v1",
  "title": "Festal Apolytikia and Kontakia",
  "authored": "2026-06-XX",
  "schema_ref": "/docs/design/hymns-troparia-surface.md §8",
  "voice_anchor": "Greek Orthodox Archdiocese Digital Chant Stand (primary); OCA (cross-check)",
  "architecture_locks_honored": [
    "D1 §1.4 witness-only (no character speaker on hymn surface)",
    "D1 §1.6 — Category 1 dialogue phrases unchanged; D9 §6.2 introduces Category 2 long-form treatment",
    "D1 §11.7 — Pascha-gold reservation extended to full Paschal Troparion per D9 §6.3"
  ],
  "entries": [ ... ]
}
```

### 8.2 Per-entry shape

```json
{
  "slug": "apolytikion-pentecost",
  "kind": "apolytikion",
  "scope": "feast:movable:pentecost",
  "english": "Blessed are You, O Christ our God…",
  "greek": "Εὐλογητὸς εἶ, Χριστὲ ὁ Θεὸς ἡμῶν…",
  "tone": 8,
  "gold": false,
  "source": {
    "primary": "Greek Orthodox Archdiocese Digital Chant Stand",
    "primary_url": "https://dcs.goarch.org/...",
    "cross_check": "Orthodox Church in America",
    "cross_check_url": "https://oca.org/...",
    "license_note": "Worship-use grant; non-commercial single-family catechetical use"
  },
  "audio": null,
  "render_note": "Per D9 §6.2 Category 2 rendering: English primary, Greek polytonic beneath as register-marker. Per D9 §6.3: gold:false enforced (only paschal-troparion slug is gold-eligible)."
}
```

Field semantics:

- `slug` — stable identifier; never changes after launch (becomes referenced from saint corpus, festal calendar, tone resolver).
- `kind` — `"apolytikion" | "kontakion" | "troparion"`.
- `scope` — string in the form `tone:N` | `feast:fixed:MM-DD` | `feast:movable:NAME` | `saint:SLUG`. The corpus loader parses this to populate the lookup indices.
- `english` — primary display text; multi-line allowed via `\n` separators.
- `greek` — polytonic Greek; multi-line allowed via `\n` separators.
- `tone` — integer 1–8 OR `null`. For Resurrectional hymns, the tone of the hymn itself. For festal hymns, the canonical tone the apolytikion is composed in (e.g., Paschal Troparion is Tone 5; Pentecost apolytikion is Tone 8) — surfaced as small subscript metadata, not as a behavioral driver.
- `gold` — boolean. Authored as `true` only on `paschal-troparion`; renderer enforces hardcoded eligibility (defense-in-depth per §6.3).
- `source` — attribution object per §3.
- `audio` — `null` OR audio object per §9.
- `render_note` — free text; consumed by C6 author and any future review; never surfaces to Nolan.

### 8.3 Loader module — `js/hymns-static.js`

Mirrors `js/field-journal-static.js` byte-for-byte where semantics match. IIFE-wrapped namespace; public API:

```
window.HymnsStatic = {
  loadCorpus()             → async; idempotent; fail-soft 404/parse/network
  getBySlug(slug)          → entry | null
  getByFeastDate(dateKey)  → { apolytikion, kontakion } | null
  getByTone(tone)          → { troparion, kontakion } | null
  getBySaintSlug(slug)     → entry | null  (v1.1 — saint apolytikia tier)
  getTone(dateKey)         → tone number 1..8 | null  (per §7 algorithm)
}
```

`loadCorpus()` fetches all three JSON files in parallel (parallel `fetch` then `Promise.all`); v1 fetches only two files since `saint-apolytikia-v1.json` is not yet authored. The third fetch returns gracefully when the file 404s (Op Learning #13 graceful absence).

---

## 9. AUDIO LAYER SCAFFOLD

Per OQ-4 ruling and the orchestrator's clarification: **the audio scaffold lands in v1 engineering. Audio population is a parallel Kevin-curation workstream over v1.1 weeks via direct JSON commits — no engineering dispatch needed per addition.**

### 9.1 JSON shape for `audio` field

Three valid forms:

```json
"audio": null
```

```json
"audio": {
  "kind": "linkout",
  "url": "https://www.ancientfaith.com/podcasts/...",
  "attribution": "Ancient Faith Radio",
  "license_note": "Free streaming; non-commercial use",
  "duration_seconds": 92
}
```

```json
"audio": {
  "kind": "mp3",
  "url": "/Orthodox-Expedition-/assets/audio/hymns/paschal-troparion.mp3",
  "attribution": "Saint Anthony's Monastery, Florence AZ",
  "license_note": "Released as Public Domain on archive.org",
  "duration_seconds": 47
}
```

Fourth form (reserved for ceremonial hymns where the visual matters):

```json
"audio": {
  "kind": "embed",
  "url": "https://www.youtube.com/embed/...",
  "attribution": "Mt. Athos Monastery YouTube channel",
  "license_note": "Public channel; embed permission granted by channel TOS",
  "duration_seconds": 73
}
```

### 9.2 Renderer behavior

When `audio === null`: no listen affordance rendered. Hymn block displays text-only.

When `audio` is non-null: a small "▶ Listen" affordance renders beneath the hymn block. Tap behavior depends on `kind`:

- `linkout` → opens URL in new tab (`target="_blank" rel="noopener noreferrer"`)
- `mp3` → inline HTML `<audio controls>` element rendered with the URL
- `embed` → expands an inline iframe rendered lazily on first tap

### 9.3 Realistic v1.1 coverage targets

| Hymn category | Likely coverage |
|---|---|
| Paschal Troparion | ~100% |
| 12 great feast apolytikia | ~80% |
| 12 great feast kontakia | ~60% |
| 8 Resurrectional troparia | ~70% |
| 8 Resurrectional kontakia | ~50% |
| Saint apolytikia (v1.1) | ~40% |
| **Aggregate** | **~55–65%** |

Within the May 14 audio-landscape audit band. Kevin populates incrementally; no dispatch needed per add.

### 9.4 License discipline

Kevin curates per source. Linkout to publicly-streaming Orthodox sources is always safe. Self-hosted MP3 is restricted to explicitly Public-Domain or explicit-redistribution-license sources (archive.org Public-Domain releases; monastery-released CC0 recordings). Commercial recordings (GOA, Holy Cross commercial chant CDs) are NOT self-hosted; linkout only if the source has a public web stream.

---

## 10. ENGINEERING SURFACES

Per-file change list for the worker engineering dispatch.

### 10.1 New files

- `/js/hymns-static.js` — IIFE-wrapped module per §8.3; mirrors `js/field-journal-static.js`.
- `/docs/content/hymns/resurrectional-tones-v1.json` — authored by C6.
- `/docs/content/hymns/festal-hymns-v1.json` — authored by C6.

### 10.2 Modified files

- `/js/saint-cards.js` — `_buildCardHTML` gains apolytikion render slot between `.sc-card-body` and `.sc-callouts`. New CSS classes `.sc-card-apolytikion`, `.sc-card-apolytikion-english`, `.sc-card-apolytikion-greek`, `.sc-card-apolytikion-source`. Render slot is no-op when `HymnsStatic.getBySaintSlug(saint.slug)` returns `null` (graceful absence). v1.1-active; v1 inert.
- `/js/feast-of-week.js` — render path gains `.fw-hymns` block; tap-to-expand interaction; new CSS classes `.fw-hymns-collapsed`, `.fw-hymns-expanded`, `.fw-hymns-apolytikion`, `.fw-hymns-kontakion`. Render is no-op when `HymnsStatic.getByFeastDate(date)` returns `null`.
- `/js/liturgical-calendar-home.js` — Sunday cell render gains `.lc-card-tone` subscript; new CSS classes `.lc-card-tone`, `.lc-card-tone-active`. Tap reveals inline tone-of-week drop-down panel. Render is no-op when `HymnsStatic.getTone(date)` returns `null`.
- `/sw.js` — bump to v52+. STATIC_ASSETS gains three precache entries: `/js/hymns-static.js`, `/docs/content/hymns/resurrectional-tones-v1.json`, `/docs/content/hymns/festal-hymns-v1.json`.

### 10.3 HTML files — no markup changes

`home.html`, `curriculum.html`, `journal.html`, `missions.html`, `bible-reader.html`, `prayers.html`, `memorization.html`, `week.html`, `admin.html` — none touched. All mounts happen via JS extensions to existing modules at existing mount points.

### 10.4 Supabase — no schema changes

Per OQ-6 ruling. The hymn corpus is JSON-only.

### 10.5 Service worker bump rationale

v52 is the next free integer past v51 (Chat 23 Field Journal). The bump is required because three new files enter STATIC_ASSETS for precache (consistent with project convention — runtime-cached files like `/games/*` do not require bump; precached static files do).

### 10.6 Test surfaces (engineering dispatch QA)

- Saint card opens with apolytikion render slot inert in v1 (no JSON yet); slot activates in v1.1 after C6c.
- Feast-of-week card on `curriculum.html` shows festal apolytikion + kontakion tap-to-expand for every great feast in the year.
- Home LC drawer Sunday cell shows correct tone for the 8 spot-check dates in §7.4.
- Pascha-gold enforcement: any `gold: true` flag in JSON entries other than `paschal-troparion` is ignored; only the canonical slug renders gold.
- GFS Neohellenic engages on Greek codepoints; iota subscripts, circumflexes, breathing marks all visually correct on Nolan's iPad.
- Offline behavior: PWA installed fresh, no network, all three surfaces render hymn content from precache.

---

## 11. EXAMPLES — THREE FULL HYMNS

Three full hymn entries authored in canonical form. C6 will author the remaining 39 hymns following the same pattern. Polytonic accent verification documented per §4.

### 11.1 Paschal Troparion (Tone 5, Pascha-gold)

**Slug:** `paschal-troparion`
**Tone:** 5 (Plagal First)
**Scope:** `feast:movable:pascha`

**English (primary display):**

> Christ is risen from the dead,
> trampling down death by death,
> and to those in the tombs granting life.

**Greek polytonic (register-marker beneath):**

> Χριστὸς ἀνέστη ἐκ νεκρῶν,
> θανάτῳ θάνατον πατήσας,
> καὶ τοῖς ἐν τοῖς μνήμασι ζωὴν χαρισάμενος.

**Polytonic accent verification:**

- `Χριστὸς` — grave on omicron (U+1F78) because followed by `ἀνέστη` without intervening punctuation
- `ἀνέστη` — smooth breathing on alpha (ἀ, U+1F00); acute on epsilon (έ, U+03AD)
- `ἐκ` — smooth breathing on epsilon (ἐ, U+1F10)
- `νεκρῶν` — circumflex on omega (ῶ, U+1FF6)
- `θανάτῳ` — acute on second alpha (ά, U+03AC); iota subscript on omega (ῳ, U+1FF3)
- `θάνατον` — acute on first alpha (ά)
- `πατήσας` — acute on eta (ή, U+03AE)
- `καὶ` — grave on the iota of the αι diphthong (ὶ, U+1F76)
- `τοῖς` — circumflex on the iota of the οι diphthong (ῖ, U+1FD6)
- `ἐν` — smooth breathing on epsilon
- `μνήμασι` — acute on eta
- `ζωὴν` — grave on eta (ὴ, U+1F74) because followed by `χαρισάμενος`
- `χαρισάμενος` — acute on second alpha

**Render note:** Per D9 §6.3, this is the SOLE Pascha-gold hymn. Both the English and Greek lines render in Byzantine Gold `#C9A84C`. Consumer renderer hardcodes gold-eligibility to this slug; any `gold: true` flag elsewhere in the corpus is ignored.

**Source:** Greek Orthodox Archdiocese Digital Chant Stand (primary); Orthodox Church in America (cross-check). The Greek text is identical across both sources. The English rendering follows the GOA DCS form; OCA renders the closing as "granting life" identically.

**Audio (v1 scaffold):** `null` — Kevin will populate post-engineering with a Saint Anthony's Monastery recording.

### 11.2 Apolytikion of Holy Pentecost (Tone 8)

**Slug:** `apolytikion-pentecost`
**Tone:** 8 (Plagal Fourth)
**Scope:** `feast:movable:pentecost`

**English (primary display):**

> Blessed are You, O Christ our God,
> Who made fishermen all-wise
> by sending down upon them the Holy Spirit,
> and through them drawing the world into Your net.
> O Lover of mankind, glory to You!

**Greek polytonic (register-marker beneath):**

> Εὐλογητὸς εἶ, Χριστὲ ὁ Θεὸς ἡμῶν,
> ὁ πανσόφους τοὺς ἁλιεῖς ἀναδείξας,
> καταπέμψας αὐτοῖς τὸ Πνεῦμα τὸ Ἅγιον,
> καὶ δι᾽ αὐτῶν τὴν οἰκουμένην σαγηνεύσας·
> φιλάνθρωπε, δόξα σοι.

**Polytonic accent verification (selected):**

- `Εὐλογητὸς` — smooth breathing on upsilon of the diphthong (ὐ, U+1F50); grave on omicron
- `εἶ` — smooth breathing + circumflex on iota of εἰ diphthong (ἶ, U+1F36)
- `Χριστὲ` — grave on epsilon (ὲ, U+1F72)
- `ὁ` — rough breathing on omicron (ὁ, U+1F41), recurring three times in this hymn
- `Θεὸς` — grave on omicron
- `ἡμῶν` — rough breathing on eta (ἡ, U+1F21); circumflex on omega
- `πανσόφους` — acute on omicron (ό, U+03CC)
- `τοὺς` — grave on upsilon of ου diphthong (ὺ, U+1F7A)
- `ἁλιεῖς` — rough breathing on alpha (ἁ, U+1F01); circumflex on iota of εῖ diphthong
- `Πνεῦμα` — circumflex on upsilon of εῦ diphthong (ῦ, U+1FE6)
- `Ἅγιον` — rough breathing + acute on capital alpha (Ἅ, U+1F0D)
- `δι᾽` — Greek koronis as elision mark (᾽, U+1FBD)
- `οἰκουμένην` — smooth breathing on iota of οἰ diphthong (ἰ, U+1F30)
- The Greek punctuation `·` is the ano teleia (U+0387), Greek's high-dot, semantic equivalent of a semicolon

**Render note:** Category 2 long-form treatment per §6.2. English primary, Greek beneath at 0.92em GFS Neohellenic italic, 78% ink opacity. `gold: false`. Source attribution line beneath both: "*Apolytikion of Holy Pentecost · Greek Orthodox Archdiocese Digital Chant Stand*".

**Source:** GOA DCS (primary); OCA (cross-check). The English rendering follows the GOA DCS form. OCA renders the closing as "O Lover of mankind, glory to You" identically; some parish renderings use "Loving One" or "Friend of mankind" — these are translation-register variants of the same Greek `φιλάνθρωπε`.

**Audio:** `null` in v1; Kevin to populate.

### 11.3 Resurrectional Troparion of Tone 1

**Slug:** `resurrectional-troparion-tone-1`
**Tone:** 1 (First)
**Scope:** `tone:1`

**English (primary display):**

> When the stone had been sealed by the Jews,
> and the soldiers were guarding Your most pure body,
> You arose on the third day, O Savior,
> granting life to the world.
> For which cause the Powers of heaven cried out to You, O Giver of Life:
> "Glory to Your resurrection, O Christ!
> Glory to Your kingdom!
> Glory to Your dispensation, O only Lover of mankind!"

**Greek polytonic (register-marker beneath):**

> Τοῦ λίθου σφραγισθέντος ὑπὸ τῶν Ἰουδαίων,
> καὶ στρατιωτῶν φυλασσόντων τὸ ἄχραντόν σου σῶμα,
> ἀνέστης τριήμερος Σωτήρ,
> δωρούμενος τῷ κόσμῳ τὴν ζωήν.
> Διὰ τοῦτο αἱ Δυνάμεις τῶν οὐρανῶν ἐβόων σοι, Ζωοδότα·
> Δόξα τῇ ἀναστάσει σου Χριστέ,
> δόξα τῇ Βασιλείᾳ σου,
> δόξα τῇ οἰκονομίᾳ σου, μόνε Φιλάνθρωπε.

**Polytonic accent verification (selected):**

- `Τοῦ` — circumflex on upsilon of ου diphthong (ῦ, U+1FE6)
- `λίθου` — acute on iota
- `σφραγισθέντος` — acute on epsilon (έ)
- `ὑπὸ` — rough breathing on upsilon (ὑ, U+1F51); grave on omicron
- `Ἰουδαίων` — capital iota with smooth breathing (Ἰ, U+1F38); acute on iota of αί diphthong
- `στρατιωτῶν` — circumflex on omega
- `τὸ ἄχραντόν` — smooth breathing + acute on alpha (ἄ, U+1F04); enclitic-induced second acute on omicron of `ἄχραντόν` (the rule of enclitics, because `σου` follows)
- `ἀνέστης` — smooth breathing on alpha; acute on epsilon
- `τριήμερος` — acute on eta
- `Σωτήρ` — acute on eta
- `δωρούμενος` — acute on upsilon of ού diphthong (ύ, U+03CD)
- `τῷ` — circumflex with iota subscript on omega (ῷ, U+1FF7)
- `κόσμῳ` — acute on omicron; iota subscript on omega (ῳ, U+1FF3)
- `τὴν` — grave on eta
- `Διὰ` — capital delta; grave on alpha (ὰ, U+1F70)
- `αἱ` — rough breathing on iota of αι diphthong (ἱ, U+1F31)
- `οὐρανῶν` — smooth breathing on upsilon of ου diphthong; circumflex on omega
- `ἐβόων` — smooth breathing on epsilon; acute on omicron
- `τῇ` — circumflex with iota subscript on eta (ῇ, U+1FC7), recurring three times
- `Βασιλείᾳ` — acute on iota of εί diphthong; iota subscript on alpha (ᾳ, U+1FB3)
- `οἰκονομίᾳ` — smooth breathing on iota of οἰ diphthong; acute on iota; iota subscript on alpha

**Render note:** Category 2 long-form treatment. English primary, Greek beneath. `gold: false`. Source attribution: "*Resurrectional Troparion · Tone 1 · Greek Orthodox Archdiocese Digital Chant Stand*". This is the longest of the three example hymns and stress-tests the Category 2 rendering on extended text.

**Source:** GOA DCS (primary); OCA (cross-check). The English rendering follows the GOA DCS form, which renders "the Jews" — consistent with the corpus literal verified per Op Learning #5 (earlier dispatches confirmed "the Jews" in the existing reading-question corpus is the canonical liturgical phrasing in this hymn).

**Audio:** `null` in v1.

---

## 12. VALIDATION GATES (engineering dispatch)

The worker engineering dispatch validates against these 14 gates before declaring complete:

1. **Markdown well-formed** — spec file parses without errors; renders cleanly in GitHub web UI.
2. **All 13 sections present** — §0 through §13 each substantive.
3. **JSON corpus parses** — both `resurrectional-tones-v1.json` and `festal-hymns-v1.json` parse as valid JSON; pass JSON Schema validation against the §8.2 per-entry shape.
4. **Polytonic accent integrity** — every Greek text in corpus verified per §4.2 codepoint inspection. C6 captures per-hymn verification in `render_note`.
5. **Per-OQ ruling honored** — each of OQ-1 through OQ-6 cited where it lands in spec; engineering implementation honors each.
6. **Architecture-lock alignment** — §1.4 witness-only (UI framing); §1.6 → §6.1 Category 1 unchanged; §6.2 Category 2 introduced; §11.7 → §6.3 Pascha-gold extended; §1.7 / §1.8 not applicable (hymnody has no character speaker).
7. **Corpus scope concrete** — every hymn in v1 listed with kind, scope, source attribution.
8. **Audio scaffold cost-zero** — text-only render works completely without audio. `audio: null` produces no visual disruption. All three audio `kind` variants render correctly when populated.
9. **Three full example hymns in §11** — Paschal Troparion (gold), Apolytikion of Pentecost (festal), Resurrectional Troparion Tone 1 (tone). All in canonical polytonic form.
10. **Downstream pipeline shape** — single C6 content dispatch + single engineering dispatch confirmed per orchestrator ruling.
11. **Loader module mirror** — `js/hymns-static.js` structurally matches `js/field-journal-static.js`. IIFE; memoized `loadCorpus()`; fail-soft 404/parse/network; one `console.debug` breadcrumb on absence.
12. **Tone-of-week correctness** — algorithm verified against the 8 spot-check dates in §7.4. Bright Week, Pentecostarion, Triodion, and great-feast suppression all produce `null` correctly.
13. **No engineering shipped from D9** — D9 is DESIGN ONLY. No code, no Supabase writes, no asset uploads. C6 + engineering dispatches follow.
14. **Word count plan-vs-actual** — per §0 plan ~5500–7000 words; actual count reported in completion summary.

---

## 13. OPEN QUESTIONS DEFERRED TO v1.1 / v1.x

The following are intentionally out of D9 scope; surfaced so future dispatches can pick them up cleanly.

**Saint Apolytikia (C6c, v1.1)** — 15 saint apolytikia coupled to the saints corpus. Fires alongside the next saints-corpus expansion (Topic 1 saints arrival). The saint card modal render slot is engineered in v1 but inert until v1.1 content lands.

**Lenten Triodion Proper Hymns (v1.x)** — ~30 entries spanning the 10-week Triodion period (Sunday of the Publican and Pharisee through Holy Saturday). Includes the great prokeimena, Sunday-by-Sunday troparia, and the Bridegroom service hymns. Authored as a separate corpus file `/docs/content/hymns/triodion-v1.json`.

**Pentecostarion Sundays Proper Hymns (v1.x)** — ~7 entries (Thomas Sunday, Sunday of the Myrrhbearers, Sunday of the Paralytic, Sunday of the Samaritan Woman, Sunday of the Blind Man, Sunday of the Holy Fathers, Pentecost). Separate corpus file `/docs/content/hymns/pentecostarion-v1.json`.

**Audio Coverage Roadmap (v1.1)** — Kevin populates incrementally per §9. No engineering dispatch needed per addition. Target aggregate ~55–65% v1.1 coverage.

**Browseable `/hymns.html` Library (v1.x or never)** — defer until Nolan asks for it organically. The "Today" companion surface (Addition 3) provides aggregation when it ships; a standalone library is not a v1 priority and may never be a priority.

**Admin Authoring UI (v2.x)** — if multi-family scope ever ships, an admin authoring UI for hymn corpus edits would replace direct-PR-to-JSON authoring. v1 and v1.1 do not need this.

**Octoechos Daily Cycle (v2.x)** — beyond the Sunday Resurrectional troparia, the full Octoechos includes per-weekday hymns (Tuesday: Forerunner; Wednesday: Cross; Thursday: Apostles; Friday: Cross again, etc.). A daily-rotation tier expands the corpus substantially. Reserved for post-v1.1 catechetical maturation.

**Cherubic Hymn, Trisagion, Megalynaria** — the ordinary hymns of the Divine Liturgy. Authoring would couple to a possible "Liturgy companion" surface. Reserved for v2.x.

**Spec Fold-back to `COMIC_DESIGN_BRIEF.md`** — per Op Learning #27, post-launch repo-audit chat folds D9 §6 (Category 1 / Category 2 split) back into the canonical character canon at §11.6. Notion backlog item.

---

☦ Glory to God for all things.
