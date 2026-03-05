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
   10. Preferences (localStorage)
   11. Smooth Scroll
   12. Modals
   13. Exploration Image Modal
   14. Scroll-to-Top Button
   15. Init
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
  lightGlow:        document.querySelector('.light-cursor-glow'),
  cursorDot:        document.querySelector('.cursor-dot'),
  themeToggle:      document.getElementById('theme-toggle'),
  quietToggle:      document.getElementById('quiet-toggle'),
  textSizeToggle:   document.getElementById('text-size-toggle'),
  scrollTopBtn:     document.getElementById('scroll-top-btn'),
  revealEls:        [...document.querySelectorAll('[data-reveal]')],
  revealStaggerEls: [...document.querySelectorAll('[data-reveal-stagger]')],
  explorationTriggers: [...document.querySelectorAll('.exploration-trigger')],
  explorationModalImage: document.getElementById('exploration-modal-image'),
  explorationModalCaption: document.getElementById('exploration-modal-caption'),
  projectImages:    [...document.querySelectorAll('.project-page .case-img')],
  sections:         [...document.querySelectorAll('section[id]')],
};

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  const isLight = nextTheme === 'light';

  state.theme = nextTheme;
  dom.html.setAttribute('data-theme', nextTheme);

  if (!dom.themeToggle) return;

  dom.themeToggle.classList.toggle('active', !isLight);

  const icon = dom.themeToggle.querySelector('i');
  if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';

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
  // Skip rendering effects if quiet mode or system reduced-motion
  if (!state.quietMode && !state.reducedMotion) {
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

    // --- Light cursor glow (light mode only, lerped for smoothness) ---
    if (dom.lightGlow && !isDark) {
      dom.lightGlow.style.left = `${state.reveal.x}px`;
      dom.lightGlow.style.top  = `${state.reveal.y}px`;
    }
  }

  requestAnimationFrame(runBackgroundLoop);
}

// Track whether user is in the hero section.
// Storm reveal only applies to hero (visual clarity on other sections).
function setupHeroObserver() {
  if (!dom.hero) return;

  const obs = new IntersectionObserver(
    (entries) => entries.forEach(e => { state.isInHero = e.isIntersecting; }),
    { threshold: 0 }
  );

  obs.observe(dom.hero);
}


/* ============================================
   4. NAVIGATION — SCROLL STATE
   Adds .scrolled class for visual elevation.
   Throttled via requestAnimationFrame flag.
   ============================================ */

function setupNavScroll() {
  if (!dom.nav) return;

  let pending = false;

  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      dom.nav.classList.toggle('scrolled', window.scrollY > 16);
      pending = false;
    });
  }, { passive: true });
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

  const opts = {
    threshold: 0.14,
    rootMargin: '0px 0px -50px 0px',
  };

  // Single elements with [data-reveal]
  if (dom.revealEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target); // Reveal only once
      });
    }, opts);

    dom.revealEls.forEach(el => obs.observe(el));
  }

  // Grid containers with [data-reveal-stagger]
  // The container gets in-view; CSS transition-delay staggers children
  if (dom.revealStaggerEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      });
    }, opts);

    dom.revealStaggerEls.forEach(el => obs.observe(el));
  }
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
      dom.quietToggle.setAttribute(
        'aria-label',
        state.quietMode ? 'Resume animations' : 'Pause animations'
      );
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
   11. PREFERENCES
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
  // Hard default: light mode unless the user explicitly chose otherwise.
  applyTheme('light');
  state.themeExplicit = false;

  // System reduced-motion takes priority over any saved preference
  if (state.reducedMotion) {
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

    // Apply theme
    if (
      prefs.themeExplicit === true &&
      prefs.theme &&
      ['light', 'dark'].includes(prefs.theme)
    ) {
      state.themeExplicit = true;
      applyTheme(prefs.theme);
    }

    // Apply quiet mode (don't override if reducedMotion already set it)
    if (prefs.quietMode && !state.quietMode) {
      state.quietMode = true;
      dom.body.classList.add('quiet-mode');
      if (dom.quietToggle) {
        dom.quietToggle.classList.add('active');
        dom.quietToggle.setAttribute('aria-label', 'Resume animations');
      }
    }

    // Apply large text
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
   10. SMOOTH SCROLLING
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
   11. MODALS (Blog posts)
   
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

function setupExplorationGallery() {
  if (!dom.explorationTriggers.length || !dom.explorationModalImage) return;

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
        <img id="project-modal-image" class="exploration-modal-image" src="" alt="">
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

  let pending = false;

  const updateVisibility = () => {
    dom.scrollTopBtn.classList.toggle('visible', window.scrollY > 420);
    pending = false;
  };

  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateVisibility);
  }, { passive: true });

  updateVisibility();

  dom.scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: state.reducedMotion ? 'auto' : 'smooth',
    });
  });
}


/* ============================================
   12. INIT
   Load → Apply prefs → Wire up all modules → Start loop.
   Order matters: prefs before controls, loop last.
   ============================================ */

function init() {
  // Apply saved user preferences before anything renders
  loadPreferences();

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
  setupScrollTopButton();
  setupLiquidMetal(); // Pointer-aware glow on buttons, socials, and controls

  // Start the single animation loop (storm + cursor + glow)
  // This replaces the two separate updateStormReveal() calls
  // that previously caused a double RAF loop.
  requestAnimationFrame(runBackgroundLoop);
}

// Run when DOM is ready
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
