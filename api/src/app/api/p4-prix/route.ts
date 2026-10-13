import { z } from 'zod';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/* ------------------------------------------------------------
   Analyse de rentabilité — le calcul tourne côté serveur pour que
   /outils/prix donne toujours le même résultat, même hors ligne,
   et que les conseils soient écrits au même endroit.
   ------------------------------------------------------------ */

const matiere = z.object({
  nom: z.string().trim().min(1).max(80),
  quantite: z.number().min(0).max(1_000_000).default(0),
  prixUnite: z.number().min(0).max(10_000_000).default(0),
  unite: z.string().trim().max(20).default('g')
});

const corps = z.object({
  recette: z.string().trim().max(120).default('Ma recette'),
  lot: z.number().min(0.1).max(1000).default(1),                 // nombre d'unités produites
  contenance: z.string().trim().max(40).default(''),
  matieres: z.array(matiere).max(40).default([]),
  emballage: z.number().min(0).max(500_000).default(0),          // par unité
  etiquettes: z.number().min(0).max(500_000).default(0),         // par unité
  mainOeuvreMinutes: z.number().min(0).max(1440).default(0),
  tauxHoraire: z.number().min(0).max(200_000).default(1000),     // F par heure
  fraisFixes: z.number().min(0).max(10_000_000).default(0),      // gaz, électricité, transport du lot
  margeVoulue: z.number().min(0).max(95).default(35),            // marge sur prix de vente (%)
  commissionVente: z.number().min(0).max(60).default(0),         // % pris par le revendeur
  prixAffiche: z.number().min(0).max(500_000).default(0)         // prix déjà pratiqué, pour comparaison
});

/** POST /api/p4-prix — coût de revient, prix conseillé, marge et conseils. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;

    const lignes = d.matieres.map(m => ({
      nom: m.nom, quantite: m.quantite, unite: m.unite, prixUnite: m.prixUnite,
      cout: Math.round(m.quantite * m.prixUnite * 100) / 100,
      part: 0
    }));
    const matiereTotal = lignes.reduce((n, l) => n + l.cout, 0);
    const parUnite = d.lot > 0 ? matiereTotal / d.lot : 0;
    lignes.forEach(l => { l.part = matiereTotal > 0 ? Math.round((l.cout / matiereTotal) * 1000) / 10 : 0; });

    const emballage = d.emballage + d.etiquettes;
    const mainOeuvre = (d.mainOeuvreMinutes / 60) * d.tauxHoraire;
    const fixesParUnite = d.lot > 0 ? d.fraisFixes / d.lot : 0;
    const coutUnite = parUnite + emballage + mainOeuvre + fixesParUnite;

    /* prix conseillé : marge voulue sur le prix de vente, puis commission du revendeur */
    const margeVoulue = Math.min(d.margeVoulue, 90);
    const prixDirect = margeVoulue >= 100 ? coutUnite : coutUnite / (1 - margeVoulue / 100);
    const commission = Math.min(d.commissionVente, 55);
    const prixRevendeur = commission > 0 ? prixDirect / (1 - commission / 100) : prixDirect;
    const arrondi = (n: number) => {
      if (n < 500) return Math.ceil(n / 25) * 25;
      if (n < 2000) return Math.ceil(n / 50) * 50;
      if (n < 5000) return Math.ceil(n / 100) * 100;
      return Math.ceil(n / 250) * 250;
    };
    const prix = arrondi(prixDirect);
    const prixRevendeurArrondi = arrondi(prixRevendeur);

    const totalLot = Math.round(coutUnite * d.lot);
    const gainUnite = prix - coutUnite;
    const gainLot = Math.round(gainUnite * d.lot);
    const margePourcent = prix > 0 ? Math.round(((prix - coutUnite) / prix) * 1000) / 10 : 0;
    const margeAffiche = d.prixAffiche > 0 ? Math.round(d.prixAffiche - coutUnite) : null;

    /* combien d'unités pour rentrer dans ses frais si le prix affiché est plus bas */
    const conseils: string[] = [];
    if (matiereTotal > 0) {
      const grande = lignes.slice().sort((x, y) => y.cout - x.cout)[0];
      conseils.push('La matière la plus chère de cette recette est « ' + grande.nom + ' » : ' + grande.part +
        ' % du coût matière. Acheter ce seul ingrédient en plus grande quantité est le levier le plus rapide.');
    }
    if (mainOeuvre > coutUnite * 0.5 && matiereTotal > 0) {
      conseils.push('La main-d\'œuvre pèse plus de la moitié du coût unitaire : travaillez par lots plus grands pour la répartir.');
    }
    if (d.fraisFixes > 0 && fixesParUnite > parUnite) {
      conseils.push('Les frais fixes (gaz, transport, électricité) dépassent la matière première : regroupez les fabrications sur une même journée.');
    }
    if (margePourcent < 20 && prix > 0) {
      conseils.push('Votre marge est inférieure à 20 % : la moindre hausse du prix des matières passe en perte. Visez 30 à 40 % sur un produit artisanal.');
    }
    if (d.prixAffiche > 0 && d.prixAffiche < prix) {
      conseils.push('Votre prix actuel (' + d.prixAffiche + ' F) est en dessous du prix conseillé (' + prix + ' F) : vous perdez ' +
        Math.round(prix - d.prixAffiche) + ' F par unité vendue, soit ' + Math.round((prix - d.prixAffiche) * d.lot) + ' F sur ce lot.');
    }
    if (commission > 0) {
      conseils.push('En passant par un revendeur qui prend ' + commission + ' %, vendez à ' + prixRevendeurArrondi +
        ' F et non à ' + prix + ' F, sinon la commission sort de votre marge.');
    }
    if (d.lot < 5) {
      conseils.push('Un lot de moins de 5 unités coûte cher en gaz et en temps : le même travail en produit 10 divise le coût fixe par deux.');
    }
    if (!d.contenance) conseils.push('Précisez la contenance : c\'est la base du prix au litre, qui rend vos produits comparables entre eux.');

    const etiquette = {
      coutMatiere: Math.round(parUnite),
      emballage, mainOeuvre: Math.round(mainOeuvre), fixes: Math.round(fixesParUnite),
      coutUnite: Math.round(coutUnite), prixConseille: prix, prixRevendeur: prixRevendeurArrondi,
      gainUnite: Math.round(gainUnite), gainLot, margePourcent, margeAffiche, totalLot
    };
    const guide = [
      { titre: '1. Compter la matière première', texte: 'Additionnez le prix réellement payé pour chaque ingrédient, puis ramenez-le à la quantité utilisée. Une recette de savon de 500 g en 10 pains coûte rarement plus de 200 F de matière par pain.' },
      { titre: '2. Ajouter ce qu\'on oublie', texte: 'Flacon, étiquette, gaz, électricité, transport, et votre temps. Un produit vendu sans compter la main-d\'œuvre fait travailler gratuitement.' },
      { titre: '3. Fixer la marge', texte: 'Sur un cosmétique artisanal, visez 30 à 40 % de marge sur le prix de vente : c\'est ce qui permet de racheter la matière au prix du jour, sans augmenter le prix toutes les semaines.' },
      { titre: '4. Arrondir vers le haut', texte: 'Un prix rond et lisible (500 F, 1 500 F, 2 500 F) se vend mieux et se retient. Arrondissez toujours au-dessus du prix calculé.' },
      { titre: '5. Prévoir le revendeur', texte: 'Si quelqu\'un revend pour vous, il prend 20 à 30 %. Calculez le prix revendeur séparément, sinon la commission sort de votre poche.' },
      { titre: '6. Vérifier tous les trois mois', texte: 'Le prix des huiles et du beurre de karité bouge. Refaites ce calcul à chaque changement de fournisseur ou de prix.' }
    ];
    return ok({ lignes, etiquette, conseils, guide, prixAuLitre: null });
  });
}
