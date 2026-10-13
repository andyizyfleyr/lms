import { z } from 'zod';
import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  nom: z.string().trim().min(2).max(120).optional(),
  tel: z.string().trim().max(40).optional(),
  ville: z.string().trim().max(60).optional(),
  note: z.string().trim().max(400).optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const c = await q1('select id from clients where id = $1 and user_id = $2', [id, a.session.user.id]);
    if (!c) return notFound('Client');
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    await exec(
      `update clients set nom = coalesce($2, nom), tel = coalesce($3, tel), ville = coalesce($4, ville),
              note = coalesce($5, note), updated_at = now() where id = $1`,
      [id, d.nom ?? null, d.tel ?? null, d.ville ?? null, d.note ?? null]);
    return ok({ client: await q1('select * from clients where id = $1', [id]) });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    /* les commandes du client restent dans le carnet : on détache seulement le lien */
    await exec('update commandes set client_id = null where client_id = $1 and user_id = $2', [id, a.session.user.id]);
    const n = await exec('delete from clients where id = $1 and user_id = $2', [id, a.session.user.id]);
    return ok({ supprime: !!n });
  });
}
