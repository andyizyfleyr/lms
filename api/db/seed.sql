-- ============================================================
-- LearnHub — données de démonstration (relançable sans doublon)
-- Généré depuis l'application : cours, modules, vidéos, quiz, devoirs,
-- ressources, agenda, badges, discussions, notifications, téléchargements.
-- ============================================================
create extension if not exists pgcrypto;

-- Comptes de démonstration : amina@learnhub.bj / demo1234 (étudiante),
--                          adjovi@learnhub.bj / prof1234 (formatrice),
--                          admin@learnhub.bj / admin1234 (administrateur)
insert into users (email, password_hash, nom, role, tel, ville, promo, bio, objectif_semaine_h) values
  ('amina@learnhub.bj', 'scrypt$16384$8$1$r3QrDZniTViJ3v6xaXpFqA==$8xcHgY58QRW+fZwGu/efPGpSyuGSnPsAVmIXJWyqPaNu5UUJdZB/qYStZQmNe7DAG+vEcOquq5Wk5h0Pap6M4Q==', 'Amina Dossou', 'etudiant', '+229 97 00 00 00', 'Abomey-Calavi', 'L3 Informatique', 'Passionnée de développement web et de design d''interface.', 8),
  ('adjovi@learnhub.bj', 'scrypt$16384$8$1$p/eVKbqMJ5Po6aMTn3YUjA==$bOUtZr5GGlYe4YAxFafUJGTvUZ8AmUvG5nxgFX2rW7D0IU358bUGAXAXrV5AAQCcCg0L1Zaat/00/6yumzSBWA==', 'Mme Adjovi', 'enseignant', '', 'Cotonou', '', 'Formatrice UI/UX — Material Design 3.', 4),
  ('admin@learnhub.bj', 'scrypt$16384$8$1$Ca/s3/BUKxtO6fcdC8GhJA==$fKgS5rdJ+GSY4p7CyGXeZqGykQLBI3OAud6dRRTgU29V17juAKQKfxW7RK5h+u5/sYuldxsxnfPGwGNAZyZO3w==', 'Administrateur LearnHub', 'admin', '', 'Cotonou', '', 'Gère les cours, les comptes et les contenus.', 0)
on conflict (email) do nothing;

-- Cours
insert into courses (id, titre, categorie, prof, image_key, accent, ico, statut, duree_label, total_lecons) values
  ('c1', 'Développement Web Full-Stack', 'Développement', 'M. Kouassi', 'code', 'purple', 'code', 'encours', '12 min', 24),
  ('c2', 'UI/UX Design & Material 3', 'Design', 'Mme Adjovi', 'design', 'blue', 'layers', 'encours', '25 min', 18),
  ('c3', 'Data Science avec Python', 'Data', 'Dr. Bio', 'data', 'green', 'chart', 'encours', '18 min', 20),
  ('c4', 'Marketing Digital & Réseaux', 'Business', 'M. Tossou', 'marketing', 'amber', 'bullhorn', 'encours', '9 min', 16),
  ('c5', 'Anglais professionnel B2', 'Langues', 'Ms. Clark', 'anglais', 'pink', 'globe', 'termine', '—', 20),
  ('c6', 'Cybersécurité — Fondamentaux', 'Sécurité', 'M. Sanni', 'cyber', 'teal', 'shield', 'avenir', '30 min', 12)
on conflict (id) do update set titre = excluded.titre, categorie = excluded.categorie, prof = excluded.prof, total_lecons = excluded.total_lecons;

-- Modules et leçons (48)
insert into lessons (id, course_id, module_titre, module_ordre, ordre, titre, duree_label, kind, video_id) values
  ('c1-m1-l1', 'c1', 'Fondations du web', 1, 1, 'Introduction au web et à l''environnement', '8 min', 'lecture', ''),
  ('c1-m1-l2', 'c1', 'Fondations du web', 1, 2, 'Les bases de JavaScript', '62 min', 'video', 'agj8_3xpuYI'),
  ('c1-m1-l3', 'c1', 'Fondations du web', 1, 3, 'JavaScript de A à Z en 1 heure', '62 min', 'video', 'ldxt9FNUc50'),
  ('c1-m2-l1', 'c1', 'DOM & composants réutilisables', 2, 1, 'Manipuler le DOM pas à pas', '12 min', 'lecture', ''),
  ('c1-m2-l2', 'c1', 'DOM & composants réutilisables', 2, 2, 'Créer des composants réutilisables', '14 min', 'lecture', ''),
  ('c1-m2-l3', 'c1', 'DOM & composants réutilisables', 2, 3, 'Exercice guidé : galerie de cartes', '25 min', 'exercice', ''),
  ('c1-m3-l1', 'c1', 'Passer au full-stack', 3, 1, 'Consommer une API REST', '16 min', 'lecture', ''),
  ('c1-m3-l2', 'c1', 'Passer au full-stack', 3, 2, 'Projet final : portfolio responsive', '1 h', 'projet', ''),
  ('c2-m1-l1', 'c2', 'Les bases de Material Design 3', 1, 1, 'Tout savoir sur Material Design 3', '24 min', 'video', 'h_JYW2hdI8U'),
  ('c2-m1-l2', 'c2', 'Les bases de Material Design 3', 1, 2, 'Colorimétrie et rôles de couleur', '12 min', 'lecture', ''),
  ('c2-m1-l3', 'c2', 'Les bases de Material Design 3', 1, 3, 'Typographie et échelle de styles', '10 min', 'lecture', ''),
  ('c2-m2-l1', 'c2', 'Composants M3', 2, 1, 'Prototyper un FAB Material 3 sur Figma', '23 min', 'video', 'asN3B33wOzo'),
  ('c2-m2-l2', 'c2', 'Composants M3', 2, 2, 'Cartes, chips et navigation', '15 min', 'lecture', ''),
  ('c2-m2-l3', 'c2', 'Composants M3', 2, 3, 'Material 3 : du design au déploiement', '16 min', 'video', '7nrhTdS7dHg'),
  ('c2-m3-l1', 'c2', 'Aller plus loin', 3, 1, 'Exercice : palette dynamique', '20 min', 'exercice', ''),
  ('c2-m3-l2', 'c2', 'Aller plus loin', 3, 2, 'Accessibilité et contrastes', '14 min', 'lecture', ''),
  ('c2-m3-l3', 'c2', 'Aller plus loin', 3, 3, 'Quiz final — composants Material 3', '10 min', 'quiz', ''),
  ('c3-m1-l1', 'c3', 'Python pour la data', 1, 1, 'Introduction à Python pour la data', '10 min', 'lecture', ''),
  ('c3-m1-l2', 'c3', 'Python pour la data', 1, 2, 'Python, NumPy et Pandas (cours complet)', '6 h 05', 'video', 'LwkWwxg10IU'),
  ('c3-m1-l3', 'c3', 'Python pour la data', 1, 3, 'Pandas : analyse du Titanic', '17 min', 'video', 'zZkNOdBWgFQ'),
  ('c3-m2-l1', 'c3', 'Préparer et visualiser', 2, 1, 'Nettoyage et préparation des données', '14 min', 'lecture', ''),
  ('c3-m2-l2', 'c3', 'Préparer et visualiser', 2, 2, 'Visualisation avec Matplotlib', '16 min', 'lecture', ''),
  ('c3-m3-l1', 'c3', 'Modéliser', 3, 1, 'Premiers modèles : régression linéaire', '22 min', 'exercice', ''),
  ('c3-m3-l2', 'c3', 'Modéliser', 3, 2, 'Devoir noté : régression linéaire', '1 h 30', 'devoir', ''),
  ('c3-m3-l3', 'c3', 'Modéliser', 3, 3, 'Quiz du module Data Science', '10 min', 'quiz', ''),
  ('c4-m1-l1', 'c4', 'Panorama du digital', 1, 1, 'Formation marketing digital complète', '1 h 46', 'video', '5IcZPL-zJYc'),
  ('c4-m1-l2', 'c4', 'Panorama du digital', 1, 2, 'Définir sa cible et son positionnement', '12 min', 'lecture', ''),
  ('c4-m1-l3', 'c4', 'Panorama du digital', 1, 3, 'Stratégie réseaux sociaux en 7 étapes', '9 min', 'video', '3WFYTiHi5TU'),
  ('c4-m2-l1', 'c4', 'Contenu et acquisition', 2, 1, 'Community management au quotidien', '10 min', 'lecture', ''),
  ('c4-m2-l2', 'c4', 'Contenu et acquisition', 2, 2, 'Publicité en ligne : Meta & Google Ads', '18 min', 'lecture', ''),
  ('c4-m2-l3', 'c4', 'Contenu et acquisition', 2, 3, 'Exercice : plan de contenu 30 jours', '20 min', 'exercice', ''),
  ('c4-m3-l1', 'c4', 'Piloter la performance', 3, 1, 'Étude de cas : lancement produit', '15 min', 'lecture', ''),
  ('c4-m3-l2', 'c4', 'Piloter la performance', 3, 2, 'Quiz marketing digital', '8 min', 'quiz', ''),
  ('c5-m1-l1', 'c5', 'Business English essentials', 1, 1, '18 mots d''anglais des affaires', '21 min', 'video', 'vzIEBqBexf4'),
  ('c5-m1-l2', 'c5', 'Business English essentials', 1, 2, 'Business English : conversation', '1 h 45', 'video', 'iyoXejosxGg'),
  ('c5-m2-l1', 'c5', 'Communiquer au travail', 2, 1, 'Réunions et visioconférences', '12 min', 'lecture', ''),
  ('c5-m2-l2', 'c5', 'Communiquer au travail', 2, 2, 'Écrire des e-mails professionnels', '14 min', 'lecture', ''),
  ('c5-m2-l3', 'c5', 'Communiquer au travail', 2, 3, 'Négocier et convaincre', '18 min', 'exercice', ''),
  ('c5-m3-l1', 'c5', 'Certification', 3, 1, 'Préparation à l''examen B2', '20 min', 'lecture', ''),
  ('c5-m3-l2', 'c5', 'Certification', 3, 2, 'Quiz final B2', '12 min', 'quiz', ''),
  ('c6-m1-l1', 'c6', 'Comprendre les menaces', 1, 1, 'Cybersécurité : guide pour démarrer', '18 min', 'video', 'VLr0mTzYfRE'),
  ('c6-m1-l2', 'c6', 'Comprendre les menaces', 1, 2, 'Débuter le hacking éthique', '20 min', 'video', 'syb15o27GEE'),
  ('c6-m1-l3', 'c6', 'Comprendre les menaces', 1, 3, 'Authentification et mots de passe', '12 min', 'lecture', ''),
  ('c6-m2-l1', 'c6', 'Protéger ses données', 2, 1, 'Le chiffrement expliqué simplement', '15 min', 'lecture', ''),
  ('c6-m2-l2', 'c6', 'Protéger ses données', 2, 2, 'Sécurité des réseaux', '14 min', 'lecture', ''),
  ('c6-m2-l3', 'c6', 'Protéger ses données', 2, 3, 'Hygiène numérique au quotidien', '10 min', 'lecture', ''),
  ('c6-m3-l1', 'c6', 'Mettre en pratique', 3, 1, 'Exercice : repérer un e-mail de phishing', '20 min', 'exercice', ''),
  ('c6-m3-l2', 'c6', 'Mettre en pratique', 3, 2, 'Quiz du module Cybersécurité', '10 min', 'quiz', '')
on conflict (id) do update set titre = excluded.titre, module_titre = excluded.module_titre, duree_label = excluded.duree_label, video_id = excluded.video_id;

-- Bibliothèque vidéo
insert into videos (id, course_id, titre, chaine, duree_s, vues, image_key) values
  ('5IcZPL-zJYc', 'c4', 'Formation Marketing Digital : le cours complet', 'Ludo Salenne', 6371, 853817, 'marketing'),
  ('VLr0mTzYfRE', 'c6', 'Cybersécurité : guide complet pour démarrer', 'Techno', 1057, 503575, 'cyber'),
  ('iyoXejosxGg', 'c5', 'Learn Business English — conversation & vocabulary', 'Shaw English Online', 6325, 411346, 'anglais'),
  ('zZkNOdBWgFQ', 'c3', 'Pandas Python — introduction et analyse du Titanic', 'Machine Learnia', 1049, 296829, 'data'),
  ('h_JYW2hdI8U', 'c2', 'Everything you need to know about Material Design 3', 'Stevdza-San', 1465, 134508, 'design'),
  ('7nrhTdS7dHg', 'c2', 'Material 3 : du design au déploiement', 'Flutter', 970, 106907, 'design'),
  ('syb15o27GEE', 'c6', 'Débuter le hacking éthique et la cybersécurité', 'Fransosiche', 1214, 63762, 'cyber'),
  ('agj8_3xpuYI', 'c1', 'Les bases de JavaScript — tuto débutant', 'Bertrand . Tech', 3754, 44254, 'code'),
  ('LwkWwxg10IU', 'c3', 'Python, NumPy et Pandas pour la Data Science', 'J.A DATATECH CONSULTING', 21916, 40411, 'data'),
  ('asN3B33wOzo', 'c2', 'Prototyper un FAB Material 3 sur Figma', 'The indieDev', 1409, 19967, 'design'),
  ('ldxt9FNUc50', 'c1', 'Apprendre JavaScript en 1 h — cours complet débutant', 'Comment Coder', 3740, 12304, 'code'),
  ('vzIEBqBexf4', 'c5', '18 mots d''anglais des affaires à connaître', 'Anglais Avec un Anglophone', 1247, 9927, 'anglais'),
  ('3WFYTiHi5TU', 'c4', 'Construire une stratégie réseaux sociaux en 7 étapes', 'Metricool en français', 531, 2919, 'marketing')
on conflict (id) do update set titre = excluded.titre, chaine = excluded.chaine, duree_s = excluded.duree_s, vues = excluded.vues;

-- Ressources (17)
insert into resources (id, course_id, ordre, titre, type_label, ico, accent) values
  ('c1-r1', 'c1', 1, 'Support de cours — API REST', 'PDF · 2,4 Mo', 'task', 'purple'),
  ('c1-r2', 'c1', 2, 'Code source du module 3', 'ZIP · 8,1 Mo', 'code', 'blue'),
  ('c1-r3', 'c1', 3, 'Mémo JavaScript (aide-mémoire)', 'PDF · 640 Ko', 'layers', 'green'),
  ('c1-r4', 'c1', 4, 'Maquette de départ', 'Figma · lien', 'edit', 'amber'),
  ('c2-r1', 'c2', 1, 'Grille et espacements M3', 'PDF · 1,1 Mo', 'grid', 'purple'),
  ('c2-r2', 'c2', 2, 'Kit de composants Figma', 'Figma · lien', 'layers', 'blue'),
  ('c2-r3', 'c2', 3, 'Palette et rôles de couleur', 'PDF · 820 Ko', 'sliders', 'amber'),
  ('c2-r4', 'c2', 4, 'Checklist accessibilité', 'PDF · 380 Ko', 'shield', 'green'),
  ('c3-r1', 'c3', 1, 'Notebook de régression linéaire', 'IPYNB · 1,8 Mo', 'chart', 'green'),
  ('c3-r2', 'c3', 2, 'Jeu de données Titanic', 'CSV · 60 Ko', 'layers', 'blue'),
  ('c3-r3', 'c3', 3, 'Mémo Pandas', 'PDF · 900 Ko', 'task', 'purple'),
  ('c4-r1', 'c4', 1, 'Plan de contenu (modèle)', 'XLSX · 240 Ko', 'grid', 'amber'),
  ('c4-r2', 'c4', 2, 'Étude de cas — lancement produit', 'PDF · 1,5 Mo', 'task', 'purple'),
  ('c5-r1', 'c5', 1, 'Vocabulaire des affaires (200 mots)', 'PDF · 700 Ko', 'globe', 'pink'),
  ('c5-r2', 'c5', 2, 'Sujets d''entraînement B2', 'PDF · 1,2 Mo', 'task', 'blue'),
  ('c6-r1', 'c6', 1, 'Guide d''hygiène numérique', 'PDF · 1,3 Mo', 'shield', 'teal'),
  ('c6-r2', 'c6', 2, 'Exemples d''e-mails frauduleux', 'PDF · 900 Ko', 'task', 'purple')
on conflict (id) do update set titre = excluded.titre, type_label = excluded.type_label;

-- Quiz (6) — questions (28) — réponses (112)
insert into quizzes (id, course_id, titre, duree_s) values
  ('c2', 'c2', 'Composants Material Design 3', 600),
  ('c1', 'c1', 'JavaScript : les fondamentaux', 420),
  ('c3', 'c3', 'Data Science avec Python', 480),
  ('c4', 'c4', 'Marketing digital', 360),
  ('c5', 'c5', 'Business English B2', 420),
  ('c6', 'c6', 'Cybersécurité — Fondamentaux', 420)
on conflict (id) do update set titre = excluded.titre, duree_s = excluded.duree_s;
insert into quiz_questions (id, quiz_id, ordre, enonce, explication) values
  ('c2-q1', 'c2', 1, 'Quel rôle de couleur M3 faut-il utiliser pour un texte posé sur « primary » ?', 'Chaque rôle possède sa contrepartie « on- » pour garantir le contraste du contenu.'),
  ('c2-q2', 'c2', 2, 'Par défaut, quelle est la forme d''un FAB en Material 3 ?', 'Le FAB M3 utilise un rayon de 16 dp ; la variante « extended » est également arrondie à 16 dp.'),
  ('c2-q3', 'c2', 3, 'En Material 3, l''élévation est principalement exprimée par…', 'M3 remplace l''ombre seule par des « surface containers » teintés selon le niveau.'),
  ('c2-q4', 'c2', 4, 'D''où provient la couleur d''un bouton « tonal » M3 ?', 'Un bouton tonal (filled tonal) est rempli par la couleur de rôle secondary-container.'),
  ('c2-q5', 'c2', 5, 'À quoi sert un « state layer » dans les composants M3 ?', 'Le state layer ajoute une couche d''opacité sur l''état (hover 8 %, focus 10 %, pressed 10 %).'),
  ('c2-q6', 'c2', 6, 'Quelle taille de corps pour le style « body large » ?', 'L''échelle typographique M3 définit body-large à 16 sp.'),
  ('c1-q1', 'c1', 1, 'Quel mot-clé déclare une constante non réaffectable ?', 'const : la liaison ne peut pas être réassignée.'),
  ('c1-q2', 'c1', 2, 'Que renvoie « typeof null » ?', 'Comportement historique du langage : typeof null vaut "object".'),
  ('c1-q3', 'c1', 3, 'Quelle méthode ajoute un élément en fin de tableau ?', 'push() ajoute en fin ; unshift() ajoute au début.'),
  ('c1-q4', 'c1', 4, 'Comment sélectionner un élément par son identifiant ?', 'getElementById renvoie un seul élément.'),
  ('c1-q5', 'c1', 5, 'Que fait « addEventListener("click", fn) » ?', 'On attache un écouteur déclenché à chaque clic.'),
  ('c3-q1', 'c3', 1, 'Quelle fonction lit un fichier CSV avec Pandas ?', 'pandas.read_csv charge un CSV dans un DataFrame.'),
  ('c3-q2', 'c3', 2, 'Que renvoie df.head() ?', 'head(n=5) affiche les 5 premières lignes.'),
  ('c3-q3', 'c3', 3, 'Quel attribut donne les dimensions d''un DataFrame ?', 'df.shape renvoie (lignes, colonnes).'),
  ('c3-q4', 'c3', 4, 'Quel outil sert à afficher un graphique avec Matplotlib ?', 'plt.show() affiche la figure courante.'),
  ('c3-q5', 'c3', 5, 'Quelle bibliothèque est optimisée pour le calcul numérique ?', 'NumPy fournit des tableaux ndarray vectorisés.'),
  ('c4-q1', 'c4', 1, 'Que signifie SEO ?', 'Optimisation pour les moteurs de recherche.'),
  ('c4-q2', 'c4', 2, 'Quel indicateur mesure l''engagement sur un réseau social ?', 'Interactions / impressions ou abonnés.'),
  ('c4-q3', 'c4', 3, 'Un « CTA » est…', 'Call To Action : invite à une action précise.'),
  ('c4-q4', 'c4', 4, 'Quel canal est « owned » (possédé) ?', 'Owned media : vous en maîtrisez le contenu et la diffusion.'),
  ('c5-q1', 'c5', 1, 'Comment refuser poliment en réunion ?', 'Formule atténuée et professionnelle.'),
  ('c5-q2', 'c5', 2, 'Quelle formule ouvre un e-mail professionnel ?', '« Dear + titre + nom » reste la référence formelle.'),
  ('c5-q3', 'c5', 3, 'Que signifie « to follow up on something » ?', 'Faire un suivi d''un dossier ou d''un échange.'),
  ('c5-q4', 'c5', 4, 'Comment demander une reformulation ?', '« Could you clarify… » demande une précision avec courtoisie.'),
  ('c6-q1', 'c6', 1, 'Quel signe évoque un e-mail de phishing ?', 'Le domaine de l''expéditeur est le premier indice.'),
  ('c6-q2', 'c6', 2, 'La double authentification (2FA)…', 'Un second facteur : code, application, clé matérielle.'),
  ('c6-q3', 'c6', 3, 'Un mot de passe robuste est…', 'Longueur + unicité + aléatoire = robustesse.'),
  ('c6-q4', 'c6', 4, 'Le chiffrement garantit…', 'Les données restent illisibles sans la clé.')
on conflict (id) do update set enonce = excluded.enonce, explication = excluded.explication;
insert into quiz_options (id, question_id, ordre, texte, correct) values
  ('c2-q1-o1', 'c2-q1', 1, 'on-primary', true),
  ('c2-q1-o2', 'c2-q1', 2, 'secondary', false),
  ('c2-q1-o3', 'c2-q1', 3, 'surface-variant', false),
  ('c2-q1-o4', 'c2-q1', 4, 'outline', false),
  ('c2-q2-o1', 'c2-q2', 1, 'Carré (0 dp)', false),
  ('c2-q2-o2', 'c2-q2', 2, 'Coins arrondis de 16 dp', true),
  ('c2-q2-o3', 'c2-q2', 3, 'Coin supérieur arrondi', false),
  ('c2-q2-o4', 'c2-q2', 4, 'Pilule complète', false),
  ('c2-q3-o1', 'c2-q3', 1, 'Une ombre uniquement', false),
  ('c2-q3-o2', 'c2-q3', 2, 'Une teinte de surface (surface tint)', true),
  ('c2-q3-o3', 'c2-q3', 3, 'Une bordure épaisse', false),
  ('c2-q3-o4', 'c2-q3', 4, 'Un dégradé', false),
  ('c2-q4-o1', 'c2-q4', 1, 'primary', false),
  ('c2-q4-o2', 'c2-q4', 2, 'secondary-container', true),
  ('c2-q4-o3', 'c2-q4', 3, 'tertiary', false),
  ('c2-q4-o4', 'c2-q4', 4, 'error', false),
  ('c2-q5-o1', 'c2-q5', 1, 'À décorer le bouton', false),
  ('c2-q5-o2', 'c2-q5', 2, 'À signaler survol, focus et appui', true),
  ('c2-q5-o3', 'c2-q5', 3, 'À empiler les cartes', false),
  ('c2-q5-o4', 'c2-q5', 4, 'À animer les icônes', false),
  ('c2-q6-o1', 'c2-q6', 1, '14', false),
  ('c2-q6-o2', 'c2-q6', 2, '16', true),
  ('c2-q6-o3', 'c2-q6', 3, '18', false),
  ('c2-q6-o4', 'c2-q6', 4, '20', false),
  ('c1-q1-o1', 'c1-q1', 1, 'var', false),
  ('c1-q1-o2', 'c1-q1', 2, 'let', false),
  ('c1-q1-o3', 'c1-q1', 3, 'const', true),
  ('c1-q1-o4', 'c1-q1', 4, 'static', false),
  ('c1-q2-o1', 'c1-q2', 1, '"null"', false),
  ('c1-q2-o2', 'c1-q2', 2, '"object"', true),
  ('c1-q2-o3', 'c1-q2', 3, '"undefined"', false),
  ('c1-q2-o4', 'c1-q2', 4, '"number"', false),
  ('c1-q3-o1', 'c1-q3', 1, 'unshift()', false),
  ('c1-q3-o2', 'c1-q3', 2, 'pop()', false),
  ('c1-q3-o3', 'c1-q3', 3, 'push()', true),
  ('c1-q3-o4', 'c1-q3', 4, 'shift()', false),
  ('c1-q4-o1', 'c1-q4', 1, 'document.querySelectorAll(".id")', false),
  ('c1-q4-o2', 'c1-q4', 2, 'document.getElementById("id")', true),
  ('c1-q4-o3', 'c1-q4', 3, 'document.find("id")', false),
  ('c1-q4-o4', 'c1-q4', 4, 'window.element("id")', false),
  ('c1-q5-o1', 'c1-q5', 1, 'Exécute fn immédiatement', false),
  ('c1-q5-o2', 'c1-q5', 2, 'Enregistre fn pour l''événement click', true),
  ('c1-q5-o3', 'c1-q5', 3, 'Supprime le nœud', false),
  ('c1-q5-o4', 'c1-q5', 4, 'Modifie le style', false),
  ('c3-q1-o1', 'c3-q1', 1, 'pd.read_csv()', true),
  ('c3-q1-o2', 'c3-q1', 2, 'pd.load_csv()', false),
  ('c3-q1-o3', 'c3-q1', 3, 'pd.open_csv()', false),
  ('c3-q1-o4', 'c3-q1', 4, 'pd.csv()', false),
  ('c3-q2-o1', 'c3-q2', 1, 'Les 10 dernières lignes', false),
  ('c3-q2-o2', 'c3-q2', 2, 'Les 5 premières lignes', true),
  ('c3-q2-o3', 'c3-q2', 3, 'Le nombre de lignes', false),
  ('c3-q2-o4', 'c3-q2', 4, 'Les colonnes', false),
  ('c3-q3-o1', 'c3-q3', 1, 'df.size', false),
  ('c3-q3-o2', 'c3-q3', 2, 'df.len', false),
  ('c3-q3-o3', 'c3-q3', 3, 'df.shape', true),
  ('c3-q3-o4', 'c3-q3', 4, 'df.count', false),
  ('c3-q4-o1', 'c3-q4', 1, 'plt.show()', true),
  ('c3-q4-o2', 'c3-q4', 2, 'plt.display()', false),
  ('c3-q4-o3', 'c3-q4', 3, 'plt.render()', false),
  ('c3-q4-o4', 'c3-q4', 4, 'plt.plot.show', false),
  ('c3-q5-o1', 'c3-q5', 1, 'NumPy', true),
  ('c3-q5-o2', 'c3-q5', 2, 'Pillow', false),
  ('c3-q5-o3', 'c3-q5', 3, 'Requests', false),
  ('c3-q5-o4', 'c3-q5', 4, 'Flask', false),
  ('c4-q1-o1', 'c4-q1', 1, 'Search Engine Optimization', true),
  ('c4-q1-o2', 'c4-q1', 2, 'Social Engagement Online', false),
  ('c4-q1-o3', 'c4-q1', 3, 'Sales Efficiency Output', false),
  ('c4-q1-o4', 'c4-q1', 4, 'Site Editing Order', false),
  ('c4-q2-o1', 'c4-q2', 1, 'Le nombre de serveurs', false),
  ('c4-q2-o2', 'c4-q2', 2, 'Le taux d''engagement', true),
  ('c4-q2-o3', 'c4-q2', 3, 'Le poids des images', false),
  ('c4-q2-o4', 'c4-q2', 4, 'Le taux de conversion d''un site', false),
  ('c4-q3-o1', 'c4-q3', 1, 'Un budget publicitaire', false),
  ('c4-q3-o2', 'c4-q3', 2, 'Un appel à l''action', true),
  ('c4-q3-o3', 'c4-q3', 3, 'Une campagne d''e-mailing', false),
  ('c4-q3-o4', 'c4-q3', 4, 'Une audience', false),
  ('c4-q4-o1', 'c4-q4', 1, 'Une publicité payante', false),
  ('c4-q4-o2', 'c4-q4', 2, 'Votre blog', true),
  ('c4-q4-o3', 'c4-q4', 3, 'Un article de presse', false),
  ('c4-q4-o4', 'c4-q4', 4, 'Un avis client', false),
  ('c5-q1-o1', 'c5-q1', 1, 'I don''t care.', false),
  ('c5-q1-o2', 'c5-q1', 2, 'I''m afraid I''d have to disagree.', true),
  ('c5-q1-o3', 'c5-q1', 3, 'No way.', false),
  ('c5-q1-o4', 'c5-q1', 4, 'That''s wrong.', false),
  ('c5-q2-o1', 'c5-q2', 1, 'Hey!', false),
  ('c5-q2-o2', 'c5-q2', 2, 'Dear Ms Clark,', true),
  ('c5-q2-o3', 'c5-q2', 3, 'Yo,', false),
  ('c5-q2-o4', 'c5-q2', 4, 'To whom it may concern,', false),
  ('c5-q3-o1', 'c5-q3', 1, 'Annuler', false),
  ('c5-q3-o2', 'c5-q3', 2, 'Relancer / faire un suivi', true),
  ('c5-q3-o3', 'c5-q3', 3, 'Renvoyer un colis', false),
  ('c5-q3-o4', 'c5-q3', 4, 'Signer un contrat', false),
  ('c5-q4-o1', 'c5-q4', 1, 'Could you clarify that, please?', true),
  ('c5-q4-o2', 'c5-q4', 2, 'Speak louder.', false),
  ('c5-q4-o3', 'c5-q4', 3, 'What?', false),
  ('c5-q4-o4', 'c5-q4', 4, 'Say it again, fast.', false),
  ('c6-q1-o1', 'c6-q1', 1, 'Un domaine d''expéditeur douteux', true),
  ('c6-q1-o2', 'c6-q1', 2, 'Une signature professionnelle', false),
  ('c6-q1-o3', 'c6-q1', 3, 'Un objet clair', false),
  ('c6-q1-o4', 'c6-q1', 4, 'Un PDF joint à votre demande', false),
  ('c6-q2-o1', 'c6-q2', 1, 'Remplace le mot de passe', false),
  ('c6-q2-o2', 'c6-q2', 2, 'Ajoute une seconde preuve', true),
  ('c6-q2-o3', 'c6-q2', 3, 'Chiffre le disque', false),
  ('c6-q2-o4', 'c6-q2', 4, 'Supprime les cookies', false),
  ('c6-q3-o1', 'c6-q3', 1, 'Un mot du dictionnaire', false),
  ('c6-q3-o2', 'c6-q3', 2, 'Long, unique et aléatoire', true),
  ('c6-q3-o3', 'c6-q3', 3, 'Votre date de naissance', false),
  ('c6-q3-o4', 'c6-q3', 4, 'Le même partout', false),
  ('c6-q4-o1', 'c6-q4', 1, 'La confidentialité des données', true),
  ('c6-q4-o2', 'c6-q4', 2, 'La vitesse du réseau', false),
  ('c6-q4-o3', 'c6-q4', 3, 'La sauvegarde automatique', false),
  ('c6-q4-o4', 'c6-q4', 4, 'L''anonymat total', false)
on conflict (id) do update set texte = excluded.texte, correct = excluded.correct;

-- Devoirs
insert into assignments (id, course_id, titre, type, points, echeance_label, niveau, consignes, quiz_id) values
  ('d1', 'c2', 'Quiz — Les composants Material 3', 'Quiz noté', 20, 'j+0 18:00', 'urgent', '["Révisez les rôles de couleur et les styles typographiques M3.","Le quiz comporte 6 questions à choix unique.","Un seul essai possible avant la clôture à 18:00."]'::jsonb, 'c2'),
  ('d2', 'c1', 'Projet — Portfolio responsive', 'Projet', 40, 'j+1 23:59', 'soon', '["Livrez une page portfolio responsive (mobile-first).","Utilisez des composants réutilisables en JavaScript.","Déposez une archive .zip contenant le code source.","Bonus : intégrez une barre de navigation type Material 3."]'::jsonb, null),
  ('d3', 'c3', 'Devoir — Régression linéaire', 'Devoir noté', 30, 'j+4 12:00', 'normal', '["Chargez le jeu de données fourni avec Pandas.","Nettoyez les valeurs manquantes et justifiez vos choix.","Entraînez une régression linéaire simple et commentez le R².","Rendez un notebook .ipynb commenté."]'::jsonb, null),
  ('d4', 'c4', 'Étude de cas — Lancement produit', 'Étude de cas', 25, 'j+-3 23:59', 'past', '["Analysez la campagne de lancement d''une marque locale.","Proposez un plan média sur 30 jours."]'::jsonb, null),
  ('d5', 'c6', 'Exercice — Repérer un phishing', 'Exercice', 15, 'j+-1 20:00', 'past', '["Identifiez 5 indices de phishing dans l''e-mail fourni.","Expliquez la conduite à tenir pour chacun."]'::jsonb, null)
on conflict (id) do update set titre = excluded.titre, points = excluded.points, consignes = excluded.consignes;

-- Séances de l'agenda
insert into calendar_sessions (id, jour_semaine, heure, titre, type, duree_label, salle, course_id, prof, tags, accent, ico, description) values
  ('s1', 0, '09:00', 'Live — Composants Material 3', 'Visioconférence', '1 h 30', 'Salle virtuelle A', 'c2', 'Mme Adjovi', '["Live","UI/UX"]'::jsonb, 'purple', 'video', 'Composants M3 en direct : cartes, chips, navigation et états d''interaction. Questions ouvertes en fin de séance.'),
  ('s2', 0, '14:00', 'Atelier — Maquette responsive', 'Présentiel', '2 h', 'Amphi 2 · Calavi', 'c2', 'M. Kouassi', '["Atelier"]'::jsonb, 'blue', 'grid', 'Atelier pratique : passez la maquette Figma en HTML/CSS responsive. Apportez votre ordinateur.'),
  ('s3', 1, '10:30', 'Cours — Hooks React avancés', 'Live', '1 h', 'Salle virtuelle B', 'c1', 'M. Kouassi', '["Dev","React"]'::jsonb, 'green', 'code', 'useMemo, useCallback et effets : quand optimiser, quand s''abstenir.'),
  ('s4', 2, '16:00', 'Tutorat Data Science', 'Tutorat', '45 min', 'Visio individuelle', 'c3', 'Dr. Bio', '["Tutorat"]'::jsonb, 'amber', 'chart', 'Séance individuelle : revue de votre notebook de régression linéaire.'),
  ('s5', 4, '11:00', 'Examen blanc — Anglais B2', 'Évaluation', '2 h', 'Centre d''examen', 'c5', 'Ms. Clark', '["Examen"]'::jsonb, 'pink', 'globe', 'Épreuve blanche complète : compréhension, expression écrite et orale.'),
  ('s6', 6, '18:30', 'Q&A communauté LearnHub', 'Discussion', '1 h', 'Discord LearnHub', null, 'Équipe LearnHub', '["Communauté"]'::jsonb, 'teal', 'chat', 'Questions libres, retours d''expérience et entraide entre étudiants.')
on conflict (id) do update set titre = excluded.titre, heure = excluded.heure, description = excluded.description;

-- Badges
insert into badges (id, nom, ico, accent, description, cible) values
  ('streak', 'Marathonien', 'fire', 'amber', 'Se connecter 7 jours d''affilée', 7),
  ('assidu', 'Assidu', 'school', 'green', 'Terminer 20 leçons', 20),
  ('premier', 'Premier pas', 'check-circle', 'blue', 'Terminer sa première leçon', 1),
  ('regulier', 'Régulier', 'clock', 'purple', 'Terminer 10 leçons ce mois-ci', 10),
  ('explo', 'Explorateur', 'globe', 'teal', 'Suivre les 6 cours du catalogue', 6),
  ('perf', 'Perfectionniste', 'star', 'blue', 'Obtenir 5 quiz parfaits (100 %)', 5),
  ('mentor', 'Mentor', 'chat', 'purple', 'Publier 10 messages dans les discussions', 10),
  ('data', 'Data Analyst', 'chart', 'green', 'Terminer « Data Science avec Python »', 100),
  ('cyber', 'Cyber-défenseur', 'shield', 'teal', 'Terminer « Cybersécurité — Fondamentaux »', 100)
on conflict (id) do update set nom = excluded.nom, description = excluded.description;

-- Messages de discussion (7)
insert into messages (course_id, auteur, role, contenu, created_at)
select v.course_id, v.auteur, v.role, v.contenu, now() - coalesce(v.min, 0) * interval '1 minute'
from (values
  ('c1', 'M. Kouassi', 'prof', 'Bonjour à tous 👋 Le module 3 est en ligne. Commencez par la leçon sur les API REST, puis attaquez le projet portfolio.', 120),
  ('c1', 'Ibrahim S.', 'etudiant', 'Merci ! Est-ce qu''on peut utiliser des Web Components sans framework pour le projet ?', 95),
  ('c1', 'M. Kouassi', 'prof', 'Oui, c''est même recommandé pour ce module : composants natifs + fetch, sans dépendance.', 88),
  ('c2', 'Mme Adjovi', 'prof', 'Vos maquettes avancent bien 👏 Pensez à vérifier le contraste texte/fond (ratio 4.5:1 minimum) avant de rendre.', 60),
  ('c2', 'Amina D.', 'etudiant', 'Merci ! J''ai retravaillé les espacements avec l''échelle 4/8/12 et une teinte surface-container-high sur les cartes.', 45),
  ('c2', 'Mme Adjovi', 'prof', '« Maquette M3 » : vos espacements sont bien meilleurs 👏 Continuez sur la hiérarchie typographique.', 38),
  ('c3', 'Dr. Bio', 'prof', 'Rappel : le devoir de régression linéaire se rend en notebook commenté (.ipynb). Posez vos questions ici.', 200)
) as v(course_id, auteur, role, contenu, min)
where not exists (select 1 from messages m where m.course_id = v.course_id and m.contenu = v.contenu);

-- Notifications générales
insert into notifications (titre, texte, ico, kind, ref_id, created_at)
select v.titre, v.texte, v.ico, v.kind, v.ref_id, now() - v.min * interval '1 minute'
from (values
  ('Quiz Material 3 à rendre aujourd''hui', 'Clôture à 18:00 — 6 questions, 20 points.', 'calendar', 'devoir', 'd1', 8),
  ('Nouveau commentaire de Mme Adjovi', '« Maquette M3 » : vos espacements sont bien meilleurs 👏', 'message', 'message', 'c2', 52),
  ('Nouvelle leçon disponible', 'Développement Web Full-Stack — « Consommer une API REST ».', 'cours', 'cours', 'c1', 180),
  ('Badge débloqué : Marathonien 🎉', '12 jours d''affilée — continu comme ça !', 'badge', 'badge', '', 420),
  ('Résultat du quiz Data Science', 'Score : 80 % — les bases sont solides.', 'quiz', 'quiz', 'c3', 1500),
  ('Téléchargement terminé', 'UI/UX Design & Material 3 disponible hors-ligne (240 Mo).', 'systeme', 'systeme', '', 1800),
  ('M. Kouassi a répondu à votre question', '« Oui, tu peux utiliser des Web Components sans framework. »', 'message', 'message', 'c1', 2600),
  ('Session live demain à 10:30', 'Hooks React avancés — salle virtuelle B.', 'cours', 'cours', 's3', 3100)
) as v(titre, texte, ico, kind, ref_id, min)
where not exists (select 1 from notifications n where n.titre = v.titre);

-- Progression de l'étudiante de démonstration
with u as (select id from users where email = 'amina@learnhub.bj')
insert into enrollments (user_id, course_id, progress, favori, statut)
select u.id, v.course_id, v.progress, v.favori, v.statut
from u, (values
  ('c1', 62, true, 'encours'),
  ('c2', 44, true, 'encours'),
  ('c3', 75, false, 'encours'),
  ('c4', 25, false, 'encours'),
  ('c5', 100, true, 'termine'),
  ('c6', 0, false, 'avenir')
) as v(course_id, progress, favori, statut)
on conflict (user_id, course_id) do update set progress = excluded.progress, favori = excluded.favori, statut = excluded.statut;

-- Leçons déjà terminées
with u as (select id from users where email = 'amina@learnhub.bj')
insert into lesson_progress (user_id, lesson_id, done)
select u.id, v.lesson_id, true from u, (values
  ('c1-m1-l1'),
  ('c1-m1-l2'),
  ('c1-m1-l3'),
  ('c1-m2-l1'),
  ('c1-m2-l2'),
  ('c2-m1-l1'),
  ('c2-m1-l2'),
  ('c2-m1-l3'),
  ('c2-m2-l1'),
  ('c3-m1-l1'),
  ('c3-m1-l2'),
  ('c3-m1-l3'),
  ('c3-m2-l1'),
  ('c3-m2-l2'),
  ('c3-m3-l1'),
  ('c4-m1-l1'),
  ('c4-m1-l3'),
  ('c5-m1-l1'),
  ('c5-m1-l2'),
  ('c5-m2-l1'),
  ('c5-m2-l2'),
  ('c5-m2-l3'),
  ('c5-m3-l1'),
  ('c5-m3-l2')
) as v(lesson_id)
on conflict (user_id, lesson_id) do update set done = true;

-- Vidéos déjà vues / favorites
with u as (select id from users where email = 'amina@learnhub.bj')
insert into video_state (user_id, video_id, progress, liked, saved)
select u.id, v.video_id, v.progress, false, false from u, (values
  ('iyoXejosxGg', 100),
  ('zZkNOdBWgFQ', 70),
  ('agj8_3xpuYI', 12),
  ('ldxt9FNUc50', 45),
  ('3WFYTiHi5TU', 30)
) as v(video_id, progress)
on conflict (user_id, video_id) do update set progress = greatest(video_state.progress, excluded.progress);

-- Réglages par défaut
with u as (select id from users where email = 'amina@learnhub.bj')
insert into settings (user_id, theme, langue) select u.id, 'sombre', 'fr' from u
on conflict (user_id) do nothing;

-- Activité des 12 derniers jours (série d'apprentissage)
with u as (select id from users where email = 'amina@learnhub.bj')
insert into activity (user_id, jour, minutes, lecons)
select u.id, current_date - g, 40 + (g * 7) % 55, 1 + g % 3
from u, generate_series(0, 11) as g
on conflict (user_id, jour) do update set minutes = excluded.minutes, lecons = excluded.lecons;

-- Badges déjà obtenus
with u as (select id from users where email = 'amina@learnhub.bj')
insert into user_badges (user_id, badge_id)
select u.id, v.badge_id from u, (values
  ('streak'),
  ('assidu'),
  ('premier'),
  ('regulier')
) as v(badge_id)
on conflict (user_id, badge_id) do nothing;

-- Téléchargements hors-ligne
with u as (select id from users where email = 'amina@learnhub.bj')
insert into downloads (user_id, course_id, titre, taille_label, etat, progres)
select u.id, v.course_id, v.titre, v.taille, v.etat, v.progres
from u, (values
  ('c2', 'UI/UX Design & Material 3', '3 leçons · 240 Mo', 'ok', 100),
  ('c1', 'Développement Web Full-Stack', 'Module 3 · 180 Mo', 'pause', 46),
  (null, 'Pandas Python — analyse du Titanic', 'Vidéo · 17 min · 42 Mo', 'ok', 100),
  (null, 'Tout savoir sur Material Design 3', 'Vidéo · 24 min · 88 Mo', 'dl', 24)
) as v(course_id, titre, taille, etat, progres)
where not exists (select 1 from downloads d where d.titre = v.titre and d.user_id = u.id);

-- Rappels de séances activés pour la première séance
with u as (select id from users where email = 'amina@learnhub.bj')
insert into session_reminders (user_id, session_id, actif)
select u.id, s.id, true from u, (select id from calendar_sessions order by jour_semaine limit 2) s
on conflict (user_id, session_id) do nothing;

