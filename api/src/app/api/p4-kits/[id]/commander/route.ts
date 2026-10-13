import { z } from 'zod';
import { q1 } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  quantite: z.number().int().min(1).max(50).default(1),
  clientId: z.string().uuid().nullable().default(null),
  statut: z.enum(['devis', 'envoye', 'paye']).default('devis')
});

/** POST /api/p4-kits/{id}/commander — commander un kit : la commande part dans
 *  le carnet avec ses lignes, prête à être payée ou transformée en devis. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const kit = await q1<{ nom: string; contenu: Array<{ nom: string; quantite: number; prixUnite: number }> }>(
      'select nom, contenu from kits where id = $1', [id]);
    if (!kit) return notFound('Kit');
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const qte = p.data.quantite;
    const lignes = (kit.contenu || []).map(l => ({
      designation: l.nom + (qte > 1 ? ' (kit x' + qte + ')' : ''),
      quantite: 1,
      prix: Math.round(l.quantite * l.prixUnite * qte)
    }));
    const total = lignes.reduce((n, l) => n + l.prix, 0);
    const row = await q1(
      `insert into commandes (user_id, client_id, lignes, statut, total, note)
       values ($1, $2, $3::jsonb, $4, $5, $6) returning *`,
      [a.session.user.id, p.data.clientId, JSON.stringify(lignes), p.data.statut, total,
       'Kit « ' + kit.nom + ' » — commande passée depuis la boutique des kits.']);
    return ok({ commande: row, total, lignes }, 201);
  });
}
