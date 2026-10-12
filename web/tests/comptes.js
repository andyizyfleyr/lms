#!/usr/bin/env node
/* ============================================================
   Suite « comptes et temps réel » — CosmétiLab

   Elle vérifie, dans un Chromium mobile réel et contre l'API Next.js,
   les promesses de cette version :
     • écran de compte au premier lancement (connexion, inscription, invité)
     • inscription réelle d'un nouvel apprenant
     • DONNÉES SÉPARÉES : chaque compte a son propre espace
     • SYNCHRONISATION EN TEMPS RÉEL : une modification faite ailleurs
       arrive dans l'application sans rechargement
     • espace formateur : voir les copies des apprenants et les noter

   Utilisation :
     LEARNHUB_API_URL=http://127.0.0.1:3000 LEARNHUB_SITE_URL=http://127.0.0.1:3000 \
       node tests/comptes.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { demarrer } = require('./serveur');

const WEB = path.join(__dirname, '..');
const PAGE = path.join(WEB, 'index.html');
const API = (process.env.LEARNHUB_API_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const SITE_EXTERNE = (process.env.LEARNHUB_SITE_URL || '').replace(/\/+$/, '');
const ELEVE = { email: process.env.LEARNHUB_COMPTE || 'amina@cosmetilab.bj', mdp: process.env.LEARNHUB_MDP || 'demo1234' };
const PROF  = { email: process.env.LEARNHUB_PROF || 'awa@cosmetilab.bj', mdp: process.env.LEARNHUB_PROF_MDP || 'prof1234' };
const ADMIN = { email: process.env.LEARNHUB_ADMIN || 'admin@cosmetilab.bj', mdp: process.env.LEARNHUB_ADMIN_MDP || 'admin1234' };

function chargerPlaywright() {
  const essais = [
    'playwright-core',
    path.join(WEB, '..', 'outils', 'node_modules', 'playwright-core'),
    path.join(WEB, '..', '..', 'outils', 'node_modules', 'playwright-core'),
    path.join(WEB, 'node_modules', 'playwright-core'),
    path.join(WEB, '..', 'api', 'node_modules', 'playwright-core'),
    path.join(WEB, '..', 'node_modules', 'playwright-core')
  ];
  for (const e of essais) { try { return require(e); } catch (_) {} }
  console.error('❌ playwright-core introuvable (npm i -D playwright-core && npx playwright-core install chromium)');
  process.exit(2);
}
const { chromium } = chargerPlaywright();

let ok = 0, ko = 0;
const echecs = [];
const test = (nom, cond, detail) => {
  console.log((cond ? '  ✅ ' : '  ❌ ') + nom + (detail ? ' ⟵ ' + detail : ''));
  if (cond) ok++; else { ko++; echecs.push(nom + (detail ? ' (' + detail + ')' : '')); }
};
const titre = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 62 - t.length)));
const dormir = ms => new Promise(r => setTimeout(r, ms));

/* Remplit un formulaire puis vérifie que les valeurs ont bien pris :
   l'application peut réafficher sa vue (re-rendu), on retente alors. */
async function remplir(page, paires) {
  for (let essai = 0; essai < 4; essai++){
    for (const [sel, val] of paires){
      try { await page.fill(sel, val); } catch (e) {}
    }
    const ok = await page.evaluate(valeurs => valeurs.every(([sel, val]) => {
      const e = document.querySelector(sel);
      return !!e && e.value === val;
    }), paires);
    if (ok) return true;
    await dormir(400);
  }
  return false;
}

/* Connexion en cours d'exécution : l'application recharge après validation.
   On attend ensuite que le compte soit bien celui demandé (jeton serveur). */
async function connecterViaEcran(page, { email, mdp }) {
  await dormir(700);                            // une inscription peut déclencher un rechargement
  await page.evaluate(() => {
    try { localStorage.removeItem('lh:compte'); localStorage.removeItem('lh_token'); localStorage.removeItem('lh_synced'); } catch (e) {}
  });
  await page.goto(SITE_EXTERNE ? SITE_EXTERNE + '/' : 'file://' + PAGE, { waitUntil: 'load' });
  await page.waitForSelector('#loginScreen', { timeout: 15000 });
  await dormir(600);                            // écran d'entrée stabilisé
  await page.evaluate(() => { const b = document.querySelector('[data-ct="connexion"]'); if (b) b.click(); });
  await page.waitForSelector('#ctPwd', { timeout: 8000 });
  const rempli = await remplir(page, [['#ctMail', email], ['#ctPwd', mdp]]);
  if (!rempli) throw new Error('formulaire de connexion non rempli (' + email + ')');
  await page.evaluate(() => document.querySelector('#ctValider').click());
  try {
    await page.waitForFunction(mail => {
      const c = window.LHCOMPTE && window.LHCOMPTE.compte();
      return !!(c && c.token && c.email === mail);
    }, email, { timeout: 25000 });
  } catch (e) {
    const msg = await page.evaluate(() => { const x = document.querySelector('#ctErr'); return x && !x.hidden ? x.textContent : '(aucun message)'; });
    throw new Error('connexion impossible pour ' + email + ' : ' + msg);
  }
  await page.waitForTimeout(900);
}

/* Attend que la synchronisation ait rempli la progression locale */
async function attendreLecons(page, mini, maxMs) {
  const fin = Date.now() + maxMs;
  let n = 0;
  while (Date.now() < fin) {
    n = await leconsFaites(page);
    if (n >= mini) return n;
    await dormir(600);
  }
  return n;
}

const leconsFaites = page => page.evaluate(() =>
  Object.keys(window.APPX.S.lessons || {}).filter(k => window.APPX.S.lessons[k]).length);

(async () => {
  const e = require('fs').existsSync(PAGE) ? fs.statSync(PAGE) : null;
  const site = SITE_EXTERNE ? { url: SITE_EXTERNE, fermer: () => {} } : demarrer(path.join(WEB, 'index.html'), 0);
  const base = SITE_EXTERNE ? SITE_EXTERNE : await site.url;
  const erreurs = [];

  const nav = await chromium.launch({ args: ['--no-sandbox'] });
  const contexte = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await contexte.newPage();
  page.on('pageerror', err => erreurs.push('page : ' + err.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::ERR_|Permissions policy violation/.test(t)) return;
    erreurs.push('console : ' + t);
  });

  console.log('CosmétiLab — comptes et temps réel · ' + base + ' · ' + new Date().toLocaleString('fr-FR'));

  /* ---------- A. écran de compte ---------- */
  titre('A. Écran de compte au premier lancement');
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForSelector('#loginScreen', { timeout: 15000 });
  const entrees = await page.evaluate(() => Array.from(document.querySelectorAll('[data-ct]')).map(b => b.dataset.ct));
  test('l’écran d’entrée s’affiche', await page.isVisible('#loginScreen'));
  test('trois chemins proposés (connexion, inscription, sans compte)',
       entrees.includes('connexion') && entrees.includes('inscription') && entrees.includes('invite'), entrees.join(', '));
  test('l’écran indique le serveur utilisé', /Serveur détecté|mode local/.test(await page.innerText('#ctServeur')), (await page.innerText('#ctServeur')).slice(0, 60));

  /* l'espace « sans compte » ne doit pas emprunter l'identité d'une démo */
  await page.evaluate(() => document.querySelector('[data-ct="invite"]').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => { const b = document.querySelector('[data-ct="invite-go"]'); if (b) b.click(); });
  await page.waitForFunction(() => !!(window.APPX && window.LHCOMPTE && window.LHCOMPTE.compte() && window.LHCOMPTE.compte().id === 'invite'), null, { timeout: 15000 });
  await page.waitForTimeout(900);
  const invite = await page.evaluate(() => document.querySelector('#topBar h1').textContent);
  test('sans compte, l’en-tête affiche « Invité »', invite === 'Invité', invite);

  /* retour à l'écran d'entrée pour la suite */
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForSelector('#loginScreen', { timeout: 15000 });

  /* ---------- B. inscription d'un nouvel apprenant ---------- */
  titre('B. Inscription d’un nouvel apprenant');
  const neuf = 'eleve-' + Date.now() + '@cosmetilab.bj';
  await page.evaluate(() => document.querySelector('[data-ct="inscription"]').click());
  await page.waitForSelector('#ctNom', { timeout: 5000 });
  const champsRole = await page.evaluate(() => document.querySelectorAll('[data-ctrole]').length);
  test('le formulaire propose apprenant ou formateur', champsRole === 2, champsRole + ' choix');
  const saisi = await remplir(page, [['#ctNom', 'Aïcha Test'], ['#ctMail', neuf], ['#ctPwd', 'test1234'], ['#ctVille', 'Abomey-Calavi']]);
  test('formulaire d’inscription rempli', saisi);
  await page.evaluate(() => document.querySelector('#ctValider').click());
  await page.waitForFunction(() => !!(window.APPX && window.LHCOMPTE && window.LHCOMPTE.compte() && window.LHCOMPTE.jeton()), null, { timeout: 25000 });
  await page.waitForTimeout(800);
  const nouveau = await page.evaluate(() => window.LHCOMPTE.compte());
  test('compte créé et session ouverte', !!nouveau && nouveau.email === neuf && !!nouveau.token, nouveau ? nouveau.email + ' · ' + nouveau.role : 'aucun');
  test('jeton serveur reçu (compte réel, pas local)', !!(nouveau && nouveau.token && nouveau.token.length > 20));
  await page.waitForTimeout(2500);            // identité + statistiques du compte
  const ident = await page.evaluate(() => ({
    nom: document.querySelector('#topBar h1').textContent,
    initiales: document.querySelector('#avatarBtn').textContent,
    serie: document.querySelector('#statSerie').textContent,
    heures: document.querySelector('#statHeures').textContent,
    amina: /Amina/.test(document.body.innerText)
  }));
  test('l’en-tête affiche le nom de CE compte', ident.nom === 'Aïcha Test' && ident.initiales === 'AT',
       ident.nom + ' · ' + ident.initiales);
  test('aucune trace du profil de démonstration', ident.amina === false && ident.serie === '0 j',
       'série ' + ident.serie + ' · ' + ident.heures);
  const debut = await leconsFaites(page);
  test('le nouvel apprenant démarre à zéro', debut === 0, debut + ' leçon(s)');
  const serveurZero = await page.evaluate(async u => {
    const j = await fetch(u + '/api/progress?format=app', { headers: { Authorization: 'Bearer ' + localStorage.getItem('lh_token') } }).then(r => r.json());
    return j && j.ok ? Object.keys(j.data.lh_lessons || {}).length : -1;
  }, API);
  test('et le serveur ne lui attribue rien d’autre', serveurZero === 0, serveurZero + ' leçon(s) côté API');

  /* ---------- C. données séparées ---------- */
  titre('C. Données séparées d’un compte à l’autre');
  await page.evaluate(() => {
    const k = Object.keys(window.APPX.LESSONS)[0];
    const faites = window.APPX.S.lessons || {};
    for (let i = 0; i < window.APPX.LESSONS[k].length; i++){ const c = k + ':' + i; if (!faites[c]) { window.APPX.S.lessons[c] = 1; break; } }
    window.APPX.persist();
  });
  await dormir(900);
  const eleve1 = await leconsFaites(page);
  test('l’apprenant terminé une leçon dans SON espace', eleve1 === 1, eleve1 + ' leçon');

  await connecterViaEcran(page, ELEVE);
  const chezAmina = await attendreLecons(page, 5, 20000);
  const amina = await page.evaluate(() => window.LHCOMPTE.compte());
  test('le compte de démonstration garde SES données', amina.email === ELEVE.email && chezAmina >= 5,
       amina.email + ' · ' + chezAmina + ' leçons (dont celles venues du serveur)');

  await connecterViaEcran(page, { email: neuf, mdp: 'test1234' });
  const retour = await leconsFaites(page);
  test('en revenant sur le nouvel compte, rien n’a été mélangé', retour === 1, retour + ' leçon(s)');

  /* ---------- D. synchronisation en temps réel ---------- */
  titre('D. Synchronisation en temps réel (sans rechargement)');
  /* Un compte neuf pour être sûr qu'il reste des leçons à terminer : on se
     connecte dans l'app, puis on agit « depuis un autre appareil » (API). */
  const rt = 'direct-' + Date.now() + '@cosmetilab.bj';
  const cree = await fetch(API + '/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: 'Compte Temps Réel', email: rt, motDePasse: 'test1234', ville: 'Abomey-Calavi' })
  }).then(r => r.json()).catch(() => null);
  const corps = cree && (cree.data || cree);
  test('compte neuf créé pour le test temps réel', !!(corps && corps.token));

  /* Les cours sont payants : l'administrateur ouvre le cours c1 à ce compte
     (même mécanisme que l'offre commerciale), sinon aucune leçon ne peut
     être terminée. */
  const jetonAdm = await fetch(API + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN.email, motDePasse: ADMIN.mdp })
  }).then(r => r.json()).then(j => (j.data || j).token).catch(() => '');
  const offre = jetonAdm ? await fetch(API + '/api/acces/offrir', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jetonAdm },
    body: JSON.stringify({ email: rt, cours: ['c1'], jours: 30 })
  }) : null;
  test('accès au cours offert par l’administrateur (cours payant)', !!(offre && offre.ok), offre ? 'cours c1 ouvert' : 'échec de l’offre');

  await connecterViaEcran(page, { email: rt, mdp: 'test1234' });
  const avant = await leconsFaites(page);
  test('ce compte neuf démarre bien à zéro', avant === 0, avant + ' leçon(s)');

  const jeton = await page.evaluate(() => localStorage.getItem('lh_token'));
  const liste = await fetch(API + '/api/courses/c1/lessons', { headers: { Authorization: 'Bearer ' + jeton } })
    .then(r => r.json()).then(j => (j.data && j.data.lecons) || []).catch(() => []);
  const cible = liste.length ? liste[0].id : '';
  let marque = false;
  if (cible){
    const r = await fetch(API + '/api/lessons/' + encodeURIComponent(cible) + '/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jeton }, body: '{}'
    });
    marque = r.ok;
  }
  test('une leçon est terminée « depuis un autre appareil » (appel direct à l’API)', marque, cible || 'aucune leçon disponible');

  let majAuto = false;
  for (let i = 0; i < 16 && !majAuto; i++){
    await dormir(1000);
    majAuto = (await leconsFaites(page)) > avant;
  }
  /* l'indicateur doit finir par annoncer une synchronisation (premier relevé rapide) */
  let etat = '';
  for (let i = 0; i < 10; i++){
    etat = await page.evaluate(() => window.LHCOMPTE.resumeDirect());
    if (/Synchronisé/.test(etat)) break;
    await dormir(1000);
  }
  test('l’application se met à jour toute seule (≤ 16 s, sans recharger)', majAuto,
       avant + ' → ' + (await leconsFaites(page)) + ' leçons · état : ' + etat);
  test('l’indicateur affiche l’état de synchronisation', /Synchronisé/.test(etat), etat);

  /* ---------- E. espace formateur ---------- */
  titre('E. Espace formateur : copies et notation');
  await connecterViaEcran(page, PROF);
  const role = await page.evaluate(() => window.LHCOMPTE.compte().role);
  test('connexion d’une formatrice', role === 'enseignant', role);
  const entree = await page.evaluate(() => { const r = document.getElementById('rowCorrections'); return r ? !r.hidden : false; });
  test('l’entrée « Corrections » est visible dans le profil', entree);
  await page.evaluate(() => window.APPX.pushPage('corrections', {}));
  await page.waitForSelector('#ctCopies', { timeout: 8000 });
  await dormir(1500);
  const copies = await page.evaluate(() => document.querySelectorAll('[data-copie]').length);
  test('la liste des copies déposées s’affiche', copies >= 1, copies + ' copie(s)');
  const aNoter = await page.evaluate(() => { const b = document.querySelector('[data-copie]'); return b ? b.dataset.copie : ''; });
  await page.evaluate(id => document.querySelector('[data-copie="' + id + '"]').click(), aNoter);
  await page.waitForSelector('#ctNote', { timeout: 6000 });
  await page.fill('#ctNote', '15');
  await page.fill('#ctCom', 'Bon travail — vérifiez le pH.');
  await page.evaluate(() => {
    const d = Array.from(document.querySelectorAll('.dialog, .sheet, [role="dialog"]')).pop();
    const b = d && (d.querySelector('[data-ok]') || d.querySelector('.btn--filled'));
    if (b) b.click();
  });
  await dormir(1800);
  const noteServeur = await fetch(API + '/api/submissions', { headers: { Authorization: 'Bearer ' + await page.evaluate(() => localStorage.getItem('lh_token')) } })
    .then(r => r.json()).catch(() => null);
  const notee = ((noteServeur && noteServeur.data && noteServeur.data.depots) || []).find(s => String(s.id) === String(aNoter));
  test('la note est enregistrée côté serveur', !!notee && Number(notee.note) === 15,
       notee ? 'note ' + notee.note + '/20 · « ' + String(notee.commentaire || '').slice(0, 30) + ' »' : 'copie introuvable');

  /* ---------- bilan ---------- */
  titre('Bilan');
  test('aucune erreur JavaScript sur l’ensemble du parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
  console.log('\n' + ok + ' OK / ' + ko + ' échec(s)');
  if (echecs.length){ console.log('\nÉchecs :'); echecs.forEach(x => console.log('  • ' + x)); }
  await contexte.close(); await nav.close(); site.fermer();
  process.exit(ko ? 1 : 0);
})().catch(err => { console.error('\n💥 Suite interrompue :', err.message); process.exit(1); });
