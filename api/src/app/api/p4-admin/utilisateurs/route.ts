import { q } from '@/lib/db';
import { ok, OPTIONS, handler } from '@/lib/http';
import { estAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-admin/utilisateurs — les comptes, avec ce qu'ils ont produit. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const url = new URL(req.url);
    const recherche = (url.searchParams.get('q') || '').trim().slice(0, 60);
    const comptes = await q(
      `select u.id, u.nom, u.email, u.role, u.ville, u.tel, u.moderateur, u.bloque, u.created_at,
              (select count(*)::int from orders o where o.user_id = u.id and o.status = 'paid') achats,
              (select coalesce(sum(o.amount),0)::int from orders o where o.user_id = u.id and o.status = 'paid') total,
              (select count(*)::int from lesson_progress lp where lp.user_id = u.id and lp.done) lecons,
              (select count(*)::int from auth_tokens t where t.user_id = u.id and t.expires_at > now()) sessions,
              (select coalesce(p.total,0) from points p where p.user_id = u.id) points
         from users u
        where ($1 = '' or u.nom ilike '%' || $1 || '%' or u.email ilike '%' || $1 || '%')
        order by u.created_at desc limit 200`,
      [recherche]
    );
    return ok({ comptes, total: comptes.length });
  });
}
