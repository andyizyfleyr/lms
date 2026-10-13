import { auth, notFound, forbidden, fail, OPTIONS, handler } from '@/lib/http';
import { pdfParId, accesPdf, genererPdf } from '@/lib/pdf-livre';
import { verifierJeton } from '@/lib/pdfacces';
import { SITE_URL } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** Nom de fichier propre pour le téléchargement. */
const nomFichier = (titre: string) =>
  'CosmetiLab-' + titre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '.pdf';

/** GET /api/p4-pdf/{id}/fichier — le livre lui-même.
 *  Authentification par en-tête (application) ou par jeton signé (nouvel onglet). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const p = await pdfParId(id);
    if (!p || !p.publie) return notFound('Ouvrage');

    const url = new URL(req.url);
    const jeton = url.searchParams.get('t') || '';
    let uid: string | null = null;
    if (jeton) {
      const v = verifierJeton(jeton, id);
      if (!v) return forbidden('Lien de téléchargement expiré : ouvrez la boutique pour le régénérer');
      uid = v.uid;
    } else {
      const a = await auth(req);
      if ('error' in a) return a.error;
      uid = a.session.user.id;
    }

    if (!(await accesPdf(uid, id))) return forbidden('Cet ouvrage n\'est pas (encore) dans votre bibliothèque');

    const proprio = await import('@/lib/db').then(m =>
      m.q1<{ nom: string }>('select nom from users where id = $1', [uid]).then(r => r?.nom || 'Lecteur'));
    const r = await genererPdf(id, proprio, SITE_URL);
    if (!r) return notFound('Ouvrage');
    const fichier = r.fichier;
    return new Response(new Uint8Array(fichier), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + nomFichier(p.titre) + '"',
        'Content-Length': String(fichier.length),
        'Cache-Control': 'private, max-age=60'
      }
    });
  });
}
