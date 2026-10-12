import { createHash } from 'node:crypto';
import { q, exec } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

/** Identifiant public d'un appareil : empreinte courte du jeton (jamais le jeton). */
const idAppareil = (jeton: string) => createHash('sha256').update(jeton).digest('hex').slice(0, 16);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/auth/devices — appareils actuellement connectés à ce compte. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const rows = await q<{ token: string; device: string; user_agent: string; ip: string; created_at: string; expires_at: string }>(
      `select token, device, user_agent, ip, created_at, expires_at
         from auth_tokens where user_id = $1 order by created_at desc`,
      [a.session.user.id]
    );
    return ok({
      appareils: rows.map(r => ({
        id: idAppareil(r.token),
        appareil: r.device,
        navigateur: r.user_agent,
        ip: r.ip,
        depuis: r.created_at,
        expire: r.expires_at,
        actuel: r.token === a.session.token
      })),
      courant: idAppareil(a.session.token)
    });
  });
}

/** DELETE /api/auth/devices — fermer toutes les sessions SAUF celle-ci. */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const n = await exec(
      'delete from auth_tokens where user_id = $1 and token <> $2 returning token',
      [a.session.user.id, a.session.token]
    );
    return ok({ deconnectes: n, reste: 1 });
  });
}
