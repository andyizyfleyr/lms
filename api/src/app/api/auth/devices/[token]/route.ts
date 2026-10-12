import { exec } from '@/lib/db';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** DELETE /api/auth/devices/{token} — déconnecter à distance un appareil. */
export async function DELETE(req: Request, { params }: { params: Promise<{ token: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { token } = await params;
    const n = await exec('delete from auth_tokens where token = $1 and user_id = $2 returning token', [token, a.session.user.id]);
    if (!n) return notFound('Appareil');
    return ok({ deconnecte: true });
  });
}
