import { q, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/lessons/{id} — renommer / redéplacer une leçon (enseignant / admin). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const schema = z.object({
      titre: z.string().trim().min(2).max(160).optional(),
      moduleTitre: z.string().trim().min(2).max(120).optional(),
      moduleOrdre: z.number().int().min(1).max(99).optional(),
      ordre: z.number().int().min(1).max(99).optional(),
      dureeLabel: z.string().trim().max(30).optional(),
      kind: z.enum(['lecture', 'video', 'quiz', 'exercice']).optional(),
      videoId: z.string().trim().max(40).optional()
    });
    const parsed = await parseBody(req, schema);
    if ('error' in parsed) return parsed.error;
    const l = parsed.data;
    const row = await q(
      `update lessons set titre = coalesce($2, titre), module_titre = coalesce($3, module_titre),
              module_ordre = coalesce($4, module_ordre), ordre = coalesce($5, ordre),
              duree_label = coalesce($6, duree_label), kind = coalesce($7, kind),
              video_id = coalesce($8, video_id)
        where id = $1 returning *`,
      [id, l.titre ?? null, l.moduleTitre ?? null, l.moduleOrdre ?? null, l.ordre ?? null,
       l.dureeLabel ?? null, l.kind ?? null, l.videoId ?? null]
    );
    if (!row.length) return notFound('Leçon');
    return ok({ lecon: row[0] });
  });
}

/** DELETE /api/lessons/{id} — retirer une leçon du cours (enseignant / admin). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from lessons where id = $1 returning id', [id]);
    if (!n) return notFound('Leçon');
    return ok({ retiree: true });
  });
}
