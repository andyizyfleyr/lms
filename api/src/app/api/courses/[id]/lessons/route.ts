import { q, q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { lecon } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/courses/{id}/lessons — leçons du cours (avec l'état « terminée »). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const session = await sessionFrom(req);
    const rows = await q(
      `select l.*, coalesce(lp.done, false) as done
         from lessons l left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = $1
        where l.course_id = $2 order by l.module_ordre, l.ordre`,
      [session?.user.id ?? null, id]
    );
    return ok({ lecons: rows, total: rows.length });
  });
}

/** POST /api/courses/{id}/lessons — ajouter une leçon (enseignant / admin). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, lecon);
    if ('error' in parsed) return parsed.error;
    const l = parsed.data;
    const slug = l.titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    const lid = `${id}-${slug}-${Date.now().toString(36).slice(-4)}`;
    const row = await q1(
      `insert into lessons (id, course_id, module_titre, module_ordre, ordre, titre, duree_label, kind, video_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [lid, id, l.moduleTitre, l.moduleOrdre, l.ordre, l.titre, l.dureeLabel, l.kind, l.videoId]
    );
    return ok({ lecon: row }, 201);
  });
}
