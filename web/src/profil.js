/* ============================================================
   PROFIL & ACCUEIL — ce qui était simulé devient réel
   ------------------------------------------------------------
   1. AVATAR        : vrai sélecteur (12 avatars), gardé par compte ;
   2. MOT DE PASSE  : vraie modification (POST /api/auth/password) ;
   3. APPAREILS     : liste réelle + révocation (GET/DELETE /api/auth/devices) ;
   4. ACCUEIL       : « Reprendre » et « Activité du formateur » alimentés
                      par les vraies données — plus aucun texte inventé.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const { svg, openSheet, closeSheet, dialog, S } = A;

/** Même échappement que le noyau (APPX ne l'expose pas). */
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const APp = window.APPX;
const compte = () => (window.LHCOMPTE && window.LHCOMPTE.compte) ? window.LHCOMPTE.compte() : null;
const jeton  = () => { const c = compte(); return (c && c.token) || ''; };
const api    = (chemin, opts) => window.LHCOMPTE.api(chemin, opts);
/** Réponse d'API normalisée : { donnees, erreur } — jamais d'exception silencieuse. */
const lireJSON = async r => {
  try {
    const j = await r.json();
    if (j && typeof j === 'object' && j.ok === false) return { donnees: null, erreur: j.error || { message: 'Requête refusée' } };
    return { donnees: (j && typeof j === 'object' && 'data' in j) ? j.data : j, erreur: null };
  } catch (e) { return { donnees: null, erreur: { message: 'Réponse illisible' } }; }
};
const messageDe = (r, defaut) => (r && r.erreur && (r.erreur.message || r.erreur.code)) || defaut;
const dire = m => (typeof toast === 'function' ? toast(m) : null);
const dateCourte = iso => {
  if (!iso) return '';
  const d = new Date(iso), maintenant = Date.now(), ecart = (maintenant - d.getTime()) / 1000;
  if (ecart < 90) return 'à l’instant';
  if (ecart < 3600) return 'il y a ' + Math.round(ecart / 60) + ' min';
  if (ecart < 86400) return 'il y a ' + Math.round(ecart / 3600) + ' h';
  if (ecart < 604800) return 'il y a ' + Math.round(ecart / 86400) + ' j';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/* ============================================================
   1. AVATAR
   ============================================================ */
const AVATARS = [
  { id:'flask',   ico:'flask',   fond:'linear-gradient(135deg,#6750A4,#9A82DB)' },
  { id:'drop',    ico:'drop',    fond:'linear-gradient(135deg,#0B6BCB,#5AA9F0)' },
  { id:'leaf',    ico:'leaf',    fond:'linear-gradient(135deg,#1B7F4B,#6FCE9B)' },
  { id:'jar',     ico:'jar',     fond:'linear-gradient(135deg,#8A5300,#E0A44A)' },
  { id:'fire',    ico:'fire',    fond:'linear-gradient(135deg,#B3261E,#F2836E)' },
  { id:'star',    ico:'star',    fond:'linear-gradient(135deg,#7A4FB5,#C69BF2)' },
  { id:'medal',   ico:'medal',   fond:'linear-gradient(135deg,#4A4458,#9E93B8)' },
  { id:'trophy',  ico:'trophy',  fond:'linear-gradient(135deg,#00696E,#4FC6C9)' },
  { id:'crown',   ico:'crown',   fond:'linear-gradient(135deg,#7A5900,#F2C14E)' },
  { id:'sun',     ico:'sun',     fond:'linear-gradient(135deg,#8A5300,#FFD18A)' },
  { id:'moon',    ico:'moon',    fond:'linear-gradient(135deg,#2B2440,#7C6FA8)' },
  { id:'globe',   ico:'globe',   fond:'linear-gradient(135deg,#0B6BCB,#8AD0F0)' }
];
const avatarChoisi = () => A.store.get('avatar', '');
/** L'avatar enregistré sur le serveur arrive après l'ouverture de session. */
async function recupererAvatar(){
  if (!jeton()) return;
  try {
    const r = await api('/api/settings');
    const rep = await lireJSON(r);
    const distant = rep.donnees && rep.donnees.reglages && rep.donnees.reglages.avatar;
    if (typeof distant === 'string' && distant !== avatarChoisi()){
      A.store.set('avatar', distant);
      appliquerAvatar();
    }
  } catch (e) { /* hors ligne : l'avatar local reste */ }
}
const avatarDe = id => AVATARS.find(v => v.id === id) || null;

function dessinerAvatar(el, id, initiales){
  const v = avatarDe(id);
  if (!v){
    el.style.background = '';
    el.innerHTML = '';
    el.textContent = initiales || '·';
    return;
  }
  el.textContent = '';
  el.style.background = v.fond;
  el.innerHTML = svg(v.ico, 'icon icon--24');
}
function appliquerAvatar(){
  const id = avatarChoisi();
  const nom = (S.profile && S.profile.nom) || '';
  const ini = A.initials(nom);
  $$('.avatar').forEach(el => dessinerAvatar(el, id, ini));
  const grand = $('#editAv');
  if (grand) dessinerAvatar(grand, id, ini);
}
function choisirAvatar(){
  const actuel = avatarChoisi();
  openSheet(`
    <h3 class="title-medium">Choisir un avatar</h3>
    <p class="body-small muted" style="padding:0 6px 12px">Votre avatar suit votre compte : il vous attend sur vos autres appareils connectés.</p>
    <div class="avatars" id="choixAvatar">
      ${AVATARS.map(v => `
        <button class="avatars__item${v.id === actuel ? ' is-on' : ''}" data-avatar="${v.id}" aria-label="Avatar ${v.id}" aria-pressed="${v.id === actuel}">
          <span class="avatar" style="width:56px;height:56px;background:${v.fond}">${svg(v.ico, 'icon icon--24')}</span>
          ${v.id === actuel ? `<span class="avatars__on">${svg('check', 'icon icon--16')}</span>` : ''}
        </button>`).join('')}
    </div>
    <button class="btn btn--text btn--block ripple" style="margin-top:8px" data-avatar="">Revenir à mes initiales</button>`);
}
/* délégation (feuille avatar + profil) */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-avatar]');
  if (!b) return;
  const id = b.dataset.avatar || '';
  A.store.set('avatar', id);
  appliquerAvatar();
  closeSheet();
  dire(id ? 'Avatar mis à jour' : 'Retour à vos initiales');
  if (jeton()) api('/api/settings', { method: 'PATCH', body: JSON.stringify({ avatar: id }) }).catch(() => {});
}, true);

/* ============================================================
   2. MOT DE PASSE
   ============================================================ */
function changerMotDePasse(){
  if (!jeton()){
    dialog({ title:'Compte local', cancel:false, confirmLabel:'Fermer', ico:'info',
      text:'Ce mode ne stocke pas de mot de passe. Créez un compte pour protéger vos données et les retrouver partout.' });
    return;
  }
  openSheet(`
    <h3 class="title-medium">Modifier le mot de passe</h3>
    <p class="body-small muted" style="padding:0 6px 12px">Vos autres sessions seront fermées : vous resterez connecté ici.</p>
    <form id="fPwd" style="padding:0 6px">
      <div class="field"><input id="pwdActuel" type="password" placeholder=" " autocomplete="current-password"><label for="pwdActuel">Mot de passe actuel</label></div>
      <div class="field"><input id="pwdNouveau" type="password" placeholder=" " autocomplete="new-password"><label for="pwdNouveau">Nouveau mot de passe (8 caractères minimum)</label></div>
      <div class="field"><input id="pwdEncore" type="password" placeholder=" " autocomplete="new-password"><label for="pwdEncore">Confirmer le nouveau</label></div>
      <p class="field__help" id="pwdEtat" role="status"></p>
      <button class="btn btn--filled btn--block ripple" type="submit">${svg('shield', 'icon icon--18')} Enregistrer le nouveau mot de passe</button>
    </form>`);
  $('#fPwd').addEventListener('submit', async e => {
    e.preventDefault();
    const actuel = $('#pwdActuel').value, nouveau = $('#pwdNouveau').value, encore = $('#pwdEncore').value;
    const etat = $('#pwdEtat');
    const refus = (m, champ) => { etat.style.color = 'var(--md-error)'; etat.textContent = m; if (champ) champ.focus(); };
    if (!actuel) return refus('Saisissez votre mot de passe actuel.', $('#pwdActuel'));
    if (nouveau.length < 8) return refus('Le nouveau mot de passe doit contenir au moins 8 caractères.', $('#pwdNouveau'));
    if (nouveau === actuel) return refus('Le nouveau mot de passe doit être différent de l’ancien.', $('#pwdNouveau'));
    if (nouveau !== encore) return refus('Les deux saisies du nouveau mot de passe ne correspondent pas.', $('#pwdEncore'));
    etat.style.color = ''; etat.textContent = 'Enregistrement…';
    try {
      const r = await api('/api/auth/password', { method:'POST', body: JSON.stringify({ actuel, nouveau }) });
      const rep = await lireJSON(r);
      if (!r.ok || !rep.donnees || rep.donnees.change !== true){
        etat.style.color = 'var(--md-error)';
        etat.textContent = messageDe(rep, 'Modification refusée.');
        return;
      }
      closeSheet();
      dialog({ title:'Mot de passe modifié', ico:'check-circle', cancel:false, confirmLabel:'Fermer',
        text:'Votre nouveau mot de passe est actif. Les autres appareils devront se reconnecter.' });
    } catch (err){
      etat.style.color = 'var(--md-error)';
      etat.textContent = 'Serveur injoignable : vérifiez votre connexion puis réessayez.';
    }
  });
}

/* ============================================================
   3. APPAREILS CONNECTÉS
   ============================================================ */
async function appareils(){
  if (!jeton()){
    openSheet(`<h3 class="title-medium">Appareils connectés</h3>
      <div class="list-row"><span class="list-row__ico acc-purple">${svg('globe', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>Ce navigateur</h3><p>Espace local — aucun appareil à distance</p></div></div>
      <p class="body-small muted" style="padding:8px 6px 0">Créez un compte : vos appareils connectés apparaîtront ici et vous pourrez les déconnecter à distance.</p>`);
    return;
  }
  openSheet(`<h3 class="title-medium">Appareils connectés</h3>
    <div id="listeAppareils"><p class="body-small muted" style="padding:10px 6px">Chargement…</p></div>`);
  await peindreAppareils();
}
async function peindreAppareils(){
  const box = $('#listeAppareils');
  if (!box) return;
  try {
    const r = await api('/api/auth/devices');
    const rep = await lireJSON(r);
    const liste = (rep.donnees && rep.donnees.appareils) || [];
    if (!liste.length){ box.innerHTML = '<p class="body-small muted" style="padding:10px 6px">Aucun appareil enregistré.</p>'; return; }
    const autres = liste.filter(x => !x.actuel).length;
    box.innerHTML = (autres > 1 ? `<button class="btn btn--text btn--block ripple" style="margin-bottom:6px" data-revoque-tout>
        ${svg('logout', 'icon icon--18')} Déconnecter les ${autres} autres appareils</button>` : '') + liste.map(a => `
      <div class="list-row">
        <span class="list-row__ico ${a.actuel ? 'acc-green' : 'acc-blue'}">${svg(a.actuel ? 'shield' : 'globe', 'icon icon--20')}</span>
        <div class="list-row__main">
          <h3>${esc(a.appareil || 'Appareil')}${a.actuel ? ' <span class="pill pill--ok">Actuel</span>' : ''}</h3>
          <p>${esc([a.ip, a.depuis ? 'connecté ' + dateCourte(a.depuis) : ''].filter(Boolean).join(' · ') || 'Session ouverte')}</p>
        </div>
        ${a.actuel ? '' : `<button class="text-btn ripple" data-revoque="${esc(a.id)}">Déconnecter</button>`}
      </div>`).join('');
  } catch (e){
    box.innerHTML = '<p class="body-small muted" style="padding:10px 6px">Liste indisponible hors connexion.</p>';
  }
}
document.addEventListener('click', async e => {
  /* fermer toutes les autres sessions d'un coup */
  const tout = e.target.closest('[data-revoque-tout]');
  if (tout){
    e.preventDefault();
    const ok = await dialog({ title:'Déconnecter les autres appareils ?', ico:'logout', danger:true, confirmLabel:'Déconnecter',
      text:'Toutes les autres sessions seront fermées. Celle-ci reste ouverte.' });
    if (!ok) return;
    try {
      const r = await api('/api/auth/devices', { method:'DELETE' });
      const rep = await lireJSON(r);
      if (r.ok && rep.donnees){ dire(rep.donnees.deconnectes + ' appareil(s) déconnecté(s)'); await peindreAppareils(); }
      else dire(messageDe(rep, 'Opération impossible'));
    } catch (err){ dire('Réseau indisponible'); }
    return;
  }
  const b = e.target.closest('[data-revoque]');
  if (!b) return;
  e.preventDefault();
  const id = b.dataset.revoque;
  const ok = await dialog({ title:'Déconnecter cet appareil ?', ico:'logout', danger:true, confirmLabel:'Déconnecter',
    text:'La session ouverte sur cet appareil sera fermée immédiatement.' });
  if (!ok) return;
  try {
    const r = await api('/api/auth/devices/' + encodeURIComponent(id), { method:'DELETE' });
    const rep = await lireJSON(r);
    if (r.ok && rep.donnees && rep.donnees.deconnecte){ dire('Appareil déconnecté'); await peindreAppareils(); }
    else dire(messageDe(rep, 'Déconnexion impossible'));
  } catch (err){ dire('Réseau indisponible'); }
}, true);

/* ============================================================
   4. ACCUEIL — « Reprendre » avec les vraies données
   ============================================================ */
function coursAccessibles(){
  const paiement = window.LHPAIE;
  return (typeof COURS !== 'undefined' ? COURS : []).filter(c => !paiement || paiement.estDebloque(c.id));
}
/** Le cours à reprendre : celui qu'on a touché le plus récemment, sinon le premier commencé, sinon le premier tout court. */
function coursCourant(liste){
  const prog = c => (A.progCours ? A.progCours(c.id) : 0);
  const commences = liste.filter(c => prog(c) > 0 && prog(c) < 100);
  if (commences.length){
    const dernier = S.lastVideo || (S.recent && S.recent[0] && S.recent[0].cours) || '';
    const parDernier = commences.find(c => c.id === (dernier.cours || dernier) || (typeof VIDEOS !== 'undefined' && VIDEOS.some(v => v.yt === dernier && v.cours === c.id)));
    return { cours: parDernier || commences[0], etat: 'reprendre' };
  }
  const vierges = liste.filter(c => prog(c) === 0);
  if (vierges.length) return { cours: vierges[0], etat: 'commencer' };
  if (liste.length) return { cours: liste[0], etat: 'termine' };
  return null;
}
function prochaineLecon(cid){
  const programme = (A.PROGRAMMES || {})[cid] || [];
  const L = (A.LESSONS || {})[cid] || [];
  const faits = S.lessons || {};
  let i = 0;
  for (const mod of programme){
    for (const l of mod.l){
      if (!faits[cid + ':' + i]) return { lecon: L[i] || l, module: mod.m, index: i };
      i++;
    }
  }
  return null;
}
function dureeLecon(l){
  if (!l) return '';
  if (l.v && typeof VIDEOS !== 'undefined'){
    const v = VIDEOS.find(x => x.yt === l.v);
    if (v && v.duree) return Math.round(v.duree / 60) + ' min de vidéo';
  }
  return l.d || '';
}
function majHero(){
  const heroTitre = $('#heroTitle');
  if (!heroTitre) return;
  const liste = coursAccessibles();
  const choix = coursCourant(liste);
  const pill = $('#heroPill'), temps = $('#heroTime'), sub = $('#heroSub'),
        pct = $('#heroPct'), bar = $('#heroBar'), cta = $('#heroCtaLabel'), carte = $('#heroCard');

  if (!choix){
    heroTitre.textContent = 'Débloquez votre première formation';
    if (pill) pill.innerHTML = svg('lock', 'icon icon--16') + ' COURS PAYANTS';
    if (temps) temps.textContent = '';
    if (sub) sub.textContent = 'Six cours de cosmétique artisanale — à l’unité ou par abonnement.';
    if (pct) pct.textContent = '0 %';
    if (bar){ bar.dataset.prog = '0'; bar.style.width = '0%'; }
    if (cta) cta.textContent = 'Voir les cours et les tarifs';
    if (carte) carte.dataset.etat = 'vide';
    return;
  }

  const c = choix.cours, p = Math.round(A.progCours ? A.progCours(c.id) : 0);
  const suivante = prochaineLecon(c.id);
  const total = A.totalLecons ? A.totalLecons(c.id) : 0;
  const faits = A.leconsFaites ? A.leconsFaites(c.id) : 0;

  heroTitre.textContent = c.titre;
  if (pill){
    const mots = choix.etat === 'reprendre' ? ['REPRENDRE', 'play'] : choix.etat === 'commencer' ? ['COMMENCER', 'play'] : ['COURS TERMINÉ', 'check-circle'];
    pill.innerHTML = svg(mots[1], 'icon icon--16') + ' ' + mots[0];
  }
  if (temps) temps.textContent = dureeLecon(suivante && suivante.lecon);
  if (sub) sub.textContent = choix.etat === 'termine'
    ? `Les ${total} leçons sont terminées — félicitations !`
    : suivante ? `${suivante.module} · ${suivante.lecon.t}` : 'Programme à découvrir';
  if (pct) pct.textContent = p + ' %';
  if (bar){ bar.dataset.prog = String(p); bar.style.width = p + '%'; }
  if (cta) cta.textContent = choix.etat === 'reprendre'
    ? `Continuer : ${(suivante && suivante.lecon.t || '').slice(0, 22)}`
    : choix.etat === 'commencer' ? 'Commencer la première leçon' : 'Revoir le programme';
  if (carte){ carte.dataset.etat = choix.etat; carte.dataset.cours = c.id; carte.dataset.id = c.id; }
  /* le héros ouvre bien ce cours-là */
  const btn = $('#heroCard [data-act="continue"]');
  if (btn) btn.dataset.cours = c.id;
}

/* ============================================================
   5. ACCUEIL — « Activité » réelle (plus rien d'inventé)
   ============================================================ */
async function chargerActivite(){
  const section = $('#secActivite'), zone = $('#activite');
  if (!section || !zone) return;
  if (!jeton()){ section.hidden = true; return; }
  try {
    const r = await api('/api/activite');
    const rep = await lireJSON(r);
    const d = rep.donnees;
    if (!d || ((!d.messages || !d.messages.length) && !d.derniere && !(d.aNoter > 0))){
      section.hidden = true; return;
    }
    const blocs = [];
    (d.messages || []).slice(0, 2).forEach(m => blocs.push(`
      <div class="card card--pad" style="display:flex;gap:14px;align-items:flex-start;margin-bottom:10px">
        <span class="stat__ico acc-purple" style="width:40px;height:40px;border-radius:var(--r-full);flex:none">${svg(m.role === 'enseignant' ? 'person' : 'chat', 'icon icon--20')}</span>
        <div style="min-width:0">
          <p class="title-small">${esc(m.auteur || 'Formateur')} — ${esc(m.cours_titre || '')}</p>
          <p class="body-small muted" style="margin-top:2px">« ${esc(String(m.contenu || '').slice(0, 120))}${String(m.contenu || '').length > 120 ? '…' : ''} » · ${esc(dateCourte(m.created_at))}</p>
          <button class="text-btn ripple" style="margin:6px 0 0 -12px" data-page="cours" data-id="${esc(m.course_id)}" data-tab="discussion">Ouvrir la discussion ${svg('arrow', 'icon icon--16')}</button>
        </div>
      </div>`));
    if (d.derniere){
      const p = d.derniere;
      blocs.push(`
        <div class="card card--pad" style="display:flex;gap:14px;align-items:flex-start;margin-bottom:10px">
          <span class="stat__ico acc-amber" style="width:40px;height:40px;border-radius:var(--r-full);flex:none">${svg('upload', 'icon icon--20')}</span>
          <div style="min-width:0">
            <p class="title-small">Votre copie — ${esc(p.devoir_titre || '')}</p>
            <p class="body-small muted" style="margin-top:2px">${p.statut === 'note'
              ? 'Notée ' + esc(String(p.note)) + '/' + esc(String(p.points || 20)) + (p.commentaire ? ' · « ' + esc(String(p.commentaire).slice(0, 90)) + ' »' : '')
              : p.statut === 'rendu' ? 'Déposée, en attente de correction' : esc(p.statut || 'Enregistrée')} · ${esc(dateCourte(p.created_at))}</p>
          </div>
        </div>`);
    }
    if (d.aNoter > 0) blocs.push(`
      <div class="card card--pad" style="display:flex;gap:14px;align-items:center;margin-bottom:10px">
        <span class="stat__ico acc-green" style="width:40px;height:40px;border-radius:var(--r-full);flex:none">${svg('medal', 'icon icon--20')}</span>
        <div style="flex:1"><p class="title-small">${d.aNoter} copie${d.aNoter > 1 ? 's' : ''} à corriger</p>
          <p class="body-small muted">Déposées par les apprenants</p></div>
        <button class="btn btn--tonal btn--sm ripple" data-page="corrections">Corriger</button>
      </div>`);
    zone.innerHTML = blocs.join('');
    section.hidden = false;
  } catch (e){ section.hidden = true; }
}

/* ============================================================
   6. BRANCHEMENT SUR LES ACTIONS EXISTANTES
   ============================================================ */
function brancher(){
  /* avatar : redessiné après chaque rafraîchissement d'identité */
  const apres = APp.applyProfileUI;
  if (typeof apres === 'function' && !apres.__avatar){
    const f = function(){ const r = apres.apply(this, arguments); appliquerAvatar(); return r; };
    f.__avatar = true;
    APp.applyProfileUI = f;
    window.applyProfileUI = f;
  }
  /* le héros se met à jour à chaque rafraîchissement */
  const uh = window.updateHero;
  if (typeof uh === 'function' && !uh.__v2){
    const f = function(){ try { majHero(); } catch (e) {} return uh.apply(this, arguments); };
    f.__v2 = true;
    window.updateHero = f;
  }
  /* le héros et l'activité se rafraîchissent d'eux-mêmes quand l'état change
     (progression, connexion, retour d'une autre page) */
  let signature = '';
  const tick = () => {
    const liste = coursAccessibles();
    const choix = coursCourant(liste);
    const s = choix ? choix.cours.id + '|' + choix.etat + '|' + Math.round(A.progCours ? A.progCours(choix.cours.id) : 0) + '|' + liste.length : 'vide';
    if (s !== signature){ signature = s; majHero(); }
  };
  tick();
  setInterval(tick, 1200);
  let derniereActivite = 0;
  const tickActivite = () => {
    if (document.hidden || !jeton()) return;
    if (Date.now() - derniereActivite < 45000) return;
    derniereActivite = Date.now();
    chargerActivite();
  };
  setInterval(tickActivite, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden){ tick(); tickActivite(); } });
  appliquerAvatar();
  setTimeout(majHero, 500);
  setTimeout(() => { recupererAvatar(); chargerActivite(); }, 900);
  window.addEventListener('storage', e => { if (e.key && e.key.indexOf('lh:u:') === 0) appliquerAvatar(); });
}

window.LHPROFIL = {
  avatars: AVATARS, choisirAvatar, appliquerAvatar, avatarChoisi, recupererAvatar,
  changerMotDePasse, appareils, majHero, chargerActivite
};

brancher();
})();
