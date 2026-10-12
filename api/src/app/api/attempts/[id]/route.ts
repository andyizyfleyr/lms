import { q, q1 } from '@/lib/db';
import { auth, ok, notFound, forbidden, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/attempts/{id} — correction détaillée d'une de mes tentatives. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const tentative = await q1('select * from quiz_attempts where id = $1', [id]);
    if (!tentative) return notFound('Tentative');
    if (tentative.user_id !== a.session.user.id && a.session.user.role === 'etudiant') return forbidden('Accès à une tentative qui n’est pas la vôtre');

    const details = await q(
      `select qa.question_id, qq.enonce, qq.explication, qa.option_id, qa.correct,
              (select texte from quiz_options o where o.id = qa.option_id) as ma_reponse,
              (select texte from quiz_options o where o.question_id = qq.id and o.correct order by o.ordre limit 1) as bonne_reponse
         from quiz_answers qa
         join quiz_questions qq on qq.id = qa.question_id
        where qa.attempt_id = $1 order by qq.ordre`,
      [id]
    );
    return ok({ tentative, details });
  });
}
