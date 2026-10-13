import { z } from 'zod';
import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const commande = await q1(
      `select o.*, c.nom client_nom, c.tel client_tel, c.ville client_ville, c.note client_note, u.nom vendeur, u.ville vendeur_ville, u.tel vendeur_tel
         from commandes o left join clients c on c.id = o.client_id join users u on u.id = o.user_id
        where o.id = $1 and o.user_id = $2`, [id, a.session.user.id]);
    if (!commande) return notFound('Commande');
    return ok({ commande });
  });
}

const corps = z.object({
  statut: z.enum(['devis', 'envoye', 'paye', 'annule']).optional(),
  paye: z.number().int().min(0).max(5_000_000).optional(),
  moyen: z.enum(['mtn', 'moov', 'espece', 'autre', '']).optional(),
  note: z.string().trim().max(600).optional(),
  echeance: z.string().trim().max(20).optional(),
  relance: z.boolean().optional()
});

/** PATCH /api/p4-commandes/{id} — statut, encaissement, relance du client. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const c = await q1<{ id: string }>('select id from commandes where id = $1 and user_id = $2', [id, a.session.user.id]);
    if (!c) return notFound('Commande');
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    if (d.relance) {
      /* relance douce : une notification interne, aucun envoi externe */
      await exec(
        `insert into journal_securite (user_id, type, detail) values ($1, 'relance', $2)`,
        [a.session.user.id, 'relance préparée pour la commande ' + id]);
    }
    await exec(
      `update commandes set statut = coalesce($2, statut), paye = coalesce($3, paye), moyen = coalesce($4, moyen),
              note = coalesce($5, note), echeance = coalesce(nullif($6, '')::date, echeance), updated_at = now()
        where id = $1`,
      [id, d.statut ?? null, d.paye ?? null, d.moyen ?? null, d.note ?? null, d.echeance ?? null]);
    return ok({ commande: await q1('select * from commandes where id = $1', [id]) });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from commandes where id = $1 and user_id = $2', [id, a.session.user.id]);
    return ok({ supprime: !!n });
  });
}
