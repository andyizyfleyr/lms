import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** /robots.txt — le site public est indexable, les espaces personnels non. */
export function GET() {
  const base = SITE();
  const corps = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /compte',
    'Disallow: /parametres',
    'Disallow: /notifications',
    'Disallow: /paiements',
    'Disallow: /mes-donnees',
    '',
    'Sitemap: ' + base + '/sitemap.xml'
  ].join('\n');
  return new Response(corps, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
