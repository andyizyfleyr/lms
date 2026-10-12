import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { majTelechargement } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/downloads/{id} — pause, reprise, progression. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, majTelechargement);
    if ('error' in parsed) return parsed.error;
    const m = parsed.data;
    const row = await q1(
      `update downloads set etat = coalesce($3, etat), progres = coalesce($4, progres), updated_at = now()
        where id = $1 and user_id = $2 returning *`,
      [id, a.session.user.id, m.etat ?? null, m.progres ?? null]
    );
    if (!row) return notFound('Téléchargement');
    return ok({ telechargement: row });
  });
}

/** DELETE /api/downloads/{id} — retirer du hors-ligne. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from downloads where id = $1 and user_id = $2 returning id', [id, a.session.user.id]);
    if (!n) return notFound('Téléchargement');
    return ok({ retire: true });
  });
}
