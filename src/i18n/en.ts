import type { sv } from './sv.ts';

// Engelska texter. Sidorna under /en/ är inte påslagna ännu, se README ("Engelsk version").
export const en: typeof sv = {
  locale: 'en-GB',
  meta: {
    title: 'Podkoder: every podcast promo code in one place',
    description:
      'Search promo codes and offers from podcasts. Open source and community-driven. Every code has a source and a date.',
  },
  nav: {
    podcasts: 'Podcasts',
    brands: 'Brands',
    contribute: 'Submit a code',
    about: 'About',
    support: 'Buy me a coffee',
    skip: 'Skip to content',
    switchLang: 'Svenska',
    switchLangLabel: 'Show the site in Swedish',
  },
  templates: {
    newCode: 'new-code.yml',
    report: 'not-working.yml',
    podcaster: 'podcaster.yml',
  },
  home: {
    title: 'Every podcast promo code.',
    titleAccent: 'In one place.',
    lead: 'The codes read out in your favourite podcasts, collected and searchable. Open source and community-driven. Every code has a source and a date.',
    searchLabel: 'Search brand, podcast or code',
    searchPlaceholder: 'Search brand, podcast or code',
    stats: (offers, podcasts, brands) => `${offers} offers · ${podcasts} podcasts · ${brands} brands`,
    latest: 'Latest offers',
    categories: 'Categories',
    showing: (n) => (n === 1 ? '1 offer' : `${n} offers`),
    noResults: 'No results for',
    noResultsCta: 'Missing a code? Tell us',
  },
  offer: {
    copy: 'Copy',
    copied: 'Copied',
    copyLabel: (code) => `Copy the code ${code}`,
    linkOnly: 'No code needed. The discount comes with the link.',
    openOffer: 'Open the offer',
    toStore: 'Go to store',
    via: 'via',
    seen: (date) => `Seen ${date}`,
    aging: (date) => `Last seen ${date}, may have expired`,
    validUntil: (date) => `Valid until ${date}`,
    source: 'Source',
    episode: (title) => `Episode: ${title}`,
    report: 'Not working?',
    marketTitle: 'Where the offer is valid',
    market: {
      SE: 'Sweden only',
      NO: 'Norway only',
      DK: 'Denmark only',
      FI: 'Finland only',
      US: 'US only',
      UK: 'UK only',
      INT: 'Worldwide',
    },
    reportTitle: (brand, podcast) => `Not working: ${brand} (${podcast})`,
  },
  podcast: {
    eyebrow: 'Podcast',
    title: (name) => `${name}: promo codes and offers`,
    description: (name) => `Every promo code and offer from ${name}, in one place.`,
    count: (n) => (n === 1 ? '1 active offer' : `${n} active offers`),
    empty: 'No active codes right now.',
    tip: (name) => `Heard a code on ${name} that is missing here?`,
    links: { apple: 'Apple Podcasts', website: 'Website', rss: 'RSS' },
  },
  podcasts: {
    title: 'Podcasts',
    description: 'Every podcast with promo codes and offers on Podkoder.',
    lead: 'Every podcast we have found promo codes from.',
  },
  brand: {
    eyebrow: 'Brand',
    title: (name) => `${name} promo codes from podcasts`,
    h1: (name) => `${name} promo code`,
    description: (name, n) =>
      `${n === 1 ? '1 promo code' : `${n} promo codes`} for ${name} from podcasts. With a source and date for every code.`,
    lead: (offers, podcasts) =>
      `${offers === 1 ? '1 offer' : `${offers} offers`} from ${podcasts === 1 ? '1 podcast' : `${podcasts} podcasts`}.`,
    fairTip: 'Pick the code from a podcast you like. Podcasts are often paid when their code is used.',
    visit: (name) => `Visit ${name}`,
    empty: 'No active codes right now.',
  },
  brands: {
    title: 'Brands',
    description: 'Every brand with promo codes in podcasts, from A to Z.',
    lead: 'Every brand with promo codes in podcasts.',
  },
  category: {
    eyebrow: 'Category',
    title: (label) => `Podcast promo codes: ${label}`,
    description: (label) => `Promo codes and offers from podcasts in ${label.toLowerCase()}.`,
    lead: (n) => (n === 1 ? '1 offer.' : `${n} offers.`),
  },
  contribute: {
    title: 'Submit a code',
    description: 'Heard a promo code on a podcast? Here is how to add it to Podkoder.',
    lead: 'Podkoder is built by listeners. If you heard a code on a podcast, it takes a minute to add it.',
    formTitle: 'Fill in the form',
    formText: 'The easiest way. You need a free GitHub account. We review the tip and add the code.',
    formButton: 'Open the form',
    prTitle: 'Send a pull request',
    prText: 'If you know Git. Every code is a small YAML file in data/codes/.',
    prLink: 'Read CONTRIBUTING.md',
    example: `# data/codes/weekly-show-jon-stewart--bombas.yaml
podcast: weekly-show-jon-stewart   # file name in data/podcasts/
brand: bombas                      # file name in data/brands/
code: WEEKLY
discount: 20% off your first purchase
url: https://bombas.com/weekly
last_verified: 2026-09-10          # when the code was mentioned
source: https://art19.com/shows/jon-stewart
episode: Jonathan Swan's Dive into Trump's Reality
market: US                         # US, UK, INT (worldwide) or SE`,
    rulesTitle: 'The rules',
    rules: [
      'The code must have been mentioned publicly on a podcast, in the episode or the show notes.',
      'Link to the episode where the code is mentioned, and roughly when.',
      'No personal codes, such as refer-a-friend codes.',
      'Code not working any more? Click “Not working?” on the code.',
    ],
    podcasterTitle: 'Are you a podcaster?',
    podcasterText: 'Want your codes listed, corrected or removed? Open an issue on GitHub and we will sort it out.',
    podcasterButton: 'Contact us',
  },
  about: {
    title: 'About Podkoder',
    description: 'What Podkoder is, how codes are collected and why the site is open source.',
    sections: {
      what: {
        title: 'What is this?',
        body: 'Many podcasts are funded by sponsors who give listeners a promo code. The codes are read out in the episode, get lost in the feed and are hard to find again. Podkoder collects them in one place.',
      },
      how: {
        title: 'How codes end up here',
        steps: [
          'Every night a script reads the podcasts’ RSS feeds and looks for codes in the episode descriptions.',
          'Listeners submit codes that are only mentioned in the audio.',
          'A human reviews every code before it is published. Each code gets a source (the episode) and a date.',
        ],
      },
      freshness: {
        title: 'How fresh are the codes?',
        body: (fresh, hide) =>
          `A code seen in an episode within the last ${fresh} days counts as current. Older codes get a warning, and after ${hide} days they are hidden. When a podcast mentions the same code in a new episode, the date is updated automatically.`,
      },
      fair: {
        title: 'Podcasts benefit',
        body: 'Many podcasts are paid every time their code is used. That is why we always show which podcast a code comes from and link to it. If you like a podcast, use their code.',
      },
      noAffiliate: {
        title: 'No affiliate links',
        body: 'Podkoder does not take money from brands and does not add its own tracking links. Links go where the podcasts themselves send you. The site is funded by voluntary donations.',
      },
      open: {
        title: 'Open source and open data',
        body: 'The code is MIT licensed and the data is CC BY-SA 4.0. Feel free to use it, just credit the source.',
        repo: 'Source code on GitHub',
        json: 'All data as JSON',
      },
    },
  },
  support: {
    title: 'Buy me a coffee',
    description: 'Podkoder is free and ad-free. Support the project with a coffee.',
    lead: 'Podkoder is free, ad-free and has no affiliate links. Hosting costs almost nothing, but reviewing codes takes time. A contribution makes it easier to keep going.',
    swishTitle: 'Swish',
    swishText: 'Scan the QR code with the Swish app, or send to the number.',
    swishNumber: 'Number',
    otherTitle: 'Other ways',
    kofi: 'Ko-fi',
    buymeacoffee: 'Buy Me a Coffee',
    githubSponsors: 'GitHub Sponsors',
    whereTitle: 'Where does the money go?',
    where: [
      'Domain and hosting.',
      'Time to review tips and verify codes.',
      'New features, such as transcribing episodes to find codes that are only spoken.',
    ],
    notConfigured: 'No donation options are set up yet. Fill them in in src/site.config.ts. This box is only shown in development.',
  },
  donateBox: {
    title: 'Like Podkoder?',
    text: 'The site is free, ad-free and has no affiliate links. Buy us a coffee to keep it going.',
    button: 'Support the project',
  },
  footer: {
    tagline: 'Podcast promo codes, collected by listeners.',
    disclaimer: 'Podkoder is not affiliated with any podcast or brand. Codes may have expired, so check the terms with the store.',
    license: 'Code: MIT · Data: CC BY-SA 4.0',
    github: 'GitHub',
    data: 'Data (JSON)',
  },
  notFound: {
    title: 'Page not found',
    text: 'The code may have expired, or the link has changed.',
    home: 'Back to the start page',
  },
};
