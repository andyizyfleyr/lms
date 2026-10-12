import { q } from '@/lib/db';
import { ok, OPTIONS, handler } from '@/lib/http';
import { PLANS, DEVISE, DEVISE_LABEL, CONDITIONS, PRIX_COURS_DEFAUT, prixCours } from '@/lib/catalogue';
import { novaConfigure } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/paiements/catalogue — tarifs publics (cours à l'unité + abonnements). */
export async function GET() {
  return handler(async () => {
    const cours = await q<{ id: string; titre: string; categorie: string }>(
      'select id, titre, categorie from courses order by id'
    );
    return ok({
      devise: DEVISE,
      deviseLabel: DEVISE_LABEL,
      paiementActif: novaConfigure(),
      prixCoursDefaut: PRIX_COURS_DEFAUT,
      plans: PLANS,
      cours: cours.map(c => ({ id: c.id, titre: c.titre, categorie: c.categorie, prix: prixCours(c.id) })),
      conditions: CONDITIONS
    });
  });
}
