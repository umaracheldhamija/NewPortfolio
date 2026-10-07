/* ============================================
   KATHAK KALA KENDRA case study content.
   Schema: see case-studies/_template.js
   Rendered by js/story.js into work/kathak-kala-kendra/index.html.

   A solo project, so headings say "I" rather than "we".
   Copy comes from the previous Kathak Kala Kendra page (including its
   reflection) and the homepage card. The live site itself is
   kathak/kathak-kala-kendra/ (don't move or re-theme it); the site
   screenshot below was taken from it.
   Resized image variants live in images/story/kathak-kala-kendra/.
   ============================================ */

(window.CaseStudies ||= {})['kathak-kala-kendra'] = {

  meta: {
    slug: 'kathak-kala-kendra',
    homeCard: 'kathak-kala-kendra',
    title: 'Kathak Kala Kendra',
    subtitle: 'A website for my Kathak teacher of 15 years, built as a surprise.',
    tags: ['Personal project', '1 month', 'Solo', 'Role: Designer and Developer'],
    // Same image as the homepage card, so the card can morph into it.
    hero: {
      src: 'images/story/kathak-kala-kendra/homepage-1264.jpg',
      srcset: 'images/story/kathak-kala-kendra/homepage-800.jpg 800w, images/story/kathak-kala-kendra/homepage-1264.jpg 1264w',
      alt: 'Guru Dharmendra Jain with tabla beside a Kathak dancer, the artwork that opens the site',
      width: 1264,
      height: 842,
    },
    skipTo: { label: 'Skip to the live site', chapter: 'site' },
  },

  summary: {
    lead: 'Designed and built a website, solo in one month, that now connects Guru Dharmendra Jain and his 30+ years of teaching with students worldwide.',
    points: [
      { label: 'Problem', text: 'My teacher had no website to show his work or reach new students, limited internet in Dharamshala and no technical background.' },
      { label: 'Role', text: 'Designer and developer, on my own.' },
      { label: 'Process', text: 'Goals with my teacher in mind, a low-fidelity prototype tested with his students, content curation, then design, build and handoff.' },
      { label: 'Outcome', text: "A live site he can manage himself. He didn't know he was getting it until it was live." },
    ],
  },


  chapters: [
    {
      id: 'idea',
      nav: 'The idea',
      heading: 'My teacher for 15 years had no website, so I built one for him.',
      body: [
        'I noticed that my dance teacher, Guru Dharmendra Jain, had no website to show his work or connect with potential students. His studio is in Dharamshala, India, and he has been teaching Kathak for over 30 years.',
        'I wanted to surprise him with a platform that highlights his expertise, helps people learn about Kathak, and makes it easy to get in touch about classes, workshops and performances.',
      ],
      layout: 'text-left',
      media: [
        {
          src: 'images/story/kathak-kala-kendra/guruji-1280.jpg',
          srcset: 'images/story/kathak-kala-kendra/guruji-800.jpg 800w, images/story/kathak-kala-kendra/guruji-1280.jpg 1280w',
          alt: 'Guru Dharmendra Jain playing tabla at a performance, beside a musician at the harmonium',
          caption: 'Guru Dharmendra Jain on tabla.',
          width: 1280,
          height: 853,
        },
      ],
    },

    {
      id: 'constraints',
      nav: 'Constraints',
      heading: 'It had to work on limited internet, and he had to be able to run it himself.',
      body: [
        'Internet is limited in Dharamshala and my teacher is not tech-savvy, so the site had to be accessible and responsive on every device.',
        'As the only designer, I also needed a system that could grow with the studio, simple enough for him to update and manage on his own.',
      ],
      layout: 'text-right',
      media: [
        {
          src: 'images/story/kathak-kala-kendra/poster-1280.jpg',
          srcset: 'images/story/kathak-kala-kendra/poster-800.jpg 800w, images/story/kathak-kala-kendra/poster-1280.jpg 1280w',
          alt: 'The studio\'s printed poster: Join Kathak Classes at Kathak Kala Kendra, Dharamshala, with Sir Dharmendra Jain, class timings and the address',
          caption: 'The studio\'s printed class poster.',
          width: 1280,
          height: 960,
        },
      ],
    },

    {
      id: 'prototype',
      nav: 'Prototype',
      heading: 'His students shaped the site before he ever saw it.',
      body: [
        'I started from what he would most want to show, and what was feasible given his technical knowledge and internet access.',
        'I then made a low-fidelity prototype and shared it with a few of his students for feedback.',
      ],
      layout: 'wide',
      visual: {
        type: 'journey',
        stops: [
          { label: 'Goals' },
          { label: 'Low-fidelity prototype' },
          { label: 'Student feedback' },
          { label: 'Content' },
          { label: 'Build and handoff' },
        ],
      },
      media: [
        // The live site, for reference alongside the process.
        {
          embed: 'https://kathak-kala-kendra.vercel.app',
          url: 'kathak-kala-kendra.vercel.app',
          title: 'The live Kathak Kala Kendra website',
          start: 'Explore the site',
          caption: 'For reference, the finished site as it is live today.',
          maxWidth: 880,
        },
      ],
    },

    {
      id: 'content',
      nav: 'Content',
      heading: 'Thirty years of teaching, told through his students.',
      body: [
        'I gathered studio photography, performance images and class highlights to tell his story.',
      ],
      layout: 'wide',
      visual: {
        type: 'gallery',
        columns: 2,
        media: [
          {
            src: 'images/story/kathak-kala-kendra/class-1156.jpg',
            srcset: 'images/story/kathak-kala-kendra/class-800.jpg 800w, images/story/kathak-kala-kendra/class-1156.jpg 1156w',
            alt: 'Students in yellow and red Kathak costumes standing with Guru Dharmendra Jain after a performance',
            width: 1156,
            height: 867,
          },
          {
            src: 'images/story/kathak-kala-kendra/performance-1600.jpg',
            srcset: 'images/story/kathak-kala-kendra/performance-800.jpg 800w, images/story/kathak-kala-kendra/performance-1600.jpg 1600w',
            alt: 'A large group of students in white, gold and yellow costumes gathered around Guru Dharmendra Jain',
            width: 1600,
            height: 1200,
          },
          {
            src: 'images/story/kathak-kala-kendra/studio-1280.jpg',
            srcset: 'images/story/kathak-kala-kendra/studio-800.jpg 800w, images/story/kathak-kala-kendra/studio-1280.jpg 1280w',
            alt: 'Students of all ages holding a Kathak pose together in the studio',
            width: 1280,
            height: 640,
          },
        ],
      },
      media: [],
    },

    {
      id: 'site',
      nav: 'The site',
      heading: 'A site he can run himself, and a surprise he never saw coming.',
      body: [
        'I built the site, hosted it and handed it over so he can manage it easily.',
        'When I shared it with him and his students, the response was overwhelmingly positive. He was especially pleased with how it showed his expertise and made it easy for people to learn about Kathak and get in touch. Visit the live site.',
      ],
      links: { 'Visit the live site': 'https://kathak-kala-kendra.vercel.app' },
      // Screenshots taken from kathak/kathak-kala-kendra/.
      visual: {
        type: 'pinned',
        frame: 'browser',
        url: 'kathak-kala-kendra.vercel.app',
        kicker: 'Page',
        steps: [
          {
            label: 'Home',
            text: 'The first thing every visitor sees: Kathak Kala Kendra, under the guidance of Guru Dharmendra Jain.',
            media: {
              src: 'images/story/kathak-kala-kendra/site-1600.jpg',
              srcset: 'images/story/kathak-kala-kendra/site-800.jpg 800w, images/story/kathak-kala-kendra/site-1600.jpg 1600w',
              alt: 'The Kathak Kala Kendra homepage: Under the guidance of Guru Dharmendra Jain, with Explore classes and Meet the guru buttons',
              width: 1600,
              height: 1000,
            },
          },
          {
            label: 'The guru',
            text: 'Who he is: a Kathak guru and tabla maestro, teaching in Dharamshala.',
            media: {
              src: 'images/story/kathak-kala-kendra/site-about-1600.jpg',
              srcset: 'images/story/kathak-kala-kendra/site-about-800.jpg 800w, images/story/kathak-kala-kendra/site-about-1600.jpg 1600w',
              alt: 'About section: Guru Dharmendra Jain, Kathak guru and tabla maestro, beside a photo of him with his students',
              width: 1600,
              height: 1000,
            },
          },
          {
            label: 'Classes',
            text: 'Kathak and tabla for all ages, in person and online, with class timings up front.',
            media: {
              src: 'images/story/kathak-kala-kendra/site-classes-1600.jpg',
              srcset: 'images/story/kathak-kala-kendra/site-classes-800.jpg 800w, images/story/kathak-kala-kendra/site-classes-1600.jpg 1600w',
              alt: 'Classes and Teachings section: Kathak dance and tabla, with batch timings and online classes',
              width: 1600,
              height: 1000,
            },
          },
          {
            label: 'Gallery',
            text: 'His students on stage, in costume, over the years.',
            media: {
              src: 'images/story/kathak-kala-kendra/site-gallery-1600.jpg',
              srcset: 'images/story/kathak-kala-kendra/site-gallery-800.jpg 800w, images/story/kathak-kala-kendra/site-gallery-1600.jpg 1600w',
              alt: 'Gallery section with photos of students in Kathak costumes',
              width: 1600,
              height: 1000,
            },
          },
          {
            label: 'Enroll',
            text: 'One simple form to enroll or ask a question, with the address, phone and class timings beside it.',
            media: {
              src: 'images/story/kathak-kala-kendra/site-contact-1600.jpg',
              srcset: 'images/story/kathak-kala-kendra/site-contact-800.jpg 800w, images/story/kathak-kala-kendra/site-contact-1600.jpg 1600w',
              alt: 'Enroll or Inquire section with the address, phone, email, class timings and an inquiry form',
              width: 1600,
              height: 1000,
            },
          },
          {
            label: 'Try it',
            text: 'Scroll around the real site right here.',
            media: { embed: '/kathak/kathak-kala-kendra/', title: 'The Kathak Kala Kendra website', start: 'Explore the site' },
          },
        ],
      },
      media: [],
    },
  ],


  reflection: {
    heading: 'Reflection',
    lines: [
      'I was very happy to be able to create this website for my teacher and give him a platform to showcase his work. It was rewarding to see how it could help him connect with potential students and share his passion for Kathak with a wider audience.',
      'It also taught me a lot about user-centered design, and how much a solution depends on the needs and constraints of the person who will actually use it.',
    ],
  },

  next: {
    name: 'Kindred',
    homeCard: 'kindred',
    href: '/work/kindred/',
    story: true,
    title: 'Securely training AI on private data',
    subtitle: 'OpenMined · Capstone',
    image: { src: 'images/story/kindred/om-logo-800.jpg', alt: 'OpenMined logo and name' },
  },
};
