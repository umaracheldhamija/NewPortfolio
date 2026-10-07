/* ============================================
   ELECTRIC SCOOTERS FOR KIDS case study content.
   Schema: see case-studies/_template.js
   Rendered by js/story.js into work/electric-scooters/index.html.

   Copy and numbers come from the previous Electric Scooters page and
   the homepage card. The previous page didn't state a role, so the
   summary has no Role line until Uma confirms hers. The reflection is a draft built from that page:
   edit freely.
   Resized image variants live in images/story/electric-scooters/.
   ============================================ */

(window.CaseStudies ||= {})['electric-scooters'] = {

  meta: {
    slug: 'electric-scooters',
    homeCard: 'electric-scooters',
    title: 'Electric Scooters for Kids',
    subtitle: 'A safer, confidence-building electric scooter, designed from the start for young riders.',
    tags: ['8 weeks', 'Team of 4', 'Safety and ergonomics', 'Physical prototyping'],
    // Same image as the homepage card, so the card can morph into it.
    hero: { src: 'images/photo.png', alt: 'Render of the scooter handlebar, labeled with adjustable handles, touch turn signals, a throttle and a power button', width: 822, height: 566 },
    skipTo: { label: 'Skip to the final prototype', chapter: 'scooter' },
  },

  summary: {
    lead: 'Designed a kid-sized electric scooter from first principles, and tested it through 3 prototype iterations against how children actually ride.',
    points: [
      { label: 'Problem', text: 'Electric scooters are designed around adult proportions and assumptions. For a child, balance, reach, braking and fit all change.' },
      { label: 'Process', text: '8 weeks with my team of four: interviews with kids and parents, 4 critical ride scenarios, sketching and paper screens, then 3 physical prototype iterations with structured critique.' },
      { label: 'Outcome', text: 'A testable prototype, and the rationale behind its geometry and controls, documented for future engineering.' },
    ],
    showMetrics: true,
  },


  chapters: [

    /* ---------- Understanding young riders ---------- */

    {
      id: 'brief',
      nav: 'The brief',
      heading: 'When the rider is 8 years old, everything about the design changes.',
      body: [
        'Existing electric scooters are designed around adult proportions and assumptions.',
        'I looked at what changes when the rider is a child: balance confidence, control accessibility, braking feedback and physical fit all become central design constraints.',
      ],
      layout: 'centered',
      visual: { type: 'reframe', from: 'Adapt adult scooters', to: 'Start from the child' },
      media: [],
    },

    {
      id: 'research',
      nav: 'Research',
      heading: 'We asked kids and parents what feels easy, what feels hard and what feels unsafe.',
      body: [
        'We planned the study for schools, parks and playgrounds.',
        'We asked children what they enjoyed about riding and asked parents whether they felt safe letting their child ride an electric scooter, including whether they allowed unsupervised rides.',
      ],
      layout: 'text-left',
      media: [
        {
          src: 'images/story/electric-scooters/interviews-960.jpg',
          srcset: 'images/story/electric-scooters/interviews-800.jpg 800w, images/story/electric-scooters/interviews-960.jpg 960w',
          alt: 'Handwritten study plan and interview questions for kids and parents, such as how safe do you feel riding an e-scooter and do you let your child ride unsupervised',
          caption: 'Our study plan and interview questions.',
          width: 960,
          height: 1506,
          maxWidth: 420,
        },
      ],
    },

    {
      id: 'scenarios',
      nav: '4 ride scenarios',
      heading: 'The biggest tension was between fun and safety.',
      body: [
        'We mapped 4 critical ride scenarios and where each could go wrong: mounting, braking, cornering and dismounting. Every design decision was anchored to them.',
        'Bar height, deck proportion and control placement directly shape posture, reaction time and how in control a child feels, so we had to reduce wobble at every start, stop and turn without taking the excitement out of riding.',
      ],
      layout: 'wide',
      visual: {
        type: 'journey',
        stops: [
          { label: 'Mounting' },
          { label: 'Braking' },
          { label: 'Cornering' },
          { label: 'Dismounting' },
        ],
      },
      media: [
        {
          src: 'images/story/electric-scooters/affinity-1390.jpg',
          srcset: 'images/story/electric-scooters/affinity-800.jpg 800w, images/story/electric-scooters/affinity-1390.jpg 1390w',
          alt: 'Affinity map on a whiteboard, with sticky notes grouped under themes like fear, safety and balance, and a parking lot of ideas like auto brake, training mode and a giant hamster ball',
          caption: 'Our affinity map, with a parking lot for the wilder ideas.',
          width: 1390,
          height: 1124,
          maxWidth: 880,
        },
      ],
    },

    /* ---------- Prototyping a safer ride ---------- */

    {
      id: 'sketching',
      nav: 'Sketching',
      heading: 'We designed from first principles, not from adult scooters.',
      body: [
        'Instead of shrinking adult conventions, we started from child proportions, balance confidence and braking instinct, and sketched as a team.',
        'Our parking lot of ideas ran from auto brakes and a training mode to bubble wrap and a giant hamster ball.',
      ],
      layout: 'wide',
      // From the parking lots on our affinity map.
      visual: {
        type: 'idea-scatter',
        label: 'Ideas from our parking lot',
        mobileCount: 8,
        tabletCount: 14,
        ideas: [
          'Auto brake', 'Training mode', 'Giant hamster ball', 'Parental mode', 'GPS tracker', 'Bubble wrap',
          'Color cues', 'Walkie-talkie', 'Auto lock', 'Mascot', 'Gamify it', 'Augmented reality',
          'Tutorial', 'Personalization', 'Drop-down training wheels', 'Record the cool moments', 'Fight the fear', 'Carbon fiber',
          'Music and colors',
        ],
      },
      media: [
        {
          src: 'images/story/electric-scooters/sketches-1600.png',
          srcset: 'images/story/electric-scooters/sketches-800.png 800w, images/story/electric-scooters/sketches-1600.png 1600w',
          alt: 'Team drawing brainstorm: sheets of scooter sketches exploring handlebars, screens, parental controls and safety features',
          caption: 'Our team drawing brainstorm.',
          width: 1600,
          height: 845,
        },
      ],
    },

    {
      id: 'build',
      nav: 'Prototyping',
      heading: 'Controls a child can understand quickly and reach comfortably.',
      body: [
        'Across three prototype iterations, we tested each version against real handling behavior rather than appearance alone.',
      ],
      visual: {
        type: 'pinned',
        frame: 'photo',
        steps: [
          {
            label: 'Paper screens',
            text: 'We prototyped the handlebar screen on paper first, with simple icons and short prompts like slow down and eyes on the road.',
            media: {
              src: 'images/story/electric-scooters/structure-1600.jpg',
              srcset: 'images/story/electric-scooters/structure-800.jpg 800w, images/story/electric-scooters/structure-1600.jpg 1600w',
              alt: 'First iteration of paper screens: prompts like auto brake on, slow down and parent mode on, and paper phone-sized screens for a map, a speed control and a welcome character',
              width: 1600,
              height: 1210,
            },
          },
          {
            label: 'In hand',
            text: 'Then we mounted it on a full-size prototype to try it in hand.',
            media: { src: 'images/story/electric-scooters/iteration-1-726.jpg', alt: 'A full-size taped prototype on a green skateboard deck, with a paper welcome screen mounted on the handlebar', width: 726, height: 962 },
          },
          {
            label: 'Building',
            text: 'We built and rebuilt the handlebar, refining steering geometry and grip position for better control feedback.',
            media: { src: 'images/story/electric-scooters/iteration-2-522.jpg', alt: 'Two team members building a handlebar prototype from foam board and blue tape', width: 522, height: 724 },
          },
          {
            label: 'Critique',
            text: 'Structured critique loops helped us converge on a safer form.',
            media: { src: 'images/story/electric-scooters/iteration-3-544.jpg', alt: 'Two team members adjusting the handlebar prototype on a work table in the studio', width: 544, height: 710 },
          },
        ],
      },
      media: [],
    },

    {
      id: 'scooter',
      nav: 'The prototype',
      heading: 'Predictable handling beat aggressive performance.',
      body: [
        'The final concept has intuitive control zones, a more stable stance and clear tactile differences between controls. It deliberately favors predictable handling over speed.',
        'We documented the rationale behind its geometry and controls to support future engineering. You can read the final deliverables and rationale.',
      ],
      links: { 'read the final deliverables and rationale': '/images/Ctrl%20+%20Alt%20+%20Elite%20--%20A4.4%20Final%20Deliverables+Rationale.pdf' },
      layout: 'showcase',
      media: [
        {
          src: 'images/story/electric-scooters/final-1600.jpg',
          srcset: 'images/story/electric-scooters/final-800.jpg 800w, images/story/electric-scooters/final-1600.jpg 1600w',
          alt: 'The final prototype: a lit handlebar screen, and the scooter on a green deck with glowing handles and underlights',
          width: 1600,
          height: 737,
        },
      ],
    },
  ],

  checkpoints: [
    {
      id: 'halfway',
      kind: 'interlude',
      chapter: 'scenarios',
      label: 'Halfway there',
      heading: 'Halfway there.',
      lines: ['Four scenarios to design for. Now we had to build it.'],
    },
  ],

  metrics: {
    heading: 'By the numbers',
    items: [
      { value: 4, label: 'critical ride scenarios' },
      { value: 3, label: 'prototype iterations' },
      { value: 8, label: 'weeks' },
    ],
  },

  reflection: {
    heading: 'Reflection',
    // Draft built from the previous page: edit freely.
    lines: [
      'Designing for children meant designing for how they actually ride, not how we assumed they would.',
      'I came away with a better way to make decisions that balance usability, safety and product appeal, instead of trading one for another.',
    ],
  },

  next: {
    name: 'Kathak Kala Kendra',
    homeCard: 'kathak-kala-kendra',
    href: '/work/kathak-kala-kendra/',
    story: true,
    title: 'A surprise website for my Kathak teacher.',
    subtitle: 'Kathak Kala Kendra',
    image: { src: 'images/story/kathak-kala-kendra/homepage-800.jpg', alt: 'Guru Dharmendra Jain with tabla beside a Kathak dancer' },
  },
};
