import { q, q1, exec } from '@/lib/db';
import { auth, ok, notFound, fail, forbidden, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-seances/{id}/code — code du jour + présences déjà pointées. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const s = await q1<{ id: string; titre: string; prof: string | null }>('select id, titre, prof from calendar_sessions where id = $1', [id]);
    if (!s) return notFound('Séance');
    const prof = a.session.user.role !== 'etudiant';
    const code = await q1<{ code: string; expire_le: string; cree_par: string | null }>(
      `select code, expire_le, cree_par from codes_seance where session_id = $1 and expire_le > now() order by created_at desc limit 1`, [id]);
    const presences = await q(
      `select p.created_at, p.user_id, u.nom, u.ville from presences p join users u on u.id = p.user_id
        where p.session_id = $1 order by p.created_at desc limit 100`, [id]);
    if (!prof && code) return ok({ seance: s, code: null, expire: null, presences: [] , ouvert: true });
    return ok({ seance: s, code: code?.code || null, expire: code?.expire_le || null, presences, prof });
  });
}

/** POST /api/p4-seances/{id}/code — le formateur affiche un code à l'écran ;
 *  il change à chaque fois et meurt au bout de 25 minutes. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    if (a.session.user.role === 'etudiant') return forbidden('Code de séance réservé au formateur');
    const { id } = await params;
    const s = await q1<{ id: string; titre: string }>('select id, titre from calendar_sessions where id = $1', [id]);
    if (!s) return notFound('Séance');
    const corps = await req.json().catch(() => ({})) as { minutes?: number };
    const minutes = Math.max(5, Math.min(240, Number(corps?.minutes) || 25));
    const code = String(Math.floor(100000 + Math.random() * 900000));
    /* une séance n'a qu'un code à la fois : le nouveau remplace l'ancien, qui ne
       fonctionne plus à partir de cet instant */
    await exec(
      `insert into codes_seance (session_id, code, expire_le, cree_par)
       values ($1, $2, now() + ($3 || ' minutes')::interval, $4)
       on conflict (session_id) do update
         set code = excluded.code, expire_le = excluded.expire_le, cree_par = excluded.cree_par`,
      [id, code, minutes, a.session.user.id]);
    return ok({ seance: s, code, minutes }, 201);
  });
}

/** DELETE — fermer la séance (on ne pointe plus). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    if (a.session.user.role === 'etudiant') return fail('Réservé au formateur', 403, 'interdit');
    const { id } = await params;
    const n = await exec('update codes_seance set expire_le = now() where session_id = $1 and expire_le > now()', [id]);
    return ok({ ferme: !!n || true });
  });
}
