/* ============================================================
   V3 — APPRENDRE
   ------------------------------------------------------------
   A1 parcours guidés · A2 quiz enrichis (entraînement, tirage
   aléatoire, plusieurs bonnes réponses) · A3 flashcards à
   répétition espacée · A4 fiches de révision · A5 objectifs et
   séries · A6 compétences · A7 correction détaillée.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte, fcfa = V3.fcfa;

/* ------------------------------------------------------------
   1. CONTENU : parcours guidés
   ------------------------------------------------------------ */
const PARCOURS = [
  { id: 'debutante', titre: 'Devenir savonnière débutante', ico: 'flask', ton: 'purple',
    resume: 'Du premier savon à froid jusqu\'au savon parfumé : les gestes de base, dans l\'ordre.',
    pas: [
      { cours: 'c5', titre: 'Connaître les ingrédients', quoi: 'Karité, argile, savon noir : ce qui fait la qualité.' },
      { cours: 'c1', titre: 'Maîtriser la saponification à froid', quoi: 'Calcul de la soude, trace, moule, cure.' },
      { cours: 'c6', titre: 'Étiqueter et vendre sans risque', quoi: 'Les mentions obligatoires et les tests.' }
    ] },
  { id: 'marque', titre: 'Lancer sa marque cosmétique', ico: 'crown', ton: 'amber',
    resume: 'Savoir formuler, produire proprement et vendre : le parcours de celui qui veut en vivre.',
    pas: [
      { cours: 'c1', titre: 'Produire un savon régulier', quoi: 'La recette, le lot, la traçabilité.' },
      { cours: 'c4', titre: 'Élargir sa gamme corps', quoi: 'Laits, baumes, beurres battus.' },
      { cours: 'c6', titre: 'Réglementation et prix', quoi: 'Étiquetage, sécurité, marge.' }
    ] },
  { id: 'visage', titre: 'Spécialiste du soin visage', ico: 'jar', ton: 'pink',
    resume: 'Émulsions, actifs et textures : le visage demande de la précision.',
    pas: [
      { cours: 'c3', titre: 'Comprendre l\'émulsion', quoi: 'Phase grasse, phase aqueuse, émulsifiant, conservateur.' },
      { cours: 'c5', titre: 'Les actifs africains', quoi: 'Karité, baobab, moringa, argile.' },
      { cours: 'c4', titre: 'Le soin corps pour compléter', quoi: 'Une gamme cohérente.' }
    ] },
  { id: 'hygiene', titre: 'Hygiène liquide au quotidien', ico: 'drop', ton: 'blue',
    resume: 'Gels douche, shampoings doux et savons liquides : le plus vendu au quotidien.',
    pas: [
      { cours: 'c2', titre: 'Formuler un gel douche doux', quoi: 'Tensioactifs, pH, épaississants.' },
      { cours: 'c1', titre: 'Compléter avec le savon solide', quoi: 'Zéro déchet, vente au marché.' },
      { cours: 'c6', titre: 'Vendre en règle', quoi: 'Étiquetage et conservation.' }
    ] }
];

/* progression d'un parcours : leçons du cours + quiz réussi */
function progParcours(p){
  let total = 0, fait = 0;
  p.pas.forEach(e => {
    const c = A.coursById(e.cours);
    const t = (c && c.total) || 0;
    total += t + 1;
    fait += Math.min(t, A.leconsFaites(e.cours)) + (reussiQuiz(e.cours) ? 1 : 0);
  });
  return total ? Math.round(fait / total * 100) : 0;
}
const reussiQuiz = cid => ((A.S.quiz[cid] || {}).best || 0) >= 60;

function pageParcours(){
  const cartes = PARCOURS.map(p => {
    const pr = progParcours(p);
    return `<a class="v3-parcours ripple" href="/parcours/${p.id}" data-page="parcoursdetail" data-id="${p.id}">
      <span class="v3-parcours__ico" data-ton="${p.ton}">${svg(p.ico, 'icon icon--28')}</span>
      <span class="v3-parcours__txt">
        <b>${esc(p.titre)}</b>
        <p>${esc(p.resume)}</p>
        <span class="v3-parcours__meta">${p.pas.length} étapes · ${pr} % terminé</span>
        <span class="v3-bar"><i style="width:${pr}%"></i></span>
      </span>
      ${svg('chevron', 'icon')}
    </a>`;
  }).join('');
  return A.barPage('Parcours guidés', '', `
    <p class="body-medium muted" style="margin:2px 0 14px">Un chemin clair, étape par étape : suivez l'ordre et vous saurez faire.</p>
    <div class="v3-liste">${cartes}</div>
    ${V3.info('Votre progression se met à jour toute seule à chaque leçon terminée et à chaque quiz réussi à 60 % ou plus.', 'trending')}`);
}

function pageParcoursDetail(params){
  const p = PARCOURS.find(x => x.id === (params && params.id)) || PARCOURS[0];
  const pr = progParcours(p);
  const etapes = p.pas.map((e, i) => {
    const c = A.coursById(e.cours) || { titre: e.cours, total: 0 };
    const faites = A.leconsFaites(e.cours), total = c.total || 0;
    const fini = total > 0 && faites >= total;
    const quiz = reussiQuiz(e.cours);
    return `<a class="v3-etape${fini ? ' is-fait' : ''} ripple" href="/cours/${e.cours}" data-page="cours" data-id="${e.cours}">
      <span class="v3-etape__n">${fini ? svg('check', 'icon icon--18') : (i + 1)}</span>
      <span class="v3-etape__t">
        <b>${esc(e.titre)}</b>
        <p>${esc(e.quoi)}</p>
        <span class="v3-etape__meta">${esc(c.titre)} · ${faites}/${total} leçons${quiz ? ' · quiz réussi ✅' : ''}</span>
      </span>
      ${svg('chevron', 'icon')}
    </a>`;
  }).join('');
  return A.barPage(p.titre, '', `
    <div class="v3-hero" data-ton="${p.ton}">
      <span class="v3-hero__ico">${svg(p.ico, 'icon icon--28')}</span>
      <div><p class="body-medium">${esc(p.resume)}</p>
        <div class="v3-prog"><span class="v3-bar"><i style="width:${pr}%"></i></span><b>${pr} %</b></div></div>
    </div>
    <div class="v3-liste" style="margin-top:14px">${etapes}</div>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
      <button class="btn btn--filled ripple" data-act="parcoursSuivant" data-id="${p.id}">${svg('play', 'icon icon--18')} Continuer le parcours</button>
      <button class="btn btn--outlined ripple" data-act="parcoursPartager" data-id="${p.id}">${svg('share', 'icon icon--18')} Partager</button>
    </div>`);
}

/* ------------------------------------------------------------
   2. A3 — FLASHCARDS : contenu + répétition espacée
   ------------------------------------------------------------ */
const DECK = [
  /* c1 — savonnerie */
  { c: 'c1', q: 'Que veut dire « saponification à froid » ?', a: 'Mélanger huiles et soude SANS chauffer : la réaction (saponification) chauffe toute seule. Le savon garde la glycérine, donc plus doux pour la peau.' },
  { c: 'c1', q: 'Pourquoi calcule-t-on la soude au gramme près ?', a: 'Trop de soude : savon irritant et qui « pique ». Pas assez : savon mou, gras, qui rancit. On visait toujours un surgraissage de 3 à 8 %.' },
  { c: 'c1', q: 'Qu\'est-ce que le surgraissage ?', a: 'Une part d\'huile laissée non saponifiée (elle ne rencontre pas la soude). On enlève 3 à 8 % de soude au calcul : le savon reste nourrissant.' },
  { c: 'c1', q: 'Qu\'est-ce que « la trace » ?', a: 'Le moment où le mélange épaissit et laisse une trace quand on le remue : la réaction est lancée, on peut parfumer et couler en moule.' },
  { c: 'c1', q: 'Combien de temps dure la cure d\'un savon à froid ?', a: '4 à 6 semaines, au sec et à l\'air. Le savon finit de saponifier, durcit et devient plus doux.' },
  { c: 'c1', q: 'Le savon à froid est-il tout de suite utilisable ?', a: 'Non : frais, il contient encore de la soude active. Il faut la cure (4 à 6 semaines) avant de le vendre ou de l\'utiliser.' },
  { c: 'c1', q: 'Quelle huile donne la mousse la plus abondante ?', a: 'L\'huile de coco (et de palmiste). Attention : très nettoyante, on la garde entre 15 et 30 % de la recette.' },
  { c: 'c1', q: 'Quelle huile rend le savon dur et durable ?', a: 'Le beurre de karité, le beurre de cacao et le saindoux. Le karité apporte aussi du soin (insaponifiable).' },
  { c: 'c1', q: 'Pourquoi éviter l\'huile d\'olive vierge trop foncée en grande quantité ?', a: 'Le savon reste mou plus longtemps et peut tirer sur le vert/brun. On la mélange à une huile dure (karité, coco).' },
  /* c2 — hygiène liquide */
  { c: 'c2', q: 'Quel pH pour un gel douche ou un shampoing ?', a: 'Entre 4,5 et 5,5 : le pH de la peau et du cuir chevelu. Un pH trop élevé décap, un pH trop bas pique.' },
  { c: 'c2', q: 'À quoi sert un conservateur dans un gel douche ?', a: 'À empêcher bactéries, levures et moisissures de se développer dans un produit qui contient de l\'eau. Sans lui, le produit se contamine en quelques jours.' },
  { c: 'c2', q: 'Quels sont les tensioactifs doux pour un shampoing ?', a: 'Les glucosides (coco-glucoside), les dérivés d\'acides aminés (sodium cocoyl glutamate) et l\'isethionate. Ils moussent moins mais respectent le cuir chevelu.' },
  { c: 'c2', q: 'Comment épaissir un gel douche ?', a: 'Avec du sel (chlorure de sodium) par petites pincées, du cocamide DEA, ou en jouant sur le pourcentage de tensioactifs. Toujours mesurer le pH après.' },
  { c: 'c2', q: 'Pourquoi un shampoing « sans sel » n\'existe pas vraiment ?', a: 'Il faut du sel pour épaissir et pour ajuster la viscosité ; « sans sel » veut dire « sans sulfate agressif » dans le langage commercial, pas sans chlorure de sodium.' },
  { c: 'c2', q: 'Que fait un agent conditionneur ?', a: 'Il démêle et adoucit (cationique : il se fixe sur cheveux/peau de charge négative). On le dose en faible quantité dans le shampoing.' },
  /* c3 — émulsion visage */
  { c: 'c3', q: 'Qu\'est-ce qu\'une émulsion ?', a: 'Un mélange stable de deux liquides qui ne se mélangent pas (huile + eau), grâce à un émulsifiant. C\'est la base d\'une crème.' },
  { c: 'c3', q: 'Différence entre émulsion H/E et E/H ?', a: 'H/E : l\'eau est la phase continue — crème légère, pénètre vite. E/H : l\'huile est la phase continue — plus riche, protectrice, effet « barrière ».' },
  { c: 'c3', q: 'Que dose-t-on en général un émulsifiant ?', a: '3 à 6 % de la formule. Trop peu : la crème « déphase » (huile et eau se séparent). Trop : texture collante et savonneuse.' },
  { c: 'c3', q: 'Comment protéger une crème de la contamination ?', a: 'Eau stérile ou bouillie refroidie, matériel désinfecté, conservateur à large spectre, flacon airless ou pompe, et test de stabilité 4 semaines à 40 °C.' },
  { c: 'c3', q: 'Qu\'est-ce qu\'un actif cosmétique « prouvé » ?', a: 'Un ingrédient dont l\'efficacité est démontrée à un dosage précis (niacinamide 2–5 %, vitamine C 10–20 %, acide hyaluronique 0,1–1 %). En dessous, c\'est du marketing.' },
  { c: 'c3', q: 'Pourquoi ajuster le pH d\'une crème ?', a: 'Beaucoup d\'actifs n\'agissent qu\'à un pH précis (vitamine C acide, niacinamide entre 5 et 7) et la peau aime pH ≈ 5. On ajuste à l\'acide citrique ou au triéthanolamine.' },
  /* c4 — corps, karité */
  { c: 'c4', q: 'Comment éviter qu\'un lait corporel « tranche » ?', a: 'Chauffer les deux phases, verser l\'huile dans l\'eau en remuant longtemps, refroidir lentement, et utiliser assez d\'émulsifiant + un gélifiant stabilisant.' },
  { c: 'c4', q: 'Qu\'est-ce qu\'un beurre battu ?', a: 'Du karité (ou autre beurre) battu à froid avec une huile légère jusqu\'à texture « chantilly ». Fond à la peau sans laisser de film gras.' },
  { c: 'c4', q: 'Quel pourcentage d\'huile dans une crème riche ?', a: '20 à 35 % de phase grasse. Au-delà de 40 %, ce n\'est plus une crème mais un baume : ça devient difficile à étaler.' },
  { c: 'c4', q: 'Pourquoi le karité brut est-il beige et pas blanc ?', a: 'Parce qu\'il est non raffiné : il contient les insaponifiables (vitamines, phytostérols) qui font son intérêt. Le karité blanc a été filtré/raffiné.' },
  { c: 'c4', q: 'Quelle huile pour une peau très sèche ?', a: 'Le baobab, l\'avocat, le sésame ou le nigelle : riches en acides gras essentiels et en insaponifiables, ils nourrissent sans boucher les pores.' },
  /* c5 — ingrédients africains */
  { c: 'c5', q: 'À quoi sert l\'argile dans un cosmétique ?', a: 'À absorber l\'excès de sébum et à resserrer le grain de peau dans un masque. Elle se rince : jamais plus de 10 à 15 minutes sur le visage.' },
  { c: 'c5', q: 'Le savon noir traditionnel : de quoi est-il fait ?', a: 'De cendres de cabosses de cacao ou de noix de palme (potasse) et d\'huile de palmiste. Sans soude, il est pâteux, riche en glycérine, très nettoyant.' },
  { c: 'c5', q: 'Quelle huile africaine pour l\'éclat du teint ?', a: 'L\'huile de baobab (légère, riche en omégas) et l\'huile de moringa (vitamine E). Elles pénètrent vite sans effet gras.' },
  { c: 'c5', q: 'Comment stabiliser une recette au karité brut ?', a: 'Peu de karité dans la phase grasse (10–30 %), une petite part de cire ou d\'amidon, et un conservateur large spectre : le karité brut est un terrain fragile.' },
  { c: 'c5', q: 'Pourquoi chauffer doucement l\'argile en formulation ?', a: 'Il ne faut PAS la chauffer : à plus de 40 °C elle perd ses propriétés et durcit dans la formule. On l\'incorpore à froid, en fin de préparation.' },
  /* c6 — réglementation, vente */
  { c: 'c6', q: 'Quelles mentions sont obligatoires sur une étiquette (UEMOA/CE) ?', a: 'Nom du produit, fonction, liste INCI complète, quantité (poids/volume), date de fabrication et DDM/PAC, numéro de lot, nom et adresse du responsable, précautions d\'emploi, pays d\'origine.' },
  { c: 'c6', q: 'Différence entre DDM et PAC ?', a: 'DDM : date de durabilité minimale — « à consommer avant » pour les produits fragiles. PAC : période après ouverture — le temps d\'usage une fois le flacon ouvert (ex. 12 M).' },
  { c: 'c6', q: 'Que signifie le « 12 M » sur un pot ?', a: 'Le produit se garde 12 mois après ouverture. C\'est la PAC, pas la date de fabrication : elle se calcule à partir du jour où le client ouvre.' },
  { c: 'c6', q: 'À quoi sert un test de stabilité ?', a: 'À prouver que le produit tient : 4 semaines à 40 °C, 4 semaines à l\'abri de la lumière, et un cycle chaud/froid. S\'il tient, il peut être commercialisé.' },
  { c: 'c6', q: 'Comment fixer un prix de vente ?', a: 'Coût des matières + emballage + temps (à un taux horaire) = prix de revient. Le prix de vente se pose au minimum à 4 fois le prix de revient pour une petite marque.' },
  { c: 'c6', q: 'Que doit contenir un dossier de lot ?', a: 'La formule exacte, le lot des matières premières, la date, la quantité, le contrôle du pH, le résultat des tests et la destination du lot. C\'est votre preuve en cas de problème.' }
];

const CLE_REVISION = 'revision';
async function paquetRevision(){
  const d = await V3.donnees(CLE_REVISION, { cartes: {}, stat: { revues: 0, jours: [] } });
  if (!d.cartes) d.cartes = {};
  if (!d.stat) d.stat = { revues: 0, jours: [] };
  return d;
}
const intervalle = boite => [0, 1, 3, 7, 16, 35, 75][Math.max(0, Math.min(6, boite))];
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/* question de la banque ou question ratée : même forme qu'une carte */
async function cartesDisponibles(){
  const d = await paquetRevision();
  const liste = DECK.map((c, i) => Object.assign({}, c, { id: c.c + '-' + i, source: 'cours' }));
  /* questions de la banque du formateur (elles valent des cartes) */
  const r = await V3.lire('/api/banque');
  if (r.ok && r.data && r.data.questions){
    r.data.questions.forEach(q => {
      liste.push({ id: 'b-' + q.id, c: q.courseId || '', source: 'banque',
        q: q.question, a: (q.bonnes || []).map(i => (q.options || [])[i]).filter(Boolean).join(' · ') + (q.explication ? ' — ' + q.explication : '') });
    });
  }
  /* mes erreurs de quiz : revues en priorité */
  Object.keys(d.cartes).forEach(id => {
    const c = d.cartes[id];
    if (c && c.ratee && !liste.some(x => x.id === id)) liste.push({ id: id, c: c.c || '', source: 'erreur', q: c.q, a: c.a });
  });
  return { liste: liste, d: d };
}

function pageRevision(){
  return A.barPage('Révision intelligente', `<button class="text-btn ripple" data-act="revParams">Objectif</button>`, `
    <p class="body-medium muted" style="margin:2px 0 12px">Des cartes qui reviennent juste avant que vous ne les oubliiez. Répondez, dites si c'était facile : l'app calcule quand vous revoir.</p>
    <div id="revCorps"><p class="body-small muted">Préparation de votre paquet…</p></div>`);
}

async function revisionCharger(){
  const zone = document.getElementById('revCorps');
  if (!zone) return;
  const { liste, d } = await cartesDisponibles();
  const jour = aujourdhui();
  const aRevoir = liste.filter(c => {
    const st = d.cartes[c.id];
    return !st || !st.du || st.du <= jour;
  });
  const apprises = liste.filter(c => d.cartes[c.id] && (d.cartes[c.id].boite || 0) >= 3).length;
  const series = (d.stat.jours || []).length;
  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('À revoir maintenant', `<p class="v3-big">${aRevoir.length}</p><p class="body-small muted">carte(s) dues</p>`)}
      ${carte('Bien sues', `<p class="v3-big">${apprises}</p><p class="body-small muted">sur ${liste.length} cartes</p>`)}
    </div>
    ${carte('Révision en cours', `
      <p class="body-small muted">${liste.length} cartes disponibles (cours + questions du formateur + vos erreurs).</p>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="revGo" ${aRevoir.length ? '' : 'disabled'}>
        ${svg('play', 'icon icon--18')} Commencer (${aRevoir.length})</button>
      ${aRevoir.length ? '' : '<p class="body-small" style="margin-top:8px">Tout est revu pour aujourd\'hui 👌 Revenez demain.</p>'}
    `)}
    ${carte('Mes séries', `
      <p class="body-small muted">${series} jour(s) de révision · ${d.stat.revues || 0} carte(s) revue(s) en tout.</p>
      <div class="v3-jours">${(d.stat.jours || []).slice(-14).map(j => `<i title="${esc(j)}"></i>`).join('') || '<span class="body-small muted">Aucun jour encore — la première révision lance la série.</span>'}</div>
    `)}
    ${carte('Par cours', `<div class="v3-liste">${A.COURS.map(c => {
      const l = liste.filter(x => x.c === c.id);
      const sues = l.filter(x => d.cartes[x.id] && (d.cartes[x.id].boite || 0) >= 3).length;
      return `<div class="list-row"><span class="list-row__ico" style="background:var(--md-secondary-container)">${svg(c.ico, 'icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(c.titre)}</h3><p>${sues}/${l.length} carte(s) bien sues</p></span></div>`;
    }).join('')}</div>`, { ico: 'layers' })}`;
}

/* session de révision */
let REV = null;
function revisionDemarrer(){
  const zone = document.getElementById('revCorps');
  if (!zone) return;
  cartesDisponibles().then(({ liste, d }) => {
    const jour = aujourdhui();
    const dues = liste.filter(c => { const st = d.cartes[c.id]; return !st || !st.du || st.du <= jour; });
    if (!dues.length){ A.toast('Rien à revoir pour l\'instant'); return; }
    REV = { file: dues.slice(0, 20), i: 0, paquet: d, ok: 0, ko: 0, retour: false };
    revisionCarte();
  });
}
function revisionCarte(){
  const zone = document.getElementById('revCorps');
  if (!zone || !REV) return;
  if (REV.i >= REV.file.length) return revisionFin();
  const c = REV.file[REV.i];
  const st = REV.paquet.cartes[c.id] || {};
  zone.innerHTML = `
    <div class="v3-revbar"><span>${REV.i + 1} / ${REV.file.length}</span><span>${REV.ok} ✓ · ${REV.ko} ✗</span></div>
    <div class="v3-flash${REV.retour ? ' is-retour' : ''}" id="flash">
      <span class="v3-flash__tag">${esc(c.source === 'banque' ? 'Question du formateur' : c.source === 'erreur' ? 'Votre erreur' : 'Cours')}${st.boite !== undefined ? ' · boîte ' + (st.boite + 1) : ''}</span>
      <p class="v3-flash__q">${esc(c.q)}</p>
      ${REV.retour
        ? `<p class="v3-flash__a">${esc(c.a)}</p>
           <div class="v3-flash__btns">
             <button class="btn btn--outlined ripple" data-rat="0">À revoir</button>
             <button class="btn btn--tonal ripple" data-rat="1">Difficile</button>
             <button class="btn btn--tonal ripple" data-rat="2">Bien</button>
             <button class="btn btn--filled ripple" data-rat="3">Facile</button>
           </div>`
        : `<button class="btn btn--filled btn--block ripple" data-act="reveler" style="margin-top:14px">Voir la réponse</button>`}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:12px">
      <button class="text-btn ripple" data-act="revStop">Arrêter</button>
      <button class="text-btn ripple" data-act="revPasse">Passer</button>
    </div>`;
}
async function revisionRepondre(note){
  if (!REV) return;
  const c = REV.file[REV.i];
  const d = REV.paquet;
  const st = d.cartes[c.id] || { boite: 0, vu: 0, reussi: 0, ratee: c.source === 'erreur' ? 1 : 0, q: c.q, a: c.a, c: c.c };
  st.vu = (st.vu || 0) + 1;
  if (note === 0){ st.boite = 0; st.ratee = 1; st.reussi = 0; }
  else { st.boite = Math.min(6, (st.boite || 0) + (note === 3 ? 2 : 1)); st.reussi = (st.reussi || 0) + 1; if (st.boite >= 3) st.ratee = 0; }
  const dans = intervalle(st.boite);
  const t = new Date(); t.setDate(t.getDate() + dans);
  st.du = t.toISOString().slice(0, 10);
  st.dernier = aujourdhui();
  d.cartes[c.id] = st;
  d.stat.revues = (d.stat.revues || 0) + 1;
  if (!d.stat.jours.includes(aujourdhui())) d.stat.jours = (d.stat.jours || []).concat([aujourdhui()]).slice(-60);
  note === 0 ? REV.ko++ : REV.ok++;
  await V3.enregistrer(CLE_REVISION, d);
  REV.i++; REV.retour = false;
  revisionCarte();
}
function revisionFin(){
  const zone = document.getElementById('revCorps');
  if (!zone) return;
  const total = REV ? REV.ok + REV.ko : 0;
  zone.innerHTML = carte('Révision terminée', `
    <div style="display:flex;align-items:center;gap:16px">
      ${V3.anneau(total ? Math.round(REV.ok / total * 100) : 0, 110)}
      <div><p class="body-medium">${REV.ok} sue(s) · ${REV.ko} à revoir</p>
      <p class="body-small muted" style="margin-top:6px">Les cartes ratées reviennent demain. Celles que vous maîtrisez s'espacent sur plusieurs semaines.</p></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
      <button class="btn btn--filled ripple" data-act="revGo">${svg('refresh', 'icon icon--18')} Continuer</button>
      <button class="btn btn--outlined ripple" data-page="cours">Mes cours</button>
    </div>`, { ico: 'star' });
  REV = null;
}

/* ------------------------------------------------------------
   3. A4 — FICHES DE RÉVISION (imprimables)
   ------------------------------------------------------------ */
function pointsCles(cid){
  const c = A.coursById(cid);
  const lecons = (A.PROGRAMMES && A.PROGRAMMES[cid]) ? A.PROGRAMMES[cid] : [];
  const cartes = DECK.filter(x => x.c === cid);
  const quiz = (A.QUIZZES[cid] || { questions: [] }).questions;
  return { cours: c, lecons: lecons, cartes: cartes, quiz: quiz };
}
function pageFiche(params){
  const cid = (params && params.id) || 'c1';
  const { cours: c, lecons, cartes, quiz } = pointsCles(cid);
  const titre = c ? c.titre : cid;
  const corps = `
    <div class="v3-fiche-entete">
      <h2 class="headline-small">${esc(titre)}</h2>
      <p class="body-small muted">${esc((c && c.cat) || '')} · formateur ${esc((c && c.prof) || '')} · fiche de révision CosmétiLab</p>
    </div>
    ${carte('À retenir', `<ol class="v3-points">${cartes.map(x => `<li><b>${esc(x.q.replace(/\?$/, ''))}</b><br><span>${esc(x.a)}</span></li>`).join('')}</ol>`, { ico: 'star' })}
    ${lecons.length ? carte('Programme du cours', `<ol class="v3-points v3-points--simples">${lecons.map(l => `<li>${esc(l.titre || l.t || l)}</li>`).join('')}</ol>`, { ico: 'layers' }) : ''}
    ${quiz.length ? carte('Auto-contrôle', `<ol class="v3-points v3-points--simples">${quiz.map(q => `<li>${esc(q.q)} <span class="muted">→ ${esc(q.o[q.a])}</span></li>`).join('')}</ol>`, { ico: 'task' }) : ''}
    ${V3.info('Fiche générée depuis le cours. Imprimez-la ou partagez-la : elle se lit hors ligne.', 'info')}`;
  return A.barPage('Fiche de révision', `<button class="text-btn ripple" data-act="fichePartager" data-id="${esc(cid)}">Partager</button>`, corps);
}

/* ------------------------------------------------------------
   4. A5 — OBJECTIFS ET SÉRIES
   ------------------------------------------------------------ */
const CLE_OBJ = 'objectifs';
const jourISO = () => new Date().toISOString().slice(0, 10);
async function objDonnees(){
  const o = await V3.donnees(CLE_OBJ, { minutesParJour: 15, joursParSemaine: 5, journal: {} });
  if (!o.journal) o.journal = {};
  return o;
}
/* compteur d'étude : chaque minute passée dans l'app compte */
let minuteur = null, derniereMarque = 0;
function compterEtude(){
  if (minuteur) return;
  minuteur = setInterval(async () => {
    if (document.hidden) return;
    const o = await objDonnees();
    const j = jourISO();
    o.journal[j] = (o.journal[j] || 0) + 1;
    await V3.enregistrer(CLE_OBJ, o);
    derniereMarque = Date.now();
  }, 60000);
}
function serieDe(o){
  const jours = Object.keys(o.journal).filter(j => o.journal[j] >= o.minutesParJour).sort();
  if (!jours.length) return 0;
  let s = 0;
  const d = new Date();
  for (;;){
    const j = d.toISOString().slice(0, 10);
    if (o.journal[j] && o.journal[j] >= o.minutesParJour){ s++; d.setDate(d.getDate() - 1); }
    else if (j === jourISO()) { d.setDate(d.getDate() - 1); }   // aujourd'hui pas encore atteint : la série continue
    else break;
  }
  return s;
}
function semaineDe(o){
  let total = 0;
  for (let i = 0; i < 7; i++){
    const d = new Date(); d.setDate(d.getDate() - i);
    total += o.journal[d.toISOString().slice(0, 10)] || 0;
  }
  return total;
}
function pageObjectifs(){
  return A.barPage('Objectifs et séries', '', `<div id="objCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function objectifsCharger(){
  const zone = document.getElementById('objCorps');
  if (!zone) return;
  const o = await objDonnees();
  const j = jourISO();
  const auj = o.journal[j] || 0;
  const serie = serieDe(o);
  const semaine = semaineDe(o);
  const maxJour = Math.max(o.minutesParJour, ...Object.values(o.journal).slice(-30), 1);
  zone.innerHTML = `
    ${carte('Aujourd\'hui', `
      <div style="display:flex;align-items:center;gap:16px">
        ${V3.anneau(Math.min(100, auj / o.minutesParJour * 100), 110, auj + ' min')}
        <div>
          <p class="body-medium">Objectif : ${o.minutesParJour} min d'étude par jour</p>
          <p class="body-small muted" style="margin-top:6px">${auj >= o.minutesParJour ? 'Objectif atteint, félicitations 👏' : 'Encore ' + (o.minutesParJour - auj) + ' min — une leçon suffit.'}</p>
          <p class="body-small muted" style="margin-top:6px">Série : ${serie} jour(s) d'affilée · ${semaine} min cette semaine</p>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn--filled ripple" data-page="cours">${svg('play', 'icon icon--18')} Continuer un cours</button>
        <button class="btn btn--tonal ripple" data-page="revision">${svg('star', 'icon icon--18')} Réviser</button>
      </div>`, { ico: 'fire' })}
    ${carte('Mes 14 derniers jours', `<div class="v3-histog">${Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      const k = d.toISOString().slice(0, 10);
      const v = o.journal[k] || 0;
      const h = Math.round(v / maxJour * 100);
      return `<div class="v3-histog__j" title="${k} : ${v} min"><span style="height:${Math.max(3, h)}%" class="${v >= o.minutesParJour ? 'is-ok' : ''}"></span><b>${d.getDate()}</b></div>`;
    }).join('')}</div>`, { ico: 'trending' })}
    ${carte('Régler mes objectifs', `
      <label class="v3-champ"><span>Minutes d'étude par jour</span>
        <input id="objMin" type="range" min="5" max="90" step="5" value="${o.minutesParJour}"><b id="objMinVal">${o.minutesParJour} min</b></label>
      <label class="v3-champ"><span>Jours par semaine</span>
        <input id="objJours" type="range" min="1" max="7" step="1" value="${o.joursParSemaine}"><b id="objJoursVal">${o.joursParSemaine} j</b></label>
      <button class="btn btn--filled btn--block ripple" data-act="objEnregistrer">Enregistrer</button>`)}
    ${carte('Rappels', `
      <div class="v3-switchrow"><span>Rappel quotidien d'étude</span>
        <button class="switch" role="switch" aria-checked="${A.S.settings.reminders ? 'true' : 'false'}" aria-label="Rappel quotidien" data-obj-rappel="1"></button></div>
      <p class="body-small muted" style="margin-top:8px">Le rappel s'affiche sur votre téléphone tant que l'application est ouverte (aucun service externe, aucune donnée envoyée).</p>
      <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-act="rappelTester">${svg('bell', 'icon icon--18')} Tester le rappel</button>`, { ico: 'bell' })}`;
}

/* ------------------------------------------------------------
   5. A6 — COMPÉTENCES (radar)
   ------------------------------------------------------------ */
const THEMES = [
  { id: 'c1', nom: 'Saponification', ico: 'flask' },
  { id: 'c2', nom: 'Hygiène liquide', ico: 'drop' },
  { id: 'c3', nom: 'Émulsions', ico: 'jar' },
  { id: 'c4', nom: 'Soins du corps', ico: 'leaf' },
  { id: 'c5', nom: 'Ingrédients africains', ico: 'globe' },
  { id: 'c6', nom: 'Réglementation', ico: 'bullhorn' }
];
function scoreTheme(t, revision){
  const c = A.coursById(t.id) || { total: 1 };
  const lecons = c.total ? Math.min(1, A.leconsFaites(t.id) / c.total) : 0;
  const quiz = Math.min(1, ((A.S.quiz[t.id] || {}).best || 0) / 100);
  const cartes = DECK.filter(x => x.c === t.id);
  const sues = cartes.filter(x => {
    const st = (revision || {}).cartes ? revision.cartes[x.c + '-' + DECK.indexOf(x)] : null;
    return st && (st.boite || 0) >= 3;
  }).length;
  const rev = cartes.length ? sues / cartes.length : 0;
  return Math.round((lecons * 0.4 + quiz * 0.35 + rev * 0.25) * 100);
}
function pageCompetences(){
  return A.barPage('Mes compétences', '', `<div id="compCorps"><p class="body-small muted">Calcul…</p></div>`);
}
async function competencesCharger(){
  const zone = document.getElementById('compCorps');
  if (!zone) return;
  const rev = await paquetRevision();
  const scores = THEMES.map(t => ({ t: t, v: scoreTheme(t, rev) }));
  const moyen = Math.round(scores.reduce((s, x) => s + x.v, 0) / scores.length);
  /* radar : coordonnées calculées sur un cercle de 100 px */
  const n = scores.length, R = 78, cx = 100, cy = 100;
  const point = (i, v) => {
    const a = (Math.PI * 2 * i / n) - Math.PI / 2, r = R * Math.max(0.06, v / 100);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = scores.map((s, i) => point(i, s.v).map(x => x.toFixed(1)).join(',')).join(' ');
  const grille = [25, 50, 75, 100].map(p => `<polygon points="${scores.map((_, i) => point(i, p).map(x => x.toFixed(1)).join(',')).join(' ')}" class="v3-radar__g"/>`).join('');
  const axes = scores.map((s, i) => { const p = point(i, 100); const l = point(i, 118); return `<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" class="v3-radar__a"/><text x="${l[0].toFixed(1)}" y="${l[1].toFixed(1)}" class="v3-radar__t">${esc(s.t.nom.split(' ')[0])}</text>`; }).join('');
  zone.innerHTML = `
    <div class="v3-radar-wrap">
      <svg viewBox="-32 -14 264 228" class="v3-radar" role="img" aria-label="Radar de compétences : ${scores.map(s => s.t.nom + ' ' + s.v + ' %').join(', ')}">
        ${grille}${axes}
        <polygon points="${poly}" class="v3-radar__v"/>
        ${scores.map((s, i) => { const p = point(i, s.v); return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" class="v3-radar__p"/>`; }).join('')}
      </svg>
    </div>
    <p class="body-small muted" style="text-align:center;margin:2px 0 14px">Niveau moyen : ${moyen} % — calculé sur vos leçons terminées, vos meilleurs quiz et les cartes que vous maîtrisez.</p>
    <div class="v3-liste">${scores.map(s => `<div class="v3-score">
      <span class="v3-score__ico">${svg(s.t.ico, 'icon icon--20')}</span>
      <span class="v3-score__t"><b>${esc(s.t.nom)}</b><span class="v3-bar"><i style="width:${s.v}%"></i></span></span>
      <b class="v3-score__v">${s.v} %</b></div>`).join('')}</div>
    ${carte('Ce qu\'il faut travailler', (() => {
      const bas = scores.slice().sort((a, b) => a.v - b.v).slice(0, 2);
      return `<ul class="v3-points v3-points--simples">${bas.map(b => `<li><b>${esc(b.t.nom)}</b> — ${b.v} % : ${b.v < 40 ? 'commencez par les leçons' : b.v < 70 ? 'refaites le quiz puis révisez' : 'bientôt maîtrisé'}</li>`).join('')}</ul>`;
    })(), { ico: 'trending' })}`;
}

/* ------------------------------------------------------------
   6. A2 / A7 — QUIZ ENRICHIS
   ------------------------------------------------------------
   Le quiz « examen » garde le moteur historique (une tentative,
   chrono plein). Le mode « entraînement » tire des questions au
   hasard (cours + banque du formateur), corrige tout de suite,
   accepte plusieurs bonnes réponses et range les erreurs dans la
   révision.
   ------------------------------------------------------------ */
async function entrainementQuestions(cid){
  const def = A.QUIZZES[cid] || { questions: [] };
  const paquet = def.questions.map((q, i) => ({ id: 'q' + i, type: 'simple', q: q.q, o: q.o, bonnes: [q.a], e: q.e || '' }));
  const r = await V3.lire('/api/banque' + (cid ? '?courseId=' + encodeURIComponent(cid) : ''));
  if (r.ok && r.data && r.data.questions){
    r.data.questions.forEach(q => paquet.push({ id: q.id, type: q.type || 'simple', q: q.question, o: q.options || [], bonnes: q.bonnes || [], e: q.explication || '' }));
  }
  /* mélange (Fisher-Yates) puis 10 questions */
  for (let i = paquet.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const t = paquet[i]; paquet[i] = paquet[j]; paquet[j] = t; }
  return paquet.slice(0, Math.min(10, paquet.length));
}
let ENT = null;
async function entrainementDemarrer(zone, cid){
  const questions = await entrainementQuestions(cid);
  if (!questions.length){ zone.innerHTML = V3.vide('help', 'Pas de questions', 'Aucune question disponible pour ce cours pour l\'instant.'); return; }
  ENT = { cid: cid, qs: questions, i: 0, sel: [], ok: 0, ko: 0, corrige: false, erreurs: [] };
  entrainementPeindre(zone);
}
function entrainementPeindre(zone){
  const e = ENT, q = e.qs[e.i];
  const multi = q.type === 'multiple';
  const texte = q.o.map((o, i) => `<button class="ropt ripple${e.sel.includes(i) ? ' is-sel' : ''}" data-ent="${i}">
      <span class="ropt__dot${multi ? ' ropt__dot--carre' : ''}"></span><span class="ropt__t">${esc(o)}</span></button>`).join('');
  const correction = e.corrige ? `
    <div class="card card--pad v3-corr ${e.bon ? '' : 'is-ko'}" style="margin-top:12px">
      <p class="title-small">${e.bon ? '✅ Bonne réponse' : '❌ Réponse à corriger'}</p>
      <p class="body-small" style="margin-top:6px">Bonne réponse : <b>${esc(q.bonnes.map(i => q.o[i]).filter(Boolean).join(' · '))}</b></p>
      ${q.e ? `<p class="body-small muted" style="margin-top:6px">${esc(q.e)}</p>` : ''}
    </div>
    <button class="btn btn--filled btn--block ripple" style="margin-top:12px" data-act="entSuivant">
      ${e.i + 1 >= e.qs.length ? 'Voir mon bilan' : 'Question suivante'} ${svg('arrow', 'icon icon--18')}</button>` : `
    <button class="btn btn--filled btn--block ripple" style="margin-top:14px" data-act="entValider" ${e.sel.length ? '' : 'disabled'}>Valider</button>`;
  zone.innerHTML = `
    <div class="v3-revbar"><span>Entraînement · ${e.i + 1} / ${e.qs.length}</span><span>${e.ok} ✓ · ${e.ko} ✗</span></div>
    <div class="lp" style="margin:10px 0 16px"><div class="lp__track"></div><div class="lp__bar" style="width:${Math.round(e.i / e.qs.length * 100)}%"></div></div>
    <p class="q-text">${esc(q.q)}</p>
    ${multi ? '<p class="body-small muted" style="margin:0 0 8px">Plusieurs réponses possibles.</p>' : ''}
    ${texte}
    ${correction}`;
}
function entrainementValider(){
  const e = ENT, q = e.qs[e.i];
  const bon = e.sel.slice().sort().join(',') === q.bonnes.slice().sort().join(',');
  e.bon = bon;
  e.corrige = true;
  if (bon) e.ok++; else {
    e.ko++;
    e.erreurs.push(q);
    /* l'erreur devient une carte de révision, revue dès demain */
    paquetRevision().then(d => {
      const id = 'e-' + (q.id || e.i) + '-' + e.cid;
      d.cartes[id] = { boite: 0, vu: 0, reussi: 0, ratee: 1, du: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        q: q.q, a: q.bonnes.map(i => q.o[i]).filter(Boolean).join(' · ') + (q.e ? ' — ' + q.e : ''), c: e.cid };
      V3.enregistrer(CLE_REVISION, d);
    });
  }
  entrainementPeindre(document.getElementById('entCorps'));
}
function entrainementSuivant(){
  const e = ENT;
  if (e.i + 1 >= e.qs.length){
    const total = e.ok + e.ko, score = total ? Math.round(e.ok / total * 100) : 0;
    const prev = A.S.quiz[e.cid] || { best: 0, attempts: 0 };
    A.S.quiz[e.cid] = { best: Math.max(prev.best || 0, score), last: score, attempts: (prev.attempts || 0) + 1 };
    A.persist(); A.refreshUI();
    document.getElementById('entCorps').innerHTML = `
      <div class="q-result">
        <div class="ring-wrap">${(function(){ const C = 2 * Math.PI * 42; return `<svg class="ring" viewBox="0 0 100 100"><circle class="ring__track" cx="50" cy="50" r="42"/><circle class="ring__val" cx="50" cy="50" r="42" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-prog="${score}" style="stroke:${score >= 60 ? 'var(--md-success)' : 'var(--md-error)'}"/></svg>`; })()}<span class="ring-wrap__label"><strong>${score}%</strong></span></div>
        <h2 class="title-large">Entraînement terminé</h2>
        <p>${e.ok} bonne(s) réponse(s) sur ${total}</p>
      </div>
      ${e.erreurs.length ? carte('À revoir dès demain', `<ul class="v3-points v3-points--simples">${e.erreurs.map(q => `<li>${esc(q.q)}</li>`).join('')}</ul><p class="body-small muted">Ces questions sont ajoutées à votre révision.</p>`, { ico: 'refresh' }) : carte('Sans faute', '<p class="body-small">Rien à revoir : passez au quiz en mode examen pour valider.</p>', { ico: 'star' })}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn--filled ripple" data-act="entEncore">${svg('refresh', 'icon icon--18')} Nouveau tirage</button>
        <button class="btn btn--outlined ripple" data-act="entExamen">Mode examen</button>
        <button class="btn btn--outlined ripple" data-act="entCours">Retour au cours</button>
      </div>`;
    ENT = null;
    return;
  }
  e.i++; e.sel = []; e.corrige = false;
  entrainementPeindre(document.getElementById('entCorps'));
}

/* la page quiz : ajout du sélecteur de mode et du corps d'entraînement */
const quizRenderBase = A.PAGES.quiz.render;
A.PAGES.quiz.render = function(params){
  const cid = (params && (params.quiz || params.id)) || 'c2';
  const mode = (params && params.mode) || 'examen';
  const barre = `<div class="tabs" style="margin:12px 0 0">
      <button class="tab${mode === 'examen' ? ' is-active' : ''}" data-qmode="examen">Examen</button>
      <button class="tab${mode === 'entrainement' ? ' is-active' : ''}" data-qmode="entrainement">Entraînement</button>
    </div>`;
  if (mode === 'entrainement'){
    const def = A.QUIZZES[cid] || { questions: [] };
    return `<div class="page__bar">
        <a class="icon-btn ripple page__back--bar" href="/cours/${esc(cid)}" data-page="cours" data-id="${esc(cid)}" aria-label="Retour">${svg('back', 'icon')}</a>
        <h1>Quiz — ${esc((A.coursById(cid) || {}).titre || '')}</h1>
        <span class="pill">Entraînement</span>
      </div>
      <div class="page__scroll"><div class="page__pad">
        ${barre}
        <div id="entCorps" style="margin-top:14px"><p class="body-small muted">Préparation…</p></div>
      </div></div>`;
  }
  const html = quizRenderBase.call(this, params);
  return html.replace('<div class="page__scroll">', '</div><div class="page__pad" style="padding-bottom:0">' + barre + '</div><div class="page__scroll">')
             .replace('<div class="page__bar">', '<div class="page__bar">');
};
const quizMountBase = A.PAGES.quiz.mount;
A.PAGES.quiz.mount = function(el, params){
  const cid = (params && (params.quiz || params.id)) || 'c2';
  const mode = (params && params.mode) || 'examen';
  /* le sélecteur de mode doit bouger l'adresse, pas empiler les écrans */
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-qmode]');
    if (!b) return;
    const m = b.dataset.qmode;
    if (m === mode) return;
    A.popPage();
    setTimeout(() => A.allerVers('/quiz/' + encodeURIComponent(cid) + (m === 'entrainement' ? '?mode=entrainement' : '')), 60);
  });
  if (mode === 'entrainement'){
    const zone = el.querySelector('#entCorps');
    if (zone) entrainementDemarrer(zone, cid);
    return;
  }
  return quizMountBase.call(this, el, params);
};

/* ------------------------------------------------------------
   7. CLICS
   ------------------------------------------------------------ */
document.addEventListener('click', async e => {
  const t = e.target;

  const pm = t.closest('[data-qmode]');
  if (pm) return;                                     /* géré par la page quiz */

  if (t.closest('[data-act="revGo"]')){ revisionDemarrer(); return; }
  if (t.closest('[data-act="reveler"]')){ if (REV){ REV.retour = true; revisionCarte(); } return; }
  const rat = t.closest('[data-rat]');
  if (rat){ revisionRepondre(+rat.dataset.rat); return; }
  if (t.closest('[data-act="revPasse"]')){ if (REV){ REV.i++; REV.retour = false; revisionCarte(); } return; }
  if (t.closest('[data-act="revStop"]')){ REV = null; revisionCharger(); return; }
  if (t.closest('[data-act="revParams"]')){ A.pushPage('objectifs', {}); return; }

  const ent = t.closest('[data-ent]');
  if (ent){
    const i = +ent.dataset.ent, q = ENT.qs[ENT.i];
    if (ENT.corrige) return;
    if (q.type === 'multiple'){
      ENT.sel = ENT.sel.includes(i) ? ENT.sel.filter(x => x !== i) : ENT.sel.concat([i]);
    } else ENT.sel = [i];
    entrainementPeindre(document.getElementById('entCorps'));
    return;
  }
  if (t.closest('[data-act="entValider"]')){ entrainementValider(); return; }
  if (t.closest('[data-act="entSuivant"]')){ entrainementSuivant(); return; }
  if (t.closest('[data-act="entEncore"]')){ entrainementDemarrer(document.getElementById('entCorps'), ENT ? ENT.cid : 'c1'); return; }
  if (t.closest('[data-act="entExamen"]')){
    const cid = (A.topPage() && A.topPage().params && (A.topPage().params.quiz || A.topPage().params.id)) || 'c2';
    A.popPage(); setTimeout(() => A.allerVers('/quiz/' + encodeURIComponent(cid)), 60); return;
  }
  if (t.closest('[data-act="entCours"]')){
    const cid = (A.topPage() && A.topPage().params && (A.topPage().params.quiz || A.topPage().params.id)) || 'c2';
    A.popPage(); setTimeout(() => A.pushPage('cours', { id: cid }), 60); return;
  }

  const su = t.closest('[data-act="parcoursSuivant"]');
  if (su){
    const p = PARCOURS.find(x => x.id === su.dataset.id) || PARCOURS[0];
    const etape = p.pas.find(x => {
      const c = A.coursById(x.cours) || { total: 0 };
      return !(c.total > 0 && A.leconsFaites(x.cours) >= c.total);
    }) || p.pas[p.pas.length - 1];
    A.pushPage('cours', { id: etape.cours });
    return;
  }
  const sp = t.closest('[data-act="parcoursPartager"]');
  if (sp){
    const p = PARCOURS.find(x => x.id === sp.dataset.id) || PARCOURS[0];
    V3.partager(p.titre, 'Mon parcours sur CosmétiLab : ' + p.resume, location.origin + '/parcours/' + p.id);
    return;
  }
  const fp = t.closest('[data-act="fichePartager"]');
  if (fp){
    const cid = fp.dataset.id, c = A.coursById(cid) || {};
    V3.partager('Fiche de révision — ' + (c.titre || cid), 'Ma fiche de révision CosmétiLab', location.origin + '/fiche/' + cid);
    return;
  }
  if (t.closest('[data-act="objEnregistrer"]')){
    const o = await objDonnees();
    o.minutesParJour = +document.getElementById('objMin').value;
    o.joursParSemaine = +document.getElementById('objJours').value;
    await V3.enregistrer(CLE_OBJ, o);
    A.toast('Objectifs enregistrés');
    objectifsCharger();
    return;
  }
  const rp = t.closest('[data-obj-rappel]');
  if (rp){
    const on = rp.getAttribute('aria-checked') !== 'true';
    rp.setAttribute('aria-checked', String(on));
    A.S.settings.reminders = on; A.persist();
    return;
  }
  if (t.closest('[data-act="rappelTester"]')){
    if (window.LHQUALITE && window.LHQUALITE.rappel) window.LHQUALITE.rappel('CosmétiLab — il est temps de réviser', 'Votre objectif du jour : ' + (await objDonnees()).minutesParJour + ' min d\'étude.');
    else A.toast('Rappel envoyé');
    return;
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'objMin'){ const v = document.getElementById('objMinVal'); if (v) v.textContent = e.target.value + ' min'; }
  if (e.target.id === 'objJours'){ const v = document.getElementById('objJoursVal'); if (v) v.textContent = e.target.value + ' j'; }
});

/* ------------------------------------------------------------
   8. ÉCRANS
   ------------------------------------------------------------ */
A.PAGES.parcours = { single: true, render: pageParcours, mount(){ A.refreshPages(); } };
A.PAGES.parcoursdetail = { render: pageParcoursDetail, mount(el, params){ el.dataset.id = (params && params.id) || ''; } };
A.PAGES.revision = { single: true, render: pageRevision, mount(){ revisionCharger(); } };
A.PAGES.objectifs = { single: true, render: pageObjectifs, mount(){ objectifsCharger(); } };
A.PAGES.competences = { single: true, render: pageCompetences, mount(){ competencesCharger(); } };
A.PAGES.fiche = { render: pageFiche, mount(el, params){ if (params && params.id) el.dataset.id = params.id; } };

compterEtude();

window.LHV3APPRENDRE = { PARCOURS: PARCOURS, DECK: DECK, progParcours: progParcours, entrainementQuestions: entrainementQuestions };
})();
