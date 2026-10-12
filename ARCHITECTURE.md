# Architecture de LearnHub

Ce document explique **comment le projet est construit et pourquoi**, pour que toute modification
future reste compatible avec le déploiement (Vercel, Netlify, GitHub Pages) et avec les tests.

---

## 1. Un dépôt, deux projets, zéro ambiguïté

```
                    ┌──────────────────────────────────────────────┐
   Navigateur  ───► │  web/index.html   (site statique, 769 Ko)     │
   (mobile)         │  HTML + CSS + JS + images + extrait vidéo      │
                    └───────────────┬──────────────────────────────┘
                                    │  fetch JSON (facultatif)
                                    │  Authorization: Bearer <jeton>
                                    ▼
                    ┌──────────────────────────────────────────────┐
                    │  api/   Next.js 15 + TypeScript (43 routes)   │
                    └───────────────┬──────────────────────────────┘
                                    │  @neondatabase/serverless (HTTP/SSL)
                                    ▼
                    ┌──────────────────────────────────────────────┐
                    │  Neon PostgreSQL — 26 tables                   │
                    └──────────────────────────────────────────────┘
```

| Dossier | Nature | Hébergement | Point d'entrée |
|---|---|---|---|
| `web/` | Site statique (un seul fichier) | Vercel *framework Other*, Netlify, Pages, Cloudflare… | `web/index.html` |
| `api/` | Application Next.js | Vercel *framework Next.js* | `api/src/app/api/**/route.ts` |
| `docs/` | Documentation et captures | — (non déployé) | — |

**Pourquoi séparer ?** Les deux moitiés n'ont ni le même mode de publication, ni le même cycle de
vie : le site est un fichier qu'on construit localement et qu'on peut déposer n'importe où ; l'API est
une application serveur qui a besoin de variables d'environnement secrètes. Les mélanger dans un seul
projet Vercel provoque les erreurs les plus fréquentes : détection de framework erronée, page blanche,
`DATABASE_URL` manquante. Ici, **un déploiement = un dossier** :

- projet Vercel n° 1 → **Root Directory = `api`** → `api/vercel.json` (`framework: nextjs`, `npm ci`, région `iad1`)
- projet Vercel n° 2 → **Root Directory = `web`** → `web/vercel.json` (`framework: null`, `node build.js`, `outputDirectory: "."`, `cleanUrls: true`)

Aucune variable d'environnement n'est nécessaire pour le site ; `DATABASE_URL` et `AUTH_SECRET` ne sont
déclarées que dans le projet `api`. Le site trouve l'API par configuration utilisateur
(*Paramètres → Synchronisation serveur*, conservée dans `localStorage`) ou par l'adresse
`?api=https://…` / `#api=https://…` — donc aucun secret, et aucune URL en dur à modifier dans le code.

---

## 2. Le site : un fichier unique, assemblé depuis des sources lisibles

`web/index.html` est **généré**. On ne l'édite jamais à la main : sinon la version publiée et les
sources divergent silencieusement. Le pipeline est court et explicite (`web/build.js`) :

```
web/src/shell.html   structure HTML + <style> complet + sprite d'icônes (48 icônes)
web/src/images.json  const IMG = { … 7 images en base64 … }
web/src/clip.json    const CLIP_MP4 / CLIP_WEBM (extrait vidéo 24 s, 640×360, muet)
web/src/app.js       données, utilitaires, lecteur vidéo, synchronisation serveur (LHSYNC)
web/src/core.js      état persistant, routeur de pages, tableaux de bord
web/src/lms.js       pages pédagogiques : cours, quiz, devoirs
        │
        ▼  node build.js
web/index.html       769 Ko — le livrable, et le seul fichier à publier
```

`build.js` vérifie 8 briques après assemblage (structure HTML, sprite, images, extrait vidéo, noyau,
pages LMS, synchronisation, fin de document) et **sort en erreur** si l'une manque : impossible de
publier un fichier incomplet.

`verify.js` fait les 13 contrôles de sortie, dont un **contrôle anti-dérive** : il réassemble dans un
fichier temporaire et compare octet par octet avec `web/index.html`. Si quelqu'un a touché au livrable
sans toucher aux sources, le contrôle échoue.

### Invariants à ne jamais casser

1. **Fichier unique, aucune dépendance distante** : pas de `<script src>`, pas de `<link href>`, pas de
   CDN, pas de police externe. Seule exception : l'iframe YouTube du lecteur (exigence produit).
2. **Images et extrait vidéo en base64** : le site doit s'afficher et se lire hors-ligne (`file://`,
   iframe sans réseau, réseau coupé).
3. **Navigation avec retour** : chaque page est une `section.page` empilée par `pushPage()` /
   dépilée par `popPage()`. L'ouverture écrit une entrée d'historique, donc le **bouton retour du
   téléphone** fonctionne (écouteur `popstate`) en plus de la flèche de l'app.
4. **Adresse partageable** : l'état de navigation est reflété dans le `#hash` (`#cours/c1`,
   `#videos`, `#quiz/c1`…), et une adresse collée dans le navigateur rouvre la bonne page.
5. **Vidéos lues dans le site** : YouTube intégré quand c'est possible, sinon l'**extrait intégré**.
   Le lecteur YouTube n'est jamais montré avant que la lecture ait réellement commencé — c'est ce qui
   garantit que le message « Ce contenu est bloqué… » (affiché par YouTube) n'apparaît jamais.

### Le lecteur vidéo en trois temps

| Situation | Ce qui se passe | Message affiché |
|---|---|---|
| Réseau disponible | API YouTube chargée, `YT.Player` démarré dans `.playerStage` | aucun (lecture) |
| Réseau coupé (`navigator.onLine === false`) | Extrait intégré (MP4/WebM base64) joué immédiatement | « Hors connexion — extrait intégré au site… » |
| Aperçu iframe / `file://` (contexte hostile) | Extrait intégré + bouton *Essayer YouTube* | « YouTube bloqué dans ce contexte… » |
| YouTube injoignable ou lent | Bascule après 5 s (10 s si le lecteur est prêt, 30 s s'il bufferise) | « API YouTube injoignable (réseau)… » |
| Intégration interdite par le propriétaire | Extrait intégré + *Réessayer* | « Lecture YouTube bloquée (intégration interdite)… » |

### La synchronisation (`LHSYNC`, dans `core.js`)

- **Configuration** : adresse de l'API + e-mail + mot de passe (écran *Paramètres → Synchronisation
  serveur*), ou `?api=…`. Le jeton est conservé dans `localStorage` (`lh_token`).
- **Hydratation (serveur → app)** : `GET /api/progress?format=app` renvoie la progression dans la
  forme exacte de l'état local (`lh_lessons`, `lh_videos`, `lh_quiz`).
- **Envoi (app → serveur)** : `POST /api/lessons/:id/complete`, `PATCH /api/videos/:yt/progress`,
  `POST /api/quizzes/:id/attempts`, `POST /api/submissions`, `POST /api/notes`…
- **Économie de réseau** : la mémoire `lh_synced` retient ce qui est déjà parti (envois par paquets de
  8) ; seules les nouveautés sont poussées. Un changement de compte remet cette mémoire à zéro.
- **Identifiants de leçons** : local `c1:3` (cours + index) ↔ serveur `c1-m1-l1` (cours + module +
  leçon). La table de correspondance est construite au chargement, dans les deux sens.
- **Hors-ligne** : tout continue de fonctionner localement, la synchronisation reprend au retour du
  réseau (`navigator.onLine`).

---

## 3. L'API : Next.js + TypeScript + Neon

```
api/
├── src/app/api/**/route.ts     43 routes, toutes en runtime Node.js et `dynamic = force-dynamic`
├── src/lib/db.ts               client Neon (@neondatabase/serverless) + helpers q / q1 / exec
├── src/lib/auth.ts             mots de passe scrypt, jetons signés valables 30 jours
├── src/lib/http.ts             ok() / fail() / handler() / OPTIONS() : enveloppe commune
├── src/lib/validation.ts       schémas zod (corps de requête)
├── db/schema.sql               26 tables
├── db/seed.sql                 données de démonstration (générées depuis db/data.json)
└── scripts/db.js               migrate | seed | check | reset
```

**Conventions de réponse** (identiques partout, y compris pour les erreurs) :

```json
{ "ok": true,  "data": { … } }
{ "ok": false, "error": { "code": "…", "message": "…", "details": { … } } }
```

Autres règles : CORS `*` avec pré-vol `OPTIONS` exporté par les 43 routes ; authentification
`Authorization: Bearer <jeton>` ; fichiers envoyés en base64 (≤ 2,5 Mo) ; `runtime = 'nodejs'` (le
pilote Neon HTTP n'a pas besoin d'un runtime Edge, et Node évite les surprises de compatibilité).

**Contenus de démonstration versionnés.** `api/db/data.json` (33 Ko) contient les 6 cours, 13 vidéos,
28 questions de quiz, 5 devoirs, etc. Il est régénérable par `node scripts/extract-data.js` et sert de
source unique au seed (`gen-seed.js` → `seed.sql`). C'est ce qui permet de reconstruire une base
identique en deux commandes (`npm run db:reset`), sans dépendre d'un fichier local non versionné.

---

## 4. Vérifications : ce qui protège la publication

| Contrôle | Commande | Attendu |
|---|---|---|
| Intégrité de l'assemblage | `cd web && npm run build` | 8 contrôles, 769 Ko |
| Contrôles statiques + anti-dérive | `cd web && npm run verify` | 13 OK / 0 |
| Suite navigateur (mobile 390 × 844) | `cd web && npm run test` | 42 OK / 0 (37 sans API) |
| Types de l'API | `cd api && npm run typecheck` | 0 erreur |
| Test de fumée de l'API | `cd api && npm run smoke` | 34 OK / 0 |
| Build Next.js | `cd api && npm run build` | 43 routes |
| Base | `cd api && npm run db:check` | 26 tables, contenus présents |
| Tout d'un coup | `npm run verifier-tout` | vert (site + types + base + API) |

La suite navigateur a besoin de Playwright (`npm i -D playwright-core` puis
`npx playwright-core install chromium`) ; elle démarre elle-même son serveur statique et, si
`LEARNHUB_API_URL` est défini, vérifie aussi l'aller-retour avec l'API (connexion, hydratation,
envoi d'une leçon terminée dans l'app, relecture côté serveur).

---

## 5. Pièges connus et parades

| Piège | Symptôme | Parade en place |
|---|---|---|
| URL sans `/index.html` | page blanche / 404 | `cleanUrls: true` dans `web/vercel.json` ; fichier nommé `index.html` |
| Mauvais Root Directory | « No Next.js version detected », build impossible | un projet par dossier, `vercel.json` versionné dans chacun |
| `DATABASE_URL` copiée depuis un éditeur enrichi | `base_indisponible` (tables absentes) | remplacer `&amp;` par `&` — vérifier avec `npm run db:check` |
| `node_modules` préinstallé localement | le déploiement échoue là où le local passe | `npm ci` frais dans `api/` avant toute capture/déploiement |
| Next.js obsolète | vulnérabilité connue | épinglé sur `15.5.27` (dernier correctif de la branche 15.5) |
| Iframe YouTube en `file://` ou aperçu | YouTube affiche « Ce contenu est bloqué… » | lecteur YouTube masqué jusqu'à lecture réelle + extrait intégré |
| Vidéo trop lourde dans le fichier | site lent à charger | extrait 24 s deux encodages, ~190 Ko ; images ~304 Ko |
| Édition directe de `index.html` | sources et livrable divergents | `verify.js` échoue (anti-dérive) → relancer `build.js` |
