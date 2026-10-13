/* ============================================================
   INCI — noms normalisés des ingrédients
   Sert à construire une étiquette complète : nom INCI, ordre
   décroissant, et allergènes à déclarer quand un parfum ou une huile
   essentielle est utilisée. C'est une table de correspondance, pas une
   liste exhaustive : on l'enrichit au fur et à mesure des formules.
   ============================================================ */

export const INCI: Record<string, string> = {
  'eau': 'Aqua', 'eau demineralisee': 'Aqua', 'eau déminéralisée': 'Aqua',
  'hydrolat': 'Aqua', 'eau florale': 'Aqua', 'hamamelis': 'Hamamelis Virginiana Water',
  'aloe': 'Aloe Barbadensis Leaf Juice',
  'huile olive': 'Olea Europaea Fruit Oil', "huile d'olive": 'Olea Europaea Fruit Oil',
  'olive': 'Olea Europaea Fruit Oil',
  'coco': 'Cocos Nucifera Oil', 'huile de coco': 'Cocos Nucifera Oil',
  'karite': 'Butyrospermum Parkii Butter', 'beurre de karite': 'Butyrospermum Parkii Butter',
  'cacao': 'Theobroma Cacao Seed Butter', 'beurre de cacao': 'Theobroma Cacao Seed Butter',
  'palme': 'Elaeis Guineensis Oil', 'huile rouge': 'Elaeis Guineensis Oil',
  'palmiste': 'Elaeis Guineensis Kernel Oil',
  'ricin': 'Ricinus Communis Seed Oil', 'huile de ricin': 'Ricinus Communis Seed Oil',
  'tournesol': 'Helianthus Annuus Seed Oil', 'huile de tournesol': 'Helianthus Annuus Seed Oil',
  'avocat': 'Persea Gratissima Oil', 'sesame': 'Sesamum Indicum Seed Oil',
  'baobab': 'Adansonia Digitata Seed Oil', 'nigelle': 'Nigella Sativa Seed Oil',
  'moringa': 'Moringa Oleifera Seed Oil', 'dattier': 'Phoenix Dactylifera Seed Oil',
  'amande douce': 'Prunus Amygdalus Dulcis Oil', 'jojoba': 'Simmondsia Chinensis Seed Oil',
  'glycerine': 'Glycerin', 'glycérine': 'Glycerin', 'glycerine vegetale': 'Glycerin',
  'miel': 'Mel',
  'tensioactif': 'Coco-Glucoside', 'coco-glucoside': 'Coco-Glucoside', 'coco glucoside': 'Coco-Glucoside',
  'sles': 'Sodium Laureth Sulfate', 'base moussante sles': 'Sodium Laureth Sulfate',
  'betaine': 'Cocamidopropyl Betaine', 'bétaïne de coco': 'Cocamidopropyl Betaine',
  'betaine de coco': 'Cocamidopropyl Betaine',
  'emulsifiant': 'Cetearyl Olivate', 'émulsifiant': 'Cetearyl Olivate',
  'alcool cetylique': 'Cetyl Alcohol', 'alcool cétylique': 'Cetyl Alcohol',
  'alcool cetostearylique': 'Cetearyl Alcohol',
  'xanthane': 'Xanthan Gum', 'gomme xanthane': 'Xanthan Gum',
  'conservateur': 'Phenoxyethanol', 'phenoxyethanol': 'Phenoxyethanol',
  'conservateur large spectre': 'Phenoxyethanol',
  'sorbate de potassium': 'Potassium Sorbate', 'benzoate de sodium': 'Sodium Benzoate',
  'vitamine e': 'Tocopherol', 'tocopherol': 'Tocopherol',
  'panthenol': 'Panthenol', 'panthénol': 'Panthenol',
  'allantoine': 'Allantoin', 'uree': 'Urea', 'urée': 'Urea',
  'acide citrique': 'Citric Acid', 'acide lactique': 'Lactic Acid',
  'acide salicylique': 'Salicylic Acid', 'niacinamide': 'Niacinamide',
  'argile': 'Kaolin', 'argile blanche': 'Kaolin', 'kaolin': 'Kaolin',
  'argile verte': 'Montmorillonite', 'argile rose': 'Kaolin',
  'ghassoul': 'Moroccan Lava Clay', 'rhassoul': 'Moroccan Lava Clay',
  'amidon': 'Zea Mays Starch', 'amidon de mais': 'Zea Mays Starch', 'fecule': 'Zea Mays Starch',
  'silice': 'Silica', 'poudre de riz': 'Oryza Sativa Powder',
  'sucre': 'Sucrose', 'sucre roux': 'Sucrose', 'miel de fleurs': 'Mel',
  'savon noir': 'Potassium Olivate', 'savon noir traditionnel': 'Potassium Olivate',
  'savon de marseille': 'Sodium Olivate',
  'huile essentielle de lavande': 'Lavandula Angustifolia Oil', 'lavande': 'Lavandula Angustifolia Oil',
  'huile essentielle de menthe': 'Mentha Piperita Oil', 'menthe poivree': 'Mentha Piperita Oil',
  'tea tree': 'Melaleuca Alternifolia Leaf Oil',
  'parfum': 'Parfum', 'fragrance': 'Parfum',
  'huile de moringa': 'Moringa Oleifera Seed Oil',
  'beurre de sal': 'Shorea Robusta Seed Butter',
  'cire d abeille': 'Cera Alba', "cire d'abeille": 'Cera Alba', 'cire dabeille': 'Cera Alba',
  'cire de carnauba': 'Copernicia Cerifera Cera',
  'lait de coco': 'Cocos Nucifera Fruit Extract', 'yaourt': 'Yogurt'
};

/** Allergènes connus des huiles essentielles et parfums les plus courants
    (à déclarer au-dessus de 0,001 % dans un produit qui reste sur la peau,
    et de 0,01 % dans un produit rincé). */
export const ALLERGENES: Record<string, string[]> = {
  'lavande': ['Limonene', 'Linalool', 'Geraniol'],
  'huile essentielle de lavande': ['Limonene', 'Linalool', 'Geraniol'],
  'menthe poivree': ['Limonene', 'Linalool'],
  'huile essentielle de menthe': ['Limonene', 'Linalool'],
  'tea tree': ['Limonene'],
  'citron': ['Limonene', 'Citral'],
  'orange': ['Limonene', 'Citral'],
  'eucalyptus': ['Limonene', 'Citral', 'Linalool'],
  'ylang ylang': ['Linalool', 'Benzyl Benzoate', 'Benzyl Salicylate'],
  'parfum': ['selon la composition du parfum : demandez la fiche au fournisseur'],
  'geranium': ['Citronellol', 'Geraniol', 'Linalool'],
  'romarin': ['Limonene', 'Linalool', 'Camphor']
};

/** Enlève accents et ponctuation pour retrouver une entrée malgré l'orthographe. */
export const cle = (nom: string) => nom
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/** Cherche le nom INCI d'un ingrédient tel qu'il a été tapé. */
export function inciDe(nom: string): { inci: string; connu: boolean } {
  const c = cle(nom);
  if (INCI[c]) return { inci: INCI[c], connu: true };
  /* correspondance partielle : « huile essentielle de lavande bio » → lavande */
  const trouve = Object.keys(INCI).filter(k => c.includes(k)).sort((a, b) => b.length - a.length)[0];
  if (trouve) return { inci: INCI[trouve], connu: true };
  return { inci: nom.trim(), connu: false };
}

export function allergenesDe(nom: string): string[] {
  const c = cle(nom);
  if (ALLERGENES[c]) return ALLERGENES[c];
  const trouve = Object.keys(ALLERGENES).filter(k => c.includes(k)).sort((a, b) => b.length - a.length)[0];
  return trouve ? ALLERGENES[trouve] : [];
}

/** Construit la liste INCI ordonnée (du plus dosé au moins dosé, puis le reste). */
export function listeInci(ingredients: Array<{ nom: string; pourcent?: number }>) {
  const lignes = ingredients.map(i => {
    const r = inciDe(i.nom);
    const allergenes = allergenesDe(i.nom);
    return { nom: i.nom, inci: r.inci, connu: r.connu, pourcent: i.pourcent ?? 0, allergenes };
  });
  const gros = lignes.filter(l => l.pourcent >= 1).sort((a, b) => b.pourcent - a.pourcent);
  const petits = lignes.filter(l => l.pourcent < 1);
  const ordre = gros.concat(petits).map(l => l.inci);
  const inconnus = lignes.filter(l => !l.connu).map(l => l.nom);
  const allergenes = Array.from(new Set(lignes.flatMap(l => l.allergenes)));
  return { lignes, liste: ordre.join(', '), allergenes, inconnus };
}
