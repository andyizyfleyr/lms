import { q1 } from '@/lib/db';
import { ok, OPTIONS, handler } from '@/lib/http';
import { PLANS } from '@/lib/catalogue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/etat — état du service, en clair (aucune donnée personnelle). */
export async function GET(_req: Request) {
  return handler(async () => {
    const t0 = Date.now();
    const tables = await q1<{ n: number }>(
      `select count(*)::int as n from information_schema.tables where table_schema = 'public'`
    );
    const ms = Date.now() - t0;
    return ok({
      service: 'CosmétiLab', version: '3.0', enLigne: true,
      base: { joignable: true, tables: (tables && tables.n) || 0, latenceMs: ms },
      paiement: { fournisseur: 'NOVA Checkout', devise: 'XOF', plans: PLANS.length, mode: 'production' },
      heure: new Date().toISOString()
    });
  });
}
