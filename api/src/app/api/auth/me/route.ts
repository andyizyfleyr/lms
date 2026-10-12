import { q1, exec } from '@/lib/db';
import { auth } from '@/lib/http';
import { ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { profil } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/auth/me — profil de l'utilisateur connecté + ses réglages. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const s = await q1('select theme, langue, notifications_email, notifications_push, rappels_sessions, donnees_mobiles from settings where user_id = $1', [a.session.user.id]);
    return ok({ user: a.session.user, settings: s });
  });
}

/** PATCH /api/auth/me — modifier son profil. */
export async function PATCH(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, profil);
    if ('error' in parsed) return parsed.error;
    const p = parsed.data;
    const row = await q1(
      `update users set
         nom = coalesce($2, nom), tel = coalesce($3, tel), ville = coalesce($4, ville),
         promo = coalesce($5, promo), bio = coalesce($6, bio),
         objectif_semaine_h = coalesce($7, objectif_semaine_h), updated_at = now()
       where id = $1
       returning id, email, nom, role, tel, ville, promo, bio, objectif_semaine_h`,
      [a.session.user.id, p.nom ?? null, p.tel ?? null, p.ville ?? null, p.promo ?? null, p.bio ?? null, p.objectifSemaineH ?? null]
    );
    return ok({ user: row });
  });
}

/** DELETE /api/auth/me — supprimer son compte (et toutes ses données). */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    await exec('delete from users where id = $1', [a.session.user.id]);
    return ok({ supprime: true });
  });
}
