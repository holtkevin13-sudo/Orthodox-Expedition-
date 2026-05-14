# ICONOGRAPHY LITERACY + SAINT BIOGRAPHY MICRO-CARDS
## Design Brief — The Orthodox Expedition

**Status:** Designer Chat D5 — design specification for engineering + content authoring downstream
**Date:** May 13, 2026
**Author:** Designer Chat D5
**Consumed by:** Worker Chat 20 (engineering implementation), future content chat (saint biography authoring), art-sourcing workflow
**Pre-launch posture:** Structure ships with Topic 00; priority authoring covers month-1 (~14 saints, May 18 – Jun 18, 2026); full Topic 00 corpus over time
**Revision history:**
  - 2026-05-13 — Initial D5 spec delivered; OQ-1 through OQ-7 ruled by orchestrator; OQ-6 corrected (St. Kevin of Glendalough Jun 3 is *not* Kevin's name day — Kevin's patron is St. Silouan, Sept 24, outside Topic 00; Op Learning #20)

---

## 0. EXECUTIVE SUMMARY

Two integrated features land together:

| Feature | What it is | Primary surface |
|---|---|---|
| **Iconography literacy primer** | Teaches Nolan how to "read" an Orthodox icon — halo, hand gestures, what saints hold, robes and colors, Greek inscriptions, face and gaze | First six saint micro-cards Nolan opens (one lesson per card, inline) |
| **Saint biography micro-cards** | A ~150-250 word narrator-voiced life story per saint, with 2-3 visual-literacy callouts and an icon image | Tap a saint name on the home Liturgical Calendar drawer; reopen from "Saints I've Met" archive in the Field Manual |

The two features are **a single feature in two faces**. The micro-cards are the delivery mechanism for the literacy primer. Each tap-a-saint moment teaches a small piece of visual vocabulary in context — never as a quiz, never as a separate lesson screen.

**Three structural decisions** (carry through this whole document):

1. **Saint cards are narrator-voiced.** Third-person. Theo and Christopher do not speak inside cards. Direct quotes from a historical saint are attributed to the saint as a quoted source ("St. John Chrysostom said: …"). This honors D1 §§ 1.4, 1.7, 1.8.
2. **Image default is public-domain canonical icons** — most named Orthodox saints have centuries-vetted iconographic representations available via OrthodoxWiki, Wikimedia Commons, GOA Holy Cross, and Antiochian sources. Midjourney is the named fallback when canonical sources don't exist at the needed register. This honors D3's anti-AI-iconographic-drift stance.
3. **Data lives in static JSON** at `/docs/content/saints/topic-00-saints-v1.json`, mirroring `topic-00-marginalia-v1.json`. No new Supabase table in v1. Slug matching to `liturgical_calendar.saint_commemorations` with `alternate_names` fallback.

---

## 1. SCOPE

In scope for D5:
- Iconography literacy primer content + delivery model
- Saint micro-card structure (layout, tone, callouts)
- Image sourcing approach (public-domain primary, MJ fallback)
- Saint content authoring template (for the downstream content chat)
- Data model and slug-matching strategy
- Integration plan for the home Liturgical Calendar surface
- Integration plan for the Field Manual "Saints I've Met" archive
- One worked example (St. Constantine & Helen, May 21)
- Engineering handoff notes for Chat 20

Out of scope:
- Authoring the full Topic 00 saint corpus — that's a downstream content chat consuming this spec (pattern: marginalia v1)
- Authoring beyond Topic 00 (Topic 1+ saints)
- Father Nicholas voice or imagery (deferred per D1 §1.7)
- Repo audit of duplicates (separate post-launch chat)
- Engineering implementation itself (Chat 20)

---

## 2. ARCHITECTURE LOCKS CHECK

D1 established four lifetime locks across all comic-format dialogue. Each is checked against both D5 features:

### 2.1 Witness-only posture (D1 §1.4)
*Default and exclusive posture: Nolan beholds; the conversation is not directed at him.*

- Saint cards are narrator-voiced text *about* the saint, not character speech *toward* Nolan. The narrator's voice is the app itself — quiet, present, third-person.
- The saint's gaze in the icon image looks out at the viewer, but that's the iconographic tradition itself, not a fourth-wall break. Icons have always done this. The witness-only lock concerns Theo and Christopher's gaze in *new* illustrations, not the documented gaze of historic icon writing.
- Iconography literacy callouts teach Nolan to *recognize* the gaze, not to receive it as direct address. The phrasing throughout is descriptive ("Notice how she looks straight at you — that's not a mistake") not invitational ("She's looking at *you*, Nolan").

**PASS.**

### 2.2 English-default, rare canonical Greek (D1 §1.6)
*Greek appears only where Greek IS the speech act.*

- Card body text is English.
- Greek appears only on the icon inscription callout (Lesson 5): "О АГІОС" / "Η АГІА" / "IC XC" / "MP ΘΥ" rendered in GFS Neohellenic (per D1 §11.4). These are not translations; the Greek letters *are* the thing being taught — they're part of the icon itself, and Nolan needs to recognize them. English captions follow as italic glosses, smaller, never overshadowing.
- Direct saint quotes (rare) appear in English in v1. If a saint quote has canonical Greek that resonates as a *speech act* (a doxology, an exclamation), the Greek may appear with English caption. Conservative: assume English-only unless the content chat surfaces a specific reason.

**PASS.**

### 2.3 Father Nicholas deferred (D1 §1.7)
*Father Nicholas is not authored into any v1 format.*

- Saint cards are narrator-voiced; no Father Nicholas voice anywhere in the corpus.
- Even where a saint card discusses a sacrament that would normatively involve a priest (e.g., a martyr who was a hieromartyr-bishop), the card describes what the saint *did* in their own time, not what a present-day priest does. The teaching about confession, the Eucharist, or chrismation lives elsewhere in the app (session content, sacrament-week material), not in saint cards.

**PASS.**

### 2.4 Mom present-in-world, never authored as a speaker (D1 §1.8)
*A third recurring speaker is not added.*

- Saint cards are narrator-voiced. There is no character speaker at all inside a card. Mom is neither absent nor present in the speaker sense — the speaker question doesn't apply.
- A saint whose own mother is part of their hagiography (Mary & Martha, Macrina, Emilia) is fine — those are *historical* mothers in the saint's own life, not *Nolan's* mother as a speaker.

**PASS.**

---

## 3. ICONOGRAPHY LITERACY PRIMER

### 3.1 The premise (one paragraph — drives all content)

Icons are not pictures. They are theology written in line and color. Orthodox Christians have, for almost two thousand years, painted saints in a way that says specific things on purpose. A halo is not decoration; it means *holy*. The way a saint's fingers fold is not artistic flourish; it spells a name or a doctrine. The Greek letters above each saint are not signatures; they are the saint's own naming inside the prayer of the Church. A literate Orthodox child can look at an icon and know, before reading a single word, who they're looking at and what the icon is saying. This is what Nolan is being taught — not "art appreciation," but a reading skill the Church has handed down to its children for sixty generations.

### 3.2 The six foundational lessons

Sequenced by frequency in the icons Nolan will actually encounter in month 1.

**Lesson 1 — The Halo (the gold ring around the head)**
Every saint has a circle of gold around their head. Orthodox Christians call this a *nimbus*, but Nolan can just call it a halo. The gold doesn't mean the saint glowed when they were alive. It means the light of God is in them — that they are alive in God now, and the icon is showing us what is true about them, not just what they looked like.
*Card #1 sample callout phrasing:* "Look at the gold circle around her head. That's how an icon says *she is holy*. Every saint has one."

**Lesson 2 — Hands (what fingers are saying)**
Saints' hands are doing something specific in every icon. The two most common gestures Nolan will see:
- **Blessing hand** — three fingers folded together (for the Trinity), two fingers down (for Christ's two natures, divine and human). Bishop saints, Christ in icons, and many priest-saints make this sign.
- **Open palm pointing up or out** — teaching, witnessing, presenting. Often a saint holds a scroll or Gospel in one hand and presents it with the other.
*Card #2 sample callout phrasing:* "See how his fingers are arranged? Three pressed together, two folded down. That's not a wave — it's the blessing sign. The three for the Holy Trinity, the two for Christ."

**Lesson 3 — What saints hold (objects = identity)**
Each saint usually holds something that tells you who they are:
- **Gospel book** — apostle, evangelist, or great teacher
- **Scroll** — prophet, theologian, or hymnographer
- **Cross** — martyr (often a small cross, "the cross of witness")
- **Church model** — founder of a monastery, cathedral, or bishop of a city
- **Instrument of their martyrdom** — sometimes (e.g., St. Catherine with a wheel, St. Stephen with stones)
*Card #3 sample callout phrasing:* "She's holding a cross — that's how an icon says *she died for Christ*. Saints who were martyrs are almost always shown holding a small cross."

**Lesson 4 — Robes and colors (what they wore says what they did)**
Color in icons is meaning, not decoration:
- **Black robes** — monks and nuns (the world is "dead" to them; they live for prayer)
- **White robes** — baptismal robes, the holy innocents, the resurrection
- **Red robes** — martyrs (blood) or royalty (purple-red especially)
- **Bishop's robes** — long band over the shoulders (omophorion) with crosses on it
- **Christ's robes** — usually red under-tunic (his blood, his humanity) and blue outer-robe (the heaven that wraps around him). His mother wears the inverse: blue under, red over — she is the human who became "wrapped in" heaven.
*Card #4 sample callout phrasing:* "She's wearing royal purple. That's how an icon says *she was a queen*. Real queens wore that color, but Helen is also dressed like one because the icon is saying she belongs to a kingdom even bigger than Rome."

**Lesson 5 — Greek letters above the head (the saint's name in the Church's language)**
Every traditional Orthodox icon has Greek letters above the saint's head. Two common patterns:
- **О АГІОС** (HO AGIOS) — "the holy [man]" — appears above male saints
- **Η АГІА** (HE HAGIA) — "the holy [woman]" — appears above female saints
- For Christ: **IC XC** (Jesus Christ — first and last letters of each Greek word)
- For Mary: **MP ΘΥ** (Mother of God — *Meter Theou* abbreviated)
Plus the saint's own name spelled in Greek letters. Nolan doesn't need to read Greek. He just needs to recognize the marks as "this is how the Church names the saint."
*Card #5 sample callout phrasing:* "Look at the Greek letters above his head — that's how the Church writes his name in the language of the first Christians. You don't have to read them. Just know they say his name."

**Lesson 6 — Face and gaze (always looking out, always present)**
Almost every saint in an icon is shown facing forward, looking at the viewer. This is on purpose. Icons are not paintings of saints somewhere else; they are windows into the saint's present life with God. When the saint looks at you, the icon is saying: *I am here. I see you. I am praying with you right now.*
*Card #6 sample callout phrasing:* "He's looking right at us. Icons almost always do this. It means the saint is not just *back then* — he is alive in God *now*, and the icon is the way we meet him."

### 3.3 Delivery cadence

- **Lessons 1-6** are delivered in order as the first callout of the first 6 unique saint micro-cards Nolan opens. (If Nolan taps Constantine first, Constantine's card opens with Lesson 1 as the first callout. If a card normally would teach Lesson 3 but Nolan hasn't seen 1 or 2 yet, the cadence holds — *which lesson is next* is tracked per explorer, not per card.)
- **After Lesson 6**, all subsequent cards continue to have 2-3 callouts each, but the callouts are now *applications* of the six lessons rather than the primary teaching of a new one. A card on St. Justin the Philosopher (Jun 1) might use a halo callout, a "what he's holding" callout (a scroll, because he was a theologian), and a "Greek letters" callout — each one quietly reinforcing what Nolan now knows how to look for.
- **The full six lessons are usually taught within the first two weeks** of Topic 00 launch, assuming Nolan opens roughly one saint card per day on average. The exact tempo is Nolan's, not the app's.

**State tracking:** Worker Chat 20 maintains a per-explorer `iconography_lessons_seen` array (lesson IDs `1` through `6`) on the `profiles.onboarding_state` JSONB (or new column — engineering call). Each time a card opens, the system checks if the next-numbered lesson is unseen; if so, that card's first callout is the primer lesson; if not, the card's authored callouts proceed normally.

### 3.4 First-tap experience (no separate tutorial modal)

The first saint card Nolan ever opens *is* the first lesson. There is no interstitial "Welcome to Saint Cards! Here's how icons work!" modal. The card itself does the teaching.

Implementation note for Chat 20: the first card's first callout is rendered with a slightly heavier visual emphasis — a small banner above the callout reading **"How to read icons — Lesson 1 of 6"** in Cinzel small caps. The same banner appears above the first callout of cards 2 through 6. After card 6, the banner is no longer rendered; callouts continue without numbering.

This pattern matches the rest of the app's pedagogy: teaching happens *inside* the content, not in a separate "training" mode.

---

## 4. SAINT MICRO-CARD STRUCTURE

### 4.1 Layout (top to bottom)

```
┌──────────────────────────────────────────────┐
│  ✕ close          ✦  The Day  ✦   May 21    │  ← header
├──────────────────────────────────────────────┤
│                                              │
│           [ICON IMAGE — 200×260]             │  ← icon
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │  Saints Constantine & Helen            │   │  ← name (Cinzel)
│  │  Equal-to-the-Apostles · May 21        │   │  ← honorific + date
│  └───────────────────────────────────────┘   │
│                                              │
│  [Life story, 150-250 words, Crimson Text]   │  ← body
│  ...                                         │
│  ...                                         │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │  ✦ How to read icons — Lesson 1 of 6  │   │  ← banner (cards 1-6 only)
│  │  [Callout title in Cinzel small caps] │   │  ← callout 1
│  │  [Callout body, Crimson Text italic]  │   │
│  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────┐   │
│  │  [Callout 2]                          │   │
│  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────┐   │
│  │  [Callout 3]                          │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ─── ✦ ─── ☩ ─── ✦ ───                       │  ← footer flourish
│  Glory to God for all things.                │
│                                              │
└──────────────────────────────────────────────┘
```

### 4.2 Word count target

- **Life story body:** 150-250 words. Strict ceiling at 280. A 10-year-old will read this aloud in 90 seconds; longer than that and the card becomes homework.
- **Callout body:** 30-60 words each. Strict ceiling at 80.
- **Total card text (excluding icon caption):** 250-400 words.

### 4.3 Tone register

Voice anchor (per D1 §10.4): **Father Stephen Freeman at his best — devotional but never saccharine, theological but never academic, present but never performed.**

Operationalized for saint cards:
- **Third-person narrator.** Never "you" addressing Nolan; never "we" inviting Nolan into a moment. Always "she," "he," "they."
- **Specific over general.** "She was the mother of an emperor" beats "She was important." "He kept the books safe through three persecutions" beats "He was faithful."
- **One striking detail per card.** The detail Nolan will remember tomorrow. (Constantine's mother personally walked Jerusalem looking for the True Cross — that's the detail.)
- **No moralizing.** The card never says "and that is why we should…" The hagiography itself does the work.
- **Vocabulary calibrated to age 10.** "Hagiography" → "the way Orthodox Christians tell the story of a saint." "Council" → "a great gathering of bishops." "Equal-to-the-Apostles" stays — it's a title Nolan will hear and should learn — but it's glossed the first time it appears.

### 4.4 Callout format

Each callout is a small parchment-tinted box (style mirrors the D1 §1.1 speech container, minus the speech-tail — these are not bubbles, they are noticings):

```
┌───────────────────────────────────────┐
│  [TITLE — Cinzel small caps, gold]    │   ← e.g. "THE GOLD HALO"
│  [Body — Crimson Text italic, 30-60w] │
└───────────────────────────────────────┘
```

Callout body is structured as:
1. **Visual hook** — what to look at in the icon ("See the gold circle around her head…")
2. **Meaning** — what it says ("…that's how an icon says she is holy.")
3. **Tie-back** — connects to the broader lesson ("Every saint has one — it's the first thing to look for.")

This three-beat structure should hold across every callout in the corpus.

### 4.5 Modal close behavior

Card opens as a full-viewport overlay matching the existing `lc-overlay` / `lc-card` pattern in `js/liturgical-calendar-home.js` (which is the pattern Wave 2, 20-IMPL-B, and DP-MICRO modals also followed).

Close affordances:
- **Tap outside the card** (on the overlay backdrop) → closes
- **Gold ✕ button** in the top-right of the card → closes
- **Swipe-down on mobile** (≥80px vertical drag) → closes
- **ESC key** (iPad with keyboard, accessibility) → closes

On close: if this was Nolan's first view of this saint, the saint is appended to his `saints_met` archive (see §9.3). Subsequent reopens do not re-append.

### 4.6 Mobile + iPad responsive

| Surface | Card width | Icon dimensions | Notes |
|---|---|---|---|
| iPhone portrait (~390px) | 100vw - 16px margin | 160×208 | Single column; callouts stack |
| iPad portrait (~768px) | min(560px, 90vw) | 200×260 | Card centered; callouts stack |
| iPad landscape (~1024px) | min(640px, 70vw) | 220×286 | Card centered; callouts stack |
| iPad Pro (~1366px) | min(720px, 60vw) | 240×312 | Card centered; callouts stack |

All callouts stack vertically on all viewports (no two-column callout grid). Vertical stacking keeps the reading rhythm slow — Nolan reads the body, then notices each callout in sequence.

`prefers-reduced-motion`: modal appears/disappears without fade; no scroll-snap; respects user setting (per D1 §1.5).

---

## 5. SAINT ICON IMAGERY SOURCING

### 5.1 Default — public-domain canonical icons

Most named Orthodox saints (and certainly every saint on the month-1 priority list) have widely-reproduced canonical icons available in the public domain or under permissive Creative Commons licenses.

**Primary sources, in order of preference:**

1. **OrthodoxWiki.org** — Each major saint has an article with a canonical icon, almost always public domain or CC-BY-SA. License notes are visible on each image page.
2. **Wikimedia Commons** — Cross-referenced with OrthodoxWiki. Search "Icon of [Saint Name]"; filter by Public Domain or CC-BY-SA. Wikimedia license metadata is reliable.
3. **GOA (Greek Orthodox Archdiocese of America)** at goarch.org/chapel/saints — Each daily saint listing carries an icon image. Many are GOA-produced and freely distributable for catechetical use; check the page footer for licensing.
4. **Antiochian Orthodox Christian Archdiocese** at antiochian.org — Saint icon library with similar permissive use posture for educational purposes.
5. **Iconostasis.com** and **Damascene Gallery** — Modern iconographers; some offer free educational use, others require purchase. Check on a per-icon basis.

**Attribution policy** (record in the JSON entry, even when the image is fully public domain):
```json
"icon": {
  "asset_path": "/assets/saints/constantine-and-helen.png",
  "source": "Wikimedia Commons",
  "source_url": "https://commons.wikimedia.org/wiki/File:....",
  "license": "Public Domain",
  "attribution": "Anonymous Byzantine iconographer, 14th century; photograph public domain via Wikimedia Commons"
}
```

Attribution is not surfaced in the card UI (the card is the saint, not the photograph). Attribution lives in the JSON for documentation, license-compliance, and the eventual "Credits" page in the Field Manual's deep archive.

### 5.2 MJ fallback — for saints without canonical public-domain sources

A small number of saints on the month-1 list are minor enough that good canonical icon sources may not exist (e.g., some local Western saints like Botolph of Ikanhoe, or hieromartyrs commemorated only in regional calendars). For these, Midjourney generation is the named fallback.

**MJ prompt template — 3-variation block** (mirrors D4 §5.2 structure):

**Variation A — Byzantine-icon register (default):**
```
Byzantine Orthodox icon of [SAINT NAME], traditional egg-tempera
on gesso-coated wood panel, 12th-15th century iconographic style.
Frontal pose, head haloed in burnished gold leaf, gaze direct.
[Specific attributes for this saint — e.g., "Bishop's omophorion
with crosses, holding Gospel book in left hand, right hand raised
in blessing"]. Greek inscription above head: О АГІОС [NAME] (or
Η АГІА [NAME] for a female saint). Background: solid gold leaf,
not naturalistic. Color palette limited to: gold, sienna brown,
deep red, navy, ochre, ivory. Hands and face rendered in highlight
layers over olive-toned base, NOT photorealistic. Visible egg
tempera brushwork, slight aging crackle. Composition: head-and-
shoulders portrait, three-quarter length if attributes require it.
NOT Western religious art. NOT Sacred Heart imagery. NOT Renaissance
painting. NOT cartoon. NOT 3D render. The cross, if present, is a
three-bar Orthodox cross (top short crossbar, main crossbar, slanted
footrest crossbar), NEVER a Latin Crucifix. --ar 3:4 --style raw --v 7
```

**Variation B — Russian icon register (when A reads too austere):**
```
Russian Orthodox icon of [SAINT NAME] in the style of Andrei Rublev
or the Stroganov school, 15th-17th century. Egg tempera on wood
panel with hand-applied gold leaf halo. [Saint attributes...]. The
register is warmer than Byzantine — softer skin tones, slightly
elongated figure, more painterly drapery folds. Greek (or Church
Slavonic) inscription above head. Limited palette: warm gold,
brick red, deep green, ochre, ivory. Frontal gaze, hands in
canonical posture. Background: solid gold leaf. NOT photorealism,
NOT Western religious art, NOT Catholic baroque. Three-bar Orthodox
cross only if a cross is shown. --ar 3:4 --style raw --v 7
```

**Variation C — modern Byzantine revival (fallback if A and B read too "antique"):**
```
Contemporary Eastern Orthodox icon of [SAINT NAME] in the style
of Photios Kontoglou or the Athonite revival tradition, 20th-century
recovery of Byzantine iconographic discipline. Egg tempera technique,
gold leaf halo, cleaner line quality than medieval examples but
fully traditional in composition and theology. [Saint attributes...].
Greek inscription above head. NOT modernist abstraction, NOT
Westernized devotional art, NOT printed reproduction look. Three-bar
Orthodox cross only if a cross is present. --ar 3:4 --style raw --v 7
```

**Common failure modes to fix in iteration** (from D3 §3 and D4 §5.3, adapted for icons):

- *Cross rendered as Western crucifix:* add "three-bar Orthodox cross with slanted footrest" / "NEVER Latin crucifix"
- *Face rendered too photorealistic:* add "highlight-layer face painting technique, NOT photorealism"
- *Halo rendered as ring of light or aurora:* add "flat gold leaf disc behind head, NOT glow effect"
- *Sacred Heart or Catholic devotional aesthetic creeping in:* add "Eastern Orthodox iconographic tradition only, NOT Western devotional imagery"
- *Hands wrong on blessing gesture:* add "three fingers folded together for Trinity, two fingers down for Christ's two natures"
- *Greek letters rendered as garbled glyphs:* the model will not reliably render Greek text — accept the garbled output, then overlay real Greek text in Procreate/Canva (per D4 §5.4 touch-up pattern)

Kevin handles MJ generation per the D4 pipeline; spec provides prompts.

### 5.3 Asset format + path

- **File format:** PNG, transparent background where the source supports it; parchment-toned background (`#F0E4C8`) where transparency isn't clean (large flat-background icons may keep their solid gold-leaf field).
- **Dimensions:** 600×780 (3:4 aspect, matching icon proportions). Single export. CSS scales down responsively per §4.6.
- **Path:** `/assets/saints/<slug>.png` — e.g., `/assets/saints/constantine-and-helen.png`
- **Service worker:** Chat 20 adds saint icons to `sw.js` STATIC_ASSETS and bumps cache version. Pre-cache the month-1 14 icons on first install; lazy-cache the rest. (Same pattern as character portraits per ASSETS_README.md.)
- **Alt text:** authored in the JSON `icon.alt_text` field. Format: "Orthodox icon of [Saint Name] — [brief visual description: 'haloed, holding Gospel book, blessing hand']" — accessible to VoiceOver and matches the iconographic reading framework.

---

## 6. SAINT CONTENT AUTHORING TEMPLATE

For the downstream content chat that will author the full corpus. Pattern matches marginalia v1 (`topic-00-marginalia-v1.json` is the precedent).

### 6.1 Life story structure (4-beat shape)

A reliable saint card body follows four beats:

1. **Era anchor (1 sentence)** — where and when. ("Constantine was the Roman emperor in the years just after Christianity stopped being illegal.")
2. **Role and what they did (3-5 sentences)** — the specific work they're remembered for. Names, dates, places where they sharpen the picture; vague language where they don't.
3. **One specific scene (2-3 sentences)** — a single moment the reader can picture. The detail Nolan will remember tomorrow.
4. **What the Church says they did for Christ (1-2 sentences)** — the theological weight of the saint, named plainly. ("The Church calls her *Equal-to-the-Apostles* because she found the cross that Peter and the others never saw.")

### 6.2 Callout structure (visual element → meaning → tie-back)

Three-beat structure (already specified in §4.4). For the content chat:
- Pick 2-3 visual elements from the saint's actual icon
- Name each plainly in the title (Cinzel small caps, ≤4 words)
- Body follows the visual hook → meaning → tie-back rhythm
- One callout per card should be tied to whichever foundational lesson is next in Nolan's sequence (if applicable); the others apply prior lessons

### 6.3 Voice cheatsheet

**Do:**
- "She walked to Jerusalem herself, an old woman in her seventies, looking for where the cross had been buried."
- "He spent thirty years in a cave writing letters."
- "The emperor's mother asked him for one thing: build churches at the holy places."
- "They were sisters of Lazarus — the same Lazarus Christ raised from the dead. The Church remembers them on the same day because they belonged together in life."
- *Tone reference:* Father Stephen Freeman at his best — devotional but never saccharine, theological but never academic, present but never performed.

**Don't:**
- *Don't:* "Wow, isn't it amazing that…" (mascot drift — D1 §1.2 register applies even to narrator voice)
- *Don't:* "And so, kids, the lesson is…" (no moralizing; the saint's life is the lesson)
- *Don't:* "Theo and his dad both love this saint because…" (no Theo/Christopher dialogue inside cards)
- *Don't:* "Mom says we should pray to St. X." (Mom is never a speaker — D1 §1.8)
- *Don't:* "Father Nicholas would say…" (deferred — D1 §1.7)
- *Don't:* "Some scholars debate whether…" (academic register; not the voice)
- *Don't:* fictional embellishment beyond what hagiography records. If hagiography says she traveled to Jerusalem at age 70, you can say "an old woman in her seventies"; you cannot invent a detail like "and her hands were cold from the journey."

### 6.4 What NOT to do (structural)

- **No Theo/Christopher dialogue inside cards** — the marginalia format and the saint card format are *complementary, not nested*. A saint card on St. John the Baptist may live in the home Liturgical Calendar surface; the marginalia for the session on the same day may have Theo and Christopher discussing him in the Bible reader. They are two different surfaces. Cards stay narrator-voiced.
- **No didactic instructions** to Nolan ("Try to be brave like St. Constantine"). Hagiography is allowed to be its own teacher.
- **No saints whose feast falls outside Topic 00** (May 18 - Aug 24, 2026) in v1 corpus. The cards are gated by the liturgical calendar surface — a Sept 24 saint (e.g., Kevin's actual patron St. Silouan) would never become tappable in the Topic 00 launch window. Authoring is in scope for content chat *only* for saints whose commemoration falls within the launch window's calendar coverage.
- **No paired-card embellishment** beyond what the calendar entry implies. Constantine & Helen share May 21 in the GOArch calendar, so they share a card. Mary & Martha share Jun 4, so they share a card. Macrina & Emilia share May 30, so they share a card. Do not invent pairings where the calendar does not authorize them.

### 6.5 Priority saint list — month 1 (May 18 – Jun 18, 2026)

The downstream content chat authors these 14 saints first. They cover every major and great feast in the launch month plus the most catechetically dense named saints. **June 3 (St. Kevin of Glendalough) is included as a regular saint commemoration — it is NOT a name-day surface for Kevin (his patron is St. Silouan, Sept 24, outside Topic 00).** Author June 3 like any other Topic 00 saint.

| # | Date | Saint(s) | Type | Rank | Notes |
|---|---|---|---|---|---|
| 1 | May 21 | Constantine & Helen | paired | major | Holy Ascension week; Equal-to-the-Apostles; True Cross detail; **D5 worked example** |
| 2 | May 23 | Mary the Myrrhbearer (wife of Cleopas) | single | minor | Gospel-figure thread from Pascha |
| 3 | May 24 | Fathers of the 1st Council | group | major | Sunday — Nicaea, the Creed |
| 4 | May 25 | John the Baptist (Third Finding of the Head) | single | minor | The Forerunner; major Orthodox saint |
| 5 | May 27 | Venerable Bede | single | minor | Western pre-schism saint, accessible to kids |
| 6 | May 30 | Macrina & Emilia | paired | minor | Grandmother + mother of St. Basil; family-sanctity theme |
| 7 | May 31 | Holy Pentecost | feast-as-card | great | Apostolic descent; one card for the feast, not for individual apostles |
| 8 | Jun 1 | Justin the Philosopher & Martyr | single | minor | Early apologist; the "philosopher saint" |
| 9 | Jun 3 | Kevin of Glendalough | single | minor | Regular saint card; NOT a name-day surface (see §6.4 note) |
| 10 | Jun 4 | Mary & Martha (sisters of Lazarus) | paired | minor | Gospel figures; family-sanctity theme |
| 11 | Jun 7 | Sunday of All Saints | feast-as-card | major | Sunday; the whole communion of saints |
| 12 | Jun 9 | Cyril of Alexandria | single | minor | Christological theologian; *Theotokos* defender (recommended over Columba of Iona, also commemorated this day) |
| 13 | Jun 11 | Bartholomew & Barnabas | paired | minor | Twin apostles; both share this day |
| 14 | Jun 15 | Augustine of Hippo | single | minor | Western Father in the Eastern calendar; recognizable name |

**Card-type definitions:**
- *single* — one saint, one card
- *paired* — two saints commemorated together; one card with both names in the header
- *group* — three+ saints commemorated as a unit (e.g., "Fathers of the 1st Council"); one card with the group's name
- *feast-as-card* — a major feast day where the card is about the *feast* (Pentecost, All Saints) rather than a single saint

---

## 7. DATA MODEL

### 7.1 Recommendation — static JSON

Storage: `/docs/content/saints/topic-00-saints-v1.json`

Rationale:
- Mirrors the existing `topic-00-marginalia-v1.json` pattern — the content chat that authored marginalia can pattern-match its workflow.
- No Supabase migration cost. The corpus is version-controlled with the codebase; changes go through PR review.
- Read once on app load, cached in service worker, fast for the LC surface tap interaction.
- Easy to lint and validate (JSON schema in CI if needed).

**Optional migration path to Supabase table (v1.1+):**
If, post-launch, content needs admin editing through the existing admin.html surface, a `saints` table can be created mirroring the JSON schema 1:1. Migration: read JSON, INSERT rows. Slug-matching code does not change. This is *not* a v1 task.

### 7.2 JSON schema + canonical example

```json
{
  "version": "1.0",
  "topic_id": "00",
  "topic_title": "Coming Home",
  "saints_count": 14,
  "authored": "2026-05-XX",
  "voice_anchor": "D5 §6.3 — Father Stephen Freeman at his best; narrator third-person; no character dialogue inside cards",
  "iconography_lessons": [
    { "id": 1, "title": "The Halo", "key": "halo" },
    { "id": 2, "title": "Hands", "key": "hands" },
    { "id": 3, "title": "What Saints Hold", "key": "held_objects" },
    { "id": 4, "title": "Robes and Colors", "key": "robes_colors" },
    { "id": 5, "title": "Greek Letters", "key": "greek_inscriptions" },
    { "id": 6, "title": "Face and Gaze", "key": "face_gaze" }
  ],
  "saints": [
    {
      "slug": "constantine-and-helen",
      "display_name": "Saints Constantine and Helen",
      "alternate_names": [
        "Constantine and Helen, Equal-to-the Apostles",
        "Constantine and Helen Equal-to-the-Apostles",
        "Constantine the Great",
        "Helen, Equal-to-the-Apostles",
        "Saint Constantine",
        "Saint Helen"
      ],
      "commemoration_date": "05-21",
      "card_type": "paired",
      "rank": "major",
      "honorific": "Equal-to-the-Apostles",
      "icon": {
        "asset_path": "/assets/saints/constantine-and-helen.png",
        "source": "Wikimedia Commons",
        "source_url": "https://commons.wikimedia.org/wiki/...",
        "license": "Public Domain",
        "attribution": "Anonymous Byzantine iconographer, 14th c.; photograph public domain via Wikimedia Commons",
        "alt_text": "Orthodox icon of Saints Constantine and Helen flanking the True Cross, both crowned and robed in royal red and gold"
      },
      "life_story": "Constantine was the Roman emperor...",
      "callouts": [
        {
          "lesson_ref": "halo",
          "title": "THE GOLD HALOS",
          "body": "Look at the gold circles around their heads..."
        },
        {
          "lesson_ref": "held_objects",
          "title": "THE TRUE CROSS",
          "body": "Between them they hold a cross..."
        },
        {
          "lesson_ref": "robes_colors",
          "title": "ROYAL RED AND GOLD",
          "body": "Their robes are royal red and gold..."
        }
      ],
      "quoted_attribution": null
    }
  ]
}
```

**Field reference:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | yes | URL-safe; lowercase; hyphenated; must be unique within the file |
| `display_name` | string | yes | Card header text |
| `alternate_names` | string[] | yes (may be empty) | All known calendar-name variants for slug matching |
| `commemoration_date` | string | yes | `MM-DD` format (recurring annual) |
| `card_type` | enum | yes | `single` / `paired` / `group` / `feast-as-card` |
| `rank` | enum | yes | `great` / `major` / `minor` (mirrors `liturgical_calendar.feast_rank`) |
| `honorific` | string \| null | optional | E.g., "Equal-to-the-Apostles", "the Forerunner", "the Wonderworker" |
| `icon` | object | yes | Asset path + sourcing metadata |
| `life_story` | string | yes | 150-250 word body |
| `callouts` | object[] | yes | 2-3 callouts per saint; each with `lesson_ref`, `title`, `body` |
| `quoted_attribution` | object \| null | optional | If a direct historical-saint quote is included; renders as `[Name] said: "…"` |

### 7.3 Slug-matching strategy

The liturgical calendar surface holds saint names as strings inside the `saint_commemorations` text[] column. These strings are inconsistent in format (titles, honorifics, parenthetical clarifications, capitalization). The slug matcher needs to be lossy and forgiving.

**Match algorithm** (Chat 20 implements; spec defines):

1. **Normalize the calendar string:**
   - Lowercase
   - Strip leading/trailing whitespace
   - Strip honorifics: `"saint "`, `"st. "`, `"the holy "`, `"holy "`, `"our righteous father "`, `"our father among the saints "`, `"venerable "`, `"father "`, `"bishop "`, etc. (full list maintained in the matcher)
   - Strip trailing titles: `", equal-to-the-apostles"`, `", patriarch of constantinople"`, `", bishop of [city]"`, `", the wonderworker"`, etc.
   - Remove diacritics (NFD + strip combining marks)
   - Collapse whitespace to single space
   - Hyphenate: replace spaces with hyphens
   - Strip non-alphanumeric except hyphens

2. **Match attempts (in order):**
   - Direct match: normalized calendar string == saint.slug → match
   - Alternate match: normalized calendar string matches any normalized entry in `alternate_names[]` → match
   - Token-overlap fallback (optional, v1.1): if ≥ 2 distinct name tokens overlap between calendar string and a saint's full normalized identity bag, surface as a *candidate* with a confidence score; do not auto-match (would require disambiguation logic)

3. **No match:** the calendar string renders as plain `<li>` text in the drawer, with no tap affordance. No toast, no error.

**Authoring duty for content chat:** when authoring each saint, run the chat against the actual `liturgical_calendar.saint_commemorations` corpus for that saint's commemoration date and populate `alternate_names[]` with every literal variant the corpus contains. This is the same Op Learning #5 discipline that surfaced in Dispatch 3a — verify literals against actual corpus, never against assumed name forms.

### 7.4 (deferred) Migration path to Supabase table

Out of scope for v1. If admin editing of saint content becomes a need post-launch, the migration is:
- `CREATE TABLE saints (slug text PRIMARY KEY, …)` mirroring JSON schema
- INSERT from JSON
- Service worker keeps the JSON read for offline; admin.html edits write to Supabase; a build step regenerates the JSON from the table on each deploy
- Slug-matching code in `liturgical-calendar-home.js` is unchanged; only the data source flips

---

## 8. LITURGICAL CALENDAR SURFACE INTEGRATION

### 8.1 Current rendering location

File: `js/liturgical-calendar-home.js`
Function: `_renderDrawerBody(cell)`
Insertion point: line ~710, inside the `saintsBlock` generation:

```javascript
saintsBlock = ''
  + '<hr class="lc-card-divider" />'
  + '<div class="lc-card-section-title">Also Commemorated</div>'
  + '<ul class="lc-card-saints">'
  +   saints.map(s => '<li>' + esc(s) + '</li>').join('')
  + '</ul>';
```

The `feast_name` (top of the drawer body) and `sunday_name` (Sunday cells) also surface saint identities and should be tap-eligible — Chat 20 wires those too, not just the "Also Commemorated" list.

### 8.2 Tap-state insertion — visual affordance

For each saint string the drawer renders, the matcher runs (per §7.3). If matched to a saint slug:
- The `<li>` (or feast name) becomes wrapped in a tap surface
- Visual cue: **gold underline (1px, `#C9A84C`) + a small `✦` glyph appended after the name** (the ✦ pattern matches the cover-corner-mark vocabulary in journal.html and the divider mark in the Field Manual divider)
- ARIA: `role="button" aria-label="Open Saint <name>"`
- Cursor: `pointer` on desktop/iPad; on touch: standard tap target ≥ 44×44 px

CSS sketch (Chat 20 finalizes):
```css
.lc-card-saints li.lc-saint-tappable {
  cursor: pointer;
  position: relative;
  padding-right: 1.25rem;
}
.lc-card-saints li.lc-saint-tappable::after {
  content: '✦';
  position: absolute;
  right: 0.25rem;
  color: #C9A84C;
  font-size: 0.85em;
}
.lc-card-saints li.lc-saint-tappable .lc-saint-name {
  text-decoration: underline;
  text-decoration-color: #C9A84C;
  text-underline-offset: 3px;
}
```

### 8.3 Graceful degrade

For each saint string with no slug match:
- Render as plain `<li>` text (current behavior, no change)
- No tap affordance
- No tooltip, no toast, no error logging visible to user
- Engineering may console.debug for content-chat feedback (so the team can see which calendar strings are missing slug entries and add them to a downstream authoring queue)

### 8.4 Tap behavior + modal open

On tap of a matched saint:
1. Load saint data from the in-memory JSON corpus (already fetched + cached on app load)
2. Open the saint modal overlay (per §4.5 close behavior; opens with reverse) on top of the LC drawer — *not* replacing the drawer; the drawer stays open underneath
3. Close the modal: returns to the LC drawer (which is still open); user can tap another saint, or close the drawer
4. If this is the first view of this saint by this explorer: append to `saints_met` archive (per §9.3)

Stacked-modal note: the LC drawer + saint card both being open simultaneously is intentional. It gives Nolan a sense of *being inside the day*, with the saint card as a deeper window into one figure in that day. Close hierarchy is bottom-up — closing the saint card returns to the drawer; closing the drawer returns to the home dashboard.

---

## 9. FIELD MANUAL ARCHIVE — "SAINTS I'VE MET"

### 9.1 New section below Past Entries

In `journal.html`, after the existing `<!-- PAST ENTRIES -->` block ends (line ~662), add a new section:

```html
<!-- DIVIDER -->
<div class="journal-divider">
  <div class="divider-line"></div>
  <div class="divider-mark">✦ Saints I've Met ✦</div>
  <div class="divider-line"></div>
</div>

<!-- SAINTS ARCHIVE -->
<div class="saints-archive-section">
  <div class="saints-archive-header">
    <div class="saints-archive-title" id="saints-archive-title">Your Saints Archive</div>
    <div class="saints-archive-count" id="saints-archive-count"></div>
  </div>
  <div id="saints-archive-list"></div>
</div>
```

Not a fourth filter on Past Entries — saint cards are system-generated, not user-authored. The divider preserves the conceptual line between "what Nolan wrote" and "who Nolan has met."

### 9.2 List rendering

Each archive item is a small horizontal card:

```
┌──────────────────────────────────────────────┐
│  [icon thumbnail]   Saints Constantine & Helen │
│      80×104         Equal-to-the-Apostles      │
│                     First met: May 21, 2026    │
└──────────────────────────────────────────────┘
```

- **Thumbnail:** 80×104 (3:4), the same icon used in the card, scaled down. Same parchment frame.
- **Name:** Cinzel, 1rem, deep red `#8B1A1A` (matches journal divider mark color)
- **Honorific subtitle:** Crimson Text italic, 0.85rem, `rgba(61,31,8,0.7)`
- **First met date:** Crimson Text, 0.75rem, `rgba(61,31,8,0.55)` — date Nolan first opened this saint's card
- **Tap surface:** entire card row; opens the same saint micro-card modal (per §4)

**Sort order:** reverse-chronological (most recent first). Empty state: "You haven't met any saints yet. Tap a saint name on the home calendar to begin." rendered in Crimson Text italic.

### 9.3 When a card joins the archive

On first tap of a saint card by a given explorer:
- Append `{slug, first_met_at}` to a per-explorer `saints_met` collection
- Subsequent reopens of the same card do NOT re-append (idempotent)

**Storage:** Engineering call for Chat 20 — recommended: new `saints_met` JSONB array on `profiles.onboarding_state` (consistent with the welcome-flow pattern from Chat S), OR a dedicated `explorer_saints_met` table if querying patterns warrant. Spec recommends the JSONB approach for v1 simplicity:

```json
"onboarding_state": {
  "welcome_completed_at": "2026-05-18T07:14:00Z",
  "saints_met": [
    { "slug": "constantine-and-helen", "first_met_at": "2026-05-21T09:42:00Z" },
    { "slug": "mary-myrrhbearer-cleopas", "first_met_at": "2026-05-23T08:11:00Z" }
  ],
  "iconography_lessons_seen": [1, 2]
}
```

### 9.4 Tap on archive item → reopens modal

Tap on an archive item opens the saint micro-card modal exactly as if Nolan had tapped the saint in the home LC drawer. The card does not re-trigger the iconography-lesson banner on reopens — that banner was rendered on the *first* view, which is what counts toward Nolan's `iconography_lessons_seen` array.

### 9.5 Admin / parent read-only view

Existing admin view in journal.html (`?admin=1` + role check) renders the *selected explorer's* journal, not the admin's own. The same applies to the saints archive: when Danyelle or Kevin views Nolan's Field Manual, the archive shows *Nolan's* saints, not theirs. No write affordances — admin can read, cannot remove from archive.

Implementation: the existing `viewingExplorerId` state variable already drives the loadEntries call. Chat 20 adds an equivalent `loadSaintsArchive(viewingExplorerId)`.

---

## 10. FATHER NICHOLAS ARCHITECTURE LOCK CHECK

D1 §1.7: Father Nicholas is deferred across all v1 formats. Confirming compatibility:

**The card narrator is the app, not a character.** Saint cards have no character speaker — no Theo, no Christopher, no Mom, no Father Nicholas. The voice is third-person narration, descriptive of the saint. This is structurally outside the "speaker" category D1 §§ 1.7 and 1.8 govern. There is nothing to defer because there is no character to author.

**Direct quotes from historic saints are attributed, not voiced.** If a card includes a famous saying — e.g., "St. John Chrysostom said: 'Christianity is the imitation of the divine nature.'" — the saint is named as a quoted historical source. This is no different from a textbook quoting a historical figure. It does *not* introduce a recurring speaker. The historic saint is named once per card, in attribution, never elsewhere.

**Sacramental subject matter belongs to other surfaces.** If a saint's hagiography touches on a sacrament (e.g., a hieromartyr-bishop who baptized thousands), the card describes what *that saint did in their time*. Teaching about *how baptism works today* lives in session content, not in saint cards. Father Nicholas v1, when it ships, will live in those teaching surfaces — not retroactively in saint cards.

**PASS.** When Father Nicholas v1 ships, no rework is needed in the saint-card corpus.

---

## 11. WORKED EXAMPLE — Saints Constantine & Helen (May 21)

This is the first major saint(s) Nolan encounters in Topic 00. Paired card. First iconography lesson candidate.

### 11.1 Life story (216 words)

> Constantine was the Roman emperor in the years just after Christianity stopped being illegal. For three hundred years before him, being a Christian could get you killed by the Roman state. Constantine changed that. In the year 313 he signed an edict that gave Christians freedom to worship openly. Twelve years later, in 325, he called the great gathering of bishops at Nicaea that gave the Church the Creed Orthodox Christians still say every Sunday.
>
> Helen was his mother. She became a Christian later in life and turned out to be one of the most determined pilgrims the Church has ever known. When she was already in her seventies, she made the long journey from Constantinople to Jerusalem and walked the holy places herself, asking the local Christians to show her where Christ had lived and died. She found the place of the crucifixion, had it excavated, and uncovered the True Cross — the actual cross Jesus had been nailed to. Constantine built churches there, at her direction, that still stand.
>
> The Church calls them both *Equal-to-the-Apostles*. The apostles preached Christ; Constantine and Helen gave Christ's Church a place to stand in the world. They are commemorated together on May 21.

### 11.2 Three callouts

**Callout 1 — Lesson 1 (the halo)**
```
THE GOLD HALOS
Look at the gold circles around both their heads.
That's how an icon says they are holy. Every saint
has one — it's the first thing to look for. The gold
isn't paint pretending to be light; it's the icon
telling you the light of God is in them.
```

**Callout 2 — Lesson 3 (what saints hold)**
```
THE TRUE CROSS BETWEEN THEM
Between Constantine and Helen the icon almost always
shows a tall cross. That's the True Cross — the one
Helen found in Jerusalem. The icon is saying: she
went looking, she found it, and the cross still
stands between them. It's the reason they share a
feast day.
```

**Callout 3 — Lesson 4 (robes and colors)**
```
ROYAL RED AND GOLD
Their robes are royal red and gold. Real Roman
emperors and empresses wore this kind of color — but
the icon dresses them this way for a deeper reason
too. They were a king and queen on earth, but the
icon is naming them king and queen of a much bigger
kingdom. The colors say: they belong to it now.
```

### 11.3 JSON shape (verbatim from §7.2 + body text filled in)

```json
{
  "slug": "constantine-and-helen",
  "display_name": "Saints Constantine and Helen",
  "alternate_names": [
    "Constantine and Helen, Equal-to-the Apostles",
    "Constantine and Helen Equal-to-the-Apostles",
    "Saints Constantine and Helen",
    "Constantine the Great",
    "Helen, Equal-to-the-Apostles",
    "Empress Helen",
    "Saint Constantine",
    "Saint Helen"
  ],
  "commemoration_date": "05-21",
  "card_type": "paired",
  "rank": "major",
  "honorific": "Equal-to-the-Apostles",
  "icon": {
    "asset_path": "/assets/saints/constantine-and-helen.png",
    "source": "Wikimedia Commons",
    "source_url": "https://commons.wikimedia.org/wiki/File:Constantine_and_Helen_icon.jpg",
    "license": "Public Domain",
    "attribution": "Anonymous Byzantine iconographer, 14th c.; photograph public domain via Wikimedia Commons",
    "alt_text": "Orthodox icon of Saints Constantine and Helen flanking the True Cross, both crowned and robed in royal red and gold, with Greek inscriptions above their heads"
  },
  "life_story": "Constantine was the Roman emperor in the years just after Christianity stopped being illegal... [full 216-word body per §11.1]",
  "callouts": [
    { "lesson_ref": "halo",         "title": "THE GOLD HALOS",            "body": "Look at the gold circles around both their heads..." },
    { "lesson_ref": "held_objects", "title": "THE TRUE CROSS BETWEEN THEM", "body": "Between Constantine and Helen the icon almost always shows..." },
    { "lesson_ref": "robes_colors", "title": "ROYAL RED AND GOLD",        "body": "Their robes are royal red and gold..." }
  ],
  "quoted_attribution": null
}
```

### 11.4 MJ prompt (reference only — canonical icon exists)

The canonical icon of Constantine & Helen with the True Cross is widely available in the public domain (Wikimedia Commons, OrthodoxWiki). MJ generation is not needed for this saint. The prompt block is shown here only as a *template reference* for downstream saints (like Botolph of Ikanhoe or rarer hieromartyrs) that may need fallback generation.

**Variation A (default Byzantine icon register):**
```
Byzantine Orthodox icon of Saints Constantine and Helen, traditional
egg-tempera on gesso-coated wood panel, 14th-century iconographic
style. Both figures shown frontally, crowned, haloed in burnished
gold leaf, gazes direct. Constantine on the left, beard, royal red
imperial robe with gold orphreys, holding a small scepter. Helen on
the right, white veil, royal purple-red robe with gold trim. Between
them, standing vertically from the floor to above their heads, a
tall slender three-bar Orthodox cross — top short crossbar, main
crossbar where Christ's hands would be, slanted footrest at the
bottom. Greek inscriptions above heads: О АГІОС КΩΝСΤΑΝΤΙΝΟС above
Constantine, Η АГІА ΕΛΕΝΗ above Helen. Background: solid gold leaf,
not naturalistic. Color palette limited to: gold, royal red, deep
purple, sienna brown, navy, ivory. Faces and hands rendered in
highlight layers over olive-toned base, NOT photorealistic. Visible
egg-tempera brushwork, subtle aging crackle. Composition: head-to-
mid-thigh portrait, both figures equal in height. NOT Western
religious art, NOT Sacred Heart, NOT Renaissance, NOT cartoon, NOT
3D render. The cross is the three-bar Orthodox cross with slanted
footrest, NEVER a Latin Crucifix. --ar 3:4 --style raw --v 7
```

If Variation A reads too austere, swap to Variation B (Russian register) or C (modern Byzantine revival) per §5.2 template.

---

## 12. ENGINEERING HANDOFF — for Worker Chat 20

When Chat 20 fires to wire this feature, here's what they need to know up front. Read this section first.

### 12.1 Build order

1. Author or stub the JSON corpus at `/docs/content/saints/topic-00-saints-v1.json` (content chat output — may stub initially with just St. Constantine & Helen from the worked example for build verification)
2. Source / place the icon assets at `/assets/saints/<slug>.png` (initial 14; rest as authored)
3. Add a static-fetch + cache step on app load to read the JSON corpus into memory (mirrors the marginalia loader pattern)
4. Implement the slug-matching function per §7.3 — this is the bridge between the LC surface and the JSON corpus
5. Modify `js/liturgical-calendar-home.js` `_renderDrawerBody()`:
   - Map each saint in `saint_commemorations` through the slug matcher
   - Wrap matched names in `<li class="lc-saint-tappable">` with name span + ✦ glyph
   - Wire tap handler → open saint modal
   - Also wire feast_name and sunday_name when they match a slug
6. Build the saint modal overlay component — open from any surface (LC drawer, archive item)
7. Track per-explorer state: `saints_met` array on `profiles.onboarding_state` JSONB; `iconography_lessons_seen` array on same
8. Modify `journal.html` — append the new `✦ Saints I've Met ✦` divider + archive section
9. Load + render archive items reverse-chronologically; admin-view-aware (per §9.5)
10. sw.js: bump cache version (current at v29 per user memory); add saint icon assets + JSON path to STATIC_ASSETS

### 12.2 Patterns to mirror

- **Modal overlay pattern:** `lc-overlay` / `lc-card` in `liturgical-calendar-home.js` (Chat 3) — same open/close affordances, same `aria-modal`, same close-button styling. Wave 2 / 20-IMPL-B / DP-MICRO inline modals share this pattern.
- **JSON loader pattern:** marginalia loader (`/docs/content/topic-00-marginalia-v1.json`) — same fetch + cache + service worker integration shape
- **State storage pattern:** welcome flow (Chat S) — `profiles.onboarding_state` JSONB; ET-aware timestamps via `WeekUtils`
- **Admin view pattern:** existing `viewingExplorerId` + `isAdminView` in journal.html

### 12.3 Pre-flight checks

- Confirm `liturgical_calendar.saint_commemorations` corpus is populated for the launch window (verified in D5 discovery: rows present May 18 - Jun 18, 2026 with named saints)
- Confirm `topic-00-saints-v1.json` validates against the JSON schema in §7.2
- Confirm slug matcher unit tests pass against the actual corpus strings (Op Learning #5 — verify literals against real data)
- Confirm all 14 month-1 icon assets exist at `/assets/saints/<slug>.png` (or stub with placeholder if content chat hasn't sourced yet)

### 12.4 Known seams

- **Lockstep update warning:** the LC drawer's `_renderDrawerBody()` has multiple saint-rendering sites — the "Also Commemorated" list (line ~710), the `feast_name` rendering, and the `sunday_name` rendering. All three may surface tap-eligible saints. Chat 20 must update all three sites together.
- **iOS PWA service worker:** existing project pattern uses cache-bump on every static-asset addition (per user-memory: "No service worker bump needed for `games/` directory files; runtime fetch-and-cache, not precached"). Saint icons and the JSON corpus are precached at install, so they DO require a bump.
- **`prefers-reduced-motion`:** the modal stacking (LC drawer + saint card simultaneously) is intentional. With reduced motion: cards appear/disappear without transition. The stacking still happens, just instantly.

### 12.5 Out of scope for Chat 20 (handle in sibling dispatch or v1.1)

- Full Topic 00 saint corpus authoring (content chat owns)
- Saint icon imagery sourcing for saints beyond the month-1 14 (downstream incremental)
- Father Nicholas voice / imagery (deferred per D1 §1.7)
- Supabase migration of saint data (v1.1+ if admin editing is needed)
- A "Credits" page surfacing icon attribution metadata (deferred to Field Manual deep-archive dispatch)

---

## 13. CLOSING NOTES

This spec gives Worker Chat 20 a complete buildable feature and gives the downstream content chat a complete authoring template. The two features — iconography literacy and saint biography micro-cards — are a single feature in two faces. Nolan won't experience them as two systems; he'll just experience the daily Liturgical Calendar growing teeth.

Six lessons in the first six taps. After that, the lessons keep working — the icons keep speaking — and Nolan slowly builds the literacy his godfather and grandmothers learned the same way for a hundred generations before him.

D1 closed the format brief. D2 closed the production pipeline. D3 closed the field-journal sketch system. D4 closed the sacred-geography map. D5 closes the saint-card system and the iconography literacy primer that rides inside it.

☩ Glory to God for all things.
