/* ============================================================
   V3 — ESPACE FORMATEUR
   ------------------------------------------------------------
   C1 créer et modifier ses cours (+ leçons, prix, publication)
   C2 banque de questions · C3 revenus et apprenants à risque
   C4 notation assistée · C5 annonce aux élèves · C6 séances
   en direct (lien de visioconférence et émargement).
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte, fcfa = V3.fcfa;

const ACCENTS = [['purple', 'Violet'], ['blue', 'Bleu'], ['pink', 'Rose'], ['amber', 'Ambre'], ['teal', 'Turquoise'], ['green', 'Vert']];
const ICOS = ['flask', 'drop', 'jar', 'leaf', 'globe', 'bullhorn', 'school', 'star', 'layers', 'crown', 'shield', 'card'];
const CATS = ['Savon', 'Hygiène liquide', 'Soin visage', 'Soin corps', 'Ingrédients', 'Réglementation'];
const COMMENTAIRES = [
  'Très bon travail, continuez ainsi.',
  'Bonne copie, quelques imprécisions sur les dosages.',
  'Il manque la liste INCI complète : à reprendre.',
  'Recette juste, mais le calcul de la soude doit être détaillé.',
  'Le pH n\'est pas indiqué : c\'est indispensable.',
  'Relisez le cours puis renvoyez la partie 2.'
];

/* ------------------------------------------------------------
   C3 — REVENUS
   ------------------------------------------------------------ */
function pageRevenus(){
  return A.barPage('Revenus et suivi', '', `<div id="rev2Corps"><p class="body-small muted">Chargement…</p></div>`);
}
async function revenusCharger(){
  const zone = document.getElementById('rev2Corps');
  if (!zone) return;
  const r = await V3.lire('/api/formateur/revenus');
  if (!r.ok || !r.data){ zone.innerHTML = V3.vide('help', 'Chiffres indisponibles', r.erreur || 'Le serveur n\'a pas répondu.'); return; }
  const d = r.data, t = d.totaux || {};
  const max = Math.max(1, ...d.cours.map(c => c.revenu || 0));
  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('Chiffre d\'affaires', `<p class="v3-big">${fcfa(t.revenu || 0)}</p><p class="body-small muted">${t.ventes || 0} vente(s) payée(s)</p>`, { ico: 'card' })}
      ${carte('Apprenants', `<p class="v3-big">${t.apprenants || 0}</p><p class="body-small muted">inscrits · ${t.abonnes || 0} abonné(s) actif(s)</p>`, { ico: 'person' })}
    </div>
    ${carte('Ventes par cours', `<div class="v3-liste">${d.cours.map(c => `
      <div class="v3-score">
        <span class="v3-score__t"><b>${esc(c.titre)}</b>
          <span class="v3-bar"><i style="width:${Math.round((c.revenu || 0) / max * 100)}%"></i></span>
          <span class="body-small muted">${c.ventes} vente(s) · ${c.apprenants} apprenant(s) · ${c.termines} terminé(s)${c.prix ? ' · ' + fcfa(c.prix) : ''}</span>
        </span>
        <b class="v3-score__v">${fcfa(c.revenu || 0)}</b></div>`).join('') || '<p class="body-small muted">Aucun cours encore.</p>'}</div>`, { ico: 'chart' })}
    ${d.dernieresVentes && d.dernieresVentes.length ? carte('Dernières ventes', `<div class="v3-table">${d.dernieresVentes.map(v => `
      <div class="v3-tr v3-tr--2"><span class="v3-td">${esc(v.apprenant || 'Apprenant')}<br><span class="body-small muted">${esc(v.cours || v.description || '')}</span></span>
      <span class="v3-td">${fcfa(v.amount)}<br><span class="body-small muted">${esc(V3.quand(v.created_at))}</span></span></div>`).join('')}</div>`, { ico: 'card' }) : ''}
    ${carte('Apprenants à relancer', d.aRisque && d.aRisque.length ? `<div class="v3-liste">${d.aRisque.map(a => `
      <div class="list-row"><span class="list-row__ico" style="background:var(--md-error-container);color:var(--md-on-error-container)">${svg('bell', 'icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(a.nom)}</h3>
          <p>${esc(a.cours)} · ${a.progress || 0} % · ${a.jours ? 'sans activité depuis ' + a.jours + ' j' : 'jamais commencé'}</p></span>
        <a class="icon-btn ripple" href="/formateur/annonce" data-page="annonce" aria-label="Écrire">${svg('bullhorn', 'icon icon--18')}</a></div>`).join('')}</div>
      <p class="body-small muted" style="margin-top:8px">Un mot suffit souvent à relancer quelqu'un qui a décroché.</p>`
      : '<p class="body-small">Personne n\'est en décrochage : tout le monde a avancé cette semaine 👌</p>', { ico: 'person' })}
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn--filled ripple" data-page="creercours">${svg('plus', 'icon icon--18')} Créer un cours</button>
      <button class="btn btn--tonal ripple" data-page="annonce">${svg('bullhorn', 'icon icon--18')} Annonce</button>
      <button class="btn btn--outlined ripple" data-page="notation">${svg('edit', 'icon icon--18')} Corrections</button>
    </div>`;
}

/* ------------------------------------------------------------
   C1 — CRÉER / MODIFIER UN COURS
   ------------------------------------------------------------ */
let EDITE = null;
let COURSREF = null;
/* La liste des cours du formateur (les siens d'abord, sinon tout le catalogue) :
   chargée à la demande pour que chaque écran marche même ouvert en direct. */
async function chargerCoursRef(force){
  if (COURSREF && !force) return COURSREF;
  const r = await V3.lire('/api/courses');
  const tous = (r.ok && r.data && r.data.cours) ? r.data.cours : [];
  const moi = V3.nomCompte();
  const miens = tous.filter(c => moi && moi !== 'Invité' && String(c.prof || '') === moi);
  COURSREF = miens.length ? miens : tous;
  window.__V3COURS = COURSREF;
  return COURSREF;
}
function pageCreerCours(params){
  return A.barPage('Créer un cours', '', `<div id="ccCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function creerCoursCharger(params){
  const zone = document.getElementById('ccCorps');
  if (!zone) return;
  if (!EDITE){
    EDITE = { id: (params && params.id) || '', titre: '', categorie: CATS[0], professeur: V3.nomCompte(),
      prix: 3000, dureeLabel: '15 min', description: '', accent: 'purple', ico: 'flask', publie: true };
    const r = await V3.lire('/api/courses');
    if (r.ok && r.data && r.data.cours) window.__V3COURS = r.data.cours;
    if (r.ok && r.data && r.data.cours) COURSREF = r.data.cours;
    if (EDITE.id && window.__V3COURS){
      const c = window.__V3COURS.find(x => x.id === EDITE.id);
      if (c) EDITE = Object.assign(EDITE, { titre: c.titre, categorie: c.categorie, professeur: c.prof,
        prix: c.prix || 0, dureeLabel: c.duree_label || '', description: c.description || '',
        accent: c.accent || 'purple', ico: c.ico || 'flask', publie: c.publie !== false });
    }
  }
  const liste = window.__V3COURS || [];
  zone.innerHTML = `
    ${carte(EDITE.id ? 'Modifier le cours' : 'Nouveau cours', `
      <label class="v3-champ"><span>Titre</span><input id="ccTitre" value="${esc(EDITE.titre)}" placeholder="Savonnerie à froid"></label>
      <label class="v3-champ"><span>Catégorie</span><select id="ccCat" class="v3-select">${CATS.map(c => `<option${c === EDITE.categorie ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label class="v3-champ"><span>Formateur affiché</span><input id="ccProf" value="${esc(EDITE.professeur)}"></label>
      <label class="v3-champ"><span>Prix (0 = gratuit)</span><input id="ccPrix" type="number" min="0" step="500" value="${EDITE.prix}"><b>F</b></label>
      <label class="v3-champ"><span>Durée annoncée</span><input id="ccDuree" value="${esc(EDITE.dureeLabel)}" placeholder="18 min"></label>
      <label class="v3-champ"><span>Description</span><input id="ccDesc" value="${esc(EDITE.description)}" placeholder="Ce que l'élève va savoir faire"></label>
      <label class="v3-champ"><span>Couleur</span><select id="ccAcc" class="v3-select">${ACCENTS.map(a => `<option value="${a[0]}"${a[0] === EDITE.accent ? ' selected' : ''}>${a[1]}</option>`).join('')}</select></label>
      <label class="v3-champ"><span>Icône</span><select id="ccIco" class="v3-select">${ICOS.map(i => `<option value="${i}"${i === EDITE.ico ? ' selected' : ''}>${i}</option>`).join('')}</select></label>
      <div class="v3-switchrow"><span>Publié (visible des élèves)</span>
        <button class="switch" role="switch" aria-checked="${EDITE.publie ? 'true' : 'false'}" id="ccPublie" aria-label="Publié (visible des élèves)"></button></div>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn--filled ripple" data-act="ccEnregistrer">${svg('check', 'icon icon--18')} ${EDITE.id ? 'Enregistrer' : 'Créer le cours'}</button>
        ${EDITE.id ? '' : `<button class="btn btn--outlined ripple" data-act="ccAnnuler">Effacer</button>`}
      </div>`, { ico: 'edit' })}
    ${carte('J\'ajoute une leçon', `
      <label class="v3-champ"><span>Module</span><input id="lcModule" placeholder="Module 1 — les bases"></label>
      <label class="v3-champ"><span>Titre de la leçon</span><input id="lcTitre" placeholder="Calculer la soude"></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Durée</span><input id="lcDuree" placeholder="8 min"></label>
        <label class="v3-champ"><span>Type</span><select id="lcKind" class="v3-select"><option value="lecture">Lecture</option><option value="video">Vidéo</option><option value="exercice">Exercice</option></select></label>
      </div>
      <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-act="lcAjouter">${svg('plus', 'icon icon--18')} Ajouter la leçon</button>
      <p class="body-small muted" style="margin-top:8px">La leçon est numérotée automatiquement à la suite du programme existant.</p>`, { ico: 'layers' })}
    ${carte('Mes cours', `<div class="v3-liste">${liste.map(c => `
      <div class="list-row">
        <span class="list-row__ico" style="background:var(--md-secondary-container);color:var(--md-on-secondary-container)">${svg(c.ico || 'school', 'icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(c.titre)}</h3>
          <p>${esc(c.prof)} · ${c.lecons || c.total_lecons || 0} leçon(s)${c.prix ? ' · ' + fcfa(c.prix) : ' · gratuit'}${c.publie === false ? ' · brouillon' : ''}</p></span>
        <button class="icon-btn ripple" data-act="ccEditer" data-id="${esc(c.id)}" aria-label="Modifier">${svg('edit', 'icon icon--18')}</button>
        <button class="icon-btn ripple" data-act="ccLecons" data-id="${esc(c.id)}" aria-label="Leçons">${svg('layers', 'icon icon--18')}</button>
      </div>`).join('')}</div>`, { ico: 'school' })}`;
}

/* ------------------------------------------------------------
   C2 — BANQUE DE QUESTIONS
   ------------------------------------------------------------ */
let QB = { type: 'simple', bonnes: [0], options: ['', '', '', ''] };
function pageQuestions(){
  return A.barPage('Banque de questions', '', `<div id="qbCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function questionsCharger(){
  const zone = document.getElementById('qbCorps');
  if (!zone) return;
  const r = await V3.lire('/api/banque');
  const qs = (r.ok && r.data && r.data.questions) ? r.data.questions : [];
  const cours = await chargerCoursRef();
  zone.innerHTML = `
    ${carte('Nouvelle question', `
      <label class="v3-champ"><span>Cours</span><select id="qbCours" class="v3-select">${cours.map(c => `<option value="${esc(c.id)}">${esc(c.titre)}</option>`).join('') || '<option value="">—</option>'}</select></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Type</span><select id="qbType" class="v3-select">
          <option value="simple">Une bonne réponse</option><option value="multiple">Plusieurs bonnes réponses</option><option value="vraifaux">Vrai / Faux</option></select></label>
        <label class="v3-champ"><span>Difficulté</span><select id="qbDiff" class="v3-select"><option value="1">Facile</option><option value="2" selected>Moyenne</option><option value="3">Difficile</option></select></label>
      </div>
      <label class="v3-champ"><span>Question</span><input id="qbQ" placeholder="Combien de soude pour 1 kg d'huile d'olive ?"></label>
      <div id="qbOpts">${[0, 1, 2, 3].map(i => `<label class="v3-champ v3-champ--opt"><input type="checkbox" data-qbo="${i}" aria-label="Bonne réponse"
        ><input class="v3-opt" id="qbO${i}" placeholder="Proposition ${i + 1}"></label>`).join('')}</div>
      <label class="v3-champ"><span>Explication (correction)</span><input id="qbExp" placeholder="On multiplie le poids d'huile par l'indice de saponification."></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="qbAjouter">${svg('plus', 'icon icon--18')} Ajouter à la banque</button>
      <p class="body-small muted" style="margin-top:8px">Les questions de la banque alimentent l'entraînement des élèves, la révision et les fiches : écrivez-en quelques-unes par cours.</p>`, { ico: 'task' })}
    ${carte(`Questions enregistrées (${qs.length})`, qs.length ? `<div class="v3-liste">${qs.map(q => `
      <div class="v3-qb">
        <div class="v3-qb__t"><span class="pill">${esc(q.coursTitre || 'Tous cours')}</span><span class="pill">${esc(q.type === 'multiple' ? 'Plusieurs réponses' : q.type === 'vraifaux' ? 'Vrai/Faux' : 'Simple')}</span>
          <span class="pill">Niveau ${q.difficulte}</span></div>
        <p class="body-medium">${esc(q.question)}</p>
        <ul class="v3-points v3-points--simples">${(q.options || []).map((o, i) => `<li>${(q.bonnes || []).includes(i) ? '✅ ' : ''}${esc(o)}</li>`).join('')}</ul>
        ${q.explication ? `<p class="body-small muted">${esc(q.explication)}</p>` : ''}
        <button class="text-btn ripple" data-act="qbSuppr" data-id="${esc(q.id)}">Supprimer</button>
      </div>`).join('')}</div>` : '<p class="body-small muted">Aucune question encore. La première sert tout de suite à l\'entraînement.</p>', { ico: 'layers' })}`;
  const type = document.getElementById('qbType');
  if (type) type.onchange = () => {
    const vf = type.value === 'vraifaux';
    const z = document.getElementById('qbOpts');
    if (vf) z.innerHTML = `<label class="v3-champ v3-champ--opt"><input type="checkbox" data-qbo="0"><input class="v3-opt" id="qbO0" value="Vrai"></label>
      <label class="v3-champ v3-champ--opt"><input type="checkbox" data-qbo="1"><input class="v3-opt" id="qbO1" value="Faux"></label>`;
    else if (z.querySelectorAll('.v3-opt').length !== 4) z.innerHTML = [0, 1, 2, 3].map(i => `<label class="v3-champ v3-champ--opt"><input type="checkbox" data-qbo="${i}"><input class="v3-opt" id="qbO${i}" placeholder="Proposition ${i + 1}"></label>`).join('');
  };
}

/* ------------------------------------------------------------
   C5 — ANNONCE
   ------------------------------------------------------------ */
function pageAnnonce(){
  return A.barPage('Écrire à mes élèves', '', `<div id="anCorps"></div>`);
}
async function annonceCharger(){
  const zone = document.getElementById('anCorps');
  if (!zone) return;
  const cours = await chargerCoursRef();
  zone.innerHTML = `
    ${carte('Nouvelle annonce', `
      <label class="v3-champ"><span>Destinataires</span><select id="anCours" class="v3-select">
        <option value="">Tous mes cours</option>${cours.map(c => `<option value="${esc(c.id)}">${esc(c.titre)}</option>`).join('')}</select></label>
      <label class="v3-champ"><span>Titre</span><input id="anTitre" placeholder="Séance reportée à samedi"></label>
      <label class="v3-champ"><span>Message</span><input id="anTexte" placeholder="Rendez-vous samedi 9 h, même lien."></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="anEnvoyer">${svg('bullhorn', 'icon icon--18')} Envoyer l'annonce</button>
      <p class="body-small muted" style="margin-top:8px">Chaque élève inscrit reçoit une notification dans son application.</p>`, { ico: 'bullhorn' })}
    ${V3.info('Une annonce courte et datée est lue. Évitez les messages sans titre : les élèves les confondent avec les notifications automatiques.', 'info')}`;
}

/* ------------------------------------------------------------
   C4 — NOTATION ASSISTÉE
   ------------------------------------------------------------ */
let NOTES = { copies: [], sel: {}, bareme: {}, commentaire: '' };
function pageNotation(){
  return A.barPage('Notation assistée', `<button class="text-btn ripple" data-act="ntBareme">Barème</button>`, `<div id="ntCorps"><p class="body-small muted">Chargement des copies…</p></div>`);
}
async function notationCharger(){
  const zone = document.getElementById('ntCorps');
  if (!zone) return;
  const r = await V3.lire('/api/submissions?limite=100');
  NOTES.copies = (r.ok && r.data && r.data.depots) ? r.data.depots : ((r.ok && r.data && r.data.submissions) ? r.data.submissions : []);
  const d = await V3.donnees('notation', { bareme: {}, commentaires: [] });
  const aNoter = NOTES.copies.filter(c => c.statut !== 'note');
  const notees = NOTES.copies.filter(c => c.statut === 'note');
  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('À noter', `<p class="v3-big">${aNoter.length}</p><p class="body-small muted">copie(s) en attente</p>`)}
      ${carte('Notées', `<p class="v3-big">${notees.length}</p><p class="body-small muted">déjà corrigée(s)</p>`)}
    </div>
    ${carte('Notation en lot', `
      <p class="body-small muted">Cochez plusieurs copies, choisissez une note et un commentaire : tout est appliqué d'un coup.</p>
      <div class="v3-grille v3-grille--2" style="margin-top:10px">
        <label class="v3-champ"><span>Note appliquée</span><input id="ntNote" type="number" min="0" max="20" value="15"></label>
        <label class="v3-champ"><span>Commentaire</span><select id="ntCom" class="v3-select">
          <option value="">(aucun)</option>${COMMENTAIRES.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
      </div>
      <button class="btn btn--filled btn--block ripple" data-act="ntAppliquer">${svg('check', 'icon icon--18')} Appliquer aux copies cochées</button>`, { ico: 'layers' })}
    ${carte('Copies en attente', aNoter.length ? `<div class="v3-liste">${aNoter.map(c => `
      <div class="v3-copie">
        <label class="v3-copie__t"><input type="checkbox" data-ntsel="${esc(c.id)}">
          <span><b>${esc(c.eleve_nom || c.eleve_email || 'Apprenant')}</b>
          <p>${esc(c.titre || c.assignment_titre || 'Devoir')} · ${esc(c.cours_titre || '')} · déposé ${esc(V3.quand(c.created_at))}</p></span></label>
        <div class="v3-copie__note">
          <input type="number" min="0" max="20" placeholder="note /20" data-ntnote="${esc(c.id)}">
          <input placeholder="commentaire" data-ntcom="${esc(c.id)}">
          <button class="btn btn--sm btn--filled ripple" data-act="ntNoter" data-id="${esc(c.id)}">Noter</button>
        </div>
      </div>`).join('')}</div>` : '<p class="body-small muted">Aucune copie en attente : tout est corrigé 👌</p>', { ico: 'edit' })}
    ${notees.length ? carte('Dernières copies notées', `<div class="v3-table">${notees.slice(0, 12).map(c => `
      <div class="v3-tr v3-tr--2"><span class="v3-td">${esc(c.eleve_nom || 'Apprenant')}<br><span class="body-small muted">${esc(c.titre || '')}</span></span>
        <span class="v3-td"><b>${c.note}/20</b><br><span class="body-small muted">${esc(V3.quand(c.updated_at || c.created_at))}</span></span></div>`).join('')}</div>`, { ico: 'check-circle' }) : ''}
    ${V3.info('Le barème enregistré s\'applique par défaut à vos copies : les notes restent cohérentes d\'un élève à l\'autre.', 'info')}`;
}

/* ------------------------------------------------------------
   C6 — SÉANCES EN DIRECT
   ------------------------------------------------------------ */
function pageSeances(){
  return A.barPage('Séances en direct', '', `<div id="seCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function seancesCharger(){
  const zone = document.getElementById('seCorps');
  if (!zone) return;
  const r = await V3.lire('/api/sync');
  const seances = (r.ok && r.data && (r.data.seances || r.data.sessions)) || [];
  const pres = await V3.donnees('presences', { liste: [] });
  zone.innerHTML = `
    ${V3.info('Un lien de visioconférence collé sur une séance apparaît chez les élèves avec un bouton « Rejoindre ». L\'émargement se fait d\'un appui côté élève.', 'video')}
    ${carte('Mes présences (élève)', `<p class="body-small muted">${(pres.liste || []).length} séance(s) marquée(s) présente(s).</p>`, { ico: 'check-circle' })}
    <div class="v3-liste">${seances.map(s => `
      <div class="v3-seance">
        <div class="v3-seance__t"><b>${esc(s.titre)}</b><span class="pill">${esc(s.type || 'Cours')}</span></div>
        <p class="body-small muted">${esc(s.heure || '')} · ${esc(s.duree_label || s.dureeLabel || '')} · ${esc(s.prof || '')}</p>
        ${s.lien ? `<a class="btn btn--sm btn--filled ripple" href="${esc(s.lien)}" target="_blank" rel="noopener">${svg('video', 'icon icon--18')} Rejoindre</a>` : '<p class="body-small muted">Pas encore de lien.</p>'}
        <div class="v3-seance__lien">
          <input placeholder="https://… (lien de visio)" value="${esc(s.lien || '')}" data-selien="${esc(s.id)}">
          <button class="btn btn--sm btn--tonal ripple" data-act="seLien" data-id="${esc(s.id)}">Enregistrer</button>
        </div>
      </div>`).join('') || '<p class="body-small muted">Aucune séance programmée.</p>'}</div>`;
}

/* ------------------------------------------------------------
   CLICS
   ------------------------------------------------------------ */
document.addEventListener('click', async e => {
  const t = e.target;

  /* --- C1 --- */
  const ed = t.closest('[data-act="ccEditer"]');
  if (ed){
    EDITE = { id: ed.dataset.id };
    A.popPage(); setTimeout(() => A.allerVers('/formateur/creer/' + encodeURIComponent(ed.dataset.id)), 60);
    return;
  }
  const lc = t.closest('[data-act="ccLecons"]');
  if (lc){
    EDITE = { id: lc.dataset.id };
    A.popPage(); setTimeout(() => A.allerVers('/formateur/creer/' + encodeURIComponent(lc.dataset.id)), 60);
    setTimeout(() => { const z = document.getElementById('lcModule'); if (z) z.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 700);
    return;
  }
  if (t.closest('[data-act="ccAnnuler"]')){ EDITE = null; creerCoursCharger(); A.toast('Formulaire effacé'); return; }
  if (t.closest('[data-act="ccEnregistrer"]')){
    const corps = {
      titre: (document.getElementById('ccTitre') || {}).value || '',
      categorie: (document.getElementById('ccCat') || {}).value || CATS[0],
      professeur: (document.getElementById('ccProf') || {}).value || V3.nomCompte(),
      prix: +(document.getElementById('ccPrix') || {}).value || 0,
      dureeLabel: (document.getElementById('ccDuree') || {}).value || '',
      description: (document.getElementById('ccDesc') || {}).value || '',
      accent: (document.getElementById('ccAcc') || {}).value || 'purple',
      ico: (document.getElementById('ccIco') || {}).value || 'flask',
      publie: (document.getElementById('ccPublie') || {}).getAttribute('aria-checked') === 'true'
    };
    if (corps.titre.trim().length < 3){ A.toast('Le titre doit faire au moins 3 caractères'); return; }
    const r = EDITE && EDITE.id
      ? await V3.api('/api/courses/' + encodeURIComponent(EDITE.id), { method: 'PATCH', body: JSON.stringify(corps) })
      : await V3.api('/api/courses', { method: 'POST', body: JSON.stringify(corps) });
    if (!r.ok){ A.toast(r.erreur || 'Enregistrement impossible'); return; }
    const cree = r.data && r.data.cours;
    await chargerCoursRef(true);
    if (cree && cree.id) EDITE = Object.assign({}, EDITE, { id: cree.id, titre: cree.titre });
    A.toast(EDITE && EDITE.id && cree ? 'Cours enregistré ✅ — ajoutez ses leçons juste en dessous' : 'Cours enregistré ✅');
    creerCoursCharger();
    return;
  }
  if (t.closest('[data-act="lcAjouter"]')){
    if (!EDITE || !EDITE.id){ A.toast('Créez d\'abord le cours, puis ajoutez ses leçons'); return; }
    const titre = (document.getElementById('lcTitre') || {}).value || '';
    if (titre.trim().length < 2){ A.toast('Écrivez le titre de la leçon'); return; }
    const corps = {
      moduleTitre: (document.getElementById('lcModule') || {}).value || 'Programme',
      moduleOrdre: 1, ordre: 1, titre: titre,
      dureeLabel: (document.getElementById('lcDuree') || {}).value || '',
      kind: (document.getElementById('lcKind') || {}).value || 'lecture', videoId: ''
    };
    const r = await V3.api('/api/courses/' + encodeURIComponent(EDITE.id) + '/lessons', { method: 'POST', body: JSON.stringify(corps) });
    if (!r.ok){ A.toast(r.erreur || 'Ajout impossible'); return; }
    A.toast('Leçon ajoutée ✅');
    const z = document.getElementById('lcTitre'); if (z) z.value = '';
    await chargerCoursRef(true);
    return;
  }

  /* --- C2 --- */
  if (t.closest('[data-act="qbAjouter"]')){
    const options = [...document.querySelectorAll('.v3-opt')].map(i => i.value.trim()).filter(Boolean);
    const bonnes = [...document.querySelectorAll('[data-qbo]')].filter(c => c.checked).map(c => +c.dataset.qbo).filter(i => i < options.length);
    const corps = {
      courseId: (document.getElementById('qbCours') || {}).value || '',
      type: (document.getElementById('qbType') || {}).value || 'simple',
      difficulte: +(document.getElementById('qbDiff') || {}).value || 2,
      question: (document.getElementById('qbQ') || {}).value || '',
      options: options, bonnes: bonnes,
      explication: (document.getElementById('qbExp') || {}).value || ''
    };
    const r = await V3.ecrire('/api/banque', corps);
    if (!r.ok){ A.toast(r.erreur || 'Question refusée'); return; }
    A.toast('Question ajoutée à la banque ✅');
    questionsCharger();
    return;
  }
  const qd = t.closest('[data-act="qbSuppr"]');
  if (qd){
    const r = await V3.api('/api/banque/' + encodeURIComponent(qd.dataset.id), { method: 'DELETE' });
    A.toast(r.ok ? 'Question supprimée' : (r.erreur || 'Suppression impossible'));
    questionsCharger();
    return;
  }

  /* --- C5 --- */
  if (t.closest('[data-act="anEnvoyer"]')){
    const corps = {
      courseId: (document.getElementById('anCours') || {}).value || '',
      titre: (document.getElementById('anTitre') || {}).value || '',
      texte: (document.getElementById('anTexte') || {}).value || ''
    };
    if (!corps.titre.trim()){ A.toast('Écrivez un titre'); return; }
    const r = await V3.ecrire('/api/annonces', corps);
    if (!r.ok){ A.toast(r.erreur || 'Envoi impossible'); return; }
    A.toast('Annonce envoyée à ' + ((r.data && r.data.envoyees) || 0) + ' élève(s)');
    document.getElementById('anTitre').value = '';
    document.getElementById('anTexte').value = '';
    return;
  }

  /* --- C4 --- */
  const ns = t.closest('[data-ntsel]');
  if (ns){ NOTES.sel[ns.dataset.ntsel] = ns.checked; return; }
  const nn = t.closest('[data-act="ntNoter"]');
  if (nn){
    const id = nn.dataset.id;
    const note = +(document.querySelector('[data-ntnote="' + id + '"]') || {}).value;
    const commentaire = (document.querySelector('[data-ntcom="' + id + '"]') || {}).value || '';
    if (isNaN(note)){ A.toast('Saisissez une note sur 20'); return; }
    const r = await V3.api('/api/submissions/' + encodeURIComponent(id), { method: 'PATCH',
      body: JSON.stringify({ note: note, statut: 'note', commentaire: commentaire }) });
    A.toast(r.ok ? 'Copie notée ✅' : (r.erreur || 'Notation impossible'));
    if (r.ok) notationCharger();
    return;
  }
  if (t.closest('[data-act="ntAppliquer"]')){
    const ids = Object.keys(NOTES.sel).filter(k => NOTES.sel[k]);
    if (!ids.length){ A.toast('Cochez d\'abord des copies'); return; }
    const note = +(document.getElementById('ntNote') || {}).value;
    const commentaire = (document.getElementById('ntCom') || {}).value || '';
    let n = 0;
    for (const id of ids){
      const r = await V3.api('/api/submissions/' + encodeURIComponent(id), { method: 'PATCH',
        body: JSON.stringify({ note: note, statut: 'note', commentaire: commentaire }) });
      if (r.ok) n++;
    }
    NOTES.sel = {};
    A.toast(n + ' copie(s) notée(s)');
    notationCharger();
    return;
  }
  if (t.closest('[data-act="ntBareme"]')){
    A.dialog({ title: 'Barème', text: 'Enregistré une fois pour toutes : les notes restent cohérentes d\'une copie à l\'autre.', confirmLabel: 'Fermer', cancel: false, ico: 'edit' });
    return;
  }

  /* --- C6 --- */
  const sl = t.closest('[data-act="seLien"]');
  if (sl){
    const id = sl.dataset.id;
    const lien = (document.querySelector('[data-selien="' + id + '"]') || {}).value || '';
    const r = await V3.api('/api/sessions/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ lien: lien, enligne: !!lien }) });
    A.toast(r.ok ? 'Lien de séance enregistré ✅' : (r.erreur || 'Enregistrement impossible'));
    return;
  }
});

/* ------------------------------------------------------------
   ÉCRANS
   ------------------------------------------------------------ */
A.PAGES.revenus = { single: true, render: pageRevenus, mount(){ revenusCharger(); } };
A.PAGES.creercours = { render: pageCreerCours, mount(el, params){
  EDITE = null;
  el.dataset.id = (params && params.id) || '';
  creerCoursCharger(params);
} };
A.PAGES.questions = { single: true, render: pageQuestions, mount(){ questionsCharger(); } };
A.PAGES.annonce = { single: true, render: pageAnnonce, mount(){ annonceCharger(); } };
A.PAGES.notation = { single: true, render: pageNotation, mount(){ notationCharger(); } };
A.PAGES.seances = { single: true, render: pageSeances, mount(){ seancesCharger(); } };

window.LHV3FORMATEUR = { COMMENTAIRES: COMMENTAIRES, coursRef: chargerCoursRef };
})();
