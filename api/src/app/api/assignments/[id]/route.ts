import { q, q1, exec } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/assignments/{id} — consignes + mon dépôt + pièces jointes. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const session = await sessionFrom(req);
    const devoir = await q1(
      `select a.*, c.titre as cours_titre, c.prof, c.accent
         from assignments a join courses c on c.id = a.course_id where a.id = $1`, [id]
    );
    if (!devoir) return notFound('Devoir');
    const mesDepots = session ? await q(
      `select id, statut, note, commentaire, lien, fichier_nom, fichier_type, fichier_taille, created_at
         from submissions where assignment_id = $1 and user_id = $2 order by created_at desc`,
      [id, session.user.id]
    ) : [];
    return ok({ devoir, mesDepots, dernierDepot: mesDepots[0] ?? null });
  });
}

/** DELETE /api/assignments/{id} — supprimer un devoir (enseignant / admin). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from assignments where id = $1 returning id', [id]);
    if (!n) return notFound('Devoir');
    return ok({ supprime: true });
  });
}
