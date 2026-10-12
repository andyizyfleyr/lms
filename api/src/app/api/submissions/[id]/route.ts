import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, forbidden, parseBody, OPTIONS, handler } from '@/lib/http';
import { noteDepot } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/submissions/{id} — détail d'un dépôt (avec le fichier en base64). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const row = await q1('select * from submissions where id = $1', [id]);
    if (!row) return notFound('Dépôt');
    if (row.user_id !== a.session.user.id && a.session.user.role === 'etudiant')
      return forbidden('Ce dépôt ne vous appartient pas');
    return ok({ depot: row });
  });
}

/** PATCH /api/submissions/{id} — noter / commenter un dépôt (enseignant, admin). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, noteDepot);
    if ('error' in parsed) return parsed.error;
    const n = parsed.data;
    const row = await q1(
      `update submissions set note = $2, statut = $3, commentaire = $4, updated_at = now()
        where id = $1 returning id, statut, note, commentaire`,
      [id, n.note, n.statut, n.commentaire]
    );
    if (!row) return notFound('Dépôt');
    return ok({ depot: row });
  });
}

/** DELETE /api/submissions/{id} — retirer son dépôt (tant qu'il n'est pas noté). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const row = await q1('select user_id, note from submissions where id = $1', [id]);
    if (!row) return notFound('Dépôt');
    if (row.user_id !== a.session.user.id && a.session.user.role === 'etudiant') return forbidden('Ce dépôt ne vous appartient pas');
    if (row.note !== null && a.session.user.role === 'etudiant') return forbidden('Un dépôt déjà noté ne peut plus être retiré');
    await exec('delete from submissions where id = $1', [id]);
    return ok({ retire: true });
  });
}
