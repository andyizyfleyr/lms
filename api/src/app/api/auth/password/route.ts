import { q1, exec } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { changementMotDePasse } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/auth/password — changer son mot de passe (les autres sessions sont fermées). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, changementMotDePasse);
    if ('error' in parsed) return parsed.error;

    const row = await q1<{ password_hash: string }>('select password_hash from users where id = $1', [a.session.user.id]);
    if (!row || !verifyPassword(parsed.data.actuel, row.password_hash))
      return fail('Mot de passe actuel incorrect', 403, 'mot_de_passe_incorrect');

    await exec('update users set password_hash = $2, updated_at = now() where id = $1',
      [a.session.user.id, hashPassword(parsed.data.nouveau)]);
    await exec('delete from auth_tokens where user_id = $1 and token <> $2', [a.session.user.id, a.session.token]);
    return ok({ change: true });
  });
}
