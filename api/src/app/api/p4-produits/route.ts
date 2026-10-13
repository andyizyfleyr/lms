import { z } from 'zod';
import { q } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { listeInci } from '@/lib/inci';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

/** GET /api/p4-produits — mes produits (fiche, étiquette, fiche publique). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const produits = await q(
      `select p.*, (select count(*)::int from commandes c where c.user_id = p.user_id
                      and c.lignes::text ilike '%' || p.id || '%') commandes
         from produits p where p.user_id = $1 order by p.created_at desc`, [a.session.user.id]);
    return ok({ produits, total: produits.length });
  });
}

const corps = z.object({
  nom: z.string().trim().min(2).max(120),
  recette: z.string().trim().max(120).default(''),
  categorie: z.string().trim().max(60).default(''),
  prix: z.number().int().min(0).max(500_000).default(0),
  contenance: z.string().trim().max(40).default(''),
  lot: z.string().trim().max(40).default(''),
  pao: z.string().trim().max(10).default('6M'),
  responsable: z.string().trim().max(160).default(''),
  precautions: z.string().trim().max(400).default('Usage externe. Éviter le contact avec les yeux.'),
  photo: z.string().trim().max(900_000).default(''),
  publie: z.boolean().default(false),
  ingredients: z.array(z.object({
    nom: z.string().trim().min(1).max(120),
    pourcent: z.number().min(0).max(100).default(0)
  })).max(40).default([])
});

/** POST /api/p4-produits — je crée un produit vendable (étiquette calculée). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const r = listeInci(d.ingredients);
    const s = slug(d.nom) + '-' + Date.now().toString(36).slice(-4);
    const row = await q(
      `insert into produits (user_id, recette, nom, categorie, prix, contenance, lot, pao, responsable,
                             ingredients, inci, precautions, photo, slug, publie)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15)
       returning *`,
      [a.session.user.id, d.recette, d.nom, d.categorie, d.prix, d.contenance, d.lot, d.pao,
       d.responsable || a.session.user.nom, JSON.stringify(d.ingredients), r.liste, d.precautions,
       d.photo, s, d.publie]);
    return ok({ produit: row[0], allergenes: r.allergenes, inconnus: r.inconnus }, 201);
  });
}
