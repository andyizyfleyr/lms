/* ============================================================
   RÉCOMPENSES ET PALIERS
   ------------------------------------------------------------
   Les points d'entraide, d'assiduité et de pratique ne servent
   à rien s'ils ne s'échangent pas. Ce fichier tient la liste des
   échanges possibles et les paliers de parrainage — un seul
   endroit à changer pour ajuster les prix.
   ============================================================ */

export type Recompense = {
  id: string;
  nom: string;
  texte: string;
  points: number;
  ico: string;
  genre: 'bon' | 'contenu' | 'service';
  /** pour les bons : montant en F, utilisable une fois sur un cours ou un PDF */
  valeur?: number;
  jours?: number;
};

export const RECOMPENSES: Recompense[] = [
  { id: 'bon-500', nom: 'Bon de 500 F', texte: 'Un code à utiliser sur un cours ou un PDF, valable 90 jours.', points: 150, ico: 'card', genre: 'bon', valeur: 500, jours: 90 },
  { id: 'bon-1000', nom: 'Bon de 1 000 F', texte: 'Un code de 1 000 F sur un cours, un PDF ou un abonnement.', points: 280, ico: 'card', genre: 'bon', valeur: 1000, jours: 90 },
  { id: 'bon-2500', nom: 'Bon de 2 500 F', texte: 'Un cours complet offert, ou la moitié d\'un recueil.', points: 650, ico: 'trophy', genre: 'bon', valeur: 2500, jours: 120 },
  { id: 'fiches-imprimees', nom: 'Pack de fiches imprimées', texte: 'Les fiches de lot, de coût de revient et de contrôle qualité, prêtes à imprimer.', points: 120, ico: 'task', genre: 'contenu' },
  { id: 'atelier-echantillon', nom: 'Échantillon de matière', texte: 'Un échantillon de beurre de karité ou d\'huile, à retirer lors d\'un atelier.', points: 300, ico: 'drop', genre: 'service' },
  { id: 'echange-formateur', nom: '30 minutes avec un formateur', texte: 'Un échange en tête-à-tête pour revoir une formule, un prix ou une étiquette.', points: 700, ico: 'chat', genre: 'service' },
  { id: 'attestation-cadre', nom: 'Attestation encadrée', texte: 'Votre attestation imprimée et mise sous cadre, signée par le formateur.', points: 450, ico: 'medal', genre: 'service' },
  { id: 'mise-en-avant', nom: 'Ma réalisation en avant', texte: 'Votre photo passe en tête de la galerie pendant une semaine.', points: 200, ico: 'star', genre: 'service' }
];

export const recompenseParId = (id: string) => RECOMPENSES.find(r => r.id === id) || null;

export type Palier = { palier: number; filleuls: number; nom: string; avantage: string; bonus: number };

/** Paliers de parrainage : du premier filleul actif aux cinq. */
export const PALIERS: Palier[] = [
  { palier: 1, filleuls: 1, nom: 'Premier pas', avantage: 'Un bon de 500 F offert', bonus: 500 },
  { palier: 2, filleuls: 3, nom: 'Entraide', avantage: '10 % à vie sur les ateliers et les kits', bonus: 1500 },
  { palier: 3, filleuls: 5, nom: 'Ambassadeur', avantage: 'Un abonnement de 30 jours offert + votre réalisation en galerie', bonus: 4000 }
];

/* Guide de rentabilité — le texte qui accompagne /outils/prix */
export const GUIDE_PRIX = [
  { titre: 'Compter avant de vendre', texte: 'Un produit vendu à perte fait perdre de l\'argent à chaque vente. Le calcul prend dix minutes et sert toute l\'année.' },
  { titre: 'Les cinq postes à compter', texte: 'Matière première, emballage et étiquette, gaz et électricité, transport, et votre temps. Oublier le temps est l\'erreur la plus fréquente.' },
  { titre: 'La marge, pas le coefficient', texte: 'Doubler le coût de revient ne donne pas 100 % de marge mais 50 %. La marge se calcule sur le prix de vente : (prix − coût) ÷ prix.' },
  { titre: 'Le prix du revendeur', texte: 'Si une boutique prend 25 %, votre prix de vente doit être divisé par 0,75 pour que la commission ne sorte pas de votre poche.' },
  { titre: 'Réviser tous les trois mois', texte: 'Les prix des huiles bougent. Refaire le calcul à chaque changement de fournisseur évite de travailler à perte sans s\'en apercevoir.' }
];
