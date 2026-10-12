import { q, q1, exec } from '@/lib/db';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { telechargement } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/downloads — mes téléchargements hors-ligne (+ espace utilisé). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const rows = await q(
      `select d.*, c.titre as cours_titre, c.accent
         from downloads d left join courses c on c.id = d.course_id
        where d.user_id = $1 order by d.created_at desc`,
      [a.session.user.id]
    );
    const espace = await q1<{ total: number; termines: number }>(
      `select count(*)::int as total, count(*) filter (where etat = 'ok')::int as termines
         from downloads where user_id = $1`, [a.session.user.id]
    );
    return ok({
      telechargements: rows, compteurs: espace,
      quotaMo: 4096,
      utiliseMo: rows.reduce((s, r) => s + (parseInt(String(r.taille_label).replace(/\D/g, ''), 10) || 0), 0),
      disponibiliteHorsLigne: (espace?.total ?? 0) === 0
    });
  });
}

/** POST /api/downloads — mettre une ressource hors-ligne. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, telechargement);
    if ('error' in parsed) return parsed.error;
    const t = parsed.data;
    const row = await q1(
      `insert into downloads (user_id, course_id, resource_id, titre, taille_label, etat, progres)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [a.session.user.id, t.courseId ?? null, t.resourceId ?? null, t.titre, t.tailleLabel, t.etat, t.progres]
    );
    return ok({ telechargement: row }, 201);
  });
}

/** DELETE /api/downloads — tout retirer du stockage hors-ligne. */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const n = await exec('delete from downloads where user_id = $1', [a.session.user.id]);
    return ok({ retires: n });
  });
}
