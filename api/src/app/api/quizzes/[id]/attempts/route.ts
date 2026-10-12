import { q, q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { tentativeQuiz } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * POST /api/quizzes/{id}/attempts — soumettre ses réponses.
 * La correction est faite **côté serveur** : le score ne peut pas être falsifié depuis l'application.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;

    const quiz = await q1<{ id: string; course_id: string; note_min: number }>(
      'select id, course_id, note_min from quizzes where id = $1', [id]
    );
    if (!quiz) return notFound('Quiz');
    const parsed = await parseBody(req, tentativeQuiz);
    if ('error' in parsed) return parsed.error;

    const corrige = await q<{ question_id: string; option_id: string; correct: boolean; explication: string; enonce: string; bonne_reponse: string }>(
      `select qq.id as question_id, o.id as option_id, o.correct, qq.explication, qq.enonce,
              (select o2.texte from quiz_options o2 where o2.question_id = qq.id and o2.correct order by o2.ordre limit 1) as bonne_reponse
         from quiz_questions qq
         join quiz_options o on o.question_id = qq.id
        where qq.quiz_id = $1`,
      [id]
    );

    const parQuestion = new Map<string, { correcte: string; explication: string; enonce: string; bonneReponse: string }>();
    for (const r of corrige) {
      if (r.correct) parQuestion.set(r.question_id, { correcte: r.option_id, explication: r.explication, enonce: r.enonce, bonneReponse: r.bonne_reponse });
    }

    const total = parQuestion.size;
    const details = parsed.data.reponses.map(rep => {
      const bonne = parQuestion.get(rep.questionId);
      return {
        questionId: rep.questionId,
        optionId: rep.optionId,
        correct: !!bonne && bonne.correcte === rep.optionId,
        bonneReponse: bonne?.bonneReponse ?? '',
        explication: bonne?.explication ?? ''
      };
    });
    const score = details.filter(d => d.correct).length;
    const notePct = total ? Math.round(score / total * 100) : 0;
    const reussi = notePct >= quiz.note_min;

    const tentative = await q1<{ id: string; created_at: string }>(
      `insert into quiz_attempts (user_id, quiz_id, score, total, note_pct, duree_s)
       values ($1, $2, $3, $4, $5, $6) returning id, created_at`,
      [a.session.user.id, id, score, total, notePct, parsed.data.dureeS]
    );
    if (tentative) {
      for (const d of details) {
        await exec(
          `insert into quiz_answers (attempt_id, question_id, option_id, correct) values ($1, $2, $3, $4)
           on conflict (attempt_id, question_id) do update set option_id = excluded.option_id, correct = excluded.correct`,
          [tentative.id, d.questionId, d.optionId, d.correct]
        );
      }
    }
    await exec(
      `insert into activity (user_id, jour, minutes, lecons) values ($1, current_date, $2, 0)
       on conflict (user_id, jour) do update set minutes = activity.minutes + $2`,
      [a.session.user.id, Math.round(parsed.data.dureeS / 60)]
    );

    return ok({
      tentative: { id: tentative?.id, score, total, notePct, reussi, noteMin: quiz.note_min, createdAt: tentative?.created_at },
      details
    }, 201);
  });
}
