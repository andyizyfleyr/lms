/* ============================================================
   APP CORE — état persistant, routeur de pages, pages système
   ============================================================ */
(function(){
'use strict';

const svg = (id, cls) => `<svg class="${cls || 'icon'}"><use href="#ic-${id}"/></svg>`;
const IC = {
  back  : svg('back'),
  close : svg('close'),
  chev  : svg('chevron', 'icon icon--18'),
  check : svg('check', 'icon icon--16')
};

/* ------------------------------------------------------------
   1. DONNÉES : programmes, quiz, devoirs, notifications…
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   2. ÉTAT PERSISTANT
   ------------------------------------------------------------ */
const S = {
  /* Le profil affiché est TOUJOURS celui du compte ouvert. Ce socle est vide :
     l’identité est posée au démarrage (compte local) puis confirmée par
     /api/auth/me. Aucune identité de démonstration n’est préremplie. */
  profile : store.get('profile', {nom:'', email:'', tel:'', ville:'', promo:'', bio:''}),
  settings: Object.assign({theme:'light', reminders:true, messages:true, weekly:false, animations:true, wifi:true}, store.get('settings', {})),
  lessons : store.get('lessons', {}),
  favs    : store.get('favs', []),
  quiz    : store.get('quiz', {}),
  devoirs : store.get('devoirs', {}),
  notifs  : store.get('notifs', NOTIFS_SEED),
  dl      : store.get('dl', DL_SEED),
  notes   : store.get('notes', {}),
  disc    : store.get('disc', DISC_SEED),
  recent  : store.get('recent', []),
  liked   : store.get('liked', {}),
  streak  : store.get('streak', 0),
  logged  : store.get('logged', true)
};
/* Statistiques du compte connecté (GET /api/stats) : dès qu’elles sont
   connues, c’est elles qui alimentent le tableau de bord — jamais des
   chiffres de démonstration. */
let STATS = null;
function persist(){ ['profile','settings','lessons','favs','quiz','devoirs','notifs','dl','notes','disc','recent','liked','streak','logged']
  .forEach(k => store.set(k, S[k]));
  if (window.LHSYNC) window.LHSYNC.changed();     // synchronisation serveur (si configurée)
}

/* Leçons : construction de l'état initial + index à plat */
const LESSONS = {};
Object.keys(PROGRAMMES).forEach(cid => {
  let i = 0;
  LESSONS[cid] = [];
  PROGRAMMES[cid].forEach((mod, mi) => mod.l.forEach(l => {
    LESSONS[cid].push(Object.assign({}, l, {idx:i, mi:mi, module:mod.m}));
    if (l.done) S.lessons[cid + ':' + i] = 1;
    i++;
  }));
});
persist();

const totalLecons = cid => (LESSONS[cid] || []).length;
const leconsFaites = cid => (LESSONS[cid] || []).filter((l, i) => S.lessons[cid + ':' + i]).length;
const progCours = cid => { const t = totalLecons(cid); return t ? Math.round(leconsFaites(cid) / t * 100) : 0; };
const isFav = cid => S.favs.indexOf(cid) > -1;
const toggleFav = cid => { S.favs = isFav(cid) ? S.favs.filter(x => x !== cid) : S.favs.concat([cid]); persist(); };
const coursSuivis = () => COURS.filter(c => progCours(c.id) > 0).length;
const leconsTotalesFaites = () => COURS.reduce((n, c) => n + leconsFaites(c.id), 0);
const badgeStats = () => ({
  streak  : (STATS && STATS.serie !== undefined) ? STATS.serie : S.streak,
  assidu  : leconsTotalesFaites(),
  premier : leconsTotalesFaites() >= 1 ? 1 : 0,
  regulier: leconsTotalesFaites(),
  perf    : Object.values(S.quiz).filter(q => q.best >= 100).length,
  eclair  : Object.values(S.quiz).filter(q => q.best >= 80).length,
  explor  : coursSuivis(),
  mentor  : Object.values(S.disc).flat().filter(m => m.me).length + 3,
  cyber   : progCours('c6'),
  data    : progCours('c3')
});
const badgeVal = id => { const s = badgeStats(); return s[id] !== undefined ? s[id] : 0; };
const badgeUnlocked = b => badgeVal(b.id) >= b.cible;

/* Devoirs : statut dérivé */
function devoirStatut(d){
  const st = S.devoirs[d.id];
  if (st && st.statut === 'rendu') return {k:'rendu', label:'Rendu'};
  if (d.note) return {k:'note', label:'Noté ' + d.note + '/' + d.points};
  if (d.attente) return {k:'attente', label:'En correction'};
  return {k:'rendre', label:'À rendre'};
}
const devoirDate = d => addDays(d.echeance.j);
function fmtQuand(d){
  const x = d.echeance.j;
  if (x === 0) return "Aujourd'hui";
  if (x === 1) return 'Demain';
  if (x === -1) return 'Hier';
  if (x < 0) return 'Il y a ' + (-x) + ' j';
  const dd = addDays(x);
  return labelJour(dd) + ' ' + MOIS[dd.getMonth()];
}
const devoirsOuverts = () => DEVOIRS.filter(d => devoirStatut(d).k === 'rendre').sort((a,b) => a.echeance.j - b.echeance.j);

/* ------------------------------------------------------------
   3. ROUTEUR DE PAGES
   ------------------------------------------------------------ */
const PAGES = {};
const pageStack = [];
const pageHost = () => $('#pageStack');

/* ------------------------------------------------------------
   3 bis. HISTORIQUE DU NAVIGATEUR
   Le bouton retour du téléphone (geste Android, balayage iOS, flèche du
   navigateur) doit revenir à la page précédente de l'application au lieu
   de quitter le site. Chaque page ouverte entre dans l'historique.
   ------------------------------------------------------------ */
let histDepth = 0;        // entrées ajoutées par l'application
let histIgnore = 0;       // entrées à ignorer (remise à zéro)
let histRestoring = false;// on réinstalle une page depuis l'historique (pas de nouvelle entrée)
let histEcho = 0;         // événements popstate attendus (échos de nos propres reculs)
function histPush(id, arg){
  if (histRestoring) return;
  try {
    history.pushState({ lh:id, arg:arg || '' }, '', location.pathname + location.search + '#' + id + (arg ? '/' + encodeURIComponent(arg) : ''));
    histDepth++;
  } catch (e) {}          // file:// ou contexte restreint : la navigation interne continue de fonctionner
}
function histBack(){
  if (histIgnore || !histDepth) return;
  histDepth--;
  histEcho = Math.min(histEcho + 1, 4);   // le navigateur va nous renvoyer un popstate : à ignorer
  try { history.back(); } catch (e) { histEcho = Math.max(0, histEcho - 1); }
}
function histReset(){
  const n = histDepth;
  histDepth = 0;
  if (!n) return;
  histIgnore = n;
  try { history.go(-n); } catch (e) { histIgnore = 0; }
}
function restorePage(id, arg){
  if (!PAGES[id]) return false;
  if (id === 'cours' || id === 'devoir') return !!pushPage(id, {id:arg || '', tab:''});
  if (id === 'quiz') return !!pushPage('quiz', {quiz:arg || '', id:arg || ''});
  return !!pushPage(id, {});
}
window.addEventListener('popstate', e => {
  if (histIgnore){ histIgnore--; return; }
  if (histEcho){ histEcho--; return; }             // écho d'un recul déclenché par l'application
  const st = e.state || {};
  const top = () => pageStack[pageStack.length - 1];
  if (st.lh){
    if (top() && top().id === st.lh) return;                  // déjà sur la bonne page
    histRestoring = true;
    if (pageStack.some(p => p.id === st.lh)){
      while (pageStack.length && top().id !== st.lh) popPage(true);
    } else {
      restorePage(st.lh, st.arg);                             // bouton « suivant » : on rouvre la page
    }
    histRestoring = false;
    histDepth = Math.max(histDepth, pageStack.length);
    return;
  }
  if (pageStack.length){                                      // retour demandé par le téléphone
    popPage(true);
    histDepth = Math.max(0, histDepth - 1);
  }
});
/* le hash change sans rechargement (lien collé, ancre cliquée) : on suit */
window.addEventListener('hashchange', () => {
  if (histIgnore || histEcho || histRestoring) return;
  const st = history.state || {};
  const top = pageStack[pageStack.length - 1];
  if (st.lh && top && top.id === st.lh) return;          // déjà sur la bonne page
  if (!(location.hash || '').replace(/^#/, '') && !pageStack.length) return;
  openFromHash();
});
/* lien partagé : #cours/c1, #videos, #devoir/d2, #quiz/c1… */
function openFromHash(){
  const h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  if (!h) return false;
  const p = h.split('/'), id = p[0], arg = p[1] || '';
  if (!PAGES[id]) return false;
  return restorePage(id, arg);
}
function pushPage(id, params){
  const def = PAGES[id];
  if (!def) return null;
  params = params || {};
  if (pageStack.length && pageStack[pageStack.length - 1].id === id && def.single) return null;
  const el = document.createElement('section');
  el.className = 'page';
  el.dataset.page = id;
  el.style.zIndex = String(33 + Math.min(pageStack.length, 3));
  el.setAttribute('role', 'dialog');
  el.innerHTML = def.render(params);
  pageHost().appendChild(el);
  hydrate(el);
  pageStack.push({id:id, el:el, params:params, def:def});
  requestAnimationFrame(() => { el.classList.add('is-open'); });
  animateProgress(el);
  const sc = el.querySelector('.page__scroll');
  if (sc){
    sc.addEventListener('scroll', () => {
      const bar = el.querySelector('.page__bar');
      if (bar) bar.classList.toggle('is-scrolled', sc.scrollTop > 6);
    }, {passive:true});
  }
  if (def.mount) def.mount(el, params);
  histPush(id, params.id || params.quiz || '');
  return el;
}
function popPage(fromHistory){
  const top = pageStack.pop();
  if (!top) return false;
  if (!fromHistory) histBack();          // la flèche « retour » consomme aussi l'entrée d'historique
  if (top.def.unmount) top.def.unmount(top.el, top.params);
  top.el.classList.remove('is-open');
  top.el.classList.add('is-closing');
  setTimeout(() => top.el.remove(), 330);
  if (top.def.onBack) top.def.onBack(top.el, top.params);
  return true;
}
function refreshPages(){
  pageStack.forEach(p => { if (p.def.refresh) p.def.refresh(p.el, p.params); });
}
const topPage = () => pageStack[pageStack.length - 1] || null;

/* ------------------------------------------------------------
   3 ter. DÉFILEMENT MAÎTRISÉ (et racines toujours en place)
   scrollIntoView() déplace TOUTE la chaîne des conteneurs défilables, y
   compris les racines de l'application : un élément en overflow:hidden
   reste défilable par programme. L'application se retrouvait ainsi
   décalée vers le bas (ou le haut) sans qu'aucun geste ne puisse la
   remettre en place. On calcule donc nous-mêmes la position, dans le
   seul conteneur réellement concerné, puis on repose les racines.
   ------------------------------------------------------------ */
function conteneurDefilable(noeud){
  let p = noeud && noeud.parentElement;
  while (p && p !== document.body){
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
    p = p.parentElement;
  }
  return null;
}
function defilerVers(cible, conteneur, align){
  if (!cible) return false;
  const c = conteneur || conteneurDefilable(cible);
  if (!c) return false;
  const rc = cible.getBoundingClientRect(), rp = c.getBoundingClientRect();
  let haut = c.scrollTop + (rc.top - rp.top);
  if (align === 'centre')   haut -= (c.clientHeight - rc.height) / 2;
  else if (align === 'fin') haut -= (c.clientHeight - rc.height - 12);
  else                      haut -= 12;                       /* « début » */
  haut = Math.max(0, Math.min(Math.round(haut), c.scrollHeight - c.clientHeight));
  try { c.scrollTo({ top:haut, behavior:'smooth' }); } catch (e) { c.scrollTop = haut; }
  remettreEnPlace();
  return true;
}
/* Aucune racine ne doit défiler : si un navigateur l'a déplacée (appel
   interne à scrollIntoView, focus d'un champ, clavier virtuel), on la
   remet aussitôt en place. */
function remettreEnPlace(){
  const racines = [document.scrollingElement, document.documentElement, document.body,
                   $('.app'), $('#pageStack'), $('#player')];
  for (const r of racines){
    if (r && (r.scrollTop || r.scrollLeft)){
      try { r.scrollTop = 0; r.scrollLeft = 0; } catch (e) {}
    }
  }
  $$('section.page').forEach(p => { if (p.scrollTop) p.scrollTop = 0; });
}
document.addEventListener('scroll', e => {
  const t = e.target;
  if (!t || !t.classList) return;
  if (t === document.scrollingElement || t === document.documentElement || t === document.body ||
      t.classList.contains('app') || t.classList.contains('page') ||
      t.classList.contains('page-stack') || t.id === 'player') remettreEnPlace();
}, true);

/* ------------------------------------------------------------
   4. DIALOG + BOTTOM SHEET GÉNÉRIQUES
   ------------------------------------------------------------ */
function dialog(opt){
  return new Promise(resolve => {
    const box = $('#dialog');
    box.innerHTML = `<div class="dialog__card" role="alertdialog" aria-modal="true">
      ${opt.ico ? `<span class="dialog__ico">${svg(opt.ico, 'icon icon--28')}</span>` : ''}
      <h3>${esc(opt.title || '')}</h3>
      ${opt.text ? `<p>${opt.text}</p>` : ''}
      <div class="dialog__actions">
        ${opt.cancel === false ? '' : `<button class="btn btn--text ripple" data-d="0">${esc(opt.cancelLabel || 'Annuler')}</button>`}
        <button class="btn ${opt.danger ? 'btn--danger' : 'btn--filled'} ripple" data-d="1">${esc(opt.confirmLabel || 'Confirmer')}</button>
      </div>
    </div>`;
    box.classList.add('is-open');
    const close = v => {
      box.classList.remove('is-open');
      setTimeout(() => { box.innerHTML = ''; }, 220);
      resolve(v);
    };
    box.onclick = e => {
      const b = e.target.closest('[data-d]');
      if (b) close(b.dataset.d === '1');
      else if (e.target === box && opt.dismissable !== false) close(false);
    };
    if (opt.onOpen) opt.onOpen(box);
  });
}
function openSheet(html, onMount){
  const sheet = $('#sheet'), scrim = $('#scrim');
  sheet.innerHTML = (sheet.querySelector('.sheet__handle') ? '' : '<div class="sheet__handle"></div>') + html;
  hydrate(sheet);
  sheet.classList.add('is-open');
  scrim.classList.add('is-open');
  if (onMount) onMount(sheet);
  return sheet;
}
function closeSheet(){
  $('#sheet').classList.remove('is-open');
  $('#scrim').classList.remove('is-open');
}

/* Petit constructeur de « state layer » partagé pour les nouveaux composants */
function barPage(title, actions, bodyHtml, opts){
  opts = opts || {};
  return `<div class="page__bar">
      <button class="icon-btn ripple page__back--bar" data-back aria-label="Retour">${IC.back}</button>
      <h1>${esc(title)}</h1>
      <div>${actions || ''}</div>
    </div>
    <div class="page__scroll"><div class="page__pad"${opts.pad === false ? ' style="padding:0"' : ''}>${bodyHtml}</div></div>`;
}
const emptyBox = (ico, titre, txt) => `<div class="empty">
  <span class="empty__ico">${svg(ico, 'icon icon--28')}</span>
  <p class="title-medium">${esc(titre)}</p>
  <p class="body-small">${esc(txt)}</p></div>`;

/* ------------------------------------------------------------
   5. DEVOIRS : rendu partagé (accueil, agenda, page)
   ------------------------------------------------------------ */
function devoirPill(d){
  const st = devoirStatut(d);
  if (st.k === 'rendu')   return '<span class="pill pill--ok">Rendu</span>';
  if (st.k === 'note')    return '<span class="pill pill--ok">' + esc(st.label) + '</span>';
  if (st.k === 'attente') return '<span class="pill pill--normal">En correction</span>';
  const cls = d.niveau === 'urgent' ? 'urgent' : d.niveau === 'soon' ? 'soon' : 'normal';
  return '<span class="pill pill--' + cls + '">' + esc(fmtQuand(d).toUpperCase()) + '</span>';
}
function devoirRowHTML(d){
  const c = coursById(d.cours) || {};
  const ico = d.quiz ? 'task' : d.type === 'Projet' ? 'upload' : d.type.indexOf('Quiz') > -1 ? 'help' : 'chart';
  return `<button class="deadline ripple" data-page="devoir" data-id="${d.id}">
    <span class="deadline__ico acc-${c.acc || 'purple'}">${svg(ico, 'icon icon--20')}</span>
    <span class="deadline__main">
      <h3>${esc(d.titre)}</h3>
      <p>${esc(c.titre || '')} · ${esc(d.echeance.h)} · ${d.points} pts</p>
    </span>
    ${devoirPill(d)}
  </button>`;
}
function renderDevoirs(){
  const box = $('#deadlines');
  if (box){
    const list = devoirsOuverts().slice(0, 3);
    box.innerHTML = list.length ? list.map(devoirRowHTML).join('')
      : emptyBox('check-circle', 'Tout est à jour', "Aucune échéance en attente. Bravo !");
  }
  const ag = $('#agendaTasks');
  if (ag) ag.innerHTML = DEVOIRS.slice().sort((a,b) => b.echeance.j - a.echeance.j).map(devoirRowHTML).join('');
}

/* ------------------------------------------------------------
   6. AGENDA : timeline + calendrier mensuel
   ------------------------------------------------------------ */
function renderSessions(jour){
  const items = SESS.filter(s => s.jour === jour);
  const box = $('#timeline');
  if (!box) return;
  if (!items.length){
    box.innerHTML = emptyBox('calendar', 'Journée libre', 'Aucune session prévue. Profitez-en pour réviser 🌿');
    return;
  }
  box.innerHTML = items.map(s => `
    <div class="tl-item">
      <span class="tl-item__dot"></span>
      <div class="tl-item__time">${esc(s.heure)}</div>
      <button class="tl-card ripple" data-session="${s.id}">
        <h3>${esc(s.titre)}</h3>
        <div class="meta">${svg(s.ico, 'icon')}${esc(s.type)} · ${esc(s.duree)} · ${esc(s.salle)}</div>
        <div class="tags">
          <span class="pill pill--normal">${esc(s.tags.join(' · '))}</span>
          ${s.cours ? `<span class="pill pill--normal">${esc((coursById(s.cours) || {}).titre || '')}</span>` : ''}
          <span class="pill pill--ok">Confirmé</span>
        </div>
      </button>
    </div>`).join('');
}
window.renderTimeline = renderSessions;   // remplace la version d'origine (cartes cliquables)

function openSession(id){
  const s = SESS.find(x => x.id === id);
  if (!s) return;
  const d = addDays(s.jour - (today.getDay() + 6) % 7);
  openSheet(`
    <h3 class="title-medium">${esc(s.titre)}</h3>
    <p class="body-small muted" style="padding:0 6px 12px">${esc(JOURS[d.getDay()])} ${d.getDate()} ${MOIS[d.getMonth()]} · ${esc(s.heure)} — ${esc(s.salle)}</p>
    <div class="card card--pad" style="display:grid;gap:10px;margin-bottom:12px">
      <div class="kv"><span>Type</span><b>${esc(s.type)}</b></div>
      <div class="kv"><span>Durée</span><b>${esc(s.duree)}</b></div>
      <div class="kv"><span>Formateur</span><b>${esc(s.prof)}</b></div>
      ${s.cours ? `<div class="kv"><span>Cours</span><b>${esc((coursById(s.cours) || {}).titre || '')}</b></div>` : ''}
    </div>
    <p class="body-medium muted" style="padding:0 6px 14px">${esc(s.desc)}</p>
    <div class="list-row" data-reminder>
      <span class="list-row__ico acc-purple">${svg('bell', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>Me rappeler 15 min avant</h3><p>Notification sur cet appareil</p></div>
      <button class="switch" role="switch" aria-checked="false" aria-label="Rappel"></button>
    </div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn btn--filled ripple" style="flex:1" data-act="join" data-id="${s.id}">${svg('video', 'icon icon--18')} Rejoindre</button>
      <button class="btn btn--outlined ripple" data-act="addcal" data-id="${s.id}">${svg('calendar', 'icon icon--18')} Agenda</button>
    </div>
    ${s.cours ? `<button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-page="cours" data-id="${s.cours}">Voir le cours</button>` : ''}
  `);
}

/* Calendrier mensuel */
let calRef = new Date(today.getFullYear(), today.getMonth(), 1);
let calSel = new Date(today);
function renderMonth(){
  const box = $('#monthBox');
  if (!box) return;
  const y = calRef.getFullYear(), m = calRef.getMonth();
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;               // lundi = 0
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const hasEv = wd => SESS.some(s => (1 + s.jour) % 7 === wd);   // jour lundi-based -> getDay
  let cells = '';
  for (let i = 0; i < start; i++)
    cells += `<span class="cal__d out">${prevDays - start + 1 + i}</span>`;
  for (let d = 1; d <= days; d++){
    const dt = new Date(y, m, d);
    const wd = dt.getDay();
    const isToday = dt.toDateString() === today.toDateString();
    const sel = dt.toDateString() === calSel.toDateString();
    cells += `<button class="cal__d ripple${hasEv(wd) ? ' has-ev' : ''}${isToday ? ' is-today' : ''}${sel ? ' is-sel' : ''}" data-cal="${d}">${d}</button>`;
  }
  const rest = (7 - ((start + days) % 7)) % 7;
  for (let i = 1; i <= rest; i++) cells += `<span class="cal__d out">${i}</span>`;
  box.innerHTML = `
    <div class="cal-nav">
      <button class="icon-btn ripple" data-calnav="-1" aria-label="Mois précédent"><svg class="icon" style="transform:rotate(180deg)"><use href="#ic-chevron"/></svg></button>
      <h3>${MOIS_FULL[m]} ${y}</h3>
      <button class="icon-btn ripple" data-calnav="1" aria-label="Mois suivant">${IC.chev}</button>
    </div>
    <div class="cal">
      ${['L','M','M','J','V','S','D'].map(j => `<span class="cal__hd">${j}</span>`).join('')}
      ${cells}
    </div>`;
  const head = $('#timelineTitle');
  if (head){ head.hidden = false; head.textContent = 'Sessions du ' + JOURS[calSel.getDay()] + ' ' + calSel.getDate() + ' ' + MOIS[calSel.getMonth()]; }
  renderSessionsByDate(calSel);
}
const MOIS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function renderSessionsByDate(dt){
  const wd = dt.getDay();                                // getDay : 0 = dimanche
  const jour = (wd + 6) % 7;                             // index lundi-based
  renderSessions(jour);
}

/* ------------------------------------------------------------
   7. NOTIFICATIONS
   ------------------------------------------------------------ */
const notifIcon = t => ({devoir:['task','purple'], quiz:['star','blue'], badge:['trophy','amber'], cours:['school','green'], message:['chat','purple'], systeme:['download','teal']})[t] || ['bell','purple'];
function notifAge(min){
  if (min < 60) return 'il y a ' + min + ' min';
  if (min < 1440) return 'il y a ' + Math.round(min / 60) + ' h';
  const j = Math.round(min / 1440);
  return j <= 1 ? 'hier' : 'il y a ' + j + ' jours';
}
const notifsNonLues = () => S.notifs.filter(n => !n.lu).length;
function updateNotifBadge(){
  const b = $('#notifBadge');
  if (!b) return;
  const n = notifsNonLues();
  b.textContent = n;
  b.hidden = n === 0;
  const btn = $('#notifBtn');
  if (btn) btn.setAttribute('aria-label', n ? n + ' notifications non lues' : 'Notifications');
}
function notifRowHTML(n){
  const [ico, acc] = notifIcon(n.type);
  const cible = (coursById(n.go[1]) || {}).titre;
  return `<button class="nrow ripple${n.lu ? '' : ' is-unread'}" data-notif="${n.id}">
    <span class="nrow__ico acc-${acc}">${svg(ico, 'icon icon--20')}</span>
    <span class="nrow__main">
      <h3>${esc(n.t)}</h3>
      <p>${esc(n.b)}</p>
      <span class="nrow__meta">${svg('clock', 'icon icon--16')}${esc(notifAge(n.min))}${cible ? ' · ' + esc(cible) : ''}</span>
    </span>
    ${n.lu ? '' : '<span class="nrow__dot" aria-label="Non lue"></span>'}
  </button>`;
}
PAGES.notifications = {
  single: true,
  render(){
    const nonLues = notifsNonLues();
    return barPage('Notifications',
      nonLues ? `<button class="text-btn ripple" data-act="readAll">Tout lire</button>` : '',
      `<div class="tabs n-tabs">
         <button class="tab is-active" data-ntab="all">Toutes (${S.notifs.length})</button>
         <button class="tab" data-ntab="unread">Non lues (${nonLues})</button>
       </div>
       <div class="n-list" style="margin-top:14px"></div>`);
  },
  mount(el){
    const paint = mode => {
      const list = S.notifs.filter(n => mode === 'all' || !n.lu)
        .slice().sort((a,b) => a.min - b.min);
      $('.n-list', el).innerHTML = list.length ? list.map(notifRowHTML).join('')
        : emptyBox('bell', 'Aucune notification', 'Vous êtes à jour 👌');
      hydrate(el);
    };
    paint('all');
    el.addEventListener('click', e => {
      const tab = e.target.closest('[data-ntab]');
      if (tab){
        $$('.n-tabs .tab', el).forEach(t => t.classList.toggle('is-active', t === tab));
        paint(tab.dataset.ntab);
        return;
      }
      const row = e.target.closest('[data-notif]');
      if (row){
        const n = S.notifs.find(x => x.id === row.dataset.notif);
        if (!n) return;
        n.lu = 1; persist(); updateNotifBadge();
        row.classList.remove('is-unread');
        const dot = row.querySelector('.nrow__dot'); if (dot) dot.remove();
        // redirection vers la cible de la notification
        const [kind, ref, extra] = n.go;
        if (kind === 'session'){ openSession(ref); return; }
        if (kind === 'telechargements' || kind === 'badges' || kind === 'aide'){ pushPage(kind, {}); return; }
        if (kind === 'quiz'){ pushPage('quiz', {quiz:ref, id:ref}); return; }
        if (kind === 'devoir' || kind === 'cours'){ pushPage(kind, {id:ref, tab:(extra && extra.tab) || ''}); return; }
      }
    });
  },
  refresh(el){ this.mount(el); }
};

/* ------------------------------------------------------------
   8. RECHERCHE
   ------------------------------------------------------------ */
function pushRecent(q){
  q = q.trim(); if (!q) return;
  S.recent = [q].concat(S.recent.filter(x => x.toLowerCase() !== q.toLowerCase())).slice(0, 6);
  persist();
}
const SUGGESTIONS = ['Material 3','JavaScript','Pandas','Quiz','Live','Anglais'];
PAGES.recherche = {
  single: true,
  render(){
    return barPage('Recherche', '',
      `<div class="search-bar ripple" style="background:var(--md-surface-high)">
         ${svg('search')}
         <input class="q-input" type="search" placeholder="Cours, leçon, devoir…" aria-label="Rechercher" autocomplete="off">
       </div>
       <div class="q-body" style="margin-top:16px"></div>`);
  },
  mount(el){
    const input = $('.q-input', el);
    const body  = $('.q-body', el);
    const paintIdle = () => {
      body.innerHTML = `
        ${S.recent.length ? `<div class="res-group">
          <div class="res-group__h">${svg('clock', 'icon icon--16')} RECHERCHES RÉCENTES
            <button class="text-btn ripple" style="margin-left:auto" data-act="clearRecent">Effacer</button></div>
          <div class="sug">${S.recent.map(r => `<button class="chip ripple" data-q="${esc(r)}">${svg('refresh', 'icon icon--18')}${esc(r)}</button>`).join('')}</div>
        </div>` : ''}
        <div class="res-group">
          <div class="res-group__h">${svg('fire', 'icon icon--16')} SUGGESTIONS</div>
          <div class="sug">${SUGGESTIONS.map(s => `<button class="chip ripple" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        </div>
        <div class="res-group">
          <div class="res-group__h">${svg('trending', 'icon icon--16')} À REPRENDRE</div>
          ${COURS.filter(c => progCours(c.id) > 0 && progCours(c.id) < 100).slice(0,3).map(courseRowHTML).join('')}
        </div>`;
      hydrate(body);
      body.querySelectorAll('.lp__bar[data-prog]').forEach(b => b.style.width = b.dataset.prog + '%');
    };
    paintIdle();
    const search = q => {
      q = q.trim().toLowerCase();
      if (!q){ paintIdle(); return; }
      const cours = COURS.filter(c => (c.titre + ' ' + c.cat + ' ' + c.prof).toLowerCase().includes(q));
      const lecons = [];
      COURS.forEach(c => LESSONS[c.id].forEach((l, i) => {
        if (l.t.toLowerCase().includes(q)) lecons.push({c:c, l:l, i:i});
      }));
      const devoirs = DEVOIRS.filter(d => (d.titre + ' ' + ((coursById(d.cours) || {}).titre || '')).toLowerCase().includes(q));
      const videos = VIDEOS.filter(v => (v.titre + ' ' + v.chaine).toLowerCase().includes(q));
      const total = cours.length + lecons.length + devoirs.length + videos.length;
      body.innerHTML = total ? `
        ${cours.length ? `<div class="res-group"><div class="res-group__h">${svg('school', 'icon icon--16')} COURS (${cours.length})</div>${cours.map(courseRowHTML).join('')}</div>` : ''}
        ${lecons.length ? `<div class="res-group"><div class="res-group__h">${svg('task', 'icon icon--16')} LEÇONS (${lecons.length})</div>${lecons.slice(0,6).map(x => `
            <button class="list-row ripple" data-page="cours" data-id="${x.c.id}" data-tab="programme">
              <span class="list-row__ico acc-${x.c.acc}">${svg(x.l.k === 'video' ? 'play' : 'task', 'icon icon--20')}</span>
              <span class="list-row__main"><h3>${esc(x.l.t)}</h3><p>${esc(x.c.titre)} · ${esc(x.l.d)}${S.lessons[x.c.id+':'+x.i] ? ' · terminée' : ''}</p></span>
              ${IC.chev}
            </button>`).join('')}</div>` : ''}
        ${devoirs.length ? `<div class="res-group"><div class="res-group__h">${svg('help', 'icon icon--16')} DEVOIRS (${devoirs.length})</div>${devoirs.map(devoirRowHTML).join('')}</div>` : ''}
        ${videos.length ? `<div class="res-group"><div class="res-group__h">${svg('ytplay', 'icon icon--16')} VIDÉOS (${videos.length})</div>${videos.slice(0,6).map(vrowHTML).join('')}</div>` : ''}`
        : emptyBox('search', 'Aucun résultat', 'Essayez « Material 3 », « Pandas » ou « quiz ».');
      hydrate(body);
      animateProgress(body);
    };
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => search(input.value), 150); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter'){ pushRecent(input.value); search(input.value); input.blur(); } });
    el.addEventListener('click', e => {
      const q = e.target.closest('[data-q]');
      if (q){ input.value = q.dataset.q; pushRecent(q.dataset.q); search(q.dataset.q); }
    });
    setTimeout(() => input.focus(), 260);
  }
};

/* ------------------------------------------------------------
   9. BIBLIOTHÈQUE VIDÉO
   ------------------------------------------------------------ */
let libFilter = 'toutes';
PAGES.videos = {
  single: true,
  render(){
    const chips = [['toutes','Toutes','grid'],['encours','En cours','play'],['termine','Terminées','check-circle'],['save','Enregistrées','bookmark']];
    return barPage('Bibliothèque vidéo',
      `<span class="pill pill--normal lib-count">${VIDEOS.length}</span>`,
      `<div class="search-bar" style="background:var(--md-surface-high);height:52px">
         ${svg('search')}<input class="lib-q" type="search" placeholder="Rechercher une vidéo ou une chaîne…" aria-label="Rechercher une vidéo">
       </div>
       <div class="chips" style="margin:14px -16px 6px;padding:2px 16px 12px">
         ${chips.map(c => `<button class="chip ripple${c[0]==='toutes'?' is-selected':''}" data-lib="${c[0]}">${svg(c[2], 'icon')}${c[1]}</button>`).join('')}
       </div>
       <div class="lib-list"></div>`);
  },
  mount(el){
    const list = $('.lib-list', el);
    const paint = () => {
      const q = $('.lib-q', el).value.trim().toLowerCase();
      const vs = VIDEOS.filter(v => {
        const okF = libFilter === 'toutes' ? true
          : libFilter === 'encours' ? (v.prog > 0 && v.prog < 100)
          : libFilter === 'termine' ? v.prog >= 100
          : !!vstate[v.yt].save;
        const okQ = !q || (v.titre + ' ' + v.chaine).toLowerCase().includes(q);
        return okF && okQ;
      });
      $('.lib-count', el).textContent = vs.length + (vs.length > 1 ? ' vidéos' : ' vidéo');
      list.innerHTML = vs.length ? vs.map(vrowHTML).join('')
        : emptyBox('ytplay', 'Aucune vidéo', 'Aucune vidéo ne correspond à ce filtre.');
      hydrate(list);
      animateProgress(list);
    };
    paint();
    el.addEventListener('click', e => {
      const c = e.target.closest('[data-lib]');
      if (c){ $$('[data-lib]', el).forEach(x => x.classList.toggle('is-selected', x === c)); libFilter = c.dataset.lib; paint(); }
    });
    $('.lib-q', el).addEventListener('input', () => { clearTimeout(el._t); el._t = setTimeout(paint, 140); });
  }
};

/* ------------------------------------------------------------
   10. TÉLÉCHARGEMENTS
   ------------------------------------------------------------ */
const DL_TOTAL = 4096;   // Mo disponibles
let dlTimer = null;
function dlUsed(){ return S.dl.filter(d => d.st === 'done').reduce((n, d) => n + d.size, 0); }
function dlRowHTML(d){
  const ico = d.ref === 'v' ? 'ytplay' : 'download';
  const acc = d.ref === 'v' ? 'amber' : ((coursById(d.ref) || {}).acc || 'purple');
  const state = d.st === 'done' ? 'Disponible hors-ligne' : d.st === 'pause' ? 'En pause' : 'Téléchargement…';
  return `<div class="dl ${d.st === 'done' ? 'is-done' : ''} ${d.st === 'pause' ? 'is-paused' : ''}" data-dl="${d.id}">
    <span class="dl__ico acc-${acc}">${svg(ico, 'icon icon--20')}</span>
    <span class="dl__main">
      <h3>${esc(d.t)}</h3>
      <p>${esc(d.s)} · <span class="dl__state">${state}</span>${d.st === 'done' ? '' : ' · ' + d.p + ' %'}</p>
      <span class="lp lp--sm" style="display:block"><span class="lp__track"></span><span class="lp__bar" style="width:${d.p}%;background:${d.st==='done'?'var(--md-success)':'var(--md-primary)'}"></span></span>
    </span>
    <span class="dl__acts">
      ${d.st === 'done'
        ? `<button class="icon-btn ripple" data-dlact="open" aria-label="Ouvrir">${svg('play', 'icon icon--20')}</button>`
        : `<button class="icon-btn ripple" data-dlact="${d.st === 'pause' ? 'resume' : 'pause'}" aria-label="Pause/Reprendre">${svg(d.st === 'pause' ? 'download' : 'pause', 'icon icon--20')}</button>`}
      <button class="icon-btn ripple" data-dlact="del" aria-label="Supprimer">${svg('close', 'icon icon--20')}</button>
    </span>
  </div>`;
}
function paintDl(el){
  const box = $('.dl-list', el);
  if (!box) return;
  box.innerHTML = S.dl.length ? S.dl.map(dlRowHTML).join('') : emptyBox('download', 'Aucun téléchargement', 'Ajoutez un cours ou une vidéo pour le consulter hors-ligne.');
  const pct = Math.round(dlUsed() / DL_TOTAL * 100);
  const b = $('.dl-used', el);
  if (b) b.textContent = (dlUsed() > 1024 ? (dlUsed() / 1024).toFixed(1) + ' Go' : dlUsed() + ' Mo') + ' sur ' + (DL_TOTAL / 1024) + ' Go';
  const bar = $('.dl-storage', el);
  if (bar) bar.style.width = Math.min(100, pct) + '%';
  const cnt = $('.dl-count', el);
  if (cnt) cnt.textContent = S.dl.filter(d => d.st === 'done').length + ' terminés';
}
function dlTick(){
  let changed = false;
  S.dl.forEach(d => {
    if (d.st === 'dl' && d.p < 100){
      d.p = Math.min(100, d.p + 3 + Math.round(Math.random() * 5));
      if (d.p >= 100){ d.st = 'done'; d.p = 100; notification('systeme','Téléchargement terminé', d.t + ' est disponible hors-ligne.', ['telechargements','']); }
      changed = true;
    }
  });
  if (changed){ persist(); const el = $('.page[data-page="telechargements"]'); if (el) paintDl(el); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(dlTimer); });
PAGES.telechargements = {
  single: true,
  render(){
    return barPage('Téléchargements',
      `<span class="pill pill--normal dl-count">${S.dl.filter(d => d.st === 'done').length} terminés</span>`,
      `<div class="storage">
         <div class="storage__row"><span>Stockage utilisé</span><span class="dl-used"></span></div>
         <div class="lp"><div class="lp__track"></div><div class="lp__bar dl-storage"></div></div>
         <p class="body-small muted" style="margin-top:10px">Le téléchargement n'utilise le réseau que sur Wi-Fi si l'option est activée dans les paramètres.</p>
       </div>
       <div class="sec__h"><h2>Contenus hors-ligne</h2></div>
       <div class="dl-list"></div>
       <div class="note" style="margin-top:6px">${svg('info', 'icon')}<span>Les contenus terminés restent « disponibles hors-ligne » et sont lisibles sans connexion.</span></div>`);
  },
  mount(el){
    paintDl(el);
    clearInterval(dlTimer);
    dlTimer = setInterval(dlTick, 1300);
    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-dlact]');
      if (!btn) return;
      const id = btn.closest('[data-dl]').dataset.dl;
      const d = S.dl.find(x => x.id === id);
      if (!d) return;
      const act = btn.dataset.dlact;
      if (act === 'pause'){ d.st = 'pause'; toast('Téléchargement mis en pause'); }
      else if (act === 'resume'){ d.st = 'dl'; toast('Téléchargement repris'); if (!dlTimer) dlTimer = setInterval(dlTick, 1300); }
      else if (act === 'open'){
        if (d.v){ openVideo(d.v); return; }
        pushPage('cours', {id:d.ref, tab:'programme'}); return;
      }
      else if (act === 'del'){
        dialog({title:'Supprimer le téléchargement ?', text:'« ' + esc(d.t) + ' » sera supprimé de l\'appareil.', confirmLabel:'Supprimer', danger:true, ico:'download'})
          .then(ok => { if (!ok) return; S.dl = S.dl.filter(x => x.id !== id); persist(); paintDl(el); toast('Téléchargement supprimé'); });
        return;
      }
      persist(); paintDl(el);
    });
  },
  unmount(){ clearInterval(dlTimer); dlTimer = null; },
  refresh(el){ paintDl(el); }
};
function addDownload(ref, titre, size, v){
  if (S.dl.some(d => d.t === titre)) { toast('Déjà téléchargé ou en cours'); return; }
  S.dl.push({id:'dl' + Date.now(), ref:ref, t:titre, s:(v ? 'Vidéo · ' : '') + size + ' Mo', p:1, st:'dl', size:size, v:v || null});
  persist();
  const el = $('.page[data-page="telechargements"]'); if (el) paintDl(el);
  toast('Téléchargement lancé · ' + titre);
}

/* ------------------------------------------------------------
   11. BADGES
   ------------------------------------------------------------ */
function paintBadges(box){
  if (!box) return;
  box.innerHTML = BADGES_DEF.map(b => {
    const v = badgeVal(b.id), ok = badgeUnlocked(b);
    const pct = Math.min(100, Math.round(v / b.cible * 100));
    return `<button class="bcard ripple${ok ? '' : ' is-locked'}" data-badge="${b.id}">
      <span class="bcard__top">
        <span class="bcard__ico acc-${b.acc}">${svg(b.ico, 'icon')}</span>
        <span><h3>${esc(b.nom)}</h3><p>${esc(b.desc)}</p></span>
      </span>
      <span class="bcard__prog">
        <span class="lp lp--sm" style="display:block;flex:1"><span class="lp__track"></span><span class="lp__bar" style="width:${pct}%;background:${ok ? 'var(--md-success)' : 'var(--md-primary)'}"></span></span>
        <b>${ok ? 'Obtenu' : v + '/' + b.cible}</b>
      </span>
    </button>`;
  }).join('');
}
const BADGES_HOME = ['streak','perf','explo','data'];
function renderHomeBadges(){
  const box = $('#badges');
  if (!box) return;
  box.innerHTML = BADGES_HOME.map(id => BADGES_DEF.find(x => x.id === id)).filter(Boolean).map(b => {
    const ok = badgeUnlocked(b);
    return `<button class="badge-item ripple${ok ? '' : ' is-locked'}" data-badge="${b.id}">
      <span class="badge-item__ico acc-${b.acc}">${svg(b.ico, 'icon')}</span>
      <span>${esc(b.nom)}</span></button>`;
  }).join('');
}
PAGES.badges = {
  single: true,
  render(){
    const tot = BADGES_DEF.filter(badgeUnlocked).length;
    return barPage('Mes badges', `<span class="pill pill--ok">${tot}/${BADGES_DEF.length}</span>`,
      `<div class="note" style="margin-bottom:14px">${svg('trophy', 'icon')}
         <span>Les badges se débloquent automatiquement selon votre activité : leçons terminées, quiz réussis, messages publiés et cours achevés.</span></div>
       <div class="bgrid b-grid"></div>`);
  },
  mount(el){
    paintBadges($('.b-grid', el));
    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-badge]');
      if (!btn) return;
      const b = BADGES_DEF.find(x => x.id === btn.dataset.badge);
      const v = badgeVal(b.id), ok = badgeUnlocked(b);
      openSheet(`
        <h3 class="title-medium">${esc(b.nom)}</h3>
        <div style="display:grid;place-items:center;gap:10px;padding:18px 0">
          <span class="badge-item__ico acc-${b.acc}" style="width:76px;height:76px;border-radius:var(--r-2xl)">${svg(b.ico, 'icon icon--28')}</span>
          <b class="title-medium">${ok ? 'Badge obtenu 🎉' : 'Progression ' + v + '/' + b.cible}</b>
          <p class="body-small muted" style="text-align:center;max-width:260px">${esc(b.desc)}</p>
        </div>
        <div class="lp"><div class="lp__track"></div><div class="lp__bar" style="width:${Math.min(100, v / b.cible * 100)}%"></div></div>
        <button class="btn btn--tonal btn--block ripple" style="margin-top:16px" data-act="closeSheet">Fermer</button>`);
    });
  },
  refresh(el){ paintBadges($('.b-grid', el)); }
};
function notification(type, t, b, go){
  S.notifs.unshift({id:'n' + Date.now(), type:type, t:t, b:b, min:0, lu:0, go:go || []});
  persist(); updateNotifBadge();
}

/* ------------------------------------------------------------
   12. AIDE / FAQ
   ------------------------------------------------------------ */
PAGES.aide = {
  single: true,
  render(){
    return barPage('Centre d\'aide', '',
      `<div class="note" style="margin-bottom:14px">${svg('help', 'icon')}
         <span>Réponses immédiates aux questions fréquentes. Si besoin, l'équipe support répond en moyenne en 2 h.</span></div>
       <div class="faq"></div>
       <div class="sec"><div class="sec__h"><h2>Contacter le support</h2></div>
         <div style="display:flex;gap:10px;flex-wrap:wrap">
           <button class="btn btn--tonal ripple" data-act="contact" data-c="chat">${svg('chat', 'icon icon--18')} Chat</button>
           <button class="btn btn--outlined ripple" data-act="contact" data-c="mail">${svg('external', 'icon icon--18')} E-mail</button>
           <button class="btn btn--outlined ripple" data-act="contact" data-c="tel">${svg('bell', 'icon icon--18')} Rappel</button>
         </div>
       </div>
       <div class="sec"><div class="sec__h"><h2>Signaler un problème</h2></div>
         <div class="field field--area"><textarea class="ticket-txt" id="ticketTxt" placeholder=" "></textarea><label for="ticketTxt">Décrivez le problème rencontré…</label></div>
         <button class="btn btn--filled btn--block ripple" data-act="ticket">${svg('upload', 'icon icon--18')} Envoyer au support</button>
       </div>`);
  },
  mount(el){
    $('.faq', el).innerHTML = FAQ.map((f, i) => `
      <details class="acc"${i === 0 ? ' open' : ''}>
        <summary>${IC.chev}<span>${esc(f.q)}</span></summary>
        <div class="acc__body">${esc(f.r)}</div>
      </details>`).join('');
  }
};

/* ------------------------------------------------------------
   13. PARAMÈTRES
   ------------------------------------------------------------ */
PAGES.parametres = {
  single: true,
  render(){
    const st = S.settings;
    const sw = (k, v) => `<button class="switch" role="switch" aria-checked="${v ? 'true' : 'false'}" data-set="${k}" aria-label="${k}"></button>`;
    return barPage('Paramètres', '',
      `<div class="sec" style="margin-top:4px"><div class="sec__h"><h2>Compte</h2></div>
         <button class="list-row ripple" data-page="profil-edit">
           <span class="list-row__ico acc-purple">${svg('person', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>${esc(S.profile.nom)}</h3><p>${esc(S.profile.email)}</p></span>${IC.chev}
         </button>
         <button class="list-row ripple" data-act="pwd">
           <span class="list-row__ico acc-blue">${svg('shield', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Mot de passe</h3><p>Modifier le mot de passe du compte</p></span>${IC.chev}
         </button>
         <button class="list-row ripple" data-act="devices">
           <span class="list-row__ico acc-teal">${svg('sliders', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Appareils connectés</h3><p>2 appareils actifs</p></span>${IC.chev}
         </button>
       </div>

       <div class="sec"><div class="sec__h"><h2>Notifications</h2></div>
         <div class="list-row"><span class="list-row__ico acc-amber">${svg('bell', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Rappels d'échéances</h3><p>24 h avant la clôture</p></span>${sw('reminders', st.reminders)}</div>
         <div class="list-row"><span class="list-row__ico acc-purple">${svg('chat', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Messages des formateurs</h3><p>Réponses et commentaires</p></span>${sw('messages', st.messages)}</div>
         <div class="list-row"><span class="list-row__ico acc-green">${svg('trending', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Résumé hebdomadaire</h3><p>Chaque lundi matin</p></span>${sw('weekly', st.weekly)}</div>
       </div>

       <div class="sec"><div class="sec__h"><h2>Apparence</h2></div>
         <div class="segmented" id="themeSeg">
           <button class="ripple" data-theme-opt="light" aria-pressed="${st.theme === 'light'}">${svg('sun', 'icon')} Clair</button>
           <button class="ripple" data-theme-opt="dark" aria-pressed="${st.theme === 'dark'}">${svg('moon', 'icon')} Sombre</button>
           <button class="ripple" data-theme-opt="system" aria-pressed="${st.theme === 'system'}">${svg('globe', 'icon')} Système</button>
         </div>
         <div class="list-row" style="margin-top:12px"><span class="list-row__ico acc-purple">${svg('play', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Animations réduites</h3><p>Limiter les transitions et effets</p></span>${sw('animations', !st.animations)}</div>
       </div>

       <div class="sec"><div class="sec__h"><h2>Données et stockage</h2></div>
         <button class="list-row ripple" data-page="telechargements">
           <span class="list-row__ico acc-green">${svg('download', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Téléchargements</h3><p>${S.dl.filter(d => d.st === 'done').length} contenus hors-ligne · ${dlUsed()} Mo</p></span>${IC.chev}
         </button>
         <div class="list-row"><span class="list-row__ico acc-blue">${svg('download', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Wi-Fi uniquement</h3><p>Éviter la consommation de données mobiles</p></span>${sw('wifi', st.wifi)}</div>
         <button class="list-row ripple" data-act="sync">
           <span class="list-row__ico acc-blue">${svg('cloud', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Synchronisation serveur</h3><p>${(window.LHSYNC && window.LHSYNC.etat().resume) || 'Non disponible'}</p></span>${IC.chev}
         </button>
         <button class="list-row ripple" data-act="cache">
           <span class="list-row__ico acc-amber">${svg('refresh', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Vider le cache</h3><p>Libérer l'espace temporaire</p></span>${IC.chev}
         </button>
         <button class="list-row ripple" data-act="reset">
           <span class="list-row__ico acc-pink" style="background:var(--md-error-container);color:var(--md-on-error-container)">${svg('refresh', 'icon icon--20')}</span>
           <span class="list-row__main"><h3>Réinitialiser ma progression</h3><p>Leçons, quiz, badges et notes</p></span>${IC.chev}
         </button>
       </div>

       <div class="sec"><div class="sec__h"><h2>Session</h2></div>
         <button class="btn btn--danger btn--block ripple" data-act="logout">${svg('logout', 'icon icon--18')} Se déconnecter</button>
         <div class="card card--pad" style="margin-top:14px">
           <div class="kv"><span>Version</span><b>CosmétiLab 4.0.0</b></div>
           <div class="kv"><span>Thème</span><b>Material Design 3</b></div>
           <div class="kv"><span>Compte</span><b>${esc(S.profile.promo)}</b></div>
         </div>
       </div>`);
  },
  mount(el){
    el.addEventListener('click', e => {
      const sw = e.target.closest('[data-set]');
      if (sw){
        const k = sw.dataset.set;
        const on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        if (k === 'animations'){ S.settings.animations = !on; applySettings(); }
        else S.settings[k] = on;
        persist(); syncProfileSwitches();
        toast((on ? 'Activé : ' : 'Désactivé : ') + sw.closest('.list-row').querySelector('h3').textContent);
        return;
      }
      const t = e.target.closest('[data-theme-opt]');
      if (t){
        $$('[data-theme-opt]', el).forEach(x => x.setAttribute('aria-pressed', String(x === t)));
        S.settings.theme = t.dataset.themeOpt; persist(); applySettings(); syncProfileSwitches();
        toast('Thème : ' + t.textContent.trim());
      }
    });
  }
};
function syncProfileSwitches(){
  const map = {notif:'reminders', dark:null, dl:'wifi'};
  Object.keys(map).forEach(k => {
    const row = document.querySelector('[data-switch="' + k + '"] .switch');
    if (!row || !map[k]) return;
    row.setAttribute('aria-checked', String(!!S.settings[map[k]]));
  });
}
function applySettings(){
  const t = S.settings.theme;
  const dark = t === 'system'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : t === 'dark';
  if (typeof setTheme === 'function') setTheme(dark);
  document.documentElement.classList.toggle('reduce-motion', !S.settings.animations);
}

/* ------------------------------------------------------------
   14. ÉDITION DU PROFIL
   ------------------------------------------------------------ */
PAGES['profil-edit'] = {
  single: true,
  render(){
    const p = S.profile;
    return barPage('Modifier le profil', '',
      `<div style="display:grid;place-items:center;margin-bottom:18px">
         <span class="avatar-lg" id="editAv">${esc(initials(p.nom))}</span>
         <button class="text-btn ripple" data-act="avatar">${svg('edit', 'icon icon--18')} Changer l'avatar</button>
       </div>
       <div class="field"><input class="f-nom" id="fNom" placeholder=" " value="${esc(p.nom)}"><label for="fNom">Nom complet</label></div>
       <div class="field"><input class="f-mail" id="fMail" type="email" placeholder=" " value="${esc(p.email)}"><label for="fMail">Adresse e-mail</label></div>
       <div class="field"><input class="f-tel" id="fTel" type="tel" placeholder=" " value="${esc(p.tel)}"><label for="fTel">Téléphone</label></div>
       <div class="field"><input class="f-ville" id="fVille" placeholder=" " value="${esc(p.ville)}"><label for="fVille">Ville</label></div>
       <div class="field"><input class="f-promo" id="fPromo" placeholder=" " value="${esc(p.promo)}"><label for="fPromo">Promotion / filière</label></div>
       <div class="field field--area"><textarea class="f-bio" id="fBio" placeholder=" ">${esc(p.bio)}</textarea><label for="fBio">Bio</label></div>
       <p class="field__help">Ces informations apparaissent auprès de vos formateurs.</p>
       <button class="btn btn--filled btn--block ripple" data-act="saveProfile">${svg('check', 'icon icon--18')} Enregistrer les modifications</button>`);
  }
};
const initials = n => (n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
function applyProfileUI(){
  const p = S.profile || {};
  $$('.avatar').forEach(a => { a.textContent = initials(p.nom) || '·'; });
  const t = $('#topBar .top-bar__titles h1'); if (t) t.textContent = p.nom || 'Mon espace';
  const ph = $('#profileHead');
  if (ph){
    ph.querySelector('h2').textContent = p.nom || 'Mon espace';
    const sous = ph.querySelector('p');
    if (sous) sous.textContent = [p.email, p.promo].filter(Boolean).join(' · ') || 'Compte local';
  }
}

/* ------------------------------------------------------------
   14 bis. IDENTITÉ DU COMPTE (jamais celle d’un autre)
   ------------------------------------------------------------ */
function definirProfil(valeurs){
  const p = S.profile = S.profile || {};
  let change = false;
  Object.keys(valeurs).forEach(k => {
    if (valeurs[k] !== undefined && p[k] !== valeurs[k]){ p[k] = valeurs[k]; change = true; }
  });
  if (change){ persist(); applyProfileUI(); }
}
/* Réponse de /api/auth/me : la fiche du compte connecté fait foi */
function appliquerUtilisateur(u){
  if (!u) return;
  definirProfil({ nom:u.nom || '', email:u.email || '', tel:u.tel || '', ville:u.ville || '',
                  promo:u.promo || '', bio:u.bio || '' });
}
/* Au démarrage : le compte local (jeton conservé) donne tout de suite le bon
   nom, même hors connexion ; « explorer sans compte » affiche « Invité ». */
function appliquerIdentiteLocale(){
  const c = window.LHCOMPTE && window.LHCOMPTE.compte && window.LHCOMPTE.compte();
  if (!c) return;
  if (c.id === 'invite') definirProfil({ nom:'Invité', email:'', tel:'', ville:'', promo:'', bio:'' });
  else definirProfil({ nom:c.nom || '', email:c.email || '' });
}
/* Heures de formation : somme des durées des leçons terminées (hors-ligne) */
const dureeMin = t => {
  const m = /(\d+)\s*h(?:\s*(\d+))?/.exec(t || '');
  if (m) return Number(m[1]) * 60 + Number(m[2] || 0);
  const n = /(\d+)/.exec(t || '');
  return n ? Number(n[1]) : 0;
};
function heuresFormation(){
  let min = 0;
  COURS.forEach(c => (LESSONS[c.id] || []).forEach((l, i) => { if (S.lessons[c.id + ':' + i]) min += dureeMin(l.d); }));
  return Math.round(min / 6) / 10;
}
const heuresFmt = v => {
  const n = Math.round((v || 0) * 10) / 10;
  return (String(n).indexOf('.') > -1 ? String(n).replace('.', ',') : String(n)) + ' h';
};
/* Statistiques du compte (serveur) → tableau de bord */
async function rafraichirStats(){
  if (!window.LHSYNC || !LHSYNC.actif || !LHSYNC.actif()) return false;
  const r = await LHSYNC.req('GET', '/api/stats');
  if (r && r.data){ STATS = r.data; updateStats(); return true; }
  return false;
}

/* ------------------------------------------------------------
   15. CONNEXION / DÉCONNEXION
   ------------------------------------------------------------ */
function showLogin(silent){
  if (window.LHCOMPTE) return window.LHCOMPTE.ouvrirEntree(silent);
  toast('Module de comptes indisponible');
}
function doLogout(){
  if (window.LHCOMPTE) return window.LHCOMPTE.deconnecter();
  S.logged = false; persist(); showLogin(false);
}
/* ------------------------------------------------------------
   16. ACTIONS GLOBALES (data-act)
   ------------------------------------------------------------ */
const ACTIONS = {
  readAll(){ S.notifs.forEach(n => n.lu = 1); persist(); updateNotifBadge(); refreshPages(); toast('Toutes les notifications sont lues'); },
  clearRecent(){ S.recent = []; persist(); closeSheet(); refreshPages(); if (topPage() && topPage().id === 'recherche') topPage().def.mount(topPage().el, topPage().params); toast('Recherches récentes effacées'); },
  logout(){ doLogout(); },
  sync(){ if (window.LHSYNC) window.LHSYNC.ouvrirUI(); else toast('Synchronisation indisponible'); },
  saveProfile(){
    const el = $('.page[data-page="profil-edit"]');
    const v = sel => (el.querySelector(sel) || {}).value || '';
    const nom = v('.f-nom').trim(), mail = v('.f-mail').trim();
    if (nom.length < 3){ toast('Le nom doit contenir au moins 3 caractères'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){ toast('Adresse e-mail invalide'); return; }
    S.profile = {nom:nom, email:mail, tel:v('.f-tel').trim(), ville:v('.f-ville').trim(), promo:v('.f-promo').trim(), bio:v('.f-bio').trim()};
    persist(); applyProfileUI(); refreshPages();
    dialog({title:'Profil mis à jour', text:'Vos informations ont bien été enregistrées.', confirmLabel:'Fermer', cancel:false, ico:'check-circle'})
      .then(() => popPage());
  },
  avatar(){ toast('Sélecteur d\'avatar — fonctionnalité de démonstration'); },
  shareProfile(){
    const url = 'https://cosmetilab.bj/@' + S.profile.nom.toLowerCase().replace(/\s+/g, '');
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    toast('Lien de profil copié');
  },
  pwd(){
    dialog({title:'Modifier le mot de passe', text:'Un lien sécurisé vous sera envoyé par e-mail.', confirmLabel:'Envoyer', ico:'shield'})
      .then(ok => { if (ok) toast('E-mail de réinitialisation envoyé'); });
  },
  devices(){
    openSheet(`<h3 class="title-medium">Appareils connectés</h3>
      <div class="list-row" style="margin-top:10px"><span class="list-row__ico acc-green">${svg('shield', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>Ce téléphone</h3><p>Abomey-Calavi · actif maintenant</p></div><span class="pill pill--ok">Actuel</span></div>
      <div class="list-row"><span class="list-row__ico acc-blue">${svg('globe', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>Navigateur Chrome</h3><p>Cotonou · il y a 2 jours</p></div>
        <button class="text-btn ripple" data-act="revoke">Révoquer</button></div>`);
  },
  revoke(){ closeSheet(); toast('Appareil révoqué'); },
  closeSheet(){ closeSheet(); },
  cache(){
    dialog({title:'Vider le cache ?', text:'Les données temporaires (images, ressources préchargées) seront supprimées. Votre progression est conservée.', confirmLabel:'Vider', ico:'refresh'})
      .then(ok => { if (ok) toast('Cache vidé · 128 Mo libérés'); });
  },
  reset(){
    dialog({title:'Réinitialiser la progression ?', text:'Leçons, quiz, badges et notes seront remis à zéro. Cette action est définitive.', confirmLabel:'Réinitialiser', danger:true, ico:'refresh'})
      .then(ok => {
        if (!ok) return;
        S.lessons = {}; S.quiz = {}; S.favs = []; S.notes = {}; S.devoirs = {}; S.liked = {};
        S.dl = S.dl.filter(d => d.st !== 'done');
        S.disc = JSON.parse(JSON.stringify(DISC_SEED));
        Object.values(VIDEOS).forEach(v => { v.prog = 0; });
        VIDEOS.forEach(v => { if (vstate[v.yt]) { vstate[v.yt].prog = 0; vstate[v.yt].like = false; vstate[v.yt].save = false; } });
        store.set('videos', vstate);
        persist(); refreshUI(); refreshPages(); toast('Progression réinitialisée');
      });
  },
  ticket(){
    const t = $('.page[data-page="aide"] .ticket-txt');
    if (!t || t.value.trim().length < 10){ toast('Décrivez le problème en quelques mots (10 caractères min.)'); return; }
    const ref = 'LH-' + Math.floor(1000 + Math.random() * 8999);
    notification('systeme', 'Ticket support créé', ref + ' — notre équipe vous répond sous 2 h.', ['aide','']);
    t.value = '';
    dialog({title:'Ticket envoyé', text:'Référence ' + ref + '. Vous recevrez une réponse par e-mail.', confirmLabel:'Fermer', cancel:false, ico:'check-circle'});
  },
  contact(){
    dialog({title:'Support CosmétiLab', cancel:false, confirmLabel:'Fermer', title2:'', onOpen(box){
      box.querySelector('.dialog__card').insertAdjacentHTML('beforeend',
        `<p style="margin-top:8px" class="body-medium">Chat : disponible de 8 h à 20 h<br>E-mail : support@cosmetilab.bj<br>Tél : +229 21 00 00 00</p>`);
    }});
  },
  resume(){ pushPage('cours', {id:'c1'}); },
  join(e){ closeSheet(); toast('Ouverture de la salle de visioconférence…'); },
  addcal(){ closeSheet(); toast('Session ajoutée à votre agenda'); },
  contactProf(){ pushPage('cours', {id:'c2', tab:'discussion'}); }
};

/* ------------------------------------------------------------
   17. DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
   ------------------------------------------------------------ */
document.addEventListener('click', e => {
  if ($('#sheet').classList.contains('is-open') && e.target.closest('[data-page]:not(.page),[data-course]:not(.page),[data-session]:not(.page),[data-act]')) closeSheet();
  const syncBtn = e.target.closest('[data-sync]');
  if (syncBtn){
    const a = syncBtn.dataset.sync;
    if (a === 'close') closeSheet();
    else if (a === 'off'){ window.LHSYNC.deconnecter(); closeSheet(); toast('Déconnecté du serveur — progression locale conservée'); refreshUI(); }
    else if (a === 'now'){ window.LHSYNC.hydrater().then(() => { toast('Progression synchronisée'); refreshUI(); refreshPages(); }); }
    else if (a === 'on'){ window.LHSYNC.soumettre(); }
    return;
  }
  const back = e.target.closest('[data-back]');
  if (back){ popPage(); return; }
  const act = e.target.closest('[data-act]');
  if (act){
    const fn = ACTIONS[act.dataset.act];
    if (fn){ fn(act, e); return; }
    // action fournie par un autre module (LMS) : ne pas retomber sur data-page / data-course
    const ext = window.APPX && window.APPX.ACTIONS && window.APPX.ACTIONS[act.dataset.act];
    if (ext) return;
  }
  const go = e.target.closest('[data-page]:not(.page)');
  if (go){
    if (go.dataset.act) return;
    pushPage(go.dataset.page, {id:go.dataset.id || '', tab:go.dataset.tab || ''});
    return;
  }
  const sess = e.target.closest('[data-session]:not(.page)');
  if (sess){ openSession(sess.dataset.session); return; }
  const cour = e.target.closest('[data-course]:not(.page)');
  if (cour){ pushPage('cours', {id:cour.dataset.course}); return; }
  const rem = e.target.closest('[data-reminder] .switch');
  if (rem){
    const on = rem.getAttribute('aria-checked') !== 'true';
    rem.setAttribute('aria-checked', String(on));
    toast(on ? 'Rappel activé 15 min avant la session' : 'Rappel désactivé');
    return;
  }
  const cald = e.target.closest('[data-cal]');
  if (cald){
    const y = calRef.getFullYear(), m = calRef.getMonth();
    calSel = new Date(y, m, +cald.dataset.cal);
    renderMonth();
    return;
  }
  const calnav = e.target.closest('[data-calnav]');
  if (calnav){ calRef = new Date(calRef.getFullYear(), calRef.getMonth() + (+calnav.dataset.calnav), 1); renderMonth(); return; }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#dialog').classList.contains('is-open')){ $('#dialog').click(); return; }
  if ($('#loginScreen')) return;
  if (topPage()) popPage();
});

/* ------------------------------------------------------------
   18. MISE À JOUR DES PAGES D'ACCUEIL / PROFIL
   ------------------------------------------------------------ */
function updateStats(){
  const set = (id, v) => { const el = $('#' + id); if (el) el.textContent = v; };
  const lecons = leconsTotalesFaites();
  const serveur = STATS || {};
  const serie   = serveur.serie !== undefined ? serveur.serie : S.streak;
  const heures  = serveur.heures !== undefined ? serveur.heures : heuresFormation();
  const badges  = serveur.badges && serveur.badges.obtenus !== undefined ? serveur.badges.obtenus : BADGES_DEF.filter(badgeUnlocked).length;
  set('statSerie', serie + ' j');
  set('statHeures', heuresFmt(heures));
  set('statBadges', badges);
  set('statCours', coursSuivis());
  set('statHeures2', heuresFmt(heures));
  set('statBadges2', badges);
  /* objectif de la semaine : minutes réelles du compte (0 tant qu’on ne sait pas) */
  const sem = serveur.semaine;
  const gs = $('#goalSemaine');
  if (gs) gs.textContent = (sem ? heuresFmt(sem.heures) : '0 h') + ' sur ' + ((sem && sem.objectifH) || 8) + " h d'apprentissage";
  const pctSem = sem && sem.pourcent !== undefined ? sem.pourcent : 0;
  const ring = $('.ring__val');
  if (ring){
    const C = 2 * Math.PI * 42;
    ring.dataset.prog = pctSem;
    ring.style.strokeDasharray = C;
    ring.style.strokeDashoffset = C * (1 - pctSem / 100);
    const lbl = $('.ring-wrap__label strong'); if (lbl) lbl.textContent = pctSem + '%';
  }
  const gl = $('#goalText');
  if (gl) gl.textContent = (sem ? sem.lecons : lecons) + ' leçons terminées · objectif 30';
}
function updateHero(){
  const c = coursById('c1');
  const p = progCours('c1');
  const sub = $('#heroSub'), pct = $('#heroPct'), bar = $('#heroBar');
  const done = leconsFaites('c1');
  if (sub) sub.textContent = 'Leçon ' + (done + 1) + '/' + totalLecons('c1') + ' · ' + (LESSONS.c1[done] ? LESSONS.c1[done].t : 'Module terminé');
  if (pct) pct.textContent = p + ' %';
  if (bar){ bar.dataset.done = '1'; bar.style.width = p + '%'; }
}
function renderHomeCourses(){
  const box = $('#hscroll');
  if (!box) return;
  box.innerHTML = COURS.filter(c => c.statut === 'encours').map(hcardHTML).join('');
  hydrate(box); animateProgress(box);
}
function refreshUI(){
  renderHomeCourses();
  if (typeof renderCourses === 'function') renderCourses($('#courseFilters .chip.is-selected').dataset.filter, $('#searchInput').value);
  renderDevoirs(); renderHomeBadges(); updateStats(); updateHero(); updateNotifBadge();
  if (typeof renderVideoScroll === 'function') renderVideoScroll();
  refreshPages();
}

/* ------------------------------------------------------------
   19. SURCHARGES (les cartes renvoient vers les vraies pages)
   ------------------------------------------------------------ */
window.hcardHTML = function(c){
  const p = progCours(c.id), done = leconsFaites(c.id), tot = totalLecons(c.id);
  return `<article class="hcard ripple" data-course="${c.id}" role="button" tabindex="0">
    <div class="hcard__thumb thumb">
      <img data-img="${c.img}" alt="Visuel du cours ${esc(c.titre)}">
      <span class="thumb__shade"></span>
      <span class="hcard__cat">${esc(c.cat).toUpperCase()}</span>
      <span class="hcard__play">${svg('play', 'icon')}</span>
    </div>
    <div class="hcard__body">
      <h3>${esc(c.titre)}</h3>
      <div class="hcard__meta"><span>Leçon ${done}/${tot}</span><span class="prog-label">${p} %</span></div>
      <div class="lp lp--sm" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100">
        <div class="lp__track"></div><div class="lp__bar" data-prog="${p}"></div><div class="lp__stop"></div>
      </div>
    </div>
  </article>`;
};
window.courseRowHTML = function(c){
  const p = progCours(c.id), done = leconsFaites(c.id), tot = totalLecons(c.id);
  return `<button class="course-card ripple" data-course="${c.id}">
    <span class="course-card__thumb thumb"><img data-img="${c.img}" alt=""><span class="thumb__shade"></span></span>
    <span class="course-card__main">
      <h3>${esc(c.titre)}</h3>
      <p>${esc(c.prof)} · ${done}/${tot} leçons${isFav(c.id) ? ' · ★' : ''}</p>
      <span class="course-card__row">
        <span class="lp" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100">
          <span class="lp__track"></span><span class="lp__bar" data-prog="${p}"></span><span class="lp__stop"></span>
        </span>
        <b>${p} %</b>
      </span>
    </span>
    <span class="course-card__more">${svg('more', 'icon icon--18')}</span>
  </button>`;
};
window.deadlineHTML = devoirRowHTML;
window.vrowHTML = function(v){
  const c = coursById(v.cours) || {};
  const st = vstate[v.yt] || {save:false};
  const label = v.prog >= 100 ? 'Terminée' : v.prog > 0 ? 'Reprendre' : 'Lecture';
  return `<button class="vrow ripple" data-video="${v.yt}">
    <span class="vrow__thumb">
      <img data-img="${v.img}" alt="">
      <span class="vcard__dur">${fmtDur(v.duree)}</span>
      <span class="vcard__seen"><b data-prog="${v.prog}"></b></span>
    </span>
    <span class="vrow__main">
      <h3>${esc(v.titre)}</h3>
      <p>${svg('play', 'icon icon--16')}<b>${esc(v.chaine)} · ${fmtViews(v.vues)} vues</b>${st.save ? ' · ' + svg('bookmark', 'icon icon--16') : ''}</p>
      <p class="dim" style="margin-top:4px">${esc(c.titre || '')} · ${label}</p>
    </span>
    <span class="vrow__go">${IC.chev}</span>
  </button>`;
};

/* ------------------------------------------------------------
   20. DALLE : les interrupteurs du profil alimentent l'état
   ------------------------------------------------------------ */
document.querySelectorAll('[data-switch] .switch').forEach(sw => sw.addEventListener('click', () => {
  const k = sw.closest('[data-switch]').dataset.switch;
  const on = sw.getAttribute('aria-checked') === 'true';
  if (k === 'notif') S.settings.reminders = on;
  if (k === 'dl')    S.settings.wifi = on;
  if (k === 'dark')  { S.settings.theme = on ? 'dark' : 'light'; }
  persist(); refreshPages();
}));

/* ------------------------------------------------------------
   21. DÉMARRAGE
   ------------------------------------------------------------ */
applySettings();
applyProfileUI();
renderDevoirs(); renderHomeBadges(); updateStats(); updateHero(); updateNotifBadge(); renderHomeCourses();
renderSessions((today.getDay() + 6) % 7);
(function wireShell(){
  const hs = $('#homeSearch');
  if (hs){
    hs.addEventListener('click', () => pushPage('recherche', {}));
    hs.addEventListener('keydown', e => { if (e.key === 'Enter') pushPage('recherche', {}); });
  }
  const sheetEl = $('#sheet');
  const quickActions = sheetEl.innerHTML;              // contenu statique d'origine
  const fab = $('#fab');
  if (fab) fab.addEventListener('click', () => openSheet(quickActions));
  const av = $('#avatarBtn');                          // déjà branché par app.js
  ['#seeAllVideos'].forEach(sel => { const el = $(sel); if (el) el.addEventListener('click', () => setTimeout(() => pushPage('videos', {}), 60)); });
})();
if (typeof renderCourses === 'function') renderCourses();
(function initGoal(){
  const p = $('#weekDots');
  if (p && p.parentElement){
    p.insertAdjacentHTML('afterend', `<p class="body-small muted" id="goalText" style="margin-top:8px">${leconsTotalesFaites()} leçons terminées · objectif 30</p>`);
  }
})();
setTimeout(appliquerIdentiteLocale, 0);                 // le compte local donne le bon nom tout de suite
setTimeout(() => { if (!window.LHCOMPTE || !window.LHCOMPTE.compte()) showLogin(true); }, 400);

/* ------------------------------------------------------------
   Lien partagé : index.html#cours/c1, #videos, #devoir/d2, #quiz/c1…
   (sinon on arrive normalement sur l'accueil)
   ------------------------------------------------------------ */
setTimeout(() => { if (S.logged && !pageStack.length) openFromHash(); }, 500);

/* ------------------------------------------------------------
   21 bis. SYNCHRONISATION SERVEUR (voir LHSYNC plus bas)
   ------------------------------------------------------------ */

/* ============================================================
   SYNCHRONISATION AVEC L'API LEARNHUB (Next.js + Neon)
   L'application reste 100 % utilisable hors-ligne : quand un serveur est
   configuré, la progression, les quiz, les dépôts, les notes et les
   téléchargements sont synchronisés en arrière-plan.
   Configurer : #api=… / ?api=https://mon-api.vercel.app ou Paramètres → Synchronisation.
   Cas particulier : si le site est servi par l'API elle-même (même domaine), le
   serveur est détecté automatiquement — rien à configurer.
   ============================================================ */
window.LHSYNC = (function(){
  const CLE_API = 'lh_api', CLE_TOKEN = 'lh_token';
  const lire = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const ecrire = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };

  let base = lire(CLE_API).replace(/\/+$/, '');
  let token = lire(CLE_TOKEN);
  let utilisateur = null;
  let enLigne = null;          // null = inconnu, true/false = état constaté
  let timer = null;
  /* éléments déjà synchronisés : évite de renvoyer 25 leçons à chaque fois */
  let dejaEnvoyes = (() => { try { return JSON.parse(localStorage.getItem('lh_synced') || '{}'); } catch (e) { return {}; } })();
  const retenir = () => { try { localStorage.setItem('lh_synced', JSON.stringify(dejaEnvoyes)); } catch (e) {} };

  /* ---------- correspondance leçons locales → identifiants de l'API ---------- */
  const ID_LECON = {};
  (function(){
    Object.keys(PROGRAMMES).forEach(cid => {
      let k = 0;
      PROGRAMMES[cid].forEach((mod, mi) => mod.l.forEach((l, li) => {
        ID_LECON[cid + ':' + k] = cid + '-m' + (mi + 1) + '-l' + (li + 1);
        k++;
      }));
    });
  })();

  const actif = () => !!base && !!token;

  async function req(methode, chemin, corps){
    if (!base) return { statut:0, erreur:{ code:'non_configure' } };
    try {
      const r = await fetch(base + chemin, {
        method: methode,
        headers: Object.assign({ 'Content-Type':'application/json' }, token ? { Authorization:'Bearer ' + token } : {}),
        body: corps ? JSON.stringify(corps) : undefined
      });
      const j = await r.json().catch(() => null);
      enLigne = true;
      if (j && j.ok) return { statut:r.status, data:j.data };
      return { statut:r.status, erreur:(j && j.error) || { code:'erreur', message:'Réponse inattendue' } };
    } catch (e) {
      enLigne = false;                                  // pas de réseau : on garde tout en local
      return { statut:0, erreur:{ code:'hors_ligne', message:String(e && e.message || e) } };
    }
  }

  /* ---------- connexion / déconnexion ---------- */
  async function connecter(url, email, mdp){
    if (url !== undefined && url !== null){ base = String(url).replace(/\/+$/, ''); }
    if (!base) return { ok:false, message:'Indiquez l’adresse du serveur.' };
    const r = await req('POST', '/api/auth/login', { email:email, motDePasse:mdp });
    if (r.erreur) return { ok:false, message:(r.erreur.message || 'Connexion impossible'), code:r.erreur.code };
    token = r.data.token; utilisateur = r.data.user;
    ecrire(CLE_API, base); ecrire(CLE_TOKEN, token);
    dejaEnvoyes = {};                            // nouveau compte : on renvoie l'état complet une fois
    retenir();
    await hydrater();
    return { ok:true, user:utilisateur, serveur:base };
  }
  function deconnecter(){
    if (actif()) req('POST', '/api/auth/logout', {});
    token = ''; utilisateur = null; ecrire(CLE_TOKEN, '');
  }
  async function verifier(){
    if (!base) return { ok:false, code:'non_configure' };
    const r = await req('GET', '/api/auth/me');
    if (r.data){
      utilisateur = r.data.user;
      if (window.APPX && window.APPX.appliquerUtilisateur) window.APPX.appliquerUtilisateur(utilisateur);
      return { ok:true, user:utilisateur, settings:r.data.settings };
    }
    if (r.erreur && r.erreur.code === 'non_authentifie'){ token = ''; ecrire(CLE_TOKEN, ''); }
    return { ok:false, code:r.erreur && r.erreur.code };
  }

  /* ---------- rapatrier la progression du serveur vers l'appareil ---------- */
  async function hydrater(){
    if (!actif()) return false;
    const r = await req('GET', '/api/progress?format=app');
    if (!r.data) return false;
    /* leçons : cid:index → identifiant d'API ; on reconstruit la table locale */
    const inverse = {};
    Object.keys(ID_LECON).forEach(k => { inverse[ID_LECON[k]] = k; });
    Object.keys(r.data.lh_lessons || {}).forEach(idApi => {
      const cle = inverse[idApi];                 // « c1:3 »
      if (cle){ S.lessons[cle] = 1; dejaEnvoyes[idApi] = 1; }
    });
    retenir();
    Object.keys(r.data.lh_videos || {}).forEach(yt => {
      const v = r.data.lh_videos[yt];
      if (v.like || v.save) S.liked[yt] = true;
    });
    Object.keys(r.data.lh_quiz || {}).forEach(cid => {
      const q = r.data.lh_quiz[cid];
      S.quiz[cid] = { best:q.best, last:(S.quiz[cid] || {}).last || q.best, attempts:q.attempts };
    });
    /* favoris : pour un compte connecté, l’état du serveur fait foi */
    if (r.data.cours && r.data.cours.length){
      S.favs = r.data.cours.filter(c => c.favori).map(c => c.id);
    }
    persist();
    refreshUI();
    rafraichirStats();                       // série, heures, badges, objectif de la semaine
    return true;
  }

  /* ---------- pousser les changements locaux ---------- */
  async function pousser(){
    if (!actif() || enLigne === false) return { lecons:0 };
    /* leçons terminées : uniquement celles qui ne sont pas déjà sur le serveur, par paquets de 8 */
    const aEnvoyer = [];
    Object.keys(S.lessons).forEach(cle => {
      const id = ID_LECON[cle];
      if (S.lessons[cle] && id && !dejaEnvoyes[id]) aEnvoyer.push(id);
    });
    let envoyees = 0;
    for (let i = 0; i < aEnvoyer.length; i += 8){
      const lot = aEnvoyer.slice(i, i + 8);
      const reponses = await Promise.all(lot.map(id => req('POST', '/api/lessons/' + id + '/complete', { done:true, minutes:0 })));
      lot.forEach((id, k) => { if (!reponses[k].erreur){ dejaEnvoyes[id] = 1; envoyees++; } });
    }
    if (envoyees) retenir();
    /* vidéos aimées */
    const videos = Object.keys(S.liked || {}).filter(yt => S.liked[yt] && !dejaEnvoyes['v:' + yt]);
    await Promise.all(videos.map(yt => req('PATCH', '/api/videos/' + yt + '/progress', { liked:true })
      .then(r => { if (!r.erreur){ dejaEnvoyes['v:' + yt] = 1; } })));
    if (videos.length) retenir();
    return { lecons:envoyees, videos:videos.length };
  }
  function changed(){
    if (!actif()) return;
    clearTimeout(timer);
    timer = setTimeout(pousser, 1200);       // regroupé : une seule salve de requêtes
  }

  /* ---------- quiz : la correction reste faite côté serveur ---------- */
  function quiz(cid, reponses, dureeS){
    if (!actif()){
      /* correction locale (déjà affichée) ; on garde le résultat pour plus tard */
      return Promise.resolve(null);
    }
    const corpo = {
      dureeS: Math.max(0, Math.round(dureeS || 0)),
      reponses: reponses.map(r => ({ questionId:cid + '-q' + (r.i + 1), optionId:cid + '-q' + (r.i + 1) + '-o' + (r.choix + 1) })).filter(r => r.optionId)
    };
    return req('POST', '/api/quizzes/' + cid + '/attempts', corpo).then(r => {
      if (r.data){
        const n = r.data.tentative;
        toast('Résultat enregistré sur le serveur : ' + n.notePct + ' %');
      }
      return r.data;
    });
  }

  /* ---------- dépôts de devoirs ---------- */
  function rendre(devoirId, infos){
    if (!actif()) return Promise.resolve(null);
    return req('POST', '/api/assignments/' + devoirId + '/submissions', {
      commentaire:(infos && infos.commentaire) || '',
      fichierNom:(infos && infos.fichier) || '',
      fichierType:'',
      fichierTaille:(infos && infos.taille) || 0,
      fichierData:''
    });
  }
  function retirerRendu(devoirId){
    if (!actif()) return Promise.resolve(null);
    return req('GET', '/api/assignments/' + devoirId + '/submissions').then(r => {
      const d = r.data && r.data.depots && r.data.depots[0];
      return d ? req('DELETE', '/api/submissions/' + d.id) : null;
    });
  }

  /* ---------- note libre ---------- */
  function note(coursId, titre, contenu){
    if (!actif()) return Promise.resolve(null);
    return req('POST', '/api/notes', { courseId:coursId, titre:titre, contenu:contenu });
  }

  /* ---------- interface (feuille Paramètres → Synchronisation) ---------- */
  function etat(){
    return {
      configure: !!base, connecte: !!token, serveur: base, utilisateur: utilisateur,
      enLigne: enLigne, resume: !base ? 'Serveur non configuré'
        : (token ? ('Connecté' + (utilisateur ? ' — ' + utilisateur.email : '')) : 'Adresse enregistrée, non connecté')
    };
  }
  async function ouvrirUI(){
    const A = { openSheet: openSheet, pushPage: pushPage };
    const e = etat();
    const r = await verifier();
    const connu = r.ok ? r.user : utilisateur;
    const champs = e.connecte
      ? '<p class="body-medium" style="margin:8px 0 4px">Compte : <b>' + (connu ? connu.email : '—') + '</b></p>' +
        '<p class="body-medium" style="margin:0 0 12px">Serveur : <code>' + e.serveur + '</code></p>'
      : '<label class="field"><span class="field__label">Adresse du serveur</span>' +
        '<input class="field__input" id="syncUrl" type="url" inputmode="url" placeholder="https://mon-api.vercel.app" value="' + (e.serveur || '') + '"></label>' +
        '<label class="field"><span class="field__label">E-mail</span><input class="field__input" id="syncMail" type="email" placeholder="amina@cosmetilab.bj"></label>' +
        '<label class="field"><span class="field__label">Mot de passe</span><input class="field__input" id="syncPwd" type="password" placeholder="demo1234"></label>';
    openSheet(
      '<h3 class="title-medium">Synchronisation serveur</h3>' +
      '<p class="body-medium" style="color:var(--md-on-surface-variant);margin:6px 0 14px">' +
        (e.connecte ? 'Votre progression est sauvegardée sur Neon en plus de cet appareil.'
                    : 'Optionnel : reliez l’application à votre API Next.js + Neon pour retrouver votre progression sur tous vos appareils.') + '</p>' +
      champs +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">' +
        (e.connecte
          ? '<button class="btn btn--filled ripple" data-sync="now">Synchroniser maintenant</button>' +
            '<button class="btn btn--outlined ripple" data-sync="off">Se déconnecter du serveur</button>'
          : '<button class="btn btn--filled ripple" data-sync="on">Se connecter</button>' +
            '<button class="btn btn--tonal ripple" data-sync="close">Fermer</button>') +
      '</div>' +
      '<p class="body-small" style="color:var(--md-on-surface-variant);margin:12px 0 0">État : ' + e.resume +
        (e.enLigne === false ? ' · serveur injoignable pour le moment (mode hors-ligne)' : '') + '</p>');
  }
  async function soumettre(){
    const url = ($('#syncUrl') || {}).value || '';
    const mail = ($('#syncMail') || {}).value || '';
    const mdp = ($('#syncPwd') || {}).value || '';
    if (!mail || !mdp){ toast('Renseignez l’e-mail et le mot de passe'); return; }
    toast('Connexion au serveur…');
    const r = await connecter(url, mail, mdp);
    if (r.ok){
      closeSheet();
      toast('Synchronisé : ' + (r.user && r.user.nom ? r.user.nom : mail));
      refreshUI(); refreshPages();
    } else {
      toast(r.message || 'Connexion impossible');
    }
  }

  /* ---------- même domaine : le site est servi par l'API elle-même ----------
     Déploiement « tout sur une seule adresse » : l'application sur /, l'API sur /api/*.
     On interroge /api/health sur l'origine courante : si l'API répond, on l'adopte
     sans que l'utilisateur ait quoi que ce soit à configurer. Sur un hébergeur
     purement statique (Netlify, Pages…) la sonde échoue : on reste simplement
     en mode local, comme avant. */
  async function detecterMemeOrigine(){
    if (!/^https?:$/.test(location.protocol)) return false;      // file:// ou aperçu en iframe : rien à détecter
    const origine = location.origin.replace(/\/+$/, '');
    try {
      const ctl = new AbortController();
      const minuteur = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(origine + '/api/health', { signal:ctl.signal, cache:'no-store' });
      clearTimeout(minuteur);
      const j = await r.json().catch(() => null);
      if (j && j.ok){ base = origine; ecrire(CLE_API, base); return true; }
    } catch (e) {}
    return false;
  }

  /* ---------- amorçage : ?api=… dans l'adresse, puis vérification du jeton ---------- */
  async function amorcer(){
    try {
      const p = new URLSearchParams(location.search).get('api') || (location.hash.indexOf('#api=') === 0 ? location.hash.slice(5) : '');
      if (p){ base = decodeURIComponent(p).replace(/\/+$/, ''); ecrire(CLE_API, base); }
    } catch (e) {}
    if (!base) await detecterMemeOrigine();        // site + API sur la même adresse
    /* Jeton valide → on récupère la progression du serveur tout de suite :
       à l'ouverture, l'appareil affiche l'état réel du compte, pas un écran vide. */
    if (actif()){
      verifier().then(r => {
        if (!r.ok) return;
        hydrater().then(() => { if (window.APPX){ window.APPX.refreshUI(); window.APPX.refreshPages(); } });
      });
    }
  }

  return { actif, etat, connecter, deconnecter, verifier, hydrater, changed, pousser, quiz, rendre, retirerRendu, note, ouvrirUI, soumettre, amorcer, detecterMemeOrigine, req };
})();
window.LHSYNC = LHSYNC;
setTimeout(() => LHSYNC.amorcer(), 600);          // ?api=… puis vérification du jeton enregistré


/* ------------------------------------------------------------
   22. EXPOSITION (utilisée par les pages LMS)
   ------------------------------------------------------------ */
window.APPX = {
  svg: svg, IC: IC, PAGES: PAGES, pushPage: pushPage, popPage: popPage, topPage: topPage, openFromHash: openFromHash,
  dialog: dialog, openSheet: openSheet, closeSheet: closeSheet, barPage: barPage, emptyBox: emptyBox,
  S: S, persist: persist, refreshUI: refreshUI, refreshPages: refreshPages,
  LESSONS: LESSONS, PROGRAMMES: PROGRAMMES, QUIZZES: QUIZZES, DEVOIRS: DEVOIRS, RESSOURCES: RESSOURCES, SESS: SESS,
  totalLecons: totalLecons, leconsFaites: leconsFaites, progCours: progCours, isFav: isFav, toggleFav: toggleFav,
  devoirStatut: devoirStatut, devoirDate: devoirDate, fmtQuand: fmtQuand, devoirsOuverts: devoirsOuverts,
  badgeVal: badgeVal, badgeUnlocked: badgeUnlocked, BADGES_DEF: BADGES_DEF,
  notification: notification, addDownload: addDownload, openSession: openSession, renderMonth: renderMonth,
  renderSessions: renderSessions, renderTimeline: renderSessions, renderDevoirs: renderDevoirs,
  initials: initials, showLogin: showLogin, applySettings: applySettings, syncProfileSwitches: syncProfileSwitches,
  applyProfileUI: applyProfileUI, appliquerIdentiteLocale: appliquerIdentiteLocale,
  definirProfil: definirProfil, appliquerUtilisateur: appliquerUtilisateur,
  rafraichirStats: rafraichirStats, updateStats: updateStats, stats: () => STATS,
  conteneurDefilable: conteneurDefilable, defilerVers: defilerVers, remettreEnPlace: remettreEnPlace,
  openVideo: openVideo, vstate: vstate, store: store
};
})();
