import { q, exec } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/progress — toute la progression de l'utilisateur connecté :
 * cours suivis, leçons terminées, vidéos, quiz, devoirs.
 * `?format=app` renvoie la forme exacte attendue par l'application HTML (lh_lessons, lh_quiz…).
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const url = new URL(req.url);

    const [cours, lecons, videos, quiz, devoirs, activite] = await Promise.all([
      q(`select c.id, c.titre, e.progress, e.favori, e.statut, e.updated_at
           from enrollments e join courses c on c.id = e.course_id
          where e.user_id = $1 order by e.updated_at desc`, [uid]),
      q<{ id: string; course_id: string; titre: string; module_titre: string; kind: string; video_id: string; done: boolean; updated_at: string }>(`select l.id, l.course_id, l.titre, l.module_titre, l.kind, l.video_id, lp.done, lp.updated_at
           from lesson_progress lp join lessons l on l.id = lp.lesson_id
          where lp.user_id = $1 and lp.done order by lp.updated_at desc`, [uid]),
      q<{ id: string; titre: string; chaine: string; duree_s: number; progress: number; liked: boolean; saved: boolean; position_s: number; updated_at: string }>(`select v.id, v.titre, v.chaine, v.duree_s, s.progress, s.liked, s.saved, s.position_s, s.updated_at
           from video_state s join videos v on v.id = s.video_id
          where s.user_id = $1 order by s.updated_at desc`, [uid]),
      q<{ id: string; quiz_id: string; titre: string; score: number; total: number; note_pct: number; created_at: string }>(`select a.id, a.quiz_id, z.titre, a.score, a.total, a.note_pct, a.created_at
           from quiz_attempts a join quizzes z on z.id = a.quiz_id
          where a.user_id = $1 order by a.created_at desc`, [uid]),
      q<{ id: string; assignment_id: string; titre: string; statut: string; note: number | null; created_at: string }>(`select s.id, s.assignment_id, a.titre, s.statut, s.note, s.created_at
           from submissions s join assignments a on a.id = s.assignment_id
          where s.user_id = $1 order by s.created_at desc`, [uid]),
      q(`select jour, minutes, lecons from activity where user_id = $1 order by jour desc limit 60`, [uid])
    ]);

    if (url.searchParams.get('format') === 'app') {
      const leconsObj: Record<string, number> = {};
      for (const l of lecons) leconsObj[l.id] = 1;
      const videoEtat: Record<string, { prog: number; like: boolean; save: boolean }> = {};
      for (const v of videos) videoEtat[v.id] = { prog: v.progress, like: v.liked, save: v.saved };
      const quizEtat: Record<string, { best: number; attempts: number }> = {};
      for (const z of quiz) {
        const cur = quizEtat[z.quiz_id] ?? { best: 0, attempts: 0 };
        quizEtat[z.quiz_id] = { best: Math.max(cur.best, z.note_pct), attempts: cur.attempts + 1 };
      }
      return ok({ lh_lessons: leconsObj, lh_videos: videoEtat, lh_quiz: quizEtat, cours, activite,
                  date: new Date().toISOString() });
    }

    return ok({ cours, lecons, videos, quiz, devoirs, activite, compteurs: {
      cours: cours.length, lecons: lecons.length, videos: videos.length, quiz: quiz.length, devoirs: devoirs.length } });
  });
}

/** DELETE /api/progress — remettre toute la progression à zéro (le compte et les contenus restent). */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    await exec('delete from lesson_progress where user_id = $1', [uid]);
    await exec('delete from video_state where user_id = $1', [uid]);
    await exec('delete from quiz_attempts where user_id = $1', [uid]);
    await exec('delete from submissions where user_id = $1', [uid]);
    await exec('delete from activity where user_id = $1', [uid]);
    await exec('update enrollments set progress = 0, statut = $2, updated_at = now() where user_id = $1', [uid, 'encours']);
    return ok({ remis: true });
  });
}
