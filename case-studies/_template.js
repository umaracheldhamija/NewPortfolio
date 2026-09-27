/* ============================================
   CASE STUDY TEMPLATE + SCHEMA REFERENCE

   The story engine (js/story.js + css/story.css) builds the whole
   page from one content object. No per-page HTML or CSS.

   ADDING A CASE STUDY (e.g. Care2Care)
   1. Copy this file to case-studies/<slug>.js, replace 'your-slug'
      below, and fill it in.
   2. Copy work/kindred/index.html to work/<slug>/index.html and
      change four things: <title>, meta description, the content
      <script src>, and data-project / data-story on <body>/<main>.
   3. On the homepage card, add data-story and point href at
      work/<slug>/ so the card morphs into the story.
   4. Give the project an accent triad in styles.css (PROJECT
      ACCENTS), or reuse an existing one.
   5. If the page is replacing an old URL, add a redirect in
      vercel.json.

   Copy rules the engine checks (warnings in the browser console):
   no em or en dashes, every image has alt text, every checkpoint and
   skip link points at a real chapter id.
   Text written as [PLACEHOLDER: ...] renders highlighted, so it can't
   ship unnoticed.

   Every image can be clicked to open full screen (and clicked again
   to see it at full size), so give srcset a large enough variant.

   Image paths are relative to the site root ('images/x.png').
   Resized variants for phones: images/story/<slug>/<name>-800.jpg
   and -1600.jpg, listed in srcset.
   ============================================ */

(window.CaseStudies ||= {})['your-slug'] = {

  /* --- Opening screen: a large version of the homepage card --- */
  meta: {
    slug: 'your-slug',
    // data-project of the homepage card this story opens from; its
    // image frame morphs into the opening screen's image.
    homeCard: 'care2care',
    title: 'Title',
    subtitle: 'One line that says what it is and who it is for.',
    tags: ['Client: Name', '3 months', 'Team of 3', 'Role: ...'],
    // Use the SAME image as the homepage card for a seamless morph.
    hero: { src: 'images/card-image.jpg', alt: 'What the image shows', width: 1600, height: 900 },
    skipTo: { label: 'Skip to the final product', chapter: 'final' },  // optional
  },

  /* --- Summary: one visible line; the rest expands on request --- */
  summary: {
    lead: 'The one-line outcome a recruiter reads in five seconds.',
    points: [
      { label: 'Problem', text: '...' },
      { label: 'Role', text: '...' },
      { label: 'Process', text: '...' },
      { label: 'Outcome', text: '...' },
    ],
    showMetrics: true,   // repeat the metrics inside the expanded summary
  },

  /* --- Diamonds: 1, 2 or more ---
     Each diamond spans from its first chapter to its last. The line
     widens through 'diverge' chapters, is widest where 'converge'
     chapters begin, and pinches to a point after the diamond's last
     chapter. stages are the labels for the two halves. */
  diamonds: [
    { id: 'main', label: 'The process', title: 'Heading for this diamond', stages: ['Discover', 'Define'] },
  ],

  /* --- Chapters, in reading order --- */
  chapters: [
    {
      id: 'kebab-case-id',       // anchor + navigator target; unique
      diamond: 'main',           // a diamond id, or null for chapters outside the line
      stage: 'diverge',          // 'diverge' | 'converge'
      nav: 'Short label',        // navigator tooltip + mobile Chapters menu

      heading: 'An insight, not an activity.',   // headings say "we"; body copy says "I"
      body: ['Paragraph one.', 'Paragraph two.'],

      quote: { text: '...', cite: 'Who said it' },          // optional, shown large
      links: { 'phrase in the copy': 'https://example.com' },  // optional, first match is linked

      // Optional. 'auto' (default) cycles text-left, text-right, wide.
      //   'text-left' | 'text-right'  text beside media (stacks below 900px)
      //   'wide'                      text, then visual, then full-width media
      //   'centered'                  centered text, then visual/media
      //   'quote'                     like wide, with the quote large
      //   'showcase'                  oversized media for the final product
      // A 'phone-rounds' visual always uses its own pinned layout.
      layout: 'auto',

      visual: null,              // optional, see VISUAL TYPES below

      // Images. An entry with 'placeholder' renders a labeled box, so
      // gaps stay visible.
      media: [
        {
          src: 'images/story/your-slug/photo-1600.jpg',
          srcset: 'images/story/your-slug/photo-800.jpg 800w, images/story/your-slug/photo-1600.jpg 1600w',
          alt: '...',
          caption: '...',        // optional
          links: { 'phrase in the caption': 'https://...' },  // optional
          width: 1600,
          height: 900,
          maxWidth: 480,         // optional: cap small source images near their real size
        },
        { placeholder: 'IMAGE: what should go here', ratio: '16 / 9' },
        // Video: silent, loops, loads near the screen, plays while
        // visible (never by itself with reduced motion), has a pause
        // button. Export as H.264 .mp4, 720p, ~2 Mbps.
        { video: 'images/story/your-slug/clip-720.mp4', poster: 'images/story/your-slug/clip-poster.jpg',
          alt: 'What happens in the clip', caption: '...', width: 1280, height: 720 },
      ],
      mediaColumns: 2,           // optional: show media as side-by-side pairs, heights matched
    },
  ],

  /* --- Checkpoints ---
     kind 'pinch'      marks the point where a diamond closes, after
                       that chapter (numbered Checkpoint 1, 2, ...)
     kind 'interlude'  a full-screen moment after that chapter, with a
                       diamond graphic showing progress so far
     Both appear in the navigator and as markers on the mobile
     progress bar. A diamond without a pinch checkpoint still closes,
     just without a label. */
  checkpoints: [
    { id: 'cp-done', kind: 'pinch', chapter: 'kebab-case-id', label: 'The outcome' },
    {
      id: 'halfway',
      kind: 'interlude',
      chapter: 'kebab-case-id',
      label: 'Halfway there',          // navigator + menu
      eyebrow: 'Diamond 1 complete',   // optional
      heading: 'Halfway there.',
      lines: ['One more line.'],
    },
  ],

  /* --- Metrics: count up once when they scroll into view --- */
  metrics: {
    heading: 'By the numbers',
    items: [
      { value: 12, suffix: '+', label: 'interviews' },
      { value: 8.5, suffix: '/10', label: 'average score', detail: 'optional second line' },
    ],
  },

  /* --- Reflection --- */
  reflection: {
    heading: 'Reflection',
    lines: ['[PLACEHOLDER: ...]'],
  },

  /* --- Related writing (optional): a list of outside links --- */
  further: {
    heading: 'Related writing',
    intro: 'One optional line above the list.',
    items: [{ title: 'Article title', meta: 'Author · 4 min read', href: 'https://...' }],
  },

  /* --- Next story, styled like a homepage card. Also linked from
     the top of the page as "Next: <name>". --- */
  next: {
    name: 'MeditationWise',   // short name for the top link
    homeCard: 'meditationwise',
    href: '/work/meditationwise/',
    story: false,     // true if that page is also built with this engine
    title: 'Card title',
    subtitle: 'Project · Context',
    image: { src: 'images/x.png', alt: '...' },
  },
};

/* ============================================
   VISUAL TYPES (chapter.visual)

   { type: 'idea-scatter', ideas: ['Idea one', ...],
     label: 'What screen readers hear',   // optional
     mobileCount: 8, tabletCount: 18 }
       Cards fly out from the centre and settle, slightly tilted.
       Phones and tablets show the first N (put the best first).

   { type: 'idea-funnel',
     axes: { x: 'Impact', y: 'Risk' },
     quadrants: { topLeft, topRight, bottomLeft, bottomRight },
     steps: [{ value: 36, label: 'ideas' }, { value: 8, label: 'worth testing' }, ...],
     points: [{ label, x: 0-1, y: 0-1, category, shortlisted: true|false }] }
       Dots plot themselves, then everything except the shortlist
       fades back; shortlisted dots get numbers matching the list.

   { type: 'feature-cards',
     items: [{ title, text, image: { src, alt, width, height } }] }

   { type: 'phone-rounds',
     rounds: [{ label: 'Low fidelity', text: 'optional line',
                points: ['optional finding', '...'],   // bullets under the label
                media: { src, alt } | { placeholder } | { embed: 'https://...', title },
                link: { label, href } }] }            // link: optional
       A pinned phone whose screen changes per round (900px and up);
       a stacked, labeled sequence on phones. An embed shows a live
       prototype (rendered at 390px wide and scaled to the frame); it
       stays inert until "Try the prototype" is pressed, so it never
       traps page scrolling.

   { type: 'pinned', frame: 'phone' | 'browser' | 'photo',
     kicker: 'Step',                       // label prefix: Step 1, Step 2...
     url: 'site.com',                      // browser frame only, shown in the bar
     steps: [{ label, text, points, link,
               media: { src, alt, fit: 'cover' | 'contain' } | { placeholder }
                    | { embed: '/path/', title, start: 'Button label' }
                    | { motion: 'track' | 'focus' | 'reach', alt } }] }
       Like phone-rounds, in any frame: the frame stays pinned while the
       steps scroll past and its contents change. A browser embed is
       rendered at 1280px wide. motion: small looping eye-exercise
       illustrations (paused with reduced motion).

   { type: 'prototypes',
     items: [{ label: 'Caregiver side', detail: 'Mobile app',
               frame: 'phone' | 'browser',
               url: 'site.com',                    // browser frame only
               embed: 'https://...', title: 'What screen readers hear',
               link: { label, href } }] }          // link: optional
       Live prototypes side by side (the web app wide, the phone beside
       it; stacked on phones). Same "Try the prototype" behaviour as
       above. While one is in use its frame grows slightly and glows;
       clicking outside it or scrolling away ends that.

   { type: 'journey', stops: [{ label, text }] }
       A line that draws itself, with stops popping in one by one.
       Vertical on phones.

   { type: 'reframe', from: 'Old framing', to: 'New framing', caption }
       The old framing gets a hand-drawn strike, then the new one
       slides in.

   { type: 'bridge', left: { title, items: [] }, right: { title, items: [] },
     gap: 'The gap', bridge: 'Product name' }
       Two sides with a dashed gap that closes into a solid line.

   { type: 'gallery', media: [ ...same shape as chapter.media ], columns: 2 }
       Default: first image full width, the rest in two columns.
       columns: 2 shows side-by-side pairs with matched heights.
   ============================================ */
