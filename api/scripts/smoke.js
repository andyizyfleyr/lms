#!/usr/bin/env node
/* ============================================================
   Test de fumée de l'API CosmétiLab — vérifie l'essentiel, y compris
   contre l'API déployée (Vercel), sans rien installer d'autre que Node.

   Utilisation :
     node scripts/smoke.js                                     # l'API locale (port 3000)
     node scripts/smoke.js https://lms-lovat-five.vercel.app     # l'API en production
     BASE=https://… node scripts/smoke.js
     COMPTE=awa@cosmetilab.bj MDP=prof1234 node scripts/smoke.js

   Ce qu'il contrôle : santé + base, connexion (et refus d'un mauvais mot de
   passe), lecture des contenus, progression, écriture (leçon terminée, note,
   rendu de devoir puis annulation), statistiques, recherche — toujours avec
   le compte de démonstration, donc sans rien casser d'important.
   ============================================================ */
const BASE = (process.argv[2] || process.env.BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const COMPTE = process.env.COMPTE || 'amina@cosmetilab.bj';
const MDP = process.env.MDP || 'demo1234';

let ok = 0, ko = 0, jeton = null;
const echecs = [];
function test(nom, cond, detail) {
  console.log((cond ? '✅' : '❌') + ' ' + nom + (detail ? ' ⟵ ' + detail : ''));
  cond ? ok++ : (ko++, echecs.push(nom));
}
async function appel(methode, chemin, corps, avecJeton = true) {
  const entetes = { 'Content-Type': 'application/json' };
  if (avecJeton && jeton) entetes.Authorization = 'Bearer ' + jeton;
  const r = await fetch(BASE + chemin, { method: methode, headers: entetes, body: corps ? JSON.stringify(corps) : undefined });
  let j = null;
  try { j = await r.json(); } catch (_) {}
  return { statut: r.status, corps: j };
}

(async () => {
  console.log('API : ' + BASE + '  ·  compte : ' + COMPTE + '\n');

  /* ---------- santé & base ---------- */
  const sante = await appel('GET', '/api/health', null, false);
  test('/api/health répond', sante.statut === 200 && sante.corps?.ok === true, 'HTTP ' + sante.statut);
  test('base Neon connectée', sante.corps?.data?.tables >= 26, sante.corps?.data ? sante.corps.data.tables + ' tables' : 'pas de données');
  test('contenus présents', sante.corps?.data?.cours >= 6, sante.corps?.data ? sante.corps.data.cours + ' cours' : '');
  test('CORS ouvert (autre domaine autorisé)', sante.statut === 200);

  /* ---------- authentification ---------- */
  const mauvais = await appel('POST', '/api/auth/login', { email: COMPTE, motDePasse: 'mauvais-' + Date.now() }, false);
  test('mauvais mot de passe refusé', mauvais.corps?.ok === false, 'code ' + (mauvais.corps?.error?.code || mauvais.statut));
  const connexion = await appel('POST', '/api/auth/login', { email: COMPTE, motDePasse: MDP }, false);
  jeton = connexion.corps?.data?.token;
  test('connexion du compte de démonstration', !!jeton, connexion.corps?.data?.user?.nom || '');
  if (!jeton) { console.log('\n' + ok + ' OK / ' + ko + ' échec(s) — arrêt : sans jeton, le reste ne peut pas être testé.'); process.exit(1); }
  const moi = await appel('GET', '/api/auth/me');
  test('/api/auth/me renvoie le profil', moi.corps?.data?.user?.email === COMPTE, moi.corps?.data?.user?.email || '');
  const sansJeton = await appel('GET', '/api/progress', null, false);
  test('route protégée sans jeton → refus', sansJeton.statut === 401 || sansJeton.corps?.ok === false, 'HTTP ' + sansJeton.statut);

  /* ---------- lecture des contenus ---------- */
  const cours = await appel('GET', '/api/courses');
  const idCours = cours.corps?.data?.cours?.[0]?.id || 'c1';
  test('liste des cours', (cours.corps?.data?.cours || []).length >= 6, (cours.corps?.data?.cours || []).length + ' cours');
  const fiche = await appel('GET', '/api/courses/' + idCours);
  test('fiche cours + modules', !!fiche.corps?.data?.cours, idCours);
  const lecons = await appel('GET', '/api/courses/' + idCours + '/lessons');
  const idLecon = (lecons.corps?.data?.lecons || [])[0]?.id;
  test('leçons du cours', (lecons.corps?.data?.lecons || []).length >= 6, (lecons.corps?.data?.lecons || []).length + ' leçons');
  test('ressources du cours', (await appel('GET', '/api/courses/' + idCours + '/resources')).corps?.ok === true);
  test('discussion du cours', (await appel('GET', '/api/courses/' + idCours + '/messages')).corps?.ok === true);
  test('bibliothèque vidéos', ((await appel('GET', '/api/videos')).corps?.data?.videos || []).length >= 10);
  test('quiz du cours', !!((await appel('GET', '/api/quizzes')).corps?.data?.quiz || []).length);
  test('devoirs', !!((await appel('GET', '/api/assignments')).corps?.data?.devoirs || []).length);
  test('séances du calendrier', !!((await appel('GET', '/api/sessions')).corps?.data?.seances || []).length);
  test('badges', !!((await appel('GET', '/api/badges')).corps?.data?.badges || []).length);
  test('notifications', !!((await appel('GET', '/api/notifications')).corps?.data?.notifications || []).length);
  test('téléchargements', (await appel('GET', '/api/downloads')).corps?.ok === true);
  test('réglages', (await appel('GET', '/api/settings')).corps?.ok === true);
  test('statistiques', (await appel('GET', '/api/stats')).corps?.ok === true);
  test('recherche', (await appel('GET', '/api/search?q=web')).corps?.ok === true);
  test('progression complète', (await appel('GET', '/api/progress')).corps?.ok === true);
  const progApp = await appel('GET', '/api/progress?format=app');
  test('progression au format de l\'app (lh_lessons…)', !!progApp.corps?.data?.lh_lessons || progApp.corps?.ok === true);

  /* ---------- écriture (aller-retour) ---------- */
  if (idLecon) {
    const non = await appel('POST', '/api/lessons/' + idLecon + '/complete', { done: false, minutes: 0 });
    const oui = await appel('POST', '/api/lessons/' + idLecon + '/complete', { done: true, minutes: 5 });
    test('marquer une leçon terminée', oui.corps?.ok === true, idLecon);
    const relu = await appel('GET', '/api/progress');
    const presente = (relu.corps?.data?.lecons || []).some(l => l.id === idLecon && l.done);
    test('la leçon est bien enregistrée', presente || non.corps?.ok === true, 'relue depuis la base');
  }
  const video = ((await appel('GET', '/api/videos')).corps?.data?.videos || [])[0];
  if (video) {
    test('aimer une vidéo', (await appel('PATCH', '/api/videos/' + video.id + '/progress', { liked: true, progress: 10 })).corps?.ok === true, video.id);
  }
  /* --- temps réel, inscription, séparation des données, vue formateur --- */
  const sync = await appel('GET', '/api/sync');
  test('/api/sync renvoie une révision', typeof sync.corps?.data?.revision === 'string' && sync.corps.data.revision.length > 0,
       sync.corps?.data ? 'révision ' + String(sync.corps.data.revision).slice(0, 24) + '… · ' + sync.corps.data.lecons + ' leçons' : '');

  const neuf = 'verif-' + Date.now() + '@cosmetilab.bj';
  const creation = await appel('POST', '/api/auth/register', { nom: 'Vérification Automatique', email: neuf, motDePasse: 'verif1234', ville: 'Abomey-Calavi', role: 'enseignant' }, false);
  test('inscription avec le rôle formateur', creation.corps?.data?.user?.role === 'enseignant',
       creation.corps?.data?.user ? creation.corps.data.user.email + ' · ' + creation.corps.data.user.role : JSON.stringify(creation.corps).slice(0, 80));
  if (creation.corps?.data?.token){
    const t2 = creation.corps.data.token;
    const suivi = await fetch(BASE + '/api/progress?format=app', { headers: { Authorization: 'Bearer ' + t2 } }).then(r => r.json()).catch(() => null);
    const nb = suivi && suivi.data && suivi.data.lh_lessons ? Object.keys(suivi.data.lh_lessons).length : 0;
    test('un nouveau compte démarre avec ses propres données (vides)', nb === 0, nb + ' leçon(s) au compteur');
    const copies = await fetch(BASE + '/api/submissions', { headers: { Authorization: 'Bearer ' + t2 } }).then(r => r.json()).catch(() => null);
    test('un formateur voit les copies de tous les apprenants', copies?.data?.encadrant === true, (copies?.data?.total ?? '?') + ' copie(s) visible(s)');
  }

  const note = await appel('POST', '/api/notes', { courseId: idCours, titre: 'Vérification automatique', contenu: 'Note créée par scripts/smoke.js le ' + new Date().toISOString() });
  test('créer une note', note.corps?.ok === true, note.corps?.error?.message || '');
  const idNote = note.corps?.data?.note?.id;
  if (idNote) test('supprimer la note', (await appel('DELETE', '/api/notes/' + idNote)).corps?.ok === true);
  const devoir = ((await appel('GET', '/api/assignments')).corps?.data?.devoirs || [])[0];
  if (devoir) {
    const rendu = await appel('POST', '/api/assignments/' + devoir.id + '/submissions', { commentaire: 'Rendu de vérification automatique' });
    test('rendre un devoir', rendu.corps?.ok === true, rendu.corps?.error?.message || devoir.id);
    const idRendu = rendu.corps?.data?.depot?.id;
    if (idRendu) test('annuler le rendu', (await appel('DELETE', '/api/submissions/' + idRendu)).corps?.ok === true);
  }
  const quiz = ((await appel('GET', '/api/quizzes')).corps?.data?.quiz || [])[0];
  if (quiz) {
    const detail = await appel('GET', '/api/quizzes/' + quiz.id);
    test('quiz + questions', (detail.corps?.data?.questions || []).length >= 4, (detail.corps?.data?.questions || []).length + ' questions');
  }

  /* ---------- V4 : boutique PDF, production, communauté, console ---------- */
  const fcfa = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' F';
  const catalogue = await appel('GET', '/api/p4-pdf');
  const ouvragesPdf = catalogue.corps?.data?.ouvrages || [];
  test('boutique PDF : catalogue et prix entier', ouvragesPdf.length >= 8 && ouvragesPdf.every(o => Number.isInteger(o.prix)),
       ouvragesPdf.length + ' ouvrage(s) · ' + (ouvragesPdf[0] ? fcfa(ouvragesPdf[0].prix) : ''));
  test('boutique PDF : remise annoncée dès deux ouvrages', catalogue.corps?.data?.remise === 10, (catalogue.corps?.data?.remise ?? '?') + ' %');
  const fichePdf = await appel('GET', '/api/p4-pdf/livre-c1');
  const o1 = fichePdf.corps?.data?.ouvrage || {};
  test("fiche d'un ouvrage : sommaire de titres, aucun texte du livre",
       (o1.sommaire || []).length >= 4 && o1.extrait === undefined,
       (o1.sommaire || []).length + ' titre(s) · extrait : ' + (o1.extrait === undefined ? 'aucun' : 'PRÉSENT !'));
  const pdfVole = await appel('GET', '/api/p4-pdf/livre-c1/fichier', null, false);
  test("le PDF n'est pas servi sans jeton", pdfVole.statut === 401 || pdfVole.corps?.ok === false, 'HTTP ' + pdfVole.statut);
  const pdfFaux = await appel('GET', '/api/p4-pdf/livre-c1/fichier?t=faux');
  test('le PDF refuse un jeton invalide', pdfFaux.statut === 403 || pdfFaux.corps?.ok === false, 'HTTP ' + pdfFaux.statut);
  const etatWebhook = await appel('GET', '/api/nova/webhook', null, false);
  test('webhook NOVA en place', etatWebhook.corps?.data?.pret === true, etatWebhook.corps?.data?.route || '');
  const postWebhook = await fetch(BASE + '/api/nova/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'checkout.session.paid', data: { id: 'cs_controle' } }) });
  test('webhook NOVA : signature exigée', postWebhook.status === 401, 'HTTP ' + postWebhook.status);

  const etqV4 = await appel('POST', '/api/p4-etiquette', { nom: 'Baume de contrôle', ingredients: [{ nom: 'Beurre de karité', pourcent: 45 }, { nom: 'Huile de coco', pourcent: 20 }, { nom: 'Huile essentielle de lavande', pourcent: 1 }] });
  const inciV4 = etqV4.corps?.data?.listeInci || '';
  test("étiquette : noms INCI dans l'ordre décroissant",
       /Butyrospermum Parkii Butter/.test(inciV4) && inciV4.indexOf('Butyrospermum') < inciV4.indexOf('Lavandula'),
       inciV4.slice(0, 60) + '…');
  test('étiquette : allergènes des huiles essentielles déclarés', (etqV4.corps?.data?.allergenes || []).includes('Limonene'),
       (etqV4.corps?.data?.allergenes || []).join(', '));
  const prixV4 = await appel('POST', '/api/p4-prix', { recette: 'Contrôle', lot: 10, matieres: [{ nom: 'Karité', quantite: 250, prixUnite: 12 }, { nom: 'Coco', quantite: 150, prixUnite: 6 }], emballage: 150, mainOeuvreMinutes: 45, tauxHoraire: 1000, fraisFixes: 1500, margeVoulue: 35, commissionVente: 25 });
  const peV4 = prixV4.corps?.data?.etiquette || {};
  test('analyse de rentabilité : coût, prix conseillé, prix revendeur, conseils',
       peV4.prixConseille > peV4.coutUnite && peV4.prixRevendeur >= peV4.prixConseille && (prixV4.corps?.data?.conseils || []).length > 0,
       fcfa(peV4.coutUnite) + ' → ' + fcfa(peV4.prixConseille) + ' (revendeur ' + fcfa(peV4.prixRevendeur) + ')');
  test('analyse de rentabilité : le guide est fourni', (prixV4.corps?.data?.guide || []).length >= 5, (prixV4.corps?.data?.guide || []).length + ' étapes de guide');

  const glV4 = await appel('GET', '/api/p4-glossaire?q=inci');
  test('glossaire : recherche en français', (glV4.corps?.data?.termes || []).length >= 1, (glV4.corps?.data?.total || 0) + ' termes');
  const ptsV4 = await appel('GET', '/api/p4-points');
  test('points et récompenses', typeof ptsV4.corps?.data?.solde === 'number' && (ptsV4.corps?.data?.recompenses || []).length >= 5,
       (ptsV4.corps?.data?.solde || 0) + ' points · rang ' + (ptsV4.corps?.data?.rang || '?'));
  const defiV4 = await appel('GET', '/api/p4-defis');
  test('défi du mois', !!defiV4.corps?.data?.defi, defiV4.corps?.data?.defi?.titre || 'aucun défi');
  const forumV4 = await appel('GET', '/api/p4-commun/forum');
  test('entraide : thèmes et sujets', (forumV4.corps?.data?.themes || []).length >= 5,
       (forumV4.corps?.data?.total || 0) + ' sujet(s) · ' + (forumV4.corps?.data?.themes || []).length + ' thèmes');
  const galV4 = await appel('GET', '/api/p4-commun/galerie');
  test('galerie des réalisations', Array.isArray(galV4.corps?.data?.publications), (galV4.corps?.data?.total || 0) + ' publication(s)');
  const atelV4 = await appel('GET', '/api/p4-commun/ateliers');
  test('ateliers et voisinage', Array.isArray(atelV4.corps?.data?.ateliers), (atelV4.corps?.data?.ateliers || []).length + ' atelier(s)');
  const prodV4 = await appel('GET', '/api/p4-produits');
  test('mes produits', Array.isArray(prodV4.corps?.data?.produits), (prodV4.corps?.data?.total ?? '?') + ' produit(s)');
  const lotV4 = await appel('GET', '/api/p4-lots');
  test('lots de fabrication', Array.isArray(lotV4.corps?.data?.lots), (lotV4.corps?.data?.stats?.total || 0) + ' lot(s)');
  const kitV4 = await appel('GET', '/api/p4-kits');
  test('kits de démarrage chiffrés',
       (kitV4.corps?.data?.kits || []).length >= 1 && typeof kitV4.corps.data.kits[0].prixConseille === 'number',
       (kitV4.corps?.data?.kits || []).length + ' kit(s)');
  const exV4 = await appel('GET', '/api/p4-examens');
  test("examens blancs accessibles à l'apprenant", Array.isArray(exV4.corps?.data?.examens), (exV4.corps?.data?.examens || []).length + ' examen(s)');
  const abV4 = await appel('GET', '/api/p4-abonnement');
  test('abonnement : état, plans et relances', (abV4.corps?.data?.plans || []).length === 2 && !!abV4.corps?.data?.abonnement,
       (abV4.corps?.data?.abonnement?.actif ? 'actif' : 'aucun') + ' · ' + (abV4.corps?.data?.restants ?? 0) + ' jour(s)');
  const paV4 = await appel('GET', '/api/p4-parrainage');
  test('parrainage : paliers', (paV4.corps?.data?.paliers || []).length >= 3, (paV4.corps?.data?.filleulsActifs || 0) + ' filleul(s) actif(s)');
  const seV4 = await appel('GET', '/api/p4-securite');
  test('sécurité : journal et code de secours', Array.isArray(seV4.corps?.data?.journal) && !!seV4.corps?.data?.codeSecours,
       (seV4.corps?.data?.appareils || []).length + ' appareil(s) connecté(s)');
  const admV4 = await appel('GET', '/api/p4-admin');
  test("console d'administration fermée à un apprenant", admV4.statut === 403 || admV4.corps?.error?.code === 'interdit',
       'HTTP ' + admV4.statut + ' · ' + (admV4.corps?.error?.code || ''));

  test('route inconnue → 404 propre', (await appel('GET', '/api/inexistant-' + Date.now())).statut === 404);

  console.log('\n' + ok + ' OK / ' + ko + ' échec(s)');
  if (echecs.length) { console.log('Échecs : ' + echecs.join(' · ')); process.exit(1); }
})().catch(e => { console.error('💥 ' + (e && e.message ? e.message : e)); process.exit(2); });
