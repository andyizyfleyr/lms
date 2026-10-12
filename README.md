# LearnHub

Tableau de bord **LMS mobile** (Material Design 3) livré sous forme de **fichier HTML unique**, accompagné de son **API Next.js + base Neon**.

- **Le site** : `web/index.html` — 769 Ko, HTML + CSS + JavaScript + images (base64) + extrait vidéo intégré. Aucune dépendance externe (la seule exception est l'iframe YouTube du lecteur vidéo). Il se publie sur n'importe quel hébergeur statique.
- **L'API** : `api/` — Next.js 15 (App Router) + TypeScript + Neon/PostgreSQL, **43 routes** et 26 tables. Elle sert la synchronisation de la progression (et tout le reste : cours, quiz, devoirs, ressources, notifications, recherche, statistiques).
- **Le tout tient sur une seule adresse** : un seul projet Vercel sert l'application sur `/` et l'API sur `/api/*`
  (Next.js publie `api/public/index.html`, copie du livrable). Voir [`DEPLOIEMENT-GITHUB-VERCEL.md`](DEPLOIEMENT-GITHUB-VERCEL.md).

L'application fonctionne **toute seule** (progression dans le navigateur) : l'API est facultative, mais dès qu'elle est configurée, la progression se retrouve sur tous les appareils.

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
npm run db:migrate             # crée les 26 tables
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

Comptes de démonstration : `amina@learnhub.bj` / `demo1234` (étudiante), `adjovi@learnhub.bj` / `prof1234` (enseignante), `admin@learnhub.bj` / `admin1234` (administrateur).

---

## Commandes

Depuis la **racine** (raccourcis, aucun paquet à installer à ce niveau) :

| Commande | Effet |
|---|---|
| `npm run build` | Assemble le site (`web/src/` → `web/index.html`) **et** publie la copie servie par l'API |
| `npm run site:sync` / `site:verifier` | (Re)publie `api/public/index.html` / vérifie qu'il n'a pas divergé |
| `npm run verifier` | 13 contrôles sur le livrable, dont l'anti-dérive sources ↔ index.html |
| `npm run test` | Suite navigateur (Chromium mobile 390 × 844) sur le site |
| `npm run apercu` | Sert le site sur http://localhost:8000 |
| `npm run api:dev` / `api:build` / `api:typecheck` | API Next.js |
| `npm run db:migrate` / `db:seed` / `db:check` / `db:reset` | Base Neon |
| `npm run api:smoke` | 34 vérifications de l'API (santé, auth, lecture, écriture) — accepte une URL d'API déployée |
| `npm run verifier-tout` | Contrôles du site + types de l'API + état de la base + test de fumée |

Détail par projet : [`web/README.md`](web/README.md) et [`api/README.md`](api/README.md).
Référence des 43 routes : [`api/API.md`](api/API.md).

---

## Structure du dépôt

```
learnhub/
├── web/                       Le site (un seul fichier) et son outillage
│   ├── index.html             ← livrable assemblé (769 Ko) — ne pas modifier à la main
│   ├── build.js               Assemble src/ → index.html
│   ├── verify.js              13 contrôles (dont : le fichier correspond-il aux sources ?)
│   ├── package.json           npm run build | verify | test | serve
│   ├── vercel.json            Réglages Vercel du projet statique (en-têtes, cleanUrls)
│   ├── _headers               Mêmes en-têtes pour Netlify / Cloudflare Pages
│   ├── src/                   Sources : shell.html, app.js, core.js, lms.js, images.json, clip.json
│   └── tests/                 serveur.js (aperçu local) + navigateur.js (suite réelle)
│
├── api/                       Le backend Next.js + TypeScript (projet Vercel unique)
│   ├── src/app/api/**         43 routes (cours, leçons, quiz, devoirs, auth, progression…)
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
| Assemblage du site (`build.js`) | 8 contrôles d'intégrité · 769 Ko |
| Contrôles statiques (`verify.js`) | **13 OK / 0** |
| Suite navigateur (Chromium mobile) | **37 OK / 0** sans API · **42 OK / 0** avec API · **43 OK / 0** en mode « une seule URL » |
| API fonctionnelle (43 routes, tous les cas, erreurs incluses) | **81 OK / 0** |
| Test de fumée de l'API (`npm run api:smoke`) | **34 OK / 0** |
| Types de l'API (`tsc --noEmit`) | 0 erreur |
| Build Next.js | 43 routes `ƒ Dynamic` |
| Base Neon (`db.js check`) | 26 tables, 6 cours, 48 leçons, 3 comptes |

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
