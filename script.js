/* ============================================
   PORTFOLIO — script.js
   Uma Dhamija

   Modules:
   1.  State
   2.  DOM Cache
   3.  Background Loop (single RAF for all cursor effects)
   4.  Hero Visibility Observer
   5.  Navigation — Scroll State
   6.  Navigation — Mobile Toggle
   7.  Navigation — Active Link Tracking
   8.  Scroll Reveal (IntersectionObserver)
   9.  Accessibility Controls
   10. Button Glow Tracking
   11. Project Tilt
   12. Preferences (localStorage)
   13. Smooth Scroll
   14. Modals
   15. Exploration Image Modal
   16. Scroll-to-Top Button
   17. Init
   ============================================ */

'use strict';


/* ============================================
   1. STATE
   Single source of truth — no scattered globals.
   ============================================ */

const state = {
  mouse:    { x: window.innerWidth / 2,  y: window.innerHeight / 2 },
  reveal:   { x: window.innerWidth / 2,  y: window.innerHeight / 2 },
  target:   { x: window.innerWidth / 2,  y: window.innerHeight / 2 },
  isInHero: true,
  navOpen:  false,
  // introCovering: true while the intro-screen opaquely covers the page,
  // so anything tied to the reveal (see revealPageEffects()) can wait
  // instead of playing out unseen behind it.
  introCovering: false,
  heroSettleInPlayed: false,
  pendingTypeGrid: null,
  // System preference — checked once at load
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  // User preferences (populated by loadPreferences())
  theme:     'light',
  themeExplicit: false,
  quietMode: false,
  largeText: false,
};


/* ============================================
   2. DOM CACHE
   Query once, store references.
   Null-checks happen at point of use.
   ============================================ */

const dom = {
  html:             document.documentElement,
  body:             document.body,
  nav:              document.querySelector('.site-nav'),
  navToggle:        document.querySelector('.nav-toggle'),
  navLinks:         document.querySelector('.nav-links'),
  navLinksAll:      [...document.querySelectorAll('.nav-links a')],
  hero:             document.getElementById('hero'),
  stormReveal:      document.querySelector('.storm-reveal'),
  cursorDot:        document.querySelector('.cursor-dot'),
  magneticEls:      [...document.querySelectorAll('.btn, .social-link, .control-btn')],
  themeToggle:      document.getElementById('theme-toggle'),
  quietToggle:      document.getElementById('quiet-toggle'),
  textSizeToggle:   document.getElementById('text-size-toggle'),
  scrollTopBtn:     document.getElementById('scroll-top-btn'),
  revealEls:        [...document.querySelectorAll('[data-reveal]')],
  revealStaggerEls: [...document.querySelectorAll('[data-reveal-stagger]')],
  explorationTriggers: [...document.querySelectorAll('.exploration-trigger')],
  explorationModalImage: document.getElementById('exploration-modal-image'),
  explorationModalCaption: document.getElementById('exploration-modal-caption'),
  projectImages:    [...document.querySelectorAll('.project-page .case-img, .project-page .kindred-hero-banner img, .project-page .case-hero-banner img, .project-page .case-hero-banner--breakout img, .project-page .project-image, .project-page .process-grid img')],
  sections:         [...document.querySelectorAll('section[id]')],
};

// Tilt reset registry (used when quiet-mode toggles on)
const tiltResetters = new Set();

function registerTiltResetter(fn) {
  if (typeof fn === 'function') tiltResetters.add(fn);
}

function resetTiltCards() {
  tiltResetters.forEach((reset) => reset());
}

function debounce(fn, delay = 100) {
  let timeoutId = null;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  const isLight = nextTheme === 'light';

  state.theme = nextTheme;
  dom.html.setAttribute('data-theme', nextTheme);

  if (!dom.themeToggle) return;

  dom.themeToggle.classList.toggle('active', !isLight);

  const icon = dom.themeToggle.querySelector('i');
  if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';

  const label = dom.themeToggle.querySelector('.control-label');
  if (label) label.textContent = isLight ? 'Dark' : 'Light';

  dom.themeToggle.setAttribute(
    'aria-label',
    isLight ? 'Switch to dark mode' : 'Switch to light mode'
  );
}


/* ============================================
   3. BACKGROUND LOOP
   
   Single requestAnimationFrame loop handles ALL
   mouse-tracking effects:
   - Storm reveal (dark mode): lerped mask-image spotlight
   - Cursor dot (dark mode): direct position
   - Aurora glow (light mode): lerped radial warmth
   
   Using lerp (linear interpolation) for smooth,
   eased movement — easing = 0.12 gives a natural
   "drag" quality without being too sluggish.

   Performance notes:
   - Only updates mask-image when in hero + dark mode
   - Uses will-change on relevant elements (CSS)
   - Single RAF vs multiple setIntervals
   ============================================ */

function setupMouseTracking() {
  document.addEventListener('mousemove', (e) => {
    state.target.x = e.clientX;
    state.target.y = e.clientY;
  }, { passive: true });
}

function runBackgroundLoop() {
  // Skip rendering effects on mobile, quiet mode, or system reduced-motion
  if (!state.quietMode && !state.reducedMotion && window.innerWidth >= 768) {
    const easing = 0.12;
    state.reveal.x += (state.target.x - state.reveal.x) * easing;
    state.reveal.y += (state.target.y - state.reveal.y) * easing;

    const isDark = dom.html.getAttribute('data-theme') !== 'light';

    // --- Storm reveal (dark mode only, hero only) ---
    if (dom.stormReveal && isDark && state.isInHero) {
      const radius = 130;
      const mask = `radial-gradient(
        circle ${radius}px at ${state.reveal.x}px ${state.reveal.y}px,
        rgba(0,0,0,0.92) 0%,
        rgba(0,0,0,0.55) 40%,
        rgba(0,0,0,0) 100%
      )`;
      dom.stormReveal.style.maskImage = mask;
      dom.stormReveal.style.webkitMaskImage = mask;
    }

    // --- Cursor dot — shown in BOTH modes ---
    if (dom.cursorDot) {
      dom.cursorDot.style.left = `${state.target.x}px`;
      dom.cursorDot.style.top  = `${state.target.y}px`;
    }

    // --- Magnetic elements — nearby buttons/social/control icons lean toward the cursor ---
    runMagneticButtons();
  }

  requestAnimationFrame(runBackgroundLoop);
}

const MAGNET_RADIUS = 90; // px — how close the cursor needs to be to start pulling
const MAGNET_STRENGTH = 10; // px — max lean at dead-center, main CTA buttons
const MAGNET_STRENGTH_SUBTLE = 4; // px — social links + accessibility controls (60% less)

function runMagneticButtons() {
  if (!dom.magneticEls.length) return;

  dom.magneticEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return; // hidden (e.g. inside a closed modal)

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = state.target.x - cx;
    const dy = state.target.y - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < MAGNET_RADIUS) {
      const strength = (el.classList.contains('social-link') || el.classList.contains('control-btn'))
        ? MAGNET_STRENGTH_SUBTLE
        : MAGNET_STRENGTH;
      const pull = (1 - dist / MAGNET_RADIUS) * strength;
      const angle = Math.atan2(dy, dx);
      el.style.setProperty('--magnet-x', `${(Math.cos(angle) * pull).toFixed(2)}px`);
      el.style.setProperty('--magnet-y', `${(Math.sin(angle) * pull).toFixed(2)}px`);
    } else if (el.style.getPropertyValue('--magnet-x')) {
      el.style.removeProperty('--magnet-x');
      el.style.removeProperty('--magnet-y');
    }
  });
}


// Track whether user is in the hero section.
// Storm reveal only applies to hero (visual clarity on other sections).
function setupHeroObserver() {
  if (!dom.hero) return;

  const obs = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      state.isInHero = e.isIntersecting;

      // First time the hero is actually scrolled into view (usually via the
      // About tab, since setupBioTab() lands on Work by default) — play a
      // one-time blur/scale settle-in on the glass card.
      if (e.isIntersecting && !state.heroSettleInPlayed && !state.reducedMotion && !state.quietMode) {
        state.heroSettleInPlayed = true;
        dom.body.classList.add('intro-active');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          dom.body.classList.remove('intro-active');
        }));
      }
    }),
    { threshold: 0 }
  );

  obs.observe(dom.hero);
}


/* ============================================
   4. NAVIGATION — SCROLL STATE
   Adds .scrolled class for visual elevation.
   On mobile, hides accessibility controls to save space.
   ============================================ */

function setupNavScroll() {
  if (!dom.nav) return;

  const updateNavState = () => {
    dom.nav.classList.toggle('scrolled', window.scrollY > 16);

    // On mobile: hide accessibility controls once user has scrolled past
    // the initial area; only show again when back near the top.
    if (window.innerWidth < 768) {
      const accessibilityControls = document.querySelector('.accessibility-controls');
      if (accessibilityControls) {
        accessibilityControls.classList.toggle('hidden', window.scrollY > 150);
      }
    }
  };

  window.addEventListener('scroll', debounce(updateNavState, 100), { passive: true });
  updateNavState();
}


/* ============================================
   5. NAVIGATION — MOBILE TOGGLE
   Hamburger ↔ X animation.
   Closes on: link click, Escape key, outside tap.
   Returns focus to toggle on close (WCAG 2.2).
   ============================================ */

function setupMobileNav() {
  if (!dom.navToggle || !dom.navLinks) return;

  const openNav = () => {
    state.navOpen = true;
    dom.navToggle.setAttribute('aria-expanded', 'true');
    dom.navLinks.classList.add('open');
    dom.body.style.overflow = 'hidden'; // Prevent scroll behind nav
  };

  const closeNav = (returnFocus = true) => {
    state.navOpen = false;
    dom.navToggle.setAttribute('aria-expanded', 'false');
    dom.navLinks.classList.remove('open');
    dom.body.style.overflow = '';
    // Return focus to toggle for keyboard users
    if (returnFocus) dom.navToggle.focus();
  };

  dom.navToggle.addEventListener('click', () => {
    state.navOpen ? closeNav(false) : openNav();
  });

  // Close when any nav link is clicked
  dom.navLinksAll.forEach(link => {
    link.addEventListener('click', () => closeNav(false));
  });

  // Close on Escape key — WCAG 2.1 SC 1.4.13
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.navOpen) closeNav();
  });
}


/* ============================================
   6. NAVIGATION — ACTIVE LINK TRACKING
   Uses IntersectionObserver on sections.
   Updates aria-current="true" on matching nav links.
   ============================================ */

function setupActiveLinks() {
  if (!dom.sections.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute('id');

        dom.navLinksAll.forEach(link => {
          const href = link.getAttribute('href') ?? '';
          // Match both #id and /path#id formats
          const active = href === `#${id}` || href.endsWith(`#${id}`);
          link.setAttribute('aria-current', active ? 'true' : 'false');
        });
      });
    },
    {
      threshold: 0.3,
      rootMargin: '-10% 0px -55% 0px',
    }
  );

  dom.sections.forEach(s => obs.observe(s));
}


/* ============================================
   7. SCROLL REVEAL
   Single-element and staggered grid variants.
   Unobserves after triggering — fire once only.
   Skipped entirely if reducedMotion = true.
   ============================================ */

function setupScrollReveal() {
  // CSS handles immediate visibility for reduced-motion users
  if (state.reducedMotion) return;

  // Single-element reveals: require 14% visible before firing
  const singleOpts = {
    threshold: 0.14,
    rootMargin: '0px 0px -50px 0px',
  };

  // Stagger grid reveals: fire as soon as 1px is visible so the first
  // row of cards (which peeks at the bottom of the viewport on load)
  // is never invisible on initial render
  const staggerOpts = {
    threshold: 0.01,
    rootMargin: '0px 0px 0px 0px',
  };

  if (dom.revealEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      });
    }, singleOpts);

    dom.revealEls.forEach(el => obs.observe(el));
  }

  if (dom.revealStaggerEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');

        // Project titles type themselves in once their card has settled.
        // If the intro-screen cover is still up, queue it instead of
        // typing it out unseen — revealPageEffects() releases it.
        if (entry.target.classList.contains('projects-grid')) {
          if (state.introCovering) {
            state.pendingTypeGrid = entry.target;
          } else {
            typeProjectTitles(entry.target);
          }
        }

        obs.unobserve(entry.target);
      });
    }, staggerOpts);

    dom.revealStaggerEls.forEach(el => obs.observe(el));
  }
}

// Types each project card's <h3> in, left to right, staggered to land
// right as its card finishes settling (mirrors the CSS stagger-delay
// steps: 0, 85, 170ms...). Reuses the .intro-cursor blink already
// established on the intro screen. Fires once, called from
// setupScrollReveal() (or revealPageEffects() if it was queued).
function typeProjectTitles(grid) {
  const cards = [...grid.querySelectorAll('.project-card')];
  const CHAR_MS = 16;
  const START_OFFSET = 480; // let the card's own fade/slide settle first

  cards.forEach((card, i) => {
    const h3 = card.querySelector('h3');
    if (!h3) return;
    const text = h3.textContent.trim();
    const delay = i * 85 + START_OFFSET;

    window.setTimeout(() => {
      h3.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'intro-cursor';
      h3.appendChild(cursor);

      let charIndex = 0;
      function typeNext() {
        charIndex++;
        h3.textContent = text.slice(0, charIndex);
        h3.appendChild(cursor);
        if (charIndex < text.length) {
          window.setTimeout(typeNext, CHAR_MS);
        } else {
          cursor.classList.add('intro-cursor-done');
          window.setTimeout(() => cursor.remove(), 400);
        }
      }
      typeNext();
    }, delay);
  });
}


/* ============================================
   8. ACCESSIBILITY CONTROLS
   ============================================ */

function setupAccessibilityControls() {

  // --- Theme Toggle ---
  if (dom.themeToggle) {
    dom.themeToggle.addEventListener('click', () => {
      const currentlyLight = dom.html.getAttribute('data-theme') === 'light';
      const newTheme = currentlyLight ? 'dark' : 'light';
      state.themeExplicit = true;
      applyTheme(newTheme);

      savePreferences();
    });
  }

  // --- Quiet Mode Toggle ---
  if (dom.quietToggle) {
    dom.quietToggle.addEventListener('click', () => {
      state.quietMode = !state.quietMode;
      dom.body.classList.toggle('quiet-mode', state.quietMode);
      dom.quietToggle.classList.toggle('active', state.quietMode);
      updateQuietIcon();
      resetTiltCards();
      savePreferences();
    });
  }

  // --- Text Size Toggle ---
  if (dom.textSizeToggle) {
    dom.textSizeToggle.addEventListener('click', () => {
      state.largeText = !state.largeText;
      dom.body.classList.toggle('large-text', state.largeText);
      dom.textSizeToggle.classList.toggle('active', state.largeText);
      dom.textSizeToggle.setAttribute(
        'aria-label',
        state.largeText ? 'Reduce text size' : 'Increase text size'
      );
      savePreferences();
    });
  }
}


/* ============================================
   10. BUTTON GLOW TRACKING
   
   Each control tracks mouse position within its
   own bounds, then sets --btn-mx / --btn-my as
   percentages. CSS ::before uses these to position
   a subtle radial highlight under the cursor.
   ============================================ */

function setupLiquidMetal() {
  const targets = document.querySelectorAll('.btn, .social-link, .control-btn');

  targets.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      el.style.setProperty('--btn-mx', `${x}%`);
      el.style.setProperty('--btn-my', `${y}%`);
    }, { passive: true });

    // Reset glow to center on mouse leave
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--btn-mx', '50%');
      el.style.setProperty('--btn-my', '50%');
    }, { passive: true });
  });
}


/* ============================================
   11. PROJECT TILT (Cards + Panels)
   Subtle parallax tilt + ambient gradient tracking.
   Skips if reducedMotion or quietMode enabled.
   ============================================ */

function setupTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length) return;

  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amt) => start + (end - start) * amt;

  const supportsPointer = 'PointerEvent' in window;
  const enterEvent = supportsPointer ? 'pointerenter' : 'mouseenter';
  const moveEvent = supportsPointer ? 'pointermove' : 'mousemove';
  const leaveEvent = supportsPointer ? 'pointerleave' : 'mouseleave';

  cards.forEach(card => {
    let rafId = null;
    let rect = null;
    let isActive = false;
    const parsedMax = Number(card.dataset.tiltMax);
    const maxTilt = Number.isFinite(parsedMax) ? parsedMax : 8;
    const ease = 0.18;

    let currentTiltX = 0;
    let currentTiltY = 0;
    let currentGlowX = 50;
    let currentGlowY = 50;

    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetGlowX = 50;
    let targetGlowY = 50;

    const reset = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      card.classList.remove('is-tilting');
      isActive = false;
      rect = null;
      currentTiltX = 0;
      currentTiltY = 0;
      currentGlowX = 50;
      currentGlowY = 50;
      targetTiltX = 0;
      targetTiltY = 0;
      targetGlowX = 50;
      targetGlowY = 50;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--glow-x', '50%');
      card.style.setProperty('--glow-y', '50%');
    };

    registerTiltResetter(reset);

    const updateTargetsFromEvent = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const y = clamp(e.clientY - rect.top, 0, rect.height);
      const pctX = x / rect.width;
      const pctY = y / rect.height;

      targetTiltY = (pctX - 0.5) * 2 * maxTilt;
      targetTiltX = (0.5 - pctY) * 2 * maxTilt;
      targetGlowX = pctX * 100;
      targetGlowY = pctY * 100;
    };

    const tick = () => {
      if (state.reducedMotion || state.quietMode) {
        reset();
        return;
      }

      currentTiltX = lerp(currentTiltX, targetTiltX, ease);
      currentTiltY = lerp(currentTiltY, targetTiltY, ease);
      currentGlowX = lerp(currentGlowX, targetGlowX, ease);
      currentGlowY = lerp(currentGlowY, targetGlowY, ease);

      card.style.setProperty('--tilt-x', `${currentTiltX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${currentTiltY.toFixed(2)}deg`);
      card.style.setProperty('--glow-x', `${currentGlowX.toFixed(1)}%`);
      card.style.setProperty('--glow-y', `${currentGlowY.toFixed(1)}%`);

      const tiltSettled = Math.abs(targetTiltX - currentTiltX) < 0.01
        && Math.abs(targetTiltY - currentTiltY) < 0.01;
      const glowSettled = Math.abs(targetGlowX - currentGlowX) < 0.1
        && Math.abs(targetGlowY - currentGlowY) < 0.1;

      if (!isActive && tiltSettled && glowSettled) {
        reset();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const handleEnter = (e) => {
      if (state.reducedMotion || state.quietMode) {
        reset();
        return;
      }
      card.classList.add('is-tilting');
      rect = card.getBoundingClientRect();
      isActive = true;
      updateTargetsFromEvent(e);
      start();
    };

    const handleMove = (e) => {
      if (!isActive) return;
      updateTargetsFromEvent(e);
    };

    const handleLeave = () => {
      isActive = false;
      rect = null;
      targetTiltX = 0;
      targetTiltY = 0;
      targetGlowX = 50;
      targetGlowY = 50;
      start();
    };

    card.addEventListener(enterEvent, handleEnter, { passive: true });
    card.addEventListener(moveEvent, handleMove, { passive: true });
    card.addEventListener(leaveEvent, handleLeave, { passive: true });
    if (supportsPointer) {
      card.addEventListener('pointercancel', handleLeave, { passive: true });
    }
    card.addEventListener('focusout', handleLeave);
  });
}


/* ============================================
   12. PREFERENCES
   localStorage key namespaced to avoid collisions.
   Fails silently if storage is unavailable
   (private browsing, storage quota exceeded, etc.)
   ============================================ */

const PREF_KEY = 'uma-dhamija-prefs-v1';

function savePreferences() {
  try {
    const prefs = {
      quietMode: state.quietMode,
      largeText: state.largeText,
    };

    // Persist theme only after an explicit user choice.
    if (state.themeExplicit) {
      prefs.theme = state.theme;
      prefs.themeExplicit = true;
    }

    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch (_) { /* Fail silently */ }
}

function loadPreferences() {
  applyTheme('light');
  state.themeExplicit = false;

  const isMobile = window.innerWidth < 768;

  // Auto-enable quiet mode on mobile devices and reduced-motion systems.
  // Saved user preferences can override this below.
  if (state.reducedMotion || isMobile) {
    state.quietMode = true;
    dom.body.classList.add('quiet-mode');
    if (dom.quietToggle) {
      dom.quietToggle.classList.add('active');
      dom.quietToggle.setAttribute('aria-label', 'Resume animations');
    }
  }

  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return;

    const prefs = JSON.parse(raw);

    if (
      prefs.themeExplicit === true &&
      prefs.theme &&
      ['light', 'dark'].includes(prefs.theme)
    ) {
      state.themeExplicit = true;
      applyTheme(prefs.theme);
    }

    // Respect explicit user preference for quiet mode.
    // Never override system prefers-reduced-motion.
    if ('quietMode' in prefs && !state.reducedMotion) {
      state.quietMode = prefs.quietMode;
      dom.body.classList.toggle('quiet-mode', prefs.quietMode);
      if (dom.quietToggle) {
        dom.quietToggle.classList.toggle('active', prefs.quietMode);
        dom.quietToggle.setAttribute('aria-label',
          prefs.quietMode ? 'Resume animations' : 'Pause animations');
      }
    }

    if (prefs.largeText) {
      state.largeText = true;
      dom.body.classList.add('large-text');
      if (dom.textSizeToggle) {
        dom.textSizeToggle.classList.add('active');
        dom.textSizeToggle.setAttribute('aria-label', 'Reduce text size');
      }
    }
  } catch (_) { /* Corrupt storage — ignore and use defaults */ }
}


/* ============================================
   13. SMOOTH SCROLLING
   JS-controlled to respect reducedMotion state.
   Falls back to CSS scroll-behavior: smooth (set on html).
   ============================================ */

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      target.scrollIntoView({
        behavior: state.reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });

      // Update URL hash without triggering a jump
      history.pushState(null, '', href);
    });
  });
}

function setupContactSubmissionFlow() {
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    let nextInput = contactForm.querySelector('input[name="_next"]');
    if (!nextInput) {
      nextInput = document.createElement('input');
      nextInput.type = 'hidden';
      nextInput.name = '_next';
      contactForm.appendChild(nextInput);
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('contact', 'sent');
    nextUrl.hash = 'hero';
    nextInput.value = nextUrl.toString();
  }

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.get('contact') !== 'sent') return;

  // Clean URL first so refresh doesn't re-open the meme popup.
  currentUrl.searchParams.delete('contact');
  const cleanedUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  history.replaceState(null, '', cleanedUrl);

  openModal('contact-success-modal', null);
}


/* ============================================
   14. MODALS (Blog posts)
   
   Focus management:
   - On open: focus moves to close button
   - On close: focus returns to trigger element
   This satisfies WCAG 2.1 SC 2.4.3 (Focus Order)
   and 2.4.11 (Focus Appearance) via :focus-visible CSS.

   Note: For a production site, consider a
   full focus-trap implementation to prevent
   users from tabbing behind open modals.
   ============================================ */

function setupModals() {
  // Open via data-modal attribute
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      openModal(trigger.getAttribute('data-modal'), trigger);
    });

    // Support keyboard activation (enter/space on non-button elements)
    if (trigger.tagName !== 'BUTTON') {
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(trigger.getAttribute('data-modal'), trigger);
        }
      });
    }
  });

  // Close via close button
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  // Close on backdrop click (click on modal overlay, not content)
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Close on Escape key and trap Tab focus inside active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(closeModal);
      return;
    }

    if (e.key !== 'Tab' || !_activeModal) return;

    const focusable = getFocusableElements(_activeModal);
    if (!focusable.length) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// Store the element that opened the modal to restore focus on close
let _modalTrigger = null;
let _activeModal = null;

function getFocusableElements(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return [...container.querySelectorAll(selector)].filter((el) => {
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return el.offsetParent !== null || el === document.activeElement;
  });
}

function openModal(id, triggerEl) {
  const modal = document.getElementById(id);
  if (!modal) return;

  _modalTrigger = triggerEl ?? null;

  modal.classList.add('active');
  
  // Add blog-modal class for writing/blog content modals on mobile
  const isBlogModal = id && (id.includes('blog') || id.includes('writing'));
  if (isBlogModal) {
    modal.classList.add('blog-modal');
  }
  
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');
  modal.removeAttribute('aria-hidden');
  dom.body.style.overflow = 'hidden';
  _activeModal = modal;

  // Move focus into modal after animation frame
  requestAnimationFrame(() => {
    const focusable = getFocusableElements(modal);
    if (focusable.length) focusable[0].focus();
  });
}

function closeModal(modal) {
  modal.classList.remove('active');
  modal.classList.remove('blog-modal');
  modal.setAttribute('aria-hidden', 'true');
  dom.body.style.overflow = '';

  if (modal.id === 'exploration-image-modal' && dom.explorationModalImage) {
    dom.explorationModalImage.removeAttribute('src');
    dom.explorationModalImage.alt = '';
    if (dom.explorationModalCaption) dom.explorationModalCaption.textContent = '';
  }

  if (modal.id === 'project-image-modal') {
    const modalImage = modal.querySelector('#project-modal-image');
    const modalCaption = modal.querySelector('#project-modal-caption');
    if (modalImage) {
      modalImage.removeAttribute('src');
      modalImage.alt = '';
    }
    if (modalCaption) modalCaption.textContent = '';
  }

  // Return focus to the element that triggered the modal
  if (_modalTrigger) {
    _modalTrigger.focus();
    _modalTrigger = null;
  }

  _activeModal = document.querySelector('.modal.active');
}

function setupCarousel(carouselElement, cardSelector, onCardClick) {
  const track = carouselElement?.querySelector('.carousel-track');
  const prevBtn = carouselElement?.querySelector('.prev-btn');
  const nextBtn = carouselElement?.querySelector('.next-btn');
  const dots = carouselElement?.querySelector('.carousel-dots');
  const cards = [...carouselElement.querySelectorAll(cardSelector)];

  if (!carouselElement || !track || !dots || !cards.length) return;

  let activeIndex = Math.max(cards.findIndex(card => card.classList.contains('active')), 0);
  let touchStartX = 0;
  let touchStartY = 0;

  const normalizedDistance = (index) => {
    let distance = index - activeIndex;
    const halfway = Math.floor(cards.length / 2);

    if (distance > halfway) distance -= cards.length;
    if (distance < -halfway) distance += cards.length;

    return distance;
  };

  const setActiveIndex = (index) => {
    activeIndex = (index + cards.length) % cards.length;

    cards.forEach((card, cardIndex) => {
      const distance = normalizedDistance(cardIndex);
      const isActive = distance === 0;

      card.classList.remove('active', 'prev', 'prev2', 'next', 'next2', 'hidden');

      if (distance === 0) {
        card.classList.add('active');
      } else if (distance === -1) {
        card.classList.add('prev');
      } else if (distance === -2) {
        card.classList.add('prev2');
      } else if (distance === 1) {
        card.classList.add('next');
      } else if (distance === 2) {
        card.classList.add('next2');
      } else {
        card.classList.add('hidden');
      }

      card.setAttribute('tabindex', isActive ? '0' : '-1');
      card.setAttribute('aria-hidden', Math.abs(distance) > 2 ? 'true' : 'false');
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    [...dots.children].forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  };

  dots.innerHTML = '';
  cards.forEach((card, index) => {
    const label = card.getAttribute('data-image-alt') ?? card.getAttribute('aria-label') ?? `Item ${index + 1}`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to ${label}`);
    dot.addEventListener('click', () => setActiveIndex(index));
    dots.appendChild(dot);

    card.addEventListener('click', (event) => {
      if (index !== activeIndex) {
        event.preventDefault();
        setActiveIndex(index);
      }

      if (onCardClick) {
        onCardClick(card, event);
      }
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex(activeIndex - 1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex(activeIndex + 1);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (index === activeIndex) {
          if (onCardClick) {
            onCardClick(card, event);
          }
        } else {
          setActiveIndex(index);
        }
      }
    });
  });

  prevBtn?.addEventListener('click', () => setActiveIndex(activeIndex - 1));
  nextBtn?.addEventListener('click', () => setActiveIndex(activeIndex + 1));

  track.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  track.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    setActiveIndex(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
  }, { passive: true });

  setActiveIndex(activeIndex);
}

function setupExplorationGallery() {
  if (!dom.explorationTriggers.length || !dom.explorationModalImage) return;

  const carousel = document.querySelector('#explorations .carousel-3d');

  if (!carousel) {
    // Fallback for non-carousel layout
    dom.explorationTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const imageSrc = trigger.getAttribute('data-image-src');
        const imageAlt = trigger.getAttribute('data-image-alt') ?? 'Exploration image';
        if (!imageSrc) return;

        dom.explorationModalImage.src = imageSrc;
        dom.explorationModalImage.alt = imageAlt;
        if (dom.explorationModalCaption) dom.explorationModalCaption.textContent = imageAlt;

        openModal('exploration-image-modal', trigger);
      });
    });

    return;
  }

  const openExplorationImage = (trigger) => {
    const imageSrc = trigger.getAttribute('data-image-src');
    const imageAlt = trigger.getAttribute('data-image-alt') ?? 'Exploration image';
    if (!imageSrc) return;

    dom.explorationModalImage.src = imageSrc;
    dom.explorationModalImage.alt = imageAlt;
    if (dom.explorationModalCaption) dom.explorationModalCaption.textContent = imageAlt;

    openModal('exploration-image-modal', trigger);
  };

  setupCarousel(carousel, '.exploration-trigger', openExplorationImage);
}

function setupWritingCarousel() {
  const carousel = document.querySelector('#writing .carousel-3d');

  if (!carousel) return;

  const onWritingCardClick = (card) => {
    // Check if it's an external link
    const externalUrl = card.getAttribute('data-external');
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise trigger the modal (handled by setupModals via data-modal)
    const modalId = card.getAttribute('data-modal');
    if (modalId) {
      openModal(modalId, card);
    }
  };

  setupCarousel(carousel, '.writing-trigger', onWritingCardClick);
}

function setupProjectImageLightbox() {
  if (!dom.projectImages.length) return;

  let modal = document.getElementById('project-image-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal modal-image';
    modal.id = 'project-image-modal';
    modal.setAttribute('aria-labelledby', 'project-image-title');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-content exploration-modal-content" role="document">
        <button class="modal-close" aria-label="Close image">&times;</button>
        <h2 id="project-image-title">Project image</h2>
        <img id="project-modal-image" class="exploration-modal-image" src="" alt="" loading="lazy" decoding="async" width="1200" height="900">
        <p id="project-modal-caption" class="exploration-modal-caption"></p>
      </div>
    `;
    dom.body.appendChild(modal);
  }

  const modalImage = modal.querySelector('#project-modal-image');
  const modalCaption = modal.querySelector('#project-modal-caption');
  if (!modalImage) return;

  dom.projectImages.forEach((image, index) => {
    const label = image.alt?.trim() || `Project image ${index + 1}`;
    image.classList.add('expandable-media');
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', `Expand image: ${label}`);

    const openImageModal = () => {
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = label;
      if (modalCaption) modalCaption.textContent = label;
      openModal('project-image-modal', image);
    };

    image.addEventListener('click', openImageModal);
    image.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openImageModal();
      }
    });
  });
}

function setupScrollTopButton() {
  if (!dom.scrollTopBtn) {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.id = 'scroll-top-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.setAttribute('title', 'Scroll to top');
    btn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    dom.body.appendChild(btn);
    dom.scrollTopBtn = btn;
  }

  if (!dom.scrollTopBtn) return;

  const updateVisibility = () => {
    dom.scrollTopBtn.classList.toggle('visible', window.scrollY > 420);
  };

  window.addEventListener('scroll', debounce(updateVisibility, 100), { passive: true });

  updateVisibility();

  dom.scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: state.reducedMotion ? 'auto' : 'smooth',
    });
  });
}

function setupViewportMaintenance() {
  window.addEventListener('resize', debounce(() => {
    resetTiltCards();
  }, 100));
}


/* ============================================
   INTERACTIVE AURORA BLOBS
   Listen for clicks on profile-image to create
   fun, colorful expanding ripples behind the hero card.
   ============================================ */

function setupInteractiveAuroraBlobs() {
  if (window.innerWidth < 768) return;

  const profileImage = document.querySelector('.profile-image');
  const blobsContainer = document.getElementById('aurora-blobs-container');

  if (!profileImage || !blobsContainer) return;

  // Warm aurora colors: deep orange, pink, golden yellow, magenta
  const colors = ['blob-orange', 'blob-pink', 'blob-yellow', 'blob-magenta'];

  // Create delicate wind chime-like sound with resonance
  function playChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      masterGain.gain.setValueAtTime(0.12, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      
      // Wind chime tones - pure, resonant bell-like notes
      const chimes = [
        { freq: 440, start: 0, duration: 1.5 },      // A4 - main tone
        { freq: 660, start: 0.05, duration: 1.3 },   // E5 - harmonic
        { freq: 293, start: 0.1, duration: 1.8 }     // D4 - bass resonance
      ];
      
      chimes.forEach(({ freq, start, duration }) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        
        const oscillatorGain = audioCtx.createGain();
        oscillatorGain.gain.setValueAtTime(0.3, now + start);
        oscillatorGain.gain.exponentialRampToValueAtTime(0.05, now + start + duration);
        
        osc.connect(oscillatorGain);
        oscillatorGain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      // Silently fail if audio context is not available
    }
  }

  profileImage.addEventListener('click', () => {
    if (state.quietMode) return; // Respect quiet mode
    
    // Play a subtle chime
    playChime();
    
    // Get hero section dimensions for relative positioning
    const hero = document.getElementById('hero');
    if (!hero) return;
    
    const heroRect = hero.getBoundingClientRect();
    
    // Create multiple blobs per click for more intense splashes
    const blobCount = 3 + Math.floor(Math.random() * 3); // 3-5 blobs per click
    
    for (let i = 0; i < blobCount; i++) {
      // Stagger the blob creation for cascading effect
      setTimeout(() => {
        // Random position within the hero section (but keep blobs behind the card)
        const randomX = Math.random() * heroRect.width;
        const randomY = Math.random() * heroRect.height * 0.8; // Bias towards upper half
        
        // Random blob size (350-550px diameter for big splashes)
        const blobSize = 350 + Math.random() * 200;
        
        // Pick a random color
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Create blob element
        const blob = document.createElement('div');
        blob.className = `aurora-blob ${randomColor}`;
        blob.style.left = `${randomX}px`;
        blob.style.top = `${randomY}px`;
        blob.style.width = `${blobSize}px`;
        blob.style.height = `${blobSize}px`;
        
        blobsContainer.appendChild(blob);
        
        // Remove blob after animation completes (2 seconds)
        setTimeout(() => {
          blob.remove();
        }, 2000);
      }, i * 80); // 80ms delay between each blob for cascade effect
    }
  });

  // Also allow mousedown for extra interactivity
  profileImage.addEventListener('mousedown', (e) => {
    // Visual feedback: slight scale down
    profileImage.style.transform = 'scale(0.98)';
  });

  profileImage.addEventListener('mouseup', () => {
    profileImage.style.transform = '';
  });

  profileImage.addEventListener('mouseleave', () => {
    profileImage.style.transform = '';
  });
}




/* ============================================
   19. VIBE-CODED BADGE — fades on scroll
   ============================================ */

function setupVibeBadge() {
  const badge = document.getElementById('vibe-badge');
  if (!badge) return;

  let lastScrollY = -1;

  function updateBadge() {
    const scrolled = window.scrollY > 60;
    if (scrolled !== (lastScrollY > 60)) {
      badge.classList.toggle('scrolled-away', scrolled);
    }
    lastScrollY = window.scrollY;
  }

  window.addEventListener('scroll', debounce(updateBadge, 80), { passive: true });
  updateBadge();
}


/* ============================================
   20. WRITING — STACKED CARD DECK
   ============================================ */

function setupWritingDeck() {
  const stack = document.getElementById('writing-stack');
  if (!stack) return;

  const cards = [...stack.querySelectorAll('.deck-card')];
  const prevBtn = stack.querySelector('.deck-prev');
  const nextBtn = stack.querySelector('.deck-next');
  const dotsContainer = stack.querySelector('.deck-dots');
  const viewport = stack.querySelector('.deck-viewport');

  if (!cards.length || !dotsContainer || !viewport) return;

  let activeIndex = 0;
  let isAnimating = false;

  // Build dots
  dotsContainer.innerHTML = '';
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'deck-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to article ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function updatePositions() {
    const count = cards.length;
    cards.forEach((card, i) => {
      // Skip the card currently exiting — it manages its own state
      if (card.classList.contains('deck-exit')) return;

      let pos = (i - activeIndex + count) % count;
      const maxVisible = 2;
      const finalPos = pos > maxVisible ? -1 : pos;
      card.setAttribute('data-deck-pos', finalPos);
      card.setAttribute('tabindex', finalPos === 0 ? '0' : '-1');
      card.setAttribute('aria-hidden', finalPos === 0 ? 'false' : 'true');
    });

    [...dotsContainer.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
      dot.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });
  }

  function goTo(index) {
    if (isAnimating) return;
    const prevIndex = activeIndex;
    activeIndex = (index + cards.length) % cards.length;
    if (prevIndex === activeIndex) return;

    isAnimating = true;
    const leavingCard = cards[prevIndex];

    // Remove from stack positioning and apply exit animation
    leavingCard.removeAttribute('data-deck-pos');
    leavingCard.classList.add('deck-exit');

    // Update all remaining cards immediately
    updatePositions();

    setTimeout(() => {
      leavingCard.classList.remove('deck-exit');
      // Assign it a hidden position in the new stack order
      const count = cards.length;
      const pos = (prevIndex - activeIndex + count) % count;
      leavingCard.setAttribute('data-deck-pos', pos > 2 ? '-1' : pos);
      leavingCard.setAttribute('tabindex', '-1');
      leavingCard.setAttribute('aria-hidden', 'true');
      isAnimating = false;
    }, 400);
  }

  function next() { goTo(activeIndex + 1); }
  function prev() { goTo(activeIndex - 1); }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // Card click: advance if not front, open if front
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('deck-exit')) return;
      const pos = card.getAttribute('data-deck-pos');
      if (pos !== '0') { goTo(i); return; }
      activateCard(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && card.getAttribute('data-deck-pos') === '0') {
        e.preventDefault();
        activateCard(card);
      }
    });
  });

  function activateCard(card) {
    const externalUrl = card.dataset.external;
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const modalId = card.dataset.modal;
    if (modalId) openModal(modalId, card);
  }

  // Touch / drag swipe
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 48) {
      deltaX < 0 ? next() : prev();
    }
  }, { passive: true });

  updatePositions();
}


/* ============================================
   21. RESUME MODAL
   Desktop: opens inline PDF in modal.
   Mobile (touch or narrow): opens PDF in new tab.
   ============================================ */

function setupResumeModal() {
  const resumeModal = document.getElementById('resume-modal');
  const resumePdfUrl = '/Uma_Dhamija_Resume.pdf';

  // Subpages have no modal — just open the PDF in a new tab
  if (!resumeModal) {
    document.querySelectorAll('[data-action="view-resume"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(resumePdfUrl, '_blank', 'noopener');
      });
    });
    return;
  }

  const isMobile = (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.innerWidth < 640
  );

  const viewer = document.getElementById('resume-viewer');
  const mobileFallback = document.getElementById('resume-mobile-fallback');

  if (isMobile && viewer && mobileFallback) {
    viewer.style.display = 'none';
    mobileFallback.style.display = 'flex';
    mobileFallback.removeAttribute('aria-hidden');

    document.querySelectorAll('[data-action="view-resume"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(resumePdfUrl, '_blank', 'noopener');
      });
    });
    return;
  }

  // Desktop + homepage: open modal
  document.querySelectorAll('[data-action="view-resume"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('resume-modal', btn);
    });
  });
}


/* ============================================
   22. QUIET-MODE ICON — play/pause toggle
   ============================================ */

function updateQuietIcon() {
  const quietToggle = dom.quietToggle;
  if (!quietToggle) return;

  const icon = quietToggle.querySelector('i');
  if (!icon) return;

  if (state.quietMode) {
    icon.className = 'fas fa-play';
    quietToggle.setAttribute('aria-label', 'Resume animations');
  } else {
    icon.className = 'fas fa-pause';
    quietToggle.setAttribute('aria-label', 'Pause animations');
  }
}


/* ============================================
   16a. INTRO LOADING SCREEN
   Types out Uma's intro text on first visit per
   session, then fades to reveal the work section.

   Flow:
   1. Inline <script> in <head> adds html.intro-skip
      immediately if sessionStorage says already seen.
   2. setupIntroScreen() bails early if skip class
      is present OR if reduced-motion is active.
   3. Otherwise: types text char-by-char, then fades.
   4. Any click (or Skip button) completes immediately.
   5. sessionStorage key set before fade starts.
   ============================================ */

// Fires once the page is actually visible to the visitor — either right
// away (intro screen skipped/hidden) or the moment the intro-screen cover
// finishes fading. Releases any project title typing that was queued up
// while covered, so it never plays out invisibly behind the opaque screen.
function revealPageEffects() {
  if (state.pendingTypeGrid) {
    typeProjectTitles(state.pendingTypeGrid);
    state.pendingTypeGrid = null;
  }
}

function setupIntroScreen() {
  const screen = document.getElementById('intro-screen');
  if (!screen) { revealPageEffects(); return; }

  // Skip for reduced-motion users and mobile — purely decorative
  if (state.reducedMotion || window.innerWidth < 768) {
    screen.classList.add('intro-hidden');
    revealPageEffects();
    return;
  }

  // Already seen this session (set by inline script in <head>)
  if (document.documentElement.classList.contains('intro-skip')) {
    screen.classList.add('intro-hidden');
    revealPageEffects();
    return;
  }

  // From here on the cover is actually showing — hold off on anything
  // that should be seen, not spent finishing behind it.
  state.introCovering = true;

  const typedEl = document.getElementById('intro-typed');
  const cursor  = screen.querySelector('.intro-cursor');
  const skipBtn = screen.querySelector('.intro-skip-btn');

  const TEXT      = 'designing technology for better services';
  const CHAR_MS   = 25;   // ms per character
  const END_PAUSE = 900;  // ms to hold completed text before fading

  let isDone  = false;
  let isFading = false;

  function fadeOut() {
    if (isFading) return;
    isFading = true;
    try { sessionStorage.setItem('intro-seen', 'true'); } catch (_) {}
    screen.classList.add('intro-fade');
    state.introCovering = false;
    revealPageEffects();
    screen.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') screen.classList.add('intro-hidden');
    }, { once: true });
  }

  function finish() {
    if (isDone) return;
    isDone = true;
    if (typedEl) typedEl.textContent = TEXT;
    if (cursor)  cursor.classList.add('intro-cursor-done');
    fadeOut();
  }

  let charIndex = 0;

  function typeNext() {
    if (isDone) return;
    charIndex++;
    if (typedEl) typedEl.textContent = TEXT.slice(0, charIndex);

    if (charIndex < TEXT.length) {
      window.setTimeout(typeNext, CHAR_MS);
    } else {
      isDone = true;
      if (cursor) cursor.classList.add('intro-cursor-done');
      window.setTimeout(fadeOut, END_PAUSE);
    }
  }

  skipBtn?.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
  screen.addEventListener('click', finish, { once: true });

  window.setTimeout(typeNext, 350);
}


/* ============================================
   16b. BIO TAB
   Scroll page to work section on load so work
   is immediately visible. A small straight tab
   slides in from the left edge when the hero is
   above the viewport; clicking it scrolls back.
   ============================================ */

function setupBioTab() {
  const hero  = document.getElementById('hero');
  const work  = document.getElementById('work');
  const tab   = document.getElementById('bio-tab');

  if (!hero || !work) return;

  // Prevent browser from restoring a prior scroll position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Instantly skip past the hero so work is the first thing visible.
  // Direct scrollTop assignment bypasses css scroll-behavior: smooth entirely.
  const navEl = document.querySelector('.site-nav');
  const navH  = navEl ? navEl.offsetHeight : 64;
  document.documentElement.scrollTop = Math.max(0, work.offsetTop - navH);

  // Show/hide the tab based on hero visibility.
  // rootMargin shrinks the observation zone by navH at top, so the hero
  // counts as "not visible" even when its last few pixels are behind the nav.
  if (tab) {
    const isMobileView = window.innerWidth < 768;
    let bioTabTimer = null;

    const heroObs = new IntersectionObserver(
      ([entry]) => {
        const shouldShow = !entry.isIntersecting;
        tab.classList.toggle('bio-tab-visible', shouldShow);

        // On mobile: auto-hide bio-tab after 3 s so it doesn't crowd the screen
        if (isMobileView) {
          if (bioTabTimer) { clearTimeout(bioTabTimer); bioTabTimer = null; }
          if (shouldShow) {
            bioTabTimer = setTimeout(() => {
              tab.classList.remove('bio-tab-visible');
            }, 3000);
          }
        }
      },
      { threshold: 0, rootMargin: `-${navH + 1}px 0px 0px 0px` }
    );
    heroObs.observe(hero);

    // Click → smooth scroll back to top
    tab.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: (state.reducedMotion || state.quietMode) ? 'auto' : 'smooth',
      });
    });
  }
}



/* ============================================
   18. INIT
   Load → Apply prefs → Wire up all modules → Start loop.
   Order matters: prefs before controls, loop last.
   ============================================ */

function init() {
  // Apply saved user preferences before anything renders
  loadPreferences();

  // Show intro screen (covers page while setupBioTab scrolls to work behind it)
  setupIntroScreen();

  // Wire up all interactions
  setupMouseTracking();
  setupHeroObserver();
  setupNavScroll();
  setupMobileNav();
  setupActiveLinks();
  setupScrollReveal();
  setupAccessibilityControls();
  setupSmoothScroll();
  setupProjectImageLightbox();
  setupModals();
  setupContactSubmissionFlow();
  setupExplorationGallery();
  setupWritingDeck();      // replaces setupWritingCarousel
  setupScrollTopButton();
  setupViewportMaintenance();
  setupTiltCards();
  setupBioTab();
  setupLiquidMetal();
  setupInteractiveAuroraBlobs();
  setupVibeBadge();
  setupResumeModal();
  updateQuietIcon();

  // Start the single animation loop
  requestAnimationFrame(runBackgroundLoop);
}

// Run when DOM is ready
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
