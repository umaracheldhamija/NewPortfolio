#!/usr/bin/env node
/* ============================================
   PRERENDER
   Writes each case study's full text into its HTML, so the page can be
   read without running JavaScript: search engines, link previews, AI
   and recruiting tools, and readers with JavaScript turned off.

   It runs the story engine itself (render() in js/story.js) in Node,
   so the HTML it writes is exactly what the engine builds in a
   browser. For each work/<slug>/index.html with <main data-story>:
     1. <main> gets the rendered story, stamped with
        data-prerendered="<fingerprint>" (see mount() in js/story.js)
     2. the share block in <head> gets link-preview tags (Open Graph,
        Twitter card, canonical link) built from the story's meta, the
        page's <title> and its meta description
   index.html gets a share block too (SHARE_HOME below).

   RUN IT after changing anything in case-studies/, the HTML that
   js/story.js builds, or a case study's <title> or meta description:
     node scripts/prerender.mjs           update the pages
     node scripts/prerender.mjs --check   change nothing; exit 1 if any
                                          page is out of date (run this
                                          before deploying)
   No dependencies. Needs Node 18 or newer.
   ============================================ */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// The site's public address, with no trailing slash. Preview images
// and canonical links must be full URLs. www, because umadhamija.com
// redirects there; tags should name the address that answers.
const SITE_URL = 'https://www.umadhamija.com';

// Homepage preview. The headshot is nearly square, so it uses the small
// 'summary' card, which shows it whole; a wide card would crop the face.
const SHARE_HOME = {
  file: 'index.html',
  image: { src: 'images/headshot-1600.jpg', width: 1600, height: 1515, alt: 'Portrait of Uma Dhamija' },
  card: 'summary',
};

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');


/* --- The story engine, loaded as a browser would load it --- */

// js/story.js expects a browser. These stubs cover what it touches
// while loading; render() itself never uses the DOM. matches: true
// reads as "reduced motion", which skips the fade-in setup.
const sandbox = {
  console,
  matchMedia: () => ({ matches: true }),
  document: { readyState: 'complete', querySelectorAll: () => [], documentElement: { classList: { add() {} } } },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
const run = (file) => vm.runInContext(read(file), sandbox, { filename: file });
run('js/story.js');
const { render, fingerprint } = sandbox.Story;


/* --- Helpers --- */

const decode = (s) => s.replace(/&(amp|quot|#39|lt|gt);/g, (_, e) => ({ amp: '&', quot: '"', '#39': "'", lt: '<', gt: '>' })[e]);
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const absolute = (p) => SITE_URL + encodeURI('/' + p.replace(/^\//, ''));
const firstMatch = (page, re) => (page.match(re) || [])[1];

// Formats every link-preview service reads. SVG and WebP are left out:
// several services (LinkedIn, older iMessage) skip them.
const shareable = (im) => im && !im.placeholder && /\.(jpe?g|png|gif)$/i.test(im.src || '');

function imageTags(im) {
  if (!SITE_URL || !shareable(im)) return [];
  return [
    `<meta property="og:image" content="${attr(absolute(im.src))}">`,
    im.width && `<meta property="og:image:width" content="${im.width}">`,
    im.height && `<meta property="og:image:height" content="${im.height}">`,
    im.alt && `<meta property="og:image:alt" content="${attr(im.alt)}">`,
  ];
}

// Replaces the share block, or adds one right after <title>.
const START = '<!-- share:start (link previews; written by scripts/prerender.mjs, edit it there) -->';
const END = '<!-- share:end -->';
function withShareBlock(page, file, tags) {
  const block = [START, ...tags.filter(Boolean), END].join('\n  ');
  const existing = /<!-- share:start[\s\S]*?<!-- share:end -->/;
  if (existing.test(page)) return page.replace(existing, () => block);
  if (!/<\/title>/.test(page)) throw new Error(`${file}: no <title> to put the share block after`);
  return page.replace(/<\/title>/, () => `</title>\n  ${block}`);
}

// Fills <main data-story="slug"> with the rendered story. A replacer
// function, not a string: the story's text can contain "$" (metrics
// like "$114K"), which a replacement string would treat as a pattern.
function withStory(page, slug, html) {
  const main = new RegExp(`(<main\\b[^>]*\\bdata-story="${slug}"[^>]*>)[\\s\\S]*?</main>`);
  return page.replace(main, (_, open) => {
    const tag = open.replace(/\s+data-prerendered="[^"]*"/, '').replace(/>$/, ` data-prerendered="${fingerprint(html)}">`);
    return `${tag}${html}\n  </main>`;
  });
}


/* --- Pages --- */

function storyPage(file, dir, page) {
  const slug = firstMatch(page, /<main\b[^>]*\bdata-story="([^"]+)"/);
  if (!slug) return page;
  run(`case-studies/${slug}.js`);
  const c = sandbox.CaseStudies?.[slug];
  if (!c) throw new Error(`${file}: case-studies/${slug}.js registered no content for "${slug}"`);

  const { main } = render(c, firstMatch(page, /<main\b[^>]*\bdata-root="([^"]*)"/) || '/');
  const title = decode(firstMatch(page, /<title>([^<]*)<\/title>/) || c.meta.title);
  const description = decode(firstMatch(page, /<meta name="description" content="([^"]*)"/) || c.meta.subtitle);
  const url = SITE_URL && `${SITE_URL}/work/${dir}`;
  const wide = SITE_URL && shareable(c.meta.hero);

  return withShareBlock(withStory(page, slug, main), file, [
    url && `<link rel="canonical" href="${attr(url)}">`,
    '<meta property="og:type" content="article">',
    '<meta property="og:site_name" content="Uma Dhamija">',
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    url && `<meta property="og:url" content="${attr(url)}">`,
    ...imageTags(c.meta.hero),
    `<meta name="twitter:card" content="${wide ? 'summary_large_image' : 'summary'}">`,
  ]);
}

function homePage(file, page) {
  return withShareBlock(page, file, [
    SITE_URL && `<link rel="canonical" href="${attr(SITE_URL + '/')}">`,
    SITE_URL && `<meta property="og:url" content="${attr(SITE_URL + '/')}">`,
    ...imageTags(SHARE_HOME.image),
    `<meta name="twitter:card" content="${SHARE_HOME.card}">`,
  ]);
}


/* --- Run --- */

const checkOnly = process.argv.includes('--check');
const changed = [];
function update(file, build) {
  const before = read(file);
  const after = build(before);
  if (after === before) return;
  changed.push(file);
  if (!checkOnly) fs.writeFileSync(path.join(ROOT_DIR, file), after);
}

for (const dir of fs.readdirSync(path.join(ROOT_DIR, 'work')).sort()) {
  const file = `work/${dir}/index.html`;
  if (fs.existsSync(path.join(ROOT_DIR, file))) update(file, (page) => storyPage(file, dir, page));
}
update(SHARE_HOME.file, (page) => homePage(SHARE_HOME.file, page));

if (!SITE_URL) console.warn('Note: SITE_URL is empty, so preview images and canonical links are left out.');
if (checkOnly && changed.length) {
  console.error(`Out of date (run node scripts/prerender.mjs):\n  ${changed.join('\n  ')}`);
  process.exit(1);
}
console.log(changed.length ? `${checkOnly ? 'Out of date' : 'Updated'}:\n  ${changed.join('\n  ')}` : 'All pages are up to date.');
