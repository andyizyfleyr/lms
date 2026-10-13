import crypto from 'node:crypto';
import { q1, exec } from './db';

/* ---------- mots de passe : scrypt (sans dépendance native) ---------- */
const N = 16384, R = 8, P = 1, KEYLEN = 64;

export function hashPassword(pwd: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pwd, salt, KEYLEN, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export function verifyPassword(pwd: string, stored: string): boolean {
  try {
    const [algo, n, r, p, saltB64, keyB64] = stored.split('$');
    if (algo !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(keyB64, 'base64');
    const got = crypto.scryptSync(pwd, salt, expected.length, { N: +n, r: +r, p: +p });
    return crypto.timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

/* ---------- jetons de session ---------- */
export type User = {
  id: string;
  email: string;
  nom: string;
  role: 'etudiant' | 'enseignant' | 'admin';
  tel: string;
  ville: string;
  promo: string;
  bio: string;
  objectif_semaine_h: number;
  /** modérateur : peut masquer un contenu signalé sans être administrateur */
  moderateur?: boolean;
  /** compte bloqué : la session ne vaut plus rien */
  bloque?: boolean;
};

/** Peut modérer le contenu (admin, formateur de l'équipe, ou modérateur nommé). */
export const peutModerer = (u: User | null | undefined): boolean =>
  !!u && (u.role === 'admin' || u.role === 'enseignant' || u.moderateur === true);

export type Session = { token: string; user: User };

const JOURS = 30;

export async function createToken(userId: string, meta: { device?: string; userAgent?: string; ip?: string } = {}): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + JOURS * 86400_000);
  await exec(
    `insert into auth_tokens (token, user_id, device, user_agent, ip, expires_at)
     values ($1, $2, $3, $4, $5, $6)`,
    [token, userId, meta.device ?? '', meta.userAgent ?? '', meta.ip ?? '', expires.toISOString()]
  );
  return token;
}

export async function sessionFrom(req: Request): Promise<Session | null> {
  const header = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const row = await q1<User & { token: string }>(
    `select u.id, u.email, u.nom, u.role, u.tel, u.ville, u.promo, u.bio, u.objectif_semaine_h,
            u.moderateur, u.bloque, t.token
       from auth_tokens t join users u on u.id = t.user_id
      where t.token = $1 and t.expires_at > now()`,
    [token]
  );
  if (!row) return null;
  /* un compte bloqué par l'administration perd immédiatement ses sessions */
  if (row.bloque) {
    await exec('delete from auth_tokens where token = $1', [token]);
    return null;
  }
  const { token: t, ...user } = row;
  return { token: t, user: user as User };
}

export async function revokeToken(token: string): Promise<void> {
  await exec('delete from auth_tokens where token = $1', [token]);
}
