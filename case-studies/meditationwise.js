/* ============================================
   MEDITATIONWISE case study content.
   Schema: see case-studies/_template.js
   Rendered by js/story.js into work/meditationwise/index.html.

   Copy and numbers come from the previous MeditationWise page, the
   homepage card and the app's own banner. The reflection is a draft
   built from that page: edit freely.
   Resized image variants live in images/story/meditationwise/.
   ============================================ */

(window.CaseStudies ||= {}).meditationwise = {

  meta: {
    slug: 'meditationwise',
    homeCard: 'meditationwise',
    title: 'MeditationWise',
    subtitle: 'A meditation app that connects people to tradition-rooted practices and helps them build a lasting habit.',
    tags: ['Startup', '7 months', 'Team of 3', 'Role: Lead Designer', 'Ongoing'],
    // Same image as the homepage card, so the card can morph into it.
    hero: { src: 'images/MW-logo.png', alt: 'MeditationWise logo', width: 1368, height: 1068 },
    skipTo: { label: 'Skip to the final product', chapter: 'meditationwise' },
  },

  summary: {
    lead: 'Led the end-to-end redesign of a meditation app, making sixty techniques easy to find without flattening the traditions behind them.',
    points: [
      { label: 'Problem', text: 'Fragmented navigation and discovery flows overwhelmed new users before they could form a practice.' },
      { label: 'Role', text: 'Lead Designer, covering navigation, session flows and a scalable design system.' },
      { label: 'Process', text: 'With my team of three: interviews and task analysis, personas and journeys, then 9+ usability sessions over 4 months.' },
      { label: 'Outcome', text: 'A redesigned onboarding and browse experience that reduces cognitive load while keeping the cultural depth that sets MeditationWise apart.' },
    ],
    showMetrics: true,
  },


  chapters: [

    /* ---------- Finding what got in the way ---------- */

    {
      id: 'brief',
      nav: 'The brief',
      heading: 'We were not building a content feed. We were building a practice.',
      body: [
        'Most meditation apps optimize for quick content consumption. MeditationWise needed the opposite: to help people build a consistent personal practice rooted in cultural context, intention and trust.',
        'The business needed better discoverability and retention in a crowded wellness category. People needed practices that matched their beliefs, goals and experience level.',
      ],
      layout: 'wide',
      visual: { type: 'reframe', from: 'Quick content', to: 'A lasting practice' },
      media: [],
    },

    {
      id: 'research',
      nav: 'Research',
      heading: 'We found people were overwhelmed before they ever started a practice.',
      body: [
        'I ran interviews and task analysis to find where navigation and relevance broke down. The existing platform had fragmented navigation and little emotional resonance.',
        'Then I built personas and journeys to prioritize decisions around search, categorization and guidance.',
      ],
      layout: 'wide',
      visual: {
        type: 'journey',
        stops: [
          { label: 'Interviews' },
          { label: 'Task analysis' },
          { label: 'Personas and journeys' },
          { label: 'Usability testing' },
          { label: 'Refine' },
        ],
      },
      media: [
        {
          src: 'images/story/meditationwise/wireframes-1600.jpg',
          srcset: 'images/story/meditationwise/wireframes-800.jpg 800w, images/story/meditationwise/wireframes-1600.jpg 1600w',
          alt: 'Hand-drawn sketch of a 22 year old user profile with pain points, goals and ideal experience, next to wireframes for the Meditate, Articles, Learn and Progression pages',
          caption: 'Early sketches: a user profile, then the first page structure.',
          width: 1600,
          height: 1068,
          maxWidth: 880,
        },
      ],
    },

    {
      id: 'tension',
      nav: 'The tension',
      heading: 'The depth that made the app special was also what made it hard to start.',
      body: [
        'We had to stand apart from generic mindfulness apps without overwhelming new users, reduce cognitive load while still supporting many traditions and content types, and build a foundation that could grow with new content, sessions and goals.',
      ],
      layout: 'centered',
      media: [],
    },

    /* ---------- Designing a calmer way in ---------- */

    {
      id: 'wayfinding',
      nav: 'Wayfinding',
      heading: 'We let people find a practice by need, level or tradition.',
      body: [
        'The final concept put wayfinding first and reduced decision fatigue, with favorites, scheduling, journaling and progress tracking to support the habit between sessions.',
      ],
      visual: {
        type: 'pinned',
        frame: 'phone',
        kicker: 'Screen',
        steps: [
          {
            label: 'Begin',
            text: 'A calm welcome with a single place to start.',
            media: { src: 'images/story/meditationwise/screen-welcome-680.jpg', alt: 'MeditationWise welcome screen with a Get Started button and a sign in link', width: 680, height: 1478 },
          },
          {
            label: 'Meditate',
            text: 'Browse by need, level or tradition. Each technique explains its origins and is available in guided, step-by-step, or timer-only formats.',
            media: { src: 'images/story/meditationwise/screen-session-690.jpg', alt: 'A Raja Yoga Meditation session, found by need, with guided, steps only and timer only options, a player and a technique description', width: 690, height: 1480 },
          },
          {
            label: 'Learn',
            text: 'Meet the teachers behind the practices, and start with the basics, like what type of meditation is right for you.',
            media: { src: 'images/story/meditationwise/screen-learn-684.jpg', alt: 'Learn screen with Meet the Teachers and Meditation Basics, including What type of meditation is right for you', width: 684, height: 1480 },
          },
          {
            label: 'Progress',
            text: 'Streaks, total time, scheduling and history keep the habit going between sessions.',
            media: { src: 'images/story/meditationwise/screen-progress-682.jpg', alt: 'Progress screen with a current streak of 3 days and cards for scheduling, subscription and history', width: 682, height: 1480 },
          },
        ],
      },
      media: [],
    },

    {
      id: 'testing',
      nav: 'Testing',
      heading: 'Testing with 9+ people showed us where discovery broke down.',
      body: [
        'I tested wireframes and prototypes with users over 4 months, then refined the hierarchy and interaction patterns.',
        'Each round improved how well people understood the content structure and found their way to a technique.',
      ],
      layout: 'text-right',
      media: [
        {
          src: 'images/story/meditationwise/figma-1600.jpg',
          srcset: 'images/story/meditationwise/figma-800.jpg 800w, images/story/meditationwise/figma-1600.jpg 1600w',
          alt: 'The MeditationWise Figma file, with screens grouped into auth, meditate, learn, progress and scheduling, favorites, journal, search, settings and support, subscription and onboarding',
          caption: 'The prototype in Figma, organized by flow.',
          width: 1600,
          height: 1457,
        },
      ],
    },

    {
      id: 'meditationwise',
      nav: 'MeditationWise',
      heading: 'A calm, grounded app that invites a practice instead of a streak.',
      body: [
        'The visual language is soft and grounded, with clear hierarchy and supportive microcopy that keep sessions approachable rather than transactional.',
        'MeditationWise is now on the App Store. You can also read the full deliverable.',
      ],
      links: { 'read the full deliverable': '/work/meditationwise/MeditationWise%20Mobile%20App.pdf' },
      layout: 'showcase',
      mediaColumns: 2,
      media: [
        {
          src: 'images/story/meditationwise/banner-1600.jpg',
          srcset: 'images/story/meditationwise/banner-800.jpg 800w, images/story/meditationwise/banner-1600.jpg 1600w',
          alt: 'MeditationWise: Meditate with intention. Sixty techniques across every tradition, matched to how you actually feel. Phone mockups of the progress, meditation and learn screens.',
          width: 1600,
          height: 900,
        },
        {
          src: 'images/story/meditationwise/flow-1600.jpg',
          srcset: 'images/story/meditationwise/flow-800.jpg 800w, images/story/meditationwise/flow-1600.jpg 1600w',
          alt: 'MeditationWise on the App Store: Awaken the wisdom within, with preview screens for welcome, a guided session, learning and progress',
          caption: 'MeditationWise on the App Store.',
          width: 1600,
          height: 1340,
        },
        {
          src: 'images/story/meditationwise/screens-1600.jpg',
          srcset: 'images/story/meditationwise/screens-800.jpg 800w, images/story/meditationwise/screens-1600.jpg 1600w',
          alt: 'Eight MeditationWise screens: splash, welcome, browsing by level, Meet the Teachers, sign up, a guided Raja Yoga session, favorites and a progress profile',
          caption: 'From sign up to a guided session, favorites and progress.',
          width: 1600,
          height: 1340,
        },
      ],
    },
  ],

  checkpoints: [
    {
      id: 'halfway',
      kind: 'interlude',
      chapter: 'tension',
      label: 'Halfway there',
      heading: 'Halfway there.',
      lines: ['We knew what was in the way. Now we had to design around it.'],
    },
  ],

  metrics: {
    heading: 'By the numbers',
    items: [
      { value: 9, suffix: '+', label: 'usability sessions' },
      { value: 4, label: 'months of testing' },
      { value: 60, label: 'meditation techniques' },
    ],
  },

  reflection: {
    heading: 'Reflection',
    // Draft built from the previous page: edit freely.
    lines: [
      'Simplifying did not have to mean flattening. The redesign made exploration easier while keeping the depth and authenticity that made the product meaningful.',
      'Designing a system, not just screens, gave the app a direction it can grow into as content, sessions and goals expand.',
    ],
  },

  next: {
    name: 'GlowUp',
    homeCard: 'glowup',
    href: '/work/glowup/',
    story: true,
    title: 'How might we make eye-therapy exercises work for children?',
    subtitle: 'GlowUp Eye Care · Northwestern',
    image: { src: 'images/NWphoto.jpg', alt: 'A child in a VR headset pointing upward' },
  },
};
