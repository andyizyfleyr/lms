import { q, q1, exec } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { notification } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/notifications — mes notifications + les annonces générales (?nonLues=1). */
export async function GET(req: Request) {
  return handler(async () => {
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const nonLues = new URL(req.url).searchParams.get('nonLues') === '1';
    const rows = await q(
      `select id, titre, texte, ico, kind, ref_id, lu, created_at
         from notifications
        where (user_id = $1 or user_id is null) and (not $2 or not lu)
        order by created_at desc limit 100`,
      [uid, nonLues]
    );
    const lues = await q1<{ total: number; non_lues: number }>(
      `select count(*)::int as total, count(*) filter (where not lu)::int as non_lues
         from notifications where user_id = $1 or user_id is null`, [uid]
    );
    return ok({ notifications: rows, compteurs: lues });
  });
}

/** POST /api/notifications — publier une notification (enseignant / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, notification);
    if ('error' in parsed) return parsed.error;
    const n = parsed.data;
    const row = await q1(
      `insert into notifications (user_id, titre, texte, ico, kind, ref_id)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [n.toutLeMonde ? null : (n.userId ?? null), n.titre, n.texte, n.ico, n.kind, n.refId]
    );
    return ok({ notification: row }, 201);
  });
}

/** DELETE /api/notifications — vider mes notifications. */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const n = await exec('delete from notifications where user_id = $1', [a.session.user.id]);
    return ok({ supprimees: n });
  });
}
