import { q, q1 } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { message } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/courses/{id}/messages — fil de discussion du cours (plus récents en dernier). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const url = new URL(req.url);
    const limite = Math.min(Number(url.searchParams.get('limite') || 50), 200);
    const rows = await q(
      `select m.id, m.auteur, m.role, m.contenu, m.created_at, u.id as user_id
         from messages m left join users u on u.id = m.user_id
        where m.course_id = $1 order by m.created_at desc limit $2`,
      [id, limite]
    );
    return ok({ messages: rows.reverse(), total: rows.length });
  });
}

/** POST /api/courses/{id}/messages — publier un message. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, message);
    if ('error' in parsed) return parsed.error;
    const row = await q1(
      `insert into messages (course_id, user_id, auteur, role, contenu)
       values ($1, $2, $3, $4, $5) returning id, auteur, role, contenu, created_at`,
      [id, a.session.user.id, a.session.user.nom, a.session.user.role === 'etudiant' ? 'etudiant' : 'prof', parsed.data.contenu]
    );
    return ok({ message: row }, 201);
  });
}
