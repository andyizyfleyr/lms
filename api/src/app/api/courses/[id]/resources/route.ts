import { q, q1 } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { ressource } from '@/lib/validation';
import { controleAccesPublic } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/courses/{id}/resources — supports de cours (PDF, notebooks, gabarits…). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const acces = await controleAccesPublic(_req, id);
    if (acces) return acces;
    const rows = await q('select * from resources where course_id = $1 order by ordre', [id]);
    return ok({ ressources: rows, total: rows.length });
  });
}

/** POST /api/courses/{id}/resources — ajouter une ressource (enseignant / admin). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, ressource);
    if ('error' in parsed) return parsed.error;
    const r = parsed.data;
    const suivant = await q1<{ n: number }>('select coalesce(max(ordre), 0) + 1 as n from resources where course_id = $1', [id]);
    const row = await q1(
      `insert into resources (id, course_id, ordre, titre, type_label, ico, accent, url)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [`${id}-r-${Date.now().toString(36)}`, id, suivant?.n ?? 1, r.titre, r.typeLabel, r.ico, r.accent, r.url]
    );
    return ok({ ressource: row }, 201);
  });
}
