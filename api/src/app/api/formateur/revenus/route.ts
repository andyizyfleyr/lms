import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type ParCours = {
  id: string; titre: string; ventes: number; revenu: number; apprenants: number;
  termines: number; prix: number | null;
};
type Risque = { user_id: string; nom: string; email: string; course_id: string; cours: string;
                progress: number; derniere: string | null; jours: number | null };

/**
 * GET /api/formateur/revenus — tableau de bord du formateur :
 * ventes et chiffre d'affaires par cours, abonnés actifs et apprenants à risque
 * (sans activité depuis 7 jours ou plus).
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const admin = a.session.user.role === 'admin';
    const mesCours = await q<{ id: string; titre: string; prix: number | null }>(
      `select id, titre, prix from courses where $1 = 'admin' or prof = $2 or cree_par = $3 order by titre`,
      [a.session.user.role, a.session.user.nom, uid]
    ).catch(async () => q<{ id: string; titre: string; prix: number | null }>(
      `select id, titre, prix from courses order by titre`));

    const parCours = await q<ParCours>(
      `select c.id, c.titre, c.prix,
              (select count(*)::int from orders o where o.course_id = c.id and o.status = 'paid') as ventes,
              (select coalesce(sum(o.amount), 0)::int from orders o where o.course_id = c.id and o.status = 'paid') as revenu,
              (select count(*)::int from enrollments e where e.course_id = c.id) as apprenants,
              (select count(*)::int from enrollments e where e.course_id = c.id and e.progress >= 100) as termines
         from courses c
        where $1 = 'admin' or c.prof = $2 or c.id = any($3::text[])
        order by revenu desc, c.titre`,
      [a.session.user.role, a.session.user.nom, mesCours.map(c => c.id)]
    );

    const abonnes = await q<{ n: number }>(
      `select count(*)::int as n from subscriptions where statut = 'actif' and current_period_end > now()`
    ).catch(async () => [{ n: 0 }]);

    const risque = await q<Risque>(
      `select u.id as user_id, u.nom, u.email, e.course_id, c.titre as cours, e.progress,
              (select max(lp.updated_at) from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = e.course_id and lp.user_id = u.id) as derniere,
              extract(day from now() - (select max(lp.updated_at) from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = e.course_id and lp.user_id = u.id))::int as jours
         from enrollments e
         join users u on u.id = e.user_id
         join courses c on c.id = e.course_id
        where e.progress < 100 and ($1 = 'admin' or c.prof = $2 or c.id = any($3::text[]))
          and coalesce((select max(lp.updated_at) from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = e.course_id and lp.user_id = u.id), e.updated_at) < now() - interval '7 days'
        order by derniere nulls first
        limit 25`,
      [a.session.user.role, a.session.user.nom, mesCours.map(c => c.id)]
    );

    const totalRevenu = parCours.reduce((s, c) => s + (c.revenu || 0), 0);
    const totalVentes = parCours.reduce((s, c) => s + (c.ventes || 0), 0);
    const totalApprenants = parCours.reduce((s, c) => s + (c.apprenants || 0), 0);

    const derniers = await q(
      `select o.created_at, o.amount, o.status, o.description, c.titre as cours,
              coalesce(u.nom, '') as apprenant
         from orders o
         left join courses c on c.id = o.course_id
         left join users u on u.id = o.user_id
        where o.status = 'paid' and ($1 = 'admin' or c.prof = $2 or c.id = any($3::text[]))
        order by o.paid_at desc nulls last limit 15`,
      [a.session.user.role, a.session.user.nom, mesCours.map(c => c.id)]
    ).catch(async () => []);

    return ok({
      cours: parCours, totaux: { revenu: totalRevenu, ventes: totalVentes, apprenants: totalApprenants,
      abonnes: (abonnes[0] && abonnes[0].n) || 0 },
      aRisque: risque, dernieresVentes: derniers
    });
  });
}
