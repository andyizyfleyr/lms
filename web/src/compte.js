/* ============================================================
   COMPTES COSMÉTILAB
   • Écran d'accueil : se connecter, créer un compte, explorer sans compte
   • Un espace de données par utilisateur (clés de stockage préfixées
     par l'identifiant du compte) → aucune fuite entre deux personnes
   • Synchronisation en temps réel : l'application pousse chaque
     changement et interroge l'API en continu ; une modification faite
     ailleurs (autre téléphone, espace formateur) arrive ici toute seule
   • Espace formateur : liste des copies déposées et notation

   Dépend de core.js (window.APPX) et de LHSYNC.
   ============================================================ */
(function(){
'use strict';

const CLE_COMPTE = 'lh:compte';   // compte actif : {id, nom, email, role, token}
const CLE_DERNIER = 'lh:dernier'; // dernier e-mail utilisé (pré-remplissage)
const DELAI_DIRECT = 4000;        // interrogation de l'API (ms) au premier plan
const DELAI_ARRIERE = 15000;      // en arrière-plan

/* ---------- utilitaires locaux (le noyau n'expose pas $ ni esc) ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const lire = (c, d) => { try { const v = localStorage.getItem(c); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const ecrire = (c, v) => { try { v === null ? localStorage.removeItem(c) : localStorage.setItem(c, JSON.stringify(v)); } catch (e) {} };
const ecrireBrut = (c, v) => { try { v ? localStorage.setItem(c, v) : localStorage.removeItem(c); } catch (e) {} };

function dire(msg){
  const el = $('#snack') || $('#toast') || $('.snack');
  if (el){
    el.textContent = msg;
    el.classList.add('is-open', 'is-visible');
    clearTimeout(dire._t);
    dire._t = setTimeout(() => { el.classList.remove('is-open', 'is-visible'); }, 2800);
    return;
  }
  let b = $('#ctBulle');
  if (!b){
    b = document.createElement('div');
    b.id = 'ctBulle';
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:88px;z-index:1200;background:var(--md-inverse-surface);color:var(--md-inverse-on-surface);padding:12px 16px;border-radius:14px;font:500 14px/1.4 Roboto,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);transition:opacity .25s';
    document.body.appendChild(b);
  }
  b.textContent = msg;
  b.style.opacity = '1';
  clearTimeout(dire._t);
  dire._t = setTimeout(() => { b.style.opacity = '0'; }, 2800);
}

const compte  = () => lire(CLE_COMPTE, null);
const estInvite = () => { const c = compte(); return !!c && c.id === 'invite'; };
const jeton    = () => { const c = compte(); return (c && c.token) || ''; };
const urlBase  = () => {
  let b = '';
  try { b = localStorage.getItem('lh_api') || ''; } catch (e) {}
  if (!b && location.protocol.indexOf('http') === 0) b = location.origin;
  return b.replace(/\/+$/, '');
};
const api = (chemin, opts) => {
  opts = opts || {};
  const t = jeton();
  const h = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (t) h.Authorization = 'Bearer ' + t;
  return fetch(urlBase() + chemin, Object.assign({}, opts, { headers: h, cache: 'no-store' }));
};
const lireJSON = async (r) => { try { const j = await r.json(); return (j && j.data) ? j.data : j; } catch (e) { return null; } };

/* ---------- état partagé (indicateur « en direct ») ---------- */
const DIRECT = { revision: null, dernier: 0, etat: 'inactif', erreur: '' };

function majIndicateur(texte){
  DIRECT.etat = texte || DIRECT.etat;
  $$('[data-direct]').forEach(el => { el.textContent = resumeDirect(); });
}

function resumeDirect(){
  if (!jeton()) return 'Compte local — créez un compte pour synchroniser';
  if (DIRECT.etat === 'hors ligne') return 'Hors ligne — nouvelle tentative automatique';
  if (DIRECT.etat === 'inactif') return 'Connexion au serveur…';
  if (!DIRECT.dernier) return 'Synchronisé';
  const s = Math.round((Date.now() - DIRECT.dernier) / 1000);
  const quand = s < 5 ? "à l'instant" : s < 60 ? 'il y a ' + s + ' s' : 'il y a ' + Math.round(s / 60) + ' min';
  return 'Synchronisé ' + quand;
}

/* ============================================================
   1. TEMPS RÉEL — l'API est interrogée en continu
   ============================================================ */
let minuteur = 0, enCours = false;

function demarrerTempsReel(){
  const c = compte();
  if (!c || !c.token){ DIRECT.etat = 'local'; majIndicateur(); return; }
  arreterTempsReel();
  DIRECT.etat = 'inactif';
  majIndicateur();
  const cycle = async () => {
    if (enCours){ planifier(); return; }
    enCours = true;
    try {
      const r = await api('/api/sync');
      if (r.status === 401 || r.status === 403){
        DIRECT.etat = 'expire'; majIndicateur('Session expirée — reconnectez-vous');
        enCours = false; return;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await lireJSON(r) || {};
      const rev = String(d.revision || '');
      /* On aligne l'espace local sur le serveur : à la première mesure
         (fenêtre entre l'ouverture de l'app et le premier cycle), puis
         dès que la révision change — c'est-à-dire quand une action a été
         faite ailleurs (autre appareil, formateur, admin). */
      const rattraper = async (message) => {
        if (window.LHSYNC && window.LHSYNC.hydrater) await window.LHSYNC.hydrater();
        if (window.APPX){ window.APPX.refreshUI(); window.APPX.refreshPages(); }
        DIRECT.dernier = Date.now(); DIRECT.etat = 'ok';   // l'indicateur suit tout de suite
        majIndicateur();
        if (message) dire(message);
      };
      if (DIRECT.revision === null || DIRECT.revision === ''){
        DIRECT.revision = rev;                       // première mesure
        await rattraper('');
      } else if (rev && rev !== DIRECT.revision){
        DIRECT.revision = rev;                       // changement détecté ailleurs
        await rattraper('Progression mise à jour depuis un autre appareil ✨');
      }
      DIRECT.dernier = Date.now();
      DIRECT.etat = 'ok';
      DIRECT.erreur = '';
    } catch (e){
      DIRECT.etat = 'hors ligne';
      DIRECT.erreur = String(e && e.message || e);
    }
    majIndicateur();
    enCours = false;
    planifier();
  };
  const planifier = (delai) => {
    clearTimeout(minuteur);
    minuteur = setTimeout(cycle, delai != null ? delai : (document.hidden ? DELAI_ARRIERE : DELAI_DIRECT));
  };
  planifier(900);                    // premier relevé rapide : l'indicateur est juste tout de suite
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden){ clearTimeout(minuteur); minuteur = setTimeout(cycle, 600); }
  });
  window.addEventListener('online', () => { clearTimeout(minuteur); minuteur = setTimeout(cycle, 600); });
  /* L'application vient de pousser un changement : on relève tout de suite la révision */
  window.addEventListener('lh:pousse', () => { clearTimeout(minuteur); minuteur = setTimeout(cycle, 900); });
}

function arreterTempsReel(){ clearTimeout(minuteur); }

/* ============================================================
   2. ÉCRAN D'ACCUEIL / CONNEXION / INSCRIPTION
   ============================================================ */
function ecranAccueil(){
  const host = $('#loginHost');
  if (!host) return;
  const c = compte();
  const base = urlBase();
  host.innerHTML = `<div class="login" id="loginScreen">
    <span class="login__logo">${window.APPX.svg('flask', 'icon icon--28')}</span>
    <h1>CosmétiLab</h1>
    <p class="sub">Formulez vos savons, gels douche, crèmes et laits corporels</p>
    <div id="ctCorps"></div>
    <p class="field__help" id="ctErr" hidden></p>
    <div class="note login__demo" style="margin-top:14px">${window.APPX.svg('info', 'icon')}
      <span id="ctServeur">${base ? 'Serveur détecté : ' + esc(base.replace(/^https?:\/\//, '')) : 'Aucun serveur détecté — mode local'}</span></div>
  </div>`;
  requestAnimationFrame(() => { const s = $('#loginScreen'); if (s) s.classList.add('is-open'); });
  vueAccueil();
  setTimeout(() => { const i = $('#ctMail'); if (i) i.focus(); }, 500);
}

function vueAccueil(){
  const corps = $('#ctCorps');
  if (!corps) return;
  corps.innerHTML = `
    <button class="btn btn--filled btn--block ripple" data-ct="connexion">${window.APPX.svg('person', 'icon icon--18')} Se connecter</button>
    <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-ct="inscription">${window.APPX.svg('plus', 'icon icon--18')} Créer un compte</button>
    <button class="text-btn ripple" style="margin:14px auto 0;display:block" data-ct="invite">Explorer sans compte</button>
    <p class="body-small muted" style="text-align:center;padding:10px 8px 0">Chaque compte garde ses propres cours, notes, quiz et devoirs. Sans compte, vos données restent sur cet appareil.</p>`;
}

function vueConnexion(){
  const corps = $('#ctCorps');
  if (!corps) return;
  const dernier = lire(CLE_DERNIER, '');
  corps.innerHTML = `
    <div class="field"><input id="ctMail" type="email" placeholder=" " value="${esc(dernier)}" autocomplete="username"><label for="ctMail">Adresse e-mail</label></div>
    <div class="field"><input id="ctPwd" type="password" placeholder=" " autocomplete="current-password"><label for="ctPwd">Mot de passe</label></div>
    <button class="btn btn--filled btn--block ripple" id="ctValider">Se connecter</button>
    <div class="login__links">
      <button class="text-btn ripple" data-ct="inscription">Créer un compte</button>
      <button class="text-btn ripple" data-ct="invite">Sans compte</button>
    </div>
    <details style="margin-top:10px">
      <summary class="body-small muted" style="cursor:pointer">Serveur personnalisé (avancé)</summary>
      <div class="field" style="margin-top:10px"><input id="ctApi" type="url" placeholder=" " value="${esc(urlBase())}"><label for="ctApi">Adresse de l'API</label></div>
      <p class="field__help">Laissez vide pour utiliser le serveur de cette page.</p>
    </details>`;
  const envoyer = () => connecter();
  $('#ctValider').onclick = envoyer;
  $('#ctPwd').onkeydown = e => { if (e.key === 'Enter') envoyer(); };
}

function vueInscription(){
  const corps = $('#ctCorps');
  if (!corps) return;
  corps.innerHTML = `
    <div class="field"><input id="ctNom" type="text" placeholder=" " autocomplete="name"><label for="ctNom">Nom complet</label></div>
    <div class="field"><input id="ctMail" type="email" placeholder=" " autocomplete="email"><label for="ctMail">Adresse e-mail</label></div>
    <div class="field"><input id="ctPwd" type="password" placeholder=" " autocomplete="new-password"><label for="ctPwd">Mot de passe (6 caractères min.)</label></div>
    <div class="field"><input id="ctVille" type="text" placeholder=" "><label for="ctVille">Ville (facultatif)</label></div>
    <p class="field__help" style="margin:6px 2px 4px">Je m'inscris comme</p>
    <div class="tabs" style="margin-bottom:12px">
      <button class="tab is-active" data-ctrole="etudiant">${window.APPX.svg('school', 'icon')} Apprenant</button>
      <button class="tab" data-ctrole="enseignant">${window.APPX.svg('bullhorn', 'icon')} Formateur</button>
    </div>
    <button class="btn btn--filled btn--block ripple" id="ctValider">Créer mon compte</button>
    <div class="login__links"><button class="text-btn ripple" data-ct="connexion">J'ai déjà un compte</button></div>`;
  let role = 'etudiant';
  $$('[data-ctrole]', corps).forEach(b => b.onclick = () => {
    $$('[data-ctrole]', corps).forEach(x => x.classList.toggle('is-active', x === b));
    role = b.dataset.ctrole;
  });
  const envoyer = () => inscrire(role);
  $('#ctValider').onclick = envoyer;
  $('#ctPwd').onkeydown = e => { if (e.key === 'Enter') envoyer(); };
}

function vueInvite(){
  const corps = $('#ctCorps');
  if (!corps) return;
  corps.innerHTML = `
    <div class="card card--pad" style="margin-bottom:14px">
      <h3 class="title-small">Mode local</h3>
      <p class="body-small muted" style="margin-top:6px">Vous pouvez visiter les cours, lire les vidéos et vous entraîner : tout est enregistré sur cet appareil. Créez un compte quand vous voulez pour retrouver votre progression partout.</p>
    </div>
    <button class="btn btn--filled btn--block ripple" data-ct="invite-go">Continuer sans compte</button>
    <div class="login__links"><button class="text-btn ripple" data-ct="connexion">Revenir à la connexion</button></div>`;
}

function erreur(msg){
  const e = $('#ctErr');
  if (!e) return;
  e.textContent = msg;
  e.hidden = !msg;
}

function occupe(bouton, texte){
  if (!bouton) return;
  bouton.disabled = true;
  bouton.innerHTML = '<span class="spin-sm"></span> ' + texte;
}

async function connecter(){
  const mail = ($('#ctMail') || {}).value ? $('#ctMail').value.trim() : '';
  const pwd  = ($('#ctPwd') || {}).value || '';
  const apiChamp = $('#ctApi');
  if (apiChamp && apiChamp.value.trim()){
    try { localStorage.setItem('lh_api', apiChamp.value.trim().replace(/\/+$/, '')); } catch (e) {}
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return erreur('Adresse e-mail invalide.');
  if (pwd.length < 1) return erreur('Saisissez votre mot de passe.');
  erreur('');
  occupe($('#ctValider'), 'Connexion…');
  try {
    const r = await fetch(urlBase() + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail, motDePasse: pwd })
    });
    const d = await lireJSON(r);
    if (!r.ok || !d || !d.token) throw new Error((d && (d.error || d.message)) || 'Identifiants refusés');
    ecrireBrut(CLE_DERNIER, mail);
    ouvrirSession(d);
  } catch (e){
    $('#ctValider').disabled = false;
    $('#ctValider').textContent = 'Se connecter';
    erreur('Connexion impossible : ' + String(e.message || e) + (urlBase() ? '' : ' (aucun serveur configuré)'));
  }
}

async function inscrire(role){
  const nom  = ($('#ctNom') || {}).value ? $('#ctNom').value.trim() : '';
  const mail = ($('#ctMail') || {}).value ? $('#ctMail').value.trim() : '';
  const pwd  = ($('#ctPwd') || {}).value || '';
  const ville = ($('#ctVille') || {}).value ? $('#ctVille').value.trim() : '';
  if (nom.length < 3) return erreur('Indiquez votre nom complet (3 caractères min.).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return erreur('Adresse e-mail invalide.');
  if (pwd.length < 6) return erreur('Le mot de passe doit contenir au moins 6 caractères.');
  erreur('');
  occupe($('#ctValider'), 'Création…');
  try {
    const r = await fetch(urlBase() + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nom, email: mail, motDePasse: pwd, ville: ville, role: role })
    });
    const d = await lireJSON(r);
    if (!r.ok || !d || !d.token) throw new Error((d && (d.error || d.message)) || 'Inscription refusée');
    ecrireBrut(CLE_DERNIER, mail);
    ouvrirSession(d);
  } catch (e){
    $('#ctValider').disabled = false;
    $('#ctValider').textContent = 'Créer mon compte';
    erreur('Inscription impossible : ' + String(e.message || e));
  }
}

/* Enregistre la session puis recharge l'application dans l'espace du compte */
function ouvrirSession(d){
  const u = d.user || d.utilisateur || {};
  ecrire(CLE_COMPTE, {
    id: String(u.id || mail0(u) || Date.now()),
    nom: u.nom || u.email || 'Compte',
    email: u.email || '',
    role: u.role || 'etudiant',
    token: d.token,
    depuis: Date.now()
  });
  ecrireBrut('lh_token', d.token);
  ecrireBrut('lh_synced', '');          // l'historique d'envoi est propre à chaque compte
  dire('Bienvenue ' + String(u.nom || '').split(' ')[0] + ' 👋');
  setTimeout(() => location.reload(), 350);
}
const mail0 = u => (u && u.email ? u.email.split('@')[0] : '');

function continuerSansCompte(){
  ecrire(CLE_COMPTE, { id: 'invite', nom: 'Invité', email: '', role: 'invite', token: '', depuis: Date.now() });
  ecrireBrut('lh_token', '');
  ecrireBrut('lh_synced', '');
  location.reload();
}

function deconnecter(){
  const c = compte();
  window.APPX.dialog({
    title: c && c.token ? 'Se déconnecter ?' : 'Quitter le mode local ?',
    text: c && c.token
      ? 'Votre progression reste sur le serveur : vous la retrouverez à la prochaine connexion.'
      : 'Votre progression locale restera sur cet appareil.',
    confirmLabel: 'Se déconnecter', danger: true, ico: 'logout'
  }).then(ok => {
    if (!ok) return;
    ecrire(CLE_COMPTE, null);
    ecrireBrut('lh_token', '');
    ecrireBrut('lh_synced', '');
    location.reload();
  });
}

/* ============================================================
   3. PAGE « MON COMPTE »
   ============================================================ */
function pageCompte(){
  const c = compte() || {nom:'Invité', email:'—', role:'invite'};
  const role = ({ etudiant:'Apprenant', enseignant:'Formateur', admin:'Administrateur', invite:'Mode local' })[c.role] || c.role;
  const connecte = !!c.token;
  return window.APPX.barPage('Mon compte', '', `
    <div class="card card--pad" style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
      <span class="avatar" style="width:52px;height:52px;font-size:18px">${esc(window.APPX.initials(c.nom))}</span>
      <div style="min-width:0">
        <h3 class="title-small">${esc(c.nom)}</h3>
        <p class="body-small muted">${esc(c.email || 'Aucune adresse — données locales')}</p>
        <span class="pill ${connecte ? 'pill--ok' : 'pill--normal'}" style="margin-top:6px">${esc(role)}</span>
      </div>
    </div>
    <div class="list-row">
      <span class="list-row__ico acc-green">${window.APPX.svg('refresh', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>Synchronisation en direct</h3><p data-direct>${esc(resumeDirect())}</p></div>
      <button class="text-btn ripple" data-act="ctSync">Forcer</button>
    </div>
    <div class="list-row">
      <span class="list-row__ico acc-purple">${window.APPX.svg('cloud', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>Mes données</h3><p data-ctresume>Comptage en cours…</p></div>
    </div>
    ${c.role === 'enseignant' || c.role === 'admin' ? `
    <div class="list-row">
      <span class="list-row__ico acc-blue">${window.APPX.svg('upload', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>Corrections des apprenants</h3><p>Copies déposées sur vos cours</p></div>
      ${window.APPX.IC.chev}
    </div>` : ''}
    <button class="btn btn--outlined btn--block ripple" style="margin-top:14px" data-act="ctQuitter">
      ${window.APPX.svg('logout', 'icon icon--18')} ${connecte ? 'Se déconnecter' : 'Quitter le mode local'}
    </button>
    <p class="body-small muted" style="text-align:center;padding:12px 8px">Chaque compte possède son propre espace de données. La déconnexion n'efface rien.</p>`);
}

function corpsCompte(){
  window.APPX.pushPage('compte', {});
}

/* ============================================================
   4. ESPACE FORMATEUR — copies déposées et notation
   ============================================================ */
const ETAT_DEPOT = { depose:'Déposé', rendu:'Rendu', note:'Noté' };

function pageCorrections(){
  return window.APPX.barPage('Corrections', `<button class="text-btn ripple" data-act="ctRecharger">Actualiser</button>`, `
    <p class="body-small muted" style="padding:0 2px 12px">Copies déposées par les apprenants sur les cours. Cliquez sur une copie pour la noter.</p>
    <div id="ctCopies"><p class="body-small muted">Chargement…</p></div>`);
}

async function chargerCopies(el){
  const zone = $('#ctCopies', el);
  if (!zone) return;
  try {
    const r = await api('/api/submissions');
    const d = await lireJSON(r) || {};
    const liste = d.depots || d.submissions || [];
    if (!liste.length){ zone.innerHTML = `<p class="body-small muted">Aucune copie déposée pour l'instant.</p>`; return; }
    zone.innerHTML = liste.map(s => {
      const quand = String(s.created_at || '').slice(0, 10);
      const eleve = s.eleve_nom || s.eleve || s.nom || 'Apprenant';
      const note = (s.note === null || s.note === undefined) ? '' : `<span class="pill pill--ok">${esc(s.note)}/${esc(s.points || 20)}</span>`;
      return `<button class="list-row ripple" data-copie="${esc(s.id)}" style="align-items:flex-start;text-align:left">
        <span class="list-row__ico acc-purple">${window.APPX.svg('upload', 'icon icon--20')}</span>
        <span class="list-row__main">
          <h3>${esc(eleve)} · ${esc(s.titre || 'Copie')}</h3>
          <p>${esc(s.cours_titre || '')} · ${esc(quand)} · ${esc(ETAT_DEPOT[s.statut] || s.statut || '')}</p>
          <span class="body-small muted">${esc(s.fichier_nom || s.lien || 'sans fichier')}${s.commentaire ? ' · « ' + esc(String(s.commentaire).slice(0, 60)) + ' »' : ''}</span>
        </span>${note}</button>`;
    }).join('');
    zone.dataset.copies = JSON.stringify(liste);
  } catch (e){
    zone.innerHTML = `<p class="body-small muted">Impossible de charger les copies : ${esc(String(e.message || e))}</p>`;
  }
}

function noterCopie(id, el){
  let copie = null;
  try { copie = (JSON.parse($('#ctCopies', el).dataset.copies || '[]') || []).find(x => String(x.id) === String(id)); } catch (e) {}
  window.APPX.dialog({
    title: 'Noter la copie', confirmLabel: 'Enregistrer la note', ico: 'edit', cancel: true,
    onOpen(box){
      box.insertAdjacentHTML('beforeend', `
        <p class="body-small muted" style="padding:2px 4px 10px">${esc((copie && (copie.eleve_nom || copie.titre)) || 'Copie')}</p>
        <div class="field"><input id="ctNote" type="number" min="0" max="100" placeholder=" " value="${copie && copie.note != null ? copie.note : ''}"><label for="ctNote">Note sur ${copie && copie.points ? copie.points : 20}</label></div>
        <div class="field"><input id="ctCom" type="text" placeholder=" " value="${esc((copie && copie.commentaire) || '')}"><label for="ctCom">Commentaire</label></div>`);
    }
  }).then(async ok => {
    if (!ok) return;
    const note = parseInt(($('#ctNote') || {}).value, 10);
    if (isNaN(note)) return dire('Saisissez une note.');
    const commentaire = ($('#ctCom') || {}).value || '';
    try {
      const r = await api('/api/submissions/' + encodeURIComponent(id), {
        method: 'PATCH', body: JSON.stringify({ note: note, statut: 'note', commentaire: commentaire })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      dire('Note enregistrée');
      chargerCopies(el);
    } catch (e){ dire('Enregistrement impossible : ' + String(e.message || e)); }
  });
}

/* ============================================================
   5. DÉMARRAGE
   ============================================================ */
function demarrer(){
  const A = window.APPX;
  if (!A) return;

  /* Pages système */
  A.PAGES.compte = { single:true, render(){ return pageCompte(); }, mount(){
    $$('[data-act="ctSync"]').forEach(b => b.onclick = async () => {
      if (window.LHSYNC){
        await window.LHSYNC.hydrater();
        A.refreshUI(); A.refreshPages();
      }
      melange(); dire('Synchronisé avec le serveur');
    });
    $$('[data-act="ctQuitter"]').forEach(b => b.onclick = () => deconnecter());
    const r = $('[data-ctresume]');
    if (r) r.textContent = resumeDonnees();
  }, refresh(el){ this.mount(el); } };

  A.PAGES.corrections = { single:true, render(){ return pageCorrections(); }, mount(el){
    chargerCopies(el);
    $$('[data-act="ctRecharger"]', el).forEach(b => b.onclick = () => chargerCopies(el));
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-copie]');
      if (b) noterCopie(b.dataset.copie, el);
    });
  }, refresh(el){ this.mount(el); } };

  /* Les formateurs voient l'entrée « Corrections » dans leur profil */
  const moi = compte();
  if (moi && (moi.role === 'enseignant' || moi.role === 'admin')){
    const row = document.getElementById('rowCorrections');
    if (row) row.hidden = false;
  }

  /* Le libellé « Synchronisation serveur » du profil affiche l'état en direct */
  setInterval(() => { $$('[data-direct]').forEach(el => el.textContent = resumeDirect()); }, 5000);

  /* Un compte connecté récupère sa progression dès l'ouverture */
  if (window.LHSYNC && jeton()) window.LHSYNC.amorcer();
  demarrerTempsReel();
}

function melange(){ DIRECT.revision = null; DIRECT.dernier = Date.now(); majIndicateur('ok'); }

function resumeDonnees(){
  const A = window.APPX;
  const lecons = Object.keys(A.S.lessons || {}).length;
  const notes = Object.keys(A.S.notes || {}).length;
  const quiz = Object.keys(A.S.quiz || {}).length;
  const devoirs = Object.keys(A.S.devoirs || {}).length;
  const c = compte();
  return `${lecons} leçon(s) terminée(s) · ${quiz} quiz · ${notes} note(s) · ${devoirs} devoir(s) déposé(s)` +
         (c && c.token ? ' · enregistrées sur le serveur' : ' · conservées sur cet appareil');
}

/* ---------- interface publique ---------- */
window.LHCOMPTE = {
  compte: compte, jeton: jeton, estInvite: estInvite, urlBase: urlBase, api: api,
  ouvrirEntree: ecranAccueil, connexion: vueConnexion, inscription: vueInscription, invite: vueInvite,
  continuerSansCompte: continuerSansCompte, deconnecter: deconnecter,
  demarrer: demarrer, demarrerTempsReel: demarrerTempsReel, resumeDirect: resumeDirect,
  pageCompte: corpsCompte, chargerCopies: chargerCopies, dire: dire
};

/* Écoute des vues de l'écran d'accueil */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ct]');
  if (!b) return;
  const v = b.dataset.ct;
  if (v === 'connexion') return vueConnexion();
  if (v === 'inscription') return vueInscription();
  if (v === 'invite') return vueInvite();
  if (v === 'invite-go') return continuerSansCompte();
});

demarrer();
})();
