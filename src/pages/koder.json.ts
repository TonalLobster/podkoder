import type { APIRoute } from 'astro';
import { SITE } from '../site.config.ts';
import { getData } from '../lib/offers.ts';

// Öppen data: alla aktiva erbjudanden, alla marknader, som JSON (CC BY-SA 4.0).
export const GET: APIRoute = async () => {
  const [sv, en] = await Promise.all([getData('sv', { anyMarket: true }), getData('en', { anyMarket: true })]);
  const english = new Map(en.offers.map((o) => [o.id, o]));

  const body = {
    source: SITE.url,
    license: 'CC BY-SA 4.0',
    generated: new Date().toISOString(),
    offers: sv.offers.map((o) => ({
      id: o.id,
      podcast: o.podcast,
      brand: { id: o.brand.id, name: o.brand.name, category: o.brand.category },
      code: o.code ?? null,
      discount: { sv: o.discount, en: english.get(o.id)?.discount ?? o.discount },
      url: o.url ?? null,
      note: o.note ?? null,
      valid_until: o.validUntil?.toISOString().slice(0, 10) ?? null,
      last_verified: o.lastVerified.toISOString().slice(0, 10),
      status: o.status,
      market: o.market,
      source: o.source,
      episode: o.episode ?? null,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
