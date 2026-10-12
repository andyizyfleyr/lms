# Publier LearnHub sur GitHub puis Vercel

**Dépôt cible : <https://github.com/andyizyfleyr/lms>** (branche `main`). Il existe déjà et il est
vide : rien à fusionner, le premier envoi sera aussi le premier commit.

Ce guide part du dossier fourni (`learnhub-pour-github/`, déjà committé) et va jusqu'aux deux sites
en ligne : **l'API** et **le site**, chacun dans son propre projet Vercel. Compte en main : environ 15 minutes.

Résumé de la cible :

| Projet Vercel | Root Directory | Framework | Variables d'environnement | Adresse obtenue |
|---|---|---|---|---|
| `lms-api` | `api` | Next.js (détecté) | `DATABASE_URL`, `AUTH_SECRET` | `https://lms-api.vercel.app` |
| `lms-web` | `web` | *Other* (aucun) | aucune | `https://lms-web.vercel.app` |

Rien à cocher, rien à deviner : les deux `vercel.json` sont déjà dans le dépôt et contiennent les
commandes de build, le dossier de sortie, la région et les en-têtes HTTP.

---

## 0. Ce qu'il faut avoir avant de commencer

- [ ] Un compte **GitHub**.
- [ ] Un compte **Vercel** (connexion avec GitHub : c'est ce qui active le déploiement automatique).
- [ ] Une base **Neon** avec sa chaîne de connexion (`postgresql://…@ep-….neon.tech/neondb?sslmode=require`).
      Console Neon → *Connect* → **Connection string** (celle avec *pooling*).
- [ ] Node.js 20 ou plus sur ta machine (pour créer le dépôt et, si tu veux, pour peupler la base).

---

## 1. Envoyer le code sur GitHub

Le dossier `learnhub-pour-github/` contient **déjà un dépôt Git complet** : 119 fichiers suivis,
un seul commit, le remote `origin` configuré vers `andyizyfleyr/lms`, et `.gitignore` qui exclut
`node_modules/`, `.next/` et `.env.local`. Il ne reste donc **qu'un seul envoi à faire**.

**Méthode la plus simple — le script fourni**

```bash
cd learnhub-pour-github
./publier-sur-github.sh            # HTTPS (demande ton identifiant GitHub + un token à la 1re fois)
./publier-sur-github.sh ssh        # ou via SSH, si ta clé est enregistrée dans GitHub
./publier-sur-github.sh --etat     # pour vérifier sans rien envoyer
```

Le script ne supprime rien et ne réécrit jamais l'historique : il (re)configure le remote, commit
d'éventuelles modifications, se met à jour en `--rebase` si le dépôt distant a changé, puis pousse.

**Ou à la main**

```bash
cd learnhub-pour-github
git remote -v                      # doit afficher : origin  https://github.com/andyizyfleyr/lms.git
git push -u origin main            # HTTPS — ou bien :
git remote set-url origin git@github.com:andyizyfleyr/lms.git && git push -u origin main
```

Tu préfères repartir de zéro ? Décompresse `learnhub-pour-github.zip` et lance `./publier-sur-github.sh` :
s'il ne trouve pas de dépôt Git, il l'initialise, committe les 119 fichiers et configure le remote.

**Authentification (premier envoi)**

- **HTTPS** : GitHub n'accepte plus le mot de passe du compte → *Settings → Developer settings →
  Personal access tokens → Fine-grained token*, portée `Contents: Read and write` sur ce dépôt, et
  colle le token comme mot de passe. Pour ne pas le retaper :
  `git config --global credential.helper store` (le token est enregistré sur ta machine uniquement).
- **SSH** : `ssh-keygen -t ed25519 -C "ton@email"` puis ajoute `~/.ssh/id_ed25519.pub` dans
  *GitHub → Settings → SSH and GPG keys*. Test : `ssh -T git@github.com`.

> Auteur du commit : le paquet utilise « LearnHub ». Pour signer à ton nom avant d'envoyer :
> `git commit --amend --author="Ton Nom <ton@email>"`

> Après l'envoi, vérifie sur GitHub la présence de `web/index.html`, `web/vercel.json`,
> `api/vercel.json` et `api/package-lock.json`. Si `index.html` manque, le site ne pourra pas être publié.

---

## 2. Préparer la base Neon (une seule fois)

Depuis ton dépôt local, avec la chaîne de connexion Neon sous la main :

```bash
cd api
cp .env.example .env.local          # puis coller la chaîne dans DATABASE_URL
npm ci
npm run db:migrate                  # crée les 26 tables
npm run db:seed                     # insère les contenus et les 3 comptes de démonstration
npm run db:check                    # doit afficher les tables et les volumes
```

> ⚠️ **Piège classique** : si tu copies la chaîne de connexion depuis un éditeur enrichi (Pages, Notes,
> courriel), les `&` peuvent devenir `&amp;` — la base devient alors injoignable (`base_indisponible`).
> Dans `DATABASE_URL`, remplace `&amp;` par `&`. `npm run db:check` le détecte immédiatement.

Tu peux aussi laisser Vercel faire le travail plus tard : les mêmes commandes fonctionnent depuis
n'importe quel terminal où `DATABASE_URL` est définie dans l'environnement.

---

## 3. Projet Vercel n° 1 — l'API

1. **vercel.com → Add New… → Project** → *Import Git Repository* → choisis le dépôt **`lms`**
   (autorise Vercel à lire `andyizyfleyr/lms` si GitHub le demande). Nomme le projet **`lms-api`**.
2. **Important** — avant de déployer, déplie *Root Directory* et sélectionne **`api`**.
   C'est le réglage le plus important de tout ce guide : sans lui, Vercel voit deux projets dans un
   même dépôt et échoue (« No Next.js version detected » ou build du mauvais dossier).
   Framework Preset : **Next.js** (détecté tout seul). Laisse *Build Command*, *Output Directory* et
   *Install Command* en **« Override : non »** — `api/vercel.json` s'en occupe (`npm ci`, `next build`, région `iad1`).
3. **Environment Variables** → ajoute, pour *Production*, *Preview* et *Development* :

   | Nom | Valeur |
   |---|---|
   | `DATABASE_URL` | la chaîne de connexion Neon complète (avec `sslmode=require`) |
   | `AUTH_SECRET` | une longue chaîne aléatoire — `openssl rand -hex 32` la génère |

4. **Deploy**. Au bout d'une minute environ, l'API est en ligne : `https://lms-api.vercel.app`.
5. **Vérifie** dans ton navigateur :
   - `https://lms-api.vercel.app/api/health` → doit répondre
     `{"ok":true,"data":{"statut":"ok","base":"Neon","tables":26,…}}` ;
   - si tu vois `base_indisponible` ou `tables: 0`, c'est `DATABASE_URL` (chaîne invalide, `&amp;`,
     ou base non migrée → reviens à l'étape 2).
   - note l'URL exacte : elle servira à l'étape 5.

> Une variable ajoutée **après** un déploiement nécessite un redéploiement :
> *Deployments → ⋯ → Redeploy*.

---

## 4. Projet Vercel n° 2 — le site

1. **Add New… → Project** → importe **le même dépôt** `lms` (Vercel autorise plusieurs projets sur un
   même dépôt : c'est le but). Nomme ce second projet **`lms-web`**.
2. Déplie *Root Directory* → **`web`**.
3. Framework Preset : **Other** (Vercel le déduit de `web/vercel.json`, qui contient `"framework": null`).
   Ne touche à rien d'autre : `web/vercel.json` définit déjà
   `buildCommand: node build.js`, `outputDirectory: "."` et `cleanUrls: true`.
4. **Aucune variable d'environnement n'est nécessaire** ici. (Le site ne contient aucun secret.)
5. **Deploy**, puis ouvre l'adresse obtenue. Ce que tu dois voir :
   - la page d'accueil du tableau de bord sur mobile (barre de navigation basse, cartes de cours) ;
   - l'adresse racine `https://lms-web.vercel.app` **et** `/index.html` fonctionnent toutes les deux ;
   - les vidéos se lisent dans la page ; si le réseau est coupé, l'extrait intégré prend le relais.

> **Pourquoi `cleanUrls: true` ?** Sans lui, une adresse sans `/index.html` peut renvoyer une page
> blanche ou une 404 — le piège n° 1 des sites statiques sur Vercel.

---

## 5. Relier le site à l'API

L'application enregistre la configuration dans le navigateur : il suffit de la renseigner une fois.

**Méthode A — depuis l'application (le plus simple)**
*Profil → Paramètres → **Synchronisation serveur*** → colle l'adresse de l'API
(`https://lms-api.vercel.app`), puis un e-mail et un mot de passe de démonstration
(`amina@learnhub.bj` / `demo1234`). Le statut passe à « Connecté ».

**Méthode B — par l'adresse (pratique pour partager un lien prêt à l'emploi)**

```
https://lms-web.vercel.app/?api=https://lms-api.vercel.app
```

Les deux méthodes donnent le même résultat : la progression locale est envoyée au serveur et
récupérée sur les autres appareils (téléphone ↔ ordinateur), sans compte à créer côté site.

**Astuce** : si tu possèdes un domaine personnalisé pour l'API, mets-le à jour ici — l'adresse peut
changer à tout moment, rien n'est codé en dur dans le fichier HTML.

---

## 6. Vérification finale (2 minutes)

- [ ] `https://lms-api.vercel.app/api/health` → `ok: true`, `tables: 26`.
- [ ] `https://lms-web.vercel.app` s'ouvre sur téléphone, sans erreur dans la console.
- [ ] La navigation fonctionne **dans les deux sens** : ouvrir un cours → retour → les quatre onglets.
- [ ] Une vidéo se lit dans la page (et hors-ligne, l'extrait intégré démarre).
- [ ] Connexion à l'API depuis *Paramètres → Synchronisation serveur* → statut « Connecté ».
- [ ] Terminer une leçon, puis rouvrir le site sur un autre appareil connecté : la leçon est cochée.

Tout cela est aussi vérifiable en local, sans déployer :

```bash
npm run verifier-tout     # depuis la racine du dépôt
```

---

## 7. Mettre à jour le site ou l'API

Chaque `git push` sur `main` redéploie automatiquement les deux projets concernés.

```bash
cd lms            # ton clone du dépôt
# modifier les sources du site (web/src/*.js, web/src/shell.html…) puis :
npm run verifier          # assemble index.html et refait les 13 contrôles
git add .
git commit -m "mise à jour du site"
git push
```

- **Ne modifie jamais `web/index.html` directement** : il est régénéré par `npm run build`, et
  `npm run verifier` échoue si le fichier publié ne correspond plus aux sources.
- Si le site ne change pas alors que le déploiement est *Ready*, c'est le cache du navigateur :
  recharge avec `Ctrl+F5` (le fichier est servi avec `must-revalidate`).
- Vercel redéploie aussi le site quand seule l'API change (et inversement). C'est sans danger :
  pour aller plus vite, *Settings → Git → Ignored Build Step* peut limiter un projet au dossier
  `api/` ou `web/` (par exemple `git diff --quiet HEAD^ HEAD -- .` côté `web`).

---

## 8. Dépannage

| Symptôme | Cause probable | Correction |
|---|---|---|
| « No Next.js version detected » | Root Directory mal réglé sur le projet API | *Settings → Build and Deployment → Root Directory* = `api` |
| Le projet API construit le site (ou l'inverse) | deux projets sur le même dépôt, Root Directory identique | vérifier que l'un pointe sur `api`, l'autre sur `web` |
| Page blanche sur le site | `cleanUrls` absent / fichier nommé autrement que `index.html` | déjà réglé par `web/vercel.json` ; sinon *Output Directory* doit être `.` |
| `base_indisponible`, `tables: 0` | `DATABASE_URL` invalide, `&amp;`, ou base non migrée | corriger la variable, puis *Redeploy* ; relancer `npm run db:migrate` |
| L'API répond mais les données sont vides | seed non exécuté | `npm run db:seed` (avec `DATABASE_URL` défini) |
| Le site ne synchronise pas | adresse d'API non renseignée, ou jeton expiré | *Paramètres → Synchronisation serveur* ; reconnexion (jeton 30 jours) |
| Erreur de build côté API après une mise à jour | `package-lock.json` désynchronisé | relancer `npm ci` en local, committer le nouveau `package-lock.json` |
| Le déploiement passe en local mais pas sur Vercel | `node_modules` local masquant le problème | tester avec `npm ci` dans une copie propre du dépôt |

---

## 9. Pour aller plus loin

- **Domaine personnalisé** : *Settings → Domains* sur chaque projet (par ex. `app.tondomaine.com`
  pour le site, `api.tondomaine.com` pour l'API). Certificat HTTPS automatique.
- **Mettre à jour le site déjà hébergé sur Netlify** : voir
  [`docs/HEBERGEMENT.md`](docs/HEBERGEMENT.md) (le fichier à remplacer est toujours `index.html`).
- **Base de données** : sauvegarde Neon = *Branches → Create branch* avant une opération risquée ;
  `npm run db:reset` reconstruit une base propre à partir de `api/db/data.json`.
- **Sécurité** : ne committe jamais `.env.local` (il est dans `.gitignore`), garde `AUTH_SECRET`
  long et unique, et renouvelle-le si tu le soupçonnes d'avoir fuité (cela invalide les jetons, donc
  tout le monde se reconnecte).
