// Hittar svenska poddar och deras RSS-flöden via Apples topplista och sökning.
// Resultatet hamnar i scripts/.cache/discovered.json och kan skannas med
//   npm run scan -- --source=discovered --lang=sv
//
// Flaggor:
//   --country=se               landskod (default: se)
//   --limit=100                antal poddar från topplistan (max 100)
//   --search="humor,hälsa"     sökord som ger upp till 200 poddar var
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { CACHE, fetchText } from './lib.ts';

const { values } = parseArgs({
  options: {
    country: { type: 'string', default: 'se' },
    limit: { type: 'string', default: '100' },
    search: { type: 'string', default: '' },
  },
});

const country = values.country!;
const limit = Math.min(100, Number(values.limit));

type ChartEntry = { id: string; name: string; artistName: string; url: string; genres?: { name: string }[] };
type ItunesPodcast = {
  collectionId: number;
  collectionName: string;
  artistName: string;
  collectionViewUrl: string;
  primaryGenreName?: string;
  feedUrl?: string;
};
type Discovered = { rank: number | null; name: string; artist: string; genre?: string; apple: string; rss: string | null };

const found = new Map<string, Discovered>();

// 1. Topplistan
const chart = JSON.parse(
  await fetchText(`https://rss.marketingtools.apple.com/api/v2/${country}/podcasts/top/${limit}/podcasts.json`),
) as { feed: { results: ChartEntry[] } };
const lookup = JSON.parse(
  await fetchText(
    `https://itunes.apple.com/lookup?id=${chart.feed.results.map((e) => e.id).join(',')}&entity=podcast&country=${country}`,
  ),
) as { results: ItunesPodcast[] };
const feeds = new Map(lookup.results.map((r) => [String(r.collectionId), r.feedUrl]));
chart.feed.results.forEach((e, i) => {
  found.set(e.id, {
    rank: i + 1,
    name: e.name,
    artist: e.artistName,
    genre: e.genres?.[0]?.name,
    apple: e.url,
    rss: feeds.get(e.id) ?? null,
  });
});

// 2. Sökord
const terms = values.search!.split(',').map((t) => t.trim()).filter(Boolean);
for (const term of terms) {
  const res = JSON.parse(
    await fetchText(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&country=${country}&limit=200`,
    ),
  ) as { results: ItunesPodcast[] };
  for (const r of res.results) {
    const id = String(r.collectionId);
    if (found.has(id)) continue;
    found.set(id, {
      rank: null,
      name: r.collectionName,
      artist: r.artistName,
      genre: r.primaryGenreName,
      apple: r.collectionViewUrl,
      rss: r.feedUrl ?? null,
    });
  }
  console.log(`  "${term}": ${res.results.length} träffar`);
}

const discovered = [...found.values()];
await mkdir(CACHE, { recursive: true });
const out = path.join(CACHE, 'discovered.json');
await writeFile(out, JSON.stringify(discovered, null, 2));

const withFeed = discovered.filter((d) => d.rss).length;
console.log(`Hittade ${discovered.length} poddar (${withFeed} med publikt RSS-flöde) → ${path.relative(process.cwd(), out)}`);
