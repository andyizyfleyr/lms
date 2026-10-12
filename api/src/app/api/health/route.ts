import { q1 } from '@/lib/db';
import { ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/health — état de l'API et de la base Neon. */
export async function GET() {
  return handler(async () => {
    const t0 = Date.now();
    try {
      const rows = await q1<{ tables: number; cours: number; users: number }>(
        `select
           (select count(*)::int from information_schema.tables where table_schema = 'public') as tables,
           (select count(*)::int from courses) as cours,
           (select count(*)::int from users) as users`
      );
      return ok({
        statut: 'ok', base: 'Neon',
        ms: Date.now() - t0,
        tables: rows?.tables ?? 0, cours: rows?.cours ?? 0, comptes: rows?.users ?? 0,
        version: '1.0.0', date: new Date().toISOString()
      });
    } catch (e) {
      return fail('Base injoignable : ' + (e instanceof Error ? e.message : ''), 503, 'base_indisponible');
    }
  });
}
