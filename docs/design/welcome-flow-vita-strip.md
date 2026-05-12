# Welcome Flow Vita Strip — Scene Spec & Pipeline Worked Example

**Status:** Phase 3 deliverable from Designer Chat D2 — closed
**Scene ID:** `welcome_flow_intro`
**Occasion:** First-launch onboarding; renders inside the welcome flow before the home dashboard loads on day-zero open
**Date authored:** May 11, 2026
**Production target:** Late June 2026 (post-launch; not on the v1 critical path)
**Repo path:** `/docs/design/welcome-flow-vita-strip.md`

This document does two things at once:

1. It is the canonical **scene spec** for the welcome flow Vita Strip — the actual 5-panel sequence Nolan will see the first time he opens the app. When the art-generation chat fires (late June), this is the source of truth it works from.
2. It is the **canonical template** future content-authoring chats reference when authoring additional Vita Strip scenes. The shape is reusable; the content here is scene-specific. Future scenes copy the shape and replace the content.

Refers back to:
- `docs/design/COMIC_DESIGN_BRIEF.md` (Designer Chat D1, the format brief)
- The witness-only reference set (Phase 2 §B — built before any scene generation)
- The pose + backdrop libraries (Phase 2 §C, §D)
- The 6 named lighting modes (Phase 2 §E)
- The per-scene authoring workflow (Phase 2 §F)
- The QC checklist (Phase 2 §G)

---

## 0. The narrative arc

The welcome flow is the first thing Nolan sees the first time he opens the PWA, after Welcome and onboarding state initialize. It runs **before** the home dashboard renders. He sees it once at launch; he can re-visit it from settings if he ever wants to.

It does not orient him to features. It does not explain the app. It does not "introduce gameplay." It introduces **Theo and Christopher** — the two companions who will accompany him through the catechetical year — and it establishes the register the whole app inhabits: an expedition, a coming-home, a journey toward something both old and waited-for.

The 5-panel arc:

| Panel | Beat | Speaker | Time of day |
|---|---|---|---|
| 1 | Preparation — Christopher packs at dawn; Theo just waking | Christopher | Dawn |
| 2 | Setting out — they step onto the path together | Theo | Early morning |
| 3 | The answer — Christopher names where they're going | Christopher | Mid-morning |
| 4 | The dome — silent beat as the monastery comes into view | (silent) | Late afternoon |
| 5 | The threshold — they arrive and Theo hears the singing | Theo | Late afternoon |
| ☩ | Closing flourish — *Glory to God for all things.* | — | — |

The arc is intentionally a full day. The dawn/morning/afternoon lighting progression (§E modes DAWN_PARCHMENT → MORNING_GOLD → AFTERNOON_AMBER) does narrative work — a real expedition takes a day; a quick journey trivializes the homecoming.

Per §3.5, the silent beat falls on panel 4 — the moment of held attention before the closing beat. This is the strip's load-bearing iconographic move; the wordless panel teaches Nolan that some moments don't require words.

---

## 1. Scene YAML

This is the canonical authoring source. It commits to `/docs/scenes/welcome_flow_intro.yaml` alongside this design doc. The art-generation chat reads this YAML to produce panels.

```yaml
scene_id: welcome_flow_intro
occasion: welcome_flow
session_id: null
title: "Coming Home"
target_surface: welcome_flow_first_open
panel_count: 5

panels:
  - id: 1
    illustration_brief: >
      Pre-dawn light. Christopher kneeling beside a small lantern at a
      hillside camp, closing the leather satchel. Theo sits up nearby,
      blanket still around his shoulders, hair tousled from sleep,
      gaze toward Christopher (between-character gaze, not at camera).
      Cold morning — light steam from Christopher's breath. The
      monastery is not yet visible in this panel.
    speaker: christopher
    text: "Up, son. The light is good."
    lighting_mode: DAWN_PARCHMENT
    pose_refs: [pose-christopher-kneeling-satchel, pose-theo-just-waking]
    backdrop_ref: bdr-implied-dawn-gold
    composition_note: >
      Mid-shot. Christopher in the foreground-left, Theo seated
      mid-right. Negative space upper-right for the speech bubble.
      Cross pendants visible on both. Lantern provides a small warm
      focal point.
    new_poses_needed:
      - pose-christopher-kneeling-satchel
      - pose-theo-just-waking
    warmth_detail: steam from breath in cold morning air

  - id: 2
    illustration_brief: >
      Early-morning gold light. Theo and Christopher walking together
      on a stone path through scrub and cypress, three-quarter back
      view, both looking forward up the path. The monastery dome is
      faintly visible in the distance, small, partial — the journey's
      goal is suggested but not yet arrived. Dust kicks up slightly
      from their boots.
    speaker: theo
    text: "Is it far, Father?"
    lighting_mode: MORNING_GOLD
    pose_refs: [pose-paired-walking-side-by-side]
    backdrop_ref: bdr-full-mountain-monastery
    composition_note: >
      Three-quarter back view, both characters in lower-center frame,
      path leading off into upper-right. The monastery dome occupies
      a small portion of the upper-right distance. Negative space
      upper-left for the speech bubble. Camera does not catch any
      face front-on (preserves witness-only naturally).
    new_poses_needed:
      - pose-paired-walking-side-by-side
    warmth_detail: sun catching the gold cross pendants from behind

  - id: 3
    illustration_brief: >
      Mid-morning amber light. Christopher and Theo have paused on
      the path. Christopher is half-turned toward Theo, looking down
      at him with a slight paternal smile. Theo is looking up at
      Christopher, attentive. Christopher's hand rests lightly on
      Theo's shoulder. The monastery is closer now in the distant
      backdrop. Neither character looks toward the camera.
    speaker: christopher
    text: |
      Home, son. We have been a long time away.
    lighting_mode: MORNING_GOLD
    pose_refs: [pose-paired-shoulder-look]
    backdrop_ref: bdr-full-mountain-monastery
    composition_note: >
      Mid-shot, both characters in lower-center frame. Their gaze
      forms a vertical line between them (interior gaze, witness-only
      preserved). Bubble in upper third. The monastery is mid-distance
      now — clearly visible but not the focal point of this panel.
      The focal point is the moment between father and son.
    new_poses_needed: []
    warmth_detail: Christopher's hand on Theo's shoulder, weight visible

  - id: 4
    illustration_brief: >
      Late-afternoon amber light. Both characters from behind or
      three-quarter back, standing still on the path. They are looking
      up — both heads tilted slightly — at the monastery dome that has
      now risen above the trees in the middle distance. Cypress trees
      flank the path. A small bird passes through the upper portion
      of the panel. No dialogue.
    speaker: null
    silent: true
    text: null
    lighting_mode: AFTERNOON_AMBER
    pose_refs: [pose-paired-looking-up-at-dome]
    backdrop_ref: bdr-full-mountain-monastery
    composition_note: >
      Three-quarter back view. Characters occupy lower third of frame.
      Monastery dome occupies upper-center. The composition itself
      teaches the moment — small humans, the dome rising above, the
      vertical of the cypress trees. Frame is full of negative space
      vertically; this is the silent panel's structural work.
    new_poses_needed:
      - pose-paired-looking-up-at-dome
    warmth_detail: a single bird passing through the upper-right

  - id: 5
    illustration_brief: >
      Late-afternoon amber light, slightly softer. Theo and
      Christopher at the threshold of the monastery — stone wall
      visible, doorway behind them or beside them, low Byzantine
      arch hinted. Theo has his head tilted slightly, listening
      toward the doorway (off-frame interior). Christopher's hand
      remains on Theo's shoulder, but Christopher too is listening,
      gaze forward toward the doorway. Neither looks at camera;
      both gaze off-frame toward the sound source.
    speaker: theo
    text: "Listen, Father."
    lighting_mode: AFTERNOON_AMBER
    pose_refs: [pose-paired-arrived-at-threshold]
    backdrop_ref: bdr-implied-narthex
    composition_note: >
      Mid-shot, both characters from three-quarter angle. The
      doorway/arch occupies the right side of the frame; the
      characters lower-center. Negative space upper-left for the
      speech bubble. Listening posture (head tilt, slight forward
      lean) is the iconographic detail that makes this panel work
      without showing what they hear.
    new_poses_needed:
      - pose-paired-arrived-at-threshold
    warmth_detail: Theo's slight forward lean as he listens

closing_flourish:
  caption_en: "Glory to God for all things."
  caption_greek: null   # English-only per Refinement 1; welcome flow is journey-initiating, not Pascha
  ornament: "☩"
  rendering_note: >
    DOM overlay, NOT baked into a panel PNG. Closing flourish renders
    below the strip as Crimson Text Italic, 0.95em, dark ink #3A2817,
    centered, with the ☩ ornament above the caption. See §11.6 of the
    Comic Design Brief for the typography spec (English-only path);
    GFS Neohellenic is loaded but inactive for this scene.
```

---

## 2. Per-panel detail

### 2.1 Panel 1 — Preparation

**Beat:** Before the journey. Christopher prepares; Theo is just waking. This panel establishes that the expedition is not a sudden lark — it is something undertaken with care, with prior planning, in the cold dawn.

**Speaker:** Christopher

**Dialogue:** *"Up, son. The light is good."*

> Voice register check — Christopher (§1.3 + §3.6):
> - Crimson Text Regular, 1.0em, warmer parchment bubble `#F0E4C8`, 1.5px gold border at 70% opacity
> - Two short sentences (within the §3.6 1-2 sentence ceiling per bubble)
> - Paternal, concrete, not performative
> - "The light is good" is a quiet Genesis-echo (Gen 1:4) without being explicit — the line teaches a register Nolan will recognize later. Christopher is allowed to carry this kind of weight; he carries it without explaining it.

**Lighting:** `DAWN_PARCHMENT` — pre-dawn soft light, pale gold-pink, low contrast, new-beginning mood. Faces softly lit; no strong directional light yet. The lantern beside Christopher provides a small warm focal point inside the cool dawn.

**Pose refs:**
- `pose-christopher-kneeling-satchel` — **new pose required**; not in core library
- `pose-theo-just-waking` — **new pose required**; not in core library

**Backdrop ref:** `bdr-implied-dawn-gold` — atmospheric, characters are the focal point. Camp details (lantern, satchel, blanket on Theo's shoulders) are baked into the panel prompt rather than the backdrop.

**Composition:** Mid-shot. Christopher foreground-left (kneeling at the satchel), Theo mid-right (seated on a low rock or rolled blanket). Negative space upper-right for the speech bubble overlay.

**Warmth detail (§6.3 hedge):** Steam from Christopher's breath in cold morning air. Anchors the panel as alive, not staged.

---

### 2.2 Panel 2 — Setting out

**Beat:** The first step. Theo asks the question of the moment. The path goes forward; both characters look forward.

**Speaker:** Theo

**Dialogue:** *"Is it far, Father?"*

> Voice register check — Theo (§1.3 + §3.6):
> - Crimson Text *Italic*, 0.95em, standard parchment bubble `#F5ECD7`, 1px gold border at 60% opacity
> - Asks the question of the moment — concrete, child-aged, gives Christopher room to answer in panel 3 with something bigger than the literal question
> - Not "where are we going" (road-trip register) — "Is it far" (positional, child-realistic, opens panel 3's anchor)

**Lighting:** `MORNING_GOLD` — golden morning light, soft warm, low angle from frame-left, gentle long shadows. Sun has risen.

**Pose refs:**
- `pose-paired-walking-side-by-side` — **new pose required**; reference attachment `ref-paired-side-by-side-walking` provides the gaze-direction anchor.

**Backdrop ref:** `bdr-full-mountain-monastery` — wide path leading away into the upper-right of the frame, monastery faintly visible distant. This is the panel that establishes the geography.

**Composition:** Three-quarter back view. Both characters in lower-center. The composition itself preserves witness-only naturally — viewer sees them from behind, the camera does not catch any face front-on.

**Warmth detail:** Sun catching the gold cross pendants from behind — a small bright glint on each character's back-of-neck pendant chain.

---

### 2.3 Panel 3 — The answer

**Beat:** The structural center of the strip. Christopher names the expedition. The line lands quiet and a little melancholy and carries a weight Nolan won't fully understand at age 10 but will grow into.

**Speaker:** Christopher

**Dialogue:** *"Home, son. We have been a long time away."*

> Voice register check — Christopher (§1.3 + §3.6 + §6.4):
> - Crimson Text Regular, 1.0em, warmer bubble `#F0E4C8`, thicker border
> - Two short sentences (within the §3.6 ceiling)
> - Carries the catechetical-theological weight of the whole app's framing (Topic 00 is titled "Coming Home — Entry Block"). The line gestures toward the prodigal-son register, the return-from-exile register, the Orthodox sense of fallen humanity homecoming, without resolving any of these into doctrine
> - Passes the §6.4 cross-format theological-flattening check: Christopher describes; he does not explain. The mystery is named, not unpacked.

**Lighting:** `MORNING_GOLD` continuing from panel 2 — narrative continuity. Time has passed (mid-morning now), but the light register is consistent within "morning."

**Pose refs:**
- `pose-paired-shoulder-look` — **CORE pose**; in the 8-pose upfront library. Christopher's hand on Theo's shoulder, both gazing in a shared direction — though here adapted slightly: Christopher half-turns toward Theo (interior gaze), Theo looks up at Christopher. Worth noting in the prompt that this is the existing pose with a slight gaze adaptation.

**Backdrop ref:** `bdr-full-mountain-monastery` — monastery closer now, mid-distance, but not yet the focal point of the panel. The focal point is the moment between father and son.

**Composition:** Mid-shot, both characters in lower-center. Their gaze forms a vertical line between them — interior gaze, witness-only preserved structurally.

**Warmth detail:** Christopher's hand on Theo's shoulder — visible weight in the contact (not a light touch; a real father-hand). The fabric of Theo's jacket compresses slightly under it.

---

### 2.4 Panel 4 — The silent beat

**Beat:** The strip's structural pause. Per §3.5 — "the moment of held attention before the closing beat." The dome rises into view; the characters look up; Nolan witnesses; nothing is said.

**Speaker:** silent (no dialogue overlay rendered)

**Lighting:** `AFTERNOON_AMBER` — late afternoon, mid-tone warmth, soft shadow with definition. Time has passed across the strip from dawn to afternoon. This is the structural lighting shift that does narrative work.

**Pose refs:**
- `pose-paired-looking-up-at-dome` — **new pose required**; the canonical witness-only posture for "both characters in awe of something off-frame above." Reference `ref-paired-shoulder-look` plus `ref-theo-looking-up` and `ref-christopher-looking-down` (mirror axis) as character anchors.

**Backdrop ref:** `bdr-full-mountain-monastery` — closer now, dome occupying upper-center of the frame.

**Composition:** Three-quarter back view. Characters in lower third. Dome in upper-center. The verticality of the cypress trees on either side reinforces the upward gaze. The composition itself teaches the moment.

**Warmth detail:** A single bird passing through the upper-right of the panel. Small, in-flight, gives the panel a living atmosphere — the museum-exhibit risk (§6.3) is hedged by the bird.

> Authoring note: the silent panel is the easiest panel to get wrong by adding dialogue "to fill space." Resist. The §3.5 architectural function depends on the silence. The closing flourish caption a few seconds later is what speaks for this beat.

---

### 2.5 Panel 5 — The threshold

**Beat:** Arrival. Theo names what he hears. The closing line is sensory and small — a child's observation that opens the door without explaining it.

**Speaker:** Theo

**Dialogue:** *"Listen, Father."*

> Voice register check — Theo (§1.3 + §3.6):
> - Crimson Text *Italic*, 0.95em, standard bubble
> - Three words. Tiny. Per §3.6 — "Names what he sees." (here: names what he hears.)
> - Hands all the weight to the closing flourish. What they hear is *Glory to God for all things.* — the closing caption is what their listening receives.

**Lighting:** `AFTERNOON_AMBER` — matched to panel 4. Slightly softer (the sun is lower now); narrative continuity.

**Pose refs:**
- `pose-paired-arrived-at-threshold` — **new pose required**; both characters from a three-quarter angle, listening toward off-frame doorway. References `ref-paired-kneeling-altar` (the only canonical paired reference with "gaze forward at off-frame architectural feature") as the structural anchor; reference `ref-theo-looking-up` for the head-tilt detail.

**Backdrop ref:** `bdr-implied-narthex` — vague Byzantine architectural shapes (arch, candle stand in soft shadow, hint of an icon's gold) on the right side of the frame. The doorway is implied, not photorealistic.

**Composition:** Mid-shot, both characters three-quarter angle, lower-center. Doorway/arch occupies the right side of the frame.

**Warmth detail:** Theo's slight forward lean as he listens. A child's posture; the leaning-into-something-just-out-of-reach gesture that the whole app metaphorically inhabits.

---

## 3. Closing flourish

Per §3.7 of the brief — final panel, full strip remains visible, small gold ornament with a single-line caption in Crimson Text Italic.

**Caption (English):** *Glory to God for all things.*

**Caption (Greek):** None for this scene. The welcome flow is journey-initiating, not resurrection. The Greek-and-gold treatment (§11.7) is reserved for the Pascha exclamation specifically.

**Ornament:** ☩

**Rendering — per Refinement 1 (Phase 3 dispatch):**

- Closing flourish is a **DOM overlay** beneath the strip, NOT baked into a panel PNG
- This keeps panel PNGs language-agnostic and reusable; if the caption text ever changes (translation, alternate phrasing), no re-generation
- Typography per Comic Design Brief §11.6:
  - English caption: Crimson Text Italic, 0.95em of surrounding body text, ink color `#3A2817` at 80% opacity, center-aligned
  - Ornament ☩: gold `#C9A84C`, sits above the caption with ~4-6px vertical gap
  - When/if a Pascha-era Vita Strip uses Greek, the same overlay container holds both lines per §11.6 — Greek line in GFS Neohellenic, English caption beneath in Crimson Text Italic
- For this scene specifically, GFS Neohellenic webfont is loaded but inactive; no Greek character codepoints appear in the caption, so the `unicode-range` fall-through never engages

This rendering choice means the welcome flow PNGs are five panels and nothing else. The strip-level closing flourish lives in the render component, not in any panel asset.

---

## 4. Witness-only reference set usage per panel

For each panel's generation request, the human running the ChatGPT project attaches the references named below from the canonical reference set at `/assets/comic/references/`. The references are the gaze-direction + identity anchors; the pose library entries are the body-posture overlays.

| Panel | References to attach | Why |
|---|---|---|
| 1 | `ref-christopher-looking-down`, `ref-theo-side-profile-right` | C looking down at satchel; T waking, side-profile gaze toward C |
| 2 | `ref-paired-side-by-side-walking`, `ref-theo-three-quarter-back` | Both walking three-quarter back; gaze forward up the path |
| 3 | `ref-paired-shoulder-look` (primary), `ref-christopher-side-profile-right`, `ref-theo-looking-up` | Hand-on-shoulder structural anchor; C half-turned toward T; T looking up |
| 4 | `ref-paired-shoulder-look`, `ref-theo-looking-up`, `ref-christopher-looking-up` (if generated) | Both looking up at the dome — `ref-christopher-looking-up` is a candidate addition to the canonical reference set if not yet present |
| 5 | `ref-paired-kneeling-altar` (structural — both facing off-frame architectural feature), `ref-theo-looking-up` | Listening-at-threshold; gaze forward at off-frame doorway |

> **Reference set gap surfaced for the witness-only reference set generation pass (Phase 2 first deliverable):** consider adding `ref-christopher-looking-up` to the canonical 16-20 reference set. The welcome flow needs it (panel 4); future Vita Strip scenes with Christopher in awe-postures (Theophany, the Nativity star, looking at a tall icon) will reuse it. Not a blocker — panel 4 can be generated with `ref-paired-shoulder-look` plus a verbose prompt — but it's an efficiency hedge for future scenes.

---

## 5. New library assets required for this scene

Tracked here so the production chat knows what to build before generating panels.

### 5.1 New poses (4 new + 1 reuse of core)

| Pose ID | Used in panel | Description |
|---|---|---|
| `pose-christopher-kneeling-satchel` | 1 | Christopher kneeling, half-turned, closing a leather satchel; gaze down |
| `pose-theo-just-waking` | 1 | Theo seated, blanket over shoulders, hair tousled, gaze sideways toward C |
| `pose-paired-walking-side-by-side` | 2 | Both characters walking on a path, three-quarter back view, gaze forward |
| `pose-paired-looking-up-at-dome` | 4 | Both characters from behind, both looking up at an off-frame object |
| `pose-paired-arrived-at-threshold` | 5 | Both at a doorway, three-quarter angle, listening toward off-frame interior |
| `pose-paired-shoulder-look` (CORE) | 3 | Already in 8-pose core library; reused |

Estimated build time: ~30-50 min for all 5 new poses (5-10 min each).

### 5.2 Backdrops required (1 new + 2 existing-in-Phase-2-spec)

| Backdrop ID | Used in panel | Status |
|---|---|---|
| `bdr-implied-dawn-gold` | 1 | In §D Phase 2 spec; build for this scene as one of the v1 7 implied backdrops |
| `bdr-full-mountain-monastery` | 2, 3, 4 | In §D Phase 2 spec as one of the 5 v1 ceremonial full backdrops; build for this scene |
| `bdr-implied-narthex` | 5 | In §D Phase 2 spec; build for this scene |

Estimated build time: ~1-1.5 hours total (implied backdrops ~15-20 min each, full backdrop ~45-60 min).

### 5.3 Lighting modes used (no new modes needed)

`DAWN_PARCHMENT`, `MORNING_GOLD`, `AFTERNOON_AMBER` — all three are in the 6-mode set from Phase 2 §E. No new modes for this scene.

---

## 6. QC checklist applied to this scene

Walking the §G checklist against the worked example. `PASS` = visible in the spec how it's achieved. `PENDING` = depends on actual generation output. `N/A` = not relevant for this scene.

### 6.1 Posture & gaze

| Item | Status | Notes |
|---|---|---|
| No character making direct eye contact with camera | PENDING | All 5 panel briefs explicitly specify off-frame or between-character gaze. Generation must hold. |
| Gaze direction between characters, off-frame, up/down, at object, or at own hands | PASS (in spec) | Panel 1: T→C; Panel 2: both forward; Panel 3: T↔C; Panel 4: both up; Panel 5: both off-frame |
| Framing mid-shot or wider | PASS (in spec) | All 5 panels specified mid-shot or three-quarter back; no extreme close-ups |
| No motion blur or implied motion | PENDING | Briefs specify static moments. Generation must not introduce motion-lines. |

### 6.2 Character identity

| Item | Status | Notes |
|---|---|---|
| Theo's face matches canonical portraits | PENDING | Reference attachments anchor identity; QC at panel-output time |
| Christopher's beard / hair / shirt / satchel consistent | PENDING | Same |
| Both wearing gold three-bar cross pendant | PASS (in spec) | Explicit in panel 1, 2 (sun catching pendants), 3, 5 briefs |
| Clothing details consistent across strip | PENDING | No clothing change is authored; output must not flip |

### 6.3 Disneyfication drift check

| Item | Status | Notes |
|---|---|---|
| No winks, thumbs-up, exaggerated grins, stretched expressions | PASS (in spec) | Briefs use "slight paternal smile," "attentive," "listening" — no cartoon expressions named |
| Theo's smile gentle / warm not mascot grin | PASS (in spec) | No grin authored for Theo in any panel |
| Christopher paternal / warm not posed-mentor | PASS (in spec) | Christopher's expressions are "looking down at satchel," "slight paternal smile," "listening forward" |
| No performance-for-audience gestures | PASS (in spec) | Hand-on-shoulder, listening lean, kneeling-at-satchel are all interior gestures |

### 6.4 Warmth inside the constraint (§6.3 museum-exhibit hedge)

| Panel | Warmth detail | Status |
|---|---|---|
| 1 | Steam from breath in cold morning air | PASS (in spec) |
| 2 | Sun catching gold cross pendants from behind | PASS (in spec) |
| 3 | Christopher's hand on Theo's shoulder, visible weight | PASS (in spec) |
| 4 | A single bird passing through upper-right | PASS (in spec) |
| 5 | Theo's slight forward lean as he listens | PASS (in spec) |

All five panels carry one specific human or living detail. The strip should not feel like a museum exhibit.

### 6.5 Color palette & render register

| Item | Status | Notes |
|---|---|---|
| Byzantine palette respected (no teal / neon / out-of-register saturated reds) | PENDING | Briefs do not introduce out-of-register color; generation must hold |
| Parchment-warm atmosphere where appropriate | PASS (in spec) | DAWN_PARCHMENT, MORNING_GOLD, AFTERNOON_AMBER all carry parchment-warm |
| Gold accents on cross pendants visible | PASS (in spec) | Cross pendants explicitly named in panel briefs |
| Render quality matches four canonical portraits | PENDING | Tool continuity assured via ChatGPT project; QC at panel-output time |

### 6.6 Composition

| Item | Status | Notes |
|---|---|---|
| Square 1:1 panel | PASS (in spec) | All panels generated 1024×1024 per Phase 2 §C |
| Mid-shot or wider | PASS (in spec) | Same |
| Characters not crammed against panel edges | PASS (in spec) | Composition notes specify lower-center positioning |
| Negative space upper third for speech bubble | PASS (in spec) | Each non-silent panel's composition_note explicitly names bubble negative space |

### 6.7 Cross-panel consistency

| Item | Status | Notes |
|---|---|---|
| Lighting tone consistent OR intentional progression authored | PASS (in spec) | DAWN_PARCHMENT → MORNING_GOLD → MORNING_GOLD → AFTERNOON_AMBER → AFTERNOON_AMBER is an explicit narrative-arc lighting progression. Document this for the QC reviewer so the cross-panel consistency check doesn't false-fail. |
| Character appearance consistent across all panels | PENDING | Same character reference attached to all panels; QC at output time |
| Backdrop consistent if strip set in one location | PASS (in spec) | The journey IS the location; backdrop evolves with the journey (the dome rises into view across panels 2, 3, 4) — this is intentional progression, not inconsistency |

### Pass threshold for this scene

All `PASS (in spec)` items hold up; the eight `PENDING` items will be evaluated at panel-output time. If 3+ `PENDING` items fail at output, pipeline review is triggered per Phase 2 §G threshold.

---

## 7. Estimated production time for THIS scene

This is the proof-of-pipeline scene — first-scene cost applies. Numbers honest per the orchestrator's no-time-ceiling lock and Refinement 3's recalibrated numbers.

### 7.1 One-time setup costs (amortized across all v1 Vita Strip scenes, NOT scene-specific)

| Item | Estimate | Notes |
|---|---|---|
| Witness-only reference set (16-20 images) | 4-6 hrs | Phase 2 §B; one-time before any panel work |
| 8 core poses | 1-2 hrs | Phase 2 §C; one-time |
| ChatGPT project system-prompt update | ~30 min | Phase 2 §B; one-time |
| Repo folder structure setup | ~15 min | One-time |
| **Total one-time setup** | **~6-9 hrs** | Done once; benefits all v1 scenes |

### 7.2 Welcome-flow-specific work (this scene only)

| Step | Estimate | Notes |
|---|---|---|
| New poses (5 new for this scene) | 30-50 min | Per §5.1 above |
| New backdrops (3 needed; bdr-implied-dawn-gold, bdr-full-mountain-monastery, bdr-implied-narthex) | 1-1.5 hrs | Per §5.2 above |
| Scene authoring (this document) | DONE | Phase 3 of Designer Chat D2 |
| Prompt assembly (5 panels) | 20 min | Template + scene YAML fields |
| Panel generation (5 panels, first-scene rate) | 75-90 min | More regenerations expected on first scene |
| Background removal (panels needing transparent character) | 15-20 min | Probably needed on panel 1 (camp scene); others fine baked-in |
| QC pass | 15-20 min | Per §6 above |
| sw.js STATIC_ASSETS update + cache version bump | 5-10 min | Per Refinement 3 |
| GitHub web-UI commits (PNGs + YAML + sw.js) | 10 min | Project pattern |
| **Total scene-specific** | **~3.5-5 hrs** | First-scene rate |

### 7.3 Combined cost for welcome flow as proof-of-pipeline first scene

| Phase | Estimate |
|---|---|
| One-time setup (amortized) | 6-9 hrs |
| Welcome-flow-specific | 3.5-5 hrs |
| **Total for "first scene from zero"** | **9.5-14 hrs** |

Distributed: 2-3 weekend evenings if Kevin works in 2-3 hour blocks. Late June 2026 timeline (post-launch, after the Topic 00 launch heat dies down) absorbs this comfortably.

### 7.4 Future-scene rate (after welcome flow ships)

Once one-time setup is amortized, subsequent Vita Strip scenes drop to the Phase 2 §H steady-state numbers, calibrated per Refinement 3: **~60-85 min steady state**, scaling down as the pose + backdrop libraries grow.

---

## 8. Notes for the art-generation chat

When the production chat fires (late June 2026), the human running the ChatGPT project should know:

1. **One-time setup runs first.** Don't generate any welcome-flow panel until the witness-only reference set is built and committed at `/assets/comic/references/`. The reference set IS the architectural lock; skipping it means every panel silently drifts toward direct-gaze.

2. **Panel 4 is the silent beat.** No dialogue. No speech bubble. The render component must not attempt to overlay an empty bubble. The composition's negative space is structurally there for *nothing* — the silence is the content. Per §3.5 of the brief, this is the strip's most theologically active panel; treat it accordingly.

3. **Lighting progresses across the strip on purpose.** DAWN_PARCHMENT → MORNING_GOLD → MORNING_GOLD → AFTERNOON_AMBER → AFTERNOON_AMBER is intentional narrative time-passage. The QC cross-panel-consistency check will NOT false-fail this if the spec is read carefully — but a reviewer who skims may flag it. Document the progression in the QC notes for this scene specifically.

4. **The closing flourish is a DOM overlay, NOT baked into a panel.** Five PNG panels output. The "Glory to God for all things." caption + ☩ ornament renders in the `<VitaStrip>` component beneath the strip. Do not embed text into panel 5.

5. **Panel 1's lantern is a focal point.** A common drift: the dawn-light atmosphere makes the panel too soft / too flat. The lantern provides a small warm focal point inside the cool dawn — keep it warm, keep it small, don't let the panel lose its center.

6. **Christopher's panel 3 line carries the weight of the whole app.** "Home, son. We have been a long time away." — if the panel doesn't FEEL this, regenerate. The Christopher in this panel is the model for every future Christopher in every future Vita Strip. Get him right here and the whole corpus inherits the register.

7. **Character drift check after every panel.** Compare the output to the canonical portraits at `/assets/characters/`. Not to the previous panel — to the canonical portraits. Kevin's style-eye is the moat (§I.4); use it.

8. **First-scene regeneration tolerance is higher than steady-state.** Phase 2 §F caps at 2 regenerations per panel before pause-to-think. On this scene specifically — the proof-of-pipeline scene — that cap is 4. The pipeline is still maturing; budget the extra rolls.

---

## 9. Template usage for future scenes

When content-authoring chats fire (June 2026 onward) to author additional Vita Strip scenes — chrismation close, baptism strip, Pascha vita, Theophany vita, the Topic 00 session-open and session-close strips — they copy the structure of this document and replace the content. The reusable shape:

```
# <Scene Title> Vita Strip — Scene Spec

[Status header + metadata]

## 0. The narrative arc
[4-6 sentence summary + the panel-beat table]

## 1. Scene YAML
[Full YAML block per the Phase 2 §F step 1 template, extended with
 illustration_brief, lighting_mode, pose_refs, backdrop_ref,
 composition_note, new_poses_needed, warmth_detail per panel]

## 2. Per-panel detail
[Per-panel sections, each with: beat / speaker / dialogue + voice
 check / lighting / pose refs / backdrop / composition / warmth]

## 3. Closing flourish
[Caption + Greek flag + ornament + rendering spec]

## 4. Witness-only reference set usage per panel
[Table mapping panel → references attached]

## 5. New library assets required
[Poses, backdrops, lighting modes needed beyond existing libraries]

## 6. QC checklist applied
[Walk §G; PASS / PENDING / N/A per item]

## 7. Estimated production time
[One-time setup if any; scene-specific cost]

## 8. Notes for the art-generation chat
[Scene-specific guidance: silent panels, lighting progressions,
 weight-bearing dialogue, common drift risks for this scene]

☦
```

What's reusable across all scenes (do not re-design per scene):
- The 6 lighting modes
- The witness-only reference set
- The pose library (8 core + grown additions)
- The backdrop library (7 implied + 5 ceremonial + grown additions)
- The QC checklist
- The closing-flourish DOM overlay pattern
- The speech bubble typography rules per §1.3

What's scene-specific (re-author per scene):
- Narrative arc + beats
- Per-panel illustration briefs
- Dialogue (applying §1.3 voice rules)
- Lighting mode selection per panel
- Pose + backdrop selection per panel
- Warmth details per panel
- Closing caption + Greek flag
- Production notes for that scene's particular risks

If a new scene requires a new lighting mode, new core reference, or pipeline change — that's a designer-chat re-engagement (re-open D2 or spawn D2b), not a content-authoring chat decision.

---

## 10. Designer Chat D2 — closed

D1 closed the format brief. D2 closes the production pipeline + this worked example. The pipeline is now executable: a content-authoring chat can author a scene, an art-generation chat can produce panels, and an engineering chat can render the strip. The architectural locks (witness-only, static-only, no-Father-Nicholas-yet, no-Mom-as-speaker, Disneyfication hedge via icon-distance posture) survive intact through the whole pipeline.

Next chats:
- **D3** — Field Journal sketches mini-design pass (~30 min), before the Field Journal v1 dispatch in June 2026
- **Content-authoring chat C1** — second Vita Strip scene (Topic 00 session 00.5 chrismation close, or session 00.12 St. Herman / Nolan's patron-saint week), using this doc as template
- **Engineering chat E1** — `<VitaStrip>` render component + closing-flourish DOM overlay + sw.js asset wiring, when the welcome flow PNGs are ready to render

The welcome flow is the consequential first impression. The format does its theological work in the silence of panel 4 and the small listening of panel 5. Both panels say what cannot be said by saying nothing.

☩ Glory to God for all things.
