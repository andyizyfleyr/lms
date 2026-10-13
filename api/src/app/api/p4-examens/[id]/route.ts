import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, notFound, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { accesDe, accesGratuit } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Question = { id: string; question: string; options: string[]; bonnes: number[]; explication: string; theme: string };

/** GET /api/p4-examens/{id} — les questions (sans les réponses) et mes essais précédents. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const x = await q1<{ id: string; course_id: string; titre: string; duree: number; nb_questions: number; seuil: number; publie: boolean; cree_par: string }>(
      'select * from examens where id = $1', [id]);
    if (!x) return notFound('Examen');
    const u = a.session.user;
    const prof = accesGratuit(u.role) || x.cree_par === u.id;
    if (!prof) {
      if (!x.publie) return fail('Cet examen n\'est pas encore ouvert', 403, 'interdit');
      const acces = await accesDe(u.id);
      if (!acces.toutPaye && acces.cours.indexOf(x.course_id) < 0) {
        return fail('Cet examen porte sur un cours que vous n\'avez pas encore débloqué', 403, 'acces');
      }
    }
    const questions = await q<Question>(
      `select id, question, options, bonnes, coalesce(explication,'') explication, coalesce(theme,'') theme
         from question_bank where course_id = $1
        order by difficulte, created_at
        limit $2`, [x.course_id, x.nb_questions]);
    const tentatives = await q(
      `select id, note, sur, duree_s, created_at from examen_tentatives
        where examen_id = $1 and user_id = $2 order by created_at desc limit 5`, [id, u.id]);
    const cours = await q1('select titre, prof from courses where id = $1', [x.course_id]);
    return ok({
      examen: x, cours, tentatives,
      questions: prof
        ? questions
        : questions.map(qq => ({ id: qq.id, question: qq.question, options: qq.options, theme: qq.theme, bonnes: [], explication: '' })),
      prof
    });
  });
}

const corps = z.object({
  reponses: z.array(z.object({
    questionId: z.string().uuid(),
    option: z.number().int().min(0).max(20).nullable().default(null)
  })).min(1).max(60),
  dureeS: z.number().int().min(0).max(36_000).default(0)
});

/** POST /api/p4-examens/{id} — rendre la copie : correction immédiate, note, points. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const x = await q1<{ id: string; course_id: string; titre: string; seuil: number; publie: boolean }>(
      'select id, course_id, titre, seuil, publie from examens where id = $1', [id]);
    if (!x) return notFound('Examen');
    if (!x.publie && a.session.user.role === 'etudiant') return fail('Cet examen n\'est pas ouvert', 403, 'interdit');
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const questions = await q<Question>(
      `select id, question, options, bonnes, coalesce(explication,'') explication, coalesce(theme,'') theme
         from question_bank where course_id = $1 order by created_at limit 60`, [x.course_id]);
    const parId = new Map(questions.map(qq => [qq.id, qq]));
    const detail: Array<{ id: string; question: string; bonnes: number[]; choisi: number | null; juste: boolean; explication: string }> = [];
    let note = 0;
    for (const r of p.data.reponses) {
      const qq = parId.get(r.questionId);
      if (!qq) continue;
      const bonnes = (qq.bonnes || []).map(Number);
      const juste = r.option !== null && bonnes.indexOf(r.option) >= 0;
      if (juste) note++;
      detail.push({ id: qq.id, question: qq.question, bonnes, choisi: r.option, juste, explication: qq.explication });
    }
    const sur = detail.length || 1;
    const pourcent = Math.round((note * 100) / sur);
    const reussi = pourcent >= x.seuil;
    await exec(
      `insert into examen_tentatives (examen_id, user_id, note, sur, detail, duree_s)
       values ($1, $2, $3, $4, $5::jsonb, $6)`,
      [id, a.session.user.id, note, sur, JSON.stringify(detail), p.data.dureeS]);
    if (reussi) {
      await exec(
        `insert into points (user_id, total) values ($1, 15) on conflict (user_id) do update set total = points.total + 15, maj = now()`,
        [a.session.user.id]);
      await exec(
        `insert into points_journal (user_id, points, motif, ref) values ($1, 15, 'examen blanc réussi', $2)`,
        [a.session.user.id, id]);
    } else {
      await exec(
        `insert into points_journal (user_id, points, motif, ref) values ($1, 2, 'examen blanc passé', $2)`,
        [a.session.user.id, id]);
      await exec(
        `insert into points (user_id, total) values ($1, 2) on conflict (user_id) do update set total = points.total + 2, maj = now()`,
        [a.session.user.id]);
    }
    return ok({ note, sur, pourcent, seuil: x.seuil, reussi, detail });
  });
}
