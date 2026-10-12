import { q1, exec } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/sessions/{id} — fiche d'une séance. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const session = await sessionFrom(req);
    const row = await q1(
      `select s.*, c.titre as cours_titre, c.prof as cours_prof, coalesce(r.actif, false) as rappel
         from calendar_sessions s
         left join courses c on c.id = s.course_id
         left join session_reminders r on r.session_id = s.id and r.user_id = $1
        where s.id = $2`,
      [session?.user.id ?? null, id]
    );
    if (!row) return notFound('Séance');
    return ok({ seance: row });
  });
}

/** DELETE /api/sessions/{id} — annuler une séance (enseignant / admin). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from calendar_sessions where id = $1 returning id', [id]);
    if (!n) return notFound('Séance');
    return ok({ annulee: true });
  });
}
