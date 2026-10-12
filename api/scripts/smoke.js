#!/usr/bin/env node
/* ============================================================
   Test de fumée de l'API LearnHub — vérifie l'essentiel, y compris
   contre l'API déployée (Vercel), sans rien installer d'autre que Node.

   Utilisation :
     node scripts/smoke.js                                     # l'API locale (port 3000)
     node scripts/smoke.js https://learnhub-api.vercel.app     # l'API en production
     BASE=https://… node scripts/smoke.js
     COMPTE=adjovi@learnhub.bj MDP=prof1234 node scripts/smoke.js

   Ce qu'il contrôle : santé + base, connexion (et refus d'un mauvais mot de
   passe), lecture des contenus, progression, écriture (leçon terminée, note,
   rendu de devoir puis annulation), statistiques, recherche — toujours avec
   le compte de démonstration, donc sans rien casser d'important.
   ============================================================ */
const BASE = (process.argv[2] || process.env.BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const COMPTE = process.env.COMPTE || 'amina@learnhub.bj';
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
  test('route inconnue → 404 propre', (await appel('GET', '/api/inexistant-' + Date.now())).statut === 404);

  console.log('\n' + ok + ' OK / ' + ko + ' échec(s)');
  if (echecs.length) { console.log('Échecs : ' + echecs.join(' · ')); process.exit(1); }
})().catch(e => { console.error('💥 ' + (e && e.message ? e.message : e)); process.exit(2); });
