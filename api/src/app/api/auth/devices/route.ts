import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/auth/devices — appareils actuellement connectés à ce compte. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const rows = await q(
      `select token, device, user_agent, ip, created_at, expires_at
         from auth_tokens where user_id = $1 order by created_at desc`,
      [a.session.user.id]
    );
    return ok({
      appareils: rows.map(r => ({ ...r, actuel: r.token === a.session.token, token: undefined })),
      courant: a.session.token
    });
  });
}
