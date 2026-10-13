import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({ code: z.string().trim().min(4).max(10) });

/** POST /api/p4-seances/emarger — l'apprenant tape le code affiché :
 *  sa présence est pointée et il gagne des points d'assiduité. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const code = p.data.code.replace(/\s/g, '');
    const c = await q1<{ session_id: string; code: string }>(
      `select session_id, code from codes_seance where code = $1 and expire_le > now()
        order by created_at desc limit 1`, [code]);
    if (!c) return fail('Ce code n\'est plus valable : demandez le code affiché à l\'écran', 400, 'code_invalide');
    const deja = await q1<{ id: string }>(
      'select id from presences where session_id = $1 and user_id = $2', [c.session_id, a.session.user.id]);
    if (deja) {
      const s = await q1('select titre, date_session, heure, salle from calendar_sessions where id = $1', [c.session_id]);
      return ok({ deja: true, seance: s, message: 'Votre présence était déjà pointée pour cette séance.' });
    }
    const s = await q1<{ titre: string; date_session: string | null; heure: string | null; salle: string | null; course_id: string | null }>(
      'select titre, date_session, heure, salle, course_id from calendar_sessions where id = $1', [c.session_id]);
    await exec(
      `insert into presences (session_id, user_id, cours_id, code) values ($1, $2, $3, $4)`,
      [c.session_id, a.session.user.id, s?.course_id || null, code]);
    await exec(
      `insert into points (user_id, total) values ($1, 5) on conflict (user_id) do update set total = points.total + 5, maj = now()`,
      [a.session.user.id]);
    await exec(
      `insert into points_journal (user_id, points, motif, ref) values ($1, 5, 'présence en séance', $2)`,
      [a.session.user.id, c.session_id]);
    return ok({ deja: false, seance: s, points: 5, message: 'Présence enregistrée : +5 points d\'assiduité.' }, 201);
  });
}
