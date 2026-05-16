/* ─────────────────────────────────────────────────────────────────
   Orthodox Expedition — Phase C
   js/vita-strip.js — Welcome Flow Vita Strip render component
   May 16, 2026

   PURPOSE
   Loads the static-JSON Vita Strip scene corpus from
   /docs/content/scenes/welcome-flow-v1.json and renders the 5-panel
   "Coming Home" sequence inside the welcome-flow modal. Replaces
   the Chat 4 placeholder hero frame (_renderHeroFrame, retired in
   this dispatch).

   Per orchestrator Phase C rulings:
     OQ-1 Path C — vertical scroll strip with progressive reveal
     OQ-2 Path C — replaces _renderHeroFrame; downstream flow
                   (video → instruction cards → completion) intact
     OQ-3 Path A — no per-panel tracking; existing
                   welcome_completed_at fires at flow end
     OQ-4 Path A — no skip during Vita Strip; tap to advance + Continue
     OQ-5 Path A — Panel 4 advance-affordance identical to others
                   (silence is in image, not chrome)
     OQ-6 Path A — 5 panel PNGs precached in sw.js v52
     OQ-7 Path A — closing flourish appears after Panel 5 reveal,
                   below the strip, Continue CTA chains forward
     PB-2 (Op Learning #30) — full-screen modal context: panels
                   render in vertical-stack layout (D1 §3.2
                   mobile-portrait pattern) scaled to modal width,
                   not the embedded-surface §3.2 iPad-portrait
                   22% horizontal pattern

   PUBLIC API
     VitaStrip.loadCorpus() async
       → Idempotent fetch + memoize. Returns
         { scene, panels: Map<id, panel>, flourish, raw }
       → Fail-soft on 404 / parse / network error: empty corpus,
         one console.debug breadcrumb, never throws.

     VitaStrip.render({ modalRoot, onComplete }) async
       → Renders the Vita Strip into modalRoot. Calls onComplete()
         when the user taps the Continue CTA after the closing
         flourish reveals. Fail-soft: if the corpus is unreachable
         OR the panels array is empty, calls onComplete() immediately
         so the welcome flow does not stall (consumer chains to the
         video step regardless).

   ARCHITECTURE LOCKS HONORED (D1 + D2 corpus metadata)
     §1.4 witness-only — bubbles overlay character-to-character
          dialogue only; "Tap to continue ▾" hint and Continue CTA
          live in structurally separate DOM nodes from speech
          bubbles, with no 2nd-person address baked into character
          dialogue
     §1.6 English-only — no Greek codepoints in this scene; GFS
          Neohellenic unicode-range fallthrough never engages
     §1.7 Father Nicholas deferred — speaker enum is
          "christopher" | "theo" | null only
     §1.8 Mom never authored as speaker — same speaker enum gate
     §11.7 Pascha-gold reservation — gold #C9A84C used only for
          structural ornament (bubble borders, closing flourish
          ornament ☩, corner fleurons, separators); no dialogue
          text in gold

   OPERATIONAL LEARNINGS HONORED
     #3  Discovery before code — module shape mirrors Chat 23
         js/field-journal-static.js after live audit
     #13 Graceful absence — fail-soft, no thrown errors, no
         console noise beyond one debug breadcrumb on 404
     #16 Structural fit not concept fit — vita-strip.js mirrors
         field-journal-static.js because the data SHAPE matches
         (per-occurrence static corpus, no per-family RLS, no
         admin authoring UI); the loader pattern is identical, the
         render component is new
     #30 Spec contextual scaling — D1 §3.2 22% iPad-portrait pattern
         is correct for embedded Vita Strip surfaces; this
         full-screen modal context uses the §3.2 mobile-portrait
         vertical-stack pattern scaled up to modal width (per
         orchestrator PB-2 ruling)

   GRACEFUL DEGRADATION
   Absent or unreachable JSON:
     • loadCorpus resolves to empty {scene:null, panels:Map(), flourish:null, raw:null}
     • render() immediately calls onComplete() so the welcome flow
       chains forward to the video step
     • Welcome flow continues to the video without ever showing the
       strip — user still completes the flow via video + cards
   ───────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  // ── CONSTANTS ────────────────────────────────────────────────────

  // Same path prefix the service worker uses for STATIC_ASSETS so
  // this is served from cache when offline (sw.js v52+).
  var JSON_URL =
    '/Orthodox-Expedition-/docs/content/scenes/welcome-flow-v1.json';

  // Reveal fade duration (matches D1 §3.4 "~150ms gentle fade").
  var REVEAL_FADE_MS = 150;

  // After the closing flourish appears, a brief settling pause
  // before the Continue CTA enables — so Nolan reads the caption
  // before the next tap target lights up.
  var FLOURISH_SETTLE_MS = 1200;

  // ── MODULE STATE (memoized) ──────────────────────────────────────

  var _corpus = null;           // resolved corpus or empty-corpus
  var _corpusPromise = null;    // in-flight fetch promise

  function _emptyCorpus() {
    return {
      scene:    null,
      panels:   new Map(),   // id (number) → panel object
      flourish: null,
      raw:      null
    };
  }

  function _prefersReducedMotion() {
    try {
      return global.matchMedia &&
        global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_e) {
      return false;
    }
  }

  // ── CORPUS LOAD (mirrors field-journal-static.js loader pattern) ─

  // Public: load and memoize the corpus. Idempotent. Fail-soft on
  // every error mode — returns empty corpus, never throws.
  async function loadCorpus() {
    if (_corpus) return _corpus;
    if (!_corpusPromise) {
      _corpusPromise = fetch(JSON_URL, { cache: 'default' })
        .then(function (r) {
          if (r.status === 404) {
            try {
              console.debug('[vita-strip] corpus not yet authored (404)');
            } catch (_e) {}
            return null;
          }
          if (!r.ok) {
            try {
              console.debug('[vita-strip] corpus HTTP ' + r.status);
            } catch (_e) {}
            return null;
          }
          return r.json();
        })
        .catch(function (_e) {
          // Network or parse failure — silent breadcrumb only.
          try {
            console.debug('[vita-strip] corpus fetch failed (graceful)');
          } catch (_eb) {}
          return null;
        });
    }

    var data;
    try {
      data = await _corpusPromise;
    } catch (_e) {
      data = null;
    }

    if (!data || !Array.isArray(data.panels) || data.panels.length === 0) {
      _corpus = _emptyCorpus();
      return _corpus;
    }

    var panels = new Map();
    data.panels.forEach(function (p) {
      if (!p || typeof p.id !== 'number') return;
      panels.set(p.id, p);
    });

    _corpus = {
      scene: {
        scene_id:       data.scene_id,
        title:          data.title,
        occasion:       data.occasion,
        target_surface: data.target_surface,
        panel_count:    data.panel_count
      },
      panels:   panels,
      flourish: data.closing_flourish || null,
      raw:      data
    };
    return _corpus;
  }

  // ── DOM HELPERS ─────────────────────────────────────────────────

  function _el(tag, className, textContent) {
    var node = global.document.createElement(tag);
    if (className) node.className = className;
    if (textContent != null) node.textContent = textContent;
    return node;
  }

  // Build a single panel DOM node. The panel is hidden by default
  // (caller adds the .oe-vs-revealed class to show it). Panel 1 is
  // revealed immediately by the orchestration code below.
  function _buildPanel(panel) {
    var article = _el('article', 'oe-vs-panel oe-vs-hidden');
    article.setAttribute('data-panel-id', String(panel.id));
    if (panel.silent === true) {
      article.setAttribute('data-silent', '1');
    }

    var img = global.document.createElement('img');
    img.className = 'oe-vs-image';
    img.src = panel.image_url;
    img.alt = panel.alt_text || '';
    // Hint to the browser: panel 1 is critical, the rest can be
    // lazy if the browser prefers (we precache via sw, so this is
    // mainly a tiny hint to deprioritize off-screen decoding).
    if (panel.id > 1) {
      img.loading = 'lazy';
      img.decoding = 'async';
    }
    article.appendChild(img);

    // Speech bubble overlay — only when speaker AND dialogue exist.
    // Per D2 §1 + OQ-5 ruling: Panel 4 silent:true → no bubble at all.
    if (panel.speaker && panel.dialogue_text && !panel.silent) {
      var bubble = _el('div',
        'oe-vs-bubble' +
        ' oe-vs-bubble-' + panel.speaker +
        ' oe-vs-bubble-' + (panel.bubble_position || 'upper-right'),
        panel.dialogue_text
      );
      bubble.setAttribute('role', 'note');
      bubble.setAttribute('aria-label',
        (panel.speaker.charAt(0).toUpperCase() + panel.speaker.slice(1)) +
        ' says: ' + panel.dialogue_text);
      article.appendChild(bubble);
    }

    return article;
  }

  // Build the closing flourish DOM (ornament + caption). Hidden by
  // default; caller reveals after Panel 5 fades in.
  function _buildClosingFlourish(flourish) {
    var wrap = _el('div', 'oe-vs-flourish oe-vs-hidden');
    wrap.setAttribute('role', 'note');
    wrap.setAttribute('aria-label', 'Closing benediction');

    var ornament = _el('div', 'oe-vs-ornament',
      flourish.ornament || '\u2629');
    wrap.appendChild(ornament);

    var caption = _el('p', 'oe-vs-caption',
      flourish.caption_en || 'Glory to God for all things.');
    wrap.appendChild(caption);

    return wrap;
  }

  // ── PUBLIC: render ──────────────────────────────────────────────
  // Renders the Vita Strip into modalRoot. opts:
  //   modalRoot:   container element to fill (from _renderModal())
  //   onComplete:  callback fired when user taps Continue after the
  //                closing flourish reveals. Chains to the video step.
  async function render(opts) {
    opts = opts || {};
    var modalRoot = opts.modalRoot;
    var onComplete = typeof opts.onComplete === 'function'
      ? opts.onComplete
      : function () {};

    if (!modalRoot) {
      // Defensive: caller forgot the modalRoot. Don't stall the flow.
      onComplete();
      return;
    }

    // Wipe any prior content (matches existing welcome-flow.js
    // step-render convention).
    modalRoot.innerHTML = '';

    // Outer panel wrapper — matches the .oe-welcome-panel convention.
    // The .oe-vita-panel modifier overrides justify-content so a
    // tall strip scrolls naturally inside the modal.
    var panel = _el('div', 'oe-welcome-panel oe-vita-panel');

    // The strip itself (the scroll container's content).
    var strip = _el('section', 'oe-vita-strip');
    strip.setAttribute('aria-label', 'Welcome scene: Coming Home');
    strip.setAttribute('role', 'region');

    // Four outer corner fleurons (D1 §3.2: outer corners of the
    // strip, NOT every panel intersection). Vertical-stack layout
    // maps "four outer corners" to TL/TR/BL/BR of the entire column.
    ['tl', 'tr', 'bl', 'br'].forEach(function (which) {
      strip.appendChild(_el('span',
        'oe-vs-corner oe-vs-corner-' + which, '\u2629'));
    });

    // Try to load the corpus. If it fails or is empty, gracefully
    // chain forward to onComplete without ever rendering.
    var corpus = await loadCorpus();
    if (!corpus || !corpus.panels || corpus.panels.size === 0) {
      onComplete();
      return;
    }

    // Sort panel IDs (corpus.panels is a Map keyed by id number)
    var panelIds = Array.from(corpus.panels.keys()).sort(function (a, b) {
      return a - b;
    });
    if (panelIds.length === 0) {
      onComplete();
      return;
    }

    // Build all panel nodes (all hidden initially); between-panel
    // separators interleaved per D1 §3.2.
    var panelNodes = [];
    panelIds.forEach(function (id, idx) {
      var p = corpus.panels.get(id);
      var node = _buildPanel(p);
      strip.appendChild(node);
      panelNodes.push(node);

      // Separator between panels (not after the final panel).
      if (idx < panelIds.length - 1) {
        var sep = _el('div', 'oe-vs-separator');
        sep.appendChild(_el('span', 'oe-vs-sep-ornament', '\u2629'));
        strip.appendChild(sep);
      }
    });

    // Closing flourish (built but hidden until final panel revealed).
    var flourishNode = null;
    if (corpus.flourish) {
      flourishNode = _buildClosingFlourish(corpus.flourish);
      strip.appendChild(flourishNode);
    }

    // Tap-to-continue hint (positioned beneath the most-recently
    // revealed panel; moved on each advance; removed when no more
    // panels remain).
    var tapHint = _el('button', 'oe-vs-tap-hint',
      'Tap to continue \u25be');
    tapHint.type = 'button';
    tapHint.setAttribute('aria-label', 'Reveal next scene');

    // Continue CTA — hidden initially; revealed after the closing
    // flourish + a brief settle pause.
    var cta = _el('button', 'oe-cta oe-cta-primary oe-vs-hidden',
      'Continue \u2192');
    cta.type = 'button';
    var completing = false;
    cta.addEventListener('click', function () {
      if (completing) return;
      if (cta.disabled) return;
      completing = true;
      onComplete();
    });

    // Assemble: strip in scroll wrap; CTA below.
    var scrollWrap = _el('div', 'oe-vs-scroll');
    scrollWrap.appendChild(strip);
    panel.appendChild(scrollWrap);
    panel.appendChild(tapHint);
    panel.appendChild(cta);
    modalRoot.appendChild(panel);

    // ── REVEAL ORCHESTRATION ──────────────────────────────────────
    // Reduced-motion path: reveal everything at once.
    if (_prefersReducedMotion()) {
      panelNodes.forEach(function (n) {
        n.classList.remove('oe-vs-hidden');
        n.classList.add('oe-vs-revealed', 'oe-vs-no-motion');
      });
      if (flourishNode) {
        flourishNode.classList.remove('oe-vs-hidden');
        flourishNode.classList.add('oe-vs-revealed', 'oe-vs-no-motion');
      }
      tapHint.remove();
      cta.classList.remove('oe-vs-hidden');
      return;
    }

    // Animated path: progressive reveal, tap-to-advance.
    var revealedCount = 0;   // number of panels currently visible
    var total = panelNodes.length;

    function placeTapHintAfter(node) {
      if (!node || !node.parentNode) return;
      // Insert tapHint right after node (uses panel's parent, .oe-welcome-panel)
      panel.insertBefore(tapHint, cta);
    }

    function scrollToShowNode(node) {
      if (!node || !scrollWrap || !scrollWrap.scrollTo) {
        if (node && node.scrollIntoView) {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      // Smooth-scroll within the scrollWrap so the just-revealed
      // node sits comfortably in view.
      try {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_e) {
        node.scrollIntoView(false);
      }
    }

    function revealNextPanel() {
      if (revealedCount >= total) return;
      var node = panelNodes[revealedCount];
      node.classList.remove('oe-vs-hidden');
      // Force a paint so the fade-in transition engages cleanly.
      // (Reading offsetWidth is the canonical force-reflow idiom.)
      // eslint-disable-next-line no-unused-expressions
      node.offsetWidth;
      node.classList.add('oe-vs-revealed');
      revealedCount += 1;
      scrollToShowNode(node);

      if (revealedCount >= total) {
        // Final panel revealed — drop the tap hint and reveal the
        // closing flourish + Continue CTA after a settle pause.
        try { tapHint.remove(); } catch (_e) {}
        global.setTimeout(function () {
          if (flourishNode) {
            flourishNode.classList.remove('oe-vs-hidden');
            // eslint-disable-next-line no-unused-expressions
            flourishNode.offsetWidth;
            flourishNode.classList.add('oe-vs-revealed');
            scrollToShowNode(flourishNode);
          }
          global.setTimeout(function () {
            cta.classList.remove('oe-vs-hidden');
            // eslint-disable-next-line no-unused-expressions
            cta.offsetWidth;
            cta.classList.add('oe-vs-revealed');
            scrollToShowNode(cta);
          }, FLOURISH_SETTLE_MS);
        }, REVEAL_FADE_MS + 50);
      } else {
        // More panels remain — reposition the tap hint to invite
        // the next tap.
        placeTapHintAfter(node);
      }
    }

    // Tap targets for advancing: the tap hint itself, and the
    // strip surface (so a tap anywhere on the visible strip
    // advances). Each handler is idempotent against
    // already-revealed state via the revealNextPanel guard.
    tapHint.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      revealNextPanel();
    });
    strip.addEventListener('click', function (e) {
      // Ignore clicks on a speech bubble — bubbles are read targets,
      // not advance targets (defensive against bubbling weirdness).
      var t = e.target;
      while (t && t !== strip) {
        if (t.classList && t.classList.contains('oe-vs-bubble')) {
          // Still advance — D1 §3.4 says "tap anywhere → panel 2"
          break;
        }
        t = t.parentNode;
      }
      revealNextPanel();
    });

    // Initial reveal: Panel 1 visible from start (no tap required).
    revealNextPanel();
  }

  // ── PUBLIC API EXPORT ───────────────────────────────────────────

  var VitaStrip = {
    loadCorpus: loadCorpus,
    render:     render,
    // Exposed for tests / introspection only:
    _prefersReducedMotion: _prefersReducedMotion
  };

  if (typeof global !== 'undefined') {
    global.VitaStrip = VitaStrip;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VitaStrip;
  }
})(typeof window !== 'undefined' ? window : this);
