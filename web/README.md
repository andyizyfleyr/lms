# web/ — le site (fichier HTML unique)

`index.html` est **le site entier** : HTML, CSS, JavaScript, images (base64) et extrait vidéo intégré.
Il se publie sur n'importe quel hébergeur statique et fonctionne même ouvert en double-clic depuis un
téléphone. C'est un fichier **généré** : on modifie les sources dans `src/`, puis on réassemble.

| | |
|---|---|
| Taille | 1 392 Ko (≈ 1,4 Mo) |
| Extérieur | aucune dépendance (pas de CDN, pas de police externe, pas de script distant) |
| Exception | l'iframe YouTube du lecteur vidéo (exigence produit), avec repli intégré si elle échoue |
| Poids des médias | ~885 Ko d'images, ~189 Ko d'extrait vidéo (MP4 + WebM) |
| Thème | clair / sombre / système, au choix dans Paramètres |

## Commandes

```bash
npm run build      # src/ → index.html (10 contrôles d'intégrité)
npm run verify     # 15 contrôles, dont l'anti-dérive sources ↔ livrable
npm run test       # suite navigateur réelle (Chromium mobile 390 × 844)
npm run test:comptes  # comptes, données séparées, temps réel, corrections (API requise)
npm run serve      # aperçu local sur http://localhost:8000
```

`npm run test` utilise `playwright-core`. S'il n'est pas installé :

```bash
npm i -D playwright-core
npx playwright-core install chromium
LEARNHUB_API_URL=http://127.0.0.1:3000 npm run test   # pour inclure le test de synchronisation
```

## Sources (`src/`)

| Fichier | Rôle |
|---|---|
| `shell.html` | structure HTML, `<style>` complet (Material Design 3) et sprite de 55 icônes SVG |
| `app.js` | données de démonstration, utilitaires, lecteur vidéo, module de synchronisation `LHSYNC` |
| `core.js` | état persistant (`localStorage`), routeur de pages (`pushPage` / `popPage`), tableau de bord, paramètres |
| `lms.js` | pages pédagogiques : fiche de cours, quiz, devoirs |
| `profil.js · sync2.js · prof.js · apprendre.js · routes.js` | avatar (12 choix), mot de passe, appareils connectés, héros « Reprendre » et activité réelle de l'accueil |
| `paiement.js` | cours payants et abonnements : cadenas et prix sur les cartes, bandeau et feuille d'achat, écran « Abonnement & achats », parcours NOVA Checkout (session → redirection → vérification au retour) |
| `images.json` | `const IMG = { … }` — 7 visuels en base64 |
| `clip.json` | `const CLIP_MP4` / `const CLIP_WEBM` — extrait vidéo 24 s (640 × 360, muet) |

Le script d'assemblage (`build.js`) recopie ces briques dans l'ordre et vérifie les 12 éléments
obligatoires ; il échoue si l'un manque. `verify.js` réassemble ensuite dans un fichier temporaire et
compare octet par octet avec `index.html` : **toute modification manuelle du livrable est détectée**.

## Tests (`tests/`)

- `serveur.js` — serveur statique minimal (aperçu local et base des tests). Sert aussi
  `node tests/serveur.js 3001`.
- `navigateur.js` — la suite : chargement du fichier unique, absence d'erreur JavaScript, quatre
  onglets, ouverture des fiches de cours, **retours** (bouton de l'app, geste navigateur, empilement
  de 3 pages), lien direct par `#hash`, quiz, devoirs, **lecture vidéo en ligne et hors-ligne**,
  thème, persistance, écran de synchronisation, puis — si `LEARNHUB_API_URL` est défini — connexion,
  hydratation et envoi d'une leçon terminée vers l'API.

Résultat de référence : **104 OK / 0** avec l'API (**53 OK / 0** sans API). La suite vérifie aussi les
cours payants : bandeau et bouton « Débloquer » sur une fiche fermée, feuille d'achat au toucher d'une
leçon, lecteur vidéo qui reste fermé, page de quiz réservée, puis accès complet une fois l'abonnement
actif (connexion par l'écran de compte).

## Relier le site à l'API

**Déployé « tout sur une seule URL » (recommandé) : rien à faire.** Si l'application est servie par l'API
elle-même (même domaine, voir `../DEPLOIEMENT-GITHUB-VERCEL.md`), `LHSYNC` interroge `/api/health` au
démarrage et adopte automatiquement le serveur : il ne reste qu'à se connecter avec un compte.
Pour publier la copie servie sur `/` : `npm run site:sync` depuis la racine du dépôt (ou `npm run build`).

Sinon, trois façons équivalentes, dans cet ordre de priorité :

1. `Paramètres → Synchronisation serveur` : adresse + e-mail + mot de passe (conservés dans le
   navigateur) ;
2. ouvrir le site avec `?api=https://mon-api.vercel.app` ou `#api=https://mon-api.vercel.app` ;
3. laisser le site fonctionner seul : la progression reste alors sur l'appareil (`localStorage`).

## Publier

- **Vercel, une seule URL pour le site et l'API** (recommandé) : un seul projet avec Root Directory `api` ;
  l'application est servie sur `/` à partir de la copie `api/public/index.html` (`npm run site:sync`).
- **Vercel, site statique séparé** : Root Directory = `web`, framework *Other*. `vercel.json` contient déjà
  `buildCommand: node build.js`, `outputDirectory: "."`, `cleanUrls: true` et les en-têtes de cache/sécurité.
- **Netlify / Cloudflare Pages** : déposer `index.html` (et `_headers` à côté, il contient les mêmes
  en-têtes). Guide détaillé : `../docs/HEBERGEMENT.md`.
- **GitHub Pages / `python3 -m http.server`** : fonctionne aussi tel quel.

Aucune variable d'environnement, aucun secret : le site n'appelle l'API que si l'utilisateur l'a configurée.

## Règles à respecter dans toute modification

1. Ne jamais ajouter de ressource externe (sauf l'iframe YouTube) : le fichier doit rester autonome.
2. Ne jamais éditer `index.html` à la main — passer par `src/` + `npm run build`.
3. Toute page doit rester accessible **et refermable** (bouton retour + bouton du téléphone).
4. Tout nouveau contenu média passe en base64 (images) ou dans `clip.json` (vidéo de repli).
5. Après toute modification : `npm run build && npm run verify && npm run test`.

Captures de l'application : `../docs/captures/`.
