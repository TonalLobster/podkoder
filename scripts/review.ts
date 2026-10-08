// Gå igenom kodförslagen i candidates/ ett i taget och lägg till eller avvisa dem.
//
//   npm run review
//
// [j] lägger till koden i data/codes/ (och skapar podd och varumärke om de saknas)
// [n] avvisar förslaget så att rss-scan inte föreslår det igen
// [h] hoppar över (förslaget ligger kvar)
// [a] avslutar
//
// Vid frågor: tryck Enter för att ta förslaget inom [hakparentes], skriv "-" för att lämna tomt.
import { appendFile, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import YAML from 'yaml';
import { CATEGORIES, CATEGORY_IDS } from '../src/lib/categories.ts';
import { CANDIDATES, DATA, hostOf, offerKeys, slugify, type Candidate } from './lib.ts';

// En egen radkö i stället för readline/promises, så att skriptet även fungerar
// när svaren skickas in via en pipe (där alla rader kan komma innan första frågan).
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const queued: string[] = [];
let waiting: ((line: string | null) => void) | undefined;
let inputClosed = false;
rl.on('line', (line) => {
  if (waiting) {
    const resolve = waiting;
    waiting = undefined;
    resolve(line);
  } else {
    queued.push(line);
  }
});
rl.on('close', () => {
  inputClosed = true;
  waiting?.(null);
});

async function prompt(text: string): Promise<string> {
  process.stdout.write(text);
  const line =
    queued.length > 0 ? queued.shift()! : inputClosed ? null : await new Promise<string | null>((r) => (waiting = r));
  if (line === null) {
    console.log('\nInmatningen tog slut. Inget mer ändrat.');
    process.exit(0);
  }
  if (!process.stdin.isTTY) process.stdout.write(`${line}\n`);
  return line;
}

async function ask(question: string, fallback = ''): Promise<string> {
  const hint = fallback ? ` [${fallback}]` : '';
  const answer = (await prompt(`  ${question}${hint}: `)).trim();
  if (answer === '-') return '';
  return answer || fallback;
}

async function askRequired(question: string, fallback = ''): Promise<string> {
  for (;;) {
    const answer = await ask(question, fallback);
    if (answer) return answer;
    console.log('  Det här fältet måste fyllas i.');
  }
}

function writeYaml(file: string, data: Record<string, unknown>) {
  // Ta bort tomma fält så att filerna blir rena.
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== undefined));
  return writeFile(file, YAML.stringify(clean, { lineWidth: 0 }));
}

function originOf(url: string | undefined): string {
  const host = hostOf(url);
  return host ? `https://${host}` : '';
}

async function ensurePodcast(c: Candidate): Promise<string> {
  const file = path.join(DATA, 'podcasts', `${c.podcast}.yaml`);
  if (existsSync(file)) return c.podcast;
  console.log(`\n  Podden "${c.podcast}" finns inte i data/podcasts/. Skapar den.`);
  const name = await askRequired('Poddens namn', c.podcast_name);
  const id = slugify(await askRequired('Id (filnamn)', c.podcast));
  const language = (await askRequired('Språk (sv/en)', c.language === 'en' ? 'en' : 'sv')) === 'en' ? 'en' : 'sv';
  await writeYaml(path.join(DATA, 'podcasts', `${id}.yaml`), {
    name,
    rss: c.rss,
    apple: c.apple?.replace(/\?uo=\d+$/, ''),
    language,
  });
  return id;
}

async function podcastLanguage(id: string): Promise<string> {
  const file = path.join(DATA, 'podcasts', `${id}.yaml`);
  const podcast = YAML.parse(await readFile(file, 'utf8')) as { language?: string };
  return podcast.language ?? 'sv';
}

const MARKETS = ['SE', 'NO', 'DK', 'FI', 'US', 'UK', 'INT'];

async function ensureBrand(guess: string | undefined, urlGuess: string | undefined): Promise<string> {
  const id = slugify(await askRequired('Varumärke (id)', guess));
  const file = path.join(DATA, 'brands', `${id}.yaml`);
  if (existsSync(file)) return id;

  console.log(`  Varumärket "${id}" är nytt.`);
  const fallbackName = id.replace(/-/g, ' ').replace(/^\w/, (ch) => ch.toUpperCase());
  const name = await askRequired('Namn', fallbackName);
  const website = await ask('Webbplats', originOf(urlGuess));
  console.log(CATEGORY_IDS.map((cat, i) => `    ${i + 1}. ${CATEGORIES[cat].sv}`).join('\n'));
  let category = '';
  while (!category) {
    const pick = Number(await askRequired('Kategori (nummer)'));
    category = CATEGORY_IDS[pick - 1] ?? '';
  }
  await writeYaml(file, { name, website, category });
  return id;
}

function uniqueCodeFile(base: string): string {
  let file = path.join(DATA, 'codes', `${base}.yaml`);
  for (let n = 2; existsSync(file); n++) file = path.join(DATA, 'codes', `${base}-${n}.yaml`);
  return file;
}

async function accept(c: Candidate) {
  const podcast = await ensurePodcast(c);
  const brand = await ensureBrand(c.brand_guess, c.url_guess);
  const code = await ask('Kod (- för länkerbjudande)', c.code);
  const url = code ? await ask('Länk till butiken', c.url_guess) : await askRequired('Erbjudandelänk', c.url_guess);
  const discount = await askRequired('Rabatt, t.ex. "20 % på första köpet"', c.discount_guess);
  const validUntil = await ask('Gäller t.o.m. (ÅÅÅÅ-MM-DD, valfritt)');
  const note = await ask('Anteckning (valfritt)');
  // INT = fungerar från Sverige också (t.ex. VPN, appar, digitala tjänster). Visas då även på svenska sajten.
  const defaultMarket = (await podcastLanguage(podcast)) === 'en' ? 'US' : 'SE';
  let market = '';
  while (!MARKETS.includes(market)) {
    market = (await askRequired(`Marknad (${MARKETS.join('/')})`, defaultMarket)).toUpperCase();
  }

  const file = uniqueCodeFile(`${podcast}--${brand}`);
  await writeYaml(file, {
    podcast,
    brand,
    code,
    discount,
    url,
    valid_until: validUntil,
    last_verified: c.published,
    source: c.source,
    episode: c.episode,
    note,
    market,
  });
  console.log(`  ✓ Sparad som ${path.relative(process.cwd(), file)}`);
}

const files = existsSync(CANDIDATES) ? (await readdir(CANDIDATES)).filter((f) => /\.ya?ml$/.test(f)).sort() : [];
if (files.length === 0) {
  console.log('Inga förslag att granska i candidates/. Kör `npm run scan` först.');
  rl.close();
  process.exit(0);
}

let added = 0;
let rejected = 0;

for (const [i, name] of files.entries()) {
  const file = path.join(CANDIDATES, name);
  const c = YAML.parse(await readFile(file, 'utf8')) as Candidate;

  console.log(`\n─── ${i + 1}/${files.length}  ${c.podcast_name ?? c.podcast} ───`);
  console.log(c.code ? `  Kod:      ${c.code}` : `  Länk:     ${c.url_guess}`);
  console.log(`  Gissning: ${[c.brand_guess, c.discount_guess, c.code ? c.url_guess : ''].filter(Boolean).join(' · ') || '–'}`);
  console.log(`  Avsnitt:  ${c.episode} (${c.published})`);
  console.log(`  Källa:    ${c.source}`);
  console.log(`\n  > ${c.context.replace(/\n/g, '\n  > ')}\n`);

  const choice = (await prompt('  [j] lägg till  [n] avvisa  [h] hoppa över  [a] avsluta: ')).trim().toLowerCase();
  if (choice === 'a') break;
  if (choice === 'j') {
    await accept(c);
    await unlink(file);
    added++;
  } else if (choice === 'n') {
    await appendFile(path.join(CANDIDATES, 'rejected.txt'), `${offerKeys(c.podcast, c.code, c.url_guess, c.brand_guess)[0]}\n`);
    await unlink(file);
    rejected++;
  }
}

rl.close();
console.log(`\nKlart: ${added} tillagda, ${rejected} avvisade. Kör \`npm run build\` för att kontrollera datan.`);
