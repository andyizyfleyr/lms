import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/mes-donnees — toutes mes données V3 (recettes, lots, révision, objectifs…). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const rows = await q<{ cle: string; valeur: unknown; updated_at: string }>(
      `select cle, valeur, updated_at from user_data where user_id = $1`, [a.session.user.id]
    );
    const donnees: Record<string, unknown> = {};
    for (const r of rows) donnees[r.cle] = r.valeur;
    return ok({ donnees, total: rows.length });
  });
}
