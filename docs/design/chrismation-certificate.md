# CHRISMATION CERTIFICATE
## Design Spec — The Orthodox Expedition (D6)

**Status:** Designer Chat D6 — design specification for engineering implementation by Chat 22
**Date:** May 14, 2026
**Author:** Designer Chat D6
**Consumed by:** Worker Chat 22 (engineering implementation), Worker Chat 23 (admin tooling integration)
**Production target:** Hard deadline Jun 19, 2026 (Nolan's chrismation day)
**Repo path:** `/docs/design/chrismation-certificate.md`
**Revision history:**
  - 2026-05-14 — Initial D6 spec delivered; OQ-1 through OQ-10 ruled by orchestrator

---

## 0. EXECUTIVE SUMMARY

The Chrismation Certificate is the printable artifact Nolan receives on the day he is sealed with the Gift of the Holy Spirit and becomes a full member of the Orthodox Church. He can print it, frame it, hang it on his wall — the tangible mark of the sacrament.

The certificate is **one page, US Letter portrait, generated as a PDF**. It is personalized (recipient, date, parish, officiating priest, sponsor, parents). Its visual register is Byzantine illuminated-manuscript: parchment-cream surface, gold ornament, the chrismation formula in both Greek (polytonic) and English, the Gospel of the day's central verse, and a closing doxology.

The day chosen — **Friday, June 19, 2026** — is the feast of the Holy Apostle Jude (Thaddeus), Brother of Our Lord, falling in the Apostles Fast. The Gospel of that day, John 14:21-24, contains the verse *"my Father will love him, and we will come to him and make our home with him"* — the indwelling that chrismation enacts. The certificate honors this appointment: the day's Gospel verse appears on the certificate itself.

**Three structural decisions** carrying through this document:

1. **Render approach is HTML + CSS + print-to-PDF**, mirroring the existing `/handouts/` precedent. No JS-PDF library dependency. A self-contained `certificate.html` page reads URL parameters for personalization; the print stylesheet does all visual work; Kevin uses the browser's "Print → Save as PDF" via admin tooling.
2. **GFS Neohellenic loads here for the first time in production.** Chat 22 absorbs the font-asset landing work per D1 §11.5 spec. The certificate is the first liturgical surface that requires the dedicated polytonic Greek face.
3. **Gold is reserved for ornament, never the chrismation formula text.** Per D1 §11.7, Byzantine Gold on Greek text is reserved exclusively for Pascha exclamations (*Χριστὸς ἀνέστη / Ἀληθῶς ἀνέστη*). The chrismation formula *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* renders in body ink color `#3A2817`. Gold appears on the chi-rho monogram, three-bar crosses, hairline frame, fleurs, and ✦ glyphs — never on the Greek formula itself.

---

## 1. SCOPE

In scope for D6:

- Page layout and vertical composition
- Personalization fields and template variables
- The chrismation formula (Greek + English) with typography treatment
- Scripture verse selection and placement (John 14:23 per OQ-1 ruling)
- Closing doxology (Δόξα τῷ Θεῷ + English gloss)
- Ornamental elements (chi-rho, three-bar crosses, fleurs, gold rules)
- Typography hierarchy (sizes, weights, tracking, line-heights)
- PDF technical specifications
- Render approach for Chat 22 (HTML + print stylesheet)
- Anti-patterns and architecture-lock check
- Worked example using Nolan's data
- Engineering handoff inventory for Chat 22

Out of scope:

- Engineering implementation itself (Chat 22)
- Admin tooling integration code (Chat 22 / Chat 23 coordination)
- Father Nicholas character (deferred per D1 §1.7 — and not relevant: the certificate names the *actual* officiating priest, not the app's character)
- Saint icon thumbnails on the certificate (defers to D5's saint card system)
- Multi-language certificates (Greek-language full alternate, etc.) — out of v1 scope
- Future certificates for other sacraments (baptism, etc.) — D6 covers chrismation only; baptism certificate is C2's scope per the orchestrator dispatch sequencing

---

## 2. ARCHITECTURE LOCKS CHECK

D1 established four lifetime architectural locks for all comic-format dialogue and visual surfaces. Each is checked against the certificate. D1 §11.7 (Pascha-gold reservation) is added explicitly per orchestrator note — this is the constraint Phase 1 caught that the dispatch did not flag.

### 2.1 Witness-only posture (D1 §1.4)

*Default and exclusive posture: Nolan beholds; the conversation is not directed at him.*

The certificate is a static printed artifact. There are no character speakers, no dialogue, no gaze. The recipient's name appears in third-person; the chrismation formula is the priest's exclamation at the moment of sealing (third-person address to the recipient via the Greek liturgical idiom); the scripture verse is the Gospel's own words; the doxology is the Church's own prayer. Nothing on the certificate addresses Nolan directly. **PASS.**

### 2.2 English-default, rare canonical Greek (D1 §1.6)

*Greek appears only where Greek IS the speech act.*

Two Greek phrases appear on the certificate:

- *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* — the chrismation formula. This is the *speech act* of the sacrament itself; this is the words the priest speaks as he anoints. English caption follows beneath in Crimson Text Italic, smaller, as a gloss for Nolan's reading.
- *Δόξα τῷ Θεῷ* — closing doxology. Father Stephen Freeman's blog title; D1 §10.4 voice anchor honored without naming. English caption *Glory to God for all things* follows beneath.

Both qualifications are exactly what D1 §1.6 permits: the Greek is the canonical liturgical phrase a priest would actually say, not a translation. English captions sit beneath, smaller, italic, never overshadowing. **PASS.**

### 2.3 Father Nicholas deferred (D1 §1.7)

*Father Nicholas is not authored into any v1 format.*

The certificate names the *actual* officiating priest at the chrismation (Kevin's parish clergy, filled in via personalization). Father Nicholas is the app's deferred *character* (priest in dialogue formats); he is not — and would not be — the real-world officiant. The certificate's `officiating_priest` field is the live officiant, populated by admin tooling at render time. **PASS.**

### 2.4 Mom present-in-world, never authored as a speaker (D1 §1.8)

*A third recurring speaker is not added.*

Danyelle appears as a signing parent (Line 3 of the signature block, alongside Kevin). Signing a certificate is not authored speech — it is real-world parental signature in the family-as-unit posture. No speech bubble, no quoted line, no dialogue. The architectural lock concerns *Mom-as-speaker in dialogue formats*; her signature on the chrismation certificate honors her real role as Nolan's mother without making her a Marginalia / Vita Strip / Field Journal speaker. **PASS.**

### 2.5 Pascha-gold reservation (D1 §11.7) — Phase 1 catch

*Byzantine Gold on Greek text is reserved exclusively for the resurrection exclamation (Χριστὸς ἀνέστη / Ἀληθῶς ἀνέστη).*

This is the constraint Phase 1 caught on independent re-reading of D1. It is consequential: the chrismation formula *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* is the most theologically weighty text on the page, and the instinct would be to render it in gold. **That instinct is wrong.** Gold-on-Greek is Pascha's signal. Rendering the chrismation formula in gold would dilute the Pascha treatment when it lands — and the chrismation formula carries its weight from its content, from its rare polytonic Greek face, and from its position on the page, not from color.

**The chrismation formula renders in body ink color `#3A2817`. The closing doxology Δόξα τῷ Θεῷ also renders in `#3A2817`.** Gold appears only on ornament: the chi-rho monogram, the four three-bar Orthodox crosses, the inner hairline frame, the corner fleurs, and the ✦ glyphs flanking parent signatures. **PASS** with the constraint explicitly captured here so no future designer dispatch repeats the oversight.

---

## 3. LITURGICAL CONTEXT — JUNE 19, 2026

### 3.1 The day verbatim from the live liturgical_calendar

Audited via Supabase MCP against project `ksfnsryfmkafwirzgjoe`, table `liturgical_calendar`:

| Field | Value |
|---|---|
| `calendar_date` | `2026-06-19` (Friday) |
| `liturgical_season` | `Apostles Fast` |
| `feast_name` | `Thaddeus (Jude) the Apostle & Brother of Our Lord` |
| `feast_rank` | `minor` (apostolic commemoration; weekday feast) |
| `fast_status` | `strict` |
| `sunday_name` | `null` |
| `saint_commemorations` | `["Holy Martyr Zosima", "Our Righteous Father Zenonus", "Paisius the Great of Egypt"]` |
| `daily_readings.gospel.reference` | `John 14:21-24` |
| `daily_readings.epistle.reference` | `Jude 1:1-25` |

### 3.2 The Gospel of the day (verbatim from `daily_readings.gospel.text`)

> *The Lord said to his disciples, "He who has my commandments and keeps them, he it is who loves me; and he who loves me will be loved by my Father, and I will love him and manifest myself to him." Judas (not Iscariot) said to him, "Lord, how is it that you will manifest yourself to us, and not to the world?" Jesus answered him, **"If a man loves me, he will keep my word, and my Father will love him, and we will come to him and make our home with him."** He who does not love me does not keep my words; and the word which you hear is not mine but the Father's who sent me.*

### 3.3 Why this Gospel informs the spec

This is not coincidence; it is Holy Tradition's appointment.

- The day's Apostle, **Jude (Thaddeus), Brother of Our Lord**, is the *questioner* in John 14:22 — his voice is what prompts Jesus's saying about indwelling. The feast's saint is structurally present in the day's Gospel.
- The verse John 14:23 names **indwelling** — the Father and Son coming to make Their home in the believer. This is the precise theology that chrismation enacts: the Spirit is *sealed* in the chrismated; God takes up residence. The day's Gospel is the day's sacrament's content.
- The phrase "we will come to him and make our home with him" **structurally rhymes with Topic 00's title "Coming Home"** — the 15-week catechetical arc that brought Nolan to this day. The Gospel of his chrismation says the same thing his catechesis has been saying.

**Operational note for engineers**: The Apostle Jude's role as the questioner in John 14:22 should not appear in the certificate's body text itself — that would over-explain the resonance. The certificate names him in the date block ("the feast of the Holy Apostle Jude (Thaddeus), Brother of Our Lord") and quotes Jesus's response in the scripture block. Readers who know the Gospel see the connection; readers who don't see two beautiful things on the same page. Both are catechetically appropriate.

### 3.4 The certificate's commemoration string

Per OQ-4 ruling, the date block names the Apostle Jude only. The three minor commemorations (Zosima, Zenonus, Paisius) are *not* enumerated on the certificate — they remain in the broader liturgical calendar but would clutter the certificate without adding meaning at Nolan's age. "Brother of Our Lord" is the canonical Orthodox designation per the live DB `feast_name` field and is kept verbatim.

Canonical commemoration text for the certificate (refined from orchestrator's suggested copy in OQ-4 ruling):

```
the feast of the Holy Apostle Jude (Thaddeus),
        Brother of Our Lord
```

---

## 4. COMPOSITION & LAYOUT

### 4.1 Page dimensions

- **Format:** US Letter portrait
- **Dimensions:** 8.5 inches wide × 11 inches tall (216 mm × 279 mm)
- **Orientation locked:** portrait (no landscape variant)
- **Single-page artifact:** all content fits one page; no spillover, no continuation marks

### 4.2 Bleed and margins

- **Bleed:** none (home printing, not professional press)
- **Page margin:** 0.50 inches (~13 mm) on all four sides
- **Outer gold hairline rule:** ~0.20 inches (5 mm) inside the page margin, framing the content area
- **Inner content margin:** 0.75 inches (~19 mm) inside the gold rule on left/right; 0.50 inches top/bottom inside the rule
- **Result:** a content area of approximately 6.5 inches × 9.5 inches inside the gold hairline frame

### 4.3 Vertical hierarchy (eight content zones, top to bottom)

| Zone | Content | Approx. height |
|---|---|---|
| 1 | Top ornament: chi-rho monogram centered + small three-bar crosses TL/TR corners | ~1.25 in |
| 2 | Document title: *CERTIFICATE OF CHRISMATION* (Cinzel 600 small caps); separator rule beneath | ~0.50 in |
| 3 | Recipient name block (Cinzel 700, largest) + clause *"is sealed with the Gift of the Holy Spirit"* beneath | ~1.50 in |
| 4 | Chrismation formula block: Greek (GFS Neohellenic) + English gloss (Crimson Text Italic); separator rule beneath | ~1.50 in |
| 5 | Date + commemoration block (Crimson Text Regular) | ~1.00 in |
| 6 | Scripture verse block: John 14:23 (Crimson Text Italic with citation in Regular) | ~1.25 in |
| 7 | Personalization block: parish / officiating priest / sponsor (3 lines, Cinzel labels + Crimson Text values) | ~1.25 in |
| 8 | Parent signature block + closing doxology + bottom three-bar crosses | ~1.75 in |

Total ≈ 10.00 in inside the 0.50 in top/bottom margins. The 11 in page tolerates the eight zones with proportional breathing room. Fine-tuning per Chat 22 implementation.

### 4.4 Background surface

Per OQ-3 ruling: solid `#F5ECD7` (`--parchment-cream`) with a ~5% noise-grain texture overlay.

- **Texture asset:** tileable PNG, ~50 KB max, repeating across the full content area inside the gold hairline frame
- **Texture opacity:** 0.05 (subtle aged-paper feel; never competes with text)
- **Texture pattern:** organic noise grain (paper fiber feel), not regular pattern, not visible "noise" pattern
- **Outside the hairline frame:** pure `#F5ECD7` with no texture (cleaner edge against the page)

Chat 22 sources or generates the texture; if no canonical asset exists at production time, a fallback to pure solid `#F5ECD7` (no texture) is acceptable and noted as alternate. The texture is additive, not load-bearing.

### 4.5 Outer ornamental frame

- **Outer gold hairline rule:** 1px solid `#C9A84C` (`--byzantine-gold`), positioned ~5 mm inside the page edge
- **Inner fleur ornaments:** small four-petaled fleur quartrefoils in gold at each of the four inner corners of the hairline frame, ~12 px × 12 px, opacity 1.0
- **No border ornament outside the hairline frame** (keeps the page edge clean for printing tolerances)
- **Corner three-bar crosses:** small ☩ glyphs (SVG, ~20px) positioned at the top-left, top-right, bottom-left, bottom-right of the content area *inside* the hairline frame, flanking the top and bottom ornament zones. Render in gold `#C9A84C` at full opacity.

---

## 5. PERSONALIZATION FIELDS

### 5.1 Field inventory and template variables

The certificate template consumes the following variables, supplied via URL parameters by admin tooling at render time:

| Template variable | Source | Worked example value | Notes |
|---|---|---|---|
| `{{recipient_name}}` | URL param `recipient` (slug) → display name | `Nolan Holt` | Slug `nolan` resolves to display via lookup in admin tooling |
| `{{date_iso}}` | URL param `date` (ISO format) | `2026-06-19` | Used for archival filename + date computations |
| `{{date_long}}` | computed from `date_iso` | *on this nineteenth day of June in the year of our Lord two thousand and twenty-six* | Long-form English date in the canonical liturgical-document style |
| `{{commemoration}}` | computed from `date_iso` via `liturgical_calendar` lookup | *the feast of the Holy Apostle Jude (Thaddeus), Brother of Our Lord* | Per §3.4 canonical text; admin tooling pulls from DB |
| `{{parish}}` | URL param `parish` | `[Parish Name]` (placeholder for spec) | Admin tooling supplies actual value |
| `{{officiating_priest}}` | URL param `priest` | `Father [Officiating Priest]` (placeholder for spec) | Admin tooling supplies actual value |
| `{{sponsor}}` | URL param `sponsor` | `[Godparent Name]` (placeholder for spec) | Admin tooling supplies actual value |
| `{{parent_father}}` | URL param `father` (default `Kevin Holt`) | `Kevin Holt` | Canonical for this family per project memory |
| `{{parent_mother}}` | URL param `mother` (default `Danyelle Holt`) | `Danyelle Holt` | Canonical for this family per project memory |

### 5.2 Default values and fallbacks

- If `recipient` or `date` is missing, the template renders an error message inside the gold hairline frame — *"Missing required parameter. Open from admin tooling."* — rather than producing a malformed certificate.
- If `parish`, `priest`, or `sponsor` is missing, the field renders an underline rule (signature-line style) for the family to handwrite the value after printing. This is a defensible fallback for a partially-completed certificate but is not the recommended workflow.
- If `father` or `mother` is missing, the template uses the canonical defaults `Kevin Holt` and `Danyelle Holt` — this is acceptable per OQ-10 ruling (family names are canonical project documentation).

### 5.3 The commemorated saint field — text only, no thumbnail in v1

Per OQ-4 ruling. The Apostle Jude (Thaddeus) is named in the date block; the three other saints commemorated on Jun 19 are not enumerated. No icon thumbnail in the upper margin. The certificate is a textual artifact; saint imagery lives in D5's saint card system, which Nolan encounters elsewhere in the app.

---

## 6. THE CHRISMATION FORMULA

### 6.1 The Greek polytonic rendering

```
Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου
```

Verified polytonic accents:

- *Σφραγὶς* — grave accent (varia) on ι
- *δωρεᾶς* — circumflex (perispomeni) on α
- *Πνεύματος* — acute accent (oxia) on ε
- *Ἁγίου* — rough breathing + acute on Α; acute on the iota stem-syllable

This is the canonical polytonic form a priest would actually say. GFS Neohellenic handles these glyphs cleanly per D1 §11.2 visual-test findings.

### 6.2 The English gloss

```
The Seal of the Gift of the Holy Spirit
```

This is the standard English rendering used across Orthodox catechetical materials. No theological commentary, no expansion, no paraphrase. The English caption is a *gloss* — a reading aid for Nolan — not a co-equal translation.

### 6.3 Visual treatment (per D1 §11.6 spec)

| Property | Greek line | English caption |
|---|---|---|
| Face | GFS Neohellenic Regular (engages via `unicode-range` for Greek codepoints) | Crimson Text Italic |
| Size | 1.15× of surrounding body text → **22 pt** at certificate scale | 0.85× of surrounding body text → **16 pt** |
| Color | `#3A2817` (`--ink-brown`) — **NOT gold per §11.7** | `#3A2817` at 80% opacity |
| Weight | Regular (400) | Italic (400) |
| Alignment | Centered horizontally on the page | Centered horizontally on the page |
| Vertical gap from Greek to English | — | ~6 pt beneath the Greek line |
| Surrounding gap | ~16 pt above and below the Greek+caption block | (inside the block) |
| Letter-spacing | Default (no extra tracking; polytonic kerning is already designed-in) | Default |

### 6.4 Placement and breathing room

The chrismation formula block sits in zone 4 (per §4.3), directly beneath the recipient name block and above a fleur dot separator rule. It is the visual *center* of the page — the most theologically weighty text, positioned where the eye naturally lands first when the certificate is held.

---

## 7. SCRIPTURE VERSE

### 7.1 The verse (per OQ-1 ruling)

> *"If a man loves me, he will keep my word, and my Father will love him, and we will come to him and make our home with him."*
> *— John 14:23*

This is the central verse of the Gospel of the day (John 14:21-24) for Jun 19, 2026, the feast of the Apostle Jude. The Gospel was prompted by the Apostle Jude's question in v.22; Jesus's response in v.23 names the indwelling that chrismation enacts. The verse rhymes structurally with Topic 00's title *Coming Home*.

### 7.2 Why this verse, not the catechetical alternates

- **1 John 2:27** ("the anointing which you received... abides in you") — the locus classicus on chrismation; theologically tighter as anointing-language; but unconnected to the specific date and to Nolan's catechesis arc.
- **2 Cor 1:21-22** ("anointed us... sealed us... given us the Spirit") — uses both *anointed* and *sealed* (the two key chrismation verbs); but Pauline density may read less child-accessibly than the Lord's own words.
- **Romans 8:14-16** ("led by the Spirit of God, these are sons of God") — strong sonship language; but conceptual rather than imagistic.

John 14:23 wins this on three converging grounds: it is the **Gospel of the actual day** (Holy Tradition's appointment), it names **indwelling** (chrismation's content), and it **rhymes with the catechetical arc** that brought Nolan to this day. The other verses remain canonical chrismation scripture; they may appear in future Field Journal entries or session content. The certificate gets the day's verse.

### 7.3 Visual treatment

| Property | Verse body | Citation |
|---|---|---|
| Face | Crimson Text Italic | Crimson Text Regular |
| Size | 14 pt | 12 pt |
| Color | `#3A2817` | `#3A2817` at 80% opacity |
| Alignment | Centered, line-broken to fit ~3 lines | Centered beneath, em-dash prefix |
| Quote marks | Curly double quotes `"`...`"` | — |

Line-break suggestion for the verse (Chat 22 may refine for line-length balance at production):

```
"If a man loves me, he will keep my word, and my
Father will love him, and we will come to him and
        make our home with him."
                — John 14:23
```

---

## 8. TYPOGRAPHY HIERARCHY

### 8.1 Sizes in points (8.5 × 11 page)

| Element | Face | Weight / style | Size | Letter-spacing | Color |
|---|---|---|---|---|---|
| Recipient name | Cinzel | 700 | 36 pt | +0.12em | `#3A2817` |
| Document title (*Certificate of Chrismation*) | Cinzel | 600 | 16 pt | +0.18em, small-caps via `text-transform: uppercase` with letter-spaced display | `#3A2817` |
| Chrismation formula — Greek | GFS Neohellenic | 400 | 22 pt | default | `#3A2817` |
| Chrismation formula — English gloss | Crimson Text | Italic 400 | 16 pt | default | `#3A2817` @ 0.80 |
| *is sealed with the Gift of the Holy Spirit* (clause beneath name) | Crimson Text | Italic 400 | 14 pt | default | `#3A2817` |
| Date block body | Crimson Text | Regular 400 | 14 pt | default | `#3A2817` |
| Commemoration line | Crimson Text | Italic 400 | 13 pt | default | `#3A2817` @ 0.85 |
| Scripture verse body | Crimson Text | Italic 400 | 14 pt | default | `#3A2817` |
| Scripture citation | Crimson Text | Regular 400 | 12 pt | default | `#3A2817` @ 0.80 |
| Personalization field labels (*chrismated at*, *by*, *sponsored by*) | Cinzel | 400 small caps | 9 pt | +0.10em | `#3A2817` @ 0.70 |
| Personalization field values (parish, priest, sponsor) | Crimson Text | Regular 400 | 13 pt | default | `#3A2817` |
| Parent signature names | Crimson Text | Regular 400 | 13 pt | default | `#3A2817` |
| Parent role labels (*Father*, *Mother*) | Crimson Text | Italic 400 | 11 pt | default | `#3A2817` @ 0.80 |
| Doxology — Greek | GFS Neohellenic | 400 | 14 pt | default | `#3A2817` |
| Doxology — English gloss | Crimson Text | Italic 400 | 11 pt | default | `#3A2817` @ 0.80 |

### 8.2 Line-heights

| Block | Line-height |
|---|---|
| Recipient name (single line) | 1.0 |
| Document title (single line) | 1.0 |
| Chrismation formula Greek (single line) | 1.2 |
| Chrismation formula English (single line) | 1.4 |
| Date block multi-line | 1.5 |
| Scripture verse multi-line | 1.5 |
| Personalization fields | 1.6 (extra space for legibility of varied values) |
| Doxology block | 1.4 |

### 8.3 Cinzel weights — confirmed available

The app already loads Cinzel 400 / 600 / 700 via Google Fonts CDN on every page that uses it. No new Cinzel weight needs to be added. The certificate uses 400, 600, 700 only.

### 8.4 Crimson Text — confirmed available

The app already loads Crimson Text Regular 400, Regular 600, and Italic 400. The certificate uses Regular 400 and Italic 400 only. No new Crimson Text weights needed.

### 8.5 GFS Neohellenic — NOT yet loaded; Chat 22 lands

Per D1 §11.5 and OQ-9 ruling. The certificate is the first liturgical surface that consumes GFS Neohellenic in production. Chat 22 must:

1. Download `GFSNeohellenic-Regular.woff2` from Google Fonts (https://fonts.google.com/specimen/GFS+Neohellenic) — Regular weight only suffices for v1; italic and bold can be deferred per D1 §11.9.
2. Commit to `/assets/fonts/GFSNeohellenic-Regular.woff2` (canonical path per D1 §11.5 spec).
3. Add the `@font-face` block per D1 §11.5 with `unicode-range: U+0370-03FF, U+1F00-1FFF` (Greek + Greek Extended).
4. Update the `--font-body` declaration in the certificate's stylesheet (or globally if the asset is intended for app-wide use): `--font-body: 'Crimson Text', 'GFS Neohellenic', serif;`.
5. Add the woff2 path to `sw.js` `STATIC_ASSETS`.
6. Bump `sw.js` cache version (current version at time of Chat 22 fire — Chat 22 confirms via repo Phase 1).

---

## 9. ORNAMENTAL ELEMENTS

### 9.1 Chi-rho monogram (top center)

The chi-rho ☧ is the monogram of *Christos* (ΧΡ) — the first two Greek letters of Christ. It shares the root with *χρίσμα* (chrism), the oil of anointing. Choosing the chi-rho as the top ornament names the sacrament thematically without illustrating it literally (a chrism flask was considered and rejected per OQ-2 — too literal).

- **Glyph source:** SVG path, not Unicode (Unicode ☧ rendering quality varies dramatically by font; a known SVG ensures consistency)
- **Size:** ~48 pt equivalent (~64 px at 96 dpi)
- **Color:** `#C9A84C` (`--byzantine-gold`)
- **Position:** horizontally centered, ~0.6 in below the top of the content area (inside the hairline frame)
- **Flanking ornaments:** none directly adjacent; the chi-rho stands alone in its row. The TL/TR corner three-bar crosses (§9.2) frame the broader top zone.

### 9.2 Three-bar Orthodox crosses (four corners)

The three-bar Orthodox cross is the canonical Eastern cross. Per D3 §2.2 #2 and D5 anti-pattern reminders: the slanted footrest must run **top-right to bottom-left from the viewer's perspective** (i.e., the right end of the footrest, as the viewer sees it, is lower). This is non-negotiable iconographic accuracy.

- **Glyph source:** SVG path, not Unicode (same reasoning as chi-rho)
- **Size:** ~20 pt equivalent at the four content-area corners
- **Color:** `#C9A84C` at full opacity
- **Position:** at the four inner corners of the content area (inside the gold hairline frame), one cross at each corner
- **Spacing:** ~0.5 in from corner; the cross sits in the corner zone, not on the rule itself

### 9.3 Gold hairline frame + inner corner fleurs

- **Hairline rule:** 1 px solid `#C9A84C`, drawn ~5 mm inside the page edge, forming a single rectangular frame
- **Inner corner fleurs:** small four-petal fleur quartrefoils in `#C9A84C` at each of the four inner corners of the hairline frame, where the rules meet. ~12 px × 12 px. Rendered as SVG path or as a simple Unicode-like glyph from a typographic dingbat (✿, ❧, or a custom SVG) — Chat 22 picks the source that produces the most "illuminated manuscript" feel; if the dingbat fonts available read as decorative-modern rather than illuminated, the custom SVG path is the right call.
- **Alternative:** if four-corner fleurs read as too ornate, downgrade to a simple ✦ (which is already canonical app dialect from `curriculum.html` and D4). The fleur is the first choice; the ✦ is the fallback.

### 9.4 Section separator rules

Three section separators inside the content area, each in the same dialect:

```
· · · ─── ☩ ─── · · ·
```

This is small fleur dots flanking a short gold rule and a centered three-bar cross. Used to separate:

- Document title (zone 2) from recipient name (zone 3)
- Chrismation formula (zone 4) from date block (zone 5)
- Scripture verse (zone 6) from personalization block (zone 7)

The separator is rendered in `#C9A84C` at 0.70 opacity (slightly paler than the cardinal ornaments so it reads as breathing room, not as content). Length ~3 inches centered horizontally.

### 9.5 ✦ flanking parent signatures

The ✦ glyph (Unicode U+2726 BLACK FOUR POINTED STAR) is canonical app dialect from `curriculum.html` corner ornaments and D4. Used to flank the Kevin Holt / Danyelle Holt signature line as decorative bookends.

- **Color:** `#C9A84C` at 0.70 opacity (matches separator-rule treatment; ornamental, not cardinal)
- **Size:** matches the parent signature line height (~16 pt)
- **Position:** immediately left of Kevin's name and immediately right of Danyelle's name; standard text-flow spacing

### 9.6 Anti-pattern reminders (carried from D3, D5)

- **Three-bar Orthodox cross ONLY** — never Latin crucifix; never Catholic cross. Slanted footrest oriented correctly per §9.2.
- **NO Sacred Heart imagery** — anywhere on the certificate.
- **NO dove of the Holy Spirit** in v1 — rejected per OQ-2 to avoid Western Catholic devotional drift; chi-rho carries the symbolism.
- **NO chrism flask illustration** — rejected per OQ-2 as too literal.
- **NO saint icon thumbnail** — saint imagery lives in D5's saint card system, not the certificate.
- **NO decorative angels, scrollwork cherubim, Renaissance putti, or any baroque devotional aesthetic.**
- **NO gold on Greek text** — per D1 §11.7 Pascha-gold reservation. Chrismation formula and doxology Greek render in `#3A2817`, never gold.

---

## 10. CLOSING DOXOLOGY

### 10.1 The Greek

```
Δόξα τῷ Θεῷ
```

Verified polytonic accents:

- *Δόξα* — acute on omicron
- *τῷ* — circumflex with iota subscript on omega
- *Θεῷ* — circumflex with iota subscript on omega

### 10.2 The English gloss

```
Glory to God for all things
```

This is the formula made famous by St. John Chrysostom on his deathbed (*Δόξα τῷ Θεῷ πάντων ἕνεκεν*) and used as the title of Father Stephen Freeman's blog, which D1 §10.4 names as the voice anchor for the entire project. The full Chrysostom phrase ends with πάντων ἕνεκεν ("for all things") — the certificate uses the abbreviated Δόξα τῷ Θεῷ with the full English gloss beneath, which is the form that reads cleanly on a printed page without requiring the longer Greek.

### 10.3 Visual treatment

| Property | Greek line | English gloss |
|---|---|---|
| Face | GFS Neohellenic Regular | Crimson Text Italic |
| Size | 14 pt | 11 pt |
| Color | `#3A2817` — **NOT gold per §11.7** | `#3A2817` @ 0.80 |
| Alignment | Centered | Centered |
| Vertical gap | — | ~4 pt beneath the Greek |
| Surrounding ornament | small three-bar cross ☩ in gold, ~16 px, centered above the Greek line | none beneath the gloss |

### 10.4 Placement

The doxology is the final content block on the page (zone 8 lower portion), centered above the bottom corner three-bar crosses. It is the certificate's closing flourish — the same role the gold ☩ + Crimson Text Italic closing caption plays in D1 §3.7's Vita Strip flourish.

---

## 11. PDF TECHNICAL SPECIFICATIONS

### 11.1 Page setup

- **Page size:** US Letter portrait (`@page { size: letter portrait; margin: 0; }` in the print stylesheet)
- **Orientation:** portrait, locked
- **Color space:** RGB (home printing target; PDF viewers handle RGB-to-CMYK conversion at print driver level if the family ever takes the PDF to a professional printer)
- **Resolution:** vector wherever possible; raster only for the parchment texture (300 dpi target if rasterized)

### 11.2 Font embedding

All three faces must be embedded in the output PDF so the certificate renders correctly on any device without requiring local font installation:

- Cinzel (400, 600, 700) — Google Fonts CDN, served as woff2; browsers embed when "Save as PDF" is invoked
- Crimson Text (Italic 400, Regular 400) — Google Fonts CDN; same embedding
- GFS Neohellenic Regular — self-hosted woff2 at `/assets/fonts/GFSNeohellenic-Regular.woff2`; browsers embed when "Save as PDF" is invoked

**Verification:** Chat 22 produces a test PDF and opens it on a clean system (without local Greek font installed) to confirm the polytonic Greek renders correctly. This is the one production-quality QC step that must happen before the certificate is used live.

### 11.3 Vector vs raster

- **Text:** all glyphs render as vector (PDF text or curves), not as rasterized images
- **Chi-rho monogram:** vector (SVG path)
- **Three-bar Orthodox crosses:** vector (SVG path)
- **Fleur ornaments:** vector (SVG path or vector font glyph)
- **Hairline rule:** vector (CSS `border` produces vector output in print)
- **✦ glyphs:** vector (Unicode glyph from Cinzel or system font)
- **Parchment texture overlay (if used):** raster PNG at 300 dpi (acceptable for a subtle background; vector noise patterns are non-trivial)

### 11.4 File-size target

- **Target:** under 2 MB for the generated PDF
- **Realistic estimate:** ~600 KB to ~1.2 MB depending on whether the parchment texture is included
- **Why this matters:** small enough to email, attach to a Field Journal entry, or send to grandparents without compression worry

### 11.5 Print-color-adjust

The print stylesheet must include:

```css
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

This ensures the gold ornament and the parchment cream background render at full color when the user prints. Default browser print behavior strips background colors and images; without this declaration, the certificate prints as black text on white paper.

### 11.6 Page-break protection

```css
.certificate {
  page-break-inside: avoid;
}
```

The certificate is a single page; this declaration prevents the browser from accidentally splitting it across pages if the user's print settings include unusual margins or scaling.

---

## 12. RENDER APPROACH FOR CHAT 22

### 12.1 The recommended approach (per OQ-5 ruling)

**HTML + CSS + browser print-to-PDF**, mirroring the existing `/handouts/` precedent in the repo. No JS-PDF library dependency.

Pipeline:

1. Chat 22 builds `/certificate.html` — a single self-contained HTML file
2. The file reads URL parameters (`?recipient=nolan&date=2026-06-19&parish=...&priest=...&sponsor=...`) at page load
3. JavaScript populates the template fields and the date/commemoration block (the latter requires a Supabase lookup OR a pre-baked lookup table for known dates — Chat 22 picks based on simplicity)
4. The print stylesheet (in the same HTML file or imported) does all visual work
5. Admin tooling on `admin.html` exposes a "Generate Certificate" action that opens `certificate.html` in a new tab with URL params populated
6. Kevin uses the browser's "Print → Save as PDF" dialog to produce the final PDF
7. Optional: the resulting PDF is committed to `/assets/certificates/chrismation-<slug>-<YYYY-MM-DD>.pdf` for permanent archival

### 12.2 Print stylesheet specifics

The print stylesheet (`@media print { ... }`) is the load-bearing piece. Key declarations:

```css
@page {
  size: letter portrait;
  margin: 0;
}

@media print {
  body {
    margin: 0;
    padding: 0;
    background: #F5ECD7;
  }
  .certificate {
    width: 8.5in;
    height: 11in;
    page-break-inside: avoid;
    background: #F5ECD7 url('/assets/textures/parchment-texture.png');
    background-blend-mode: multiply;
    background-size: 100% 100%;
  }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

The screen rendering of `certificate.html` (when opened on screen, not yet printed) can render the certificate at a comfortable preview size (~80% scale, centered, with a soft drop shadow to suggest the printable artifact). The print stylesheet strips the preview chrome and produces the 8.5×11 output.

### 12.3 URL parameter parsing

```javascript
const params = new URLSearchParams(window.location.search);
const recipient = params.get('recipient') || '';
const date = params.get('date') || '';
const parish = params.get('parish') || '';
const priest = params.get('priest') || '';
const sponsor = params.get('sponsor') || '';
const father = params.get('father') || 'Kevin Holt';
const mother = params.get('mother') || 'Danyelle Holt';
```

### 12.4 Admin tooling integration shape (not implementation)

Chat 22 (or a follow-up dispatch) adds to `admin.html`:

- A new section titled *"Certificate Generation"*
- A form with fields: recipient (dropdown of explorers), date (date picker), parish (text input), officiating priest (text input), sponsor (text input), father (text input, default *Kevin Holt*), mother (text input, default *Danyelle Holt*)
- A *"Generate Certificate"* button that opens `certificate.html` in a new tab with URL params populated from the form
- The user (Kevin) inspects the rendered certificate, then uses browser "Print → Save as PDF" to produce the final PDF

This is the *shape*; the actual implementation is Chat 22's call.

### 12.5 Filename convention for the saved PDF

When Kevin uses "Print → Save as PDF", the browser suggests a filename. The default filename is determined by the page's `<title>`. Chat 22 sets the page title dynamically:

```javascript
document.title = `chrismation-${recipientSlug}-${dateIso}`;
```

Resulting suggested filename: `chrismation-nolan-2026-06-19.pdf`.

If the rendered PDF is committed to the repo for archival, its canonical path is:

```
/assets/certificates/chrismation-nolan-2026-06-19.pdf
```

### 12.6 Archival vs live render

Two equally valid paths post-render:

- **Live-render only:** Kevin saves the PDF locally; the family prints from local; no PDF lives in the repo. The `certificate.html` page is the single source of truth and re-renders on demand.
- **Live-render + commit:** Kevin saves the PDF, then commits the saved PDF to `/assets/certificates/` for permanent access from the Field Manual or admin tooling. The committed PDF is a frozen snapshot; the `certificate.html` remains the canonical render path.

Recommendation: ship live-render-only for v1; if Kevin wants persistent access from the Field Manual, the commit-to-archive pattern is a small follow-up dispatch.

---

## 13. ANTI-PATTERNS — WHAT NOT TO DO

### 13.1 Western Catholic register

- **No Latin crucifix** — only the three-bar Orthodox cross, with slanted footrest correctly oriented.
- **No Sacred Heart imagery** — anywhere.
- **No fleur-de-lis** — Western royal heraldry, not Orthodox.
- **No baroque devotional flourishes** — no scrollwork cherubim, no Renaissance putti, no rays of light beaming from the chi-rho.
- **No Latin text** — the certificate is bilingual English + Greek; no Latin (no *In Nomine Patris*, no *Confirmatio*, no Latin formula).

### 13.2 Saccharine sentimentality (per D1 §10.4 voice anchor)

- **No "Today is the most special day"** language. The certificate witnesses; it does not perform.
- **No "May God bless you abundantly"** flourishes. The doxology *Glory to God for all things* is the closing; it is sufficient.
- **No exclamation points** anywhere on the page. The certificate is contemplative, not celebratory in the party sense.
- **No "Congratulations!"** No "Welcome to the family of God!" The chrismation is the family of God; the certificate names that without explaining it.

### 13.3 Disney / AI-art drift (per D3 anti-AI stance)

- **No cartoon iconography** — no winking cherubs, no smiling crosses, no rainbow gradients.
- **No AI-generated decorative borders** unless hand-vetted by Kevin against the D3 anti-AI checklist (and even then, vector ornament is preferable).
- **No mascot drift** — no Theo or Christopher anywhere on the certificate. The witness-only / no-character-on-printable-artifact constraint is total.

### 13.4 Protestant praise-band aesthetic

- **No modern hand-lettering script fonts** (Pacifico, Great Vibes, Dancing Script, etc.) — these read as wedding-invite Etsy aesthetic, not Byzantine illumination.
- **No washed-out watercolor backgrounds** — the parchment cream is the canonical surface; not pastel watercolor.
- **No worship-song lyric formatting** — the scripture verse renders as a quoted block in serif italic, not as song-lyric centered-block enthusiasm.

### 13.5 The "office certificate" failure mode

- **No corporate certificate-of-completion register** — no ribbon ornaments, no "in recognition of" preamble, no "presented this day" boilerplate. The chrismation is a sacrament, not a milestone the family is awarded for achieving.

### 13.6 Mascot drift (the load-bearing exclusion)

The single most important visual exclusion: **neither Theo nor Christopher appears anywhere on the certificate.** Not as portraits, not as silhouettes, not as marginal companions. The certificate is the *sacrament's* artifact, not the *app's* artifact. Theo and Christopher are catechetical companions inside the app; on a printed certificate that may hang on Nolan's wall for decades, they would read as mascot drift — making the app's characters present at a moment the actual sacrament owns.

If a future dispatch proposes a Field Journal entry on the day of the chrismation that includes Theo/Christopher reflections, that entry lives in the Field Manual archive (per D1 §4) — distinct from the certificate. The certificate witnesses the sacrament; the Field Journal entries (paired Theo + Christopher) witness the catechetical companions' parallel observation of the day. Two different artifacts, two different surfaces.

---

## 14. WORKED EXAMPLE — NOLAN'S CERTIFICATE, JUNE 19, 2026

### 14.1 Personalization values for the worked example

| Template variable | Value |
|---|---|
| `{{recipient_name}}` | `Nolan Holt` |
| `{{date_iso}}` | `2026-06-19` |
| `{{date_long}}` | `on this nineteenth day of June in the year of our Lord two thousand and twenty-six` |
| `{{commemoration}}` | `the feast of the Holy Apostle Jude (Thaddeus), Brother of Our Lord` |
| `{{parish}}` | `[Parish Name]` *(placeholder; admin tooling supplies real value)* |
| `{{officiating_priest}}` | `Father [Officiating Priest]` *(placeholder)* |
| `{{sponsor}}` | `[Godparent Name]` *(placeholder)* |
| `{{parent_father}}` | `Kevin Holt` |
| `{{parent_mother}}` | `Danyelle Holt` |

### 14.2 The rendered certificate (text top to bottom)

```
┌── outer gold hairline rule, ~5mm inside page edge ──────────┐
│                                                              │
│  ☩                                                      ☩    │
│                                                              │
│                         ☧                                    │
│                                                              │
│       CERTIFICATE  OF  CHRISMATION                           │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│                                                              │
│                    NOLAN  HOLT                               │
│                                                              │
│        is sealed with the Gift of the Holy Spirit            │
│                                                              │
│                                                              │
│           Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου                     │
│                                                              │
│         The Seal of the Gift of the Holy Spirit              │
│                                                              │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│           on this nineteenth day of June                     │
│              in the year of our Lord                         │
│           two thousand and twenty-six,                       │
│                                                              │
│     the feast of the Holy Apostle Jude (Thaddeus),           │
│              Brother of Our Lord                             │
│                                                              │
│                                                              │
│     "If a man loves me, he will keep my word, and my         │
│     Father will love him, and we will come to him and        │
│              make our home with him."                        │
│                    — John 14:23                              │
│                                                              │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│       CHRISMATED AT     [Parish Name]                        │
│                                                              │
│       BY                Father [Officiating Priest]          │
│                                                              │
│       SPONSORED BY      [Godparent Name]                     │
│                                                              │
│                                                              │
│       ✦   Kevin Holt          Danyelle Holt   ✦              │
│             — Father —          — Mother —                   │
│                                                              │
│                                                              │
│                          ☩                                   │
│                    Δόξα τῷ Θεῷ                               │
│             Glory to God for all things                      │
│                                                              │
│                                                              │
│  ☩                                                      ☩    │
│                                                              │
└── outer gold hairline rule, ~5mm inside page edge ──────────┘
```

(The Unicode ☧ and ☩ glyphs above are stand-ins for the SVG ornaments specified in §9; rendered on the actual certificate as vector paths in `#C9A84C`.)

### 14.3 Production verification

When Chat 22 renders this certificate at the spec values:

- The polytonic Greek diacritics on *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* and *Δόξα τῷ Θεῷ* should render cleanly via GFS Neohellenic — iota subscripts visible, circumflexes shaped correctly, rough breathing on Ἁ readable
- The chi-rho monogram in gold sits as the visual anchor of the top zone
- The four corner three-bar crosses frame the page without competing with the central content
- The recipient name *NOLAN HOLT* in Cinzel 700 36pt is the largest text on the page
- The scripture verse and the chrismation formula together carry the page's theological weight
- The closing doxology, *Δόξα τῷ Θεῷ / Glory to God for all things*, signs off the artifact in the project's canonical voice

If any of the above renders ambiguously, Chat 22 returns to the spec for clarification before deploying.

---

## 15. ENGINEERING HANDOFF FOR CHAT 22

### 15.1 What Chat 22 consumes from this spec

The complete inventory Chat 22 implements from this document:

1. The `certificate.html` HTML structure per §4.3 vertical hierarchy
2. The print stylesheet per §11 and §12.2
3. The Greek polytonic strings per §6.1 and §10.1 (copy verbatim from this spec; do not retype)
4. The scripture verse and citation per §7.1 (copy verbatim)
5. The personalization template variables per §5.1
6. The ornament SVG paths per §9 (Chat 22 sources or generates clean SVG for chi-rho, three-bar cross, four-corner fleur, ✦ if not using Unicode)
7. The typography hierarchy per §8.1 (sizes, weights, line-heights)
8. The color palette per §4.4, §6.3, §10.3 (`#F5ECD7`, `#C9A84C`, `#3A2817`)
9. The URL parameter parsing per §12.3
10. The filename convention per §12.5

### 15.2 GFS Neohellenic asset landing (the prerequisite)

Per OQ-9 ruling, Chat 22 absorbs the font-asset work. Specifically:

1. **Download** `GFSNeohellenic-Regular.woff2` from Google Fonts (https://fonts.google.com/specimen/GFS+Neohellenic). Regular weight only is sufficient for v1; italic and bold can be deferred per D1 §11.9.
2. **Commit** to `/assets/fonts/GFSNeohellenic-Regular.woff2`.
3. **Add `@font-face` block** to the certificate's stylesheet (or to a shared font-loading file if Chat 22 prefers global app-wide loading). Use the D1 §11.5 spec:

```css
@font-face {
  font-family: 'GFS Neohellenic';
  src: url('/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Regular.woff2') format('woff2');
  unicode-range: U+0370-03FF, U+1F00-1FFF;
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}
```

4. **Update `--font-body`** declaration if loading globally:

```css
:root {
  --font-body: 'Crimson Text', 'GFS Neohellenic', serif;
}
```

If Chat 22 loads only inside the certificate page, the certificate's stylesheet declares this scoped to `.certificate`.

5. **`sw.js` STATIC_ASSETS addition**:

```javascript
'/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Regular.woff2',
```

6. **`sw.js` cache version bump**: Chat 22 confirms current version at Phase 1 (per Op Learning #3 — discovery before authoring) and bumps by one.

### 15.3 admin.html action integration shape

Chat 22 (or follow-up dispatch) adds to `admin.html`:

- New section heading: *Certificate Generation*
- Form fields: recipient (dropdown of explorers), date (date picker), parish (text), priest (text), sponsor (text), father (text, default *Kevin Holt*), mother (text, default *Danyelle Holt*)
- Submit button: *Generate Certificate* — opens `certificate.html` in a new tab with URL params populated from the form fields

### 15.4 QC verification steps for Chat 22 before declaring complete

1. Render the worked example (Nolan, 2026-06-19, placeholders for parish/priest/sponsor) on screen
2. Verify polytonic Greek diacritics render correctly (visual inspection against §6.1 and §10.1 verified strings)
3. Use browser "Print → Save as PDF"; open the resulting PDF on a clean system (without local Greek font); confirm the Greek still renders correctly (font is properly embedded)
4. Verify the gold ornament colors print correctly (not stripped to black) — requires `print-color-adjust: exact`
5. Verify the page fits on a single US Letter sheet without splitting
6. Verify the four corner three-bar crosses have correctly-oriented slanted footrests (top-right to bottom-left from viewer perspective)
7. Verify file size is under 2 MB

### 15.5 Open items Chat 22 surfaces at its own Phase 1

- Confirm sw.js current cache version
- Confirm whether the parchment texture PNG asset exists or needs to be generated (acceptable fallback: solid `#F5ECD7` with no texture, per §4.4 alternate)
- Confirm whether the date/commemoration lookup uses Supabase live query (preferred — single source of truth) or a pre-baked client-side lookup table for known dates (simpler — but requires update when new dates are added)

---

## 16. OPEN ITEMS / FOLLOWUPS

### 16.1 Resolved in this spec (record)

- **OQ-1 through OQ-10:** ruled by orchestrator at Phase 1 pause; all rulings honored in Phase 2 authoring per the green-light document.
- **D1 §11.7 Pascha-gold reservation:** captured explicitly in §2.5; future designer dispatches inherit this constraint.

### 16.2 Deferred to follow-up dispatches

- **Baptism certificate (C2):** sibling artifact for Nolan's baptism on the same day (Jun 19, 2026, per project sequencing — chrismation and baptism are joined on the same liturgical occasion). The baptism certificate is C2's scope, not D6's. D6 establishes the visual register, ornament dialect, and render approach C2 will mirror.
- **Wedding certificate, etc.:** future Orthodox milestones the family may want printable artifacts for; out of v1 scope; D6's pattern extends straightforwardly.
- **Saint icon thumbnail in the date block:** rejected for v1 per OQ-4. Could be reconsidered in v1.x if Kevin decides the certificate would benefit from a small (~24px) icon thumbnail of the Apostle Jude (Thaddeus) beside the commemoration text. The asset exists per D5's saint card system; the integration would be cosmetic.
- **Field Journal entries paired with the chrismation day:** the paired Theo + Christopher Field Journal entries (per D1 §5.4 baptism-day pattern, extended to the chrismation occasion) are a distinct content-authoring task; not part of D6. The certificate and the Field Journal entries are two different artifacts that together witness the day.

### 16.3 Items Chat 22 surfaces at its own Phase 1 discovery

Per §15.5:

- Current sw.js cache version (for the bump)
- Parchment texture asset existence (or fallback to solid)
- Date/commemoration lookup approach (Supabase live vs. pre-baked)

These are engineering decisions appropriate to Chat 22's Phase 1, not designer concerns.

---

☦ Glory to God for all things.
