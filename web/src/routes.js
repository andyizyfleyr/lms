/* ============================================================
   ADRESSES DES PAGES
   ------------------------------------------------------------
   Chaque écran de l'application a sa propre adresse, servie
   directement par le serveur (une requête sur l'adresse renvoie
   l'application, qui ouvre l'écran correspondant) :

     /                  accueil              /notifications
     /cours             mes cours            /telechargements
     /cours/c1          fiche du cours c1    /badges  /aide
     /cours/c1?onglet=discussion            /parametres  /compte
     /quiz/c1           quiz du cours c1     /corrections
     /devoir/d1         devoir d1            /tentatives  /certificats
     /video/hJwIUUQYSQg lecteur vidéo        /hors-ligne  /abonnement
     /agenda  /profil   /profil/modifier     /formateur/apprenants
     /connexion  /inscription  /invite

   La liste des motifs vit dans src/routes.json : le serveur (Next.js,
   api/routes-site.json) s'en sert pour répondre à chacune de ces
   adresses, et ce module pour construire les liens et lire l'adresse
   ouverte. Un même fichier, donc aucune divergence possible.
   ============================================================ */
(function(){
'use strict';
const MOTIFS = (typeof ADRESSES !== 'undefined' && ADRESSES) || [];

/* texte de l'onglet selon l'écran */
const TITRES = {
  accueil: 'Accueil', cours: 'Cours', agenda: 'Agenda', profil: 'Profil',
  notifications: 'Notifications', recherche: 'Recherche', videos: 'Vidéos',
  telechargements: 'Téléchargements', badges: 'Badges', aide: "Centre d'aide",
  parametres: 'Paramètres', compte: 'Mon compte', corrections: 'Corrections',
  'profil-edit': 'Modifier le profil', quiz: 'Quiz', devoir: 'Devoir',
  abonnement: 'Abonnement', 'espace-formateur': 'Espace formateur',
  tentatives: 'Mes tentatives', certificats: 'Mes attestations', 'hors-ligne': 'Mode hors-ligne',
  connexion: 'Connexion', inscription: 'Créer un compte', invite: 'Explorer sans compte',
  /* V3 */
  parcours: 'Parcours guidés', parcoursdetail: 'Parcours', revision: 'Révision',
  objectifs: 'Objectifs', competences: 'Mes compétences', fiche: 'Fiche de révision',
  outils: "Outils de l'artisan", formulation: 'Formulation', saponification: 'Saponification',
  convertisseur: 'Convertisseur', reglementaire: 'Réglementaire', recettes: 'Mes recettes',
  production: 'Carnet de production', paiements: 'Mes paiements', codes: 'Codes promo',
  parrainage: 'Parrainage', verifier: 'Vérifier une attestation', etat: 'État du service',
  sauvegarde: 'Sauvegarde', accessibilite: 'Confort de lecture', revenus: 'Revenus',
  creercours: 'Créer un cours', questions: 'Banque de questions', annonce: 'Annonce',
  notation: 'Notation assistée', seances: 'Séances en direct'
};

/* onglets de la fiche cours */
const ONGLETS_COURS = ['programme', 'ressources', 'discussion', 'notes', 'quiz', 'devoirs'];
/* onglets de l'espace formateur */
const ONGLETS_FORMATEUR = ['cours', 'lecons', 'ressources', 'seances', 'apprenants'];
/* écrans du formateur qui ont leur propre adresse (V3) */
const ECRANS_FORMATEUR = ['revenus', 'questions', 'annonce', 'notation', 'seances'];

const ech = t => encodeURIComponent(String(t === null || t === undefined ? '' : t));

/* ------------------------------------------------------------
   1. CONSTRUCTION D'UNE ADRESSE À PARTIR D'UN ÉCRAN
   ------------------------------------------------------------ */
function cheminDe(id, params){
  params = params || {};
  const cle = params.id || params.quiz || params.cours || '';
  switch (id){
    case 'accueil': case '': return '/';
    case 'cours': if (!cle) return '/cours';
      return '/cours/' + ech(cle) + (params.tab && params.tab !== 'programme' ? '?onglet=' + ech(params.tab) : '');
    case 'quiz':   return '/quiz/' + ech(cle || params.id) + (params.mode === 'entrainement' ? '?mode=entrainement' : '');
    case 'devoir': return '/devoir/' + ech(cle);
    case 'profil-edit': return '/profil/modifier';
    case 'espace-formateur': {
      const onglet = params.onglet || (params.tab && ONGLETS_FORMATEUR.indexOf(params.tab) >= 0 ? params.tab : '');
      return '/formateur' + (onglet && onglet !== 'cours' ? '/' + ech(onglet) : '');
    }
    case 'video': return '/video/' + ech(params.yt || cle);
    case 'fiche': return '/fiche/' + ech(cle);
    case 'parcoursdetail': return '/parcours/' + ech(params.id || cle);
    case 'creercours': return '/formateur/creer' + (params.id ? '/' + ech(params.id) : '');
    case 'verifier': return '/verifier' + (params.numero ? '/' + ech(params.numero) : '');
    default: return '/' + (LIEUX[id] || id);
  }
}

/* écrans « simples » : leur adresse est fixe */
const LIEUX = {
  agenda:'agenda', profil:'profil', notifications:'notifications', recherche:'recherche',
  videos:'videos', telechargements:'telechargements', badges:'badges', aide:'aide',
  parametres:'parametres', compte:'compte', corrections:'corrections', abonnement:'abonnement',
  tentatives:'tentatives', certificats:'certificats', 'hors-ligne':'hors-ligne',
  /* V3 */
  parcours:'parcours', revision:'revision', objectifs:'objectifs', competences:'competences',
  outils:'outils', formulation:'outils/formulation', saponification:'outils/saponification',
  convertisseur:'outils/convertisseur', reglementaire:'outils/reglementaire',
  recettes:'recettes', production:'production', paiements:'paiements', codes:'codes',
  parrainage:'parrainage', etat:'etat', sauvegarde:'sauvegarde', accessibilite:'accessibilite',
  revenus:'formateur/revenus', questions:'formateur/questions', annonce:'formateur/annonce',
  notation:'formateur/notation', seances:'formateur/seances'
};

/* adresse de l'écran précédent logique (ouverture directe d'une adresse) */
function parentDe(id, params){
  params = params || {};
  if (id === 'quiz' || id === 'devoir') return '/cours/' + ech(params.id || params.quiz || '');
  if (id === 'video') return '/videos';
  if (id === 'profil-edit') return '/profil';
  if (id === 'parcoursdetail') return '/parcours';
  if (id === 'fiche') return '/cours/' + ech(params.id || '');
  if (['formulation', 'saponification', 'convertisseur', 'reglementaire'].indexOf(id) >= 0) return '/outils';
  if (['revenus', 'creercours', 'questions', 'annonce', 'notation', 'seances'].indexOf(id) >= 0) return '/formateur';
  if (id === 'revision') return '/objectifs';
  if (id === 'codes') return '/paiements';
  if (id === 'parrainage') return '/codes';
  if (id === 'recettes' || id === 'production') return '/outils';
  if (id === 'objectifs' || id === 'competences') return '/profil';
  if (id === 'sauvegarde' || id === 'accessibilite') return '/parametres';
  if (id === 'corrections' || id === 'tentatives' || id === 'certificats' || id === 'hors-ligne' || id === 'compte') return '/profil';
  if (id === 'abonnement') return '/profil';
  if (id === 'espace-formateur') return '/compte';
  return '/';
}

/* ------------------------------------------------------------
   2. LECTURE D'UNE ADRESSE
   ------------------------------------------------------------ */
function analyser(chemin, recherche){
  /* l'adresse peut arriver complète (« /cours/c1?onglet=notes ») ou en deux morceaux */
  const brut = String(chemin || '/').replace(/^[^/]*\/\//, '');     // « https://hôte/cours » toléré
  const morceaux = brut.split('?');
  const seg = morceaux[0].split('/').filter(Boolean).map(decodeURIComponent);
  const q = new URLSearchParams((recherche || morceaux[1] || '').replace(/^\?/, ''));
  const onglet = q.get('onglet') || '';
  if (!seg.length) return { vue: 'accueil' };
  switch (seg[0]){
    case 'cours':
      if (!seg[1]) return { vue: 'cours' };
      return { id: 'cours', params: { id: seg[1], tab: onglet && ONGLETS_COURS.indexOf(onglet) >= 0 ? onglet : 'programme' } };
    case 'quiz':
      if (!seg[1]) return { inconnu: true };
      return { id: 'quiz', params: { id: seg[1], quiz: seg[1], mode: q.get('mode') === 'entrainement' ? 'entrainement' : '' } };
    case 'devoir': return seg[1] ? { id: 'devoir', params: { id: seg[1] } } : { inconnu: true };
    case 'video':  return seg[1] ? { id: 'video', params: { yt: seg[1] } } : { inconnu: true };
    case 'formateur':
      if (seg[1] === 'creer') return { id: 'creercours', params: { id: seg[2] || '' } };
      if (seg[1] && ECRANS_FORMATEUR.indexOf(seg[1]) >= 0) return { id: seg[1], params: {} };
      return { id: 'espace-formateur', params: { onglet: seg[1] && ONGLETS_FORMATEUR.indexOf(seg[1]) >= 0 ? seg[1] : 'cours' } };
    case 'parcours':
      if (seg.length === 1) return { id: 'parcours', params: {} };
      return seg[2] ? { inconnu: true } : { id: 'parcoursdetail', params: { id: seg[1] } };
    case 'fiche':
      return seg[1] && !seg[2] ? { id: 'fiche', params: { id: seg[1] } } : { inconnu: true };
    case 'outils':
      if (seg.length === 1) return { id: 'outils', params: {} };
      return ['formulation', 'saponification', 'convertisseur', 'reglementaire'].indexOf(seg[1]) >= 0 && !seg[2]
        ? { id: seg[1], params: {} } : { inconnu: true };
    case 'verifier':
      return seg[2] ? { inconnu: true } : { id: 'verifier', params: { numero: seg[1] || '' } };
    case 'revision': case 'objectifs': case 'competences': case 'recettes': case 'production':
    case 'paiements': case 'codes': case 'parrainage': case 'etat': case 'sauvegarde': case 'accessibilite':
      return seg.length === 1 ? { id: seg[0], params: {} } : { inconnu: true };
    case 'profil':
      if (seg[1] === 'modifier') return { id: 'profil-edit', params: {} };
      if (!seg[1]) return { vue: 'profil' };
      return { inconnu: true };
    case 'agenda': return seg.length === 1 ? { vue: 'agenda' } : { inconnu: true };
    case 'connexion':   return { entree: 'connexion' };
    case 'inscription': return { entree: 'inscription' };
    case 'invite':      return { entree: 'invite' };
    case 'notifications': case 'recherche': case 'videos': case 'telechargements': case 'badges':
    case 'aide': case 'parametres': case 'compte': case 'corrections': case 'abonnement':
    case 'tentatives': case 'certificats': case 'hors-ligne':
      return seg.length === 1 ? { id: seg[0], params: {} } : { inconnu: true };
    default: return { inconnu: true };
  }
}

/* l'adresse correspond-elle à un écran connu ? (utilisé par les tests) */
const connue = (chemin, recherche) => !analyser(chemin, recherche).inconnu;

const titreDe = (id, params) => {
  params = params || {};
  if (id === 'espace-formateur') return 'Espace formateur';
  if (id === 'hors-ligne') return 'Mode hors-ligne';
  return TITRES[id] || 'CosmétiLab';
};

/* ------------------------------------------------------------
   3. LIENS RÉELS
   Les contrôles de navigation (boutons d'écran, onglets, cartes,
   vidéos) portent une adresse : clic droit, nouvel onglet, « copier
   le lien » fonctionnent. Un clic normal reste instantané (le routeur
   intercepte l'événement).
   ------------------------------------------------------------ */
const CT = { connexion:'/connexion', inscription:'/inscription', invite:'/invite' };

function cheminDAttributs(d){
  if (d.page) return cheminDe(d.page, { id: d.id || '', tab: d.tab || '', quiz: d.quiz || '' });
  if (d.nav)  return cheminDe(d.nav === 'accueil' ? 'accueil' : d.nav, {});
  if (d.ct)   return CT[d.ct] || '';
  if (d.video) return '/video/' + ech(d.video);
  if (d.yt)   return '/video/' + ech(d.yt);
  return '';
}

function lieniser(racine){
  const host = racine || document;
  if (!host.querySelectorAll) return 0;
  let n = 0;
  host.querySelectorAll('button[data-page], button[data-nav], button[data-ct], button[data-video], button[data-yt]').forEach(b => {
    if (b.tagName !== 'BUTTON' || b.dataset.lien) return;
    const chemin = cheminDAttributs(b.dataset);
    if (!chemin) return;
    const a = document.createElement('a');
    Array.from(b.attributes).forEach(at => { if (at.name !== 'type') a.setAttribute(at.name, at.value); });
    a.setAttribute('href', chemin);
    a.setAttribute('data-lien', '1');
    const d = getComputedStyle(b).display;
    if (d) a.style.display = d;
    a.innerHTML = b.innerHTML;
    b.replaceWith(a);
    n++;
  });
  return n;
}

window.LHROUTES = {
  motifs: MOTIFS, cheminDe, analyser, connue, titreDe, parentDe, lieniser, cheminDAttributs,
  ongletsCours: ONGLETS_COURS, ongletsFormateur: ONGLETS_FORMATEUR
};
})();
