# HOLY BAPTISM CERTIFICATE
## Design Spec — The Orthodox Expedition (D7)

**Status:** Designer Chat D7 — design specification for engineering implementation by combined Chat 22+24 certificate pipeline
**Date:** May 14, 2026
**Author:** Designer Chat D7
**Consumed by:** Worker Chat 22 (engineering implementation — shared certificate pipeline), Worker Chat 24 (baptism-specific template + admin tooling extension)
**Production target:** Hard deadline Jun 19, 2026 (Nolan's joined baptism + chrismation day)
**Sibling spec:** `/docs/design/chrismation-certificate.md` (D6 — chrismation certificate)
**Repo path:** `/docs/design/baptism-certificate.md`
**Revision history:**
  - 2026-05-14 — Initial D7 spec delivered; OQ-1 through OQ-4 ruled by orchestrator; PB-1 through PB-6 resolved

---

## 0. EXECUTIVE SUMMARY

The Holy Baptism Certificate is the printable artifact Nolan receives on the day he is baptized — buried with Christ in the waters of holy baptism and raised with him to newness of life. He can print it, frame it, hang it on his wall — the tangible mark of the sacrament. It is the **sibling artifact** to the Chrismation Certificate (D6); the two are produced from a single joined initiation rite on the morning of **Friday, June 19, 2026**.

The certificate is **one page, US Letter portrait, generated as a PDF**. It is personalized (recipient, date, parish, officiating priest, godparent, parents). Its visual register is Byzantine illuminated-manuscript: parchment-cream surface, gold ornament, the baptismal formula in both Greek (polytonic) and English, the Galatians 3:27 verse the Church sings at every Orthodox baptism, and a closing doxology.

**Three structural decisions** carry through this document:

1. **Render approach is HTML + CSS + print-to-PDF**, mirroring the D6 chrismation cert and the existing `/handouts/` precedent. No JS-PDF library dependency. A self-contained `certificate.html` page (shared with D6) reads URL parameters including `?type=baptism` for personalization; the print stylesheet does all visual work; Kevin uses the browser's "Print → Save as PDF" via admin tooling.
2. **Galatians 3:27 anchors the scripture block.** The verse is sung in Greek at every Orthodox baptism in place of the Trisagion — *Ὅσοι εἰς Χριστὸν ἐβαπτίσθητε, Χριστὸν ἐνεδύσασθε*. It is the verse the Church places in Nolan's own ears at the moment of baptism. The certificate quotes the scriptural form (with "For") in English; the citation reads "Galatians 3:27."
3. **The body framing block expands beyond D6's date-only pattern.** A 113-word contemplative paragraph sits in zone 5 between the formula and the scripture. This is a **deliberate structural divergence from D6**, not implicit drift. Baptism is narratively richer than chrismation — triple immersion, water imagery, dying-and-rising. Chrismation seals in a single anointing. The two sacraments deserve different weight on the page; identical structural symmetry between the certs would flatten the difference between the rites. Asymmetric structure honors asymmetric sacraments.

**A naming-convention asymmetry to flag explicitly**: this certificate is titled CERTIFICATE OF **HOLY BAPTISM**; D6 is titled CERTIFICATE OF CHRISMATION (no qualifier). The asymmetry is canonical, not stylistic. "Holy Baptism" is the formal Orthodox sacramental designation per service books (the *Akolouthia* of Holy Baptism); "Baptism" alone reads generic/Protestant. "Holy Chrismation" is attested but less common than "Chrismation" alone in Orthodox usage, which is why D6 omits the qualifier. Future readers should not read the difference as drift.

---

## 1. SCOPE

In scope for D7:

- Page layout and vertical composition (8 zones; zone 5 expanded vs D6)
- Personalization fields and template variables (with new `{{family_name}}`, `{{pronoun_subj}}`, `{{pronoun_obj}}` for the body framing)
- The baptismal formula (Greek + English) with typography treatment, three-line break, and 1.4 line-height
- Scripture verse selection and placement (Galatians 3:27 per OQ-1 ruling)
- Body framing prose block — the certificate's contemplative voice (per OQ-4 expand ruling)
- Closing doxology (Δόξα τῷ Θεῷ + English gloss — same as D6)
- Ornamental elements (chi-rho per OQ-3 sibling match, three-bar crosses with corrected orientation per PB-1, fleurs, gold rules)
- Typography hierarchy (sizes, weights, tracking, line-heights — cites D6 §8 with one delta)
- PDF technical specifications (cites D6 §11)
- Render approach for combined Chat 22+24 pipeline (cites D6 §12 + adds `type` URL param)
- Anti-patterns specific to baptism (no font illustration, no shell-three-drops, no dove of the Spirit)
- Architecture-lock check against all five locks
- Worked example using Nolan's data, with template placeholders for unconfirmed fields
- Engineering handoff inventory for Chat 22+24 (combined cert pipeline)
- Footrest-orientation errata note (per PB-1 ruling)

Out of scope:

- Engineering implementation itself (Chat 22+24)
- D3 / D6 footrest-orientation directional corrections (post-launch repo-audit chat per PB-1 ruling)
- Apostle Jude saint card on certificate body (per PB-2 ruling — Jude is named as text in date block only)
- Father Nicholas character (deferred per D1 §1.7 — the certificate names the *actual* officiating priest)
- Future certificates for other sacraments — D7 covers baptism only; chrismation is D6; future Orthodox milestones extend the pattern straightforwardly
- Multi-language certificates (Greek-language full alternate) — out of v1 scope

---

## 2. ARCHITECTURE LOCKS CHECK

D1 established five lifetime architectural locks. Each is checked against the baptism certificate independently; none inherits its pass from D6.

### 2.1 Witness-only posture (D1 §1.4)

*Default and exclusive posture: Nolan beholds; the conversation is not directed at him.*

The certificate is a static printed artifact. There are no character speakers, no dialogue, no gaze. The recipient's name appears in third-person; the baptismal formula is the priest's exclamation at each immersion (canonical Byzantine passive idiom — *the servant of God is baptized*, not *I baptize you*); the body framing prose is third-person narration of what the Church has done; the scripture verse is Paul's own words; the doxology is the Church's own prayer. Nothing on the certificate addresses Nolan directly. The body framing's closing line — *This morning she has done it again* — has the Church as feminine subject; "this morning" describes the day of the rite, not a moment of direct address to the reader. **PASS.**

### 2.2 English-default, rare canonical Greek (D1 §1.6)

*Greek appears only where Greek IS the speech act.*

Two Greek phrases appear on the certificate:

- *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ [Name] εἰς τὸ ὄνομα τοῦ Πατρός, καὶ τοῦ Υἱοῦ, καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.* — the baptismal formula. This is the *speech act* of the sacrament itself, what the priest says at each of the three immersions. English caption follows beneath in Crimson Text Italic, smaller, as a gloss for Nolan's reading.
- *Δόξα τῷ Θεῷ* — closing doxology, identical to D6.

The Galatians 3:27 scripture is quoted in English only (no Greek). Two Greek phrases per cert × two certs from the joined rite = four Greek appearances on a single morning's artifacts. Plus Pascha and the *Ἄξιος* moments in the broader corpus, total annual budget tracks at 8-10 Greek phrases against D1 §1.6's 2-4 per scene rationing — but the rationing applies *per scene*, not per object; a single sacrament-day artifact set is one event, not multiple. **PASS.**

### 2.3 Father Nicholas deferred (D1 §1.7)

*Father Nicholas is not authored into any v1 format.*

The certificate names the *actual* officiating priest at Nolan's reception (Kevin's parish clergy, filled in via personalization). Father Nicholas is the app's deferred *character*; he is not — and would not be — the real-world officiant. The `{{officiating_priest}}` field is the live officiant, populated by admin tooling at render time. **PASS.**

### 2.4 Mom present-in-world, never authored as a speaker (D1 §1.8)

*A third recurring speaker is not added.*

Danyelle appears as a signing parent (right side of the signature block, alongside Kevin). Signing a certificate is not authored speech — it is real-world parental signature in the family-as-unit posture. No speech bubble, no quoted line, no dialogue. The body framing references the household — *He went down a child of the household of Holt* — without quoting either parent. **PASS.**

### 2.5 Pascha-gold reservation (D1 §11.7)

*Byzantine Gold on Greek text is reserved exclusively for the resurrection exclamation (Χριστὸς ἀνέστη / Ἀληθῶς ἀνέστη).*

The baptismal formula *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ...* is the most theologically weighty text on the page, and the instinct would be to render it in gold — particularly given baptism's resurrection theology (Romans 6:4, the dying-and-rising the body framing names). **That instinct is wrong.** Gold-on-Greek is Pascha's signal alone. The baptismal formula renders in body ink color `#3A2817`. The closing doxology *Δόξα τῷ Θεῷ* also renders in `#3A2817`. Gold appears only on ornament: the chi-rho monogram, the four three-bar Orthodox crosses, the inner hairline frame, the corner fleurs, and the ✦ glyphs flanking parent signatures. **PASS.**

---

## 3. LITURGICAL CONTEXT — JUNE 19, 2026

### 3.1 The day (cites D6 §3.1 verbatim)

The day's liturgical-calendar values are identical to those documented in D6 §3.1 (audited via Supabase MCP against project `ksfnsryfmkafwirzgjoe`, table `liturgical_calendar`): Friday, June 19, 2026; Apostles Fast season; feast of Thaddeus (Jude) the Apostle & Brother of Our Lord; minor rank; strict fast. The Gospel of the day is John 14:21-24 (D6's scripture source); the Epistle of the day is Jude 1:1-25.

The baptism and chrismation are joined on this single morning. Both certificates carry the same date and the same commemoration; the structural appointment of the day belongs to both rites.

### 3.2 Why the scripture anchor differs from D6

D6 anchored on John 14:23, the central verse of the Gospel of the day, where Christ promises indwelling — the precise theology chrismation enacts. D7 anchors on **Galatians 3:27**, not the Epistle of the day (which is Jude 1:1-25) but the verse the Church sings in Greek at every Orthodox baptism in place of the Trisagion:

> *Ὅσοι εἰς Χριστὸν ἐβαπτίσθητε, Χριστὸν ἐνεδύσασθε. Ἀλληλούϊα.*

This is the verse the Church places in the recipient's ears at the moment of baptism itself. The scriptural anchor logic differs from D6 by design: chrismation's certificate quotes the Gospel of the day (Holy Tradition's calendrical appointment); baptism's certificate quotes the verse of the rite itself (Holy Tradition's sacramental appointment). Both anchors are liturgically immediate; they differ in *which* immediacy.

### 3.3 The doctrinal diptych

Read alongside D6's John 14:23, Galatians 3:27 completes a patristic diptych:

| Cert | Verse | Image |
|---|---|---|
| Baptism (D7) | *"have put on Christ"* | clothing (Galatians 3:27) |
| Chrismation (D6) | *"we will come to him and make our home with him"* | indwelling (John 14:23) |

Two complementary metaphors for the one new life. The sibling pair reads as a single theological statement when hung side-by-side. Nolan grows up with both verses on his wall; the verses do their work without the diptych ever being named.

### 3.4 The certificate's commemoration string

Per D6 §3.4 — verbatim. Per PB-2 ruling: Jude appears as TEXT in the date/commemoration block, not as a saint card on the certificate body. The phrasing is canonical GOA / Orthodox liturgical usage (Jude as Apostle and Brother of Our Lord identified together in Orthodox tradition, unlike some Western treatments):

```
the feast of the Holy Apostle Jude (Thaddeus),
        Brother of Our Lord
```

The three minor June 19 commemorations (Zosima, Zenonus, Paisius) are not enumerated here — consistent with D6.

---

## 4. COMPOSITION & LAYOUT

### 4.1 Page dimensions

**Cites D6 §4.1 entirely.** US Letter portrait, 8.5 in × 11 in (216 mm × 279 mm), portrait locked, single-page artifact.

### 4.2 Bleed and margins

**Cites D6 §4.2 entirely.** No bleed; 0.50 in page margin all sides; gold hairline rule ~0.20 in inside the page margin; ~6.5 × 9.5 in content area inside the rule.

### 4.3 Vertical hierarchy — eight content zones (DIVERGES FROM D6 IN ZONE 5)

D7's vertical hierarchy carries D6's eight-zone structure but **zone 5 expands** to accommodate the body framing prose paragraph (per OQ-4 expand ruling). This is a deliberate structural divergence documented in §0 EXEC. Zone heights adjust as below; the total ≈ 10.50 in fits the 10-in interior with proportional breathing-room compression on zones 4 and 6 if needed at production.

| Zone | Content | Approx. height (D7) | vs D6 |
|---|---|---|---|
| 1 | Top ornament: chi-rho monogram centered + small three-bar crosses TL/TR corners | ~1.25 in | same |
| 2 | Document title: *CERTIFICATE OF HOLY BAPTISM* (Cinzel 600 small caps); separator rule beneath | ~0.50 in | same |
| 3 | Recipient name block (Cinzel 700, largest) + clause *"has put on Christ in the waters of holy baptism"* beneath | ~1.50 in | same |
| 4 | Baptismal formula block: Greek (GFS Neohellenic, three lines) + English gloss (Crimson Text Italic); separator rule beneath | ~1.85 in | +0.35 in (longer Greek) |
| 5 | **Body framing block: date opening + contemplative paragraph (113 words)** | **~2.10 in** | **+1.10 in vs D6's date-only zone** |
| 6 | Scripture verse block: Galatians 3:27 (Crimson Text Italic with citation in Regular) | ~1.10 in | -0.15 in (verse is shorter than D6's John 14:23) |
| 7 | Personalization block: parish / officiating priest / godparent (3 lines, Cinzel labels + Crimson Text values) | ~1.25 in | same |
| 8 | Parent signature block + closing doxology + bottom three-bar crosses | ~1.75 in | same |

Total ≈ 11.30 in inside the 0.50 in top/bottom margins. The fit at production target is tight; Chat 24 may need to compress separator-rule vertical padding by ~10% or reduce body framing leading by 0.5 pt to land cleanly on the 11 in page. Phase 2 spec accepts this as engineering tuning, not designer constraint.

### 4.4 Background surface

**Cites D6 §4.4 entirely.** Solid `#F5ECD7` (`--parchment-cream`) with ~5% noise-grain texture overlay. Texture is additive, not load-bearing; fallback to pure solid `#F5ECD7` is acceptable.

### 4.5 Outer ornamental frame

**Cites D6 §4.5 entirely.** Outer gold hairline rule 1px `#C9A84C` ~5 mm inside page edge; inner corner fleur ornaments ~12×12 px in gold; corner three-bar crosses at the four content-area corners inside the rule. **Footrest orientation per §9 corrected guidance (PB-1).**

---

## 5. PERSONALIZATION FIELDS

### 5.1 Field inventory and template variables

The certificate template consumes the following variables, supplied via URL parameters by admin tooling at render time. **NEW VARIABLES** (vs D6) are flagged:

| Template variable | Source | Worked example value | Notes |
|---|---|---|---|
| `{{type}}` | URL param `type` | `baptism` | **NEW**: differentiates baptism vs chrismation in the combined Chat 22+24 pipeline. Values: `baptism` \| `chrismation` |
| `{{recipient_name}}` | URL param `recipient` (slug) → display name | `Nolan Holt` | Slug `nolan` resolves to display via lookup in admin tooling |
| `{{recipient_name_greek}}` | derived or supplied | `Νολάνος` | **NEW context** (D6 doesn't render the recipient name inside its Greek formula). See §5.3 — family/parish decision, not spec-fixed |
| `{{date_iso}}` | URL param `date` | `2026-06-19` | Used for archival filename + date computations |
| `{{date_long}}` | computed from `date_iso` | *on this nineteenth day of June in the year of our Lord two thousand and twenty-six* | Long-form English date in the canonical liturgical-document style |
| `{{commemoration}}` | computed from `date_iso` via `liturgical_calendar` lookup | *the feast of the Holy Apostle Jude (Thaddeus), Brother of Our Lord* | Per §3.4 canonical text |
| `{{family_name}}` | URL param `family_name` (default `Holt` per project memory) | `Holt` | **NEW**: required by body framing prose ("a child of the household of Holt") |
| `{{pronoun_subj}}` | URL param `pronoun_subj` | `he` | **NEW**: subject pronoun (he/she/they) for body framing |
| `{{pronoun_obj}}` | URL param `pronoun_obj` | `him` | **NEW**: object pronoun (him/her/them) for body framing |
| `{{parish}}` | URL param `parish` | `[Parish Name]` *(placeholder)* | Admin tooling supplies actual value |
| `{{officiating_priest}}` | URL param `priest` | `Father [Officiating Priest]` *(placeholder)* | Admin tooling supplies actual value |
| `{{godparent}}` | URL param `godparent` | `[Godparent Name]` *(placeholder)* | **NEW LABEL** vs D6's `sponsor` — see §5.4 |
| `{{parent_father}}` | URL param `father` (default `Kevin Holt`) | `Kevin Holt` | Canonical for this family |
| `{{parent_mother}}` | URL param `mother` (default `Danyelle Holt`) | `Danyelle Holt` | Canonical for this family |

### 5.2 Default values and fallbacks

**Cites D6 §5.2** in approach: missing required parameters render an error message inside the gold hairline frame; missing optional fields render an underline rule for handwriting after print. Parent defaults `Kevin Holt` / `Danyelle Holt` per project memory.

D7 additions:
- If `family_name` is missing, the template defaults to `Holt` (canonical) — but admin tooling exposes the field so families other than the Holts can edit.
- If `pronoun_subj` / `pronoun_obj` are missing, the template defaults to `he` / `him` for the worked example, but admin tooling **must** expose the field — the spec is NOT hard-coded male. Per orchestrator OQ-4 ruling: *"pronoun fields should not be hard-coded to 'he/him' in the spec or the template."*

### 5.3 The Greek-form recipient name inside the formula (family/parish decision)

The Greek-form rendering of the recipient name inside the formula is a family/parish decision at render time, not a spec-fixed value. Common options include:

- **(i)** Given name unchanged (`Nolan` inside the Greek string)
- **(ii)** Greek transliteration nominative (`Νολάνος`)
- **(iii)** Greek baptismal saint name, if the recipient takes a patron at baptism (e.g., `Γερμανός` for St. Herman)

The `{{recipient_name_greek}}` URL parameter accepts whatever value the family supplies; admin tooling does not transliterate or substitute. If `{{recipient_name_greek}}` is missing, the template falls through to `{{recipient_name}}` (the English form) — degrading gracefully without breaking the formula's grammar.

The worked example (§14) uses `Νολάνος` (option ii) as a structural placeholder. Kevin will decide at render time.

### 5.4 "Godparent" vs "Sponsor"

D6 §5 uses `{{sponsor}}` and the label "SPONSORED BY" for the chrismation. D7 uses `{{godparent}}` and the label "GODPARENT" for the baptism.

Both terms appear in Orthodox usage. In joined initiation rites the same person typically fills both roles, but the canonical role at baptism is the *godparent* (anadochos, ἀνάδοχος — the one who receives the newly-baptized from the font) and at chrismation is the *sponsor*. The two roles are not strictly synonymous; the baptism cert names the role canonically. Admin tooling exposes both fields independently so the same name can populate both certs in joined-rite cases without conceptual collapse.

### 5.5 The commemorated saint field — text only, no thumbnail in v1

Per D6 §5.3 — same posture for D7. The Apostle Jude (Thaddeus) is named in the date block (per §3.4) as text only. No icon thumbnail. Saint imagery lives in D5's saint card system, which Nolan encounters elsewhere in the app. Per PB-2 ruling: Jude is being authored in parallel via C5-jude (content authoring dispatch); his eventual saint-card surface is post-launch v1.x scope, not D7's.

---

## 6. THE BAPTISMAL FORMULA

### 6.1 The Greek polytonic rendering

```
Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ {{recipient_name_greek}}
εἰς τὸ ὄνομα τοῦ Πατρὸς, καὶ τοῦ Υἱοῦ,
καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.
```

Authoritative form per the *Mikron Euchologion* (Greek Orthodox Archdiocese service book) and Hapgood's *Service Book of the Holy Orthodox-Catholic Apostolic Church*.

Verified polytonic accents (orchestrator's Phase 2 correction on Υἱοῦ incorporated):

| Word | Accent / breathing |
|---|---|
| *Βαπτίζεται* | acute (oxia) on iota of the antepenult: *τί* |
| *ὁ* | smooth breathing on omicron |
| *δοῦλος* | circumflex (perispomeni) on the ου diphthong (sits over the upsilon) |
| *τοῦ* | circumflex on ου |
| *Θεοῦ* | circumflex on ου |
| *εἰς* | smooth breathing on the εἰ diphthong (sits over the iota) |
| *τὸ* | grave (varia) on omicron (non-final, before ὄνομα) |
| *ὄνομα* | smooth breathing + acute on omicron |
| *τοῦ* | circumflex on ου |
| *Πατρὸς,* | grave on omicron (non-final, before comma) |
| *καὶ* | grave on iota of the αι diphthong (non-final, before τοῦ) |
| *τοῦ* | circumflex on ου |
| ***Υἱοῦ*** | **rough breathing (dasia) on the iota (ἱ), not on the upsilon**; circumflex on the ου diphthong |
| *καὶ* | grave on iota |
| *τοῦ* | circumflex on ου |
| *Ἁγίου* | rough breathing on Α; acute on iota of *γί* (penult of the genitive form) |
| *Πνεύματος.* | acute on the upsilon of the ευ diphthong |
| *Ἀμήν.* | smooth breathing on Α; acute on η |

**Important typographic note** on Υἱοῦ: the rough breathing in YIO- words conventionally sits on the **iota**, not the upsilon, despite the upsilon being the first letter of the word. The orthography is settled in the polytonic Greek tradition and is what Hapgood + the GOA service books render. GFS Neohellenic handles the placement correctly. The glyph above is canonical-correct; only the description of where the breathing sits needs to match the glyph (which it now does, per orchestrator Phase 2 correction).

GFS Neohellenic handles all the diacritic cases above cleanly per D1 §11.2 visual-test findings.

### 6.2 The English gloss

```
The servant of God {{recipient_name}} is baptized
in the name of the Father, and of the Son, and
of the Holy Spirit. Amen.
```

This is the standard English rendering used across Orthodox catechetical materials. No theological commentary, no expansion, no paraphrase. The English caption is a *gloss* — a reading aid for Nolan — not a co-equal translation.

### 6.3 Visual treatment

| Property | Greek lines (3) | English gloss (2-3 lines) |
|---|---|---|
| Face | GFS Neohellenic Regular (engages via `unicode-range` for Greek codepoints) | Crimson Text Italic |
| Size | 1.15× of surrounding body text → **22 pt** at certificate scale (same as D6 §6.3) | 0.85× of surrounding body text → **16 pt** (same as D6) |
| Color | `#3A2817` (`--ink-brown`) — **NOT gold per §11.7 lock** | `#3A2817` at 80% opacity |
| Weight | Regular (400) | Italic (400) |
| Alignment | Centered horizontally on the page | Centered horizontally on the page |
| Line-height | **1.4** (vs D6's 1.2 for single-line) — three-line block needs more breathing | 1.4 |
| Vertical gap from Greek block to English | — | ~10 pt beneath the last Greek line |
| Surrounding gap | ~16 pt above and below the Greek+caption block | (inside the block) |
| Letter-spacing | Default | Default |

### 6.4 Why three lines, broken on grammatical chunks

The Greek formula is ~12 words / ~60 characters with diacritics. At 22 pt GFS Neohellenic on a ~6.5-in inner content width, a single line is too long. Three-line treatment chosen, breaking on grammatical chunks:

- **Line 1**: Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ {{recipient_name_greek}} (the subject phrase + name in apposition)
- **Line 2**: εἰς τὸ ὄνομα τοῦ Πατρὸς, καὶ τοῦ Υἱοῦ, (the first two persons of the trinitarian naming)
- **Line 3**: καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν. (the third person + closing Amen)

The three lines gently echo the three immersions of the rite — without explicating the structure. The break after the first two persons (rather than after each one) preserves the grammatical chunking; line 2 reads as a unit, line 3 as a unit. Both feel natural to the eye.

Alternatives considered and rejected (per Phase 1 (c) reasoning):
- **Reduce Greek size to ~16 pt to fit one line** — sacrifices the visual weight the formula carries.
- **Two-line break (after `{{recipient_name_greek}}`)** — still too wide; the trinitarian phrase deserves its own line for the triadic resonance.

### 6.5 The triple-immersion rite vs the single-form formula on the certificate

In actual liturgical practice the formula is broken across three immersions:

> *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ [Name] εἰς τὸ ὄνομα τοῦ Πατρός. Ἀμήν.* [first immersion]
> *Καὶ τοῦ Υἱοῦ. Ἀμήν.* [second immersion]
> *Καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.* [third immersion]

For the certificate, presentation as a **single complete formula** is appropriate; the rite's three-stage structure is named in the body framing prose (*"Three times the priest immersed him..."*). The certificate witnesses the formula in its theological completeness; the body framing names the lived structure of the rite.

### 6.6 Placement and breathing room

The baptismal formula block sits in zone 4 (per §4.3), directly beneath the recipient name + clause and above the fleur-dot separator that introduces zone 5 (the body framing). It is the visual *center of the top half* of the page — the eye lands on the recipient name first, then descends through the formula and gloss before crossing the separator into the body framing prose.

---

## 7. SCRIPTURE VERSE

### 7.1 The verse (per OQ-1 ruling)

> *"For as many of you as were baptized into Christ have put on Christ."*
> *— Galatians 3:27*

This is the verse the Church sings in Greek (*Ὅσοι εἰς Χριστὸν ἐβαπτίσθητε, Χριστὸν ἐνεδύσασθε*) at every Orthodox baptism in place of the Trisagion. The chanted-liturgical form drops *γὰρ* per chant practice; the **scriptural form** retains it. The certificate cites "Galatians 3:27" and quotes the verse — not the chant. The certificate is not the Trisagion.

### 7.2 Why this verse — three converging grounds

**1. Liturgical immediacy (decisive).** Galatians 3:27 is sung in Greek at every Orthodox baptism in place of the Trisagion. It is the verse the Church places in the recipient's own ears *at the moment* of being baptized. No other candidate sits this close to the rite. D6's John 14:23 anchored on "Gospel of the day"; D7's Galatians 3:27 anchors on "verse of the rite itself" — a different and equally legitimate liturgical anchoring.

**2. Doctrinal weight + sibling symmetry with D6.** Galatians 3:27 names what baptism does: clothing in Christ (*ἐνεδύσασθε* — same root as Romans 13:14, Colossians 3:9-10). Paired with D6's John 14:23, the two certs form a doctrinal diptych — baptism's "put on Christ" (clothing) + chrismation's "make our home in him" (indwelling). Two complementary patristic metaphors for the one new life.

**3. Catechetical arc fit with Topic 00 "Coming Home."** Slightly less direct than D6's "make our home" rhyme, but the catechetical arc that brought Nolan to this day has been about being incorporated into Christ. "Putting on Christ" is the entry-language Topic 00 has been preparing him for. The certificate witnesses the moment the language becomes the fact.

### 7.3 Why not the catechetical alternates

- **Romans 6:3-4** — the Epistle reading at every Orthodox baptism (along with Galatians 3:27's chanted use). Heavier theology of death-and-resurrection. Excellent on doctrinal weight, but ~50 words to quote responsibly; excerpting an Epistle reading on a one-page certificate is awkward, and truncating loses Paul's argument structure. Better fit for a Field Journal entry than a certificate body. The body framing prose paraphrases Romans 6:4 ("buried with Christ ... raised with him to newness of life") — Paul's argument is present, but compactly.
- **Matthew 28:19** — dominical command, most-cited baptismal verse in catechetical texts. Strong on authority. But it is read FROM Christ to the apostles, not TO the baptized — register is missionary rather than initiatory. Galatians 3:27 is the verse the Church speaks TO Nolan; Matthew 28:19 is the verse the Church speaks ABOUT what she does.

These verses remain canonical baptismal scripture; they may appear in future Field Journal entries or session content. The certificate gets the verse of the rite.

### 7.4 Visual treatment

| Property | Verse body | Citation |
|---|---|---|
| Face | Crimson Text Italic | Crimson Text Regular |
| Size | 14 pt | 12 pt |
| Color | `#3A2817` | `#3A2817` at 80% opacity |
| Alignment | Centered, line-broken to fit ~2 lines | Centered beneath, em-dash prefix |
| Quote marks | Curly double quotes `"`...`"` | — |

The verse is shorter than D6's John 14:23, so two lines suffice. Line-break suggestion for production (Chat 24 may refine for balance):

```
"For as many of you as were baptized into Christ
            have put on Christ."
              — Galatians 3:27
```

---

## 8. TYPOGRAPHY HIERARCHY

**Cites D6 §8 entirely** with one delta and one new clause entry:

| Element | Treatment | vs D6 |
|---|---|---|
| Recipient name (Cinzel 700, 36 pt, +0.12em) | per D6 §8.1 | same |
| Document title (Cinzel 600, 16 pt small-caps, +0.18em) | per D6 §8.1 | same — *but text reads "CERTIFICATE OF HOLY BAPTISM" per PB-5* |
| Baptismal formula — Greek (GFS Neohellenic 400, 22 pt) | per D6 §8.1 sizes | **line-height delta: 1.4 (D6 was 1.2 single-line)** |
| Baptismal formula — English gloss (Crimson Text Italic 400, 16 pt) | per D6 §8.1 sizes | line-height 1.4 (same as D6 multi-line) |
| Clause beneath recipient name (Crimson Text Italic 400, 14 pt) | per D6 §8.1 | **text differs**: *"has put on Christ in the waters of holy baptism"* (vs D6's *"is sealed with the Gift of the Holy Spirit"*) |
| **Body framing prose** (Crimson Text Regular 400, 13 pt, line-height 1.5) | **NEW** | not in D6 — see §8.6 below |
| Date block opening line (Crimson Text Regular 400, 14 pt) | per D6 §8.1 | now part of body framing in zone 5, see §8.6 |
| Commemoration line (Crimson Text Italic 400, 13 pt @ 0.85 opacity) | per D6 §8.1 | same |
| Scripture verse body (Crimson Text Italic 400, 14 pt) | per D6 §8.1 | same |
| Scripture citation (Crimson Text Regular 400, 12 pt @ 0.80) | per D6 §8.1 | same |
| Personalization labels (Cinzel 400 small caps, 9 pt, +0.10em, @ 0.70) | per D6 §8.1 | **label text differs**: BAPTIZED AT / BY / GODPARENT (vs D6's CHRISMATED AT / BY / SPONSORED BY) |
| Personalization values (Crimson Text Regular 400, 13 pt) | per D6 §8.1 | same |
| Parent signature names (Crimson Text Regular 400, 13 pt) | per D6 §8.1 | same |
| Parent role labels (Crimson Text Italic 400, 11 pt @ 0.80) | per D6 §8.1 | same |
| Doxology Greek (GFS Neohellenic 400, 14 pt) | per D6 §8.1 | same |
| Doxology English gloss (Crimson Text Italic 400, 11 pt @ 0.80) | per D6 §8.1 | same |

**Cinzel weights** (400/600/700) and **Crimson Text** (Italic 400, Regular 400): both already loaded by the app — per D6 §8.3 / §8.4. No new weights needed for D7. **GFS Neohellenic**: NOT yet loaded; landing is D6 §15.2's prerequisite work, which D7 inherits — see §15 below.

### 8.6 Body framing block typography (new for D7)

The body framing prose is the certificate's contemplative voice. Visual treatment:

| Property | Value |
|---|---|
| Face | Crimson Text Regular 400 |
| Size | 13 pt (matches personalization values; slightly smaller than the date-block opening line which is 14 pt and serves as the paragraph's lead-in) |
| Color | `#3A2817` |
| Alignment | Centered, ragged left and right (NOT justified — full justification on short lines reads as block-set print and breaks the contemplative cadence) |
| Line-height | 1.5 (slightly tighter than D6's date-block multi-line 1.5, same numerical value but the paragraph is denser) |
| Line width | ~5 in (~80% of inner content width — centered as a narrow column for legibility) |
| Surrounding gap | ~12 pt above (after the formula's English gloss) and ~16 pt below (before the scripture block) |

The 113-word draft lands as ~10-11 lines at 13 pt with line-height 1.5 — a contemplative paragraph block, not a long passage. The shape on the page is rectangular and dense without being overwhelming.

---

## 9. ORNAMENTAL ELEMENTS

### 9.1 Chi-rho monogram (top center) — sibling match to D6

**Cites D6 §9.1 entirely.** Same SVG path, same ~48 pt size, same `#C9A84C` gold, same centered position. Per OQ-3 ruling: the chi-rho on the baptism cert performs Galatians 3:27 visually — *"you have put on Christ"* + the monogram of Christ at the top of the page. Sibling pair consistency with D6 is decisive: two certs from one rite, hanging side-by-side on Nolan's wall for decades, read as a single sacramental statement.

### 9.2 Three-bar Orthodox crosses (four corners) — CORRECTED ORIENTATION per PB-1

**Cites D6 §9.2 with one important correction** to the orientation description.

The three-bar Orthodox cross has the canonical slanted footrest (suppedaneum). Per Orthodox iconography, the footrest slants from **upper-LEFT to lower-RIGHT from the viewer's perspective**: the viewer's-right end is LOWER (representing the unrepentant thief descending), and the viewer's-left end is RAISED (representing the repentant thief, St. Dismas, ascending). This is the canonical orientation observed across Byzantine and Russian Orthodox iconographic tradition.

The repo's production asset confirms this orientation. `/favicon.svg` line 51 renders the footrest as:

```svg
<g transform="translate(0 56) rotate(-18)">
  <rect x="-62" y="-7.5" width="124" height="15" rx="2"/>
</g>
```

The `rotate(-18)` is counter-clockwise rotation in SVG convention, which raises the LEFT end of a horizontal rectangle and lowers the RIGHT end — i.e., upper-LEFT to lower-RIGHT, canonical orientation.

D7 inherits this orientation:

- **Glyph source:** SVG path, not Unicode (Unicode three-bar cross rendering is inconsistent; SVG ensures fidelity)
- **Size:** ~20 pt equivalent at the four content-area corners
- **Color:** `#C9A84C` at full opacity
- **Position:** at the four inner corners of the content area, ~0.5 in from corner
- **Footrest orientation:** counter-clockwise rotation (e.g., `transform="rotate(-18)"` for an SVG centered on origin), so the **viewer's-right end of the footrest is LOWER**

### 9.2.1 ERRATA NOTE — D3 §2.2 #2 and D6 §9.2

Both D3 §2.2 (Christopher's library entry #2 `cross-three-bar`) and D6 §9.2 currently describe the footrest as "top-right to bottom-left from viewer perspective." This phrasing is **inconsistent with canonical Orthodox iconography and inconsistent with the production favicon SVG.** The intended meaning of both specs is plainly the canonical orientation (D6 §9.2's parenthetical clarification reads *"the right end of the footrest, as the viewer sees it, is lower"* — which describes the canonical TL→BR orientation), but the directional phrase points the opposite way.

Production renders correctly today (favicon.svg is canonical). Only the descriptive prose in two shipped design specs is backwards. A post-launch doc-maintenance dispatch will correct D3 §2.2 and D6 §9.2 to match canonical phrasing. Out of D7 scope; logged for the post-launch repo-audit chat. Not blocking; nothing in the production app changes.

### 9.3 Gold hairline frame + inner corner fleurs

**Cites D6 §9.3 entirely.** 1 px `#C9A84C` rule ~5 mm inside page edge; four-corner fleur quartrefoils ~12×12 px at the rule's inner corners; ✦ Unicode fallback if dingbat fonts read as decorative-modern.

### 9.4 Section separator rules

**Cites D6 §9.4 entirely.** `· · · ─── ☩ ─── · · ·` separator pattern in `#C9A84C` @ 0.70 opacity, ~3 inches centered. Used in D7 between:

- Document title (zone 2) from recipient name (zone 3)
- Baptismal formula (zone 4) from body framing block (zone 5)
- Body framing block (zone 5) from scripture verse (zone 6) — **NEW SEPARATOR** (D6 has scripture inside the same zone-5-to-zone-6 transition; D7's expanded zone 5 means an additional separator within what was D6's continuous block)
- Scripture verse (zone 6) from personalization block (zone 7)

### 9.5 ✦ flanking parent signatures

**Cites D6 §9.5 entirely.** Unicode U+2726 in `#C9A84C` @ 0.70 opacity, ~16 pt, immediately flanking Kevin's and Danyelle's names.

### 9.6 Anti-pattern reminders (carried from D3, D5, D6 + D7-specific)

- **Three-bar Orthodox cross ONLY** — never Latin crucifix; never Catholic cross. Footrest oriented per §9.2 corrected guidance.
- **NO Sacred Heart imagery** — anywhere on the certificate.
- **NO dove of the Holy Spirit** — *new D7-specific:* baptism iconography often features a descending dove at the moment of baptism (Mt 3:16, Mk 1:10, Lk 3:22, Jn 1:32). The image is canonical for *Christ's* baptism but over-symbolic for a child's baptism certificate that already names the Holy Spirit in the formula. The dove would read as Christ-imagery imported into Nolan's certificate; the chi-rho is the more appropriate Christ-marker.
- **NO baptismal font illustration** — *new D7-specific:* the sacramental object stays at the church, not on the certificate (matches D6's discipline against the chrism flask).
- **NO shell-and-three-drops baptism iconography** — *new D7-specific:* the shell with three drops of water is canonical *Western Catholic* baptism imagery (sometimes derived from John the Baptist's iconography in late medieval Western art); theologically benign but reads as wrong-tradition to a viewer with an Orthodox eye.
- **NO saint icon thumbnail** — saint imagery lives in D5's saint card system.
- **NO decorative angels, scrollwork cherubim, Renaissance putti, baroque devotional aesthetic.**
- **NO gold on Greek text** — per D1 §11.7 Pascha-gold reservation. Baptismal formula and doxology Greek render in `#3A2817`, never gold.

---

## 10. CLOSING DOXOLOGY

**Cites D6 §10 entirely.**

- Greek: `Δόξα τῷ Θεῷ` (acute on omicron of Δόξα; circumflex with iota subscript on omega of τῷ; circumflex with iota subscript on omega of Θεῷ)
- English gloss: *Glory to God for all things*
- Visual treatment per D6 §10.3: GFS Neohellenic 14 pt for Greek; Crimson Text Italic 11 pt for gloss; `#3A2817` ink color (NOT gold per §11.7 lock); small ☩ in gold ~16 px centered above the Greek line; centered alignment.
- Placement: final content block on the page (zone 8 lower portion), centered above the bottom corner three-bar crosses.

The doxology is identical across D6 and D7. The sibling certs close with the same prayer — the project's canonical close, not a cert-specific signature.

---

## 11. PDF TECHNICAL SPECIFICATIONS

**Cites D6 §11 entirely.**

- Page setup: `@page { size: letter portrait; margin: 0; }`; orientation locked portrait; RGB color space; vector wherever possible
- Font embedding: Cinzel and Crimson Text via Google Fonts CDN; GFS Neohellenic Regular self-hosted at `/assets/fonts/GFSNeohellenic-Regular.woff2` — embedded into the PDF on browser "Save as PDF"
- Vector treatment: text, chi-rho, three-bar crosses, fleurs, hairline rule, ✦ glyphs all vector; parchment texture (if used) is the only raster element
- File-size target: under 2 MB; realistic estimate 600 KB – 1.2 MB
- `-webkit-print-color-adjust: exact` + `print-color-adjust: exact` on `*` to preserve gold ornament and parchment background through print
- `page-break-inside: avoid` on `.certificate` to prevent accidental page-split

The font-embedding verification step in D6 §11.2 (test PDF opened on a system without local Greek font installed, to confirm GFS Neohellenic is embedded) applies to D7 verbatim. Production-quality QC step before either cert is used live.

---

## 12. RENDER APPROACH FOR CHAT 22 + CHAT 24

### 12.1 The recommended approach — combined cert pipeline

**Cites D6 §12.1 entirely** for the pipeline shape: HTML + CSS + browser print-to-PDF, no JS-PDF library. Adds: **a single `certificate.html` page handles both baptism and chrismation via a `type` URL parameter**, with template-switch logic inside.

Pipeline:

1. Chat 22 builds `/certificate.html` (per D6 §12.1 spec) with shared infrastructure: page chrome, frame, separator rules, doxology, ornament SVGs, GFS Neohellenic font landing per D6 §15.2
2. Chat 24 adds the `type=baptism` branch: title text, recipient clause, formula block, body framing, scripture, personalization labels
3. The page reads URL parameters at load:
   ```
   ?type=baptism&recipient=nolan&date=2026-06-19&parish=...&priest=...&godparent=...&family_name=Holt&pronoun_subj=he&pronoun_obj=him
   ```
4. JavaScript dispatches on `type` to select the correct template fragment for: document title, recipient clause, formula (Greek + gloss), body framing prose, scripture, personalization labels
5. The shared print stylesheet does all visual work
6. Admin tooling on `admin.html` exposes a "Generate Certificate" action with a `type` selector (baptism / chrismation / both) — see §15.3 below
7. Kevin uses the browser's "Print → Save as PDF" to produce the PDF

### 12.2 Print stylesheet specifics

**Cites D6 §12.2 entirely.** Same `@page` declaration, same `print-color-adjust: exact`, same `.certificate` container at 8.5×11 in. No D7-specific additions.

### 12.3 URL parameter parsing (extends D6 §12.3)

```javascript
const params = new URLSearchParams(window.location.search);
const type = params.get('type') || 'chrismation'; // default preserves D6 behavior
const recipient = params.get('recipient') || '';
const date = params.get('date') || '';
const parish = params.get('parish') || '';
const priest = params.get('priest') || '';
// D7-specific:
const godparent = params.get('godparent') || params.get('sponsor') || ''; // accepts either label
const familyName = params.get('family_name') || 'Holt';
const pronounSubj = params.get('pronoun_subj') || 'he';
const pronounObj = params.get('pronoun_obj') || 'him';
const recipientNameGreek = params.get('recipient_name_greek') || recipient;
// Shared:
const father = params.get('father') || 'Kevin Holt';
const mother = params.get('mother') || 'Danyelle Holt';
```

The default for `type` is `chrismation` to preserve backwards compatibility with any links Chat 22 created before D7's `type` param landed. New baptism links must include `type=baptism`.

### 12.4 Template-switch logic

The page maintains two template fragments (DOM nodes hidden by default; one is shown based on `type`):

- `<div data-template="chrismation">` — the D6 fragment (title text, formula, scripture, etc.)
- `<div data-template="baptism">` — the D7 fragment

The dispatch script reads `type`, shows the matching fragment, hides the other, then runs the personalization-substitution pass on the visible fragment. Shared elements (top ornament, frame, parchment, doxology, signatures, corner crosses) live outside the template fragments and render once for both.

This pattern is preferable to two separate HTML files because (a) the shared infrastructure stays in one place, (b) Chat 22's GFS Neohellenic font landing runs once for both, (c) Kevin's admin tooling opens one URL with different `type` values rather than navigating between two pages.

### 12.5 Filename convention

**Extends D6 §12.5.**

```javascript
document.title = `${type}-${recipientSlug}-${dateIso}`;
```

Resulting filenames:
- `baptism-nolan-2026-06-19.pdf`
- `chrismation-nolan-2026-06-19.pdf`

If committed to the repo for archival, canonical paths:
```
/assets/certificates/baptism-nolan-2026-06-19.pdf
/assets/certificates/chrismation-nolan-2026-06-19.pdf
```

### 12.6 Archival vs live render

**Cites D6 §12.6 entirely.** Two valid paths: live-render-only (Kevin prints from local; no PDF in repo) or live-render + commit (Kevin commits the saved PDF for permanent access). Recommendation: live-render-only for v1.

---

## 13. ANTI-PATTERNS — WHAT NOT TO DO

**Cites D6 §13 entirely**, plus three D7-specific additions:

### 13.1 Western Catholic register
Per D6 §13.1. No Latin crucifix; no Sacred Heart; no fleur-de-lis; no baroque flourishes; no Latin text.

### 13.2 Saccharine sentimentality (per D1 §10.4 voice anchor — internal-only)
Per D6 §13.2. No "Today is the most special day." No "May God bless you abundantly." No exclamation points. No "Congratulations!" or "Welcome to the family of God!"

The body framing prose has been written to honor this anti-pattern (verified in §14 below): scriptural paraphrase + concrete present-tense narration + ecclesial close, no flourish.

### 13.3 Disney / AI-art drift
Per D6 §13.3. No cartoon iconography; no AI-generated decorative borders unhand-vetted; no mascot drift (neither Theo nor Christopher anywhere on the certificate).

### 13.4 Protestant praise-band aesthetic
Per D6 §13.4. No hand-lettering script fonts; no washed-out watercolor backgrounds; no worship-song lyric formatting.

### 13.5 The "office certificate" failure mode
Per D6 §13.5. No corporate certificate-of-completion register; no "in recognition of"; no "presented this day."

### 13.6 Mascot drift (the load-bearing exclusion)
Per D6 §13.6. Theo and Christopher do not appear anywhere on the certificate. If Field Journal entries witness the day, they live in the Field Manual archive separately.

### 13.7 NEW for D7 — baptismal iconography over-explanation

D7 adds three baptism-specific anti-patterns (per §9.6 — repeated here for the anti-pattern reader):

- **NO baptismal font illustration** — the sacramental object stays at the church.
- **NO dove of the Holy Spirit** — canonical for Christ's baptism; over-symbolic for Nolan's certificate. The Holy Spirit is named in the formula and (D6) the chrismation cert; the iconographic dove would import Christ-imagery into a personal artifact.
- **NO shell-and-three-drops baptism iconography** — Western Catholic image, wrong tradition for an Orthodox cert.

---

## 14. WORKED EXAMPLE — NOLAN'S CERTIFICATE, JUNE 19, 2026

### 14.1 Personalization values for the worked example

| Template variable | Value |
|---|---|
| `{{type}}` | `baptism` |
| `{{recipient_name}}` | `Nolan Holt` |
| `{{recipient_name_greek}}` | `Νολάνος` *(family/parish decision at render time; see §5.3)* |
| `{{date_iso}}` | `2026-06-19` |
| `{{date_long}}` | `on this nineteenth day of June in the year of our Lord two thousand and twenty-six` |
| `{{commemoration}}` | `the feast of the Holy Apostle Jude (Thaddeus), Brother of Our Lord` |
| `{{family_name}}` | `Holt` |
| `{{pronoun_subj}}` | `he` |
| `{{pronoun_obj}}` | `him` |
| `{{parish}}` | `[Parish Name]` *(placeholder)* |
| `{{officiating_priest}}` | `Father [Officiating Priest]` *(placeholder)* |
| `{{godparent}}` | `[Godparent Name]` *(placeholder)* |
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
│        CERTIFICATE  OF  HOLY  BAPTISM                        │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│                    NOLAN  HOLT                               │
│                                                              │
│       has put on Christ in the waters of holy baptism        │
│                                                              │
│                                                              │
│      Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ Νολάνος                    │
│      εἰς τὸ ὄνομα τοῦ Πατρὸς, καὶ τοῦ Υἱοῦ,                  │
│          καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.                      │
│                                                              │
│       The servant of God Nolan is baptized                   │
│       in the name of the Father, and of the Son,             │
│       and of the Holy Spirit. Amen.                          │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│         On this nineteenth day of June in the year           │
│         of our Lord two thousand and twenty-six,             │
│         the feast of the Holy Apostle Jude (Thaddeus),       │
│                  Brother of Our Lord,                        │
│                                                              │
│         Nolan was buried with Christ in the waters of        │
│         holy baptism and raised with him to newness of       │
│         life. Three times the priest immersed him in the     │
│         name of the Father, and of the Son, and of the       │
│         Holy Spirit. He went down a child of the             │
│         household of Holt; he came up clothed in Christ.     │
│         This is what the Church has done from the            │
│         beginning. This morning she has done it again.       │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│       "For as many of you as were baptized into Christ       │
│                   have put on Christ."                       │
│                      — Galatians 3:27                        │
│                                                              │
│              · · · ─── ☩ ─── · · ·                           │
│                                                              │
│       BAPTIZED AT       [Parish Name]                        │
│                                                              │
│       BY                Father [Officiating Priest]          │
│                                                              │
│       GODPARENT         [Godparent Name]                     │
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

(The Unicode ☧ and ☩ glyphs above are stand-ins for the SVG ornaments specified in §9; rendered on the actual certificate as vector paths in `#C9A84C`. The footrests of the four corner ☩ crosses run upper-LEFT to lower-RIGHT from the viewer's perspective per §9.2.)

### 14.3 Voice-register verification (for the body framing block)

Per OQ-4 ruling, the 113-word body framing draft was approved as-is. Anti-pattern + voice-anchor check repeated for the worked example:

- ✓ "buried with Christ ... raised with him to newness of life" — Romans 6:4 paraphrase; scripturally weighty without citation-academic register
- ✓ "Three times the priest immersed him" — concrete present-tense narration of what actually happened; not "the rite of baptism was administered"
- ✓ "He went down a child of the household of Holt; he came up clothed in Christ" — image diptych mirroring the immersion; family name grounds it civically without sentimentalizing; "clothed in Christ" creates internal rhyme with Galatians 3:27 quoted below
- ✓ "This is what the Church has done from the beginning. This morning she has done it again." — flat-historical-present, canonical Orthodox feminine ecclesiology; closes with weight not flourish
- ✓ No "Today is the most special day"
- ✓ No "May God bless you abundantly"
- ✓ No exclamation points
- ✓ No "Congratulations!" / "Welcome to the family of God!"
- ✓ No Father Stephen Freeman anchor named anywhere on the certificate; the register is internal-only

### 14.4 Production verification

When Chat 24 renders this certificate at the spec values:

- The polytonic Greek diacritics on the baptismal formula and *Δόξα τῷ Θεῷ* should render cleanly via GFS Neohellenic — rough breathing on the iota of Υἱοῦ visible, circumflex over ου diphthongs shaped correctly, grave accents (varia) on Πατρὸς, καὶ visible
- The chi-rho monogram in gold sits as the visual anchor of the top zone
- The four corner three-bar crosses frame the page with viewer's-right end of each footrest LOWER (per §9.2 corrected guidance)
- The recipient name *NOLAN HOLT* in Cinzel 700 36 pt is the largest text on the page
- The baptismal formula and the body framing paragraph together carry the page's theological weight; the formula names what was done in Greek, the body framing names what was done in English
- The Galatians 3:27 verse closes the doctrinal arc
- The closing doxology *Δόξα τῷ Θεῷ / Glory to God for all things* signs off the artifact in the project's canonical voice — identical to D6

If any of the above renders ambiguously, Chat 24 returns to the spec for clarification before deploying.

---

## 15. ENGINEERING HANDOFF FOR CHAT 22 + CHAT 24

### 15.1 What Chat 24 consumes from this spec

The complete inventory Chat 24 implements from this document:

1. The `certificate.html` template fragment for `type=baptism` per §4.3 vertical hierarchy and §12.4 template-switch logic (shared infrastructure from Chat 22 / D6 §15.1)
2. The Greek polytonic baptismal formula per §6.1 (copy verbatim from this spec — do not retype)
3. The scripture verse and citation per §7.1 (copy verbatim)
4. The body framing prose per §14.1 (copy verbatim — interpolate template variables; do not paraphrase)
5. The recipient clause text per §8 (*"has put on Christ in the waters of holy baptism"*)
6. The title text per §8 + PB-5 ruling (*"CERTIFICATE OF HOLY BAPTISM"*)
7. The personalization labels per §5.4 + §14.2 (*"BAPTIZED AT"*, *"BY"*, *"GODPARENT"*)
8. The new template variables per §5.1: `{{type}}`, `{{recipient_name_greek}}`, `{{family_name}}`, `{{pronoun_subj}}`, `{{pronoun_obj}}`, `{{godparent}}`
9. The URL parameter parsing extension per §12.3
10. The template-switch dispatch logic per §12.4
11. The filename convention per §12.5
12. The line-height delta (1.4 for three-line Greek block) per §6.3 / §8

### 15.2 GFS Neohellenic font landing — PREREQUISITE (cites D6 §15.2)

**This is Chat 22's work, not Chat 24's, and is the prerequisite for D6 + D7 both.**

Per D6 §15.2 — Chat 22 lands the GFS Neohellenic Regular woff2 at `/assets/fonts/GFSNeohellenic-Regular.woff2`, adds the `@font-face` declaration per D1 §11.5 spec with `unicode-range: U+0370-03FF, U+1F00-1FFF`, updates `--font-body` declaration to `'Crimson Text', 'GFS Neohellenic', serif`, adds the woff2 path to `sw.js` STATIC_ASSETS, and bumps the sw.js cache version.

D7 inherits this work fully. If Chat 22 fires before Chat 24, the font is landed and Chat 24 needs no font work. If Chat 22 and Chat 24 fire concurrently (combined cert pipeline), the font landing happens once in the combined dispatch.

### 15.3 admin.html action integration shape

Chat 22 (per D6 §15.3) and Chat 24 (D7-specific) collectively extend admin.html:

- **Existing section** *"Certificate Generation"* (Chat 22 / D6) gets a TYPE SELECTOR at the top:
  - Radio buttons or dropdown: *Baptism* | *Chrismation* | *Both (joined rite)*
- **Form fields** (extended from D6 §15.3):
  - `recipient` — dropdown of explorers
  - `date` — date picker
  - `parish` — text input
  - `officiating priest` — text input
  - `sponsor / godparent` — text input (label adjusts based on type selector; "godparent" if baptism or both, "sponsor" if chrismation only)
  - `father` — text input, default *Kevin Holt*
  - `mother` — text input, default *Danyelle Holt*
  - **NEW for D7:**
    - `family name` — text input, default *Holt*
    - `subject pronoun` — dropdown (*he* / *she* / *they*) — default editable, **NOT hard-coded to "he"** per orchestrator OQ-4 ruling
    - `object pronoun` — dropdown (*him* / *her* / *them*) — paired with subject pronoun
    - `recipient name (Greek)` — text input, optional; falls through to `recipient` (English) if blank; family/parish decision
- **Submit behavior:**
  - *Baptism* selected → opens `certificate.html?type=baptism&...` in new tab
  - *Chrismation* selected → opens `certificate.html?type=chrismation&...` in new tab
  - *Both* selected → opens TWO new tabs, one for each — so Kevin can save both PDFs in one workflow

### 15.4 QC verification steps for Chat 24 before declaring complete

Extends D6 §15.4:

1. Render the worked example (Nolan, 2026-06-19, placeholders for parish/priest/godparent) on screen
2. Verify polytonic Greek diacritics render correctly — particularly rough breathing on iota of Υἱοῦ, grave accents on Πατρὸς and the καὶ before τοῦ, circumflexes on ου diphthongs
3. Use browser "Print → Save as PDF"; open the resulting PDF on a clean system without local Greek font; confirm the Greek still renders correctly (font embedding works)
4. Verify the gold ornament colors print correctly (not stripped to black) — `print-color-adjust: exact` honored
5. Verify the page fits on a single US Letter sheet without splitting — particular attention to zone 5's expanded body framing block + zone 4's three-line Greek formula compounding vertical space
6. Verify the four corner three-bar crosses have correctly-oriented slanted footrests: **viewer's-right end LOWER**, viewer's-left end raised (per §9.2 corrected guidance)
7. Verify file size is under 2 MB
8. Verify the type-switch logic: open `?type=baptism` and `?type=chrismation` URLs back-to-back and confirm the two certs render with the correct title, clause, formula, scripture, and body framing
9. Verify pronoun substitution: render with `pronoun_subj=she&pronoun_obj=her` and confirm the body framing prose reads correctly ("She went down a child of the household of Holt; she came up clothed in Christ. ... Three times the priest immersed her...")

### 15.5 Open items Chat 24 surfaces at its own Phase 1

- Confirm sw.js current cache version (for the bump, if Chat 22's font landing has not already happened)
- Confirm whether the parchment texture PNG asset exists (per D6 §15.5)
- Confirm whether the date/commemoration lookup is Supabase live or pre-baked client-side (per D6 §15.5)
- D7-specific: confirm whether `pronoun_subj` / `pronoun_obj` should be a single combined enum (he/him, she/her, they/them) or two independent fields. Spec defaults to two independent fields for flexibility; Chat 24 may collapse if simpler.

---

## 16. OPEN ITEMS / FOLLOWUPS

### 16.1 Resolved in this spec (record)

- **OQ-1 through OQ-4:** ruled by orchestrator at Phase 1 pause; all rulings honored in Phase 2 authoring per the green-light document
- **PB-1:** footrest orientation corrected to canonical (TL→BR from viewer; viewer's-right lower); favicon.svg cited as canonical production reference; errata note logged for post-launch correction of D3 §2.2 and D6 §9.2
- **PB-2:** Apostle Jude appears as text only in the date block per D6 §3.4 pattern; saint-card surface deferred to C5-jude / post-launch v1.x
- **PB-3:** D7 designation correct (Designer dispatch); D6's reference to "C2" logged for cosmetic doc-maintenance pass
- **PB-4:** Greek-form recipient name inside the formula is a family/parish decision at render time; worked example uses Νολάνος as structural placeholder
- **PB-5:** title reads CERTIFICATE OF HOLY BAPTISM; canonical Orthodox naming-convention asymmetry with D6's CHRISMATION flagged in §0 EXEC
- **PB-6:** body framing expansion is a deliberate structural divergence from D6, documented in §0 EXEC and §4.3 with asymmetric-rite reasoning

### 16.2 Deferred to follow-up dispatches

- **Chrismation certificate (D6):** already shipped May 14, 2026; D7 is the sibling spec from a joined rite, not a successor
- **Wedding certificate, etc.:** future Orthodox milestones the family may want printable artifacts for; out of v1 scope; the D6 + D7 pattern extends straightforwardly with the appropriate formula and scripture per rite
- **Apostle Jude saint card** (post-launch v1.x via C5-jude content authoring): when Jude's saint card surfaces in the app's saint-card system, it does NOT migrate onto the certificate body; the certificate witnesses the rite, not the calendar
- **Field Journal entries paired with the baptism day:** the paired Theo + Christopher Field Journal entries (per D1 §5.4) are a distinct content-authoring task; not part of D7. The certificate and the Field Journal entries are two different artifacts that together witness the day.
- **Post-launch doc-maintenance:** corrections to D3 §2.2 #2 and D6 §9.2 footrest-orientation phrasing (per PB-1 errata note); update of D6 §1 SCOPE and §16.2 OPEN ITEMS to reference "D7" rather than "C2" (per PB-3). Both logged for the post-launch repo-audit chat. Not blocking — production renders correctly today.

### 16.3 Items Chat 24 surfaces at its own Phase 1 discovery

Per §15.5:

- Current sw.js cache version (if Chat 22's font landing has not preceded)
- Parchment texture asset existence (or fallback)
- Date/commemoration lookup approach (Supabase live vs pre-baked)
- Pronoun field structure (combined enum vs independent inputs)

These are engineering decisions appropriate to Chat 24's Phase 1, not designer concerns.

---

☦ Glory to God for all things.
