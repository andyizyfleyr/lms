# CosmétiLab

Tableau de bord **LMS mobile** (Material Design 3) livré sous forme de **fichier HTML unique**, accompagné de son **API Next.js + base Neon**.

- **Le site** : `web/index.html` — 1 427 Ko, HTML + CSS + JavaScript + images (base64) + extrait vidéo intégré. Aucune dépendance externe (la seule exception est l'iframe YouTube du lecteur vidéo). Il se publie sur n'importe quel hébergeur statique.
- **L'API** : `api/` — Next.js 15 (App Router) + TypeScript + Neon/PostgreSQL, **56 routes** (dont 7 pour le paiement) et **30 tables**. Elle sert la synchronisation de la progression (et tout le reste : cours, quiz, devoirs, ressources, notifications, recherche, statistiques).
- **Le tout tient sur une seule adresse** : un seul projet Vercel sert l'application sur `/` et l'API sur `/api/*`
  (Next.js publie `api/public/index.html`, copie du livrable). Voir [`DEPLOIEMENT-GITHUB-VERCEL.md`](DEPLOIEMENT-GITHUB-VERCEL.md).

L'application fonctionne **toute seule** (navigation, cours, quiz, vidéos, progression dans le navigateur) : l'API est facultative.
Dès qu'elle est configurée, la progression se retrouve sur tous les appareils et les **cours payants** s'ouvrent après paiement.

---

## Comptes, données séparées et temps réel

- **Écran d'entrée** dès le premier lancement : *Se connecter*, *Créer un compte* (apprenant **ou** formateur), *Explorer sans compte*.
- **Chaque compte a son espace** : les données locales sont rangées sous `lh:u:<compte>:` et côté serveur sous l'identifiant du compte. Se déconnecter puis se reconnecter avec un autre compte ne mélange rien.
- **L'identité affichée est celle du compte** : nom, initiales, profil, série de jours, heures de formation, badges et objectif de la semaine viennent du compte connecté (`/api/auth/me` et `/api/stats`). Un compte neuf part de zéro (0 j, 0 h, 0 badge) et « explorer sans compte » s'affiche sous « Invité » — aucun profil de démonstration n'est emprunté.
- **Temps réel** : l'application interroge une révision légère (`GET /api/sync`, toutes les 4 s, 15 s en arrière-plan) ; dès qu'une action a été faite **ailleurs** (autre appareil, formateur, table d'administration), la progression est rechargée et l'écran se met à jour **sans rechargement**, avec un message et un indicateur « Synchronisé il y a … ». Toute action locale est envoyée aussitôt (`lh:pousse`).
- **Avatar, mot de passe, appareils** : l'avatar se choisit parmi 12 visuels et **suit le compte** (enregistré côté serveur, retrouvé sur les autres appareils) ; le mot de passe se change pour de vrai (`POST /api/auth/password`, les autres sessions sont fermées) ; l'écran **Appareils connectés** liste les sessions réelles (`GET /api/auth/devices`) et permet d'en fermer une ou **toutes les autres** d'un coup.
- **Accueil honnête** : le bloc « Reprendre » et l'« Activité récente » viennent des données du compte (cours commencé, progression, prochaine leçon, derniers messages de discussion, dernière copie déposée). Un compte neuf ne voit **aucun contenu inventé** : le bloc reste masqué tant qu'il n'y a rien (`GET /api/activite`).
- **Espace formateur** : un compte créé en *formateur* voit l'entrée **Corrections** dans son profil, y lit les copies déposées par les apprenants (filtres par cours et par statut) et peut **les noter** (`PATCH /api/submissions/{id}`).

---

## Cours payants et abonnements (NOVA Checkout)

- **Tous les cours sont payants** : les leçons, vidéos, ressources, quiz et discussions d'un cours s'ouvrent
  après l'achat — ou avec un **abonnement**, qui débloque **tous les cours** d'un coup.
- **Deux façons de payer** : un cours à l'unité (3 000 à 4 500 F, accès définitif) ou une formule
  d'abonnement (6 000 F les 30 jours, 15 000 F les 90 jours). Les tarifs sont servis par l'API
  (`GET /api/paiements/catalogue`) : l'application n'invente jamais un prix.
- **Parcours complet** : l'apprenant touche un contenu fermé → l'application demande une session au serveur
  (`POST /api/paiements/session`) → redirection vers la page **NOVA Checkout** → retour au site
  (`/?paiement=retour&session_id=…`) → **vérification côté serveur** (`POST /api/paiements/verifier`, ne se fie
  pas au navigateur) → l'accès s'ouvre, l'écran se rafraîchit. Le **webhook signé**
  (`POST /api/webhooks/nova`, HMAC `t.corps`, réponse 2xx en moins de 5 s, idempotent) sert de filet si
  l'apprenant ferme la page.
- **Écran « Abonnement & achats »** (profil) : statut de l'abonnement, formules, prix de chaque cours,
  historique des commandes et conditions.
- **Rien ne bloque l'application** : solde insuffisant, paiement annulé, session expirée, réseau coupé — chaque
  cas affiche un message clair et l'apprenant peut reprendre. Les comptes **formateur** et **administrateur**
  gardent l'accès à tout (ils animent les cours).
- **Aucun mode test chez NOVA** : la première session ouverte est un **vrai paiement**. Les clés se posent en
  variables d'environnement (voir [`DEPLOIEMENT-GITHUB-VERCEL.md`](DEPLOIEMENT-GITHUB-VERCEL.md)) — sans elles,
  le catalogue reste consultable et « Débloquer » répond « paiement indisponible ».

---

## Démarrage rapide

```bash
# 1. Le site — construire et servir en local
cd web
npm run build          # assemble src/ → index.html (vérifie l'intégrité des briques)
npm run serve          # http://localhost:8000

# 2. L'API — dans un second terminal
cd api
npm ci
cp .env.example .env.local     # puis coller la chaîne de connexion Neon dans DATABASE_URL
npm run db:migrate             # crée les 30 tables
npm run db:seed                # insère les données de démonstration
npm run dev                    # http://localhost:3000  (GET /api/health pour vérifier)

# 3. Relier le site à l'API
#    Déployés ensemble (une seule adresse) : rien à configurer, l'application
#    détecte l'API du même domaine et il ne reste qu'à se connecter.
#    En local ou sur un site séparé : Profil → Paramètres → Synchronisation serveur
#    → adresse http://localhost:3000 + un compte de démo ci-dessous,
#    ou ouvrir le site avec ?api=http://localhost:3000
#    (l'aperçu « une seule URL » s'obtient avec : npm --prefix api run build && npm --prefix api start,
#     puis http://localhost:3000/       )
```

Comptes de démonstration : `amina@cosmetilab.bj` / `demo1234` (apprenante, progression déjà remplie), `awa@cosmetilab.bj` / `prof1234` (formatrice, avec deux copies à noter), `admin@cosmetilab.bj` / `admin1234` (administrateur). **Créez aussi votre propre compte** : l'application propose un écran de connexion, une inscription (apprenant ou formateur) et un mode « explorer sans compte »..

---

## Commandes

Depuis la **racine** (raccourcis, aucun paquet à installer à ce niveau) :

| Commande | Effet |
|---|---|
| `npm run build` | Assemble le site (`web/src/` → `web/index.html`) **et** publie la copie servie par l'API |
| `npm run site:sync` / `site:verifier` | (Re)publie `api/public/index.html` / vérifie qu'il n'a pas divergé |
| `npm run verifier` | 15 contrôles sur le livrable, dont l'anti-dérive sources ↔ index.html |
| `npm run test` | Suite navigateur (Chromium mobile 390 × 844) sur le site |
| `npm run test:comptes` | Suite « comptes et temps réel » (inscription, données séparées, corrections du formateur) — nécessite l'API |
| `npm run test:tout` | Les deux suites navigateur |
| `npm run apercu` | Sert le site sur http://localhost:8000 |
| `npm run api:dev` / `api:build` / `api:typecheck` | API Next.js |
| `npm run db:migrate` / `db:seed` / `db:check` / `db:reset` | Base Neon |
| `npm run api:smoke` | 38 vérifications de l'API (santé, auth, lecture, écriture) — accepte une URL d'API déployée |
| `npm --prefix api run paie:verif` | 23 vérifications du paiement : catalogue, verrous, offre admin, abonnement, webhook signé, rejeu |
| `npm run api:nova` | Vérifie les **clés NOVA** en vrai : crée une session de test, relit son état, l'annule (aucun débit) |
| `npm run api:comptes --silent` | Liste / nettoie les comptes créés par les suites de test (`api/scripts/nettoyer-comptes.js`) |
| `npm run verifier-tout` | Contrôles du site + types de l'API + état de la base + test de fumée |

Détail par projet : [`web/README.md`](web/README.md) et [`api/README.md`](api/README.md).
### Ce que la v2 apporte

| Domaine | Ce qui a changé |
| --- | --- |
| Profil | 12 avatars, mot de passe (révoque les autres sessions), appareils connectés, accueil calculé sur le cours réellement commencé |
| Synchronisation | Tout ce qui est fait dans l'app est rangé sur le compte : notifications, discussions, agenda, téléchargements, notes, profil, réglages — et revient sur les autres appareils sans recharger |
| Espace formateur | Créer/modifier un cours, ajouter ou retirer leçons, ressources et séances, suivre les apprenants (progression, dépôts à corriger) |
| Apprentissage | Reprise de lecture à la seconde, historique des tentatives de quiz, recherche serveur, attestations imprimables, mode hors-ligne annoncé |
| Qualité | 18 pages vérifiées, aucun contrôle mort, accessibilité contrôlée, images WebP (−18 % de poids : 1 242 Ko au total) |

Référence des 56 routes : [`api/API.md`](api/API.md).

---

## Structure du dépôt

```
cosmetilab/
├── web/                       Le site (un seul fichier) et son outillage
│   ├── index.html             ← livrable assemblé (1 392 Ko) — ne pas modifier à la main
│   ├── build.js               Assemble src/ → index.html
│   ├── verify.js              15 contrôles (dont : le fichier correspond-il aux sources ?)
│   ├── package.json           npm run build | verify | test | serve
│   ├── vercel.json            Réglages Vercel du projet statique (en-têtes, cleanUrls)
│   ├── _headers               Mêmes en-têtes pour Netlify / Cloudflare Pages
│   ├── src/                   Sources : shell.html, app.js, core.js, lms.js, images.json, clip.json
│   └── tests/                 serveur.js (aperçu local) + navigateur.js (suite réelle)
│
├── api/                       Le backend Next.js + TypeScript (projet Vercel unique)
│   ├── src/app/api/**         56 routes (cours, leçons, quiz, devoirs, auth, progression, paiement, activité…)
│   ├── src/app/api-doc/       Page de documentation des routes (sur /api-doc)
│   ├── src/lib/**             db.ts (Neon), auth.ts (scrypt + jetons), http.ts, validation.ts
│   ├── public/index.html      Copie publiée du site, servie sur / (régénérée, ne pas éditer)
│   ├── db/                    schema.sql, seed.sql, data.json (contenus de démo versionnés)
│   ├── scripts/               db.js (migrate/seed/check/reset), smoke.js, sync-site.js, gen-seed.js
│   ├── vercel.json            Réglages Vercel du projet Next.js
│   ├── README.md · API.md · vercel.md
│   └── .env.example           Modèle : DATABASE_URL + AUTH_SECRET (jamais de secret dans le dépôt)
│
├── docs/
│   ├── HEBERGEMENT.md         Publier le site seul (Netlify, Pages, Cloudflare…)
│   └── captures/              30 captures d'écran de l'application
│
├── DEPLOIEMENT-GITHUB-VERCEL.md   Publier le dépôt : GitHub puis 2 projets Vercel
├── publier-sur-github.sh          Envoi du code vers github.com/andyizyfleyr/lms
├── ARCHITECTURE.md                Comment c'est construit, et pourquoi
├── package.json                   Raccourcis de commandes
└── LICENSE                        MIT
```

---

## Vérifications déjà passées sur cette version

| Contrôle | Résultat |
|---|---|
| Assemblage du site (`build.js`) | 12 contrôles d'intégrité · 1 427 Ko |
| Contrôles statiques (`verify.js`) | **15 OK / 0** |
| Suite navigateur (Chromium mobile) | **43 OK / 0** sans API · **93 OK / 0** avec l'API (paywall, avatar, appareils, synchronisation par compte, espace formateur, reprise de lecture, attestations, audit qualité) |
| Suite comptes et temps réel | **26 OK / 0** (écran d'entrée, inscription, données séparées, mise à jour automatique, notation) |
| Paiement de bout en bout (`npm --prefix api run paie:verif`) | **23 OK / 0** (catalogue, verrous, offre, abonnement, webhook signé, rejeu) |
| Test de fumée de l'API (`npm run api:smoke`) | **38 OK / 0** |
| Types de l'API (`tsc --noEmit`) | 0 erreur |
| Build Next.js | 56 routes `ƒ Dynamic` |
| Base Neon (`db.js check`) | 30 tables, 6 cours, 59 leçons, 4 comptes |

La suite navigateur vérifie ce qui doit rester vrai : navigation entre les quatre onglets, ouverture des fiches de cours, **retour** (bouton de l'app *et* bouton du téléphone), quiz, devoirs, **lecture vidéo dans le site** (YouTube en ligne, extrait intégré hors-ligne), thème, persistance, et **synchronisation dans les deux sens** avec l'API.

---

## Publier

- **Tout en une seule URL** (recommandé) : un projet Vercel, Root Directory `api` → l'application sur `/`,
  l'API sur `/api/*` → [`DEPLOIEMENT-GITHUB-VERCEL.md`](DEPLOIEMENT-GITHUB-VERCEL.md)
  — dépôt cible : <https://github.com/andyizyfleyr/lms>, envoi en une commande avec `./publier-sur-github.sh`
- **Le site seul** sur un hébergeur statique (Netlify, GitHub Pages, Cloudflare…) → [`docs/HEBERGEMENT.md`](docs/HEBERGEMENT.md)

Résumé : **un seul projet Vercel** — *Root Directory* `api`, framework Next.js, variables `DATABASE_URL` et
`AUTH_SECRET`. Next.js sert alors l'application (fichier unique publié dans `api/public/`) sur `/` et l'API sur
`/api/*` : l'application détecte le serveur toute seule, il ne reste qu'à se connecter avec un compte de démo.
(La variante « deux projets » — site statique d'un côté, API de l'autre — reste possible : voir la fin du guide.)

---

## Licence

MIT — voir [`LICENSE`](LICENSE).
