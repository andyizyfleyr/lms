import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/submissions — les dépôts de devoirs.
 *  • un apprenant ne voit que les siens ;
 *  • un formateur (ou un administrateur) voit toutes les copies, avec le
 *    nom de l'apprenant, pour pouvoir les corriger — c'est la matière de
 *    l'écran « Corrections » de l'application.
 * Filtres : ?cours=c1  ?statut=depose  ?limite=50
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const url = new URL(req.url);
    const cours = url.searchParams.get('cours') || '';
    const statut = url.searchParams.get('statut') || '';
    const limite = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limite') || '100', 10) || 100));
    const encadrant = a.session.user.role !== 'etudiant';

    const rows = await q(
      `select s.id, s.assignment_id, s.user_id, a.titre, a.points, a.type,
              c.id as course_id, c.titre as cours_titre,
              s.statut, s.note, s.commentaire, s.fichier_nom, s.fichier_taille, s.lien, s.created_at,
              u.nom as eleve_nom, u.email as eleve_email, u.role as eleve_role
         from submissions s
         join assignments a on a.id = s.assignment_id
         join courses c on c.id = a.course_id
         join users u on u.id = s.user_id
        where ($1::boolean or s.user_id = $2)
          and ($3 = '' or c.id = $3)
          and ($4 = '' or s.statut = $4)
        order by s.created_at desc
        limit $5`,
      [encadrant, a.session.user.id, cours, statut, limite]
    );
    return ok({ depots: rows, total: rows.length, encadrant });
  });
}
