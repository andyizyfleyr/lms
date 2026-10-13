import { z } from 'zod';
import { q } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-commun/ateliers — ateliers, rencontres et prêts de matériel. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    const uid = 'error' in a ? null : a.session.user.id;
    const url = new URL(req.url);
    const ville = (url.searchParams.get('ville') || '').trim().slice(0, 40);
    const ateliers = await q(
      `select t.id, t.ville, t.lieu, t.titre, t.texte, t.quand, t.places, t.contact, t.ferme, t.created_at,
              coalesce(u.nom, 'Membre') auteur_nom, (t.auteur = $1) as mien,
              (select count(*)::int from atelier_participants p where p.atelier = t.id) participants,
              exists (select 1 from atelier_participants p where p.atelier = t.id and p.user_id = $1) inscrit
         from ateliers t left join users u on u.id = t.auteur
        where not t.masque and ($2 = '' or t.ville ilike '%' || $2 || '%')
        order by (t.quand is null), t.quand asc, t.created_at desc limit 80`, [uid, ville]);
    const villes = await q(`select ville, count(*)::int n from ateliers where not masque and ville <> '' group by 1 order by 2 desc limit 20`);
    return ok({ ateliers, villes, connecte: !!uid });
  });
}

const creation = z.object({
  titre: z.string().trim().min(4).max(140),
  texte: z.string().trim().max(2000).default(''),
  ville: z.string().trim().max(60).default(''),
  lieu: z.string().trim().max(120).default(''),
  quand: z.string().trim().max(40).default(''),
  places: z.number().int().min(1).max(200).default(6),
  contact: z.string().trim().max(120).default('')
});

/** POST /api/p4-commun/ateliers — proposer un atelier ou une rencontre. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, creation);
    if ('error' in p) return p.error;
    const d = p.data;
    const quand = d.quand ? new Date(d.quand) : null;
    const row = await q(
      `insert into ateliers (auteur, ville, lieu, titre, texte, quand, places, contact)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id, titre, ville, quand`,
      [a.session.user.id, d.ville, d.lieu, d.titre, d.texte,
       quand && !isNaN(quand.getTime()) ? quand.toISOString() : null, d.places, d.contact]);
    return ok({ atelier: row[0] }, 201);
  });
}
