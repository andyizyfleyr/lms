import { q, q1, exec } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { note } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/notes — mes notes de cours (?courseId=, ?q=). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') || '';
    const rech = (url.searchParams.get('q') || '').trim();
    const rows = await q(
      `select n.*, c.titre as cours_titre
         from notes n left join courses c on c.id = n.course_id
        where n.user_id = $1 and ($2 = '' or n.course_id = $2)
          and ($3 = '' or n.titre ilike '%' || $3 || '%' or n.contenu ilike '%' || $3 || '%')
        order by n.updated_at desc`,
      [a.session.user.id, courseId, rech]
    );
    return ok({ notes: rows, total: rows.length });
  });
}

/** POST /api/notes — créer une note. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, note);
    if ('error' in parsed) return parsed.error;
    const n = parsed.data;
    const row = await q1(
      `insert into notes (user_id, course_id, lesson_id, titre, contenu)
       values ($1, $2, $3, $4, $5) returning *`,
      [a.session.user.id, n.courseId, n.lessonId, n.titre, n.contenu]
    );
    return ok({ note: row }, 201);
  });
}

/** DELETE /api/notes — tout effacer pour un cours donné (?courseId=). */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const courseId = new URL(req.url).searchParams.get('courseId') || '';
    const n = await exec(
      "delete from notes where user_id = $1 and ($2 = '' or course_id = $2)",
      [a.session.user.id, courseId]
    );
    return ok({ supprimees: n });
  });
}
