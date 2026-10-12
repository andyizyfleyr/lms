/* ============================================================
   SYNCHRONISATION COMPLÈTE PAR COMPTE
   ------------------------------------------------------------
   Ce qui ne vivait que dans le navigateur est désormais rangé sur le
   serveur, sous le compte ouvert : notifications, discussions de cours,
   agenda et rappels, téléchargements, notes, profil et réglages.

   • au démarrage / à la connexion : tout est rapatrié (tirerTout) ;
   • chaque action locale est envoyée aussitôt (pousser) ;
   • la révision du serveur (GET /api/sync) est surveillée : ce qui est
     fait ailleurs arrive ici sans recharger la page.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const { S, persist, refreshUI, refreshPages, notification, toast, store } = A;

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
let cacheNotifLues = null;
const compte = () => (window.LHCOMPTE && window.LHCOMPTE.compte) ? window.LHCOMPTE.compte() : null;
const jeton  = () => { const c = compte(); return (c && c.token) || ''; };
/* Appels de synchronisation : une coupure réseau ne doit JAMAIS faire planter
   l'application — l'échec est signalé à l'état de synchro et se rattrape à la
   prochaine occasion (l'app continue de fonctionner sur ses données locales). */
let ETAT;
const api = (chemin, opts) => window.LHCOMPTE.api(chemin, opts).catch(e => {
  if (ETAT) ETAT.enLigne = false;
  return new Response('{"ok":false,"error":{"code":"hors_ligne","message":"Réseau indisponible"}}',
    { status: 503, headers: { 'Content-Type': 'application/json' } });
});
window.addEventListener('unhandledrejection', e => {
  const m = (e.reason && (e.reason.message || e.reason)) || '';
  if (typeof m === 'string' && /Failed to fetch|NetworkError|Load failed|ERR_INTERNET|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/i.test(m)) e.preventDefault();
});
const lireJSON = async r => {
  try {
    const j = await r.json();
    if (j && typeof j === 'object' && j.ok === false) return { donnees: null, erreur: j.error || {} };
    return { donnees: (j && typeof j === 'object' && 'data' in j) ? j.data : j, erreur: null };
  } catch (e) { return { donnees: null, erreur: { message: 'Réponse illisible' } }; }
};
const minutesDepuis = iso => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
ETAT = { enLigne: null, revision: null, dernier: 0, cours: [] };

/* ============================================================
   1. NOTIFICATIONS
   ============================================================ */
/* le type du serveur → la cible de navigation dans l'application */
function cibleNotif(kind, refId){
  const r = refId || '';
  switch (kind){
    case 'devoir':  return ['devoir', r];
    case 'quiz':    return ['quiz', r];
    case 'message': return ['cours', r, { tab:'discussion' }];
    case 'cours':   return ['cours', r];
    case 'badge':   return ['badges', ''];
    case 'acces':   return ['abonnement', ''];
    case 'session': return ['agenda', ''];
    default:        return ['notifications', ''];
  }
}
function notifServeur(n){
  return {
    id: n.id, type: n.kind || 'systeme', t: n.titre, b: n.texte || '',
    min: minutesDepuis(n.created_at), lu: n.lu ? 1 : 0, ico: n.ico || '', serveur: 1,
    go: cibleNotif(n.kind, n.ref_id), cle: 'srv:' + n.id
  };
}
async function tirerNotifications(){
  if (!jeton()) return;
  const r = await api('/api/notifications');
  const rep = await lireJSON(r);
  if (!rep.donnees || !rep.donnees.notifications) return;
  /* ce qui a été créé localement et pas encore envoyé reste visible */
  const locales = (S.notifs || []).filter(n => !n.serveur);
  const serveur = rep.donnees.notifications.filter(n => !n.user_id).map(notifServeur);
  const miennes = rep.donnees.notifications.map(notifServeur);
  const vues = {};
  const fusion = [];
  miennes.concat(locales).forEach(n => { if (!vues[n.id]){ vues[n.id] = 1; fusion.push(n); } });
  fusion.sort((a, b) => a.min - b.min);
  S.notifs = fusion.slice(0, 120);
  persist();
  A.updateNotifBadge ? A.updateNotifBadge() : 0;
  const pageNotifs = $('.page[data-page="notifications"]');
  if (pageNotifs && A.PAGES && A.PAGES.notifications){ pageNotifs.innerHTML = A.PAGES.notifications.render(); }
  tableau.majNotifs(serveur.length + locales.length);
}
async function pousserNotification(entree){
  if (!jeton()) return;
  const go = entree.go || [];
  const r = await api('/api/notifications', {
    method:'POST',
    body: JSON.stringify({
      titre: entree.t || 'Notification', texte: entree.b || '',
      ico: entree.type || 'bell', kind: entree.type || '', refId: go[1] || ''
    })
  });
  const rep = await lireJSON(r);
  if (rep.donnees && rep.donnees.notification){
    /* on remplace l'entrée locale par celle du serveur (même identifiant partout) */
    const i = S.notifs.findIndex(n => n.id === entree.id);
    if (i >= 0) S.notifs[i] = notifServeur(rep.donnees.notification);
    persist();
  }
}
async function lireToutes(){
  if (!jeton()) return;
  await api('/api/notifications/read-all', { method:'POST', body:'{}' }).catch(() => {});
}
async function lireUne(id){
  if (!jeton() || !id || String(id).indexOf('srv:') === 0) return;
  await api('/api/notifications/' + encodeURIComponent(id), { method:'PATCH', body: JSON.stringify({ lu:true }) }).catch(() => {});
}

/* ============================================================
   2. DISCUSSIONS DE COURS
   ============================================================ */
const accParRole = role => /formateur|enseignant/i.test(role || '') ? 'purple' : (role === 'Vous' ? 'amber' : 'green');
function messageLocal(m){
  return {
    id: m.id, a: m.auteur || 'Participant', role: /enseignant|formateur/i.test(m.role || '') ? 'Formatrice' : 'Apprenant',
    ini: A.initials(m.auteur || '?'), acc: accParRole(m.role), min: minutesDepuis(m.created_at),
    txt: m.contenu, likes: 0, serveur: 1
  };
}
async function tirerDiscussion(cid){
  if (!jeton() || !cid) return false;
  const r = await api('/api/courses/' + encodeURIComponent(cid) + '/messages?limite=100');
  const rep = await lireJSON(r);
  if (!rep.donnees || !rep.donnees.messages) return false;
  S.disc[cid] = rep.donnees.messages.map(messageLocal).reverse();
  persist();
  const page = $('.page[data-page="cours"]');
  if (page && page.dataset.coursId === cid && $('[data-ctab="discussion"]', page) && $('[data-ctab="discussion"]', page).classList.contains('is-active')){
    const onglet = $('[data-ctab="discussion"]', page);
    onglet.click();       /* recharge le fil avec les messages du serveur */
  }
  return true;
}
async function publierMessage(cid, txt){
  if (!jeton() || !cid || !txt) return null;
  const r = await api('/api/courses/' + encodeURIComponent(cid) + '/messages', { method:'POST', body: JSON.stringify({ contenu: txt }) });
  const rep = await lireJSON(r);
  if (rep.donnees && rep.donnees.message){
    const local = messageLocal(rep.donnees.message);
    /* on remplace le message optimiste (celui écrit sans identifiant serveur) */
    const liste = S.disc[cid] || [];
    const i = liste.map(m => m.txt).lastIndexOf(txt);
    if (i >= 0) liste[i] = local; else liste.push(local);
    S.disc[cid] = liste;
    persist();
    return local;
  }
  return null;
}
/** Chaque cours ouvert consulte aussi les messages : quand ouvrir la discussion. */
async function ouvrirDiscussion(cid){ return tirerDiscussion(cid); }

/* ============================================================
   3. AGENDA ET RAPPELS
   ============================================================ */
function seanceLocale(s){
  return {
    id: s.id, jour: typeof s.jour_semaine === 'number' ? s.jour_semaine : 0, heure: s.heure || '09:00',
    titre: s.titre, type: s.type || 'Cours', duree: s.duree_label || '1 h', salle: s.salle || '',
    cours: s.course_id || '', desc: s.description || '', prof: s.prof || '',
    tags: [s.type || 'Cours'].concat(s.course_id ? [s.course_id] : []), ico: 'calendar',
    rappel: s.rappel !== false, serveur: 1
  };
}
async function tirerAgenda(){
  if (!jeton()) return;
  const r = await api('/api/sessions');
  const rep = await lireJSON(r);
  if (!rep.donnees || !rep.donnees.seances) return;
  const seances = rep.donnees.seances.map(seanceLocale);
  const cible = A.SESS;
  if (Array.isArray(cible)){ cible.length = 0; seances.forEach(s => cible.push(s)); }
  tableau.majSeances(seances.length);
  const page = $('.page[data-page="agenda"]');
  if (page && A.PAGES && A.PAGES.agenda && page.dataset.construit) A.refreshPages();
}
async function rappel(seanceId, actifRappel){
  if (!jeton() || !seanceId) return;
  await api('/api/sessions/' + encodeURIComponent(seanceId) + '/reminder', {
    method: actifRappel ? 'POST' : 'DELETE', body: actifRappel ? JSON.stringify({ minutesAvant: 15 }) : undefined
  }).catch(() => {});
}

/* ============================================================
   4. TÉLÉCHARGEMENTS
   ============================================================ */
function telechargementLocal(d){
  return {
    id: d.id, ref: d.course_id || d.resource_id || 'cours', t: d.titre,
    s: (d.taille_label || ''), p: d.progres || 100, st: d.etat === 'ok' ? 'ok' : d.etat, size: 0, serveur: 1
  };
}
async function tirerTelechargements(){
  if (!jeton()) return;
  const r = await api('/api/downloads');
  const rep = await lireJSON(r);
  if (!rep.donnees || !rep.donnees.telechargements) return;
  S.dl = rep.donnees.telechargements.map(telechargementLocal);
  persist();
  const page = $('.page[data-page="telechargements"]');
  if (page && page.dataset.construit && A.refreshPages) A.refreshPages();
  tableau.majTelechargements(S.dl.length);
}
async function envoyerTelechargement(d){
  if (!jeton() || !d) return;
  const r = await api('/api/downloads', {
    method:'POST',
    body: JSON.stringify({
      courseId: /^c\d$/.test(String(d.ref)) ? d.ref : null,
      resourceId: /^c\d$/.test(String(d.ref)) ? null : (d.ref || null),
      titre: d.t, tailleLabel: d.s || '', etat:'ok', progres:100
    })
  });
  const rep = await lireJSON(r);
  if (rep.donnees && rep.donnees.telechargement){
    const i = S.dl.findIndex(x => x.id === d.id);
    if (i >= 0) S.dl[i] = telechargementLocal(rep.donnees.telechargement);
    persist();
  }
}
async function retirerTelechargement(id){
  if (!jeton() || !id) return;
  await api('/api/downloads/' + encodeURIComponent(id), { method:'DELETE' }).catch(() => {});
}

/* ============================================================
   5. NOTES
   ============================================================ */
async function tirerNotes(){
  if (!jeton()) return;
  const r = await api('/api/notes');
  const rep = await lireJSON(r);
  if (!rep.donnees || !rep.donnees.notes) return;
  /* la note serveur la plus récente par cours fait foi si l'appareil est vierge */
  const parCours = {};
  rep.donnees.notes.forEach(n => {
    if (!parCours[n.course_id] || new Date(n.updated_at || n.created_at) > new Date(parCours[n.course_id].updated_at || parCours[n.course_id].created_at)) parCours[n.course_id] = n;
  });
  Object.keys(parCours).forEach(cid => {
    if (!S.notes[cid]) S.notes[cid] = parCours[cid].contenu || '';
  });
  persist();
}
async function enregistrerNote(cid, texte){
  if (!jeton() || !cid) return;
  await api('/api/notes', { method:'POST', body: JSON.stringify({ courseId: cid, titre: 'Note ' + cid, contenu: texte || '' }) }).catch(() => {});
}

/* ============================================================
   6. PROFIL ET RÉGLAGES
   ============================================================ */
async function enregistrerProfil(p){
  if (!jeton() || !p) return;
  const corps = { nom: p.nom, tel: p.tel || '', ville: p.ville || '', promo: p.promo || '', bio: p.bio || '' };
  if (!corps.nom || corps.nom.length < 3) return;
  await api('/api/auth/me', { method:'PATCH', body: JSON.stringify(corps) }).catch(() => {});
}
async function enregistrerReglages(champs){
  if (!jeton() || !champs) return;
  await api('/api/settings', { method:'PATCH', body: JSON.stringify(champs) }).catch(() => {});
}

/* ============================================================
   7. TABLEAU DE BORD (ce que la synchro apporte, en clair)
   ============================================================ */
const tableau = {
  chiffres: { notifs:0, seances:0, telechargements:0 },
  majNotifs(n){ this.chiffres.notifs = n; this.peindre(); },
  majSeances(n){ this.chiffres.seances = n; this.peindre(); },
  majTelechargements(n){ this.chiffres.telechargements = n; this.peindre(); },
  peindre(){
    const zone = $('#syncApercu');
    if (!zone) return;
    const c = this.chiffres;
    zone.innerHTML =
      ligne('bell', 'Notifications', c.notifs) +
      ligne('calendar', 'Séances à l’agenda', c.seances) +
      ligne('download', 'Téléchargements', c.telechargements);
  }
};
function ligne(ico, nom, n){
  return `<div class="achat"><span class="list-row__ico acc-purple">${A.svg(ico, 'icon icon--20')}</span>
    <span class="achat__main"><h3>${nom}</h3><p>rangées sous votre compte</p></span>
    <span class="achat__prix">${n}</span></div>`;
}

/* ============================================================
   8. RAPATRIER / POUSSER / SURVEILLER
   ============================================================ */
async function tirerTout(){
  if (!jeton()) return false;
  await Promise.all([
    tirerNotifications().catch(() => {}),
    tirerAgenda().catch(() => {}),
    tirerTelechargements().catch(() => {}),
    tirerNotes().catch(() => {})
  ]);
  ETAT.cours = [];
  return true;
}
/** Révision du serveur : ce qui a changé ailleurs est rapatrié sans recharger. */
async function surveiller(){
  if (!jeton() || document.hidden) return;
  try {
    /* 1. le badge de notifications suit le serveur (annonces du formateur, autres appareils) */
    await tirerNotifications().catch(() => {});
    /* 2. si la progression a changé ailleurs, on rapatrie le reste */
    const r = await api('/api/sync');
    const rep = await lireJSON(r);
    ETAT.enLigne = true;
    const rev = rep.donnees && rep.donnees.revision;
    if (rev && rev !== ETAT.revision){
      ETAT.revision = rev;
      await tirerTout();
      rafraichir();
    }
    ETAT.dernier = Date.now();
  } catch (e) { ETAT.enLigne = false; }
}

/* ============================================================
   9. BRANCHEMENTS (chaque action locale part au serveur)
   ============================================================ */
function brancher(){
  const APp = window.APPX;

  /* téléchargement lancé → serveur */
  const dl0 = APp.addDownload;
  if (typeof dl0 === 'function' && !dl0.__sync){
    const f = function(ref, titre, size, v){
      const r = dl0.apply(this, arguments);
      const cree = S.dl && S.dl[S.dl.length - 1];
      if (cree) envoyerTelechargement(cree);
      return r;
    };
    f.__sync = true;
    APp.addDownload = f;
    window.addDownload = f;
  }

  /* note de cours enregistrée dans l'app (zone #noteTxt) → copie sur le serveur */
  document.addEventListener('input', e => {
    if (e.target.id !== 'noteTxt' || !jeton()) return;
    clearTimeout(brancher._note);
    const page = e.target.closest('.page');
    const cid = (page && page.dataset.coursId) || '';
    const valeur = e.target.value;
    brancher._note = setTimeout(() => { if (cid) enregistrerNote(cid, valeur); }, 1800);
  }, true);
  /* note effacée → on efface aussi côté serveur */
  document.addEventListener('click', async e => {
    if (!e.target.closest('[data-act="clearNote"]') || !jeton()) return;
    const r = await api('/api/notes');
    const rep = await lireJSON(r);
    const liste = (rep.donnees && rep.donnees.notes) || [];
    const coursId = (e.target.closest('[data-act="clearNote"]') || {}).dataset || {};
    for (const n of liste) {
      if (n.course_id === coursId.id) await api('/api/notes/' + encodeURIComponent(n.id), { method:'DELETE' }).catch(() => {});
    }
  }, true);

  /* à l'ouverture de la discussion d'un cours : messages du serveur */
  const pierreAngulaire = () => {
    const page = $('.page[data-page="cours"]');
    const cid = page && page.dataset.coursId;
    if (cid && !ETAT.cours.includes(cid)){ ETAT.cours.push(cid); tirerDiscussion(cid); }
  };
  setTimeout(pierreAngulaire, 1200);
  setInterval(pierreAngulaire, 4000);

  /* au changement de compte / retour en ligne */
  window.addEventListener('storage', e => { if (e.key === 'lh:compte') setTimeout(tirerTout, 400); });
  window.addEventListener('online', () => { surveiller(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) surveiller(); });
  setInterval(surveiller, 20000);
}

window.LHSYNC2 = {
  tirerTout, tirerNotifications, tirerDiscussion, tirerAgenda, tirerTelechargements, tirerNotes,
  pousserNotification, publierMessage, ouvrirDiscussion, enregistrerProfil, enregistrerReglages,
  enregistrerNote, rappel, lireToutes, envoyerTelechargement, retirerTelechargement,
  etat: () => ETAT
};

brancher();
setTimeout(() => { if (jeton()) tirerTout(); }, 1500);
})();
