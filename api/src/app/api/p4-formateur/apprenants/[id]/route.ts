import { q, q1 } from '@/lib/db';
import { estAdmin } from '@/lib/admin';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-formateur/apprenants/{id} — tout ce que le formateur doit savoir
 *  avant de conseiller quelqu'un : où il en est, ce qu'il a payé, ses présences. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const profil = await q1(
      `select u.id, u.nom, u.email, u.tel, u.ville, u.promo, u.bio, u.role, u.created_at,
              (select coalesce(sum(p.total),0)::int from points p where p.user_id = u.id) points
         from users u where u.id = $1`, [id]);
    if (!profil) return notFound('Apprenant');
    const cours = await q(
      `select c.id, c.titre, e.progress, e.statut, e.updated_at,
              (select count(*)::int from lessons l where l.course_id = c.id) lecons,
              (select count(*)::int from lesson_progress lp join lessons l2 on l2.id = lp.lesson_id
                where l2.course_id = c.id and lp.user_id = $1 and lp.done) faites,
              ca.source, ca.expires_at
         from enrollments e join courses c on c.id = e.course_id
         left join course_access ca on ca.course_id = c.id and ca.user_id = $1
        where e.user_id = $1 order by e.updated_at desc nulls last`, [id]);
    const notes = await q(
      `select 'quiz' genre, z.titre, a.note_pct note, null::int sur, a.created_at
         from quiz_attempts a join quizzes z on z.id = a.quiz_id where a.user_id = $1
        union all
       select 'examen' genre, x.titre, t.note, t.sur, t.created_at
         from examen_tentatives t join examens x on x.id = t.examen_id where t.user_id = $1
        order by created_at desc limit 12`, [id]);
    const paiements = await q(
      `select type, amount, status, description, created_at from orders
        where user_id = $1 order by created_at desc limit 10`, [id]);
    const presences = await q(
      `select p.created_at, s.titre, s.date_session, s.salle
         from presences p left join calendar_sessions s on s.id = p.session_id
        where p.user_id = $1 order by p.created_at desc limit 15`, [id]);
    const activite = await q(
      `select jour, minutes, lecons from activity where user_id = $1 order by jour desc limit 14`, [id]);
    const messages = await q(
      `select contenu, created_at from messages where user_id = $1 order by created_at desc limit 6`, [id]);
    const assiduite = presences.length;
    const devoirs = await q(
      `select s.statut, s.note, a.titre, s.updated_at
         from submissions s join assignments a on a.id = s.assignment_id
        where s.user_id = $1 order by s.updated_at desc nulls last limit 10`, [id]);
    return ok({ profil, cours, notes, paiements, presences, activite, messages, devoirs, assiduite });
  });
}
