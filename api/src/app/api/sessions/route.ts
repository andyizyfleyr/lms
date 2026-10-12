import { q, q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { seance } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/sessions — agenda : séances de la semaine avec mon état de rappel.
 * ?semaine=1 pour n'aller que jusqu'à dimanche, ?courseId=, ?type=.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') || '';
    const type = url.searchParams.get('type') || '';
    const rows = await q<{ jour_semaine: number; [k: string]: unknown }>(
      `select s.*, c.titre as cours_titre, c.accent as cours_accent,
              coalesce(r.actif, false) as rappel, r.minutes_avant
         from calendar_sessions s
         left join courses c on c.id = s.course_id
         left join session_reminders r on r.session_id = s.id and r.user_id = $1
        where ($2 = '' or s.course_id = $2) and ($3 = '' or s.type = $3)
        order by s.jour_semaine, s.heure`,
      [uid, courseId, type]
    );
    const parJour: Record<number, typeof rows> = {};
    for (const s of rows) (parJour[s.jour_semaine] ||= []).push(s);
    return ok({ seances: rows, parJour, total: rows.length, aujourdhui: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 });
  });
}

/** POST /api/sessions — programmer une séance (enseignant / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, seance);
    if ('error' in parsed) return parsed.error;
    const s = parsed.data;
    const id = 's' + Date.now().toString(36);
    const row = await q1(
      `insert into calendar_sessions (id, jour_semaine, date_session, heure, titre, type, duree_label,
                                      salle, course_id, prof, description)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [id, s.jourSemaine, s.dateSession ?? null, s.heure, s.titre, s.type, s.dureeLabel, s.salle,
       s.courseId ?? null, s.prof, s.description]
    );
    if (s.rappel) await q1(
      `insert into session_reminders (user_id, session_id, actif) values ($1, $2, true)
       on conflict (user_id, session_id) do nothing`, [a.session.user.id, id]
    );
    return ok({ seance: row }, 201);
  });
}
