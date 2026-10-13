import { q } from '@/lib/db';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGES = ['/', '/cours', '/parcours', '/revision', '/outils', '/outils/formulation',
  '/outils/saponification', '/outils/convertisseur', '/outils/reglementaire', '/outils/prix', '/verifier',
  '/aide', '/etat', '/connexion', '/inscription', '/boutique', '/communaute', '/galerie', '/ateliers',
  '/glossaire'];

/** /sitemap.xml — les écrans publics + chaque cours, pour Google et les liens partagés. */
export async function GET() {
  const base = SITE();
  const cours = await q<{ id: string; titre: string }>(`select id, titre from courses order by id`)
    .catch(async () => [] as { id: string; titre: string }[]);
  /* les fiches publiques des ateliers et la boutique : ce sont les pages qui se partagent */
  const ouvrages = await q<{ id: string }>(`select id from pdfs where publie order by ordre`)
    .catch(async () => [] as { id: string }[]);
  const produits = await q<{ slug: string }>(`select slug from produits where publie and slug is not null order by created_at desc limit 200`)
    .catch(async () => [] as { slug: string }[]);
  const lots = await q<{ slug: string }>(`select slug from lots where publie and slug is not null order by created_at desc limit 200`)
    .catch(async () => [] as { slug: string }[]);
  const urls = PAGES
    .concat(cours.map(c => '/cours/' + c.id))
    .concat(ouvrages.map(o => '/boutique/' + o.id))
    .concat(produits.map(x => '/p/' + x.slug))
    .concat(lots.map(x => '/l/' + x.slug));
  const now = new Date().toISOString().slice(0, 10);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${base}${u}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`).join('\n') +
    '\n</urlset>';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
