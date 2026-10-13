import { q } from '@/lib/db';
import { ok, OPTIONS, handler } from '@/lib/http';
import { estAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-admin/paiements — les encaissements, par jour, par moyen, par ouvrage. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const jours = await q(
      `select date_trunc('day', paid_at)::date jour, count(*)::int commandes, sum(amount)::int total
         from orders where status = 'paid' group by 1 order by 1 desc limit 30`);
    const mois = await q(
      `select to_char(date_trunc('month', paid_at), 'YYYY-MM') mois, count(*)::int commandes, sum(amount)::int total
         from orders where status = 'paid' group by 1 order by 1 desc limit 12`);
    const moyens = await q(
      `select coalesce(nullif(method,''),'inconnu') moyen, count(*)::int commandes, sum(amount)::int total
         from orders where status = 'paid' group by 1 order by 3 desc`);
    const dernieres = await q(
      `select o.id, o.type, o.amount, o.status, o.method, o.nova_reference, o.paid_at, o.created_at, u.nom, u.email
         from orders o left join users u on u.id = o.user_id
        order by o.created_at desc limit 60`);
    const totaux = await q(
      `select coalesce(sum(amount) filter (where status = 'paid'),0)::int encaisse,
              coalesce(sum(amount) filter (where status = 'open'),0)::int encours,
              count(*) filter (where status in ('failed','cancelled','expired'))::int echecs
         from orders`);
    return ok({ jours, mois, moyens, dernieres, totaux: totaux[0] || { encaisse: 0, encours: 0, echecs: 0 } });
  });
}
