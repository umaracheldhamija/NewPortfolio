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
  heroSettleInPlayed: false,
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
  work:             document.getElementById('work'),
  splashCanvas:     document.getElementById('splash-canvas'),
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

function runBackgroundLoop(now) {
  // Skip rendering effects on mobile, quiet mode, or system reduced-motion,
  // and while a page transition is running (index.html sets the flag) so
  // the card-to-story morph gets the whole frame budget.
  if (!state.quietMode && !state.reducedMotion && window.innerWidth >= 768 && !window.__vtRunning) {
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

    // --- Living watercolor splash field ---
    drawSplashField(now);
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


/* ============================================
   3b. LIVING WATERCOLOR SPLASH FIELD
   One fixed, full-viewport canvas — same architecture as .bg-layer —
   so there is no per-section boundary to clip against. Blooms live
   in document coordinates and are drawn at (worldY - scrollY) each
   frame, so they scroll naturally with the page while the canvas
   itself never resizes or gets cut at a section edge. That's what
   makes Hero → Work feel continuous rather than fragmented.

   All the expensive work — SVG feTurbulence/feDisplacementMap for the
   wet, deckled bleeding edge; layered multi-tone radial pigments; a
   desaturated turbulence pass for paper grain; salt speckles;
   satellite splatter droplets — happens ONCE per design, and once per
   colourway (honey → apricot → clay, read from the --splash-* tokens
   in styles.css), building an
   SVG string and rasterizing it into an Image. That build is sliced
   across requestIdleCallback (buildSplashLibrary()) so it never blocks
   load or first interaction. The per-frame draw never touches
   turbulence or gradients again: a bloom is two drawImage() calls —
   the two bracketing colourways, cross-fading as it expands so the
   pigment appears to shift hue. Drawn from inside
   runBackgroundLoop(), so it inherits the same quiet-mode /
   reduced-motion / mobile guards as everything else there.
   ============================================ */

// Colours live in styles.css (the --splash-* tokens are comma-separated
// lists), so the palette is defined once. The script is deferred, so the
// stylesheet has already loaded by the time this runs.
function readCssColorList(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name).split(',').map((c) => c.trim()).filter(Boolean);
}

// Each geometry is rasterized once per colourway; a bloom cross-fades
// along this list as it expands, so the pigment appears to shift hue
// (honey → apricot → clay) while it spreads. All three share
// turbulence geometry, so the cross-fade is pixel-aligned — a
// colour morph, not a visible double image.
const SPLASH_COLORWAYS = ['--splash-1', '--splash-2', '--splash-3'].map(readCssColorList);
const SPLASH_SPECKLE = readCssColorList('--white')[0] || 'white';
const SPLASH_ART_SIZE = 460;  // viewBox units — see renderSplashSVG()
const SPLASH_RASTER   = 540;  // px the SVG is rasterized at (kept modest — blooms
                              // are heavily blurred, so upscaling is invisible and
                              // smaller sprites keep the per-frame draw cheap)
const SPLASH_DESIGN_COUNT = 4;

// Final on-screen ink strength. Deliberately low — the field is a tonal
// haze, not paint. Bump these two if it reads too faint.
const SPLASH_PEAK_DARK  = 0.30;
const SPLASH_PEAK_LIGHT = 0.36;
const SPLASH_START_SCALE = 0.34; // ambient blooms open from here, never a hard dot
const SPLASH_CREEP_CAP   = 1.7;  // how far past full size a bloom keeps wicking

// A click lands a small, saturated drop that sits for a beat, then
// releases outward and dilutes into the ambient field.
const SPLASH_CLICK_START_SCALE = 0.10;
const SPLASH_CLICK_PUNCH_MS    = 620;  // how long the concentrated drop lasts
const SPLASH_CLICK_PUNCH_AMP   = 2.6;  // peak alpha multiplier at the moment of impact

// The ambient system keeps its presence low — a separate, higher
// ceiling only exists so a click can still add one on top without being
// blocked by the ambient cap; those extras fade out on their own after.
const SPLASH_AMBIENT_MAX = 2;
const SPLASH_MAX_BLOOMS = 5;
const SPLASH_SPAWN_MIN = 4500, SPLASH_SPAWN_MAX = 9000;

let splashCtx = null;
let splashW = 0, splashH = 0, splashDPR = 1;
let splashDocHeight = 0;
let splashHeroWorkBottom = 0; // px from document top to bottom of #work — the "landing" zone
let splashImages = []; // { imgs: [colorway Image, ...], ready }
let splashBlooms = [];
let splashLastSpawn = 0;
let splashNextSpawnDelay = 0;

function splashRnd(min, max) { return min + Math.random() * (max - min); }

function sizeSplashCanvas() {
  if (!dom.splashCanvas) return;
  if (!splashCtx) splashCtx = dom.splashCanvas.getContext('2d');
  // Cap at 1.5 — the field is soft/blurred, so full retina backing store
  // buys nothing visible and just makes every drawImage fill more pixels.
  splashDPR = Math.min(window.devicePixelRatio || 1, 1.5);
  splashW = window.innerWidth;
  splashH = window.innerHeight;
  dom.splashCanvas.width = splashW * splashDPR;
  dom.splashCanvas.height = splashH * splashDPR;
  dom.splashCanvas.style.width = splashW + 'px';
  dom.splashCanvas.style.height = splashH + 'px';
  splashCtx.setTransform(splashDPR, 0, 0, splashDPR, 0, 0);
}

function computeSplashDocMetrics() {
  splashDocHeight = document.body.scrollHeight;
  splashHeroWorkBottom = dom.work ? (dom.work.offsetTop + dom.work.offsetHeight) : splashDocHeight * 0.4;
}

// One design = a fixed set of overlapping ellipses + a fixed turbulence
// seed. renderSplashSVG() paints that same geometry in a given colourway;
// building all colourways off ONE geometry is what lets the runtime
// cross-fade between them without ghosting.
function buildSplashGeometry(seed) {
  const size = SPLASH_ART_SIZE;
  const cx = size * splashRnd(0.44, 0.5), cy = size * splashRnd(0.44, 0.5);
  const maxR = size * splashRnd(0.30, 0.36);

  // Salt speckles — crisp white flecks scattered across the wash, NOT
  // run through the turbulence filter. Fixed here so all three
  // colourways of this design carry the exact same texture.
  const speckles = [];
  const speckleCount = 22 + Math.floor(Math.random() * 14);
  for (let i = 0; i < speckleCount; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * maxR * 0.78;
    speckles.push({
      x: cx + Math.cos(a) * d,
      y: cy + Math.sin(a) * d * 0.85,
      r: splashRnd(0.6, 2.2),
      o: splashRnd(0.2, 0.55),
    });
  }

  // Satellite splatter droplets around the perimeter — same turbulence
  // filter as the main body so their edges match. colourIdx picks which
  // colourway slot they take, so they shift hue with the wash.
  const satellites = [];
  const satCount = 9 + Math.floor(Math.random() * 6);
  for (let i = 0; i < satCount; i++) {
    const a = Math.random() * Math.PI * 2, d = maxR * splashRnd(0.95, 1.6);
    const r = Math.random() < 0.78 ? splashRnd(2, 6) : splashRnd(7, 12);
    satellites.push({
      x: cx + Math.cos(a) * d,
      y: cy + Math.sin(a) * d * 0.9,
      rx: r,
      ry: r * splashRnd(0.7, 1),
      ci: Math.floor(Math.random() * 4),
      o: splashRnd(0.22, 0.46),
    });
  }

  return {
    seed,
    e1: { cx: cx - maxR * 0.10, cy: cy - maxR * 0.06, rx: maxR * 1.00, ry: maxR * 0.88 },
    e2: { cx: cx + maxR * 0.20, cy: cy + maxR * 0.16, rx: maxR * 0.84, ry: maxR * 0.72 },
    e3: { cx: cx + maxR * 0.14, cy: cy - maxR * 0.22, rx: maxR * 0.74, ry: maxR * 0.70 },
    e4: { cx: cx - maxR * 0.24, cy: cy + maxR * 0.12, rx: maxR * 0.66, ry: maxR * 0.62 },
    freqX: splashRnd(0.009, 0.014),
    freqY: splashRnd(0.013, 0.019),
    dispScale: splashRnd(34, 46),
    speckles,
    satellites,
  };
}

// A single soft wash — layered radial pigments, one wet deckled edge
// (feTurbulence + feDisplacementMap), satellite splatter droplets, salt
// speckles, and a whisper of paper grain.
function renderSplashSVG(g, colors) {
  const size = SPLASH_ART_SIZE;
  const s = g.seed;
  const grad = (id, c, cxp, cyp, r, o0) => `
      <radialGradient id="${id}" cx="${cxp}%" cy="${cyp}%" r="${r}%">
        <stop offset="0%" stop-color="${c}" stop-opacity="${o0}"/>
        <stop offset="52%" stop-color="${c}" stop-opacity="${(o0 * 0.42).toFixed(3)}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
      </radialGradient>`;
  const ell = (e, id) => `<ellipse cx="${e.cx.toFixed(1)}" cy="${e.cy.toFixed(1)}" rx="${e.rx.toFixed(1)}" ry="${e.ry.toFixed(1)}" fill="url(#${id})"/>`;

  const satelliteEls = g.satellites.map((sp) =>
    `<ellipse cx="${sp.x.toFixed(1)}" cy="${sp.y.toFixed(1)}" rx="${sp.rx.toFixed(1)}" ry="${sp.ry.toFixed(1)}" fill="${colors[sp.ci]}" fill-opacity="${sp.o.toFixed(2)}" filter="url(#f${s})"/>`
  ).join('');
  const speckleEls = g.speckles.map((sp) =>
    `<circle cx="${sp.x.toFixed(1)}" cy="${sp.y.toFixed(1)}" r="${sp.r.toFixed(1)}" fill="${SPLASH_SPECKLE}" fill-opacity="${sp.o.toFixed(2)}"/>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SPLASH_RASTER}" height="${SPLASH_RASTER}" viewBox="0 0 ${size} ${size}">
    <defs>
      <filter id="f${s}" x="-80%" y="-80%" width="260%" height="260%">
        <feTurbulence type="fractalNoise" baseFrequency="${g.freqX.toFixed(4)} ${g.freqY.toFixed(4)}" numOctaves="4" seed="${s}" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="${g.dispScale.toFixed(0)}" xChannelSelector="R" yChannelSelector="G"/>
        <feGaussianBlur stdDeviation="2.6"/>
      </filter>
      <filter id="grain${s}" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${s + 40}" result="grain"/>
        <feColorMatrix in="grain" type="saturate" values="0"/>
      </filter>
      ${grad(`g${s}a`, colors[0], 36, 34, 78, 0.80)}
      ${grad(`g${s}b`, colors[1], 64, 40, 70, 0.60)}
      ${grad(`g${s}c`, colors[2], 52, 66, 70, 0.58)}
      ${grad(`g${s}d`, colors[3], 34, 60, 64, 0.48)}
      <clipPath id="clip${s}">
        <ellipse cx="${g.e1.cx.toFixed(1)}" cy="${g.e1.cy.toFixed(1)}" rx="${(g.e1.rx * 1.1).toFixed(1)}" ry="${(g.e1.ry * 1.1).toFixed(1)}" filter="url(#f${s})"/>
      </clipPath>
    </defs>
    ${satelliteEls}
    <g filter="url(#f${s})">
      ${ell(g.e1, `g${s}a`)}
      ${ell(g.e2, `g${s}c`)}
      ${ell(g.e3, `g${s}b`)}
      ${ell(g.e4, `g${s}d`)}
    </g>
    <rect x="0" y="0" width="${size}" height="${size}" filter="url(#grain${s})" opacity="0.055" clip-path="url(#clip${s})"/>
    <g clip-path="url(#clip${s})">${speckleEls}</g>
  </svg>`;
}

function buildSplashDesign(i) {
  const g = buildSplashGeometry(11 + i * 17);
  const entry = { imgs: [], ready: false, _loaded: 0 };
  SPLASH_COLORWAYS.forEach((colors) => {
    const img = new Image();
    img.onload = () => {
      entry._loaded++;
      if (entry._loaded === SPLASH_COLORWAYS.length) entry.ready = true;
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderSplashSVG(g, colors));
    entry.imgs.push(img);
  });
  splashImages.push(entry);
}

// Build the first design synchronously so there's always something to
// draw immediately, then rasterize the rest in one idle slice off the
// critical path. feTurbulence rasterization is the only expensive bit
// and it's decoded off-thread once the <img src> is set; blooms whose
// design isn't ready yet just wait a frame (drawSplashBloom guards).
function buildSplashLibrary() {
  buildSplashDesign(0);
  const rest = () => {
    for (let i = 1; i < SPLASH_DESIGN_COUNT; i++) buildSplashDesign(i);
  };
  if (window.requestIdleCallback) window.requestIdleCallback(rest, { timeout: 800 });
  else setTimeout(rest, 120);
}

// pos: optional {x, y} in WORLD coordinates (document-relative — see
// spawnClickSplash()) for a click-triggered bloom at a specific spot.
// Omitted for the ambient system's own randomly-placed spawns.
function makeSplashBloom(now, ageOffsetMs, pos) {
  let worldX, worldY;
  if (pos) {
    worldX = pos.x;
    worldY = pos.y;
  } else {
    // ~45% land in the hero+work "landing" zone (seen by default —
    // setupBioTab() lands on Work); the rest spread across every other
    // section so no part of the page feels empty.
    const inLanding = Math.random() < 0.45;
    worldY = inLanding
      ? Math.random() * splashHeroWorkBottom
      : splashHeroWorkBottom + Math.random() * Math.max(1, splashDocHeight - splashHeroWorkBottom);

    // Near full-width now — the ink is faint enough to sit under text —
    // with only a slight margin so blooms rarely clip hard at the edge.
    worldX = splashRnd(0.06, 0.94) * splashW;
  }

  const N = SPLASH_COLORWAYS.length;
  const isClick = !!pos;
  return {
    worldX, worldY,
    isClick,
    // gentle positional drift over the whole life (px), so the wash
    // feels like it's still settling into the paper, never static.
    // A click drifts less — it's anchored to where you pressed.
    driftX: splashRnd(-44, 44) * (isClick ? 0.4 : 1),
    driftY: splashRnd(-30, 30) * (isClick ? 0.4 : 1),
    // May be null if the library hasn't finished its idle build yet —
    // drawSplashBloom assigns one lazily once designs are available.
    design: splashImages.length
      ? splashImages[Math.floor(Math.random() * splashImages.length)]
      : null,
    rotation: splashRnd(0, Math.PI * 2),
    flipX: Math.random() < 0.5 ? -1 : 1,
    // final on-screen diameter, px — clicks resolve a touch smaller so
    // the initial drop reads as concentrated, not a wide splash.
    displaySize: isClick ? 460 + Math.random() * 260 : 540 + Math.random() * 420,
    startScale: isClick ? SPLASH_CLICK_START_SCALE : SPLASH_START_SCALE,
    born: now - ageOffsetMs,
    // Where along the colourway list the pigment starts, and how far it
    // drifts (signed) as it expands — this is the "colours mix" effect.
    // A click starts pinned to the most saturated colourway (0) and
    // always drifts toward the paler end as it spreads and dilutes.
    colorPhase: isClick ? 0 : Math.random() * (N - 1),
    colorDrift: isClick ? splashRnd(1.3, 1.9) : (Math.random() < 0.5 ? -1 : 1) * splashRnd(0.7, 1.5),
    // A click reacts faster than the slow ambient wind-up — feels like
    // a direct response to the press, not a coincidence.
    growMs: isClick ? 1850 + Math.random() * 850 : 5600 + Math.random() * 3000,
    holdMs: isClick ? 3200 + Math.random() * 2000 : 6000 + Math.random() * 4500,
    fadeMs: isClick ? 3000 + Math.random() * 1400 : 4200 + Math.random() * 1800,
  };
}

function seedInitialSplashBlooms(now) {
  computeSplashDocMetrics();
  splashBlooms = [];
  // Only the ambient ceiling's worth (1–2) at load, staggered slightly
  // so at least one is visibly still growing rather than all appearing
  // pre-grown — anything more than that is left for the user's own
  // clicks to add, not the page itself.
  for (let i = 0; i < SPLASH_AMBIENT_MAX; i++) {
    const b = makeSplashBloom(now, 0);
    // Modest stagger — the field opens with one wash mid-spread and one
    // just starting, rather than all in unison. Kept small so a seeded
    // bloom never lands already deep in its fade if the library takes a
    // moment to decode.
    b.born = now - i * splashRnd(900, 2600);
    splashBlooms.push(b);
  }
  splashLastSpawn = now;
  splashNextSpawnDelay = SPLASH_SPAWN_MIN + Math.random() * (SPLASH_SPAWN_MAX - SPLASH_SPAWN_MIN);
}

// Returns false once the bloom's full lifecycle (grow+hold+fade) is
// over. The heavy lifting already happened in renderSplashSVG() — this
// is two drawImage() calls per bloom (cross-fading colourways), scaled
// and faded per its lifecycle.
function drawSplashBloom(b, now, scrollY, isLight) {
  const age = now - b.born;
  const total = b.growMs + b.holdMs + b.fadeMs;
  if (age > total) return false;
  if (!b.design) {
    if (!splashImages.length) return true; // idle build hasn't produced one yet
    b.design = splashImages[Math.floor(Math.random() * splashImages.length)];
  }
  if (!b.design.ready) return true; // colourways not all decoded yet

  // How far through the "settling" part of life (everything after the
  // initial spread) — drives the slow creep AND the colour drift.
  const settleT = age < b.growMs
    ? 0
    : Math.min(1, (age - b.growMs) / (b.holdMs + b.fadeMs));

  // Scale. A click first lands as a concentrated DROP: for the punch
  // window it barely swells (ease-in, building tension), then releases
  // and spreads to full size, then — like every bloom — keeps wicking
  // outward slowly for the rest of its life. Water never really stops
  // creeping into paper until the pigment itself is gone.
  const CLICK_DROP_SCALE = 0.20; // size the drop reaches before it releases
  let scale;
  if (b.isClick && age < SPLASH_CLICK_PUNCH_MS) {
    const t = age / SPLASH_CLICK_PUNCH_MS;
    scale = b.startScale + (CLICK_DROP_SCALE - b.startScale) * (t * t);
  } else if (age < b.growMs) {
    const base = b.isClick ? CLICK_DROP_SCALE : b.startScale;
    const t = b.isClick
      ? (age - SPLASH_CLICK_PUNCH_MS) / (b.growMs - SPLASH_CLICK_PUNCH_MS)
      : age / b.growMs;
    scale = base + (1 - base) * (1 - Math.pow(1 - t, 3));
  } else {
    const eased = 1 - Math.pow(1 - settleT, 2.8); // long, stretched ease-out
    scale = 1 + (SPLASH_CREEP_CAP - 1) * eased;
  }

  let alpha;
  if (b.isClick) {
    // Snaps in fast (it's a direct reaction to the press), holds, fades.
    const fadeStart = b.growMs + b.holdMs;
    if (age < 110) alpha = age / 110;
    else if (age < fadeStart) alpha = 1;
    else alpha = 1 - (age - fadeStart) / b.fadeMs;
  } else if (age < b.growMs) {
    alpha = age / b.growMs;
  } else if (age < b.growMs + b.holdMs) {
    alpha = 1;
  } else {
    alpha = 1 - (age - b.growMs - b.holdMs) / b.fadeMs;
  }
  alpha = Math.max(0, alpha);

  const lifeT = age / total;
  const dx = b.driftX * lifeT;
  const dy = b.driftY * lifeT;

  const halfDisplay = (b.displaySize * scale) / 2;
  const cy = b.worldY - scrollY + dy;
  if (cy + halfDisplay < -100 || cy - halfDisplay > splashH + 100) return true; // alive, off-screen

  // Colour mix: the phase walks along SPLASH_COLORWAYS as the bloom
  // opens and settles; the two bracketing colourways cross-fade, so the
  // pigment appears to shift hue while it spreads. Same geometry +
  // turbulence seed in every colourway → a true morph, no ghost edge.
  const N = b.design.imgs.length;
  const spreadT = age < b.growMs ? (age / b.growMs) * 0.4 : 0.4 + 0.6 * settleT;
  let phase = b.colorPhase + b.colorDrift * spreadT;
  phase = Math.max(0, Math.min(N - 1 - 1e-4, phase));
  const idx = Math.floor(phase);
  const frac = phase - idx;
  const imgA = b.design.imgs[idx];
  const imgB = b.design.imgs[Math.min(N - 1, idx + 1)];

  let peak = isLight ? SPLASH_PEAK_LIGHT : SPLASH_PEAK_DARK;
  if (b.isClick) {
    // Saturated at the moment of impact, decaying to the ambient level
    // as the drop releases and dilutes into the field.
    const pd = Math.max(0, 1 - age / SPLASH_CLICK_PUNCH_MS);
    peak *= 1 + SPLASH_CLICK_PUNCH_AMP * pd * pd;
  }
  const half = b.displaySize / 2;

  splashCtx.save();
  splashCtx.translate(b.worldX + dx, cy);
  splashCtx.rotate(b.rotation);
  splashCtx.scale(b.flipX * scale, scale);
  splashCtx.globalAlpha = Math.min(1, alpha * peak * (1 - frac));
  splashCtx.drawImage(imgA, -half, -half, b.displaySize, b.displaySize);
  if (frac > 0.001 && imgB !== imgA) {
    splashCtx.globalAlpha = Math.min(1, alpha * peak * frac);
    splashCtx.drawImage(imgB, -half, -half, b.displaySize, b.displaySize);
  }
  splashCtx.restore();

  return true;
}

function drawSplashField(now) {
  if (!dom.splashCanvas || !splashCtx || !splashBlooms) return;

  splashCtx.clearRect(0, 0, splashW, splashH);
  const scrollY = window.scrollY;
  const isLight = dom.html.getAttribute('data-theme') === 'light';

  // Ambient auto-spawn only tops back up to SPLASH_AMBIENT_MAX (the
  // idle baseline) — it will never grow the count past that on
  // its own. Clicking is the only thing that pushes past it (see
  // setupSplashClickSpawn(), which checks the higher SPLASH_MAX_BLOOMS
  // ceiling instead) — those extras just fade out normally afterward.
  if (now - splashLastSpawn > splashNextSpawnDelay && splashBlooms.length < SPLASH_AMBIENT_MAX) {
    splashBlooms.push(makeSplashBloom(now, 0));
    splashLastSpawn = now;
    splashNextSpawnDelay = SPLASH_SPAWN_MIN + Math.random() * (SPLASH_SPAWN_MAX - SPLASH_SPAWN_MIN);
  }

  splashBlooms = splashBlooms.filter((b) => drawSplashBloom(b, now, scrollY, isLight));
}

function setupSplashField() {
  if (!dom.splashCanvas) return;
  // reducedMotion is a static OS-level setting (checked once, never
  // changes this session) — skip the one-time build cost entirely for
  // those users. quietMode is a live, user-toggleable setting instead
  // (CSS already hides the canvas instantly; runBackgroundLoop's own
  // gate skips drawing) — building anyway means toggling it back off
  // mid-session resumes normally rather than staying permanently blank.
  if (state.reducedMotion) return;
  sizeSplashCanvas();
  buildSplashLibrary();
  seedInitialSplashBlooms(performance.now());

  window.addEventListener('resize', debounce(() => {
    sizeSplashCanvas();
    computeSplashDocMetrics();
  }, 150));
  // Document height can change as images/fonts finish loading.
  window.addEventListener('load', computeSplashDocMetrics);

  setupSplashClickSpawn();
}

// A press on empty background — not on anything interactive — drops a
// new splash right where the cursor/finger landed, growing noticeably
// faster than the ambient ones since it's a direct reaction to the
// press. `click` (rather than pointerdown) is deliberate: the browser
// already suppresses it after a drag/text-selection gesture, so this
// naturally ignores those without any extra bookkeeping.
const SPLASH_CLICK_INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"]), .modal';

function setupSplashClickSpawn() {
  document.addEventListener('click', (e) => {
    // No click splashes in dark mode.
    if (state.theme === 'dark') return;
    if (state.reducedMotion || state.quietMode || window.innerWidth < 768) return;
    if (e.target.closest(SPLASH_CLICK_INTERACTIVE_SELECTOR)) return;

    const pos = { x: e.clientX, y: e.clientY + window.scrollY };
    const b = makeSplashBloom(performance.now(), 0, pos);
    if (splashBlooms.length >= SPLASH_MAX_BLOOMS) splashBlooms.shift();
    splashBlooms.push(b);
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
        obs.unobserve(entry.target);
      });
    }, staggerOpts);

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
   10b. "TRY THIS" HINT
   A hand-drawn arrow points at the dark mode button for 5 seconds,
   once per visit (sessionStorage), until the visitor has used the
   button (localStorage). Desktop only: the controls are hidden on
   phones. On the homepage it waits for the intro screen to finish.
   Clicking the button dismisses it early.
   ============================================ */

const TRY_HINT_SHOWN_KEY = 'uma-try-dark-hint-shown';  // this visit
const TRY_HINT_DONE_KEY = 'uma-tried-dark-mode';       // for good

function setupTryDarkHint() {
  const toggle = dom.themeToggle;
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    try { localStorage.setItem(TRY_HINT_DONE_KEY, '1'); } catch (_) {}
  });
  if (state.theme === 'dark') return;
  if (!window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)').matches) return;
  try {
    if (localStorage.getItem(TRY_HINT_DONE_KEY) || sessionStorage.getItem(TRY_HINT_SHOWN_KEY)) return;
  } catch (_) { return; }

  const whenIntroGone = (fn) => {
    const intro = document.getElementById('intro-screen');
    if (!intro || intro.classList.contains('intro-hidden')) { fn(); return; }
    const obs = new MutationObserver(() => {
      if (intro.classList.contains('intro-hidden')) { obs.disconnect(); fn(); }
    });
    obs.observe(intro, { attributes: true, attributeFilter: ['class'] });
  };

  whenIntroGone(() => {
    try { sessionStorage.setItem(TRY_HINT_SHOWN_KEY, '1'); } catch (_) {}

    const hint = document.createElement('div');
    hint.className = 'try-hint';
    hint.setAttribute('aria-hidden', 'true');
    // The arrow's tip sits at (92, 8) in its 96 x 64 box.
    hint.innerHTML = `
      <svg class="try-hint-arrow" viewBox="0 0 96 64" width="96" height="64">
        <path class="try-hint-line" pathLength="1" d="M6 58 C 22 60, 40 52, 54 38 S 78 12, 90 9"/>
        <path class="try-hint-head" pathLength="1" d="M78 4 L91 8.5 L83 19"/>
      </svg>
      <span class="try-hint-text">try this</span>`;
    document.body.appendChild(hint);

    const place = () => {
      const r = toggle.getBoundingClientRect();
      hint.style.left = `${r.left - 96 - 6}px`;
      hint.style.top = `${r.top + r.height / 2 - 8}px`;
    };
    place();
    window.addEventListener('resize', place);
    toggle.classList.add('is-hinted');
    requestAnimationFrame(() => hint.classList.add('is-in'));

    let gone = false;
    const leave = () => {
      if (gone) return;
      gone = true;
      toggle.classList.remove('is-hinted');
      hint.classList.add('is-out');
      window.removeEventListener('resize', place);
      setTimeout(() => hint.remove(), 600);
    };
    setTimeout(leave, 5000);
    toggle.addEventListener('click', leave, { once: true });
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
   11b. PROJECT CARD HIGHLIGHTS
   With a mouse, hovering or focusing a card shows its highlights
   over the image, one bullet at a time, with a dot per bullet.
   A new bullet rises in every 2 seconds; hovering a dot jumps to
   that bullet. Phones and touch screens list
   the bullets in the card instead (CSS only), so nothing runs there.
   ============================================ */

function setupCardHighlights() {
  const panels = document.querySelectorAll('.project-card .card-highlights');
  if (!panels.length) return;

  // Must match the media query that places the panel over the image.
  const overImage = window.matchMedia('(hover: hover) and (min-width: 769px)');
  const DWELL = 2000; // ms each bullet stays up

  panels.forEach(panel => {
    const card = panel.closest('.project-card');
    const items = [...panel.querySelectorAll('.card-bullets li')];
    if (!card || !items.length) return;

    const foot = document.createElement('div');
    foot.className = 'card-highlights-foot';
    foot.setAttribute('aria-hidden', 'true');
    foot.innerHTML = '<span class="card-highlights-label">Highlights</span><span class="card-dots"></span>';
    const dotRow = foot.querySelector('.card-dots');
    const dots = items.map((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'card-dot';
      dot.addEventListener('mouseenter', () => { if (running) { show(i); schedule(); } });
      dotRow.appendChild(dot);
      return dot;
    });
    panel.appendChild(foot);

    let index = 0;
    let running = false;
    let timer = null;

    items[0].classList.add('is-active');

    function show(next) {
      if (next !== index) {
        const out = items[index];
        out.classList.remove('is-active');
        out.classList.add('was-active');
        // Once it has faded, drop it back below, ready to rise in again.
        setTimeout(() => { if (!out.classList.contains('is-active')) out.classList.remove('was-active'); }, 500);
      }
      index = next;
      items[index].classList.remove('was-active');
      items[index].classList.add('is-active');
      dotRow.style.setProperty('--dwell', DWELL + 'ms');
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

    function schedule() {
      clearTimeout(timer);
      if (items.length < 2) return;
      timer = setTimeout(() => {
        show((index + 1) % items.length);
        schedule();
      }, DWELL);
    }

    function start() {
      if (running || !overImage.matches) return;
      running = true;
      show(0);
      schedule();
    }

    function stop() {
      if (card.matches(':hover') || card.matches(':focus-visible')) return;
      running = false;
      clearTimeout(timer);
      // Clearing the dots now restarts the fill from empty next time.
      dots.forEach(dot => dot.classList.remove('is-active'));
    }

    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', () => setTimeout(stop));
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) start(); });
    card.addEventListener('blur', () => setTimeout(stop));
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

  // On phones the button would sit on top of the contact form's fields;
  // CSS hides it (below 768px) while the form is on screen.
  const contactForm = document.querySelector('.contact-form');
  if (contactForm && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      dom.scrollTopBtn.classList.toggle('is-suppressed', entry.isIntersecting);
    }).observe(contactForm);
  }

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

  // Warm aurora colors: orange, coral, honey, clay (see --pop-* tokens)
  const colors = ['blob-orange', 'blob-coral', 'blob-yellow', 'blob-clay'];

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
  let lastMove = performance.now();

  // "3 / 8" counter, shown on phones where the dots are too small to tap
  let counter = stack.querySelector('.deck-count');
  if (!counter) {
    counter = document.createElement('p');
    counter.className = 'deck-count';
    counter.setAttribute('aria-live', 'polite');
    dotsContainer.after(counter);
  }

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

    counter.textContent = `${activeIndex + 1} / ${cards.length}`;
    // Don't announce every automatic turn, only ones the reader makes.
    counter.setAttribute('aria-live', autoplaying() ? 'off' : 'polite');
  }

  function goTo(index) {
    if (isAnimating) return;
    const prevIndex = activeIndex;
    activeIndex = (index + cards.length) % cards.length;
    if (prevIndex === activeIndex) return;
    lastMove = performance.now();

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

  // Autoplay: the next article every 2 seconds. It pauses while the
  // deck is hovered or focused, while it's off screen or the tab is
  // hidden, and when the reader presses pause; it never runs with
  // reduced motion or the site's Motion toggle off. The pause button
  // is what makes auto-advancing content accessible (WCAG 2.2.2).
  const DECK_INTERVAL = 2000;
  let userPaused = false;
  let hovered = false;
  let inView = false;

  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.className = 'deck-btn deck-pause';
  nextBtn?.after(pauseBtn);

  function motionAllowed() { return !state.reducedMotion && !state.quietMode; }
  function autoplaying() { return motionAllowed() && !userPaused; }
  let pauseKey = '';
  function syncPauseBtn() {
    const key = `${motionAllowed()}|${userPaused}`;
    if (key === pauseKey) return;
    pauseKey = key;
    pauseBtn.hidden = !motionAllowed();
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play articles automatically' : 'Pause automatic articles');
    pauseBtn.innerHTML = `<i class="fas fa-${userPaused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
  }

  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    lastMove = performance.now();
    syncPauseBtn();
    updatePositions();
  });
  stack.addEventListener('mouseenter', () => { hovered = true; });
  stack.addEventListener('mouseleave', () => { hovered = false; lastMove = performance.now(); });
  stack.addEventListener('focusin', () => { hovered = true; });
  stack.addEventListener('focusout', (e) => {
    if (!stack.contains(e.relatedTarget)) { hovered = false; lastMove = performance.now(); }
  });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.4 }).observe(stack);

  setInterval(() => {
    syncPauseBtn();
    if (!autoplaying() || hovered || !inView || document.hidden) return;
    if (performance.now() - lastMove >= DECK_INTERVAL) next();
  }, 250);

  syncPauseBtn();
  updatePositions();
}


/* ============================================
   20b. WORK CAROUSEL
   The project row scrolls itself, one card every 4 seconds, and wraps
   back to the start at the end. Same rules as the writing deck: it
   pauses while hovered or focused, off screen, in a hidden tab, while
   a search is typed, and when the reader presses pause; it never runs
   with reduced motion or the Motion toggle off. Arrows, dots (the
   cards in view are lit) and a search that filters the cards.
   ============================================ */

function setupWorkCarousel() {
  const root = document.getElementById('work-carousel');
  const grid = document.getElementById('projects-grid');
  if (!root || !grid) return;

  const cards = [...grid.querySelectorAll('.project-card')];
  const wrapper = root.querySelector('.projects-grid-wrapper');
  const prevBtn = root.querySelector('.work-prev');
  const nextBtn = root.querySelector('.work-next');
  const pauseBtn = root.querySelector('.work-pause');
  const dotsContainer = root.querySelector('.work-dots');
  const counter = root.querySelector('.work-count');
  const input = document.getElementById('work-search-input');
  const status = document.getElementById('work-search-status');
  const empty = root.querySelector('.work-empty');
  if (!cards.length || !wrapper || !dotsContainer) return;

  const INTERVAL = 4000;
  let userPaused = false;
  let hovered = false;
  let inView = false;
  let lastMove = performance.now();

  const titleOf = (card) => card.querySelector('h3')?.textContent.trim() || 'project';
  const shown = () => cards.filter((c) => !c.hidden);
  const smooth = () => (state.reducedMotion || state.quietMode ? 'auto' : 'smooth');
  const maxScroll = () => grid.scrollWidth - grid.clientWidth;
  // Where the row has to scroll for this card to sit at its start.
  const offsetOf = (card) => card.offsetLeft - (shown()[0]?.offsetLeft ?? 0);

  // Dots: one per project; pressing one scrolls to it.
  const dots = cards.map((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'deck-dot';
    dot.setAttribute('aria-label', `Go to project ${i + 1}: ${titleOf(card)}`);
    dot.addEventListener('click', () => goTo(card));
    dotsContainer.appendChild(dot);
    return dot;
  });

  // The card nearest the row's start edge.
  function currentIndex() {
    const list = shown();
    const x = Math.min(grid.scrollLeft, maxScroll());
    let best = 0, bestD = Infinity;
    list.forEach((c, i) => {
      const d = Math.abs(Math.min(offsetOf(c), maxScroll()) - x);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function goTo(card) {
    lastMove = performance.now();
    grid.scrollTo({ left: Math.min(offsetOf(card), maxScroll()), behavior: smooth() });
  }

  function step(dir) {
    const list = shown();
    if (list.length < 2) return;
    const atEnd = grid.scrollLeft >= maxScroll() - 4;
    const atStart = grid.scrollLeft <= 4;
    if (dir > 0 && atEnd) return goTo(list[0]);
    if (dir < 0 && atStart) return goTo(list[list.length - 1]);
    goTo(list[Math.max(0, Math.min(list.length - 1, currentIndex() + dir))]);
  }

  // Light the dots of the cards that are (mostly) in view.
  function syncDots() {
    const box = wrapper.getBoundingClientRect();
    const list = shown();
    cards.forEach((card, i) => {
      dots[i].hidden = card.hidden;
      if (card.hidden) return;
      const r = card.getBoundingClientRect();
      const seen = Math.min(r.right, box.right + 8) - Math.max(r.left, box.left - 8);
      const on = seen > r.width * 0.6;
      dots[i].classList.toggle('active', on);
      dots[i].setAttribute('aria-current', on ? 'true' : 'false');
    });
    if (counter) {
      counter.textContent = list.length ? `${currentIndex() + 1} / ${list.length}` : '';
      counter.setAttribute('aria-live', autoplaying() ? 'off' : 'polite');
    }
    const few = list.length < 2;
    [prevBtn, nextBtn].forEach((b) => { if (b) b.disabled = few; });
  }

  let syncQueued = false;
  grid.addEventListener('scroll', () => {
    lastMove = performance.now();
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => { syncQueued = false; syncDots(); });
  }, { passive: true });
  window.addEventListener('resize', debounce(syncDots, 150));

  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  /* --- Search: every word must appear somewhere on the card (title,
     subtitle, highlights or tags). --- */
  const texts = cards.map((c) => c.textContent.toLowerCase().replace(/\s+/g, ' '));
  let announce = null;

  function filter() {
    const words = (input?.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach((card, i) => {
      card.hidden = !words.every((w) => texts[i].includes(w));
      if (!card.hidden) count++;
    });
    grid.hidden = count === 0;
    grid.scrollLeft = 0;
    if (empty) {
      empty.hidden = count > 0;
      const q = empty.querySelector('.work-empty-query');
      if (q) q.textContent = `“${input.value.trim()}”`;
    }
    syncDots();
    clearTimeout(announce);
    announce = setTimeout(() => {
      if (!status) return;
      status.textContent = !words.length ? ''
        : count === 0 ? 'No projects match.'
        : `${count} ${count === 1 ? 'project matches' : 'projects match'}.`;
    }, 400);
  }

  input?.addEventListener('input', filter);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; filter(); }
  });
  empty?.querySelector('.work-empty-clear')?.addEventListener('click', () => {
    input.value = '';
    filter();
    input.focus();
  });

  /* --- Autoplay --- */
  function motionAllowed() { return !state.reducedMotion && !state.quietMode; }
  function searching() { return !!input?.value.trim(); }
  function autoplaying() { return motionAllowed() && !userPaused && !searching(); }
  let pauseKey = '';
  function syncPauseBtn() {
    if (!pauseBtn) return;
    const key = `${motionAllowed()}|${userPaused}`;
    if (key === pauseKey) return;
    pauseKey = key;
    pauseBtn.hidden = !motionAllowed();
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play projects automatically' : 'Pause automatic scrolling');
    pauseBtn.innerHTML = `<i class="fas fa-${userPaused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
  }

  pauseBtn?.addEventListener('click', () => {
    userPaused = !userPaused;
    lastMove = performance.now();
    syncPauseBtn();
    syncDots();
  });
  root.addEventListener('mouseenter', () => { hovered = true; });
  root.addEventListener('mouseleave', () => { hovered = false; lastMove = performance.now(); });
  root.addEventListener('focusin', () => { hovered = true; });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) { hovered = false; lastMove = performance.now(); }
  });
  // A finger on the row counts as reading it.
  grid.addEventListener('touchstart', () => { lastMove = performance.now(); }, { passive: true });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.4 }).observe(grid);

  setInterval(() => {
    syncPauseBtn();
    if (!autoplaying() || hovered || !inView || document.hidden) return;
    if (performance.now() - lastMove >= INTERVAL) step(1);
  }, 250);

  syncPauseBtn();
  syncDots();
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

function setupIntroScreen() {
  const screen = document.getElementById('intro-screen');
  if (!screen) return;

  // Skip for reduced-motion users and mobile — purely decorative
  if (state.reducedMotion || window.innerWidth < 768) {
    screen.classList.add('intro-hidden');
    return;
  }

  // Already seen this session (set by inline script in <head>)
  if (document.documentElement.classList.contains('intro-skip')) {
    screen.classList.add('intro-hidden');
    return;
  }

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
  // Exception: coming back from a case study, where the inline script in
  // index.html's <head> has already restored the reader's exact spot.
  const navEl = document.querySelector('.site-nav');
  const navH  = navEl ? navEl.offsetHeight : 64;
  if (!window.__homeRestored) {
    document.documentElement.scrollTop = Math.max(0, work.offsetTop - navH);
  }

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
  setupWorkCarousel();
  setupScrollTopButton();
  setupViewportMaintenance();
  setupTiltCards();
  setupCardHighlights();
  setupTryDarkHint();
  setupBioTab();
  setupLiquidMetal();
  setupInteractiveAuroraBlobs();
  setupVibeBadge();
  setupResumeModal();
  setupSplashField();
  updateQuietIcon();

  // Start the single animation loop
  requestAnimationFrame(runBackgroundLoop);
}

// Run when DOM is ready
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
