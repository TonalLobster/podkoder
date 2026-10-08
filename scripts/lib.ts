// Delade hjälpfunktioner för skripten i scripts/. Körs direkt med Node (>= 22.18)
// som strippar TypeScript-typer, så håll dig till "erasable" syntax: inga enums,
// inga parameter properties och alltid .ts-ändelse i imports.
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = path.join(ROOT, 'data');
export const CANDIDATES = path.join(ROOT, 'candidates');
export const CACHE = path.join(ROOT, 'scripts', '.cache');

export const USER_AGENT = 'PodkoderBot/0.1 (+https://github.com/podkoder/podkoder)';

export type Podcast = {
  name: string;
  rss?: string;
  website?: string;
  apple?: string;
  language?: string;
};

export type Brand = {
  name: string;
  website?: string;
  category: string;
  aliases?: string[];
};

/** Text som antingen är på ett språk, eller översatt: { sv: '…', en: '…' }. */
export type LocalizedText = string | { sv?: string; en?: string };

export type Code = {
  podcast: string;
  brand: string;
  code?: string;
  discount: LocalizedText;
  episode?: string;
  url?: string;
  valid_until?: string | Date;
  last_verified: string | Date;
  source: string;
  market?: string;
  note?: LocalizedText;
};

export type Candidate = {
  podcast: string;
  /** Saknas för erbjudanden som bara går via en personlig länk. */
  code?: string;
  brand_guess?: string;
  discount_guess?: string;
  url_guess?: string;
  source: string;
  episode: string;
  published: string;
  context: string;
  found: string;
  /** Med för att `npm run review` ska kunna skapa podden om den inte finns i data/podcasts. */
  podcast_name?: string;
  /** Flödets språk enligt RSS, t.ex. "sv" eller "en". */
  language?: string;
  rss?: string;
  apple?: string;
};

/** Läser alla YAML-filer i en mapp till { id: data }, där id är filnamnet utan ändelse. */
export async function loadDir<T>(dir: string): Promise<Map<string, T>> {
  const out = new Map<string, T>();
  if (!existsSync(dir)) return out;
  for (const file of (await readdir(dir)).sort()) {
    if (!/\.ya?ml$/.test(file)) continue;
    const raw = await readFile(path.join(dir, file), 'utf8');
    out.set(file.replace(/\.ya?ml$/, ''), YAML.parse(raw) as T);
  }
  return out;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, ' och ')
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toISODate(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

export async function fetchText(url: string, timeoutMs = 20_000): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: '*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} för ${url}`);
  return res.text();
}

/** Kör async-jobb med begränsad samtidighet. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * Nycklar som identifierar ett erbjudande i en podd, mest specifik först.
 *
 * Amerikanska poddar använder ofta samma kod för flera varumärken ("SRS" hos både
 * Caldera Lab och Sheath), så en kod nycklas på varumärke + kod när varumärket är
 * känt. Utan varumärke faller den tillbaka på bara koden, och ett länkerbjudande
 * nycklas på länken.
 */
export function offerKeys(podcast: string, code: string | undefined, url?: string, brand?: string): string[] {
  if (code) {
    const bare = `${podcast}:${code.toUpperCase()}`;
    return brand ? [`${podcast}:${brand.toUpperCase()}:${code.toUpperCase()}`, bare] : [bare];
  }
  const link = (url ?? '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '');
  return [`${podcast}:LINK:${link.toUpperCase()}`];
}

/** Länknyckeln för en adress, så att en kod och ett länkerbjudande med samma länk räknas som samma erbjudande. */
export function linkKey(podcast: string, url: string): string {
  return offerKeys(podcast, undefined, url)[0];
}
