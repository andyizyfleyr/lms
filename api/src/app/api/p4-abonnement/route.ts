import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { accesDe, joursRestants, SITE_URL, novaConfigure } from '@/lib/paiement';
import { PLANS, planParId } from '@/lib/catalogue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-abonnement — où j'en suis, ce qu'il me reste, et mes relances. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const acces = await accesDe(a.session.user.id);
    const historique = await q(
      `select id, plan_id, amount, status, paid_at, expires_at, description, created_at
         from orders where user_id = $1 and type = 'abonnement' order by created_at desc limit 12`, [a.session.user.id]);
    const cours = await q('select id, titre, prix from courses where statut = $1 order by titre', ['publie'])
      .catch(() => q('select id, titre, prix from courses order by titre'));
    const prixCoursTotal = cours.reduce((n, c) => n + (Number((c as { prix?: number }).prix) || 0), 0);
    const abonnement = acces.abonnement;
    const plan = planParId(abonnement.planId || 'mensuel') || PLANS[0];
    const restants = joursRestants(abonnement.fin);
    const joursEconomises = abonnement.actif ? Math.round(plan.montant / 30) : 0;
    const relances = abonnement.actif && restants <= 7
      ? [{ quand: restants <= 0 ? 'aujourd\'hui' : ('dans ' + restants + ' jour(s)'),
           texte: 'Votre abonnement se termine ' + (restants <= 0 ? 'aujourd\'hui' : ('dans ' + restants + ' jour(s)')) +
             '. Renouvelez pour ne pas perdre l\'accès aux cours.' }]
      : [];
    const palier = abonnement.renouvellements >= 6 ? 15 : abonnement.renouvellements >= 3 ? 10 : 0;
    return ok({
      abonnement, plans: PLANS, plan, restants, relances, historique, palier,
      prixCoursTotal, joursEconomises,
      paiement: { configure: novaConfigure(), site: SITE_URL },
      economie: prixCoursTotal > 0 ? Math.max(0, prixCoursTotal - plan.montant) : 0,
      avantages: [
        { ico: 'school', titre: 'Tous les cours ouverts', texte: 'Les six cours, leurs vidéos, leurs quiz et leurs fiches, sans en acheter un seul.' },
        { ico: 'book', titre: 'Les livres PDF en réduction', texte: 'La remise du pack (deux ouvrages ou plus) s\'ajoute à votre abonnement.' },
        { ico: 'chat', titre: 'L\'entraide et les ateliers', texte: 'Poser vos questions, rejoindre un atelier près de chez vous, montrer vos réalisations.' },
        { ico: 'chart', titre: 'Les outils de production', texte: 'Saponification, formulation, coût de revient, fiches de lot, étiquettes conformes.' }
      ]
    });
  });
}
