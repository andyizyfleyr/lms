import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { recompenseParId } from '@/lib/recompenses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({ recompenseId: z.string().trim().min(2).max(40) });

const codeBon = () => 'PT' + Math.random().toString(36).slice(2, 8).toUpperCase();

/** POST /api/p4-points/echanger — échanger des points.
 *  Pour un bon, un vrai code promo est créé : il s'utilise au paiement. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const r = recompenseParId(p.data.recompenseId);
    if (!r) return fail('Récompense inconnue');
    const uid = a.session.user.id;
    const total = await q1<{ total: number }>('select coalesce(total,0)::int total from points where user_id = $1', [uid]);
    const solde = total?.total ?? 0;
    if (solde < r.points) return fail('Il vous manque ' + (r.points - solde) + ' points pour cet échange');

    await exec(
      `insert into points (user_id, total) values ($1, $2) on conflict (user_id) do update set total = points.total - $2, maj = now()`,
      [uid, r.points]);
    await exec(
      `insert into points_journal (user_id, points, motif, ref) values ($1, $2, $3, $4)`,
      [uid, -r.points, 'échange : ' + r.nom, r.id]);

    let code: string | null = null;
    if (r.genre === 'bon' && r.valeur) {
      code = codeBon();
      await exec(
        `insert into codes_promo (code, libelle, genre, valeur, utilisations_max, expire_le, actif, cree_par)
         values ($1, $2, 'montant', $3, 1, now() + ($4 || ' days')::interval, true, $5)`,
        [code, 'Bon fidélité — ' + a.session.user.nom, r.valeur, String(r.jours || 90), uid]);
      await exec(
        `insert into notifications (user_id, titre, texte, ico, kind)
         values ($1, 'Votre bon est prêt', $2, 'card', 'recompense')`,
        [uid, 'Bon de ' + r.valeur + ' F : code ' + code + '. Il s\'utilise au moment du paiement.']);
    }
    const liste = await q1<{ valeur: unknown }>('select valeur from user_data where user_id = $1 and cle = $2', [uid, 'lh_recompenses']);
    const mes = Array.isArray(liste?.valeur) ? (liste!.valeur as unknown[]) : [];
    mes.push({ id: r.id, nom: r.nom, points: r.points, code, le: new Date().toISOString() });
    await exec(
      `insert into user_data (user_id, cle, valeur, updated_at) values ($1, 'lh_recompenses', $2::jsonb, now())
       on conflict (user_id, cle) do update set valeur = $2::jsonb, updated_at = now()`,
      [uid, JSON.stringify(mes)]);
    return ok({ recompense: r, code, solde: solde - r.points }, 201);
  });
}
