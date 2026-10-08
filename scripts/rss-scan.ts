// Skannar poddars RSS-flöden efter rabattkoder i avsnittsbeskrivningarna.
//
//   npm run scan                         skanna alla poddar i data/podcasts
//   npm run scan -- --source=discovered  skanna poddar från `npm run discover`
//   npm run scan -- --only=alex-och-sigge --dry
//
// Nya fynd skrivs som förslag till candidates/ (granskas med `npm run review`).
// Koder som redan finns i data/codes och dyker upp i ett nyare avsnitt får
// automatiskt ett nytt `last_verified`-datum och källa.
//
// Flaggor:
//   --source=data|discovered  varifrån listan med flöden hämtas (default: data)
//   --episodes=10             antal senaste avsnitt per podd
//   --days=180                ignorera avsnitt äldre än så
//   --only=<slug>             skanna bara en podd
//   --dry                     skriv ingenting, visa bara resultatet
//   --debug                   visa annonsliknande stycken där ingen kod hittades
//   --lang=sv                 hoppa över flöden vars <language> inte börjar med detta
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';
import {
  CACHE,
  CANDIDATES,
  DATA,
  fetchText,
  hostOf,
  loadDir,
  linkKey,
  offerKeys,
  pool,
  slugify,
  toISODate,
  today,
  type Brand,
  type Candidate,
  type Code,
  type Podcast,
} from './lib.ts';

const { values: args } = parseArgs({
  options: {
    source: { type: 'string', default: 'data' },
    episodes: { type: 'string', default: '10' },
    days: { type: 'string', default: '180' },
    only: { type: 'string' },
    dry: { type: 'boolean', default: false },
    debug: { type: 'boolean', default: false },
    lang: { type: 'string', default: '' },
  },
});

const EPISODES = Number(args.episodes);
const MAX_AGE_MS = Number(args.days) * 86_400_000;

// ---------------------------------------------------------------------------
// Textbehandling

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aring: 'å', auml: 'ä', ouml: 'ö', Aring: 'Å', Auml: 'Ä', Ouml: 'Ö',
  eacute: 'é', Eacute: 'É', uuml: 'ü', ndash: '–', mdash: '—', hellip: '…',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', laquo: '«', raquo: '»', euro: '€',
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] !== '#') return ENTITIES[e] ?? m;
    const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : m;
  });
}

/** HTML → text med en rad per stycke. Länkar behålls som "text (url)". */
function htmlToText(html: string): string {
  // Osynliga tecken (t.ex. U+2060 "word joiner") hamnar annars mitt i länkar.
  const withLinks = html.replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(
    /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, '').trim();
      return text && text !== href ? `${text} (${href})` : href;
    },
  );
  return decodeEntities(
    withLinks
      .replace(/<(br|\/p|\/li|\/div|\/h\d|\/ul|\/ol)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function text(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object' && '#text' in v) return text((v as Record<string, unknown>)['#text']);
  return '';
}

// ---------------------------------------------------------------------------
// Detektering av koder

// "använd koden ALEX", "rabattkoden: PODD20", "promo code SIGGE", "med koden 'hela'"
const CODE_RE =
  /(?:\b(?:rabatt|kampanj|erbjudande|promo|discount|voucher)\s?|\b)(?:kod(?:en)?|code)\b[\s:–-]*(?:är\s+|is\s+)?(["'“”‘’«»]?)([\p{L}\p{N}][\p{L}\p{N}_-]{2,23})/giu;

// Shopify-butiker har rabattlänkar på formen butik.se/discount/KOD
const DISCOUNT_URL_RE = /(https?:\/\/[^\s)"'<>]+?\/discount\/([\p{L}\p{N}_-]{3,30}))/giu;

// Ord efter en koden som tyder på att den gemena token ändå är en kod: "koden podden i kassan"
const AFTER_CODE_RE = /^\s*(?:i kassan|vid (?:köp|kassan|utcheckning)|när du|så får|för att få|och få|for\b|at checkout|to get|and get)/i;

const OFFER_RE = /rabatt|erbjudande|\d+\s?%|gratis|extra månader|pengarna tillbaka|\boff\b|free|discount/i;

const STOPWORDS = new Set(
  [
    'för', 'och', 'som', 'att', 'här', 'nedan', 'ovan', 'vid', 'när', 'kassan', 'till', 'med', 'du', 'får',
    'gäller', 'ger', 'rabatt', 'länk', 'länken', 'the', 'at', 'for', 'and', 'below', 'here', 'checkout',
    'link', 'gives', 'get', 'you', 'your', 'när', 'eller', 'från', 'hos', 'via', 'kan', 'ska', 'vill',
    'uppges', 'anges', 'finns', 'står', 'krävs', 'behövs', 'skickas',
  ].map((w) => w.toLowerCase()),
);

/** Liknar token poddens namn? ("fordomspodden" ↔ "fordomspodden", "steven" ↔ "the-diary-of-a-ceo-with-steven-bartlett") */
function resemblesPodcast(token: string, podcastSlug: string): boolean {
  const t = slugify(token).replace(/-/g, '');
  const p = podcastSlug.replace(/-/g, '');
  return t.length >= 4 && (p.includes(t) || t.includes(p));
}

function looksLikeCode(token: string, quoted: boolean, following: string, podcastSlug: string): boolean {
  if (STOPWORDS.has(token.toLowerCase())) return false;
  if (/^\d+$/.test(token)) return false;
  if (quoted || AFTER_CODE_RE.test(following) || resemblesPodcast(token, podcastSlug)) return true;
  const letters = token.replace(/[^\p{L}]/gu, '');
  const allCaps = letters.length >= 2 && letters === letters.toUpperCase();
  const lettersAndDigits = /\d/.test(token) && letters.length > 0;
  return allCaps || lettersAndDigits;
}

/** En personlig erbjudandelänk, t.ex. nordvpn.com/fordomspodden eller boncharge.com/DOAC. */
function personalLink(para: string, podcastSlug: string): string | undefined {
  if (!OFFER_RE.test(withoutUrls(para))) return undefined;
  for (const m of para.matchAll(URL_RE)) {
    const host = hostOf(m[1]);
    if (!host || isIgnoredHost(host)) continue;
    const url = m[1].replace(/[.,;:!?]+$/, '');
    const segment = url.split('/').filter(Boolean).pop() ?? '';
    if (url.split('/').length < 2 || segment.includes('.')) continue;
    const letters = segment.replace(/[^\p{L}]/gu, '');
    const allCaps = letters.length >= 3 && letters === letters.toUpperCase();
    if (allCaps || resemblesPodcast(segment.replace(/\d+$/, ''), podcastSlug)) {
      return url.startsWith('http') ? url : `https://${url}`;
    }
  }
  return undefined;
}

/** Tar bort URL:er så att t.ex. "%C3" i en länk inte tolkas som procent. */
function withoutUrls(para: string): string {
  return para.replace(/https?:\/\/\S+/g, ' ');
}

function guessDiscount(raw: string): string | undefined {
  const para = withoutUrls(raw);
  const parts: string[] = [];
  const pct = para.match(/(\d{1,3}(?:[,.]\d+)?)\s?(?:%|procent)/i);
  if (pct) parts.push(`${pct[1]} %`);
  const kr = para.match(/(\d{1,3}(?:[  ]?\d{3})*)\s?(?:kr\b|kronor|:-|sek\b)/i);
  if (kr) parts.push(`${kr[1].replace(/\s/g, ' ')} kr`);
  const money = para.match(/(?:up to\s)?[$£€]\s?\d+(?:[.,]\d+)?/i);
  if (money) parts.push(`${money[0]} off`);
  const free = para.match(
    /(fri frakt|gratis frakt|free shipping|\d+\s(?:månad(?:er)?|veckor?|dagar|days|weeks|months?)\s(?:helt\s)?(?:gratis|free)|gratis\s(?:i\s)?\d+\s(?:månad(?:er)?|dagar|veckor)|första\s\w+\sgratis)/i,
  );
  if (free) parts.push(free[1].toLowerCase());
  return parts.length ? parts.join(' + ') : undefined;
}

const IGNORED_HOSTS = [
  'acast.com', 'acast.se', 'podme.com', 'spotify.com', 'spoti.fi', 'apple.com', 'instagram.com', 'facebook.com',
  'fb.com', 'tiktok.com', 'youtube.com', 'youtu.be', 'x.com', 'twitter.com', 'threads.net', 'patreon.com',
  'linktr.ee', 'sverigesradio.se', 'sr.se', 'svt.se', 'megaphone.fm', 'omny.fm', 'art19.com', 'simplecast.com',
  'buzzsprout.com', 'pod.space', 'anchor.fm', 'podbean.com', 'libsyn.com', 'soundcloud.com', 'podspace.com', 'bonnier.news',
  'gmail.com', 'hotmail.com', 'outlook.com', 'mail.com', 'podtrac.com', 'chartable.com', 'redcircle.com',
];

function isIgnoredHost(host: string): boolean {
  return IGNORED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

// Erbjudanden vi aldrig tar med: spel, receptbelagda läkemedel, alkohol och nikotin.
// Det är förbjudet att marknadsföra olicensierat spel och receptbelagt mot svenska konsumenter.
const BLOCKED_RE =
  /draftkings|dkng\.co|fanduel|prizepicks|underdog\s?fantasy|betmgm|caesars\s?sportsbook|bet365|stake\.(?:com|us)|chumba|sleeper\s?fantasy|bluechew|hims\.com|hers\.com|\brx\b|prescription|nicotine|\bzyn\b|lucy\.co|casino|sportsbook|\bbetting\b|\bodds\b|cannabis|\bthc\b|dispensar|trees\.com/i;

const URL_RE =
  /(?<![@\w.])((?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:se|com|nu|io|app|eu|no|dk|fi|net|org|co|store|shop|health|me)(?:\/[^\s)"'<>,]*)?)/gi;

function guessUrl(para: string): string | undefined {
  for (const m of para.matchAll(URL_RE)) {
    const host = hostOf(m[1]);
    if (!host || isIgnoredHost(host)) continue;
    const url = m[1].replace(/[.,;:!?]+$/, '');
    return url.startsWith('http') ? url : `https://${url}`;
  }
  return undefined;
}

function guessBrand(url: string | undefined, para: string, brands: Map<string, Brand>): string | undefined {
  const host = hostOf(url);
  const lower = para.toLowerCase();
  for (const [slug, b] of brands) {
    if (host && hostOf(b.website) === host) return slug;
    const names = [b.name, ...(b.aliases ?? [])].map((n) => n.toLowerCase());
    if (names.some((n) => n.length > 2 && lower.includes(n))) return slug;
  }
  if (!host) return undefined;
  const labels = host.split('.');
  return slugify(labels.length >= 2 ? labels[labels.length - 2] : labels[0]);
}

// ---------------------------------------------------------------------------
// Flöden

type Feed = { slug: string; name: string; rss: string; apple?: string; language?: string };

async function feedsToScan(): Promise<Feed[]> {
  if (args.source === 'discovered') {
    const file = path.join(CACHE, 'discovered.json');
    if (!existsSync(file)) throw new Error('Kör `npm run discover` först.');
    const list = JSON.parse(await readFile(file, 'utf8')) as { name: string; rss: string | null; apple: string }[];
    return list.filter((p) => p.rss).map((p) => ({ slug: slugify(p.name), name: p.name, rss: p.rss!, apple: p.apple }));
  }
  const podcasts = await loadDir<Podcast>(path.join(DATA, 'podcasts'));
  return [...podcasts]
    .filter(([, p]) => p.rss)
    .map(([slug, p]) => ({ slug, name: p.name, rss: p.rss! }));
}

type Episode = { title: string; link: string; published: Date; body: string };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', textNodeName: '#text' });

async function episodesOf(feed: Feed): Promise<Episode[]> {
  const xml = await fetchText(feed.rss);
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  const language = text(channel?.language).toLowerCase();
  feed.language = language.slice(0, 2) || undefined;
  if (args.lang && language && !language.startsWith(args.lang)) return [];
  const raw = channel?.item;
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const channelLink = text(channel?.link);
  return items
    .map((item) => {
      const bodies = [text(item['content:encoded']), text(item.description), text(item['itunes:summary'])];
      const body = bodies.sort((a, b) => b.length - a.length)[0];
      const link = text(item.link) || channelLink || feed.apple || feed.rss;
      return { title: decodeEntities(text(item.title)).trim(), link, published: new Date(text(item.pubDate)), body: htmlToText(body) };
    })
    .filter((e) => !Number.isNaN(e.published.getTime()) && Date.now() - e.published.getTime() < MAX_AGE_MS)
    .sort((a, b) => b.published.getTime() - a.published.getTime())
    .slice(0, EPISODES);
}

type Hit = Candidate & { podcast_name: string; rss: string; apple?: string };

const AD_HINT_RE = /rabatt|erbjudande|annons|reklam|sponsr|samarbete|discount|promo|% off|gratis/i;

function findCodes(feed: Feed, ep: Episode, brands: Map<string, Brand>): Hit[] {
  const hits: Hit[] = [];
  for (const para of ep.body.split('\n')) {
    const before = hits.length;
    const add = (code: string | undefined, url: string | undefined) => {
      if (BLOCKED_RE.test(para)) return;
      const sameOffer = (h: Hit) => h.code?.toUpperCase() === code?.toUpperCase() && hostOf(h.url_guess) === hostOf(url);
      if (code && hits.some(sameOffer)) return;
      hits.push({
        podcast: feed.slug,
        podcast_name: feed.name,
        language: feed.language,
        rss: feed.rss,
        apple: feed.apple,
        code,
        brand_guess: guessBrand(url, para, brands),
        discount_guess: guessDiscount(para),
        url_guess: url,
        source: ep.link,
        episode: ep.title,
        published: ep.published.toISOString().slice(0, 10),
        context: para.length > 500 ? `${para.slice(0, 497)}…` : para,
        found: today(),
      });
    };

    for (const m of para.matchAll(DISCOUNT_URL_RE)) {
      // Avklippta länkar som "butik.se/discount/FOTB..." ger inte hela koden.
      const after = para.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 3);
      if (!/^(\.{2,}|…)/.test(after)) add(m[2], m[1]);
    }
    for (const m of para.matchAll(CODE_RE)) {
      const start = m.index ?? 0;
      // Hoppa över "kod" inuti URL:er och i poddens eget namn ("Kod: Katastrof").
      const word = para.slice(para.lastIndexOf(' ', start) + 1, start + 4);
      if (/[/.]/.test(word) || feed.name.toLowerCase().includes(m[0].trim().toLowerCase())) continue;
      const code = m[2].replace(/[-_]+$/, '');
      const following = para.slice(start + m[0].length);
      if (looksLikeCode(code, m[1] !== '', following, feed.slug)) add(code, guessUrl(para));
    }
    if (hits.length === before) {
      const link = personalLink(para, feed.slug);
      if (link) add(undefined, link);
    }

    if (args.debug && hits.length === before && AD_HINT_RE.test(para)) {
      console.log(`[debug] ${feed.name}: ${para.slice(0, 300)}`);
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Kör

const brands = await loadDir<Brand>(path.join(DATA, 'brands'));
const codesDir = path.join(DATA, 'codes');
const existing = new Map<string, { file: string; data: Code }>();
for (const [id, data] of await loadDir<Code>(codesDir)) {
  const known = { file: path.join(codesDir, `${id}.yaml`), data };
  for (const key of offerKeys(data.podcast, data.code, data.url, data.brand)) existing.set(key, known);
  // En länk till samma adress som en befintlig kod är samma erbjudande.
  if (data.code && data.url) existing.set(linkKey(data.podcast, data.url), known);
}
const pending = new Set<string>();
for (const [, c] of await loadDir<Candidate>(CANDIDATES)) {
  for (const key of offerKeys(c.podcast, c.code, c.url_guess, c.brand_guess)) pending.add(key);
}
const rejectedFile = path.join(CANDIDATES, 'rejected.txt');
const rejected = new Set(
  existsSync(rejectedFile)
    ? (await readFile(rejectedFile, 'utf8')).split('\n').map((l) => l.trim().toUpperCase()).filter(Boolean)
    : [],
);

/**
 * Befintligt erbjudande som träffen gäller. Bara koden (utan butik) räcker när
 * träffen saknar länk eller när det befintliga erbjudandet saknar länk; annars
 * skulle t.ex. "SRS" för ett nytt varumärke matcha ett gammalt "SRS".
 */
function findExisting(hit: Hit) {
  const [specific, bare] = offerKeys(hit.podcast, hit.code, hit.url_guess, hit.brand_guess);
  const exact = existing.get(specific);
  if (exact) return exact;
  if (!hit.code) return undefined;
  const loose = existing.get(bare ?? specific);
  if (loose && (!hit.brand_guess || hit.brand_guess === loose.data.brand)) return loose;
  return undefined;
}

let feeds = await feedsToScan();
if (args.only) feeds = feeds.filter((f) => f.slug === args.only);
console.log(`Skannar ${feeds.length} flöden (${EPISODES} senaste avsnitten, max ${args.days} dagar gamla)…\n`);

const failures: string[] = [];
const perFeed = await pool(feeds, 6, async (feed) => {
  try {
    const eps = await episodesOf(feed);
    // Nyaste avsnittet först, så första träffen per kod är den senaste källan.
    const found = new Map<string, Hit>();
    for (const ep of eps) {
      for (const hit of findCodes(feed, ep, brands)) {
        const key = offerKeys(hit.podcast, hit.code, hit.url_guess, hit.brand_guess)[0];
        if (!found.has(key)) found.set(key, hit);
      }
    }
    return [...found.values()];
  } catch (err) {
    failures.push(`${feed.name}: ${(err as Error).message}`);
    return [];
  }
});

const hits = perFeed.flat();
const label = (h: Hit) => (h.code ? `\`${h.code}\`` : `länk ${h.url_guess}`);
const fresh: Hit[] = [];
const reverified: string[] = [];

for (const hit of hits) {
  const known = findExisting(hit);
  if (known) {
    const last = toISODate(known.data.last_verified) ?? '';
    if (hit.published > last) {
      reverified.push(`${hit.podcast_name}: ${label(hit)} (${last} → ${hit.published})`);
      if (!args.dry) {
        const doc = YAML.parseDocument(await readFile(known.file, 'utf8'));
        doc.set('last_verified', hit.published);
        doc.set('source', hit.source);
        doc.set('episode', hit.episode);
        await writeFile(known.file, doc.toString());
      }
    }
    continue;
  }
  const keys = offerKeys(hit.podcast, hit.code, hit.url_guess, hit.brand_guess);
  if (keys.some((k) => pending.has(k) || rejected.has(k.toUpperCase()))) continue;
  fresh.push(hit);
}

if (!args.dry && fresh.length) {
  await mkdir(CANDIDATES, { recursive: true });
  for (const hit of fresh) {
    // Varumärket i filnamnet, eftersom samma kod kan gälla flera varumärken ("SRS").
    const brandPart = slugify(hit.brand_guess ?? hostOf(hit.url_guess) ?? 'okant');
    const file = path.join(CANDIDATES, `${hit.podcast}--${brandPart}--${slugify(hit.code ?? 'lank')}.yaml`);
    const header = '# Förslag från rss-scan. Granska med `npm run review`.\n';
    await writeFile(file, header + YAML.stringify(hit, { lineWidth: 0 }));
  }
}

// Rapport (används som PR-beskrivning i GitHub Actions)
const lines = [`## Nya kodförslag: ${fresh.length}`, ''];
for (const hit of fresh) {
  lines.push(
    `- **${hit.podcast_name}**: ${label(hit)} ${hit.discount_guess ? `(${hit.discount_guess})` : ''} ${hit.brand_guess ? `→ ${hit.brand_guess}` : ''}`,
    `  > ${hit.context.replace(/\n/g, ' ')}`,
    `  [${hit.episode}](${hit.source}), ${hit.published}`,
  );
}
if (reverified.length) lines.push('', `## Återverifierade koder: ${reverified.length}`, '', ...reverified.map((r) => `- ${r}`));
if (failures.length) lines.push('', `## Flöden som inte gick att läsa: ${failures.length}`, '', ...failures.map((f) => `- ${f}`));

await mkdir(CACHE, { recursive: true });
await writeFile(path.join(CACHE, 'scan-report.md'), lines.join('\n') + '\n');

console.log(lines.join('\n'));
console.log(`\n${args.dry ? '(torrkörning, inget sparat)' : `Förslag sparade i candidates/. Rapport: scripts/.cache/scan-report.md`}`);
