# COMIC-STYLE CHARACTER DIALOGUE PANELS
## Design Brief — The Orthodox Expedition

**Status:** Phase 3 + 4 convergent design brief — ground truth for engineering and content-authoring chats
**Date:** May 11, 2026
**Author:** Designer Chat D1
**Consumed by:** Future engineering dispatches, content-authoring chats, art production planning
**Pre-launch posture:** v1 ships ceremonial volume (~15–25 scenes total across all three formats); architecture scales to rhythmic (~80–100 scenes/year) without rework
**Revision history:**
  - 2026-05-11 — Initial Phase 3 + 4 convergent brief delivered
  - 2026-05-11 — Follow-up integration: §1.4 rewritten (witness-only architectural lock); §1.8 added (Mom never authored as speaker); §11 added (Greek typography treatment — GFS Neohellenic as secondary face)

---

## 0. EXECUTIVE SUMMARY

Theo and Christopher will speak inside the app through **three coexisting formats**, each occupying a distinct register and surface set:

| Format | Register | Surfaces | Volume target | Art production load |
|---|---|---|---|---|
| **Marginalia** | Devotional commentary — companions in the margin | Daily reading, memorization, prayer flow, session teaching | Rhythmic (~60–80/year) | Near-zero new art; existing portraits |
| **Vita Strip** | Iconographic narrative — sequential beats at icon-distance | Session opens/closes, feast days, sacrament weeks, welcome flow | Ceremonial (~15–25/year) | High; 3–5 small panel illustrations per scene |
| **Field Journal** | Asynchronous emotional intimacy — fellow journalers | Field Manual archive | Rare gift (~5–15/year) | Moderate; handwriting + small marginal sketches |

These three formats are **complementary, not competing**. Marginalia is the steady devotional companion. Vita Strip marks ceremonial peaks. Field Journal is the rare unexpected gift discovered in the archive. Together they give Theo and Christopher genuine voice across the app without ever flattening their relationship to Nolan into mascot-performance.

The format the system explicitly **does not include** is a cinematic single-frame ("Tent Flap") direction. That register belongs to the Q2 animated videos. Panels live where video doesn't reach, in an intimate/reflective register video can't carry.

---

## 1. CROSS-FORMAT NON-NEGOTIABLES

These rules apply to all three formats. Future chats can extend them but should not override them without a designer-chat re-engagement.

### 1.1 Speech container — hybrid parchment-scroll bubble

Every speech container in every format follows the same vocabulary:

- **Shape**: rounded rectangle with subtle scroll-edge curl on left and right ends (~6–8px of scroll texture). Not a literal unrolled scroll — legibility-first.
- **Fill**: parchment cream `#F5ECD7`, slightly lighter inside than the parchment surface it sits on (so it reads as foreground)
- **Border**: 1px Byzantine Gold `#C9A84C`, with the gold lighter (`opacity: 0.6`) than panel borders so bubbles don't compete with panel framing
- **Tail**: a small pointer extending from the bubble toward the speaker's mouth. **Tail-at-speaker is non-negotiable** — it's the comic affordance that lets a 10-year-old immediately know who's talking. Length ~12–16px, tapered, same gold border continuing around the tail outline.
- **Typography inside bubbles**: Crimson Text (matches app body font). Cinzel is never used inside speech containers — too formal/headline for what is essentially conversation. See §1.3 for character voice typography distinction.

### 1.2 Voice register — never mascot

The two characters never break their interior posture for spectacle. They do not say things only meant to entertain Nolan. They do not deliver punchlines. They do not name-drop liturgical concepts they wouldn't naturally use. They do not stop being inside their own story to perform "being characters."

The explicit drift check: **if Theo says something a Disney sidekick would say, you've drifted.** Pull back.

### 1.3 Character voice typography distinction

Theo and Christopher have visually distinct dialogue treatment so Nolan can pre-attentively tell who's speaking even before reading:

**Theo**
- Crimson Text *Italic*
- Size: `0.95em` of the surrounding body text
- Bubble fill: standard parchment `#F5ECD7`
- Bubble border: standard 1px gold `#C9A84C @ 60%`

**Christopher**
- Crimson Text Regular (upright)
- Size: `1.0em`
- Bubble fill: slightly warmer parchment `#F0E4C8` (subtly deeper)
- Bubble border: 1.5px gold `#C9A84C @ 70%` (subtly thicker, subtly more present)

The asymmetry is intentional and unstated. Theo's voice feels lighter and wonder-toned; Christopher's voice carries more weight. Nolan never has these rules explained to him; he absorbs them through the surface.

### 1.4 Posture — witness-only (architectural lock)

**Default and exclusive posture across all three formats: witness.** Theo and Christopher speak to each other; Nolan reads them the way he reads icons. The icon-tradition posture — Nolan beholds the conversation; the conversation is not directed at him.

This is locked as a v1 architectural rule. The Q2 animated videos carry motion, gaze, and direct address. The comic dialogue corpus carries stillness. The two mediums are complementary precisely because they are different mediums doing different work.

**Static-only specifically means:**
- No gaze tracking toward Nolan in any illustration, in any format
- No "looking at the reader" expressions
- No fourth-wall moments in v1
- No animated character expressions inside Vita Strip panels (the format's only reveal animation is panel-arrival, not character motion)
- Marginalia portraits remain static — no animated speaking indicators on the portrait beside an active banderole

If post-launch observation over 6+ months suggests Nolan would benefit from rare direct address, the question is revisited deliberately by a future designer chat. The default posture should be **more reverence, not less**.

### 1.5 prefers-reduced-motion compliance

Every format must respect `prefers-reduced-motion: reduce`. Bubbles appear/disappear instantly without fade. Scroll-reveal animations switch to "present on viewport entry" without easing. Panel transitions in Vita Strip become hard cuts. No format depends on motion to be intelligible.

### 1.6 Language — English-default, rare canonical Greek

Default language for all dialogue is English. Greek appears only where the **Greek IS the speech act**, not as translation:
- Canonical liturgical exclamations a character would actually say in Greek (e.g., *Χριστὸς ἀνέστη! / Christ is risen!* on Pascha; *Δόξα τῷ Θεῷ / Glory to God* at the close of a moment)
- The English follows as a quiet caption beneath, smaller, italic, never overshadowing the Greek

Conservatively rationed — 2–4 scenes per year at most. Otherwise this becomes performance.

### 1.7 Father Nicholas — deferred across all three formats

The parish-priest character is not yet visually produced and is not authored into any format in v1. When Father Nicholas v1 ships, he becomes available in all three formats following the same voice/typography conventions (with his own distinct color/border treatment yet to be designed).

### 1.8 Mom is present-in-the-world, never authored as a speaker (architectural lock)

A third recurring speaker is **not added in v1 or later**. Mom (Danyelle-coded in the family-mapping) stays present in the catechetical world but is never authored as a Marginalia, Vita Strip, or Field Journal speaker.

Reasoning: the catechetical relationship at the heart of this app is intentionally father-son. The format does its theological work precisely because that relationship is unmuddied. Adding a third recurring voice would dilute the structural premise that Theo and Christopher carry the entire dialogic register together.

**How Mom is honored without speaking:**
- Theo and Christopher can speak about her — name her, describe what she said, what she did, how she was present in a moment
- Field Journal entries are a particularly natural surface for this (e.g., the §5.4 baptism-day Theo entry: *"Mom was crying."* and Christopher's entry referencing what she said to Theo the night before)
- Marginalia and Vita Strip dialogue can reference her as part of the narrative texture without ever quoting her speech
- Illustrations in Vita Strip may include her as a present-in-frame figure, but she never receives a speech bubble

This lock applies across the full lifetime of the corpus, not just v1. Future designer chats that propose adding a Mom voice must justify why the structural premise should change.

---

## 2. FORMAT 1 — MARGINALIA (Primary daily surface)

### 2.1 Thesis recap

Banderole-in-the-margin dialogue alongside devotional content. The Gospel, the prayer, the verse, the doctrinal paragraph — those are the **center**. Theo and Christopher live in the margin, commenting, marveling, asking, anchoring. They never replace what is at the center. This is the structural role they actually occupy in Nolan's formation.

### 2.2 Visual rhythm

**Portrait treatment**
- Circular portrait, 80px diameter (mobile) / 100px (iPad landscape)
- 2px Byzantine Gold border, drop shadow `0 2px 6px rgba(27,42,74,0.15)`
- Both characters present in the margin even when only one is speaking — they're companions, not performers entering and exiting. Non-speaking character at `opacity: 0.85`; speaking character at full opacity.

**Banderole layout**
- Banderoles stack vertically between the two portraits
- Each banderole is 240–320px wide, height variable to content
- Tail points toward the corresponding portrait
- Maximum 4 banderoles per marginal exchange; typical 2–3
- Layout flows down with the central content; banderoles arrive in reading order

**Surface-specific placement**

| Surface | Marginalia placement |
|---|---|
| **Bible reader closing screen** (after Gospel read, before reflection prompt) | Right margin on iPad; below the Gospel on mobile. 2–3 banderoles. Marginalia closes; reflection prompt opens below. |
| **Memorization (weekly verse card)** | Right margin alongside the verse. 2 banderoles typical. Christopher anchors what the verse means; Theo names what's hard. |
| **Prayer flow** (post-Chat-11 continuous prayer mode) | Between prayer movements, full-width interlude band with portraits + 1–2 banderoles. Used sparingly — 1–2 prayer-flow marginalia exchanges per week, not every prayer session. |
| **Session teaching** (doctrinal paragraphs) | Right margin alongside the paragraph. Footnote-style cadence: a banderole every 2–4 paragraphs, not every paragraph. |

### 2.3 Voice rules — marginal posture

Marginal voices have a specific posture that differs from both the "Theo asks…" portrait-and-prompt pattern and from Vita Strip narrative dialogue:

**Theo in margin**
- Notices, wonders, recalls
- Half-finished thoughts are OK ("I always forget this part…")
- Asks tiny questions that aren't reflection-prompts (those go in the portrait-and-prompt pattern); these are wondering-aloud questions
- Voice cheatsheet phrases:
  - *"This is the one I keep coming back to."*
  - *"Father said the same thing last week, didn't he?"*
  - *"I don't know why this makes me want to be quiet."*
  - *"Wait — is this the part Mom showed me?"*

**Christopher in margin**
- Anchors, contextualizes, names quietly
- Never lectures. The marginal posture is not where he teaches at length — that happens in Vita Strip or in session content. Here he places one stone.
- Voice cheatsheet phrases:
  - *"The Fathers called this the Bridegroom service."*
  - *"He's saying this on the way to the cross. Remember that."*
  - *"This is what we mean by 'the same yesterday, today, and forever.'"*
  - *"That word in Greek is **theotokos** — God-bearer."*

The asymmetry: Theo wonders, Christopher names. Together they model the catechumen-and-mystagogue dynamic, but quietly, without role-performance.

### 2.4 Exchange length and shape

- **Typical**: 2–3 banderoles
- **Maximum**: 4 banderoles
- **Shape patterns** (a small library to draw from):
  - **Question-and-anchor**: Theo wonders, Christopher names. (Most common.)
  - **Two-noticings**: Both characters notice different things in the same passage. No question, no answer. Just companionship in noticing.
  - **Recall-and-extend**: Theo recalls something from a prior session; Christopher extends it forward.
  - **Held silence**: Single banderole from Theo, no response from Christopher. A moment where wonder is the whole point.

### 2.5 Reveal mechanic

- Banderoles appear via **scroll-reveal**: they fade in (`opacity 0 → 1`, ~200ms ease) as the user scrolls them into view
- Under `prefers-reduced-motion: reduce` — banderoles are present immediately on first paint, no fade
- No tap-to-advance. The reading is continuous with the central devotional content.

### 2.6 Mobile layout adaptation

On phones, the right-margin layout collapses to **below-content stacking**:
- Central content (Gospel passage, verse, paragraph) reads top-down
- Marginalia exchange appears below as a parchment-bordered band: portraits on left edge, banderoles flowing right
- Same banderole count and content; just stacked instead of side-by-side

---

## 3. FORMAT 2 — VITA STRIP (Ceremonial peaks)

### 3.1 Thesis recap

Sequential panel narrative drawing on Byzantine vita iconography — the small narrative scenes around the central figure of a saint's icon. Theo and Christopher are rendered in their canonical Pixar-3D style but framed iconographically: icon-distance, parchment backgrounds, gold borders, formal compositional rhythm. The format itself teaches Nolan how the tradition tells stories about its saints.

### 3.2 Visual rhythm

**Panel count**
- Variable: **3 to 5 panels per strip**
- Default: 4 panels. Reserve 3 for tight beats (session close), 5 for richer ceremonial moments (great feast, sacrament prep)
- Never 2 (reads as paired stills, not narrative); never 6+ (overwhelms ADHD pacing target)

**Panel dimensions and layout**
- **iPad portrait (primary surface)**: panels arranged horizontally in a single row, ~22% viewport width each with 8px gold-fleuron gaps. 4 panels = full screen width minus margins.
- **iPad landscape**: panels in a single row, larger (~24% viewport width)
- **Mobile portrait**: panels stack vertically with same gold-fleuron separators between, scrollable column
- Aspect ratio per panel: square (1:1)

**Panel framing**
- 1.5px Byzantine Gold border `#C9A84C` around each panel
- **Corner cross-fleurons** ☩ at the four outer corners of the strip (not at every panel intersection — only at the strip's outer corners). Between-panel separators are simple thin gold fleur dots.
- Inner padding 0px — the illustration extends to the panel edge

**Illustration treatment**
- Pixar-3D characters but composed iconographically: mid-shot or full-body, never extreme close-up
- Parchment-textured background where setting is implied but stylized
- Characters always positioned with their natural cross-pendant visible
- One panel per strip MAY contain no dialogue — a silent beat. See §3.5.

### 3.3 Speech bubbles inside Vita Strip panels

Use the same hybrid parchment-scroll vocabulary as Marginalia (cross-format consistency) but with **two differences for Vita Strip**:

1. **Simpler scroll-edge treatment** — minimal scroll curl. Vita Strip panels already have heavy gold borders; adding ornate scroll-end curls inside would compete. Bubbles inside panels are cleaner, calmer.
2. **Tighter content** — each bubble inside a Vita Strip panel holds 1–2 short sentences max (~80 chars). Longer dialogue is split across panels rather than crammed into one.

Tail-at-speaker still non-negotiable. Theo/Christopher typography distinction (§1.3) still applies.

### 3.4 Reveal mechanic

- **Tap-to-advance per panel** is the primary mechanic on iPad. The strip starts with panel 1 visible; tap anywhere → panel 2 appears; etc.
- Each panel arrives via a gentle fade (~150ms) accompanied by a soft parchment-page-turn sound (~25% volume, single short cue, user can mute globally)
- On the final panel, no further tap target; a small gold ornament `☩` appears below the strip as a "this scene is complete" mark
- Under `prefers-reduced-motion`: all panels visible immediately; no fade; no sound regardless of mute state
- **Mobile portrait**: panels reveal on scroll-into-view (since they're stacked vertically). Same panel content, same dialogue order.

### 3.5 The silent beat panel

Every Vita Strip should consider including one panel with **no dialogue**:
- Often the third or fourth panel — the moment of held attention before the closing beat
- Examples: Theo looking up at a mosaic; Christopher with his hand on Theo's shoulder watching something off-frame; both standing in a doorway looking toward the altar
- The silent panel does the theological work of saying: *some moments do not require words*. This is itself catechetical.

### 3.6 Voice rules — narrative posture

Vita Strip dialogue differs from Marginalia in **direction**: Marginalia comments on something centered elsewhere; Vita Strip dialogue **is the center**. The characters are not reacting to a passage — they are inside their own moment, and Nolan is the witness.

**Theo in narrative**
- Asks the question of the moment ("Father, why are they doing that?")
- Names what he sees ("There's only one candle still lit.")
- Voices the wonder ("I didn't know it could feel like that.")
- Less hedging than in Marginalia — Theo in narrative is present, alert, engaged

**Christopher in narrative**
- Answers the question of the moment without lecture (1–2 short sentences max per bubble)
- Often answers a question with a quiet redirection ("Watch what Father does next.")
- Carries continuity to the broader story ("This is the same word the Apostle used.")
- Allowed to pause — a Christopher bubble can be just *"Yes."*

### 3.7 Closing flourish

After the final panel:
- The full strip remains visible — Nolan can re-read by swiping or scrolling back
- A small gold ornament `☩` appears below center, with a 1-line caption in Crimson Text Italic — never marketing copy. Examples:
  - *Glory to God for all things.*
  - *Such is the wisdom of Father Herman.*
  - *Christ is risen.*
- Under `prefers-reduced-motion`: the ornament appears immediately rather than fading in

### 3.8 Vita Strip is NOT a slide carousel

Important distinction. Vita Strip is a complete narrative artifact, not a deck of slides. When complete, the user sees all 3–5 panels at once (or scrolled into view on mobile). They can re-read freely. The tap-to-advance gesture creates anticipation on first read; it does not gate access to prior panels.

---

## 4. FORMAT 3 — FIELD JOURNAL (Rare unexpected gifts)

### 4.1 Thesis recap

Theo and Christopher are fellow expedition journalers. Occasional entries from them live in Nolan's Field Manual archive, time-stamped to the same devotional moments Nolan recorded. Discoverable by Nolan when he browses his own journal — not surfaced, not pushed (with one small exception, §4.5). The format that may get remembered ten years from now precisely because it's quiet and uninsistent.

### 4.2 Visual rhythm

**Theo's journal page**
- Background: warm parchment `#F5ECD7` with subtle ruled lines (`#C9A84C @ 8%`)
- Handwriting font: a children's-style handwriting webfont (e.g., *Caveat* or *Patrick Hand* at slightly looser tracking) — readable but visibly child-handed
- Color: deep ink-brown `#3A2817`
- Small marginal sketches: compass roses, simple birds, an altar outline, a small cross. 1–2 sketches per entry, charcoal-pencil rendering, positioned in actual margins not embedded in text
- Page header: 60px circular portrait of Theo at top-left + date + 1-word "location" tag (e.g., *Forest. Wed.*) — kept terse like a hiking log entry

**Christopher's journal page**
- Background: slightly cooler parchment `#F0E4C8` (subtly different from Theo's) with cleaner ruled lines (`#C9A84C @ 12%`)
- Handwriting font: a more measured adult cursive (e.g., *Homemade Apple* at standard tracking, or *Caveat Brush* heavier weight) — visibly older-handed
- Color: deeper ink-black-brown `#2A1810`
- Small diagrams or notations: a tiny cross, a map fragment, a Greek word neatly lettered. 1 diagram per entry maximum, ink-on-vellum rendering
- Page header: 60px circular portrait of Christopher at top-left + date + a slightly longer reflective sub-line (e.g., *Forest. He asked about it again today.*)

### 4.3 Entry length rules

- **Typical**: 2–4 sentences per entry
- **Maximum**: ~6 sentences (anything longer becomes essay-grade and breaks the journal posture)
- Each entry reads in ~30–60 seconds

### 4.4 Cross-referencing — paired entries

Some Field Journal entries come in **pairs** — same date, both characters writing about the same moment from their respective sides:

- Theo's entry ends with *"Father said something I didn't fully understand."*
- Christopher's entry that same day shows him telling Theo X — but not as quoted speech, as Christopher's interior reflection: *"He asked me again. I told him as much as he can carry today."*

The two entries never quote each other directly. They are two windows on one moment, and Nolan sees both. This is the format's most powerful move when it works.

Volume target: ~30–50% of Field Journal entries are paired. The rest are single-voice.

### 4.5 Discoverability mechanic

**Primary**: The Field Manual archive view shows all entries — Nolan's, Theo's, Christopher's — in unified date order. Character entries are visually distinct (portrait header + handwriting) so they're recognizable but not flagged. Nolan finds them by browsing.

**Optional gentle surfacing** (single exception to the no-push rule):
- On the day-of, the home page may surface a single subtle line: *"Theo wrote in his journal today."* with gold-glow on first mount
- Dismissible by tap or by navigating away
- Never repeats — once dismissed (or once Nolan opens the Field Manual that day), it's gone
- Used sparingly — only ~3–5 times per year, for entries the orchestrator marks "this one deserves a nudge"

### 4.6 Voice rules — journal posture

Journal entries are interior reflections. The voice posture differs from Marginalia (commentary on devotion) and Vita Strip (narrative dialogue):

**Theo's journal voice**
- First-person reflective, child-aged
- Allowed to be uncertain, distractible, sincere
- Often notices small things: the candle, the smell of incense, the way Father's voice sounded
- **Not** confessional. See §6.3 — Field Journal must never become a place where Theo expresses doubt or struggle in a way that makes Nolan feel he's reading Theo's secrets.
- Example tone:
  > *Wednesday. Cold morning. I asked Father what "amen" really means. He said it means "this is true" but more than that, and then he was quiet for a minute. I'm still thinking about the quiet part.*

**Christopher's journal voice**
- First-person reflective, adult-aged, formed by a lifetime of catechesis
- Often writes about his son in a way that is loving but never sentimental
- Names what he hopes; names what he prays
- Allowed to be uncertain about how to teach a specific moment
- Example tone:
  > *Wednesday. He asked about amen. I told him what I could. He asked again. I have been thinking about how my own father answered me when I was his age. We sat with it.*

### 4.7 What Field Journal is NOT

- Not a Q&A format
- Not a place for characters to "react" to feast days as content
- Not a children's diary tone with cute observations
- Not Theo telling Nolan directly about anything
- Not a parasocial-intimacy artifact (see §6.3)

---

## 5. AUTHORING APPROACH

### 5.1 Per-format authoring overview

| Format | What Kevin produces per scene | Art production needed |
|---|---|---|
| **Marginalia** | A small JSON/markdown record: surface anchor, 2–3 banderole texts with speaker, optional context note | None (existing portraits) |
| **Vita Strip** | A scene definition: 3–5 panel descriptions (illustration brief + dialogue), occasion (session/feast/sacrament), optional closing caption | New: per-panel illustrations (Pixar-3D, character poses) |
| **Field Journal** | Two short markdown documents (Theo's + optionally Christopher's), tagged with date anchor + optional surfacing flag | Minimal: occasional small sketch assets reusable across entries |

### 5.2 Marginalia authoring template

```yaml
surface: bible_reader_close       # or memorization_card, prayer_flow, session_teaching
anchor:
  type: gospel_reading            # or weekly_verse, session_id, etc.
  date: 2026-06-19                # baptism day
exchange:
  - speaker: theo
    text: "I keep thinking about how he asked them to follow him."
  - speaker: christopher
    text: "That's the same word our priest uses when he calls us forward at the Eucharist. The word for 'come.'"
  - speaker: theo
    text: "Oh."
```

Kevin's authoring step: write the exchange in his head, type it into the template. Time per scene: ~3–8 minutes for an experienced author. The orchestrator can pre-draft exchanges and Kevin reviews/refines.

### 5.3 Vita Strip authoring template

```yaml
scene_id: 00_05_chrismation_close
occasion: session_close
session_id: 00.5
title: "What the oil meant"
panels:
  - id: 1
    illustration_brief: "Theo sitting on a stone bench in a church narthex, late afternoon light through window. Christopher beside him."
    speaker: theo
    text: "I didn't think it would feel like that, Father."
  - id: 2
    illustration_brief: "Closer shot: Christopher looking at Theo with the slight smile of a parent who has been waiting for this moment."
    speaker: christopher
    text: "Tell me what you felt."
  - id: 3
    illustration_brief: "Theo looking at his hands, the chrism still faintly visible on his forehead in the light."
    speaker: theo
    text: "Like I was already known. Before I said anything."
  - id: 4
    illustration_brief: "Wider shot: both of them in the narthex, candle light on a stand to one side. Silent beat — no dialogue."
    silent: true
closing_caption: "Glory to God for all things."
```

Kevin's authoring step: write the scene structure, briefs, and dialogue. Art production then happens separately — see §5.6.

### 5.4 Field Journal authoring template

```yaml
entry_id: 2026-06-19-theo-baptism
date: 2026-06-19
author: theo
location_tag: "St. Demetrios. Friday."
paired_entry: 2026-06-19-christopher-baptism
surface_on_day_of: true     # optional gentle nudge
body: |
  Today I was baptized. The water was warm. Father lifted me up three times
  and the third time I came up and the light from the candles was on the
  ceiling and I forgot what I was supposed to do next. Mom was crying.
  Christopher said later that this is what crying is for.
```

```yaml
entry_id: 2026-06-19-christopher-baptism
date: 2026-06-19
author: christopher
location_tag: "St. Demetrios. The Friday I will not forget."
paired_entry: 2026-06-19-theo-baptism
surface_on_day_of: false
body: |
  My son was baptized this morning. I had prepared what I thought I would
  feel and I felt none of it. I felt something better. He asked me later
  why his mother was crying. I told him this is what we cry for. He nodded
  as if he already understood, and perhaps he did.
```

### 5.5 Voice cheatsheet — quick reference for authoring

| Posture | Theo | Christopher |
|---|---|---|
| **Marginalia** (margin commentary) | Wonders, notices, half-finishes thoughts. Tiny questions. | Anchors with one stone. Names quietly. Never lectures here. |
| **Vita Strip** (narrative dialogue) | Asks the question of the moment. Names what he sees. | Answers without lecture. Allowed to be silent. Carries continuity. |
| **Field Journal** (interior reflection) | Child-aged sincerity. Notices small things. Never confessional. | Adult-aged reflection. Loves without sentiment. Names what he hopes. |

### 5.6 Vita Strip art production pipeline (the real cost question)

This is the brief's heaviest production question. v1 ceremonial volume (~15–20 Vita Strip scenes × 3–5 panels = ~60–80 unique illustrations) is real Q2 work.

Recommendations for the pipeline chat:

1. **Build a reusable character pose library**. Theo and Christopher each need ~15–20 canonical poses (mid-shot conversation, looking up, hand-on-shoulder, walking together, kneeling, holding candle, etc.) generated once, then composited into panel scenes. The pose library is the leverage that makes Vita Strip ship-able.
2. **Background palettes are limited and reusable**. ~8–12 environment backdrops: narthex, forest path, monastery courtyard, riverside, candle-lit nave, classroom, kitchen table, mountain ridge, etc. Each backdrop appears across multiple scenes.
3. **Lighting templates** for time-of-day are reusable: morning gold, afternoon amber, candle warm, twilight blue.
4. **Acceptable to generate each panel as a composite** (poses + backdrop + lighting) rather than as a fully bespoke render. This is what makes 60–80 unique panels feasible without 60–80 hours of fresh art generation.
5. **First batch should be the welcome flow vita strip** (5 panels) — proves the pipeline before authoring the rest.

If this pipeline cannot be made to work, Vita Strip should ship with reduced volume (e.g., only session opens, not closes; only great feasts, not minor) rather than compromising the production quality.

### 5.7 Field Journal authoring craft

The hardest authoring work in the brief is keeping Theo's and Christopher's journal voices distinct without slipping into caricature. Practical rules:

- **Theo never uses theological vocabulary he wouldn't naturally have**. He says "the smell of the candles" not "the incense of the offering." Christopher uses theological vocabulary naturally — but always with weight, never as flex.
- **Theo's entries are concrete**. Sensory details: cold, light, smell, what Mom did, what his hands felt. Christopher's entries can move from concrete to interpretive in a single paragraph.
- **Read each entry aloud** before committing. If Theo's voice sounds like an adult playing a child, rewrite. If Christopher's voice sounds like a wisdom-quote, rewrite.
- **Never name what the moment "meant" in either voice**. Both characters can describe; neither performs meaning. Meaning emerges from what they describe and what they don't say.

---

## 6. FAILURE-MODE GUARDRAILS

### 6.1 Disneyfication (primary fear)

| Format | How it hedges | Drift check ("if you find yourself…") |
|---|---|---|
| **Marginalia** | Center stays the center. Characters are structurally subordinate to the Gospel/verse/doctrine they comment on. They cannot become mascots from the margin. | …writing a banderole that's "cute" — that delivers a joke, that performs cleverness — rewrite. The margin is for wonder, not entertainment. |
| **Vita Strip** | Icon-distance posture. Characters never close-up, never mugging. Iconographic framing makes Disney-sidekick posture structurally impossible. | …describing an illustration with words like "winks", "thumbs up", "grins big", or any cartoon expression — rewrite the panel. |
| **Field Journal** | No performance. Theo isn't speaking to Nolan; he's keeping his own journal. The format precludes mascot-energy by genre. | …writing a journal line that sounds like it's "for the camera" — a line Theo would only write if he knew it was being read — rewrite. |

### 6.2 Tedium (close-second fear)

| Format | How it hedges | Drift check |
|---|---|---|
| **Marginalia** | 2–3 banderoles per exchange, max 4. Variation in exchange shape (question-and-anchor, two-noticings, recall-and-extend, held silence) prevents pattern fatigue. | …all marginalia on a surface follow the same shape (question-and-anchor every time), rotate shapes deliberately. |
| **Vita Strip** | Reserved for ceremonial peaks, not daily presence. Scarcity protects significance. Silent-beat panel keeps strips from feeling expository. | …a Vita Strip ends without any quiet, without any beat that isn't speech — add a silent panel. |
| **Field Journal** | Asynchronous, discoverable, never pushed (except rare opt-in nudge). Cannot generate tedium because Nolan is never forced into them. | …more than ~15 entries authored per year, the format has drifted toward content-treadmill — pull back. |

### 6.3 Format-specific risks beyond the two primary fears

**Marginalia — wallpaper risk**
- The failure mode is "Nolan ignores the margin entirely; the dialogue becomes decorative."
- Hedge: voice quality. A marginal banderole that *actually says something Nolan didn't already know* survives. One that just affirms the central content disappears.
- Drift check: if a banderole could be deleted without losing anything, delete it.

**Vita Strip — museum-exhibit risk**
- The failure mode is "feels precious, stiff, like watching a tableau."
- Hedge: warmth inside the icon-distance constraint. Sun on Theo's hair. A bird passing through the second panel. Christopher's laugh in panel 3. Specific human details inside the iconographic frame.
- Drift check: if a panel has no warmth in it — nothing that feels alive — add one specific human detail.

**Field Journal — parasocial intimacy risk**
- This is the risk I flagged in self-review and want named explicitly. Field Journal could drift into Nolan reading Theo's "secrets" — a parasocial intimacy that violates reverence by making the characters' interiors into content for Nolan's consumption.
- Hedge: every Field Journal entry should be **the kind of thing a 12-year-old (or his father) would proudly share if asked**. Not confession. Not hidden struggle. Catechetical journaling — interior reflection that is offered, not extracted.
- Drift check: ask of each entry — *"would Theo be embarrassed if Nolan read this?"* If yes, rewrite. If no, ship.

### 6.4 Cross-format theological flattening (secondary fear from Q5)

Across all three formats:
- Characters can describe mystery; they cannot resolve it. The Eucharist is not "explained" in any format. Trinity is not "explained" in any format. Apophatic theology — the via negativa — must survive contact with character dialogue.
- Drift check: if a Christopher line in any format reads like a textbook definition of a doctrine, rewrite into a quieter naming. "*The Fathers called this…*" is allowed. "*The doctrine of X means Y*" is not.

---

## 7. ENGINEERING HANDOFF NOTES

### 7.1 Data model shapes (not schemas)

Each format suggests a different data shape. Engineering chats will design the actual schemas; these are the shapes to design from.

**Marginalia**
- Records keyed by surface + anchor (gospel reading date, verse week, session ID + paragraph anchor, prayer flow position)
- Each record: an ordered list of banderoles with speaker + text + optional surface-specific positioning hint
- Indexed for fast lookup when the surface renders

**Vita Strip**
- Records keyed by occasion ID (session_open_00_05, feast_holy_ascension_2026, sacrament_chrismation_00_05_close, welcome_flow_intro)
- Each record: ordered list of panels with illustration asset reference, speaker, dialogue, silent flag, optional closing caption
- Asset references resolve to character pose library composites or bespoke renders

**Field Journal**
- Records that look structurally identical to Nolan's own journal entries
- Author field distinguishes character entries from Nolan's entries
- Date-anchored; optional paired_entry foreign key; optional surface_on_day_of flag
- Render component branches on author to apply Theo/Christopher visual treatment

### 7.2 Render components needed

| Component | Used by | Touches existing surfaces |
|---|---|---|
| `<MarginaliaExchange>` | Marginalia | Bible reader, memorization card, prayer flow, session teaching |
| `<VitaStrip>` | Vita Strip | Session screens, liturgical calendar drawer, welcome flow |
| `<JournalEntry author=...>` | Field Journal + existing journal | Field Manual archive |
| `<SpeechBubble speaker=... tail=...>` | Shared primitive | Embedded in both Marginalia and Vita Strip |

The shared `<SpeechBubble>` primitive is the centerpiece — getting it right once gives both Marginalia and Vita Strip their visual consistency without per-surface CSS.

### 7.3 Surfaces requiring fresh build vs. extension

**Extend existing**
- `bible-reader.html` — add Marginalia render to closing screen
- `memorization.html` — add Marginalia render alongside weekly verse
- `journal.html` — extend entry rendering to handle character authors with handwriting treatment
- Welcome flow — replace/refine hero frame with Vita Strip

**Fresh build**
- Vita Strip render on session screens (Mon/Wed/Fri Day 1 open, Day 3 close)
- Vita Strip surfacing in liturgical calendar drawer for feast days
- Optional gentle "Theo wrote today" home surfacing component

### 7.4 Caching and service worker considerations

- Marginalia content is text-only; small payload; ship inline with surface payloads
- Vita Strip illustrations are the heavy assets — must be in `STATIC_ASSETS` list in `sw.js` for PWA pre-caching, version bump per addition (project pattern)
- Field Journal entries are text-only with occasional small sketch SVGs; small payload

### 7.5 Authoring tooling (longer-horizon)

Once volume exceeds ~30 total scenes across all formats, Kevin will want a lightweight authoring surface (admin-side):
- Form to author a Marginalia exchange
- Form to author a Vita Strip with per-panel fields
- Form to author a Field Journal pair
- Preview rendering so Kevin can read the scene as Nolan will

Not required for v1 — YAML/markdown authoring in source files is fine for ~15–25 scenes. Flag for engineering as a Q3 priority.

---

## 8. SHIP ORDER RECOMMENDATION

### 8.1 Order

1. **Marginalia** (first)
2. **Vita Strip** (second)
3. **Field Journal** (third)

### 8.2 Reasoning

**Marginalia first** because:
- Lowest art production load (near-zero new art; uses existing portraits)
- Highest surface coverage — touches daily reading, memorization, prayer, session teaching, so the format becomes visible across most of Nolan's daily app surface immediately
- Validates the shared `<SpeechBubble>` primitive with the simpler surface before Vita Strip needs it
- Proves the Theo/Christopher voice-typography distinction (§1.3) at low cost
- Can ship within ~2 dispatches of engineering work

**Vita Strip second** because:
- High emotional impact; the ceremonial peaks really do want character presence
- Art production pipeline needs to be established (§5.6); shipping after Marginalia gives that pipeline time to mature
- Critical that the welcome flow Vita Strip be ready for new users in v1.x; this is the bridge from current welcome to the system being designed
- Session opens/closes are the obvious next surface; Topic 00 ships May 18, so Vita Strip on session opens can land within the first few Topic 00 weeks even if not at launch

**Field Journal third** because:
- Highest authoring craft bar (§5.7) — wants Marginalia and Vita Strip voices to be established first, so Field Journal extends an existing voice register rather than introducing it
- Lowest user-surface urgency — discovery-tone, not interrupt-tone, so launching weeks after the others is fine
- The first Field Journal entries should be authored for the baptism day Jun 19, 2026 — they will be among the most important entries in the entire system and deserve the maturity of having authored Marginalia and Vita Strip first

### 8.3 Timeline suggestion (non-binding)

- **Week of May 18 launch**: Topic 00 ships without comic dialogue. The existing "Theo asks…" pattern carries the inline reflection load.
- **Late May / early June**: Marginalia v1 on Bible reader + memorization
- **Mid-June (pre-baptism week)**: Vita Strip on session opens + welcome flow refinement
- **Baptism day Jun 19**: First Field Journal entries (paired, Theo + Christopher) live in archive
- **July**: Marginalia extends to prayer flow + session teaching margins; first feast-day Vita Strips authored
- **August / September**: Volume grows; authoring tooling questioned

---

## 9. OPEN QUESTIONS FOR CONTENT AUTHORING AND ENGINEERING

Items the design brief deliberately does not resolve — flagged for the chats that consume this brief. (Items §9.2 and §9.6 below have been resolved by the post-Phase-4 follow-up dispatch — kept here as a closure record.)

1. **Service worker cache strategy for Vita Strip illustrations.** Engineering chat to decide between pre-cache-all vs. lazy-cache-on-first-view. Both have trade-offs for iPad PWA.

2. ~~**Greek font choice for canonical liturgical phrases** (§1.6).~~ **RESOLVED §11.** Recommended: add GFS Neohellenic as Greek-only secondary face via CSS `unicode-range`. Crimson Text remains primary body font. See §11 for full integration spec and visual treatment rules.

3. **Whether Marginalia banderoles ever appear DURING the Gospel passage** (interspersed with verses) rather than only at the closing screen. Current brief says only at close. The Christian Worker NIV-style study Bible places footnote-comments inline; we could honor that precedent. Defer to a content-authoring chat once Marginalia is live.

4. **Vita Strip on great feasts not in Topic 00 weeks** — does a feast day Vita Strip still appear in the home liturgical calendar drawer even if no session is unlocked that week? Brief says yes; confirm with orchestrator before authoring.

5. **Father Nicholas integration plan**. When his character art ships, all three formats need extension. Defer to a future dispatch.

6. ~~**Mom (Danyelle-coded character?)** — flagged but not recommended for v1.~~ **RESOLVED §1.8.** Mom is present-in-the-world but never authored as a speaker, in v1 or later. Architectural lock.

7. **Multilingual support beyond rare Greek** — if the app ever serves Greek-speaking families, the entire dialogue corpus needs translation strategy. Out of scope for v1.

---

## 10. APPENDIX — VISUAL REFERENCE VOCABULARY

### 10.1 Color tokens (canonical from project)

```css
--byzantine-gold:   #C9A84C;
--deep-red:         #8B1A1A;
--navy:             #1B2A4A;
--parchment-cream:  #F5ECD7;
--parchment-warm:   #F0E4C8;  /* Christopher bubble fill */
--ink-brown:        #3A2817;  /* Theo journal ink */
--ink-deep:         #2A1810;  /* Christopher journal ink */
```

### 10.2 Typography stack

```css
/* Headings (already in app) */
--font-heading: 'Cinzel', serif;

/* Body and dialogue (already in app) */
--font-body: 'Crimson Text', serif;

/* New: handwriting fonts for Field Journal */
--font-theo-hand:        'Caveat', 'Patrick Hand', cursive;
--font-christopher-hand: 'Homemade Apple', 'Caveat Brush', cursive;
```

### 10.3 Spacing rhythms

- Marginalia banderole gap (vertical between banderoles): 12px
- Vita Strip panel gap (horizontal between panels): 8px with gold fleur dot center
- Vita Strip strip outer margin: 16px on iPad portrait
- Field Journal entry top padding: 24px (so the date/portrait header reads clearly)

### 10.4 Cultural touchstones (for authoring chats to reference)

The intended cultural register of the system, listed so future chats can draw from the same references:

- **Vita Strip aesthetic**: Byzantine vita icons (the saint surrounded by narrative scenes); the Lindisfarne and Book of Kells illuminated traditions where figures appear in formal compositional rhythm
- **Marginalia aesthetic**: medieval study-Bible marginal commentary; the Glossa Ordinaria; the Orthodox Study Bible's footnote tradition
- **Field Journal aesthetic**: a child's adventure journal (think Tintin's notebook pages, or a Boy Scout field log) crossed with a serious adult's spiritual journal (think a desert father's chapter heads); never a curated "diary book" feel
- **Voice register across all three**: contemplative, unhurried, intelligent, warm. The "voice in your ear" of the project should always be Father Stephen Freeman's blog at its best — devotional but never saccharine, theological but never academic, present but never performed.

---

## 11. GREEK TYPOGRAPHY TREATMENT

Added in response to the §9.2 question. Greek will appear ~2–4 times per year at moments of high ceremonial weight (Pascha *Χριστὸς ἀνέστη*, *Δόξα τῷ Θεῷ* closings, Chrismation *Ἀξιος*, baptism-day phrases). Each appearance carries weight precisely because it is rare — plain rendering on a precious moment is worse than waiting an extra week to get it right.

### 11.1 Methodology and constraints disclosure

Sandbox network restrictions prevented downloading the original candidate fonts (GFS Didot, GFS Neohellenic, EB Garamond) from the Google Fonts CDN. The typography study was conducted by:

- **Direct rendering** of the six canonical liturgical phrases (Χριστὸς ἀνέστη, Ἀληθῶς ἀνέστη, Δόξα τῷ Θεῷ, Καλώς όρισες, Κύριε ἐλέησον, Ἄξιος) in two locally-available faces from the **same foundry** as the lead candidate: **GFS Porson** (academic-classical) and **GFS Baskerville** (liturgical character). Both are from the Greek Font Society, which is the foundry behind the recommended candidate.
- **Comparative rendering** against system serif fallbacks **DejaVu Serif** and **Liberation Serif** to establish the baseline of what non-dedicated faces produce for polytonic Greek.
- **Reasoning from documented characteristics** for GFS Neohellenic, GFS Didot, and EB Garamond.

Visual artifacts saved alongside this brief: `greek_typography_comparison.png` (composite 2×2 grid), `greek_phrases_gfs_porson.png` (full six-phrase sheet in Porson), `greek_phrases_gfs_baskerville.png` (full sheet in Baskerville).

### 11.2 Findings from the visual test

The dedicated polytonic faces (GFS Porson, GFS Baskerville) handle the hardest diacritic cases dramatically better than the system serif fallbacks:

| Diacritic case | Dedicated GFS faces | System fallbacks |
|---|---|---|
| Iota subscript on ῷ (Δόξα τῷ Θεῷ) | Clearly visible, properly positioned beneath the omega, design-coherent | Visible but feels pasted-on; some loss of integration with the host letterform |
| Circumflex (περισπωμένη) on ῶ (Ἀληθῶς) | Sculptural tilde curl, designed for the underlying letter | Rendered but visually inert; the curl reads as a generic diacritic, not Greek |
| Smooth breathing + acute stack on Ἄ (Ἄξιος) | Crisply stacked, both marks distinct | Stacked but the smooth breathing reads as a comma-shape; less ceremonial weight |
| Smooth breathing on ἀ (ἀνέστη, ἐλέησον) | Clear coma-shape mark integrated with letterform tracking | Rendered but less integrated; reads as a quote-mark rather than a Greek breathing |

The conclusion is decisive: a dedicated polytonic Greek face is required. System fallbacks survive the legibility threshold but fail the ceremonial-weight threshold.

### 11.3 Crimson Text current state assessment

Without direct local rendering of Crimson Text's polytonic glyphs, the assessment is qualified, but documented behavior is consistent: Crimson Text's Greek glyph set was added by various contributors over the project's life and is reported to have inconsistent diacritic positioning compared to dedicated Greek foundry faces — particularly on the harder cases above (iota subscript, circumflex over short vowels, breathing+accent stacks).

For the body text of the app, where Greek appears rarely if at all, this is acceptable. For ceremonial liturgical phrases where the Greek **is the speech act** — Pascha, Theophany, Pentecost moments — the gap matters.

### 11.4 Recommendation — option (b): Greek-only secondary face

**Add GFS Neohellenic as a Greek-only secondary face via CSS `unicode-range`. Crimson Text remains the primary body font for everything else.**

Reasoning:

1. **Foundry pedigree is established**. The visual test of GFS Porson and GFS Baskerville confirms that Greek Font Society polytonic faces handle the hardest diacritic cases with design coherence. GFS Neohellenic comes from the same foundry, same design discipline.

2. **GFS Neohellenic specifically has liturgical-publication pedigree**. It is modeled on a 1927 Greek body face used widely in 20th-century Orthodox liturgical publications. The face carries cultural-theological weight that the higher-contrast GFS Didot (modeled on 1805 Firmin Didot, scholarly-classical register) does not carry for liturgical use. Didot is for scholars; Neohellenic is for worship.

3. **Humanist proportions pair well with Crimson Text**. Both faces have moderate contrast and humanist proportions. The Greek-set-in-Neohellenic alongside Latin-set-in-Crimson Text should not produce a visual jolt — they share a typographic temperament.

4. **PWA cost is acceptable**. GFS Neohellenic as a Greek-only subset via `unicode-range` is approximately 25–35KB WOFF2 (Greek + Greek Extended ranges only — the Latin half stays Crimson Text). For a face used only on ceremonial moments, this is a defensible footprint.

5. **Lower switching cost than EB Garamond as full replacement**. Replacing Crimson Text entirely would touch every surface in the app — a redesign-scale change for what is genuinely a rare-occurrence problem. The Greek-only secondary approach solves the actual problem without the redesign.

### 11.5 Integration spec

**Font-face declaration** (engineering chat will refine syntax):

```css
@font-face {
  font-family: 'GFS Neohellenic';
  src: url('/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Regular.woff2') format('woff2');
  unicode-range: U+0370-03FF, U+1F00-1FFF;  /* Greek + Greek Extended */
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'GFS Neohellenic';
  src: url('/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Italic.woff2') format('woff2');
  unicode-range: U+0370-03FF, U+1F00-1FFF;
  font-display: swap;
  font-weight: 400;
  font-style: italic;
}
```

**Font-family stack** (applied at the level of body text or where ever Crimson Text is used):

```css
:root {
  --font-body: 'Crimson Text', 'GFS Neohellenic', serif;
}
```

Browser behavior with `unicode-range`: each character is matched against the available faces; Crimson Text wins for Latin and most other characters; GFS Neohellenic engages only for Greek + Greek Extended codepoints. No Latin-script contamination, no separate selector required at the markup level.

**sw.js update** when this lands (worker dispatch):

```javascript
'/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Regular.woff2',
'/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Italic.woff2',
```

Plus cache version bump per project convention.

**Fallback chain**: if the woff2 file fails to load, browser falls through to system serif, which is degraded but functional. `font-display: swap` ensures Greek renders immediately in fallback while the dedicated face loads, so the first paint never blocks on the rare face.

### 11.6 Visual treatment spec — where Greek appears in dialogue

Wherever a canonical Greek phrase appears in any of the three formats (Marginalia banderole, Vita Strip speech bubble, Field Journal entry text):

| Property | Greek line | English caption beneath |
|---|---|---|
| Face | GFS Neohellenic (via unicode-range fallthrough) | Crimson Text Italic |
| Size | **1.15× of surrounding body text** | **0.85× of surrounding body text** |
| Color | Body text color `#3A2817` for typical use; **may shift to Byzantine Gold `#C9A84C`** for the most ceremonial moments (specifically Pascha *Χριστὸς ἀνέστη* and *Ἀληθῶς ἀνέστη*) | Body text color at 80% opacity |
| Weight | Regular | Italic |
| Alignment | Center-aligned within the speech container | Center-aligned beneath the Greek |
| Vertical gap | — | **4–6px** beneath the Greek line |
| Surrounding gap | 8–12px above and below the Greek+caption block, inside the speech container | (see Greek line) |

**Important**: the English caption is the **gloss**, not a co-equal translation. The Greek is the speech act. Visually the Greek dominates — larger, primary color (or gold for Pascha), positioned first. The English sits beneath as a quiet aid for Nolan to read, never overshadowing.

### 11.7 Gold treatment — when to use it

Limit Byzantine Gold (`#C9A84C`) on Greek text to **the resurrection exclamation only**:

- Pascha (Easter): *Χριστὸς ἀνέστη! / Christ is risen!* and the response *Ἀληθῶς ἀνέστη! / Truly he is risen!*

For all other Greek phrases — *Δόξα τῷ Θεῷ*, *Κύριε ἐλέησον*, *Ἄξιος*, *Καλώς όρισες* — use body text ink (`#3A2817`). Gold on every Greek line cheapens it. Reserving gold for the resurrection exclamation specifically makes that moment carry visual weight commensurate with its theological weight.

### 11.8 Authoring rule for content chats

When a content-authoring chat (or Kevin directly) writes a Greek phrase into any of the three formats, the authoring step adds two simple flags:

```yaml
- speaker: christopher
  text: "Χριστὸς ἀνέστη!"
  greek: true
  gold: true   # gold gets used here because it's a resurrection exclamation
  english_caption: "Christ is risen!"
```

The render component reads these flags and applies the §11.6 / §11.7 visual treatment automatically. Authors do not need to manage CSS classes inline.

### 11.9 What this study did not resolve

Surfaced for the engineering chat that implements:

1. **Where the GFS Neohellenic WOFF2 file is sourced from**. Google Fonts is the standard CDN distribution; if the project wants to self-host, the file can be downloaded from `fonts.google.com` and committed to the repo at `/assets/fonts/`.
2. **Whether to also load a bold weight**. Recommend deferring — the rare-occurrence ceremonial usage doesn't need bold for v1.
3. **Whether italic should also load**. Crimson Text Italic is already loaded; if any Greek phrase ever needs italic treatment, the project may want to add GFS Neohellenic Italic. Defer unless a specific authored phrase calls for it.
4. **In-app testing before commit**. Before treating §11 as final, render at least the six canonical phrases in the actual app surface (Vita Strip speech bubble, Marginalia banderole, Field Journal body) at production sizes on Nolan's iPad. If the rendering meaningfully differs from this study's expectations, revisit before authoring Pascha 2027 content.

---

☦ Glory to God for all things.
