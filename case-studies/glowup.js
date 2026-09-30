/* ============================================
   GLOWUP EYE CARE (Northwestern capstone) case study content.
   Schema: see case-studies/_template.js
   Rendered by js/story.js into work/glowup/index.html.

   A solo thesis, so headings say "I" rather than "we".
   Copy and numbers come from the previous GlowUp page and the
   homepage card. The reflection is a draft built from that page's
   outcomes: edit freely.
   Resized image variants live in images/story/glowup/.
   ============================================ */

(window.CaseStudies ||= {}).glowup = {

  meta: {
    slug: 'glowup',
    homeCard: 'glowup',
    title: 'GlowUp Eye Care',
    subtitle: 'Playful XR exercises that help children stick with the eye training they need.',
    tags: ['Northwestern capstone', '6 weeks', 'Individual thesis', 'Role: Research and Experience Design'],
    // Same image as the homepage card, so the card can morph into it.
    hero: { src: 'images/NWphoto.jpg', alt: 'A child in a VR headset pointing upward in a bright classroom', width: 1024, height: 1024 },
    skipTo: { label: 'Skip to the design', chapter: 'sessions' },
  },

  summary: {
    lead: 'Reframed a childhood eye-care problem from awareness to adherence, and designed XR exercises children would actually finish.',
    points: [
      { label: 'Problem', text: 'Children with early oculomotor difficulty are given eye exercises that are repetitive, hard to track and easy to abandon.' },
      { label: 'Role', text: 'Research and Experience Design, as an individual thesis.' },
      { label: 'Process', text: 'A six-week project: 4 weeks of research, including 6+ interviews with leading ophthalmologists, then a speculative XR exercise system built around child attention spans.' },
      { label: 'Outcome', text: 'A design strategy for child-friendly, therapy-adjacent interaction, with playful, trackable routines and support for caregivers at home.' },
    ],
    showMetrics: true,
  },

  diamonds: [
    { id: 'problem', label: 'Diamond 1', title: 'Finding the real problem', stages: ['Discover', 'Define'] },
    { id: 'solution', label: 'Diamond 2', title: 'Designing for play', stages: ['Develop', 'Deliver'] },
  ],

  chapters: [

    /* ---------- Diamond 1: Finding the real problem ---------- */

    {
      id: 'context',
      diamond: 'problem',
      stage: 'diverge',
      nav: 'The context',
      heading: 'Children with early oculomotor challenges can struggle to stay engaged with repetitive eye exercises.',
      body: [
        'Children now spend long hours on close-focus digital tasks, while early signs of visual strain and oculomotor difficulty often go unnoticed.',
        'I set out to explore how design could make therapeutic eye exercises more engaging and easier to sustain, for children with early oculomotor challenges and the caregivers who support them.',
      ],
      layout: 'centered',
      media: [],
    },

    {
      id: 'research',
      diamond: 'problem',
      stage: 'diverge',
      nav: 'Research',
      heading: 'Families were given instructions, and very little else.',
      body: [
        'Over 4 weeks of research, including interviews with 6+ leading ophthalmologists and desk research, the same gap kept appearing.',
        'Families are usually given exercise instructions, but little support for motivation, pacing or confidence that they are doing it right.',
      ],
      layout: 'wide',
      visual: {
        type: 'bridge',
        left: { title: 'What families get', items: ['Exercise instructions'] },
        right: { title: 'What they need at home', items: ['Motivation', 'Pacing', 'Confidence they are doing it right'] },
        gap: 'The gap',
        bridge: 'GlowUp',
      },
      media: [
        {
          src: 'images/story/glowup/stem-1600.jpg',
          srcset: 'images/story/glowup/stem-800.jpg 800w, images/story/glowup/stem-1600.jpg 1600w',
          alt: 'A group of students at a Girl Scouts STEM session, gathered in front of a Thank you for the opportunity slide',
          width: 1600,
          height: 1200,
          maxWidth: 640,
        },
      ],
    },

    {
      id: 'adherence',
      diamond: 'problem',
      stage: 'converge',
      nav: 'Adherence',
      heading: 'The real problem was adherence, not awareness.',
      body: [
        "Existing exercises fail because children abandon them, not because families don't know about them.",
        'So the design had to balance clinical goals, safety and a child\'s attention span, turn specialist eye movement exercises into interactions that feel intuitive, and help caregivers track consistency and progress over time.',
      ],
      layout: 'centered',
      visual: { type: 'reframe', from: 'Awareness', to: 'Adherence' },
      media: [],
    },

    /* ---------- Diamond 2: Designing for play ---------- */

    {
      id: 'sessions',
      diamond: 'solution',
      stage: 'diverge',
      nav: 'Short sessions',
      heading: "I built each session around a child's attention span, not a clinic's schedule.",
      body: [
        'GlowUp Eye Care is a guided XR exercise system. Short, focused sessions train three skills, and difficulty ramps up gradually so sessions stay approachable while still reinforcing the therapeutic movements.',
      ],
      // Simple illustrations of each skill, not screens from the design.
      visual: {
        type: 'pinned',
        frame: 'photo',
        kicker: 'Skill',
        steps: [
          { label: 'Tracking', text: 'Following a moving target smoothly with the eyes.', media: { motion: 'track', alt: 'Illustration: a dot tracing a figure eight' } },
          { label: 'Focus shifting', text: 'Switching focus between something near and something far.', media: { motion: 'focus', alt: 'Illustration: focus moving between a near circle and a far one' } },
          { label: 'Eye-hand coordination', text: 'Spotting a target, then reaching for it.', media: { motion: 'reach', alt: 'Illustration: a target appearing in new places and being tapped' } },
        ],
      },
      media: [],
    },

    {
      id: 'glowup',
      diamond: 'solution',
      stage: 'converge',
      nav: 'GlowUp',
      heading: 'Play and therapy became the same action.',
      body: [
        'Every game-like task is aligned to a specific visual movement goal, turning clinical repetition into a playful, trackable routine.',
        'Caregivers get simple summaries that support continuity at home.',
      ],
      layout: 'centered',
      media: [
        {
          video: 'images/gazeFlow.mp4',
          webm: 'images/story/glowup/gazeflow-720.webm',
          poster: 'images/story/glowup/gazeflow-poster.jpg',
          alt: 'GazeFlow seen through a VR headset: teal tiles float in a dark, starry space and light up pale yellow as the viewer looks at them, with a virtual hand in view',
          caption: 'GazeFlow, an XR eye-tracking prototype made in collaboration with Rabiat Sadiq. View the project on GitHub.',
          links: { 'View the project on GitHub': 'https://github.com/RabiatS/GazeFlow' },
          width: 1280,
          height: 720,
          maxWidth: 880,
        },
      ],
    },
  ],

  checkpoints: [
    { id: 'cp-adherence', kind: 'pinch', chapter: 'adherence', label: 'Adherence, not awareness' },
    {
      id: 'halfway',
      kind: 'interlude',
      chapter: 'adherence',
      label: 'Halfway there',
      eyebrow: 'Diamond 1 complete',
      heading: 'Halfway there.',
      lines: ['Children did not need to know more. They needed a reason to keep going.'],
    },
    { id: 'cp-glowup', kind: 'pinch', chapter: 'glowup', label: 'GlowUp Eye Care' },
  ],

  metrics: {
    heading: 'By the numbers',
    items: [
      { value: 6, suffix: '+', label: 'interviews with ophthalmologists' },
      { value: 6, label: 'weeks in total', detail: 'including 4 weeks of research' },
    ],
  },

  reflection: {
    heading: 'Reflection',
    // Draft built from the previous page's outcomes: edit freely.
    lines: [
      'This project built my fluency in designing for healthcare, for families and for the wide variation in how children develop.',
      'It also convinced me that engagement design is critical to therapy, not a layer on top of it. I designed play to make repeated practice more engaging.',
    ],
  },

  next: {
    name: 'Electric Scooters',
    homeCard: 'electric-scooters',
    href: '/work/electric-scooters/',
    story: true,
    title: 'When the rider is 8 years old, everything about the design changes',
    subtitle: 'Electric Scooters for Kids',
    image: { src: 'images/photo.png', alt: 'Render of the scooter handlebar with labeled controls' },
  },
};
