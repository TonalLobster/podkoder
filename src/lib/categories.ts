// Kategorier för varumärken. Delas mellan sajten och skripten i scripts/,
// så filen måste fungera både i Astro och med Nodes inbyggda TypeScript-stöd.
export const CATEGORIES = {
  mat: { sv: 'Mat & dryck', en: 'Food & drink' },
  halsa: { sv: 'Hälsa & träning', en: 'Health & fitness' },
  mode: { sv: 'Kläder & mode', en: 'Fashion' },
  skonhet: { sv: 'Skönhet & hygien', en: 'Beauty & care' },
  hem: { sv: 'Hem & inredning', en: 'Home' },
  teknik: { sv: 'Teknik & appar', en: 'Tech & apps' },
  ekonomi: { sv: 'Ekonomi & försäkring', en: 'Finance & insurance' },
  foretag: { sv: 'Företag & jobb', en: 'Business & work' },
  somn: { sv: 'Sömn', en: 'Sleep' },
  media: { sv: 'Böcker & streaming', en: 'Books & streaming' },
  resor: { sv: 'Resor & upplevelser', en: 'Travel & experiences' },
  barn: { sv: 'Barn & familj', en: 'Kids & family' },
  djur: { sv: 'Djur', en: 'Pets' },
  ovrigt: { sv: 'Övrigt', en: 'Other' },
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as [CategoryId, ...CategoryId[]];
