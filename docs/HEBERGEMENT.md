# Héberger CosmétiLab gratuitement

## Ce qu'il faut savoir avant de commencer

CosmétiLab est un **site statique** : un seul fichier HTML qui contient le CSS, le JavaScript et les images (en base64).
Conséquences :

- **Aucun serveur, aucune base de données, aucun build** n'est nécessaire.
- N'importe quel hébergeur statique gratuit fonctionne (Netlify, GitHub Pages, Cloudflare Pages…).
- Le poids total à envoyer est de **1 392 Ko** — très en dessous de tous les quotas gratuits.
  Le fichier contient aussi un **extrait vidéo de 24 s** (intégré en MP4/H.264 *et* WebM/VP9, ~190 Ko) : c'est le repli utilisé quand YouTube est injoignable.
- Les données de progression (leçons, favoris, notes, réponses de quiz) sont stockées **dans le navigateur du visiteur** (`localStorage`), pas sur le serveur. Chaque visiteur a donc sa propre progression.

Dans le dépôt, le site est le dossier **`web/`** :
- **`web/index.html`** → le site lui-même (assemblé depuis `web/src/` par `npm run build`), c'est le seul fichier à publier ;
- **`web/_headers`** → en-têtes de sécurité/cache reconnus par Netlify et Cloudflare Pages ;
- **`web/vercel.json`** → mêmes en-têtes + réglages pour Vercel.

> Ce document couvre l'**hébergement du site seul** (Netlify, GitHub Pages, Cloudflare…).
> Pour publier **le dépôt complet avec l'API** sur Vercel, voir **`DEPLOIEMENT-GITHUB-VERCEL.md`**.

---

## Comparatif express

| Hébergeur | Compte requis | Difficulté | URL obtenue | HTTPS | Bande passante gratuite |
|---|---|---|---|---|---|
| **Netlify Drop** | oui (pour conserver) | ★ | `xxx.netlify.app` | oui | ~100 Go/mois |
| **GitHub Pages** | oui (GitHub) | ★★ | `pseudo.github.io/cosmetilab` | oui | ~100 Go/mois |
| **Cloudflare Pages** | oui | ★★ | `cosmetilab.pages.dev` | oui | illimitée |
| **Vercel** | oui | ★★ | `cosmetilab.vercel.app` | oui | ~100 Go/mois |
| **Surge.sh** | oui (ligne de commande) | ★★★ | `xxx.surge.sh` | oui | illimitée |
| **Neocities** | oui | ★ | `pseudo.neocities.org` | oui | 1 Go de stockage |

> Les quotas changent régulièrement : vérifie les conditions du service au moment de l'inscription.

---

## Option 1 — Netlify Drop (le plus rapide : ~2 minutes)

1. Va sur **https://app.netlify.com/drop**
2. Glisse le dossier **`deploy-netlify/`** (ou juste le fichier `index.html`) dans la zone de dépôt.
3. Le site est en ligne immédiatement, à une adresse du type `https://brillant-croquette-1a2b3c.netlify.app`.
4. Crée un compte gratuit (e-mail ou GitHub) → le site est conservé et tu peux :
   - le renommer : **Site configuration → Change site name** → `cosmetilab-lms.netlify.app`
   - mettre à jour : onglet **Deploys → Drag and drop** (re-glisse le fichier)

## Option 2 — GitHub Pages (URL stable, historique des versions)

```bash
# dans un dossier contenant index.html (par ex. deploy-netlify/)
git init
git add index.html
git commit -m "CosmétiLab — dashboard LMS mobile"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/cosmetilab.git
git push -u origin main
```

Puis dans le navigateur :
**dépôt → Settings → Pages → Source : « Deploy from a branch » → Branch : `main` / `(root)` → Save**

Adresse au bout de 1 à 2 minutes : **`https://TON-COMPTE.github.io/cosmetilab/`**

Mise à jour : `git add index.html && git commit -m "maj" && git push` (redéploiement automatique).

## Option 3 — Cloudflare Pages (bande passante illimitée)

1. **https://pages.cloudflare.com** → *Create a project* → *Upload assets*
2. Glisse le dossier `deploy-netlify/`, donne un nom au projet (`cosmetilab`)
3. Adresse : **`https://cosmetilab.pages.dev`**

Le CDN Cloudflare est généralement le plus rapide depuis l'Afrique de l'Ouest.

## Option 4 — Vercel (en une commande)

```bash
npx vercel --prod        # dossier courant = celui qui contient index.html
```
Adresse : `https://cosmetilab.vercel.app`

## Option 5 — Surge.sh (ligne de commande, sans interface web)

```bash
npx surge deploy cosmetilab-lms.surge.sh
```
Un compte est créé au premier lancement (e-mail + mot de passe demandés dans le terminal).

## Option 6 — Neocities / tiiny.host

- **Neocities** (https://neocities.org) : 1 Go gratuit, éditeur en ligne, adresse `pseudo.neocities.org`. Idéal si tu veux tout faire dans le navigateur, sans terminal.
- **tiiny.host** (https://tiiny.host) : glisser-déposer sans compte. La formule gratuite limite la durée de vie du lien — vérifie avant de t'en servir pour rendre un projet.

---

## Tester en local avant de publier

```bash
cd web
npm run serve            # serveur local sur http://localhost:8000
# (équivalent sans Node : python3 -m http.server 8000 dans web/)
# puis ouvre http://localhost:8000 dans le navigateur (ou depuis le téléphone sur le même Wi-Fi :
# http://ADRESSE-IP-DU-PC:8000)
```

Cela reproduit exactement les conditions d'un vrai hébergement (contrairement à l'ouverture directe du fichier en `file://`).

---

## Après la mise en ligne

- **Ouvre l'URL sur ton téléphone** : l'application est conçue mobile-first (390 × 844 → plein écran, FAB, barre de navigation basse, mini-lecteur).
- **HTTPS est fourni automatiquement** par tous les hébergeurs ci-dessus. C'est important ici : sans HTTPS, `localStorage` (progression, favoris, notes) et la copie de lien (*Partager*) sont bloqués par le navigateur.
- **Les vidéos se lisent directement dans le site**, sans quitter la page :
  - réseau disponible → le **lecteur YouTube intégré** démarre tout seul (titre, chaîne, progression, plein écran) ;
  - réseau coupé ou YouTube injoignable → le lecteur bascule automatiquement sur l'**extrait vidéo intégré au fichier** (bandeau « API YouTube injoignable — extrait intégré au site » + bouton **Réessayer**).
  Quand le réseau revient, la bascule inverse se fait toute seule.
  Dans l'aperçu d'Arena (iframe sans réseau), c'est donc l'extrait intégré qui s'affiche : le comportement est normal.
- **Fichier ouvert en double-clic (`file://`) ou aperçu en iframe protégée** : YouTube **refuse** la lecture dans ces contextes (c'est lui qui affiche « Ce contenu est bloqué… »). L'application le détecte : elle démarre directement l'extrait intégré et propose un bouton **Essayer YouTube**. Elle ne montre jamais le lecteur YouTube tant que la lecture n'a pas réellement commencé — donc ce message de blocage n'apparaît plus. Pour les vidéos complètes, mets le site en ligne (ci-dessous) : là, YouTube se lance normalement.
- **Lien profond vers une vidéo** : `https://ton-adresse/?vid=zZkNOdBWgFQ` ouvre directement le lecteur sur cette vidéo.
- **Mise à jour** : remplace `index.html` par la nouvelle version → même adresse (détail des trois méthodes dans la section « Mettre à jour le site déjà hébergé sur Netlify » plus bas). Si l'ancienne version s'affiche encore, recharge avec `Ctrl+F5` (ou vide le cache) : le fichier est servi avec `must-revalidate`.
- **Connecter un dépôt Git** (Netlify / Cloudflare / Vercel) : chaque `git push` redéploie automatiquement.

## Mettre à jour le site déjà hébergé sur Netlify

Rien de spécial à refaire : on **remplace `index.html`** et Netlify republie sur **la même adresse** (ton lien ne change pas, personne n'a à le réenregistrer).
Trois façons de faire, de la plus simple à la plus automatisée.

### Méthode A — par l'interface, en glissant le dossier (30 secondes)

1. Va sur **https://app.netlify.com** → clique sur **ton site**.
2. Onglet **Deploys** → en bas, zone **« Drag and drop your site output folder here »**.
3. Glisse le dossier **`deploy-netlify/`** (il contient `index.html` = la nouvelle version, et `_headers`) — ou le fichier **`learnhub-pour-netlify.zip`** fourni juste à côté.
4. Le nouveau déploiement passe de *Building* à **Published** en quelques secondes. L'URL est inchangée.

> Si la mise à jour n'apparaît pas, c'est du cache : **Deploys → Trigger deploy → « Clear cache and deploy site »**, puis recharge la page (`Ctrl+F5`, ou onglet privé sur téléphone).

### Méthode B — Netlify CLI, une seule commande

```bash
npm install -g netlify-cli     # une fois
netlify login                  # ouvre le navigateur pour autoriser
cd chemin/vers/le/dossier/deploy-netlify
netlify link                   # choisit le site Netlify existant (une fois)
netlify deploy --prod --dir=.  # publie la nouvelle version
```
À la fin, la commande affiche l'URL publiée. Les fois suivantes, seules les deux dernières lignes sont nécessaires.

### Méthode C — si ton site Netlify est connecté à un dépôt Git

Remplace `index.html` dans le dépôt, puis :
```bash
git add index.html && git commit -m "mise à jour CosmétiLab" && git push
```
Netlify redéploie automatiquement dès le `push` (onglet **Deploys** pour suivre l'avancement).

### Vérifier que la nouvelle version est bien en ligne

- Onglet **Deploys** : le premier déploiement doit être marqué **Published** avec l'heure du jour.
- Ouvre l'URL et regarde la taille du fichier servi (F12 → onglet **Network/Réseau** → `index.html` ≈ **751 Ko**).
- Test rapide du lecteur : ouvre une vidéo → le lecteur YouTube démarre seul ; coupe le réseau → un bandeau « extrait intégré au site » apparaît et l'extrait joue.

### Bon à savoir

- **Ne renomme pas** `index.html` : c'est ce nom qui fait que l'adresse racine fonctionne.
- **`_headers` doit rester à la racine** du dossier publié, à côté d'`index.html` (il envoie `must-revalidate`, donc les visiteurs reçoivent vite la nouvelle version).
- **Ta progression n'est pas concernée** : les données (leçons, notes, quiz) sont stockées dans le navigateur de chaque visiteur, pas sur Netlify. Un redéploiement ne les efface pas.
- **Retour arrière possible** : Deploys → clique sur un ancien déploiement → **Publish deploy** pour republier cette version.
- Si tu n'avais déposé que `index.html` au départ (sans le dossier), tu peux continuer ainsi : remplace simplement ce fichier. Déposer le dossier `deploy-netlify/` complet ajoute en plus les en-têtes de sécurité.

## Backend et synchronisation (facultatif)

L'application fonctionne seule. Si tu veux **retrouver la progression sur tous les appareils**, un
backend **Next.js + Neon** est prêt dans le dossier **`api/`** (44 routes, 26 tables) :
voir `api/README.md` et `api/API.md`, et **`DEPLOIEMENT-GITHUB-VERCEL.md`** pour la mise en ligne.

1. Déploie l'API sur Vercel (projet Vercel avec **Root Directory = `api`**) puis renseigne `DATABASE_URL`.
2. Dans le site : *Profil → Paramètres → Données et stockage → **Synchronisation serveur***
   → adresse de l'API + e-mail + mot de passe. Ou plus court :
   `https://ton-site.netlify.app/?api=https://ton-api.vercel.app`.

Si l'API et le site sont servis **sur la même adresse** (déploiement Vercel « une seule URL » décrit dans
`DEPLOIEMENT-GITHUB-VERCEL.md`), il n'y a **rien à configurer** : l'application détecte l'API au démarrage.

Hors-ligne, tout continue de fonctionner sur l'appareil ; la synchronisation reprend au retour du réseau.

## Nom de domaine personnalisé (facultatif)

Les sous-domaines gratuits (`*.netlify.app`, `*.pages.dev`, `*.vercel.app`) suffisent pour un usage scolaire.
Pour un vrai domaine, il en coûte environ 5 à 12 €/an :

1. Acheter le domaine chez un registrar (Namecheap, OVH, Cloudflare Registrar…).
2. Chez l'hébergeur : **Custom domain** → ajouter le domaine.
3. Chez le registrar : créer un enregistrement **CNAME** vers l'adresse fournie par l'hébergeur (ex. `cosmetilab-lms.netlify.app`).
4. Le certificat HTTPS est émis automatiquement en quelques minutes.

## À éviter

- ❌ Ne pas compresser le fichier en `.zip` pour l'envoyer : les hébergeurs attendent un fichier HTML (ou un dossier) tel quel.
- ❌ Ne pas renommer en `.txt`, ni ouvrir/renregistrer le fichier dans un traitement de texte (il serait corrompu).
- ❌ Pas besoin d'un hébergement « Node », « PHP » ou d'une base de données : tout tourne côté navigateur.
- ❌ Inutile de mettre en ligne `web/src/` (les sources du fichier unique), `api/` ou `docs/` sur un hébergeur statique : seul `web/index.html` est nécessaire au site.
- ℹ️ Sur Netlify, tu peux glisser-déposer le dossier **`deploy-netlify/`** fourni (il contient `index.html` + `_headers`) ou l'archive **`learnhub-pour-netlify.zip`**.

---

## Récapitulatif en une phrase

Glisse le dossier **`deploy-netlify/`** sur **`app.netlify.com/drop`** → tu obtiens une URL HTTPS partageable en 2 minutes ; pour une adresse stable et versionnée, utilise **GitHub Pages** avec les commandes Git ci-dessus.
