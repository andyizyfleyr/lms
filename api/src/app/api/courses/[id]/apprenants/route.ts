import { q } from '@/lib/db';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Ligne = {
  user_id: string; nom: string; email: string; promo: string; ville: string;
  progress: number; statut: string; inscrit_at: string; derniere_activite: string | null;
  lecons_faites: number; depots: number; a_noter: number; moyenne_quiz: number | null;
};

/**
 * GET /api/courses/{id}/apprenants — suivi des apprenants d'un cours (enseignant / admin).
 *
 * Une seule requête : pour chaque inscrit, sa progression, ses leçons terminées, ses
 * dépôts de devoirs (et ceux qui restent à corriger), sa moyenne de quiz et sa date
 * de dernière activité. C'est la matière de l'écran « Suivi des apprenants ».
 * Filtres : ?tri=activite|nom|progression  ?q=recherche
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const url = new URL(req.url);
    const tri = url.searchParams.get('tri') || 'activite';
    const rech = (url.searchParams.get('q') || '').trim();

    const cours = await q(`select id, titre, prof, total_lecons from courses where id = $1`, [id]);
    if (!cours.length) return notFound('Cours');

    const rows = await q<Ligne>(
      `select u.id as user_id, u.nom, u.email, coalesce(u.promo, '') as promo, coalesce(u.ville, '') as ville,
              e.progress, e.statut, e.updated_at as inscrit_at,
              (select max(lp.updated_at) from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = e.course_id and lp.user_id = u.id and lp.done) as derniere_activite,
              (select count(*)::int from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = e.course_id and lp.user_id = u.id and lp.done) as lecons_faites,
              (select count(*)::int from submissions s
                 join assignments d on d.id = s.assignment_id
                where d.course_id = e.course_id and s.user_id = u.id) as depots,
              (select count(*)::int from submissions s
                 join assignments d on d.id = s.assignment_id
                where d.course_id = e.course_id and s.user_id = u.id and s.statut <> 'note') as a_noter,
              (select round(avg(z.note_pct))::int from quiz_attempts z
                 join quizzes qz on qz.id = z.quiz_id
                where qz.course_id = e.course_id and z.user_id = u.id) as moyenne_quiz
         from enrollments e join users u on u.id = e.user_id
        where e.course_id = $1
          and ($2 = '' or u.nom ilike '%' || $2 || '%' or u.email ilike '%' || $2 || '%')
        order by case when $3 = 'nom' then u.nom end asc,
                 case when $3 = 'progression' then e.progress end desc nulls last,
                 case when $3 = 'activite' then e.updated_at end desc nulls last,
                 u.nom asc`,
      [id, rech, tri]
    );

    const total = await q<{ inscrits: number }>(
      `select count(*)::int as inscrits from enrollments where course_id = $1`, [id]
    );
    return ok({ cours: cours[0], apprenants: rows, inscrits: (total[0] && total[0].inscrits) || 0 });
  });
}
