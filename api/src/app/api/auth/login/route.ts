import { q1, exec } from '@/lib/db';
import { verifyPassword, createToken, User } from '@/lib/auth';
import { ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { connexion } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/auth/login — connexion, renvoie un jeton de session (30 jours). */
export async function POST(req: Request) {
  return handler(async () => {
    const parsed = await parseBody(req, connexion);
    if ('error' in parsed) return parsed.error;
    const { email, motDePasse } = parsed.data;

    const row = await q1<User & { password_hash: string }>(
      `select id, email, nom, role, tel, ville, promo, bio, objectif_semaine_h, password_hash
         from users where email = $1`, [email]
    );
    if (!row || !verifyPassword(motDePasse, row.password_hash))
      return fail('E-mail ou mot de passe incorrect', 401, 'identifiants_invalides');

    const { password_hash: _ignore, ...user } = row;
    const token = await createToken(user.id, {
      device: req.headers.get('x-device') || 'Appareil',
      userAgent: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for') || ''
    });
    const s = await q1('select theme, langue from settings where user_id = $1', [user.id]);
    return ok({ token, user, settings: s });
  });
}
