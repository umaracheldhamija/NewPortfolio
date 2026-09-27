/* ============================================
   KINDRED (OpenMined capstone) case study content.
   Schema: see case-studies/_template.js
   Rendered by js/story.js into work/kindred/index.html.

   Numbers come from the previous OpenMined page. Placeholders are
   marked [PLACEHOLDER: ...] and render as visible boxes.
   Resized image variants live in images/story/kindred/.
   ============================================ */

(window.CaseStudies ||= {}).kindred = {

  meta: {
    slug: 'kindred',
    homeCard: 'kindred',
    title: 'Kindred',
    subtitle: 'A privacy-first AI health companion for people living with chronic conditions.',
    tags: ['Client: OpenMined', '6 months', 'Team of 4', 'Role: UX Designer'],
    // Same image as the homepage card, so the card can morph into it.
    hero: {
      src: 'images/story/kindred/om-hero-1600.jpg',
      srcset: 'images/story/kindred/om-hero-800.jpg 800w, images/story/kindred/om-hero-1600.jpg 1600w',
      alt: 'OpenMined logo',
      width: 1600,
      height: 900,
    },
    skipTo: { label: 'Skip to the final product', chapter: 'kindred' },
  },

  summary: {
    lead: 'Turned an open-ended brief into a clinician-validated health app, ready for development, in 6 months.',
    points: [
      { label: 'Problem', text: 'OpenMined had powerful privacy technology and no consumer use case.' },
      { label: 'Role', text: 'UX Designer' },
      { label: 'Process', text: 'Two rounds of the double diamond with my team of four: from technology to 36 ideas to one use case, then from 36 features to 17 worth testing to the 5 feature sets that mattered.' },
      { label: 'Outcome', text: 'Kindred, with an average recommendation score of 8/10 from patients and 8.5/10 from clinicians.' },
    ],
    showMetrics: true,
  },

  diamonds: [
    { id: 'problem', label: 'Diamond 1', title: 'Finding the right problem', stages: ['Discover', 'Define'] },
    { id: 'solution', label: 'Diamond 2', title: 'Building the right thing', stages: ['Develop', 'Deliver'] },
  ],

  chapters: [

    /* ---------- Diamond 1: Finding the right problem ---------- */

    {
      id: 'brief',
      diamond: 'problem',
      stage: 'diverge',
      nav: 'The brief',
      heading: 'We started with almost nothing.',
      body: ['OpenMined gave us three things: their mission, a goal of reaching consumers, and their website. The mission read like this:'],
      quote: {
        text: 'A non-profit community building technology that enables secure computation across siloed data, unlocking collective intelligence while preserving attribution-based control.',
        cite: 'OpenMined',
      },
      links: { 'attribution-based control': 'https://openmined.org/attribution-based-control/' },
      layout: 'quote',
      media: [
        {
          video: 'images/story/kindred/timelapse-720.mp4',   // from images/Timelapse.MOV
          webm: 'images/story/kindred/timelapse-720.webm',  // fallback for browsers without H.264
          poster: 'images/story/kindred/timelapse-poster.jpg',
          alt: 'Timelapse of the team sorting research sticky notes into groups on a whiteboard',
          caption: 'A timelapse of us sorting what we learned on the whiteboard.',
          width: 1280,
          height: 720,
          maxWidth: 720,   // a supporting moment, not the main visual
        },
      ],
    },

    {
      id: 'technology',
      diamond: 'problem',
      stage: 'diverge',
      nav: 'The technology',
      heading: 'Before we could narrow down, we had to understand the technology.',
      body: [
        'I spent a month on desk research into secure computation and decentralized communities, reading 50 primary research articles and 73 secondary papers.',
        'Alongside it, I ran a survey on how people feel about AI and privacy. It drew 82 responses.',
      ],
      layout: 'text-left',
      media: [
        {
          src: 'images/story/kindred/tech-stack-1600.jpg',
          srcset: 'images/story/kindred/tech-stack-800.jpg 800w, images/story/kindred/tech-stack-1600.jpg 1600w, images/story/kindred/tech-stack-2442.jpg 2442w',
          alt: "Diagram of OpenMined's stack under attribution-based control: PySyft, SyftBox and privacy-enhancing technologies",
          caption: "OpenMined's technology stack, held together by attribution-based control.",
          width: 2442,
          height: 1358,
        },
      ],
    },

    {
      id: 'ideas',
      diamond: 'problem',
      stage: 'diverge',
      nav: '36 ideas',
      heading: 'Once we understood it, we saw possibilities everywhere.',
      body: ['Through 18 SME interviews and generative workshops (Crazy 8s, How Might We, and more), we generated 36 use case ideas: from a mental health tool built on private health records, to an elderly health kit, to a shopping recommendation platform.'],
      layout: 'wide',
      visual: {
        type: 'idea-scatter',
        mobileCount: 8,
        tabletCount: 18,
        // Most recognisable first, so the phone subset still reads as a
        // spread of domains.
        ideas: [
          'Therapy and mental health', 'Elderly health kit', 'Shopping recommendations', 'Dating app',
          'Carbon footprint benchmarking', 'Code refactoring', 'Ayurveda', 'Vacation planning',
          'Prescription and symptom relief', 'Support groups', 'Memory capture device', 'Personal physical wellness',
          'Aggregated surveys', 'Student pathfinder', 'Music recommendations', 'Parenting techniques',
          'Citizen scientists', 'Employment pipeline', 'Tourism mindfulness', 'Robotics medical tech',
          'Personal financial advisors', 'Clinical crowdsourcing', 'Disability advocacy tool', 'Creative Commons IP protection',
          'Speech and language education', 'Small business benchmarking', 'Public transport safety', 'Individually sourced cultural AI',
          'Agricultural advising', 'Community engagement platform', 'Influencer engagement tool', 'Biodiversity documentation',
          'Heuristic evaluation aggregator', 'Philanthropist cause-finding', 'Diverse voice dataset', 'Fashion curation',
        ],
      },
      media: [
        {
          src: 'images/story/kindred/ideation-methods-1600.jpg',
          srcset: 'images/story/kindred/ideation-methods-800.jpg 800w, images/story/kindred/ideation-methods-1600.jpg 1600w',
          alt: 'Ideation methods: How Could We sticky notes, Thing from the Future sketches, and a creative matrix grid',
          caption: 'Three of the generative methods behind the 36 ideas.',
          width: 1600,
          height: 890,
        },
      ],
    },

    {
      id: 'choosing',
      diamond: 'problem',
      stage: 'converge',
      nav: 'Choosing one',
      heading: 'Then came the hard part: choosing one.',
      body: [
        'I plotted every idea on an impact vs. risk matrix.',
        'Then I ran speed dating sessions with 44 people to test how they felt about the top 8.',
      ],
      layout: 'text-right',
      visual: {
        type: 'idea-funnel',
        axes: { x: 'Impact', y: 'Risk' },
        quadrants: { topLeft: 'Low viability', topRight: 'Strategic', bottomLeft: 'Low priority', bottomRight: 'High viability' },
        steps: [
          { value: 36, label: 'ideas' },
          { value: 8, label: 'worth testing' },
          { value: 1, label: 'winner' },
        ],
        // Positions read from images/kindred-decision-matrix.png.
        // x: impact (0 low, 1 high). y: risk (0 low, 1 high).
        points: [
          { label: 'Therapy and mental health', x: 0.92, y: 0.96, category: 'consulting', shortlisted: true },
          { label: 'Aggregated surveys', x: 0.68, y: 0.77, category: 'community', shortlisted: true },
          { label: 'Elderly health kit', x: 0.86, y: 0.77, category: 'consulting', shortlisted: true },
          { label: 'Prescription and symptom relief', x: 0.60, y: 0.69, category: 'recommendation', shortlisted: true },
          { label: 'Shopping recommendations', x: 0.69, y: 0.68, category: 'recommendation', shortlisted: true },
          { label: 'Personal physical wellness', x: 0.77, y: 0.41, category: 'consulting', shortlisted: true },
          { label: 'Small business benchmarking', x: 0.86, y: 0.41, category: 'benchmarking', shortlisted: true },
          { label: 'Code refactoring', x: 0.59, y: 0.23, category: 'recommendation', shortlisted: true },
          { label: 'Dating app', x: 0.05, y: 0.95, category: 'community' },
          { label: 'Community engagement platform', x: 0.23, y: 0.76, category: 'community' },
          { label: 'Music recommendations', x: 0.46, y: 0.77, category: 'recommendation' },
          { label: 'Influencer engagement tool', x: 0.06, y: 0.68, category: 'consulting' },
          { label: 'Biodiversity documentation', x: 0.38, y: 0.64, category: 'education' },
          { label: 'Heuristic evaluation aggregator', x: 0.41, y: 0.59, category: 'benchmarking' },
          { label: 'Parenting techniques', x: 0.23, y: 0.59, category: 'consulting' },
          { label: 'Memory capture device', x: 0.85, y: 0.95, category: 'community' },
          { label: 'Personal financial advisors', x: 0.87, y: 0.91, category: 'benchmarking' },
          { label: 'Clinical crowdsourcing', x: 0.94, y: 0.90, category: 'community' },
          { label: 'Support groups', x: 0.77, y: 0.86, category: 'community' },
          { label: 'Creative Commons IP protection', x: 0.59, y: 0.77, category: 'auditing' },
          { label: 'Disability advocacy tool', x: 0.77, y: 0.82, category: 'community' },
          { label: 'Student pathfinder', x: 0.77, y: 0.74, category: 'recommendation' },
          { label: 'Robotics medical tech', x: 0.56, y: 0.66, category: 'consulting' },
          { label: 'Speech and language education', x: 0.59, y: 0.59, category: 'education' },
          { label: 'Carbon footprint benchmarking', x: 0.95, y: 0.67, category: 'benchmarking' },
          { label: 'Philanthropist cause-finding', x: 0.06, y: 0.41, category: 'recommendation' },
          { label: 'Diverse voice dataset', x: 0.41, y: 0.41, category: 'creative' },
          { label: 'Citizen scientists', x: 0.14, y: 0.23, category: 'community' },
          { label: 'Fashion curation', x: 0.19, y: 0.14, category: 'recommendation' },
          { label: 'Tourism mindfulness', x: 0.54, y: 0.41, category: 'community' },
          { label: 'Vacation planning', x: 0.62, y: 0.41, category: 'community' },
          { label: 'Public transport safety', x: 0.59, y: 0.32, category: 'community' },
          { label: 'Individually sourced cultural AI', x: 0.68, y: 0.31, category: 'auditing' },
          { label: 'Employment pipeline', x: 0.81, y: 0.32, category: 'benchmarking' },
          { label: 'Agricultural advising', x: 0.55, y: 0.05, category: 'benchmarking' },
          { label: 'Ayurveda', x: 0.68, y: 0.04, category: 'education' },
        ],
      },
      media: [],
    },

    {
      id: 'informed-patient',
      diamond: 'problem',
      stage: 'converge',
      nav: 'The Informed Patient',
      heading: 'People already ask the internet about their health. They deserve answers that are private and accurate.',
      body: [
        'That idea became The Informed Patient. It scored highest on our weighted decision matrix, which tested each of the top 8 against criteria like burning need, technical fit and legal regulations.',
        'Most people already go online with health questions, so this was the use case where health privacy and AI accuracy mattered most.',
      ],
      layout: 'text-left',
      media: [
        {
          src: 'images/story/kindred/informed-patient-swot-1600.jpg',
          srcset: 'images/story/kindred/informed-patient-swot-800.jpg 800w, images/story/kindred/informed-patient-swot-1600.jpg 1600w',
          alt: 'SWOT analysis for The Informed Patient, noting that 58.5% of US adults already search for health information online',
          caption: 'The SWOT behind the decision: 58.5% of US adults already search for health information online.',
          width: 1600,
          height: 892,
        },
      ],
    },

    /* ---------- Diamond 2: Building the right thing ---------- */

    {
      id: 'understanding',
      diamond: 'solution',
      stage: 'diverge',
      nav: 'What patients wanted',
      heading: 'We designed for sharing. Patients wanted understanding.',
      body: [
        "We assumed OpenMined's technology was best suited to a network of patients with the same condition sharing experiences, with the system showing them how many people their data had helped.",
        "Co-design sessions with 21 people, and interviews with clinicians, showed otherwise. Patients didn't want to feel watched. They wanted insight from others' data and their own, with the help of AI, personalized to their condition.",
        'Over two rounds of testing, 36 feature ideas became 17 worth testing, then the 5 feature sets that mattered most to patients and clinicians. I also made sure clinicians were comfortable with the direction.',
      ],
      layout: 'centered',
      visual: {
        type: 'feature-cards',
        items: [
          {
            title: 'Community Q&A',
            text: 'Answers from patients with a verified diagnosis, ranked by how closely they match you.',
            image: { src: 'images/kindred-feature-community-qa.png', alt: 'Community Q&A screen showing answers from patients with a verified diagnosis', width: 571, height: 851 },
          },
          {
            title: 'Timeline of You',
            text: 'Every diagnosis, lab and prescription from connected providers, on one private timeline.',
            image: { src: 'images/kindred-feature-timeline-of-you.png', alt: 'Timeline of You screen showing diagnoses, labs and prescriptions in date order', width: 566, height: 851 },
          },
          {
            title: 'Learning Modules',
            text: 'Short explainers that turn numbers like eGFR into what they mean day to day.',
            image: { src: 'images/kindred-feature-learning-modules.png', alt: 'Learning Modules screen explaining what an eGFR result means', width: 567, height: 851 },
          },
          {
            title: 'AI Search',
            text: 'Plain-language answers with every source shown. Context, never a diagnosis.',
            image: { src: 'images/kindred-feature-ai-search.png', alt: 'AI Search screen showing a plain-language answer with its sources listed', width: 576, height: 861 },
          },
          // Four cards for the five feature sets: one card covers two.
        ],
      },
      media: [],
    },

    {
      id: 'testing',
      diamond: 'solution',
      stage: 'converge',
      nav: 'Testing',
      heading: 'Three rounds of testing, each one sharper.',
      body: ['Low fidelity, then mid fidelity, then a working high-fidelity prototype, with over 30 participants across the rounds.'],
      visual: {
        type: 'phone-rounds',
        rounds: [
          {
            label: 'Low fidelity',
            // Draft: edit freely.
            points: [
              'We sketched 36 possible features and brought them to co-design sessions with 21 people.',
              'Together, we narrowed them to the 17 worth testing.',
            ],
            media: { src: 'images/om-low-fidelity.png', alt: 'Low-fidelity home screen in greyscale: a greeting, an Ask anything search, a learning module, and a timeline preview', width: 810, height: 1698 },
          },
          {
            label: 'Mid fidelity',
            // Draft: edit freely.
            points: [
              'We built the 17 into mid-fidelity screens and narrowed them to the 5 feature sets that mattered most to patients and clinicians.',
              "Each of the 5 also had to deliver on what makes OpenMined's technology valuable: insight is shared, but the data never moves.",
            ],
            media: { src: 'images/om-mid-fi.png', alt: 'Mid-fidelity home screen with widgets for a kidney learning module, the kidney community, the health timeline and an upcoming appointment', width: 818, height: 1700 },
          },
          {
            label: 'High fidelity',
            text: 'The final round was a working prototype. Try it here.',
            media: { embed: 'https://oolusina.github.io/Kindred_prototype/#/home', title: 'Kindred high-fidelity prototype' },
            link: { label: 'Open the prototype in a new tab', href: 'https://oolusina.github.io/Kindred_prototype/#/home' },
          },
        ],
      },
      media: [],
    },

    {
      id: 'codesign',
      diamond: 'solution',
      stage: 'converge',
      nav: 'Co-design',
      heading: 'We designed with patients and clinicians, not just for them.',
      body: ['Through co-design sessions and design workshops, patients and clinicians shaped the product alongside us.'],
      layout: 'wide',
      visual: {
        type: 'gallery',
        columns: 2,   // side-by-side pairs, heights matched
        media: [
          {
            src: 'images/story/kindred/codesign-session-1161.jpg',
            srcset: 'images/story/kindred/codesign-session-800.jpg 800w, images/story/kindred/codesign-session-1161.jpg 1161w',
            alt: 'Patients at a Kindred co-design session, gathered around a whiteboard of research artifacts',
            caption: 'A co-design session where patients overturned our model of the patient journey.',
            width: 1161,
            height: 668,
          },
          {
            src: 'images/om-co-design-2.png',
            alt: 'Three team members reviewing research notes pinned to a wall',
            width: 252,
            height: 144,
          },
          {
            src: 'images/story/kindred/hmw-affinity-1600.jpg',
            srcset: 'images/story/kindred/hmw-affinity-800.jpg 800w, images/story/kindred/hmw-affinity-1600.jpg 1600w',
            alt: 'How Might We affinity diagram for The Informed Patient, grouped into themes like safe haven, ease of use, support, credibility and accuracy',
            caption: 'How Might We statements from a design workshop, grouped by theme.',
            width: 1600,
            height: 832,
          },
          {
            src: 'images/story/kindred/journey-map-1600.jpg',
            srcset: 'images/story/kindred/journey-map-800.jpg 800w, images/story/kindred/journey-map-1600.jpg 1600w',
            alt: 'User journey map for The Informed Patient, showing stages, touchpoints and pain points',
            caption: 'The patient journey, mapped with the people living it.',
            width: 1600,
            height: 620,
          },
        ],
      },
      media: [],
    },

    {
      id: 'naming',
      diamond: 'solution',
      stage: 'converge',
      nav: 'The name',
      heading: 'We gave it a name.',
      body: ['My team and the clients voted on a name for the product. The winner: Kindred.'],
      layout: 'centered',
      media: [
        {
          src: 'images/story/kindred/kindred-banner-1600.jpg',
          srcset: 'images/story/kindred/kindred-banner-800.jpg 800w, images/story/kindred/kindred-banner-1600.jpg 1600w',
          alt: 'Kindred: Private health, public wisdom. Phone screens showing the health timeline, learning modules, community Q&A and AI search',
          width: 1600,
          height: 781,
        },
      ],
    },

    {
      id: 'kindred',
      diamond: 'solution',
      stage: 'converge',
      nav: 'Kindred',
      heading: 'From an open-ended brief to a product ready to build, in six months.',
      body: [
        "Kindred unifies scattered health records into one private timeline, where a medically trained AI and patients with similar diagnoses help make sense of them. It runs on OpenMined's attribution-based control, so insights are shared without the underlying data ever moving.",
        "We handed over the product, a go-to-market strategy, a build sequence and our discovery framework, which OpenMined can rerun on future ideas. OpenMined's CEO, Andrew Trask, responded enthusiastically, and Madhava, the principal engineer leading BioVault, validated our technical direction.",
      ],
      links: { 'attribution-based control': 'https://openmined.org/attribution-based-control/' },
      layout: 'showcase',
      media: [
        {
          src: 'images/story/kindred/team-presenting-1600.jpg',
          srcset: 'images/story/kindred/team-presenting-800.jpg 800w, images/story/kindred/team-presenting-1600.jpg 1600w',
          alt: "The Kindred team presenting 'Private Health, Public Wisdom: The Future of Patient Support' to OpenMined and the CMU Human-Computer Interaction Institute",
          caption: 'Presenting Kindred to OpenMined and the CMU Human-Computer Interaction Institute.',
          width: 1600,
          height: 1343,
          maxWidth: 760,
        },
      ],
    },
  ],

  checkpoints: [
    { id: 'cp-informed-patient', kind: 'pinch', chapter: 'informed-patient', label: 'The Informed Patient' },
    {
      id: 'halfway',
      kind: 'interlude',
      chapter: 'informed-patient',
      label: 'Halfway there',
      eyebrow: 'Diamond 1 complete',
      heading: 'Halfway there.',
      lines: ['One idea. Now we had to build it.'],
    },
    { id: 'cp-kindred', kind: 'pinch', chapter: 'kindred', label: 'Kindred' },
  ],

  metrics: {
    heading: 'By the numbers',
    items: [
      { value: 123, label: 'research articles and papers' },
      { value: 82, label: 'survey responses' },
      { value: 30, label: 'interviews with experts and users' },
      { value: 36, label: 'use case ideas' },
      { value: 44, label: 'speed dating participants' },
      { value: 8, suffix: '/10', label: 'recommendation score from patients', detail: '8.5/10 from clinicians' },
    ],
  },

  reflection: {
    heading: 'Reflection',
    // Draft: edit freely.
    lines: [
      "The biggest shift was realizing this was never a data-permission problem. It was a trust problem: people didn't need to understand the privacy technology, they needed to feel safe at the moment they shared something.",
      "Our first idea came from what the technology could do, not from what patients needed. Co-design corrected that, and next time I would bring patients in before the first diamond closes, not after.",
      "I would also test with clinicians from the very first round, since their comfort decided whether Kindred could work in real care.",
    ],
  },

  next: {
    name: 'Care2Care',
    homeCard: 'care2care',
    href: '/work/care2care/',
    story: true,
    title: 'Cancer caregivers also need support. We built an app for them.',
    subtitle: 'Designing w/CARE · UPMC',
    image: { src: 'images/UPMC-logo.jpg', alt: 'UPMC Magee Hospital Gynaecological Oncology Unit' },
  },
};
