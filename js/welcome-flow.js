// Orthodox Expedition — Welcome Flow + Weekly Intro Video Plumbing
// Repair Chat S v2 — May 9, 2026
//
// Two coupled UX surfaces sharing this single module:
//   A. WELCOME FLOW
//      First authenticated load of home.html on/after May 18, 2026
//      (America/New_York). One-time PER ACCOUNT. Plays a Welcome video,
//      then 4 swipeable instruction cards. Card 4's "Let's begin" CTA
//      marks completion (profiles.onboarding_state.welcome_completed_at).
//
//   B. WEEKLY INTRO PLUMBING
//      First visit to week.html within a given Topic-00 calendar week
//      (Mon-anchored, weeks 1–4 of Topic 00) on/after May 18, 2026.
//      Plays the corresponding Week N video; Continue or Skip-after-5s
//      marks completion (onboarding_state.week_intros_seen[n]).
//
// v2 changes vs v1 (Repair Chat S):
//   • Storage moved from localStorage → profiles.onboarding_state (jsonb).
//     State now travels with the account, not the device — survives PWA
//     reinstall, device replacement, and is forward-compatible with
//     multi-family v1.1.
//   • Explicit America/New_York launch-date gate. Pre-launch (today <
//     2026-05-18 ET): zero modal renders, zero Supabase calls.
//   • _getCurrentWeekNumber() returns null pre-launch (was: 1).
//   • Public API now async: maybeShowWelcome({sb, profileId, name}) and
//     maybeShowWeekIntro({sb, profileId, weekNum?}).
//
// Graceful failure mode: if any Supabase call fails (network, RLS), the
// modal silently no-shows. Showing without being able to mark complete
// would create a re-show loop. Better to wait for next online launch.
//
// Video URLs hardcoded (Option A — chosen by orchestrator). iOS strategy:
// iframe with playsinline=1 + autoplay=1 + mute=1 (best effort). Manual
// "Continue" CTA (gated 5s) is always the path forward; no hard
// dependency on the YouTube IFrame API. If the iframe fails to load, a
// gentle hint surfaces and the Continue button still completes the flow.
// The video is the EXPECTED experience, not a hard requirement.

(function (global) {
  'use strict';

  // ── VIDEO URL MAP (verbatim from Repair S dispatch) ────────────────
  var VIDEOS = {
    welcome: 'https://www.youtube.com/embed/-nIo-7Zxxag',
    week_1:  'https://www.youtube.com/embed/Rn7LGb0N1VE',
    week_2:  'https://www.youtube.com/embed/4VHYJJb_TKw',
    week_3:  'https://www.youtube.com/embed/TS4Kv9lehr8',
    week_4:  'https://www.youtube.com/embed/4FJG20_0Omg'
  };

  // YouTube embed parameters — playsinline=1 is required for iOS;
  // without it, the iPad forces fullscreen takeover.
  var EMBED_PARAMS = '?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1';

  // Topic 00 launch anchor. Mirrors config/program-spine.json launch_date.
  // All comparisons are in America/New_York (see _todayKeyET below).
  var LAUNCH_DATE_ISO = '2026-05-18';

  // ── Instruction card content (verbatim from Repair S dispatch) ─────
  // Card 4's body uses U+2626 ORTHODOX CROSS followed by U+FE0E TEXT
  // VARIATION SELECTOR (Repair N iOS emoji defense — see also
  // .oe-cross { font-variant-emoji: text } in welcome-flow.css).
  var CARDS = [
    {
      headline: 'Earning Saint Coins',
      bullets: [
        'Morning prayer: +5 coins',
        'Evening prayer: +5 coins',
        'Monday / Wednesday / Friday sessions: lesson, handout, quiz (\u2248230 coins per full week)',
        'Weekly streak ladder: 8 weeks \u2192 250 \u00B7 12 weeks \u2192 400 \u00B7 20 weeks \u2192 750 \u00B7 40 weeks \u2192 1,500',
        'Games: up to 150 coins per week (so games stay fun, not the main path)',
        'Grace: miss one day, your streak is safe \u2014 once per week'
      ]
    },
    {
      headline: 'Your Rank: I \u2192 VII',
      bullets: [
        'Earn lifetime coins to advance through seven ranks',
        'Rank I (start) \u00B7 II at 100 \u00B7 III at 500 \u00B7 IV at 1,500',
        'V at 5,000 \u00B7 VI at 15,000 \u00B7 VII at 35,000',
        'Lifetime coins never decrease \u2014 you keep every step you climb'
      ]
    },
    {
      headline: 'The Bazaar',
      bullets: [
        'Spend Saint Coins on real prizes',
        'Six tiers: from small finds to royal bestowals',
        'Mom and Dad approve every redemption',
        'Spending coins doesn\u2019t lower your rank'
      ]
    },
    {
      // Card 4 — the headline and subheadline are templated with {NAME}
      // so the name flows from the explorer profile at render time.
      // Greek polytonic: \u039A\u03B1\u03BB\u03CE\u03C2 \u03CC\u03C1\u03B9\u03C3\u03B5\u03C2 = Καλώς όρισες.
      headlineTemplate: '\u039A\u03B1\u03BB\u03CE\u03C2 \u03CC\u03C1\u03B9\u03C3\u03B5\u03C2, {NAME}',
      subheadlineTemplate: '(Welcome, {NAME})',
      body: 'Three years. One faith. Walk with me. \u2626\uFE0E',
      cta: 'Let\u2019s begin'
    }
  ];

  // ── Date helpers (America/New_York, timezone-pure) ─────────────────
  // Pattern matches Chat Q's todayKey() convention. The only TZ-sensitive
  // call is Intl.DateTimeFormat with timeZone:'America/New_York'; all
  // arithmetic uses Date.UTC, which is unaffected by the runtime's local
  // timezone. iPad timezone drift (rare, but possible) cannot cause an
  // off-by-one.
  function _todayKeyET() {
    var fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return fmt.format(new Date()); // 'YYYY-MM-DD'
  }

  function _isLaunchDateOrLater() {
    return _todayKeyET() >= LAUNCH_DATE_ISO;
  }

  // Whole days from launch (inclusive of launch day = 0). Returns -1 if
  // pre-launch — caller should normally not invoke this without first
  // checking _isLaunchDateOrLater().
  function _daysSinceLaunch() {
    var todayKey = _todayKeyET();
    if (todayKey < LAUNCH_DATE_ISO) return -1;
    var t = Date.UTC(
      Number(todayKey.slice(0, 4)),
      Number(todayKey.slice(5, 7)) - 1,
      Number(todayKey.slice(8, 10))
    );
    var l = Date.UTC(
      Number(LAUNCH_DATE_ISO.slice(0, 4)),
      Number(LAUNCH_DATE_ISO.slice(5, 7)) - 1,
      Number(LAUNCH_DATE_ISO.slice(8, 10))
    );
    return Math.floor((t - l) / 86400000);
  }

  // ── Topic-00 week-number derivation ────────────────────────────────
  // v2: returns null pre-launch (v1 returned 1). Post-launch: weeks 1–4
  // for the four-week Topic 00 arc; null outside that window so future
  // topics can't accidentally fire a Topic-00 video.
  function _getCurrentWeekNumber() {
    if (!_isLaunchDateOrLater()) return null;
    var days = _daysSinceLaunch();
    var week = Math.floor(days / 7) + 1;
    if (week < 1 || week > 4) return null;
    return week;
  }

  // ── Onboarding-state helpers (Supabase-backed) ─────────────────────
  // State shape (jsonb on profiles.onboarding_state):
  //   {
  //     "welcome_completed_at": "2026-05-18T12:03:14.000Z",
  //     "week_intros_seen": { "1": "...", "2": "..." }
  //   }
  // RLS: profiles.{select,update} own row (auth.uid() = id). The new
  // column inherits the existing policies — no policy changes needed.

  // Returns the state object on success, {} if the row exists but state
  // is empty, or null on read error. Tri-state lets callers distinguish
  // "first run" (=>{}) from "network down" (=>null) and silently no-show
  // in the latter case (per dispatch graceful-failure spec).
  async function _getOnboardingState(sb, profileId) {
    try {
      var resp = await sb
        .from('profiles')
        .select('onboarding_state')
        .eq('id', profileId)
        .single();
      if (resp.error) {
        console.warn('[welcome-flow] read onboarding_state failed:', resp.error.message);
        return null;
      }
      return (resp.data && resp.data.onboarding_state) || {};
    } catch (e) {
      console.warn('[welcome-flow] read onboarding_state threw:', e);
      return null;
    }
  }

  async function _hasSeenWelcome(sb, profileId) {
    var state = await _getOnboardingState(sb, profileId);
    return !!(state && state.welcome_completed_at);
  }

  async function _markWelcomeSeen(sb, profileId) {
    try {
      var current = await _getOnboardingState(sb, profileId);
      if (current === null) return false;
      var merged = Object.assign({}, current, {
        welcome_completed_at: new Date().toISOString()
      });
      var resp = await sb
        .from('profiles')
        .update({ onboarding_state: merged })
        .eq('id', profileId);
      if (resp.error) {
        console.warn('[welcome-flow] mark welcome write failed:', resp.error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[welcome-flow] mark welcome threw:', e);
      return false;
    }
  }

  async function _hasSeenWeekIntro(sb, profileId, n) {
    var state = await _getOnboardingState(sb, profileId);
    return !!(state && state.week_intros_seen && state.week_intros_seen[String(n)]);
  }

  async function _markWeekIntroSeen(sb, profileId, n) {
    try {
      var current = await _getOnboardingState(sb, profileId);
      if (current === null) return false;
      var weeks = Object.assign({}, current.week_intros_seen || {});
      weeks[String(n)] = new Date().toISOString();
      var merged = Object.assign({}, current, { week_intros_seen: weeks });
      var resp = await sb
        .from('profiles')
        .update({ onboarding_state: merged })
        .eq('id', profileId);
      if (resp.error) {
        console.warn('[welcome-flow] mark week ' + n + ' write failed:', resp.error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[welcome-flow] mark week ' + n + ' threw:', e);
      return false;
    }
  }

  // ── Bottom-nav hide/restore (immersive surface convention from
  //    Repair N — bottom nav is inside the rendered surface, so we
  //    target both .bottom-nav and any nav we find as a fallback) ──
  function _hideBottomNav() {
    var navs = global.document.querySelectorAll('nav.bottom-nav');
    for (var i = 0; i < navs.length; i++) {
      navs[i].setAttribute('data-oe-hidden-by-welcome', '1');
      navs[i].style.display = 'none';
    }
  }
  function _restoreBottomNav() {
    var hidden = global.document.querySelectorAll('nav.bottom-nav[data-oe-hidden-by-welcome="1"]');
    for (var i = 0; i < hidden.length; i++) {
      hidden[i].style.display = '';
      hidden[i].removeAttribute('data-oe-hidden-by-welcome');
    }
  }

  // ── Modal scaffold ─────────────────────────────────────────────────
  // Returns { root, dismiss }; dismiss() removes the modal and restores nav.
  function _renderModal() {
    _hideBottomNav();
    var root = global.document.createElement('div');
    root.className = 'oe-welcome-overlay';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    // Lock the page scroll while the modal is up.
    var prevOverflow = global.document.body.style.overflow;
    global.document.body.style.overflow = 'hidden';
    global.document.body.appendChild(root);

    function dismiss() {
      try {
        if (root.parentNode) root.parentNode.removeChild(root);
      } catch (e) { /* non-fatal */ }
      global.document.body.style.overflow = prevOverflow;
      _restoreBottomNav();
    }
    return { root: root, dismiss: dismiss };
  }

  // ── Hero frame (Chat 4) ────────────────────────────────────────────
  // The first frame of the welcome flow. Theo + Christopher walking
  // toward the monastery at sunset, personalized greeting with the
  // explorer's first name, a single "Begin →" CTA. On tap, chains to
  // the existing video panel (which then chains to the instruction
  // cards). The welcome flow is now: hero → video → 4 cards.
  //
  // opts: { modalRoot, name, onBegin }
  //   modalRoot: container element to fill
  //   name:      explorer's first name (already extracted, e.g. "Nolan")
  //   onBegin:   callback invoked when Begin is tapped
  function _renderHeroFrame(opts) {
    var modalRoot = opts.modalRoot;
    var name = opts.name || 'Nolan';
    var onBegin = opts.onBegin;

    modalRoot.innerHTML = '';

    var panel = global.document.createElement('div');
    panel.className = 'oe-welcome-panel oe-hero-panel';

    // Portrait wrap (16:9 frame; image is JPEG-as-PNG, browser
    // handles it correctly via magic-byte detection).
    var portraitWrap = global.document.createElement('div');
    portraitWrap.className = 'oe-hero-portrait-wrap';

    var portrait = global.document.createElement('img');
    portrait.className = 'oe-hero-portrait';
    portrait.src = '/Orthodox-Expedition-/assets/characters/theo-christopher-hero.png';
    portrait.alt = 'Theo and Christopher walking toward a monastery at sunset';
    portraitWrap.appendChild(portrait);
    panel.appendChild(portraitWrap);

    // Personalized greeting
    var greeting = global.document.createElement('h2');
    greeting.className = 'oe-hero-greeting';
    greeting.textContent = 'Welcome to The Orthodox Expedition, ' + name + '.';
    panel.appendChild(greeting);

    // Begin CTA (reuses existing primary CTA styling)
    var cta = global.document.createElement('button');
    cta.type = 'button';
    cta.className = 'oe-cta oe-cta-primary';
    cta.textContent = 'Begin \u2192';
    cta.addEventListener('click', function () {
      onBegin();
    });
    panel.appendChild(cta);

    modalRoot.appendChild(panel);
  }

  // ── Video panel ────────────────────────────────────────────────────
  // opts: { url, modalRoot, ctaLabel, onContinue, onDismiss }
  //   url:        full YouTube embed URL (without query string)
  //   modalRoot:  container element to fill
  //   ctaLabel:   text for the Continue button after the 5s gate
  //   onContinue: callback invoked when Continue is tapped
  //   onDismiss:  optional — callback for the top-right Skip button
  //               (only rendered if provided; week intro uses this,
  //               welcome flow does not — see _renderInstructionCards
  //               for welcome's skip)
  function _renderVideoPanel(opts) {
    var url = opts.url;
    var modalRoot = opts.modalRoot;
    var ctaLabel = opts.ctaLabel || 'Continue \u2192';
    var onContinue = opts.onContinue;
    var onDismiss = opts.onDismiss;

    modalRoot.innerHTML = '';

    var panel = global.document.createElement('div');
    panel.className = 'oe-welcome-panel oe-video-panel';

    // Optional skip button (week intro only)
    if (typeof onDismiss === 'function') {
      var skip = global.document.createElement('button');
      skip.type = 'button';
      skip.className = 'oe-skip oe-cta-disabled';
      skip.textContent = 'Skip';
      skip.setAttribute('aria-label', 'Skip introduction video');
      skip.disabled = true;
      skip.addEventListener('click', function () {
        if (skip.disabled) return;
        onDismiss();
      });
      panel.appendChild(skip);
      global.setTimeout(function () {
        skip.disabled = false;
        skip.classList.remove('oe-cta-disabled');
      }, 5000);
    }

    // Video frame
    var videoWrap = global.document.createElement('div');
    videoWrap.className = 'oe-video-wrap';

    var iframe = global.document.createElement('iframe');
    iframe.className = 'oe-video-iframe';
    iframe.src = url + EMBED_PARAMS;
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'Orthodox Expedition introduction video');
    iframe.setAttribute('frameborder', '0');
    videoWrap.appendChild(iframe);
    panel.appendChild(videoWrap);

    // Graceful-fallback hint — surfaces only if the iframe never fires
    // a load event within 5 seconds (unreliable network, blocked by an
    // extension, etc). Doesn't auto-dismiss; the Continue button below
    // is the path forward in all cases.
    var loaded = false;
    iframe.addEventListener('load', function () { loaded = true; });
    iframe.addEventListener('error', function () {
      videoWrap.innerHTML = '';
      var fb = global.document.createElement('div');
      fb.className = 'oe-video-fallback';
      fb.textContent = 'The video could not load. Tap Continue when ready.';
      videoWrap.appendChild(fb);
    });
    global.setTimeout(function () {
      if (!loaded) {
        var hint = global.document.createElement('div');
        hint.className = 'oe-video-hint';
        hint.textContent = 'If the video does not play, tap Continue.';
        panel.appendChild(hint);
      }
    }, 5000);

    // Continue button — disabled for first 5 seconds (ADHD-friendly
    // pacing gate), then becomes the primary CTA.
    var cta = global.document.createElement('button');
    cta.type = 'button';
    cta.className = 'oe-cta oe-cta-primary oe-cta-disabled';
    cta.textContent = 'Watching\u2026';
    cta.disabled = true;
    cta.addEventListener('click', function () {
      if (cta.disabled) return;
      onContinue();
    });
    panel.appendChild(cta);

    global.setTimeout(function () {
      cta.disabled = false;
      cta.classList.remove('oe-cta-disabled');
      cta.textContent = ctaLabel;
    }, 5000);

    modalRoot.appendChild(panel);
  }

  // ── Instruction-cards panel (welcome flow only, after video) ───────
  // opts: { modalRoot, name, onComplete }
  function _renderInstructionCards(opts) {
    var modalRoot = opts.modalRoot;
    var name = opts.name || 'Nolan';
    var onComplete = opts.onComplete;

    modalRoot.innerHTML = '';
    var currentIndex = 0;

    var panel = global.document.createElement('div');
    panel.className = 'oe-welcome-panel oe-cards-panel';

    // Skip button (top-right) — disabled for first 5s. Tapping it
    // dismisses the entire flow (sets onboarding_state.welcome_completed_at).
    var skip = global.document.createElement('button');
    skip.type = 'button';
    skip.className = 'oe-skip oe-cta-disabled';
    skip.textContent = 'Skip';
    skip.setAttribute('aria-label', 'Skip welcome and continue to home');
    skip.disabled = true;
    skip.addEventListener('click', function () {
      if (skip.disabled) return;
      onComplete();
    });
    panel.appendChild(skip);
    global.setTimeout(function () {
      skip.disabled = false;
      skip.classList.remove('oe-cta-disabled');
    }, 5000);

    // Card stage
    var stage = global.document.createElement('div');
    stage.className = 'oe-card-stage';
    panel.appendChild(stage);

    // Page indicator (4 dots)
    var indicator = global.document.createElement('div');
    indicator.className = 'oe-card-indicator';
    for (var i = 0; i < CARDS.length; i++) {
      var dot = global.document.createElement('span');
      dot.className = 'oe-card-dot';
      indicator.appendChild(dot);
    }
    panel.appendChild(indicator);

    // Card nav row
    var navRow = global.document.createElement('div');
    navRow.className = 'oe-card-nav-row';

    var prevBtn = global.document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'oe-cta oe-cta-secondary';
    prevBtn.textContent = '\u2190 Back';
    prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); });
    navRow.appendChild(prevBtn);

    var nextBtn = global.document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'oe-cta oe-cta-primary';
    nextBtn.textContent = 'Next \u2192';
    nextBtn.addEventListener('click', function () {
      if (currentIndex === CARDS.length - 1) {
        onComplete();
      } else {
        goTo(currentIndex + 1);
      }
    });
    navRow.appendChild(nextBtn);

    panel.appendChild(navRow);

    function _interpolate(template) {
      return String(template).split('{NAME}').join(name);
    }

    function renderCard(idx) {
      var card = CARDS[idx];
      var article = global.document.createElement('article');
      article.className = 'oe-card';

      var headline = global.document.createElement('h2');
      headline.className = 'oe-card-headline';
      headline.textContent = card.headlineTemplate
        ? _interpolate(card.headlineTemplate)
        : card.headline;
      article.appendChild(headline);

      if (card.subheadlineTemplate || card.subheadline) {
        var sub = global.document.createElement('div');
        sub.className = 'oe-card-subheadline';
        sub.textContent = card.subheadlineTemplate
          ? _interpolate(card.subheadlineTemplate)
          : card.subheadline;
        article.appendChild(sub);
      }

      if (card.bullets) {
        var ul = global.document.createElement('ul');
        ul.className = 'oe-card-list';
        card.bullets.forEach(function (b) {
          var li = global.document.createElement('li');
          li.textContent = b;
          ul.appendChild(li);
        });
        article.appendChild(ul);
      }

      if (card.body) {
        var bodyEl = global.document.createElement('p');
        bodyEl.className = 'oe-card-body oe-cross';
        bodyEl.textContent = card.body;
        article.appendChild(bodyEl);
      }

      stage.innerHTML = '';
      stage.appendChild(article);

      // Indicator state
      var dots = indicator.children;
      for (var i = 0; i < dots.length; i++) {
        if (i === idx) dots[i].classList.add('oe-card-dot-active');
        else dots[i].classList.remove('oe-card-dot-active');
      }

      // Nav button states
      prevBtn.style.visibility = (idx === 0) ? 'hidden' : 'visible';
      if (idx === CARDS.length - 1) {
        nextBtn.textContent = card.cta || 'Let\u2019s begin';
      } else {
        nextBtn.textContent = 'Next \u2192';
      }
    }

    function goTo(idx) {
      if (idx < 0 || idx >= CARDS.length) return;
      currentIndex = idx;
      renderCard(idx);
    }

    // Touch swipe — horizontal threshold 50px, ignore vertical drift.
    var touchStartX = null;
    var touchStartY = null;
    stage.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var endX = e.changedTouches[0].clientX;
      var endY = e.changedTouches[0].clientY;
      var dx = endX - touchStartX;
      var dy = endY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && currentIndex < CARDS.length - 1) goTo(currentIndex + 1);
        else if (dx > 0 && currentIndex > 0) goTo(currentIndex - 1);
      }
      touchStartX = null;
      touchStartY = null;
    });

    renderCard(0);
    modalRoot.appendChild(panel);
  }

  // ── Public API ─────────────────────────────────────────────────────
  // maybeShowWelcome({ sb, profileId, name })
  //   Returns a Promise that resolves when the flow completes (or
  //   immediately if any gate fails / state already seen / read errors).
  //   Required: sb (Supabase client), profileId.
  //   Optional: name (defaults to 'Nolan').
  async function maybeShowWelcome(opts) {
    opts = opts || {};
    var sb = opts.sb;
    var profileId = opts.profileId;
    var name = opts.name;

    if (!sb || !profileId) {
      console.warn('[welcome-flow] maybeShowWelcome: sb and profileId required');
      return;
    }
    if (typeof global.document === 'undefined') return;

    // Gate 1: launch date (America/New_York). Pre-launch = silent no-op,
    // ZERO Supabase calls.
    if (!_isLaunchDateOrLater()) return;

    // Gate 2: state lookup. Read failure (returns null) = silent no-show
    // (showing without write capability would create a re-show loop).
    var state = await _getOnboardingState(sb, profileId);
    if (state === null) return;
    if (state.welcome_completed_at) return;

    var resolvedName = (typeof name === 'string' && name.trim())
      ? String(name).trim().split(/\s+/)[0]
      : 'Nolan';

    return new Promise(function (resolve) {
      var start = function () {
        var modal = _renderModal();
        var root = modal.root;
        var dismiss = modal.dismiss;
        var completing = false; // guard against double-fire while await is in flight

        var completeFlow = async function () {
          if (completing) return;
          completing = true;
          // Try to mark seen; dismiss whether it succeeds or fails.
          // Worst case on write failure: modal re-shows on next launch.
          try {
            await _markWelcomeSeen(sb, profileId);
          } catch (e) {
            console.warn('[welcome-flow] mark welcome unexpected throw:', e);
          }
          dismiss();
          resolve();
        };

        var onVideoContinue = function () {
          _renderInstructionCards({
            modalRoot: root,
            name: resolvedName,
            onComplete: completeFlow
          });
        };

        var onHeroBegin = function () {
          _renderVideoPanel({
            url: VIDEOS.welcome,
            modalRoot: root,
            ctaLabel: 'Continue \u2192',
            onContinue: onVideoContinue
            // No onDismiss for welcome video — Skip lives on the cards panel.
          });
        };

        // Chat 4 — hero frame is now the first scene; on Begin →
        // video → cards. Preserves entire existing flow downstream.
        _renderHeroFrame({
          modalRoot: root,
          name: resolvedName,
          onBegin: onHeroBegin
        });
      };

      if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', start, { once: true });
      } else {
        start();
      }
    });
  }

  // maybeShowWeekIntro({ sb, profileId, weekNum? })
  //   weekNum optional; auto-derives from today's date relative to
  //   LAUNCH_DATE_ISO if omitted. Returns a Promise.
  async function maybeShowWeekIntro(opts) {
    opts = opts || {};
    var sb = opts.sb;
    var profileId = opts.profileId;
    var weekNum = opts.weekNum;

    if (!sb || !profileId) {
      console.warn('[welcome-flow] maybeShowWeekIntro: sb and profileId required');
      return;
    }
    if (typeof global.document === 'undefined') return;

    // Gate 1: launch date. Pre-launch _getCurrentWeekNumber() returns
    // null already, but guard explicitly for the weekNum-passed-in path.
    if (!_isLaunchDateOrLater()) return;

    // Resolve week number. Both branches are bounded to 1–4.
    var n = (typeof weekNum === 'number') ? weekNum : _getCurrentWeekNumber();
    if (!n || n < 1 || n > 4) return;

    var url = VIDEOS['week_' + n];
    if (!url) return;

    // Gate 2: state lookup. Read failure = silent no-show.
    var state = await _getOnboardingState(sb, profileId);
    if (state === null) return;
    if (state.week_intros_seen && state.week_intros_seen[String(n)]) return;

    return new Promise(function (resolve) {
      var start = function () {
        var modal = _renderModal();
        var root = modal.root;
        var dismiss = modal.dismiss;
        var completing = false;

        var completeFlow = async function () {
          if (completing) return;
          completing = true;
          try {
            await _markWeekIntroSeen(sb, profileId, n);
          } catch (e) {
            console.warn('[welcome-flow] mark week ' + n + ' unexpected throw:', e);
          }
          dismiss();
          resolve();
        };

        _renderVideoPanel({
          url: url,
          modalRoot: root,
          ctaLabel: 'Continue \u2192',
          onContinue: completeFlow,
          onDismiss: completeFlow // Skip after 5s = Continue (both set flag)
        });
      };

      if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', start, { once: true });
      } else {
        start();
      }
    });
  }

  // ── Export ─────────────────────────────────────────────────────────
  global.WelcomeFlow = {
    maybeShowWelcome: maybeShowWelcome,
    maybeShowWeekIntro: maybeShowWeekIntro,
    _getOnboardingState: _getOnboardingState,
    _hasSeenWelcome: _hasSeenWelcome,
    _markWelcomeSeen: _markWelcomeSeen,
    _hasSeenWeekIntro: _hasSeenWeekIntro,
    _markWeekIntroSeen: _markWeekIntroSeen,
    _isLaunchDateOrLater: _isLaunchDateOrLater,
    _getCurrentWeekNumber: _getCurrentWeekNumber,
    _todayKeyET: _todayKeyET,
    _renderModal: _renderModal,
    _renderHeroFrame: _renderHeroFrame,
    _renderVideoPanel: _renderVideoPanel,
    _renderInstructionCards: _renderInstructionCards,
    _videos: VIDEOS,
    _cards: CARDS,
    _launchDate: LAUNCH_DATE_ISO
  };
})(typeof window !== 'undefined' ? window : this);
