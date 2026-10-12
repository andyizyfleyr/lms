import { exec, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/notifications/read-all — tout marquer comme lu. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    await exec('update notifications set lu = true where user_id = $1 or user_id is null', [a.session.user.id]);
    const c = await q1<{ non_lues: number }>(
      'select count(*) filter (where not lu)::int as non_lues from notifications where user_id = $1 or user_id is null',
      [a.session.user.id]
    );
    return ok({ nonLues: c?.non_lues ?? 0 });
  });
}
