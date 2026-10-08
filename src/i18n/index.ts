import { sv } from './sv.ts';
import { en } from './en.ts';

export type Lang = 'sv' | 'en';
export type Dict = typeof sv;

const dictionaries: Record<Lang, Dict> = { sv, en };

export function useT(lang: Lang): Dict {
  return dictionaries[lang];
}

/** URL-struktur per språk. Svenska ligger i roten, engelska under /en/. */
const ROUTES = {
  sv: {
    home: '/',
    podcasts: '/poddar',
    podcast: '/podd',
    brands: '/varumarken',
    brand: '/rabattkod',
    category: '/kategori',
    contribute: '/bidra',
    about: '/om',
    support: '/stod',
  },
  en: {
    home: '/en',
    podcasts: '/en/podcasts',
    podcast: '/en/podcast',
    brands: '/en/brands',
    brand: '/en/promo-code',
    category: '/en/category',
    contribute: '/en/contribute',
    about: '/en/about',
    support: '/en/support',
  },
} as const;

export function paths(lang: Lang) {
  const r = ROUTES[lang];
  return {
    ...r,
    podcastPage: (id: string) => `${r.podcast}/${id}`,
    brandPage: (id: string) => `${r.brand}/${id}`,
    categoryPage: (id: string) => `${r.category}/${id}`,
  };
}

/**
 * Motsvarande sida på ett annat språk. `exact` är sant när samma sida finns där
 * (t.ex. /om ↔ /en/about); annars blir det närmaste översikt, eftersom poddar och
 * varumärken inte alltid finns på båda språken.
 */
export function translatePath(pathname: string, from: Lang, to: Lang): { path: string; exact: boolean } {
  const a = paths(from);
  const b = paths(to);
  const clean = pathname.replace(/\.html$/, '').replace(/\/(index)?$/, '') || '/';
  const pages = ['home', 'podcasts', 'brands', 'contribute', 'about', 'support'] as const;
  for (const page of pages) {
    if (clean === a[page]) return { path: b[page], exact: true };
  }
  const details = [
    ['podcast', 'podcasts'],
    ['brand', 'brands'],
    ['category', 'home'],
  ] as const;
  for (const [detail, overview] of details) {
    if (clean.startsWith(`${a[detail]}/`)) return { path: b[overview], exact: false };
  }
  return { path: b.home, exact: false };
}

export const LANGS: Lang[] = ['sv', 'en'];

export function formatDate(date: Date, lang: Lang, now = new Date()): string {
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(useT(lang).locale, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'Europe/Stockholm',
  }).format(date);
}
