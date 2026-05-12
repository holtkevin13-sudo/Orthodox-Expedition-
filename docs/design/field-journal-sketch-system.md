# FIELD JOURNAL MARGINAL SKETCH SYSTEM
## Design Doc — The Orthodox Expedition (D3)

> **Status**: D3 closed. Companion to the canonical design brief at `/docs/design/COMIC_DESIGN_BRIEF.md` (§4 Field Journal, §6.3 failure modes, §10 visual reference vocabulary).
>
> **Note on D2 cross-reference**: The dispatch references a D2 deliverable at `/docs/design/welcome-flow-vita-strip.md` that is not present in the repo at the time of writing. The absence does not block D3 — line-art sketches live in an entirely different render register from the Pixar-3D Vita Strip — but the future engineering chat should confirm D2 has landed before consuming this doc.

---

## §1. Aesthetic & Render Register

The Field Journal sketches sit in a deliberately quiet visual register. They are **OBJECTS the characters might have drawn in their own journals** — never portraits, never illustrations of the entry's content, never decorative flourishes for the reader. The drift-check is per D1 §6.3: *would Theo be embarrassed if Nolan saw that sketch?*

### 1.1 Line-art register, not full illustration

All sketches are **single-color line-art** — no fills, no shading, no rendered volume. The line itself carries everything. Two character-distinct hands:

**Theo's hand** — pencil-charcoal register
- Slightly imperfect line weight (varies along stroke)
- Visible roughness; lines don't always meet perfectly at corners
- Sketchy hatching for the few places shading appears (e.g., compass rose interior)
- Reads as drawn by a 10-year-old who cares but isn't trained
- Cultural touchstone (per D1 §10.4): Tintin's notebook pages, Boy Scout field-log marginalia — confident but un-precious

**Christopher's hand** — ink-on-vellum register
- Even line weight, controlled
- Cleaner geometry; corners meet
- Occasional small flourish (a single fine cross-stroke, a precise serif on Greek letters)
- Reads as drawn by an adult who has rendered these forms many times before
- Cultural touchstone (per D1 §10.4): a desert father's chapter heads — austere, contemplative, classical

### 1.2 Color treatment

**Tinted to match speaker ink color** — not pure black, not full-color illustration:

```css
.fj-sketch[data-author="theo"]        { color: var(--ink-brown); }   /* #3A2817 */
.fj-sketch[data-author="christopher"] { color: var(--ink-deep);  }   /* #2A1810 */
```

**Single gold accent**, reserved for two cases only:
- Inner detail strokes on a small cross (a single gold line within the cross-bars)
- Greek-word sketches — the Greek letters themselves rendered in `var(--byzantine-gold) #C9A84C`

This keeps the sketches palette-compatible with the existing app aesthetic. Nothing pasted-in; nothing introducing a new visual idiom. The sketches share the same ink color as the handwriting font on the same page, so they read as part of the journal hand, not as separate art assets.

### 1.3 Opacity / atmosphere

All sketches render at `opacity: 0.88`. This drops them just below the visual weight of the handwriting text, so they recede into the margin rather than competing with the entry. The 0.88 value preserves enough density that the sketch is clearly legible at 32-64px without aggressive squinting.

`prefers-reduced-motion`: no impact. Sketches never animate.

---

## §2. Sketch Library — Core Inventory (v1: 24 sketches)

Volume sized to the Field Journal authoring cadence (per D1 §6.2 drift check: ≤15 entries/year). With 24 sketches, average reuse is 2-3 times per sketch across the corpus's first 18-24 months — sufficient variety without bloat.

### 2.1 Theo's library (12 sketches)

| # | ID | Description | Source vocabulary |
|---|---|---|---|
| 1 | `compass-rose` | Four-cardinal-point compass, slightly crooked, light pencil hatching at compass points | Brief §4.2 — explicit |
| 2 | `bird-flying` | Single bird silhouette in mid-wing, three quick strokes | Brief §4.2 — explicit |
| 3 | `bird-perched` | Bird seated on a single line (branch), small dot for eye | Brief §4.2 — explicit (variant) |
| 4 | `altar-outline` | Three-quarter perspective altar, plain table, small cross on top — pure outline | Brief §4.2 — explicit |
| 5 | `small-cross` | Simple Latin cross, ~24px, slightly thicker bar than upright | Brief §4.2 — explicit |
| 6 | `candle-tall` | Single tall taper with steady flame, three quick lines for flame motion | Brief §4.6 — *"the smell of the candles"* |
| 7 | `star-bethlehem` | Eight-point star with simple radiating lines | Liturgical vocabulary; appropriate to nativity/Theophany entries |
| 8 | `tree-bare` | Single sparse winter tree, ~5 branches | Expedition motif; sensory-of-place |
| 9 | `mountain-ridge` | Single horizon line with 3 peaks, faint hatching at base | Expedition motif (cultural touchstone: field-log) |
| 10 | `footprints` | Two small footprints heading "into" the margin | Expedition motif |
| 11 | `boat-simple` | Curved hull, single mast, no detail | Peter's boat; Noah's ark — both natural to a catechumen's vocabulary |
| 12 | `bread-loaf` | Round loaf with cross-score on top | Eucharistic, sensory-grounded ("Mom baked bread") |

### 2.2 Christopher's library (12 sketches)

| # | ID | Description | Source vocabulary |
|---|---|---|---|
| 1 | `cross-tiny` | Small precise Latin cross, ~16px | Brief §4.2 — explicit |
| 2 | `cross-three-bar` | Orthodox three-bar cross, slanted footrest correctly oriented (top-right to bottom-left from viewer perspective) | Iconographic accuracy non-negotiable |
| 3 | `map-fragment` | Torn-edge rectangle with two intersecting lines (path), small "x" marker | Brief §4.2 — explicit |
| 4 | `anchor` | Classical anchor, simple curved arms, no chain | Hebrews 6:19 — natural Christopher reference |
| 5 | `gospel-open` | Open book outline with a small cross on the visible page, clean lines | Adult catechetical vocabulary |
| 6 | `censer` | Thurible with three chains, swinging, small cross on top — precise rendering distinct from Theo's vocabulary | Liturgical |
| 7 | `chi-rho` | The Chi-Rho monogram, classical proportions | Cultural touchstone: desert father chapter heads |
| 8 | `olive-branch` | Single sprig, ~7 leaves, no fruit | Peace, anointing, the Spirit-as-dove imagery |
| 9 | `dome-silhouette` | Single dome with cross on top, narrow base showing drum | Architectural reference; appears for parish-life entries |
| 10 | `greek-doxa` | The word **Δόξα** lettered cleanly, gold accent | Most common closing in the corpus |
| 11 | `greek-axios` | The word **Ἄξιος** lettered cleanly, gold accent | Reserved for chrismation / ordination moments |
| 12 | `greek-anesti` | The phrase **Χριστὸς ἀνέστη** lettered in two lines, gold accent | Reserved for Pascha-window entries only |

### 2.3 Architectural locks (per dispatch)

- No character likenesses in any sketch. No faces on the birds. No portraits. The portraits live in the entry header (60px circle per D1 §4.2); the marginal sketches are separate.
- No Mom-as-figure sketch even abstractly. She is referenced in text only.
- No Father Nicholas vocabulary in v1 (per D1 §1.7). When Father Nicholas v1 ships, add a third sub-library (`/assets/sketches/father-nicholas/`) following the same conventions.
- Static-only. No SVG animations, no `<animate>` tags.

---

## §3. Production Tooling — Recommendation

The honest assessment first:

**AI image-gen (NOT RECOMMENDED as primary).** Line-art at this register is where current AI image-gen struggles most. The model tends to add spurious detail, render unwanted backgrounds, get Orthodox iconographic conventions wrong (the three-bar cross is regularly misrendered as a Catholic crucifix; the Chi-Rho is regularly rendered as a Christmas ornament), and — critically — cannot reliably differentiate "10-year-old hand" from "adult hand" within the same prompt session without heavy reference imagery. Voice differentiation is the single most-likely-to-fail dimension and AI fails it the most. Anti-recommended.

**Stock CC libraries (Phosphor, Tabler, Noun Project, OpenClipart).** Generic Christian cross and candle icons exist abundantly, but most are flat-modern, not pencil-sketch register. Adapting them requires a sketchify pass (e.g., Rough.js applied programmatically; or manual rework in Affinity Designer with a pressure-sensitive brush). The Orthodox-specific iconography (three-bar cross, properly-rendered censer, Chi-Rho) is harder to source cleanly. Workable as a **fallback**.

**Freelance illustrator commission.** Realistic budget for 24 small line-art sketches at this register: $300-$800 (Fiverr/Upwork tier) to $1500-$3000 (mid-tier with Orthodox sensitivity, e.g., via the Iconographer's Guild network). Ship time including revision: 1-3 weeks. Gets the voice differentiation right with a single brief to one artist. **Strong fallback if hand-draw doesn't work.**

**Hand-draw by Kevin on iPad (Procreate or Notability).** This is the recommended primary path, for three reasons:

1. **The differentiation is free.** Switching brush + care level between Theo's and Christopher's sketches is a 30-second tool-swap. Every other tooling option requires fighting for differentiation.
2. **The imperfections themselves are the texture.** The bar here is not "professional illustration" — it's "would Theo or Christopher have drawn this in their journal?" Almost any adult with a stylus and 10 minutes per sketch can clear that bar.
3. **The personal authorship parallels the project's voice.** The catechetical voice is Kevin's voice through Theo and Christopher. The sketches being Kevin's hand through Theo and Christopher is consistent.

### 3.1 Recommended path: hand-draw pilot, with stock+sketchify as fallback

**Phase A — Pilot (one evening, ~90 min):**
Pick 5 sketches that span the difficulty range:
- Easy: `small-cross`, `cross-tiny`
- Medium: `bird-flying`, `compass-rose`
- Hard (voice differentiation under test): `censer` (must clearly read as Christopher's hand, not Theo's)

Draw each one in Procreate at 200×200px on a transparent background. Use a charcoal pencil brush for Theo (e.g., Procreate's "6B Pencil" at 30% pressure-opacity) and a fine ink brush for Christopher (e.g., "Studio Pen" at constant opacity).

**Decision gate after Phase A:**
- If the five sketches feel right (Kevin reads them and says "yes, those are Theo and Christopher's hands") — proceed to Phase B.
- If they feel off — switch to stock+sketchify path or commission. No sunk-cost into a path that isn't working.

**Phase B — Library build (~3 hours):**
Remaining 19 sketches at ~10 min each. Export each as SVG (Procreate's SVG export is acceptable for line-art; if rough, export as 600×600 PNG transparent and trace-convert with a free tool like Inkscape's `File → Import` + `Path → Trace Bitmap`).

**Fallback path (if Phase A fails): stock + sketchify (~5 hours):**
Source line-art icons from Phosphor Icons (Orthodox cross, anchor) and Noun Project (compass, censer, dome). Apply `rough.js` filter or manual Affinity Designer roughen brush. Voice differentiation comes from two different filter passes — heavier roughen for Theo, light roughen for Christopher. Lower quality bar but achievable.

**Last resort: commission.** If both Phase A and the stock path fail, brief a freelance illustrator. Single batch, fixed scope, single voice brief. ~$500 budget, ~2 weeks.

---

## §4. Integration Specification

### 4.1 File format and asset path

**SVG, not PNG.** Reasoning:
- File size: ~1-3KB per sketch; 24 sketches = ~50KB total bundle cost (trivial)
- Tintable via CSS `fill: currentColor` — this is critical for the ink-color-matches-speaker requirement, and it makes adding Father Nicholas later (a third color) a CSS variable swap instead of a re-export
- Scales cleanly at any size
- Inline-able for accessibility tree control

**Asset paths:**
```
/assets/sketches/theo/compass-rose.svg
/assets/sketches/theo/bird-flying.svg
/assets/sketches/theo/...
/assets/sketches/christopher/cross-tiny.svg
/assets/sketches/christopher/...
```

Reserved future paths: `/assets/sketches/father-nicholas/` (v1.1+).

### 4.2 Sizing rules

```css
.fj-sketch {
  width: 48px;   /* default; ~2× line-height of journal handwriting at 22px */
  height: 48px;
  opacity: 0.88;
}

.fj-sketch--sm  { width: 32px; height: 32px; }   /* small variant for tight margins */
.fj-sketch--lg  { width: 64px; height: 64px; }   /* large variant for top-of-entry feature */
```

Sketches never exceed 64px. Per the brief, they are *marginal*. A 96px sketch competes with the text; a 64px sketch does not.

### 4.3 Positioning rules

Six fixed slots per entry, all in the actual margins (never embedded in text flow):

```
┌─────────────────────────────────────┐
│ [top-left]              [top-right] │
│                                     │
│       (handwritten entry body)      │
│                                     │
│ [mid-left]              [mid-right] │
│                                     │
│       (handwritten entry body)      │
│                                     │
│ [bot-left]              [bot-right] │
└─────────────────────────────────────┘
```

Per-author count limits (enforced at QC, not runtime):
- **Theo entries**: 1-2 sketches max
- **Christopher entries**: 0-1 sketches max

Position is **variable per entry**, author-specified. Not fixed to library item. (A compass rose can appear top-right in one entry and bot-left in another.)

### 4.4 Mobile / responsive

On iPad portrait (the primary surface), the journal page is ~700px wide. Margins are ~40px each side, comfortably fitting a 48px sketch with 8px breathing room. On phones, the layout collapses to a narrower column; sketches drop to the `--sm` 32px variant automatically via media query at ≤480px width.

### 4.5 Accessibility

- All sketches render with `aria-hidden="true"` (they are decorative; the entry text carries the semantic content per the journal-as-text-document model)
- No alt text appears in the accessibility tree
- Screen readers skip them and read the journal entry text directly
- Sufficient contrast is automatic — the ink colors (`#3A2817`, `#2A1810`) on parchment (`#F5ECD7`, `#F0E4C8`) clear WCAG AA at 0.88 opacity

---

## §5. Per-Entry Authoring Workflow

The D1 §5.4 Field Journal authoring template is extended with an optional `sketches:` array. Backward-compatible: existing entries without the array render with zero sketches.

```yaml
entry_id: 2026-06-19-theo-baptism
date: 2026-06-19
author: theo
location_tag: "St. Demetrios. Friday."
paired_entry: 2026-06-19-christopher-baptism
surface_on_day_of: true
sketches:
  - id: candle-tall
    position: top-right
  - id: small-cross
    position: bot-left
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
sketches:
  - id: greek-doxa
    position: top-right
body: |
  My son was baptized this morning. I had prepared what I thought I would
  feel and I felt none of it. I felt something better. He asked me later
  why his mother was crying. I told him this is what we cry for. He nodded
  as if he already understood, and perhaps he did.
```

**Authoring rules:**
- Sketch IDs must exist in the library at the corresponding author's path (`theo/<id>` for Theo entries; `christopher/<id>` for Christopher entries) — cross-author use is forbidden
- Defaults: when `sketches:` is omitted entirely, the entry renders without any. There is **no automatic insertion** — every sketch is a deliberate authorial choice
- Contextual defensibility: a `compass-rose` for an entry about feeling lost; a `candle-tall` for a vigil entry; a `greek-axios` only when there is a chrismation/ordination moment in scope. Not decorative randomness.

---

## §6. QC Checklist

Per Field Journal entry with sketches, confirm:

- [ ] All sketch IDs exist in the v1 library (`/assets/sketches/<author>/<id>.svg` resolves)
- [ ] Theo entry uses only `theo/*` sketches; Christopher entry uses only `christopher/*` sketches
- [ ] Sketch count is within range (1-2 for Theo; 0-1 for Christopher)
- [ ] Each sketch is contextually defensible — would the author actually have drawn this in this entry?
- [ ] Failure-mode check (per D1 §6.3): would Theo (or Christopher) be embarrassed if Nolan saw that sketch in this entry? If yes, remove or replace
- [ ] Position does not overlap the handwritten text at iPad portrait width (visual smoke test in browser)
- [ ] Greek-word sketches only appear when the entry text itself contains or naturally references that Greek word

Total time per entry QC: ~30 seconds after the library exists.

---

## §7. Time Cost

**One-time library build (recommended path: hand-draw):**
- Phase A pilot: ~90 minutes (5 sketches, decision gate)
- Phase B remainder: ~3 hours (19 sketches at ~10 min each)
- SVG export + tinting setup: ~45 minutes (one-time CSS + asset placement)
- **Total: ~5 hours** spread over 2-3 evenings

**Per-entry sketch authoring:** ~2-3 minutes (browse library, pick 0-2, set position)

**Field Journal v1 ship cost (paired baptism-day entries Jun 19 2026 + ~5 launch-month additional entries):**
- Library build (above): 5 hours one-time
- 7 entries × ~3 min sketch authoring = ~20 min
- **Total ship cost: ~5.5 hours**, of which 5 hours is one-time amortized across all future entries

**If pilot fails and we fall back to stock+sketchify:**
- Library build: ~5 hours (sourcing + sketchify pass)
- All other costs identical
- **Total: ~5.5 hours**

**If pilot fails and we fall back to commission:**
- Brief preparation: ~2 hours
- Wait time: 1-3 weeks
- Library cost: ~$300-$800
- Per-entry authoring identical
- **Total Kevin time: ~3 hours + $500 + calendar slip**

---

## §8. Notes for the Field Journal v1 Engineering Dispatch

The future engineering chat building the Field Journal rendering pipeline should know the following:

**Render flow:**
1. Read entry frontmatter (YAML)
2. If `sketches:` array exists, for each sketch:
   - Resolve path: `/assets/sketches/<entry.author>/<sketch.id>.svg`
   - Inline-load the SVG (use `<svg>` element, not `<img>`) — required for `fill: currentColor` tinting
   - Apply class `fj-sketch` plus position modifier (`.fj-sketch--top-right`, etc.)
   - Set `data-author` attribute so the ink-color rule resolves
   - Set `aria-hidden="true"`
3. If sketch path resolution fails, log a console warning and skip silently — never crash the entry render over a missing sketch

**CSS pattern:**
```css
.field-journal-entry { position: relative; padding: 24px 56px; }  /* margin-room for sketches */
.fj-sketch { position: absolute; opacity: 0.88; pointer-events: none; }
.fj-sketch--top-right { top: 24px;    right: 8px; }
.fj-sketch--top-left  { top: 24px;    left: 8px;  }
.fj-sketch--mid-right { top: 50%;     right: 8px; transform: translateY(-50%); }
.fj-sketch--mid-left  { top: 50%;     left: 8px;  transform: translateY(-50%); }
.fj-sketch--bot-right { bottom: 24px; right: 8px; }
.fj-sketch--bot-left  { bottom: 24px; left: 8px;  }
.fj-sketch[data-author="theo"]        { color: var(--ink-brown); }
.fj-sketch[data-author="christopher"] { color: var(--ink-deep);  }
.fj-sketch svg path { stroke: currentColor; fill: none; }
.fj-sketch[data-author="christopher"][data-greek] svg .greek-letter { fill: var(--byzantine-gold); }
```

**Service worker:**
- Pre-cache the entire `/assets/sketches/` directory on install (~50KB total)
- Bump the static asset version when sketch library updates
- Standard cache-first strategy; sketches change rarely

**Authoring tooling (longer-horizon, not v1):**
- A library-picker UI in the admin authoring surface (D1 §5.7 long-horizon authoring tooling) would expose the 24-sketch grid filtered by author, with a position selector. Until that ships, authoring is done by hand-editing the YAML frontmatter. The hand-edit workflow is fine at the projected entry volume.

**What v1 engineering does NOT need to handle:**
- No runtime sketch generation; the library is static
- No per-user customization of sketches
- No animation; sketches are static SVG
- No A/B testing of sketch placement; placement is authorial

---

☦ Glory to God for all things.
