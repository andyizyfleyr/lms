import { createHash } from 'node:crypto';
import { q, exec } from '@/lib/db';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const idAppareil = (jeton: string) => createHash('sha256').update(jeton).digest('hex').slice(0, 16);

/** DELETE /api/auth/devices/{id} — déconnecter à distance un appareil.
    Accepte l'identifiant public (empreinte) renvoyé par GET /api/auth/devices
    ou, pour les appels directs, le jeton lui-même. */
export async function DELETE(req: Request, { params }: { params: Promise<{ token: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { token } = await params;
    const jetons = await q<{ token: string }>('select token from auth_tokens where user_id = $1', [a.session.user.id]);
    const cible = jetons.find(j => j.token === token || idAppareil(j.token) === token);
    if (!cible) return notFound('Appareil');
    await exec('delete from auth_tokens where token = $1 and user_id = $2', [cible.token, a.session.user.id]);
    return ok({ deconnecte: true });
  });
}
