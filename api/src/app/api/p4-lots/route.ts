import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, notFound, fail, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** GET /api/p4-lots — mes lots de fabrication (traçabilité). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const lots = await q(
      `select l.*, p.nom produit_nom, p.slug produit_slug
         from lots l left join produits p on p.id = l.produit_id
        where l.user_id = $1 order by l.created_at desc limit 100`, [a.session.user.id]);
    const produits = await q('select id, nom from produits where user_id = $1 order by nom', [a.session.user.id]);
    const stats = await q1(
      `select count(*)::int total,
              count(*) filter (where publie)::int publies,
              count(*) filter (where statut = 'conforme')::int conformes,
              count(*) filter (where statut = 'a_surveiller')::int aSurveiller
         from lots where user_id = $1`, [a.session.user.id]);
    return ok({ lots, produits, stats });
  });
}

const controles = z.object({
  ph: z.number().min(0).max(14).nullable().default(null),
  poids: z.number().min(0).max(100_000).nullable().default(null),
  aspect: z.string().trim().max(60).default(''),
  odeur: z.string().trim().max(60).default(''),
  couleur: z.string().trim().max(60).default(''),
  conforme: z.boolean().default(true)
});

const corps = z.object({
  produitId: z.string().uuid().nullable().default(null),
  numero: z.string().trim().min(1).max(40),
  recette: z.string().trim().max(120).default(''),
  quantite: z.number().min(0).max(100_000).default(0),
  dateFab: z.string().trim().max(20).default(''),
  observation: z.string().trim().max(600).default(''),
  publie: z.boolean().default(false),
  prochainControle: z.string().trim().max(20).default(''),
  controles: controles.default({ ph: null, poids: null, aspect: '', odeur: '', couleur: '', conforme: true })
});

/** POST /api/p4-lots — ouvrir un lot : qui a fabriqué quoi, quand, avec quels contrôles. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const statut = d.controles.conforme ? 'conforme' : 'a_surveiller';
    const s = slug(d.numero + '-' + (a.session.user.nom || 'artisan')) + '-' + Date.now().toString(36).slice(-4);
    const row = await q1(
      `insert into lots (user_id, produit_id, numero, recette, quantite, date_fab, controles, observation, slug, publie, statut, prochain_controle)
       values ($1, $2, $3, $4, $5, nullif($6,'')::date, $7::jsonb, $8, $9, $10, $11, nullif($12,'')::date)
       returning *`,
      [a.session.user.id, d.produitId, d.numero, d.recette, d.quantite, d.dateFab,
       JSON.stringify(d.controles), d.observation, s, d.publie, statut, d.prochainControle]);
    return ok({ lot: row, statut }, 201);
  });
}

const maj = z.object({
  id: z.string().uuid(),
  publie: z.boolean().optional(),
  statut: z.enum(['conforme', 'a_surveiller', 'retire']).optional(),
  observation: z.string().trim().max(600).optional(),
  prochainControle: z.string().trim().max(20).optional()
});

/** PATCH /api/p4-lots — publier la fiche du lot, la retirer, ou changer son état. */
export async function PATCH(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, maj);
    if ('error' in p) return p.error;
    const d = p.data;
    const l = await q1('select id from lots where id = $1 and user_id = $2', [d.id, a.session.user.id]);
    if (!l) return notFound('Lot');
    await exec(
      `update lots set publie = coalesce($2, publie), statut = coalesce($3, statut),
              observation = coalesce($4, observation),
              prochain_controle = coalesce(nullif($5,'')::date, prochain_controle) where id = $1`,
      [d.id, d.publie ?? null, d.statut ?? null, d.observation ?? null, d.prochainControle ?? '']);
    return ok({ lot: await q1('select * from lots where id = $1', [d.id]) });
  });
}

/** DELETE /api/p4-lots?id=… */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return fail('Précisez le lot');
    const n = await exec('delete from lots where id = $1 and user_id = $2', [id, a.session.user.id]);
    return ok({ supprime: !!n });
  });
}
