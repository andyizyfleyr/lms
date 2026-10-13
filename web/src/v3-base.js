/* ============================================================
   V3 — SOCLE : helpers, écrans publics, état du service,
   vérification d'attestations, partage.
   ------------------------------------------------------------
   Tous les écrans V3 s'appuient sur ces quelques fonctions :
   un appel API qui renvoie directement les données, un stockage
   « par compte » qui marche aussi en mode local, et des briques
   d'affichage Material 3 cohérentes avec le reste.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const svg = A.svg, esc = A.esc;

/* ------------------------------------------------------------
   1. API — une seule porte d'entrée, jamais d'erreur non gérée
   ------------------------------------------------------------ */
async function apiBrut(chemin, opts){
  const C = window.LHCOMPTE;
  if (!C || !C.api) return null;
  try { return await C.api(chemin, opts); } catch (e) { return null; }
}
async function api(chemin, opts){
  const r = await apiBrut(chemin, opts);
  if (!r) return { ok: false, hors: true, data: null };
  let j = null;
  try { j = await r.json(); } catch (e) { j = null; }
  const data = j && j.data !== undefined ? j.data : j;
  return { ok: r.ok && !!(j && j.ok !== false), statut: r.status, data: data, erreur: (j && j.error && j.error.message) || '' };
}
const lire = (chemin) => api(chemin);
const ecrire = (chemin, corps, methode) => api(chemin, { method: methode || 'POST', body: JSON.stringify(corps || {}) });

/* compte connecté au serveur ? (jeton présent) */
function connecte(){
  const C = window.LHCOMPTE;
  const c = C && C.compte ? C.compte() : null;
  return !!(c && c.token);
}
const nomCompte = () => { const c = window.LHCOMPTE.compte(); return (c && c.nom) || 'Invité'; };
const roleCompte = () => { const c = window.LHCOMPTE.compte(); return (c && c.role) || 'invite'; };
const estProf = () => { const r = roleCompte(); return r === 'enseignant' || r === 'admin'; };

/* ------------------------------------------------------------
   2. DONNÉES PAR COMPTE
   ------------------------------------------------------------
   Les mêmes données servent sur tous les appareils du compte
   (/api/mes-donnees). En mode local ou hors ligne, elles vivent
   dans l'appareil et partent au serveur au retour du réseau.
   ------------------------------------------------------------ */
const CLE_LOCALE = 'lh_v3';
const local = {
  lire(){
    try { return JSON.parse(localStorage.getItem(CLE_LOCALE) || '{}') || {}; } catch (e) { return {}; }
  },
  ecrire(o){ try { localStorage.setItem(CLE_LOCALE, JSON.stringify(o)); } catch (e) {} }
};
const cache = local.lire();
const enAttente = new Set();

async function donnees(cle, defaut){
  if (cache[cle] !== undefined) { if (connecte()) rafraichir(cle); return cache[cle]; }
  if (connecte()){
    const r = await lire('/api/mes-donnees/' + encodeURIComponent(cle));
    const v = r.ok && r.data ? r.data.valeur : null;
    cache[cle] = (v === null || v === undefined) ? (defaut === undefined ? {} : defaut) : v;
    local.ecrire(cache);
    return cache[cle];
  }
  cache[cle] = defaut === undefined ? {} : defaut;
  return cache[cle];
}
async function rafraichir(cle){
  const r = await lire('/api/mes-donnees/' + encodeURIComponent(cle));
  if (!r.ok || !r.data) return;
  const v = r.data.valeur;
  if (v !== null && v !== undefined){ cache[cle] = v; local.ecrire(cache); }
}
async function enregistrer(cle, valeur){
  cache[cle] = valeur;
  local.ecrire(cache);
  if (!connecte()) return { local: true };
  if (enAttente.has(cle)) return { enAttente: true };
  enAttente.add(cle);
  const r = await api('/api/mes-donnees/' + encodeURIComponent(cle), { method: 'PUT', body: JSON.stringify(valeur) });
  enAttente.delete(cle);
  if (!r.ok) fileAttente(cle, valeur);
  return r;
}
/* file d'attente hors ligne : rejouée au retour du réseau */
function fileAttente(cle, valeur){
  const f = local.lire().__file || [];
  f.push({ cle: cle, valeur: valeur, quand: Date.now() });
  const o = local.lire(); o.__file = f.slice(-60); local.ecrire(o);
}
async function rejouerFile(){
  const o = local.lire();
  const f = o.__file || [];
  if (!f.length || !connecte()) return 0;
  let faites = 0, reste = [];
  for (const item of f){
    const r = await api('/api/mes-donnees/' + encodeURIComponent(item.cle), { method: 'PUT', body: JSON.stringify(item.valeur) });
    if (r.ok) faites++; else reste.push(item);
  }
  o.__file = reste; local.ecrire(o);
  return faites;
}
window.addEventListener('online', () => { rejouerFile().then(n => { if (n) A.toast(n + ' donnée(s) synchronisée(s)'); }); });

/* ------------------------------------------------------------
   3. BRIQUES D'AFFICHAGE
   ------------------------------------------------------------ */
const fcfa = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' F';
const pct = n => Math.round(n || 0) + ' %';
const dateFr = d => {
  if (!d) return '—';
  const x = new Date(d);
  if (isNaN(x)) return '—';
  return x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};
const quand = d => {
  if (!d) return '—';
  const x = new Date(d), j = Math.floor((Date.now() - x.getTime()) / 86400000);
  if (j <= 0) return 'aujourd\'hui';
  if (j === 1) return 'hier';
  if (j < 30) return 'il y a ' + j + ' jours';
  return dateFr(d);
};
const carte = (titre, corps, opts) => {
  opts = opts || {};
  return `<section class="card card--pad v3-card"${opts.id ? ' id="' + opts.id + '"' : ''}>
    ${titre ? `<div class="v3-card__h">${opts.ico ? svg(opts.ico, 'icon icon--20') : ''}<h2 class="title-small">${esc(titre)}</h2>${opts.droite || ''}</div>` : ''}
    <div class="v3-card__b">${corps}</div>
    ${opts.pied || ''}
  </section>`;
};
const ligneListe = (titre, sous, ico, attrs) => `<button class="list-row ripple" ${attrs || ''}>
    <span class="list-row__ico" style="background:var(--md-secondary-container);color:var(--md-on-secondary-container)">${svg(ico || 'school', 'icon icon--20')}</span>
    <span class="list-row__main"><h3>${esc(titre)}</h3><p>${esc(sous || '')}</p></span>
    ${svg('chevron', 'icon')}
  </button>`;
const anneau = (valeur, taille, libelle) => {
  const C = 2 * Math.PI * 42, v = Math.max(0, Math.min(100, valeur || 0));
  const S = taille || 120;
  return `<div class="ring-wrap" style="width:${S}px;height:${S}px">
    <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="ring__track" cx="50" cy="50" r="42"/>
      <circle class="ring__val" cx="50" cy="50" r="42" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-prog="${v}"/>
    </svg>
    <span class="ring-wrap__label"><strong>${libelle || pct(v)}</strong></span>
  </div>`;
};
const vide = (ico, titre, txt) => A.emptyBox(ico || 'help', titre, txt || '');
const info = (texte, ico) => `<div class="note" style="margin:10px 0">${svg(ico || 'info', 'icon')}<span>${texte}</span></div>`;
const badge = (texte, ton) => `<span class="pill pill--${ton || 'normal'}">${esc(texte)}</span>`;

/* partage : feuille système si disponible, sinon copie du lien */
async function partager(titre, texte, url){
  const lien = url || (location.origin + A.adresse());
  try {
    if (navigator.share){ await navigator.share({ title: titre, text: texte, url: lien }); return 'partage'; }
  } catch (e) { /* annulé */ }
  try { await navigator.clipboard.writeText(lien); A.toast('Lien copié : ' + lien); return 'copie'; }
  catch (e) { A.dialog({ title: 'Partager', text: lien, confirmLabel: 'Fermer', cancel: false, ico: 'share' }); return 'boite'; }
}

/* ------------------------------------------------------------
   4. PAGE « VÉRIFIER UNE ATTESTATION » (publique)
   ------------------------------------------------------------ */
function pageVerifier(params){
  const num = (params && (params.numero || params.code)) || '';
  const corps = `
    <p class="body-medium muted" style="margin:2px 0 14px">Un employeur, un client, un partenaire : n'importe qui peut vérifier
      qu'une attestation CosmétiLab est authentique, sans créer de compte.</p>
    <div class="field"><input id="vfNum" type="text" placeholder=" " value="${esc(num)}" autocomplete="off" spellcheck="false"><label for="vfNum">Numéro de l'attestation (CL-C1-XXXX)</label></div>
    <button class="btn btn--filled btn--block ripple" id="vfGo">${svg('shield', 'icon icon--20')} Vérifier</button>
    <div id="vfRes" style="margin-top:16px"></div>
    ${info('Le numéro est imprimé sur l\'attestation, en bas à droite. Il ne dépend que du compte et du cours : il ne peut pas être inventé.', 'lock')}`;
  return A.barPage('Vérifier une attestation', '<button class="text-btn ripple" data-nav="accueil">Fermer</button>', corps);
}
async function verifierLancer(numero){
  const zone = document.getElementById('vfRes');
  if (!zone) return;
  const n = String(numero || '').trim();
  if (!n){ zone.innerHTML = info('Saisissez un numéro pour lancer la vérification.', 'info'); return; }
  zone.innerHTML = `<p class="body-small muted">Vérification de <b>${esc(n)}</b>…</p>`;
  const r = await lire('/api/verifier/' + encodeURIComponent(n));
  const d = r.ok ? r.data : null;
  if (!d || d.valide !== true){
    zone.innerHTML = `<div class="card card--pad" style="border-color:var(--md-error)">
      <h3 class="title-small" style="color:var(--md-error)">${svg('close', 'icon icon--20')} Attestation non valide</h3>
      <p class="body-small" style="margin-top:8px">${esc((d && d.raison) || 'Numéro introuvable. Vérifiez la saisie (majuscules et tirets compris).')}</p></div>`;
    return;
  }
  zone.innerHTML = `<div class="card card--pad" style="border-color:var(--md-success)">
    <h3 class="title-small" style="color:var(--md-success)">${svg('check-circle', 'icon icon--20')} Attestation authentique</h3>
    <div class="v3-fiche" style="margin-top:10px">
      <div><span>Apprenant</span><b>${esc(d.apprenant)}</b></div>
      <div><span>Cours</span><b>${esc(d.cours.titre)}</b></div>
      <div><span>Formateur</span><b>${esc(d.cours.formateur)}</b></div>
      <div><span>Terminé le</span><b>${esc(dateFr(d.termineLe))}</b></div>
      <div><span>Leçons</span><b>${d.lecons.faites} / ${d.lecons.total}</b></div>
      <div><span>Numéro</span><b>${esc(d.numero)}</b></div>
    </div>
    <p class="body-small muted" style="margin-top:10px">Vérifié le ${esc(quand(d.verifieLe))} — CosmétiLab</p>
  </div>`;
}

/* ------------------------------------------------------------
   5. PAGE « ÉTAT DU SERVICE »
   ------------------------------------------------------------ */
function pageEtat(){
  const corps = `
    <div id="etatCorps"><p class="body-small muted">Interrogation du serveur…</p></div>
    ${info('Cet écran ne montre aucune donnée personnelle : seulement l\'état du service.', 'shield')}`;
  return A.barPage('État du service', `<button class="text-btn ripple" data-act="etatMaj">Rafraîchir</button>`, corps);
}
async function etatCharger(){
  const zone = document.getElementById('etatCorps');
  if (!zone) return;
  const t0 = performance.now();
  const r = await lire('/api/etat');
  const ms = Math.round(performance.now() - t0);
  const d = r.ok ? r.data : null;
  const direct = (window.LHCOMPTE && window.LHCOMPTE.resumeDirect) ? window.LHCOMPTE.resumeDirect() : 'inconnu';
  const lignes = [
    ['Application', 'CosmétiLab v' + ((d && d.version) || '3.0') + ' · un seul fichier, aucune dépendance'],
    ['Serveur', d ? 'joignable (' + ms + ' ms)' : 'injoignable — mode local'],
    ['Base de données', d && d.base ? d.base.tables + ' tables · latence ' + d.base.latenceMs + ' ms' : 'non jointe'],
    ['Paiement', d && d.paiement ? d.paiement.fournisseur + ' · ' + d.paiement.devise + ' · ' + d.paiement.plans + ' formules' : 'inconnu'],
    ['Temps réel', direct],
    ['Compte', connecte() ? 'connecté — ' + nomCompte() : 'invité (données sur cet appareil)'],
    ['Hors ligne', navigator.onLine ? 'réseau disponible' : 'hors ligne — ' + (local.lire().__file || []).length + ' donnée(s) en attente'],
    ['Adresse', location.origin + A.adresse()]
  ];
  zone.innerHTML = `<div class="card card--pad"><div class="v3-fiche">
    ${lignes.map(l => `<div><span>${esc(l[0])}</span><b>${esc(l[1])}</b></div>`).join('')}
  </div></div>
  <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
    <button class="btn btn--tonal ripple" data-act="etatCopier">${svg('share', 'icon icon--18')} Copier l'état</button>
    <button class="btn btn--outlined ripple" data-page="aide">${svg('help', 'icon icon--18')} Aide</button>
  </div>`;
}

/* ------------------------------------------------------------
   6. ENREGISTREMENT DES ÉCRANS
   ------------------------------------------------------------ */
A.PAGES.verifier = { single: true, render: pageVerifier, async mount(){
  const go = () => verifierLancer($('#vfNum') ? $('#vfNum').value : '');
  const b = $('#vfGo'); if (b) b.onclick = go;
  const i = $('#vfNum');
  if (i){
    i.onkeydown = e => { if (e.key === 'Enter') go(); };
    const num = (A.topPage() && A.topPage().params && A.topPage().params.numero) || '';
    if (num) verifierLancer(num); else setTimeout(() => i.focus(), 260);
  }
} };
A.PAGES.etat = { single: true, render: pageEtat, mount(){ etatCharger(); } };

document.addEventListener('click', e => {
  if (e.target.closest('[data-act="etatMaj"]')){ etatCharger(); return; }
  const cp = e.target.closest('[data-act="etatCopier"]');
  if (cp){
    const lignes = [...document.querySelectorAll('#etatCorps .v3-fiche div')].map(d => d.textContent.trim());
    const texte = 'CosmétiLab — état du service\n' + lignes.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(texte) : Promise.reject())
      .then(() => A.toast('État copié'))
      .catch(() => A.dialog({ title: 'État du service', text: texte, confirmLabel: 'Fermer', cancel: false, ico: 'info' }));
  }
});

window.LHV3 = {
  api: api, apiBrut: apiBrut, lire: lire, ecrire: ecrire, connecte: connecte, estProf: estProf,
  nomCompte: nomCompte, roleCompte: roleCompte, donnees: donnees, enregistrer: enregistrer,
  rejouerFile: rejouerFile, fileAttente: fileAttente, cacheLocal: local,
  svg: svg, esc: esc, fcfa: fcfa, pct: pct, dateFr: dateFr, quand: quand, carte: carte,
  ligneListe: ligneListe, anneau: anneau, vide: vide, info: info, badge: badge, partager: partager,
  verifierLancer: verifierLancer
};
})();
