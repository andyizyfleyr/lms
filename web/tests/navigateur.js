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
      /* premier lancement : espace invité. Les navigations suivantes gardent
         le compte réellement ouvert (connexion testée plus bas). */
      if (!localStorage.getItem('lh:compte')) {
        localStorage.setItem('lh:compte', JSON.stringify({ id: 'invite', nom: 'Invité', email: '', role: 'invite', token: '', depuis: Date.now() }));
      }
    } catch (e) {}
  });

  const page = await contexte.newPage();

  /* hôtes autorisés : le site testé lui-même (origine courante) et le serveur local des tests */
  const HOTES_LOCAUX = new Set(['127.0.0.1', 'localhost', (() => { try { return new URL(site.url).hostname; } catch (e) { return ''; } })()]);
  const erreurs = [], externes = new Set(), requetes = [];
  page.on('pageerror', e => { erreurs.push(String((e && e.message) || e)); if (process.env.LEARNHUB_TRACE) console.log('\n   ⛔ JS : ' + e.message + '\n      ' + String(e.stack || '').split('\n').slice(1,4).join('\n      ')); });
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
  /* le site de test répond sur un port aléatoire : l'API réelle est branchée explicitement */
  if (API) await page.evaluate(u => { try { localStorage.setItem('lh_api', u); } catch (e) {} }, API);

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

  /* ---- Les cours sont payants : ce que voit un visiteur sans achat ---- */
  const vitrine = await page.evaluate(() => {
    const p = document.querySelector('section.page[data-page="cours"]');
    return {
      bandeau: !!(p && p.querySelector('.paywall')),
      bouton: !!(p && p.querySelector('#cCta [data-paie="cours"]')),
      cadenas: !!(p && p.querySelector('.lesson.is-locked')),
      prix: ((p && p.querySelector('.paywall__prix')) || {}).textContent || ''
    };
  });
  test('cours payant : bandeau, prix et bouton « Débloquer »', vitrine.bandeau && vitrine.bouton && vitrine.cadenas,
       (vitrine.prix || '').trim().slice(0, 40) + ' · bouton = ' + vitrine.bouton);
  await page.evaluate(() => { const l = document.querySelector('section.page[data-page="cours"] .lesson'); if (l) l.click(); });
  await dormir(600);
  const offre = await page.evaluate(() => {
    const sh = document.querySelector('#sheet');
    const pl = document.querySelector('#player');
    return {
      feuille: !!(sh && sh.classList.contains('is-open')),
      achat: !!(sh && sh.querySelector('[data-paie="cours"], [data-paie="abonnement"]')),
      lecteur: !!(pl && pl.classList.contains('is-open'))
    };
  });
  test('cours payant : toucher une leçon propose l\'achat, le lecteur reste fermé',
       offre.feuille && offre.achat && !offre.lecteur,
       'feuille = ' + offre.feuille + ' · offre = ' + offre.achat + ' · lecteur = ' + offre.lecteur);
  await page.evaluate(() => { window.APPX.closeSheet(); });
  await dormir(300);

  /* ---- Plus aucun contenu inventé sur l'accueil ----
     (on lit le DOM de l'accueil sans quitter la fiche de cours ouverte) */
  const accueil = await page.evaluate(() => {
    const t = document.body.innerText || '';
    const h = document.querySelector('#heroTitle');
    const sec = document.querySelector('#secActivite');
    return { titre: h ? h.textContent : '', inventé: /Mme Adjovi|Maquette M3|Activité du formateur|34 h DE FORMATION/i.test(t),
             activiteMasquee: sec ? sec.hidden : null };
  });
  test('accueil : aucun contenu inventé (ni « Mme Adjovi », ni « Maquette M3 »)', !accueil.inventé,
       'héros : ' + (accueil.titre || '').slice(0, 46));
  test('accueil : le héros parle de l’accès réel du compte', /Débloquez|Commencer|Continuer|Revoir/.test(accueil.titre || ''),
       accueil.titre || 'héros vide');

  /* ---- La suite a besoin d'un accès : on ouvre la session de démonstration
     (abonnement actif, donc tous les cours ouverts). Sans serveur indiqué,
     les contrôles de contenu sont ignorés — l'application reste utilisable
     mais tout est verrouillé, ce qui est le comportement voulu. ---- */
  let acces = false;
  if (API) {
    /* connexion par l'écran de compte de l'application (le même que celui
       testé dans tests/comptes.js), puis relecture des accès. */
    await page.evaluate(() => { if (window.LHCOMPTE) window.LHCOMPTE.ouvrirEntree(); });
    await dormir(800);
    await page.evaluate(() => { const b = document.querySelector('[data-ct="connexion"]'); if (b) b.click(); });
    await dormir(600);
    await page.evaluate(({ u, c }) => {
      const set = (sel, v) => { const e = document.querySelector(sel); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('#ctApi', u); set('#ctMail', c.email); set('#ctPwd', c.mdp);
      const b = document.querySelector('#ctValider'); if (b) b.click();
    }, { u: API, c: COMPTE });
    /* la connexion réécrit l'espace du compte puis recharge l'application */
    await page.waitForLoadState('load').catch(() => {});
    await dormir(1200);
    for (let i = 0; i < 18 && !acces; i++) {
      await dormir(700);
      try {
        acces = await page.evaluate(async () => {
          if (!(window.LHCOMPTE && window.LHCOMPTE.jeton())) return false;
          if (window.LHPAIE) await window.LHPAIE.charger(true);
          return !!(window.LHPAIE && window.LHPAIE.acces().toutPaye);
        });
      } catch (e) { acces = false; }
    }
    await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); window.APPX.refreshPages(); });
    await dormir(500);
    /* la connexion recharge l'application : on rouvre la fiche de cours */
    await taper(page, '#navBar .nav-item[data-nav="cours"]', { delai: 500 });
    await taper(page, '#view-cours [data-course="' + carte + '"]', { delai: 1000 });
    await page.evaluate(() => { window.APPX.closeSheet(); });
    await dormir(300);
  }
  if (API) {
    test('accès abonné (abonnement actif → tous les cours)', acces, acces ? 'tous les cours ouverts' : 'connexion à l’API impossible');
  } else {
    console.log('  ⏭️  accès abonné : LEARNHUB_API_URL non défini — contrôles de contenu ignorés');
  }

  if (acces) {
    /* On travaille sur un cours que le compte n'a pas encore terminé : le
       bouton « Continuer » doit alors ouvrir sa leçon en cours et l'amener
       dans la zone visible. */
    const coursOuvert = await page.evaluate(() => {
      const faits = window.APPX.S.lessons || {};
      const cartes = Array.from(document.querySelectorAll('#view-cours [data-course]')).map(c => c.dataset.course);
      return cartes.find(id => !Object.keys(faits).some(k => k.indexOf(id + ':') === 0)) || cartes[0];
    });
    await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
    await dormir(500);
    await taper(page, '#navBar .nav-item[data-nav="cours"]', { delai: 500 });
    await taper(page, '#view-cours [data-course="' + coursOuvert + '"]', { delai: 1000 });
    await page.evaluate(() => { window.APPX.closeSheet(); });

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
    let descendu = await racines();
    if (!(descendu.cScroll > 0)) { await geste(660, 280, 22); descendu = await racines(); }          // geste parfois avalé par le navigateur
    if (!(descendu.cScroll > 0)) { await page.mouse.move(195, 600); await page.mouse.wheel(0, 320); await dormir(500); descendu = await racines(); }
    await geste(250, 720, 22);
    await geste(250, 720, 22);
    const remonte = await racines();
    test('défilement tactile : descendre puis remonter', descendu.cScroll > 0 && remonte.cScroll === 0,
         'bas = ' + descendu.cScroll + ' px → haut = ' + remonte.cScroll + ' px (course ' + remonte.cMax + ' px)');
    test('aucune racine défilée après les gestes', remonte.app === 0 && remonte.html === 0 && remonte.win === 0,
         'app = ' + remonte.app + ' · html = ' + remonte.html + ' · fenêtre = ' + remonte.win);
  } else {
    console.log('  ⏭️  fiche débloquée : contrôles de défilement ignorés (accès payant requis)');
  }

  await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
  await dormir(600);

  /* ============ D. pages pédagogiques ============ */
  titre('D. Quiz et devoirs');
  if (acces) {
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
  } else {
    await page.evaluate(() => { window.APPX.pushPage('quiz', { quiz: 'c1', id: 'c1' }); });
    await dormir(800);
    test('quiz payant : page réservée aux inscrits (paywall)', await page.evaluate(() => {
      const el = document.querySelector('section.page[data-page="quiz"]');
      return !!(el && el.querySelector('.paywall') && el.querySelector('[data-paie]'));
    }), 'bandeau + bouton de déblocage');
    await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
    await dormir(400);
  }

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

  if (acces) {
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
  } else {
    console.log('  ⏭️  vidéos : contrôles de lecture ignorés (accès payant requis)');
  }

  /* ============ F. réglages, thème, persistance ============ */
  titre('F. Réglages et persistance');
  await page.evaluate(() => { window.APPX.closeSheet(); });

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
    const dejaLa = await page.evaluate(() => !!(window.LHSYNC && window.LHSYNC.etat().connecte));
    const rempli = dejaLa ? true : await page.evaluate(({ u, c }) => {
      const set = (sel, v) => { const e = document.querySelector(sel); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('#syncUrl', u); set('#syncMail', c.email); set('#syncPwd', c.mdp);
      const b = document.querySelector('[data-sync="on"]');
      if (b) { b.click(); return true; }
      return false;
    }, { u: API, c: COMPTE });
    test('connexion lancée depuis l\'app (session déjà ouverte ou formulaire)', rempli,
         dejaLa ? 'session ouverte par l\'écran de compte' : 'formulaire de synchronisation');
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

    /* ---------- ce qui était simulé est désormais réel ---------- */
    await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
    await dormir(400);

    /* avatar : vrai sélecteur, gardé par le compte (et sur le serveur) */
    await page.evaluate(() => window.APPX.pushPage('profil-edit', {}));
    await dormir(700);
    await page.evaluate(() => { const b = document.querySelector('[data-act="avatar"]'); if (b) b.click(); });
    await dormir(600);
    const nbAvatars = await page.evaluate(() => document.querySelectorAll('#choixAvatar [data-avatar]').length);
    await page.evaluate(() => { const b = document.querySelector('#choixAvatar [data-avatar="drop"]'); if (b) b.click(); });
    await dormir(700);
    const av = await page.evaluate(async () => {
      const j = await window.LHCOMPTE.api('/api/settings').then(r => r.json()).catch(() => null);
      return { local: window.APPX.store.get('avatar', ''), distant: j && j.data && j.data.reglages ? j.data.reglages.avatar : null,
               entete: !!document.querySelector('#avatarBtn svg') };
    });
    test('avatar : sélecteur réel (12 choix)', nbAvatars === 12, nbAvatars + ' avatars');
    test('avatar : choisi, affiché et enregistré sur le compte', av.local === 'drop' && av.distant === 'drop' && av.entete,
         'local = ' + av.local + ' · serveur = ' + av.distant);

    /* mot de passe : vrai formulaire (on ne le change pas) */
    await page.evaluate(() => { while (window.APPX.topPage()) window.APPX.popPage(); });
    await dormir(400);
    await page.evaluate(() => window.APPX.pushPage('parametres', {}));
    await dormir(600);
    await page.evaluate(() => { const b = document.querySelector('[data-act="pwd"]'); if (b) b.click(); });
    await dormir(600);
    const pwd = await page.evaluate(() => {
      const f = document.querySelector('#fPwd');
      return { present: !!f, champs: f ? f.querySelectorAll('input[type="password"]').length : 0 };
    });
    test('mot de passe : formulaire réel (actuel, nouveau, confirmation)', pwd.present && pwd.champs === 3,
         pwd.champs + ' champ(s)');
    await page.evaluate(() => { window.APPX.closeSheet(); });
    await dormir(300);

    /* appareils : liste réelle des sessions */
    await page.evaluate(() => window.LHPROFIL.appareils());
    await dormir(1500);
    const app = await page.evaluate(() => {
      const box = document.querySelector('#listeAppareils');
      const txt = box ? box.innerText : '';
      return { lignes: box ? box.querySelectorAll('.list-row').length : 0, actuel: /Actuel/.test(txt) };
    });
    test('appareils connectés : liste réelle avec le poste actuel', app.lignes >= 1 && app.actuel,
         app.lignes + ' appareil(s)');
    await page.evaluate(() => { window.APPX.closeSheet(); });
    await dormir(300);

    /* activité : alimentée par l'API, jamais inventée */
    const act = await page.evaluate(async () => {
      await window.LHPROFIL.chargerActivite();
      const sec = document.querySelector('#secActivite'), z = document.querySelector('#activite');
      return { masquee: sec.hidden, texte: z ? z.innerText.replace(/\s+/g, ' ').slice(0, 90) : '' };
    });
    test('activité réelle affichée sur l’accueil', !act.masquee && act.texte.length > 20, act.texte || 'aucune activité');

    /* le héros suit le cours réellement commencé */
    const hero = await page.evaluate(() => {
      window.LHPROFIL.majHero();
      const h = document.querySelector('#heroTitle'), c = document.querySelector('#heroCard');
      return { titre: h ? h.textContent : '', cours: c ? c.dataset.id : '', pct: (document.querySelector('#heroPct') || {}).textContent };
    });
    test('héros : cours réellement en cours + son avancement', hero.titre.length > 3 && !!hero.cours,
         hero.titre + ' · ' + hero.pct);

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


  /* ============ SYNCHRONISATION PAR COMPTE (V2) ============ */
  if (API) {
    titre('Synchronisation par compte');
    const lire = (chemin, jeton) => page.evaluate(async ({ u, c, j }) => {
      const r = await fetch(u + c, { headers: j ? { Authorization: 'Bearer ' + j } : {}, cache: 'no-store' });
      const x = await r.json();
      return x;
    }, { u: API, c: chemin, j: jeton });

    /* ce que l'utilisateur fait dans l'application doit exister sur son compte */
    const jeton = await page.evaluate(() => localStorage.getItem('lh_token'));
    const cours = await page.evaluate(() => {
      const premier = (window.APPX.COURS || [])[0];
      return premier ? premier.id : 'c1';
    });

    await page.evaluate(c => window.APPX.notification('cours', 'Contrôle de synchro', 'Créée pendant la suite de tests', ['cours', c]), cours);
    await dormir(2200);
    const notifs = await lire('/api/notifications', jeton);
    const listeNotifs = (notifs && notifs.data && notifs.data.notifications) || [];
    test('notification créée dans l\'app enregistrée sur le compte',
         listeNotifs.some(n => n.titre === 'Contrôle de synchro'),
         listeNotifs.length + ' notification(s) sur le compte');

    const texteTest = 'Message de contrôle ' + Date.now();
    await page.evaluate(async ({ c, t }) => { await window.LHSYNC2.publierMessage(c, t); }, { c: cours, t: texteTest });
    await dormir(2000);
    const fil = await lire('/api/courses/' + cours + '/messages', jeton);
    const messages = (fil && fil.data && fil.data.messages) || [];
    test('message publié dans l\'application visible sur le compte',
         messages.some(m => m.contenu === texteTest),
         messages.length + ' message(s) dans la discussion');

    await page.evaluate(async c => { await window.LHSYNC2.enregistrerNote(c, 'Note de contrôle de synchro.'); }, cours);
    await dormir(1600);
    const notes = await lire('/api/notes', jeton);
    const mesNotes = (notes && notes.data && notes.data.notes) || [];
    test('note de cours enregistrée sur le compte',
         mesNotes.some(n => /Note de contrôle de synchro/.test(n.contenu || '')),
         mesNotes.length + ' note(s) sur le compte');

    await page.evaluate(async () => { await window.LHSYNC2.enregistrerReglages({ theme: 'sombre' }); });
    await dormir(1500);
    const reglages = await lire('/api/settings', jeton);
    test('préférence de thème enregistrée sur le compte',
         !!(reglages && reglages.data && reglages.data.reglages && reglages.data.reglages.theme === 'sombre'),
         'thème serveur : ' + ((reglages.data && reglages.data.reglages) || {}).theme);

    await page.evaluate(async c => { await window.LHSYNC2.envoyerTelechargement({ id: 'dl-test', ref: c, t: 'Contrôle hors-ligne', st: 'done' }); }, cours);
    await dormir(1600);
    const dl = await lire('/api/downloads', jeton);
    const listeDl = (dl && dl.data && dl.data.telechargements) || [];
    test('téléchargement enregistré sur le compte', listeDl.length >= 1, listeDl.length + ' téléchargement(s)');

    const avantFil = await page.evaluate(async c => {
      window.APPX.S.disc[c] = [];
      await window.LHSYNC2.tirerDiscussion(c);
      return (window.APPX.S.disc[c] || []).length;
    }, cours);
    test('discussion rapatriée depuis le serveur sans recharger', avantFil >= 1, avantFil + ' message(s) rapatrié(s)');
  } else {
    console.log('\nℹ️  Synchronisation par compte ignorée (définissez LEARNHUB_API_URL pour l\'activer).');
  }


  /* ============ ESPACE FORMATEUR (V2) ============ */
  if (API) {
    titre('Espace formateur (cours, leçons, ressources, séances, suivi)');
    const apiJSON = async (chemin, jeton, opts) => {
      const r = await fetch(API + chemin, Object.assign({
        headers: Object.assign({ 'Content-Type': 'application/json' }, jeton ? { Authorization: 'Bearer ' + jeton } : {}),
        cache: 'no-store'
      }, opts || {}));
      return r.json().catch(() => ({}));
    };
    const prof = await apiJSON('/api/auth/login', '', { method: 'POST', body: JSON.stringify({ email: FORMATEUR.email, motDePasse: FORMATEUR.mdp }) });
    const admin = await apiJSON('/api/auth/login', '', { method: 'POST', body: JSON.stringify({ email: process.env.LEARNHUB_ADMIN || 'admin@cosmetilab.bj', motDePasse: process.env.LEARNHUB_ADMIN_MDP || 'admin1234' }) });
    const jetonProf = prof && prof.data ? prof.data.token : '';
    const jetonAdmin = admin && admin.data ? admin.data.token : '';
    const avant = await page.evaluate(() => localStorage.getItem('lh:compte'));

    if (!jetonProf || !jetonAdmin) {
      test('connexion des comptes formateur et administrateur', false, 'jeton manquant');
    } else {
      await page.evaluate(({ u }) => {
        localStorage.setItem('lh:compte', JSON.stringify({ id: u.user.id, nom: u.user.nom, email: u.user.email, role: u.user.role, token: u.token, depuis: Date.now() }));
        localStorage.setItem('lh_token', u.token);
      }, { u: prof.data });
      await page.reload({ waitUntil: 'load' });
      await dormir(2500);

      await page.evaluate(() => window.APPX.pushPage('compte', {}));
      await dormir(600);
      const acces = await page.locator('[data-page="espace-formateur"]').count();
      test('l\'accès « Espace formateur » est proposé au formateur', acces > 0, acces + ' entrée(s) dans le compte');
      await page.locator('[data-page="espace-formateur"]').first().click();
      await dormir(2500);
      test('l\'espace formateur s\'ouvre avec ses cinq onglets',
           (await page.evaluate(() => document.querySelectorAll('.pf-tabs .tab').length)) === 5,
           (await page.evaluate(() => document.querySelectorAll('.pf-tabs .tab').length)) + ' onglet(s)');
      test('les cours à gérer sont listés', (await page.evaluate(() => window.LHPROF.etat.cours.length)) >= 6,
           (await page.evaluate(() => window.LHPROF.etat.cours.length)) + ' cours');

      /* création d'un cours complet : cours → leçon → ressource → séance, puis nettoyage */
      const titreCours = 'Contrôle suite ' + Date.now().toString().slice(-6);
      await page.fill('#pfTitre', titreCours);
      await page.fill('#pfCat', 'Contrôle');
      await page.fill('#pfProf', 'Awa Sossou');
      await page.fill('#pfDuree', '2 h');
      await page.locator('[data-pf="creer-cours"]').click();
      await dormir(3200);
      const idCours = await page.evaluate(() => window.LHPROF.etat.coursId);
      const coursCree = await apiJSON('/api/courses/' + idCours, jetonProf);
      test('créer un cours depuis l\'application', !!(coursCree.data && coursCree.data.cours && coursCree.data.cours.titre === titreCours),
           'cours ' + idCours + ' : ' + ((coursCree.data && coursCree.data.cours) || {}).titre);

      await page.fill('#pfModTitre', 'Module 1 — Contrôle');
      await page.fill('#pfLecTitre', 'Leçon de contrôle');
      await page.fill('#pfLecDuree', '12 min');
      await page.locator('[data-pf="ajouter-lecon"]').click();
      await dormir(3000);
      await page.locator('[data-pf="onglet"][data-onglet="ressources"]').click();
      await dormir(2200);
      await page.fill('#pfResTitre', 'Fiche de contrôle');
      await page.fill('#pfResType', 'PDF, 200 Ko');
      await page.locator('[data-pf="ajouter-ressource"]').click();
      await dormir(2800);
      const detail = await apiJSON('/api/courses/' + idCours, jetonProf);
      const lecons = (detail.data && detail.data.modules || []).reduce((n, m) => n + (m.lecons || []).length, 0);
      const ressources = (detail.data && detail.data.ressources || []).length;
      test('ajouter une leçon et une ressource au cours', lecons === 1 && ressources === 1,
           lecons + ' leçon(s) · ' + ressources + ' ressource(s)');

      await page.locator('[data-pf="onglet"][data-onglet="seances"]').click();
      await dormir(2200);
      await page.fill('#pfSeTitre', 'Atelier de contrôle');
      await page.fill('#pfSeDate', new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
      await page.fill('#pfSeHeure', '15:30');
      await page.locator('[data-pf="creer-seance"]').click();
      await dormir(3000);
      const seances = await apiJSON('/api/sessions', jetonProf);
      const mienne = ((seances.data && seances.data.seances) || []).find(x => x.titre === 'Atelier de contrôle');
      test('programmer une séance depuis l\'application', !!mienne,
           mienne ? mienne.date_session + ' ' + mienne.heure : 'séance absente');

      await page.locator('[data-pf="onglet"][data-onglet="apprenants"]').click();
      await dormir(2000);
      await page.evaluate(() => { const s = document.querySelector('#pfCours'); if (s) { s.value = 'c1'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
      await dormir(2500);
      const suivi = await page.evaluate(() => window.LHPROF.etat.apprenants);
      test('suivi des apprenants : progression, leçons et dépôts', suivi.length > 0 && 'progress' in (suivi[0] || {}) && 'lecons_faites' in (suivi[0] || {}),
           suivi.length + ' apprenant(s) · ' + (suivi[0] ? suivi[0].nom + ' ' + suivi[0].progress + ' %' : ''));

      /* nettoyage : le cours de contrôle et sa séance disparaissent, la base reste telle quelle */
      if (mienne) await apiJSON('/api/sessions/' + mienne.id, jetonProf, { method: 'DELETE' });
      const sup = await apiJSON('/api/courses/' + idCours, jetonAdmin, { method: 'DELETE' });
      test('suppression du cours de contrôle (base inchangée)', !!(sup && sup.ok), sup && sup.error ? sup.error.message : 'cours ' + idCours + ' retiré');

      await page.evaluate(a => { try { localStorage.setItem('lh:compte', a); } catch (e) {} }, avant);
      await page.reload({ waitUntil: 'load' });
      await dormir(2500);
    }
  } else {
    console.log('\nℹ️  Espace formateur ignoré (définissez LEARNHUB_API_URL pour l\'activer).');
  }


  /* ============ EXPÉRIENCE D'APPRENTISSAGE (V2) ============ */
  if (API) {
    titre('Expérience d\'apprentissage (reprise, historique, recherche, attestations, hors-ligne)');
    const apiJSON2 = async (chemin, jeton, opts) => {
      const r = await fetch(API + chemin, Object.assign({
        headers: Object.assign({ 'Content-Type': 'application/json' }, jeton ? { Authorization: 'Bearer ' + jeton } : {}),
        cache: 'no-store'
      }, opts || {}));
      return r.json().catch(() => ({}));
    };
    const avantAppr = await page.evaluate(() => localStorage.getItem('lh:compte'));
    const mail = 'suite-appr-' + Date.now() + '@cosmetilab.bj';
    const creation = await apiJSON2('/api/auth/register', '', {
      method: 'POST', body: JSON.stringify({ nom: 'Contrôle Apprentissage', email: mail, motDePasse: 'test1234', ville: 'Porto-Novo' })
    });
    const nouveau = creation && creation.data;
    const admin2 = await apiJSON2('/api/auth/login', '', { method: 'POST', body: JSON.stringify({ email: process.env.LEARNHUB_ADMIN || 'admin@cosmetilab.bj', motDePasse: process.env.LEARNHUB_ADMIN_MDP || 'admin1234' }) });
    const jetonAdmin2 = admin2 && admin2.data ? admin2.data.token : '';

    if (!nouveau || !nouveau.token) {
      test('compte de contrôle créé pour l\'expérience d\'apprentissage', false, JSON.stringify(creation && creation.error));
    } else {
      await apiJSON2('/api/acces/offrir', jetonAdmin2, { method: 'POST', body: JSON.stringify({ email: mail, cours: ['c2'], jours: 30 }) });
      const detailC2 = await apiJSON2('/api/courses/c2', nouveau.token);
      const toutes = ((detailC2.data && detailC2.data.modules) || []).reduce((n, m) => n.concat(m.lecons || []), []);
      for (const l of toutes) await apiJSON2('/api/lessons/' + l.id + '/complete', nouveau.token, { method: 'POST', body: JSON.stringify({ done: true, minutes: 3 }) });

      await page.evaluate(({ u }) => {
        localStorage.setItem('lh:compte', JSON.stringify({ id: u.user.id, nom: u.user.nom, email: u.user.email, role: u.user.role, token: u.token, depuis: Date.now() }));
        localStorage.setItem('lh_token', u.token);
      }, { u: nouveau });
      await page.reload({ waitUntil: 'load' });
      await dormir(3500);

      /* reprise de lecture */
      const video = await apiJSON2('/api/videos?courseId=c2', nouveau.token)
        .then(j => (j.data && j.data.videos && j.data.videos[0]) || null);
      await page.evaluate(({ yt, sec }) => window.LHAPPRENDRE.ouvrir(yt, sec), { yt: video.id, sec: 245 });
      await dormir(1200);
      await page.evaluate(({ yt }) => window.onPositionLue(yt, 245), { yt: video.id });
      await dormir(2200);
      const etatVideo = await apiJSON2('/api/progress?format=app', nouveau.token)
        .then(j => ((j.data && j.data.lh_videos) || {})[video.id] || {});
      test('la position de lecture part sur le compte', Number(etatVideo.pos) === 245,
           'position enregistrée : ' + etatVideo.pos + ' s');
      await page.evaluate(({ yt, sec }) => window.LHAPPRENDRE.ouvrir(yt, sec), { yt: video.id, sec: 120 });
      await dormir(1000);
      const reprise = await page.evaluate(() => { const b = document.querySelector('.resume-btn'); return b ? b.textContent.trim() : ''; });
      test('le lecteur propose de reprendre où l\'on s\'était arrêté', /Reprendre à \d/.test(reprise), reprise || 'bouton absent');

      /* historique des tentatives */
      const questions = await apiJSON2('/api/quizzes/c2', nouveau.token).then(j => (j.data && j.data.questions) || []);
      await apiJSON2('/api/quizzes/c2/attempts', nouveau.token, { method: 'POST',
        body: JSON.stringify({ reponses: questions.map(q => ({ questionId: q.id, optionId: q.options[0].id })), dureeS: 90 }) });
      await page.evaluate(() => { let n = 0; while (window.APPX.topPage() && n++ < 20) window.APPX.popPage(); window.APPX.pushPage('tentatives', {}); });
      await dormir(2500);
      const histo = await page.evaluate(() => ({ lignes: document.querySelectorAll('#tentats .list-row').length, texte: ((document.querySelector('#tentats') || {}).innerText || '') }));
      test('l\'historique des tentatives vient du compte', histo.lignes >= 1, histo.lignes + ' tentative(s) · ' + histo.texte.split('\n').slice(0, 3).join(' / '));

      /* recherche serveur */
      await page.evaluate(() => { window.APPX.pushPage('recherche', {}); });
      await dormir(1000);
      await page.fill('.q-input', 'karité');
      await dormir(2600);
      const rech = await page.evaluate(() => ({
        lignes: document.querySelectorAll('.q-body .list-row').length,
        local: /hors connexion/i.test((document.querySelector('.q-body') || {}).innerText || '')
      }));
      test('la recherche interroge le serveur (cours, leçons, vidéos…)', rech.lignes >= 5 && !rech.local,
           rech.lignes + ' résultat(s)' + (rech.local ? ' (repli local)' : ' depuis le serveur'));

      /* attestations */
      await page.evaluate(() => { let n = 0; while (window.APPX.topPage() && n++ < 20) window.APPX.popPage(); window.LHAPPRENDRE.certificats(); });
      await dormir(3000);
      const certs = await page.evaluate(() => ({ cartes: document.querySelectorAll('[data-certificat]').length,
        texte: ((document.querySelector('#certs') || {}).innerText || '').split('\n').slice(0, 5).join(' / ') }));
      test('l\'attestation du cours terminé est délivrée et datée', certs.cartes >= 1, certs.cartes + ' attestation(s) · ' + certs.texte);

      /* hors-ligne */
      await page.context().setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));
      await dormir(1500);
      const bandeau = await page.evaluate(() => { const b = document.querySelector('#hlBandeau'); return b ? getComputedStyle(b).display : 'absent'; });
      test('le mode hors-ligne est annoncé sans bloquer la lecture', bandeau === 'block', 'bandeau : ' + bandeau);
      await page.context().setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event('online')));

      /* le compte de contrôle est retiré : rien ne reste dans la base */
      const menage = await apiJSON2('/api/auth/me', nouveau.token, { method: 'DELETE' });
      test('le compte de contrôle est supprimé après vérification', !!(menage && menage.ok), menage && menage.error ? menage.error.message : 'compte ' + mail + ' retiré');

      await page.evaluate(a => { try { localStorage.setItem('lh:compte', a); } catch (e) {} }, avantAppr);
      await page.reload({ waitUntil: 'load' });
      await dormir(2000);
    }
  } else {
    console.log('\nℹ️  Expérience d\'apprentissage ignorée (définissez LEARNHUB_API_URL pour l\'activer).');
  }


  /* ============ AUDIT QUALITÉ (chaque page, chaque contrôle) ============ */
  {
    titre('Audit qualité (toutes les pages, tous les contrôles)');
    const actionsNoyau = await page.evaluate(() => {
      /* les actions du noyau ne sont pas exposées : on les relève dans le code chargé */
      const src = Array.from(document.scripts).map(s => s.textContent).join('\n');
      const bloc = src.slice(src.indexOf('const ACTIONS = {'), src.indexOf('/* ============', src.indexOf('const ACTIONS = {')));
      return Array.from(bloc.matchAll(/^\s{2}([a-zA-Z][\w]*)\s*\(/gm)).map(m => m[1]);
    });
    const liste = await page.evaluate(() => Object.keys(window.APPX.PAGES));
    const enEchec = [], videsTrouvees = [];
    const actionsVues = new Set(), pagesVues = new Set();
    for (const id of liste) {
      const r = await page.evaluate(async pid => {
        try {
          window.APPX.pushPage(pid, {});
          await new Promise(r => setTimeout(r, 240));
          const el = document.querySelector('.page[data-page="' + pid + '"]');
          const texte = el ? el.innerText.trim() : '';
          const act = el ? Array.from(el.querySelectorAll('[data-act]')).map(b => b.dataset.act) : [];
          const pg = el ? Array.from(el.querySelectorAll('[data-page]')).map(b => b.dataset.page) : [];
          window.APPX.popPage();
          return { texte: texte.length, act, pg };
        } catch (e) { return { erreur: String(e.message) }; }
      }, id);
      if (r.erreur) enEchec.push(id);
      if (!r.erreur && r.texte < 20) videsTrouvees.push(id);
      (r.act || []).forEach(a => actionsVues.add(a));
      (r.pg || []).forEach(p => pagesVues.add(p));
    }
    test('chaque page enregistrée s\'ouvre et affiche du contenu',
         enEchec.length === 0 && videsTrouvees.length === 0,
         liste.length + ' pages · en échec : ' + (enEchec.join(', ') || 'aucune') + ' · vides : ' + (videsTrouvees.join(', ') || 'aucune'));

    const orphelins = await page.evaluate(({ noyau, act, pg }) => {
      const connues = new Set(Object.keys(window.APPX.PAGES));
      const externes = window.APPX.ACTIONS || {};
      return {
        act: act.filter(a => !noyau.includes(a) && !externes[a]),
        pg: pg.filter(p => !connues.has(p))
      };
    }, { noyau: actionsNoyau, act: Array.from(actionsVues), pg: Array.from(pagesVues) });
    /* certains boutons portent l'action de leur écran directement (onclick ou écoute dédiée) */
    const gereesAilleurs = ['quitQuiz', 'retryQuiz', 'ctQuitter', 'ctRecharger', 'ctSync', 'backCourse', 'fav'];
    const restants = orphelins.act.filter(a => !gereesAilleurs.includes(a));
    test('aucun contrôle mort : chaque action est branchée', restants.length === 0,
         actionsVues.size + ' action(s) utilisées sur ' + liste.length + ' pages' + (restants.length ? ' — sans effet : ' + restants.join(', ') : ''));
    test('chaque lien interne pointe vers une page existante', orphelins.pg.length === 0,
         pagesVues.size + ' lien(s) vérifiés' + (orphelins.pg.length ? ' — inconnus : ' + orphelins.pg.join(', ') : ''));

    const a11y = await page.evaluate(() => {
      const sansNom = [], petits = [];
      document.querySelectorAll('.page').forEach(pg => {
        pg.querySelectorAll('button, [role="switch"]').forEach(b => {
          const nom = (b.innerText || '').trim() || b.getAttribute('aria-label') || b.getAttribute('title') || '';
          if (!nom) sansNom.push(pg.dataset.page + ':' + (b.dataset.act || b.className.split(' ')[0]));
          const r = b.getBoundingClientRect();
          if (r.width && r.height && (r.width < 28 || r.height < 28)) petits.push(pg.dataset.page + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
        });
      });
      return { sansNom, petits, lang: document.documentElement.lang };
    });
    test('accessibilité : boutons nommés et cibles tactiles suffisantes',
         a11y.sansNom.length === 0 && a11y.petits.length === 0 && a11y.lang === 'fr',
         a11y.sansNom.length + ' bouton(s) sans nom · ' + a11y.petits.length + ' cible(s) trop petite(s) · langue : ' + a11y.lang);

    const poids = fs.statSync(PAGE).size;
    test('le site reste un fichier unique autonome de taille maîtrisée', poids < 1_400_000,
         (poids / 1024).toFixed(0) + ' Ko (tout inclus : images, extrait vidéo, contenu)');
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
