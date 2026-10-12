import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { etatVideo } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/videos/{id}/progress — progression, position, j'aime, enregistrer. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const exist = await q1('select id from videos where id = $1', [id]);
    if (!exist) return notFound('Vidéo');
    const parsed = await parseBody(req, etatVideo);
    if ('error' in parsed) return parsed.error;
    const e = parsed.data;

    const row = await q1(
      `insert into video_state (user_id, video_id, progress, liked, saved, position_s)
       values ($1, $2, coalesce($3, 0), coalesce($4, false), coalesce($5, false), coalesce($6, 0))
       on conflict (user_id, video_id) do update set
         progress = greatest(video_state.progress, coalesce($3, video_state.progress)),
         liked = coalesce($4, video_state.liked),
         saved = coalesce($5, video_state.saved),
         position_s = coalesce($6, video_state.position_s),
         updated_at = now()
       returning *`,
      [a.session.user.id, id, e.progress ?? null, e.liked ?? null, e.saved ?? null, e.positionS ?? null]
    );
    if (e.positionS) {
      await exec(
        `insert into activity (user_id, jour, minutes) values ($1, current_date, 1)
         on conflict (user_id, jour) do update set minutes = activity.minutes + 1`,
        [a.session.user.id]
      );
    }
    return ok({ etat: row });
  });
}
