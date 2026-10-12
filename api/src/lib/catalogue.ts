/* ============================================================
   CATALOGUE COMMERCIAL — CosmétiLab
   Tous les prix sont en francs CFA, en nombres entiers (règle NOVA :
   entre 1 000 et 5 000 000 F). C'est LE seul endroit à modifier pour
   changer les tarifs : l'application les lit via /api/paiements/catalogue.
   ============================================================ */

export type Plan = {
  id: string;
  nom: string;
  jours: number;
  montant: number;
  accroche: string;
  avantage?: string;
  recommande?: boolean;
};

/** Abonnements : ils débloquent tous les cours pendant la période payée. */
export const PLANS: Plan[] = [
  { id: 'mensuel', nom: 'Abonnement mensuel', jours: 30, montant: 6000,
    accroche: 'Tous les cours pendant 30 jours', recommande: true },
  { id: 'trimestriel', nom: 'Abonnement 3 mois', jours: 90, montant: 15000,
    accroche: 'Tous les cours pendant 90 jours', avantage: 'Un mois offert' }
];

/** Prix d'un cours à l'unité (définitif : l'accès reste acquis). */
export const PRIX_COURS_DEFAUT = 3500;
export const PRIX_PAR_COURS: Record<string, number> = {
  c1: 3500,   // Savonnerie à froid
  c2: 4500,   // Gel douche
  c3: 4000,   // Crème visage
  c4: 3500,   // Lait corporel
  c5: 3500,   // Baumes & huiles
  c6: 3000    // Étiquetage & réglementation
};

export const DEVISE = 'XOF';
export const DEVISE_LABEL = 'F CFA';

export const prixCours = (id: string): number => PRIX_PAR_COURS[id] ?? PRIX_COURS_DEFAUT;
export const planParId = (id: string): Plan | undefined => PLANS.find(p => p.id === id);

/** Montant minimum accepté par NOVA. */
export const MONTANT_MIN = 1000;
export const MONTANT_MAX = 5_000_000;

/** Texte des conditions affiché dans l'application. */
export const CONDITIONS = [
  'Le montant est encaissé par NOVA Checkout (franc CFA uniquement).',
  'Un cours acheté à l’unité reste accessible à vie sur votre compte.',
  'L’abonnement débloque tous les cours pendant la période payée ; il n’est pas prélevé automatiquement, vous le renouvelez quand vous voulez.',
  'Aucun remboursement automatique : écrivez-nous, chaque cas est traité par l’équipe.'
];
