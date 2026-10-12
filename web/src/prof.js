/* ============================================================
   ESPACE FORMATEUR (v2)
   ------------------------------------------------------------
   Le formateur gère ses cours depuis l'application, sur son compte :
   créer et modifier un cours, ajouter ou retirer des leçons et des
   ressources, programmer ou annuler une séance, et suivre ses
   apprenants (progression, dépôts à corriger, dernière activité).

   Tout passe par l'API du site (aucun écran simulé) : ce qui est
   modifié ici l'est aussi pour les apprenants, immédiatement.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const { barPage, svg, dialog, toast, pushPage } = A;

const esc = t => String(t === null || t === undefined ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const compte  = () => (window.LHCOMPTE && window.LHCOMPTE.compte) ? window.LHCOMPTE.compte() : null;
const encadre = () => { const c = compte(); return !!(c && (c.role === 'enseignant' || c.role === 'admin')); };
const api = (chemin, opts) => window.LHCOMPTE.api(chemin, opts).catch(() => new Response('{"ok":false}',
  { status: 503, headers: { 'Content-Type': 'application/json' } }));
const lire = async (chemin, opts) => { const r = await api(chemin, opts); return r.json().catch(() => ({})); };
const envoi = (chemin, corps, methode) => lire(chemin, {
  method: methode || 'POST', body: JSON.stringify(corps)
});

/* état de l'écran : il survit aux changements d'onglet */
const ETAT = {
  onglet: 'cours', coursId: '', edition: '', erreur: '', info: '',
  cours: [], detail: null, seances: [], apprenants: [], charge: false
};

const ONGLETS = [
  ['cours', 'Cours', 'book'],
  ['lecons', 'Leçons', 'task'],
  ['ressources', 'Ressources', 'download'],
  ['seances', 'Séances', 'calendar'],
  ['apprenants', 'Apprenants', 'person']
];

/* ------------------------------------------------------------
   Rendu
   ------------------------------------------------------------ */
function pageEspace(){
  if (!encadre()){
    return barPage('Espace formateur', '', `
      <div class="note" style="margin-bottom:14px">${svg('lock', 'icon')}
        <span>Cet espace est réservé aux comptes <b>formateur</b> et <b>administrateur</b>.
        Votre compte actuel est un compte apprenant.</span></div>
      <button class="btn btn--tonal btn--block ripple" data-pf="compte">Voir mon compte</button>`);
  }
  const onglets = ONGLETS.map(([id, libelle, ico]) =>
    `<button class="tab ripple${ETAT.onglet === id ? ' is-active' : ''}" data-pf="onglet" data-onglet="${id}">
       ${svg(ico, 'icon icon--16')} ${libelle}</button>`).join('');
  return barPage('Espace formateur',
    `<button class="text-btn ripple" data-pf="recharger">Actualiser</button>`, `
    <div class="tabs pf-tabs" style="overflow-x:auto">${onglets}</div>
    <div id="pfInfo"></div>
    <div id="pfCorps" style="margin-top:14px"><p class="body-small muted">Chargement…</p></div>`);
}

function ligneCours(c){
  const actif = c.id === ETAT.coursId;
  return `<div class="list-row" style="align-items:flex-start">
    <span class="list-row__ico acc-${esc(c.accent || 'purple')}">${svg(c.ico || 'book', 'icon icon--20')}</span>
    <div class="list-row__main">
      <h3>${esc(c.titre)}</h3>
      <p>${esc(c.categorie || '')} · ${esc(c.duree_label || '')} · ${esc(c.prof || '')}</p>
      <span class="body-small muted pf-ligne">${c.total_lecons || 0} leçon(s) · ${c.videos || 0} vidéo(s) · ${c.quiz || 0} quiz · ${c.devoirs || 0} devoir(s)</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn btn--sm btn--outlined ripple" data-pf="editer" data-id="${esc(c.id)}">Modifier</button>
      <button class="btn btn--sm btn--tonal ripple" data-pf="aller-lecons" data-id="${esc(c.id)}">Leçons</button>
    </div>
  </div>${actif ? '<span class="body-small muted" style="display:block;padding:0 4px 10px">Cours en cours d\'édition ci-dessus.</span>' : ''}`;
}

function formulaireCours(){
  const enEdition = ETAT.cours.find(c => c.id === ETAT.edition) || {};
  return `<form class="card card--pad" data-pf="form-cours" style="margin-bottom:14px">
    <div class="sec__h" style="margin-bottom:10px"><h2>${ETAT.edition ? 'Modifier le cours' : 'Créer un cours'}</h2></div>
    <div class="field"><input id="pfTitre" placeholder=" " value="${esc(enEdition.titre || '')}" maxlength="140"><label for="pfTitre">Titre du cours</label></div>
    <div class="field"><input id="pfCat" placeholder=" " value="${esc(enEdition.categorie || '')}" maxlength="60"><label for="pfCat">Catégorie (ex. Savonnerie)</label></div>
    <div class="field"><input id="pfProf" placeholder=" " value="${esc(enEdition.prof || (compte() && compte().nom) || '')}" maxlength="80"><label for="pfProf">Formateur</label></div>
    <div class="field"><input id="pfDuree" placeholder=" " value="${esc(enEdition.duree_label || '')}" maxlength="30"><label for="pfDuree">Durée affichée (ex. 4 h 30)</label></div>
    <div class="field field--area"><textarea id="pfDesc" placeholder=" " style="min-height:110px" maxlength="2000">${esc(enEdition.description || '')}</textarea><label for="pfDesc">Description</label></div>
    <div style="display:flex;gap:10px">
      <div class="field" style="flex:1"><input id="pfNiveau" placeholder=" " value="${esc(enEdition.accent || 'purple')}" maxlength="20"><label for="pfNiveau">Couleur (purple, green…)</label></div>
      <div class="field" style="flex:1"><input id="pfIco" placeholder=" " value="${esc(enEdition.ico || 'book')}" maxlength="30"><label for="pfIco">Icône</label></div>
    </div>
    <button type="button" class="btn btn--filled btn--block ripple" data-pf="${ETAT.edition ? 'enregistrer-cours' : 'creer-cours'}">
      ${svg(ETAT.edition ? 'check' : 'plus', 'icon icon--18')} ${ETAT.edition ? 'Enregistrer les modifications' : 'Créer le cours'}</button>
    ${ETAT.edition ? `<button type="button" class="btn btn--text btn--block ripple" data-pf="annuler-edition">Annuler l'édition</button>` : ''}
  </form>`;
}

function corpsCours(){
  return `${formulaireCours()}
    <div class="sec__h"><h2>Mes cours (${ETAT.cours.length})</h2></div>
    <div class="card">${ETAT.cours.map(ligneCours).join('') || `<p class="body-small muted" style="padding:14px">Aucun cours pour l'instant : créez le premier ci-dessus.</p>`}</div>`;
}

const champVide = (id, libelle, valeur, max) =>
  `<div class="field"><input id="${id}" placeholder=" " value="${esc(valeur || '')}" maxlength="${max || 80}"><label for="${id}">${libelle}</label></div>`;

function choixCours(idSelect){
  return `<div class="field"><select id="${idSelect}" aria-label="Cours">
    <option value="">— Choisir un cours —</option>
    ${ETAT.cours.map(c => `<option value="${esc(c.id)}"${c.id === ETAT.coursId ? ' selected' : ''}>${esc(c.titre)}</option>`).join('')}
  </select><label for="${idSelect}">Cours</label></div>`;
}

function corpsLecons(){
  if (!ETAT.cours.length) return `<p class="body-small muted">Créez d'abord un cours dans l'onglet Cours.</p>`;
  const d = ETAT.detail;
  const modules = (d && d.modules) || [];
  const liste = modules.length ? modules.map(m => `
      <div class="sec__h" style="margin:10px 0 4px"><h3 class="body-large">${esc(m.titre)}</h3></div>
      ${(m.lecons || []).map(l => `<div class="list-row">
          <span class="list-row__ico acc-purple">${svg(l.kind === 'video' ? 'play' : 'task', 'icon icon--20')}</span>
          <div class="list-row__main"><h3>${esc(l.titre)}</h3>
            <p>${esc(l.duree_label || '')} · ${esc(l.kind || 'lecture')}</p></div>
          <button class="icon-btn ripple" data-pf="retirer-lecon" data-id="${esc(l.id)}" aria-label="Retirer cette leçon">${svg('close', 'icon icon--20')}</button>
        </div>`).join('')}`).join('')
    : `<p class="body-small muted" style="padding:10px 2px">Aucune leçon dans ce cours.</p>`;
  return `${choixCours('pfCours')}
    <form class="card card--pad" data-pf="form-lecon" style="margin-bottom:14px">
      <div class="sec__h" style="margin-bottom:10px"><h2>Ajouter une leçon</h2></div>
      ${champVide('pfModTitre', 'Module (ex. Module 1 — Bases)', '', 120)}
      <div style="display:flex;gap:10px">
        ${champVide('pfModuleOrdre', 'Module n°', '1', 2)}
        ${champVide('pfOrdre', 'Leçon n°', String(((d && d.modules && d.modules[0] && d.modules[0].lecons) || []).length + 1), 2)}
      </div>
      ${champVide('pfLecTitre', 'Titre de la leçon', '', 160)}
      <div style="display:flex;gap:10px">
        ${champVide('pfLecDuree', 'Durée (ex. 12 min)', '', 30)}
        <div class="field"><select id="pfLecKind" aria-label="Type de leçon">
          <option value="lecture">Lecture</option><option value="video">Vidéo</option>
          <option value="quiz">Quiz</option><option value="exercice">Exercice</option>
        </select><label for="pfLecKind">Type</label></div>
      </div>
      <button type="button" class="btn btn--filled btn--block ripple" data-pf="ajouter-lecon">${svg('plus', 'icon icon--18')} Ajouter la leçon</button>
    </form>
    <div class="sec__h"><h2>Programme actuel</h2></div>
    <div class="card card--pad">${liste}</div>`;
}

function corpsRessources(){
  if (!ETAT.cours.length) return `<p class="body-small muted">Créez d'abord un cours dans l'onglet Cours.</p>`;
  const ressources = (ETAT.detail && ETAT.detail.ressources) || [];
  const liste = ressources.length ? ressources.map(r => `<div class="list-row">
      <span class="list-row__ico acc-${esc(r.accent || 'green')}">${svg(r.ico || 'task', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.type_label || '')}${r.url ? ' · ' + esc(r.url) : ''}</p></div>
      <button class="icon-btn ripple" data-pf="retirer-ressource" data-id="${esc(r.id)}" aria-label="Retirer cette ressource">${svg('close', 'icon icon--20')}</button>
    </div>`).join('') : `<p class="body-small muted" style="padding:10px 2px">Aucune ressource pour ce cours.</p>`;
  return `${choixCours('pfCours')}
    <form class="card card--pad" data-pf="form-ressource" style="margin-bottom:14px">
      <div class="sec__h" style="margin-bottom:10px"><h2>Ajouter une ressource</h2></div>
      ${champVide('pfResTitre', 'Titre (ex. Fiche recette)', '', 160)}
      ${champVide('pfResType', 'Type (ex. PDF, 240 Ko)', '', 40)}
      ${champVide('pfResUrl', 'Lien (facultatif)', '', 500)}
      <button type="button" class="btn btn--filled btn--block ripple" data-pf="ajouter-ressource">${svg('plus', 'icon icon--18')} Ajouter la ressource</button>
    </form>
    <div class="sec__h"><h2>Ressources du cours (${ressources.length})</h2></div>
    <div class="card">${liste}</div>`;
}

function corpsSeances(){
  const liste = ETAT.seances.length ? ETAT.seances.map(se => `<div class="list-row" style="align-items:flex-start">
      <span class="list-row__ico acc-blue">${svg('calendar', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(se.titre)}</h3>
        <p>${esc(se.date_session || '')} ${esc(se.heure || '')} · ${esc(se.duree_label || '')} · ${esc(se.salle || 'En ligne')}</p>
        <span class="body-small muted">${esc(se.cours_titre || 'Séance libre')}${se.prof ? ' · ' + esc(se.prof) : ''}</span></div>
      <button class="icon-btn ripple" data-pf="annuler-seance" data-id="${esc(se.id)}" aria-label="Annuler cette séance">${svg('close', 'icon icon--20')}</button>
    </div>`).join('') : `<p class="body-small muted" style="padding:10px 2px">Aucune séance programmée.</p>`;
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return `<form class="card card--pad" data-pf="form-seance" style="margin-bottom:14px">
      <div class="sec__h" style="margin-bottom:10px"><h2>Programmer une séance</h2></div>
      ${champVide('pfSeTitre', 'Titre (ex. Atelier saponification)', '', 160)}
      <div style="display:flex;gap:10px">
        ${champVide('pfSeDate', 'Date (AAAA-MM-JJ)', demain, 10)}
        ${champVide('pfSeHeure', 'Heure', '09:00', 5)}
      </div>
      <div style="display:flex;gap:10px">
        ${champVide('pfSeDuree', 'Durée', '1 h 30', 20)}
        <div class="field"><select id="pfSeType" aria-label="Type de séance">
          <option value="Cours">Cours</option><option value="Atelier">Atelier</option>
          <option value="Live">Live</option><option value="Évaluation">Évaluation</option>
        </select><label for="pfSeType">Type</label></div>
      </div>
      ${champVide('pfSeSalle', 'Salle ou lien', 'En ligne', 80)}
      ${choixCours('pfSeCours')}
      <button type="button" class="btn btn--filled btn--block ripple" data-pf="creer-seance">${svg('plus', 'icon icon--18')} Programmer la séance</button>
    </form>
    <div class="sec__h"><h2>Agenda des séances (${ETAT.seances.length})</h2></div>
    <div class="card">${liste}</div>`;
}

function corpsApprenants(){
  if (!ETAT.cours.length) return `<p class="body-small muted">Créez d'abord un cours dans l'onglet Cours.</p>`;
  const liste = ETAT.apprenants.length ? ETAT.apprenants.map(ap => {
    const quand = ap.derniere_activite ? String(ap.derniere_activite).slice(0, 10) : 'jamais';
    return `<div class="list-row" style="align-items:flex-start">
      <span class="list-row__ico acc-purple" style="width:38px;height:38px">${esc((ap.nom || '?').trim().charAt(0).toUpperCase())}</span>
      <div class="list-row__main">
        <h3>${esc(ap.nom)}</h3>
        <p>${esc(ap.email)} · dernière activité : ${esc(quand)}</p>
        <div class="lp" style="margin:6px 0 4px"><div class="lp__track"></div><div class="lp__bar" style="width:${Math.max(0, Math.min(100, ap.progress || 0))}%"></div></div>
        <span class="body-small muted">${esc(ap.progress || 0)} % · ${esc(ap.lecons_faites || 0)} leçon(s) terminée(s) · ${esc(ap.depots || 0)} dépôt(s)${ap.a_noter ? ' · <b>' + esc(ap.a_noter) + ' à corriger</b>' : ''}${ap.moyenne_quiz === null || ap.moyenne_quiz === undefined ? '' : ' · quiz ' + esc(ap.moyenne_quiz) + ' %'}</span>
      </div>
    </div>`;
  }).join('') : `<p class="body-small muted" style="padding:10px 2px">Aucun apprenant inscrit à ce cours pour l'instant.</p>`;
  return `${choixCours('pfCours')}
    <div class="card card--pad" style="margin-bottom:14px;display:flex;gap:10px;align-items:center">
      <span class="list-row__ico acc-amber">${svg('upload', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>Copies à corriger</h3><p>Noter les devoirs déposés par les apprenants</p></div>
      <button class="text-btn ripple" data-pf="corrections">Ouvrir</button>
    </div>
    <div class="sec__h"><h2>Apprenants inscrits (${ETAT.apprenants.length})</h2></div>
    <div class="card">${liste}</div>`;
}

function corps(){
  if (ETAT.erreur) return `<div class="note">${svg('info', 'icon')}<span>${esc(ETAT.erreur)}</span></div>`;
  if (ETAT.onglet === 'cours') return corpsCours();
  if (ETAT.onglet === 'lecons') return corpsLecons();
  if (ETAT.onglet === 'ressources') return corpsRessources();
  if (ETAT.onglet === 'seances') return corpsSeances();
  return corpsApprenants();
}

/* ------------------------------------------------------------
   Données
   ------------------------------------------------------------ */
async function chargerCours(){
  const j = await lire('/api/courses');
  ETAT.cours = (j && j.data && j.data.cours) || [];
  if (!ETAT.coursId && ETAT.cours.length) ETAT.coursId = ETAT.cours[0].id;
}
async function chargerDetail(){
  if (!ETAT.coursId){ ETAT.detail = null; return; }
  const j = await lire('/api/courses/' + encodeURIComponent(ETAT.coursId));
  ETAT.detail = (j && j.data) || null;
}
async function chargerSeances(){
  const j = await lire('/api/sessions');
  ETAT.seances = (j && j.data && j.data.seances) || [];
}
async function chargerApprenants(){
  if (!ETAT.coursId){ ETAT.apprenants = []; return; }
  const j = await lire('/api/courses/' + encodeURIComponent(ETAT.coursId) + '/apprenants');
  ETAT.apprenants = (j && j.data && j.data.apprenants) || [];
}
async function toutCharger(){
  ETAT.charge = false;
  try {
    await chargerCours();
    if (ETAT.onglet === 'lecons' || ETAT.onglet === 'ressources') await chargerDetail();
    if (ETAT.onglet === 'seances') await chargerSeances();
    if (ETAT.onglet === 'apprenants') await chargerApprenants();
    ETAT.erreur = '';
  } catch (e){ ETAT.erreur = 'Chargement impossible : ' + String(e.message || e); }
  ETAT.charge = true;
}

/* ------------------------------------------------------------
   Actions
   ------------------------------------------------------------ */
const val = (el, id) => { const c = el.querySelector('#' + id); return c ? c.value.trim() : ''; };
const nombre = (el, id, defaut) => { const n = parseInt(val(el, id), 10); return isNaN(n) ? defaut : n; };

function annoncer(el, texte, erreur){
  const zone = el.querySelector('#pfInfo');
  if (!zone) return;
  zone.innerHTML = texte ? `<div class="note" style="margin-top:12px">${svg(erreur ? 'info' : 'check', 'icon')}<span>${esc(texte)}</span></div>` : '';
}

async function creerCours(el, enEdition){
  const corps = {
    titre: val(el, 'pfTitre'), categorie: val(el, 'pfCat'), professeur: val(el, 'pfProf'),
    dureeLabel: val(el, 'pfDuree'), description: val(el, 'pfDesc'),
    accent: val(el, 'pfNiveau') || 'purple', ico: val(el, 'pfIco') || 'book'
  };
  if (corps.titre.length < 3 || corps.categorie.length < 2 || corps.professeur.length < 2){
    annoncer(el, 'Titre (3 caractères), catégorie et formateur sont obligatoires.', true); return;
  }
  const j = enEdition
    ? await envoi('/api/courses/' + encodeURIComponent(enEdition), corps, 'PATCH')
    : await envoi('/api/courses', corps, 'POST');
  if (!j || !j.ok){ annoncer(el, (j && j.error && j.error.message) || 'Enregistrement refusé par le serveur.', true); return; }
  const cree = j.data && j.data.cours;
  if (cree && cree.id) ETAT.coursId = cree.id;
  ETAT.edition = '';
  /* après une création, on enchaîne directement sur les leçons du nouveau cours */
  if (!enEdition && cree && cree.id){
    ETAT.onglet = 'lecons';
    el.querySelectorAll('.pf-tabs .tab').forEach(t => t.classList.toggle('is-active', t.dataset.onglet === 'lecons'));
  }
  await toutCharger(); peindre(el);
  annoncer(el, enEdition ? 'Cours modifié : les apprenants le voient déjà.' : 'Cours créé : ajoutez-lui des leçons.');
  A.notification('cours', enEdition ? 'Cours modifié' : 'Cours créé', corps.titre + ' est à jour.', ['cours', ETAT.coursId]);
}

async function ajouterLecon(el){
  if (!ETAT.coursId){ annoncer(el, 'Choisissez d\'abord un cours.', true); return; }
  const corps = {
    moduleTitre: val(el, 'pfModTitre') || 'Module 1',
    moduleOrdre: nombre(el, 'pfModuleOrdre', 1), ordre: nombre(el, 'pfOrdre', 1),
    titre: val(el, 'pfLecTitre'), dureeLabel: val(el, 'pfLecDuree'),
    kind: val(el, 'pfLecKind') || 'lecture'
  };
  if (corps.titre.length < 2){ annoncer(el, 'Donnez un titre à la leçon.', true); return; }
  const j = await envoi('/api/courses/' + encodeURIComponent(ETAT.coursId) + '/lessons', corps);
  if (!j || !j.ok){ annoncer(el, (j && j.error && j.error.message) || 'Ajout refusé par le serveur.', true); return; }
  await toutCharger(); peindre(el); annoncer(el, 'Leçon ajoutée au programme.');
}

async function retirerLecon(el, id){
  const ok = await dialog({ title: 'Retirer cette leçon ?', text: 'Elle disparaîtra du programme des apprenants.',
    confirmLabel: 'Retirer', danger: true, ico: 'task' });
  if (!ok) return;
  const j = await lire('/api/lessons/' + encodeURIComponent(id), { method: 'DELETE' });
  await toutCharger(); peindre(el);
  annoncer(el, j && j.ok ? 'Leçon retirée.' : 'Retrait refusé par le serveur.', !(j && j.ok));
}

async function ajouterRessource(el){
  if (!ETAT.coursId){ annoncer(el, 'Choisissez d\'abord un cours.', true); return; }
  const corps = { titre: val(el, 'pfResTitre'), typeLabel: val(el, 'pfResType'), url: val(el, 'pfResUrl'), ico: 'task', accent: 'green' };
  if (corps.titre.length < 2){ annoncer(el, 'Donnez un titre à la ressource.', true); return; }
  const j = await envoi('/api/courses/' + encodeURIComponent(ETAT.coursId) + '/resources', corps);
  if (!j || !j.ok){ annoncer(el, (j && j.error && j.error.message) || 'Ajout refusé par le serveur.', true); return; }
  await toutCharger(); peindre(el); annoncer(el, 'Ressource ajoutée au cours.');
}

async function retirerRessource(el, id){
  const ok = await dialog({ title: 'Retirer cette ressource ?', text: 'Elle ne sera plus proposée aux apprenants.',
    confirmLabel: 'Retirer', danger: true, ico: 'download' });
  if (!ok) return;
  const j = await lire('/api/resources/' + encodeURIComponent(id), { method: 'DELETE' });
  await toutCharger(); peindre(el);
  annoncer(el, j && j.ok ? 'Ressource retirée.' : 'Retrait refusé par le serveur.', !(j && j.ok));
}

async function creerSeance(el){
  const date = val(el, 'pfSeDate');
  const corps = {
    titre: val(el, 'pfSeTitre'), dateSession: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    heure: val(el, 'pfSeHeure') || '09:00', type: val(el, 'pfSeType') || 'Cours',
    dureeLabel: val(el, 'pfSeDuree') || '1 h', salle: val(el, 'pfSeSalle'),
    courseId: val(el, 'pfSeCours') || null, prof: (compte() && compte().nom) || '',
    rappel: true, description: ''
  };
  if (corps.titre.length < 3){ annoncer(el, 'Donnez un titre à la séance (3 caractères au moins).', true); return; }
  const j = await envoi('/api/sessions', corps);
  if (!j || !j.ok){ annoncer(el, (j && j.error && j.error.message) || 'Programmation refusée par le serveur.', true); return; }
  await chargerSeances(); peindre(el); annoncer(el, 'Séance programmée : les apprenants la voient dans leur agenda.');
  A.notification('session', 'Nouvelle séance', corps.titre + ' — ' + (corps.dateSession || '') + ' ' + corps.heure, ['seance', '']);
}

async function annulerSeance(el, id){
  const ok = await dialog({ title: 'Annuler cette séance ?', text: 'Elle sera retirée de l\'agenda de tous les apprenants.',
    confirmLabel: 'Annuler la séance', danger: true, ico: 'calendar' });
  if (!ok) return;
  const j = await lire('/api/sessions/' + encodeURIComponent(id), { method: 'DELETE' });
  await chargerSeances(); peindre(el);
  annoncer(el, j && j.ok ? 'Séance annulée.' : 'Annulation refusée par le serveur.', !(j && j.ok));
}

/* ------------------------------------------------------------
   Peinture + interactions
   ------------------------------------------------------------ */
function peindre(el){
  const zone = el.querySelector('#pfCorps');
  if (zone) zone.innerHTML = corps();
}

function brancher(el){
  /* changement d'onglet */
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-pf]');
    if (!b || !el.contains(b)) return;
    const act = b.dataset.pf;

    if (act === 'onglet'){
      ETAT.onglet = b.dataset.onglet || 'cours'; ETAT.erreur = '';
      el.querySelectorAll('.pf-tabs .tab').forEach(t => t.classList.toggle('is-active', t === b));
      peindre(el); await toutCharger(); peindre(el); return;
    }
    if (act === 'recharger'){ await toutCharger(); peindre(el); annoncer(el, 'Données à jour.'); return; }
    if (act === 'compte'){ pushPage('compte', {}); return; }
    if (act === 'corrections'){ pushPage('corrections', {}); return; }
    if (act === 'editer'){ ETAT.edition = b.dataset.id; peindre(el); return; }
    if (act === 'annuler-edition'){ ETAT.edition = ''; peindre(el); return; }
    if (act === 'aller-lecons'){ ETAT.coursId = b.dataset.id; ETAT.onglet = 'lecons'; await toutCharger(); peindre(el);
      el.querySelectorAll('.pf-tabs .tab').forEach(t => t.classList.toggle('is-active', t.dataset.onglet === 'lecons')); return; }
    if (act === 'creer-cours'){ await creerCours(el, ''); return; }
    if (act === 'enregistrer-cours'){ await creerCours(el, ETAT.edition); return; }
    if (act === 'ajouter-lecon'){ await ajouterLecon(el); return; }
    if (act === 'retirer-lecon'){ await retirerLecon(el, b.dataset.id); return; }
    if (act === 'ajouter-ressource'){ await ajouterRessource(el); return; }
    if (act === 'retirer-ressource'){ await retirerRessource(el, b.dataset.id); return; }
    if (act === 'creer-seance'){ await creerSeance(el); return; }
    if (act === 'annuler-seance'){ await annulerSeance(el, b.dataset.id); return; }
  });

  /* changement de cours sélectionné (leçons, ressources, apprenants, séances) */
  el.addEventListener('change', async e => {
    const s = e.target.closest('#pfCours, #pfSeCours');
    if (!s) return;
    ETAT.coursId = s.value;
    await toutCharger(); peindre(el);
  });
}

A.PAGES = A.PAGES || {};
A.PAGES['espace-formateur'] = {
  single: true,
  render(){ return pageEspace(); },
  mount(el){ brancher(el); toutCharger().then(() => peindre(el)).then(() => {
    if (ETAT.onglet !== 'cours' && !ETAT.cours.length) peindre(el);
  }); }
};

A.ACTIONS = A.ACTIONS || {};
A.ACTIONS.espaceProf = () => pushPage('espace-formateur', {});
A.ACTIONS.pfEspaceProf = A.ACTIONS.espaceProf;

window.LHPROF = { etat: ETAT, charger: async () => { await toutCharger(); return ETAT; }, encadre, ouvrir: () => pushPage('espace-formateur', {}) };
})();
