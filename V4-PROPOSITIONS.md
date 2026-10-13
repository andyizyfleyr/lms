# CosmétiLab — Version 4 : ce qu'on peut y mettre

> Mêmes règles, tenues depuis le début : **un seul fichier** (HTML+CSS+JS), **aucune dépendance externe**
> (la PWA déjà validée reste la seule exception), Material Design 3 violet, mobile d'abord,
> **une adresse par écran**, **aucun contrôle mort** — tout ce qui est visible fonctionne vraiment.
> Coche ce que tu valides, je découpe en vagues et j'applique dans l'ordre, tests navigateur à chaque vague.

---

## Où on en est (pour situer la V4)

V3 est en ligne : 55 adresses, apprendre/réviser (parcours, révision, objectifs, compétences, fiches),
outils métier (formulation, saponification, convertisseur, réglementaire, recettes, production),
espace formateur (revenus, création de cours, banque de questions, annonce, notation, séances),
argent (paiements, codes, parrainage), hors-ligne, sauvegarde, confort de lecture, et l'attestation vérifiable.

Ce qui manque, vu de l'usage réel — et c'est tout l'objet de la V4 :

1. **Personne ne peut se parler.** La discussion est enfermée dans un cours ; il n'y a ni entraide, ni réalisations montrées, ni vie de groupe.
2. **Le parcours s'arrête au savoir-faire.** On apprend à formuler, on note ses lots… mais rien ne relie la recette à un **produit vendu** (étiquette conforme, client, commande, prix juste).
3. **Aucun écran d'administration.** Tu ne peux ni modérer, ni voir les paiements du jour, ni gérer les comptes autrement qu'en base de données.
4. **On apprend les yeux occupés.** En atelier, les mains dans le savon : il faut pouvoir **écouter** et suivre des étapes en très gros.

---

## G. Communauté & entraide (ce qui fait revenir chaque jour)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Adresse | Taille |
|---|---|---|---|---|
| G1 ⭐ | **Forum d'entraide par thème** : saponification, émulsion, conservation, étiquetage, vente. Question, réponses, vote « ça m'a aidé », marquage *résolu*, épingle du formateur | Le débutant bloqué à 22 h pose sa question au lieu d'abandonner ; les réponses des anciens valent un cours | `/communaute`, `/communaute/:fil` | M |
| G2 ⭐ | **Galerie des réalisations** : poster une photo (compressée automatiquement), décrire, dire ce qui a marché ou pas, « j'aime », avant/après | Montrer son savon est **la** motivation n° 1 en cosmétique ; ça prouve aussi que le cours sert | `/galerie`, `/galerie/:id` | M |
| G3 | **Ateliers & voisinage** : trouver d'autres élèves de sa ville, proposer un atelier, prêter du matériel (ville facultative, désinscription en un geste) | Le matériel coûte cher et se partage ; l'app devient un réseau local | `/ateliers` | M |
| G4 | **Signaler / modérer** : signaler un message, une photo ou une question ; file de modération, masquage, avertissement | Obligatoire dès qu'il y a du contenu public, sinon la plateforme devient un dépotoir | `/signalement` + file dans la console admin | S |

## H. De la recette au produit vendu (le vrai besoin de la niche)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Adresse | Taille |
|---|---|---|---|---|
| H1 ⭐ | **Étiquette conforme + fiche produit** : depuis une recette, l'étiquette se remplit seule (nom, liste INCI générée, numéro de lot, PAO, contenance, responsable, précautions) et s'imprime ; un **QR** sur l'étiquette ouvre la fiche publique du produit | C'est ce qui manque pour vendre légalement et rassurer une cliente ; le QR remplace la notice papier | `/outils/etiquette`, `/produit/:id` | M |
| H2 | **Carte produit à partager** : une image propre (nom, photo, prix, contact) générée pour WhatsApp / statut | Les ventes se font sur WhatsApp au Bénin ; on évite de bricoler une image | sur `/produit/:id` | S |
| H3 ⭐ | **Clients & commandes** : carnet clients (nom, téléphone, ville), commandes (devis → envoyé → payé), devis imprimable, paiements reçus notés (Mobile Money), relance d'un client en retard | Un élève qui vend tient enfin ses comptes ; c'est son premier vrai outil de commerce | `/atelier/clients`, `/atelier/commandes`, `/devis/:id` | M |
| H4 ⭐ | **Coût de revient complet & prix juste** : emballage, étiquette, main d'œuvre, électricité, pertes, frais de vente → coût réel unitaire, marge, prix conseillé, seuil de rentabilité | La formulation calcule déjà les ingrédients : sans le reste, l'élève croit gagner de l'argent et en perd | `/outils/prix` | S |

## I. Enseigner mieux (côté formateur)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Adresse | Taille |
|---|---|---|---|---|
| I1 ⭐ | **Fiche apprenant** : pour un élève d'un cours — progression, temps passé, quiz, devoirs rendus, dernière activité, note privée du formateur, message direct | Le formateur voit qui décroche **avant** que l'élève parte, et peut intervenir nommément | `/formateur/apprenant/:id` | M |
| I2 | **Questions en masse** : coller une liste (une question par ligne, format simple) ou importer un CSV, vérification avant enregistrement, duplication vers un autre cours | Écrire 40 questions une par une décourage ; là c'est 5 minutes | sur `/formateur/questions` | S |
| I3 ⭐ | **Examens blancs** : quiz chronométré, tirage dans la banque, note à la fin, corrigé détaillé, attestation d'examen distincte de l'attestation de cours | Un élève veut savoir s'il est prêt ; un formateur veut un vrai contrôle noté | `/formateur/examens`, `/examen/:id` | M |
| I4 ⭐ | **Émargement par code** : le formateur affiche un code à 6 chiffres (et un QR) valable 10 minutes, l'élève le saisit → présence enregistrée, feuille de présence exportable | Aujourd'hui la présence se coche à la main ; en séance en direct ça se fait tout seul | `/formateur/presence` | S |
| I5 | **Relevé de revenus** : par mois, par cours, par moyen de paiement ; export CSV et impression, suivi des versements | Pour tenir sa comptabilité et déclarer sans stress | `/formateur/releve` | S |
| I6 | **Co-formateurs** : inviter un autre formateur sur un cours, avec répartition des revenus affichée sur sa fiche | Un cours se co-écrit souvent (l'une formule, l'autre filme) | sur `/formateur/creer/:id` | S |

## J. Fidélité & croissance

| # | Ce qu'on ajoute | Pourquoi c'est utile | Adresse | Taille |
|---|---|---|---|---|
| J1 | **Points & récompenses** : points pour leçon finie, quiz réussi, série de jours, réponse utile dans le forum ; convertibles en code promo, cours offert, badge | Transforme la bonne volonté en avantage concret | `/recompenses` | M |
| J2 | **Défis du mois & classement** : défi communautaire (ex. « 20 savons, 20 photos »), classement progression et entraide, désinscription possible | Le mois donne un objectif commun ; c'est un moteur puissant et gratuit | `/defis` | S |
| J3 ⭐ | **Réabonnement en un geste** : bouton de renouvellement là où le rappel s'affiche, historique des abonnements, jours offerts par l'admin | Le revenu récurrent se gagne au moment de l'échéance, pas trois écrans plus loin | `/abonnement/historique` | S |
| J4 | **Paliers de parrainage** : 1 filleul = réduction, 3 filleuls actifs = un cours offert, suivi de l'avancement | Encourage à partager, récompense la fidélité | sur `/parrainage` | S |

## K. Exploitation & confiance

| # | Ce qu'on ajoute | Pourquoi c'est utile | Adresse | Taille |
|---|---|---|---|---|
| K1 ⭐ | **Console d'administration** : comptes (rôle, blocage, renommage), cours publiés/dépubliés, paiements du jour et totaux, signalements et modération, erreurs récentes, chiffres clés | Aujourd'hui tu administres **la base de données** : ce n'est pas tenable | `/admin`, `/admin/utilisateurs`, `/admin/paiements`, `/admin/moderation` | L |
| K2 | **Récupération de compte sans e-mail** : à l'inscription, un code de secours à conserver ; il permet de reprendre son compte sur un nouveau téléphone ; à défaut, l'admin débloque | Pas de serveur d'e-mail dans le projet : le code de secours règle 90 % des cas réels | `/compte/recuperation` | S |
| K3 | **Journal de sécurité** : connexions récentes, appareils, actions sensibles, déconnexion à distance d'un appareil | Rassurer, et couper un accès partagé | `/compte/securite` | S |
| K4 | **Traçabilité des lots** : chaque lot du carnet a sa page — ingrédients, date, n° de lot, contrôles prévus, rappel « à re-contrôler le… », QR de traçabilité | Prépare une activité commerciale sérieuse (rappel de lot, garantie) | `/production/lot/:id` | S |
| K5 | **Kits d'installation** : exporter un dossier complet (cours + questions + fiches) pour équiper une école ou un atelier partenaire, et l'importer | Dupliquer l'expérience pour un partenaire sans tout ressaisir | `/kits` | M |

## L. Apprendre autrement

| # | Ce qu'on ajoute | Pourquoi c'est utile | Adresse | Taille |
|---|---|---|---|---|
| L1 ⭐ | **Écouter la leçon** : lecture à voix haute par la synthèse vocale du navigateur (aucun service externe), vitesse réglable, bouton « écouter » sur chaque leçon et sur les fiches de révision | En atelier les mains sont sales : on écoute au lieu de lire. Aussi utile pour les lecteurs fragiles | sur la leçon + `/accessibilite` | S |
| L2 | **Mode atelier** : très gros boutons, étapes guidées d'une recette une par une, minuteur intégré, conversions et températures à portée de pouce, écran qui ne s'éteint pas | Le téléphone devient l'assistant d'atelier, pas un cours à relire | `/atelier` | M |
| L3 | **Glossaire cosmétique** : ~60 termes expliqués simplement (INCI, PAO, saponification à froid, surgraissage, émulsion, conservateur…), avec équivalents en fon/nago **si tu valides les traductions** | Le vocabulaire est la première barrière ; les mots français savants découragent | `/glossaire` | S |
| L4 | **Mode texte seul** : la même leçon sans image ni vidéo (charge minimale), pour les jours de réseau faible ou de forfait épuisé | Un élève sans data ne doit pas être exclu | `/leger` | S |

---

## Plan proposé (4 vagues, dans cet ordre)

1. **Vague 1 — La plateforme prend vie** : K1 console admin · G1 forum · G4 signalement/modération · I4 émargement par code.
2. **Vague 2 — Du cours au produit** : H1 étiquette + fiche produit · H4 coût de revient complet · H3 clients & commandes · G2 galerie · H2 carte à partager.
3. **Vague 3 — Suivre et faire progresser** : I1 fiche apprenant · I3 examens blancs · I2 questions en masse · I5 relevé de revenus · J3 réabonnement · J4 paliers de parrainage.
4. **Vague 4 — Confort, confiance et finitions** : L1 écoute · L2 mode atelier · L4 texte seul · J1 points · J2 défis · K2 code de secours · K3 journal de sécurité · K4 traçabilité des lots · K5 kits · G3 ateliers · L3 glossaire · I6 co-formateurs.

**≈ 31 nouvelles adresses → 86 au total**, fichier toujours unique, même palette, mêmes règles.

## Ma recommandation si tu veux une V4 courte et marquante

**K1 + G1 + H1 + H3 + H4 + I1 + I4 + L1** — soit : console d'administration, forum d'entraide,
étiquette conforme avec fiche produit, clients & commandes, coût de revient complet, fiche apprenant,
émargement par code, écoute des leçons.

C'est ce qui change la nature de l'app : elle cesse d'être un cours en ligne et devient **l'outil de travail
quotidien** de quelqu'un qui fabrique et vend des cosmétiques — pendant que toi, tu peux enfin l'exploiter
sans toucher à la base de données.

## Ce que je ne propose pas (et pourquoi)

- **Mini-marketplace entre élèves (paiement, commission)** : NOVA est le seul canal de paiement autorisé ; une place de marché demanderait des comptes marchands, du droit commercial et une modération permanente. H3 (clients & commandes) sert l'usage réel sans ces risques.
- **Messagerie instantanée type WhatsApp** : aucun service externe autorisé ; forum + discussion par cours + annonces couvrent le besoin.
- **IA générative (correction automatique, assistant de recette)** : dépendance externe et budget récurrent. Je peux faire une *correction assistée par règles* (barème, mots-clés, points manquants) si tu veux, sans dépendance.
- **Visioconférence intégrée** : le lien de séance existe déjà, l'émargement (I4) complète ; intégrer une visio serait un service externe.
- **Boutique publique avec paiement par carte bancaire** : hors périmètre NOVA/UEMOA.
- **Traduction complète en langues nationales** : la justesse demande une relecture humaine. À la place : le glossaire (L3) que tu corriges, ~60 termes.
- **Envoi d'e-mails (mot de passe oublié classique)** : aucun fournisseur d'e-mail dans le projet ; K2 règle le problème sans dépendance.
- **Application native iOS/Android** : la PWA déjà validée fait le travail.

---

## Ce dont j'ai besoin de toi (4 décisions)

1. **Photos (G2)** : stockées dans ta base Neon, compressées à ~200 Ko, 3 photos par réalisation — d'accord ?
2. **Fiches produit (H1, `/produit/:id`)** : publiques et indexables par Google, ou seulement visibles avec le lien ?
3. **Modération (G4/K1)** : tu es le seul admin, ou on crée un rôle « modérateur » attribuable à un élève de confiance ?
4. **Glossaire fon/nago (L3)** : je prépare la liste, tu corriges les traductions — ou on s'en tient au français seulement ?

### Réponses retenues (tu as répondu « Ajoute tout »)

1. **Photos** → compressées dans le navigateur (~200 Ko) et stockées dans Neon.
2. **Fiches produit** → publiques et indexables (`/p/:slug`, `/l/:slug`, ajoutées au `sitemap.xml`).
3. **Modération** → rôle « modérateur » attribuable depuis la console.
4. **Glossaire** → français seulement, 50 termes, aucun mot inventé.

### Comment valider

Réponds simplement : les numéros (« G1 H1 H4 I1 K1 L1 »), ou « le plan en 4 vagues », ou « ta recommandation »,
ou « tout » — et tes réponses aux 4 décisions. J'enchaîne ensuite vague par vague, avec les tests navigateur
à chaque étape et **un seul push** à la fin, comme pour la V3.

---

# Bloc M — Boutique des livres PDF (demandé après le plan)

Tu l'as ajouté après coup : « Ajoute tout, et aussi fais une page de vente de pdf de cours en cosmétique ».

## M1. Page de vente des livres (`/boutique`, `/boutique/:id`)

Une vraie page de vente, pas un lien de téléchargement :

- **8 ouvrages** : les six cours du site (livre c1 → c6, 3 000 à 3 500 F), le **recueil de recettes** (4 500 F),
  le **guide « Fixer ses prix »** (2 500 F). Chaque ouvrage a sa couverture, son sous-titre, son nombre de pages,
  sa description et son **sommaire** (les titres de chapitres, jamais le texte).
- **Panier** : on coche ce qu'on veut, la remise de **10 % dès deux ouvrages** apparaît en clair, un code promo
  peut s'ajouter. Le **montant est calculé par le serveur**, jamais par le navigateur.
- **Règle tenue à la lettre : aucun texte du livre n'est visible avant l'achat.** Pas d'aperçu, pas d'extrait,
  pas de « première page offerte » — la fiche d'un ouvrage renvoie la présentation et le sommaire, rien d'autre
  (l'API ne renvoie même plus le champ extrait). Le fichier répond **401** sans jeton et **403** avec un jeton
  expiré ; vérifié à l'exécution.

## M2. Lecture, téléchargement, bibliothèque (`/biblio`)

- **Lecture à l'écran** : lien signé valable 30 minutes (`POST /api/p4-pdf/signer`), ouvert dans le lecteur PDF
  du navigateur — bouton retour du téléphone conservé.
- **Téléchargement** : bouton qui récupère le fichier avec le jeton du compte (blob → « Télécharger »), donc
  lisible hors connexion, dans n'importe quelle liseuse.
- Chaque PDF est **imprimable au format A4** et porte un **filigrane au nom de l'acheteur**.

## M3. Paiement NOVA, webhook et livraison

- `POST /api/paiements/session` accepte `type: 'pdf'` et `type: 'pdfs'` (remise pack 10 %, code promo, refus si
  déjà possédé).
- **Webhook NOVA** ajouté : `POST /api/nova/webhook` — signature `NOVA-Signature` vérifiée sur le **corps brut**
  (HMAC-SHA256 sur `t.corps`, tolérance 5 minutes), **idempotent**, répond en moins de 5 s, et délivre l'accès
  (`pdf_acces`) sans jamais se fier au retour du navigateur.
  **Adresse à déclarer dans NOVA : `https://lms-lovat-five.vercel.app/api/nova/webhook`** (ton action).
- Chaîne vérifiée de bout en bout en local : commande créée → webhook signé → commande « payée » → livre dans la
  bibliothèque → **lecture servie (82 172 octets, application/pdf)** → webhook rejoué → « déjà payée ».

## M4. Générateur de PDF (côté serveur, sans dépendance)

- Moteur PDF 1.4 écrit pour l'occasion (`api/src/lib/pdf.ts`) + contenu pédagogique (`pdf-contenu.ts`, 871 lignes) :
  programme, chapitres, quiz corrigés, recettes de base (soude exacte, surgraissage), tableaux huiles/densités,
  fiches à imprimer.
- **Sommaire exact** : livre c1 → **21 pages** (sommaire p. 3, chapitres jusqu'à p. 19), c3 16 p, recueil 14 p,
  guide « Fixer ses prix » 12 p.
- Le catalogue vit dans `pdfs` (prix, publication, ordre, régénération) et se pilote depuis la console.

---

# État de la V4 — tout est livré

| Bloc | Livré | Adresses |
|---|---|---|
| G — Forum, galerie, ateliers, signalement | oui | `/communaute`, `/communaute/:id`, `/galerie`, `/galerie/:id`, `/ateliers` |
| H — Étiquette, produits, clients, commandes, co-formateurs, rentabilité | oui | `/etiquette`, `/produits(/:id)`, `/clients`, `/commandes(/:id)`, `/outils/prix`, `/formateur/equipe` |
| I — Fiche apprenant, questions en masse, examens, émargement, relevé | oui | `/formateur/apprenants/:id`, `/formateur/questions`, `/examens(/:id)`, `/emargement`, `/formateur/releve` |
| J — Points, défis, réabonnement, paliers de parrainage | oui | `/points`, `/abonnement`, `/parrainage` |
| K — Console, code de secours, journal, lots, kits | oui | `/console`, `/securite`, `/lots`, `/l/:slug`, `/kits` |
| L — Écoute, mode atelier, glossaire, mode texte seul | oui | `/ecoute/:id`, `/atelier-pratique/:id`, `/glossaire`, `/accessibilite` |
| M — Boutique PDF | oui | `/boutique`, `/boutique/:id`, `/biblio`, `/p/:slug` |

**Tests avant publication** : `86/86` adresses servies en 200 (et un vrai 404 sur une adresse inconnue),
**104 OK / 0 échec** sur la suite navigateur complète, `verify.js` 15/0, 33 contrôles d'assemblage,
parcours réel de 31 écrans joué dans Chromium mobile (boutique, étiquette calculée en INCI, rentabilité,
défi du mois, émargement par code, examen blanc corrigé, console et modération) — et la chaîne de paiement
webhook → accès → lecture vérifiée à l'exécution.
