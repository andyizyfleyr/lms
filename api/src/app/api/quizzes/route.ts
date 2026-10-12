import { q } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/quizzes — quiz disponibles (+ meilleure note de l'utilisateur). */
export async function GET(req: Request) {
  return handler(async () => {
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') || '';
    const rows = await q(
      `select z.id, z.titre, z.duree_s, z.note_min, z.course_id, c.titre as cours_titre,
              (select count(*)::int from quiz_questions qq where qq.quiz_id = z.id) as questions,
              (select max(note_pct) from quiz_attempts a where a.quiz_id = z.id and a.user_id = $1) as meilleure_note,
              (select count(*)::int from quiz_attempts a where a.quiz_id = z.id and a.user_id = $1) as tentatives
         from quizzes z left join courses c on c.id = z.course_id
        where ($2 = '' or z.course_id = $2)
        order by c.titre, z.titre`,
      [uid, courseId]
    );
    return ok({ quiz: rows, total: rows.length });
  });
}
