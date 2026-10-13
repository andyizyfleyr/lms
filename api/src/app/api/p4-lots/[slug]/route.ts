import { q1 } from '@/lib/db';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-lots/{slug} — fiche publique d'un lot : la traçabilité que
 *  la cliente retrouve en scannant l'étiquette. Accessible sans compte. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handler(async () => {
    const { slug } = await params;
    const lot = await q1(
      `select l.numero, l.recette, l.quantite, l.date_fab, l.controles, l.observation, l.statut,
              l.prochain_controle, l.slug, l.created_at, u.nom fabricant, u.ville atelier,
              p.nom produit, p.contenance, p.inci, p.precautions, p.slug produit_slug, p.pao
         from lots l join users u on u.id = l.user_id left join produits p on p.id = l.produit_id
        where l.slug = $1 and l.publie`, [slug]);
    if (!lot) return notFound('Lot');
    return ok({ lot });
  });
}
