import { q1 } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { reglages } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/settings — mes réglages (thème, langue, notifications…). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    let row = await q1('select * from settings where user_id = $1', [a.session.user.id]);
    if (!row) row = await q1('insert into settings (user_id) values ($1) returning *', [a.session.user.id]);
    return ok({ reglages: row });
  });
}

/** PATCH /api/settings — modifier mes réglages. */
export async function PATCH(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, reglages);
    if ('error' in parsed) return parsed.error;
    const r = parsed.data;
    const row = await q1(
      `insert into settings (user_id, theme, langue, notifications_email, notifications_push, rappels_sessions, donnees_mobiles)
       values ($1, coalesce($2,'clair'), coalesce($3,'fr'), coalesce($4,true), coalesce($5,true), coalesce($6,true), coalesce($7,false))
       on conflict (user_id) do update set
         theme = coalesce($2, settings.theme), langue = coalesce($3, settings.langue),
         notifications_email = coalesce($4, settings.notifications_email),
         notifications_push = coalesce($5, settings.notifications_push),
         rappels_sessions = coalesce($6, settings.rappels_sessions),
         donnees_mobiles = coalesce($7, settings.donnees_mobiles), updated_at = now()
       returning *`,
      [a.session.user.id, r.theme ?? null, r.langue ?? null, r.notificationsEmail ?? null,
       r.notificationsPush ?? null, r.rappelsSessions ?? null, r.donneesMobiles ?? null]
    );
    return ok({ reglages: row });
  });
}
