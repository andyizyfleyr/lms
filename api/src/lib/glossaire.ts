/* ============================================================
   GLOSSAIRE — français seulement
   Les mots du métier, expliqués simplement, avec ce qu'il faut
   retenir en pratique. Aucune traduction inventée : les termes
   anglais courants (cold process, trace) restent donnés comme
   ils se disent dans les ateliers.
   ============================================================ */

export type Terme = { mot: string; famille: string; definition: string; pratique?: string; voir?: string[] };

export const GLOSSAIRE: Terme[] = [
  { mot: 'Saponification', famille: 'Savon', definition: 'Réaction entre un corps gras et la soude : elle fabrique du savon et de la glycérine.', pratique: 'C\'est la base du savon à froid : huile + soude + eau, rien d\'autre.', voir: ['À froid (cold process)', 'Surgras'] },
  { mot: 'Saponification à froid', famille: 'Savon', definition: 'Méthode où l\'on mélange la soude et les huiles à température ambiante, sans chauffer la pâte.', pratique: 'Le savon garde la glycérine naturelle : il est plus doux, mais mûrit 4 à 6 semaines.' },
  { mot: 'Saponification à chaud', famille: 'Savon', definition: 'La pâte est chauffée jusqu\'à ce que la réaction soit terminée dans la marmite.', pratique: 'Utilisable le jour même, mais demande un suivi de température.' },
  { mot: 'Trace', famille: 'Savon', definition: 'Moment où la pâte épaissit et laisse une trace quand on la laisse retomber de la spatule.', pratique: 'Trace légère pour couler dans un moule, trace épaisse pour un savon marbré.' },
  { mot: 'Surgras', famille: 'Savon', definition: 'Part d\'huile volontairement laissée non saponifiée pour adoucir le savon.', pratique: '5 % est un bon départ ; au-delà de 10 %, le savon rancit plus vite.' },
  { mot: 'Soude caustique', famille: 'Sécurité', definition: 'Base forte, vendue en pastilles, indispensable au savon à froid.', pratique: 'Toujours verser la soude dans l\'eau, jamais l\'eau sur la soude. Gants et lunettes obligatoires.' },
  { mot: 'Eau de saponification', famille: 'Savon', definition: 'Quantité d\'eau dans laquelle la soude est dissoute.', pratique: 'Une réduction de 5 % raccourcit le séchage et donne un savon plus dur.' },
  { mot: 'Ins (indice de dureté)', famille: 'Savon', definition: 'Valeur qui indique la dureté du savon fini d\'après le mélange d\'huiles.', pratique: 'Viser un INS entre 130 et 160 pour un savon qui tient dans le temps.' },
  { mot: 'Cure', famille: 'Savon', definition: 'Période de repos du savon après démoulage.', pratique: '4 semaines minimum : l\'eau s\'évapore, le pH baisse, le savon durcit.' },
  { mot: 'pH', famille: 'Qualité', definition: 'Mesure de l\'acidité ou de la basicité, sur une échelle de 0 à 14.', pratique: 'Un savon fini se situe entre 8 et 10. En dessous de 7,5, quelque chose ne va pas.' },
  { mot: 'Émulsion', famille: 'Crèmes', definition: 'Mélange stable de deux liquides qui ne se mélangent pas : l\'eau et l\'huile.', pratique: 'Sans émulsifiant, l\'huile remonte en quelques minutes.' },
  { mot: 'Émulsifiant', famille: 'Crèmes', definition: 'Molécule qui maintient l\'eau et l\'huile ensemble dans une crème.', pratique: 'Il se choisit selon la texture voulue : fluide, onctueuse ou riche.' },
  { mot: 'Phase aqueuse', famille: 'Crèmes', definition: 'Partie de la formule composée d\'eau, d\'hydrolat ou de gel.', pratique: 'Elle se chauffe séparément de la phase huileuse, puis on les réunit.' },
  { mot: 'Phase huileuse', famille: 'Crèmes', definition: 'Partie de la formule composée d\'huiles, de beurres et de cires.', pratique: 'Les deux phases doivent être à la même température (autour de 70 °C) au mélange.' },
  { mot: 'Tensioactif', famille: 'Gels et shampooings', definition: 'Molécule qui permet à l\'eau de décoller les salissures et le gras.', pratique: 'Un base lavante douce (coco-glucoside) mousse moins mais respecte la peau.' },
  { mot: 'Coco-glucoside', famille: 'Gels et shampooings', definition: 'Tensioactif doux d\'origine végétale, tiré de la noix de coco et du sucre.', pratique: 'À privilégier pour un gel douche pour enfant ou une peau sensible.' },
  { mot: 'Bétaïne de coco', famille: 'Gels et shampooings', definition: 'Co-tensioactif qui épaissit et adoucit un gel lavant.', pratique: 'Elle rend la mousse plus crémeuse et réduit la sensation de tiraillement.' },
  { mot: 'Gomme xanthane', famille: 'Texture', definition: 'Poudre qui gélifie l\'eau et stabilise les textures.', pratique: '0,3 à 0,8 % suffisent : au-delà, le gel devient collant.' },
  { mot: 'Conservateur', famille: 'Qualité', definition: 'Substance qui empêche les microbes de se multiplier dans un produit contenant de l\'eau.', pratique: 'Obligatoire dès qu\'un produit contient de l\'eau ou un hydrolat et se garde plusieurs semaines.' },
  { mot: 'Large spectre', famille: 'Qualité', definition: 'Se dit d\'un conservateur efficace contre les bactéries, les levures et les moisissures.', pratique: 'Le phenoxyethanol seul ne couvre pas tout : on l\'associe souvent.' },
  { mot: 'Antioxydant', famille: 'Qualité', definition: 'Substance qui ralentit le rancissement des huiles.', pratique: 'La vitamine E s\'ajoute à 0,5 % dans les produits riches en huiles fragiles.' },
  { mot: 'Rancissement', famille: 'Qualité', definition: 'Dégradation d\'une huile qui prend une odeur forte et devient irritante.', pratique: 'Il vient de la chaleur, de la lumière et de l\'air : stockez au frais et à l\'abri du jour.' },
  { mot: 'PaO (période après ouverture)', famille: 'Étiquetage', definition: 'Durée pendant laquelle le produit reste bon après la première ouverture.', pratique: '6M signifie six mois : c\'est le symbole du pot ouvert sur l\'étiquette.' },
  { mot: 'INCI', famille: 'Étiquetage', definition: 'Nom international des ingrédients, écrit en latin, obligatoire sur l\'étiquette.', pratique: 'Le beurre de karité s\'écrit « Butyrospermum Parkii Butter » et se place en tête quand il domine la formule.' },
  { mot: 'Allergène', famille: 'Étiquetage', definition: 'Substance qui peut déclencher une réaction chez certaines personnes.', pratique: 'Les allergènes des parfums et huiles essentielles se déclarent au-dessus d\'un seuil, avec leur nom INCI.' },
  { mot: 'Numéro de lot', famille: 'Étiquetage', definition: 'Code qui identifie une fabrication précise.', pratique: 'Il relie le produit à sa fiche de lot : indispensable si une cliente signale un problème.' },
  { mot: 'Responsable de la mise sur le marché', famille: 'Étiquetage', definition: 'Personne qui répond du produit devant la loi.', pratique: 'Son nom et sa ville figurent sur l\'étiquette, même pour un tout petit atelier.' },
  { mot: 'Contenance nominale', famille: 'Étiquetage', definition: 'Poids ou volume réellement contenu dans le flacon.', pratique: 'Elle doit être exacte : pesez, ne vous fiez pas au contenant.' },
  { mot: 'Étiquette conforme', famille: 'Étiquetage', definition: 'Étiquette portant le nom, la fonction, les ingrédients INCI, la contenance, le lot, le PAO, le responsable et les précautions.', pratique: 'Générez-la depuis l\'outil : l\'ordre décroissant des ingrédients est vérifié automatiquement.' },
  { mot: 'Hydrolat', famille: 'Matières', definition: 'Eau aromatique obtenue lors de la distillation d\'une plante.', pratique: 'Il remplace souvent l\'eau dans une crème et apporte une odeur douce.' },
  { mot: 'Huile essentielle', famille: 'Matières', definition: 'Extrait très concentré de plante, jamais utilisé pur sur la peau.', pratique: '1 % maximum dans une crème, et jamais sur un enfant sans avis.' },
  { mot: 'Beurre végétal', famille: 'Matières', definition: 'Matière grasse solide à température ambiante, comme le karité ou le cacao.', pratique: 'Il apporte du corps à un baume et protège la peau sèche.' },
  { mot: 'Huile vierge', famille: 'Matières', definition: 'Huile obtenue sans traitement chimique ni raffinage.', pratique: 'Plus riche, mais elle rancit plus vite : achetez en petite quantité.' },
  { mot: 'Macération', famille: 'Matières', definition: 'Faire tremper une plante dans une huile pour en capter les principes.', pratique: 'Comptez trois semaines au chaud et à l\'abri de la lumière, en remuant de temps en temps.' },
  { mot: 'Glycérine', famille: 'Matières', definition: 'Liquide sirupeux qui attire l\'eau et adoucit la peau.', pratique: 'Elle est produite naturellement par la saponification ; on peut aussi en ajouter 2 à 5 %.' },
  { mot: 'Argile', famille: 'Matières', definition: 'Terre fine qui absorbe le sébum et les impuretés.', pratique: 'Le kaolin convient aux peaux sensibles, la montmorillonite (argile verte) aux peaux grasses.' },
  { mot: 'Exfoliant', famille: 'Soins', definition: 'Grain ou poudre qui décolle les cellules mortes.', pratique: 'Sucre, marc de café ou poudre de riz : restez doux, une fois par semaine.' },
  { mot: 'Contrôle qualité', famille: 'Qualité', definition: 'Vérifications faites sur chaque lot avant de vendre.', pratique: 'Notez au minimum pH, poids, aspect, odeur et couleur dans la fiche de lot.' },
  { mot: 'Fiche de lot', famille: 'Qualité', definition: 'Document qui garde la trace d\'une fabrication : recette, quantités, contrôles, date.', pratique: 'Elle se remplit en 2 minutes et protège en cas de réclamation.' },
  { mot: 'Traçabilité', famille: 'Qualité', definition: 'Capacité à retrouver, pour un produit vendu, toutes ses étapes de fabrication.', pratique: 'Un QR sur l\'étiquette qui ouvre la fiche du lot fait le travail à votre place.' },
  { mot: 'Prix de revient', famille: 'Vente', definition: 'Ce que coûte une unité de produit, matière et temps compris.', pratique: 'Sans lui, on vend parfois à perte en croyant gagner de l\'argent.' },
  { mot: 'Marge', famille: 'Vente', definition: 'Ce qui reste sur le prix de vente une fois le coût payé, en pourcentage du prix.', pratique: '(prix − coût) ÷ prix. Doubler le coût ne donne pas 100 % de marge mais 50 %.' },
  { mot: 'Prix revendeur', famille: 'Vente', definition: 'Prix accordé à une boutique qui revend vos produits.', pratique: 'Si elle prend 25 %, divisez votre prix par 0,75 pour ne rien perdre.' },
  { mot: 'Devis', famille: 'Vente', definition: 'Proposition de prix envoyée avant la commande.', pratique: 'Pour deux produits ou plus, un devis évite les malentendus.' },
  { mot: 'Relance', famille: 'Vente', definition: 'Rappel poli fait à un client qui n\'a pas encore payé.', pratique: 'Deux relances espacées d\'une semaine suffisent ; au-delà, le client se braque.' },
  { mot: 'Surgras à froid', famille: 'Savon', definition: 'Ajout d\'une huile précieuse après la trace, quand la soude n\'agit plus.', pratique: 'Elle reste intacte dans le savon et se sent sur la peau.' },
  { mot: 'Moule silicone', famille: 'Matériel', definition: 'Moule souple qui se démoule sans effort.', pratique: 'Trempez-le 24 h après la coulée : le savon se démoule sans casser.' },
  { mot: 'Bandelette pH', famille: 'Qualité', definition: 'Papier qui change de couleur selon l\'acidité du produit.', pratique: 'Testez avec de l\'eau déminéralisée : l\'eau du robinet fausse la mesure.' },
  { mot: 'BPF (bonnes pratiques de fabrication)', famille: 'Qualité', definition: 'Règles d\'hygiène et d\'organisation d\'un atelier.', pratique: 'Plan de travail lavé, matériel dédié, mains propres, produits datés : l\'essentiel tient sur une feuille.' },
  { mot: 'Mode atelier', famille: 'Apprentissage', definition: 'Écran pas-à-pas, gros textes, minuteurs, utilisable les mains occupées.', pratique: 'Il se lance depuis une leçon de fabrication : chaque étape reste affichée jusqu\'au minuteur suivant.' }
];

export const FAMILLES = Array.from(new Set(GLOSSAIRE.map(t => t.famille))).sort((a, b) => a.localeCompare(b, 'fr'));

export function chercher(q: string, famille?: string): Terme[] {
  const terme = (q || '').trim().toLowerCase();
  return GLOSSAIRE.filter(t => (!famille || t.famille === famille) &&
    (!terme || t.mot.toLowerCase().indexOf(terme) >= 0 || t.definition.toLowerCase().indexOf(terme) >= 0));
}
