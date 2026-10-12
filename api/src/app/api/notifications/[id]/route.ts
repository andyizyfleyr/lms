import { q1, exec } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, notFound, unauthorized, parseBody, OPTIONS, handler } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/notifications/{id} — marquer comme lu / non lu, ou modifier (enseignant). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const session = await sessionFrom(req);
    if (!session) return unauthorized();
    const { id } = await params;
    const parsed = await parseBody(req, z.object({
      lu: z.boolean().optional(),
      titre: z.string().trim().min(3).max(160).optional(),
      texte: z.string().trim().max(500).optional()
    }));
    if ('error' in parsed) return parsed.error;
    const p = parsed.data;
    if ((p.titre || p.texte) && session.user.role === 'etudiant') return notFound('Notification'); // seuls les profs modifient le contenu
    const row = await q1(
      `update notifications set lu = coalesce($2, lu), titre = coalesce($3, titre), texte = coalesce($4, texte)
        where id = $1 and (user_id = $5 or user_id is null) returning *`,
      [id, p.lu ?? null, p.titre ?? null, p.texte ?? null, session.user.id]
    );
    if (!row) return notFound('Notification');
    return ok({ notification: row });
  });
}

/** DELETE /api/notifications/{id} — supprimer (annonce générale : réservé aux profs). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const row = await q1<{ user_id: string | null }>('select user_id from notifications where id = $1', [id]);
    if (!row) return notFound('Notification');
    if (row.user_id === null && a.session.user.role === 'etudiant') return notFound('Notification');
    await exec('delete from notifications where id = $1 returning id', [id]);
    return ok({ supprimee: true });
  });
}
