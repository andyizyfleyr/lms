import { revokeToken } from '@/lib/auth';
import { ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/auth/logout — invalide le jeton courant. */
export async function POST(req: Request) {
  return handler(async () => {
    const header = req.headers.get('authorization') || '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
    if (token) await revokeToken(token);
    return ok({ deconnecte: true });
  });
}
