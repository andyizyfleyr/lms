import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { estAdmin } from '@/lib/admin';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { accesDe, accesGratuit } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-examens — examens blancs ouverts à l'apprenant, ou créés par le formateur. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const u = a.session.user;
    const prof = accesGratuit(u.role);
    if (prof) {
      const liste = await q(
        `select x.*, c.titre cours_titre, u.nom auteur_nom,
                (select count(*)::int from examen_tentatives t where t.examen_id = x.id)::int passages,
                (select coalesce(round(avg(t.note * 100.0 / nullif(t.sur,0))),0)::int from examen_tentatives t where t.examen_id = x.id) moyenne
           from examens x left join courses c on c.id = x.course_id join users u on u.id = x.cree_par
          where x.cree_par = $1::uuid or $2 = 'admin' order by x.created_at desc`, [u.id, u.role]);
      const cours = await q('select id, titre from courses order by titre');
      const banque = await q(
        `select course_id, count(*)::int n from question_bank group by 1`);
      const quiz = await q(
        `select z.course_id, count(qq.id)::int n from quizzes z join quiz_questions qq on qq.quiz_id = z.id group by 1`);
      return ok({ examens: liste, cours, banque, quiz, prof: true });
    }
    const acces = await accesDe(u.id);
    const liste = await q(
      `select x.id, x.course_id, x.titre, x.duree, x.nb_questions, x.seuil, c.titre cours_titre,
              (select t.note from examen_tentatives t where t.examen_id = x.id and t.user_id = $1::uuid
                order by t.created_at desc limit 1) derniere_note,
              (select t.sur from examen_tentatives t where t.examen_id = x.id and t.user_id = $1::uuid
                order by t.created_at desc limit 1) dernier_sur,
              (select count(*)::int from examen_tentatives t where t.examen_id = x.id and t.user_id = $1::uuid) essais
         from examens x join courses c on c.id = x.course_id
        where x.publie and (x.course_id = any($2::text[]) or $3)
        order by c.titre`, [u.id, acces.cours, acces.toutPaye]);
    return ok({ examens: liste, prof: false, acces });
  });
}

const corps = z.object({
  courseId: z.string().trim().min(1).max(40),
  titre: z.string().trim().min(4).max(140),
  duree: z.number().int().min(5).max(180).default(30),
  nbQuestions: z.number().int().min(3).max(60).default(10),
  seuil: z.number().int().min(0).max(100).default(60),
  publie: z.boolean().default(true),
  theme: z.string().trim().max(60).default('')
});

/** POST /api/p4-examens — créer un examen blanc.
 *  Si la banque de questions du cours est vide, on la remplit avec les questions
 *  des quiz du cours : un formateur n'a donc jamais à tout ressaisir. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const cours = await q<{ id: string; titre: string }>('select id, titre from courses where id = $1', [d.courseId]);
    if (!cours.length) return fail('Cours inconnu');

    const dispo = await q1<{ n: number }>('select count(*)::int n from question_bank where course_id = $1', [d.courseId]);
    if ((dispo?.n ?? 0) < 3) {
      await exec(
        `insert into question_bank (course_id, theme, type, question, options, bonnes, explication, difficulte, cree_par)
         select z.course_id, coalesce($2, ''), 'qcm', qq.enonce,
                (select jsonb_agg(o.texte order by o.ordre) from quiz_options o where o.question_id = qq.id),
                (select jsonb_agg(o.ordre order by o.ordre) from quiz_options o where o.question_id = qq.id and o.correct),
                coalesce(qq.explication, ''), 2, $3::uuid
           from quiz_questions qq join quizzes z on z.id = qq.quiz_id
          where z.course_id = $1
            and not exists (select 1 from question_bank b where b.course_id = z.course_id and b.question = qq.enonce)`,
        [d.courseId, d.theme, a.session.user.id]);
    }
    const total = await q1<{ n: number }>('select count(*)::int n from question_bank where course_id = $1', [d.courseId]);
    if ((total?.n ?? 0) < 3) {
      return fail('Pas assez de questions pour ce cours : importez-en d\'abord (au moins 3)', 400, 'banque_vide');
    }
    const x = await q1(
      `insert into examens (course_id, titre, duree, nb_questions, seuil, cree_par, publie)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [d.courseId, d.titre, d.duree, Math.min(d.nbQuestions, total!.n), d.seuil, a.session.user.id, d.publie]);
    return ok({ examen: x, banque: total!.n }, 201);
  });
}
