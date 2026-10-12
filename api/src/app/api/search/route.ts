import { q } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/search?q= — recherche globale : cours, leçons, vidéos, ressources, quiz, devoirs. */
export async function GET(req: Request) {
  return handler(async () => {
    const url = new URL(req.url);
    const terme = (url.searchParams.get('q') || '').trim();
    if (terme.length < 2) return fail('Saisissez au moins 2 caractères', 422, 'recherche_trop_courte');
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const like = '%' + terme + '%';

    const [cours, lecons, videos, ressources, quiz, devoirs] = await Promise.all([
      q(`select id, titre, categorie, prof, accent, ico from courses
          where titre ilike $1 or categorie ilike $1 or prof ilike $1 limit 10`, [like]),
      q(`select l.id, l.titre, l.course_id, c.titre as cours_titre, coalesce(lp.done,false) as done
           from lessons l join courses c on c.id = l.course_id
           left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = $2
          where l.titre ilike $1 or l.module_titre ilike $1 limit 15`, [like, uid]),
      q(`select id, titre, chaine, duree_s, course_id from videos
          where titre ilike $1 or chaine ilike $1 limit 15`, [like]),
      q(`select r.id, r.titre, r.type_label, r.course_id, c.titre as cours_titre
           from resources r join courses c on c.id = r.course_id where r.titre ilike $1 limit 10`, [like]),
      q(`select z.id, z.titre, z.course_id, c.titre as cours_titre from quizzes z
           join courses c on c.id = z.course_id where z.titre ilike $1 limit 10`, [like]),
      q(`select a.id, a.titre, a.course_id, c.titre as cours_titre from assignments a
           join courses c on c.id = a.course_id where a.titre ilike $1 limit 10`, [like])
    ]);
    const total = cours.length + lecons.length + videos.length + ressources.length + quiz.length + devoirs.length;
    return ok({ terme, total, cours, lecons, videos, ressources, quiz, devoirs });
  });
}
