// Orthodox Expedition — Service Worker v51
// v51: Chat 23 — Field Journal v1 engineering (paired-diptych
//      static-JSON corpus + per-author visual register on
//      journal.html). May 14, 2026.
//      🟢 NEW: js/field-journal-static.js — IIFE-wrapped
//          window.FieldJournalStatic module mirroring Chat 20's
//          js/saint-cards.js single-module pattern. Public API:
//          loadCorpus(), getReceptionDayEntries(dateKey),
//          hasReceptionDayDiptych(dateKey). Loads
//          /docs/content/field-journal/reception-day-entries-v1.json
//          (C4 corpus; 78 lines, 9,768 bytes). Fail-soft on every
//          error mode; one console.debug breadcrumb on 404.
//      🟢 NEW: docs/content/field-journal/reception-day-entries-v1.json
//          C4-authored paired diptych for Nolan's 2026-06-19
//          reception day (baptism + chrismation joined rite).
//          Theo + Christopher entries; honors D1 §§1.4, 1.6, 1.7,
//          1.8, 11.7 architecture locks; consumer-only (Chat 23
//          never modifies this file — byte-identical pre/post).
//      🟢 journal.html — diptych render on 2026-06-19 ET.
//          • Scoped-LOCAL @font-face for GFS Neohellenic per
//            Chat 22 CATCH-3 pattern (no global --font-body var).
//            Woff2 already precached since v50; only the
//            @font-face declaration is added in journal.html.
//          • <script src="js/week-utils.js"> tag added — module
//            was already in STATIC_ASSETS but not loaded by
//            journal.html. Used for ET-stable todayKey() gate.
//          • <script src="js/field-journal-static.js"> tag.
//          • Per-author CSS: .fj-entry--theo (Caveat 400,
//            #3A2817 ink-brown) + .fj-entry--christopher
//            (Crimson Text 600, #2A1810 ink-deep) per D1 §10.2
//            spec where loadable + orchestrator OQ-4 ruling E.
//          • .fj-greek inline span CSS hardcodes
//            color:--fj-ink-brown !important — defense-in-depth
//            Pascha-gold reservation per D1 §11.7. Chrismation
//            formula renders in body ink REGARDLESS of any
//            JSON gold:flag drift.
//          • renderReceptionDayDiptych() function: ET-date
//            gate via WeekUtils.todayKey()==='2026-06-19';
//            renders both entries as adjacent prepended items
//            in entries-list per D1 §4.5 date-ordered adjacency
//            + orchestrator OQ-2 ruling D.
//          • renderEntries() end-of-fn hook re-prepends diptych
//            when currentFilter==='all' so filter taps don't
//            wipe the diptych.
//      🟢 Supabase migration:
//          chat_23_field_journal_paired_diptych_extension_20260514
//          ADD COLUMNS author text, surface_on_day_of boolean,
//          source_artifact text — all nullable, no CHECK
//          constraints (per Op Learning #17, validate at
//          application layer for forward-compat). RLS policy
//          explorer_own_journal unchanged. paired_entry_id
//          column INTENTIONALLY omitted per PB-3 ruling A
//          (entries live in JSON; UUID FK would be dead schema).
//      🟢 STATIC_ASSETS additions:
//          '/Orthodox-Expedition-/docs/content/field-journal/'
//            'reception-day-entries-v1.json',
//          '/Orthodox-Expedition-/js/field-journal-static.js',
//      Per orchestrator OQ-1 ruling A: diptych surfaces to ALL
//      explorers on 2026-06-19 ET (canon is witness-only; the
//      canon belongs to every explorer reading on that date).
//      home.html "Theo wrote in his journal today" nudge per
//      D1 §4.5 deferred to future polish dispatch.
//
// Orthodox Expedition — Service Worker v50
// v50: Chat 22 — Chrismation Certificate render pipeline.
//      🟢 NEW: certificate.html — self-contained Byzantine
//          Orthodox certificate render page. US Letter portrait;
//          HTML + CSS + browser print-to-PDF (no JS-PDF library
//          dependency); reads URL params (type/recipient/date/
//          parish/priest/sponsor/father/mother) and renders the
//          chrismation cert per D6 §4-§14 worked example.
//          Forward-compat scaffold for Chat 24's baptism template
//          fragment per D7 §12.4. Polytonic Greek formula +
//          doxology in body ink (#3A2817, NEVER gold per D1
//          §11.7 Pascha reservation). Four-corner three-bar
//          crosses use canonical footrest orientation
//          (rotate(+18) — viewer's-right end LOWER, viewer's-left
//          RAISED per Orthodox iconography); deliberate divergence
//          from favicon.svg's rotate(-18) per Chat 22 CATCH-1
//          ruling B-1. Favicon orientation correction logged for
//          post-launch repo-audit.
//      🟢 NEW: assets/fonts/GFSNeohellenic-Regular.woff2 —
//          first production polytonic Greek face landing per
//          D1 §11.5 spec + D6 §15.2. Self-hosted woff2 (74.9 KB
//          compressed from 432 KB TTF source via fonttools).
//          @font-face declaration scoped LOCAL to certificate.html
//          per CATCH-3 (no --font-body global variable in repo).
//          unicode-range U+0370-03FF + U+1F00-1FFF; Greek
//          codepoints resolve to GFS Neohellenic; Latin glyphs
//          continue to use Crimson Text.
//      🟢 STATIC_ASSETS additions:
//          '/Orthodox-Expedition-/certificate.html',
//          '/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Regular.woff2',
//      🟢 admin.html — new "Certificate Generation" section
//          (between Topic Mastery Control and Data Export); admin+
//          superuser gated (existing role-based pattern); type
//          selector with Chrismation enabled + Baptism/Both
//          disabled until Chat 24 lands the baptism fragment.
//
// Orthodox Expedition — Service Worker v47
// v47: Chat 20-IMPL-B — Reading Reflect Panel migration.
//      🟢 NEW: js/reading-reflect-panel.js — vanilla
//          window.ReadingReflectPanel module that renders the
//          Reading-lane Stage 2 reflect surface (textarea + submit
//          + skip-pastorally modal) directly on bible-reader.html,
//          below the Gospel + marginalia banderoles. Mount-gated on
//          ?source=expedition. Atomic +5 commit via single INSERT
//          into reading_completions (read_at + reflected_at +
//          reflection_text together) with 23505 UPDATE-with-guard
//          fallback for any pre-IMPL-B half-state row. Skip path
//          delegates to ReadingQuest.commitReadCompletion (+3).
//          1.5s gentle hold → redirect to missions.html. Writes
//          activity_log breadcrumbs [reading_atomic]/[reading_skip]
//          for parent-admin parity with session-journal lane.
//      🟢 STATIC_ASSETS additions (cache invalidation reason for
//          the v46 → v47 bump):
//            '/Orthodox-Expedition-/js/reading-reflect-panel.js',
//          Existing reading-quest.js + missions.js + missions.html
//          + bible-reader.html already in STATIC_ASSETS; bump alone
//          flushes their cached copies so the 20-IMPL-B edits ship.
//      🔴 RETIRED: oe_bible_reader_visited_{date} localStorage flag.
//          Pagehide writer in bible-reader.html removed. flagKey /
//          isFlagSet / clearFlag helpers and their callsites in
//          js/reading-quest.js and js/missions.js removed. The
//          reading_completions row in Supabase is now the sole
//          source of truth for Reading-lane state.
//      🟢 js/missions.js — Reading state machine simplified to
//          pending | reflected | pilgrimage. Per OQ-1 ruling A,
//          both the atomic happy-path row (+5) and the
//          skip-pastorally row (+3) close the lane for the day.
//          _renderReadingReadNotReflectedHTML, _wireReadingReflectSubmit,
//          and the mount() inline expand branch all retired.
//      🟢 missions.html — .mh-reading-expand, .mh-reading-stage,
//          and .mh-reading-readpip CSS family retired. Shared
//          .mh-portrait-*, .mh-rri-*, .mh-reading-input-block,
//          .mh-reading-textarea, .mh-reading-submit-btn,
//          .mh-reading-prompt-block, .mh-rrp-text preserved
//          (Session Journal lane still consumes them).
//      🟢 bible-reader.html — additions only outside Chat 18
//          marginalia line ranges (script tag after L25, .brp-*
//          CSS block after the marginalia CSS, mount-target div
//          between .reading-pane close and .reading-foot-nav,
//          inline mount-wire IIFE replacing the retired pagehide
//          flag-writer). js/marginalia.js and topic-00-marginalia-
//          v1.json BYTE-IDENTICAL (Chat 18 invariant preserved).
//
// Orthodox Expedition — Service Worker v44
// v44: Chat 19 — Missions page repair + 5-slot daily counter (B2).
//      🔴 REPAIR: missions.html was structurally corrupted at HEAD
//          (df8910c, 2026-05-12 01:07). Two HTML documents had been
//          concatenated by a GitHub web-UI paste during Chat 16's
//          CSS deploy: lines 1–15 = old head fragment, lines 17–1565
//          = new canonical document, lines 1566–2892 = stale prior
//          clean (5b7de25) content with its first 16 head lines
//          migrated to the top of the file. Documents: 2 DOCTYPE,
//          2 <html>, 2 <head>, 2 <body>, 2 </html>. iPad PWA would
//          not render — file was unparseable as a single document.
//          Forensic match against project memory Op Learning #9
//          ("Manual GitHub UI fragile"). Cache invalidation alone
//          would not have fixed it; file was broken on disk.
//          Fix: reconstruct missions.html = "<!DOCTYPE html>\n" +
//          lines 17–1565 of corrupt file = 1550 lines, single
//          self-contained document. SHA-256 fa7820bc21bf2074…
//          Chat 16's 14× mh-daycomplete CSS preserved intact.
//          All 91 CSS class names preserved. Inline JS (2 blocks,
//          18205 chars) passes node --check. HTML tag balance
//          clean. Line-by-line diff: corrupt[17–1565] == recon[2–1550]
//          byte-for-byte (zero content loss; only the 16 duplicated
//          head lines were shed, all of which already exist in
//          the canonical reconstructed head).
//      🟢 js/missions.js — Chat 19 B2 "auto-complete memo when all
//          other lanes done." Previously: when no weekly_verses row
//          exists for the current week, memState = 'not_applicable'
//          and tally() skipped it from BOTH numerator AND denominator,
//          showing "0/4" on weekdays instead of "0/5." Kevin wants
//          "0/5 ALWAYS on weekdays." Fix:
//            • tally() now counts 'not_applicable' toward totalCount
//              (denominator always — 5/5 visible at all times on
//              weekdays, 4/4 on weekends preserved).
//            • New _memAutoComplete flag: when memState ==
//              'not_applicable' AND every other completable lane
//              (reading, prayer, session-or-reflection) is done,
//              memo auto-credits the numerator. Mirrors the Day
//              Complete unlock-pending check at L567 so the two
//              flip together — display goes 4/5 → 5/5 ✓ at end of
//              day on no-verse weeks.
//            • Day Complete bonus continues firing correctly via
//              the existing L567 short-circuit. Coin economy and
//              idempotency unchanged. No schema work.
//            • Comment block at L576–588 updated to reflect new
//              "denominator-always, numerator-when-others-done"
//              semantics.
//      🟢 js/missions.js — Chat 19 N1 user-facing rename:
//          _renderDayCompleteLane: "Day Complete" → "Today's Devotion"
//          in all 3 variant renders (pilgrimage / paid / locked).
//          Internal state name `day_complete`, lane id `day_complete`,
//          row id `mh-row-day_complete`, CSS class `.mh-daycomplete`,
//          and the `day_complete_bonus` Supabase table all UNCHANGED
//          per orchestrator ruling — only the user-visible title
//          string is renamed. Devotion is the canonical Orthodox term
//          for disciplined daily practice (prayer + reading +
//          reflection + study); matches the catechetical app voice
//          alongside Field Manual / Pilgrimage / Topics / Missions.
//      🟢 STATIC_ASSETS unchanged — missions.html and js/missions.js
//          both already listed. CACHE_NAME bump v43 → v44 alone
//          invalidates the cached copies on Kevin's iPad PWA after
//          a force-quit + reopen.
//      🟢 Chat 18 deliverables byte-identical pre/post (verified):
//          bible-reader.html               027722d4…
//          js/marginalia.js                cacc6b45…
//          docs/content/topic-00-marginalia-v1.json  05384f47…
//
// v43: Chat 18 — Marginalia v1 on reading lane (Topic 00).
//      🟢 NEW: js/marginalia.js — vanilla window.Marginalia module
//          with .mount(container, { sessionId } = {}) and .unmount().
//          Renders a post-passage banderole band (D1 §2.2 canonical
//          layout per Chat 18 Phase 1 ruling) below #versesContainer
//          and above .reading-foot-nav, populated from C1's authored
//          content at docs/content/topic-00-marginalia-v1.json
//          (42 bubbles, 15 sessions: 00.1 → 00.15).
//          Session_id is derived inside marginalia.js by parsing each
//          session's gospel_reference string into {book_code, chapter,
//          vs, ve} and matching against URL params — no upstream
//          edits to missions.js or daily-anchor-card.js (Path A per
//          Phase 1 ruling). Defensive: silent failure on fetch,
//          parse, or session mismatch — the reading lane MUST NOT
//          break if marginalia fails to load.
//          v1 renders 3 placement_hint values (after_reading_start,
//          middle_passage, after_reading_end) in sequence order;
//          before_reading and after_question are deferred (zero
//          content in C1).
//      🟢 bible-reader.html ADDITIVE-ONLY edits (verified by SHA-256
//          strip-and-match against v42 baseline):
//          • CSS block .marginalia-band / .marginalia-row /
//            .marginalia-portrait / .marginalia-bubble-{theo,
//            christopher} added near the existing brm-verse-*
//            (Today's Reading mode) styles. Honors D1 §1.3
//            typography (Theo italic 0.95em / 1px 60%-gold border;
//            Christopher upright 1em / 1.5px 70%-gold border) and
//            D1 §1.5 prefers-reduced-motion compliance.
//          • <div id="marginaliaSlot"> appended as last child of
//            .reading-pane (after #versesContainer, before
//            .reading-foot-nav). Empty slot hidden via
//            .marginalia-slot:empty{display:none;}.
//          • <script src="js/marginalia.js"></script> added in
//            <head> after the Supabase CDN script.
//          • One fire-and-forget Marginalia.mount() call at the
//            end of loadAndRenderChapter(), after
//            applyTodaysReadingMode(). Idempotent: any prior band
//            cleared first; no-match URLs leave the slot empty.
//      🟢 STATIC_ASSETS additions (cache invalidation reason for
//          the v42 → v43 bump):
//            '/Orthodox-Expedition-/js/marginalia.js',
//            '/Orthodox-Expedition-/docs/content/topic-00-marginalia-v1.json',
//          Character portraits theo-portrait.png and christopher-
//          portrait.png are already in STATIC_ASSETS as of v39, so
//          no portrait additions needed.
//      🟢 NO Supabase schema changes. NO upstream edits to
//          missions.js, daily-anchor-card.js, reading-quest.js, or
//          any other module. The session_id derivation is fully
//          contained inside marginalia.js.
//
// Orthodox Expedition — Service Worker v42
// v42: Chat 16 — Missions hub visual polish (Day Complete lane +
//      reading post-read state). HTML/JS architecture unchanged;
//      this bump exists purely to invalidate the iPad PWA cache so
//      missions.html's new CSS lands on the next service-worker
//      activation.
//      🟢 missions.html CSS additions (purely additive; no
//          rules removed or modified):
//          • .mh-daycomplete + .mh-dc-* sub-classes (NEW). Chat
//            2A's Day Complete lane was rendering with markup but
//            zero CSS — the 5th lane was technically present in
//            the DOM but visually unstyled (no card frame, no
//            border, default font hierarchy), which is why the
//            counter felt like 0/4 even though the data layer
//            computes totalCount=5 on weekdays (with verse seeded).
//            Adds locked / paid / unlock-pending / pilgrimage
//            state variants matching Chat 7 parchment+gold dialect.
//          • Reading Stage 2 post-read polish (NEW). Targets:
//            .mh-reading-stage, .mh-reading-readpip + .mh-rrp-*
//            (gospel "✓ read +3" pip), .mh-reading-prompt-block,
//            .mh-rrp-text (question text), .mh-rri-label /
//            .mh-rri-help (textarea label + helper), .mh-reading-
//            textarea visual (border + focus state — layout
//            primitive from v38 SURPRISE #4 preserved), .mh-
//            reading-submit-btn (gold gradient button with
//            disabled state), .mh-reading-saved + sub-classes
//            (Stage 2 done preview). Mirror class hooks added
//            for the T/Th reflection lane (.rl-label, .rl-help,
//            .rl-submit-btn, .rl-textarea focus state) so the
//            same polish carries over without a second pass.
//          • Resolves Kevin's "doesn't look great and is hard to
//            read" report on the post-read state. Strict Chat 2A
//            ITEM E typography sweep (full label/help/button/
//            textarea registry overhaul) remains queued for
//            post-launch; this delivers minimum-viable legibility
//            so launch week reads cleanly.
//      🟢 NO JS changes. NO data-layer changes. The Chat 2A
//          5-lane model (M/W/F: reading, prayer, memo, session,
//          day_complete · T/Th: reading, prayer, memo, reflection,
//          day_complete · Sat/Sun: reading, prayer, memo,
//          day_complete) is unchanged. day_complete_bonus table
//          read/write paths in js/missions.js
//          (_loadDayCompleteToday + _commitDayCompleteBonus) are
//          unchanged; idempotency on the +10 payout via UNIQUE
//          (explorer_id, calendar_date) is preserved.
//      🟢 sw.js STATIC_ASSETS unchanged — missions.html is already
//          cached. This bump is solely for cache invalidation so
//          the new CSS reaches Nolan's iPad on the next launch
//          window. No new file paths added.
//      ⚠ Coordination note: Chat 15 (Sacred Geography Map) bumps
//          v40 → v41 in PARALLEL with this dispatch. At Chat 16's
//          discovery the live CACHE_NAME was still v40 (Chat 15
//          had not yet landed). This output skips v41 and goes
//          v40 → v42; Kevin sequences Chat 15's v41 commit BEFORE
//          this v42 commit so the version history reads v40 →
//          v41 → v42 in chronological order.
//
// v40: Chat 14 — Eucharist Sunday Morning Prayers (text-only).
//      🟢 New page: eucharist-prayers.html — Orthodox pre-
//          communion prayer surface. Four prayers in a single
//          parchment-tinted .prayer-block (Chat 7 dialect):
//          Heavenly King (invocation of the Spirit), St. John
//          Chrysostom's Pre-Communion Confession of Faith, the
//          Communion hymn "Of Thy Mystical Supper", and the
//          short St. John Damascene Approach Prayer. Lean head
//          mirroring games.html (no welcome-flow.css; no module
//          script tags). Bottom nav canonical 5 items with
//          ☦&#xFE0E; on Scriptures.
//      🟢 home.html — Sunday-gated "Before Liturgy" panel
//          surfaces between #hp-liturgical-calendar and
//          #home-dashboard ONLY when WeekUtils.dayOfWeekET()
//          returns 0 (Sun in America/New_York). Markup is
//          statically hidden via [hidden]; a small inline IIFE
//          flips the attr off on Sundays. Defensive fallback:
//          if WeekUtils is absent the panel stays hidden (silent
//          absence — no console warning). .hp-before-liturgy CSS
//          mirrors games.html .game-card structurally (anchor +
//          icon + 2-line info + gold "›"). Purely additive: the
//          SHA-256 of home.html minus the 3 inserted blocks
//          matches the pre-edit hash exactly.
//      🟢 STATIC_ASSETS — adds eucharist-prayers.html so the
//          PWA pre-caches it on first install (offline-safe for
//          Sunday-morning use on Nolan's iPad).
// v39: Chat 13 — Training Grounds (games.html) visual cleanup.
//      🟢 games.html visual lift: replaced lavender-on-purple
//          register with Chat-7 parchment+gold dialect. New
//          page-title block (eyebrow / "Practice the Faith" /
//          subtitle); 17 games reorganized into 7 category
//          panels (.category-block) mirroring Topic 00 panel
//          pattern with ✦ TL/BR corner ornaments. Cards refreshed
//          with parchment tint + gold border + new meta row
//          (⏱ duration · 🎯 difficulty · 🪙 Coins | ⚔ Practice).
//          Responsive grid 1col / 2col / 3col at 600px / 980px
//          breakpoints. Bottom-nav + auth + SW-register script
//          blocks preserved byte-identical.
//      🟢 Bare ☦ glyph fix on apostle-journeys card icon —
//          added U+FE0E text variation selector (☦&#xFE0E;) to
//          prevent iOS color-emoji substitution. Matches pattern
//          from Chat N / Chat O bottom-nav fixes.
//      🟢 STATIC_ASSETS — Chat 12 Sweep 7 finding addressed:
//          adds 18 entries previously loaded by games.html but
//          uncached. games/game-utils.js plus all 17 game .html
//          files (sacrament-match, fasting-rules, creed-builder,
//          saint-seeker, heresy-hunter, feast-calendar, council-
//          timeline, creed-catcher, virtue-passion, feast-or-
//          fast, liturgy-sequence, apostle-journeys, byzantine-
//          blitz, icon-gallery, sacred-words, bible-trivia,
//          church-history). saints-index.json + saints-index-
//          generator.html intentionally EXCLUDED (dev/build
//          artifacts; icon-gallery fetches live data from the
//          orthodox-companion repo).
// v38: Chat 12 — Pre-launch repo audit + 3x launch-critical fixes.
//      🔴 ITEM A — js/prayers.js Prayers.getTodayStatus signature
//          now accepts (sb, profileId) args; closure fallback
//          preserves prayers.html callers. Fixes Day 1 bug where
//          Missions hub showed prayer lane pending even after
//          completion (missions.js was calling with args; old
//          signature ignored them; module's closure was never
//          seeded because missions.html doesn't call Prayers.init).
//      🔴 SURPRISE #1 — missions.html now loads js/reflection-lane.js
//          before missions.js. Reflection lane was silently broken
//          on T/Th sessions because the module exported
//          window.ReflectionLane but no HTML loaded it as a script.
//          window.ReflectionLane was undefined; missions.js's
//          graceful guard at line ~1154 short-circuited. First impact
//          day: Tue May 19 (Day 2 of launch).
//      🔴 ITEM G part A — js/missions.js + progress.html sessions
//          select chains now use canonical .like('id','00.%') filter
//          (matches curriculum.html convention). Excludes 7 legacy
//          0.x rows that collide with canonical 00.x rows on
//          order_index 4-10; Postgres tie-break returns 0.x first
//          on 5 of 7 contested values. Would have surfaced as wrong
//          next-session routing on Mon Jun 8 (launch Week 4).
//          DB-side row deletion deferred to post-launch (3 saint_
//          of_the_week FK refs to repoint).
//      🟠 SURPRISE #4 — missions.html CSS: layout primitives added
//          for .mh-reading-input-block / .rl-input-block (flex
//          column) and .mh-reading-textarea / .rl-textarea
//          (width:100%). Fixes the reading-Stage-2 layout bug
//          Kevin screenshotted (textarea was inline-block default
//          ~200px with inline label baseline-collapsed). Symmetric
//          rl-* fix prevents Tue May 19 reflection-lane from
//          shipping with the same latent bug. Layout-only; visual
//          polish on label/help/button remains queued for post-
//          launch ITEM E (Chat 2A class-naming pass).
//      🟠 STATIC_ASSETS — adds 5 entries that were loaded but not
//          cached: js/session-loader.js, js/calendar-loader.js,
//          js/calendar-card.js, js/name-day-banner.js (all from
//          week.html), and parent-companion.html (linked from
//          js/topic-00-day.js). Fresh-install + offline-tap
//          reliability.
//      Banner-version-drift fix (was v27 banner / v37 CACHE_NAME).
//      Now both at v38.
//      Root-level duplicate deletions (out-of-scope of sw.js cache
//      but noted for audit-trail continuity): pause-card.js root,
//      pause-card.test.js root, prayers.test.js root, session-
//      loader.js root, session-loader.test.js root, js/email-
//      utils.js (orphan twin of root). All zero-production-
//      reference; verified via belt-and-suspenders grep.
// v27: Dispatch 5 — Sunday Celebration Overlay. The canonical weekly
//      reverent moment. When Nolan opens the app on Sunday (or any
//      later day before this week's celebration is dismissed), a
//      full-viewport parchment overlay surfaces last closed week's
//      lane activity (prayer mornings/evenings, reading days,
//      memorization days), the streak counts that held intact, and
//      this week's feast — closing with "Glory to God for all things.
//      — St. John Chrysostom" and a Continue button. New module:
//      js/sunday-celebration.js (shouldShow / loadData / show /
//      dismiss). New schema: celebration_shown_at timestamptz added
//      to weekly_reading_streak + weekly_memorization_streak (mirrors
//      the existing prayer_streak_weekly.celebration_shown_at). One-
//      per-week semantics enforced by the new columns. Mounted as
//      position:fixed inset:0 z-index:9999 overlay on document.body
//      (matches welcome-flow pattern); locks body scroll while open;
//      gentle fade-in + scale animation honoring
//      prefers-reduced-motion. CSS authored in-module via injectCSS
//      (prayer-rollup precedent). Reverent, not gamified — no coin
//      totals, no fanfare; the streak number is the recognition.
//      Multi-week catch-up: most-recent unseen week's celebration
//      surfaces; older unseen weeks silently marked
//      celebration_shown_at=now() on dismiss. Pilgrimage exclusion
//      transitive via existing streak walkers (no new logic). Edge
//      cases: mid-week before any Sunday → no overlay; full-
//      pilgrimage week with 0 days → no overlay; partial-pilgrimage
//      week with activity → celebrate honored lanes.
//      Modified surfaces:
//        • home.html — adds feast-of-week.js + sunday-celebration.js
//          script tags; inserts SundayCelebration.shouldShow → show
//          block between showApp() and PrayerRollup.run.
//        • js/prayer-rollup.js — disables showCelebration() call in
//          step 4 of run() (preserved as commented block + function
//          definition retained for rollback / v1.1 reference).
//          Settlement logic (steps 1-3) intact: coins still bumped,
//          settled_at / coins_awarded still written, celebration_-
//          shown_at still markable via SundayCelebration.dismiss().
//      Untouched: missions.html, Topics page, bottom nav, pilgrimage
//      banner, session-rollup ladder toast (per-milestone, not per-
//      week — coexists fine), session_progress data, admin.html.
//      Op Learning #4 (schema-first), #7 (ET timezone via WeekUtils),
//      #13 (staged present_files), #15 (CSS class names over UA
//      [hidden]), #16 (data shape match — prayer rich row, reading/
//      memo thin row with per-day completions on companion tables)
//      honored throughout.
// v26: Dispatch 4b — Unified IA: Home dashboard + Missions hub +
//      Feast of the Week. Collapses 3 competing daily-action surfaces
//      into ONE clear job each: HOME → status & welcome dashboard;
//      MISSIONS → daily action hub (THE place for daily checklist);
//      TOPICS → study material + Feast of the Week; SCRIPTURES →
//      free reading (Bible reader); FIELD MANUAL → past reflections.
//      Two cards MOVE from home to Missions (Daily tab): daily-anchor-
//      card + reading-quest. Verse tile REMOVED from home. New
//      modules: js/missions.js (daily-hub renderer with state machine
//      for reading mission: pilgrimage / pending / read-not-answered /
//      complete / complete-no-question; session row preserves M/W/F
//      day-rail + catch-up logic from home's renderTodayCard);
//      js/home-dashboard.js (Today's Progress card + state-aware CTA
//      + compact streak row — delegates to Missions.loadTodaysState
//      so home and missions can never drift); js/feast-of-week.js
//      (4-tier priority algorithm: great → major → Sunday → minor;
//      tap-to-expand inline detail; hides on empty weeks). New page
//      journal-mission.html (T/Th reflection — single prompt rotated
//      by (weekOfYear + dayOfWeek) % 6, idempotent save,
//      field_journal category='expedition_log' entry_text='Reflection:
//      ...' + UPSERT coins +5). Surgical missions.html edits replace
//      Daily tab content only (Pause #6 = B); Weekly + Special tabs
//      with parent-verification flow are UNTOUCHED. Bottom-nav
//      rename "Holy Scriptures" → "Scriptures" across 9 surfaces
//      (8 HTML + week.html's JS template literal). 10/10 polish:
//      count-up animation on completedCount delta, 700ms gold-flash
//      micro-celebration on newly-complete rows, all-done celebration
//      line ("Glory to God for all things, Nolan. ☦ See you tomorrow."),
//      state-aware CTA copy on home (pending / done / pilgrimage),
//      portrait fade-in via reading-quest. NO schema changes, NO
//      modifications to lane modules (Prayers, Reading, Memorization,
//      Pilgrimages, ReadingQuest, DailyAnchorCard); all consumed
//      via existing public APIs. Pilgrimage banner DOM duplicated
//      across home + missions (Pause #5 = a). Op Learning #4
//      (schema-first), #7 (ET timezone via WeekUtils), #15 (CSS
//      class names over UA [hidden]), #16 (structural mirror by
//      data shape, not surface concept) honored throughout.
// v25: Dispatch 4a — Memorization Lane Foundation (Lane 5). New
//      schema: weekly_verses (family-scoped content catalog),
//      verse_practice_completions (per-day boolean, mirrors
//      reading_completions), weekly_memorization_streak (Pattern B
//      grace, mirrors weekly_reading_streak). Memorization is
//      structurally analogous to reading (per-day boolean events,
//      one practice tap per day, +5 coins), not prayer (AM/PM
//      duality) — Op Learning #16. New module js/memorization.js
//      exposes getVerseForWeek, getCurrentVerse, didTodayCount,
//      practiceToday (idempotent via 23505), getStreak (line-for-
//      line mirror of Reading.getStreak). js/streak-grace.js
//      extended with persistMemorizationGrace + readMemorization-
//      GraceFlag. New page memorization.html (verse hero + practice
//      button + streak count). admin.html Weekly Verses panel for
//      Kevin to author verses week-by-week. home.html adds a small
//      verse tile between today-card and next-rank-card (will be
//      absorbed by Dispatch 4b's Quest Bar). New static assets:
//      js/memorization.js, memorization.html. NO changes to
//      reading-quest commit pattern, reading streak math, prayer
//      rollup, or any session-lane surface.
// v24: Dispatch 3c — Reading Streak + Verse-Range + Sunday Settlement
//      (D3 resolution). New schema: weekly_reading_streak table
//      (Pattern B mirror of weekly_session_grace; 5 columns —
//      id, explorer_id, week_start_date, grace_used, created_at —
//      with explorer-scoped RLS matching the session sibling per Op
//      Learning #16). Reading is structurally analogous to SESSIONS
//      (per-day boolean events), not prayer (AM/PM duality), so the
//      canonical mirror is weekly_session_grace, NOT prayer_streak_
//      weekly. Intactness is computed on-the-fly by the new
//      Reading.getStreak() walker; there is no rollup file because
//      coins are awarded at completion time in reading-quest.js
//      (Dispatch 3b) and nothing else needs settling on Sunday.
//      New module js/reading.js exposes Reading.init(sb, profileId)
//      + Reading.getStreak(opts?) → int. Walker mirrors
//      Prayers.getStreak() line-for-line for window math, pilgrimage
//      exclusion (Pilgrimages.isActiveOn), 5/7-of-active-days
//      threshold (Math.max(1, Math.ceil(activeDays*5/7))), and
//      rescue at intactThreshold-1. Lazy grace persist: when the
//      walker encounters a 4/7 past week with grace_used=false, it
//      consumes that week's grace via StreakGrace.persistReadingGrace
//      (best-effort, fire-and-forget; each week's grace is
//      independent per Dispatch 2's "1 per week per lane"
//      architecture). js/streak-grace.js extended with
//      persistReadingGrace + readReadingGraceFlag, mirroring the
//      session pair exactly. js/daily-anchor-card.js URL upgrade:
//      gospel deep-link now appends &vs=N&ve=N when both
//      gospel.verse_start and gospel.verse_end are present and
//      parseable positive integers (omits both otherwise, so 3a
//      chapter-level open still works as fallback). bible-reader.html
//      gains Today's Reading mode: when ?vs=N&ve=N are present, the
//      verses in range get .brm-verse-today (gold-tint background +
//      inset gold-edge box-shadow), verses outside get
//      .brm-verse-faded (opacity:0.55), and the page auto-scrolls
//      to the first verse in the range. Mode clears automatically
//      on chapter navigation via book/chapter mismatch check in
//      applyTodaysReadingMode. Existing source=expedition banner
//      upgraded to show "Book Chapter:vs-ve" when range present.
//      progress.html D3 resolution: renderPrayerStreak's displayed
//      number now sources from Prayers.getStreak() (canonical
//      weekly intact count) instead of StreakGrace.computePrayerStreak
//      (legacy daily-EITHER walker). Legacy walker still called for
//      pip detection (returns weeksWithGrace). "Days" label flipped
//      to "Weeks" — matches home.html rank-hero banner. New Reading
//      Streak card added below the dual-streak-row (single full-
//      width row via .solo-streak-row modifier; just the count, no
//      week-dots — visual parity with Weekly/Prayer is Dispatch 4
//      territory per dispatch). Explainer copy updated. New static
//      asset: js/reading.js. NO changes to reading-quest.js commit
//      path (grace row created lazily by walker per orchestrator
//      approval). NO new home.html mount integration (no rollup
//      to fire). NO change to prayer_streak_weekly, weekly_session_
//      grace, or reading_completions schemas.
// v23: Dispatch 3b — Question Card UI + Engagement Loop. New module
//      js/reading-quest.js mounts a daily "Theo or Christopher asks…"
//      card on home.html, immediately under the daily anchor card,
//      once Nolan has tapped through to bible-reader via the gospel
//      link AND returned (bible-reader carries a tiny pagehide hook
//      that writes oe_bible_reader_visited_<YYYY-MM-DD> to local-
//      Storage when ?source=expedition was on the visit). Three
//      question formats supported per the orchestrator-populated
//      liturgical_calendar.daily_readings.question JSONB shape:
//      multiple_choice (5/4/3 try-mechanic floor), free_text (+5 on
//      save, writes to field_journal as category='expedition_log'
//      with "Reflection on <ref>" prefix per approved Deviation 2),
//      and chips (+5 on select; last-chip escape-hatch detection
//      for "type it" / "Something else" opens a textarea). Pastoral
//      skip path always available: 0 coins, gentle Theo/Christopher
//      line, day still counts toward the 5/7 reading streak (3c
//      will wire the streak math). New schema: reading_completions
//      table (UNIQUE per explorer per calendar_date), canonical
//      family-scoped RLS via current_user_family_id() per Deviation
//      1. Coin awarding matches the canonical direct profile-bump
//      pattern (prayer-rollup.js, quiz-runner.js, etc.); row insert
//      is idempotent (Postgres 23505 duplicate → silent re-mount,
//      no double-award). New static assets: js/reading-quest.js,
//      assets/characters/theo-portrait.png,
//      assets/characters/christopher-portrait.png. Sibling-mount
//      architecture: daily-anchor-card stays as 3a left it (always
//      shows today's gospel teaser + "Read this passage" CTA);
//      reading-quest-mount renders conditionally beneath it.
// v22: Dispatch 3a — Lectionary on Daily Anchor Card. js/daily-anchor-card.js
//      refactored so the verse sub-card surfaces today's gospel from
//      liturgical_calendar.daily_readings.gospel when populated (eyebrow
//      "Today's Gospel", reference + ~35-word teaser with liturgical
//      lead-ins like "At that time, " and "The Lord said, …" stripped,
//      deep-link to bible-reader at the gospel's book + chapter). When
//      the gospel payload is absent or incomplete (dates outside ICS
//      coverage), the verse sub-card falls back to the existing
//      daily_verses rotation — pre-3a UX preserved. home.html's
//      loadDailyAnchorCard adds daily_readings to its liturgical_calendar
//      SELECT and defensively prefers WeekUtils.todayKey() for the date
//      string. No new files, no new schema, no bible-reader changes.
// v20: Dispatch 2 — Sunday-anchor migration + prayer streak alignment
//      + pilgrimage integration. Week boundaries flipped from
//      Monday-anchored to Sunday-anchored across the codebase: new
//      js/week-utils.js centralizes the helper (ET-aware, UTC-noon
//      anchor pattern), and js/prayer-rollup.js, js/streak-grace.js,
//      js/session-rollup.js, js/day-state.js, prayers.html, parent.html,
//      progress.html, games/game-utils.js all delegate to it. Public
//      API renames: PrayerRollup.getCurrentMonday → getCurrentWeekStart
//      (similarly for SessionRollup and StreakGrace); GameUtils
//      getCurrentMondayET → getCurrentWeekStartET. profiles.last_game_week_start
//      retains its column name; semantics flip to Sunday-key.
//      Surface B: Prayers.getStreak() rewritten per locked architecture
//      (consecutive intact SETTLED weeks; 5/7 either-prayer threshold
//      with 1 grace per week saving 4/7; pilgrimage days excluded from
//      threshold; current in-progress week never counts and never
//      breaks). renderPanel copy flips "X days" → "X weeks of faithful
//      prayer". home.html's lockstep renderPrayerStreak copies delegate
//      to Prayers.getStreak() (legacy daily-EITHER fallback retained).
//      New helper Prayers.getFullCrownEligibility(weekStart) added but
//      unwired (Dispatch 5 will consume it for Sunday Celebration).
//      Surface C: pilgrimages table extended with start_date + end_date
//      (date, nullable) via migration pilgrimage_window_columns_20260510.
//      New js/pilgrimages.js provides isActiveOn / isActiveToday /
//      getMostRecentEnded helpers with module-scope caching. Streak
//      math integrates Pilgrimages.isActiveOn — pilgrimage M/W/F slots
//      are excluded from threshold; activeSlots=0 preserves streak.
//      admin.html gains a Pilgrimages section (date pickers per row,
//      cache invalidation on save). home.html surfaces a quiet
//      parchment banner when pilgrimage active today, and a one-time
//      "Welcome home" banner the day after pilgrimage ends (localStorage
//      flag oe_welcome_home_<id>). New static assets: js/week-utils.js,
//      js/pilgrimages.js. STATIC_ASSETS unchanged for files that were
//      already cached but updated in place; cache version bump triggers
//      re-fetch.
// v19: Repair Chat S — calendar-ribbon refactor + family-month-view bracket
//      (Dispatch 1 surface — added liturgical_calendar.daily_readings jsonb
//      column populated for May 8 — Aug 31 launch month; calendar-loader.js
//      + calendar-card.js extended to surface readings).
// v18: liturgical_calendar populate + name-day-banner.js + calendar-loader.js +
//      calendar-card.js initial wiring.
// v17: Repair Chat G — Streak auto-increment. profiles.streak now
//      advances automatically when calendar weeks close (Mon→Mon
//      transitions detected on next progress.html load). New file
//      js/session-rollup.js mirrors the prayer-rollup.js
//      Sunday-night-rollup pattern for the session-week side.
//      Pattern A schema: ONE column added — profiles.last_settled_week_start
//      (date, nullable; new on this version) acts as an idempotency
//      pointer; NULL on first invocation initializes lazily to that
//      day's Monday so pre-launch noise weeks aren't retroactively
//      settled. Closed weeks settle as: 0 missed = clean +1; 1 missed
//      = grace consumed (lazily persists weekly_session_grace.grace_used
//      via Chat B's StreakGrace helper) +1; 2+ missed = broken,
//      streak resets to 0. Ladder thresholds (Lane 2 LOCKED — 8/12/20/40
//      → 250/400/750/1500 coins) fire on transition via the
//      profiles.coins + activity_log pattern Lane 3 established
//      (Operational Learning #4 — no log_session_streak_coins
//      trigger exists; client bumps coins). Lightweight parchment
//      toast surfaces on ladder hits. progress.html init wires the
//      rollup before loadData so the freshly-incremented streak
//      renders immediately. Migration:
//      streak_auto_increment_pointer_20260508. Page-integrity audit
//      preamble (Op Learning #1 — second corruption case discipline)
//      ran clean across all 17 explorer-facing HTML files.
// v16: Repair B — Streak Grace Mechanic. ADHD failure-mode prevention.
//      One grace token per streak per calendar week (Mon-Sun, matching
//      prayer_streak_weekly.week_start_date). Migrates progress.html's
//      prayer streak to the strict "both prayers required" semantic
//      that prayers.js's getStreak already used; layers grace on top
//      so a single missed prayer slot per week is silently absorbed.
//      Adds js/streak-grace.js (pure functions + persistence helpers).
//      DB additions: prayer_streak_weekly.grace_used BOOLEAN; new
//      table weekly_session_grace mirroring (explorer_id,
//      week_start_date) keying with matching RLS posture. Visual
//      indicator: muted-gold 5px pip beside streak-card title when
//      grace has been used in the current week. Never red, never
//      "missed", never punitive. Both pools clear automatically
//      every Monday because the new-week row defaults grace_used=false.
// v15: Lane A — Daily Anchor Card ("Today We Celebrate") on home.html.
//      Two new tables (daily_verses 35 rows, journal_prompts 30 rows)
//      back a day-of-year rotation that pairs a Bible verse with a
//      reflection prompt below today-card and above rank-hero. Verse
//      sub-card deep-links to bible-reader.html?book=&chapter=&source=
//      expedition (LXX numbering for Psalms); prompt sub-card deep-
//      links to journal.html?prompt=daily&text= which surfaces it via
//      the existing coming-home-banner pattern (joining name_day +
//      session as a third arrival mode). Aug 9 St. Herman name-day
//      gets a card-level flourish (Greek "Χρόνια πολλά, Nolan" framing,
//      gold elevation) — coexists with week.html's existing name-day-
//      banner. May 8-17 pre-launch calendar gap handled via Path B
//      graceful fallback ("Christ is Risen!" + journey-begins-May-18
//      teaser); no liturgical_calendar backfill in this lane. Greek
//      micro-accent: Α/Ω flank "Current Rank" eyebrow on rank-hero
//      (theological resonance: Christ is the Alpha and Omega). New
//      file: js/daily-anchor-card.js (pure render module, sister to
//      js/calendar-card.js).
// v14: Wave 2 Lane 3 — Prayer System. Three new tables (prayers,
//      prayer_routines, prayer_streak_weekly) seeded with 20 traditional
//      Orthodox prayers + Nolan's two starter Rules. prayers.html rebuilt
//      as a three-screen state machine (Landing / Routine flow / Browse
//      Library). Sunday-night weekly rollup awards 5 × morning_count
//      + 5 × evening_count coins on next-open Mon-or-later, with quiet
//      parchment celebration overlay (slides in from top, doxological
//      framing). Per-routine completion auto-marks daily_morning_prayer
//      / daily_evening_prayer mission rows but drops 0 coins (Lane 2's
//      zeroing preserved). Adds shared js/prayer-rollup.js, hooked into
//      home.html and missions.html init paths so the rollup also fires
//      on those entry points.
// v13: Repair Chat R — added shared /css/contrast.css for WCAG AA-compliant
//      text-tier tokens. Fixes Kevin's smoke-test observation that "the various
//      pages are dark with darker text." Audit found 295 sub-AA text-color
//      declarations across 13 pages (gold/parchment at low opacity on near-black
//      bg). Programmatic rgba opacity bumps applied across all dark pages plus
//      surgical fixes to admin.html's parchment-theme override block (73 more)
//      and to journal.html's leather-on-parchment entries. All 14 main pages
//      verified clean against WCAG 2.1 AA (4.5:1 body, 3:1 UI/large) — see
//      contrast.css header for token tier definitions and measured ratios.
//      No color/font/aesthetic changes; only opacity values and rgba bases
//      bumped to land each tier above its WCAG threshold.
// v12: Repair Chat W — bazaar wishlist viewer (admin-view mode) + redemption
//      notification email fan-out to all family parents (Kevin + Danyelle).
//      No new files; this version bump is to ensure the updated bazaar.html,
//      email-utils.js, admin.html and parent.html clear any pre-cached
//      revisions on Kevin's iPad. Also adds /email-utils.js to STATIC_ASSETS
//      (it was previously fetched at run-time but never explicitly precached).
// v11: Repair Chat N — added shared /css/nav-polish.css for bottom-nav final polish.
//      Fix: the Holy Scriptures (☦) icon was rendering as a pink Apple Color Emoji on
//      iOS/iPadOS because the system fonts have no text glyph for U+2626 ORTHODOX CROSS.
//      Two-pronged fix: (a) `font-variant-emoji: text` on .nav-mark in nav-polish.css,
//      (b) U+FE0E TEXT VARIATION SELECTOR appended to ☦ in nav HTML across 6 pages.
//      Also adds palette-matched :focus-visible ring for keyboard accessibility.
// v10: Repair B3 — added shared /css/viewport.css for responsive --container-max-width token.
//      14 main pages updated: viewport meta standardized to width=device-width, initial-scale=1,
//      viewport-fit=cover (drops user-scalable=no for accessibility, adds iPad safe-area).
//      Page-root max-width replaced with var(--container-max-width) so the PWA fills the
//      screen comfortably on Nolan's iPad (his primary device) without sprawling on desktop.
// v9: Repair B1 — added progress.html (dedicated streak/stats page extracted from home.html)
//     home.html streamlined to ADHD-first hero layout (today-card as visual hero, streaks moved out).
// v8: LAUNCH-BLOCKER FIX — config/program-spine.json updated; Topic 00 now uses_three_day_model:true
//     This activates Lane 2's M/W/F UI for Topic 00. Without it, week.html would render empty
//     content on May 18 launch day (Topic00Day.render() returned '' when day_kind='topic00_open').
// v29: Chat 7 — curriculum.html visual lift (illuminated manuscript treatment: parchment topic-block panel, "00" drop-cap, gold rules, session-card state accents, wax-seal lock glyph)
// v28: Dispatch 6 — curriculum.html schedule gating (locked future-week cards); spine title 00.12 → "St. Herman of Alaska — Your Patron Saint"
// v7: added PWA icon set (Option 2 burgundy logo) — favicon.svg, icon-{180,192,512}.png, icon-maskable-{192,512}.png
// v6: added quiz-runner.js, assess.html, quiz-results.html for Lane 3
// v5: added topic-00-day.js for Lane 2 M/W/F rendering UI
// v4: added week.html, prayers.html, day-state, pause-card, prayers, and config JSON
// Version bump forces cache clear and fresh install

// v44 → v45: Chat 20-IMPL-A · Trail Markers + Trophy Chip redesign.
//      missions.html + js/missions.js touched extensively:
//      - Mission tabs demoted to compact ~32px chip rail.
//      - Reading lane rendered as a uniform trail-marker row +
//        optional inline expand panel for the read-not-reflected
//        state (the existing Stage 2 form is preserved; the
//        outer .mh-reading-card chrome retires).
//      - Day Complete lane replaced by .mh-trophy three-state
//        chip (locked / unlock-pending / paid / pilgrimage).
//      - Progress counter relocated from BOTTOM of the panel to
//        the eyebrow band at TOP (.mh-progress-chip).
//      - Six-element celebration choreography wired on the
//        locked→paid transition (chip morph + iOS haptic + +10
//        toast + coin-rain + counter advance + closing line).
//      - Quiet "next-up" gold pulse on the topmost incomplete
//        row (.mh-row-next-up); prefers-reduced-motion compliant.
//      - T/Th session_reflection lane retired; existing
//        field_journal rows in that category remain visible
//        in journal.html.
//      - DAC CSS block (~140 lines) + reflection-lane.js script
//        tag removed from missions.html (orphan modules kept in
//        repo as dead code per orchestrator ruling; deferred to
//        the post-launch repo audit chat).
//      bible-reader.html, js/marginalia.js, and the marginalia
//      JSON are UNTOUCHED in 20-IMPL-A (verified by pre/post
//      SHA-256 in the completion summary). 20-IMPL-B is the
//      next dispatch and will move the Stage 2 reflect surface
//      into bible-reader.html.
//      No new static assets in this bump.
//
// v46: Wave 2 Lead — Coin model update + Session Journal lane.
//      ─ js/missions.js: Session Journal lane state + render + wire.
//      ─ js/reflection-lane.js: exposes pure-data helpers; revived
//        in missions.html script load order.
//      ─ missions.html: reflection-lane.js script tag re-added;
//        .mh-journal-block / .mh-journal-expand CSS added.
//      ─ js/topic-00-day.js + js/quiz-runner.js: +5 Curriculum lane
//        daily bonus on each fresh day_N stamp.
//      No new STATIC_ASSETS entries — reflection-lane.js is already
//      listed (cached since v37).
//
// v48 (May 13, 2026) — Chat 19 — Streak Heatmap calendar
//      Adds the GitHub-style contribution heatmap to home.html
//      between #home-dashboard (Today's Progress) and .next-rank-
//      card. New module js/streak-heatmap.js. CACHE_NAME bump
//      v47 → v48 forces install of the heatmap module + the
//      home.html edit (script tag, mount target, mount call,
//      visibility-refresh extension, .sh-* CSS block).
//      STATIC_ASSETS additions: js/streak-heatmap.js.
//
// v49 (May 13, 2026) — Chat 20 — Iconography + Saint Bio Micro-Cards
//      Implements D5: tap a saint on the home Liturgical Calendar
//      drawer → modal opens with the saint's icon, life story, and
//      2-3 visual-literacy callouts. First six unique cards an
//      explorer opens get an inline "How to read icons — Lesson N
//      of 6" banner above callout #1. Field Manual gains a new
//      "Saints I've Met" archive section below Past Entries.
//      New module js/saint-cards.js (loader, slug-matcher, modal
//      overlay, state read/merge/write on profiles.onboarding_state
//      JSONB, archive render). New JSON corpus at /docs/content/
//      saints/topic-00-saints-v1.json (stub ships with Constantine
//      & Helen baked from D5 §11 verbatim — works end-to-end on
//      May 21 Day-4 of Topic 00). Edits: js/liturgical-calendar-
//      home.js (3 lockstep tap-wrap sites — saint <li>, feast_name,
//      sunday_name), journal.html (✦ Saints I've Met ✦ divider +
//      saints-archive section + loadSaintsArchive wiring), home.html
//      (script tag + loadCorpus bootstrap + explorerId threaded
//      into LC mount). CACHE_NAME bump v48 → v49 forces install of
//      saint-cards.js module + the edits across the three HTML/JS
//      files. STATIC_ASSETS additions: js/saint-cards.js +
//      docs/content/saints/topic-00-saints-v1.json. Saint icon PNG
//      assets at /assets/saints/<slug>.png are NOT precached in v49
//      (lazy-cached via runtime fetch-and-cache path; saints lack
//      authored icon assets at this deploy and the parchment SVG
//      placeholder renders graceful-degrade inline).
const CACHE_NAME = 'orthodox-expedition-v52';
const STATIC_ASSETS = [
  '/Orthodox-Expedition-/',
  '/Orthodox-Expedition-/index.html',
  '/Orthodox-Expedition-/home.html',
  '/Orthodox-Expedition-/progress.html',
  '/Orthodox-Expedition-/week.html',
  '/Orthodox-Expedition-/prayers.html',
  '/Orthodox-Expedition-/eucharist-prayers.html',
  '/Orthodox-Expedition-/missions.html',
  '/Orthodox-Expedition-/curriculum.html',
  '/Orthodox-Expedition-/bazaar.html',
  '/Orthodox-Expedition-/games.html',
  '/Orthodox-Expedition-/journal.html',
  '/Orthodox-Expedition-/journal-mission.html',
  '/Orthodox-Expedition-/bible-reader.html',
  '/Orthodox-Expedition-/parent.html',
  '/Orthodox-Expedition-/assess.html',
  '/Orthodox-Expedition-/quiz-results.html',
  '/Orthodox-Expedition-/memorization.html',
  '/Orthodox-Expedition-/email-utils.js',
  '/Orthodox-Expedition-/favicon.svg',
  '/Orthodox-Expedition-/icon-180.png',
  '/Orthodox-Expedition-/icon-192.png',
  '/Orthodox-Expedition-/icon-512.png',
  '/Orthodox-Expedition-/icon-maskable-192.png',
  '/Orthodox-Expedition-/icon-maskable-512.png',
  '/Orthodox-Expedition-/manifest.json',
  // v50 — Chat 22 — chrismation certificate render page:
  '/Orthodox-Expedition-/certificate.html',
  '/Orthodox-Expedition-/css/viewport.css',
  '/Orthodox-Expedition-/css/contrast.css',
  '/Orthodox-Expedition-/css/nav-polish.css',
  '/Orthodox-Expedition-/css/welcome-flow.css',
  '/Orthodox-Expedition-/js/week-utils.js',
  '/Orthodox-Expedition-/js/pilgrimages.js',
  '/Orthodox-Expedition-/js/day-state.js',
  '/Orthodox-Expedition-/js/pause-card.js',
  '/Orthodox-Expedition-/js/prayers.js',
  '/Orthodox-Expedition-/js/prayer-rollup.js',
  '/Orthodox-Expedition-/js/session-rollup.js',
  '/Orthodox-Expedition-/js/streak-grace.js',
  '/Orthodox-Expedition-/js/sunday-celebration.js',
  '/Orthodox-Expedition-/js/daily-anchor-card.js',
  '/Orthodox-Expedition-/js/reading-quest.js',
  '/Orthodox-Expedition-/js/reading-reflect-panel.js',  // v47 — Chat 20-IMPL-B
  '/Orthodox-Expedition-/js/reflection-lane.js',
  '/Orthodox-Expedition-/js/reading.js',
  '/Orthodox-Expedition-/js/memorization.js',
  '/Orthodox-Expedition-/js/missions.js',
  '/Orthodox-Expedition-/js/home-dashboard.js',
  '/Orthodox-Expedition-/js/feast-of-week.js',
  '/Orthodox-Expedition-/js/liturgical-calendar-home.js',
  '/Orthodox-Expedition-/js/topic-00-day.js',
  '/Orthodox-Expedition-/js/quiz-runner.js',
  '/Orthodox-Expedition-/js/welcome-flow.js',
  '/Orthodox-Expedition-/config/program-spine.json',
  '/Orthodox-Expedition-/config/daily-prayers.json',
  '/Orthodox-Expedition-/assets/characters/theo-portrait.png',
  '/Orthodox-Expedition-/assets/characters/christopher-portrait.png',
  '/Orthodox-Expedition-/assets/characters/theo-christopher-companion.png',
  '/Orthodox-Expedition-/assets/characters/theo-christopher-hero.png',
  // v50 — Chat 22 — GFS Neohellenic polytonic Greek face (first
  // production font asset; consumed by /certificate.html):
  '/Orthodox-Expedition-/assets/fonts/GFSNeohellenic-Regular.woff2',
  // v38 — Chat 12 additions (previously loaded but uncached):
  '/Orthodox-Expedition-/js/session-loader.js',
  '/Orthodox-Expedition-/js/calendar-loader.js',
  '/Orthodox-Expedition-/js/calendar-card.js',
  '/Orthodox-Expedition-/js/name-day-banner.js',
  '/Orthodox-Expedition-/parent-companion.html',
  // v39 — Chat 13 additions (Chat 12 Sweep 7 — games dir):
  '/Orthodox-Expedition-/games/game-utils.js',
  '/Orthodox-Expedition-/games/sacrament-match.html',
  '/Orthodox-Expedition-/games/fasting-rules.html',
  '/Orthodox-Expedition-/games/creed-builder.html',
  '/Orthodox-Expedition-/games/saint-seeker.html',
  '/Orthodox-Expedition-/games/heresy-hunter.html',
  '/Orthodox-Expedition-/games/feast-calendar.html',
  '/Orthodox-Expedition-/games/council-timeline.html',
  '/Orthodox-Expedition-/games/creed-catcher.html',
  '/Orthodox-Expedition-/games/virtue-passion.html',
  '/Orthodox-Expedition-/games/feast-or-fast.html',
  '/Orthodox-Expedition-/games/liturgy-sequence.html',
  '/Orthodox-Expedition-/games/apostle-journeys.html',
  '/Orthodox-Expedition-/games/byzantine-blitz.html',
  '/Orthodox-Expedition-/games/icon-gallery.html',
  '/Orthodox-Expedition-/games/sacred-words.html',
  '/Orthodox-Expedition-/games/bible-trivia.html',
  '/Orthodox-Expedition-/games/church-history.html',
  // v43 — Chat 18 additions (Marginalia v1 on reading lane):
  '/Orthodox-Expedition-/js/marginalia.js',
  '/Orthodox-Expedition-/docs/content/topic-00-marginalia-v1.json',
  // v48 — Chat 19 addition (Streak Heatmap calendar):
  '/Orthodox-Expedition-/js/streak-heatmap.js',
  // v49 — Chat 20 additions (Iconography + Saint Bio Micro-Cards):
  '/Orthodox-Expedition-/js/saint-cards.js',
  '/Orthodox-Expedition-/docs/content/saints/topic-00-saints-v1.json',
  // v51 — Chat 23 additions (Field Journal v1 paired-diptych):
  '/Orthodox-Expedition-/js/field-journal-static.js',
  '/Orthodox-Expedition-/docs/content/field-journal/reception-day-entries-v1.json',
  // v52 — Phase C additions (Welcome Flow Vita Strip):
  '/Orthodox-Expedition-/js/vita-strip.js',
  '/Orthodox-Expedition-/docs/content/scenes/welcome-flow-v1.json',
  '/Orthodox-Expedition-/assets/comic/scenes/welcome-flow/panel-1-preparation.png',
  '/Orthodox-Expedition-/assets/comic/scenes/welcome-flow/panel-2-setting-out.png',
  '/Orthodox-Expedition-/assets/comic/scenes/welcome-flow/panel-3-the-answer.png',
  '/Orthodox-Expedition-/assets/comic/scenes/welcome-flow/panel-4-silent-beat.png',
  '/Orthodox-Expedition-/assets/comic/scenes/welcome-flow/panel-5-threshold.png',
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('Cache addAll error (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — delete ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('Deleting cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, minimal caching
// Only cache static non-HTML assets — never cache HTML pages
self.addEventListener('fetch', event => {
  // Skip non-GET
  if(event.request.method !== 'GET') return;

  // Never intercept Supabase, CDN, or API calls
  const url = event.request.url;
  if(url.includes('supabase.co')) return;
  if(url.includes('googleapis.com')) return;
  if(url.includes('jsdelivr.net')) return;
  if(url.includes('github')) return;
  if(url.includes('cloudflareinsights')) return;

  // HTML pages — always network first, NO cache fallback
  // This prevents stale HTML from ever being served
  if(event.request.headers.get('Accept') &&
     event.request.headers.get('Accept').includes('text/html')){
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only show offline message — never serve stale HTML
        return new Response(
          '<html><body style="font-family:sans-serif;text-align:center;padding:3rem;">' +
          '<h2>☩ You are offline</h2>' +
          '<p>Please reconnect to continue your expedition.</p>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Static assets (images, fonts, icons) — cache after network
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if(response.ok && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
