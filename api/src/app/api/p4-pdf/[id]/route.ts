import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';
import { pdfParId, accesPdf } from '@/lib/pdf-livre';
import { q } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-pdf/{id} — fiche d'un ouvrage : présentation, sommaire (titres seulement), accès.
 *  Aucun texte du livre n'est renvoyé ici : le contenu ne s'ouvre qu'après l'achat. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const p = await pdfParId(id);
    if (!p || !p.publie) return notFound('Ouvrage');
    const a = await auth(req);
    const uid = 'error' in a ? null : a.session.user.id;
    const possede = uid ? await accesPdf(uid, id) : p.gratuit;
    const cours = p.source
      ? await q<{ id: string; titre: string; prof: string; description: string }>(
          'select id, titre, prof, description from courses where id = $1', [p.source])
      : [];
    return ok({
      ouvrage: {
        id: p.id, titre: p.titre, sousTitre: p.sous_titre, description: p.description,
        sommaire: p.sommaire || [], pages: p.pages, prix: p.prix, gratuit: p.gratuit,
        accent: p.accent, ico: p.ico, niveau: p.niv, genre: p.genre, source: p.source,
        couverture: p.couverture
      },
      cours: cours[0] || null,
      possede,
      connecte: !!uid
    });
  });
}
