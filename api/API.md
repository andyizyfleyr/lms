# Référence de l'API CosmétiLab

Base d'exemple : `http://localhost:3000` (ou l'URL Vercel).
Toutes les routes renvoient du JSON. En cas de succès : `{ "ok": true, "data": … }`.

Authentification : en-tête `Authorization: Bearer <jeton>` (jeton renvoyé par `login` / `register`).

---

## Authentification et compte

| Méthode | Chemin | Description |
|---|---|---|
| POST | `/api/auth/register` | `{email, motDePasse, nom, role?, promo?, ville?}` → `{token, user}` — `role` : `etudiant` (défaut) ou `enseignant` |
| POST | `/api/auth/login` | `{email, motDePasse}` → `{token, user, settings}` |
| POST | `/api/auth/logout` | Invalide le jeton courant |
| GET | `/api/auth/me` | Profil + réglages |
| PATCH | `/api/auth/me` | `{nom?, tel?, ville?, promo?, bio?, objectifSemaineH?}` |
| DELETE | `/api/auth/me` | Supprime le compte et toutes ses données |
| POST | `/api/auth/password` | `{actuel, nouveau}` — ferme les autres sessions |
| GET | `/api/auth/devices` | Appareils connectés (`actuel: true` pour le courant) |
| DELETE | `/api/auth/devices/{token}` | Déconnecte un appareil à distance |

## Catalogue

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/courses` | Catalogue. Filtres : `q`, `categorie`, `statut`, `favori=1`, `inscrit=1`, `tri=recent\|progress\|titre` |
| GET | `/api/courses/{id}` | Fiche complète : `modules[].lecons[]`, `ressources`, `videos`, `quiz`, `devoirs`, `progression` |
| POST | `/api/courses` | Créer (enseignant/admin) |
| PATCH | `/api/courses/{id}` | Modifier (enseignant/admin) |
| DELETE | `/api/courses/{id}` | Supprimer (admin) |
| GET | `/api/courses/{id}/lessons` | Leçons, avec `done` |
| POST | `/api/courses/{id}/lessons` | Ajouter une leçon (enseignant/admin) |
| GET | `/api/courses/{id}/resources` | Supports de cours |
| POST | `/api/courses/{id}/resources` | Ajouter un support (enseignant/admin) |
| PATCH | `/api/resources/{id}` | Modifier une ressource (enseignant, admin) |
| DELETE | `/api/resources/{id}` | Retirer une ressource (enseignant, admin) |
| GET | `/api/courses/{id}/apprenants` | Suivi des apprenants d'un cours : progression, leçons terminées, dépôts, copies à corriger (enseignant, admin) |
| GET | `/api/certificats` | Attestations de l'apprenant : cours achevés, date d'achèvement, numéro stable (`?cours=c1` pour une seule) |
| GET | `/api/courses/{id}/messages` | Fil de discussion (`?limite=`) |
| POST | `/api/courses/{id}/messages` | Publier un message |
| POST | `/api/courses/{id}/enroll` | S'inscrire au cours |
| DELETE | `/api/courses/{id}/enroll` | Quitter le cours |

## Paiements, abonnements et accès

Tous les cours sont payants : un cours s'achète à l'unité (accès définitif) ou via un abonnement qui
ouvre **tous** les cours. Les contenus protégés répondent `402 acces_paye_requis` sans accès
(leçon à terminer, ressources, messages, quiz, devoirs, inscription au cours, fiche vidéo).

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/paiements/catalogue` | Tarifs publics : prix de chaque cours, formules d'abonnement, conditions, `paiementActif` (clé NOVA présente ou non) |
| POST | `/api/paiements/session` | `{type:"cours",courseId}` ou `{type:"abonnement",planId}` → `201 {commande, url}` : ouvre une session NOVA Checkout et renvoie l'adresse de paiement. `402 acces_paye_requis` si l'accès est déjà ouvert par un abonnement, `409 deja_debloque`, `502 nova_indisponible` si les clés ne sont pas configurées |
| POST | `/api/paiements/verifier` | `{orderId}` ou `{sessionId}` → interroge NOVA, marque la commande payée et ouvre l'accès. À appeler **au retour du paiement** : le navigateur ne fait jamais foi |
| GET | `/api/paiements` | Mes commandes (statut, montant, référence) et l'état de mon abonnement |
| GET | `/api/acces` | `{abonnement:{actif,planNom,fin,joursRestants}, toutPaye, cours:[…], gratuit}` — ce que l'application utilise pour afficher ou masquer |
| POST | `/api/acces/offrir` | (administrateur) `{email|userId, cours:[…], jours}` → ouvre un accès sans paiement |
| POST | `/api/webhooks/nova` | Webhook **signé** (`NOVA-Signature: t=…,v1=…`, HMAC-SHA256 sur `t.corps` brut, tolérance 300 s). Traite `checkout.session.paid` et `checkout.session.expired`, répond 2xx en moins de 5 s et ignore les rejeux (table `payment_events`). `503` sans `NOVA_WEBHOOK_SECRET` |

Variables d'environnement du paiement : `NOVA_SECRET_KEY` (`sk_live_…`), `NOVA_WEBHOOK_SECRET`
(`whsec_…`), `SITE_URL` (adresse de retour après paiement). **NOVA n'a pas de mode test.**

Tables : `orders`, `course_access`, `subscriptions`, `payment_events`.

## Activité et appareils

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/activite` | Activité réelle du compte : derniers messages des cours accessibles, dernière copie déposée (ou copies à corriger pour un formateur). Alimente le bloc « Activité récente » de l'accueil |
| GET | `/api/auth/devices` | Sessions ouvertes : `{appareils:[{id, appareil, navigateur, ip, depuis, expire, actuel}], courant}`. L'`id` est une empreinte courte — le jeton n'est jamais renvoyé |
| DELETE | `/api/auth/devices/{id}` | Fermer une session précise (empreinte ou jeton) |
| DELETE | `/api/auth/devices` | Fermer **toutes les autres** sessions du compte et garder la sienne |

Le champ `avatar` des réglages (`PATCH /api/settings`) porte l'avatar choisi : il est retrouvé sur les autres appareils.

## Temps réel

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/sync` | Révision de l'espace du compte : `{revision, lecons, videos, quiz, depots, cours, serveur, utilisateur}`. Interrogée en boucle par l'application ; si `revision` change, elle recharge la progression. |

## Progression

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/progress` | Tout : cours, leçons, vidéos, quiz, devoirs, activité. `?format=app` → `lh_lessons`, `lh_videos`, `lh_quiz` |
| DELETE | `/api/progress` | Remet la progression à zéro |
| POST | `/api/lessons/{id}/complete` | Marque la leçon terminée `{done:true, minutes?}` → recalcule le % du cours |
| DELETE | `/api/lessons/{id}/complete` | Décoche la leçon |
| PATCH | `/api/lessons/{id}` | Renommer / redéplacer une leçon (enseignant, admin) |
| DELETE | `/api/lessons/{id}` | Retirer une leçon du cours (enseignant, admin) |
| GET | `/api/videos` | Bibliothèque. Filtres : `q`, `courseId`, `filtre=tout\|encours\|termine\|fav`, `tri=vues\|recent\|duree` |
| GET | `/api/videos/{id}` | Détail d'une vidéo + mon état de visionnage |
| POST | `/api/videos` | Ajouter un tutoriel (enseignant/admin) |
| PATCH | `/api/videos/{id}/progress` | `{progress?, liked?, saved?, positionS?}` |

## Quiz

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/quizzes` | Liste + `meilleure_note`, `tentatives` |
| GET | `/api/quizzes/{id}` | Questions **sans les réponses** + mon historique |
| POST | `/api/quizzes/{id}/attempts` | `{reponses:[{questionId, optionId}], dureeS}` → score, note, correction détaillée |
| GET | `/api/attempts` | Mes tentatives (`?quizId=`) |
| GET | `/api/attempts/{id}` | Correction détaillée (réponse donnée, bonne réponse, explication) |

## Devoirs et dépôts

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/assignments` | Devoirs + mon statut. Filtres : `courseId`, `niveau`, `statut=a_rendre\|depose\|note` |
| POST | `/api/assignments` | Créer (enseignant/admin) |
| GET | `/api/assignments/{id}` | Consignes + mes dépôts |
| DELETE | `/api/assignments/{id}` | Supprimer (enseignant/admin) |
| POST | `/api/assignments/{id}/submissions` | Déposer `{commentaire?, lien?, fichierNom?, fichierType?, fichierTaille?, fichierData?(base64)}` |
| GET | `/api/assignments/{id}/submissions` | Mes dépôts — vue de **tous les étudiants** pour un enseignant |
| GET | `/api/submissions` | Tous mes dépôts |
| GET | `/api/submissions/{id}` | Détail (fichier base64 inclus) |
| PATCH | `/api/submissions/{id}` | Noter `{note, statut, commentaire}` (enseignant/admin) |
| DELETE | `/api/submissions/{id}` | Retirer un dépôt non noté |

## Notes, agenda, notifications

| Méthode | Chemin | Description |
|---|---|---|
| GET/POST | `/api/notes` | Lister (`?courseId=`, `?q=`) / créer une note |
| DELETE | `/api/notes?courseId=` | Effacer les notes d'un cours (toutes si vide) |
| GET/PATCH/DELETE | `/api/notes/{id}` | Lire / modifier / supprimer |
| GET | `/api/sessions` | Agenda : séances, `parJour`, `aujourdhui`. Filtres `courseId`, `type` |
| POST | `/api/sessions` | Programmer une séance (enseignant/admin) |
| GET | `/api/sessions/{id}` | Fiche d'une séance |
| DELETE | `/api/sessions/{id}` | Annuler (enseignant/admin) |
| POST | `/api/sessions/{id}/reminder` | Activer le rappel `?minutes=15` |
| DELETE | `/api/sessions/{id}/reminder` | Couper le rappel |
| GET | `/api/notifications` | Mes notifications + annonces générales (`?nonLues=1`) |
| POST | `/api/notifications` | Publier (enseignant/admin) |
| POST | `/api/notifications/read-all` | Tout marquer comme lu |
| PATCH | `/api/notifications/{id}` | `{lu}` (ou `{titre, texte}` pour un enseignant) |
| DELETE | `/api/notifications/{id}` | Supprimer |

## Badges, statistiques, réglages, hors-ligne

| Méthode | Chemin | Description |
|---|---|---|
| GET | `/api/badges` | Catalogue + `valeur`, `obtenu`, `progression` — **attribution automatique** |
| GET | `/api/stats` | Série de jours, heures, badges, objectif hebdo, activité, cours |
| GET | `/api/search?q=` | Recherche globale : cours, leçons, vidéos, ressources, quiz, devoirs |
| GET/PATCH | `/api/settings` | Réglages : `theme`, `langue`, `notificationsEmail`, `notificationsPush`, `rappelsSessions`, `donneesMobiles` |
| GET/POST | `/api/downloads` | Liste + compteurs / ajouter `{courseId?, resourceId?, titre, tailleLabel?, etat?, progres?}` |
| PATCH/DELETE | `/api/downloads/{id}` | Pause/reprise/progression / retirer |
| DELETE | `/api/downloads` | Vider le hors-ligne |
| GET | `/api/health` | État de l'API et de la base (nombre de tables, cours, comptes) |

## Exemples

```bash
# 1. connexion
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"amina@cosmetilab.bj","motDePasse":"demo1234"}' | jq -r .data.token)

# 2. mes cours suivis
curl -s "http://localhost:3000/api/courses?inscrit=1" -H "Authorization: Bearer $TOKEN" | jq .data.cours[]

# 3. terminer une leçon (recalcule le pourcentage du cours)
curl -s -X POST http://localhost:3000/api/lessons/c1-m1-l1/complete \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"done":true,"minutes":8}' | jq .data.progression

# 4. soumettre un quiz (correction côté serveur)
curl -s -X POST http://localhost:3000/api/quizzes/c1/attempts \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"reponses":[{"questionId":"c1-q1","optionId":"c1-q1-o3"}],"dureeS":240}' | jq .data.tentative

# 5. déposer un devoir avec un fichier (base64)
BASE64=$(base64 -w0 rapport.pdf)
curl -s -X POST http://localhost:3000/api/assignments/d1/submissions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"commentaire\":\"Voici mon rapport\",\"fichierNom\":\"rapport.pdf\",\"fichierType\":\"application/pdf\",\"fichierTaille\":$(stat -c%s rapport.pdf),\"fichierData\":\"$BASE64\"}"

# 6. statistiques
curl -s http://localhost:3000/api/stats -H "Authorization: Bearer $TOKEN" | jq .data.semaine
```

## Codes d'erreur

| Code | HTTP | Signification |
|---|---|---|
| `requete_invalide` | 400 | Corps JSON illisible |
| `non_authentifie` | 401 | Jeton absent, expiré ou révoqué |
| `identifiants_invalides` | 401 | E-mail ou mot de passe incorrect |
| `interdit` | 403 | Rôle insuffisant ou ressource d'un autre utilisateur |
| `introuvable` | 404 | Ressource inexistante |
| `email_deja_utilise` | 409 | Inscription sur un e-mail existant |
| `depot_vide`, `fichier_trop_gros`, `recherche_trop_courte` | 413/422 | Validation métier |
| `erreur_serveur` | 500 | Erreur inattendue (message inclus pour le débogage) |
| `base_indisponible` | 503 | Neon injoignable |
