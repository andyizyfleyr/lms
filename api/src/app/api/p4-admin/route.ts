import { q } from '@/lib/db';
import { ok, OPTIONS, handler } from '@/lib/http';
import { estAdmin } from '@/lib/admin';
import { SITE_URL } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-admin — les chiffres clés de la plateforme. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;

    const [users] = await q<{ n: number }>(`select count(*)::int n from users`);
    const [actifs] = await q<{ n: number }>(`select count(distinct user_id)::int n from auth_tokens where expires_at > now()`);
    const [cours] = await q<{ n: number; publies: number }>(`select count(*)::int n, count(*) filter (where publie)::int publies from courses`);
    const [ventes] = await q<{ n: number; total: number; jour: number; mois: number }>(
      `select count(*)::int n, coalesce(sum(amount),0)::int total,
              coalesce(sum(amount) filter (where paid_at >= current_date),0)::int jour,
              coalesce(sum(amount) filter (where paid_at >= date_trunc('month', now())),0)::int mois
         from orders where status = 'paid'`);
    const [ouverts] = await q<{ n: number }>(`select count(*)::int n from signalements where etat = 'nouveau'`);
    const [ouvrages] = await q<{ n: number; publiés: number }>(`select count(*)::int n, count(*) filter (where publie)::int "publiés" from pdfs`);
    const [messages] = await q<{ n: number }>(`select count(*)::int n from forum_reponses`);
    const dernieres = await q(`select type, amount, description, method, paid_at from orders where status = 'paid' order by paid_at desc limit 8`);
    const inscriptions = await q(`select nom, email, role, created_at from users order by created_at desc limit 8`);
    const signalements = await q(`select id, cible, cible_id, motif, etat, created_at from signalements order by created_at desc limit 8`);
    const actions = await q(`select genre, detail, created_at from activite order by created_at desc limit 6`).catch(() => []);
    const parMoyen = await q<{ method: string; n: number; total: number }>(
      `select coalesce(nullif(method,''),'inconnu') method, count(*)::int n, sum(amount)::int total
         from orders where status = 'paid' group by 1 order by total desc`);
    const tables = await q<{ n: number }>(`select count(*)::int n from information_schema.tables where table_schema = 'public'`);
    const nbTables = tables[0]?.n ?? 0;

    return ok({
      chiffres: {
        comptes: users.n, comptesActifs: actifs.n, cours: cours.n, coursPublies: cours.publies,
        ventes: ventes.n, encaisse: ventes.total, encaisseJour: ventes.jour, encaisseMois: ventes.mois,
        signalementsOuverts: ouverts.n, ouvrages: ouvrages.n, ouvragesPublies: ouvrages['publiés'], messagesForum: messages.n,
        tables: nbTables
      },
      parMoyen, dernieres, inscriptions, signalements, actions, site: SITE_URL
    });
  });
}
