#!/usr/bin/env node
/* ============================================================
   Suite de tests navigateur — CosmétiLab (web/index.html)

   Elle ouvre l'application dans un Chromium mobile réel (390 × 844),
   la pilote comme un utilisateur (tap sur les onglets, ouverture d'une
   fiche de cours, bouton « retour », lecteur vidéo, réglages) et vérifie
   ce qui doit toujours fonctionner avant une publication.

   Utilisation :
     node tests/navigateur.js
     LEARNHUB_API_URL=http://127.0.0.1:3000 node tests/navigateur.js
       → ajoute le test de synchronisation application ↔ API Next.js

   Prérequis : playwright-core + un Chromium (npx playwright-core install chromium).
   Le script cherche playwright-core dans plusieurs emplacements et
   affiche la commande à lancer s'il ne le trouve pas.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { demarrer } = require('./serveur');

const WEB = path.join(__dirname, '..');
const PAGE = path.join(WEB, 'index.html');
const API = (process.env.LEARNHUB_API_URL || '').replace(/\/+$/, '');
const SITE_EXTERNE = (process.env.LEARNHUB_SITE_URL || '').replace(/\/+$/, '');   // ex. http://127.0.0.1:3000 (site + API même domaine)
const COMPTE  = { email: process.env.LEARNHUB_COMPTE || 'amina@cosmetilab.bj', mdp: process.env.LEARNHUB_MDP || 'demo1234' };
const FORMATEUR = { email: process.env.LEARNHUB_PROF || 'awa@cosmetilab.bj', mdp: process.env.LEARNHUB_PROF_MDP || 'prof1234' };

/* ---------- playwright-core : on cherche sans imposer d'installation ---------- */
function chargerPlaywright() {
  const essais = [
    'playwright-core',
    path.join(WEB, '..', 'outils', 'node_modules', 'playwright-core'),
    path.join(WEB, '..', '..', 'outils', 'node_modules', 'playwright-core'),
    path.join(WEB, 'node_modules', 'playwright-core'),
    path.join(WEB, '..', 'api', 'node_modules', 'playwright-core'),
    path.join(WEB, '..', 'node_modules', 'playwright-core')
  ];
  for (const e of essais) { try { return require(e); } catch (_) { /* suivant */ } }
  console.error('❌ playwright-core introuvable.\n   Installez-le puis relancez :\n' +
                '     npm i -D playwright-core && npx playwright-core install chromium\n' +
                '   (ou depuis le dossier outils/ du dépôt).');
  process.exit(2);
}
const { chromium } = chargerPlaywright();

/* ---------- résultats ---------- */
let ok = 0, ko = 0;
const echecs = [];
function test(nom, cond, detail) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + nom + (detail ? ' ⟵ ' + detail : ''));
  if (cond) ok++; else { ko++; echecs.push(nom + (detail ? ' (' + detail + ')' : '')); }
}
const titre = t => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 62 - t.length)));

/* ---------- petites aides ---------- */
const dormir = ms => new Promise(r => setTimeout(r, ms));
const ouvertes = page => page.evaluate(() =>
  Array.from(document.querySelectorAll('section.page')).filter(e => !e.classList.contains('is-closing')).length);
const dessus = page => page.evaluate(() => { const t = window.APPX.topPage(); return t ? t.id : null; });
async function taper(page, sel, { attendreVisible = true, delai = 500 } = {}) {
  const el = page.locator(sel).first();
  try {
    if (attendreVisible) await el.waitFor({ state: 'visible', timeout: 8000 });
    await el.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
    await el.click({ timeout: 6000 });
    await dormir(delai);
    return true;
  } catch (e) { return false; }
}
const textePage = page => page.evaluate(() => (document.querySelector('#main') || document.body).innerText || '');

/* ============================================================ */
(async () => {
  if (!fs.existsSync(PAGE)) { console.error('❌ index.html absent — lancez d\'abord : node build.js'); process.exit(2); }
  const taille = Math.round(fs.statSync(PAGE).size / 1024);

  /* soit on sert nous-mêmes le fichier, soit on teste une URL déjà en ligne */
  const site = SITE_EXTERNE ? { url: SITE_EXTERNE, port: 0, fermer: async () => {} } : await demarrer(WEB, 0);
  const nav = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });
  const contexte = await nav.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'fr-FR', timezoneId: 'Africa/Porto-Novo'
  });
  /* Depuis cette version, l'application ouvre un écran de compte au premier
     lancement. Pour les contrôles d'interface, on démarre dans un espace
     « invité » (données locales) : l'écran d'entrée est testé à part, dans
     tests/comptes.js. */
  await contexte.addInitScript(() => {
    try {
      localStorage.setItem('lh:compte', JSON.stringify({ id: 'invite', nom: 'Invité', email: '', role: 'invite', token: '', depuis: Date.now() }));
    } catch (e) {}
  });

  const page = await contexte.newPage();

  /* hôtes autorisés : le site testé lui-même (origine courante) et le serveur local des tests */
  const HOTES_LOCAUX = new Set(['127.0.0.1', 'localhost', (() => { try { return new URL(site.url).hostname; } catch (e) { return ''; } })()]);
  const erreurs = [], externes = new Set(), requetes = [];
  page.on('pageerror', e => erreurs.push(String(e.message || e)));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    /* le test hors-ligne coupe le réseau volontairement : ces messages sont attendus */
    if (/Failed to load resource|net::ERR_|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|Permissions policy violation/.test(t)) return;
    /* seules les erreurs de NOTRE page comptent : les iframes YouTube tierces
       émettent leurs propres messages (politique de permissions, etc.) */
    const ou = m.location && m.location();
    if (ou && ou.url && site.url && ou.url.indexOf(site.url) !== 0 && ou.url.indexOf('file:') !== 0) return;
    erreurs.push('console : ' + t);
  });
  page.on('request', r => {
    try {
      const u = new URL(r.url());
      requetes.push(r.url());
      if (!HOTES_LOCAUX.has(u.hostname)) externes.add(u.hostname);
    } catch (_) {}
  });

  console.log('CosmétiLab — suite navigateur · ' + (SITE_EXTERNE ? 'URL en ligne ' + site.url : 'index.html ' + taille + ' Ko') +
              ' · ' + new Date().toLocaleString('fr-FR'));

  /* ============ A. chargement du fichier unique ============ */
  titre('A. Chargement (fichier unique)');
  await page.goto(SITE_EXTERNE ? site.url + '/' : site.url + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!(window.APPX && window.LHSYNC), null, { timeout: 20000 });

  test('titre de la page', /CosmétiLab/i.test(await page.title()), await page.title());
  test('modules applicatifs exposés', await page.evaluate(() => !!(window.APPX && window.LHSYNC && window.APPX.PAGES.cours)));
  test('aucune erreur JavaScript', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));
  const largeur = await page.evaluate(() => document.documentElement.scrollWidth);
  test('pas de débordement horizontal (390 px)', largeur <= 391, 'scrollWidth = ' + largeur + ' px');
  test('aucun appel à un domaine tiers au chargement', externes.size === 0, Array.from(externes).join(', '));
  test('aucune dépendance distante dans le fichier', !/<script[^>]+src=|<link[^>]+href=/i.test(fs.readFileSync(PAGE, 'utf8')));

  const pagesMortes = await page.evaluate(() =>
    Object.keys(window.APPX.PAGES).filter(k => typeof window.APPX.PAGES[k].render !== 'function'));
  test('aucune page morte (chaque page sait s\'afficher)', pagesMortes.length === 0,
       (await page.evaluate(() => Object.keys(window.APPX.PAGES).length)) + ' pages');
  console.log('  ℹ️  ' + (await page.evaluate(() => Object.keys(window.APPX.PAGES).length)) + ' pages enregistrées, ' +
              (await page.evaluate(() => document.querySelectorAll('[data-page]').length)) + ' points d\'ouverture');

  /* ============ B. les quatre onglets ============ */
  titre('B. Navigation par onglets');
  for (const [cle, libelle] of [['accueil', 'Accueil'], ['cours', 'Mes cours'], ['agenda', 'Agenda'], ['profil', 'Profil']]) {
    const clique = await taper(page, '#navBar .nav-item[data-nav="' + cle + '"]', { delai: 450 });
    const etat = await page.evaluate(c => {
      const b = document.querySelector('#navBar .nav-item[data-nav="' + c + '"]');
      const v = document.querySelector('#view-' + c);
      return { actif: b && b.getAttribute('aria-selected') === 'true', vue: !!v && v.classList.contains('is-active') };
    }, cle);
    test('onglet « ' + libelle + ' »', clique && etat.actif && etat.vue, etat.vue ? '' : 'vue non activée');
  }

  /* ============ C. ouverture / fermeture de pages (retour) ============ */
  titre('C. Ouverture des pages et retour');
  await taper(page, '#navBar .nav-item[data-nav="cours"]', { delai: 450 });
  const carte = await page.evaluate(() => { const c = document.querySelector('#view-cours [data-course]'); return c ? c.dataset.course : ''; });
  test('carte de cours présente', !!carte, carte || 'aucune carte');

  await taper(page, '#view-cours [data-course="' + carte + '"]', { delai: 900 });
  test('ouverture de la fiche de cours', (await dessus(page)) === 'cours', 'page du dessus : ' + (await dessus(page)));
  test('URL partageable (#cours/…)', /cours/.test(await page.evaluate(() => location.hash)), await page.evaluate(() => location.hash));

  const texteCours = await page.evaluate(() => {
    const el = document.querySelector('section.page[data-page="cours"]');
    return el ? el.innerText : '';
  });
  test('titre du cours affiché', texteCours.trim().length > 30, texteCours.split('\n')[0] || '');
  const nbLecons = await page.evaluate(() => document.querySelectorAll('section.page[data-page="cours"] .lesson').length);
  test('programme du cours (leçons)', nbLecons >= 6, nbLecons + ' leçons');

  const retour = await taper(page, 'section.page[data-page="cours"] [data-back]', { delai: 700 });
  test('bouton retour : fermeture de la fiche', retour && (await dessus(page)) === null && (await ouvertes(page)) === 0,
       'profondeur = ' + (await ouvertes(page)));

  /* trois niveaux empilés puis trois retours */
  await page.evaluate(c => { window.APPX.pushPage('cours', { id: c, tab: 'programme' }); }, carte);
  await dormir(600);
  await page.evaluate(() => { window.APPX.pushPage('videos', {}); });
  await dormir(600);
  await page.evaluate(() => { window.APPX.pushPage('parametres', {}); });
  await dormir(700);
  test('empilement de 3 pages', (await ouvertes(page)) === 3, 'profondeur = ' + (await ouvertes(page)));

  for (let i = 3; i >= 1; i--) {
    await taper(page, 'section.page[data-page]:last-of-type [data-back]', { delai: 650 });
    const restantes = await ouvertes(page);
    test('retour ' + (4 - i) + '/3 (profondeur ' + restantes + ')', restantes === i - 1, 'attendu ' + (i - 1));
  }

  /* retour « geste système » : bouton du navigateur / du téléphone */
  await page.evaluate(c => { window.APPX.pushPage('cours', { id: c }); }, carte);
  await dormir(700);
  await page.goBack();
  await dormir(800);
  const apresGeste = await ouvertes(page);
  test('bouton retour du téléphone (popstate)', apresGeste === 0, 'pages ouvertes = ' + apresGeste);

  /* ouverture directe par lien partagé */
  await page.goto(site.url + '/index.html#videos', { waitUntil: 'load' });
  await page.waitForFunction(() => !!(window.APPX && window.APPX.topPage()), null, { timeout: 15000 });
  await dormir(600);
  test('lien direct (#videos) ouvre la page', (await dessus(page)) === 'videos', 'page du dessus : ' + (await dessus(page)));

  /* ============ C bis. La fiche de cours ne se bloque jamais en bas ============
     Bug signalé : « la page sur laquelle s'affiche le cours de leçons reste
     coincée totalement en bas ». Cause : scrollIntoView() (ouverture de la
     leçon en cours) déplaçait aussi les racines de l'application — un élément
     en overflow:hidden reste défilable par programme — et la fiche restait
     décalée sans qu'aucun geste ne puisse la remettre en place.
     Ces contrôles interdisent le retour du bug. */
  titre('C bis. Défilement de la fiche de cours');
  await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
  await dormir(500);
  const racines = () => page.evaluate(() => {
    const app = document.querySelector('.app');
    const p = document.querySelector('section.page[data-page="cours"]');
    const sc = p && p.querySelector('.c-scroll');
    const bas = document.elementFromPoint(195, window.innerHeight - 14);
    return {
      app: app ? Math.round(app.scrollTop) : -1,
      html: Math.round(document.scrollingElement.scrollTop),
      win: Math.round(window.scrollY),
      pages: Array.from(document.querySelectorAll('section.page')).filter(e => e.scrollTop).length,
      pageTop: p ? Math.round(p.getBoundingClientRect().top) : null,
      mediaTop: p && p.querySelector('.page__media') ? Math.round(p.querySelector('.page__media').getBoundingClientRect().top) : null,
      cScroll: sc ? Math.round(sc.scrollTop) : null,
      cMax: sc ? Math.round(sc.scrollHeight - sc.clientHeight) : null,
      bas: bas ? (bas.id || bas.className || bas.tagName).toString().slice(0, 30) : null,
      sheet: (() => { const sh = document.querySelector('#sheet'); return sh ? sh.classList.contains('is-open') : null; })()
    };
  });
  const geste = async (y1, y2, n) => {
    const cdp = await contexte.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y1 }] });
    const pas = (y1 - y2) / n;
    for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: Math.round(y1 - pas * i) }] }); await dormir(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await dormir(450);
    await cdp.detach();
  };

  await taper(page, '#navBar .nav-item[data-nav="cours"]', { delai: 450 });
  await taper(page, '#view-cours [data-course="' + carte + '"]', { delai: 900 });
  let r = await racines();
  test('ouverture : la fiche est bien en haut', r.pageTop === 0 && r.mediaTop === 0 && r.cScroll === 0,
       'page = ' + r.pageTop + ' px · média = ' + r.mediaTop + ' px · défilement = ' + r.cScroll);
  test('ouverture : aucune racine défilée', r.app === 0 && r.html === 0 && r.win === 0 && r.pages === 0,
       'app = ' + r.app + ' · html = ' + r.html + ' · fenêtre = ' + r.win + ' · pages = ' + r.pages);
  test('aucune feuille fermée ne masque le bas de l\'écran', r.sheet === false && !/sheet/.test(String(r.bas)), 'élément au bas : ' + r.bas);

  /* « Continuer » amène la leçon en cours à l'écran sans déplacer l'appli */
  await taper(page, 'section.page[data-page="cours"] [data-act="continue"]', { delai: 1300 });
  r = await racines();
  test('« Continuer » : l\'application ne se décale pas', r.pageTop === 0 && r.mediaTop === 0 && r.app === 0 && r.html === 0 && r.win === 0,
       'page = ' + r.pageTop + ' px · app = ' + r.app + ' px');
  const cible = await page.evaluate(() => {
    const p = document.querySelector('section.page[data-page="cours"]');
    const row = p && (p.querySelector('.lesson.is-current') || p.querySelector('.lesson'));
    const sc = p && p.querySelector('.c-scroll');
    if (!row || !sc) return null;
    const a = row.getBoundingClientRect(), b = sc.getBoundingClientRect();
    return { dedans: a.top >= b.top - 2 && a.bottom <= b.bottom + 2, haut: Math.round(a.top), zh: Math.round(b.top), zb: Math.round(b.bottom) };
  });
  test('la leçon en cours est amenée dans la zone visible', !!(cible && cible.dedans),
       cible ? 'leçon y = ' + cible.haut + ' · zone ' + cible.zh + '→' + cible.zb : 'introuvable');

  /* une racine défilée de force doit se remettre en place toute seule */
  await page.evaluate(() => { document.querySelector('.app').scrollTop = 60; });
  await dormir(250);
  r = await racines();
  test('racine défilée de force : remise en place automatique', r.app === 0 && r.pageTop === 0 && r.mediaTop === 0,
       'app = ' + r.app + ' px · page = ' + r.pageTop + ' px');

  /* onglets de la fiche : le contenu repart du haut, la fiche ne bouge pas */
  for (const [tab, nom] of [['ressources', 'Ressources'], ['discussion', 'Discussion'], ['notes', 'Notes'], ['programme', 'Programme']]) {
    await taper(page, 'section.page[data-page="cours"] [data-ctab="' + tab + '"]', { delai: 500 });
    r = await racines();
    test('onglet « ' + nom + ' » : contenu en haut, fiche immobile', r.cScroll === 0 && r.pageTop === 0 && r.app === 0,
         'défilement = ' + r.cScroll + ' px · page = ' + r.pageTop + ' px');
  }

  /* gestes tactiles réels : descendre dans la liste puis remonter */
  await geste(700, 260, 20);
  const descendu = await racines();
  await geste(260, 700, 20);
  await geste(260, 700, 20);
  const remonte = await racines();
  test('défilement tactile : descendre puis remonter', descendu.cScroll > 0 && remonte.cScroll === 0,
       'bas = ' + descendu.cScroll + ' px → haut = ' + remonte.cScroll + ' px (course ' + remonte.cMax + ' px)');
  test('aucune racine défilée après les gestes', remonte.app === 0 && remonte.html === 0 && remonte.win === 0,
       'app = ' + remonte.app + ' · html = ' + remonte.html + ' · fenêtre = ' + remonte.win);

  await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
  await dormir(600);

  /* ============ D. pages pédagogiques ============ */
  titre('D. Quiz et devoirs');
  const texteQuiz = await page.evaluate(() => {
    window.APPX.pushPage('quiz', { quiz: 'c1', id: 'c1' });
    return 1;
  });
  await dormir(900);
  const quiz = await page.evaluate(() => {
    const el = document.querySelector('section.page[data-page="quiz"]');
    if (!el) return { ouvert: false };
    return { ouvert: true, options: el.querySelectorAll('[data-opt], .opt, button').length, texte: el.innerText.slice(0, 200) };
  });
  test('ouverture d\'un quiz depuis l\'app', quiz.ouvert, quiz.ouvert ? '' : 'page quiz absente');
  test('question et réponses proposées', !!(quiz.ouvert && quiz.options >= 2), quiz.ouvert ? quiz.options + ' contrôles' : '');
  await page.goBack(); await dormir(700);

  const idDevoir = await page.evaluate(() => (window.APPX.DEVOIRS[0] || {}).id || 'd1');
  await page.evaluate(id => { window.APPX.pushPage('devoir', { id: id }); }, idDevoir);
  await dormir(800);
  const texteDevoir = await page.evaluate(() => {
    const el = document.querySelector('section.page[data-page="devoir"]');
    return el ? el.innerText : '';
  });
  test('ouverture d\'un devoir', texteDevoir.trim().length > 20, idDevoir + ' · ' + (texteDevoir.split('\n')[0] || ''));
  await page.goBack(); await dormir(700);

  /* ============ E. vidéos ============ */
  titre('E. Lecteur vidéo');
  await page.evaluate(() => { window.APPX.pushPage('videos', {}); });
  await dormir(900);
  const nbVideos = await page.evaluate(() =>
    document.querySelectorAll('section.page[data-page="videos"] [data-video]').length);
  test('bibliothèque de vidéos', nbVideos >= 5, nbVideos + ' entrées');
  await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
  await dormir(600);

  /* --- hors-ligne d'abord : c'est le cas le plus fragile, on le teste à froid --- */
  await contexte.setOffline(true);
  await dormir(500);
  await page.evaluate(() => { window.APPX.pushPage('videos', {}); });
  await dormir(800);
  await taper(page, 'section.page[data-page="videos"] [data-video]', { delai: 1000 });
  test('le tap ouvre le lecteur dans le site', await page.evaluate(() =>
    (document.querySelector('#player') || {}).classList.contains('is-open')));
  await taper(page, '#playerPlay', { delai: 1500 });
  let repli = { local: false, joue: false, statut: '' };
  for (let i = 0; i < 12 && !repli.joue; i++) {
    await dormir(1000);
    repli = await page.evaluate(() => {
      const loc = document.querySelector('#offlineVid');
      return { local: !!loc && !loc.hidden, joue: !!loc && !loc.hidden && loc.currentTime > 0.2,
               statut: ((document.querySelector('#playerStatusTxt') || {}).textContent || '').trim() };
    });
  }
  test('hors-ligne : extrait intégré lu dans le site', repli.joue,
       'lecture locale à ' + (await page.evaluate(() => { const l = document.querySelector('#offlineVid'); return l ? l.currentTime.toFixed(1) : '0'; })) + ' s');
  test('hors-ligne : message explicatif, jamais « bloqué »', !!repli.statut && !/bloqu/i.test(repli.statut), repli.statut.slice(0, 70));
  await contexte.setOffline(false);
  await page.evaluate(() => { const c = document.querySelector('#playerClose'); if (c) c.click(); while (window.APPX.topPage()) window.APPX.popPage(); });
  await dormir(800);

  /* --- en ligne : la vidéo YouTube est lue dans le site --- */
  await page.evaluate(() => { window.APPX.pushPage('videos', {}); });
  await dormir(800);
  await taper(page, 'section.page[data-page="videos"] [data-video]', { delai: 1200 });
  await taper(page, '#playerPlay', { delai: 1200 });
  let lecture = { iframe: false, local: false, joue: false, statut: '' };
  for (let i = 0; i < 15 && !lecture.joue; i++) {
    await dormir(1000);
    lecture = await page.evaluate(() => {
      const ifr = document.querySelector('iframe.yt-host, #playerStage iframe');
      const loc = document.querySelector('#offlineVid');
      const local = !!loc && !loc.hidden;
      return { iframe: !!(ifr && /youtube\.com\/embed/.test(ifr.src || '')),
               local: local, joue: !!ifr || (local && loc.currentTime > 0.2),
               statut: ((document.querySelector('#playerStatusTxt') || {}).textContent || '').trim() };
    });
  }
  /* L'essentiel : une vidéo joue DANS le site, quel que soit le chemin
     (lecteur YouTube intégré ou extrait intégré). Le second point vérifie
     qu'on ne voit jamais le message de blocage émis par YouTube lui-même. */
  test('vidéo lue dans le site (YouTube ou extrait intégré)', lecture.joue,
       lecture.iframe ? 'lecteur YouTube intégré' : ('repli sur l\'extrait intégré — ' + lecture.statut.slice(0, 60)));
  const sansMessageYt = await page.evaluate(() =>
    !/ce contenu est bloqué|contactez le propriétaire|contenu bloqué/i.test(document.body.innerText));
  test('jamais le message YouTube « Ce contenu est bloqué »', sansMessageYt);
  console.log('  ℹ️  chemin de lecture : ' + (lecture.iframe ? 'embed YouTube (réseau OK)' : 'extrait intégré (YouTube indisponible ici : normal en test hors navigateur réel)'));
  await page.evaluate(() => { const c = document.querySelector('#playerClose'); if (c) c.click(); while (window.APPX.topPage()) window.APPX.popPage(); });
  await dormir(700);

  /* ============ F. réglages, thème, persistance ============ */
  titre('F. Réglages et persistance');
  await page.evaluate(() => { window.APPX.pushPage('parametres', {}); });
  await dormir(800);
  const themeClair = await page.evaluate(() => document.documentElement.dataset.theme || '');
  await taper(page, 'section.page[data-page="parametres"] [data-theme-opt="dark"]', { delai: 600 });
  const themeSombre = await page.evaluate(() => document.documentElement.dataset.theme || document.documentElement.className);
  test('bascule en thème sombre', /dark/.test(themeSombre), themeClair + ' → ' + themeSombre);

  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => !!window.APPX, null, { timeout: 15000 });
  await dormir(700);
  const themeApres = await page.evaluate(() => document.documentElement.dataset.theme || '');
  test('réglage conservé après rechargement', /dark/.test(themeApres), 'thème = ' + themeApres);

  const memoire = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('lh:u:') || k.startsWith('lh_')));
  test('progression enregistrée dans l\'espace du compte', memoire.length >= 3, memoire.join(', '));
  const espace = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('lh:u:')));
  test('données rangées par utilisateur (préfixe lh:u:<compte>:)', espace.length >= 3 && espace.every(k => k.split(':').length >= 4),
       espace.slice(0, 3).join(', '));

  const syncUI = await page.evaluate(async () => {
    await window.LHSYNC.ouvrirUI();
    const url = document.querySelector('#syncUrl');
    const bouton = document.querySelector('[data-sync]');
    const sheet = document.querySelector('#sheet');
    return { champ: !!url, bouton: !!bouton, ouvert: !!sheet && sheet.classList.contains('is-open') };
  });
  test('écran de synchronisation accessible', syncUI.ouvert && (syncUI.champ || syncUI.bouton),
       syncUI.champ ? 'champ d\'adresse serveur' : 'écran connecté');
  await page.evaluate(() => { const s = document.querySelector('#sheet'); if (s) s.click(); });
  await dormir(300);

  /* ============ G. synchronisation avec l'API (facultatif) ============ */
  if (API) {
    titre('G. Synchronisation application ↔ API (' + API + ')');
    const sante = await page.evaluate(async u => {
      try { const r = await fetch(u + '/api/health', { cache: 'no-store' }); const j = await r.json(); return j && j.ok ? j.data : null; }
      catch (e) { return null; }
    }, API);
    test('API joignable (/api/health)', !!sante, sante ? 'base ' + sante.base + ' · ' + sante.tables + ' tables' : 'injoignable');

    const memeDomaine = (() => { try { return new URL(site.url).origin === new URL(API).origin; } catch (e) { return false; } })();
    if (memeDomaine) {
      const auto = await page.evaluate(() => window.LHSYNC.etat().serveur || '');
      test('serveur détecté automatiquement (site servi par l\'API, même domaine)', auto === new URL(site.url).origin, auto || 'non détecté');
    }

    const avant = await page.evaluate(() => Object.keys(window.APPX.S.lessons || {}).filter(k => window.APPX.S.lessons[k]).length);
    await page.evaluate(async () => { await window.LHSYNC.ouvrirUI(); });
    await dormir(400);
    const rempli = await page.evaluate(({ u, c }) => {
      const set = (sel, v) => { const e = document.querySelector(sel); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('#syncUrl', u); set('#syncMail', c.email); set('#syncPwd', c.mdp);
      const b = document.querySelector('[data-sync="on"]');
      if (b) { b.click(); return true; }
      return false;
    }, { u: API, c: COMPTE });
    test('connexion lancée depuis l\'app', rempli);
    let connecte = false;
    for (let i = 0; i < 20 && !connecte; i++) {
      await dormir(700);
      connecte = await page.evaluate(() => !!window.LHSYNC.etat().connecte);
    }
    test('compte connecté (jeton enregistré)', connecte, await page.evaluate(() => window.LHSYNC.etat().resume));

    const serveur = await page.evaluate(async u => {
      const jeton = localStorage.getItem('lh_token');
      const r = await fetch(u + '/api/progress?format=app', { headers: { Authorization: 'Bearer ' + jeton }, cache: 'no-store' });
      const j = await r.json();
      return j && j.ok ? { lecons: Object.keys(j.data.lh_lessons || {}).length, cours: (j.data.cours || []).length } : null;
    }, API);
    test('progression du serveur lue (hydratation)', !!serveur && serveur.cours >= 1,
         serveur ? serveur.cours + ' cours suivis · ' + serveur.lecons + ' leçons terminées' : 'aucune donnée');

    /* le sens local → serveur : on termine une leçon dans l'app, puis on relit le serveur */
    await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
    await dormir(400);
    const cle = await page.evaluate(() => {
      const L = window.APPX.LESSONS || {}, faites = window.APPX.S.lessons || {};
      for (const cid of Object.keys(L)) {
        for (let i = 0; i < L[cid].length; i++) { const k = cid + ':' + i; if (!faites[k]) return k; }
      }
      return '';
    });
    if (cle) {
      await page.evaluate(k => { window.APPX.S.lessons[k] = 1; window.APPX.persist(); window.LHSYNC.changed(); }, cle);
      await dormir(1500);
      await page.evaluate(async () => { await window.LHSYNC.pousser(); });
      await dormir(1200);
      const apres = await page.evaluate(async u => {
        const jeton = localStorage.getItem('lh_token');
        const r = await fetch(u + '/api/progress?format=app', { headers: { Authorization: 'Bearer ' + jeton }, cache: 'no-store' });
        const j = await r.json();
        return j && j.ok ? Object.keys(j.data.lh_lessons || {}).length : -1;
      }, API);
      test('leçon terminée dans l\'app envoyée au serveur', apres >= (serveur.lecons + 1),
           'serveur : ' + (serveur ? serveur.lecons : '?') + ' → ' + apres + ' leçons (clé locale ' + cle + ')');
    } else {
      test('leçon terminée dans l\'app envoyée au serveur', false, 'aucune leçon locale disponible');
    }
  } else {
    console.log('\nℹ️  Test de synchronisation ignoré (définissez LEARNHUB_API_URL pour l\'activer).');
  }

  /* ============ fin ============ */
  titre('Bilan');
  test('aucune erreur JavaScript sur l\'ensemble du parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
  console.log('\n' + ok + ' OK / ' + ko + ' échec(s)');
  if (echecs.length) { console.log('\nÉchecs :'); echecs.forEach(e => console.log('  • ' + e)); }

  await contexte.close(); await nav.close(); await site.fermer();
  process.exit(ko ? 1 : 0);
})().catch(async e => {
  console.error('\n💥 Suite interrompue : ' + (e && e.message ? e.message : e));
  process.exit(3);
});
