import { z } from 'zod';
import { q, q1 } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { listePdf, accesPdfListe } from '@/lib/pdf-livre';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-pdf — la boutique : catalogue public, accès du compte s'il est connecté. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    const uid = 'error' in a ? null : a.session.user.id;
    const docs = await listePdf(uid);
    const possedes = uid ? await accesPdfListe(uid) : [];
    return ok({
      ouvrages: docs.map(d => ({
        id: d.id, titre: d.titre, sousTitre: d.sous_titre, description: d.description,
        genre: d.genre, source: d.source, niveau: d.niv, pages: d.pages, prix: d.prix,
        gratuit: d.gratuit, accent: d.accent, ico: d.ico, couverture: d.couverture, ordre: d.ordre
      })),
      acces: possedes,
      connecte: !!uid,
      remise: 10
    });
  });
}

const creation = z.object({
  id: z.string().trim().min(3).max(40).regex(/^[a-z0-9-]+$/),
  titre: z.string().trim().min(3).max(120),
  sousTitre: z.string().trim().max(160).default(''),
  description: z.string().trim().max(1200).default(''),
  source: z.string().trim().max(40).default(''),
  genre: z.enum(['cours', 'recueil', 'guide']).default('cours'),
  prix: z.number().int().min(0).max(500_000).default(2500),
  accent: z.string().trim().max(20).default('purple'),
  ico: z.string().trim().max(20).default('book'),
  niveau: z.string().trim().max(30).default('Débutant')
});

/** POST /api/p4-pdf — un formateur transforme son cours en ouvrage (l'admin publie). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const p = await parseBody(req, creation);
    if ('error' in p) return p.error;
    const d = p.data;

    if (d.source) {
      const cours = await q1<{ id: string; prof: string }>('select id, prof from courses where id = $1', [d.source]);
      if (!cours) return fail('Cours introuvable', 404, 'introuvable');
      if (a.session.user.role !== 'admin' && cours.prof !== a.session.user.nom) {
        return fail('Vous ne pouvez créer un ouvrage que depuis vos propres cours', 403, 'interdit');
      }
    }
    const admin = a.session.user.role === 'admin';
    const ordre = await q1<{ n: number }>('select coalesce(max(ordre), 0) + 1 as n from pdfs');
    const row = await q1(
      `insert into pdfs (id, titre, sous_titre, description, source, genre, prix, accent, ico, niv, ordre, publie, pages)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 24)
       on conflict (id) do update set titre = excluded.titre, sous_titre = excluded.sous_titre,
         description = excluded.description, prix = excluded.prix, accent = excluded.accent,
         ico = excluded.ico, niv = excluded.niv
       returning id, titre, prix, publie`,
      [d.id, d.titre, d.sousTitre, d.description, d.source, d.genre, d.prix, d.accent, d.ico, d.niveau,
       ordre?.n || 1, admin]
    );
    return ok({ ouvrage: row, publie: admin, note: admin ? 'Ouvrage publié.' : 'Ouvrage créé : il sera visible après validation de l\'administrateur.' }, 201);
  });
}
