# Déployer l'API sur Vercel

Ce dossier est **un projet Vercel à part entière** : il se déploie indépendamment du site (`web/`),
depuis le même dépôt GitHub. Guide complet du dépôt : `../DEPLOIEMENT-GITHUB-VERCEL.md`.

## Réglages du projet Vercel

Ce dossier est **le projet Vercel** (un seul, qui sert aussi l'application) : Next.js publie
`api/public/index.html` — copie du livrable `web/index.html` — sur `/`, et l'API sur `/api/*`.

| Réglage | Valeur |
|---|---|
| Root Directory | **`api`** |
| Framework Preset | **Next.js** (détecté) |
| Build Command | `npm run build` — déjà dans `vercel.json` |
| Install Command | `npm ci` — déjà dans `vercel.json` (le `package-lock.json` est versionné) |
| Output Directory | *(par défaut, fourni par Next.js)* |
| Node.js Version | 20.x ou 22.x |
| Region | `iad1` (déjà dans `vercel.json`) — à garder près de la région Neon |

> Ne surcharge *Build Command* / *Install Command* / *Output Directory* dans l'interface **que** si tu
> sais pourquoi : `vercel.json` est la source de vérité, et il est versionné.

## Ce que le projet sert

| URL | Contenu | Origine |
|---|---|---|
| `/` | l'application CosmétiLab (mobile) | `api/public/index.html` (copie de `web/index.html`) |
| `/api/*` | l'API JSON (44 routes) | `src/app/api/**/route.ts` |
| `/api-doc` | documentation des routes | `src/app/api-doc/page.tsx` |

Le renvoi de `/` vers le fichier statique est déclaré dans `next.config.mjs` (`rewrites`) : l'application
est servie par le CDN, sans passer par une fonction serverless.

**Avant chaque déploiement**, la copie doit être à jour : `npm run site:sync` (ou `npm run build` depuis la
racine, qui enchaîne l'assemblage du site et la copie). Le contrôle `npm run site:verifier` échoue si les
deux fichiers divergent.

## Variables d'environnement (obligatoires)

À renseigner pour *Production*, *Preview* et *Development* :

| Nom | Valeur | Remarque |
|---|---|---|
| `DATABASE_URL` | chaîne de connexion Neon (avec *pooling* et `sslmode=require`) | à prendre dans la console Neon → *Connect* |
| `AUTH_SECRET` | chaîne aléatoire longue : `openssl rand -hex 32` | signe les jetons (30 jours) ; le changer déconnecte tout le monde |

Une variable ajoutée après un déploiement demande un **Redeploy** pour être prise en compte.

## Préparer la base (une fois, et à chaque `db:reset`)

En local, avec `DATABASE_URL` défini (dans `api/.env.local` ou dans l'environnement) :

```bash
npm ci
npm run db:migrate     # 26 tables
npm run db:seed        # contenus + 3 comptes de démonstration
npm run db:check       # volumes attendus
```

Ces commandes s'exécutent depuis ta machine et écrivent dans la base Neon : rien à installer côté Vercel.

## Après le déploiement — vérifications

```bash
curl https://TON-API.vercel.app/api/health
# { "ok": true, "data": { "statut": "ok", "base": "Neon", "tables": 26, "cours": 6, "comptes": 3 } }

curl -X POST https://TON-API.vercel.app/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"amina@cosmetilab.bj","motDePasse":"demo1234"}'
# { "ok": true, "data": { "token": "…", "user": { … } } }
```

Test de fumée complet contre la production (34 vérifications, écritures nettoyées derrière) :

```bash
cd api && npm run smoke -- https://TON-API.vercel.app
```

Ensuite, relie le site : *Paramètres → Synchronisation serveur* (ou `?api=https://TON-API.vercel.app`).

## Notes techniques

- Les **44 routes** sont en `runtime = 'nodejs'` et `dynamic = 'force-dynamic'` : elles ne sont jamais
  mises en cache statique, la progression est toujours lue en direct.
- **CORS** : `Access-Control-Allow-Origin: *` (l'appel vient d'un autre domaine), avec les en-têtes
  définis dans `next.config.mjs` et le pré-vol `OPTIONS` exporté par chaque route via `src/lib/http.ts`.
- **Neon** est interrogé par `@neondatabase/serverless` (HTTP + SSL) : aucune connexion persistante à
  gérer, ce qui convient parfaitement aux fonctions serverless.
- **Fichiers** envoyés en base64 (≤ 2,5 Mo) plutôt qu'en `multipart/form-data` : pas de dépendance de
  parsing côté serveur, et un seul format de requête pour toutes les routes.
- Le dossier `db/` (SQL + `data.json`) et `scripts/` sont versionnés : la base est **reproductible**
  (`npm run db:reset`) sans dépendre d'un export externe.

## Dépannage

| Symptôme | Cause | Correction |
|---|---|---|
| `/api/health` → `base_indisponible` | `DATABASE_URL` absente, invalide, ou contenant `&amp;` | corriger la variable → *Redeploy* → `npm run db:check` |
| `tables: 0` | base non migrée | `npm run db:migrate && npm run db:seed` |
| « No Next.js version detected » | Root Directory ≠ `api` | *Settings → Build and Deployment → Root Directory* = `api` |
| Connexion impossible depuis le site | adresse d'API erronée dans *Paramètres → Synchronisation* | corriger l'adresse ; le jeton expiré se reconnecte tout seul |
| 404 sur une route | URL mal orthographiée | la liste complète est dans `API.md` |
| Build Vercel échoue, local OK | `node_modules` local masquant le problème | `rm -rf node_modules && npm ci` puis relancer le build |
