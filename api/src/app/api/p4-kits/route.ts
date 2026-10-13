import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** Le coût d'un kit : somme des lignes, plus la marge de revente conseillée. */
function chiffrer(contenu: Array<{ nom: string; quantite: number; prixUnite: number; unite?: string }>) {
  const lignes = (contenu || []).map(l => ({ ...l, cout: Math.round(l.quantite * l.prixUnite) }));
  const cout = lignes.reduce((n, l) => n + l.cout, 0);
  const prixConseille = Math.ceil((cout / 0.7) / 250) * 250;      // 30 % de marge, arrondi
  const prixRevendeur = Math.ceil((cout / 0.55) / 250) * 250;     // 45 % pour qui revend
  return { lignes, cout, prixConseille, prixRevendeur, gain: prixConseille - cout };
}

export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const kits = await q('select * from kits order by created_at desc limit 40');
    const enrichis = kits.map(k => {
      const contenu = ((k as { contenu?: unknown }).contenu || []) as Array<{ nom: string; quantite: number; prixUnite: number }>;
      return { ...k, ...chiffrer(Array.isArray(contenu) ? contenu : []), lignes: undefined };
    });
    return ok({ kits: enrichis, prof: a.session.user.role !== 'etudiant' });
  });
}

const ligne = z.object({
  nom: z.string().trim().min(1).max(80),
  quantite: z.number().min(0).max(100_000).default(1),
  prixUnite: z.number().min(0).max(5_000_000).default(0),
  unite: z.string().trim().max(20).default('')
});

const corps = z.object({
  nom: z.string().trim().min(3).max(120),
  description: z.string().trim().max(600).default(''),
  contenu: z.array(ligne).min(1).max(40)
});

/** POST /api/p4-kits — composer un kit de démarrage (matériel et matières premières). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    if (a.session.user.role === 'etudiant') return ok({ kits: [], prof: false, erreur: 'Composer un kit est réservé aux formateurs' });
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const row = await q1(
      `insert into kits (nom, description, contenu, cree_par) values ($1, $2, $3::jsonb, $4) returning *`,
      [d.nom, d.description, JSON.stringify(d.contenu), a.session.user.id]);
    return ok({ kit: { ...row, ...chiffrer(d.contenu) } }, 201);
  });
}

/** PATCH /api/p4-kits?id=&nom=&description=… — ajuster un kit existant. */
export async function PATCH(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    if (a.session.user.role === 'etudiant') return ok({ modifie: false });
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';
    if (!id) return ok({ modifie: false, message: 'Précisez le kit' });
    const corps = await req.json().catch(() => ({})) as { nom?: string; description?: string; contenu?: unknown };
    await exec(
      `update kits set nom = coalesce($2, nom), description = coalesce($3, description),
              contenu = coalesce($4::jsonb, contenu) where id = $1`,
      [id, corps.nom ?? null, corps.description ?? null, corps.contenu ? JSON.stringify(corps.contenu) : null]);
    return ok({ kit: await q1('select * from kits where id = $1', [id]) });
  });
}
