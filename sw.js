// Orthodox Expedition — Service Worker v23
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
// v7: added PWA icon set (Option 2 burgundy logo) — favicon.svg, icon-{180,192,512}.png, icon-maskable-{192,512}.png
// v6: added quiz-runner.js, assess.html, quiz-results.html for Lane 3
// v5: added topic-00-day.js for Lane 2 M/W/F rendering UI
// v4: added week.html, prayers.html, day-state, pause-card, prayers, and config JSON
// Version bump forces cache clear and fresh install

const CACHE_NAME = 'orthodox-expedition-v23';
const STATIC_ASSETS = [
  '/Orthodox-Expedition-/',
  '/Orthodox-Expedition-/index.html',
  '/Orthodox-Expedition-/home.html',
  '/Orthodox-Expedition-/progress.html',
  '/Orthodox-Expedition-/week.html',
  '/Orthodox-Expedition-/prayers.html',
  '/Orthodox-Expedition-/missions.html',
  '/Orthodox-Expedition-/curriculum.html',
  '/Orthodox-Expedition-/bazaar.html',
  '/Orthodox-Expedition-/games.html',
  '/Orthodox-Expedition-/journal.html',
  '/Orthodox-Expedition-/bible-reader.html',
  '/Orthodox-Expedition-/parent.html',
  '/Orthodox-Expedition-/assess.html',
  '/Orthodox-Expedition-/quiz-results.html',
  '/Orthodox-Expedition-/email-utils.js',
  '/Orthodox-Expedition-/favicon.svg',
  '/Orthodox-Expedition-/icon-180.png',
  '/Orthodox-Expedition-/icon-192.png',
  '/Orthodox-Expedition-/icon-512.png',
  '/Orthodox-Expedition-/icon-maskable-192.png',
  '/Orthodox-Expedition-/icon-maskable-512.png',
  '/Orthodox-Expedition-/manifest.json',
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
  '/Orthodox-Expedition-/js/daily-anchor-card.js',
  '/Orthodox-Expedition-/js/reading-quest.js',
  '/Orthodox-Expedition-/js/topic-00-day.js',
  '/Orthodox-Expedition-/js/quiz-runner.js',
  '/Orthodox-Expedition-/js/welcome-flow.js',
  '/Orthodox-Expedition-/config/program-spine.json',
  '/Orthodox-Expedition-/config/daily-prayers.json',
  '/Orthodox-Expedition-/assets/characters/theo-portrait.png',
  '/Orthodox-Expedition-/assets/characters/christopher-portrait.png',
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
