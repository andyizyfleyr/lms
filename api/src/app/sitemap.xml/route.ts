import { q } from '@/lib/db';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGES = ['/', '/cours', '/parcours', '/revision', '/outils', '/outils/formulation',
  '/outils/saponification', '/outils/convertisseur', '/outils/reglementaire', '/verifier',
  '/aide', '/etat', '/connexion', '/inscription'];

/** /sitemap.xml — les écrans publics + chaque cours, pour Google et les liens partagés. */
export async function GET() {
  const base = SITE();
  const cours = await q<{ id: string; titre: string }>(`select id, titre from courses order by id`)
    .catch(async () => [] as { id: string; titre: string }[]);
  const urls = PAGES.concat(cours.map(c => '/cours/' + c.id));
  const now = new Date().toISOString().slice(0, 10);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${base}${u}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`).join('\n') +
    '\n</urlset>';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
