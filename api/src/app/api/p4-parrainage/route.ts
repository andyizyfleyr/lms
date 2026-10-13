import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { PALIERS } from '@/lib/recompenses';
import { SITE_URL } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-parrainage — mes codes, mes filleuls, et le palier atteint. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const codes = await q(
      `select code, libelle, genre, valeur, utilisations, utilisations_max, expire_le, actif
         from codes_promo where cree_par = $1 order by created_at desc limit 20`, [uid]);
    const filleuls = await q(
      `select u.nom, u.ville, cu.created_at, cp.code
         from code_utilisations cu
         join codes_promo cp on cp.code = cu.code
         join users u on u.id = cu.user_id
        where cp.cree_par = $1 order by cu.created_at desc limit 50`, [uid]);
    const gains = await q1<{ total: number }>(
      `select coalesce(sum(o.amount),0)::int total from code_utilisations cu
         join codes_promo cp on cp.code = cu.code
         left join orders o on o.id = cu.order_id
        where cp.cree_par = $1`, [uid]);
    const actifs = filleuls.length;
    const palier = PALIERS.slice().reverse().find(p => actifs >= p.filleuls) || null;
    const prochain = PALIERS.find(p => actifs < p.filleuls) || null;
    return ok({
      codes, filleuls, filleulsActifs: actifs, gains: gains?.total ?? 0,
      paliers: PALIERS.map(p => ({ ...p, atteint: actifs >= p.filleuls, reste: Math.max(0, p.filleuls - actifs) })),
      palier, prochain,
      lien: SITE_URL + '/inscription?parrain=' + uid.slice(0, 8),
      conseil: actifs
        ? 'Chaque filleul qui s\'inscrit avec votre code vous rapproche du palier suivant.'
        : 'Partagez votre code : le premier filleul débloque un bon de 500 F, trois filleuls donnent 10 % à vie sur les kits.'
    });
  });
}
