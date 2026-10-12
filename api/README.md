# CosmétiLab API — Next.js + TypeScript + Neon

Backend complet du tableau de bord mobile **CosmétiLab** : authentification, cours, leçons, vidéos,
quiz corrigés côté serveur, devoirs et dépôts de fichiers, notes, agenda, notifications, badges,
statistiques, recherche, réglages et téléchargements hors-ligne.

**51 routes API** (dont 7 pour les paiements), base **PostgreSQL Neon** (30 tables), prêtes pour Vercel.

Le projet Vercel qui héberge cette API sert aussi l'application mobile : `public/index.html` (copie du
livrable `web/index.html`) est renvoyé sur `/`, l'API occupe `/api/*` et la documentation `/api-doc`.

---

## 1. Démarrage

```bash
npm install                 # une fois
cp .env.example .env.local  # puis colle ta chaîne Neon dans DATABASE_URL
npm run db:migrate          # crée les 30 tables
npm run db:seed             # charge les données de démonstration
npm run dev                 # http://localhost:3000
```

Ouvre <http://localhost:3000/api-doc> : la page liste **tous les points d'entrée** de l'API.
(`http://localhost:3000/` sert l'application mobile, la copie publiée du site.)

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Apprenante (progression remplie) | `amina@cosmetilab.bj` | `demo1234` |
| Formatrice (2 copies à noter) | `awa@cosmetilab.bj` | `prof1234` |
| Administrateur | `admin@cosmetilab.bj` | `admin1234` |

## 2. Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement (http://localhost:3000) |
| `npm run build` / `npm start` | version de production |
| `npm run typecheck` | vérification TypeScript (0 erreur) |
| `npm run db:migrate` | applique `db/schema.sql` (idempotent) |
| `npm run db:seed` | charge `db/seed.sql` (relançable sans doublon) |
| `npm run db:reset` | **efface** puis recrée tables + données de démo |
| `npm run db:check` | affiche les tables, les volumes et les comptes |

## 3. Conventions

- **Réponses** : `{"ok":true,"data":…}` en succès, `{"ok":false,"error":{"code","message","details"}}` sinon.
- **Authentification** : `Authorization: Bearer <jeton>` — jeton valable **30 jours**, révocable
  (déconnexion, changement de mot de passe, suppression à distance d'un appareil).
- **Mots de passe** : scrypt (`N=16384, r=8, p=1`), jamais stockés en clair.
- **Quiz** : les bonnes réponses ne quittent jamais le serveur — la correction est faite en SQL/TS.
- **Rôles** : `etudiant` (défaut), `enseignant` (créer/modifier cours, leçons, ressources, devoirs,
  annonces, noter les dépôts), `admin` (idem + supprimer des cours).
- **CORS** : ouvert sur `/api/*` — l'application HTML peut être servie depuis n'importe quel domaine
  (Netlify, aperçu local, `file://`).
- **Fichiers de devoirs** : transmis en base64 et stockés dans Neon (limite conseillée **2,5 Mo**).

## 4. Base de données (30 tables)

`users` · `auth_tokens` · `courses` · `lessons` · `resources` · `videos` · `enrollments` ·
`lesson_progress` · `video_state` · `activity` · `quizzes` · `quiz_questions` · `quiz_options` ·
`quiz_attempts` · `quiz_answers` · `assignments` · `submissions` · `notes` · `messages` ·
`notifications` · `calendar_sessions` · `session_reminders` · `badges` · `user_badges` ·
`settings` · `downloads` · `orders` · `course_access` · `subscriptions` · `payment_events`

Le schéma est dans `db/schema.sql`, les données de démo dans `db/seed.sql` (généré depuis
l'application par `node scripts/gen-seed.js`).

## 5. Brancher l'application HTML

L'application reste **100 % autonome et hors-ligne**. Pour lui faire utiliser l'API :

1. **Le plus rapide** : ouvrez-la avec l'adresse du serveur en paramètre —
   `https://votre-app.netlify.app/?api=https://votre-api.vercel.app` (ou `#api=…`).
   L'adresse est mémorisée sur l'appareil.
2. **Dans l'application** : *Profil → Paramètres → Données et stockage → **Synchronisation serveur***,
   puis saisissez l'adresse, l'e-mail et le mot de passe. Une fois connecté, la feuille affiche le
   compte, permet de **synchroniser maintenant** et de se **déconnecter du serveur**.
3. **Au démarrage** : vous pouvez aussi revenir à l'écran de connexion (⋮ → Se déconnecter) et
   utiliser les identifiants du serveur.

Ce qui se synchronise : leçons terminées (un envoi par paquet, jamais renvoyées deux fois),
vidéos aimées/enregistrées, résultats de quiz (recalculés côté serveur), dépôts de devoirs,
notes. **Hors-ligne, rien n'est perdu** : tout continue d'être écrit sur l'appareil et repart
vers Neon dès que le réseau revient.

## 6. Déploiement sur Vercel

```bash
npm i -g vercel
vercel                       # premier déploiement (suis les questions)
vercel env add DATABASE_URL  # colle la chaîne Neon (environnement Production)
vercel --prod
```

Aucune autre configuration : les routes utilisent `@neondatabase/serverless` (HTTP), donc le
passage en serverless est transparent. Pense à mettre l'URL obtenue dans l'application HTML
(voir `../README-API-CLIENT.md` ou le bouton **Synchronisation** dans Paramètres).

## 7. Tests

- **`npm run smoke`** (ou `node scripts/smoke.js`) : **34 vérifications** contre une API en marche —
  santé et base Neon, connexion (et refus d'un mauvais mot de passe), route protégée sans jeton,
  catalogue (cours, leçons, ressources, discussion, vidéos, quiz, devoirs, séances, badges,
  notifications, téléchargements, réglages, statistiques, recherche), progression au format de
  l'application, puis **écriture réelle** (leçon terminée, vidéo aimée, note créée puis supprimée,
  devoir rendu puis annulé) — le tout avec le compte de démonstration et nettoyé derrière.

  ```bash
  npm start                          # puis, dans un autre terminal :
  npm run smoke
  npm run smoke -- https://lms-lovat-five.vercel.app   # directement contre la production
  ```

- `node scripts/db.js check` : état de la base (tables et volumes).
- Le jeu d'intégration complet (81 vérifications couvrant en plus les cas d'erreur de chaque route)
  a été exécuté sur cette version : **38 OK / 0**.
