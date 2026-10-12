import { q1, exec } from '@/lib/db';
import { Session } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { auth, ok, notFound, forbidden, parseBody, OPTIONS, handler } from '@/lib/http';
import { note } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** Vérifie que la note appartient bien à l'utilisateur connecté. */
async function verifier(req: Request, id: string): Promise<{ session: Session } | { erreur: NextResponse }> {
  const a = await auth(req);
  if ('error' in a) return { erreur: a.error };
  const row = await q1<{ user_id: string }>('select user_id from notes where id = $1', [id]);
  if (!row) return { erreur: notFound('Note') };
  if (row.user_id !== a.session.user.id) return { erreur: forbidden('Cette note ne vous appartient pas') };
  return { session: a.session };
}

/** GET /api/notes/{id} — lire une note. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const v = await verifier(req, id);
    if ('erreur' in v) return v.erreur;
    return ok({ note: await q1('select * from notes where id = $1', [id]) });
  });
}

/** PATCH /api/notes/{id} — modifier le titre ou le contenu. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const v = await verifier(req, id);
    if ('erreur' in v) return v.erreur;
    const parsed = await parseBody(req, note.partial());
    if ('error' in parsed) return parsed.error;
    const n = parsed.data;
    const row = await q1(
      `update notes set titre = coalesce($2, titre), contenu = coalesce($3, contenu),
              lesson_id = coalesce($4, lesson_id), updated_at = now()
        where id = $1 returning *`,
      [id, n.titre ?? null, n.contenu ?? null, n.lessonId ?? null]
    );
    return ok({ note: row });
  });
}

/** DELETE /api/notes/{id} — supprimer une note. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const v = await verifier(req, id);
    if ('erreur' in v) return v.erreur;
    await exec('delete from notes where id = $1 returning id', [id]);
    return ok({ supprimee: true });
  });
}
