/* ============================================
   CARE2CARE (UPMC Magee-Womens) case study content.
   Schema: see case-studies/_template.js
   Rendered by js/story.js into work/care2care/index.html.

   Copy and numbers come from the previous Care2Care page and the
   homepage card. Each chapter's insight comes from the team's Medium
   series (linked under Related writing). The reflection is a draft
   built from that page's outcomes: edit freely.
   Nov 2026: reframed around the service design work (current state,
   co-design workshop, service blueprint, liaison statuses). New facts
   come from Uma's resume, the team's Medium series, the final
   presentation (interview counts) and the liaison prototype (the
   three statuses). Nothing is estimated.
   Resized image variants live in images/story/care2care/.
   ============================================ */

(window.CaseStudies ||= {}).care2care = {

  meta: {
    slug: 'care2care',
    homeCard: 'care2care',
    title: 'Care2Care',
    subtitle: 'A support service for caregivers of gynecologic oncology patients at UPMC Magee-Womens Hospital.',
    tags: ['Client: UPMC Magee-Womens', '8 months', 'Team of 3', 'Role: UX Research and Service Design', 'Ongoing'],
    // Same image as the homepage card, so the card can morph into it.
    hero: {
      src: 'images/story/care2care/upmc-1600.jpg',
      srcset: 'images/story/care2care/upmc-800.jpg 800w, images/story/care2care/upmc-1600.jpg 1600w',
      alt: 'The UPMC Magee-Womens sign on a wooden wall',
      width: 1600,
      height: 742,
    },
    skipTo: { label: 'Skip to the final product', chapter: 'care2care' },
  },

  summary: {
    lead: 'Designed a support service for cancer caregivers, from research to tested prototype in 3 months, then won the funding to build it with UPMC.',
    points: [
      { label: 'Problem', text: 'Caregivers of gynecologic oncology patients are overlooked by existing healthcare tools while they navigate emotionally heavy, information-dense care journeys.' },
      { label: 'Role', text: 'UX Researcher and Service Designer' },
      { label: 'Process', text: 'With my team of three, I partnered with CancerBridges, the Family CARE Center at UPMC, the University of Pittsburgh, and CMU to shadow the care team, interview patients, caregivers and staff, and run a co-design workshop. I turned what we found into patient and caregiver journey maps, an ecosystem map, and current and future-state service blueprints, then tested the concept with caregivers.' },
      { label: 'Outcome', text: 'We built a final Care2Care prototype in three months: a mobile app for caregivers and a web app for the liaisons who support them. The project received the Lucie Young Kelly Faculty Leadership Award and is in development with the Family CARE Center.' },
    ],
    showMetrics: true,
  },


  chapters: [

    /* ---------- Understanding the care system ---------- */

    {
      id: 'context',
      nav: 'The context',
      heading: 'Cancer care is hard on patients. It is also hard on the people caring for them.',
      body: [
        'Oncology care journeys are emotionally heavy, information-dense and often fragmented.',
        'I looked at how service design could reduce friction, build trust and make the care pathway easier to understand, working with patients, caregivers, nurses and frontline hospital staff.',
      ],
      insight: { label: 'Finding', text: 'Each nurse manages 30 to 50 active chemotherapy patients and answers calls within the hour. Caregiver support, meanwhile, runs on Word documents and color-coded spreadsheets kept outside the medical record.' },
      layout: 'text-left',
      media: [
        {
          src: 'images/story/care2care/selfie-care-1600.jpg',
          srcset: 'images/story/care2care/selfie-care-800.jpg 800w, images/story/care2care/selfie-care-1600.jpg 1600w',
          alt: 'Three team members taking a selfie in front of a service blueprint pinned to the wall',
          caption: 'The team in front of an early service blueprint.',
          width: 1600,
          height: 1200,
        },
      ],
    },

    {
      id: 'research',
      nav: 'Research',
      heading: 'We mapped the whole journey to find where caregivers struggle most.',
      body: [
        'I mapped end-to-end patient journeys to find the stress peaks and decision bottlenecks, and ran stakeholder interviews to line caregiver needs up with how the hospital actually runs.',
        'We interviewed more than 10 cancer caregivers, 5 patients, 4 UPMC nurses and physicians, 4 Family CARE Center staff, 2 CancerBridges staff, 2 subject matter experts and a UPMC social worker.',
        'We also shadowed the Family CARE Center at UPMC Magee to see the work up close, and ran a caregiver survey through the CancerBridges newsletter.',
      ],
      insight: { label: 'Finding', text: 'The heaviest burden was emotional, not logistical. Caregiving stacks many roles onto one person and can last over a decade, yet one caregiver told us no healthcare provider had asked about their wellbeing in eight years.' },
      links: { 'shadowed the Family CARE Center': 'https://medium.com/@yuktipoddar/a-e-i-o-u-in-action-shadowing-the-family-care-center-at-upmc-magee-1cca24440885' },
      layout: 'wide',
      // From our early ecosystem sketch (the orange map below).
      visual: {
        type: 'bridge',
        left: { title: 'Providers', items: ['Family CARE Center navigators', 'Retired nurses', 'Volunteers', 'CancerBridges'] },
        right: { title: 'Caregivers at home', items: ['Their main needs', 'Staying in touch with the care team', 'Finding and using resources'] },
        gap: 'The gap',
        bridge: 'Care2Care',
      },
      mediaColumns: 2,
      media: [
        {
          src: 'images/story/care2care/ecosystem-1600.jpg',
          srcset: 'images/story/care2care/ecosystem-800.jpg 800w, images/story/care2care/ecosystem-1600.jpg 1600w',
          alt: 'Hand-drawn map on orange paper showing a gap between providers at the Family CARE Center and caregivers at home, with clinical and non-clinical onboarding paths',
          caption: 'An early map of the gap between providers and caregivers.',
          width: 1600,
          height: 1200,
        },
        {
          src: 'images/story/care2care/team-1600.jpg',
          srcset: 'images/story/care2care/team-800.jpg 800w, images/story/care2care/team-1600.jpg 1600w',
          alt: 'The three designers in front of a wall of research insights on sticky notes',
          caption: 'Our research wall, sorted into insights.',
          width: 1600,
          height: 1366,
        },
      ],
    },

    {
      id: 'current-state',
      nav: 'Current state',
      heading: 'The current service depended on staff bridging systems by hand.',
      body: [
        'Shadowing gave me the current state of the service, both what caregivers see and what happens behind it. We observed with the A.E.I.O.U. method: activities, environments, interactions, objects and users.',
        'People: nurses and Family CARE Center staff act as the go-between for inpatient, outpatient, insurance and social work teams, often walking between wards to pass information along.',
        'Process: one pharmacy handoff can mean printing a prescription, getting a wet signature and faxing it. A missed step can leave a patient billed thousands of dollars.',
        'Technology and data: staff move between Epic, MyChart, iPads and sticky notes. Epic has no place for caregiver data, so the Family CARE Center tracks caregiver stress and capacity in its own color-coded spreadsheets.',
      ],
      insight: { label: 'Finding', text: 'Support reached caregivers by word of mouth. CancerBridges staff told us many people find their services because someone in the infusion center mentioned them, not through a formal referral.' },
      links: { 'A.E.I.O.U. method': 'https://medium.com/@yuktipoddar/a-e-i-o-u-in-action-shadowing-the-family-care-center-at-upmc-magee-1cca24440885' },
      layout: 'centered',
      media: [],
    },

    {
      id: 'uncertainty',
      nav: 'The opportunity',
      heading: 'The opportunity was in the moments of uncertainty, not only the hospital visits.',
      body: [
        'Early synthesis showed that caregivers were often overwhelmed by terminology and timing, while staff were stretched by workload and fragmented communication channels.',
        'That gave us three questions. How might we help caregivers feel informed and in control during high-stress moments? How might we close the communication gaps between caregivers and clinical teams? And how might we design support that is practical, compassionate and feasible for staff?',
      ],
      insight: 'Timing matters more than any feature. A resource offered in week 1 is noise. The same resource in week 10, when the first rush of action wears off and fatigue sets in, is a lifeline.',
      layout: 'centered',
      visual: { type: 'reframe', from: 'Hospital visits', to: 'Moments of uncertainty' },
      media: [],
    },

    /* ---------- Designing for the caregiver ---------- */

    {
      id: 'concepts',
      nav: 'Concepts',
      heading: 'We designed for guidance, reassurance and continuity, not a single screen.',
      body: [
        'I developed and tested experience concepts built on plain-language communication, pre-visit orientation and clear handoff moments between teams.',
        'We explored three concepts and let expert feedback choose the direction. Rather than one artifact, the outcome was a set of service-level recommendations that could scale across related care pathways.',
      ],
      insight: { label: 'Finding', text: 'Expert feedback on the three concepts pointed to one focus: the caregiver, the person holding everything together with the least support.' },
      links: { 'three concepts': 'https://medium.com/@allenchen-desigh/three-concepts-one-direction-learning-from-expert-feedback-b5c259155d63' },
      layout: 'text-right',
      media: [
        {
          src: 'images/story/care2care/postits-1600.jpg',
          srcset: 'images/story/care2care/postits-800.jpg 800w, images/story/care2care/postits-1600.jpg 1600w',
          alt: 'User flow for the app, from onboarding to a home page linking continuous screening, a communication hub, a resource hub and a community hub, with sticky note feedback',
          caption: 'Mapping the app, with notes from the team.',
          width: 1600,
          height: 1156,
        },
      ],
    },

    {
      id: 'workshop',
      nav: 'Workshop',
      heading: 'We put the care journey on the wall, and the gaps were about timing.',
      body: [
        'We ran a participatory design workshop at UPMC Magee with patients, caregivers, nurses and CancerBridges staff. A pilot with CMU School of Design faculty three days earlier showed that our instructions left gaps, so we rewrote the introductions, reordered the journey phases and replaced the cards that did not land.',
        'In the first activity, the Orbit Map, participants sorted resource cards into what helped, what was not enough, what they needed but could not find, and what did not apply. In the second, the Care Voyage Map, they wrote feelings, people, resources and needs onto a printed poster of the cancer journey.',
      ],
      insight: { label: 'Finding', text: 'The clearest unmet needs were information at the right time rather than a binder on day one, help with work and medical leave, and support when treatment ends and the routine of appointments disappears.' },
      links: { 'participatory design workshop': 'https://medium.com/@yuktipoddar/what-we-heard-what-we-missed-and-what-comes-next-011c541f40d5' },
      layout: 'centered',
      media: [],
    },

    {
      id: 'blueprint',
      nav: 'Blueprint',
      heading: 'The blueprint showed that the handoff mattered more than any screen.',
      body: [
        'Before wireframing, I drew the future service as a blueprint. It runs from diagnosis through treatment across four lanes: the clinician and hospital system, the caregiver, the patient, and support resources such as CancerBridges.',
        'The frontstage is what a caregiver touches: an onboarding that builds their profile, a resource hub and regular check-ins. The backstage is what makes it work: matching resources to each caregiver, and a liaison who sees a flagged check-in and reaches out.',
      ],
      insight: { label: 'Finding', text: "Mapping the backstage turned the liaison's view into a design problem of its own. What a liaison can see decides whether a caregiver who flags a hard week gets a call." },
      links: { 'a blueprint': 'https://medium.com/@umaracheldhamija/designing-for-the-invisible-details-of-caregiving-4c0ddf8e70b4' },
      layout: 'wide',
      media: [
        {
          src: 'images/story/care2care/blueprint-1600.jpg',
          srcset: 'images/story/care2care/blueprint-800.jpg 800w, images/story/care2care/blueprint-1600.jpg 1600w',
          alt: 'Hand-drawn service blueprint on a wall, with lanes for the clinician and hospital system, the caregiver, the patient and support resources, running from diagnosis to treatment, with onboarding, a resource hub, an automated check-in that flags a liaison, and a backend note on matching resources',
          caption: 'The service blueprint, from diagnosis to treatment, with the ecosystem sketch pinned beside it.',
          width: 1600,
          height: 1016,
        },
      ],
    },

    {
      id: 'testing',
      nav: 'Testing',
      heading: 'We listened to caregivers before we built anything real.',
      body: [
        'Early versions of the prototype went to caregivers in person, so we could hear where it helped and where it fell short.',
      ],
      insight: { label: 'Finding', text: "Caregivers didn't want an open forum full of worst-case stories. They wanted resources that were curated, reviewed by people who had been there, and local to Pittsburgh." },
      links: { 'listened to caregivers': 'https://medium.com/@umaracheldhamija/from-direction-to-discovery-listening-before-we-build-d0f906fb8a0e' },
      layout: 'text-left',
      media: [
        {
          src: 'images/story/care2care/testing-1352.jpg',
          srcset: 'images/story/care2care/testing-800.jpg 800w, images/story/care2care/testing-1352.jpg 1352w',
          alt: 'Two team members walking two caregivers through the Care2Care prototype on laptops at a kitchen table',
          caption: 'Early usability testing at a caregiver\'s kitchen table.',
          width: 1352,
          height: 1412,
        },
      ],
    },

    {
      id: 'care2care',
      nav: 'Care2Care',
      heading: 'Care2Care meets caregivers at onboarding, in daily life and in hard times.',
      body: ['Each stage of a caregiver\'s journey gets its own kind of support.'],
      insight: 'Technology handles the flag. A person handles the reach out.',
      visual: {
        type: 'pinned',
        frame: 'phone',
        kicker: 'Stage',
        steps: [
          {
            label: 'Onboarding',
            text: 'A short survey matches each caregiver to resources based on their specific needs and capacity.',
            media: { src: 'images/care-onb.png', alt: "Care2Care welcome screen with the app's logo, the line 'You show up for them. We'll show up for you.' and a Get Started button", width: 393, height: 844 },
          },
          {
            label: 'Daily life',
            text: 'Quick check-ins keep recommendations current and can flag high stress for a person to reach out. A resource hub collects peer-reviewed support, from financial aid to emotional counseling and symptom management.',
            media: { src: 'images/care-dash.png', alt: "Support Hub screen: resources picked for the caregiver and reviewed by people who've been there, with search and filters for local, online and hybrid support", width: 393, height: 852 },
          },
          {
            label: 'Hard times',
            text: 'Caregivers can talk to a real liaison from a network of volunteers that includes the CARE Center and CancerBridges.',
            media: { src: 'images/care-hard.png', alt: "Home screen with a 'How's it going today?' check-in, where the caregiver has picked Heavy, and their liaison, Kimm Stevens of Magee Hospital, shown below", width: 393, height: 852 },
          },
        ],
      },
      media: [],
    },

    {
      id: 'two-sides',
      nav: 'Two sides',
      heading: 'Care2Care has two sides: one for caregivers, one for the liaisons who support them.',
      body: [
        'Caregivers use the mobile app, the frontstage of the service. Liaisons, from the network of volunteers that includes the CARE Center and CancerBridges, work backstage from a web app.',
        "Every caregiver in a liaison's caseload carries one of three statuses: Stable, Needs Follow-Up or Alert. The status comes from the CARE Check, the wellbeing assessment the Family CARE Center already uses, so a liaison can see who needs a call first.",
        'Both prototypes are live below.',
      ],
      insight: "The liaison's view shows each caregiver's history and preferences, so caregivers never have to repeat their story to get help.",
      layout: 'wide',
      visual: {
        type: 'prototypes',
        items: [
          {
            label: 'Liaison side',
            detail: 'Web app',
            frame: 'browser',
            url: 'peppy-unicorn-6b3766.netlify.app',
            embed: 'https://peppy-unicorn-6b3766.netlify.app/',
            title: 'Care2Care liaison web app prototype',
            link: { label: 'Open in a new tab', href: 'https://peppy-unicorn-6b3766.netlify.app/' },
          },
          {
            label: 'Caregiver side',
            detail: 'Mobile app',
            frame: 'phone',
            embed: 'https://celebrated-cheesecake-e7aac5.netlify.app/',
            title: 'Care2Care caregiver mobile app prototype',
            link: { label: 'Open in a new tab', href: 'https://celebrated-cheesecake-e7aac5.netlify.app/' },
          },
        ],
      },
      media: [],
    },

    {
      id: 'funded',
      nav: 'Funded',
      heading: 'From a class prototype to a funded build.',
      body: [
        'Care2Care won the Lucie Young Kelly Faculty Leadership Award, under the mentorship of Heidi Ann Scharf Donovan, a UPMC nurse and University of Pittsburgh research professor. That funding is moving it from an academic prototype to a real product.',
        'We presented to program faculty and UPMC partners, including Professor Kristin Hughes, Grace Campbell PhD RN and Dr. Sarah Taylor. Work now continues on two fronts: usability and pilot testing with real caregivers and liaisons, and a backend that uses language models and search to match caregivers to resources, pending IRB approval.',
      ],
      insight: { label: 'Impact', text: 'Care2Care won the Lucie Young Kelly Faculty Leadership Award and the backing of the Family CARE Center, which moved it past the capstone and into a real build.' },
      layout: 'showcase',
      media: [
        {
          src: 'images/story/care2care/funded-1600.jpg',
          srcset: 'images/story/care2care/funded-800.jpg 800w, images/story/care2care/funded-1600.jpg 1600w',
          alt: "A hand holding a phone with the Care2Care check-in screen, beside the tagline 'Connecting cancer caregivers to the support they need' and the UPMC Magee-Womens logo",
          width: 1600,
          height: 613,
        },
      ],
    },
  ],

  checkpoints: [
    {
      id: 'halfway',
      kind: 'interlude',
      chapter: 'uncertainty',
      label: 'Halfway there',
      heading: 'Halfway there.',
      lines: ['We knew where caregivers struggled. Now we had to design for it.'],
    },
  ],

  metrics: {
    heading: 'By the numbers',
    items: [
      { value: 3, label: 'months to a final prototype' },
      { value: 4, label: 'partner organizations' },
      { value: 10, suffix: '+', label: 'cancer caregivers interviewed' },
      { value: 10, label: 'articles in our writing series' },
    ],
  },

  reflection: {
    heading: 'Reflection',
    // Draft built from the previous page's outcomes: edit freely.
    lines: [
      "The most useful shift was designing around caregivers' moments of uncertainty instead of the hospital's touchpoints. That is where the gap between them and the support meant for them was widest.",
      'It also taught me that in a hospital, a service works or fails at the handoff. The people who would run Care2Care were already stretched, so the design had to fit the way the Family CARE Center already works instead of adding to it.',
    ],
  },

  further: {
    heading: 'Related writing',
    intro: 'We documented the project as we went, in a series written by the whole team.',
    items: [
      { title: 'Research Objectives for Cancer Care Coordination', meta: 'Uma Dhamija · 4 min read', href: 'https://medium.com/@umaracheldhamija/designing-care-that-holds-together-research-objectives-for-cancer-care-coordination-1c28b86fe653' },
      { title: 'Mapping the Cancer Care Terrain', meta: 'Allen Chen · 4 min read', href: 'https://medium.com/@allenchen-desigh/mapping-the-cancer-care-terrain-e6a3af5eb972' },
      { title: 'Redesigning Care Coordination Across Transitions', meta: 'Allen Chen · 4 min read', href: 'https://medium.com/@allenchen-desigh/designing-care-that-holds-together-redesigning-cancer-care-coordination-across-transitions-54c6bf98f57a' },
      { title: 'A.E.I.O.U in Action at UPMC Magee', meta: 'Yukti Poddar · 4 min read', href: 'https://medium.com/@yuktipoddar/a-e-i-o-u-in-action-shadowing-the-family-care-center-at-upmc-magee-1cca24440885' },
      { title: 'The Big Idea: Designing a System that Cares for the Caregiver', meta: 'Uma Dhamija · 5 min read', href: 'https://medium.com/@umaracheldhamija/the-big-idea-designing-a-system-that-cares-for-the-caregiver-a74fd4f9e7d4' },
      { title: 'Three Concepts, One Direction', meta: 'Allen Chen · 4 min read', href: 'https://medium.com/@allenchen-desigh/three-concepts-one-direction-learning-from-expert-feedback-b5c259155d63' },
      { title: 'From Direction to Discovery: Listening Before We Build', meta: 'Uma Dhamija · 6 min read', href: 'https://medium.com/@umaracheldhamija/from-direction-to-discovery-listening-before-we-build-d0f906fb8a0e' },
      { title: 'What We Heard, What We Missed, and What Comes Next', meta: 'Yukti Poddar · 5 min read', href: 'https://medium.com/@yuktipoddar/what-we-heard-what-we-missed-and-what-comes-next-011c541f40d5' },
      { title: 'Building Together: A Team Reflection', meta: 'Yukti Poddar · 3 min read', href: 'https://medium.com/@yuktipoddar/building-together-a-team-reflection-f3b5fb04a16a' },
      { title: 'Designing for the Invisible Details of Caregiving', meta: 'Uma Dhamija · 4 min read', href: 'https://medium.com/@umaracheldhamija/designing-for-the-invisible-details-of-caregiving-4c0ddf8e70b4' },
    ],
  },

  next: {
    name: 'MeditationWise',
    homeCard: 'meditationwise',
    href: '/work/meditationwise/',
    story: true,
    title: 'An app for finding meditation practices by need and tradition.',
    subtitle: 'MeditationWise',
    image: { src: 'images/MW-logo.png', alt: 'MeditationWise logo' },
  },
};
