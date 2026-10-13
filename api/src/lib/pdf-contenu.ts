/* ============================================================
   CONTENU DES LIVRES — CosmétiLab
   Les tables (huiles, densités, checklist d'étiquetage) sont reprises
   à l'identique de `web/src/v3-outils.js` : un livre dit exactement la
   même chose que les calculateurs du site. Le reste du texte est écrit
   ici, une fois, et sert à composer chaque ouvrage.
   ============================================================ */

export type Huile = { id: string; nom: string; sap: number; dur: number; net: number; cond: number;
                      mousse: number; cremeux: number; d: number; prix: number; max: number; note: string };

export const HUILES: Huile[] = [
  { id: 'coco', nom: 'Coco (vierge)', sap: 0.183, dur: 79, net: 67, cond: 10, mousse: 67, cremeux: 12, d: 0.92, prix: 2500, max: 30, note: 'Mousse généreuse, nettoyant. Max 30 % en savon.' },
  { id: 'palmiste', nom: 'Palmiste', sap: 0.194, dur: 70, net: 60, cond: 14, mousse: 62, cremeux: 16, d: 0.91, prix: 1200, max: 30, note: 'Comme la coco, moins chère, mousse un peu moins fine.' },
  { id: 'palme', nom: 'Palme', sap: 0.141, dur: 44, net: 20, cond: 22, mousse: 20, cremeux: 44, d: 0.90, prix: 1000, max: 40, note: 'Dureté et tenue. Choisir RSPO/huile rouge locale.' },
  { id: 'olive', nom: 'Olive', sap: 0.134, dur: 15, net: 0, cond: 45, mousse: 12, cremeux: 19, d: 0.91, prix: 3200, max: 70, note: 'Douceur, savon long à durcir. Idéale avec un beurre.' },
  { id: 'karite', nom: 'Karité (brut)', sap: 0.128, dur: 39, net: 0, cond: 62, mousse: 12, cremeux: 30, d: 0.90, prix: 2800, max: 40, note: 'Nourrit, protège. Le geste cosmétique africain.' },
  { id: 'cacao', nom: 'Beurre de cacao', sap: 0.137, dur: 60, net: 0, cond: 35, mousse: 20, cremeux: 55, d: 0.92, prix: 4500, max: 20, note: 'Savon dur et stable, texture velouté.' },
  { id: 'ricin', nom: 'Ricin', sap: 0.128, dur: 0, net: 0, cond: 88, mousse: 90, cremeux: 25, d: 0.96, prix: 3000, max: 12, note: 'Mousse fine et stable : 5–10 % suffisent.' },
  { id: 'tournesol', nom: 'Tournesol', sap: 0.134, dur: 8, net: 0, cond: 55, mousse: 10, cremeux: 15, d: 0.92, prix: 1500, max: 25, note: 'Barre molle : au-delà de 25 % le savon rancit.' },
  { id: 'baobab', nom: 'Baobab', sap: 0.132, dur: 12, net: 0, cond: 65, mousse: 15, cremeux: 20, d: 0.91, prix: 6000, max: 20, note: 'Peau mature, éclat. Se dose en petit %.' },
  { id: 'sesame', nom: 'Sésame', sap: 0.133, dur: 20, net: 0, cond: 60, mousse: 18, cremeux: 22, d: 0.92, prix: 2600, max: 25, note: 'Contre l\'huile de coco trop décapante.' },
  { id: 'avocat', nom: 'Avocat', sap: 0.133, dur: 18, net: 0, cond: 62, mousse: 15, cremeux: 25, d: 0.91, prix: 4000, max: 20, note: 'Peaux très sèches, savon de douceur.' },
  { id: 'nigelle', nom: 'Nigelle (cumin noir)', sap: 0.135, dur: 10, net: 0, cond: 70, mousse: 12, cremeux: 18, d: 0.92, prix: 7000, max: 12, note: 'Bienfaits reconnus, à réserver au soin.' },
  { id: 'saindoux', nom: 'Saindoux', sap: 0.140, dur: 42, net: 0, cond: 45, mousse: 15, cremeux: 45, d: 0.90, prix: 2000, max: 30, note: 'Durée de conservation, savon blanc.' },
  { id: 'ricin-sulf', nom: 'Huile d\'arachide', sap: 0.137, dur: 22, net: 0, cond: 48, mousse: 14, cremeux: 22, d: 0.91, prix: 2200, max: 30, note: 'Huile locale économique, savon doux.' }
];

export const DENSITES = [
  { id: 'eau', nom: 'Eau', d: 1.00 },
  { id: 'huile', nom: 'Huile végétale', d: 0.92 },
  { id: 'glycérine', nom: 'Glycérine', d: 1.26 },
  { id: 'alcool', nom: 'Alcool', d: 0.79 },
  { id: 'karite', nom: 'Beurre de karité fondu', d: 0.90 },
  { id: 'miel', nom: 'Miel', d: 1.42 },
  { id: 'lait', nom: 'Lait', d: 1.03 },
  { id: 'tensio', nom: 'Tensioactif liquide', d: 1.05 }
];

export const CHECKLIST_ETIQUETTE = [
  { id: 'nom', t: 'Nom et fonction du produit', d: '« Savon surgras à la lavande » — la fonction doit être claire.' },
  { id: 'inci', t: 'Liste des ingrédients (INCI)', d: 'Du plus dosé au moins dosé, noms INCI. Sous 1 %, l\'ordre est libre.' },
  { id: 'quantite', t: 'Quantité nominale', d: 'Poids ou volume (100 g, 250 ml) au moment de la mise en vente.' },
  { id: 'lot', t: 'Numéro de lot', d: 'Indispensable pour retrouver le lot en cas de rappel.' },
  { id: 'fab', t: 'Date de fabrication ou DDM/PAC', d: 'Date courte + « à utiliser avant », ou symbole 12 M (mois après ouverture).' },
  { id: 'responsable', t: 'Nom et adresse du responsable', d: 'Celui qui met le produit sur le marché (vous, ou votre marque).' },
  { id: 'origine', t: 'Pays d\'origine', d: 'Pour un produit fabriqué au Bénin : « Fabriqué au Bénin ».' },
  { id: 'precautions', t: 'Précautions d\'emploi', d: 'Usage externe, éviter le contact avec les yeux, tenir hors de portée des enfants.' },
  { id: 'conservation', t: 'Conservation', d: '« Conserver à l\'abri de la chaleur et de la lumière » (30 °C max en Afrique de l\'Ouest).' },
  { id: 'allergenes', t: 'Allergènes signalés', d: 'Si parfum : indiquer « parfum » + les allergènes au-dessus de 0,01 % (ex. limonène, linalool).' },
  { id: 'tests', t: 'Tests de stabilité faits', d: '4 semaines à 40 °C + un cycle chaud/froid, notés dans le dossier de lot.' },
  { id: 'controle', t: 'Contrôle du pH noté', d: 'pH mesuré à chaque lot : savon 9–10, crème 5–5,5, gel douche 4,5–5,5.' },
  { id: 'hygiene', t: 'Plan de nettoyage tenu', d: 'Matériel désinfecté, plan de travail propre, tenue dédiée.' },
  { id: 'tracabilite', t: 'Traçabilité des matières premières', d: 'Lot et fournisseur de chaque matière consignés.' },
  { id: 'etiquette', t: 'Étiquette collée et lisible', d: 'Écriture lisible sans lunettes, en français, qui ne se décolle pas.' },
  { id: 'echantillon', t: 'Échantillon conservé', d: 'Garder un flacon de chaque lot 6 mois : votre preuve en cas de question.' }
];

export type Chapitre = { t: string; paras: string[]; cles?: string[]; err?: string[] };
export type Recette = { nom: string; lot: string; ing: [string, number][]; mode: string[]; astuce?: string };

/* ------------------------------------------------------------
   CHAPITRES PRÉSENTS DANS TOUS LES LIVRES
   ------------------------------------------------------------ */
export const COMMUN: Chapitre[] = [
  {
    t: 'Comment utiliser ce livre',
    paras: [
      'Ce livre est le compagnon papier du cours en ligne. Il ne le remplace pas : il le prolonge. En atelier, les mains occupées ne peuvent pas faire défiler un écran, alors le livre reste ouvert sur la table et l\'application sert à calculer.',
      'Lisez d\'abord le sommaire et repérez les chapitres qui vous concernent tout de suite. Un débutant lit tout dans l\'ordre ; quelqu\'un qui a déjà produit lit le chapitre des erreurs, puis les fiches à imprimer à la fin.',
      'Chaque chapitre se termine par « À retenir » et « Erreurs à éviter ». Si vous ne devez lire que dix lignes avant de commencer, lisez celles-là.',
      'Les fiches de la dernière partie sont faites pour être imprimées, arrachées ou recopiées : checklist d\'étiquetage, tableau des huiles, calcul de la soude, conversions, fiche de lot. Gardez-les près du plan de travail.'
    ],
    cles: [
      'Un chapitre = un geste d\'atelier, pas une théorie à mémoriser.',
      'Les calculs se font dans l\'application : ce livre en explique le raisonnement.',
      'Les fiches finales sont faites pour être imprimées et salies de karité.'
    ]
  },
  {
    t: 'Hygiène et sécurité de l\'atelier',
    paras: [
      'Tout ce qui touche à la cosmétique artisanale commence par une règle simple : ce que vous ne mettriez pas sur votre peau ne doit pas entrer dans le pot. Un plan de travail nettoyé, du matériel réservé à la cosmétique et des mains lavées valent plus que n\'importe quel conservateur.',
      'La soude caustique et la potasse brûlent profondément. Gants, lunettes et manches longues sont obligatoires, jamais facultatifs. On manipule la soude toujours dans l\'eau, jamais l\'inverse : verser de l\'eau sur la soude provoque une projection brûlante. La pièce doit être ventilée, la soude pesée dans un récipient résistant à la chaleur.',
      'Le matériel se répartit en deux familles et ne se mélange pas : d\'un côté le matériel « propre » (bols, spatules, fouet, balance, thermomètre), de l\'autre le matériel « saponification » (seau, mixeur plongeant dédié, moule). Un mixeur utilisé pour la soupe puis pour le savon finira par poser un problème.',
      'La température compte autant que la propreté. Une préparation chaude accueille plus vite les microbes qu\'une préparation refroidie rapidement. On refroidit sans y toucher avec les doigts nus, on ne respire pas les poudres d\'argile (masque de protection), et on ne goûte jamais un cosmétique.'
    ],
    cles: [
      'La soude se verse dans l\'eau, jamais l\'eau sur la soude.',
      'Gants, lunettes, manches longues, pièce ventilée : quatre réflexes non négociables.',
      'Matériel dédié : un mixeur ne fait pas les deux métiers.',
      'On ne goûte jamais un cosmétique, même « naturel ».'
    ],
    err: [
      'Peser à l\'œil : une balance de cuisine à 1 g suffit pour le savon, pas pour une crème à 1 % d\'actif. Il faut une balance à 0,01 g pour les actifs.',
      'Réutiliser un pot de yaourt ou une bouteille d\'eau comme contenant définitif : ces plastiques ne sont pas prévus pour les cosmétiques.',
      'Travailler dans une cuisine où l\'on mange : poudres et huiles essentielles ne doivent pas se retrouver dans les repas.'
    ]
  },
  {
    t: 'Mesures, conversions et températures',
    paras: [
      'Une recette cosmétique est une recette de cuisine un peu plus stricte : tout se pèse, rien ne se devine. Le poids est la seule unité fiable ; les cuillères, les poignées et les bouchons sont à oublier dès qu\'on veut reproduire un résultat.',
      'Les pourcentages servent à changer la taille d\'un lot sans refaire les calculs. Une recette donnée pour 100 g se transforme en 250 g en multipliant chaque ligne par 2,5 : 12 % deviennent 30 g, 4 % deviennent 10 g. La somme des pourcentages doit toujours faire 100 % de la préparation finie.',
      'Pour passer d\'un volume à un poids, on multiplie par la densité. Un litre d\'eau pèse 1 000 g, un litre d\'huile végétale environ 920 g, un litre de glycérine 1 260 g. La tableau ci-dessous donne les densités les plus utiles en atelier.',
      'Les températures se lisent en degrés Celsius dans toutes les recettes du site. Fer à 90 °C par exemple : c\'est le point où l\'on stérilise les contenants en verre, pas la température de préparation des crèmes (70–75 °C) ni celle du savon (35–45 °C).'
    ],
    cles: [
      'Tout au poids, balance à 0,01 g pour les actifs et les huiles essentielles.',
      'Pour changer la taille d\'un lot : multiplier, jamais recalculer les pourcentages.',
      'Volume × densité = poids. En cas de doute, pesez.',
      'Verre stérilisé à 90 °C, eau bouillie refroidie, jamais de « à peu près ».'
    ]
  },
  {
    t: 'Vendre : ce qui change quand on passe du pot personnel au produit vendu',
    paras: [
      'Tant que le produit reste dans la famille, la seule exigence est de ne pas faire de mal. Dès qu\'il est vendu, la responsabilité change de nature : il faut pouvoir répondre de ce qu\'il contient, de la façon dont il a été fabriqué et du lot précis qui est entre les mains de la cliente.',
      'Cette responsabilité se matérialise par trois choses simples : un numéro de lot sur chaque pot, un dossier par lot (matières premières, pesées, températures, observations), et un échantillon conservé six mois. C\'est peu de travail au moment de la fabrication, et c\'est ce qui vous sauve si une cliente revient avec une réaction.',
      'Vendre, c\'est aussi chiffrer. Un produit vendu au prix de ses ingrédients fait perdre de l\'argent : emballage, étiquette, électricité, temps de travail et pertes entrent dans le calcul. Le dernier chapitre de ce livre montre le calcul complet, en francs CFA.',
      'Enfin, une étiquette honnête vend mieux qu\'une promesse exagérée. On décrit ce que le produit fait (nettoyer, hydrater, nourrir), jamais ce qu\'on ne peut pas prouver (guérir, effacer, blanchir).'
    ],
    cles: [
      'Un pot = un numéro de lot = une ligne dans votre cahier.',
      'Gardez un échantillon de chaque lot six mois.',
      'Le prix se calcule, il ne se devine pas.',
      'Décrivez un effet, pas une promesse.'
    ]
  }
];

/* ------------------------------------------------------------
   CHAPITRES PAR COURS
   ------------------------------------------------------------ */
export const THEMES: Record<string, Chapitre[]> = {
  c1: [
    {
      t: 'La réaction de saponification',
      paras: [
        'Fabriquer du savon à froid, c\'est provoquer une réaction chimique et l\'arrêter au bon moment. Une matière grasse (huile ou beurre) rencontre une base forte (soude, pour le savon solide) : les molécules se coupent et forment du savon d\'un côté, de la glycérine de l\'autre. La glycérine reste dans la barre, c\'est elle qui donne cette sensation douce que n\'a pas le savon industriel.',
        'La réaction n\'est jamais instantanée : elle prend des heures, puis des semaines pendant la cure. Ce qu\'on voit dans le bol, c\'est le début du phénomène. C\'est pourquoi un savon démoulé le matin est encore agressif le soir : il contient de la soude libre qui n\'a pas fini de travailler.',
        'Trois paramètres gouvernent tout : la quantité de soude, la température, et le temps de cure. La soude vient du calcul des indices de saponification de vos huiles, la température se tient entre 35 et 45 °C, et la cure dure au minimum quatre semaines — six à huit pour un savon à l\'olive.',
        'Un savon terminé n\'est jamais neutre : il se situe autour de pH 9 à 10. C\'est normal, c\'est même la définition du savon. Un savon à pH 7 n\'existe pas : il serait mou et se séparerait. Ce que l\'on cherche, c\'est un savon bien curé, dont la soude libre a disparu.'
      ],
      cles: [
        'Huile + base forte = savon + glycérine ; la glycérine reste dans la barre.',
        'La réaction continue après le moulage : c\'est la cure qui la termine.',
        'Un savon fini a un pH de 9 à 10 : c\'est normal.',
        'Soude, température, temps : trois leviers, rien d\'autre.'
      ],
      err: [
        'Croire qu\'un savon « sans soude » existe : sans base forte, il n\'y a pas de savon, seulement un mélange d\'huiles.',
        'Vendre un savon après une semaine de cure : il pique la peau et fond trop vite.',
        'Se fier à la sensation des doigts pour juger d\'un pH : il faut du papier pH ou un pH-mètre.'
      ]
    },
    {
      t: 'Calculer la soude : indice SAP, soude, eau',
      paras: [
        'Chaque huile possède un indice de saponification : la quantité de soude nécessaire pour transformer un gramme de cette huile. L\'indice du tableau du site est exprimé directement en grammes de soude par gramme d\'huile, ce qui simplifie tout : on multiplie et on additionne.',
        'La méthode tient en quatre lignes. On multiplie le poids de chaque huile par son indice, on additionne ces produits, on obtient la soude « exacte ». On multiplie ensuite par (1 − surgraissage) : pour 5 % de surgraissage, on garde 95 % de cette quantité. Le résultat est la soude à peser.',
        'Exemple complet, avec les indices du site, pour 500 g d\'huiles : 200 g d\'olive (0,134) = 26,8 g ; 125 g de coco (0,183) = 22,9 g ; 100 g de karité (0,128) = 12,8 g ; 50 g de palme (0,141) = 7,1 g ; 25 g de ricin (0,128) = 3,2 g. Total : 72,7 g de soude exacte. Avec 5 % de surgraissage : 72,7 × 0,95 = 69,1 g de soude à peser.',
        'L\'eau suit une règle simple : 30 à 38 % du poids des huiles. Pour 500 g d\'huiles, 165 g d\'eau (33 %) donnent une pâte souple, facile à tracer. Moins d\'eau accélère la trace et durcit la barre ; plus d\'eau la ralentit et allonge la cure. On mesure toujours l\'eau glacée ou à température ambiante, jamais chaude, et on la verse dans un récipient résistant à la chaleur.',
        'Le surgraissage est votre marge de sécurité et votre confort : il laisse des huiles non transformées dans la barre, qui nourrissent la peau. 5 % convient à un savon du corps, 8 % à un savon visage ou bébé, 10 % maximum au-delà duquel la barre devient molle et rancit plus vite.'
      ],
      cles: [
        'Soude exacte = somme (poids d\'huile × indice SAP).',
        'Soude à peser = soude exacte × (1 − surgraissage).',
        'Eau = 30 à 38 % du poids des huiles ; 33 % est un bon départ.',
        'Surgraissage : 5 % corps, 8 % visage ou bébé, jamais plus de 10 %.'
      ],
      err: [
        'Confondre indice KOH et indice NaOH : les valeurs du tableau du site sont déjà en soude. Si vous utilisez un tableau en KOH, divisez par 1,403.',
        'Arrondir la soude « vers le haut » par prudence : c\'est exactement l\'inverse qu\'il faut faire, on réduit pour laisser du gras libre.',
        'Oublier de peser l\'eau avec la même balance que la soude : 10 g d\'écart sur l\'eau change la texture, 10 g d\'écart sur la soude change la sécurité.'
      ]
    },
    {
      t: 'Construire une recette équilibrée',
      paras: [
        'Une bonne recette de savon n\'est pas une liste d\'huiles : c\'est un équilibre entre cinq qualités. La dureté donne une barre qui tient ; le pouvoir nettoyant enlève le gras ; la mousse fait le plaisir d\'usage ; le conditionnement laisse la peau douce ; le crémeux donne une mousse dense et serrée.',
        'Les repères du site, utilisés par tous les calculateurs de savonniers, sont les suivants. Dureté : 29 à 54. Pouvoir nettoyant : 12 à 22 — au-delà, le savon décapé. Conditionnement : 44 à 69. Mousse : 14 à 46. Crémeux : 16 à 48. Une recette dont tous les curseurs sont dans la zone verte se tient dans le temps.',
        'En pratique, on construit par blocs. On choisit d\'abord une huile de mousse (coco, palmiste) à 20–30 % maximum, une huile de tenue (palme, karité, cacao) à 20–40 %, puis on complète avec une huile douce (olive, tournesol, avocat) jusqu\'à 100 %. Le ricin, à 5–10 %, améliore la mousse sans ramollir la barre.',
        'Toute huile a un plafond. Au-delà de 30 % de coco, le savon devient décapant et se fissure. Au-delà de 25 % de tournesol, la barre rancit en quelques semaines. Au-delà de 12 % de ricin, elle devient collante. Ces plafonds figurent dans le tableau des huiles, colonne « max » : respectez-les et vous n\'aurez plus de lot raté.',
        'Un mot sur l\'eau et la soude : à quantité d\'huiles égale, une pâte trop liquide coule mal dans le moule, une pâte trop épaisse trace avant que vous ayez ajouté le parfum. La fourchette 30–38 % d\'eau couvre la plupart des cas ; pour un premier savon, restez à 33 %.'
      ],
      cles: [
        'Cinq qualités à équilibrer : dureté, nettoyage, mousse, conditionnement, crémeux.',
        'Huile de mousse 20–30 %, huile de tenue 20–40 %, huile douce pour compléter.',
        'Respectez la colonne « max » du tableau : c\'est là que se jouent les lots ratés.',
        'Ricin 5–10 % : mousse fine et stable, sans ramollir.'
      ],
      err: [
        'Faire une recette à 100 % d\'une seule huile : elle aura toujours un défaut (savon à l\'olive mou pendant des mois, savon à la coco irritant).',
        'Ajouter un actif « pour faire riche » sans vérifier la mousse : certaines poudres tuent complètement la mousse.',
        'Changer trois paramètres à la fois entre deux lots : impossible ensuite de savoir ce qui a amélioré la barre.'
      ]
    },
    {
      t: 'Trace, moule, cure, découpe',
      paras: [
        'La trace est le moment où la pâte s\'épaissit et garde la marque du fouet. Trace légère : la pâte coule encore, idéale pour couler dans un moule fin. Trace épaisse : elle ne coule plus, on la tasse à la cuillère. La plupart des recettes se coulent à trace légère, surtout si l\'on ajoute une huile essentielle.',
        'On mélange à la main d\'abord, une minute, pour homogénéiser, puis au mixeur plongeant par courtes impulsions de quelques secondes, en gardant le mixeur immergé pour ne pas incorporer d\'air. L\'air forme des bulles et des trous dans la barre : jolis parfois, mais irréguliers.',
        'Le moule se choisit en silicone ou en bois doublé de papier cuisson. On coule, on tape doucement le moule sur le plan de travail pour faire remonter les bulles, on couvre d\'une serviette pour garder la chaleur, et on laisse vingt-quatre heures. Un savon qui a « gelé » (chaud et translucide au centre) aura des couleurs plus profondes et une texture plus ferme : c\'est recherché, mais ce n\'est pas obligatoire.',
        'Le démoulage se fait quand la barre est ferme et ne colle plus : en général 24 h à 48 h selon la recette et la chaleur ambiante. Au Bénin, par temps chaud, on peut démouler plus tôt et mettre au frais (sans congélateur) si la pâte chauffe trop. On découpe avec un couteau lisse ou un fil, en blocs réguliers ; on note le poids pour que la cliente reçoive ce qui est annoncé.',
        'La cure est la partie que tout le monde veut sauter, et c\'est celle qui décide de la qualité. Quatre semaines minimum sur une grille, à l\'ombre, retournées une fois par semaine. Le savon perd de l\'eau, la soude libre disparaît, la barre durcit et la mousse devient plus crémeuse. Un savon à l\'olive demande six à huit semaines. On écrit la date sur le carton : elle finit sur l\'étiquette.'
      ],
      cles: [
        'Mixer immergé, par impulsions : moins d\'air, moins de bulles.',
        'Démouler ferme, pas tiède ; découper droit, peser chaque pièce.',
        'Cure : 4 semaines minimum, 6 à 8 pour l\'olive, à l\'ombre et retournée.',
        'Écrire la date de fabrication dès le démoulage.'
      ],
      err: [
        'Couler un savon trop chaud : il se sépare, laisse une couche d\'huile et une barre caustique.',
        'Découper un savon trop mou : les blocs s\'écrasent et la barre se déforme au séchage.',
        'Empiler les savons en cure : ils collent et les faces ne sèchent pas. Une grille aérée vaut mieux.'
      ]
    },
    {
      t: 'Le surgraissage, en pratique',
      paras: [
        'Le surgraissage est la part d\'huile qui reste intacte dans le savon fini, parce qu\'on a mis moins de soude qu\'il n\'en faudrait pour tout transformer. C\'est à la fois une sécurité (si l\'indice d\'une huile a été mal lu, il reste de la marge) et un choix de confort (la peau trouve des corps gras disponibles).',
        'On peut le faire de deux façons. La plus simple : réduire la soude dès le départ, ce qui revient à surgrair toute la recette. La plus précise : peser la soude exacte, puis ajouter une huile fragile à la trace (5 % d\'huile de baobab, d\'avocat ou de nigelle), qui ne sera jamais saponifiée. La deuxième méthode préserve les huiles les plus chères et les plus sensibles.',
        'Les taux usuels : 5 % pour un savon de corps, 8 % pour un savon visage ou bébé, 10 % pour un savon de rasage ou très nourrissant. Au-delà de 10 %, la barre devient molle, mousse mal et rancit plus vite — particulièrement en climat chaud et humide.',
        'Attention aux huiles ajoutées à la trace : elles n\'ont aucun rôle dans le calcul de la soude. Si vous enlevez 5 % d\'huile du mélange principal pour les remettre à la trace, la soude doit être calculée sur le mélange principal, pas sur le total. C\'est l\'erreur la plus fréquente et la plus invisible : le savon pique sans que l\'on comprenne pourquoi.'
      ],
      cles: [
        'Surgrair = mettre moins de soude que nécessaire, ou ajouter une huile à la trace.',
        'Huile ajoutée à la trace : comptée dans la soude, jamais dans le calcul.',
        '5 % corps, 8 % visage, 10 % maximum en climat chaud.',
        'Les huiles fragiles et chères se dessinent à la trace.'
      ],
      err: [
        'Compter l\'huile ajoutée à la trace dans le calcul de la soude : le savon devient caustique.',
        'Viser 15 % de surgraissage « pour la peau » : la barre rancit en deux mois.',
        'Utiliser un surgraissage très élevé pour rattraper une recette trop décapante : corrigez plutôt le pourcentage de coco.'
      ]
    },
    {
      t: 'Lire le tableau des huiles du site',
      paras: [
        'Le tableau des huiles donne, pour chaque matière, l\'indice de saponification, les cinq qualités de la barre, une densité, un prix indicatif et un plafond d\'usage. C\'est la table de travail la plus utile du métier : on construit une recette en la lisant, pas en la devinant.',
        'Pour un savon de lessive ou de ménage, on cherche dureté et nettoyage, sans se soucier du conditionnement. Pour un savon de corps, on cherche l\'inverse : nettoyage modéré, conditionnement élevé. Pour un savon visage, on ajoute du karité ou de l\'avocat et on monte le surgraissage.',
        'Les prix du tableau sont des repères de marché, pas des vérités : une huile achetée au marché de Dantokpa, en bidon de 5 litres, ne coûte pas le même prix qu\'un flacon de laboratoire. Le prix exact de vos matières entre dans le calcul du coût de revient (chapitre suivant du guide des prix) et conditionne votre marge.',
        'Deux matières locales méritent une mention particulière. Le karité brut donne une barre crémeuse et nourrissante ; il est plus difficile à travailler chaud mais excellent à froid. L\'huile rouge de palme apporte une couleur naturelle et une bonne tenue, mais elle colore tout : moule, chiffons, mains. Prévoyez du matériel dédié et prévenez les clientes que la couleur peut varier d\'un lot à l\'autre.'
      ],
      cles: [
        'Lisez le tableau avant d\'écrire une recette, pas après.',
        'Savon de ménage : nettoyage et dureté. Savon de corps : conditionnement.',
        'Les prix du tableau sont indicatifs : notez vos vrais prix d\'achat.',
        'Karité brut et huile rouge : excellentes matières, matériel dédié.'
      ]
    },
    {
      t: 'Les huit erreurs qui gâchent un lot',
      paras: [
        'Presque tous les lots ratés viennent des mêmes causes. La première : une soude mal calculée, par confusion entre indice KOH et indice NaOH, ou par oubli de la réduction de surgraissage. Un savon qui pique est un savon qui a trop de soude libre : il faut le laisser curer beaucoup plus longtemps, et souvent le refondre.',
        'Deuxième cause : la séparation. On coule trop chaud, ou on ajoute trop d\'eau, ou on met du parfum en trop grande quantité : la pâte se sépare en une couche d\'huile et une masse dure. En refroidissant la pâte et en la remuant, on la rattrape parfois ; sinon, on refond.',
        'Troisième cause : la trace trop rapide. Certaines huiles essentielles (clou de girofle, cannelle) accélèrent brutalement la prise : on n\'a pas le temps de couler. La solution : ne pas dépasser 1 % pour ces huiles, et couler dès la trace légère, sans attendre.',
        'Les cinq autres, en bref : le surgraissage trop élevé qui ramollit la barre ; la coco au-delà de 30 % qui décapé ; le tournesol au-delà de 25 % qui fait rancir ; la découpe trop tôt qui déforme les blocs ; et la cure raccourcie qui livre un savon encore agressif. Aucune de ces erreurs n\'est grave, toutes coûtent un lot.'
      ],
      cles: [
        'Savon qui pique = trop de soude : cure longue, ou refonte.',
        'Pâte séparée = trop chaud, trop d\'eau, ou trop de parfum.',
        'Huiles essentielles épicées : 1 % maximum, couler tout de suite.',
        'Notez chaque lot : c\'est la seule façon de corriger vraiment.'
      ],
      err: [
        'Refaire un savon raté sans noter ce qui s\'est passé : le lot suivant sera raté pareil.',
        'Jeter une pâte séparée : dans la plupart des cas, elle se rattrape en remuant hors du feu, ou se refond.',
        'Vendre quand même un savon qui pique, en espérant que « ça passe ».'
      ]
    }
  ],
  c2: [
    {
      t: 'Comment un tensioactif lave',
      paras: [
        'Un tensioactif est une molécule à deux visages : une tête qui aime l\'eau, une queue qui aime le gras. Dans l\'eau, ces molécules s\'alignent et forment des structures qui emprisonnent les saletés grasses, puis les emportent au rinçage. C\'est tout le mécanisme du shampooing et du gel douche.',
        'Tous les tensioactifs ne se valent pas. Les plus efficaces sont souvent les plus agressifs : le SLES dégraisse fort, mousse beaucoup et coûte peu, mais il déséquilibre la peau et pique les yeux. Les tensioactifs doux, comme le coco-glucoside ou les dérivés de coco, lavent un peu moins fort et laissent le film cutané en meilleur état.',
        'En pratique, on ne choisit pas un seul tensioactif : on construit un mélange. Un tensioactif principal (souvent le moins cher ou le plus moussant), un co-tensioactif doux qui adoucit le Contact (bétaïne de coco, glucoside), et parfois un agent conditionnant qui rend le rinçage agréable. C\'est ce dosage, plus que la marque du flacon, qui fait un bon gel douche.'
      ],
      cles: [
        'Un tensioactif a une tête hydrophile et une queue lipophile : il emprisonne le gras.',
        'Plus ça mousse fort, plus c\'est souvent décapant.',
        'On construit un mélange, jamais un tensioactif unique.'
      ],
      err: [
        'Augmenter la dose pour mieux laver : au-delà d\'un certain seuil, la peau souffre sans que la propreté progresse.',
        'Penser qu\'un « savon liquide naturel » à base de savon saponifié est doux : il est alcalin et pique les yeux.',
        'Se fier uniquement à la mousse : beaucoup de tensioactifs doux moussent peu.'
      ]
    },
    {
      t: 'Le pH : la bonne marge de manœuvre',
      paras: [
        'La peau a un pH acide, autour de 5. Le cheveu supporte encore plus mal l\'alcalin : au-delà de pH 6,5 les écailles se soulèvent et la fibre devient rêche. Un gel douche se situe donc entre 4,5 et 5,5, un shampooing entre 4,5 et 5,5 également, et une crème entre 5 et 5,5.',
        'Attention au piège du vrai savon : un savon saponifié, même artisanal, est alcalin (pH 9 à 10). C\'est parfait pour un savon solide du corps, beaucoup moins pour un shampooing. On ne peut pas « acidifier » un savon saponifié sans le détruire : si vous voulez un shampooing doux, il faut le construire sur des tensioactifs synthétiques doux, pas sur du savon.',
        'Le pH se mesure au papier indicateur pour un ordre de grandeur, ou au pH-mètre pour une valeur fiable. Un pH-mètre demande un étalonnage avec deux solutions tampons ; c\'est un investissement rentable dès que vous vendez, parce que c\'est la mesure que l\'on vous demandera si un client a une réaction.',
        'Le pH bouge après la fabrication. Un gel fraîchement fait peut afficher 5,2 et se retrouver à 4,8 trois semaines plus tard, si un ingrédient s\'est hydrolysé. La règle de sécurité : viser 5,2 pour atterrir vers 5,0, et remesurer le dernier pot de chaque lot avant de livrer.'
      ],
      cles: [
        'Gel douche et shampooing : 4,5 à 5,5. Crème : 5 à 5,5.',
        'Un savon saponifié est alcalin : jamais pour le cheveu.',
        'Mesurer frais et mesurer trois semaines après.',
        'Un pH-mètre étalonné vaut mieux que trois bandelettes.'
      ],
      err: [
        'Ajuster le pH à l\'acide citrique par brimades sans remesurer : le gel devient liquide, la texture se casse.',
        'Croire qu\'un produit « sans conservateur » tient grâce à son pH acide : un pH acide ralentit la flore, il ne la bloque pas.',
        'Vendre un gel douche à pH 7 ou plus sans le signaler : c\'est un produit décapant.'
      ]
    },
    {
      t: 'Construire une base lavante douce',
      paras: [
        'Une base lavante se construit en pourcentages. Comptez 20 à 35 % de tensioactif principal, 10 à 20 % de co-tensioactif doux, 1 à 3 % d\'agent épaississant selon le rendu, 1 à 2 % de glycérine ou de panthénol pour la douceur, moins de 1 % de parfum ou d\'huile essentielle, et 0,6 à 1 % de conservateur large spectre.',
        'Le reste est de l\'eau. Elle doit être propre : eau déminéralisée achetée, ou eau du robinet bouillie puis refroidie, jamais de l\'eau restée ouverte dans une bouteille. L\'eau du robinet n\'est pas stérile : elle porte une flore qui trouvera dans votre gel un milieu idéal.',
        'L\'ordre de fabrication compte. On dissout d\'abord le tensioactif dans l\'eau, sans fouetter (la mousse gêne tout le reste), on ajoute l\'épaississant et on laisse gonfler, on ajuste le pH, on ajoute les actifs et le parfum, puis le conservateur, et on remesure le pH. Remplir les flacons en dernier, une fois le pH validé.',
        'Pour un shampooing, ajoutez 1 à 3 % de bétaïne et 1 à 2 % de panthénol, et visez un pH de 5. Pour un gel douche, une base plus simple suffit, avec un peu plus de glycérine. Dans les deux cas, testez sur vous-même quinze jours avant de vendre : c\'est le seul test qui compte vraiment pour un produit lavant.'
      ],
      cles: [
        'Tensioactif 20–35 %, co-tensioactif 10–20 %, conservateur 0,6–1 %.',
        'Eau déminéralisée ou bouillie refroidie, jamais l\'eau d\'une bouteille ouverte.',
        'Ne pas fouetter à la dissolution : la mousse empêche de voir ce qui se passe.',
        'Ajuster le pH avant le conservateur, puis remesurer.'
      ],
      err: [
        'Oublier le conservateur parce que « ça mousse, donc c\'est propre » : la mousse n\'a aucun effet antibactérien.',
        'Ajouter un épaississant sans pH compatible : le gel reste liquide et vous en remettez le double.',
        'Parfumer à 3 % un produit qui reste sur la peau : irritations et allergies à répétition.'
      ]
    },
    {
      t: 'Épaissir, parfumer, conserver',
      paras: [
        'Un gel douche trop liquide se règle par un épaississant, pas en réduisant l\'eau. Le sel (chlorure de sodium) épaissit les formules à base de SLES d\'une façon spectaculaire : une pincée peut changer complètement la viscosité, mais au-delà d\'un seuil, l\'effet s\'inverse et le gel redevient liquide. On ajoute 0,1 % à la fois, en remuant, en notant.',
        'Pour les formules sans SLES, on épaissit avec de la gomme xanthane (0,5 à 1 %) ou un épaississant liquide prêt à l\'emploi (2 à 4 %). La texture obtenue est plus douce, légèrement coulante : c\'est le compromis habituel de la cosmétique douce.',
        'Le parfum se dose à 0,5 % maximum dans un produit lavant, 1 % si vous y tenez vraiment. Les huiles essentielles suivent la même règle, avec deux précautions : comptez leurs allergènes et n\'utilisez pas d\'agrumes photosensibilisants dans un produit qui reste sur la peau. Dans un gel douche rincé, le risque est moindre, mais l\'irritation existe encore.',
        'Le conservateur est la ligne rouge. Tout produit contenant de l\'eau doit être protégé : les tensioactifs n\'empêchent rien, le sucre nourrit même la flore. Dosage courant : 0,6 à 1 % de conservateur large spectre, ajouté sous 40 °C, pH vérifié. Un produit non conservé se garde au frais, en petit volume, et se jette après trente jours.'
      ],
      cles: [
        'Épaissir : sel en dernier recours (0,1 % par 0,1 %), xanthane ou épaississant liquide sinon.',
        'Parfum 0,5 % maximum dans un lavant, allergènes annoncés sur l\'étiquette.',
        'Conservateur obligatoire, ajouté sous 40 °C.',
        'pH remesuré après le conservateur, avant la mise en flacon.'
      ],
      err: [
        'Verser le conservateur dans une préparation chaude : il se dégrade et ne protège plus rien.',
        'Épaissir au sel en une seule fois : au-delà du seuil, le gel se liquéfie et il n\'y a pas de retour.',
        'Remplir les flacons avec les mains plutôt qu\'avec un entonnoir propre : la contamination arrive par là.'
      ]
    }
  ],
  c3: [
    {
      t: 'Anatomie d\'une émulsion',
      paras: [
        'Une crème, c\'est de l\'eau et de l\'huile qui refusent de se mélanger, maintenues ensemble par un émulsifiant. Les gouttelettes d\'une phase sont dispersées dans l\'autre : huile dans eau (lotion, crème de jour fraîche) ou eau dans huile (baume, crème riche). Le choix décide du toucher et de la vitesse de pénétration.',
        'L\'émulsifiant est une molécule qui aime les deux phases, exactement comme un tensioactif. Il s\'installe à la frontière entre l\'eau et l\'huile et empêche les gouttelettes de se rejoindre. Sans lui, la crème se sépare en quelques heures : l\'huile remonte, l\'eau reste dessous.',
        'Une émulsion se juge sur trois choses : la finesse (les gouttelettes doivent être petites, ce qui donne un aspect satiné), la stabilité (elle doit tenir la durée de vie annoncée) et le toucher (ni gras ni collant, ni poudreux). Les trois se règlent par la formulation et la méthode, pas par un ingrédient miracle.'
      ],
      cles: [
        'Huile dans eau = toucher frais ; eau dans huile = toucher riche.',
        'Sans émulsifiant, pas de crème : seulement un mélange qui se sépare.',
        'Finesse, stabilité, toucher : les trois critères à surveiller.'
      ],
      err: [
        'Se fier à la couleur : une crème réussie et une crème séparée peuvent avoir le même aspect à la fabrication.',
        'Sous-doser l\'émulsifiant « pour alléger » : la crème se sépare en une semaine.',
        'Mélanger à froid un émulsifiant qui exige la chaleur : la texture reste granuleuse.'
      ]
    },
    {
      t: 'La méthode en huit étapes',
      paras: [
        'Étape 1 : nettoyer et désinfecter le plan de travail, le matériel et les contenants. Étape 2 : peser séparément la phase aqueuse et la phase huileuse, en notant chaque poids sur une feuille. Étape 3 : chauffer les deux phases séparément au bain-marie, à 70–75 °C, en remuant doucement.',
        'Étape 4 : verser la phase huileuse dans la phase aqueuse (ou l\'inverse selon l\'émulsifiant : suivez la fiche du fournisseur) en remuant sans arrêt. Étape 5 : homogénéiser au mixeur plongeant immergé, par impulsions de trois à cinq secondes, en changeant de position, pendant environ deux minutes.',
        'Étape 6 : refroidir en remuant régulièrement, jusqu\'à 40 °C. C\'est à ce moment que la crème épaissit et prend sa texture définitive. Étape 7 : ajouter les actifs thermosensibles, les huiles fragiles, le parfum, puis le conservateur, en mélangeant après chaque ajout. Étape 8 : mesurer le pH, remplir les pots propres, étiqueter avec la date et le numéro de lot, et conserver un échantillon.',
        'Le refroidissement est l\'étape où l\'on perd le plus de crèmes. Si la crème « déphase » pendant le refroidissement, c\'est presque toujours parce que la phase huileuse s\'est solidifiée trop vite : le beurre de karité, par exemple, fige dès 30 °C. La solution consiste à refroidir plus vite, en remuant, ou à laisser les beurres figer avec un émulsifiant adapté.'
      ],
      cles: [
        'Deux phases chauffées séparément à 70–75 °C, puis réunies.',
        'Homogénéisation immergée, par impulsions, sans incorporer d\'air.',
        'Actifs, parfum et conservateur : sous 40 °C, dans cet ordre.',
        'Un déphasage au refroidissement vient du beurre qui fige trop vite.'
      ],
      err: [
        'Chauffer les deux phases dans le même bain sans les séparer : la phase aqueuse s\'évapore et les proportions sont fausses.',
        'Ajouter le conservateur à 60 °C : il perd son efficacité, la crème moisit en trois semaines.',
        'Remplir les pots à l\'air libre, sans nettoyer le plan : c\'est la contamination la plus banale.'
      ]
    },
    {
      t: 'Actifs : dosages et précautions',
      paras: [
        'Un actif n\'est pas un ingrédient magique : c\'est une dose. Deux actifs mal dosés ne s\'additionnent pas en douceur, leurs effets secondaires non plus. Respectez les concentrations fournies par le vendeur, sans jamais doubler « pour que ça marche mieux ».',
        'Les bons réflexes : introduire un seul actif nouveau à la fois, à la dose minimale, et faire un essai de quinze jours sur une petite zone avant de produire un lot entier. Certains actifs comme l\'acide salicylique sont réservés à un usage encadré ; d\'autres comme la vitamine C se dégradent en quelques semaines.',
        'Un peu de bon sens suffit pour trier les actifs : plus c\'est puissant, plus la dose est basse et plus la précaution est écrite noir sur blanc sur l\'emballage. Un extrait de plante séché n\'est pas « plus naturel » qu\'un actif de synthèse : les deux agissent par leur concentration, pas par leur origine.',
        'Enfin, tout ce qui est promis doit pouvoir tenir trois mois sur une étagère à 35 °C, ce qui n\'est pas la même chose que de tenir deux jours au réfrigérateur. En climat chaud, une crème riche en actifs fragiles a une durée de vie plus courte : marquez un PAO court plutôt que de promettre trop.'
      ],
      cles: [
        'Un actif nouveau à la fois, à la dose minimale.',
        'Essai de quinze jours sur une petite zone avant de produire.',
        'Le PAO doit tenir au climat, pas au réfrigérateur.',
        'Écrivez ce que vous avez pesé : sans cette note, impossible de reproduire un bon lot.'
      ],
      err: [
        'Doubler une dose d\'actif parce que le pot voisin marche bien : une irritation ne se rattrape pas.',
        'Annoncer un actif « vivant » dans un pot ouvert deux mois : la promesse était intenable.',
        'Mélanger trois actifs puissants pour « l\'effet complet » : le risque augmente pour un gain visible incertain.'
      ]
    }
  ],
  c4: [
    {
      t: 'Du plus fluide au plus riche : le curseur de texture',
      paras: [
        'Un lait corporel, un baume et une huile de massage ont la même base et ne se distinguent que par le taux de phase grasse et la présence d\'eau. Plus la phase grasse est élevée, plus le produit est riche et « occlusif » — il retient l\'eau dans la peau plutôt que d\'en apporter.',
        'Repères pratiques : 3 à 6 % de phase grasse pour un lait léger, 8 à 12 % pour un lait riche, 15 à 25 % pour un baume. Un baume contient très peu d\'eau, parfois aucune : au-delà de 25 % de matière grasse, l\'émulsion devient difficile à stabiliser sans gélifiant.',
        'Le karité et le cacao apportent de la tenue et un toucher velours mais durcissent au froid : ils figeent la préparation. On les dose plus bas dans un lait destiné à un climat frais, plus haut dans un baume solide en climat chaud, où le produit reste souple à température ambiante.',
        'La glycérine mérite une mention : 2 à 5 % suffisent pour donner une sensation d\'hydratation. Au-delà de 8 %, le produit devient collant, et en climat humide il attire l\'eau de l\'air au point de laisser un film désagréable.'
      ],
      cles: [
        'Lait léger 3–6 % de gras, lait riche 8–12 %, baume 15–25 %.',
        'Karité et cacao figent : dosez selon le climat.',
        'Glycérine 2–5 %, jamais plus de 8 % en climat humide.',
        'Un baume protège plus qu\'il n\'hydrate : il retient l\'eau, il n\'en apporte pas.'
      ],
      err: [
        'Monter le taux de gras pour « faire plus riche » sans ajuster l\'émulsifiant : la préparation se sépare.',
        'Utiliser la même formule toute l\'année dans un climat humide : elle devient collante en saison des pluies.',
        'Oublier l\'eau dans un lait : sans eau et sans gélifiant, ce n\'est plus un lait mais un beurre fondu.'
      ]
    },
    {
      t: 'Le karité : qualité, dosage, grains',
      paras: [
        'Le beurre de karité brut sent le noisette grillé, il est beige à ivoire et parfois granuleux. Le karité raffiné est blanc et neutre, mais il a perdu une partie de ses insaponifiables, ces composés qui font la réputation du karité pour les peaux sèches. Pour un soin du corps, le brut vaut le coup : il apporte aussi un parfum naturel distinctif.',
        'Le problème du karité est le grain. Il est dû à la présence de deux familles de triglycérides qui cristallisent séparément. On l\'évite en chauffant le beurre lentement jusqu\'à 70 °C, en le laissant figer tranquillement à température ambiante, sans le mettre au froid. Chauffage lent, refroidissement lent : grains en moins.',
        'Dans une crème, le karité se dose communément entre 5 et 15 %. À 20 %, il alourdit le toucher mais tient bien la promesse nourrissante d\'un baume de nuit. Dans un savon, il apporte du crémeux et du conditionnement ; il entre typiquement à 15–30 %, jamais au-delà de sa limite de 40 %.',
        'Choisissez votre fournisseur sur deux critères : la traçabilité (qui a pressé, où) et la régularité. Un karité qui change de couleur et d\'odeur d\'un lot à l\'autre rend impossible une formule stable. Demandez un seau étiqueté, notez le fournisseur et la date d\'achat, et conservez à l\'abri de la chaleur.'
      ],
      cles: [
        'Karité brut : plus d\'insaponifiables, une odeur marquée. Raffiné : neutre.',
        'Chauffage et refroidissement lents : plus de grains.',
        'Crème 5–15 %, savon 15–30 %, plafond 40 %.',
        'Une seule provenance régulière vaut mieux que trois « bonnes affaires ».'
      ],
      err: [
        'Refroidir brutalement une préparation au karité : cristallisation en grains et texture sableuse.',
        'Surcharger en karité une crème « pour peaux très sèches » : le produit reste à la surface et ne pénètre pas.',
        'Acheter un seau sans étiquette ni date : impossible de tracer un lot en cas de question.'
      ]
    }
  ],
  c5: [
    {
      t: 'Les argiles : choisir, doser, appliquer',
      paras: [
        'L\'argile est une poudre minérale : elle absorbe l\'eau, le sébum et certaines impuretés de surface. Verte, elle absorbe fort et convient aux peaux grasses ; blanche ou kaolin, elle est douce et convient aux peaux réactives ; rose, c\'est un mélange destiné aux peaux sèches ou matures à qui la verte « tire » trop.',
        'On prépare un masque en mélangeant l\'argile avec de l\'eau, un hydrolat ou un yaourt : deux volumes de poudre pour trois volumes de liquide pour une texture tartinable. Elle se prépare juste avant l\'application, jamais la veille : une argile hydratée se charge de microbes. On l\'applique au pinceau ou à la main, sur un facteur, en évitant le contour des yeux.',
        'On ne laisse pas sécher complètement un masque à l\'argile. Quand la poudre sèche, elle tire l\'eau de la peau en même temps que le sébum : c\'est là que l\'irritation arrive. Dix à quinze minutes, on retire encore humide, à l\'eau tiède. Si la peau tiraille après un masque, le séchage a été trop loin.',
        'Les argiles ne se mélangent jamais dans un bol métallique : les cations du métal peuvent réagir et l\'argile perd une partie de son intérêt. Utilisez un bol en verre ou en plastique et une spatule en silicone. Et portez un masque de protection quand vous tamisez une poudre fine : les poumons ne sont pas un atelier.'
      ],
      cles: [
        'Verte pour les peaux grasses, blanche pour les réactives, rose pour les sèches.',
        'Masque préparé juste avant, jamais conservé.',
        'Ne jamais laisser sécher complètement : dix à quinze minutes suffisent.',
        'Jamais de bol métallique, jamais de poudre respirée.'
      ],
      err: [
        'Conserver un masque à l\'argile préparé la veille : il n\'y a aucun conservateur, et l\'argile devient un milieu favorable.',
        'Laisser un masque sécher jusqu\'au craquement : la peau se déshydrate au lieu de se nettoyer.',
        'Préparer un masque dans une boîte de conserve ouverte : l\'argile perd ses propriétés et la boîte s\'oxyde.'
      ]
    },
    {
      t: 'Huiles du continent : baobab, moringa, dattier, nigelle',
      paras: [
        'L\'huile de baobab est riche en acides gras essentiels et en vitamine E, avec un toucher relativement léger pour une huile africaine : elle est agréable en sérum pour peaux matures ou fatiguées, entre 5 et 20 % d\'une formule. Son prix la réserve souvent aux produits « signature ».',
        'L\'huile de moringa, pressée à froid, est plus stable qu\'on ne le croit et s\'utilise en soin du corps et pour les cheveux, de 5 à 15 %. Elle est appréciée pour sa teneur en acide oléique et sa capacité à protéger sans film gras.',
        'L\'huile de dattier (palmier dattier) et l\'huile de nigelle se dosent plus prudemment : 5 à 10 % suffisent dans un mélange, et la nigelle est souvent réservée à un usage ciblé (peaux réactives) plutôt qu\'à une application sur tout le corps. Aucune huile, si noble soit-elle, ne se justifie à 100 % dans un soin : le mélange est plus intéressant et plus stable qu\'une huile seule.',
        'Leur fragilité impose deux règles : acheter en petite quantité et stocker à l\'abri de la lumière et de la chaleur, dans un flacon en verre ambré ou en métal fermé. Une huile de moringa qui a passé six mois sur une étagère au soleil a perdu l\'essentiel de son intérêt.'
      ],
      cles: [
        'Baobab 5–20 %, moringa 5–15 %, dattier et nigelle 5–10 %.',
        'Les huiles fragiles se réservent aux formules où elles font la différence.',
        'Verre ambré, à l\'abri de la chaleur, acheté en petite quantité.',
        'Un mélange d\'huiles protège mieux qu\'une huile unique.'
      ],
      err: [
        'Acheter cinq litres d\'une huile chère « au bon prix » puis la laisser au soleil : la perte est là.',
        'Annoncer un pourcentage d\'huile précieuse à 2 % sur l\'étiquette comme argument principal : la quantité ne soutient pas la promesse.',
        'Mettre l\'huile de nigelle partout « puisque c\'est bon » : plusieurs utilisateurs réagissent sur une application répétée sur tout le corps.'
      ]
    }
  ],
  c6: [
    {
      t: 'Les mentions obligatoires de l\'étiquette',
      paras: [
        'Une étiquette de cosmétique porte un nombre fini de mentions, et il n\'y en a pas beaucoup. Regroupées dans l\'ordre logique de lecture : la fonction du produit, le nom de la marque, la liste des ingrédients, la quantité nominale, le numéro de lot, la date ou le PAO, le nom et l\'adresse du responsable, le pays d\'origine, les précautions d\'emploi et les conditions de conservation.',
        'Ces mentions ne sont pas décoratives : si l\'un de ces éléments manque, vous ne pouvez pas répondre à une question ou à un rappel. Le numéro de lot et la date sont les deux que l\'on oublie le plus souvent, et ce sont précisément ceux qui servent le jour où il y a un problème.',
        'Le format compte aussi : écriture lisible sans lunettes, en français, contrastée, qui ne s\'efface pas au contact du gras. Un pot dont l\'étiquette se décolle au premier usage laisse passer l\'idée d\'un produit mal fini, même si le contenu est excellent. Investissez dans un joli gabarit imprimé, quitte à coller au rouleau.',
        'Pour une étiquette d\'échelle (savon), on n\'a pas toujours la place : gardez la fonction, la liste INCI, la quantité, le lot, la date, le responsable et les précautions. Le reste peut figurer sur un carton commun de lot, mais mieux vaut l\'écrire deux fois que de le perdre.'
      ],
      cles: [
        'Fonction, marque, INCI, quantité, lot, date/PAO, responsable, origine, précautions, conservation.',
        'Sans numéro de lot, pas de rappel possible.',
        'Lisible, en français, qui ne s\'efface pas.',
        'Sur un savon : les sept mentions essentielles au minimum.'
      ],
      err: [
        'Écrire « savon naturel » comme nom sans indiquer la fonction : « savon surgras à la lavande » renseigne davantage.',
        'Coller un ruban adhésif par-dessus l\'étiquette : il jaunit, se décolle et laisse une trace.',
        'Mettre la liste INCI en tout petit « parce que c\'est moins joli » : c\'est contraire à l\'usage professionnel.'
      ]
    },
    {
      t: 'La liste INCI, dans le bon ordre',
      paras: [
        'INCI signifie « International Nomenclature of Cosmetic Ingredients » : c\'est le nom normalisé de chaque ingrédient, celui qui doit figurer sur l\'étiquette. « Beurre de karité » ne s\'écrit pas ainsi : il s\'écrit « Butyrospermum Parkii Butter ». « Huile de coco » s\'écrit « Cocos Nucifera Oil ».',
        'L\'ordre est strictement décroissant : l\'ingrédient le plus dosé vient d\'abord. Une exception importante : tout ce qui est dosé à moins de 1 % peut être listé dans n\'importe quel ordre, après les autres. C\'est ainsi que l\'on place le conservateur et le parfum en fin de liste, sans révéler leur dosage exact.',
        'L\'eau s\'écrit « Aqua » et arrive très souvent en première place d\'une crème. Les poudres d\'argile s\'écrivent « Kaolin » pour le kaolin blanc, « Montmorillonite » pour l\'argile verte. Les parfums s\'écrivent « Parfum », mais les allergènes contenus doivent être nommés : Limonene, Linalool, Citral, Eugenol, Geraniol, Citronellol, Coumarin, Benzoate de benzyle.',
        'Pour vous simplifier la vie, utilisez un tableau de correspondance et notez-le une fois pour toutes à côté de chaque matière première. L\'application du site reprend cette liste et vous aide à produire une étiquette complète depuis votre recette : recopiez-la ensuite avec soin.'
      ],
      cles: [
        'INCI = nom normalisé international, pas le nom commercial.',
        'Ordre décroissant ; sous 1 %, l\'ordre est libre.',
        'Eau = Aqua ; karité = Butyrospermum Parkii Butter.',
        '« Parfum » plus les allergènes nommés au-dessus du seuil.'
      ],
      err: [
        'Écrire « huile de coco » au lieu de « Cocos Nucifera Oil » : l\'étiquette ne passe pas l\'examen d\'un professionnel.',
        'Mettre des ingrédients actifs en tête de liste alors qu\'ils sont dosés à 1 % : l\'ordre devient mensonger.',
        'Oublier de nommer les allergènes présents dans un parfum naturel : c\'est l\'une des premières causes de réaction.'
      ]
    },
    {
      t: 'PAO, lot, DDM : trois repères dans le temps',
      paras: [
        'La date de fabrication situe le produit dans le temps. Le numéro de lot permet de retrouver la préparation exacte. Le PAO (Period After Opening, période après ouverture) indique combien de mois le produit reste bon après la première ouverture : c\'est le symbole du petit pot ouvert avec « 6M », « 12M » ou « 24M ».',
        'Le PAO se choisit, il ne se devine pas. Un pot de crème à l\'eau, conservé correctement, tient généralement 6 mois après ouverture. Un produit anhydre (un baume sans eau, une huile) peut tenir 12 à 24 mois. Un savon se stocke beaucoup plus longtemps : deux ans dans un endroit sec, avec une date de fabrication.',
        'La DDM (« date de durabilité minimale ») s\'utilise à la place du PAO quand le produit se dégrade avant même d\'être ouvert : « à utiliser avant le… ». C\'est le cas de produits très riches en huiles fragiles, ou vendus par lots à des centres de soin. Dans ce cas, aucune mention de PAO n\'est nécessaire.',
        'En climat chaud et humide, la règle prudente consiste à réduire d\'un cran : là où une fiche technique annonce 12 mois, annoncez 6, et écrivez la date de fabrication sur le pot au marqueur. Un client qui vous fait confiance deux ans plus tard vaut mieux qu\'un argument de durée de vie.'
      ],
      cles: [
        'PAO = nombre de mois après ouverture, dans le petit pot ouvert.',
        'Crème 6M, produit anhydre 12 à 24M, savon 2 ans.',
        'DDM « à utiliser avant » remplace le PAO quand la dégradation précède l\'ouverture.',
        'En climat chaud : réduisez le PAO d\'un cran, annoncez moins.'
      ],
      err: [
        'Écrire « 24M » sur une crème non conservée : le PAO annoncé engage votre responsabilité.',
        'Omettre le numéro de lot : c\'est la seule façon de savoir quelle matière était dans ce pot-là.',
        'Recopier la date sur l\'étiquette à l\'avance, en série, pour tout un stock fabriqué sur plusieurs semaines.'
      ]
    }
  ],
  recettes: [
    {
      t: 'Adapter une recette : les règles de substitution',
      paras: [
        'Une recette est un point de départ, pas une loi. On peut remplacer une huile, une argile, un hydrolat : à condition de respecter le rôle de chaque ingrédient. Dans un savon, remplacer une huile de mousse par une huile douce change la mousse et la dureté de la barre : recalculer la soude et vérifier la recette dans le calculateur avant de produire.',
        'Dans une crème, on remplace un hydrolat par un autre sans autre conséquence qu\'une odeur différente. Remplacer une huile par une autre modifie le toucher et la stabilité : une huile de coco figée à température ambiante ne se substitue pas à du tournesol. Il faut réfléchir au comportement de la matière avant de la mise en pot, pas après.',
        'Dans un masque à l\'argile, tout se remplace facilement. Argile blanche contre argile rose, yaourt contre hydrolat, miel contre glycérine. Le masque n\'a pas besoin d\'être stable : il se prépare et se jette dans la même semaine. C\'est la catégorie idéale pour expérimenter.',
        'Une règle qui vaut partout : ne modifiez qu\'un ingrédient à la fois et notez le résultat. Si vous changez trois choses d\'un coup et que le produit est meilleur, vous ne saurez pas pourquoi, et vous ne pourrez pas le refaire. Un carnet de bord par lot vaut mieux qu\'une mémoire excellente.'
      ],
      cles: [
        'Remplacer un ingrédient en respectant son rôle, pas son apparence.',
        'Savon : toute substitution d\'huile impose un recalcul de la soude.',
        'Masques : tout remplaçant est plus simple, produit éphémère.',
        'Un changement à la fois, et on note.'
      ]
    },
    {
      t: 'Organiser son atelier pour produire vingt pièces sans se fatiguer',
      paras: [
        'Produire en série ne consiste pas à multiplier la recette : cela consiste à organiser les gestes. Préparez deux zones : une zone de pesée (toutes les matières pesées à l\'avance, dans des bols étiquetés) et une zone de mélange (bien dégagée). On pèse tout avant de commencer, et on ne revient plus aux bidons.',
        'Étiquetez chaque bol avec le poids et le nom : huile d\'olive 500 g, karité 250 g, eau 300 g, soude 95 g. Cette discipline évite l\'erreur qui gâche la série entière, sans compter le coût du lot jeté. Un bol non étiqueté est un bol suspect.',
        'Pour vingt pièces, travaillez par lots de 1 à 2 kg d\'huile maximum et répétez si besoin. Au-delà, le mixeur chauffe, la pâte trace trop vite et la dernière partie du mélange est plus dense que la première. Les régularités de poids se mesurent à la découpe : 20 pièces doivent peser presque la même chose.',
        'Notez tout au fur et à mesure : date, heure de la coulée, températures, lot de chaque matière première, observations. Un carnet de production par lot (l\'application le fournit) transforme un accident isolé en information utile : « le lot 12 a figé trop vite, il faisait 36 °C dans l\'atelier » est une phrase qui vaut de l\'argent.'
      ],
      cles: [
        'Deux zones : pesée puis mélange, jamais le mélange avant d\'avoir tout pesé.',
        'Chaque bol étiqueté : nom et poids.',
        'Lots de 1 à 2 kg maximum, répétés plutôt qu\'agrandis.',
        'Le carnet de production n\'est pas administratif : c\'est votre mémoire technique.'
      ],
      err: [
        'Peser au fur et à mesure du mélange : vous oublierez quelque chose.',
        'Faire une série de 10 kg d\'un coup sans expérience : les derniers pots ne ressembleront pas aux premiers.',
        'Écrire toutes les notes à la fin : ce qui n\'a pas été noté sur le moment est perdu.'
      ]
    }
  ],
  'guide-prix': [
    {
      t: 'Les postes que tout le monde oublie',
      paras: [
        'Un produit vendu au prix d\'un autre produit n\'est pas vendu à son prix. Le calcul commence par la matière première, mais il ne s\'arrête jamais là : il faut compter l\'emballage, l\'étiquette, l\'électricité, l\'eau, le gaz, l\'usure du matériel, le temps de travail et la part de pertes. Beaucoup de petits ateliers travaillent à perte sur les trois derniers.',
        'La méthode la plus simple consiste à lister tous les postes sur une seule page, puis à les diviser par le nombre d\'unités produites. Un litre d\'huile à 3 200 F utilisé à hauteur de 200 ml entre dans un lot pour 640 F. Un seau de 5 kg de karité à 14 000 F utilisé à 250 g représente 700 F. Ce sont des divisions, pas des estimations.',
        'Les charges qui ne dépendent pas de la quantité — électricité, gaz, transport, abonnement téléphone — se comptent « à la fabrication » : vous notez combien d\'heures l\'atelier a tourné et vous imputez au lot la part correspondante. Un exemple simple : si un lot de 20 pièces correspond à 3 heures d\'atelier à 500 F par heure de charge, cela ajoute 1 500 F à répartir, soit 75 F par pièce.',
        'Enfin, comptez les pertes. Un débutant perd facilement 10 à 20 % de ses lots ratés, éventés ou périmés. Comptez 10 % de pertes, et vous aurez une image honnête de votre activité. Un atelier qui prétend 0 % de pertes n\'a pas compté sa production réelle.'
      ],
      cles: [
        'Cinq postes : matières, emballage, charges de production, temps, pertes.',
        'Toutes les charges se ramènent à l\'unité : divisez.',
        'Comptez 10 % de pertes au minimum.',
        'Un prix ne se fixe pas au ressenti du marché : il se calcule, puis se compare.'
      ]
    },
    {
      t: 'Coût matière, emballage, étiquette : le calcul complet',
      paras: [
        'Prenons un exemple complet, chiffré en francs CFA, pour un lait corporel de 200 ml produit par lot de 10 pièces. Matières : 700 F de karité, 350 F d\'huile, 150 F d\'hydrolat, 200 F d\'émulsifiant, 100 F de conservateur, 50 F d\'autres ingrédients, soit 1 550 F pour le lot, donc 155 F par pièce.',
        'Emballage : flacon pompe 200 ml à 450 F, étiquette imprimée à 75 F, sachet de protection à 25 F, soit 550 F par pièce. Avec les matières, nous sommes à 705 F de coût direct par pièce.',
        'Temps de travail : 1 h 30 pour la fabrication, le remplissage et le nettoyage. Si vous vous payez 1 000 F de l\'heure, cela fait 1 500 F pour les 10 pièces, soit 150 F par pièce. Charges d\'atelier : 700 F pour le lot (électricité, gaz, eau, usure), soit 70 F par pièce.',
        'Pertes : 10 % du coût direct, soit 70 F. Total : 705 + 150 + 70 + 70 = 995 F par pièce. C\'est votre coût de revient réel. Un produit vendu à 1 000 F ne vous laisse rien : c\'est exactement le piège du « je vends au prix de mes ingrédients ».',
        'À 2 000 F, la marge est de 1 005 F par pièce, soit environ 50 % du prix de vente. C\'est un ordre de grandeur courant en cosmétique artisanale : une marge inférieure à 40 % laisse peu de place pour un invendu, une promotion ou un remplacement.'
      ],
      cles: [
        'Coût direct = matières + emballage.',
        'Ajoutez le temps (tarif horaire × heures), les charges du lot, et 10 % de pertes.',
        'Marge en pourcentage du prix de vente (pas du coût).',
        'Sous 40 % de marge, l\'activité ne survit pas à un invendu.'
      ],
      err: [
        'Oublier de se payer : le temps est le premier poste oublié.',
        'Compter l\'emballage « à part » et l\'exclure du prix de vente : la cliente paie ce que vous décidez de vendre, emballage compris.',
        'Comparer votre prix à celui du savon industriel : ce ne sont pas les mêmes produits, ni les mêmes quantités, ni le même temps.'
      ]
    },
    {
      t: 'Prix de vente, marge et seuil de rentabilité',
      paras: [
        'Il y a deux façons d\'arriver au prix. Par la marge : prix = coût ÷ (1 − marge visée). Pour 995 F de coût et 50 % de marge : 995 ÷ 0,5 = 1 990 F, arrondi à 2 000 F. Par le coefficient : prix = coût × coefficient. Un coefficient de 2 correspond à 50 % de marge, un coefficient de 2,5 à 60 %.',
        'Attention à la confusion classique : une « marge de 100 % » sur le coût n\'est pas 100 % du prix, c\'est 50 %. Si vous achetez 1 000 F et vendez 2 000 F, votre marge est de 1 000 F, soit 50 % du prix de vente et 100 % du coût. Les deux formulations sont vraies, mais elles ne disent pas la même chose.',
        'Le seuil de rentabilité répond à une autre question : combien dois-je vendre pour ne pas perdre d\'argent sur mes charges fixes ? Si vous payez 25 000 F par mois de charges fixes (transport, forfait, petit matériel) et que chaque pièce vendue laisse 1 000 F de marge, il vous faut 25 pièces par mois pour couvrir vos charges. Au-delà, vous gagnez votre vie.',
        'Enfin, distinguez le prix affiché du prix réel. Une promotion de « 2 pour 3 500 F » sur un produit à 2 000 F fait tomber la marge unitaire à 750 F : c\'est viable, à condition de le savoir. Les remises et les cadeaux se calculent : ils se paient sur la marge, jamais sur la matière première.'
      ],
      cles: [
        'Prix = coût ÷ (1 − marge) ou coût × coefficient.',
        'Marge en % du prix, coefficient sur le coût : ne pas confondre.',
        'Seuil = charges fixes du mois ÷ marge par unité.',
        'Les remises se calculent : elles sortent de la marge.'
      ],
      err: [
        'Fixer le prix en copiant le voisin : vous ne connaissez ni son coût, ni sa marge.',
        'Offrir un produit pour faire connaître la marque à chaque visite : ce n\'est plus du marketing, c\'est une perte.',
        'Baisser le prix pour vendre plus, sans avoir calculé si le volume compense la marge perdue.'
      ]
    }
  ]
};

/* ------------------------------------------------------------
   RECETTES DE BASE (pourcentages → le calculateur du site fait les grammes)
   ------------------------------------------------------------ */
export const RECETTES_BASE: Record<string, Recette[]> = {
  c1: [
    {
      nom: 'Savon de base 500 g d\'huiles',
      lot: 'Pour 500 g d\'huiles · surgraissage 5 %',
      ing: [['Huile d\'olive', 40], ['Huile de coco', 25], ['Beurre de karité', 20], ['Huile de palme', 10], ['Huile de ricin', 5]],
      mode: [
        'Peser les huiles et les faire fondre doucement au bain-marie (le karité fond le dernier).',
        'Peser 165 g d\'eau froide, puis verser 69 g de soude dans l\'eau, jamais l\'inverse. Laisser redescendre à 40 °C.',
        'Mélanger huiles et eau/soude quand les deux sont entre 38 et 40 °C, à 5 °C près.',
        'Remuer 1 minute à la main, puis mixer par impulsions immergées jusqu\'à la trace légère.',
        'Verser dans le moule, couvrir, laisser 24 à 48 h avant démoulage, puis découper.',
        'Cure 4 à 6 semaines sur grille aérée, à l\'ombre, retournée chaque semaine.'
      ],
      astuce: 'Le calcul vient du tableau des huiles : 200 g d\'olive × 0,134 + 125 g de coco × 0,183 + 100 g de karité × 0,128 + 50 g de palme × 0,141 + 25 g de ricin × 0,128 = 72,7 g de soude exacte, réduite de 5 % = 69,1 g.'
    },
    {
      nom: 'Savon doux au miel et au lait',
      lot: 'Pour 500 g d\'huiles · surgraissage 8 %',
      ing: [['Huile d\'olive', 45], ['Beurre de karité', 20], ['Huile de coco', 20], ['Huile d\'avocat', 10], ['Huile de ricin', 5], ['Miel', 2], ['Lait en poudre', 2]],
      mode: [
        'Remplacer 30 g d\'eau par du lait en poudre délayé, pour la douceur de la barre.',
        'Réduire la soude de 8 % au lieu de 5 % : la barre reste plus douce pour un savon visage.',
        'Ajouter le miel à la trace légère, en mélangeant vite : le miel accélère la prise.',
        'Mouler, couvrir, démouler à 24 h si l\'atelier est frais, sinon 48 h.'
      ],
      astuce: 'Le miel chauffe la pâte : après l\'ajout, coulez dans le moule sans attendre.'
    }
  ],
  c2: [
    {
      nom: 'Gel douceur 250 ml',
      lot: 'Pour 250 g de produit fini · pH 5,0 à 5,2',
      ing: [['Eau déminéralisée', 68], ['Base moussante douce (coco-glucoside)', 20], ['Bétaïne de coco', 7], ['Glycérine végétale', 2], ['Épaississant liquide', 2], ['Conservateur large spectre', 0.9], ['Huile essentielle de lavande', 0.3]],
      mode: [
        'Verser l\'eau dans un bol propre, ajouter le tensioactif doux et la bétaïne en remuant lentement, sans fouetter.',
        'Ajouter l\'épaississant liquide et laisser reposer 20 minutes : la texture se développe.',
        'Mesurer le pH ; ajuster à 5,0–5,2 avec quelques gouttes d\'acide citrique à 10 %, en remesurant.',
        'Ajouter la glycérine, puis l\'huile essentielle, puis le conservateur, en remuant entre chaque.',
        'Siphonner ou verser dans un flacon pompe propre. Noter la date et le numéro de lot.'
      ],
      astuce: 'Si le gel est trop liquide, ajoutez l\'épaississant par 0,5 % : au-delà, la texture devient filante.'
    }
  ],
  c3: [
    {
      nom: 'Crème de jour légère 100 g',
      lot: 'Pour 100 g finis · huile dans eau · pH 5,2',
      ing: [['Eau florale de fleur d\'oranger', 62], ['Huile de baobab', 10], ['Huile de coco', 5], ['Émulsifiant', 6], ['Glycérine végétale', 3], ['Alcool cétylique', 2], ['Conservateur large spectre', 0.9], ['Actif léger (vitamine E)', 0.5]],
      mode: [
        'Chauffer au bain-marie, séparément, la phase aqueuse (eau florale + glycérine) et la phase huileuse (huiles + émulsifiant + alcool cétylique) à 70–75 °C.',
        'Verser la phase huileuse dans la phase aqueuse en remuant sans arrêt, puis homogénéiser au mixeur immergé par impulsions de 3 secondes, environ 2 minutes.',
        'Refroidir en remuant régulièrement jusqu\'à 40 °C : la crème épaissit.',
        'Ajouter l\'actif puis le conservateur, mélanger, mesurer le pH et ajuster si besoin.',
        'Remplir un pot propre, inscrire la date, le numéro de lot et le PAO (6M).'
      ],
      astuce: 'Ajustez le toucher avec l\'alcool cétylique : 1 % de plus épaissit, 1 % de moins fluidifie.'
    }
  ],
  c4: [
    {
      nom: 'Lait corporel au karité 200 ml',
      lot: 'Pour 200 g finis · pH 5,3',
      ing: [['Eau déminéralisée', 74], ['Beurre de karité brut', 8], ['Huile de tournesol', 4], ['Émulsifiant', 5], ['Glycérine végétale', 4], ['Épaississant (xanthane)', 0.8], ['Conservateur large spectre', 0.9], ['Panthénol', 1]],
      mode: [
        'Faire fondre le karité lentement à 70 °C, ajouter l\'émulsifiant et l\'huile de tournesol.',
        'Chauffer l\'eau à 70 °C, la verser en filet sur la phase grasse en remuant.',
        'Mixer immergé 2 minutes, puis incorporer le xanthane dispersé dans un peu de glycérine.',
        'Refroidir à 40 °C, ajouter le panthénol et le conservateur, mesurer le pH.',
        'Remplir, étiqueter, conserver un échantillon de lot.'
      ],
      astuce: 'Le xanthane se disperse mieux dans la glycérine que dans l\'eau : il ne fait pas de grumeaux.'
    }
  ],
  c5: [
    {
      nom: 'Masque à l\'argile verte, peaux grasses',
      lot: 'Pour un usage immédiat (20 g)',
      ing: [['Argile verte', 40], ['Eau florale de menthe', 55], ['Glycérine végétale', 5]],
      mode: [
        'Mélanger l\'argile et l\'eau florale dans un bol en verre, avec une spatule non métallique.',
        'Ajouter la glycérine et lisser : la texture doit être celle d\'une crème épaisse.',
        'Appliquer en couche de 2 mm, éviter le contour des yeux, laisser 10 à 15 minutes sans laisser sécher.',
        'Rincer à l\'eau tiède, puis appliquer une huile légère.'
      ],
      astuce: 'Une argile préparée ne se garde pas : préparez la dose du jour et jetez le reste.'
    },
    {
      nom: 'Gommage au savon noir et au miel',
      lot: 'Pour 150 g finis',
      ing: [['Savon noir traditionnel', 45], ['Miel', 25], ['Huile de coco', 15], ['Sucre roux fin', 10], ['Huile de moringa', 5]],
      mode: [
        'Faire tiédir l\'huile de coco jusqu\'à ce qu\'elle soit souple, sans la chauffer.',
        'Mélanger le savon noir et le miel, puis ajouter l\'huile de coco.',
        'Ajouter le sucre en dernier, juste avant l\'usage : il se dissout dans le temps.',
        'Conserver dans un pot en verre à l\'abri de l\'humidité, usage en 3 mois.'
      ],
      astuce: 'Le sucre ajouté au moment de l\'usage garde le gommage actif jusqu\'au dernier pot.'
    }
  ],
  recettes: [
    {
      nom: 'Savon à froid de référence (500 g d\'huiles)',
      lot: 'Surgraissage 5 %',
      ing: [['Huile d\'olive', 40], ['Huile de coco', 25], ['Beurre de karité', 20], ['Huile de palme', 10], ['Huile de ricin', 5]],
      mode: ['Voir le livre Savonnerie à froid, chapitre « Calculer la soude ».', 'Soude : 69 g, eau : 165 g, températures 38–40 °C.'],
      astuce: 'Base universelle : changez une seule huile à la fois pour comparer.'
    },
    {
      nom: 'Gel douceur (250 g)',
      lot: 'pH 5,0–5,2',
      ing: [['Eau déminéralisée', 68], ['Coco-glucoside', 20], ['Bétaïne de coco', 7], ['Glycérine', 2], ['Épaississant liquide', 2], ['Conservateur', 0.9], ['Huile essentielle', 0.3]],
      mode: ['Tensioactifs dans l\'eau, sans fouetter.', 'Épaississant, repos 20 min.', 'pH, actifs, conservateur, flacon.'],
      astuce: 'Le pH se remesure après trois semaines : c\'est le contrôle qui compte.'
    },
    {
      nom: 'Crème de jour (100 g)',
      lot: 'Huile dans eau · pH 5,2',
      ing: [['Hydrolat', 62], ['Huile de baobab', 10], ['Huile de coco', 5], ['Émulsifiant', 6], ['Glycérine', 3], ['Alcool cétylique', 2], ['Conservateur', 0.9], ['Vitamine E', 0.5]],
      mode: ['Deux phases à 70–75 °C.', 'Émulsionner, refroidir à 40 °C.', 'Actif, conservateur, pH, pot.'],
      astuce: 'Notez l\'aspect du pot témoin à J+1, J+7 et J+21 : c\'est votre test de stabilité.'
    },
    {
      nom: 'Lait corporel au karité (200 g)',
      lot: 'pH 5,3',
      ing: [['Eau', 74], ['Karité brut', 8], ['Tournesol', 4], ['Émulsifiant', 5], ['Glycérine', 4], ['Xanthane', 0.8], ['Conservateur', 0.9], ['Panthénol', 1]],
      mode: ['Karité fondu à 70 °C.', 'Émulsion, xanthane dans la glycérine.', '40 °C : panthénol, conservateur.'],
      astuce: 'Un lait qui « tire » sur la peau manque d\'émulsifiant, pas de karité.'
    },
    {
      nom: 'Baume nourrissant karité-cacao (100 g)',
      lot: 'Produit anhydre · PAO 12M',
      ing: [['Beurre de karité', 45], ['Beurre de cacao', 20], ['Huile de coco', 20], ['Huile de moringa', 10], ['Fécule de maïs', 3], ['Vitamine E', 1], ['Huile essentielle', 1]],
      mode: ['Fondre les beurres à 60 °C, laisser redescendre à 45 °C.', 'Ajouter les huiles, la fécule, la vitamine E.', 'Parfumer, couler, laisser figer 12 h à température ambiante.'],
      astuce: 'La fécule enlève l\'effet gras : c\'est ce qui distingue un baume agréable d\'un beurre collant.'
    },
    {
      nom: 'Masque argile blanche, peaux réactives (20 g)',
      lot: 'Préparation du jour',
      ing: [['Argile blanche (kaolin)', 40], ['Hydrolat de camomille', 50], ['Glycérine', 5], ['Miel', 5]],
      mode: ['Mélanger, appliquer 10 minutes, retirer avant séchage.', 'Rincer à l\'eau tiède.'],
      astuce: 'Jamais plus de 15 minutes : un masque qui craquelle assèche la peau.'
    }
  ]
};

/* ------------------------------------------------------------
   FICHES À IMPRIMER (la partie arrachable du livre)
   ------------------------------------------------------------ */
export const FICHES: Array<{ titre: string; lignes: string[] }> = [
  {
    titre: 'Calcul de la soude, en 4 lignes',
    lignes: [
      '1. Soude exacte = Σ (grammes d\'huile × indice SAP de cette huile).',
      '2. Soude à peser = soude exacte × (1 − surgraissage). Exemple : 5 % → × 0,95.',
      '3. Eau à peser = 30 à 38 % du poids des huiles. 33 % pour un premier savon.',
      '4. Températures : huiles et eau/soude entre 38 et 40 °C, à 5 °C près.',
      'Rappel : un indice en KOH se divise par 1,403 pour devenir un indice en soude.',
      'Exemple 500 g : olive 200 × 0,134 ; coco 125 × 0,183 ; karité 100 × 0,128 ; palme 50 × 0,141 ; ricin 25 × 0,128 = 72,7 g, réduits de 5 % = 69,1 g. Eau : 165 g.'
    ]
  },
  {
    titre: 'Conversions et températures',
    lignes: [
      '1 cuillère à soupe rase ≈ 15 g d\'eau, ≈ 12 g d\'huile, ≈ 10 g de poudre.',
      '1 cuillère à café rase ≈ 5 g d\'eau, ≈ 4 g d\'huile, ≈ 3 g d\'argile.',
      'Volume → poids : multipliez par la densité (tableau des densités ci-contre).',
      '°F = (°C × 9/5) + 32 ; °C = (°F − 32) × 5/9.',
      'Bain-marie pour les cires et les beurres : environ 70 °C.',
      'Stérilisation des pots en verre : 90 °C, puis séchage tête en bas.'
    ]
  },
  {
    titre: 'Fiche de lot (à recopier pour chaque fabrication)',
    lignes: [
      'Numéro de lot : …………………   Date : ……… / ……… / ………',
      'Produit : ……………………………………………………   Quantité produite : ………………',
      'Matières premières (nom, fournisseur, lot) : ………………………………………………………',
      'Pesées : ……………………………………………   Températures relevées : ……………',
      'pH mesuré : ……………   Aspect : ……………   Odeur : ……………',
      'Contrôles : J+1 …………   J+7 …………   J+21 …………',
      'Observations / incident : ……………………………………………………………………………',
      'Échantillon conservé (oui / non) : ……………   Prochain contrôle : ……………'
    ]
  },
  {
    titre: 'Coût de revient unitaire (à remplir une fois par produit)',
    lignes: [
      'Matières premières pour le lot : …………… F   ÷ …………… pièces = …………… F',
      'Emballage + étiquette : …………… F par pièce',
      'Temps de travail : …………… h × …………… F/h ÷ …………… pièces = …………… F',
      'Charges du lot (électricité, gaz, transport) : …………… F ÷ …………… pièces = …………… F',
      'Pertes (10 % du coût direct) : …………… F',
      'Coût de revient réel : …………… F par pièce',
      'Prix de vente = coût ÷ (1 − marge). Pour 50 % : coût × 2. Pour 60 % : coût × 2,5.',
      'Marge dégagée par pièce : …………… F   Seuil mensuel : charges fixes ÷ marge = …………… pièces'
    ]
  },
  {
    titre: 'Précautions à écrire sur l\'étiquette',
    lignes: [
      'Usage externe. Ne pas avaler. Tenir hors de portée des enfants.',
      'Éviter le contact avec les yeux ; en cas de contact, rincer à l\'eau claire.',
      'Conserver à l\'abri de la chaleur et de la lumière, au-dessous de 30 °C.',
      'En cas de réaction, cesser l\'emploi et consulter un professionnel de santé.',
      'Produit artisanal fabriqué au Bénin — responsable : (nom, ville, téléphone).',
      'Ne pas appliquer sur une peau lésée. Faire un essai dans le pli du coude si peau sensible.'
    ]
  }
];
