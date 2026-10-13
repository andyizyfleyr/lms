import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const CLES_OK = /^[a-z0-9_-]{1,40}$/;

/** GET /api/mes-donnees/{cle} — une famille de données de mon compte. */
export async function GET(req: Request, { params }: { params: Promise<{ cle: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { cle } = await params;
    if (!CLES_OK.test(cle)) return ok({ valeur: null });
    const row = await q1<{ valeur: unknown; updated_at: string }>(
      `select valeur, updated_at from user_data where user_id = $1 and cle = $2`,
      [a.session.user.id, cle]
    );
    return ok({ valeur: row ? row.valeur : null, updatedAt: row ? row.updated_at : null });
  });
}

/** PUT /api/mes-donnees/{cle} — j'enregistre mes données (remplacement complet). */
export async function PUT(req: Request, { params }: { params: Promise<{ cle: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { cle } = await params;
    if (!CLES_OK.test(cle)) return ok({ valeur: null });
    let valeur: unknown = null;
    try { valeur = await req.json(); } catch { valeur = null; }
    if (valeur === null || valeur === undefined) valeur = {};
    const row = await q1<{ updated_at: string }>(
      `insert into user_data (user_id, cle, valeur, updated_at) values ($1, $2, $3::jsonb, now())
       on conflict (user_id, cle) do update set valeur = excluded.valeur, updated_at = now()
       returning updated_at`,
      [a.session.user.id, cle, JSON.stringify((valeur as { valeur?: unknown }).valeur ?? valeur)]
    );
    return ok({ enregistre: true, updatedAt: row?.updated_at || null });
  });
}

/** DELETE /api/mes-donnees/{cle} — j'efface cette famille de données. */
export async function DELETE(req: Request, { params }: { params: Promise<{ cle: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { cle } = await params;
    if (!CLES_OK.test(cle)) return ok({ supprime: false });
    await q(`delete from user_data where user_id = $1 and cle = $2`, [a.session.user.id, cle]);
    return ok({ supprime: true });
  });
}
