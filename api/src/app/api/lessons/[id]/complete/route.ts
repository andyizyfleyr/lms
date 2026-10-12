import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { progressionLecon } from '@/lib/validation';
import { controleAccesRessource } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** Recalcule la progression du cours à partir des leçons terminées. */
async function recalculer(uid: string, lessonId: string) {
  const info = await q1<{ course_id: string }>('select course_id from lessons where id = $1', [lessonId]);
  if (!info) return null;
  const stats = await q1<{ faites: number; total: number }>(
    `select (select count(*)::int from lessons l join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = $1 and lp.done
              where l.course_id = $2) as faites,
            (select count(*)::int from lessons where course_id = $2) as total`,
    [uid, info.course_id]
  );
  const pct = stats?.total ? Math.round(stats.faites / stats.total * 100) : 0;
  await exec(
    `insert into enrollments (user_id, course_id, progress, statut)
     values ($1, $2, $3, $4)
     on conflict (user_id, course_id) do update set progress = $3, updated_at = now()`,
    [uid, info.course_id, pct, pct >= 100 ? 'termine' : 'encours']
  );
  return { courseId: info.course_id, progress: pct, leconsFaites: stats?.faites ?? 0, leconsTotal: stats?.total ?? 0 };
}

/** POST /api/lessons/{id}/complete — marquer la leçon comme terminée et enregistrer le temps passé. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const acces = await controleAccesRessource(a.session, 'lessons', id);
    if (acces) return acces;
    const exist = await q1('select id from lessons where id = $1', [id]);
    if (!exist) return notFound('Leçon');

    let minutes = 0;
    if (req.headers.get('content-length') && req.headers.get('content-length') !== '0') {
      const parsed = await parseBody(req, progressionLecon);
      if (!('error' in parsed)) minutes = parsed.data.minutes;
    }
    await exec(
      `insert into lesson_progress (user_id, lesson_id, done) values ($1, $2, true)
       on conflict (user_id, lesson_id) do update set done = true, updated_at = now()`,
      [a.session.user.id, id]
    );
    if (minutes > 0) {
      await exec(
        `insert into activity (user_id, jour, minutes, lecons) values ($1, current_date, $2, 1)
         on conflict (user_id, jour) do update set minutes = activity.minutes + $2, lecons = activity.lecons + 1`,
        [a.session.user.id, minutes]
      );
    }
    const progression = await recalculer(a.session.user.id, id);
    return ok({ lecon: id, done: true, progression });
  });
}

/** DELETE /api/lessons/{id}/complete — décocher la leçon. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const acces = await controleAccesRessource(a.session, 'lessons', id);
    if (acces) return acces;
    await exec('delete from lesson_progress where user_id = $1 and lesson_id = $2', [a.session.user.id, id]);
    const progression = await recalculer(a.session.user.id, id);
    return ok({ lecon: id, done: false, progression });
  });
}
