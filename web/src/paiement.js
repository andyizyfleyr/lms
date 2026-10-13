/* ============================================================
   PAIEMENTS — cours à l'unité et abonnement (NOVA Checkout)
   ------------------------------------------------------------
   • tous les cours sont payants ; l'abonnement débloque tout ;
   • les montants viennent du serveur (/api/paiements/catalogue) :
     l'application ne décide jamais d'un prix ;
   • le déblocage se fait côté serveur (webhook signé ou vérification
     après retour de la page de paiement) — le navigateur ne fait
     qu'afficher l'état renvoyé par /api/acces.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const { svg, PAGES, pushPage, popPage, dialog, openSheet, closeSheet, barPage,
        S, refreshUI, refreshPages, notification } = A;

/* ---------- état local (cache d'affichage ; la vérité est côté serveur) ---------- */
const CLE_ACCES = 'lh_paie_acces';
const CLE_CATALOGUE = 'lh_paie_catalogue';
const CLE_COMMANDE = 'lh_paie_commande';

const lire = (cle, defaut) => { try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; } };
const ecrire = (cle, valeur) => { try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) {} };
const oublier = cle => { try { localStorage.removeItem(cle); } catch (e) {} };

const VIDE = () => ({ abonnement: { actif: false, joursRestants: 0, planId: null, fin: null }, toutPaye: false, cours: [] });

const P = {
  catalogue: lire(CLE_CATALOGUE, null),
  acces: lire(CLE_ACCES, VIDE()),
  gratuit: false,
  pret: false,
  chargement: null,
  derniere: 0
};

/* ---------- outils ---------- */
const fcfa = n => new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' F';
const compte = () => (window.LHCOMPTE && window.LHCOMPTE.compte) ? window.LHCOMPTE.compte() : null;
const estInvite = () => !compte() || (window.LHCOMPTE.estInvite && window.LHCOMPTE.estInvite());
const appel = (chemin, opts) => window.LHCOMPTE.api(chemin, opts);
const lireJSON = async r => { try { const j = await r.json(); return (j && typeof j === 'object' && 'data' in j) ? j : { data: j }; } catch (e) { return { data: null }; } };
const inactif = () => !!(P.catalogue && P.catalogue.paiementActif === false);

const infosCours = cid => ((P.catalogue && P.catalogue.cours) || []).find(c => c.id === cid) || null;
const prixCours = cid => { const i = infosCours(cid); return i ? i.prix : 3500; };
const plans = () => (P.catalogue && P.catalogue.plans) || [
  { id: 'mensuel', nom: 'Abonnement mensuel', jours: 30, montant: 6000, accroche: 'Tous les cours pendant 30 jours', recommande: true }
];
const planParId = id => plans().find(p => p.id === id) || plans()[0];

/** Ce cours est-il ouvert pour ce compte ? */
function estDebloque(cid){
  if (!cid) return true;
  if (P.gratuit) return true;
  if (P.acces && P.acces.toutPaye) return true;
  return !!((P.acces && P.acces.cours) || []).includes(cid);
}

/* ---------- chargement de l'état ---------- */
function charger(force){
  if (P.chargement && !force) return P.chargement;
  P.chargement = (async () => {
    const base = (window.LHCOMPTE && window.LHCOMPTE.urlBase) ? window.LHCOMPTE.urlBase() : '';
    try {
      const r = await fetch(base + '/api/paiements/catalogue', { cache: 'no-store' });
      const j = await lireJSON(r);
      if (j.data) { P.catalogue = j.data; ecrire(CLE_CATALOGUE, j.data); }
    } catch (e) { /* hors-ligne : on garde le dernier catalogue connu */ }

    if (estInvite()){
      P.acces = VIDE(); P.gratuit = false;
    } else {
      try {
        const r = await appel('/api/acces');
        const j = await lireJSON(r);
        if (j.data){ P.acces = j.data; P.gratuit = !!j.data.gratuit; ecrire(CLE_ACCES, j.data); }
      } catch (e) { /* on garde le cache */ }
    }
    P.pret = true; P.derniere = Date.now();
    majResumeProfil(); majPrixCartes();
    return P.acces;
  })();
  return P.chargement;
}
/* rechargé au maximum une fois toutes les 12 s (appelé par refreshUI) */
function chargerSiBesoin(){
  if (!P.pret || Date.now() - P.derniere > 12000) charger(true);
}

/* ---------- textes ---------- */
const RESUME_ABO = () => {
  const a = P.acces.abonnement || {};
  return a.actif ? ('Abonnement actif · ' + a.joursRestants + ' j restants') : 'Aucun abonnement actif';
};
function majResumeProfil(){
  const el = document.getElementById('rowAbonnementResume');
  if (!el) return;
  const n = (P.acces.cours || []).length;
  el.textContent = P.gratuit ? 'Accès illimité (compte formateur)'
    : P.acces.abonnement && P.acces.abonnement.actif ? RESUME_ABO()
    : n ? n + ' cours débloqué' + (n > 1 ? 's' : '') : 'Tous les cours sont payants';
}
/** Les cartes de cours déjà dessinées doivent refléter le nouvel accès. */
function majPrixCartes(){
  if (typeof renderCourses === 'function' && document.getElementById('courseFilters')){
    const chip = document.querySelector('#courseFilters .chip.is-selected');
    const champ = document.getElementById('searchInput');
    try { renderCourses(chip ? chip.dataset.filter : 'tous', (champ && champ.value) || ''); } catch (e) {}
  }
}

/* ---------- écran paywall ---------- */
function blocPaywall(c, options){
  options = options || {};
  const prix = prixCours(c.id);
  const mensuel = planParId('mensuel');
  return `<div class="paywall" id="paywall">
    <span class="paywall__ico">${svg('lock', 'icon icon--24')}</span>
    <h3>${options.titre || 'Ce cours est payant'}</h3>
    <p class="body-small muted">${options.texte || 'Débloquez le cours « ' + esc(c.titre) + ' » pour accéder aux leçons, aux vidéos, aux ressources et aux quiz.'}</p>
    <div class="paywall__prix">${fcfa(prix)} <small>· accès définitif</small></div>
    <div class="paywall__prix" style="font-size:15px;margin-top:2px">ou ${fcfa(mensuel.montant)} <small>· ${esc(mensuel.nom.toLowerCase())}, tous les cours (${mensuel.jours} j)</small></div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
      <button class="btn btn--filled btn--block ripple" data-paie="cours" data-cours="${c.id}">
        ${svg('lock', 'icon icon--18')} Débloquer ce cours
      </button>
      <button class="btn btn--tonal btn--block ripple" data-paie="abonnement" data-plan="mensuel">
        ${svg('crown', 'icon icon--18')} ${esc(mensuel.nom)} — ${fcfa(mensuel.montant)}
      </button>
      <button class="btn btn--text btn--block ripple" data-page="abonnement">Voir toutes les formules</button>
    </div>
    <ol>
      <li>Le paiement se fait sur la page sécurisée NOVA Checkout (franc CFA).</li>
      <li>L'accès s'ouvre dès la confirmation, sans quitter l'application.</li>
      <li>Un cours acheté à l'unité reste à vous définitivement.</li>
    </ol>
    <div class="paywall__secu">${svg('shield', 'icon icon--16')} Paiement sécurisé par NOVA Checkout${inactif() ? ' — <b>paiement en cours d’activation</b>' : ''}</div>
  </div>`;
}

/** Feuille d'action : proposer l'achat au moment où l'apprenant touche un contenu fermé. */
function proposerAchat(cid, motif){
  const c = typeof coursById === 'function' ? (coursById(cid) || {}) : {};
  const prix = prixCours(cid);
  const mensuel = planParId('mensuel');
  openSheet(`
    <h3 class="title-medium">${svg('lock', 'icon icon--18')} ${motif === 'video' ? 'Vidéo réservée aux inscrits' : 'Cours payant'}</h3>
    <p class="body-small muted" style="padding:0 6px 12px">${esc(c.titre || 'Ce cours')} — débloquez-le pour continuer.</p>
    <div class="paywall" style="margin-bottom:12px">
      <div class="paywall__prix">${fcfa(prix)} <small>· ce cours, à vie</small></div>
      <p class="body-small muted" style="margin-top:6px">ou ${fcfa(mensuel.montant)} · ${esc(mensuel.nom.toLowerCase())} — ${mensuel.jours} jours, tous les cours</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
        <button class="btn btn--filled btn--block ripple" data-paie="cours" data-cours="${cid}">${svg('card', 'icon icon--18')} Débloquer ce cours — ${fcfa(prix)}</button>
        <button class="btn btn--tonal btn--block ripple" data-paie="abonnement" data-plan="mensuel">${svg('crown', 'icon icon--18')} ${esc(mensuel.nom)} — ${fcfa(mensuel.montant)}</button>
      </div>
    </div>
    <button class="btn btn--text btn--block ripple" data-page="abonnement">Toutes les formules et mes achats</button>`);
}

/* ---------- achat ---------- */
async function acheter(type, options){
  options = options || {};
  if (estInvite()){
    toast('Créez un compte (gratuit) pour enregistrer votre accès');
    if (window.LHCOMPTE && window.LHCOMPTE.ouvrirEntree) window.LHCOMPTE.ouvrirEntree();
    return false;
  }
  if (inactif()){
    await dialog({ title: 'Paiement bientôt disponible', ico: 'clock', cancel: false, confirmLabel: 'Compris',
      text: 'Le moyen de paiement n’est pas encore activé sur ce serveur. Réessayez plus tard ou écrivez-nous.' });
    return false;
  }
  const corps = type === 'cours'
    ? { type: 'cours', courseId: options.cours }
    : { type: 'abonnement', planId: options.plan || 'mensuel' };

  const bouton = document.querySelector('[data-paie="' + type + '"]');
  const libelle = bouton ? bouton.innerHTML : '';
  if (bouton){ bouton.disabled = true; bouton.innerHTML = 'Ouverture du paiement sécurisé…'; }

  let reponse = null;
  try {
    const r = await appel('/api/paiements/session', { method: 'POST', body: JSON.stringify(corps) });
    reponse = await lireJSON(r);
    if (!r.ok || !reponse.data){
      const msg = (reponse.data && reponse.data.error && reponse.data.error.message) || 'Paiement indisponible pour le moment.';
      if (bouton){ bouton.disabled = false; bouton.innerHTML = libelle; }
      await dialog({ title: 'Paiement impossible', ico: 'info', cancel: false, confirmLabel: 'Fermer', text: msg });
      return false;
    }
  } catch (e) {
    if (bouton){ bouton.disabled = false; bouton.innerHTML = libelle; }
    await dialog({ title: 'Réseau indisponible', ico: 'cloud', cancel: false, confirmLabel: 'Fermer',
      text: 'Impossible de joindre le serveur de paiement. Vérifiez votre connexion puis réessayez.' });
    return false;
  }

  ecrire(CLE_COMMANDE, { id: reponse.data.commande.id, session: reponse.data.commande.session, type: type, quand: Date.now() });
  toast('Redirection vers le paiement sécurisé NOVA…');
  closeSheet();
  setTimeout(() => { location.assign(reponse.data.url); }, 250);
  return true;
}

/* ---------- retour de la page de paiement ---------- */
function nettoyerURL(){
  /* on retire seulement ce qui vient du retour NOVA : les autres paramètres
     d'adresse (code d'ami, code promo, mode) doivent survivre au nettoyage. */
  try {
    const q = new URLSearchParams(location.search || '');
    ['paiement', 'session_id', 'paiement_session'].forEach(k => q.delete(k));
    const reste = q.toString();
    history.replaceState(null, '', location.pathname + (reste ? '?' + reste : '') + location.hash);
  } catch (e) {}
}
async function verifierRetour(){
  const q = new URLSearchParams(location.search || '');
  const retour = q.get('paiement');
  const enCours = lire(CLE_COMMANDE, null);
  if (!retour && !enCours) return;
  if (retour === 'annule'){
    oublier(CLE_COMMANDE);
    toast('Paiement annulé — aucun montant prélevé');
    nettoyerURL();
    return;
  }
  if (estInvite()) return;                       // le compte doit être ouvert pour retrouver la commande
  const session = q.get('session_id');
  const corps = session ? { sessionId: session } : (enCours && enCours.id ? { orderId: enCours.id } : null);
  if (!corps){ nettoyerURL(); return; }

  let statut = '';
  try {
    const r = await appel('/api/paiements/verifier', { method: 'POST', body: JSON.stringify(corps) });
    const j = await lireJSON(r);
    const d = j.data || {};
    statut = d.statut || '';
    if (d.acces){ P.acces = d.acces; ecrire(CLE_ACCES, d.acces); }
  } catch (e) { /* on retentera au prochain lancement : la commande reste enregistrée */ }

  if (statut === 'paid'){
    oublier(CLE_COMMANDE);
    const abonne = P.acces && P.acces.abonnement && P.acces.abonnement.actif;
    toast(abonne ? 'Abonnement activé 🎉 — tous les cours sont ouverts' : 'Paiement confirmé 🎉 — cours débloqué');
    if (typeof notification === 'function') notification('badge', abonne ? 'Abonnement activé' : 'Nouveau cours débloqué',
      abonne ? 'Tous les cours sont accessibles pendant votre période.' : 'Bon apprentissage !', ['abonnement', '']);
    refreshUI(); refreshPages(); majResumeProfil();
    charger(true);
  } else if (statut){
    toast('Paiement en attente : ' + statut);
  }
  nettoyerURL();
}

/* ---------- page « Abonnement & achats » ---------- */
PAGES.abonnement = {
  single: true,
  render(){
    const abo = P.acces.abonnement || {};
    const mensuel = planParId('mensuel');
    const listePlans = plans().map(p => `
      <div class="plan${p.recommande ? ' is-recommande' : ''}">
        <span class="list-row__ico acc-purple">${svg('crown', 'icon icon--20')}</span>
        <span class="plan__main">
          <h3>${esc(p.nom)}${p.recommande ? '<span class="plan__flag">CONSEILLÉ</span>' : ''}</h3>
          <p>${esc(p.accroche)}${p.avantage ? ' · ' + esc(p.avantage) : ''}</p>
        </span>
        <span class="plan__prix">${fcfa(p.montant)}<small>${p.jours} jours</small></span>
      </div>
      <button class="btn btn--filled btn--block ripple" style="margin:-2px 0 14px" data-paie="abonnement" data-plan="${p.id}">
        ${svg('card', 'icon icon--18')} Payer ${fcfa(p.montant)} — ${esc(p.nom)}
      </button>`).join('');

    const statut = abo.actif
      ? `<div class="abostatut">
           <span class="list-row__ico acc-green">${svg('check-circle', 'icon icon--20')}</span>
           <span class="abostatut__main"><h3>${esc(abo.planNom || 'Abonnement')} en cours</h3>
             <p>Jusqu'au ${dateLisible(abo.fin)} · ${abo.joursRestants} jour${abo.joursRestants > 1 ? 's' : ''} restant${abo.joursRestants > 1 ? 's' : ''}</p></span>
         </div>`
      : `<div class="abostatut">
           <span class="list-row__ico acc-amber">${svg('lock', 'icon icon--20')}</span>
           <span class="abostatut__main"><h3>${P.gratuit ? 'Accès illimité (compte formateur)' : 'Aucun abonnement actif'}</h3>
             <p>${P.gratuit ? 'Les comptes formateur et administrateur accèdent à tout.' : 'Chaque cours s’achète à l’unité, ou l’abonnement ouvre tout.'}</p></span>
         </div>`;

    const cours = (typeof COURS !== 'undefined' ? COURS : []).map(c => {
      const ok = estDebloque(c.id);
      return `<div class="achat">
        <span class="achat__main">
          <h3>${esc(c.titre)}</h3>
          <p>${ok ? (P.acces.toutPaye ? 'Inclus dans votre abonnement' : 'Débloqué définitivement') : esc(c.prof)}</p>
        </span>
        ${ok
          ? `<span class="pay-tag">${svg('check', 'icon')} Ouvert</span>`
          : `<button class="btn btn--tonal btn--sm ripple" data-paie="cours" data-cours="${c.id}">${fcfa(prixCours(c.id))}</button>`}
      </div>`;
    }).join('');

    return barPage('Abonnement &amp; achats', '',
      `<div class="sec" style="margin-top:4px"><div class="sec__h"><h2>Mon accès</h2></div>${statut}</div>
       <div class="sec"><div class="sec__h"><h2>Formules d’abonnement</h2><span class="muted body-small">${esc((P.catalogue && P.catalogue.deviseLabel) || 'F CFA')}</span></div>
         <p class="body-small muted" style="margin:-4px 0 12px">Débloquez les ${(typeof COURS !== 'undefined' ? COURS.length : 6)} cours d’un seul coup. Période payée d’avance : vous renouvelez quand vous voulez.</p>
         ${listePlans}</div>
       <div class="sec"><div class="sec__h"><h2>Les cours à l’unité</h2></div>${cours}</div>
       <div class="sec"><div class="sec__h"><h2>Mes achats</h2></div><div id="paieHisto"><p class="body-small muted">Chargement…</p></div></div>
       <div class="sec"><div class="sec__h"><h2>Conditions</h2></div>
         <div class="paywall" style="margin-bottom:20px">
           <ol>${((P.catalogue && P.catalogue.conditions) || []).map(t => '<li>' + esc(t) + '</li>').join('')}</ol>
           <div class="paywall__secu">${svg('shield', 'icon icon--16')} Paiement par NOVA Checkout — montant encaissé en franc CFA.</div>
         </div>
       </div>`);
  },
  mount(el){
    charger(true).then(() => { peindreHisto(el); majResumeProfil(); });
    /* un seul écouteur pour toute la page (boutons d'achat) */
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-paie]');
      if (!b) return;
      e.preventDefault();
      acheter(b.dataset.paie, { cours: b.dataset.cours, plan: b.dataset.plan });
    });
  }
};

function dateLisible(iso){
  if (!iso) return '—';
  const d = new Date(iso);
  const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear();
}
async function peindreHisto(el){
  const box = el.querySelector('#paieHisto');
  if (!box) return;
  if (estInvite()){ box.innerHTML = '<p class="body-small muted">Connectez-vous pour voir vos achats.</p>'; return; }
  try {
    const r = await appel('/api/paiements');
    const j = await lireJSON(r);
    const liste = (j.data && j.data.commandes) || [];
    if (!liste.length){
      box.innerHTML = '<p class="body-small muted">Aucun achat pour le moment.</p>' + (inactif() ? '<p class="body-small muted">Le paiement n’est pas encore activé sur ce serveur.</p>' : '');
      return;
    }
    box.innerHTML = liste.map(o => `
      <div class="achat">
        <span class="list-row__ico ${o.statut === 'paid' ? 'acc-green' : 'acc-amber'}">${svg(o.type === 'abonnement' ? 'crown' : 'card', 'icon icon--20')}</span>
        <span class="achat__main">
          <h3>${esc(o.planNom || o.description || 'Achat')}</h3>
          <p>${dateLisible(o.creeLe)} · ${o.statut === 'paid' ? 'payé' : esc(o.statut)}${o.reference ? ' · ' + esc(o.reference) : ''}</p>
        </span>
        <span class="achat__prix">${fcfa(o.montant)}</span>
      </div>`).join('');
  } catch (e) {
    box.innerHTML = '<p class="body-small muted">Historique indisponible hors connexion.</p>';
  }
}

/* ---------- garde-fous : le contenu payant ne s'ouvre pas ---------- */
function payerOuExpliquer(cid, motif){
  if (!estDebloque(cid)) proposerAchat(cid, motif);
}

/** Enveloppe une fabrique de HTML de carte : ajoute cadenas + prix si le cours est fermé. */
function envelopperCarte(nom){
  const base = window[nom];
  if (typeof base !== 'function' || base.__paie) return;
  const f = function(c){
    const html = base.apply(this, arguments);
    if (!c || !c.id || estDebloque(c.id)) return html;
    return marquerPayant(html, c.id);
  };
  f.__paie = true;
  window[nom] = f;
}
function marquerPayant(html, cid){
  const tag = '<span class="pay-tag">' + svg('lock', 'icon') + ' ' + fcfa(prixCours(cid)) + '</span>';
  const cadenas = '<span class="thumb__lock">' + svg('lock', 'icon icon--18') + '</span>';
  let h = html;
  h = h.replace(/<span class="prog-label">[^<]*<\/span>/, tag);      // carte horizontale
  h = h.replace(/<b>[^<]*%<\/b>/, tag);                             // ligne de cours
  h = h.replace(/class="([^"]*\bthumb\b[^"]*)"/, 'class="$1 is-locked"');
  h = h.replace(/(<span class="thumb__shade">\s*<\/span>)/, '$1' + cadenas);
  return h === html ? html + tag : h;
}

/* ---------- branchements ---------- */
function brancher(){
  /* cartes de cours */
  envelopperCarte('hcardHTML');
  envelopperCarte('courseRowHTML');
  envelopperCarte('vrowHTML');

  /* fiche de cours : bandeau + CTA « Débloquer » + interception des clics */
  const pageCours = PAGES.cours;
  if (pageCours && !pageCours.__paie){
    const render0 = pageCours.render, mount0 = pageCours.mount;
    pageCours.render = function(params){
      const html = render0.apply(this, arguments);
      const c = params && params.id ? coursById(params.id) : null;
      if (!c || estDebloque(c.id)) return html;
      return html.replace('<div id="cBody"', '<div class="page__pad" style="padding-bottom:0">' + blocPaywall(c) + '</div><div id="cBody"');
    };
    pageCours.mount = function(el, params){
      if (typeof mount0 === 'function') mount0.apply(this, arguments);
      const c = params && params.id ? coursById(params.id) : null;
      if (!c || estDebloque(c.id)) return;
      const cta = el.querySelector('#cCta');
      if (cta){
        cta.innerHTML = `<button class="btn btn--filled ripple" style="flex:1" data-paie="cours" data-cours="${c.id}">
          ${svg('lock', 'icon icon--18')} Débloquer — ${fcfa(prixCours(c.id))}</button>`;
      }
      el.querySelectorAll('.lesson').forEach(l => l.classList.add('is-locked'));
      /* phase de capture : ces clics ne doivent jamais atteindre le contenu payant */
      el.addEventListener('click', e => {
        const cible = e.target.closest('[data-paie],[data-lesson],[data-res],[data-ctab],[data-act="continue"],[data-act="dlCourse"],[data-act="fav"]');
        if (!cible) return;
        if (cible.dataset.ctab === 'programme') return;         // l'onglet déjà ouvert reste consultable
        e.preventDefault(); e.stopPropagation();
        if (cible.dataset.paie) return acheter(cible.dataset.paie, { cours: cible.dataset.cours, plan: cible.dataset.plan });
        payerOuExpliquer(c.id, cible.hasAttribute('data-lesson') || cible.dataset.act === 'continue' ? 'lecon' : 'onglet');
      }, true);
    };
    pageCours.__paie = true;
  }

  /* quiz : la page entière est réservée */
  const pageQuiz = PAGES.quiz;
  if (pageQuiz && !pageQuiz.__paie){
    const render0 = pageQuiz.render, mount0 = pageQuiz.mount;
    const verrouille = params => {
      const cid = (params && (params.quiz || params.id)) || '';
      const c = cid && typeof coursById === 'function' ? coursById(cid) : null;
      return c && !estDebloque(c.id) ? c : null;
    };
    pageQuiz.render = function(params){
      const c = verrouille(params);
      if (c) return barPage('Quiz — ' + c.titre, '', blocPaywall(c, { titre: 'Quiz réservé aux inscrits', texte: 'Le quiz noté fait partie du cours payant « ' + esc(c.titre) + ' ».' }));
      return render0.apply(this, arguments);
    };
    pageQuiz.mount = function(el, params){
      if (verrouille(params)) return;                            // page paywall : rien à câbler
      if (typeof mount0 === 'function') return mount0.apply(this, arguments);
    };
    pageQuiz.__paie = true;
  }

  /* lecteur vidéo : jamais de lecture sans accès */
  const ouvrirVideo0 = window.openVideoId;
  if (typeof ouvrirVideo0 === 'function' && !ouvrirVideo0.__paie){
    const f = function(yt, coursId){
      let cid = coursId || '';
      if (!cid && typeof VIDEOS !== 'undefined'){
        const v = VIDEOS.find(x => x.yt === yt);
        if (v) cid = v.cours;
      }
      if (cid && !estDebloque(cid)){ proposerAchat(cid, 'video'); return false; }
      return ouvrirVideo0.apply(this, arguments);
    };
    f.__paie = true;
    window.openVideoId = f;
  }

  /* bouton « Continuer » du héros (accueil) */
  const ACTIONS = A.ACTIONS;
  if (ACTIONS && typeof ACTIONS.continue === 'function' && !ACTIONS.continue.__paie){
    const continuer0 = ACTIONS.continue;
    const f = function(btn){
      const pg = btn && btn.closest ? btn.closest('.page') : null;
      const cid = (btn && btn.dataset && btn.dataset.cours) || (pg && pg.dataset.coursId) || 'c1';
      if (!estDebloque(cid)){ payerOuExpliquer(cid, 'lecon'); return; }
      return continuer0.apply(this, arguments);
    };
    f.__paie = true;
    ACTIONS.continue = f;
  }

  /* feuilles et dialogues : un seul écouteur global pour tous les boutons d'achat */
  document.addEventListener('click', e => {
    const b = e.target.closest('#sheet [data-paie], #dialog [data-paie]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    acheter(b.dataset.paie, { cours: b.dataset.cours, plan: b.dataset.plan });
  }, true);

  /* l'état d'accès suit la connexion / déconnexion et la synchro */
  const refresh0 = A.refreshUI;
  if (typeof refresh0 === 'function' && !refresh0.__paie){
    const f = function(){
      const r = refresh0.apply(this, arguments);
      chargerSiBesoin();
      return r;
    };
    f.__paie = true;
    A.refreshUI = f;
    window.refreshUI = f;                                        // les modules appellent la variable globale
  }
  window.addEventListener('storage', e => { if (e.key && e.key.indexOf('lh:compte') === 0) charger(true); });
  window.addEventListener('online', () => charger(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) charger(true); });
}

window.LHPAIE = {
  charger, acces: () => P.acces, catalogue: () => P.catalogue, estDebloque, prixCours, fcfa,
  acheter, proposerAchat, verifierRetour, estInvite, pret: () => P.pret
};

brancher();
setTimeout(() => { charger(true).then(verifierRetour); }, 350);
})();
