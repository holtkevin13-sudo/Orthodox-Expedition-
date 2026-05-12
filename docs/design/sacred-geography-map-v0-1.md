# SACRED GEOGRAPHY MAP — v0.1
## Design Brief — The Orthodox Expedition

**Status:** Phase 1 path locked (Hybrid / Path C); Phase 2 full design brief — ground truth for image production and engineering Chat 15
**Date:** May 12, 2026
**Author:** Designer Chat D4
**Consumed by:** Kevin (image production), Engineering Chat 15 (map.html build), future content-authoring chats (region-flavor enrichment), future designer chats (v1.0 character placement + Saint Biography Micro-Cards integration)
**Pre-launch posture:** v0.1 ships one static map image + one new HTML page on Mon May 18, 2026, reached from the Topics page above the Topic 00 panel. v1.0 path documented for post-launch enrichment without rework.
**Companion documents:**
  - `/docs/design/COMIC_DESIGN_BRIEF.md` — cross-format non-negotiables, visual vocabulary, voice register
  - `/curriculum.html` — Topic 00 panel pattern, ✦ corner ornament dialect, Cinzel Decorative drop-cap treatment
  - `/assets/characters/theo-christopher-hero.png` — emotional/visual register for landscape expedition compositions

---

## 0. EXECUTIVE SUMMARY

The Sacred Geography Map makes the project's central metaphor — *expedition* — visible. Without it, "The Orthodox Expedition" is a title; with it, Nolan can see the territory he is walking. v0.1 is deliberately minimal: one static illuminated-manuscript-register map showing 10 catechetical topic-regions, with Topic 00 marked "you are here," reached from the Topics page via a quiet link above the Topic 00 panel.

The path locked in Phase 1 is **Hybrid (Path C)**: a stylized illuminated-map spine, no real-geographic anchoring at v0.1, but real-Orthodox ambient vocabulary (domed monastery silhouette, olive groves, cypress, scattered crosses, stylized waters, East-up orientation, mist-shrouded uncharted territory). Region naming uses the curriculum's actual topic names verbatim for Topics 00, 1, and 2; Topics 3–10 sit collectively in the unmapped southern zone unlabeled until their content ships.

The map is not a game surface, not a dashboard, not a wayfinder. It is a contemplative artifact — the visual answer to the question "where am I in this?" — and its register is illuminated-manuscript, not modern-app.

---

## 1. PATH DECISION (RECAP)

### 1.1 Locked path

**Hybrid (Path C):** Stylized illuminated-map spine with real-Orthodox ambient flavor. Region naming uses catechetical content names verbatim from the Topics page, never real city names. East-up orientation as the small Orthodox theological signal. No characters on the map in v0.1.

### 1.2 Why not pure Path A (purely imagined)

Pure Path A risks Disneyfication despite intention. "The Mountain of Faith" / "The Threshold Lands" naming drifts toward theme-park register fast — the exact failure mode the no-Disneyfication architectural lock warns against. Orthodoxy is incarnational; a faith-map that is pure allegory loses a deep Orthodox value (Father Stephen Freeman register: *"Orthodoxy doesn't float; it's incarnate in places"*).

### 1.3 Why not pure Path B (real geographic anchoring)

Pure Path B is not honestly achievable in 1–2 days pre-launch. It requires defensible topic→place anchoring for all 10 topics, a map projection handling Mediterranean + Russia + Egypt + Aegean coherently, theological defense of each anchoring, and produces a composition where real-geography proportions don't compositionally privilege Topic 00 as the "you are here" focal point. Path B is the v1.5/v2 destination, not the v0.1 deliverable.

### 1.4 Why Hybrid is not a compromise

Hybrid is a better third option. It hits production achievability AND educational substance AND visual continuity AND future-proofing simultaneously, because:

- Catechetical content names cannot Disneyfy — "The Sacraments" is the topic name on the Topics page; calling that region "The Sacraments" on the map is consistent, not theme-park.
- East-up orientation is the quietly Orthodox signal that distinguishes this from a tourist map without ever announcing itself.
- Real-Orthodox ambient vocabulary (domed monasteries, olive groves, scattered crosses) carries incarnational presence without requiring defensible geographic claims.
- v1.0 enrichment is layered into the same canvas, not a different map — nothing shipped at launch becomes wrong later.

### 1.5 Honest risks

- **Risk: the map reads as generic fantasy cartography.** Mitigation: East-up orientation, Byzantine corner ornament dialect carried from curriculum.html, monastery silhouette that visually echoes `theo-christopher-hero.png`, deliberate avoidance of dragons / sea monsters / "Adventure Zone!" callouts.
- **Risk: Nolan asks "is this a real place?" and the answer is awkward.** Mitigation: the map's job is to make the expedition visible, not to claim historicity. Christopher (in future Marginalia) can answer this directly: *"It's not one place. It's the shape of the journey."*
- **Risk: portrait-orientation viewing on iPad is awkward.** Mitigation: see §3.4. Map is inherently landscape; portrait viewing is honest about the medium — small landscape-orientation hint, user rotates device.
- **Risk: production fails to hit illuminated-manuscript register and lands somewhere else (modern infographic, generic fantasy, etc.).** Mitigation: §5 production approach is specific about prompting, with iteration budget built in.

---

## 2. v0.1 AESTHETIC

### 2.1 Visual register

**Illuminated-manuscript cartography.** The map is a painted artifact — aged parchment, hand-applied gold leaf accents, painterly textures, ink outlines that read as ink and not as vector strokes. Cultural ancestors: medieval Mappa Mundi (T-and-O maps, Hereford Mappa Mundi), Pilgrim's Progress maps (the William Blake / Charles Bennett illuminated tradition), Tolkien hand-illustrated cartography but pulled deliberately toward Byzantine illuminated rather than ink-and-quill.

The register is **NOT**: modern infographic, vector-flat illustration, isometric game map, theme-park attraction map, hand-drawn casual sketch. If the v0.1 image resembles any of these, iterate.

The register **IS**: something you could imagine framed on a wall in a parish narthex; something a Byzantine monastery might keep in a side chapel as a pilgrimage aid; something Father Stephen Freeman could write about as devotional without irony.

### 2.2 Color palette specifics

Inherits the canonical tokens from §10.1 of COMIC_DESIGN_BRIEF.md. The map uses a subset, applied with specific dialect:

```css
/* Map paper — the parchment substrate */
--map-parchment-base:      #F0E4C8;  /* parchment-warm, center of map */
--map-parchment-edge:      #E0D2A8;  /* aged toward the borders */
--map-parchment-shadow:    #C9B888;  /* deepest aged corners */

/* Land masses — painted in flat washes with ink outlines */
--map-land-warm:           #A06840;  /* burnt sienna for southern earth */
--map-land-olive:          #6B6840;  /* olive groves, midlands */
--map-land-sage:           #8A8060;  /* northern hills */

/* Water */
--map-water:               #5A6878;  /* desaturated navy, reads as sea/aged ink */
--map-water-shoreline:     #6B7888;  /* lighter shoreline */

/* Outlines and labels */
--map-ink:                 #3A2817;  /* ink-brown, all coastlines and details */
--map-label-gold:          #C9A84C;  /* Byzantine Gold for region labels */
--map-label-active:        #E6C76A;  /* brighter gold for Topic 00 label */

/* Mist zone — uncharted territory */
--map-mist-near:           #D8CCAA;  /* parchment fading toward mist */
--map-mist-far:            #B8B0A0;  /* cool desaturated, far edge */

/* Sacred accents */
--map-cross-gold:          #C9A84C;  /* scattered crosses, monastery domes */
--map-dawn-glow:           #F4D688;  /* the dawn light at top edge */
```

**Architectural lock:** no teal, no neon, no out-of-register saturated colors. Every hue is documentable as an aged-pigment color that a medieval illuminator would have made from earth or mineral or gold leaf. This is a register constraint, not a stylistic preference — break it and the map stops being Orthodox.

### 2.3 Map projection / framing

The map image is a rectangular illustrated parchment, 16:9 aspect ratio. It sits **inside** a `.topic-block`-style frame (parchment-tinted panel on the navy desk, ✦ TL/BR corner ornaments at 0.55 opacity), which provides visual continuity with curriculum.html and home.html.

The map image itself has its own internal frame: a thin (~3px) Byzantine Gold hairline rule around the illustrated area, with small fleur ornaments at the four corners of the rule. Inside the rule is the painted parchment; outside is the host panel's parchment-on-navy background.

The painted parchment is **not** a clean rectangle. Its edges are slightly irregular — torn-vellum effect at top and bottom (very subtle, not aggressive), with a faint shadow drop suggesting the parchment is laid on a desk. The illusion is "this is a physical artifact someone unrolled," not "this is a digital infographic with parchment texture."

### 2.4 East-up orientation — how "East" is visually signaled

The orchestrator asked this specifically. East-up is the most distinctive single design choice in the map and needs to be legible without being didactic.

**Three layered signals, listed weakest to strongest:**

1. **Ambient — dawn light gradient at top edge.** The top ~12% of the parchment carries a soft golden-glow tint (--map-dawn-glow at low opacity), brightest at the horizon line where the monastery silhouette sits, fading down into the rest of the map. The light comes from above, and "above" is morning. This is not announced as "East"; it just looks like dawn.

2. **Iconographic — the destination monastery at the top.** The journey's-end monastery silhouette sits at the top of the map. Christ is the East; the destination of the expedition is communion; communion is where the journey arrives. The monastery's position at the top is the iconographic gesture: where Nolan is going is also where the sun rises is also where Christ is.

3. **Explicit — compass rose in the bottom-left margin.** An eight-point Byzantine star compass rose, painted in gold ink, with cardinal labels in tiny Cinzel: **E** at top, **S** at right, **W** at bottom, **N** at left. The compass is small (~6% of map area), placed in the ornamental lower-left margin (off the illustrated terrain but inside the parchment frame). Most users won't read the labels; Nolan eventually will, and when he asks "why is East at the top?" — that question is formative, not confusing. The compass rose is the *honest* signal: the map is oriented intentionally, not arbitrarily.

The compass rose has a small ☩ at the center of the eight-point star — the cross orients the cosmos. This is the medieval cartographic convention (T-and-O maps put Jerusalem at center, often with a cross marker); we honor the convention without anchoring to Jerusalem specifically.

### 2.5 The 10 region representations

Each region is represented by:

- **A bounded territory** on the painted map — a stylized landform (hills, plain, coast, valley) with ink-outlined boundary. Boundaries are organic, not gridded.
- **A region label** in Cinzel, gold (--map-label-gold), centered or off-center within the territory.
- **A small iconographic anchor** within the region — a domed chapel silhouette, a stylized tree, a small cross, a hut — quietly characterizing what the topic is about without being illustrative.

Topics 00, 1, 2 are clearly labeled and drawn (see §4). Topics 3–10 sit collectively in the mist zone (§2.7) without individual labels.

### 2.6 "You are here" indicator — steady gold highlight, not pulse

**Decision: steady gold highlight, no animation.**

**Defense:**

The curriculum.html "current session" card uses a small pulsing ✦ corner accent — that pattern is established. The argument from consistency is for pulse. But:

1. **The map is a different visual register from the card list.** Card lists are interactive UI; the illuminated map is a contemplative surface. Animation on an illuminated map breaks register — imagine opening a vellum map and a region is throbbing. Gold leaf catches light; it does not pulse.

2. **The map is not a daily-task surface.** It is a destination Nolan reaches intentionally from the Topics page. Time to look, not scan. The ADHD-attention benefit of pulse (which justified its use on the today-card and current-session card) is less applicable to a contemplative surface.

3. **prefers-reduced-motion compliance is simpler with steady highlight.** No fallback logic needed.

4. **Steady gold scales gracefully to v1.0.** When multiple regions become "current" or "settled" or "in-progress" (as Topics 1 and 2 ship), steady-gold-variants can tell that story without competing throbs.

**Specifically, Topic 00 ("Coming Home") receives:**

- Region land color shifted from olive-earth to a warmer parchment-with-gold-tinted shadows (--map-parchment-warm with subtle --map-cross-gold underglaze)
- A radial gold luminosity emanating from the region's center, fading outward into the standard land color (think gold leaf catching morning light at a single point)
- Region label "Coming Home" rendered in --map-label-active (#E6C76A, slightly brighter than the standard --map-label-gold), with a thin gold underline
- Region boundary rendered at 1.5px gold (other regions' boundaries are 1px ink-brown)
- A small ☩ above the region label, gold-filled

The composite reads instantly as "this region is the active one" without any motion.

### 2.7 "Yet to be charted" mist zone (Topics 3–10)

The bottom-right quadrant of the map — far from the destination monastery at the top, far from the compass rose at the bottom-left — fades into mist. This is the unmapped territory; the expedition has not yet reached here; Kevin has not yet built this content.

**Visual treatment:**

- A horizontal gradient transition: the painted terrain at the boundary fades from full saturation into --map-mist-near, then into --map-mist-far at the far edge.
- Within the mist, **8 faint silhouettes** are visible: small distant crosses, domed-chapel outlines, a half-glimpsed hill, a partial coastline. They are clearly *something* — territory exists there — but they cannot be read clearly. Rendered at ~25–40% opacity against the mist.
- The 8 silhouettes correspond to Topics 3–10. No labels. No region boundaries inked. No clear association of one silhouette to one topic — collectively they represent the journey ahead.
- A single small cartouche at the far bottom-right corner: **"Yet to be charted"** in Cinzel italic, gold-dimmed (--map-label-gold at 60% opacity), tucked under a decorative scroll-edge.

**The number 8 is deliberate.** 8 is the Orthodox numerology of resurrection — the eighth day, the octave, the day beyond the week of creation. Total topics = 00 + 1 + 2 + 8 yet-to-be-charted. The "8 in mist" reads as resurrection-on-the-horizon, the journey toward eschatological fullness. Nolan will never have this explained; the structure carries it.

**As content ships in v1.0+,** the mist zone literally regresses: when Topic 3 content is built, that silhouette emerges from mist, gains a named region with its catechetical content name, and the mist shrinks. This is medium-appropriate storytelling — the expedition is being charted in real time, and Nolan can see the cartographer (Kevin, Christ, the Church) at work.

### 2.8 Decorative elements

- **Compass rose:** bottom-left margin, ~6% of map area, eight-point Byzantine star with ☩ at center, cardinal labels in tiny Cinzel (E top, S right, W bottom, N left), painted in gold ink with darker gold shadows.
- **Corner ornaments:** ✦ TL/BR at 0.55 opacity, on the host `.topic-block` panel (NOT on the map image itself — these come from the curriculum.html dialect for free).
- **Inner frame:** thin Byzantine Gold hairline rule around the illustrated parchment, with small fleur ornaments at the four inner corners.
- **NO sea monsters / dragons / "hic sunt leones" creatures.** The mist zone carries the same affordance reverently; medieval monsters flirt with Disneyfication.
- **NO Greek typography in v0.1.** Greek is rationed (2–4/year per COMIC_DESIGN_BRIEF.md §1.6). The map does not need it. v1.0 may earn a single corner cartouche (*Δόξα τῷ Θεῷ*) when the map has been lived with for a season.
- **NO map title burned into the image.** The map.html page header carries any naming externally. The image is the visual; the page chrome carries language.

### 2.9 Typography (within the map image)

- **Region labels** (Topics 00, 1, 2): Cinzel Decorative if available, otherwise Cinzel, weight 600, gold (--map-label-gold or --map-label-active for active region). Size relative to map: each label fits within its region territory without crowding the visual.
- **Compass rose cardinal labels:** Cinzel, weight 500, very small (a few px at viewing size), gold.
- **"Yet to be charted" cartouche:** Cinzel Italic if available, otherwise Cinzel oblique, weight 400, gold-dimmed (60% opacity).
- **No other text on the map.** No captions, no legend, no key. The map is contemplative; explanation lives outside the image.

### 2.10 What the map deliberately does NOT include

This list is as important as the inclusion list. The map does NOT include:

- Roads, highways, modern infrastructure
- Numbered or grid coordinates
- A scale bar
- A legend or key
- Modern political boundaries
- Recognizable real-world city names (Jerusalem, Constantinople, etc.)
- Characters (Theo, Christopher, or any human figure) — v0.1 only
- Animation of any kind
- Logos or product chrome
- Greek text in v0.1
- Dragons, monsters, mythological creatures in the mist
- Theme-park style "Adventure!" annotations
- Quest-game style XP bars, achievement markers, or progression indicators

---

## 3. v0.1 LAYOUT SPECS

### 3.1 Image dimensions and aspect ratio

- **Aspect ratio:** 16:9 (locked — landscape-native illuminated map)
- **Design canvas:** 1600×900 @1x (logical)
- **Production source:** 2400×1350 (1.5× retina compromise — better than 1× sharpness on iPad, much smaller file than full 2× = 3200×1800)
- **Optimization target:** ≤400 KB (orchestrator-locked asset budget)

The 1.5× compromise is intentional. Full 2× retina at 3200×1800 with painterly textures busts 400 KB even with aggressive optimization. 1.5× at 2400×1350 hits sharpness ~85% of the way to full retina at substantially smaller file size. The map is contemplative and stationary; sub-pixel sharpness is less critical than for fast-scrolled UI.

### 3.2 File format — recommendation: WebP primary, JPEG fallback

**Not SVG.** Painterly illuminated-manuscript textures rendered in SVG would either be massive (embedded raster) or stylized to the point of losing the register. The map needs to look painted, not vector.

**Not transparent PNG.** The map has its own parchment background; transparency is unused weight.

**WebP at quality 85** is the smallest format that preserves the painterly register acceptably. iOS Safari supports WebP as of iOS 14 (Nolan's iPad is iOS 17+ per the launch smoke runbook), so the iPad target is covered.

**JPEG at quality 85** is the universal fallback for any older browser context (parent's phone, registration screen captures, future emails referencing the map).

**Implementation:**

```html
<picture>
  <source srcset="/assets/maps/expedition-map-v0-1.webp" type="image/webp">
  <img src="/assets/maps/expedition-map-v0-1.jpg" alt="The Sacred Geography Map — the expedition's territory">
</picture>
```

**Expected file sizes** at 2400×1350, quality 85:
- WebP: ~200–280 KB
- JPEG: ~280–380 KB

Both within the 400 KB budget. Optimize using `cwebp -q 85` (WebP) and `mozjpeg` or `squoosh` (JPEG).

### 3.3 Spatial composition of the map

Where regions sit relative to each other on the painted parchment. This is the storytelling layout.

```
       ┌─────────────────────────────────────────────────────────┐
       │  ◌◌◌  dawn glow + monastery silhouette at top center   │  ← East / journey's end
       │                                                         │
       │              ╭─Topic 2 (The Sacraments)─╮              │
       │            ╰─    domed chapel anchor    ─╯              │
       │                       ↑                                 │
       │                  ╭─Topic 1 (The Faith Itself)─╮         │
       │                ╰─    cross-on-hill anchor   ─╯          │
       │                       ↑                                 │
       │              ╭─Topic 00 (Coming Home) ✦ ACTIVE─╮       │  ← "you are here" gold glow
       │            ╰─    hearth / small chapel anchor   ─╯      │
       │                                                         │
       │      ┌─────────┐                  ░░░░░░░░░░░░          │
       │      │ Compass │              ░░░ mist zone ░░░░         │
       │      │  Rose   │           ░░  8 silhouettes  ░░░       │
       │      │  ☩      │            ░░ "Yet to be charted" ░    │
       │      └─────────┘             ░░░░░░░░░░░░░░░░          │
       └─────────────────────────────────────────────────────────┘
```

**Path/journey treatment:** A meandering gold-tinted path is painted on the map from Topic 00 (active) up through Topic 1 and Topic 2 to the monastery at the top. The path is continuous (not dashed), in --map-label-gold at 40% opacity, ~2–3px stroke. Past topics (none in v0.1; v1.0 once Nolan completes Topic 00) would show the path in fuller gold. Future-but-charted topics (1, 2) show the path at lower opacity. The path beyond Topic 2 fades as it climbs toward the monastery — visible but not insistent.

**Topic 00 is the visual anchor.** Foreground/lower-center placement, slightly left of center, with the most detailed illustration. The eye lands there first because of position, gold highlight, and visual density. Topics 1 and 2 climb upward from there.

**The mist zone occupies the bottom-right quadrant.** Visually separated from Topic 00 by intervening terrain (a small range of hills, a curve of water) so that "you are here" and "yet to be charted" don't visually crowd each other.

**The compass rose occupies the bottom-left margin.** Outside the illustrated terrain, inside the parchment frame, balancing the mist zone diagonally across the composition.

### 3.4 Responsive treatment

The orchestrator's specific question: single source asset with CSS object-fit, OR multiple cropped variants?

**Recommendation: single source asset.** Reasons:

1. **The illuminated-map register is inherently landscape.** Cropping to portrait would require re-composing the map vertically — essentially producing a second different map. This doubles production cost and creates two artifacts that must stay visually consistent forever.

2. **Portrait viewing is honest about the medium.** A real illuminated map *would* read awkwardly held vertically. The user solution is to rotate the device — which is the natural iPad affordance and an entirely reasonable expectation. Nolan turns the iPad sideways; the map fills the screen.

3. **Single asset preserves sw.js asset budget.** Two cropped variants = ~600 KB cached for the map instead of ~280 KB.

4. **CSS object-fit handles the responsive cases gracefully.**

**Responsive behavior:**

```css
.expedition-map-frame {
  /* This is the .topic-block-style host panel */
  position: relative;
  padding: 1.25rem 1rem;
  border-radius: 14px;
  /* (corner ✦ ornaments inherited from .topic-block in curriculum.html) */
}

.expedition-map-image {
  display: block;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

/* Portrait-orientation hint — only renders when device is portrait */
.expedition-map-portrait-hint {
  display: none;
  font-family: 'Crimson Text', serif;
  font-style: italic;
  color: var(--map-label-gold);
  opacity: 0.7;
  text-align: center;
  margin-top: 0.75rem;
  font-size: 0.9em;
}

@media (orientation: portrait) and (max-width: 1024px) {
  .expedition-map-portrait-hint {
    display: block;
  }
}
```

**Portrait-orientation hint copy:** *"The map prefers landscape — turn your iPad sideways for the full view."*

**Phone portrait (Nolan won't typically use):** map renders at full width, becomes small but legible. Same hint applies.

### 3.5 Caption beneath the map (optional, recommended)

A single italic Crimson Text line, gold-dimmed, beneath the map image:

> *"East faces the dawn. The expedition has reached Coming Home."*

The first sentence is the East-up signal articulated quietly. The second sentence is the "you are here" articulated quietly. The caption is **dynamic** — as Nolan progresses, the second sentence updates ("…reached The Faith Itself" once Topic 1 unlocks). v0.1 hard-codes the Topic 00 version; v1.0 makes it state-driven.

---

## 4. REGION NAMING

### 4.1 The principle

Region names must survive Nolan reading them today (age 10) and reading them in 5 years (age 15). This rules out cute-for-now naming. Names also must not require theological defense Kevin hasn't done — this rules out real-city anchoring.

### 4.2 v0.1 named regions — curriculum content names verbatim

The three regions with built content get their actual catechetical names from the Topics page:

| Topic | Region name | Visual anchor within region |
|---|---|---|
| **00** | **Coming Home** | A small hearth / dwelling silhouette with a thin trail of smoke; a small cross above the doorway. Reads as "the household has been claimed; the catechumen is being received." Active (gold highlight). |
| **1** | **The Faith Itself** | A cross planted on a small hill, with a low stone wall enclosing a tiny chapel. Reads as "what we believe stands on the ground." |
| **2** | **The Sacraments** | A domed chapel with a baptismal font silhouette and a small altar visible through an arched opening. Reads as "what the Church does." |

All three labels in Cinzel gold within their territories. Topic 00 brighter (--map-label-active), Topics 1 and 2 in standard --map-label-gold.

**Why these visual anchors and not others:** each anchor is chosen for what the topic *is*, not for what would make a charming illustration. The hearth for Coming Home is the household-being-received gesture (catechumenate is fundamentally about being received into a household). The cross-on-hill for The Faith Itself echoes the Creed's "stood firm" register. The domed-chapel-with-font for The Sacraments points to where sacraments happen.

### 4.3 v0.1 Topics 3–10 — collectively unmapped

**Decision: no individual labels for Topics 3–10 in v0.1.** They are collectively represented as 8 faint silhouettes in the mist zone (§2.7), with a single cartouche reading **"Yet to be charted"** in Cinzel italic, gold-dimmed.

### 4.4 Defense of the unnamed approach

The dispatch offered three options:

- (a) Roman numerals — *"Region III, Region IV…"*
- (b) "Future expedition" placeholder labels
- (c) Hint-at-content names based on a defensible reading of where the curriculum will go

I chose a fourth option: **collective unlabeled mist**. Why:

**Roman numerals fail the 5-year test.** Five years from now, "Region III" looks like a placeholder kludge that was never finished. It's visibly waiting to be replaced.

**"Future expedition" labels are visually flat** and create eight nearly-identical labels reading "Future Expedition" eight times, which is boring and weird.

**Hint-at-content names risk being wrong.** Kevin's curriculum for Topics 3–10 is undecided. If v0.1 ships "Region IV — Prayer" and Topic 4 ends up being Ecclesiology, the map lies. The fix would require regenerating the image, which is exactly the rework v0.1 was designed to avoid.

**Collective unlabeled mist is the most honest option.** It says: *the expedition continues, but the cartographer has not yet charted what is ahead.* This is theologically accurate (we don't fully know what our formation will bring), pedagogically honest (Kevin is building this curriculum in real time), and visually coherent (medieval cartographers DID leave unmapped zones; we're inheriting a real convention, not inventing a workaround).

The 8 silhouettes are visually present so the eye understands "territory exists here," but they are unreadable specifically so they cannot be wrong.

### 4.5 v1.0 region-emergence protocol

When Kevin's content for Topic 3 (or any of 3–10) ships, that region emerges from mist:

1. Designer chat re-engages to confirm the topic's catechetical name and visual anchor
2. Image is regenerated OR overlaid (depending on production approach) with the new region revealed, labeled, and connected to the path from Topic 2
3. The mist zone literally shrinks — one silhouette of 8 becomes a named region; 7 silhouettes remain
4. sw.js cache version bumps; new map asset replaces old

This is the medium-appropriate way to ship new content. Nolan literally sees territory emerge.

### 4.6 The monastery at the top — does it have a name?

**No.** The destination monastery silhouette is iconographic, not named. Naming it ("The Kingdom," "Communion," "The Heavenly Liturgy") would over-determine the destination and flirt with Disneyfication. The monastery is the silhouette of where the expedition is going; the silhouette IS the meaning.

If, post-launch, the absence of a name reads as oversight, a future designer chat can revisit. v0.1 default: silent silhouette.

---

## 5. v0.1 PRODUCTION APPROACH

### 5.1 Honest assessment

The most achievable 1–2 day path is **AI image-generation with tight Byzantine prompting, then Kevin curates + light-touches in Canva or Procreate**. Hand-illustration by Kevin is the higher quality ceiling but lower predictability path; commission is off the pre-launch table.

**Recommended primary tool: Midjourney v7** (or v6.1 if v7 hasn't shipped at the time of production). MJ delivers painterly illustrated art more reliably than DALL-E 3 for this register. DALL-E 3 is a strong fallback if MJ access isn't convenient.

**Realistic time budget:**

- 30 min: prompt iteration in MJ — generate 4–8 candidate variations, pick the best
- 30 min: light touch-up in Canva (the Holt family already has Canva access for design assets per the project memory)
  - Add or refine region labels in Cinzel
  - Apply the gold "you are here" highlight to Topic 00 if MJ didn't render it cleanly
  - Add the compass rose if MJ didn't include it
  - Add the "Yet to be charted" cartouche
  - Refine the inner frame
- 15 min: export at 2400×1350, convert to WebP and JPEG, run through squoosh.app for final optimization

**Total: ~1.5 hours.** Achievable in a single sitting after dinner, in the window between current dispatch work and image production.

### 5.2 Midjourney prompts

**Primary prompt (variation A):**

```
illuminated medieval Byzantine pilgrimage map, hand-painted illustration on aged
parchment, east-up orientation with rising sun gold dawn light at the top edge,
a domed Orthodox monastery silhouette at the top center bathed in dawn rays,
winding gold path through stylized illustrated terrain — olive groves, cypress
trees, small chapels with crosses, stylized rolling hills, a curving river. Three
named regions along the path each anchored by a small symbolic structure: a
hearth-dwelling in the lower-foreground, a cross-on-hill in the midground, a
domed-chapel in the upper terrain. Bottom-right quadrant fades into soft mist
with faint silhouettes of distant crosses and chapels in fog. Ornamental
eight-point compass rose with a cross at center in the bottom-left margin, gold
ink. Thin Byzantine gold hairline frame around the painted parchment with small
fleur ornaments at corners. Color palette: warm parchment cream, Byzantine gold,
deep red, navy, ink brown, sienna earth tones. Style: between a Tolkien
hand-illustrated map and a Byzantine illuminated manuscript, painterly textures,
hand-painted feel, ink outlines, gold leaf accents. NOT digital art, NOT modern
infographic, NOT cartoon. --ar 16:9 --style raw --v 7
```

**Variation B — pushing the illuminated-manuscript register harder:**

```
illuminated manuscript map page, 13th century Byzantine pilgrimage atlas style,
aged vellum parchment with hand-applied gold leaf, painted in earth pigments and
gold ink. Three named territories connected by a winding pilgrimage path leading
north (east-up orientation) toward a domed Orthodox monastery silhouette
crowned in dawn light at the top horizon. Each territory has a small painted
icon: a household hearth with smoke, a planted cross on a hillside, a domed
sanctuary with arched opening. Lower-right quadrant of the parchment dissolves
into watercolor mist with eight faint distant chapel silhouettes, beautifully
unfinished. Compass rose with eight gold-ink points and a cross at center in
the lower-left ornamental margin. Decorative gold filigree corners. Color tones
limited to: cream parchment, deep red, navy, warm sienna, olive, ink-brown,
illuminated gold. Painterly brush textures, visible pigment grain. --ar 16:9
--style raw --v 7
```

**Variation C — Tolkien-leaning fallback if A/B feel too liturgical:**

```
hand-illustrated fantasy pilgrimage map in the tradition of Pauline Baynes and
the Lord of the Rings cartography, but rendered in Byzantine illuminated
manuscript palette and finish. Painted on aged parchment. East-up orientation,
sunrise/dawn glow at top edge, domed Orthodox monastery silhouette at the top
horizon. Three named territories connected by a meandering golden pilgrimage
path — each territory contains a small symbolic structure (hearth, cross-on-hill,
domed chapel). Bottom-right corner fades into soft sepia mist with faint
silhouettes of unmapped territory. Eight-point compass rose in lower-left margin,
gold ink with cross at center. Decorative gold leaf accents and corner
filigree. Warm earth tones, parchment cream, deep red, navy, sienna, olive,
gold. Painterly hand-illustrated, NOT digital, NOT modern infographic. --ar 16:9
--style raw --v 7
```

### 5.3 Prompt iteration strategy

Generate 4 from variation A first. If results read too photographic or too modern, switch to B. If results read too liturgical (overly icon-like), switch to C. Pick the candidate closest to register; iterate within MJ using `--cref` or `/imagine` variations on the chosen image.

**Most common failure modes to fix in iteration:**

- *Too photographic / 3D-rendered:* add "watercolor textures," "visible brushstrokes," "NOT 3D render"
- *Too modern infographic:* add "13th century," "aged vellum," "NO modern design"
- *Too cluttered:* add "minimal composition," "negative space"
- *Wrong palette (too saturated):* add "muted earth tones," "limited palette"
- *Monastery at top is too prominent / cartoony:* add "silhouette only," "distant," "no detail"
- *Mist zone not rendering as mist:* add "fog/mist gradient, NOT clouds"

### 5.4 Canva / Procreate touch-up

After picking the MJ candidate, Kevin opens it in Canva (or Procreate on iPad if preferred). Tasks:

1. **Apply Topic 00 gold highlight.** If MJ didn't render the active-region highlight cleanly, add a soft radial gradient overlay in --map-label-active over the Topic 00 region. ~30% opacity, large soft brush.
2. **Place region labels in Cinzel.** If MJ rendered text, it almost certainly rendered it as fake glyphs — replace with real Cinzel text overlay. Label each of the three regions: "Coming Home," "The Faith Itself," "The Sacraments."
3. **Place the "Yet to be charted" cartouche.** Cinzel italic, gold-dimmed.
4. **Verify the compass rose is legible.** If MJ's labels are garbled, replace E / S / W / N labels.
5. **Final frame check.** Ensure the inner gold hairline frame is clean and consistent at all four edges.

If MJ's output is strong enough to require minimal touch-up, the Canva session may be 15 min instead of 30. Either way, budget the time so finishing isn't rushed.

### 5.5 Export and optimization

1. Export the touched-up image from Canva at **2400×1350 PNG** (lossless intermediate).
2. Open the PNG in **squoosh.app** (squoosh.app is browser-based, no install).
3. **WebP export:** quality 85, save as `expedition-map-v0-1.webp`. Target ~200–280 KB.
4. **JPEG export:** quality 85, save as `expedition-map-v0-1.jpg`. Target ~280–380 KB.
5. **Visual diff check:** view both at 100% on the iPad. Confirm WebP and JPEG are visually equivalent (they should be at quality 85).
6. **Sanity check:** view at iPad portrait orientation. Confirm the portrait-orientation hint is the right answer (it should be — map reads cramped portrait but rotates to fill).

### 5.6 If Midjourney doesn't deliver

If 8 prompt iterations don't produce something usable:

- **Fallback 1 — DALL-E 3.** Reformulate the prompt for DALL-E's style; DALL-E typically renders cleaner but less painterly. Prompt:
  ```
  An illuminated medieval Byzantine pilgrimage map, hand-painted on aged parchment.
  East-up orientation. A domed Orthodox monastery silhouette at the top edge in
  dawn light. Three named territories along a winding gold path: a hearth-dwelling,
  a cross on a hill, a domed chapel. Bottom-right fades into mist with distant
  silhouettes. A compass rose with cross at center in the lower-left margin.
  Byzantine gold filigree frame. Painterly hand-illustrated style, warm earth
  tones — parchment cream, Byzantine gold, deep red, navy, sienna, olive, ink
  brown. NOT digital, NOT cartoon. 16:9 aspect ratio.
  ```
- **Fallback 2 — composite approach.** Generate the base map terrain with MJ/DALL-E, then composite gold path, region labels, compass rose, and frame in Canva manually. More work but higher control.
- **Fallback 3 — defer v0.1 by one week.** Ship Topic 00 launch on May 18 without the map; ship the map in a follow-on dispatch by May 25. The map is enriching, not blocking. This is the safety valve — the map should never become a launch dependency.

---

## 6. v1.0 EXPANSION PATH

v1.0 is enrichment of v0.1, not a different map. Everything shipped at launch remains visible and correct as v1.0 layers in. Post-launch, in roughly the order they would ship:

### 6.1 Character placement (v1.0a — Q3 2026)

**Theo + Christopher pinned at current region as walking figures.** Pixar-3D-style mini-figures (matching the established character art register), rendered separately as transparent PNGs, composited via CSS over the map. Approximate size: ~80px tall at native map size (~5% of map height).

Witness-only architectural lock (COMIC_DESIGN_BRIEF.md §1.4) applies: Theo and Christopher look at each other or at the path, **never at Nolan**. Their gaze is on the journey.

Position updates as Nolan progresses through topics — they walk the path from completed regions to the current region. When Topic 00 settles and Topic 1 begins, they relocate. When Topic 1 settles and Topic 2 begins, they relocate again.

**Production note for v1.0a:** Theo and Christopher need a "walking-from-side angle" pose, which differs from the existing portrait and companion poses. Either Steve AI generates a frame, or the existing pair from `theo-christopher-companion.png` is reused (it shows them shoulder-look, which works as a walking pause).

### 6.2 Real-Orthodox geographic depth as ambient flavor (v1.0b — Q3-Q4 2026)

As Topic 2 (Sacraments) content ships, its region gains Antioch-or-Jerusalem-flavored architectural detail — domed roof variations, baptistery font silhouette, the suggestion of an altar visible through arched columns. The region's NAME stays "The Sacraments." Real geographic resonance enters through visual flavor.

Same pattern for future topics as they ship:
- A Christology topic might gain Nicaean council-chamber architecture in its region
- A Theotokos topic might gain Cappadocian cave-chapel hewn-rock textures
- A Liturgy topic might gain Hagia Sophia dome silhouette
- A Saints topic might gain Mt. Athos peninsula coastline reference

Each of these is **flavor**, not anchoring. The map never claims "Topic X happens at place Y." It only suggests visually that Orthodoxy has incarnational depth across real territory.

### 6.3 Tap-region drawers (v1.0c — Q4 2026)

Each region becomes tappable. Tap opens a small drawer (slide-up on mobile, slide-from-right on iPad) containing:

- Topic summary (1–2 sentences from the curriculum spine)
- Progress through sessions (e.g., "3 of 15 sessions complete")
- Direct link to current session (or "Continue where you left off")
- 1–3 associated saints for that topic (with small portrait thumbnails)
- 1–3 associated feast days (with dates)

Drawer is a separate UI component, slides over the map without leaving the page. ESC / tap-outside closes. ADHD-friendly: drawer fits one purpose, no overload.

### 6.4 Saint Biography Micro-Cards integration (v1.0d — Q4 2026 / Q1 2027)

Saints associated with each region appear as small portrait icons within their region territory. Tap a saint → micro-card opens with the saint's vita teaser + feast day + 1–2 sentence summary of their connection to the topic + link to expedition material referencing them.

**St. Herman of Alaska is tied to Topic 00** (Nolan's name day on Aug 9, locked in project memory). His portrait icon appears in the Coming Home region. On his name day, the icon receives a small gold-light effect (steady, not pulsing).

Future saints attach to regions as their micro-cards are authored.

### 6.5 Region-emergence on content ship (v1.0e — ongoing)

Per §4.5: when Kevin's content for any of Topics 3–10 ships, that region literally emerges from the mist with its catechetical name and a new visual anchor. The mist zone progressively shrinks. The map becomes a real-time visualization of the curriculum being built.

This is the most dramatic v1.0 feature and the one most likely to delight Nolan. It also serves as a long-arc visualization of "the expedition continues" that survives years of use.

### 6.6 Subtle path-extension toward unlocking regions (v1.0f — Q2 2027)

When a region is within ~2 weeks of unlocking (based on the cadence locked in LAUNCH_SMOKE_RUNBOOK), a faint gold thread of path begins to extend from the current region toward it. Not a UI pulse — a slowly-thickening gold filament suggesting the path is being prepared.

This is the only "animation" v1.0 introduces, and it is slow enough (over weeks, not seconds) that it never breaks the contemplative register. It also serves the §1.5 prefers-reduced-motion compliance, since the change is not visible within a session.

### 6.7 Sunday Celebration / settled-week integration (v1.0g — Q2 2027)

On Sundays when a week settles, the current region receives a brief one-time "settled" effect on the next map open: a soft gold light catches the region as if the dawn glow at the top has reached down for a moment. Not a pulse; one rendering, one settling. Lasts ~3 seconds on map-load, fades to steady.

Tied to the Sunday Celebration overlay system from existing project architecture.

### 6.8 Greek typography (v1.0h — when earned)

When the map has been lived with for a season, and the project has accumulated other Greek-typography surfaces under the GFS Neohellenic secondary face (per COMIC_DESIGN_BRIEF.md §11), a single corner cartouche may be added: **Δόξα τῷ Θεῷ** rendered in GFS Neohellenic, gold-dimmed, in the bottom-right margin near the mist zone.

The Greek is **earned** by the map's tenure in Nolan's formation, not pre-loaded. v0.1 ships without it; a future designer chat decides when it's appropriate.

### 6.9 Eventually — real geographic anchoring (v1.5 / v2)

The original Path B becomes available as a future ceiling, but only as enrichment of the existing canvas, never as a replacement. Possibly a "scroll-and-fade" treatment: at iPad-landscape full-screen, holding the map for ~2 seconds reveals an overlay of real geographic context (Mediterranean coastline ghosting beneath the painted terrain, with city names appearing in muted gold). Tap to dismiss; the painted map returns.

This is far enough out that v0.1 should make no commitments to it.

---

## 7. ENGINEERING HANDOFF NOTES

What Chat 15 (engineering) needs to build the v0.1 map.html page once the image asset is produced.

### 7.1 HTML page structure

A new file: `/map.html`. Skeleton modeled on curriculum.html (same head, same chrome, same bottom-nav). Major sections:

```
<head>
  - Same <head> as curriculum.html (canonical font imports, Cinzel + Crimson)
  - <title>The Expedition Map · The Orthodox Expedition</title>
  - <link rel="stylesheet"> to existing CSS
  - <link rel="manifest" href="manifest.json">
  - Standard PWA meta tags
</head>

<body>
  <div id="app">

    <!-- Page header (matches curriculum.html eyebrow + subtitle pattern) -->
    <header class="page-header">
      <p class="page-eyebrow">✦ Expedition Map</p>
      <p class="page-subtitle">East faces the dawn.</p>
    </header>

    <!-- Map frame (uses .topic-block dialect for visual continuity) -->
    <section class="expedition-map-frame topic-block">
      <picture class="expedition-map-image-wrap">
        <source srcset="/Orthodox-Expedition-/assets/maps/expedition-map-v0-1.webp" type="image/webp">
        <img class="expedition-map-image"
             src="/Orthodox-Expedition-/assets/maps/expedition-map-v0-1.jpg"
             alt="The Sacred Geography Map — the territory of the expedition">
      </picture>
      <p class="expedition-map-caption">
        <em>The expedition has reached <strong>Coming Home</strong>.</em>
      </p>
      <p class="expedition-map-portrait-hint">
        The map prefers landscape — turn your iPad sideways for the full view.
      </p>
    </section>

    <!-- Back link -->
    <p class="back-link">
      <a href="curriculum.html">← Back to Topics</a>
    </p>

  </div>

  <!-- Canonical bottom-nav from home.html, copied verbatim, with Topics marked active -->
  <nav class="bottom-nav" id="bottom-nav">
    <a class="nav-item" href="home.html">…</a>
    <a class="nav-item" href="missions.html">…</a>
    <a class="nav-item active" href="curriculum.html">…</a>  <!-- Topics active since map is a sub-page -->
    <a class="nav-item" href="bible-reader.html">…</a>
    <a class="nav-item" href="journal.html">…</a>
  </nav>

  <script>
    // Standard PWA setup, auth check, role-based gating (admin bypass exists but
    // v0.1 has no admin-only annotations — admin sees the map identically to explorer)
  </script>
</body>
```

### 7.2 CSS treatment

Add to existing stylesheet OR inline in `<style>` block in map.html:

```css
/* ─────────────────────────────────────────────────────────────
   EXPEDITION MAP — v0.1
   Frame inherits .topic-block from curriculum.html for ✦ corners
   and parchment-on-navy panel treatment. Inner image is a
   <picture> with WebP+JPEG, aspect-ratio: 16/9, object-fit: contain.
   ───────────────────────────────────────────────────────────── */

.expedition-map-frame {
  margin: 1.5rem 1rem;
  /* .topic-block class brings the rest from curriculum.html */
}

.expedition-map-image-wrap {
  display: block;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.expedition-map-image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  /* faint inner gold hairline supplement, in case the image's
     baked-in frame is subtle */
  border: 1px solid rgba(201, 168, 76, 0.20);
}

.expedition-map-caption {
  margin: 0.85rem auto 0;
  max-width: 600px;
  font-family: 'Crimson Text', serif;
  font-style: italic;
  font-size: 0.95rem;
  text-align: center;
  color: rgba(201, 168, 76, 0.85);
}

.expedition-map-caption strong {
  font-weight: 600;
  color: var(--gold-light, #E6C76A);
}

.expedition-map-portrait-hint {
  display: none;
  margin: 0.75rem auto 0;
  font-family: 'Crimson Text', serif;
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
  color: rgba(201, 168, 76, 0.65);
}

@media (orientation: portrait) and (max-width: 1024px) {
  .expedition-map-portrait-hint {
    display: block;
  }
}

/* prefers-reduced-motion — no special handling needed; map is static */

.back-link {
  text-align: center;
  margin: 1.5rem 0 5rem;  /* room for bottom-nav */
  font-family: 'Crimson Text', serif;
  font-size: 0.95rem;
}

.back-link a {
  color: rgba(201, 168, 76, 0.85);
  text-decoration: none;
}

.back-link a:hover {
  color: var(--gold-light, #E6C76A);
}
```

### 7.3 Asset path conventions

```
/assets/maps/expedition-map-v0-1.webp     ← primary, ~200–280 KB
/assets/maps/expedition-map-v0-1.jpg      ← fallback, ~280–380 KB
```

Note the directory `/assets/maps/` is new. GitHub web UI doesn't create empty folders; Kevin creates the folder during upload by prepending `assets/maps/` to the filenames in the upload editor (same pattern as `/assets/characters/` from the existing ASSETS_README.md).

### 7.4 sw.js STATIC_ASSETS additions

```javascript
// Bump cache version. Current is v28 per launch-state in LAUNCH_SMOKE_RUNBOOK.
// Map deploys after launch smoke, so this becomes v29:
const CACHE_NAME = 'orthodox-expedition-v29';

const STATIC_ASSETS = [
  // ...existing entries...
  '/Orthodox-Expedition-/map.html',
  '/Orthodox-Expedition-/assets/maps/expedition-map-v0-1.webp',
  '/Orthodox-Expedition-/assets/maps/expedition-map-v0-1.jpg',
];
```

Pre-cache on PWA install ensures the iPad has the map available offline immediately.

### 7.5 Entry point wiring (curriculum.html)

Above the existing Topic 00 panel (`.topic-block`), add a small link block:

```html
<!-- Place immediately above the existing .topic-block for Topic 00 -->
<div class="map-link-block">
  <a href="map.html" class="map-link">
    <span class="map-link-glyph">✦</span>
    <span class="map-link-label">View the Expedition Map</span>
  </a>
</div>
```

CSS:

```css
.map-link-block {
  text-align: center;
  margin: 0.5rem 0 1.25rem;
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: 'Cinzel', serif;
  font-style: italic;
  font-size: 0.95rem;
  color: rgba(201, 168, 76, 0.85);
  text-decoration: none;
  border-bottom: 1px solid rgba(201, 168, 76, 0.35);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.map-link:hover,
.map-link:focus-visible {
  color: var(--gold-light, #E6C76A);
  border-bottom-color: rgba(230, 199, 106, 0.8);
}

.map-link-glyph {
  font-family: 'Cinzel', serif;
  color: rgba(201, 168, 76, 0.75);
}
```

The link is deliberately quiet — italic, small, single hairline underline. It does not visually compete with the Topic 00 panel below it; it serves as a discoverable but not insistent entry point.

### 7.6 Schedule-gating and role-based access (v0.1)

The map is accessible to **all roles** (explorer, admin, superuser). There is no schedule gating — every role sees the same map at all times.

This is intentional simplicity for v0.1. v1.0 may introduce admin-only annotations or read-only/edit modes (analogous to the `?admin=1` pattern from Repair J), but v0.1 has no such complexity.

### 7.7 Backend changes

**None for v0.1.** The map is fully static. No new database tables, no new Supabase queries, no new RLS policies, no new edge functions.

**For v1.0c (tap-region drawers),** future engineering will need:

- Optional: a `region_visits` table for analytics if Kevin wants to see which regions Nolan opens most. Not strictly required.
- Read queries already exist for topic progress (`session_progress`); the drawer reuses them.

### 7.8 PWA pre-cache verification

After deploy, on Nolan's iPad (or any test device with the PWA installed):

1. Force-quit the PWA
2. Disable Wi-Fi
3. Open the PWA
4. Navigate to Topics → tap "View the Expedition Map"
5. Confirm map renders fully offline (image loaded from cache)
6. Re-enable Wi-Fi

If the map fails offline, the sw.js cache version was not bumped correctly or the asset paths in STATIC_ASSETS don't match the actual file paths. Re-verify both.

### 7.9 Smoke-test addition to LAUNCH_SMOKE_RUNBOOK

Add one item to the existing runbook (under §9, the Topics tab section):

> **9b. Expedition Map entry**
> - [ ] Above the Topic 00 panel, "✦ View the Expedition Map" link is visible, italic, gold-dimmed
> - [ ] Tap the link → map.html opens
> - [ ] Map image renders in landscape orientation, fills the frame
> - [ ] Caption beneath the map reads: *"The expedition has reached Coming Home."*
> - [ ] Rotate iPad to portrait → portrait-orientation hint appears beneath the map
> - [ ] Back-to-Topics link works
> - [ ] Bottom-nav Topics item highlighted as active

(Add only if the map ships in time for the May 18 launch. If it slips to a follow-on dispatch, the runbook addition slips with it.)

### 7.10 What's explicitly out of scope for engineering Chat 15

- Character placement (v1.0a)
- Tap-region drawers (v1.0c)
- Saint Biography Micro-Cards integration (v1.0d)
- Region-emergence on content ship (v1.0e)
- Path-extension animation (v1.0f)
- Sunday Celebration integration (v1.0g)
- Greek typography (v1.0h)
- Dynamic caption based on Nolan's progress

All of these are v1.0 and should NOT be partially scaffolded into v0.1 "for later." Each is a future dispatch with its own design + engineering pass. The v0.1 build is static-only and complete on its own terms.

---

## 8. OPEN QUESTIONS

Items the orchestrator may want to confirm or redirect before Kevin begins production:

### 8.1 Where exactly does "View the Expedition Map" sit on curriculum.html?

Two specific placements possible:

- **Option (i)** Immediately above the Topic 00 panel (after the page header). This is what §7.5 specifies. Pro: closest to the active topic content; reads as "this map is about your current journey." Con: pushes Topic 00 panel ~1.5rem down, mild ADHD-fold tradeoff.
- **Option (ii)** Immediately below the page header but above the page subtitle, as an inline element. Pro: doesn't push the Topic 00 panel down. Con: feels like page chrome, less discoverable.

**Recommend (i).** The map is enriching content tied to the journey, not page chrome.

### 8.2 Should the map.html bottom-nav highlight Topics or have no active item?

**Recommend Topics highlighted as active**, since the map is conceptually a Topics sub-page. This matches the user's mental model ("I came from Topics, I'm in a Topics-related place"). Alternative (no nav item highlighted) is also defensible but creates a small visual orphan.

### 8.3 Should the caption beneath the map be hard-coded or state-driven in v0.1?

**Recommend hard-coded for v0.1.** Nolan launches at Topic 00; the caption reads "Coming Home." When Topic 1 unlocks (Week 12, roughly Aug 10, 2026), a follow-on engineering pass updates the caption — small change, ~5 lines of JS to read `current_session_id` and select the corresponding region name. Not v0.1 critical.

### 8.4 Does the map appear in the Field Manual archive as an artifact?

**Recommend no for v0.1.** The Field Manual is for journal entries and Nolan's reflections. The map is a navigational/contemplative surface, not an archived artifact. v1.0 may revisit if observed usage suggests Nolan thinks of the map as a place to return to from the Field Manual.

### 8.5 Is "View the Expedition Map" the right link label, or "✦ The Expedition Map" or "✦ Sacred Geography"?

Three options:

- **"✦ View the Expedition Map"** — verb-led, clear affordance. Slightly app-language.
- **"✦ The Expedition Map"** — noun-led, more contemplative. Slightly less obvious as a link.
- **"✦ Sacred Geography"** — high-register, mysterious. Most beautiful, least clear what it does.

**Recommend "✦ The Expedition Map"** — noun-led, contemplative register matches the map itself, still readable as a link because of the underline and gold hover treatment. Saves "Sacred Geography" for internal documentation only.

---

## 9. SHIP CHECKLIST

For the orchestrator and Kevin to track before May 18 launch:

- [ ] **Phase 2 design doc reviewed and approved** (this document)
- [ ] **Open questions §8 resolved**
- [ ] **Image asset produced** (Kevin, ~1.5 hours via §5 production approach)
- [ ] **Image optimization confirmed under 400 KB** for both WebP and JPEG
- [ ] **Engineering Chat 15 fires** to build map.html, /assets/maps/ folder, sw.js update, curriculum.html entry-point link
- [ ] **PWA pre-cache verified** on Nolan's iPad with Wi-Fi off
- [ ] **LAUNCH_SMOKE_RUNBOOK addition added** if v0.1 ships in time for May 18
- [ ] **Deploy via GitHub web UI** following the same pattern as ASSETS_README.md (upload files with `assets/maps/` prefix to create directory)
- [ ] **Father Stephen Freeman register check** — view the live map on iPad and ask: *"Would I be embarrassed to show this to my priest?"* If yes, iterate. If no, ship.

If the map cannot be produced in time without rushing, **ship Topic 00 launch without it** and deliver the map in a May 25 follow-on dispatch. The map enriches the launch but is not a launch dependency.

---

## 10. APPENDIX — REFERENCE IMAGES FOR PROMPT TUNING

Cultural touchstones for the image-gen iteration sessions, listed so Kevin can search for and reference them when comparing MJ candidates:

- **Hereford Mappa Mundi** (c. 1300) — the canonical T-and-O Christian world map. East-up. Jerusalem at center. Strong Christological framing. Source register for "this is a faith map, not a tourist map."
- **Ebstorf Mappa Mundi** — destroyed in WWII but reproductions widely available. Body of Christ overlaid on the world. Same East-up theological cartographic register.
- **J.R.R. Tolkien's Middle-earth maps** (Pauline Baynes' rendering for Lord of the Rings) — the touchstone for "hand-illustrated journey map" register. Painterly, painted-on-vellum feel.
- **Pilgrim's Progress maps** (especially the William Blake and Charles Bennett illustrated editions) — the touchstone for "Christian allegorical journey rendered as cartography."
- **Greek Orthodox monastery maps** (Mt. Athos pilgrimage charts, various centuries) — for monastery silhouette inspiration and Byzantine ornamental register.
- **Book of Kells, Lindisfarne Gospels** — for gold-leaf accent treatment, illuminated border filigree, ornamental letterform inspiration for region labels.

Reference images are for prompt-tuning only; the v0.1 deliverable should not be a direct stylistic copy of any single source. The map is its own artifact in its own register.

---

☦ Glory to God for all things.
