import { q1 } from '@/lib/db';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/sessions/{id}/reminder — activer un rappel (?minutes=15). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const exist = await q1('select id, titre from calendar_sessions where id = $1', [id]);
    if (!exist) return notFound('Séance');
    const minutes = Math.min(Math.max(Number(new URL(req.url).searchParams.get('minutes') || 15), 1), 1440);
    const row = await q1(
      `insert into session_reminders (user_id, session_id, actif, minutes_avant) values ($1, $2, true, $3)
       on conflict (user_id, session_id) do update set actif = true, minutes_avant = $3
       returning *`,
      [a.session.user.id, id, minutes]
    );
    return ok({ rappel: row }, 201);
  });
}

/** DELETE /api/sessions/{id}/reminder — désactiver le rappel. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    await q1('delete from session_reminders where user_id = $1 and session_id = $2', [a.session.user.id, id]);
    return ok({ rappel: null });
  });
}
