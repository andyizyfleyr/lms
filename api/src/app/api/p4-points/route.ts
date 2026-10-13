import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { RECOMPENSES } from '@/lib/recompenses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-points — mes points, comment je les ai gagnés, ce que je peux en faire. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const total = await q1<{ total: number }>('select coalesce(total,0)::int total from points where user_id = $1', [uid]);
    const journal = await q<{ points: number; motif: string; ref: string | null; created_at: string }>(
      `select points, motif, ref, created_at from points_journal where user_id = $1 order by created_at desc limit 40`, [uid]);
    const gagnes = journal.filter(j => j.points > 0).reduce((n, j) => n + j.points, 0);
    const depenses = journal.filter(j => j.points < 0).reduce((n, j) => n + j.points, 0);
    const rang = await q1<{ rang: number; n: number }>(
      `select (select count(*)::int + 1 from points p2
                where p2.user_id <> $1::uuid and p2.total > coalesce((select total from points where user_id = $1::uuid), 0)) rang,
              (select (count(*) + case when exists (select 1 from points where user_id = $1::uuid) then 0 else 1 end)::int from points) n`, [uid]);
    const echanges = await q1<{ valeur: unknown }>('select valeur from user_data where user_id = $1 and cle = $2', [uid, 'lh_recompenses']);
    const mes = Array.isArray(echanges?.valeur) ? (echanges!.valeur as Array<Record<string, unknown>>) : [];
    const solde = total?.total ?? 0;
    return ok({
      solde, gagnes, depenses, rang: rang?.rang ?? 1, participants: rang?.n ?? 0,
      journal,
      recompenses: RECOMPENSES.map(r => ({ ...r, possible: solde >= r.points, manque: Math.max(0, r.points - solde) })),
      echanges: mes.slice(-20).reverse(),
      comment: [
        { action: 'Répondre utilement sur l\'entraide', points: '+2', ico: 'chat' },
        { action: 'Partager une réalisation', points: '+5', ico: 'grid' },
        { action: 'Pointer sa présence en séance', points: '+5', ico: 'check-circle' },
        { action: 'Atteindre l\'objectif du défi du mois', points: '+20', ico: 'fire' },
        { action: 'Réussir un examen blanc', points: '+15', ico: 'medal' }
      ]
    });
  });
}
