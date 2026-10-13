/* ============================================================
   V3 — TÉLÉPHONE, RÉSEAU ET QUALITÉ
   ------------------------------------------------------------
   E1 économie de données · E2 hors-ligne réel · E3 application
   installable · E4 rappels locaux · E5 sauvegarde et restauration
   F2 accessibilité (taille du texte, animations) · F3 partage et
   aperçu des liens · F5 performance (images différées).
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte;

/* ------------------------------------------------------------
   E1 — ÉCONOMIE DE DONNÉES
   ------------------------------------------------------------ */
function eco(){
  const s = A.S.settings || {};
  return s.eco === true;
}
function ecoBasculer(on){
  A.S.settings.eco = !!on;
  A.persist();
  A.toast(on ? 'Économie de données activée' : 'Économie de données désactivée');
  appliquerEco();
}
function appliquerEco(){
  document.documentElement.dataset.eco = eco() ? '1' : '0';
  /* les vidéos sont déjà lues dans l'app : en économie de données on charge
     la qualité réduite et on interdit le préchargement */
  $$('iframe[data-yt]').forEach(f => {
    try {
      const u = new URL(f.src);
      if (eco()){ u.searchParams.set('vq', 'small'); } else { u.searchParams.delete('vq'); }
      if (f.src !== u.toString()) f.src = u.toString();
    } catch (e) { /* url non standard */ }
  });
  $$('img').forEach(i => { if (!i.getAttribute('loading')) i.setAttribute('loading', 'lazy'); i.setAttribute('decoding', 'async'); });
}
/* toutes les images différées : moins de données au premier écran (F5) */
function differe(){
  $$('img').forEach(i => {
    if (!i.getAttribute('loading')) i.setAttribute('loading', 'lazy');
    if (!i.getAttribute('decoding')) i.setAttribute('decoding', 'async');
  });
}

/* ------------------------------------------------------------
   E2 — HORS-LIGNE RÉEL
   ------------------------------------------------------------ */
const CLE_HL = 'hors_ligne';
async function horsLigneDonnees(){
  const d = await V3.donnees(CLE_HL, { cours: {} });
  if (!d.cours) d.cours = {};
  return d;
}
function tailleTexte(t){
  try { return (new Blob([t]).size / 1024).toFixed(0) + ' Ko'; } catch (e) { return Math.round(t.length / 1024) + ' Ko'; }
}
async function telechargerCours(cid){
  const d = await horsLigneDonnees();
  const c = A.coursById(cid) || {};
  const lecons = (A.PROGRAMMES && A.PROGRAMMES[cid]) ? A.PROGRAMMES[cid] : [];
  const quiz = (A.QUIZZES[cid] || { questions: [] }).questions || [];
  const paquet = {
    cours: cid, titre: c.titre || cid, quand: new Date().toISOString(),
    lecons: lecons.map(l => ({ id: l.id || '', titre: l.titre || l.t || '', duree: l.dureeLabel || l.duree || '', kind: l.kind || 'lecture' })),
    quiz: quiz.map(q => ({ q: q.q, o: q.o, a: q.a, e: q.e })),
    notes: (A.S.notes[cid] || null)
  };
  const t = JSON.stringify(paquet);
  d.cours[cid] = { titre: paquet.titre, quand: paquet.quand, taille: tailleTexte(t), paquet: paquet, lecons: paquet.lecons.length, questions: paquet.quiz.length };
  /* le paquet vit dans l'appareil (hors ligne) et la liste sur le compte */
  try { localStorage.setItem('lh_hl_' + cid, t); } catch (e) { /* quota */ }
  await V3.enregistrer(CLE_HL, { cours: Object.fromEntries(Object.entries(d.cours).map(([k, v]) => [k, { titre: v.titre, quand: v.quand, taille: v.taille, lecons: v.lecons, questions: v.questions }])) });
  return { taille: tailleTexte(t), lecons: paquet.lecons.length };
}
function paquetLocal(cid){
  try { return JSON.parse(localStorage.getItem('lh_hl_' + cid) || 'null'); } catch (e) { return null; }
}
async function horsLigneCharger(){
  const zone = document.getElementById('hlCorps');
  if (!zone) return;
  const d = await horsLigneDonnees();
  const ids = Object.keys(d.cours || {});
  const o = V3.cacheLocal.lire();
  const file = o.__file || [];
  const total = ids.reduce((s, k) => s + (parseFloat((d.cours[k].taille || '0')) || 0), 0);
  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('Cours téléchargés', `<p class="v3-big">${ids.length}</p><p class="body-small muted">≈ ${Math.round(total)} Ko sur l'appareil</p>`, { ico: 'download' })}
      ${carte('En attente d\'envoi', `<p class="v3-big">${file.length}</p><p class="body-small muted">donnée(s) à synchroniser</p>`, { ico: 'cloud' })}
    </div>
    ${carte('Application hors ligne', `
      <div class="v3-switchrow"><span>Économie de données (qualité réduite, images différées)</span>
        <button class="switch" role="switch" aria-checked="${eco() ? 'true' : 'false'}" aria-label="Mode éco (moins de données)" data-act="hlEco"></button></div>
      <p class="body-small muted" style="margin-top:8px">L'application elle-même est gardée en mémoire par le téléphone : elle s'ouvre même sans réseau. Les vidéos, elles, demandent une connexion.</p>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn--tonal ripple" data-act="hlSync">${svg('refresh', 'icon icon--18')} Synchroniser maintenant</button>
        <button class="btn btn--outlined ripple" data-act="hlVider">Vider les cours téléchargés</button>
      </div>`, { ico: 'cloud' })}
    ${carte('Télécharger un cours', `<div class="v3-liste">${A.COURS.map(c => {
      const t = d.cours[c.id];
      return `<div class="list-row">
        <span class="list-row__ico" style="background:var(--md-secondary-container)">${svg(c.ico, 'icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(c.titre)}</h3>
          <p>${t ? 'téléchargé ' + esc(V3.quand(t.quand)) + ' · ' + (t.lecons || 0) + ' leçon(s) · ' + esc(t.taille || '') : 'non téléchargé'}</p></span>
        <button class="btn btn--sm ${t ? 'btn--outlined' : 'btn--filled'} ripple" data-act="hlTelecharger" data-id="${esc(c.id)}">${t ? 'Actualiser' : 'Télécharger'}</button>
      </div>`;
    }).join('')}</div>`, { ico: 'download' })}
    ${V3.info('Un cours téléchargé garde ses leçons, son quiz et vos notes : vous pouvez réviser dans le car, à l\'atelier ou en zone blanche. Les actions faites hors ligne partent au serveur dès le retour du réseau.', 'info')}`;
}

/* ------------------------------------------------------------
   E3 — APPLICATION INSTALLABLE
   ------------------------------------------------------------ */
let installEvent = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; });
async function installer(){
  if (installEvent){
    installEvent.prompt();
    const r = await installEvent.userChoice;
    if (r && r.outcome === 'accepted') A.toast('Application installée 🎉');
    installEvent = null;
    return;
  }
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  A.dialog({
    title: 'Ajouter CosmétiLab à l\'écran d\'accueil',
    text: iOS
      ? 'Sur iPhone : bouton Partager, puis « Sur l\'écran d\'accueil ». L\'application s\'ouvrira en plein écran, avec son icône.'
      : 'Ouvrez le menu de votre navigateur (⋮) puis « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».',
    confirmLabel: 'Compris', cancel: false, ico: 'download'
  });
}

/* ------------------------------------------------------------
   E4 — RAPPELS LOCAUX
   ------------------------------------------------------------ */
async function rappel(titre, texte){
  try {
    if (!('Notification' in window)){ A.toast(titre); return false; }
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted'){ A.toast(titre + ' — ' + texte); return false; }
    new Notification(titre, { body: texte, icon: '/icone-192.png', badge: '/icone-192.png', tag: 'cosmetilab' });
    return true;
  } catch (e) { A.toast(titre); return false; }
}
/* rappels programmés : séances du jour + objectif du soir, tant que l'app est ouverte */
function rappelsProgrammer(){
  setInterval(async () => {
    if (document.hidden) return;
    const s = A.S.settings || {};
    if (!s.reminders) return;
    const cle = 'rappel_' + new Date().toISOString().slice(0, 13);
    const mem = await V3.donnees('rappels', { faits: [] });
    if ((mem.faits || []).includes(cle)) return;
    const h = new Date().getHours();
    /* une séance commence dans l'heure ? */
    const seances = A.SESS || [];
    const proche = seances.find(x => {
      const m = /(\d{1,2})\s*[h:]/.exec(x.heure || '');
      return m && +m[1] === h;
    });
    if (proche){
      rappel('Séance à ' + (proche.heure || '') , proche.titre || 'Votre séance commence bientôt');
    } else if (h >= 19){
      rappel('Un peu de révision ?', 'Quelques cartes suffisent à garder votre série.');
    } else return;
    mem.faits = (mem.faits || []).concat([cle]).slice(-40);
    await V3.enregistrer('rappels', mem);
  }, 15 * 60000);
}

/* ------------------------------------------------------------
   E5 — SAUVEGARDE ET RESTAURATION
   ------------------------------------------------------------ */
function pageSauvegarde(){
  return A.barPage('Sauvegarde', '', `<div id="svCorps"></div>`);
}
async function sauvegardeCharger(){
  const zone = document.getElementById('svCorps');
  if (!zone) return;
  const morceaux = [];
  Object.keys(localStorage).filter(k => k.indexOf('lh') === 0).forEach(k => {
    morceaux.push({ cle: k, valeur: localStorage.getItem(k) });
  });
  const poids = tailleTexte(JSON.stringify(morceaux));
  const donnees = await V3.donnees('hors_ligne', { cours: {} });
  const nbTelecharges = Object.keys(donnees.cours || {}).length;
  zone.innerHTML = `
    ${carte('Ce que contient ma sauvegarde', `
      <div class="v3-fiche">
        <div><span>Compte</span><b>${esc(V3.nomCompte())}</b></div>
        <div><span>Éléments locaux</span><b>${morceaux.length}</b></div>
        <div><span>Poids</span><b>${poids}</b></div>
        <div><span>Cours téléchargés</span><b>${nbTelecharges}</b></div>
      </div>
      <p class="body-small muted" style="margin-top:8px">La sauvegarde emporte vos données de cet appareil (préférences, notes locales, cours téléchargés) ; les données du compte restent sur le serveur et se retrouvent à la connexion.</p>`, { ico: 'cloud' })}
    ${carte('Exporter', `
      <button class="btn btn--filled btn--block ripple" data-act="svExport">${svg('upload', 'icon icon--18')} Télécharger la sauvegarde (.json)</button>
      <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-act="svCopier">${svg('share', 'icon icon--18')} Copier dans le presse-papiers</button>`, { ico: 'download' })}
    ${carte('Restaurer', `
      <label class="v3-champ"><span>Collez ici une sauvegarde</span><input id="svColle" placeholder='{"app":"cosmetilab",…}'></label>
      <button class="btn btn--outlined btn--block ripple" data-act="svImport">Restaurer</button>
      <p class="body-small muted" style="margin-top:8px">La restauration remplace les données locales de cet appareil. Vos données de compte ne sont jamais touchées.</p>`, { ico: 'refresh' })}`;
}
async function exporter(){
  const morceaux = {};
  Object.keys(localStorage).filter(k => k.indexOf('lh') === 0 || k === 'cosmetilab').forEach(k => { morceaux[k] = localStorage.getItem(k); });
  const paquet = { app: 'cosmetilab', version: 3, quand: new Date().toISOString(), compte: V3.nomCompte(), local: morceaux };
  const txt = JSON.stringify(paquet);
  try {
    const blob = new Blob([txt], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cosmetilab-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    A.toast('Sauvegarde téléchargée ✅');
  } catch (e) {
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(() => A.toast('Sauvegarde copiée'))
      .catch(() => A.dialog({ title: 'Sauvegarde', text: txt.slice(0, 400) + '…', confirmLabel: 'Fermer', cancel: false, ico: 'download' }));
  }
}
async function importer(txt){
  let p = null;
  try { p = JSON.parse(txt); } catch (e) { A.toast('Ce texte n\'est pas une sauvegarde'); return; }
  if (!p || p.app !== 'cosmetilab' || !p.local){ A.toast('Sauvegarde non reconnue'); return; }
  const ok = await A.dialog({ title: 'Restaurer cette sauvegarde ?', text: 'Sauvegarde du ' + V3.dateFr(p.quand) + ' (' + Object.keys(p.local).length + ' éléments). Les données locales actuelles seront remplacées.', confirmLabel: 'Restaurer', danger: true, ico: 'refresh' });
  if (!ok) return;
  Object.keys(p.local).forEach(k => { try { localStorage.setItem(k, p.local[k]); } catch (e) {} });
  A.toast('Sauvegarde restaurée — rechargement…');
  setTimeout(() => location.reload(), 900);
}

/* ------------------------------------------------------------
   F2 — ACCESSIBILITÉ
   ------------------------------------------------------------ */
const TAILLES = [['petit', 'Petit', '15px'], ['normal', 'Normal', '16px'], ['grand', 'Grand', '17.5px'], ['tresgrand', 'Très grand', '19px']];
function pageAccessibilite(){
  return A.barPage('Confort de lecture', '', `<div id="acCorps"></div>`);
}
function accessibiliteCharger(){
  const zone = document.getElementById('acCorps');
  if (!zone) return;
  const s = A.S.settings || {};
  const t = s.tailleTexte || 'normal';
  zone.innerHTML = `
    ${carte('Taille du texte', `
      <div class="v3-choix">${TAILLES.map(x => `<button class="v3-choix__b${t === x[0] ? ' is-active' : ''}" data-act="acTaille" data-taille="${x[0]}">${esc(x[1])}</button>`).join('')}</div>
      <p class="body-small muted" style="margin-top:10px">Toute l'application suit votre choix, immédiatement.</p>`, { ico: 'sliders' })}
    ${carte('Mouvement', `
      <div class="v3-switchrow"><span>Réduire les animations</span>
        <button class="switch" role="switch" aria-checked="${s.animations === false ? 'true' : 'false'}" aria-label="Réduire les animations" data-act="acAnim"></button></div>
      <p class="body-small muted" style="margin-top:8px">Utile si les transitions vous gênent, ou pour économiser la batterie.</p>`, { ico: 'sliders' })}
    ${carte('Lisibilité et commandes', `<ul class="v3-points v3-points--simples">
      <li>Boutons d'au moins 48 px de haut : utilisables avec des doigts sur un petit téléphone.</li>
      <li>Contrastes texte/fond vérifiés (ratio ≥ 4,5 pour le texte courant).</li>
      <li>Navigation complète au clavier : <b>Tab</b> pour circuler, <b>Entrée</b> pour ouvrir, contour violet visible sur l'élément actif.</li>
      <li>Chaque écran a un titre lisible par les lecteurs d'écran.</li>
      <li>Le bouton retour du téléphone fonctionne partout.</li>
    </ul>`, { ico: 'shield' })}
    ${V3.info('Un problème de lecture ? Signalez-le : c\'est corrigé en priorité.', 'info')}`;
}
function appliquerTaille(nom){
  const t = TAILLES.find(x => x[0] === nom) || TAILLES[1];
  document.documentElement.style.fontSize = t[2];
  A.S.settings.tailleTexte = t[0];
  A.persist();
}
function appliquerAnimations(){
  const off = (A.S.settings || {}).animations === false;
  document.documentElement.dataset.sansanim = off ? '1' : '0';
}

/* ------------------------------------------------------------
   ÉCRANS + SECTION « OPTIONS V3 » DANS PARAMÈTRES
   ------------------------------------------------------------ */
A.PAGES.sauvegarde = { single: true, render: pageSauvegarde, mount(){ sauvegardeCharger(); } };
A.PAGES.accessibilite = { single: true, render: pageAccessibilite, mount(){ accessibiliteCharger(); } };

/* la page hors-ligne d'origine gagne les fonctions V3 */
const hlRenderBase = A.PAGES['hors-ligne'].render;
A.PAGES['hors-ligne'] = {
  single: true,
  render(){
    return hlRenderBase.call(this) + '<div class="page__pad" id="hlExtra"><div id="hlCorps"><p class="body-small muted">Chargement…</p></div></div>';
  },
  mount(el){ horsLigneCharger(); }
};

/* les paramètres renvoient vers les nouveaux écrans (aucun doublon de réglage) */
const paramRenderBase = A.PAGES.parametres.render;
A.PAGES.parametres.render = function(params){
  const html = paramRenderBase.call(this, params);
  const bloc = `<div class="sec__h"><h2>Version 3</h2></div>
    <div class="v3-liste">
      ${[[ 'accessibilite', 'sliders', 'Confort de lecture', 'Taille du texte, animations, lisibilité'],
         [ 'hors-ligne', 'cloud', 'Hors ligne et données', 'Télécharger des cours, économiser la connexion'],
         [ 'sauvegarde', 'download', 'Sauvegarde', 'Exporter ou restaurer cet appareil'],
         [ 'etat', 'shield', 'État du service', 'Serveur, base, paiement, temps réel'],
         [ 'competences', 'trending', 'Mes compétences', 'Où j\'en suis, thème par thème'],
         [ 'production', 'layers', 'Carnet de production', 'Mes lots, ma traçabilité'],
         [ 'recettes', 'jar', 'Mes recettes', 'Tout ce que j\'ai calculé']]
        .map(x => `<a class="list-row ripple" href="/${x[0]}" data-page="${x[0]}">
          <span class="list-row__ico" style="background:var(--md-secondary-container);color:var(--md-on-secondary-container)">${svg(x[1], 'icon icon--20')}</span>
          <span class="list-row__main"><h3>${esc(x[2])}</h3><p>${esc(x[3])}</p></span>${svg('chevron', 'icon')}</a>`).join('')}
    </div>
    <button class="btn btn--tonal btn--block ripple" style="margin:14px 0 4px" data-act="qualiteInstaller">${svg('download', 'icon icon--18')} Ajouter à l'écran d'accueil</button>`;
  return html.replace('</div></div>', bloc + '</div></div>');
};

/* ------------------------------------------------------------
   CLICS
   ------------------------------------------------------------ */
document.addEventListener('click', async e => {
  const t = e.target;

  if (t.closest('[data-act="hlEco"]')){
    const b = t.closest('.switch');
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(on));
    ecoBasculer(on);
    return;
  }
  const tl = t.closest('[data-act="hlTelecharger"]');
  if (tl){
    tl.setAttribute('disabled', 'true');
    const r = await telechargerCours(tl.dataset.id);
    A.toast('Cours téléchargé : ' + r.lecons + ' leçon(s), ' + r.taille);
    horsLigneCharger();
    return;
  }
  if (t.closest('[data-act="hlSync"]')){
    const n = await V3.rejouerFile();
    A.toast(n ? n + ' donnée(s) envoyée(s)' : 'Rien à envoyer — tout est synchronisé');
    horsLigneCharger();
    return;
  }
  if (t.closest('[data-act="hlVider"]')){
    const ok = await A.dialog({ title: 'Vider les cours téléchargés ?', text: 'Les cours resteront consultables en ligne.', confirmLabel: 'Vider', danger: true, ico: 'help' });
    if (!ok) return;
    Object.keys(localStorage).filter(k => k.indexOf('lh_hl_') === 0).forEach(k => localStorage.removeItem(k));
    await V3.enregistrer(CLE_HL, { cours: {} });
    A.toast('Cours téléchargés supprimés');
    horsLigneCharger();
    return;
  }

  if (t.closest('[data-act="qualiteInstaller"]')){ installer(); return; }
  if (t.closest('[data-act="svExport"]')){ exporter(); return; }
  if (t.closest('[data-act="svCopier"]')){
    const morceaux = {};
    Object.keys(localStorage).filter(k => k.indexOf('lh') === 0).forEach(k => { morceaux[k] = localStorage.getItem(k); });
    const txt = JSON.stringify({ app: 'cosmetilab', version: 3, quand: new Date().toISOString(), compte: V3.nomCompte(), local: morceaux });
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(() => A.toast('Sauvegarde copiée ✅'))
      .catch(() => A.dialog({ title: 'Sauvegarde', text: 'Copie impossible sur ce navigateur : utilisez le téléchargement.', confirmLabel: 'Fermer', cancel: false, ico: 'info' }));
    return;
  }
  if (t.closest('[data-act="svImport"]')){ importer((document.getElementById('svColle') || {}).value || ''); return; }
  const ac = t.closest('[data-act="acTaille"]');
  if (ac){ appliquerTaille(ac.dataset.taille); accessibiliteCharger(); return; }
  if (t.closest('[data-act="acAnim"]')){
    const b = t.closest('.switch');
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(on));
    A.S.settings.animations = !on; A.persist(); appliquerAnimations();
    return;
  }
});

/* ------------------------------------------------------------
   AMORÇAGE
   ------------------------------------------------------------ */
function amorcer(){
  const s = A.S.settings || {};
  if (s.tailleTexte) appliquerTaille(s.tailleTexte);
  appliquerAnimations();
  if (typeof s.eco !== 'boolean'){ A.S.settings.eco = false; A.persist(); }
  appliquerEco();
  differe();
  rappelsProgrammer();
  /* service worker : application disponible hors ligne */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
    /* on vérifie d'abord que le fichier existe vraiment : sur un serveur qui ne
       sert pas sw.js (copie du fichier seul, test local), aucun bruit en console */
    fetch('/sw.js', { method: 'HEAD' })
      .then(r => { if (r.ok) return navigator.serviceWorker.register('/sw.js'); })
      .catch(() => undefined);
    window.addEventListener('online', () => { ecoBasculer(eco()); });
  }
  /* sauvegarde périodique des données hors ligne dans le compte */
  setInterval(() => { V3.rejouerFile().catch(() => undefined); }, 120000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', amorcer);
else setTimeout(amorcer, 900);

window.LHQUALITE = { rappel: rappel, installer: installer, eco: eco, appliquerTaille: appliquerTaille,
  telechargerCours: telechargerCours, paquetLocal: paquetLocal, exporter: exporter, importer: importer };
})();
