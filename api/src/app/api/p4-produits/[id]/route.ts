import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, notFound, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { listeInci } from '@/lib/inci';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  nom: z.string().trim().min(2).max(120).optional(),
  categorie: z.string().trim().max(60).optional(),
  prix: z.number().int().min(0).max(500_000).optional(),
  contenance: z.string().trim().max(40).optional(),
  lot: z.string().trim().max(40).optional(),
  pao: z.string().trim().max(10).optional(),
  responsable: z.string().trim().max(160).optional(),
  precautions: z.string().trim().max(400).optional(),
  photo: z.string().trim().max(900_000).optional(),
  publie: z.boolean().optional(),
  ingredients: z.array(z.object({
    nom: z.string().trim().min(1).max(120),
    pourcent: z.number().min(0).max(100).default(0)
  })).max(40).optional()
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const p = await q1('select * from produits where id = $1 and user_id = $2', [id, a.session.user.id]);
    if (!p) return notFound('Produit');
    return ok({ produit: p });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const existe = await q1<{ id: string }>('select id from produits where id = $1 and user_id = $2', [id, a.session.user.id]);
    if (!existe) return notFound('Produit');
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const inci = d.ingredients ? listeInci(d.ingredients).liste : null;
    await exec(
      `update produits set nom = coalesce($2, nom), categorie = coalesce($3, categorie), prix = coalesce($4, prix),
              contenance = coalesce($5, contenance), lot = coalesce($6, lot), pao = coalesce($7, pao),
              responsable = coalesce($8, responsable), precautions = coalesce($9, precautions),
              photo = coalesce($10, photo), publie = coalesce($11, publie),
              ingredients = coalesce($12::jsonb, ingredients), inci = coalesce($13, inci), updated_at = now()
        where id = $1`,
      [id, d.nom ?? null, d.categorie ?? null, d.prix ?? null, d.contenance ?? null, d.lot ?? null,
       d.pao ?? null, d.responsable ?? null, d.precautions ?? null, d.photo ?? null, d.publie ?? null,
       d.ingredients ? JSON.stringify(d.ingredients) : null, inci]);
    const produit = await q1('select * from produits where id = $1', [id]);
    return ok({ produit });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from produits where id = $1 and user_id = $2', [id, a.session.user.id]);
    if (!n) return fail('Produit introuvable ou déjà supprimé', 404, 'introuvable');
    return ok({ supprime: true });
  });
}
