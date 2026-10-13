import { z } from 'zod';
import { q } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-commandes — mes commandes et devis, avec le nom du client. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const commandes = await q(
      `select o.*, c.nom client_nom, c.tel client_tel, c.ville client_ville
         from commandes o left join clients c on c.id = o.client_id
        where o.user_id = $1 order by o.created_at desc limit 200`, [a.session.user.id]);
    const totaux = await q(
      `select
         coalesce(sum(total) filter (where statut = 'paye'), 0)::int encaisse,
         coalesce(sum(total - paye) filter (where statut <> 'annule'), 0)::int du,
         count(*) filter (where statut = 'devis')::int devis,
         count(*) filter (where statut <> 'annule')::int actives
       from commandes where user_id = $1`, [a.session.user.id]);
    return ok({ commandes, totaux: totaux[0] || { encaisse: 0, du: 0, devis: 0, actives: 0 } });
  });
}

const ligne = z.object({
  designation: z.string().trim().min(1).max(120),
  quantite: z.number().int().min(1).max(9999).default(1),
  prix: z.number().int().min(0).max(500_000).default(0)
});

const corps = z.object({
  clientId: z.string().uuid().optional().or(z.literal('')),
  lignes: z.array(ligne).min(1).max(40),
  statut: z.enum(['devis', 'envoye', 'paye', 'annule']).default('devis'),
  echeance: z.string().trim().max(20).default(''),
  note: z.string().trim().max(600).default(''),
  paye: z.number().int().min(0).max(5_000_000).default(0)
});

/** POST /api/p4-commandes — créer un devis ou une commande. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const total = d.lignes.reduce((n, l) => n + l.quantite * l.prix, 0);
    const row = await q(
      `insert into commandes (user_id, client_id, lignes, statut, total, echeance, note, paye)
       values ($1, nullif($2, '')::uuid, $3::jsonb, $4, $5, nullif($6, '')::date, $7, $8) returning *`,
      [a.session.user.id, d.clientId || '', JSON.stringify(d.lignes), d.statut, total, d.echeance, d.note, d.paye]);
    return ok({ commande: row[0], total }, 201);
  });
}
