/* ============================================
   STORY ENGINE
   Builds a scrollytelling case study from a content object
   (case-studies/<slug>.js, schema in case-studies/_template.js).

   Page shell (see work/kindred/index.html):
     <head>
       <script defer blocking="render" src="/case-studies/<slug>.js">
       <script defer blocking="render" src="/js/story.js">
     <body> ... <main class="story" data-story="<slug>"></main> ...
   This file mounts every [data-story] element when it runs.

   Why defer + blocking="render": the opening screen must exist on the
   very first frame so the homepage card can morph into it (cross-
   document View Transitions). Deferred scripts run once the page is
   parsed, and blocking="render" holds the first frame until they
   have. (Plain scripts rather than modules, so the order is simple:
   content first, then the engine.)

   Modules below:
   1. Helpers
   2. Content checks (console warnings for authors)
   3. Rendering (opening, chapters, visuals, checkpoints, closing)
   4. Navigation (desktop navigator, mobile progress + Chapters menu)
   5. Behaviour (reveals, spine, scroll loop, visuals, transitions)
   ============================================ */

(function () {
  'use strict';

  const DESKTOP = '(min-width: 1100px)';
  const AUTO_LAYOUTS = ['text-left', 'text-right', 'wide'];
  const READING_LINE = 0.62; // fraction of viewport height the line "draws to"

  // Browsers without cross-document view transitions get a soft fade.
  if (!('onpagereveal' in window) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('st-fade-in');
  }


  /* ============================================
     1. HELPERS
     ============================================ */

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  let ROOT = '/';
  const url = (p) => (/^(https?:|\/|data:)/.test(p) ? p : ROOT + p);
  const srcAttr = (p) => esc(encodeURI(url(p)));

  // Wraps the first match of each phrase in a link. Text is escaped first.
  function linkify(text, links) {
    let html = esc(text);
    for (const [phrase, href] of Object.entries(links || {})) {
      const p = esc(phrase);
      const i = html.indexOf(p);
      if (i < 0) continue;
      const a = `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${p}<span class="st-sr"> (opens in a new tab)</span></a>`;
      html = html.slice(0, i) + a + html.slice(i + p.length);
    }
    // Placeholders stand out so they are never shipped by accident.
    return html.replace(/\[PLACEHOLDER:[^\]]*\]/g, (m) => `<mark class="st-todo">${m}</mark>`);
  }

  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Deterministic jitter, so the idea scatter looks the same every visit.
  function seeded(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }


  /* ============================================
     2. CONTENT CHECKS
     Warnings only; the page still renders.
     ============================================ */

  function check(c) {
    const warn = (m) => console.warn(`[story:${c.meta?.slug}] ${m}`);
    const ids = new Set((c.chapters || []).map((ch) => ch.id));
    const diamonds = new Set((c.diamonds || []).map((d) => d.id));
    (c.chapters || []).forEach((ch) => {
      if (ch.diamond && !diamonds.has(ch.diamond)) warn(`chapter "${ch.id}" uses unknown diamond "${ch.diamond}"`);
    });
    (c.checkpoints || []).forEach((cp) => {
      if (!ids.has(cp.chapter)) warn(`checkpoint "${cp.id}" points at missing chapter "${cp.chapter}"`);
    });
    if (c.meta?.skipTo && !ids.has(c.meta.skipTo.chapter)) warn('meta.skipTo points at a missing chapter');
    const json = JSON.stringify(c);
    if (/[\u2013\u2014]/.test(json)) warn('copy contains an em or en dash');
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (typeof o.src === 'string' && !o.alt) warn(`image ${o.src} has no alt text`);
      Object.values(o).forEach(walk);
    };
    walk(c);
  }


  /* ============================================
     3. RENDERING
     ============================================ */

  function imgTag(im, { sizes = '100vw', eager = false, cls = '' } = {}) {
    const srcset = im.srcset
      ? ` srcset="${im.srcset.split(',').map((s) => {
          const [u, w] = s.trim().split(/\s+/);
          return `${esc(encodeURI(url(u)))} ${esc(w)}`;
        }).join(', ')}" sizes="${esc(sizes)}"`
      : '';
    const dims = im.width && im.height ? ` width="${im.width}" height="${im.height}"` : '';
    const load = eager ? ' fetchpriority="high"' : ' loading="lazy"';
    return `<img class="${cls}" src="${srcAttr(im.src)}"${srcset} alt="${esc(im.alt)}"${dims}${load} decoding="async">`;
  }

  function placeholderTag(m) {
    const label = m.placeholder.replace(/^IMAGE:\s*/i, '');
    return `<div class="st-placeholder" style="aspect-ratio:${esc(m.ratio || '16 / 9')}" role="img" aria-label="Image placeholder: ${esc(label)}"><span>${esc(m.placeholder)}</span></div>`;
  }

  function figureTag(m, { sizes, i = 3, drift = false, cls = '', flex = false } = {}) {
    // In a side-by-side pair, each figure grows in proportion to its
    // aspect ratio, which gives both the same height.
    const grow = flex && m.width && m.height ? `;flex:${(m.width / m.height).toFixed(3)} 1 0` : '';
    // maxWidth keeps small source images near their natural size.
    const max = m.maxWidth ? `;max-width:${m.maxWidth}px;margin-inline:auto;width:100%` : '';
    if (m.placeholder) {
      return `<figure class="st-figure st-reveal ${cls}" style="--i:${i}${grow}${max}">${placeholderTag(m)}</figure>`;
    }
    const ratio = m.width && m.height ? ` style="aspect-ratio:${m.width} / ${m.height}"` : '';
    const cap = m.caption ? `<figcaption>${linkify(m.caption, m.links)}</figcaption>` : '';
    // Video: silent, looping, loads only when it comes near the screen
    // and plays only while visible (and never on its own with reduced
    // motion). The button pauses it, which WCAG requires for anything
    // that moves for more than five seconds.
    const inner = m.video
      ? `<video class="st-video" muted loop playsinline preload="none" poster="${srcAttr(m.poster || '')}" data-src="${srcAttr(m.video)}" aria-label="${esc(m.alt)}"></video>
         <button class="st-video-toggle" type="button" aria-label="Play video"><i class="fas fa-play" aria-hidden="true"></i></button>`
      : imgTag(m, { sizes });
    return `<figure class="st-figure st-reveal${drift ? ' st-drift' : ''}${m.video ? ' st-figure--video' : ''} ${cls}" style="--i:${i}${max}${grow}"><div class="st-frame"${ratio}>${inner}</div>${cap}</figure>`;
  }

  // Two images per row, same height (see figureTag's flex).
  function pairsHTML(list, opts) {
    const rows = [];
    for (let k = 0; k < list.length; k += 2) {
      rows.push(`<div class="st-pair">${list.slice(k, k + 2).map((m, j) => figureTag(m, { ...opts, flex: true, i: (opts.i || 2) + (k + j) * 0.4 })).join('')}</div>`);
    }
    return rows.join('');
  }

  const SIZES = {
    'text-left': '(min-width: 1100px) 640px, (min-width: 900px) 58vw, 100vw',
    'text-right': '(min-width: 1100px) 640px, (min-width: 900px) 58vw, 100vw',
    showcase: '(min-width: 1100px) 1120px, 100vw',
    default: '(min-width: 1100px) 1120px, 100vw',
    gallery: '(min-width: 900px) 560px, 100vw',
  };

  /* --- Opening screen: a giant version of the homepage card --- */
  function openingHTML(c) {
    const m = c.meta;
    const tags = (m.tags || []).map((t) => `<li>${linkify(t)}</li>`).join('');
    const skip = m.skipTo
      ? `<a class="st-skip" href="#${esc(m.skipTo.chapter)}">${esc(m.skipTo.label)}<i class="fas fa-arrow-down" aria-hidden="true"></i></a>`
      : '';
    // Next project is reachable from the top too, not only the end.
    const next = c.next
      ? `<a class="st-back st-next-top" href="${esc(c.next.href)}">Next: ${esc(c.next.name || 'next project')} <i class="fas fa-arrow-right" aria-hidden="true"></i></a>`
      : '';
    return `
      <header class="st-opening" id="st-top">
        <div class="st-opening-bar">
          <a class="st-back" href="/#work" data-st-back><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to work</a>
          ${next}
        </div>
        <div class="st-card">
          <div class="st-card-media"${m.hero.width && m.hero.height ? ` style="aspect-ratio:${m.hero.width} / ${m.hero.height}"` : ''}>${imgTag(m.hero, { eager: true, cls: 'st-hero-img', sizes: '(min-width: 1100px) 960px, 100vw' })}</div>
          <div class="st-card-body">
            <h1 class="st-title">${esc(m.title)}</h1>
            <p class="st-subtitle">${esc(m.subtitle)}</p>
            <ul class="st-tags" role="list">${tags}</ul>
            ${summaryHTML(c)}
            ${skip}
          </div>
        </div>
      </header>`;
  }

  function summaryHTML(c) {
    const s = c.summary;
    if (!s) return '';
    const points = (s.points || []).map((p) => `<div><dt>${esc(p.label)}</dt><dd>${linkify(p.text)}</dd></div>`).join('');
    const metrics = s.showMetrics && c.metrics ? metricsList(c.metrics.items, 'st-metrics--compact') : '';
    return `
      <div class="st-summary">
        <p class="st-summary-lead">${linkify(s.lead)}</p>
        <button class="st-summary-toggle" type="button" aria-expanded="false" aria-controls="st-summary-more">
          <span>Read the summary</span><i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="st-summary-more" id="st-summary-more" hidden>
          <dl class="st-summary-points">${points}</dl>
          ${metrics}
        </div>
      </div>`;
  }

  /* --- Diamonds: an intro band where the line opens, and a pinch band
     where it closes to a point --- */
  function diamondIntroHTML(d, n) {
    const stages = d.stages ? `<span class="st-stage">${d.stages.map(esc).join(' and ')}</span>` : '';
    return `
      <div class="st-band st-diamond-intro" data-diamond-start="${esc(d.id)}">
        <span class="st-point" aria-hidden="true"></span>
        <div class="st-diamond-intro-text st-reveal" style="--i:0">
          <p class="st-eyebrow"><span>${esc(d.label || `Diamond ${n}`)}</span>${stages}</p>
          <h2 class="st-diamond-title">${esc(d.title)}</h2>
        </div>
      </div>`;
  }

  function pinchHTML(d, cp, n) {
    const label = cp
      ? `<p class="st-pinch-label"><span class="st-pinch-kicker">Checkpoint ${n}</span>${esc(cp.label)}</p>`
      : '';
    return `
      <div class="st-band st-pinch" ${cp ? `id="${esc(cp.id)}"` : ''} data-diamond-end="${esc(d.id)}" tabindex="-1">
        <span class="st-point st-point--pinch" aria-hidden="true"></span>
        ${label}
      </div>`;
  }

  // Horizontal double-diamond graphic for interludes. Diamonds up to
  // `done` are drawn solid; the rest are faint and dashed.
  function diamondArt(total, done) {
    const w = 170, h = 150, m = 10, mid = h / 2 + m;
    let paths = '';
    for (let i = 0; i < total; i++) {
      const x = m + i * w;
      const cls = i < done ? 'st-art-done' : 'st-art-next';
      paths += `<path class="${cls}" pathLength="100" d="M${x} ${mid} L${x + w / 2} ${m} L${x + w} ${mid} L${x + w / 2} ${h + m} Z"/>`;
    }
    const points = Array.from({ length: total + 1 }, (_, i) =>
      `<circle class="${i <= done ? 'st-art-point is-done' : 'st-art-point'}${i === done ? ' is-here' : ''}" cx="${m + i * w}" cy="${mid}" r="${i === done ? 7 : 5}"/>`).join('');
    return `<svg class="st-interlude-art" viewBox="0 0 ${total * w + m * 2} ${h + m * 2}" aria-hidden="true">${paths}${points}</svg>`;
  }

  function interludeHTML(cp, c, diamondIndex) {
    const lines = (cp.lines || []).map((l) => `<p class="st-interlude-line st-reveal" style="--i:2">${linkify(l)}</p>`).join('');
    return `
      <section class="st-interlude" id="${esc(cp.id)}" aria-labelledby="${esc(cp.id)}-title" tabindex="-1">
        <div class="st-interlude-inner">
          ${diamondArt(c.diamonds.length, diamondIndex + 1)}
          ${cp.eyebrow ? `<p class="st-eyebrow st-reveal" style="--i:0">${esc(cp.eyebrow)}</p>` : ''}
          <h2 class="st-interlude-title st-reveal" id="${esc(cp.id)}-title" style="--i:1">${esc(cp.heading || cp.label)}</h2>
          ${lines}
        </div>
      </section>`;
  }

  /* --- Chapters --- */
  function chapterHTML(ch, idx, ctx) {
    const d = ctx.diamondById[ch.diamond];
    const stage = d?.stages ? d.stages[ch.stage === 'converge' ? 1 : 0] : '';
    let layout = ch.layout && ch.layout !== 'auto' ? ch.layout : AUTO_LAYOUTS[idx % AUTO_LAYOUTS.length];
    const pinned = ch.visual && (ch.visual.type === 'phone-rounds' || ch.visual.type === 'pinned');
    if (pinned) layout = 'rounds';
    const hid = `${ch.id}-title`;

    const quote = ch.quote ? `
      <blockquote class="st-quote st-reveal" style="--i:2">
        <p>${linkify(ch.quote.text, ch.links)}</p>
        ${ch.quote.cite ? `<p class="st-quote-cite">${esc(ch.quote.cite)}</p>` : ''}
      </blockquote>` : '';

    const text = `
      <div class="st-text">
        <p class="st-eyebrow st-reveal" style="--i:0"><span class="st-num">${pad(idx + 1)}</span>${stage ? `<span class="st-stage">${esc(stage)}</span>` : ''}</p>
        <h3 class="st-heading st-reveal" id="${hid}" style="--i:0">${esc(ch.heading)}</h3>
        <div class="st-body st-reveal" style="--i:1">${(ch.body || []).map((p) => `<p>${linkify(p, ch.links)}</p>`).join('')}</div>
        ${quote}
      </div>`;

    const sizes = SIZES[layout] || SIZES.default;
    const media = !(ch.media || []).length ? ''
      : ch.mediaColumns === 2
        ? `<div class="st-media st-media--pairs">${pairsHTML(ch.media, { sizes: SIZES.gallery, i: 3 })}</div>`
        : `<div class="st-media">${ch.media.map((m) => figureTag(m, { sizes, drift: true })).join('')}</div>`;
    const visual = ch.visual && layout !== 'rounds'
      ? `<div class="st-visual st-visual--${esc(ch.visual.type)} st-reveal" style="--i:2">${visualHTML(ch.visual, ch)}</div>`
      : '';
    // Split layouts put media beside the text; everywhere else the
    // visual comes first, then images (headline, body, visual, image).
    const split = layout === 'text-left' || layout === 'text-right';
    const inner = layout === 'rounds' ? roundsHTML(ch.visual, text) : split ? text + media + visual : text + visual + media;
    const visualOnly = !media && visual ? ' st-visual-only' : '';

    return `
      <section class="st-chapter st-layout-${esc(layout)}${pinned ? ` st-frame-${frameOf(ch.visual)}` : ''}${visualOnly}" id="${esc(ch.id)}" data-chapter="${esc(ch.id)}" data-stage="${esc(ch.stage || '')}" aria-labelledby="${hid}" tabindex="-1">
        <div class="st-chapter-inner">${inner}</div>
      </section>`;
  }

  /* --- Visuals --- */
  function visualHTML(v, ch) {
    switch (v.type) {
      case 'idea-scatter': return scatterHTML(v);
      case 'idea-funnel': return funnelHTML(v);
      case 'feature-cards': return featuresHTML(v);
      case 'gallery': return galleryHTML(v);
      case 'journey': return journeyHTML(v);
      case 'reframe': return reframeHTML(v);
      case 'bridge': return bridgeHTML(v);
      case 'prototypes': return prototypesHTML(v);
      default:
        console.warn(`[story] unknown visual type "${v.type}" in chapter "${ch.id}"`);
        return '';
    }
  }

  function scatterHTML(v) {
    const rnd = seeded(v.ideas.length * 97);
    const phone = v.mobileCount ?? 8;
    const tablet = v.tabletCount ?? 18;
    const items = v.ideas.map((idea, i) => {
      const r = (rnd() - 0.5) * 7;
      const jx = (rnd() - 0.5) * 18;
      const jy = (rnd() - 0.5) * 14;
      const hide = i >= tablet ? ' st-hide-tablet' : i >= phone ? ' st-hide-phone' : '';
      return `<li class="st-idea${hide}" style="--r:${r.toFixed(1)}deg;--jx:${jx.toFixed(0)}px;--jy:${jy.toFixed(0)}px;--d:${i}">${esc(idea)}</li>`;
    }).join('');
    return `<ul class="st-scatter" role="list" aria-label="${esc(v.label || `${v.ideas.length} use case ideas`)}" data-scatter>${items}</ul>`;
  }

  function funnelHTML(v) {
    const pts = v.points;
    const short = pts.filter((p) => p.shortlisted);
    const q = v.quadrants || {};
    let n = 0;
    const dots = pts.map((p, i) => {
      const k = p.shortlisted ? ++n : 0;
      return `<span class="st-dot${k ? ' is-short' : ''}" style="--x:${p.x};--y:${p.y};--d:${i}" title="${esc(p.label)}">${k ? `<span class="st-dot-num">${k}</span>` : ''}</span>`;
    }).join('');
    // Quadrant names sit outside the grid (above and below), so they
    // never collide with dots.
    const quadRow = (a, b, k) => (a || b
      ? `<div class="st-quads st-quads--${k}" aria-hidden="true"><span>${esc(a || '')}</span><span>${esc(b || '')}</span></div>` : '');
    const list = short.map((p, i) => `<li><span class="st-dot-key" aria-hidden="true">${i + 1}</span>${esc(p.label)}</li>`).join('');
    const steps = (v.steps || []).map((s, i) => `
      <li class="st-step" data-step="${i}"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join('<li class="st-step-arrow" aria-hidden="true"><i class="fas fa-arrow-right"></i></li>');
    const alt = `${v.axes?.x || 'x'} versus ${v.axes?.y || 'y'} matrix of ${pts.length} ideas. ${short.length} were shortlisted, listed below.`;
    return `
      <figure class="st-funnel" data-funnel>
        <div class="st-matrix-wrap">
          <span class="st-axis st-axis--y" aria-hidden="true"><i class="fas fa-arrow-up"></i><span class="st-axis-word">${esc(v.axes?.y || '')}</span></span>
          <div class="st-matrix-col">
            ${quadRow(q.topLeft, q.topRight, 'top')}
            <div class="st-matrix" role="img" aria-label="${esc(alt)}">${dots}</div>
            ${quadRow(q.bottomLeft, q.bottomRight, 'bottom')}
          </div>
          <span class="st-axis st-axis--x" aria-hidden="true">${esc(v.axes?.x || '')} <i class="fas fa-arrow-right"></i></span>
        </div>
        <figcaption class="st-funnel-side">
          <ol class="st-steps" role="list">${steps}</ol>
          <p class="st-shortlist-title">The ${short.length} worth testing</p>
          <ol class="st-shortlist" role="list">${list}</ol>
        </figcaption>
      </figure>`;
  }

  function featuresHTML(v) {
    const cards = v.items.map((it, i) => `
      <li class="st-feature st-reveal" style="--i:${2 + i * 0.6}">
        <div class="st-feature-media">${it.image?.placeholder ? placeholderTag(it.image) : it.image ? imgTag(it.image, { sizes: '(min-width: 1100px) 260px, (min-width: 600px) 45vw, 80vw' }) : ''}</div>
        <h4 class="st-feature-title">${linkify(it.title)}</h4>
        <p>${linkify(it.text)}</p>
      </li>`).join('');
    return `<ul class="st-features st-features--n${v.items.length}" role="list">${cards}</ul>`;
  }

  function galleryHTML(v) {
    if (v.columns === 2) return `<div class="st-gallery st-gallery--pairs">${pairsHTML(v.media, { sizes: SIZES.gallery, i: 2 })}</div>`;
    return `<div class="st-gallery">${v.media.map((m, i) =>
      figureTag(m, { sizes: i === 0 ? SIZES.default : SIZES.gallery, i: 2 + i * 0.5 })).join('')}</div>`;
  }

  /* --- Journey: stops along a line that draws itself, one by one --- */
  function journeyHTML(v) {
    const stops = v.stops.map((st, i) => `
      <li class="st-stop" style="--k:${i}">
        <span class="st-stop-dot" aria-hidden="true"></span>
        <span class="st-stop-num" aria-hidden="true">${pad(i + 1)}</span>
        <p class="st-stop-label">${esc(st.label)}</p>
        ${st.text ? `<p class="st-stop-text">${linkify(st.text)}</p>` : ''}
      </li>`).join('');
    return `<ol class="st-journey" role="list" style="--n:${v.stops.length}">${stops}</ol>`;
  }

  /* --- Reframe: the old framing is struck through by hand, then the
     new one arrives --- */
  function reframeHTML(v) {
    return `
      <p class="st-reframe">
        <span class="st-sr">Reframed from </span>
        <span class="st-reframe-from">${esc(v.from)}<svg class="st-reframe-strike" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M1 13 C 25 7, 55 16, 99 8"/></svg></span>
        <span class="st-reframe-arrow" aria-hidden="true"><i class="fas fa-arrow-right"></i></span>
        <span class="st-sr"> to </span>
        <span class="st-reframe-to">${esc(v.to)}</span>
      </p>
      ${v.caption ? `<p class="st-reframe-caption">${linkify(v.caption)}</p>` : ''}`;
  }

  /* --- Bridge: two sides with a gap between them, which closes into
     a solid line as it comes into view --- */
  function bridgeHTML(v) {
    const side = (sd, cls) => `
      <div class="st-bridge-side ${cls}">
        <p class="st-bridge-title">${esc(sd.title)}</p>
        <ul role="list">${(sd.items || []).map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
      </div>`;
    return `
      <div class="st-bridge">
        ${side(v.left, 'is-left')}
        <div class="st-bridge-gap">
          <span class="st-bridge-line" aria-hidden="true"></span>
          <span class="st-bridge-label st-bridge-label--gap">${esc(v.gap || 'The gap')}</span>
          <span class="st-bridge-label st-bridge-label--fix">${esc(v.bridge)}</span>
        </div>
        ${side(v.right, 'is-right')}
      </div>`;
  }

  /* --- Small looping illustrations of eye exercises (SVG animation,
     paused with reduced motion; see wire()) --- */
  function motionHTML(m) {
    const label = esc(m.alt || '');
    const art = {
      track: `
        <path class="st-motion-guide" d="M200 150 C 250 70, 350 70, 350 150 S 250 230, 200 150 S 50 70, 50 150 S 150 230, 200 150"/>
        <circle class="st-motion-target" r="16">
          <animateMotion dur="5s" repeatCount="indefinite" path="M200 150 C 250 70, 350 70, 350 150 S 250 230, 200 150 S 50 70, 50 150 S 150 230, 200 150"/>
        </circle>`,
      focus: `
        <circle class="st-motion-far" cx="290" cy="105" r="14">
          <animate attributeName="opacity" values="0.25;1;1;0.25;0.25" keyTimes="0;0.2;0.5;0.7;1" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle class="st-motion-near" cx="130" cy="185" r="42">
          <animate attributeName="opacity" values="1;0.25;0.25;1;1" keyTimes="0;0.2;0.5;0.7;1" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle class="st-motion-ring" cx="130" cy="185" r="54">
          <animate attributeName="cx" values="130;290;290;130;130" keyTimes="0;0.2;0.5;0.7;1" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="185;105;105;185;185" keyTimes="0;0.2;0.5;0.7;1" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="r" values="54;24;24;54;54" keyTimes="0;0.2;0.5;0.7;1" dur="4s" repeatCount="indefinite"/>
        </circle>`,
      reach: `
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;150 -40;-60 50;0 0" keyTimes="0;0.33;0.66;1" calcMode="discrete" dur="4.5s" repeatCount="indefinite"/>
          <circle class="st-motion-target" cx="170" cy="140" r="22"/>
          <circle class="st-motion-ripple" cx="170" cy="140" r="22">
            <animate attributeName="r" values="22;22;46" keyTimes="0;0.7;1" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.8;0" keyTimes="0;0.7;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>`,
    }[m.motion] || '';
    return `<svg class="st-motion-art" viewBox="0 0 400 300" role="img" aria-label="${label}">${art}</svg>`;
  }

  // Pinned sequence: text and steps scroll past a sticky frame whose
  // contents change per step. frame: 'phone' (phone-rounds), 'browser'
  // or 'photo'. On phones each step carries its own small frame
  // instead (stacked, clearly labeled).
  function frameOf(v) { return v.type === 'phone-rounds' ? 'phone' : (v.frame || 'photo'); }

  function frameHTML(frame, inner, v, cls = '') {
    if (frame === 'phone') return `<div class="st-phone ${cls}"><div class="st-phone-screen">${inner}</div></div>`;
    if (frame === 'browser') {
      return `<div class="st-browser ${cls}"><div class="st-browser-bar" aria-hidden="true"><span></span><span></span><span></span>${v.url ? `<span class="st-browser-url">${esc(v.url)}</span>` : ''}</div><div class="st-browser-screen">${inner}</div></div>`;
    }
    return `<div class="st-photo ${cls}"><div class="st-photo-screen">${inner}</div></div>`;
  }

  // A live page, rendered at the width it was designed for and scaled
  // to the frame. It stays inert until the reader asks for it, so
  // scrolling the page over it never gets captured.
  function embedHTML(m, frame) {
    return `
      <div class="st-embed" data-embed data-embed-w="${frame === 'phone' ? 390 : 1280}">
        <iframe src="${esc(m.embed)}" title="${esc(m.title || 'Interactive prototype')}" loading="lazy" tabindex="-1"></iframe>
        <button class="st-embed-start" type="button"><i class="fas fa-hand-pointer" aria-hidden="true"></i><span>${esc(m.start || 'Try the prototype')}</span></button>
      </div>`;
  }

  /* --- Prototypes: live prototypes side by side, each in its own
     frame (e.g. a phone app and the web app that supports it) --- */
  function prototypesHTML(v) {
    const items = (v.items || []).map((it) => {
      const frame = it.frame || 'phone';
      return `
        <figure class="st-proto st-proto--${esc(frame)}">
          ${frameHTML(frame, embedHTML(it, frame), { url: it.url })}
          <figcaption class="st-proto-caption">
            <span class="st-proto-label">${esc(it.label)}</span>
            ${it.detail ? `<span class="st-proto-detail">${esc(it.detail)}</span>` : ''}
            ${it.link ? `<a class="st-round-link" href="${esc(it.link.href)}" target="_blank" rel="noopener noreferrer">${esc(it.link.label)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i><span class="st-sr"> (opens in a new tab)</span></a>` : ''}
          </figcaption>
        </figure>`;
    }).join('');
    return `<div class="st-protos">${items}</div>`;
  }

  function roundsHTML(v, text) {
    const frame = frameOf(v);
    const steps = v.steps || v.rounds || [];
    const kicker = (r, i) => r.kicker || `${v.kicker || (v.type === 'phone-rounds' ? 'Round' : 'Step')} ${i + 1}`;
    const screen = (m) => {
      if (!m) return '';
      if (m.placeholder) return placeholderTag({ ...m, ratio: frame === 'phone' ? '9 / 19.5' : (m.ratio || '16 / 10') });
      if (m.motion) return motionHTML(m);
      if (m.embed) return embedHTML(m, frame);
      const fit = m.fit ? ` data-fit="${esc(m.fit)}"` : '';
      return `<div class="st-screen-media"${fit}>${imgTag(m, { sizes: frame === 'phone' ? '300px' : '(min-width: 900px) 640px, 100vw' })}</div>`;
    };
    const items = steps.map((r, i) => `
      <li class="st-round" data-round="${i}">
        <p class="st-round-kicker">${esc(kicker(r, i))}</p>
        <p class="st-round-label">${esc(r.label)}</p>
        ${r.text ? `<p class="st-round-text">${linkify(r.text)}</p>` : ''}
        ${r.points?.length ? `<ul class="st-round-points" role="list">${r.points.map((p) => `<li>${linkify(p)}</li>`).join('')}</ul>` : ''}
        ${r.link ? `<a class="st-round-link" href="${esc(r.link.href)}" target="_blank" rel="noopener noreferrer">${esc(r.link.label)} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i><span class="st-sr"> (opens in a new tab)</span></a>` : ''}
        ${frameHTML(frame, screen(r.media), v, 'st-frame-inline')}
      </li>`).join('');
    const screens = steps.map((r, i) => `
      <div class="st-screen${i === 0 ? ' is-active' : ''}" data-screen="${i}">${screen(r.media)}</div>`).join('');
    return `
      ${text}
      <ol class="st-rounds" role="list" data-rounds>${items}</ol>
      <div class="st-rounds-stage">
        ${frameHTML(frame, screens, v)}
        <p class="st-stage-label" data-stage-label aria-hidden="true">${esc(steps[0]?.label || '')}</p>
      </div>`;
  }

  /* --- Closing: metrics, reflection, next story --- */
  function metricsList(items, cls = '') {
    return `<ul class="st-metrics ${cls}" role="list">${items.map((m) => {
      const final = `${m.value}${m.suffix || ''}`;
      const dec = String(m.value).includes('.') ? String(m.value).split('.')[1].length : 0;
      return `
        <li class="st-metric">
          <p class="st-metric-value"><span class="st-count" data-value="${m.value}" data-dec="${dec}" aria-hidden="true">${esc(m.value)}</span><span aria-hidden="true">${esc(m.suffix || '')}</span><span class="st-sr">${esc(final)}</span></p>
          <p class="st-metric-label">${esc(m.label)}</p>
          ${m.detail ? `<p class="st-metric-detail">${esc(m.detail)}</p>` : ''}
        </li>`;
    }).join('')}</ul>`;
  }

  function closingHTML(c) {
    let html = '';
    if (c.metrics) {
      html += `
        <section class="st-panel st-metrics-section" aria-labelledby="st-metrics-title">
          <h2 class="st-panel-title st-reveal" id="st-metrics-title" style="--i:0">${esc(c.metrics.heading || 'By the numbers')}</h2>
          <div class="st-reveal" style="--i:1">${metricsList(c.metrics.items)}</div>
        </section>`;
    }
    if (c.reflection) {
      html += `
        <section class="st-panel st-reflection" aria-labelledby="st-reflection-title">
          <h2 class="st-panel-title st-reveal" id="st-reflection-title" style="--i:0">${esc(c.reflection.heading || 'Reflection')}</h2>
          <div class="st-reveal" style="--i:1">${(c.reflection.lines || []).map((l) => `<p>${linkify(l)}</p>`).join('')}</div>
        </section>`;
    }
    if (c.further?.items?.length) {
      const f = c.further;
      const items = f.items.map((it) => `
        <li><a class="st-further-link" href="${esc(it.href)}" target="_blank" rel="noopener noreferrer">
          <span class="st-further-title">${esc(it.title)}</span>
          ${it.meta ? `<span class="st-further-meta">${esc(it.meta)}</span>` : ''}
          <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i><span class="st-sr"> (opens in a new tab)</span>
        </a></li>`).join('');
      html += `
        <section class="st-panel st-further" aria-labelledby="st-further-title">
          <h2 class="st-panel-title st-reveal" id="st-further-title" style="--i:0">${esc(f.heading || 'Related writing')}</h2>
          ${f.intro ? `<p class="st-further-intro st-reveal" style="--i:1">${linkify(f.intro)}</p>` : ''}
          <ul class="st-further-list st-reveal" style="--i:1" role="list">${items}</ul>
        </section>`;
    }
    if (c.next) {
      const n = c.next;
      html += `
        <section class="st-next" aria-labelledby="st-next-title">
          <h2 class="st-next-title" id="st-next-title">Next story</h2>
          <a href="${esc(n.href)}" class="project-card tilt-card st-next-card" data-project="${esc(n.homeCard || '')}">
            <div class="project-thumb">${n.image ? imgTag(n.image, { sizes: '(min-width: 700px) 640px, 100vw' }) : ''}</div>
            <div class="project-body">
              <h3>${esc(n.title)}</h3>
              <p class="card-subtitle">${esc(n.subtitle || '')}</p>
            </div>
          </a>
        </section>`;
    }
    return html;
  }


  /* ============================================
     4. NAVIGATION
     ============================================ */

  // Stops along the story in reading order: chapters, plus checkpoints.
  function buildStops(c) {
    const stops = [];
    const cpByChapter = {};
    (c.checkpoints || []).forEach((cp) => { (cpByChapter[cp.chapter] ||= []).push(cp); });
    let pinches = 0;
    c.chapters.forEach((ch, i) => {
      stops.push({ kind: 'chapter', id: ch.id, label: ch.nav || ch.heading, num: pad(i + 1), diamond: ch.diamond, stage: ch.stage });
      (cpByChapter[ch.id] || []).forEach((cp) => stops.push({
        kind: cp.kind,
        id: cp.id,
        label: cp.kind === 'pinch' ? `Checkpoint ${++pinches}: ${cp.label}` : cp.label,
        diamond: ch.diamond,
      }));
    });
    return stops;
  }

  // Desktop: a miniature of the same line, pinned at the side.
  // Geometry is in a 40 x 100 box: each diamond gets a vertical span
  // proportional to its chapters, with a short thread between them.
  function navigatorHTML(c, stops) {
    const ds = c.diamonds.length ? c.diamonds : [{ id: null }];
    const counts = ds.map((d) => c.chapters.filter((ch) => (ch.diamond || null) === d.id).length || 1);
    const gap = 12;
    const total = counts.reduce((a, b) => a + b, 0);
    const avail = 100 - 4 - gap * (ds.length - 1) - 4;
    let y = 4;
    const spans = counts.map((n) => { const s = { top: y, h: (n / total) * avail }; y += s.h + gap; return s; });

    let outline = 'M20 0';
    const chapterY = {};
    ds.forEach((d, di) => {
      const chs = c.chapters.filter((ch) => (ch.diamond || null) === d.id);
      const s = spans[di];
      const firstConverge = chs.findIndex((ch) => ch.stage === 'converge');
      const widest = s.top + s.h * (firstConverge > 0 ? firstConverge / chs.length : 0.5);
      outline += ` L20 ${s.top} L6 ${widest} L20 ${s.top + s.h} L34 ${widest} L20 ${s.top}`
        + ` M20 ${s.top + s.h}`;
      chs.forEach((ch, i) => { chapterY[ch.id] = s.top + s.h * ((i + 0.5) / chs.length); });
      if (di < ds.length - 1) outline += ` L20 ${spans[di + 1].top}`;
    });
    outline += ' L20 100';

    let lastY = 0;
    const items = stops.map((st) => {
      let yy;
      if (st.kind === 'chapter') yy = chapterY[st.id];
      else {
        const di = ds.findIndex((d) => d.id === st.diamond);
        const s = spans[Math.max(0, di)];
        yy = st.kind === 'pinch' ? s.top + s.h : s.top + s.h + gap / 2;
      }
      yy = Math.max(yy, lastY + (st.kind === 'chapter' ? 0 : 0.5));
      lastY = yy;
      st.navY = yy;
      const cls = st.kind === 'chapter' ? '' : ` st-nav-dot--${st.kind}`;
      const text = st.kind === 'chapter' ? `<span class="st-nav-num">${st.num}</span> ${esc(st.label)}` : esc(st.label);
      return `<li style="--y:${yy.toFixed(2)}%"><a class="st-nav-dot${cls}" href="#${esc(st.id)}" data-target="${esc(st.id)}"><span class="st-nav-label">${text}</span></a></li>`;
    }).join('');

    return `
      <nav class="st-navigator" aria-label="Story chapters">
        <svg class="st-nav-art" viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
          <path class="st-nav-track" d="${outline}"/>
          <path class="st-nav-progress" d="${outline}"/>
        </svg>
        <ol class="st-nav-list" role="list">${items}</ol>
      </nav>`;
  }

  // Phones and tablets: a slim progress bar with checkpoint markers,
  // plus a Chapters button that opens a list.
  function mobileNavHTML(c, stops) {
    let current = null;
    const groups = stops.map((st) => {
      let head = '';
      if (st.kind === 'chapter' && st.diamond !== current) {
        current = st.diamond;
        const d = c.diamonds.find((x) => x.id === st.diamond);
        if (d) head = `<li class="st-menu-group" aria-hidden="true">${esc(d.label)}: ${esc(d.title)}</li>`;
      }
      const inner = st.kind === 'chapter'
        ? `<span class="st-menu-num">${st.num}</span><span>${esc(st.label)}</span>`
        : `<span class="st-menu-num"><i class="fas fa-diamond" aria-hidden="true"></i></span><span>${esc(st.label)}</span>`;
      return `${head}<li><a class="st-menu-link${st.kind === 'chapter' ? '' : ' is-checkpoint'}" href="#${esc(st.id)}" data-target="${esc(st.id)}">${inner}</a></li>`;
    }).join('');
    const marks = stops.filter((s) => s.kind !== 'chapter')
      .map((s) => `<span class="st-progress-mark" data-mark="${esc(s.id)}"></span>`).join('');
    return `
      <div class="st-progress" aria-hidden="true"><span class="st-progress-fill"></span>${marks}</div>
      <button class="st-chapters-btn" type="button" aria-haspopup="dialog" aria-controls="st-chapters">
        <i class="fas fa-list" aria-hidden="true"></i>
        <span>Chapters</span>
        <span class="st-chapters-current" data-current></span>
      </button>
      <dialog class="st-chapters" id="st-chapters" aria-labelledby="st-chapters-title">
        <div class="st-chapters-head">
          <h2 id="st-chapters-title">Chapters</h2>
          <button class="st-chapters-close" type="button" aria-label="Close chapters"><i class="fas fa-xmark" aria-hidden="true"></i></button>
        </div>
        <ol class="st-menu" role="list">${groups}</ol>
      </dialog>`;
  }


  /* ============================================
     5. BEHAVIOUR
     ============================================ */

  function mount(main, content) {
    const slug = main.dataset.story;
    const c = content || (window.CaseStudies || {})[slug];
    if (!c) { console.error(`[story] no content registered for "${slug}"`); return; }
    ROOT = main.dataset.root || '/';
    check(c);

    const ctx = { diamondById: Object.fromEntries((c.diamonds || []).map((d) => [d.id, d])) };
    const cpByChapter = {};
    (c.checkpoints || []).forEach((cp) => { (cpByChapter[cp.chapter] ||= []).push(cp); });
    const stops = buildStops(c);

    // --- Build the page ---
    let html = `<svg class="st-spine" aria-hidden="true"><g class="st-spine-g"><path class="st-strand" data-strand="l"/><path class="st-strand" data-strand="r"/></g></svg>`;
    html += openingHTML(c);
    let prevDiamond;
    let pinchCount = 0;
    c.chapters.forEach((ch, i) => {
      if (ch.diamond && ch.diamond !== prevDiamond) {
        html += diamondIntroHTML(ctx.diamondById[ch.diamond], c.diamonds.indexOf(ctx.diamondById[ch.diamond]) + 1);
      }
      prevDiamond = ch.diamond;
      html += chapterHTML(ch, i, ctx);
      const next = c.chapters[i + 1];
      const cps = cpByChapter[ch.id] || [];
      const closesDiamond = ch.diamond && (!next || next.diamond !== ch.diamond);
      const pinch = cps.find((cp) => cp.kind === 'pinch');
      if (closesDiamond || pinch) html += pinchHTML(ctx.diamondById[ch.diamond] || { id: '' }, pinch, pinch ? ++pinchCount : 0);
      cps.filter((cp) => cp.kind === 'interlude').forEach((cp) => {
        html += interludeHTML(cp, c, c.diamonds.indexOf(ctx.diamondById[ch.diamond]));
      });
    });
    html += closingHTML(c);
    main.innerHTML = html;
    main.insertAdjacentHTML('afterend', navigatorHTML(c, stops) + mobileNavHTML(c, stops));

    // Card-to-story morph: the homepage card's image frame grows into
    // the opening card's image frame (same name is set on the card in
    // index.html). Frames, not <img>s, so the rounded corners travel
    // with the image. Titles just crossfade: morphing two different
    // sentences into each other smears.
    const heroFrame = main.querySelector('.st-card-media');
    const card = c.meta.homeCard;
    if (card && heroFrame) {
      heroFrame.style.setProperty('view-transition-name', `card-img-${card}`);
      heroFrame.style.setProperty('view-transition-class', 'story-card story-img');
    }

    // The next-story card only joins a view transition when it's the
    // one being followed; otherwise it would pair with its homepage twin
    // and fly in from off screen.
    const nextCard = main.querySelector('.st-next-card');
    if (nextCard && c.next?.homeCard) {
      nextCard.addEventListener('click', () => {
        const id = c.next.homeCard;
        const img = nextCard.querySelector('.project-thumb img');
        if (c.next.story) {
          const frame = nextCard.querySelector('.project-thumb');
          frame?.style.setProperty('view-transition-name', `card-img-${id}`);
          frame?.style.setProperty('view-transition-class', 'story-card story-img');
        } else {
          // Older case study pages pair their title logo with hero-<id>.
          img?.style.setProperty('view-transition-name', `hero-${id}`);
        }
      });
    }

    wire(main, c, stops);
  }

  function wire(main, c, stops) {
    const root = document.documentElement;
    const desktopMQ = matchMedia(DESKTOP);
    const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => reducedMQ.matches || document.body?.classList.contains('quiet-mode');
    root.classList.toggle('st-motion', !reduced());
    const navEl = document.querySelector('.site-nav');
    const setNavH = () => root.style.setProperty('--st-nav-h', `${navEl ? navEl.offsetHeight : 64}px`);
    setNavH();

    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const spine = $('.st-spine', main);
    const strands = $$('.st-strand', spine);
    const navigator = $('.st-navigator');
    const navDots = $$('.st-nav-dot', navigator);
    const navProgress = $('.st-nav-progress', navigator);
    const menuLinks = $$('.st-menu-link');
    const progressFill = $('.st-progress-fill');
    const marks = $$('.st-progress-mark');
    const currentLabel = $('[data-current]');
    const chaptersBtn = $('.st-chapters-btn');
    const dialog = $('#st-chapters');
    const points = $$('.st-point', main);
    const drifters = $$('.st-drift > .st-frame', main);
    const funnels = $$('[data-funnel]', main);
    const rounds = $$('[data-rounds]', main).map((list) => ({
      steps: $$('.st-round', list),
      stage: list.parentElement.querySelector('.st-rounds-stage'),
      active: 0,
    }));
    const targets = stops.map((st) => ({ ...st, el: document.getElementById(st.id) })).filter((t) => t.el);

    /* --- Live prototype embeds --- */
    // Each embed is rendered at the width it was designed for (a phone
    // prototype at 390, a website at 1280) and scaled to its frame.
    const embeds = $$('[data-embed]', main);
    const fitEmbeds = () => embeds.forEach((el) => {
      const w = parseInt(el.dataset.embedW, 10) || 390;
      el.style.setProperty('--embed-w', `${w}px`);
      if (el.clientWidth) el.style.setProperty('--embed-scale', (el.clientWidth / w).toFixed(4));
    });
    // While one is in use, its device frame grows a little and glows,
    // so it's clear the prototype is live. Clicking anywhere outside
    // it, or scrolling it off screen, puts it back to sleep.
    const deviceOf = (el) => el.closest('.st-phone, .st-browser, .st-photo');
    const setLive = (el, on) => {
      el.classList.toggle('is-live', on);
      deviceOf(el)?.classList.toggle('is-live', on);
      el.querySelector('iframe').tabIndex = on ? 0 : -1;
    };
    embeds.forEach((el) => {
      el.querySelector('.st-embed-start').addEventListener('click', () => {
        setLive(el, true);
        el.querySelector('iframe').focus();
      });
    });
    const sleepEmbeds = (except) => embeds.forEach((el) => {
      if (el !== except && el.classList.contains('is-live')) setLive(el, false);
    });
    if (embeds.length) {
      new ResizeObserver(fitEmbeds).observe(main);
      document.addEventListener('pointerdown', (e) => {
        const inside = embeds.find((el) => el.classList.contains('is-live') && deviceOf(el)?.contains(e.target));
        sleepEmbeds(inside);
      });
      const offscreen = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting && en.target.classList.contains('is-live')) setLive(en.target, false);
      }));
      embeds.forEach((el) => offscreen.observe(el));
    }

    /* --- Videos: load near the screen, play only while visible --- */
    $$('.st-video', main).forEach((v) => {
      const btn = v.parentElement.querySelector('.st-video-toggle');
      let userPaused = false;
      let visible = false;
      const label = () => {
        const playing = !v.paused;
        btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        btn.innerHTML = `<i class="fas fa-${playing ? 'pause' : 'play'}" aria-hidden="true"></i>`;
      };
      const load = () => { if (!v.src) { v.src = v.dataset.src; } };
      const sync = () => {
        if (visible && !userPaused && !reduced()) { load(); v.play().catch(() => {}); } else v.pause();
      };
      v.addEventListener('play', label);
      v.addEventListener('pause', label);
      btn.addEventListener('click', () => {
        if (v.paused) { userPaused = false; load(); v.play().catch(() => {}); } else { userPaused = true; v.pause(); }
      });
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { threshold: 0.35 }).observe(v);
      // Start fetching a little before it's needed.
      new IntersectionObserver(([en], obs) => { if (en.isIntersecting) { load(); obs.disconnect(); } }, { rootMargin: '600px 0px' }).observe(v);
    });

    /* --- Zoom: every image opens full screen. Where the original is
       bigger than the screen, clicking it again shows it at full size
       to pan around (phones can also pinch). --- */
    const zoomable = $$('.st-card-media img, .st-frame img, .st-feature-media img, .st-phone-screen img, .st-browser-screen img, .st-photo-screen img', main);
    if (zoomable.length) {
      const zoom = document.createElement('dialog');
      zoom.className = 'st-zoom';
      zoom.setAttribute('aria-label', 'Enlarged image');
      zoom.innerHTML = `
        <button class="st-zoom-close" type="button" aria-label="Close image"><i class="fas fa-xmark" aria-hidden="true"></i></button>
        <figure class="st-zoom-figure">
          <img class="st-zoom-img" alt="">
          <figcaption class="st-zoom-cap"></figcaption>
        </figure>`;
      document.body.appendChild(zoom);
      const zImg = $('.st-zoom-img', zoom);
      const zCap = $('.st-zoom-cap', zoom);
      let opener = null;

      // The largest file in the srcset, so there is detail to zoom into.
      const largest = (img) => {
        const set = (img.getAttribute('srcset') || '').split(',').map((part) => {
          const [u, w] = part.trim().split(/\s+/);
          return { u, w: parseInt(w, 10) || 0 };
        }).filter((x) => x.u);
        return set.length ? set.sort((a, b) => b.w - a.w)[0].u : (img.currentSrc || img.src);
      };
      const canGrow = () => zImg.naturalWidth > zImg.clientWidth + 8 || zImg.naturalHeight > zImg.clientHeight + 8;
      const syncGrow = () => zoom.classList.toggle('can-grow', zoom.classList.contains('is-full') || canGrow());

      const open = (img) => {
        opener = img;
        zoom.classList.remove('is-full', 'can-grow');
        zImg.src = largest(img);
        zImg.alt = img.alt;
        const cap = img.closest('figure')?.querySelector('figcaption')?.textContent
          || img.closest('.st-feature')?.querySelector('.st-feature-title')?.textContent
          || '';
        zCap.textContent = cap;
        zCap.hidden = !cap;
        zoom.showModal();
        if (zImg.complete) syncGrow(); else zImg.addEventListener('load', syncGrow, { once: true });
      };
      const close = () => zoom.close();

      zoomable.forEach((img) => {
        img.classList.add('st-zoomable');
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `Enlarge image: ${img.alt}`);
        img.addEventListener('click', () => open(img));
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
        });
      });

      zImg.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!zoom.classList.contains('can-grow')) { close(); return; }
        // Keep the clicked point under the cursor as it grows.
        const r = zImg.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width;
        const fy = (e.clientY - r.top) / r.height;
        const full = zoom.classList.toggle('is-full');
        if (full) {
          zoom.scrollLeft = fx * zImg.scrollWidth - innerWidth / 2;
          zoom.scrollTop = fy * zImg.scrollHeight - innerHeight / 2;
        }
      });
      $('.st-zoom-close', zoom).addEventListener('click', close);
      zoom.addEventListener('click', (e) => { if (e.target === zoom || e.target.matches('.st-zoom-figure')) close(); });
      zoom.addEventListener('close', () => {
        zImg.removeAttribute('src');
        opener?.focus({ preventScroll: true });
      });
    }

    /* --- Summary toggle --- */
    const toggle = $('.st-summary-toggle', main);
    const more = $('#st-summary-more');
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('span').textContent = open ? 'Hide the summary' : 'Read the summary';
      more.hidden = !open;
      if (open) $$('.st-count', more).forEach(countUp);
      requestLayout();
    });

    /* --- Back to work: behave like the browser back button when the
       reader came from the homepage, so scroll position and the
       image-into-card transition are both restored. --- */
    $('[data-st-back]', main)?.addEventListener('click', (e) => {
      try {
        const ref = new URL(document.referrer);
        const fromHome = ref.origin === location.origin && /^\/(index\.html)?$/.test(ref.pathname);
        if (fromHome && history.length > 1) { e.preventDefault(); history.back(); }
      } catch (_) { /* no referrer: follow the link */ }
    });

    // Tell the homepage which card to shrink back into.
    const remember = () => { try { sessionStorage.setItem('last-story', c.meta.homeCard || ''); } catch (_) {} };
    window.addEventListener('pagehide', remember);
    window.addEventListener('pageswap', (e) => {
      remember();
      // If the opening image has scrolled away, don't fly it back in
      // from off screen: fall back to the plain crossfade.
      const hero = $('.st-card-media', main);
      if (e.viewTransition && hero && hero.getBoundingClientRect().bottom < 0) {
        hero.style.viewTransitionName = 'none';
        try { sessionStorage.setItem('last-story', ''); } catch (_) {}
      }
    });

    /* --- Jumping to a chapter from either navigator --- */
    const jump = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      el.focus({ preventScroll: true });
      history.replaceState(null, '', `#${id}`);
    };
    [...navDots, ...menuLinks].forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (dialog?.open) dialog.close();
      jump(a.dataset.target);
    }));
    chaptersBtn?.addEventListener('click', () => {
      dialog.showModal();
      (dialog.querySelector('.st-menu-link[aria-current]') || dialog.querySelector('.st-menu-link'))?.focus();
    });
    $('.st-chapters-close', dialog)?.addEventListener('click', () => dialog.close());
    dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    /* --- Reveals: headline, then body, then image (CSS staggers by --i) --- */
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        revealObs.unobserve(en.target);
        if (en.target.matches('.st-interlude')) glow();
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.st-chapter, .st-band, .st-interlude, .st-panel, .st-visual, .st-figure, .st-feature', main).forEach((el) => revealObs.observe(el));

    // Idea scatter: cards start bunched at the centre, then drift out.
    const scatterObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        scatterObs.unobserve(en.target);
        scatter(en.target);
      });
    }, { threshold: 0.2 });
    $$('[data-scatter]', main).forEach((el) => scatterObs.observe(el));

    function scatter(list) {
      if (reduced()) { list.classList.add('is-scattered'); return; }
      const box = list.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      $$('.st-idea', list).forEach((li) => {
        const r = li.getBoundingClientRect();
        li.style.setProperty('--fx', `${(cx - (r.left + r.width / 2)) * 0.85}px`);
        li.style.setProperty('--fy', `${(cy - (r.top + r.height / 2)) * 0.85}px`);
      });
      list.classList.add('is-ready');
      requestAnimationFrame(() => requestAnimationFrame(() => list.classList.add('is-scattered')));
    }

    // Metrics count up once when they scroll into view.
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        countObs.unobserve(en.target);
        countUp(en.target);
      });
    }, { threshold: 0.6 });
    $$('.st-metrics-section .st-count', main).forEach((el) => countObs.observe(el));

    function countUp(el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      if (reduced()) return;
      const to = parseFloat(el.dataset.value);
      const dec = parseInt(el.dataset.dec, 10) || 0;
      const t0 = performance.now();
      const dur = 1300;
      const step = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = (to * eased).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = (0).toFixed(dec);
      requestAnimationFrame(step);
    }

    /* --- The spine: one line that opens into each diamond and pinches
       at each checkpoint. Strands run in the side gutters; they only
       cross the centre in empty bands or behind opaque panels, so they
       never sit under text. --- */
    let geo = null;

    function measure() {
      setNavH();
      const mRect = main.getBoundingClientRect();
      const top = mRect.top + scrollY;
      const W = main.clientWidth;
      const H = main.offsetHeight;
      const rel = (el, edge = 'mid') => {
        const r = el.getBoundingClientRect();
        const y = edge === 'top' ? r.top : edge === 'bottom' ? r.bottom : r.top + r.height / 2;
        return { x: r.left - mRect.left + r.width / 2, y: y - mRect.top };
      };
      geo = {
        top,
        vh: innerHeight,
        docH: document.documentElement.scrollHeight,
        targets: targets.map((t) => ({ ...t, y: t.el.getBoundingClientRect().top + scrollY })),
        points: points.map((p) => ({ el: p, y: rel(p).y })),
        navMap: targets.filter((t) => t.navY != null).map((t) => ({
          y: t.el.getBoundingClientRect().top + scrollY - top, navY: t.navY,
        })),
      };

      // Mobile progress markers
      const span = Math.max(1, geo.docH - geo.vh);
      marks.forEach((m) => {
        const el = document.getElementById(m.dataset.mark);
        if (el) m.style.left = `${clamp((el.getBoundingClientRect().top + scrollY - geo.vh * READING_LINE) / span, 0, 1) * 100}%`;
      });

      if (!desktopMQ.matches) { geo.strands = null; return; }

      const cx = W / 2;
      const col = $('.st-chapter-inner', main).getBoundingClientRect();
      const colLeft = col.left - mRect.left;
      const navRight = navigator ? navigator.getBoundingClientRect().right - mRect.left : 0;
      const outer = Math.max(navRight + 28, 24);
      const inner = Math.max(colLeft - 36, outer + 14);

      const pts = [];
      const opening = $('.st-card', main);
      const cardBottom = rel(opening, 'bottom').y;
      geo.stub = cardBottom + 160;
      pts.push([cx, cardBottom]);
      (c.diamonds || []).forEach((d) => {
        const start = $(`[data-diamond-start="${d.id}"] .st-point`, main);
        const end = $(`[data-diamond-end="${d.id}"] .st-point`, main);
        if (!start || !end) return;
        const s = rel(start).y;
        const e = rel(end).y;
        const firstConverge = c.chapters.find((ch) => ch.diamond === d.id && ch.stage === 'converge');
        const wEl = firstConverge && document.getElementById(firstConverge.id);
        const widest = wEl ? rel(wEl, 'top').y : (s + e) / 2;
        const swing = Math.min(130, (e - s) / 6);
        pts.push([cx, s], [inner, s + swing], [outer, widest], [inner, e - swing], [cx, e]);
      });
      const next = $('.st-next-card', main) || $('.st-panel:last-of-type', main);
      pts.push([cx, next ? rel(next, 'top').y : H]);

      const d = (mirror) => 'M' + pts.map(([x, y]) => `${(mirror ? W - x : x).toFixed(1)},${y.toFixed(1)}`).join(' L');
      spine.setAttribute('viewBox', `0 0 ${W} ${H}`);
      spine.style.height = `${H}px`;
      strands[0].setAttribute('d', d(false));
      strands[1].setAttribute('d', d(true));

      // Length-at-y lookup. The path is straight segments that only
      // move downwards, so cumulative length at each vertex is enough
      // (and both strands are mirror images, so they share it).
      const samples = [[0, pts[0][1]]];
      for (let k = 1; k < pts.length; k++) {
        const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
        samples.push([samples[k - 1][0] + Math.hypot(x1 - x0, y1 - y0), y1]);
      }
      const len = samples[samples.length - 1][0];
      geo.strands = strands.map((p) => {
        p.style.strokeDasharray = `${len} ${len}`;
        return { p, len, samples };
      });
    }

    function lengthAtY(s, y) {
      const a = s.samples;
      if (y <= a[0][1]) return 0;
      if (y >= a[a.length - 1][1]) return s.len;
      let lo = 0, hi = a.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m][1] < y) lo = m; else hi = m; }
      const [l0, y0] = a[lo], [l1, y1] = a[hi];
      return y1 === y0 ? l1 : l0 + ((y - y0) / (y1 - y0)) * (l1 - l0);
    }

    function glow() {
      if (!spine || reduced()) return;
      spine.classList.remove('is-glowing');
      void spine.getBoundingClientRect();
      spine.classList.add('is-glowing');
    }

    /* --- One scroll loop for everything scroll-linked --- */
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    function update() {
      ticking = false;
      if (!geo) return;
      const vh = innerHeight;
      const readY = scrollY + vh * READING_LINE - geo.top;
      const still = reduced();

      // Spine: drawn to the reading line, and always at least a short
      // stub out of the opening card once the thread has been pulled.
      if (geo.strands) {
        const drawY = pulled ? Math.max(readY, geo.stub) : -1;
        geo.strands.forEach((s) => {
          const l = still ? s.len : lengthAtY(s, drawY);
          s.p.style.strokeDashoffset = `${s.len - l}`;
        });
      }
      geo.points.forEach((pt) => pt.el.classList.toggle('is-reached', still || readY >= pt.y));

      // Current stop
      let cur = null;
      geo.targets.forEach((t) => { if (t.y - geo.top <= readY) cur = t; });
      const curId = cur ? cur.id : null;
      navDots.forEach((a, i) => {
        const t = geo.targets.find((x) => x.id === a.dataset.target);
        const on = a.dataset.target === curId;
        a.classList.toggle('is-current', on);
        a.classList.toggle('is-passed', !!t && t.y - geo.top <= readY);
        if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      menuLinks.forEach((a) => {
        if (a.dataset.target === curId) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      if (currentLabel) {
        const chap = cur && cur.kind === 'chapter' ? cur : [...geo.targets].reverse().find((t) => t.kind === 'chapter' && t.y - geo.top <= readY);
        currentLabel.textContent = chap ? `${chap.num} ${chap.label}` : '';
      }
      chaptersBtn?.classList.toggle('is-visible', readY > (geo.targets[0]?.y ?? 0) - geo.top - vh * 0.4);
      navigator?.classList.toggle('is-visible', readY > (geo.targets[0]?.y ?? 0) - geo.top - vh * 0.4);

      // Navigator progress: piecewise map from page position to navigator y.
      if (navProgress && geo.navMap.length) {
        const m = geo.navMap;
        let p;
        if (readY <= m[0].y) p = m[0].navY * clamp(readY / Math.max(1, m[0].y), 0, 1);
        else if (readY >= m[m.length - 1].y) p = m[m.length - 1].navY + (100 - m[m.length - 1].navY) * clamp((readY - m[m.length - 1].y) / vh, 0, 1);
        else {
          const k = m.findIndex((x) => x.y > readY);
          const a = m[k - 1], b = m[k];
          p = a.navY + ((readY - a.y) / (b.y - a.y)) * (b.navY - a.navY);
        }
        navProgress.style.clipPath = `inset(0 0 ${(100 - p).toFixed(2)}% 0)`;
      }

      // Mobile progress bar
      if (progressFill) {
        const span = Math.max(1, document.documentElement.scrollHeight - vh);
        progressFill.style.transform = `scaleX(${clamp(scrollY / span, 0, 1)})`;
      }

      // Image drift: slow, small, never on phones or with reduced motion.
      if (!still && innerWidth >= 768) {
        drifters.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          const k = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = `translate3d(0, ${(k * -22).toFixed(1)}px, 0)`;
        });
      }

      // Funnel: 36 collapse to the shortlist once it's well in view.
      funnels.forEach((f) => {
        if (f.classList.contains('is-narrowed')) return;
        const r = f.getBoundingClientRect();
        if (still || r.top + r.height * 0.45 < vh * 0.6) f.classList.add('is-narrowed');
      });

      // Pinned phone: the round nearest the middle of the screen wins.
      rounds.forEach((rd) => {
        let best = 0, bestD = Infinity;
        rd.steps.forEach((st, i) => {
          const r = st.getBoundingClientRect();
          const dist = Math.abs(r.top + r.height / 2 - vh / 2);
          if (dist < bestD) { bestD = dist; best = i; }
        });
        if (best === rd.active || !rd.stage) return;
        rd.active = best;
        rd.steps.forEach((st, i) => st.classList.toggle('is-active', i === best));
        $$('.st-screen', rd.stage).forEach((s, i) => s.classList.toggle('is-active', i === best));
        sleepEmbeds($$('.st-screen', rd.stage)[best]?.querySelector('[data-embed]'));
        const lbl = $('[data-stage-label]', rd.stage);
        if (lbl) lbl.textContent = rd.steps[best].querySelector('.st-round-label').textContent;
      });
    }

    let layoutQueued = false;
    function requestLayout() {
      if (layoutQueued) return;
      layoutQueued = true;
      requestAnimationFrame(() => { layoutQueued = false; measure(); update(); });
    }

    // Pull the thread: once the card has landed (after the view
    // transition, if there is one), the line draws itself out of it.
    let pulled = false;
    function pullThread() {
      if (pulled) return;
      pulled = true;
      spine.classList.add('is-pulling');
      update();
      setTimeout(() => spine.classList.remove('is-pulling'), 1400);
    }
    let revealedWithTransition = false;
    addEventListener('pagereveal', (e) => {
      if (!e.viewTransition) return;
      revealedWithTransition = true;
      e.viewTransition.finished.finally(() => setTimeout(pullThread, 120));
    }, { once: true });

    rounds.forEach((rd) => rd.steps[0]?.classList.add('is-active'));
    measure();
    update();
    // Prerendered from the homepage (speculation rules): wait until the
    // page is actually shown, then let the transition handler above run.
    const whenShown = (fn) => (document.prerendering
      ? document.addEventListener('prerenderingchange', fn, { once: true })
      : fn());
    addEventListener('load', () => whenShown(() => setTimeout(() => {
      if (!revealedWithTransition) pullThread();
    }, 450)), { once: true });

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', requestLayout);
    new ResizeObserver(requestLayout).observe(main);
    document.fonts?.ready.then(requestLayout);
    addEventListener('load', requestLayout);
    desktopMQ.addEventListener('change', requestLayout);
    // Looping SVG illustrations hold still with reduced motion.
    const motionArt = $$('.st-motion-art', main);
    const syncArt = () => motionArt.forEach((svg) => { try { reduced() ? svg.pauseAnimations() : svg.unpauseAnimations(); } catch (_) {} });
    syncArt();
    const syncMotion = () => { root.classList.toggle('st-motion', !reduced()); syncArt(); requestLayout(); };
    reducedMQ.addEventListener('change', syncMotion);
    if (document.body) new MutationObserver(syncMotion).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  window.Story = { mount };

  // Deferred, so the document is parsed by now; the fallback covers a
  // page that loads this file without defer.
  const autoMount = () => document.querySelectorAll('[data-story]').forEach((el) => mount(el));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
