import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/attempts — historique de mes tentatives de quiz. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const url = new URL(req.url);
    const quizId = url.searchParams.get('quizId') || '';
    const rows = await q(
      `select a.id, a.quiz_id, z.titre, a.score, a.total, a.note_pct, a.duree_s, a.created_at
         from quiz_attempts a join quizzes z on z.id = a.quiz_id
        where a.user_id = $1 and ($2 = '' or a.quiz_id = $2)
        order by a.created_at desc`,
      [a.session.user.id, quizId]
    );
    return ok({ tentatives: rows, total: rows.length });
  });
}
