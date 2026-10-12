import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/submissions — tous mes dépôts (devoirs déposés, rendus, notés). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const rows = await q(
      `select s.id, s.assignment_id, a.titre, a.points, a.type, c.titre as cours_titre,
              s.statut, s.note, s.commentaire, s.fichier_nom, s.fichier_taille, s.lien, s.created_at
         from submissions s
         join assignments a on a.id = s.assignment_id
         join courses c on c.id = a.course_id
        where s.user_id = $1 order by s.created_at desc`,
      [a.session.user.id]
    );
    return ok({ depots: rows, total: rows.length });
  });
}
