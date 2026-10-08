import { getCollection } from 'astro:content';
import { SITE } from '../site.config.ts';
import { CATEGORIES, type CategoryId } from './categories.ts';
import type { Lang } from '../i18n/index.ts';

export type Status = 'verified' | 'aging' | 'expired' | 'stale';
export type Market = 'SE' | 'NO' | 'DK' | 'FI' | 'US' | 'UK' | 'INT';

type Localized = string | { sv?: string; en?: string };

export type Offer = {
  id: string;
  code?: string;
  discount: string;
  url?: string;
  note?: string;
  validUntil?: Date;
  lastVerified: Date;
  source: string;
  episode?: string;
  market: Market;
  status: Status;
  podcast: { id: string; name: string; language: Lang };
  brand: { id: string; name: string; category: CategoryId; website?: string };
};

export type PodcastSummary = {
  id: string;
  name: string;
  by?: string;
  website?: string;
  rss?: string;
  apple?: string;
  language: Lang;
  offers: Offer[];
};

export type BrandSummary = {
  id: string;
  name: string;
  category: CategoryId;
  website?: string;
  offers: Offer[];
};

const DAY = 86_400_000;

/** Statiska sajter räknar status vid bygget. Bygg om dagligen (se .github/workflows/rebuild.yml). */
const BUILD_DATE = new Date();

/**
 * Vilka marknader som visas på respektive språkversion. INT är erbjudanden som
 * fungerar oavsett land (VPN, appar, digitala tjänster) och visas på båda.
 */
export const MARKETS: Record<Lang, Market[]> = {
  sv: ['SE', 'INT'],
  en: ['US', 'UK', 'INT'],
};

function statusOf(lastVerified: Date, validUntil: Date | undefined): Status {
  if (validUntil && validUntil.getTime() + DAY < BUILD_DATE.getTime()) return 'expired';
  const age = (BUILD_DATE.getTime() - lastVerified.getTime()) / DAY;
  if (age > SITE.freshness.hideAfterDays) return 'stale';
  if (age > SITE.freshness.verifiedDays) return 'aging';
  return 'verified';
}

export const isVisible = (o: { status: Status }) => o.status === 'verified' || o.status === 'aging';

/** Väljer texten på sajtens språk, annars den som finns. */
function pick(text: Localized, lang: Lang): string;
function pick(text: Localized | undefined, lang: Lang): string | undefined;
function pick(text: Localized | undefined, lang: Lang): string | undefined {
  if (text === undefined || typeof text === 'string') return text;
  return text[lang] ?? text.sv ?? text.en;
}

type RawOffer = Omit<Offer, 'discount' | 'note'> & { discount: Localized; note?: Localized };

let cache: Promise<{ offers: RawOffer[]; podcasts: Omit<PodcastSummary, 'offers'>[]; brands: Omit<BrandSummary, 'offers'>[] }> | undefined;

async function load() {
  const [codes, podcastEntries, brandEntries] = await Promise.all([
    getCollection('codes'),
    getCollection('podcasts'),
    getCollection('brands'),
  ]);
  const podcastById = new Map(podcastEntries.map((p) => [p.id, p]));
  const brandById = new Map(brandEntries.map((b) => [b.id, b]));

  const offers: RawOffer[] = codes.map((entry) => {
    const c = entry.data;
    const podcast = podcastById.get(c.podcast.id);
    const brand = brandById.get(c.brand.id);
    if (!podcast) throw new Error(`data/codes/${entry.id}.yaml: podden "${c.podcast.id}" finns inte i data/podcasts/.`);
    if (!brand) throw new Error(`data/codes/${entry.id}.yaml: varumärket "${c.brand.id}" finns inte i data/brands/.`);
    return {
      id: entry.id,
      code: c.code,
      discount: c.discount,
      url: c.url,
      note: c.note,
      validUntil: c.valid_until,
      lastVerified: c.last_verified,
      source: c.source,
      episode: c.episode,
      market: c.market,
      status: statusOf(c.last_verified, c.valid_until),
      podcast: { id: podcast.id, name: podcast.data.name, language: podcast.data.language },
      brand: { id: brand.id, name: brand.data.name, category: brand.data.category, website: brand.data.website },
    };
  });

  const podcasts = podcastEntries.map((p) => ({
    id: p.id,
    name: p.data.name,
    by: p.data.by,
    website: p.data.website,
    rss: p.data.rss,
    apple: p.data.apple,
    language: p.data.language,
  }));

  const brands = brandEntries.map((b) => ({
    id: b.id,
    name: b.data.name,
    category: b.data.category,
    website: b.data.website,
  }));

  return { offers, podcasts, brands };
}

const STATUS_RANK = { verified: 0, aging: 1, expired: 2, stale: 3 } as const;

/**
 * All data för ett språk. Koderna filtreras på marknad (se MARKETS) och synlighet.
 *   all: true        ta med utgångna och gamla koder
 *   anyMarket: true  ta med koder från alla marknader
 */
export async function getData(lang: Lang, { all = false, anyMarket = false } = {}) {
  cache ??= load();
  const data = await cache;

  const offers: Offer[] = data.offers
    .filter((o) => (anyMarket || MARKETS[lang].includes(o.market)) && (all || isVisible(o)))
    .map((o) => ({ ...o, discount: pick(o.discount, lang), note: pick(o.note, lang) }))
    // Färska först, sedan poddar på sajtens språk, sedan senast sedda.
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        Number(a.podcast.language !== lang) - Number(b.podcast.language !== lang) ||
        b.lastVerified.getTime() - a.lastVerified.getTime(),
    );

  const podcasts: PodcastSummary[] = data.podcasts
    .map((p) => ({ ...p, offers: offers.filter((o) => o.podcast.id === p.id) }))
    .sort(
      (a, b) =>
        Number(a.language !== lang) - Number(b.language !== lang) ||
        b.offers.length - a.offers.length ||
        a.name.localeCompare(b.name, lang),
    );

  const brands: BrandSummary[] = data.brands
    .map((b) => ({ ...b, offers: offers.filter((o) => o.brand.id === b.id) }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const categories = (Object.keys(CATEGORIES) as CategoryId[])
    .map((id) => ({ id, label: CATEGORIES[id][lang], offers: offers.filter((o) => o.brand.category === id) }))
    .filter((c) => c.offers.length > 0)
    .sort((a, b) => b.offers.length - a.offers.length);

  return { offers, podcasts, brands, categories };
}

/**
 * Vilka podd- och varumärkessidor som ska finnas på ett språk: poddar på det
 * språket, plus allt som har minst en kod (även utgången) på språkets marknader.
 * Så slipper engelska sajten tomma sidor för svenska poddar, och tvärtom.
 */
export async function getPages(lang: Lang) {
  const { podcasts, brands } = await getData(lang);
  const { offers: everything } = await getData(lang, { all: true });
  const hasAny = (pred: (o: Offer) => boolean) => everything.some(pred);
  return {
    podcasts: podcasts.filter((p) => p.language === lang || hasAny((o) => o.podcast.id === p.id)),
    brands: brands.filter((b) => hasAny((o) => o.brand.id === b.id)),
  };
}

export function categoryLabel(id: CategoryId, lang: Lang): string {
  return CATEGORIES[id][lang];
}

/** Text som klientsidans sökning matchar mot. */
export function searchText(o: Offer, lang: Lang): string {
  return [o.brand.name, o.podcast.name, o.code ?? '', o.discount, categoryLabel(o.brand.category, lang)]
    .join(' ')
    .toLowerCase();
}
