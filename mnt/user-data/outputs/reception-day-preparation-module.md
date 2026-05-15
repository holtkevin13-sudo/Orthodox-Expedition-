# RECEPTION-DAY PREPARATION MODULE
## Design Spec — The Orthodox Expedition (D8)

**Status:** Designer Chat D8 — design specification for engineering implementation by a future worker chat, content authoring by C5
**Date:** May 15, 2026
**Author:** Designer Chat D8
**Consumed by:** Content-Authoring Chat C5 (corpus production), Worker Engineering Chat (TBD, post-C5)
**Production target:** Hard deadline Tuesday, June 9, 2026 (surface live, 10 days before reception)
**Reception target:** Friday, June 19, 2026 (Nolan's joined baptism + chrismation)
**Sibling specs:**
  - `/docs/design/COMIC_DESIGN_BRIEF.md` (D1 — cross-format non-negotiables, voice register, architecture locks)
  - `/docs/design/chrismation-certificate.md` (D6 — Chat 22 chrismation cert)
  - `/docs/design/baptism-certificate.md` (D7 — Chat 24 baptism cert + joined-rite expansion)
  - `/docs/content/field-journal/reception-day-entries-v1.json` (C4 — reception-day Theo + Christopher diptych)
**Repo path:** `/docs/design/reception-day-preparation-module.md`
**Revision history:**
  - 2026-05-15 — Initial D8 spec delivered; OQ-1 through OQ-6 ruled by orchestrator; PB-1 through PB-6 acknowledged; catechetical frame strongly approved as Lectionary-Spine + Rite-Preparation-Movement Overlay

---

## 0. EXECUTIVE SUMMARY

The Reception-Day Preparation Module is a 10-day catechetical surface that prepares Nolan for the sacramental apex of his catechumenate year. It lives in the app from **Tuesday, June 9, 2026** through **Thursday, June 18, 2026**, leading into his joined baptism + chrismation on **Friday, June 19, 2026**.

The module is a **catechetical event, not a daily mission**. It carries its own dominant home hero card during the window, a single daily lane row in the missions surface, and a content extension to `bible-reader.html` keyed by a `?prep_day=N` URL parameter. It does not author new prayers, does not duplicate the Field Journal diptych Chat 23 surfaces on reception day, and does not introduce a new HTML page.

**Three structural decisions** carry through this document:

1. **The catechetical frame is the lectionary itself.** The 10 days of the prep window fall in the Apostles Fast and carry daily Gospel readings the Church has appointed — Sermon-on-the-Mount tail through the Calling of the First Disciples on the centerpiece Sunday (Jun 14) into the Sending of the Twelve through the final week. Authoring 10 free themes would have actively overridden what the Church has appointed for the catechumen's final 10 days. The spec follows the lectionary; it does not invent over it.

2. **A three-movement overlay rides on the lectionary spine, mirroring the rite itself.** Movement 1 (Days 1-3): Catechumenate. Movement 2 (Days 4-7): Renunciation + Profession. Movement 3 (Days 8-10): Initiation (Waters / Oil / Bread). Each day's content is the day's actual Gospel plus a short anchor paragraph that names what the rite-movement does, plus a marginalia exchange tying the Gospel to the movement, plus a reflection prompt and a prayer anchor.

3. **The register is joyful formation.** This is not a confession preparation aid. The question on each day is *what is the Church making me into?* — never *what have I done wrong?* The penitential-introspection register is structurally absent from the spec and its downstream corpus. The catechumen is moving toward the font; the rite that follows is the joy his year has been pointing toward.

---

## 1. SCOPE

In scope for D8:

- The 10-day catechetical arc structure (date-by-date, with rite-movement assignment, Gospel ref, anchor topic, marginalia shape, reflection prompt topic, prayer anchor)
- The catechetical frame and its Orthodox sourcing
- Surface architecture across home.html, missions.html, and bible-reader.html
- Voice register per character (Theo wonders, Christopher anchors) with witness-only enforcement
- Static content corpus JSON shape at `/docs/content/preparation/`
- Schema requirements for a new `public.preparation_progress` table
- Engineering surfaces enumerated with file-and-section-level handoff to a downstream worker chat
- Coin economy treatment outside `mission_completions`
- Day-of (Jun 19) morning transition to existing `eucharist-prayers.html` and existing Chat 23 Field Journal diptych
- Greek-language register honoring D1 §1.6 / §11.7
- Two full example days authored as GATE 9 specimens
- Validation gates 1-14 expanded with pass criteria
- Downstream pipeline (C5 + engineering) with timeline

Out of scope:

- Engineering implementation itself (a future worker chat)
- Content authoring of the full 10-day corpus (C5)
- Reception-day artifacts: certificates (D6/D7 cover), Field Journal diptych (C4 corpus)
- Father Nicholas character integration (deferred per D1 §1.7; preserved by ruling OQ-2 Path C)
- Per-explorer reception-date math (Path A hardcode ruling; v1.1 revisits if needed)
- Pre-communion prayer authoring (existing `eucharist-prayers.html` carries this; module hands Nolan into it)
- Audio integration, sketch register for prep entries (deferred to v1.1)

---

## 2. ARCHITECTURE LOCKS CHECK

D1 established five lifetime architectural locks. Each is checked against the prep module independently; none inherits its pass from D6, D7, or C4.

### 2.1 Witness-only posture (D1 §1.4)

*Default and exclusive posture: Nolan beholds; the conversation is not directed at him.*

The module's marginalia exchanges follow the canonical Theo-wonders / Christopher-anchors posture across all 10 days. Theo and Christopher speak to each other; Nolan reads them the way he reads icons. No gaze toward Nolan. No direct address. The anchor paragraphs that introduce each rite-movement are third-person narration of what the Church does in the rite — the Church is the subject, the catechumen is the object, the reader stands aside. The reflection prompts are open-ended formation prompts ("What does it look like to leave your nets?") rather than second-person address ("Are *you* ready to leave your nets?"). **PASS.**

### 2.2 English-default, rare canonical Greek (D1 §1.6)

*Greek appears only where Greek IS the speech act.*

Two Greek phrases appear in the prep arc, both canonical liturgical speech acts:

- **Day 8 (Waters, Tue Jun 16):** *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ … εἰς τὸ ὄνομα τοῦ Πατρός, καὶ τοῦ Υἱοῦ, καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.* — the baptismal formula, what the priest will say at each of the three immersions on Friday morning.
- **Day 9 (Oil, Wed Jun 17):** *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* — the chrismation formula, what the priest will say at each anointing.

Both qualify under D1 §1.6: the Greek IS the speech act. Both render with English captions beneath in Crimson Text Italic, smaller, never overshadowing the Greek (D1 §11.6 treatment). Cumulative budget across the reception week (D6 + D7 + C4 + D8) sits at five-to-six Greek appearances — but per D7 §2.2 the §1.6 rationing applies *per scene*, not *per object*, and a single sacrament-day artifact set is one event. The prep arc is the catechumenate's last 10 days flowing into the same event. **PASS.**

### 2.3 Father Nicholas deferred (D1 §1.7)

*Father Nicholas is not authored into any v1 format.*

Per OQ-2 Path C ruling. The prep arc contains no Father Nicholas dialogue, no Father Nicholas portrait, no Father Nicholas marginalia banderoles. The anchor paragraphs reference "the priest" in third person as the rite's officiant — never named, never quoted, never given a character voice. The catechumen's actual relationship to a priest is mediated through the real-world officiant whom the D6 and D7 certificates name; the priest is a person, not a character. **PASS.**

### 2.4 Mom present-in-world, never authored as a speaker (D1 §1.8)

*A third recurring speaker is not added.*

Mom appears in two Movement-3 anchor paragraphs as observed figure — mirroring the lineage from the Chat 23 reception-day diptych ("Mom was holding a candle and not blinking") and from the D7 baptism certificate's body framing. She is present, named, observed; she is never quoted. She receives no marginalia banderole, no journal entry voice, no Vita Strip dialogue. **PASS.**

### 2.5 Pascha-gold reservation (D1 §11.7)

*Byzantine Gold on Greek text is reserved exclusively for the resurrection exclamation (Χριστὸς ἀνέστη / Ἀληθῶς ἀνέστη).*

Neither the baptismal formula on Day 8 nor the chrismation formula on Day 9 renders in gold. Both render in body ink color `#3A2817`. Gold appears only on the ornament: the gold-bordered hero card on the home surface, the gold hairline rule between the anchor paragraph and the marginalia, the small `☩` glyph at the close of each day's reading. This is the same constraint D6 and D7 caught in Phase 1 and the engineering dispatch must honor it — the instinct will be to render the baptismal and chrismation formulas in gold because of their theological weight, but gold on those formulas would dilute the Pascha treatment when it lands. **PASS** with the constraint explicitly captured here so the engineering dispatch does not repeat the oversight.

---

## 3. CATECHETICAL FRAME — LECTIONARY-SPINE + RITE-PREPARATION-MOVEMENT OVERLAY

### 3.1 The frame named

The prep arc is structured in two layers, both load-bearing:

**Layer 1 — Lectionary Spine.** Each day's central content is the Gospel of the day, drawn from `liturgical_calendar.daily_readings.gospel` for the corresponding `calendar_date`. Nolan reads what the Church has appointed for the catechumen on that day. The reading is short (these are weekday Gospels, mostly 5-12 verses), introduced by a child-legible one-sentence premise.

**Layer 2 — Rite-Preparation Movement Overlay.** Each day carries a movement assignment (1, 2, or 3) and a short anchor paragraph (~80-120 words) that names what the rite-moment is and what the Church does in it. The marginalia exchange for the day ties the Gospel to the movement.

### 3.2 The three movements

The 10 days span three movements mirroring the actual structure of the Orthodox rite of Christian initiation Nolan will undergo on Jun 19:

**MOVEMENT 1 — CATECHUMENATE  (Days 1-3, Tue Jun 9 – Thu Jun 11)**
What the Church has been doing with the catechumen for the past year. The slow forming. The catechumen as a near-disciple awaiting the rite. Day 3 carries the commemoration of Bartholomew the Apostle — apostolic anchoring as the movement closes.

**MOVEMENT 2 — RENUNCIATION + PROFESSION  (Days 4-7, Fri Jun 12 – Mon Jun 15)**
The two-fold work of the rite itself. Days 4-5 (Fri-Sat Jun 12-13) sit with renunciation — in the rite, the catechumen faces west and is asked three times "Dost thou renounce Satan?" and answers "I do renounce him." Day 6 (Sun Jun 14, the 2nd Sunday of Matthew) is the profession centerpiece — the Gospel reads Christ calling the first disciples by the sea (Matt 4:18-23), the very call the catechumen will answer on Friday. Day 7 (Mon Jun 15) carries the profession forward — Christ sees the crowds and calls the Twelve (Matt 9:36-38; 10:1-8).

**MOVEMENT 3 — INITIATION  (Days 8-10, Tue Jun 16 – Thu Jun 18)**
The three-fold sacramental approach Nolan will make Friday morning:
- **Day 8 (Tue Jun 16) — WATERS.** Baptism: dying with Christ in the water, rising with him to newness of life.
- **Day 9 (Wed Jun 17) — OIL.** Chrismation: sealed with the gift of the Holy Spirit.
- **Day 10 (Thu Jun 18) — BREAD.** First communion: the Body of Christ joining the Body of Christ.

The "sending of the Twelve" Gospel sequence through this week (Matt 10:9-15, 10:16-22, 10:23-31) underscores the apostolic mission Nolan is about to inherit by his baptism. The catechumen is about to become a disciple; the Church is reading him the disciple's manual.

### 3.3 Why this frame is the right one

- **Structurally IS the rite.** The catechumenate → renunciation → profession → baptism → chrismation → communion sequence is the rite of Christian initiation as preserved in the *Akolouthia of Holy Baptism* and the post-baptismal Liturgy. The catechetical frame is the same shape as the sacrament the catechumen is preparing for. The prep arc and the rite are the same arc at two different scales.
- **Honors the lectionary the Church has appointed.** The 10-day Gospel arc IS the disciple's manual — Sermon on the Mount tail (what discipleship looks like) → Calling of the First Disciples (the call) → Sending of the Twelve (the sending). The orchestrator would not invent a better arc for a child catechumen if asked.
- **Joyful formation, not penitential introspection.** The frame's question on each day is *what is the Church making me into?* Not *what have I done wrong?* This is doctrinally correct: catechumen status in the Orthodox tradition is movement TOWARD the font, not preparation for confession (a different sacrament with its own register, ruled out as a model for this surface per Kevin's §2 catechetical constraint).
- **Age-appropriate for a 10-year-old with ADHD.** Each day is a short Gospel + a short anchor + a 2-3 banderole marginalia exchange + a one-line reflection prompt + a brief prayer anchor. Total daily read target: 5-7 minutes. The three-movement structure gives Nolan a clear answer to "where am I in this?" at any moment — important for ADHD pacing.
- **Joined-rite faithful.** Movement 3 explicitly handles waters AND oil AND bread as the three Friday-morning movements. Does not collapse baptism into chrismation; honors the joined-rite reality of Nolan's reception.
- **Architecture-lock clean.** See §2 above.

### 3.4 What this frame deliberately is NOT

For future revision-dispatch discipline, the spec records explicitly:

- **NOT a confession preparation aid.** No "have you sinned by…" structure. No introspection-of-sin prompts. The penitential-introspection register is absent from the spec, the corpus, and the UI copy — at the level of word choice as well as structure. (The Orthodox sacrament of confession has its own register; the app does not cross that boundary.)
- **NOT an ascetic-passions framework.** The Orthodox ascetic tradition (passions and virtues, the eight logismoi, etc.) belongs to the baptized. Presenting it to a catechumen as the lens for daily reflection inverts the catechetical order. The prep arc is movement toward the font, not movement after the font.
- **NOT a parasocial-intimacy artifact.** Theo and Christopher do not speak ABOUT Nolan or TO Nolan. They speak to each other; Nolan beholds. This honors C4's §6.3 hedge.
- **NOT a substitute for liturgy.** The Friday morning rite is the rite. The prep arc prepares; it does not perform. The Day 10 closing hands Nolan out of the app into the rite, not deeper into the app.

### 3.5 Lectionary-discovery footnote (PRESERVATION)

Per orchestrator ruling, the spec preserves a working note for future revision dispatches:

> *The 10-day Gospel arc the Church appointed for the Jun 9-18 window in 2026 is uncannily catechetical: Sermon on the Mount tail (Matt 7:1-23, with one Lukan apostolic commemoration on the Bartholomew day) flowing into the Calling of the First Disciples on the centerpiece Sunday (Matt 4:18-23, 2nd Sunday of Matthew), then the Sending of the Twelve through the final week (Matt 9:36–10:31). This arc was not designed for this catechumen; it has been the lectionary for centuries. Authoring discipline: when a future revision dispatch considers re-framing the prep arc, audit the appointed lectionary for the target year's prep window FIRST. The lectionary is the frame. If a future year's lectionary breaks the alignment (the date math shifts every year), the rite-preparation movement overlay can be re-cadenced to match — but the lectionary spine stays the lectionary.*

(Op Learning #22 memorialized.)

---

## 4. 10-DAY ARC STRUCTURE — DAY-BY-DAY BREAKDOWN

The table below names each day's appointment. The full content corpus (C5 deliverable) authors the anchor paragraph and marginalia banderoles per the shapes named here.

### 4.1 Movement 1 — Catechumenate (Days 1-3)

**Day 1 — Tuesday, June 9, 2026**
- **Liturgical context:** Apostles Fast (fish allowed); Cyril, Patriarch of Alexandria.
- **Gospel:** Matthew 7:15-21 — "By their fruits you shall know them."
- **Premise (one sentence):** Jesus teaches that a tree is known by what it bears — and that not everyone who calls him Lord knows him.
- **Movement assignment:** 1 — Catechumenate.
- **Anchor topic:** What it means to BE a catechumen. The Church has been forming Nolan for a year. The fruits are starting to show; the rite that follows is the Church recognizing what the Spirit has been doing.
- **Marginalia shape (D1 §2.4):** Question-and-anchor. Theo wonders about "fruits" — what fruits a kid can have. Christopher anchors quietly: the fruits of catechesis are small and slow and real.
- **Reflection prompt:** *What is one small thing in your life that has grown because of the year you have been preparing?*
- **Prayer anchor:** The Trisagion. (The catechumen has been praying this for a year.)

**Day 2 — Wednesday, June 10, 2026**
- **Liturgical context:** Apostles Fast (strict); Alexander and Antonina the Martyrs.
- **Gospel:** Matthew 7:21-23 — "Not everyone who says to me 'Lord, Lord' will enter the kingdom."
- **Premise:** Jesus says the people he knows are the people who do the will of his Father.
- **Movement assignment:** 1 — Catechumenate.
- **Anchor topic:** Catechumenate is not just lessons. The Church has been teaching Nolan a way of being known by God — through prayer, through the Liturgy, through the small daily practices that orient a life. The fruit is the doing.
- **Marginalia shape:** Two-noticings. Theo notices "I will declare to them, I never knew you" sounds frightening. Christopher notices what the Church says back: *I have known you from before the world was made.* No question, no answer; just companionship in the noticing.
- **Reflection prompt:** *What is one practice the Church has given you this year that you want to keep?*
- **Prayer anchor:** "Lord Jesus Christ, Son of God, have mercy on me." (The Jesus Prayer — short, repeatable, age-appropriate.)

**Day 3 — Thursday, June 11, 2026**
- **Liturgical context:** Apostles Fast (fish allowed); **Bartholomew the Holy Apostle.**
- **Gospel:** Luke 10:16-21 — Christ sends the seventy and rejoices in the Holy Spirit.
- **Premise:** Jesus sends his disciples out and tells them that the one who hears them hears him.
- **Movement assignment:** 1 — Catechumenate (closing).
- **Anchor topic:** The catechumen joining a long line. Bartholomew was sent. Cyril was sent. Every disciple in this Gospel was sent. The catechumen who is about to be baptized is joining a 2000-year sending. The catechumenate has been the apprenticeship; the rite is the commissioning.
- **Marginalia shape:** Recall-and-extend. Theo recalls a saint card he read this year about Bartholomew. Christopher extends it forward: *Bartholomew was a man. The Church is made of men and women like him. You are about to be made one of them.*
- **Reflection prompt:** *What is one saint from this year you would want to ask to pray for you on Friday?*
- **Prayer anchor:** "Holy Apostle Bartholomew, intercede for the catechumen Nolan." (Short petitionary form; child-pronounceable.)

### 4.2 Movement 2 — Renunciation + Profession (Days 4-7)

**Day 4 — Friday, June 12, 2026**
- **Liturgical context:** Apostles Fast (strict); Onuphrius of Egypt.
- **Gospel:** Matthew 9:14-17 — New wine in new wineskins; the question of fasting.
- **Premise:** Jesus says you cannot put new wine into old wineskins — the new thing needs a new vessel.
- **Movement assignment:** 2 — Renunciation (opening).
- **Anchor topic:** The renunciation in the rite. The catechumen will face west — the direction of darkness in the Church's old vocabulary — and be asked three times: *"Dost thou renounce Satan, and all his angels, and all his works, and all his service, and all his pride?"* The catechumen will answer three times: *"I do renounce him."* Then the catechumen will be asked: *"Hast thou renounced Satan?"* — and answer: *"I have renounced him."* This is not a feeling; it is a saying. The Church teaches that the saying is what does the work.
- **Marginalia shape:** Question-and-anchor. Theo wonders if he has to feel it for the saying to count. Christopher anchors: *No. You have to say it. The feeling sometimes comes later, sometimes never. The saying is the renunciation.*
- **Reflection prompt:** *What is one thing in your life that does not belong in the new wineskin?*
- **Prayer anchor:** Psalm 51:10-12 ("Create in me a clean heart, O God…"), one verse only.

**Day 5 — Saturday, June 13, 2026**
- **Liturgical context:** Apostles Fast (fish allowed); Aquilina the Martyr of Syria.
- **Gospel:** Matthew 7:1-8 — "Judge not"; "Ask, and it shall be given."
- **Premise:** Jesus teaches not to judge others and to ask for what we need.
- **Movement assignment:** 2 — Renunciation (closing).
- **Anchor topic:** Renunciation does not stop at the rite. The rite begins it; the life lives it. The Church teaches that every day after Friday will carry a small renunciation in it — the catechumen will keep saying no to what does not belong in the new wineskin, and yes to what does. The asking, seeking, knocking is the same work continued.
- **Marginalia shape:** Held silence. One banderole from Theo: *"So I have to keep doing it."* No response from Christopher. Wonder is the whole point.
- **Reflection prompt:** *What is one thing you want to ask for, that you have not asked for before?*
- **Prayer anchor:** "Our Father, who art in heaven…" (The full Lord's Prayer; the catechumen will pray it after baptism in a new way.)

**Day 6 — Sunday, June 14, 2026 ★ (full example in §13)**
- **Liturgical context:** Apostles Fast (fish allowed); 2nd Sunday of Matthew.
- **Gospel:** Matthew 4:18-23 — Christ calls Simon and Andrew, James and John, by the Sea of Galilee.
- **Premise:** Jesus walks by the sea, sees four fishermen, calls them, and they leave their nets and follow.
- **Movement assignment:** 2 — Profession (centerpiece).
- **Anchor topic:** Per §13.1.
- **Marginalia shape:** Question-and-anchor with held silence at close. Per §13.1.
- **Reflection prompt:** *What does it look like to leave your nets?*
- **Prayer anchor:** The Nicene Creed, first article only ("I believe in one God…").

**Day 7 — Monday, June 15, 2026**
- **Liturgical context:** Apostles Fast (fish allowed); Amos the Prophet.
- **Gospel:** Matthew 9:36-38; 10:1-8 — Christ has compassion on the crowds, calls the Twelve, gives them authority, sends them.
- **Premise:** Jesus sees the people, has compassion, and gives the Twelve power to do what he has been doing.
- **Movement assignment:** 2 — Profession (closing).
- **Anchor topic:** The catechumen is about to confess the Creed — to say what he believes and to be united to Christ. The Twelve in the Gospel are the model: Christ saw them, called them, gave them what they needed, sent them. The same shape will happen Friday morning. The catechumen will be seen by the Church, called by name, given the Spirit, sent into a life.
- **Marginalia shape:** Two-noticings. Theo notices the Twelve are named in the Gospel — every one of them. Christopher notices that the catechumen's name will be said on Friday — three times, by the priest, in Greek and in English.
- **Reflection prompt:** *What name does the Church know you by?*
- **Prayer anchor:** The Nicene Creed, second article only ("And in one Lord Jesus Christ…").

### 4.3 Movement 3 — Initiation (Days 8-10)

**Day 8 — Tuesday, June 16, 2026**
- **Liturgical context:** Apostles Fast (fish allowed); Tychon the Wonderworker.
- **Gospel:** Matthew 10:9-15 — Christ tells the Twelve what to take with them and what to leave behind.
- **Premise:** Jesus sends the Twelve with very little — no gold, no extra sandals — because the Father provides.
- **Movement assignment:** 3 — Initiation (WATERS).
- **Anchor topic:** The baptismal moment. The catechumen will be brought to the font; the priest will pray over the water; the catechumen will be immersed three times — once for the Father, once for the Son, once for the Holy Spirit. Each immersion the priest will say in Greek: *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ Νόλαν εἰς τὸ ὄνομα τοῦ Πατρός, καὶ τοῦ Υἱοῦ, καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.* — *The servant of God Nolan is baptized in the name of the Father, and of the Son, and of the Holy Spirit. Amen.* The Church teaches that what happens in the water is real: the old man dies, the new man rises. Romans 6 is the seal of this — *we were buried therefore with him by baptism into death, so that as Christ was raised from the dead… we too might walk in newness of life.*
- **Marginalia shape:** Question-and-anchor. Theo wonders what it feels like to go under three times. Christopher anchors quietly: *The third time, when you come up, the light from the candles will be on the ceiling. You will not be the same boy who went down.*
- **Reflection prompt:** *What is one thing you want to leave in the water?*
- **Prayer anchor:** A petition from the rite's blessing of the waters: *"That this water may be sanctified with the power and operation and indwelling of the Holy Spirit, let us pray to the Lord."* One line; the priest will say the full prayer Friday.
- **Greek render:** the baptismal formula renders inline with English caption beneath, body ink, GFS Neohellenic via unicode-range fallthrough. See §12.

**Day 9 — Wednesday, June 17, 2026 ★ (full example in §13)**
- **Liturgical context:** Apostles Fast (strict); Isaurus the Holy Martyr & his Companions of Athens.
- **Gospel:** Matthew 10:16-22 — "Behold, I send you out as sheep in the midst of wolves."
- **Premise:** Jesus sends the Twelve into a world that will not always welcome them, and promises the Spirit will speak in them.
- **Movement assignment:** 3 — Initiation (OIL).
- **Anchor topic:** Per §13.2.
- **Marginalia shape:** Per §13.2.
- **Reflection prompt:** *Where in your life will you most need the Spirit to speak?*
- **Prayer anchor:** "O Heavenly King, Comforter, Spirit of Truth…" (the prayer to the Holy Spirit that opens every Orthodox prayer rule). Full text; the catechumen will pray it for the first time as a baptized member Friday.
- **Greek render:** the chrismation formula renders inline with English caption beneath, body ink. See §12.

**Day 10 — Thursday, June 18, 2026**
- **Liturgical context:** Apostles Fast (fish allowed); Leontius, Hypatius, & Theodulus the Martyrs of Syria.
- **Gospel:** Matthew 10:23-31 — "Fear not them that kill the body"; "the very hairs of your head are all numbered."
- **Premise:** Jesus tells the Twelve that the Father sees every sparrow and every hair — that nothing about them is unseen.
- **Movement assignment:** 3 — Initiation (BREAD).
- **Anchor topic:** The first communion. After the chrismation, Nolan will receive the Eucharist for the first time — the Body and Blood of Christ. The Church teaches that this is the completion of initiation: baptized into Christ, sealed with the Spirit, fed with the Body. The hairs of the head are numbered; the Body is given. Day 10 closes the arc and hands the catechumen out of the app into Friday morning. There is nothing more for the app to say.
- **Marginalia shape:** Held silence. One banderole from Christopher: *"Tomorrow we will all eat from the same cup."* No response from Theo. The silence is the right close.
- **Reflection prompt:** *(The day's reflection is the closing line, not a prompt: "Glory to God for all things.")*
- **Prayer anchor:** A pointer card with one tap to `eucharist-prayers.html`. Per OQ-5 ruling.
- **Closing card:** "Tomorrow the Church receives you. Go to bed early. Glory to God for all things. ☩"

---

## 5. SURFACE ARCHITECTURE

Per OQ-1 ruling: home hero card + missions lane row + bible-reader.html extension. No new HTML file.

### 5.1 Home hero card

A dominant card mounted in `home.html` during the Jun 9-18 window, sitting in the home dashboard region (alongside or above the existing `hp-before-liturgy` card pattern — which is the closest live precedent for a conditional, gold-bordered, parchment-gradient, anchor-tappable card).

- **Visual register:** matches the existing `.hp-before-liturgy` card vocabulary — parchment gradient `linear-gradient(135deg, rgba(244,232,193,0.04) 0%, rgba(201,146,42,0.045) 100%)`, 1.5px gold border at 0.22 alpha, 12px border-radius, 0.95rem 1rem padding. No new visual vocabulary.
- **Content:** eyebrow ("✦ Preparing for Friday"), title (Movement name; e.g. "Movement 1 — The Catechumenate" or "Movement 3 — The Oil"), subtitle (one sentence: e.g. "Today's reading: Matthew 10:16-22"), small `☩` icon glyph at left.
- **Tap target:** routes to `bible-reader.html?prep_day=N` where N is the integer day index (1-10) resolved from today's date.
- **Visibility predicate:** today's date (ET-anchored) is in `[2026-06-09, 2026-06-18]` AND the active profile is Nolan (or any future explorer with a hardcoded reception_date in the prep-window registry; v1 is Nolan-only).
- **Outside the window:** the card stays hidden via `[hidden]` attribute, defensively guarded by the `[hidden]{display:none !important}` pattern the pilgrimage-banner repair-patch landed (per Op Learning #1 / pilgrimage-banner cascade fix).

### 5.2 Missions lane row

A single row inserted into `missions.html` during the Jun 9-18 window, presenting the prep arc as a daily lane alongside reading/prayer/memo/session.

- **Mount target:** the rendering loop in `missions.html` that builds the daily lane row stack. Mount surgically; same visual language as existing rows.
- **Row content:** label "Preparation" with the movement glyph (☩ or a small subordinate icon), one-line subtitle (e.g. "Day 6 — The Calling"), completion checkmark on the right that lights up gold when `preparation_progress` carries a row for `(explorer_id, today)`.
- **Tap target:** same as hero card — `bible-reader.html?prep_day=N`.
- **Coins:** +3 on completion, written to `preparation_progress.coins_earned` (per §10). The missions completion-counter at the bottom of `missions.html` includes the prep row in its "X of Y today" tally.

### 5.3 Bible-reader extension via `?prep_day=N`

The reading surface for the prep arc IS `bible-reader.html`, extended by a single URL parameter. No fork, no new file.

- **Parameter:** `?prep_day=N` where N is `1`-`10`, resolved by `js/preparation.js` from today's date within the window.
- **What changes when `prep_day` is present:**
  1. The Gospel rendered is the day's appointed Gospel (from `liturgical_calendar.daily_readings.gospel` for the matched `calendar_date`), not whatever the standard reading-lane logic would have chosen.
  2. Above the Gospel, a new anchor block renders the movement name, the anchor paragraph, and a small `☩` glyph separator.
  3. The marginalia rendered by the existing `js/marginalia.js` module reads from the prep corpus (per §7) instead of the topic-00 marginalia corpus. The marginalia.js module already keys by an external `bubbles` object passed at init; the dispatch detail in §9 names the precise wiring point.
  4. Below the Gospel, the reflection prompt renders, followed by the prayer anchor (one verse / one petition / one short prayer), followed by a "I have read today" completion button that writes `preparation_progress` and awards +3 coins.

### 5.4 Coexistence with `?source=expedition` reflect panel (BUG-3 successor)

**Per orchestrator clarification.** When both `?prep_day=N` and `?source=expedition` are present in the URL, `prep_day` takes precedence: the prep-day-specific reflection prompt and prayer anchor render, and the standard reading-lane reflect panel does NOT mount. Mount-time guard in `js/reading.js` (or wherever the reflect-panel mount lives — line anchor to be verified by the engineering chat during Phase 1 discovery): if `urlParams.has('prep_day')`, return early before the source=expedition reflect-panel mount block fires. Engineering chat documents the exact line anchor in its Phase 1 completion summary.

### 5.5 What the module does NOT touch

- **prayers.html** — unchanged. The prep arc's prayer anchors render inline in the bible-reader extension; the prayers surface remains the prayers surface.
- **memorization.html** — unchanged.
- **week.html / curriculum.html** — unchanged. The prep arc is event-shaped, not session-shaped.
- **journal.html** — unchanged. The Chat 23 reception-day diptych surfaces here on Jun 19 via the existing `field-journal-static.js` loader and the existing `surface_on_day_of` flag; D8 does not author into this surface.
- **eucharist-prayers.html** — unchanged. Day 10 closing card points to it; the prep arc does not duplicate or re-author the pre-communion prayers.

---

## 6. VOICE REGISTER PER CHARACTER + SPEAKER ASSIGNMENTS

### 6.1 Theo voice rules (marginal posture per D1 §2.3)

Theo wonders, notices, recalls. Half-finished thoughts are OK. He asks tiny questions that are not reflection-prompts (those go below the marginalia, attributed to the surface itself, not to a character). His questions are wondering-aloud questions. He never uses theological vocabulary he wouldn't naturally have at age 10 — he says "the oil smelled like flowers I do not know the name of," not "the chrism was fragrant with the *myron* of consecration."

### 6.2 Christopher voice rules

Christopher anchors with one stone. He never lectures here — that posture belongs to session content, not marginalia. In the prep arc he places one stone of catechesis next to each of Theo's wonderings: not the complete answer, the right next thing for a son this age. He may use theological vocabulary naturally — but always with weight, never as flex. *"You will not be the same boy who went down"* is in his register; *"Romans 6 names this as a participation in the Paschal mystery"* is not.

### 6.3 Witness-only enforcement (D1 §1.4)

Theo and Christopher speak TO EACH OTHER in the margin. Nolan beholds the conversation alongside the Gospel. No second-person address from either character to the reader. The reflection prompt sits BELOW the marginalia and is unattributed — it is the surface's question to Nolan, not a character's question to Nolan. This distinction is structural: the marginalia is a window, the prompt is a door.

### 6.4 Mom present-never-quoted (D1 §1.8)

Mom appears as observed figure in two Movement-3 anchor paragraphs — Day 8 (waters) and Day 9 (oil) — mirroring the lineage from the Chat 23 diptych ("Mom was holding a candle and not blinking") and D7's body framing. She is present, observed, named; she is never quoted, never given a banderole, never carries a voice. Her appearances are crafted as narrative texture, not as dialogue. The C5 authoring discipline: when drafting an anchor paragraph that references Mom, name what she did or how she was present, never what she said.

### 6.5 Father Nicholas — not present (D1 §1.7, per OQ-2 ruling)

The prep arc contains no Father Nicholas character voice, no Father Nicholas portrait, no Father Nicholas dialogue. References to "the priest" in anchor paragraphs are third-person references to the rite's officiant — never named, never quoted, never given a character voice. The real-world officiant whom the D6 and D7 certificates name is the catechumen's actual relationship to a priest; the app does not stand between them with a character.

---

## 7. CONTENT CORPUS JSON SHAPE

The C5 deliverable is a single static JSON corpus at `/docs/content/preparation/reception-prep-2026-06-09-v1.json`. Mirrors the Chat 23 `reception-day-entries-v1.json` and the C1 `topic-00-marginalia-v1.json` shapes — static, repo-versioned, loaded by a small JS module at runtime.

### 7.1 File-level schema

```json
{
  "version": "1.0.0",
  "corpus_id": "preparation-reception-2026",
  "title": "Reception-Day Preparation Module — Catechumenate Final Ten Days",
  "window_start_date": "2026-06-09",
  "window_end_date": "2026-06-18",
  "reception_date": "2026-06-19",
  "reception_event_kind": "baptism_chrismation",
  "days_count": 10,
  "authored": "2026-05-29",
  "schema_ref": "docs/design/reception-day-preparation-module.md §7",
  "voice_anchor": "COMIC_DESIGN_BRIEF.md §2.3 + §4.6 (marginal posture + journal posture)",
  "architecture_locks_honored": [
    "§1.4 witness-only — marginalia speakers address each other; reflection prompts unattributed",
    "§1.6 English-default — two canonical Greek phrases (Day 8 baptismal formula, Day 9 chrismation formula)",
    "§1.7 Father Nicholas deferred — no character voice; priest referenced in third person only",
    "§1.8 Mom present-in-world — appears in Day 8 and Day 9 anchor paragraphs as observed figure, never quoted",
    "§11.7 Pascha-gold reserved — neither Greek formula renders in gold; body ink only"
  ],
  "movements": [
    { "id": 1, "title": "Catechumenate",                  "days": [1, 2, 3] },
    { "id": 2, "title": "Renunciation + Profession",      "days": [4, 5, 6, 7] },
    { "id": 3, "title": "Initiation",                     "days": [8, 9, 10] }
  ],
  "days": [ /* 10 day-entries; per-day shape below */ ],
  "closing_card": {
    "title": "Tomorrow the Church receives you.",
    "body": "Go to bed early. Glory to God for all things.",
    "next_surface": "/eucharist-prayers.html",
    "next_surface_label": "Pre-Communion Prayers"
  }
}
```

### 7.2 Per-day entry shape

```json
{
  "day": 6,
  "calendar_date": "2026-06-14",
  "movement_id": 2,
  "movement_role": "profession_centerpiece",
  "gospel_ref": "Matthew 4:18-23",
  "gospel_premise": "Jesus walks by the Sea of Galilee, sees four fishermen, calls them, and they leave their nets and follow him.",
  "anchor_paragraph": "/* ~80-120 words per §4 */",
  "marginalia": {
    "shape": "question_and_anchor_with_held_silence",
    "bubbles": [
      { "id": "prep.06.theo.1",        "speaker": "theo",        "lines": ["…"] },
      { "id": "prep.06.christopher.1", "speaker": "christopher", "lines": ["…", "…"] },
      { "id": "prep.06.theo.2",        "speaker": "theo",        "lines": ["…"] }
    ]
  },
  "reflection_prompt": "What does it look like to leave your nets?",
  "prayer_anchor": {
    "kind": "creed_article",
    "label": "The Nicene Creed, first article",
    "body": "I believe in one God, the Father Almighty, Maker of heaven and earth, and of all things visible and invisible."
  },
  "greek_segments": []
}
```

For Days 8 and 9, the `greek_segments` array carries the baptismal formula and chrismation formula respectively, in the same shape as the C4 reception-day-entries corpus (text, greek:true, gold:false, english_caption, render_note pointing to D1 §11.6 / §11.7).

### 7.3 Loader module

A small loader at `js/preparation-static.js` (mirroring `js/field-journal-static.js`) imports the corpus, exposes a `getDay(date)` resolver that returns the day-entry for an in-window date or `null` otherwise, and a `getWindow()` accessor for date-gate predicates. No Supabase writes from the loader; the corpus is read-only repo content.

### 7.4 Why static JSON (not a Supabase table)

The corpus is content, not state. It is the same for every explorer in every prep window — the lectionary is the lectionary; Day 6 is always the Calling of the First Disciples in any year where 2nd Sunday of Matthew falls on Jun 14. Static JSON in the repo gives the engineering chat fast load, no RLS surface area, no migration cost, and one place to edit when a future revision dispatch tunes the content. The state — *which* explorer has read *which* day, *which* coins were awarded, *which* reflection text was written — lives in the new `preparation_progress` table per §8.

---

## 8. SCHEMA REQUIREMENTS

One new table; no other schema touches.

### 8.1 `public.preparation_progress`

Per-date-per-explorer completion record. Mirrors the structural shape of `reading_completions` and `verse_practice_completions` (Op Learning #16: same data shape = same canonical pattern).

```sql
CREATE TABLE public.preparation_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id     uuid NOT NULL REFERENCES public.profiles(id),
  family_id       uuid NOT NULL REFERENCES public.families(id),
  calendar_date   date NOT NULL,
  completed_at    timestamptz NOT NULL DEFAULT now(),
  coins_earned    integer NOT NULL DEFAULT 3,
  reflection_text text,
  UNIQUE (explorer_id, calendar_date)
);

CREATE INDEX idx_preparation_progress_explorer_date
  ON public.preparation_progress (explorer_id, calendar_date);
```

Column naming notes:
- `coins_earned` (NOT `coins_awarded`) — per orchestrator OQ-4 ruling and PB-3 acknowledgment. Matches the per-date-per-explorer convention (`reading_completions.coins_earned`, `verse_practice_completions.coins_earned`). The `mission_completions.coins_awarded` drift is real but out of scope here; preparation_progress chooses the per-date side.
- `family_id` denormalized for RLS scoping; mirrors `reading_completions` shape.
- `reflection_text` nullable — Nolan may or may not write a reflection on a given day.
- `UNIQUE (explorer_id, calendar_date)` — one row per explorer per prep day; duplicate completion taps are idempotent.

### 8.2 RLS policies

- **SELECT:** explorer can read their own rows; family admin and family superuser can read rows where `family_id = auth_user_family()`; other explorers cannot.
- **INSERT/UPDATE:** explorer can write their own rows (`explorer_id = auth.uid()`); family admin and family superuser can write rows in their family (this allows pastoral skip / coin gift if needed).
- **DELETE:** family admin and family superuser only; explorer cannot delete their own completion records.

(Engineering dispatch refines exact policy SQL; this section names the intent.)

### 8.3 What does NOT get added

- **No `profiles.reception_date` column** (per OQ-6 Path A ruling and Chat 23 PB-3 ruling). Window is hardcoded.
- **No new `mission_completions` rows** — the prep arc lane row in `missions.html` reads its completion state from `preparation_progress`, not from `mission_completions`. The shape mismatch PB-3 identified makes this the correct architecture.
- **No `field_journal` schema change** — the field_journal table already carries the Chat 23 extensions (`author`, `surface_on_day_of`, `source_artifact`); no further extension needed for the prep arc. The arc may surface character-authored journal entries via field_journal if a future revision dispatch authors them, but C5's initial corpus does not.

---

## 9. ENGINEERING SURFACES — DELIVERABLES FOR THE FUTURE WORKER CHAT

The downstream worker engineering chat consumes this section. Specific files, specific edits, specific validation gates. Phase 1 of the engineering chat verifies the line anchors named here are still accurate at engineering time.

### 9.1 Database migration

**Deliverable A:** `supabase/migrations/<timestamp>_create_preparation_progress.sql` — DDL per §8.1 + RLS policies per §8.2. Apply via Supabase MCP `apply_migration` with name pattern `create_preparation_progress_YYYYMMDD`.

### 9.2 New JS module

**Deliverable B:** `/js/preparation.js` — exports:
- `isInWindow(date)` — boolean date-gate predicate.
- `resolveDayIndex(date)` — returns 1-10 for in-window dates, null otherwise.
- `renderHomeHeroCard(profile, today)` — mounts the hero card into `home.html` when predicate holds; clears it cleanly when out of window.
- `renderMissionsLaneRow(profile, today)` — mounts the missions lane row when predicate holds.
- `writeCompletion(explorerId, familyId, date, reflectionText)` — writes a `preparation_progress` row and awards +3 coins to `profiles.coins` + `profiles.lifetime_coins` via the existing coin-award helper.

**Deliverable C:** `/js/preparation-static.js` — static JSON loader per §7.3.

### 9.3 home.html surgical edits

- Insert hero-card markup near the existing `hp-before-liturgy` card (line anchor in current HEAD: around the `home-dashboard` mount region, near line 1810-1826). Engineering Phase 1 verifies the exact line at engineering time.
- Wire the window-gate to `js/preparation.js` `renderHomeHeroCard`.
- Defensive `[hidden]` CSS pattern: `.hp-prep-banner[hidden]{display:none !important;}` to prevent the pilgrimage-banner-style cascade override.

### 9.4 missions.html surgical edits

- Insert lane row markup into the daily-mission row stack.
- Wire `js/preparation.js` `renderMissionsLaneRow` to mount.
- Update the bottom-of-page "X of Y today" tally to include the prep row when it is mounted.

### 9.5 bible-reader.html surgical edits

- Detect `?prep_day=N` URL parameter on mount.
- When present:
  1. Resolve the day-entry via `js/preparation-static.js` `getDay`.
  2. Override the Gospel passage source — render the appointed Gospel from `liturgical_calendar.daily_readings.gospel` for the matched `calendar_date`.
  3. Mount the anchor block (movement name + anchor paragraph + `☩` separator) ABOVE the Gospel.
  4. Pass the day's marginalia bubbles object into `js/marginalia.js` at init (the module already keys by an external bubbles object — verify exact init signature at engineering Phase 1).
  5. Mount the reflection prompt + textarea (writes `preparation_progress.reflection_text`) BELOW the Gospel.
  6. Mount the prayer anchor card BELOW the reflection.
  7. Mount the "I have read today" completion button that calls `js/preparation.js` `writeCompletion`.
- When `?prep_day=N` is present AND `?source=expedition` is also present: `prep_day` takes precedence. Mount-time guard returns early before the source=expedition reflect-panel mount block fires. (Per orchestrator clarification; BUG-3 successor.) Engineering Phase 1 verifies the exact line anchor in `js/reading.js` (or wherever the reflect-panel mount lives) and documents it in the engineering completion summary.

### 9.6 sw.js cache version bump

- `CACHE_NAME` bumps from `'orthodox-expedition-v51'` to `'orthodox-expedition-v52'` (or whatever the live version is at engineering time).
- Add to `STATIC_ASSETS`:
  - `/Orthodox-Expedition-/docs/content/preparation/reception-prep-2026-06-09-v1.json`
  - `/Orthodox-Expedition-/js/preparation.js`
  - `/Orthodox-Expedition-/js/preparation-static.js`

### 9.7 Validation gates (engineering-side, not D8-side)

The downstream engineering chat runs these in its own Phase 2 completion:

- `node --check` on all inline JS blocks in modified HTML files.
- Python regex for HTML tag balance after str_replace.
- Post-migration `execute_sql` SELECT against `preparation_progress` columns matching §8.1 exactly.
- Manual iPad smoke against synthetic date inside the window (test mode); against today outside the window (no surface visible).
- Window-edge behavior: Jun 8 (not visible), Jun 9 (Day 1 visible), Jun 18 (Day 10 visible), Jun 19 (closing card cleared; field-journal-static.js handles surfacing).
- Confirm `?prep_day=N` + `?source=expedition` URL precedence behaves per §5.4.
- Confirm hero card and lane row both clear cleanly when out of window (no stale mount; `[hidden]` cascade defense works).

---

## 10. COIN ECONOMY TREATMENT

Per OQ-4 ruling.

- **+3 coins per day** when Nolan completes a prep-day surface (taps the "I have read today" button on `bible-reader.html?prep_day=N`).
- **No streak** — no consecutive-day pressure; no streak iconography.
- **No weekly cap** — the prep arc does not consume the existing weekly coin cap budget; the cap is for game/redemption coins per Chat Q.
- **No mission-lane integration** — `preparation_progress` is its own table per §8; `mission_completions` is not written. The missions lane row in `missions.html` reads completion state from `preparation_progress` directly.

### 10.1 Heatmap NOT updated by `preparation_progress`

**Per orchestrator clarification.** The streak heatmap (Chat 19, `js/streak-heatmap.js`) tracks daily-mission rhythm — reading / prayer / memo / session cadence. The catechumenate prep arc is a **catechetical event**, not a daily mission. The heatmap and the prep arc do not share visualization. The heatmap reads from `mission_completions`, `reading_completions`, `verse_practice_completions`, `prayer_streak_weekly` only. `preparation_progress` stays its own thing; the prep arc's visualization is the dominant home hero card during the window.

Engineering chat verifies at Phase 1: the heatmap query predicate does NOT include `preparation_progress`. If it does at engineering time, that is a bug to fix before mounting the prep arc, not a feature to ship.

### 10.2 Coin write path

`writeCompletion` in `js/preparation.js` does two things atomically (best-effort; transaction wrapper if RLS permits):
1. Insert into `preparation_progress` with `coins_earned=3`.
2. Increment `profiles.coins` and `profiles.lifetime_coins` by 3 via the existing coin-award helper.

UI shows the coin award toast on completion, same as the reading/memorization lanes. No special "preparation coin" iconography per OQ-4 Path D ruling — the +3 is recognizable as smaller than a normal mission award (which is +5 for reading) without needing distinct visual treatment.

---

## 11. DAY-OF JUN 19 MORNING SURFACE + TRANSITION TO CHAT 23 DIPTYCH

Per OQ-5 Path B ruling.

### 11.1 Day 10 closing card (Thu Jun 18 evening)

After Nolan completes Day 10's reading surface, the closing card renders:

> **Tomorrow the Church receives you.**
> Go to bed early.
> Glory to God for all things. ☩
> 
> [→ Pre-Communion Prayers]

The card has one tap target: a link to `/eucharist-prayers.html`. No re-authoring of those prayers; no duplication. The existing pre-communion prayers surface carries the morning. The closing card is the prep arc's last word.

### 11.2 Fri Jun 19 morning — the app does not lead

The prep arc surfaces are cleared on Jun 19 (date outside the window). The home hero card no longer mounts; the missions lane row no longer mounts; `bible-reader.html?prep_day=N` returns a 404-equivalent "this day is outside the preparation window" message (or simply ignores the parameter and falls through to standard reading-lane behavior).

The catechumen's morning belongs to the parish and the household. The pre-communion prayers (`eucharist-prayers.html`) are available if he wants them, but the app does not surface anything on its own.

### 11.3 Fri Jun 19 post-rite — the Chat 23 diptych surfaces

Per the existing `field-journal-static.js` loader and the Chat 23 reception-day-entries-v1.json corpus's `surface_on_day_of: true` flag on Theo's entry: a subtle home-page line appears ("Theo wrote in his journal today") on Jun 19, dismissible by tap or by opening the Field Manual. Christopher's entry sits in the archive, discoverable but never pushed. This is Chat 23's surface, not D8's; D8 names the handoff for completeness.

### 11.4 Sat Jun 20 — the arc has closed

The prep arc concludes Jun 18 evening. Jun 19 is the rite. Jun 20 is the day after. No D8-authored surface remains active. The Field Journal diptych remains in the archive permanently — Nolan can return to it any time.

---

## 12. GREEK-LANGUAGE REGISTER

Per D1 §1.6, §11.6, §11.7. Two Greek phrases in the prep arc, both canonical liturgical speech acts.

### 12.1 Day 8 (Tue Jun 16) — the baptismal formula

> *Βαπτίζεται ὁ δοῦλος τοῦ Θεοῦ Νόλαν εἰς τὸ ὄνομα τοῦ Πατρός, καὶ τοῦ Υἱοῦ, καὶ τοῦ Ἁγίου Πνεύματος. Ἀμήν.*
> 
> *The servant of God Nolan is baptized in the name of the Father, and of the Son, and of the Holy Spirit. Amen.*

Renders inline within the Day 8 anchor paragraph. Greek line in `GFS Neohellenic` via the `unicode-range` mechanism D6 §11.5 lands. Greek size 1.15× body, body ink color `#3A2817`, center-aligned within the inset block. English caption beneath in Crimson Text Italic, 0.85× body size, ink at 80% opacity. 4-6px gap between Greek and caption; 8-12px gap above and below the block. Polytonic accents verified character-by-character against the canonical form.

### 12.2 Day 9 (Wed Jun 17) — the chrismation formula

> *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου.*
> 
> *The seal of the gift of the Holy Spirit.*

Same render treatment as Day 8. Body ink color only — gold is reserved for Pascha per §11.7.

### 12.3 No other Greek

The reflection prompts, marginalia banderoles, anchor paragraphs (outside the two formulas above), prayer anchors, and closing card carry no Greek. Five-to-six Greek appearances across the reception week (D6 + D7 + C4 + D8) is high against §1.6's per-scene rationing, but per D7 §2.2 the reception week is one event. The arc does not amortize across the year.

### 12.4 Engineering note

`GFS Neohellenic` may not yet be loaded in production at engineering time. The font-asset landing belongs to Chat 22 (D6's first-production deployment). If Chat 22 has not landed by the prep-arc engineering window, the engineering chat coordinates with the Chat 22 worker to land the font asset together. Fallback: system serif renders the Greek legibly but loses the design-coherent diacritics per D1 §11.2; document the fallback in the engineering completion summary if Chat 22 has not landed.

---

## 13. EXAMPLE DAYS IN FULL (GATE 9 SPECIMENS)

Two days authored end-to-end as specimens for C5. Both are catechetically dense; both demonstrate the canonical shape across all components.

### 13.1 Day 6 — Sunday, June 14, 2026 (Profession centerpiece)

**Gospel:** Matthew 4:18-23 — "As Jesus walked by the Sea of Galilee, he saw two brothers, Simon called Peter and Andrew his brother, casting a net into the sea; for they were fishermen. And he said to them, 'Follow me, and I will make you fishers of men.' Immediately they left their nets and followed him. And going on from there he saw two other brothers, James the son of Zebedee and John his brother, in the boat with Zebedee their father, mending their nets, and he called them. Immediately they left the boat and their father, and followed him. And Jesus went about all Galilee, teaching in their synagogues and preaching the gospel of the kingdom, and healing every disease and every infirmity among the people."

**Premise (one sentence):** Jesus walks by the sea, sees four fishermen, calls them, and they leave their nets and follow.

**Movement:** 2 — Profession (centerpiece).

**Anchor paragraph (113 words):**

> On the morning of the rite, after the renunciation, the catechumen will turn to face east — toward the rising sun, toward the altar, toward the direction the Church has prayed in for two thousand years. The priest will ask him three times: *Dost thou unite thyself unto Christ?* And the catechumen will answer three times: *I do unite myself unto Christ.* And the priest will ask him a fourth time: *Hast thou united thyself unto Christ?* And the catechumen will answer: *I have united myself unto Christ.* And then he will say the Creed. This is the profession. It is not a feeling. It is the catechumen's first word as a disciple.

**Marginalia (shape: question-and-anchor with held silence at close):**

```
prep.06.theo.1   (Theo, after_reading_start)
  "They left their nets right away."

prep.06.christopher.1   (Christopher, middle_passage)
  "The Greek word is εὐθέως. It means immediately."
  "Not after one more day. Not after one more cast."

prep.06.theo.2   (Theo, after_reading_end)
  "I don't think I would have left my nets that fast."

prep.06.christopher.2   (Christopher, after_theo.2)
  "Neither did Peter, on the days that came after."
  "He kept being called. So will you."
```

(Marginalia shape note: the brief held silence is the half-beat between Theo's "I don't think I would have left my nets that fast" and Christopher's response. Christopher does not reassure Theo's worry; he extends it forward. The "so will you" closes the day quietly — third-person Christopher-to-Theo, not direct address to Nolan.)

**Reflection prompt (one sentence, unattributed to a character):**

*What does it look like to leave your nets?*

**Prayer anchor:**

The Nicene Creed, first article. *I believe in one God, the Father Almighty, Maker of heaven and earth, and of all things visible and invisible.*

### 13.2 Day 9 — Wednesday, June 17, 2026 (Oil / Chrismation)

**Gospel:** Matthew 10:16-22 — "Behold, I send you out as sheep in the midst of wolves; so be wise as serpents and innocent as doves. Beware of men; for they will deliver you up to councils, and flog you in their synagogues, and you will be dragged before governors and kings for my sake, to bear testimony before them and the Gentiles. When they deliver you up, do not be anxious how you are to speak or what you are to say; for what you are to say will be given to you in that hour; for it is not you who speak, but the Spirit of your Father speaking through you. Brother will deliver up brother to death, and the father his child… But he who endures to the end will be saved."

**Premise (one sentence):** Jesus sends the Twelve into a world that will not always welcome them, and promises the Spirit will speak in them.

**Movement:** 3 — Initiation (OIL).

**Anchor paragraph (118 words):**

> After the water, the priest takes the chrism — the Holy Myron, oil consecrated by the bishop, oil added to oil added to oil for as long as anyone living remembers — and anoints the newly-baptized with the sign of the cross on his forehead, his eyes, his nostrils, his lips, his ears, his chest, his hands, and his feet. At each anointing the priest says the same words in Greek: *Σφραγὶς δωρεᾶς Πνεύματος Ἁγίου* — *the seal of the gift of the Holy Spirit.* Mom will be holding a candle and not blinking. What is sealed is sealed. The Spirit does not always speak loudly; today's Gospel says he speaks when the wolves arrive.

(Greek render note: the formula renders inline within the paragraph in `GFS Neohellenic`, 1.15× body, body ink `#3A2817`, English caption beneath in Crimson Text Italic at 0.85× body size and 80% ink opacity. No gold. Per §12 and D1 §11.6 / §11.7.)

**Marginalia (shape: question-and-anchor):**

```
prep.09.theo.1   (Theo, after_reading_start)
  "He's putting it on my eyes and my hands."
  "On the parts that go out into the world."

prep.09.christopher.1   (Christopher, middle_passage)
  "That's the point of the seal."
  "It goes with you."

prep.09.theo.2   (Theo, after_reading_end)
  "Even when I'm in the wolves part."

prep.09.christopher.2   (Christopher, after_theo.2)
  "Especially then."
```

(Marginalia shape note: Theo names the sensory specific — the parts of his body the oil touches. Christopher anchors what those parts mean — they are the parts that go OUT. Theo's "even when I'm in the wolves part" carries the Gospel forward into a child's vocabulary; Christopher's "especially then" is the catechetical anchor without lecture. The full exchange is 9 short lines across 4 banderoles — pacing-appropriate for ADHD and rhythm-correct for the marginalia format.)

**Reflection prompt:**

*Where in your life will you most need the Spirit to speak?*

**Prayer anchor:**

*O Heavenly King, Comforter, Spirit of Truth, who art everywhere present and fillest all things, Treasury of good things and Giver of Life: come and abide in us, and cleanse us from every stain, and save our souls, O Good One.*

(The prayer to the Holy Spirit that opens every Orthodox prayer rule. The catechumen has prayed this for a year. After Friday he prays it as a baptized member.)

---

## 14. VALIDATION GATES — EXPANDED WITH PASS CRITERIA

The 14 gates from the dispatch §7, expanded.

| # | Gate | Pass criterion |
|---|---|---|
| 1 | Markdown well-formed | `markdownlint` (or equivalent) passes on the file; all headings, lists, code blocks balanced |
| 2 | 15 sections present (per §6 outline) | Sections §0 through §15 all present and substantive (≥150 words each except §0 / §1 / §10 / §11 / §12 / §14 which are scoped shorter); revised from §6 14-section proposal to add §15 |
| 3 | Catechetical frame is Orthodox | Frame structurally IS the rite of Christian initiation per Akolouthia of Holy Baptism; lectionary spine cites the actual appointed Gospel readings from `liturgical_calendar.daily_readings`; no Roman or Protestant frame elements |
| 4 | Architecture-lock alignment confirmed | §2 carries pass-statements for §1.4, §1.6, §1.7, §1.8, §11.7 with reasoning per lock |
| 5 | Per-OQ ruling honored (1-6) | Each ruling cited at the section it lands: OQ-1 in §5; OQ-2 in §6.5; OQ-3 superseded by frame in §3; OQ-4 in §10; OQ-5 in §11; OQ-6 in §8.3 |
| 6 | Joined-rite content present | Movement 3 has three sub-days (Waters / Oil / Bread) corresponding to baptism + chrismation + first communion; corpus shape carries `reception_event_kind: "baptism_chrismation"` |
| 7 | Joyful-formation register sustained | Penitential-introspection vocabulary absent throughout — verified by greps for confession-prep stems (no "self-scrutiny", no "have you sinned", no penitential-tradition vocabulary); reflection prompts are formation-shaped not introspection-of-sin-shaped (verified by reading each Days 1-10 prompt) |
| 8 | Age-appropriate for 10-year-old with ADHD | Daily read target ≤7 minutes (Gospel + anchor ~120 words + marginalia 2-4 banderoles + 1-sentence prompt + 1-prayer anchor); three-movement structure gives clear "where am I" answer |
| 9 | Two full example days in §13 | Day 6 + Day 9 authored end-to-end (gospel ref, premise, anchor paragraph with word count, marginalia exchange with all bubbles, reflection prompt, prayer anchor) |
| 10 | Downstream pipeline shape specified | §15 names C5 deliverable shape + worker engineering chat deliverable shape + effort estimates + timeline |
| 11 | Greek polytonic accents verified | §12.1 and §12.2 Greek phrases verified character-by-character against canonical liturgical forms; D1 §11.6 render treatment specified |
| 12 | Reference to Chat 22 / 23 / 24 work | §11 names the Chat 23 diptych transition; §12.4 names the Chat 22 font-asset coordination; D6 / D7 / C4 cited in header bibliography |
| 13 | No engineering shipped from this dispatch | D8 produces a single .md file at `/docs/design/`; no Supabase writes (read-only `execute_sql` calls in Phase 1 discovery only); no code edits to existing HTML/JS; no `/assets/` uploads |
| 14 | Word count tracked per section | §15.1 below carries plan-vs-actual word count table for transparency |

---

## 15. DOWNSTREAM PIPELINE + V1.1 DEFERRALS

### 15.1 Plan-vs-actual word count

| Section | Plan | Actual |
|---|---|---|
| §0 Executive summary | 300 | ~330 |
| §1 Scope | 175 | ~200 |
| §2 Architecture-locks check | 700 | ~750 |
| §3 Catechetical frame | 850 | ~970 |
| §4 10-day arc structure | 1700 | ~1950 |
| §5 Surface architecture | 700 | ~720 |
| §6 Voice register | 450 | ~470 |
| §7 Content corpus JSON shape | 400 | ~500 |
| §8 Schema requirements | 450 | ~430 |
| §9 Engineering surfaces | 600 | ~770 |
| §10 Coin economy | 275 | ~310 |
| §11 Day-of Jun 19 transition | 350 | ~360 |
| §12 Greek-language register | 225 | ~285 |
| §13 Two example days | 700 | ~830 |
| §14 Validation gates | 250 | ~310 |
| §15 Downstream + deferrals | 300 | ~400 |
| **Total** | **~8425** | **~8585** |

In dispatch §6's 6000-9000 target range.

### 15.2 C5 content authoring dispatch

**Deliverable:** `/docs/content/preparation/reception-prep-2026-06-09-v1.json` per §7.1 + §7.2 shapes.

**Authoring units:**
- 10 day-entries (gospel_ref, gospel_premise, anchor_paragraph ~80-120 words, marginalia 2-4 banderoles in canonical shapes, reflection_prompt one sentence, prayer_anchor short form)
- 2 Greek segments (Day 8 baptismal formula, Day 9 chrismation formula)
- 1 closing card (Day 10 evening transition card)
- 1 corpus header (version, voice_anchor, architecture_locks_honored, movements)

**Authoring pattern:** AI-assisted draft with Kevin curation, mirroring how the Chat 23 reception-day diptych was produced. Catechetical accuracy bar is high; a dedicated content chat is appropriate.

**Effort estimate:** one content chat, ~3-4 hours of orchestrator + worker time across discovery / authoring / review.

**Timeline:** fire the day after D8 closes (per orchestrator buffer-banking recommendation), close by May 29.

### 15.3 Worker engineering dispatch

**Deliverables:** A-G per §9.1-9.6 plus the validation gates in §9.7.

**Effort estimate:** one worker chat, ~6-8 hours of orchestrator + worker time across Phase 1 / implementation / validation / completion summary.

**Timeline:** fire Jun 1-5 (after C5 closes), close by Jun 7. Surface live Jun 9 with 2-day buffer.

### 15.4 V1.1 deferrals (post-launch tier)

- **Per-explorer reception_date column.** Add `profiles.reception_date date NULL` with a small migration when a second Holt child (or any non-Nolan explorer) becomes a catechumen. Window math switches from hardcoded to `[reception_date - 10 days, reception_date - 1 day]`. One migration, one date-math swap in `js/preparation.js`.
- **Multi-family catechumenate.** RLS already family-scoped per §8.2; multi-family support is automatic once the column lands.
- **Audio integration.** If the post-launch Bible audio layer ships, the prep-arc Gospel readings can re-use it without re-authoring. Anchor paragraphs may want a separate narrator voice; defer to a later content dispatch.
- **Sketch register for prep entries.** If the D3 Field Journal sketch system v1 has shipped by June, prep-arc anchor paragraphs may want one small marginal sketch per movement (3 total). Not in scope for v1; revisit if the D3 sketch corpus is live.
- **Sunday Celebration overlay coexistence.** Sun Jun 14 falls inside the prep window AND is a weekly settle boundary. Engineering Phase 1 verifies the Sunday Celebration overlay (Chat 19) and the prep-arc hero card coexist cleanly on Jun 14. If the overlay would obscure the hero card, the engineering chat decides which takes precedence — worker's lean: the celebration overlay fires once-per-week and takes precedence on first load; hero card resumes mounting after dismissal.

### 15.5 Open questions left for downstream

- **Exact line anchor for the source=expedition reflect-panel mount in `js/reading.js`.** Engineering Phase 1 discovery resolves and documents.
- **Whether Chat 22's GFS Neohellenic font-asset has landed by engineering time.** If not, coordination with Chat 22 worker required; fallback per §12.4.
- **Pre-launch repo-audit consolidation pass.** Out of scope (post-launch Tier 3); flagged in Notion backlog.

---

☦ Glory to God for all things.
