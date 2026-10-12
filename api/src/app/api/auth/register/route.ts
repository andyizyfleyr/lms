import { q1, exec } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';
import { ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { inscription } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/auth/register — créer un compte étudiant. */
export async function POST(req: Request) {
  return handler(async () => {
    const parsed = await parseBody(req, inscription);
    if ('error' in parsed) return parsed.error;
    const { email, motDePasse, nom, promo, ville } = parsed.data;

    const existe = await q1('select id from users where email = $1', [email]);
    if (existe) return fail('Un compte existe déjà avec cet e-mail', 409, 'email_deja_utilise');

    const user = await q1<{ id: string; email: string; nom: string; role: string }>(
      `insert into users (email, password_hash, nom, promo, ville)
       values ($1, $2, $3, $4, $5) returning id, email, nom, role`,
      [email, hashPassword(motDePasse), nom, promo ?? '', ville ?? '']
    );
    if (!user) return fail('Création impossible', 500, 'erreur_serveur');

    await exec('insert into settings (user_id) values ($1) on conflict do nothing', [user.id]);
    const token = await createToken(user.id, {
      device: req.headers.get('x-device') || 'Appareil',
      userAgent: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for') || ''
    });
    return ok({ token, user }, 201);
  });
}
