import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * POST /api/codes/utiliser — un apprenant saisit un code.
 *
 * - genre « acces » : l'accès au cours visé est ouvert immédiatement ;
 * - genre « reduction » : le code est réservé et la réduction s'applique
 *   au paiement NOVA suivant (voir /api/paiements/checkout).
 */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    let b: { code?: string } = {};
    try { b = await req.json(); } catch { /* vide */ }
    const code = String(b.code || '').trim().toUpperCase();
    if (!code) return fail('Saisissez un code', 400);

    const c = await q1<{ code: string; genre: string; valeur: number; course_id: string | null;
                         utilisations: number; utilisations_max: number; expire_le: string | null;
                         actif: boolean; libelle: string }>(
      `select * from codes_promo where code = $1`, [code]
    );
    if (!c) return fail('Code inconnu', 404, 'code_inconnu');
    if (!c.actif) return fail('Ce code a été désactivé', 400, 'code_inactif');
    if (c.expire_le && new Date(c.expire_le).getTime() < Date.now()) return fail('Ce code a expiré', 400, 'code_expire');
    if (c.utilisations_max > 0 && c.utilisations >= c.utilisations_max) return fail('Ce code a atteint sa limite', 400, 'code_epuise');

    const deja = await q1<{ n: number }>(
      `select count(*)::int as n from code_utilisations where code = $1 and user_id = $2`, [code, uid]
    );
    if (deja && deja.n) return fail('Vous avez déjà utilisé ce code', 409, 'code_deja_utilise');

    if (c.genre === 'acces' && c.course_id) {
      await exec(
        `insert into enrollments (user_id, course_id, statut) values ($1, $2, 'encours')
         on conflict (user_id, course_id) do nothing`, [uid, c.course_id]
      );
      await exec(
        `insert into course_access (user_id, course_id, source) values ($1, $2, 'code')
         on conflict (user_id, course_id) do update set source = 'code', updated_at = now()`,
        [uid, c.course_id]
      ).catch(() => undefined);
    }

    await exec(`insert into code_utilisations (code, user_id) values ($1, $2) on conflict do nothing`, [code, uid]);
    await exec(`update codes_promo set utilisations = utilisations + 1 where code = $1`, [code]);

    const cours = c.course_id
      ? await q<{ id: string; titre: string }>(`select id, titre from courses where id = $1`, [c.course_id])
      : [];

    return ok({
      code: c.code, genre: c.genre, valeur: c.valeur,
      cours: cours[0] || null,
      message: c.genre === 'acces'
        ? 'Accès ouvert : ' + (cours[0] ? cours[0].titre : 'le cours')
        : 'Réduction de ' + c.valeur + ' % enregistrée pour votre prochain paiement'
    });
  });
}
