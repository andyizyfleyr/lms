import { z } from 'zod';
import { q } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-clients — mon carnet de clients, avec ce qu'ils ont commandé. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const clients = await q(
      `select c.*,
              (select count(*)::int from commandes o where o.client_id = c.id) commandes,
              (select coalesce(sum(o.total),0)::int from commandes o where o.client_id = c.id and o.statut = 'paye') achete,
              (select coalesce(sum(o.total - o.paye),0)::int from commandes o where o.client_id = c.id and o.statut <> 'annule') reste
         from clients c where c.user_id = $1 order by c.nom asc`, [a.session.user.id]);
    return ok({ clients, total: clients.length });
  });
}

const corps = z.object({
  nom: z.string().trim().min(2).max(120),
  tel: z.string().trim().max(40).default(''),
  ville: z.string().trim().max(60).default(''),
  note: z.string().trim().max(400).default('')
});

/** POST /api/p4-clients — ajouter un client. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const row = await q(
      `insert into clients (user_id, nom, tel, ville, note) values ($1, $2, $3, $4, $5) returning *`,
      [a.session.user.id, d.nom, d.tel, d.ville, d.note]);
    return ok({ client: row[0] }, 201);
  });
}
