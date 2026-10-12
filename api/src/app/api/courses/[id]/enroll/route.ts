import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/courses/{id}/enroll — s'inscrire au cours (ou le remettre en cours de suivi). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const c = await q1('select id from courses where id = $1', [id]);
    if (!c) return notFound('Cours');
    const row = await q1(
      `insert into enrollments (user_id, course_id, statut)
       values ($1, $2, 'encours')
       on conflict (user_id, course_id) do update set statut = 'encours', updated_at = now()
       returning *`,
      [a.session.user.id, id]
    );
    return ok({ inscription: row }, 201);
  });
}

/** DELETE /api/courses/{id}/enroll — quitter le cours. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    await exec('delete from enrollments where user_id = $1 and course_id = $2', [a.session.user.id, id]);
    return ok({ desinscrit: true });
  });
}
