import { ok, OPTIONS, handler } from '@/lib/http';
import { chercher, FAMILLES, GLOSSAIRE } from '@/lib/glossaire';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-glossaire?q=&famille= — le vocabulaire du métier, en français.
 *  Ouvert sans compte : c'est aussi une page qui se partage. */
export async function GET(req: Request) {
  return handler(async () => {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const famille = url.searchParams.get('famille') || '';
    const termes = chercher(q, famille);
    return ok({ termes, familles: FAMILLES, total: GLOSSAIRE.length, trouve: termes.length, q, famille });
  });
}
