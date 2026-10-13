/* ============================================================
   V4 — BOUTIQUE DES LIVRES PDF
   ------------------------------------------------------------
   Une page de vente pour les PDF de cours : catalogue, fiche
   détaillée avec sommaire et extrait, panier (remise dès deux
   ouvrages, code promo), paiement NOVA, puis bibliothèque
   personnelle : lire dans le navigateur, télécharger, et garder
   une trace des achats.

   Règle tenue : le prix et le montant viennent du serveur, jamais
   du navigateur ; l'ouverture du fichier passe par un lien signé
   valable 30 minutes.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte;
const fcfa = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' F CFA';

/* état local de l'écran : il survit aux changements de page */
const BOUTIQUE = { choix: {}, code: '', ouvrages: [], acces: [], charge: false, remise: 10 };

/* ------------------------------------------------------------ catalogue */
function pageBoutique(){
  return A.barPage('Boutique des livres PDF', '',
    `<div id="bvCorps"><p class="body-small muted">Chargement de la boutique…</p></div>`);
}
async function boutiqueCharger(){
  const zone = document.getElementById('bvCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-pdf');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){
    zone.innerHTML = carte('Boutique indisponible',
      `<p class="body-medium">Impossible de joindre la boutique pour le moment.</p>
       <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-act="bvRecharger">${svg('refresh','icon icon--18')} Réessayer</button>`,
      { ico: 'cloud' });
    return;
  }
  BOUTIQUE.ouvrages = d.ouvrages || [];
  BOUTIQUE.acces = d.acces || [];
  BOUTIQUE.charge = true;
  peindreBoutique();
}

function carteOuvrage(o){
  const possede = BOUTIQUE.acces.indexOf(o.id) >= 0;
  const coche = !!BOUTIQUE.choix[o.id];
  return `
    <div class="v4-livre${possede ? ' v4-livre--a-moi' : ''}">
      <a class="v4-livre__tete" href="/boutique/${esc(o.id)}" data-lien>
        <span class="v4-couv" data-accent="${esc(o.accent)}">
          ${svg(o.ico || 'book', 'icon icon--24')}
          <b>${esc(o.titre)}</b>
          <i>${esc(o.niveau || '')}</i>
        </span>
        <span class="v4-livre__txt">
          <h3>${esc(o.titre)}</h3>
          <p class="body-small muted">${esc(o.sousTitre || '')}</p>
          <p class="body-small">${o.pages} pages · PDF · ${o.gratuit ? 'gratuit' : fcfa(o.prix)}</p>
          ${possede ? `<span class="pill pill--ok">dans ma bibliothèque</span>` : ''}
        </span>
      </a>
      <div class="v4-livre__pied">
        ${possede
          ? `<button class="btn btn--tonal btn--sm ripple" data-act="bvLire" data-id="${esc(o.id)}">${svg('book','icon icon--18')} Lire</button>
             <button class="btn btn--outlined btn--sm ripple" data-act="bvTelecharger" data-id="${esc(o.id)}">${svg('download','icon icon--18')} Télécharger</button>`
          : `<label class="v4-coche"><input type="checkbox" data-bvchoix="${esc(o.id)}" ${coche ? 'checked' : ''}> Ajouter au panier</label>
             <button class="btn btn--filled btn--sm ripple" data-act="bvAcheter" data-id="${esc(o.id)}">${svg('card','icon icon--18')} Acheter</button>`}
      </div>
    </div>`;
}

function panierBoutique(){
  const ids = Object.keys(BOUTIQUE.choix).filter(k => BOUTIQUE.choix[k]);
  const choisis = BOUTIQUE.ouvrages.filter(o => ids.indexOf(o.id) >= 0);
  if (!choisis.length) return '';
  const brut = choisis.reduce((n, o) => n + o.prix, 0);
  const remise = choisis.length > 1 ? Math.round(brut * 0.1) : 0;
  return carte('Mon panier (' + choisis.length + ')', `
    <div class="v3-liste">${choisis.map(o => `
      <div class="list-row">
        <span class="list-row__ico">${svg(o.ico || 'book', 'icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(o.titre)}</h3><p>${o.pages} pages · PDF</p></span>
        <b>${fcfa(o.prix)}</b>
      </div>`).join('')}</div>
    <div class="v3-tr v3-tr--total"><span>Sous-total</span><b>${fcfa(brut)}</b></div>
    ${remise ? `<div class="v3-tr"><span>Remise dès deux ouvrages (−10 %)</span><b>− ${fcfa(remise)}</b></div>` : ''}
    <label class="v3-champ" style="margin-top:10px"><span>Code promo (facultatif)</span>
      <input id="bvCode" placeholder="EX: LANCEMENT20" value="${esc(BOUTIQUE.code)}"></label>
    <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="bvPayer">
      ${svg('card','icon icon--18')} Payer ${fcfa(brut - remise)}</button>
    <p class="body-small muted" style="margin-top:8px">Paiement sécurisé par NOVA Checkout. Le montant exact est calculé par le serveur ; vos livres restent à vie dans votre bibliothèque.</p>`, { ico: 'card' });
}

function peindreBoutique(){
  const zone = document.getElementById('bvCorps');
  if (!zone) return;
  const payants = BOUTIQUE.ouvrages.filter(o => BOUTIQUE.acces.indexOf(o.id) < 0);
  const miens = BOUTIQUE.ouvrages.filter(o => BOUTIQUE.acces.indexOf(o.id) >= 0);
  zone.innerHTML = `
    ${carte('Des livres, pas des captures d\'écran', `
      <p class="body-medium">Chaque ouvrage reprend un cours complet : le programme, les chapitres écrits,
      les questions du cours avec leurs corrections, les recettes de base, le tableau des huiles et les fiches à imprimer.</p>
      <div class="v3-grille v3-grille--2" style="margin-top:10px">
        <div class="v4-kpi"><b>${BOUTIQUE.ouvrages.length}</b><span>ouvrages</span></div>
        <div class="v4-kpi"><b>${miens.length}</b><span>dans ma bibliothèque</span></div>
      </div>
      <p class="body-small muted" style="margin-top:8px">PDF lisible sur téléphone, imprimable, sans connexion une fois téléchargé.
      Deux ouvrages ou plus : −10 % automatiquement.</p>`, { ico: 'book' })}
    ${marqueBibliotheque(miens)}
    ${payants.length ? carte('À découvrir', `<div class="v4-livres">${payants.map(carteOuvrage).join('')}</div>`, { ico: 'grid' })
      : ''}
    ${payants.length ? panierBoutique() : ''}
    ${miens.length ? carte('Déjà à moi', `<div class="v4-livres">${miens.map(carteOuvrage).join('')}</div>`, { ico: 'check-circle' }) : ''}
    <p class="body-small muted" style="margin-top:12px">Un formateur ? Vos propres cours peuvent devenir des ouvrages :
    <a class="texte-lien" href="/formateur/publier" data-lien>publier mon cours en PDF</a>.</p>`;
}

const marqueBibliotheque = miens => miens.length
  ? `<p class="body-small muted" style="margin:8px 0 0">${miens.length} ouvrage(s) déjà débloqué(s) sur ce compte — lisez-les depuis
     <a class="texte-lien" href="/biblio" data-lien>ma bibliothèque</a>.</p>`
  : '';

/* ------------------------------------------------------------ bibliothèque */
function pageBiblio(){
  return A.barPage('Ma bibliothèque', '', `<div id="bibCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function biblioCharger(){
  const zone = document.getElementById('bibCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-pdf');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Bibliothèque indisponible', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  BOUTIQUE.ouvrages = d.ouvrages || [];
  BOUTIQUE.acces = d.acces || [];
  const miens = BOUTIQUE.ouvrages.filter(o => BOUTIQUE.acces.indexOf(o.id) >= 0);
  zone.innerHTML = miens.length
    ? `<div class="v4-livres">${miens.map(carteOuvrage).join('')}</div>
       <p class="body-small muted" style="margin-top:12px">Ces fichiers restent accessibles tant que vous avez votre compte.
       Vous pouvez les télécharger pour les lire hors connexion dans n'importe quelle liseuse PDF.</p>`
    : carte('Votre bibliothèque est vide', `
        <p class="body-medium">Aucun ouvrage pour l'instant. La boutique propose les cours du site en PDF,
        avec les fiches à imprimer.</p>
        <a class="btn btn--filled btn--block ripple" style="margin-top:10px" href="/boutique" data-lien>
          ${svg('book','icon icon--18')} Voir la boutique</a>`, { ico: 'book' });
}

/* ------------------------------------------------------------ fiche d'un ouvrage */
function pageBoutiqueDetail(params){
  return A.barPage('Ouvrage', '', `<div id="bv1Corps"><p class="body-small muted">Chargement…</p></div>`);
}
async function boutiqueDetail(params){
  const zone = document.getElementById('bv1Corps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez un ouvrage', '<p class="body-medium">Cet écran s\'ouvre depuis la boutique.</p>', { ico: 'book' }); return; }
  const r = await V3.lire('/api/p4-pdf/' + encodeURIComponent(id));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Ouvrage introuvable', '<p class="body-medium">Il a peut-être été retiré de la boutique.</p>', { ico: 'help' });
    return;
  }
  const o = r.data.ouvrage, possede = r.data.possede, cours = r.data.cours;
  A.titreOnglet && A.titreOnglet(o.titre);
  zone.innerHTML = `
    ${carte('', `
      <div class="v4-fiche">
        <span class="v4-couv v4-couv--grand" data-accent="${esc(o.accent)}">
          ${svg(o.ico || 'book','icon icon--24')}<b>${esc(o.titre)}</b><i>${esc(o.niveau || '')}</i></span>
        <div>
          <h2 class="titre-page">${esc(o.titre)}</h2>
          <p class="body-medium muted">${esc(o.sousTitre || '')}</p>
          <p class="body-small">${o.pages} pages · PDF · ${o.genre === 'recueil' ? 'recueil' : o.genre === 'guide' ? 'guide' : 'cours'}</p>
          <p class="v3-big">${o.gratuit ? 'Gratuit' : fcfa(o.prix)}</p>
          ${possede
            ? `<button class="btn btn--filled btn--block ripple" data-act="bvLire" data-id="${esc(o.id)}">${svg('book','icon icon--18')} Lire maintenant</button>
               <button class="btn btn--outlined btn--block ripple" style="margin-top:8px" data-act="bvTelecharger" data-id="${esc(o.id)}">${svg('download','icon icon--18')} Télécharger le PDF</button>`
            : `<button class="btn btn--filled btn--block ripple" data-act="bvAcheter" data-id="${esc(o.id)}">${svg('card','icon icon--18')} Acheter — ${fcfa(o.prix)}</button>
               <p class="body-small muted" style="margin-top:8px">Paiement NOVA (solde, carte ou code). Accès définitif, dans votre bibliothèque.</p>`}
        </div>
      </div>`, { ico: 'book' })}
    ${carte('Ce que contient le livre', `<p class="body-medium">${esc(o.description)}</p>`, { ico: 'layers' })}
    ${(o.sommaire && o.sommaire.length) ? carte('Sommaire', `
      <ol class="v4-sommaire">${o.sommaire.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`, { ico: 'task' }) : ''}
    ${cours ? carte('Cours associé', `
      <div class="list-row">
        <span class="list-row__ico">${svg('school','icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(cours.titre)}</h3><p>${esc(cours.prof)}</p></span>
        <a class="btn btn--tonal btn--sm ripple" href="/cours/${esc(cours.id)}" data-lien>Voir le cours</a>
      </div>
      <p class="body-small muted" style="margin-top:8px">Le livre reprend ce cours et y ajoute les fiches à imprimer.
      Acheter le cours donne accès aux vidéos, aux quiz et au suivi ; le livre reste le support papier.</p>`, { ico: 'school' }) : ''}
    <p class="body-small muted" style="margin-top:12px">Besoin d'un autre ouvrage ?
      <a class="texte-lien" href="/boutique" data-lien>boutique des livres PDF</a></p>`;
}

/* ------------------------------------------------------------ lecture et téléchargement */
async function ouvrirLivre(id, telecharger){
  const r = await V3.ecrire('/api/p4-pdf/signer', { pdfId: id });
  if (!r.ok || !r.data || !r.data.url){
    A.toast(r.erreur || 'Ouvrage non débloqué');
    return;
  }
  if (!telecharger){
    /* le lecteur PDF du navigateur s'ouvre : le bouton retour ramène ici */
    location.href = r.data.url;
    return;
  }
  try {
    A.toast('Préparation du fichier…');
    const C = window.LHCOMPTE;
    const rep = await C.api('/api/p4-pdf/' + encodeURIComponent(id) + '/fichier');
    if (!rep.ok){ A.toast('Téléchargement refusé'); return; }
    const blob = await rep.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CosmetiLab-' + id + '.pdf';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    A.toast('PDF téléchargé ✅');
  } catch (e) {
    A.toast('Téléchargement impossible hors connexion');
  }
}

/* ------------------------------------------------------------ achat */
async function acheter(ids, code){
  const liste = (ids || []).filter(Boolean);
  if (!liste.length){ A.toast('Choisissez au moins un ouvrage'); return; }
  const corps = liste.length > 1
    ? { type: 'pdfs', pdfIds: liste, code: code || undefined }
    : { type: 'pdf', pdfId: liste[0], code: code || undefined };
  const r = await V3.ecrire('/api/paiements/session', corps);
  if (!r.ok){
    A.toast(r.erreur || 'Paiement impossible');
    if (r.statut === 409 && r.data && liste.length === 1){ boutiqueCharger(); }
    return;
  }
  const url = r.data && r.data.url;
  if (!url){ A.toast('Session de paiement non reçue'); return; }
  A.toast('Redirection vers le paiement sécurisé NOVA…');
  setTimeout(() => { location.assign(url); }, 250);
}

/* ------------------------------------------------------------ démarrage */
A.PAGES.boutique = { single: true, render: pageBoutique, mount(){ boutiqueCharger(); } };
A.PAGES.boutiqueDetail = { single: true, render: pageBoutiqueDetail, mount(el, params){ boutiqueDetail(params); } };
A.PAGES.biblio = { single: true, render: pageBiblio, mount(){ biblioCharger(); } };

window.LHV4BOUTIQUE = { charger: boutiqueCharger, acheter: acheter, ouvrir: ouvrirLivre, etat: BOUTIQUE };

document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('[data-act="bvRecharger"]')){ boutiqueCharger(); return; }
  const acheter1 = t.closest('[data-act="bvAcheter"]');
  if (acheter1){ acheter([acheter1.dataset.id], BOUTIQUE.code); return; }
  if (t.closest('[data-act="bvPayer"]')){
    const champ = document.getElementById('bvCode');
    const ids = Object.keys(BOUTIQUE.choix).filter(k => BOUTIQUE.choix[k]);
    acheter(ids, (champ && champ.value.trim().toUpperCase()) || BOUTIQUE.code);
    return;
  }
  const lire1 = t.closest('[data-act="bvLire"]');
  if (lire1){ ouvrirLivre(lire1.dataset.id, false); return; }
  const dl = t.closest('[data-act="bvTelecharger"]');
  if (dl){ ouvrirLivre(dl.dataset.id, true); return; }
});

document.addEventListener('change', e => {
  const c = e.target.closest('[data-bvchoix]');
  if (c){
    BOUTIQUE.choix[c.dataset.bvchoix] = c.checked;
    peindreBoutique();
    return;
  }
  if (e.target.id === 'bvCode') BOUTIQUE.code = e.target.value.trim().toUpperCase();
});

/* retour de paiement : les ouvrages achetés apparaissent sans attendre.
   Le serveur reste seul juge : on redemande le statut à NOVA. */
window.addEventListener('load', async () => {
  try {
    const q = new URLSearchParams(location.search || '');
    const session = q.get('session_id');
    if (!session && q.get('paiement') !== 'retour') return;
    if (!V3.connecte || !V3.connecte()) return;
    const r = await V3.ecrire('/api/p4-pdf/verifier', { sessionId: session || undefined });
    if (r.ok && r.data && r.data.statut === 'paid'){
      A.toast('Ouvrages ajoutés à votre bibliothèque ✅');
      setTimeout(() => { A.pushPage('biblio', {}); }, 600);
    }
  } catch (e) {}
});
})();
