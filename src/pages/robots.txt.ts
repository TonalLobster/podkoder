import type { APIRoute } from 'astro';
import { SITE } from '../site.config.ts';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', SITE.url).href}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
