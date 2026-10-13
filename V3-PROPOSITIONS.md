# CosmétiLab — Version 3 : ce qu'on peut y mettre

> Tout ce qui suit respecte les règles actuelles : **un seul fichier** (HTML+CSS+JS), **aucune dépendance externe**,
> Material Design 3 violet, mobile d'abord, et **chaque nouvel écran aura sa propre adresse** (comme `/cours/c1`).
> Coche ce que tu valides — je découpe ensuite en vagues et j'applique dans l'ordre.

---

## A. Apprendre (le cœur de l'app)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Taille |
|---|---|---|---|
| A1 ⭐ | **Parcours guidés** : « Devenir savonnière », « Lancer sa marque » — des suites de cours dans un ordre, avec progression d'ensemble. Adresse `/parcours/…` | Un élève perdu ne sait pas par quel cours commencer ; un parcours lui dit « fais ça, puis ça » | M |
| A2 ⭐ | **Quiz enrichis** : tirage aléatoire dans une banque de questions, vrais/faux, plusieurs bonnes réponses, chrono, mode « entraînement » (correction immédiate) vs « examen » (note à la fin) | Les quiz actuels sont fixes : on peut les apprendre par cœur sans comprendre | M |
| A3 ⭐ | **Flashcards + révision espacée** : cartes « question → réponse » (formule, INCI, proportion, température), revues automatiquement selon ce que tu oublies. Adresse `/revision` | La cosmétique est pleine de formules à retenir ; c'est la meilleure façon de réviser sur téléphone | M |
| A4 ⭐ | **Fiches de révision** imprimables/partageables (une page par cours : points clés, formules, erreurs à éviter) | Réviser hors app, montrer à une cliente, imprimer pour l'atelier | S |
| A5 | **Objectifs & séries** : « 15 min par jour », série de jours consécutifs, objectif hebdo, rappel du jour | Donne une raison de revenir chaque jour | S |
| A6 | **Statistiques de compétences** : radar par thème (saponification, émulsion, conservation, étiquetage, hygiène) + temps d'étude | Montrer à l'élève ce qu'il maîtrise vraiment, et où il progresse | M |
| A7 | **Corrigés détaillés** après chaque quiz/devoir : pourquoi la bonne réponse est bonne, avec le passage du cours | Comprendre l'erreur vaut mieux que la note | S |
| A8 | **Historique de lecture** « reprendre où j'en étais » multi-appareils (aujourd'hui : local) | Commencer sur le téléphone, continuer sur la tablette | S |

## B. Outils métier cosmétique (ce que les autres LMS n'ont pas)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Taille |
|---|---|---|---|
| B1 ⭐ | **Calculateur de formulation** : recette en pourcentages → grammes, coût par unité, prix de vente conseillé et marge. Adresse `/outils/formulation` | L'élève passe du cours à la pratique le jour même ; très fort pour la niche | M |
| B2 ⭐ | **Assistant saponification** : indice de saponification par huile → quantité de soude/potasse, surgraissage, dureté/mousse de la recette | C'est LA question que se pose tout débutant en savonnerie | M |
| B3 | **Convertisseur & tables** : °C/°F, ml/g, densités, tableau des huiles (bienfaits, dosage conseillé) | Dépannage permanent en atelier | S |
| B4 | **Carnet de production** : mes lots (date, recette, n° de lot, photo, observations, résultat), journal de traçabilité | Prépare un vrai atelier et rassure une future activité commerciale | M |
| B5 | **Réglementaire simplifié** : checklist d'étiquetage (mentions obligatoires), conservation & tests de stabilité, fiche de sécurité | Éviter les erreurs qui coûtent cher ; complète le cours « Étiquetage & sécurité » | S |
| B6 | **Fiche recette à sauvegarder** depuis un cours (recettes du cours rangées dans mes recettes) | Ne plus recopier dans un carnet papier | S |

## C. Espace formateur (celui qui fait vivre la plateforme)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Taille |
|---|---|---|---|
| C1 ⭐ | **Créer / modifier ses cours** : ajouter une leçon, réordonner, écrire et publier/dépublier, fixer le prix, brouillon | Aujourd'hui le contenu est figé : un formateur doit pouvoir publier lui-même | L |
| C2 ⭐ | **Banque de questions** : créer/éditer des questions, barème, les réutiliser dans plusieurs quiz | Alimente A2 et évite de tout refaire | M |
| C3 ⭐ | **Tableau de bord revenus** : ventes par cours, chiffre d'affaires, abonnés actifs, apprenants à risque (inactifs > 7 j) | Un formateur veut savoir ce qui marche et qui décroche | M |
| C4 | **Notation assistée** : barème par question, commentaires types réutilisables, notation en lot, renvoi du corrigé | Corriger 30 copies à la main est le point de douleur n° 1 | M |
| C5 | **Annonce à ses élèves** : envoyer une notification à un cours entier (devoir, séance, retard) | Communication directe, sans quitter l'app | S |
| C6 | **Séances en direct** : lien de visioconférence sur une séance, présence/émargement, rappel au bon moment | Transforme l'agenda en outil de cours en direct | S |

## D. Paiement, accès, fidélisation (NOVA)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Taille |
|---|---|---|---|
| D1 ⭐ | **Mes paiements** : historique, reçu (référence NOVA, montant, date), téléchargement/partage du reçu. Adresse `/paiements` | Un client qui paie veut une preuve ; indispensable si un jour il y a plusieurs vendeurs | M |
| D2 ⭐ | **Codes promo / accès offerts** : un formateur (ou toi) crée un code, durée ou % ; l'API `acces/offrir` existe déjà, il manque l'écran | Lancements, concours, élèves boursiers, ateliers partenaires | M |
| D3 | **Parrainage** : chaque élève a un lien ; un filleul qui paie → réduction ou cours offert au parrain | Croissance sans publicité | M |
| D4 | **Panier groupeé** : payer 3 cours en une seule session NOVA | Moins de frictions, panier moyen plus haut | S |
| D5 | **Relance douce** : rappel quand un abonnement arrive à échéance, et avant qu'un cours regardé mais non acheté ne soit oublié | C'est là qu'est le chiffre d'affaires | S |

## E. Téléphone & réseau (réalité béninoise)

| # | Ce qu'on ajoute | Pourquoi c'est utile | Taille |
|---|---|---|---|
| E1 ⭐ | **Mode économie de données** : vidéos en qualité basse par défaut, images légères, interdiction de lancer une vidéo sur réseau mobile sans confirmation | La data coûte cher : c'est ce qui fera rester les élèves | S |
| E2 ⭐ | **Vraiment hors-ligne** : télécharger une leçon/quiz pour le revoir sans réseau, file d'attente visible qui se synchronise au retour | On coupe souvent, ou on est en zone faible | M |
| E3 | **Ajout à l'écran d'accueil (PWA)** : icône, nom, plein écran, démarrage instantané | L'app a l'air d'une vraie appli. ⚠️ Nécessite **2 petits fichiers** en plus (`manifest.webmanifest` + `sw.js`) — le fichier unique reste le fichier unique, mais dis-moi si ça casse ta règle | M |
| E4 | **Rappels locaux** : notification programmée « ta séance commence », « 10 min de révision ? » tant que l'app est ouverte | Aucun service externe, aucun envoi de données | S |
| E5 | **Sauvegarde / restauration** : exporter mon dossier (JSON) et le réimporter sur un autre téléphone | Filet de sécurité pour le mode invité et local | S |

## F. Qualité, confiance, production

| # | Ce qu'on ajoute | Pourquoi c'est utile | Taille |
|---|---|---|---|
| F1 ⭐ | **Attestations vérifiables** : chaque attestation porte un code ; une page publique `/verifier/{code}` prouve qu'elle est authentique | Une attestation qu'on peut vérifier vaut beaucoup plus, pour l'élève comme pour un employeur | S |
| F2 ⭐ | **Accessibilité & lisibilité** : contrastes vérifiés, tailles de texte (petit/normal/grand), cibles tactiles 48 px, lecture d'écran, navigation clavier complète | Bon pour tous, obligatoire si tu veux des partenaires publics | M |
| F3 | **Référencement & partage** : `robots.txt`, `sitemap.xml`, aperçu correct quand on colle un lien (titre, description, image) | Les cours doivent pouvoir se trouver et bien s'afficher sur WhatsApp | S |
| F4 | **Écran « état du service »** : serveur joignable, temps réel actif, dernière synchro, 4 dernières erreurs | Diagnostic en 5 secondes au lieu d'un appel | S |
| F5 | **Performance** : démarrage plus rapide, images à la demande, ouverture des longs écrans sans ralentissement | Le fichier pèse 1,25 Mo : à surveiller à chaque ajout | M |
| F6 | **Tests** : parcours de paiement simulé, accessibilité, performance ajoutés aux suites existantes (104 OK aujourd'hui) | On garde « tout doit fonctionner » au lieu de l'espérer | M |

---

## Plan proposé (5 vagues, dans cet ordre)

1. **Vague 1 — Fondations visibles** : F1 attestations vérifiables · F3 référencement/partage · F4 état du service · E1 économie de données.
2. **Vague 2 — Apprendre mieux** : A2 quiz enrichis · A7 corrigés détaillés · A5 objectifs & séries · A1 parcours guidés.
3. **Vague 3 — Réviser & pratiquer** : A3 flashcards · A4 fiches · B1 calculateur de formulation · B2 assistant saponification · B3 convertisseur.
4. **Vague 4 — Gagner de l'argent** : D1 mes paiements · D2 codes promo · C3 revenus formateur · C1 création de cours · C2 banque de questions.
5. **Vague 5 — Finitions** : E2 hors-ligne réel · B4 carnet de production · C4 notation assistée · F2 accessibilité · F5 performance · F6 tests.

## Ma recommandation si tu veux un « V3 » court et marquant

**A1 + A2 + A3 + B1 + B2 + D1 + E1 + F1** — soit : parcours guidés, quiz vivants, flashcards, calculateur de formulation, assistant saponification, mes paiements avec reçu, économie de données, attestations vérifiables.
C'est ce qui donne à CosmétiLab un air de « vraie appli de métier » que les LMS génériques n'ont pas, dans un volume raisonnable.

## Ce que je ne propose pas (et pourquoi)

- **Application iOS/Android séparée** : ça demanderait de quitter le fichier unique et de tout réécrire ; l'option E3 (PWA) donne 80 % du bénéfice pour 5 % du travail.
- **Apple Pay / carte bancaire internationale** : NOVA est le seul moyen de paiement autorisé par ta décision, et c'est le bon choix en UEMOA.
- **Chat en direct / visio intégrée** : ça demande un service externe ; le lien de séance (C6) fait le travail.
- **Commentaires publics sous les cours** : la discussion par cours existe déjà, ouvrir au public demanderait de la modération.

---

### Comment valider

Réponds simplement avec les numéros (ex. « A1 A2 A3 B1 B2 D1 E1 F1 »), ou « le plan en 5 vagues », ou « ta recommandation ».
Si un point te paraît flou ou inutile, dis-le : j'enlève, je remplace, j'ajoute.
