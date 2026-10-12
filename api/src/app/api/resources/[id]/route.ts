import { exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/resources/{id} — modifier une ressource du cours (enseignant / admin). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, z.object({
      titre: z.string().trim().min(2).max(160).optional(),
      typeLabel: z.string().trim().max(40).optional(),
      ico: z.string().trim().max(30).optional(),
      accent: z.string().trim().max(20).optional(),
      url: z.string().trim().max(500).optional()
    }));
    if ('error' in parsed) return parsed.error;
    const r = parsed.data;
    const row = await exec(
      `update resources set titre = coalesce($2, titre), type_label = coalesce($3, type_label),
              ico = coalesce($4, ico), accent = coalesce($5, accent), url = coalesce($6, url)
        where id = $1 returning id`,
      [id, r.titre ?? null, r.typeLabel ?? null, r.ico ?? null, r.accent ?? null, r.url ?? null]
    );
    if (!row) return notFound('Ressource');
    return ok({ modifiee: true });
  });
}

/** DELETE /api/resources/{id} — retirer une ressource (enseignant / admin). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from resources where id = $1 returning id', [id]);
    if (!n) return notFound('Ressource');
    return ok({ retiree: true });
  });
}
