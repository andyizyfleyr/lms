import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-defis — le défi du mois, mon avance, et le classement. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const mois = new Date().toISOString().slice(0, 7);
    const defi = await q1(
      `select d.*, (select count(*)::int from defis_participations p where p.defi_id = d.id) participants
         from defis d where d.mois = $1 order by d.created_at desc limit 1`, [mois]);
    const autres = await q(
      `select d.*, (select count(*)::int from defis_participations p where p.defi_id = d.id) participants
         from defis d where d.mois <> $1 order by d.mois desc limit 6`, [mois]);
    const moi = defi
      ? await q1<{ avance: number }>('select coalesce(avance,0)::int avance from defis_participations where defi_id = $1 and user_id = $2', [(defi as { id: string }).id, uid])
      : null;
    const classement = defi
      ? await q(
        `select p.avance, u.nom, u.ville from defis_participations p join users u on u.id = p.user_id
          where p.defi_id = $1 order by p.avance desc, p.maj asc limit 10`, [(defi as { id: string }).id])
      : [];
    const recompense = await q1<{ n: number }>(
      `select count(*)::int n from points_journal where user_id = $1 and motif = 'défi du mois atteint' and ref = $2`,
      [uid, defi ? (defi as { id: string }).id : '']);
    return ok({
      defi, autres, avance: moi?.avance ?? 0, classement, recompense: (recompense?.n ?? 0) > 0,
      inscription: !!moi, mois
    });
  });
}

const corps = z.object({
  defiId: z.string().uuid().optional(),
  action: z.enum(['rejoindre', 'avancer', 'quitter']).default('rejoindre'),
  pas: z.number().int().min(1).max(50).default(1)
});

/** POST /api/p4-defis — rejoindre le défi du mois, avancer d'un pas, ou en sortir. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const uid = a.session.user.id;
    const mois = new Date().toISOString().slice(0, 7);
    const defi = p.data.defiId
      ? await q1<{ id: string; titre: string; cible: number; unite: string }>('select id, titre, cible, unite from defis where id = $1', [p.data.defiId])
      : await q1<{ id: string; titre: string; cible: number; unite: string }>('select id, titre, cible, unite from defis where mois = $1 limit 1', [mois]);
    if (!defi) return fail('Aucun défi en cours');
    if (p.data.action === 'quitter') {
      await exec('delete from defis_participations where defi_id = $1 and user_id = $2', [defi.id, uid]);
      return ok({ inscrit: false });
    }
    const actuel = await q1<{ avance: number }>('select avance from defis_participations where defi_id = $1 and user_id = $2', [defi.id, uid]);
    const avant = actuel?.avance ?? 0;
    const cible = defi.cible || 1;
    const apres = Math.min(cible, avant + (p.data.action === 'avancer' ? p.data.pas : 0));
    await exec(
      `insert into defis_participations (defi_id, user_id, avance, maj) values ($1, $2, $3, now())
       on conflict (defi_id, user_id) do update set avance = $3, maj = now()`, [defi.id, uid, apres]);
    let bonus = 0;
    if (apres >= cible && avant < cible) {
      const deja = await q1<{ n: number }>(
        `select count(*)::int n from points_journal where user_id = $1 and motif = 'défi du mois atteint' and ref = $2`, [uid, defi.id]);
      if (!(deja?.n ?? 0)) {
        bonus = 20;
        await exec(`insert into points (user_id, total) values ($1, 20) on conflict (user_id) do update set total = points.total + 20, maj = now()`, [uid]);
        await exec(`insert into points_journal (user_id, points, motif, ref) values ($1, 20, 'défi du mois atteint', $2)`, [uid, defi.id]);
        await exec(
          `insert into notifications (user_id, titre, texte, ico, kind)
           values ($1, 'Défi du mois atteint', $2, 'fire', 'defi')`,
          [uid, 'Objectif tenu : « ' + defi.titre + ' ». +20 points.']);
      }
    }
    return ok({ defi, avance: apres, cible, bonus, inscrit: true });
  });
}
