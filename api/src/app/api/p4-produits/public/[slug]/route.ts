import { q1, exec } from '@/lib/db';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-produits/public/{slug} — la fiche que le QR de l'étiquette ouvre.
 *  Accessible sans compte : c'est la preuve d'authenticité pour la cliente. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handler(async () => {
    const { slug } = await params;
    const p = await q1(
      `select p.id, p.nom, p.categorie, p.prix, p.contenance, p.lot, p.pao, p.responsable,
              p.ingredients, p.inci, p.precautions, p.photo, p.slug, p.created_at,
              u.nom vendeur, u.ville
         from produits p join users u on u.id = p.user_id
        where p.slug = $1 and p.publie`, [slug]);
    if (!p) return notFound('Produit');
    await exec('update produits set updated_at = updated_at where id = $1', [(p as { id: string }).id]).catch(() => 0);
    return ok({ produit: p });
  });
}
