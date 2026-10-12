import { q, q1 } from '@/lib/db';
import { auth, ok, notFound, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { depot } from '@/lib/validation';
import { controleAccesRessource } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * POST /api/assignments/{id}/submissions — déposer son travail (texte, lien et/ou fichier).
 * Le fichier est transmis en base64 et stocké dans Neon (limite conseillée : 2 Mo).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const acces = await controleAccesRessource(a.session, 'assignments', id);
    if (acces) return acces;
    const devoir = await q1('select id, points from assignments where id = $1', [id]);
    if (!devoir) return notFound('Devoir');
    const parsed = await parseBody(req, depot);
    if ('error' in parsed) return parsed.error;
    const d = parsed.data;
    if (!d.lien && !d.commentaire && !d.fichierData)
      return fail('Ajoutez un fichier, un lien ou un commentaire avant de déposer', 422, 'depot_vide');
    if (d.fichierData && d.fichierTaille > 2_500_000)
      return fail('Fichier trop volumineux (2,5 Mo maximum)', 413, 'fichier_trop_gros');

    const row = await q1(
      `insert into submissions (assignment_id, user_id, statut, lien, commentaire,
                                fichier_nom, fichier_type, fichier_taille, fichier_data)
       values ($1, $2, 'depose', $3, $4, $5, $6, $7, $8)
       returning id, statut, note, commentaire, lien, fichier_nom, fichier_type, fichier_taille, created_at`,
      [id, a.session.user.id, d.lien, d.commentaire, d.fichierNom, d.fichierType, d.fichierTaille, d.fichierData]
    );
    return ok({ depot: row }, 201);
  });
}

/** GET /api/assignments/{id}/submissions — mes dépôts pour ce devoir. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const acces = await controleAccesRessource(a.session, 'assignments', id);
    if (acces) return acces;
    if (a.session.user.role === 'etudiant') {
      const rows = await q(
        `select id, statut, note, commentaire, lien, fichier_nom, fichier_taille, created_at
           from submissions where assignment_id = $1 and user_id = $2 order by created_at desc`,
        [id, a.session.user.id]
      );
      return ok({ depots: rows, total: rows.length });
    }
    // enseignant : tous les dépôts du devoir
    const rows = await q(
      `select s.id, s.statut, s.note, s.commentaire, s.fichier_nom, s.created_at, u.nom as etudiant, u.email
         from submissions s join users u on u.id = s.user_id
        where s.assignment_id = $1 order by s.created_at desc`, [id]
    );
    return ok({ depots: rows, total: rows.length });
  });
}
