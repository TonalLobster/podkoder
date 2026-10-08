import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_IDS } from './lib/categories.ts';

// Filnamnet (utan .yaml) blir id:t, t.ex. data/podcasts/fordomspodden.yaml → "fordomspodden".
const byFilename = (dir: string) =>
  glob({ pattern: '*.{yaml,yml}', base: `./data/${dir}`, generateId: ({ entry }) => entry.replace(/\.ya?ml$/, '') });

const podcasts = defineCollection({
  loader: byFilename('podcasts'),
  schema: z.object({
    name: z.string().min(1),
    /** Värdar eller nätverk, t.ex. "Mia Landén & Johanna Kajson". */
    by: z.string().optional(),
    website: z.url().optional(),
    rss: z.url().optional(),
    apple: z.url().optional(),
    language: z.enum(['sv', 'en']).default('sv'),
  }),
});

const brands = defineCollection({
  loader: byFilename('brands'),
  schema: z.object({
    name: z.string().min(1),
    website: z.url().optional(),
    category: z.enum(CATEGORY_IDS),
    /** Andra namn som används i shownotes. Hjälper rss-scan att gissa rätt varumärke. */
    aliases: z.array(z.string()).optional(),
  }),
});

/** Text på ett språk ("25 % rabatt"), eller översatt ({ sv: "25 % rabatt", en: "25% off" }). */
const localized = z.union([
  z.string().min(2),
  z
    .object({ sv: z.string().min(2).optional(), en: z.string().min(2).optional() })
    .refine((t) => t.sv || t.en, { message: 'Ange minst `sv` eller `en`.' }),
]);

const codes = defineCollection({
  loader: byFilename('codes'),
  schema: z
    .object({
      podcast: reference('podcasts'),
      brand: reference('brands'),
      /** Själva koden. Utelämna för erbjudanden som bara går via en personlig länk. */
      code: z.string().min(2).optional(),
      /** Vad man får, med egna ord: "25 % på hela sortimentet". */
      discount: localized,
      /** Var koden används, eller den personliga erbjudandelänken. */
      url: z.url().optional(),
      valid_until: z.coerce.date().optional(),
      /** Senaste datum då koden bevisligen var aktuell (t.ex. avsnittets publiceringsdatum). */
      last_verified: z.coerce.date(),
      /** Länk till avsnittet eller sidan där koden nämns. */
      source: z.url(),
      /** Avsnittets titel, om `source` inte pekar på ett enskilt avsnitt. */
      episode: z.string().optional(),
      /**
       * Var erbjudandet gäller. SE visas på svenska sajten, US/UK på engelska,
       * och INT (fungerar överallt, t.ex. VPN och appar) på båda.
       */
      market: z.enum(['SE', 'NO', 'DK', 'FI', 'US', 'UK', 'INT']).default('SE'),
      note: localized.optional(),
    })
    .refine((c) => c.code || c.url, {
      message: 'Ange `code`, eller `url` om erbjudandet går via en personlig länk.',
    }),
});

export const collections = { podcasts, brands, codes };
