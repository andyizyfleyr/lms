# Publier CosmétiLab sur GitHub puis Vercel

**Tout tient sur une seule adresse** : l'application sur `/`, l'API sur `/api/*`, dans **un seul projet Vercel**.

```
https://lms-lovat-five.vercel.app/            → l'application CosmétiLab (mobile)
https://lms-lovat-five.vercel.app/api/health  → l'API Next.js (JSON)
https://lms-lovat-five.vercel.app/api-doc     → la documentation des 50 routes
```

**Dépôt : <https://github.com/andyizyfleyr/lms>** (branche `main`).

| Projet Vercel | Root Directory | Framework | Variables d'environnement |
|---|---|---|---|
| `lms` (un seul projet) | **`api`** | Next.js (détecté) | `DATABASE_URL`, `AUTH_SECRET` |

Comment Next.js sert les deux : `api/public/index.html` est une **copie publiée** de l'application
(`web/index.html`), et `api/next.config.mjs` renvoie `/` vers ce fichier. L'API, elle, occupe `/api/*`.
Une seule source de vérité reste `web/index.html` ; la copie est régénérée par `npm run build`
(ou `npm run site:sync`), et un contrôle (`npm run site:verifier`) échoue si les deux fichiers divergent.

---

## 0. Ce qu'il faut avoir

- [ ] Un compte **GitHub** et un compte **Vercel** (connexion à Vercel avec GitHub).
- [ ] Une base **Neon** avec sa chaîne de connexion (Console Neon → *Connect* → chaîne avec *pooling*).
- [ ] Node.js 20 ou plus (pour lancer les scripts et peupler la base).

---

## 1. Envoyer le code sur GitHub

Le dossier `cosmetilab-pour-github/` contient **déjà un dépôt Git complet** (119 fichiers suivis, un seul
commit, remote `origin` configuré, `.gitignore` qui exclut `node_modules/`, `.next/` et `.env.local`).

```bash
cd cosmetilab-pour-github
./publier-sur-github.sh            # HTTPS — ou ./publier-sur-github.sh ssh
./publier-sur-github.sh --etat     # pour vérifier sans rien envoyer
```

**Authentification du premier envoi**

- **HTTPS** : GitHub refuse le mot de passe du compte → *Settings → Developer settings → Personal access
  tokens → Fine-grained token*, portée `Contents: Read and write` sur ce dépôt ; il se colle **comme mot de passe**.
  Pour ne plus le retaper : `git config --global credential.helper store`.
- **SSH** : `ssh-keygen -t ed25519 -C "ton@email"`, puis coller `~/.ssh/id_ed25519.pub` dans
  *GitHub → Settings → SSH and GPG keys*. Test : `ssh -T git@github.com`.

> ⚠️ Un token qui a circulé (message, capture, dépôt…) doit être **révoqué** immédiatement :
> *Settings → Developer settings → Personal access tokens → Delete*.

**Mises à jour suivantes** — dans ton clone du dépôt :

```bash
npm run verifier        # contrôle le site et régénère index.html si besoin
npm run site:sync       # publie la copie servie par l'API
git add . && git commit -m "mise à jour" && git push
```

Vercel redéploie automatiquement à chaque `push` sur `main`.

---

## 2. Préparer la base Neon (une fois)

```bash
cd api
cp .env.example .env.local     # puis coller la chaîne de connexion dans DATABASE_URL
npm ci
npm run db:migrate             # crée les 30 tables
npm run db:seed                # contenus + 3 comptes de démonstration
npm run db:check               # volumes attendus
```

> ⚠️ Si tu copies la chaîne de connexion depuis un éditeur enrichi (Notes, Pages, courriel), les `&`
> peuvent devenir `&amp;` : la base devient injoignable (`base_indisponible`). Remplace `&amp;` par `&`.

---

## 3. Le projet Vercel (un seul)

1. **vercel.com → Add New… → Project** → *Import Git Repository* → choisis le dépôt **`lms`**.
2. **Root Directory** : clique *Edit* et sélectionne **`api`** — c'est le réglage décisif.
   Framework Preset : **Next.js** (détecté). Laisse *Build Command*, *Install Command* et
   *Output Directory* sur **« Override » coupé** : `api/vercel.json` s'en charge (`npm ci`, `next build`, région `iad1`).
3. **Environment Variables** (Production, Preview et Development) :

   | Nom | Valeur |
   |---|---|
   | `DATABASE_URL` | la chaîne de connexion Neon complète (`sslmode=require`) |
   | `AUTH_SECRET` | `openssl rand -hex 32` |
   | `NOVA_SECRET_KEY` | la clé marchande **`sk_live_…`** (NOVA → Paramètres → Intégration marchande) |
   | `NOVA_WEBHOOK_SECRET` | le secret **`whsec_…`** du webhook NOVA |
   | `SITE_URL` | `https://<projet>.vercel.app` — adresse de retour après paiement |

   **Paiement (NOVA Checkout)** — les trois dernières variables sont nécessaires pour vendre les cours.
   Sans elles, tout le reste fonctionne : le catalogue s'affiche et « Débloquer » répond
   « paiement indisponible » (`502 nova_indisponible`) au lieu de débiter.
   Côté NOVA, déclare le webhook sur `https://<projet>.vercel.app/api/webhooks/nova`
   (événements `checkout.session.paid` et `checkout.session.expired`) et recopie le `whsec_…` affiché.
   ⚠️ NOVA **n'a pas de mode test** : la première session ouverte est un **vrai paiement**.

   Après avoir posé les clés, tu peux les vérifier sans rien payer :
   `npm run api:nova` (ou `npm --prefix api run nova:verif`) crée une session de test, relit son état
   auprès de NOVA puis **l'annule** — aucune somme n'est débitée. Les adresses de retour devant être
   en **HTTPS**, garde bien `SITE_URL=https://<projet>.vercel.app` (une adresse `http://localhost` est
   refusée par NOVA : `success_url : HTTPS obligatoire`).

4. **Deploy**. Une minute plus tard :

   - `https://<projet>.vercel.app/` → **l'application** (titre d'onglet « CosmétiLab · Tableau de bord ») ;
   - `https://<projet>.vercel.app/api/health` → `{"ok":true,"data":{"statut":"ok","base":"Neon","tables":30,…}}` ;
   - `https://<projet>.vercel.app/api-doc` → la documentation de l'API.

   Si tu vois `base_indisponible` ou `tables: 0` : `DATABASE_URL` est en cause (chaîne invalide, `&amp;`,
   ou base non migrée → reviens à l'étape 2), puis *Deployments → ⋯ → Redeploy*.

---

## 4. Relier l'application à l'API : rien à faire

L'application détecte **toute seule** l'API servie sur le même domaine : au démarrage, elle interroge
`/api/health` ; si l'API répond, elle l'adopte (visible dans *Paramètres → Synchronisation serveur*,
statut « Adresse enregistrée, non connecté »). Il reste seulement à **se connecter** :

*Profil → Paramètres → Synchronisation serveur* → e-mail + mot de passe (`amina@cosmetilab.bj` / `demo1234`).

Sur un hébergeur purement statique (Netlify, GitHub Pages…), la sonde échoue : l'application reste
100 % fonctionnelle en local, et tu peux indiquer une API distante à la main —
`https://ton-site.netlify.app/?api=https://lms-lovat-five.vercel.app` — ou depuis l'écran de synchronisation.

---

## 5. Vérification finale (2 minutes)

- [ ] `https://<projet>.vercel.app/` affiche l'application (barre de navigation basse, cartes de cours).
- [ ] `/api/health` répond `ok: true`, `tables: 26`.
- [ ] La navigation fonctionne dans les deux sens : ouvrir un cours → retour → les quatre onglets.
- [ ] Une vidéo se lit dans la page (le lecteur YouTube intégré ; si YouTube est indisponible, l'extrait intégré prend le relais — jamais de message de blocage).
- [ ] *Paramètres → Synchronisation serveur* → statut « Connecté ».
- [ ] Terminer une leçon, recharger : elle reste cochée (et se retrouve sur un autre appareil).

Côté ligne de commande, tout est vérifiable aussi :

```bash
npm run verifier-tout                       # site + copie publiée + types + base + 34 tests d'API
cd api && npm run smoke -- https://<projet>.vercel.app
```

---

## 6. Dépannage

| Symptôme | Cause probable | Correction |
|---|---|---|
| La racine affiche la documentation de l'API | ancienne version déployée (avant le passage à l'URL unique) | vérifier que `/` sert l'application ; sinon *Redeploy* et contrôle que `api/public/index.html` est bien dans le dépôt |
| La racine affiche « 404 » | `api/public/index.html` absent du dépôt | `npm run site:sync` puis commit + push |
| `/api-doc` introuvable | route de documentation déplacée | elle est sur `/api-doc` (la racine appartient désormais à l'application) |
| Page blanche | cache navigateur | recharge avec `Ctrl+F5` |
| « No Next.js version detected » | Root Directory ≠ `api` | *Settings → Build and Deployment → Root Directory* = `api` |
| `base_indisponible`, `tables: 0` | `DATABASE_URL` invalide, `&amp;`, base non migrée | corriger la variable → *Redeploy* ; `npm run db:migrate && npm run db:seed` |
| Le site ne synchronise pas | non connecté (compte e-mail + mot de passe) | *Paramètres → Synchronisation serveur* ; le jeton dure 30 jours |
| Le déploiement passe en local mais pas sur Vercel | `node_modules` local masquant le problème | tester avec `npm ci` dans une copie propre du dépôt |

---

## 7. Variantes

- **Deux projets séparés** (site statique sur son propre domaine, API à part) : crée un second projet
  Vercel avec **Root Directory `web`** (framework *Other*, `web/vercel.json` fournit tout), puis, dans
  l'application du site, indique l'API avec `?api=https://<api>.vercel.app` ou l'écran de synchronisation.
  Le CORS est déjà ouvert (`Access-Control-Allow-Origin: *`), donc l'appel inter-domaines fonctionne.
- **Netlify existant** : remplacer simplement `index.html` (voir `docs/HEBERGEMENT.md`) ; pour brancher la
  progression sur ta base, ouvre le site avec `?api=https://lms-lovat-five.vercel.app`.
- **Domaine personnalisé** : *Settings → Domains* sur le projet. Certificat HTTPS automatique. Si l'adresse
  change, l'application se reconnecte toute seule (même domaine) ; sur un site statique distant, mets à jour
  l'adresse dans *Paramètres → Synchronisation*.
- **Sécurité** : ne committe jamais `.env.local` (dans `.gitignore`), garde `AUTH_SECRET` long et unique.
  Le changer invalide les jetons — tout le monde se reconnecte.
