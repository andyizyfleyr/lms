import { q, q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/quizzes/{id} — questions et options **sans les réponses**.
 * Les réponses ne sont jamais envoyées avant la soumission : la correction se fait côté serveur.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const session = await sessionFrom(req);
    const quiz = await q1('select id, titre, duree_s, note_min, course_id from quizzes where id = $1', [id]);
    if (!quiz) return notFound('Quiz');
    const questions = await q(
      `select id, ordre, enonce from quiz_questions where quiz_id = $1 order by ordre`, [id]
    );
    const options = await q(
      `select o.id, o.question_id, o.ordre, o.texte
         from quiz_options o join quiz_questions qq on qq.id = o.question_id
        where qq.quiz_id = $1 order by o.question_id, o.ordre`, [id]
    );
    const monHistorique = session ? await q(
      `select id, score, total, note_pct, created_at from quiz_attempts
        where quiz_id = $1 and user_id = $2 order by created_at desc`,
      [id, session.user.id]
    ) : [];
    return ok({
      quiz,
      questions: questions.map(qq => ({ ...qq, options: options.filter(o => o.question_id === qq.id).map(o => ({ id: o.id, texte: o.texte, ordre: o.ordre })) })),
      historique: monHistorique
    });
  });
}
