/* ============================================================
   V3 — OUTILS MÉTIER
   ------------------------------------------------------------
   B1 calculateur de formulation · B2 assistant saponification
   B3 convertisseur et tables · B4 carnet de production
   B5 réglementaire et étiquetage · B6 mes recettes
   Chaque outil calcule pour de vrai : les tables (indice de
   saponification, densités, dosages) sont dans le fichier, aucune
   requête externe, donc tout marche hors ligne.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte, fcfa = V3.fcfa;

/* ------------------------------------------------------------
   TABLES DE RÉFÉRENCE
   ------------------------------------------------------------ */
/* huiles et beurres : SAP NaOH (g de soude pour 1 g d'huile), dureté, nettoie,
   conditionne, mousse, crémeux (0–100), densité, prix indicatif F/kg, usage */
const HUILES = [
  { id: 'coco',      nom: 'Coco (vierge)',        sap: 0.183, dur: 79, net: 67, cond: 10, mousse: 67, cremeux: 12, d: 0.92, prix: 2500, max: 30, note: 'Mousse généreuse, nettoyant. Max 30 % en savon.' },
  { id: 'palmiste',  nom: 'Palmiste',             sap: 0.194, dur: 70, net: 60, cond: 14, mousse: 62, cremeux: 16, d: 0.91, prix: 1200, max: 30, note: 'Comme la coco, moins chère, mousse un peu moins fine.' },
  { id: 'palme',     nom: 'Palme',                sap: 0.141, dur: 44, net: 20, cond: 22, mousse: 20, cremeux: 44, d: 0.90, prix: 1000, max: 40, note: 'Dureté et tenue. Choisir RSPO/huile rouge locale.' },
  { id: 'olive',     nom: 'Olive',                sap: 0.134, dur: 15, net: 0, cond: 45, mousse: 12, cremeux: 19, d: 0.91, prix: 3200, max: 70, note: 'Douceur, savon long à durcir. Idéale avec un beurre.' },
  { id: 'karite',    nom: 'Karité (brut)',        sap: 0.128, dur: 39, net: 0, cond: 62, mousse: 12, cremeux: 30, d: 0.90, prix: 2800, max: 40, note: 'Nourrit, protège. Le geste cosmétique africain.' },
  { id: 'cacao',     nom: 'Beurre de cacao',      sap: 0.137, dur: 60, net: 0, cond: 35, mousse: 20, cremeux: 55, d: 0.92, prix: 4500, max: 20, note: 'Savon dur et stable, texture velouté.' },
  { id: 'ricin',     nom: 'Ricin',                sap: 0.128, dur: 0, net: 0, cond: 88, mousse: 90, cremeux: 25, d: 0.96, prix: 3000, max: 12, note: 'Mousse fine et stable : 5–10 % suffisent.' },
  { id: 'tournesol', nom: 'Tournesol',            sap: 0.134, dur: 8, net: 0, cond: 55, mousse: 10, cremeux: 15, d: 0.92, prix: 1500, max: 25, note: 'Barre molle : au-delà de 25 % le savon rancit.' },
  { id: 'baobab',    nom: 'Baobab',               sap: 0.132, dur: 12, net: 0, cond: 65, mousse: 15, cremeux: 20, d: 0.91, prix: 6000, max: 20, note: 'Peau mature, éclat. Se dose en petit %.' },
  { id: 'sesame',    nom: 'Sésame',               sap: 0.133, dur: 20, net: 0, cond: 60, mousse: 18, cremeux: 22, d: 0.92, prix: 2600, max: 25, note: 'Contre l\'huile de coco trop décapante.' },
  { id: 'avocat',    nom: 'Avocat',               sap: 0.133, dur: 18, net: 0, cond: 62, mousse: 15, cremeux: 25, d: 0.91, prix: 4000, max: 20, note: 'Peaux très sèches, savon de douceur.' },
  { id: 'nigelle',   nom: 'Nigelle (cumin noir)', sap: 0.135, dur: 10, net: 0, cond: 70, mousse: 12, cremeux: 18, d: 0.92, prix: 7000, max: 12, note: 'Bienfaits reconnus, à réserver au soin.' },
  { id: 'saindoux',  nom: 'Saindoux',             sap: 0.140, dur: 42, net: 0, cond: 45, mousse: 15, cremeux: 45, d: 0.90, prix: 2000, max: 30, note: 'Durée de conservation, savon blanc.' },
  { id: 'ricin-sulf', nom: 'Huile d\'arachide',    sap: 0.137, dur: 22, net: 0, cond: 48, mousse: 14, cremeux: 22, d: 0.91, prix: 2200, max: 30, note: 'Huile locale économique, savon doux.' }
];

/* pourcentage d'eau selon la méthode + additifs classiques */
const ADDITIFS = [
  { id: 'lait',   nom: 'Lait (poudre)',      note: 'Remplacer 10 % de l\'eau par du lait reconstitué ; incorporer froid.' },
  { id: 'miel',   nom: 'Miel',               note: '1 à 2 % maximum : accélère la trace et chauffe la barre.' },
  { id: 'argile', nom: 'Argile (kaolin/ghassoul)', note: '1 à 2 % : glissant, adoucit la barre.' },
  { id: 'avoine', nom: 'Flocons d\'avoine',  note: '2 %, exfoliant doux.' },
  { id: 'son',    nom: 'Son de blé / marc de café', note: 'Exfoliant : 1 à 2 %, à la trace.' },
  { id: 'he',     nom: 'Huiles essentielles', note: '0,5 à 2 % ; vérifier les précautions (photosensibles, enfants).' }
];

/* ingrédients de formulation (B1) : prix indicatifs marché Abomey-Calavi */
const INGREDIENTS = [
  { id: 'huile-olive', nom: 'Huile d\'olive', d: 0.91, prix: 3200 },
  { id: 'huile-coco', nom: 'Huile de coco', d: 0.92, prix: 2500 },
  { id: 'karite', nom: 'Beurre de karité', d: 0.90, prix: 2800 },
  { id: 'cacao', nom: 'Beurre de cacao', d: 0.92, prix: 4500 },
  { id: 'ricin', nom: 'Huile de ricin', d: 0.96, prix: 3000 },
  { id: 'tournesol', nom: 'Huile de tournesol', d: 0.92, prix: 1500 },
  { id: 'eau', nom: 'Eau déminéralisée', d: 1.00, prix: 300 },
  { id: 'eau-fleur', nom: 'Eau florale', d: 1.00, prix: 2500 },
  { id: 'glycérine', nom: 'Glycérine végétale', d: 1.26, prix: 3500 },
  { id: 'tensioactif', nom: 'Tensioactif doux (coco-glucoside)', d: 1.05, prix: 4200 },
  { id: 'sles', nom: 'Base moussante SLES', d: 1.05, prix: 1800 },
  { id: 'bétaïne', nom: 'Bétaïne de coco', d: 1.04, prix: 3900 },
  { id: 'emulsifiant', nom: 'Émulsifiant (alcool cétylique + cire)', d: 0.95, prix: 5500 },
  { id: 'conservateur', nom: 'Conservateur large spectre', d: 1.05, prix: 9000 },
  { id: 'argile', nom: 'Argile (kaolin / ghassoul)', d: 1.10, prix: 1200 },
  { id: 'amidon', nom: 'Amidon de maïs', d: 0.60, prix: 900 },
  { id: 'alcool', nom: 'Alcool cétylique', d: 0.82, prix: 4800 },
  { id: 'HE-lavande', nom: 'Huile essentielle de lavande', d: 0.89, prix: 25000 },
  { id: 'parfum', nom: 'Parfum cosmétique', d: 0.95, prix: 18000 },
  { id: 'silice', nom: 'Silice / poudre de riz', d: 1.20, prix: 2000 }
];

/* ------------------------------------------------------------
   B1 — CALCULATEUR DE FORMULATION
   ------------------------------------------------------------ */
let FORM = null;
function pageFormulation(){
  return A.barPage('Calculateur de formulation', `<button class="text-btn ripple" data-act="formRecette">Mes recettes</button>`, `
    <p class="body-medium muted" style="margin:2px 0 12px">Écrivez la recette en pourcentages : l'outil donne les grammes pour votre lot, le coût
      et un prix de vente conseillé.</p>
    <div id="formCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function formulationCharger(){
  const zone = document.getElementById('formCorps');
  if (!zone) return;
  if (!FORM){
    const d = await V3.donnees('formulation', { nom: 'Ma crème', lot: 100, marge: 4, lignes: [
      { ing: 'eau', pct: 70 }, { ing: 'huile-olive', pct: 12 }, { ing: 'karite', pct: 8 },
      { ing: 'emulsifiant', pct: 5 }, { ing: 'glycérine', pct: 4 }, { ing: 'conservateur', pct: 1 }
    ] });
    FORM = d;
    if (!FORM.lignes) FORM.lignes = [];
  }
  formulationPeindre(zone);
}
function coutIngredient(l){
  const ing = INGREDIENTS.find(x => x.id === l.ing) || { prix: 0 };
  const g = (l.pct || 0) / 100 * (FORM.lot || 0);
  return g / 1000 * (ing.prix || 0);
}
function formulationPeindre(zone){
  const total = FORM.lignes.reduce((s, l) => s + (+l.pct || 0), 0);
  const cout = FORM.lignes.reduce((s, l) => s + coutIngredient(l), 0);
  const unite = Math.max(1, +FORM.unites || 1);
  const coutU = cout / unite;
  const prixU = coutU * (+FORM.marge || 4);
  const alertes = [];
  if (Math.abs(total - 100) > 0.5) alertes.push('Le total fait ' + total.toFixed(1) + ' % : il doit faire 100 %.');
  FORM.lignes.forEach(l => {
    const ing = INGREDIENTS.find(x => x.id === l.ing);
    if (ing && ing.id === 'conservateur' && (l.pct || 0) < 0.5 && (FORM.lignes.some(x => ['eau', 'eau-fleur'].includes(x.ing)))) {
      alertes.push('Conservateur trop bas pour un produit contenant de l\'eau (0,5 à 1 % en général).');
    }
  });
  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('Poids du lot', `<div class="v3-champ-inline"><input id="fmLot" type="number" min="10" max="5000" step="10" value="${FORM.lot}"><span>g</span></div>
        <p class="body-small muted" style="margin-top:6px">Nombre d'unités : <input id="fmUnites" class="v3-input-sm" type="number" min="1" max="200" value="${FORM.unites || 1}"></p>`)}
      ${carte('Coût', `<p class="v3-big">${fcfa(coutU)}</p><p class="body-small muted">par unité · ${fcfa(cout)} le lot</p>`)}
    </div>
    ${carte('Prix de vente conseillé', `
      <label class="v3-champ"><span>Coefficient de marge</span>
        <input id="fmMarge" type="range" min="2" max="8" step="0.5" value="${FORM.marge || 4}"><b>× ${(FORM.marge || 4)}</b></label>
      <p class="v3-big" style="color:var(--md-primary)">${fcfa(prixU)}</p>
      <p class="body-small muted">soit ${fcfa(prixU - coutU)} de marge par unité. Les petites marques posent en général ×4 le coût de revient.</p>`, { ico: 'crown' })}
    ${carte('Recette — ' + esc(FORM.nom || 'sans nom'), `
      <div class="v3-table">${FORM.lignes.map((l, i) => {
        const ing = INGREDIENTS.find(x => x.id === l.ing) || { nom: l.ing, prix: 0 };
        const g = (l.pct || 0) / 100 * (FORM.lot || 0);
        return `<div class="v3-tr">
          <select data-fl="${i}" class="v3-select" aria-label="Ingrédient de la ligne ${i + 1}">${INGREDIENTS.map(x => `<option value="${x.id}"${x.id === l.ing ? ' selected' : ''}>${esc(x.nom)}</option>`).join('')}</select>
          <input type="number" min="0" max="100" step="0.5" value="${l.pct}" data-fp="${i}" class="v3-input-sm">
          <span class="v3-td">${g.toFixed(1)} g</span>
          <span class="v3-td muted">${fcfa(coutIngredient(l))}</span>
          <button class="icon-btn ripple" data-fdel="${i}" aria-label="Retirer">${svg('close', 'icon icon--18')}</button>
        </div>`;
      }).join('')}</div>
      <div class="v3-tr v3-tr--total"><span>Total</span><b>${total.toFixed(1)} %</b><span>${(FORM.lot || 0).toFixed(0)} g</span></div>
      ${alertes.length ? alertes.map(a => `<p class="body-small" style="color:var(--md-error);margin-top:8px">${svg('info', 'icon icon--16')} ${esc(a)}</p>`).join('') : '<p class="body-small" style="color:var(--md-success);margin-top:8px">Recette équilibrée ✅</p>'}
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn--tonal ripple" data-act="formAjouter">${svg('plus', 'icon icon--18')} Ajouter un ingrédient</button>
        <button class="btn btn--filled ripple" data-act="formEnregistrer">${svg('jar', 'icon icon--18')} Ranger dans mes recettes</button>
        <button class="btn btn--outlined ripple" data-act="formVider">${svg('refresh', 'icon icon--18')} Remettre à zéro</button>
      </div>`, { ico: 'layers' })}
    ${V3.info('Nom du produit : <input id="fmNom" class="v3-input-sm" style="width:150px" aria-label="Nom du produit" value="' + esc(FORM.nom || '') + '"> — il sera enregistré avec la recette.', 'edit')}
    ${carte('Méthode rapide', `<ol class="v3-points v3-points--simples">
      <li>Désinfectez le plan de travail, le matériel et vos mains.</li>
      <li>Pesez les <b>phases</b> : aqueuse (eau, glycérine) et grasse (huiles, beurres, émulsifiant).</li>
      <li>Chauffez les deux phases à 70–75 °C séparément.</li>
      <li>Versez l'huile dans l'eau en remuant 3 min, puis refroidissez en remuant.</li>
      <li>À moins de 40 °C : conservateur, parfum, actifs fragiles.</li>
      <li>Ajustez le pH (5–5,5), coulez, puis testez 4 semaines de stabilité.</li>
    </ol>`, { ico: 'help' })}`;
}

/* ------------------------------------------------------------
   B2 — ASSISTANT SAPONIFICATION
   ------------------------------------------------------------ */
let SAPO = null;
const gaz = 'NaOH';
function pageSaponification(){
  return A.barPage('Assistant saponification', `<button class="text-btn ripple" data-act="sapoRecette">Mes recettes</button>`, `
    <p class="body-medium muted" style="margin:2px 0 12px">Choisissez vos huiles : l'assistant calcule la soude (NaOH ou potasse), l'eau et les qualités de la barre.</p>
    <div id="sapoCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function saponificationCharger(){
  const zone = document.getElementById('sapoCorps');
  if (!zone) return;
  if (!SAPO){
    const d = await V3.donnees('saponification', { base: 'naoh', surgraissage: 6, concentrationEau: 33, lignes: [
      { h: 'olive', pct: 45 }, { h: 'coco', pct: 25 }, { h: 'karite', pct: 20 }, { h: 'ricin', pct: 10 }
    ] });
    SAPO = d;
    if (!SAPO.lignes) SAPO.lignes = [];
  }
  saponificationPeindre(zone);
}
function sapoCalcul(){
  const base = SAPO.base === 'koh' ? 1.403 : 1;   /* potasse = soude × 1,403 */
  const total = SAPO.lignes.reduce((s, l) => s + (+l.pct || 0), 0) || 1;
  const poids = +SAPO.poids || 1000;
  const masseParPct = poids / total;
  let soude = 0, durs = 0, nets = 0, conds = 0, mousses = 0, cremeux = 0;
  const detail = SAPO.lignes.map(l => {
    const h = HUILES.find(x => x.id === l.h) || { nom: l.h, sap: 0.135, dur: 20, net: 0, cond: 45, mousse: 20, cremeux: 20 };
    const g = (+l.pct || 0) * masseParPct;
    const s = g * h.sap * base;
    soude += s;
    durs += h.dur * (+l.pct || 0) / 100; nets += h.net * (+l.pct || 0) / 100;
    conds += h.cond * (+l.pct || 0) / 100; mousses += h.mousse * (+l.pct || 0) / 100;
    cremeux += h.cremeux * (+l.pct || 0) / 100;
    return { h: h, g: g, soude: s };
  });
  const surgrais = Math.max(0, Math.min(15, +SAPO.surgraissage || 0));
  const soudeUtile = soude * (1 - surgrais / 100);
  const eau = poids * (Math.max(20, Math.min(45, +SAPO.concentrationEau || 33)) / 100);
  return { detail, soude: soudeUtile, soudeBrute: soude, eau, poids, total, durs, nets, conds, mousses, cremeux, surgrais };
}
function barre(texte){
  if (texte === 'Dur') return `<p class="body-small" style="margin:4px 0 0">${svg('info', 'icon icon--16')} Barre trop dure : elle peut se casser. Ajoutez de l'olive ou du ricin.</p>`;
  if (texte === 'Mou') return `<p class="body-small" style="margin:4px 0 0">${svg('info', 'icon icon--16')} Barre molle : elle durcira lentement. Ajoutez coco, palmiste ou karité.</p>`;
  return '';
}
function saponificationPeindre(zone){
  const c = sapoCalcul();
  const q = [
    ['Dureté', c.durs, 'dure et durable', 'molle'],
    ['Nettoyant', c.nets, 'très nettoyant', 'doux'],
    ['Mousse', c.mousses, 'mousse abondante', 'mousse discrète'],
    ['Crémosité', c.cremeux, 'texture crème', 'texture fine'],
    ['Douceur', c.conds, 'très nourrissant', 'peu nourrissant']
  ];
  zone.innerHTML = `
    ${carte('Ma barre', `
      <div class="v3-table">${SAPO.lignes.map((l, i) => {
        const h = HUILES.find(x => x.id === l.h) || { nom: l.h, max: 100 };
        return `<div class="v3-tr">
          <select data-sl="${i}" class="v3-select" aria-label="Huile de la ligne ${i + 1}">${HUILES.map(x => `<option value="${x.id}"${x.id === l.h ? ' selected' : ''}>${esc(x.nom)}</option>`).join('')}</select>
          <input type="number" min="0" max="100" step="1" value="${l.pct}" data-sp="${i}" class="v3-input-sm">
          <span class="v3-td">${((+l.pct || 0) * (c.poids / (c.total || 1))).toFixed(0)} g</span>
          <button class="icon-btn ripple" data-sdel="${i}" aria-label="Retirer">${svg('close', 'icon icon--18')}</button>
        </div>`;
      }).join('')}</div>
      <div class="v3-tr v3-tr--total"><span>Total</span><b>${c.total.toFixed(0)} %</b><span>${c.poids} g</span></div>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn--tonal ripple" data-act="sapoAjouter">${svg('plus', 'icon icon--18')} Ajouter une huile</button>
        <button class="btn btn--outlined ripple" data-act="sapoInverser">${svg('refresh', 'icon icon--18')} NaOH ⇄ potasse</button>
      </div>`, { ico: 'flask' })}
    <div class="v3-grille">
      ${carte('Soude à peser', `<p class="v3-big">${c.soude.toFixed(1)} g</p>
        <p class="body-small muted">${SAPO.base === 'koh' ? 'potasse (KOH)' : 'soude (NaOH)'} · surgraissage ${c.surgrais} %</p>`, { ico: 'drop' })}
      ${carte('Eau', `<p class="v3-big">${c.eau.toFixed(0)} g</p><p class="body-small muted">à ${SAPO.concentrationEau} % du poids des huiles</p>`, { ico: 'drop' })}
    </div>
    ${carte('Réglages', `
      <label class="v3-champ"><span>Poids des huiles</span><input id="spPoids" type="number" min="100" max="20000" step="100" value="${c.poids}"><b>g</b></label>
      <label class="v3-champ"><span>Surgraissage</span><input id="spSur" type="number" min="0" max="15" step="1" value="${c.surgrais}"><b>%</b></label>
      <label class="v3-champ"><span>Eau (% des huiles)</span><input id="spEau" type="number" min="20" max="45" step="1" value="${SAPO.concentrationEau}"><b>%</b></label>
      <p class="body-small muted">Surgraissage conseillé : 5 % pour le corps, 8 % pour un savon visage ou bébé, 3 % pour un savon vaisselle.</p>`, { ico: 'sliders' })}
    ${carte('Qualités de la barre', `<div class="v3-liste">${q.map(x => `<div class="v3-score">
        <span class="v3-score__t"><b>${esc(x[0])}</b><span class="v3-bar"><i style="width:${Math.max(2, Math.min(100, x[1]))}%"></i></span>
        <span class="body-small muted">${x[1] < 30 ? 'plutôt ' + x[3] : x[1] > 60 ? 'plutôt ' + x[2] : 'équilibré'}</span></span>
        <b class="v3-score__v">${Math.round(x[1])}</b></div>`).join('')}</div>
      ${barre(c.durs > 60 ? 'Dur' : c.durs < 25 ? 'Mou' : '')}`, { ico: 'trending' })}
    ${carte('Détail par huile', `<div class="v3-table">${c.detail.map(d => `<div class="v3-tr">
        <span class="v3-td">${esc(d.h.nom)}</span><span class="v3-td">${d.g.toFixed(0)} g</span>
        <span class="v3-td">SAP ${d.h.sap}</span><span class="v3-td muted">soude ${d.soude.toFixed(1)} g</span></div>`).join('')}</div>
      ${c.detail.filter(d => d.h.max && (SAPO.lignes.find(l => l.h === d.h.id) || {}).pct > d.h.max).map(d => `<p class="body-small" style="color:var(--md-error);margin-top:8px">${svg('info', 'icon icon--16')} ${esc(d.h.nom)} : au-delà de ${d.h.max} %, ${esc(d.h.note)}</p>`).join('')}`, { ico: 'chart' })}
    ${carte('Additifs possibles', `<ul class="v3-points v3-points--simples">${ADDITIFS.map(a => `<li><b>${esc(a.nom)}</b> — ${esc(a.note)}</li>`).join('')}</ul>`, { ico: 'leaf' })}
    ${carte('Table des indices de saponification', `<div class="v3-table">${HUILES.map(h => `<div class="v3-tr">
        <span class="v3-td">${esc(h.nom)}</span><span class="v3-td">NaOH ${h.sap}</span><span class="v3-td muted">KOH ${(h.sap * 1.403).toFixed(3)}</span>
        <span class="v3-td muted">max ${h.max} %</span></div>`).join('')}</div>
      <p class="body-small muted" style="margin-top:8px">Indice = grammes de soude (ou potasse) nécessaires par gramme d'huile, pour une saponification complète. L'assistant retire le surgraissage.</p>`, { ico: 'chart' })}
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn--filled ripple" data-act="sapoEnregistrer">${svg('jar', 'icon icon--18')} Ranger dans mes recettes</button>
      <button class="btn btn--outlined ripple" data-act="sapoPartager">${svg('share', 'icon icon--18')} Partager la recette</button>
    </div>
    ${V3.info('Sécurité : versez toujours la soude <b>dans l\'eau</b> (jamais l\'eau dans la soude), gants et lunettes, dans un endroit aéré. La soude brûle gravement.', 'shield')}`;
}

/* ------------------------------------------------------------
   B3 — CONVERTISSEUR ET TABLES
   ------------------------------------------------------------ */
const DENSITES = [
  { id: 'eau', nom: 'Eau', d: 1.00 }, { id: 'huile', nom: 'Huile végétale', d: 0.92 },
  { id: 'glycérine', nom: 'Glycérine', d: 1.26 }, { id: 'alcool', nom: 'Alcool', d: 0.79 },
  { id: 'karite', nom: 'Beurre de karité fondu', d: 0.90 }, { id: 'miel', nom: 'Miel', d: 1.42 },
  { id: 'lait', nom: 'Lait', d: 1.03 }, { id: 'tensio', nom: 'Tensioactif liquide', d: 1.05 }
];
function pageConvertisseur(){
  return A.barPage('Convertisseur et tables', '', `
    <div id="cvCorps"></div>`);
}
function convertisseurCharger(){
  const zone = document.getElementById('cvCorps');
  if (!zone) return;
  zone.innerHTML = `
    ${carte('Températures et dosages', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>°C → °F</span><input id="cvC" type="number" value="70" step="1"><b id="cvF">158 °F</b></label>
        <label class="v3-champ"><span>% d'une préparation</span><input id="cvPct" type="number" value="5" step="0.5"><input id="cvPoids" type="number" value="100" step="10">
          <b id="cvGram">5 g</b></label>
      </div>`)}
    ${carte('Volume ↔ poids', `
      <label class="v3-champ"><span>Ingrédient</span>
        <select id="cvIng" class="v3-select">${DENSITES.map(d => `<option value="${d.d}">${esc(d.nom)} (${d.d})</option>`).join('')}</select></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Millilitres</span><input id="cvMl" type="number" value="100" step="10"></label>
        <label class="v3-champ"><span>Grammes</span><input id="cvG" type="number" value="92" step="10"></label>
      </div>
      <p class="body-small muted" style="margin-top:8px">Densité : le poids d'un millilitre. 100 ml d'huile ne pèsent pas 100 g mais ≈ 92 g — c'est une source d'erreur classique.</p>`)}
    ${carte('Table des dosages usuels', `<div class="v3-table">
      ${[['Conservateur large spectre', '0,5 – 1 %'], ['Parfum cosmétique', '0,5 – 2 %'], ['Huiles essentielles', '0,2 – 1 %'],
         ['Émulsifiant', '3 – 6 %'], ['Glycérine', '2 – 5 %'], ['Beurre de karité (crème)', '5 – 20 %'],
         ['Argile (masque)', '10 – 30 %'], ['Surgraissage savon', '3 – 8 %'], ['Soude dans l\'eau', 'jamais l\'inverse !']]
        .map(x => `<div class="v3-tr"><span class="v3-td">${esc(x[0])}</span><span class="v3-td muted">${esc(x[1])}</span></div>`).join('')}</div>`)}
    ${carte('Table des huiles (bienfaits et dosage)', `<div class="v3-table">${HUILES.map(h => `<div class="v3-tr v3-tr--2">
      <span class="v3-td"><b>${esc(h.nom)}</b><br><span class="body-small muted">${esc(h.note)}</span></span>
      <span class="v3-td muted">${fcfa(h.prix)}/kg</span></div>`).join('')}</div>`, { ico: 'chart' })}`;
}
function convertir(){
  const c = document.getElementById('cvC'), f = document.getElementById('cvF');
  if (c && f) f.textContent = Math.round(+c.value * 9 / 5 + 32) + ' °F';
  const p = document.getElementById('cvPct'), w = document.getElementById('cvPoids'), g = document.getElementById('cvGram');
  if (p && w && g && w.value) g.textContent = ((+p.value || 0) / 100 * (+w.value || 0)).toFixed(2) + ' g';
  const ing = document.getElementById('cvIng'), ml = document.getElementById('cvMl');
  if (ing && ml){
    const d = +ing.value || 1;
    document.getElementById('cvG').value = (Math.round(+ml.value * d * 10) / 10).toString();
  }
}
function mlVersG(){
  const ing = document.getElementById('cvIng'), g = document.getElementById('cvG');
  if (ing && g) document.getElementById('cvMl').value = (Math.round(+g.value / (+ing.value || 1) * 10) / 10).toString();
}

/* ------------------------------------------------------------
   B5 — RÉGLEMENTAIRE : checklist étiquetage et conformité
   ------------------------------------------------------------ */
const CHECKLIST = [
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
function pageReglementaire(){
  return A.barPage('Réglementaire & étiquetage', '', `<div id="rgCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function reglementaireCharger(){
  const zone = document.getElementById('rgCorps');
  if (!zone) return;
  const d = await V3.donnees('reglementaire', { faits: {} });
  const faits = d.faits || {};
  const n = CHECKLIST.filter(c => faits[c.id]).length;
  const pr = Math.round(n / CHECKLIST.length * 100);
  zone.innerHTML = `
    <div class="v3-hero" data-ton="green">
      <span class="v3-hero__ico">${svg('shield', 'icon icon--28')}</span>
      <div><p class="body-medium">Conformité de mon produit : ${pr} %</p>
        <div class="v3-prog"><span class="v3-bar"><i style="width:${pr}%"></i></span><b>${n}/${CHECKLIST.length}</b></div></div>
    </div>
    <div class="v3-liste" style="margin-top:14px">${CHECKLIST.map(c => `
      <div class="v3-check${faits[c.id] ? ' is-fait' : ''}" data-rg="${c.id}">
        <span class="v3-check__box">${faits[c.id] ? svg('check', 'icon icon--18') : ''}</span>
        <span class="v3-check__t"><b>${esc(c.t)}</b><p>${esc(c.d)}</p></span>
      </div>`).join('')}</div>
    ${carte('Modèle d\'étiquette', `
      <div class="v3-etiquette">
        <b>Savon surgras à la lavande</b>
        <span>Savon de toilette pour le corps et les mains</span>
        <span>100 g — Fabriqué au Bénin</span>
        <span>Lot ${esc(new Date().toISOString().slice(0, 10).replace(/-/g, ''))}-01 · Fabriqué le ${esc(V3.dateFr(new Date()))}</span>
        <span>Conserver au sec, à l'abri de la chaleur. À utiliser avant 24 mois.</span>
        <span>Ingrédients : Sodium Olivate, Sodium Cocoate, Butyrospermum Parkii Butter, Sodium Ricinoleate, Lavandula Angustifolia Oil, Linalool.</span>
        <span>Responsable : ${esc(V3.nomCompte())} — Abomey-Calavi, Bénin.</span>
        <span>Usage externe. Éviter le contact avec les yeux. Tenir hors de portée des enfants.</span>
      </div>
      <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-act="rgCopier">${svg('share', 'icon icon--18')} Copier ce modèle</button>`, { ico: 'edit' })}
    ${V3.info('Ce modèle suit les usages UEMOA et la pratique des petites marques : il ne remplace pas l\'avis d\'un service de contrôle. Faites relire votre étiquette avant la première vente.', 'info')}`;
}

/* ------------------------------------------------------------
   B6 / B4 — MES RECETTES ET CARNET DE PRODUCTION
   ------------------------------------------------------------ */
function pageRecettes(){
  return A.barPage('Mes recettes', `<button class="text-btn ripple" data-act="recetteAjouter">Ajouter</button>`, `<div id="recCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function recettesCharger(){
  const zone = document.getElementById('recCorps');
  if (!zone) return;
  const d = await V3.donnees('recettes', { liste: [] });
  const liste = d.liste || [];
  zone.innerHTML = liste.length ? `
    ${V3.info('Vos recettes sont enregistrées sur votre compte : vous les retrouvez sur tous vos appareils.', 'cloud')}
    <div class="v3-liste">${liste.map((r, i) => `
      <div class="list-row">
        <span class="list-row__ico" style="background:var(--md-secondary-container);color:var(--md-on-secondary-container)">${svg(r.type === 'savon' ? 'flask' : 'jar', 'icon icon--20')}</span>
        <span class="list-row__main">
          <h3>${esc(r.nom)}</h3>
          <p>${esc(r.type === 'savon' ? 'Savon' : 'Formulation')} · ${esc(V3.quand(r.quand))}${r.lot ? ' · ' + r.lot + ' g' : ''}${r.prix ? ' · ' + fcfa(r.prix) + ' conseillé' : ''}</p>
        </span>
        <button class="icon-btn ripple" data-act="recettePartager" data-i="${i}" aria-label="Partager">${svg('share', 'icon icon--18')}</button>
        <button class="icon-btn ripple" data-act="recetteSuppr" data-i="${i}" aria-label="Supprimer">${svg('close', 'icon icon--18')}</button>
      </div>
      <div class="v3-recette-detail">${(r.lignes || []).map(l => `<span>${esc(l.nom || l)} <b>${esc(String(l.pct || l))}${r.type === 'savon' ? ' %' : ' %'}</b></span>`).join('')}
        ${r.soude ? `<span>Soude <b>${r.soude} g</b></span>` : ''}${r.eau ? `<span>Eau <b>${r.eau} g</b></span>` : ''}</div>`).join('')}</div>`
    : V3.vide('jar', 'Aucune recette enregistrée', 'Le calculateur de formulation et l\'assistant saponification rangent ici leurs résultats.');
}

function pageProduction(){
  return A.barPage('Carnet de production', `<button class="text-btn ripple" data-act="lotAjouter">Nouveau lot</button>`, `<div id="prodCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function productionCharger(){
  const zone = document.getElementById('prodCorps');
  if (!zone) return;
  const d = await V3.donnees('production', { lots: [] });
  const lots = d.lots || [];
  const total = lots.reduce((s, l) => s + (+l.quantite || 0), 0);
  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('Lots enregistrés', `<p class="v3-big">${lots.length}</p><p class="body-small muted">${total} unité(s) produite(s)</p>`)}
      ${carte('Dernier lot', lots.length ? `<p class="v3-big">${esc(lots[0].numero)}</p><p class="body-small muted">${esc(V3.quand(lots[0].date))}</p>` : '<p class="body-small muted">Aucun lot encore.</p>')}
    </div>
    ${lots.length ? `<div class="v3-liste">${lots.map((l, i) => `
      <div class="v3-lot">
        <div class="v3-lot__t"><b>${esc(l.numero)}</b><span class="pill">${esc(l.produit || 'Produit')}</span></div>
        <p class="body-small muted">${esc(V3.dateFr(l.date))} · ${l.quantite || 0} unité(s)${l.pH ? ' · pH ' + esc(l.pH) : ''}</p>
        ${l.notes ? `<p class="body-small" style="margin-top:6px">${esc(l.notes)}</p>` : ''}
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button class="btn btn--sm btn--tonal ripple" data-act="lotVendu" data-i="${i}">Marquer vendu/consommé</button>
          <button class="btn btn--sm btn--outlined ripple" data-act="lotSuppr" data-i="${i}">Supprimer</button>
        </div>
      </div>`).join('')}</div>` : V3.vide('layers', 'Carnet vide', 'Chaque lot produit : date, recette, numéro, pH, observations. C\'est votre traçabilité.')}
    ${V3.info('Le carnet de lot est ce qui prouve la qualité de votre production : gardez-le à jour, c\'est aussi un argument de vente auprès des pharmacies et boutiques.', 'shield')}`;
}

/* ------------------------------------------------------------
   HUB DES OUTILS
   ------------------------------------------------------------ */
const OUTILS = [
  { p: 'formulation', ico: 'beaker', nom: 'Calculateur de formulation', txt: 'Pourcentages → grammes, coût et prix de vente.' },
  { p: 'saponification', ico: 'flask', nom: 'Assistant saponification', txt: 'Soude, eau, surgraissage et qualités de la barre.' },
  { p: 'convertisseur', ico: 'refresh', nom: 'Convertisseur et tables', txt: '°C/°F, ml/g, densités, dosages usuels.' },
  { p: 'reglementaire', ico: 'shield', nom: 'Réglementaire & étiquetage', txt: 'Checklist des mentions obligatoires + modèle.' },
  { p: 'recettes', ico: 'jar', nom: 'Mes recettes', txt: 'Tout ce que vous avez calculé, rangé par compte.' },
  { p: 'production', ico: 'layers', nom: 'Carnet de production', txt: 'Lots, pH, observations, traçabilité.' }
];
function pageOutils(){
  return A.barPage('Outils de l\'artisan', '', `
    <p class="body-medium muted" style="margin:2px 0 14px">Les calculs du métier, faits pour vous — utilisables même sans réseau.</p>
    <div class="v3-liste">${OUTILS.map(o => `<a class="v3-outil ripple" href="/outils/${o.p}" data-page="${o.p}">
      <span class="v3-outil__ico">${svg(o.ico === 'beaker' ? 'flask' : o.ico, 'icon icon--24')}</span>
      <span class="v3-outil__t"><b>${esc(o.nom)}</b><p>${esc(o.txt)}</p></span>
      ${svg('chevron', 'icon')}</a>`).join('')}</div>`);
}

/* ------------------------------------------------------------
   CLICS
   ------------------------------------------------------------ */
document.addEventListener('click', async e => {
  const t = e.target;

  /* ---------- formulation ---------- */
  if (t.closest('[data-act="formAjouter"]')){
    FORM.lignes.push({ ing: 'eau', pct: 0 });
    formulationPeindre(document.getElementById('formCorps')); return;
  }
  const fd = t.closest('[data-fdel]');
  if (fd){ FORM.lignes.splice(+fd.dataset.fdel, 1); formulationPeindre(document.getElementById('formCorps')); return; }
  if (t.closest('[data-act="formVider"]')){
    FORM.lignes = [{ ing: 'eau', pct: 100 }];
    formulationPeindre(document.getElementById('formCorps')); return;
  }
  if (t.closest('[data-act="formEnregistrer"]')){
    const d = await V3.donnees('recettes', { liste: [] });
    const total = FORM.lignes.reduce((s, l) => s + (+l.pct || 0), 0);
    const cout = FORM.lignes.reduce((s, l) => s + coutIngredient(l), 0);
    const nom = (document.getElementById('fmNom') || {}).value || FORM.nom || 'Ma formulation';
    d.liste = (d.liste || []).concat([{ nom: nom, type: 'formule', quand: new Date().toISOString(), lot: FORM.lot,
      prix: (cout / Math.max(1, FORM.unites || 1)) * (FORM.marge || 4),
      lignes: FORM.lignes.map(l => ({ nom: (INGREDIENTS.find(x => x.id === l.ing) || {}).nom || l.ing, pct: l.pct })).concat([{ nom: 'Total', pct: total.toFixed(1) }]) }]);
    await V3.enregistrer('recettes', d);
    await V3.enregistrer('formulation', FORM);
    A.toast('Recette rangée dans « Mes recettes »');
    return;
  }
  if (t.closest('[data-act="formRecette"]')){ A.pushPage('recettes', {}); return; }

  /* ---------- saponification ---------- */
  if (t.closest('[data-act="sapoAjouter"]')){
    SAPO.lignes.push({ h: 'olive', pct: 0 });
    saponificationPeindre(document.getElementById('sapoCorps')); return;
  }
  const sd = t.closest('[data-sdel]');
  if (sd){ SAPO.lignes.splice(+sd.dataset.sdel, 1); saponificationPeindre(document.getElementById('sapoCorps')); return; }
  if (t.closest('[data-act="sapoInverser"]')){
    SAPO.base = SAPO.base === 'koh' ? 'naoh' : 'koh';
    await V3.enregistrer('saponification', SAPO);
    saponificationPeindre(document.getElementById('sapoCorps'));
    A.toast(SAPO.base === 'koh' ? 'Potasse (KOH) : savon liquide' : 'Soude (NaOH) : savon solide');
    return;
  }
  if (t.closest('[data-act="sapoEnregistrer"]')){
    const c = sapoCalcul();
    const d = await V3.donnees('recettes', { liste: [] });
    d.liste = (d.liste || []).concat([{ nom: 'Savon ' + SAPO.lignes.map(l => (HUILES.find(h => h.id === l.h) || {}).nom).join(' / '), type: 'savon',
      quand: new Date().toISOString(), lot: c.poids, soude: c.soude.toFixed(1), eau: c.eau.toFixed(0),
      lignes: SAPO.lignes.map(l => ({ nom: (HUILES.find(h => h.id === l.h) || {}).nom || l.h, pct: l.pct })).concat([{ nom: 'Surgraissage', pct: c.surgrais }]) }]);
    await V3.enregistrer('recettes', d);
    await V3.enregistrer('saponification', SAPO);
    A.toast('Savon rangé dans « Mes recettes »');
    return;
  }
  if (t.closest('[data-act="sapoPartager"]')){
    const c = sapoCalcul();
    const lignes = SAPO.lignes.map(l => '• ' + ((HUILES.find(h => h.id === l.h) || {}).nom || l.h) + ' : ' + l.pct + ' %').join('\n');
    V3.partager('Ma recette de savon', lignes + '\nSoude : ' + c.soude.toFixed(1) + ' g\nEau : ' + c.eau.toFixed(0) + ' g\nSurgraissage : ' + c.surgrais + ' %\n(calculé avec CosmétiLab)');
    return;
  }
  if (t.closest('[data-act="sapoRecette"]')){ A.pushPage('recettes', {}); return; }

  /* ---------- réglementaire ---------- */
  const rg = t.closest('[data-rg]');
  if (rg){
    const d = await V3.donnees('reglementaire', { faits: {} });
    d.faits = d.faits || {};
    if (d.faits[rg.dataset.rg]) delete d.faits[rg.dataset.rg]; else d.faits[rg.dataset.rg] = true;
    await V3.enregistrer('reglementaire', d);
    reglementaireCharger();
    return;
  }
  if (t.closest('[data-act="rgCopier"]')){
    const el = document.querySelector('.v3-etiquette');
    const txt = el ? el.innerText : '';
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(() => A.toast('Modèle d\'étiquette copié'))
      .catch(() => A.dialog({ title: 'Modèle d\'étiquette', text: txt, confirmLabel: 'Fermer', cancel: false, ico: 'edit' }));
    return;
  }

  /* ---------- recettes ---------- */
  if (t.closest('[data-act="recetteAjouter"]')){
    A.dialog({ title: 'Nouvelle recette', text: 'Utilisez le calculateur de formulation ou l\'assistant saponification : ils rangent la recette ici automatiquement.', confirmLabel: 'Ouvrir le calculateur', ico: 'plus' })
      .then(ok => { if (ok) A.pushPage('formulation', {}); });
    return;
  }
  const rs = t.closest('[data-act="recetteSuppr"]');
  if (rs){
    const d = await V3.donnees('recettes', { liste: [] });
    const r = (d.liste || [])[+rs.dataset.i];
    A.dialog({ title: 'Supprimer cette recette ?', text: r ? r.nom : '', confirmLabel: 'Supprimer', danger: true, ico: 'help' }).then(async ok => {
      if (!ok) return;
      d.liste.splice(+rs.dataset.i, 1);
      await V3.enregistrer('recettes', d);
      recettesCharger();
    });
    return;
  }
  const rp = t.closest('[data-act="recettePartager"]');
  if (rp){
    const d = await V3.donnees('recettes', { liste: [] });
    const r = (d.liste || [])[+rp.dataset.i];
    if (!r) return;
    V3.partager(r.nom, (r.lignes || []).map(l => l.nom + ' ' + l.pct + ' %').join('\n'));
    return;
  }

  /* ---------- production ---------- */
  if (t.closest('[data-act="lotAjouter"]')){
    A.dialog({ title: 'Nouveau lot', text: 'Numéro automatique, date du jour : il ne reste qu\'à décrire le produit et les observations.', confirmLabel: 'Créer le lot', ico: 'layers' })
      .then(async ok => { if (ok) lotCreer(); });
    return;
  }
  const lv = t.closest('[data-act="lotVendu"]');
  if (lv){
    const d = await V3.donnees('production', { lots: [] });
    const l = (d.lots || [])[+lv.dataset.i];
    if (l){ l.statut = 'vendu'; l.venduLe = new Date().toISOString(); await V3.enregistrer('production', d); productionCharger(); A.toast('Lot marqué vendu'); }
    return;
  }
  const ls = t.closest('[data-act="lotSuppr"]');
  if (ls){
    const d = await V3.donnees('production', { lots: [] });
    d.lots.splice(+ls.dataset.i, 1);
    await V3.enregistrer('production', d);
    productionCharger();
    return;
  }
});

/* formulaire de lot : petite boîte de dialogue maison */
async function lotCreer(){
  const d = await V3.donnees('production', { lots: [] });
  const n = (d.lots || []).length + 1;
  const date = new Date();
  const numero = date.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(n).padStart(2, '0');
  const dl = document.getElementById('dialog');
  if (!dl) return;
  dl.classList.add('is-open');
  const corps = dl.querySelector('.dialog__body') || dl;
  const ancien = corps.innerHTML;
  corps.innerHTML = `
    <h3 class="title-medium" style="margin-bottom:10px">Lot ${esc(numero)}</h3>
    <label class="v3-champ"><span>Produit</span><input id="lotProduit" placeholder="Savon surgras lavande"></label>
    <label class="v3-champ"><span>Quantité produite</span><input id="lotQte" type="number" min="1" value="20"></label>
    <label class="v3-champ"><span>pH mesuré</span><input id="lotPH" type="number" step="0.1" placeholder="9.5"></label>
    <label class="v3-champ"><span>Observations</span><input id="lotNotes" placeholder="Trace lente, parfum fort…"></label>
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn btn--outlined ripple" style="flex:1" data-act="lotAnnuler">Annuler</button>
      <button class="btn btn--filled ripple" style="flex:1" data-act="lotValider">Enregistrer</button>
    </div>`;
  const annuler = () => { corps.innerHTML = ancien; dl.classList.remove('is-open'); };
  const valider = async () => {
    d.lots = (d.lots || []).concat([{
      numero: numero, date: date.toISOString(),
      produit: (document.getElementById('lotProduit') || {}).value || 'Produit',
      quantite: +(document.getElementById('lotQte') || {}).value || 0,
      pH: (document.getElementById('lotPH') || {}).value || '',
      notes: (document.getElementById('lotNotes') || {}).value || '',
      statut: 'stock'
    }]);
    await V3.enregistrer('production', d);
    annuler();
    productionCharger();
    A.toast('Lot ' + numero + ' enregistré');
  };
  corps.querySelector('[data-act="lotAnnuler"]').onclick = annuler;
  corps.querySelector('[data-act="lotValider"]').onclick = valider;
}

/* ------------------------------------------------------------
   CHAMPS QUI RECALCULENT TOUT SEULS
   ------------------------------------------------------------ */
document.addEventListener('input', async e => {
  const t = e.target;
  if (t.dataset && t.dataset.fl !== undefined && FORM){
    FORM.lignes[+t.dataset.fl].ing = t.value;
    await V3.enregistrer('formulation', FORM);
    formulationPeindre(document.getElementById('formCorps')); return;
  }
  if (t.dataset && t.dataset.fp !== undefined && FORM){
    FORM.lignes[+t.dataset.fp].pct = +t.value || 0;
    clearTimeout(FORM.__t);
    FORM.__t = setTimeout(() => { V3.enregistrer('formulation', FORM); formulationPeindre(document.getElementById('formCorps')); }, 700);
    return;
  }
  if (t.id === 'fmLot'){ FORM.lot = +t.value || 100; V3.enregistrer('formulation', FORM); formulationPeindre(document.getElementById('formCorps')); return; }
  if (t.id === 'fmUnites'){ FORM.unites = +t.value || 1; V3.enregistrer('formulation', FORM); formulationPeindre(document.getElementById('formCorps')); return; }
  if (t.id === 'fmMarge'){ FORM.marge = +t.value || 4; V3.enregistrer('formulation', FORM); formulationPeindre(document.getElementById('formCorps')); return; }
  if (t.id === 'fmNom'){ FORM.nom = t.value; return; }

  if (t.dataset && t.dataset.sl !== undefined && SAPO){
    SAPO.lignes[+t.dataset.sl].h = t.value;
    await V3.enregistrer('saponification', SAPO);
    saponificationPeindre(document.getElementById('sapoCorps')); return;
  }
  if (t.dataset && t.dataset.sp !== undefined && SAPO){
    SAPO.lignes[+t.dataset.sp].pct = +t.value || 0;
    clearTimeout(SAPO.__t);
    SAPO.__t = setTimeout(() => { V3.enregistrer('saponification', SAPO); saponificationPeindre(document.getElementById('sapoCorps')); }, 700);
    return;
  }
  if (['spPoids', 'spSur', 'spEau'].includes(t.id) && SAPO){
    if (t.id === 'spPoids') SAPO.poids = +t.value || 1000;
    if (t.id === 'spSur') SAPO.surgraissage = +t.value || 0;
    if (t.id === 'spEau') SAPO.concentrationEau = +t.value || 33;
    SAPO.__tmp = { poids: t.value };
    saponificationPeindre(document.getElementById('sapoCorps'));
    V3.enregistrer('saponification', SAPO);
    return;
  }
  if (['cvC', 'cvPct', 'cvPoids', 'cvIng', 'cvMl'].includes(t.id)){ convertir(); return; }
  if (t.id === 'cvG'){ mlVersG(); return; }
});

/* ------------------------------------------------------------
   ÉCRANS
   ------------------------------------------------------------ */
A.PAGES.outils = { single: true, render: pageOutils };
A.PAGES.formulation = { single: true, render: pageFormulation, mount(){ formulationCharger(); } };
A.PAGES.saponification = { single: true, render: pageSaponification, mount(){ saponificationCharger(); } };
A.PAGES.convertisseur = { single: true, render: pageConvertisseur, mount(){ convertisseurCharger(); } };
A.PAGES.reglementaire = { single: true, render: pageReglementaire, mount(){ reglementaireCharger(); } };
A.PAGES.recettes = { single: true, render: pageRecettes, mount(){ recettesCharger(); } };
A.PAGES.production = { single: true, render: pageProduction, mount(){ productionCharger(); } };

window.LHV3OUTILS = { HUILES: HUILES, INGREDIENTS: INGREDIENTS, CHECKLIST: CHECKLIST, DENSITES: DENSITES };
})();
