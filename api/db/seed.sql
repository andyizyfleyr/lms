-- ============================================================
-- CosmétiLab — données de démonstration (relançable sans doublon)
-- Généré depuis l'application : cours, modules, vidéos, quiz, devoirs,
-- ressources, agenda, badges, discussions, notifications, téléchargements.
-- ============================================================
create extension if not exists pgcrypto;

-- Comptes de démonstration : amina@cosmetilab.bj / demo1234 (apprenante),
--                          awa@cosmetilab.bj / prof1234 (formatrice),
--                          admin@cosmetilab.bj / admin1234 (administrateur)
insert into users (email, password_hash, nom, role, tel, ville, promo, bio, objectif_semaine_h) values
  ('amina@cosmetilab.bj', 'scrypt$16384$8$1$fFDtxPXKTi5sk4Eb6vvUPw==$kr7CY8THgh6KeRrpJ/Rk8y1ax0kf2Ypbpi6+S8enkTzigSDqebqIL6rBimrrR6iHa1EvOmfsd9hEMUsxCuZF9g==', 'Amina Dossou', 'etudiant', '+229 97 00 00 00', 'Abomey-Calavi', 'Savonnerie artisanale · promo 2026', 'J''apprends à formuler savons, gels et crèmes pour lancer ma marque.', 8),
  ('awa@cosmetilab.bj', 'scrypt$16384$8$1$syzHKkMmjsgVyrnb34YfnQ==$UscUH2g996qi1tRWUYvhfz+zWW/2z9NVGkBjuRfc+pT/5fnxYkub4udeYC6qjzYipi2uyiMxnVyTQCF1+GBECw==', 'Awa Sossou', 'enseignant', '', 'Cotonou', '', 'Formatrice savonnerie à froid — saponification et contrôle qualité.', 4),
  ('admin@cosmetilab.bj', 'scrypt$16384$8$1$yGJeaN4trKHtWTfbJD1dOQ==$J5JSaGbeMWREdufFbhRw+3BCTP/2aGZnOZJe3KI6ZqoVPYtzYyEr5A7sroXIh4v4o48FoVB7wDQHtlU+8Yl7ow==', 'Administrateur CosmétiLab', 'admin', '', 'Cotonou', '', 'Gère les cours, les comptes et les contenus.', 0)
on conflict (email) do nothing;
-- Les comptes de la version précédente sont retirés.
delete from users where email like '%@learnhub.bj';

-- Cours
insert into courses (id, titre, categorie, prof, image_key, accent, ico, statut, duree_label, total_lecons) values
  ('c1', 'Savonnerie à froid', 'Savon', 'Awa Sossou', 'savon', 'purple', 'flask', 'encours', '18 min', 10),
  ('c2', 'Gel douche & shampoings doux', 'Hygiène liquide', 'Bénédicte Ahouan', 'gel', 'blue', 'drop', 'encours', '12 min', 10),
  ('c3', 'Crème de visage : émulsions & actifs', 'Soin visage', 'Dr. Chabi', 'creme', 'pink', 'jar', 'encours', '22 min', 11),
  ('c4', 'Lait corporel, baumes & karité', 'Soin corps', 'Sylvie Dossou', 'lait', 'amber', 'leaf', 'encours', '14 min', 10),
  ('c5', 'Cosmétique africaine : karité, argile & savon noir', 'Ingrédients', 'Rachidath Adjibi', 'karite', 'teal', 'globe', 'encours', '26 min', 9),
  ('c6', 'Étiquetage, sécurité & vente', 'Réglementation', 'Josiane Kponou', 'pack', 'green', 'bullhorn', 'encours', '16 min', 9)
on conflict (id) do update set titre = excluded.titre, categorie = excluded.categorie, prof = excluded.prof, total_lecons = excluded.total_lecons;

-- Modules et leçons (59)
insert into lessons (id, course_id, module_titre, module_ordre, ordre, titre, duree_label, kind, video_id) values
  ('c1-m1-l1', 'c1', 'Chimie du savon et sécurité', 1, 1, 'Qu’est-ce que la saponification ?', '10 min', 'lecture', ''),
  ('c1-m1-l2', 'c1', 'Chimie du savon et sécurité', 1, 2, 'Soude, eau et indices SAP : les règles d’or', '12 min', 'lecture', ''),
  ('c1-m1-l3', 'c1', 'Chimie du savon et sécurité', 1, 3, 'Sécurité : soude, gants, lunettes, ventilation', '8 min', 'lecture', ''),
  ('c1-m2-l1', 'c1', 'Construire sa recette', 2, 1, 'Utiliser SoapCalc sans se tromper', '33 min', 'video', 'wLv3geJ3Rv0'),
  ('c1-m2-l2', 'c1', 'Construire sa recette', 2, 2, 'Le calculateur Mendrulandia pas à pas', '11 min', 'video', '-WB8UKJA5qU'),
  ('c1-m2-l3', 'c1', 'Construire sa recette', 2, 3, 'Exercice guidé : formule 500 g, surgraissage 8 %', '30 min', 'exercice', ''),
  ('c1-m3-l1', 'c1', 'De la trace au démoulage', 3, 1, 'Saponification à froid : le tutoriel complet', 'Vidéo', 'video', 'Ka6h2cM2Vrw'),
  ('c1-m3-l2', 'c1', 'De la trace au démoulage', 3, 2, 'Savon au karité et au miel', '10 min', 'video', '8pIZmfuzoHY'),
  ('c1-m3-l3', 'c1', 'De la trace au démoulage', 3, 3, 'Mouler, trancher et laisser curer 4 semaines', '14 min', 'lecture', ''),
  ('c1-m3-l4', 'c1', 'De la trace au démoulage', 3, 4, 'Quiz du module Savonnerie', '8 min', 'quiz', 'c1'),
  ('c2-m1-l1', 'c2', 'Anatomie d’un gel douche', 1, 1, 'Eau, tensioactifs, actifs : les trois blocs', '11 min', 'lecture', ''),
  ('c2-m1-l2', 'c2', 'Anatomie d’un gel douche', 1, 2, 'Formulation cosmétique : tensioactifs et émulsions', '5 min', 'video', 'eVtOykfMCFE'),
  ('c2-m1-l3', 'c2', 'Anatomie d’un gel douche', 1, 3, 'Choisir un tensioactif doux (sans sulfate)', 'Vidéo', 'video', 'CG2hYCv-uYs'),
  ('c2-m2-l1', 'c2', 'Formuler et épaissir', 2, 1, 'Gel douche moussant : la formule complète', 'Vidéo', 'video', 'NMvKGkwKFlE'),
  ('c2-m2-l2', 'c2', 'Formuler et épaissir', 2, 2, 'Gel douche doux sans sulfate', 'Vidéo', 'video', 'eOzN4ga3S40'),
  ('c2-m2-l3', 'c2', 'Formuler et épaissir', 2, 3, 'Épaissir, ajuster le pH et conserver', '13 min', 'lecture', ''),
  ('c2-m2-l4', 'c2', 'Formuler et épaissir', 2, 4, 'Exercice : recette de gel douche 250 ml', '25 min', 'exercice', ''),
  ('c2-m3-l1', 'c2', 'Shampoings solides et variantes', 3, 1, 'Shampoing solide hydratant et fortifiant', '6 min', 'video', 'V39AGZT2smk'),
  ('c2-m3-l2', 'c2', 'Shampoings solides et variantes', 3, 2, 'Shampoing solide : la méthode pas à pas', 'Vidéo', 'video', 't6TOv6jjafg'),
  ('c2-m3-l3', 'c2', 'Shampoings solides et variantes', 3, 3, 'Quiz du module Hygiène liquide', '8 min', 'quiz', 'c2'),
  ('c3-m1-l1', 'c3', 'La peau et ses besoins', 1, 1, 'Barrière cutanée, types de peau, hydratation', '12 min', 'lecture', ''),
  ('c3-m1-l2', 'c3', 'La peau et ses besoins', 1, 2, 'Actifs vedettes : acide hyaluronique, niacinamide, vitamine E', '14 min', 'lecture', ''),
  ('c3-m1-l3', 'c3', 'La peau et ses besoins', 1, 3, 'Sérum à l’acide hyaluronique maison', '11 min', 'video', 'NL9_Hn--Grs'),
  ('c3-m2-l1', 'c3', 'Maîtriser l’émulsion', 2, 1, 'Phase aqueuse, phase grasse, émulsifiant', '12 min', 'lecture', ''),
  ('c3-m2-l2', 'c3', 'Maîtriser l’émulsion', 2, 2, 'Formuler une émulsion : crème hydratante visage', '13 min', 'video', 'bEToJO9DpFY'),
  ('c3-m2-l3', 'c3', 'Maîtriser l’émulsion', 2, 3, 'Technique : réussir son émulsion', '4 min', 'video', 'E4PYYrwG_cY'),
  ('c3-m2-l4', 'c3', 'Maîtriser l’émulsion', 2, 4, 'Que faire quand la crème déphase ?', 'Vidéo', 'video', 'GB_2Du40hiw'),
  ('c3-m3-l1', 'c3', 'Crèmes finies et soins ciblés', 3, 1, 'Crème hydratante faite maison', '10 min', 'video', 'tqv-7SKGAOc'),
  ('c3-m3-l2', 'c3', 'Crèmes finies et soins ciblés', 3, 2, '2 crèmes hydratantes très faciles', '3 min', 'video', 'xNLTTCZmK4k'),
  ('c3-m3-l3', 'c3', 'Crèmes finies et soins ciblés', 3, 3, 'Masque purifiant à l’argile rose', '7 min', 'video', '38x4CZUy3B8'),
  ('c3-m3-l4', 'c3', 'Crèmes finies et soins ciblés', 3, 4, 'Quiz du module Soin visage', '8 min', 'quiz', 'c3'),
  ('c4-m1-l1', 'c4', 'Nourrir la peau du corps', 1, 1, 'Lait, crème, baume : choisir la texture', '11 min', 'lecture', ''),
  ('c4-m1-l2', 'c4', 'Nourrir la peau du corps', 1, 2, 'Crème corporelle au beurre de karité', '10 min', 'video', 'SpX5x5VJGEU'),
  ('c4-m1-l3', 'c4', 'Nourrir la peau du corps', 1, 3, 'Du karité brut au karité filtré', '2 min', 'video', 'sHsXzakRf9E'),
  ('c4-m2-l1', 'c4', 'Formules riches et chantilly', 2, 1, 'Formuler une lotion fluide qui ne colle pas', '13 min', 'lecture', ''),
  ('c4-m2-l2', 'c4', 'Formules riches et chantilly', 2, 2, 'Chantilly de karité maison', 'Vidéo', 'video', '_2zvQyv4bBo'),
  ('c4-m2-l3', 'c4', 'Formules riches et chantilly', 2, 3, 'Crème karité corps et cheveux', 'Vidéo', 'video', 'MXWeRqMYJVU'),
  ('c4-m2-l4', 'c4', 'Formules riches et chantilly', 2, 4, 'Exercice : lait corporel 300 ml', '30 min', 'exercice', ''),
  ('c4-m3-l1', 'c4', 'Baumes et soins ciblés', 3, 1, 'Stick à lèvres karité', 'Vidéo', 'video', 'b6mr8u3QYG4'),
  ('c4-m3-l2', 'c4', 'Baumes et soins ciblés', 3, 2, 'Baume de massage et beurre fouetté', '12 min', 'lecture', ''),
  ('c4-m3-l3', 'c4', 'Baumes et soins ciblés', 3, 3, 'Quiz du module Soin corps', '8 min', 'quiz', 'c4'),
  ('c5-m1-l1', 'c5', 'Les matières premières du terroir', 1, 1, 'Karité, baobab, moringa, coco : usages cosmétiques', '15 min', 'lecture', ''),
  ('c5-m1-l2', 'c5', 'Les matières premières du terroir', 1, 2, 'Fabrication traditionnelle du beurre de karité', 'Vidéo', 'video', 'D2HBAj4zY9E'),
  ('c5-m1-l3', 'c5', 'Les matières premières du terroir', 1, 3, 'Huiles, macérats et argiles', '12 min', 'lecture', ''),
  ('c5-m2-l1', 'c5', 'Le savon noir africain', 2, 1, 'Savon noir : cendres, huile de palmiste et eau', '13 min', 'lecture', ''),
  ('c5-m2-l2', 'c5', 'Le savon noir africain', 2, 2, 'Fabriquer le savon noir africain', '15 min', 'video', 'KijtJer0710'),
  ('c5-m2-l3', 'c5', 'Le savon noir africain', 2, 3, 'Savon noir pur : la méthode détaillée', '10 min', 'video', 'I2E1I12KeEc'),
  ('c5-m2-l4', 'c5', 'Le savon noir africain', 2, 4, 'Immersion artisanale au Bénin', '66 min', 'video', 'JSKFU2M1vJM'),
  ('c5-m3-l1', 'c5', 'Tradition et qualité', 3, 1, 'Vrai savon noir : les points de contrôle', '14 min', 'video', 'fiRiTUgB1VU'),
  ('c5-m3-l2', 'c5', 'Tradition et qualité', 3, 2, 'Quiz du module Ingrédients', '8 min', 'quiz', 'c5'),
  ('c6-m1-l1', 'c6', 'Nommer et étiqueter', 1, 1, 'Ce qu’un étiquetage cosmétique doit contenir', '12 min', 'lecture', ''),
  ('c6-m1-l2', 'c6', 'Nommer et étiqueter', 1, 2, 'Lire et rédiger une liste INCI', '9 min', 'video', 'CHUChDe_GMk'),
  ('c6-m1-l3', 'c6', 'Nommer et étiqueter', 1, 3, 'Comment lire la liste INCI', 'Vidéo', 'video', 'hIsLGB6WuhM'),
  ('c6-m1-l4', 'c6', 'Nommer et étiqueter', 1, 4, 'Nomenclature des ingrédients', 'Vidéo', 'video', 'TuJhqOzkmto'),
  ('c6-m2-l1', 'c6', 'Sécurité et allégations', 2, 1, 'Test de stabilité : le protocole en 12 semaines', '14 min', 'lecture', ''),
  ('c6-m2-l2', 'c6', 'Sécurité et allégations', 2, 2, 'Allégations interdites et mentions obligatoires', 'Vidéo', 'video', 'cZUhpblcch4'),
  ('c6-m2-l3', 'c6', 'Sécurité et allégations', 2, 3, '5 réflexes pour une étiquette conforme', '35 min', 'video', 'k-Z9RPbY7eQ'),
  ('c6-m3-l1', 'c6', 'Vendre ses produits', 3, 1, 'Prix de revient, marge et conditionnement', '13 min', 'lecture', ''),
  ('c6-m3-l2', 'c6', 'Vendre ses produits', 3, 2, 'Quiz du module Réglementation', '8 min', 'quiz', 'c6')
on conflict (id) do update set titre = excluded.titre, module_titre = excluded.module_titre, duree_label = excluded.duree_label, video_id = excluded.video_id;

-- Bibliothèque vidéo
insert into videos (id, course_id, titre, chaine, duree_s, vues, image_key) values
  ('hJwIUUQYSQg', 'c1', 'Savons doux enrichis au beurre de karité', 'savonnerie artisanale', 562, 54408, 'savon'),
  ('NT5q99x6LoA', 'c1', 'Faire du savon maison sans soude : la technique melt & pour', 'Apprendre à faire son savon', 772, 191628, 'moule'),
  ('wLv3geJ3Rv0', 'c1', 'Utiliser SoapCalc pour calculer vos recettes de savons', 'Les Recettes de Louizzet', 2002, 28654, 'labo'),
  ('-WB8UKJA5qU', 'c1', 'Le calculateur Mendrulandia pour la saponification à froid', 'savonnerie artisanale', 684, 24144, 'labo'),
  ('8pIZmfuzoHY', 'c1', 'Savon au beurre de karité et au miel (saponification à froid)', 'atelier karité', 593, 1533, 'karite'),
  ('Ka6h2cM2Vrw', 'c1', 'Saponification à froid : le tutoriel complet', 'savonnerie artisanale', 0, 0, 'process'),
  ('WUFqUncjdx0', 'c1', 'Fabriquer un savon maison en saponification à froid', 'DIY savon', 0, 0, 'process'),
  ('6fulOu4L7DA', 'c1', 'Savon maison avec la base Melt and Pour 3 beurres', 'Le Petit Grassois', 101, 4566, 'pack'),
  ('LS8QMUwW2t0', 'c2', 'Faites votre gel douche maison', 'CC de Gevrey-Chambertin', 73, 45479, 'gel'),
  ('NMvKGkwKFlE', 'c2', 'Gel douche corps moussant : texture et formule maison', 'M’hairbyGrace', 0, 0, 'gel'),
  ('CG2hYCv-uYs', 'c2', 'Bien formuler un gel douche : le choix du tensioactif', 'Celobeauty Skincare', 0, 0, 'labo'),
  ('eOzN4ga3S40', 'c2', 'Gel douche doux et sans sulfate', 'M’hairbyGrace', 0, 0, 'flacons'),
  ('V39AGZT2smk', 'c2', 'Fabrique ton shampoing solide hydratant et fortifiant', 'Cynthia Crosetti', 332, 1434, 'savon'),
  ('t6TOv6jjafg', 'c2', 'Comment faire son shampoing solide maison', 'Le Kaba', 0, 0, 'pack'),
  ('eVtOykfMCFE', 'c3', 'Formulation cosmétique : tensioactifs, émulsions, INCI', 'chimie-biologie', 329, 1291, 'labo'),
  ('bEToJO9DpFY', 'c3', 'Formuler une émulsion : crème hydratante visage', 'Cosmeto Labo', 786, 35964, 'creme'),
  ('tqv-7SKGAOc', 'c3', 'Crème hydratante faite maison (Julien Kaibeck)', 'Beauté au Naturel', 604, 216397, 'creme'),
  ('xNLTTCZmK4k', 'c3', '2 crèmes hydratantes très faciles à faire', 'La cuisine de Violaine', 187, 190714, 'atelier'),
  ('E4PYYrwG_cY', 'c3', 'Technique : réaliser une émulsion pour la peau', 'Ô Zuyl L’essentiel', 237, 65264, 'process'),
  ('GB_2Du40hiw', 'c3', 'Éviter et corriger le déphasage d’une formule cosmétique', 'La Cité Des Crépus TV', 484, 1616, 'ph'),
  ('NL9_Hn--Grs', 'c3', 'Recette de sérum à l’acide hyaluronique fait maison', 'Beauté bio', 677, 11819, 'huiles'),
  ('38x4CZUy3B8', 'c3', 'Recette beauté : argile rose et peau sensible', 'Anaïs', 399, 6820, 'karite'),
  ('SpX5x5VJGEU', 'c4', 'Crème corporelle à base de beurre de karité', 'Cosmétique et Business', 626, 79144, 'lait'),
  ('_2zvQyv4bBo', 'c4', 'Faire une chantilly de karité maison', 'Belle en bio beauty', 0, 0, 'atelier'),
  ('MXWeRqMYJVU', 'c4', 'Crème hydratante au beurre de karité (corps et cheveux)', 'Sissy La Généreuse', 0, 0, 'karite'),
  ('b6mr8u3QYG4', 'c4', 'Stick à lèvres au beurre de karité et huile essentielle', 'wikitube', 0, 0, 'flacons'),
  ('sHsXzakRf9E', 'c4', 'Fabrication du beurre de karité brut non raffiné', 'Soebio', 125, 2798, 'huiles'),
  ('KijtJer0710', 'c5', 'Comment fabriquer le savon noir africain', 'savon noir africain', 895, 31058, 'karite'),
  ('JSKFU2M1vJM', 'c5', 'Immersion artisanale au Bénin : le savon noir ancestral', 'By Shaely', 3969, 18341, 'atelier'),
  ('I2E1I12KeEc', 'c5', 'Fabriquer son savon noir africain pur', 'Africa Cosmetic’s', 608, 11948, 'process'),
  ('fiRiTUgB1VU', 'c5', 'Fabriquer facilement le vrai savon noir africain', 'Coach Rasmane Yameogo', 861, 6356, 'savon'),
  ('D2HBAj4zY9E', 'c5', 'Fabrication traditionnelle du beurre de karité', 'Unezahra', 0, 0, 'huiles'),
  ('hIsLGB6WuhM', 'c6', 'Comment lire la liste INCI d’un cosmétique', 'Les Maronneuses', 0, 0, 'pack'),
  ('k-Z9RPbY7eQ', 'c6', 'Liste INCI : 5 choses à savoir', 'Manue de Menaka', 2124, 1119, 'pack'),
  ('cZUhpblcch4', 'c6', 'Les allégations cosmétiques interdites en Europe', 'INCI Beauty', 0, 0, 'flacons'),
  ('CHUChDe_GMk', 'c6', 'Comment rédiger une liste INCI', 'Josiane', 564, 841, 'labo'),
  ('TuJhqOzkmto', 'c6', 'Déchiffrer la liste INCI et la nomenclature des ingrédients', 'Ready Skin Naturals', 0, 0, 'pack')
on conflict (id) do update set titre = excluded.titre, chaine = excluded.chaine, duree_s = excluded.duree_s, vues = excluded.vues;

-- Ressources (18)
insert into resources (id, course_id, ordre, titre, type_label, ico, accent) values
  ('c1-r1', 'c1', 1, 'Fiche de sécurité — soude caustique', 'PDF · 320 Ko', 'shield', 'purple'),
  ('c1-r2', 'c1', 2, 'Tableau des indices SAP', 'PDF · 180 Ko', 'chart', 'blue'),
  ('c1-r3', 'c1', 3, 'Journal de fabrication vierge', 'XLSX · 90 Ko', 'grid', 'green'),
  ('c2-r1', 'c2', 1, 'Guide des tensioactifs doux', 'PDF · 420 Ko', 'info', 'blue'),
  ('c2-r2', 'c2', 2, 'Fiche formule — gel douche 250 ml', 'PDF · 260 Ko', 'task', 'purple'),
  ('c2-r3', 'c2', 3, 'Tableau pH et conservateurs', 'PDF · 300 Ko', 'sliders', 'amber'),
  ('c3-r1', 'c3', 1, 'Fiche formule — crème H/E 100 ml', 'PDF · 340 Ko', 'task', 'pink'),
  ('c3-r2', 'c3', 2, 'Guide des actifs et dosages', 'PDF · 620 Ko', 'layers', 'purple'),
  ('c3-r3', 'c3', 3, 'Protocole de test de stabilité', 'PDF · 280 Ko', 'clock', 'green'),
  ('c4-r1', 'c4', 1, 'Fiche formule — lait corporel 300 ml', 'PDF · 300 Ko', 'task', 'amber'),
  ('c4-r2', 'c4', 2, 'Dosages huiles essentielles', 'PDF · 210 Ko', 'shield', 'teal'),
  ('c4-r3', 'c4', 3, 'Recettes de baumes et beurres fouettés', 'PDF · 480 Ko', 'leaf', 'green'),
  ('c5-r1', 'c5', 1, 'Fiche matières premières locales', 'PDF · 540 Ko', 'globe', 'teal'),
  ('c5-r2', 'c5', 2, 'Protocole savon noir traditionnel', 'PDF · 380 Ko', 'fire', 'amber'),
  ('c5-r3', 'c5', 3, 'Contrôle qualité du karité', 'PDF · 240 Ko', 'check-circle', 'green'),
  ('c6-r1', 'c6', 1, 'Modèle d’étiquette conforme', 'PDF · 400 Ko', 'task', 'green'),
  ('c6-r2', 'c6', 2, 'Grille de vérification INCI', 'PDF · 190 Ko', 'check-circle', 'blue'),
  ('c6-r3', 'c6', 3, 'Feuille de calcul du prix de revient', 'XLSX · 120 Ko', 'grid', 'amber')
on conflict (id) do update set titre = excluded.titre, type_label = excluded.type_label;

-- Quiz (6) — questions (36) — réponses (144)
insert into quizzes (id, course_id, titre, duree_s) values
  ('c1', 'c1', 'Savonnerie à froid', 600),
  ('c2', 'c2', 'Hygiène liquide : gels et shampoings', 600),
  ('c3', 'c3', 'Émulsions et soin du visage', 600),
  ('c4', 'c4', 'Laits corporels et karité', 600),
  ('c5', 'c5', 'Ingrédients africains', 600),
  ('c6', 'c6', 'Étiquetage, sécurité et vente', 600)
on conflict (id) do update set titre = excluded.titre, duree_s = excluded.duree_s;
insert into quiz_questions (id, quiz_id, ordre, enonce, explication) values
  ('c1-q1', 'c1', 1, 'Que fabrique la réaction de saponification ?', 'Sous l’effet de la soude, les triglycérides se transforment en savon et en glycérine.'),
  ('c1-q2', 'c1', 2, 'Que signifie « surgraissage » dans une recette de savon ?', 'On diminue la soude de 5 à 8 % : l’huile non saponifiée rend le savon plus doux.'),
  ('c1-q3', 'c1', 3, 'À quelle température travaille-t-on généralement en saponification à froid ?', 'Huiles et lessive de soude sont ramenées autour de 40 °C avant mélange.'),
  ('c1-q4', 'c1', 4, 'Qu’appelle-t-on « la trace » ?', 'À la trace, la pâte épaissit : on ajoute alors les additifs et on coule.'),
  ('c1-q5', 'c1', 5, 'Combien de temps faut-il laisser curer un savon à froid ?', 'La cure de 4 semaines laisse l’eau s’évaporer et le pH baisser.'),
  ('c1-q6', 'c1', 6, 'Quel équipement est indispensable pour manipuler la soude ?', 'La soude est corrosive : gants en nitrile, lunettes, local ventilé.'),
  ('c2-q1', 'c2', 1, 'Quel est le rôle principal d’un tensioactif ?', 'Sa molécule a une tête hydrophile et une queue lipophile : elle capture les salissures.'),
  ('c2-q2', 'c2', 2, 'Un « tensioactif doux » se reconnaît à…', 'Les glucosides (coco glucoside, lauryl glucoside) sont réputés doux pour la peau.'),
  ('c2-q3', 'c2', 3, 'Quel pH viser pour un gel douche respectueux de la peau ?', 'Le film hydrolipidique est légèrement acide : on ajuste vers pH 5,5.'),
  ('c2-q4', 'c2', 4, 'Pourquoi un gel douche aqueux a-t-il besoin d’un conservateur ?', 'Toute formule contenant de l’eau doit être protégée des contaminations.'),
  ('c2-q5', 'c2', 5, 'Comment épaissit-on naturellement un gel douche ?', 'Le chlorure de sodium ou une gomme (xanthane) augmentent la viscosité.'),
  ('c2-q6', 'c2', 6, 'Quel test valide la douceur d’un shampoing solide ?', 'On mesure le pH en solution diluée et on fait un test d’usage.'),
  ('c3-q1', 'c3', 1, 'Une émulsion, c’est…', 'L’émulsifiant abaisse la tension entre les deux phases et stabilise le mélange.'),
  ('c3-q2', 'c3', 2, 'Une crème « H/E » désigne…', 'H/E = huile dispersée dans l’eau ; E/H donne au contraire une crème plus riche.'),
  ('c3-q3', 'c3', 3, 'Quel ingrédient sert d’actif hydratant capteur d’eau ?', 'L’acide hyaluronique retient plusieurs centaines de fois son poids en eau.'),
  ('c3-q4', 'c3', 4, 'À quelle température ajoute-t-on le conservateur ?', 'Au-delà de 40 °C beaucoup de conservateurs et d’actifs sont dégradés.'),
  ('c3-q5', 'c3', 5, 'Que signifie « déphasage » ?', 'L’émulsion casse : trop peu d’émulsifiant, mauvais brassage ou choc de température.'),
  ('c3-q6', 'c3', 6, 'Quel test est obligatoire avant de commercialiser une crème ?', 'Chaleur, froid et vieillissement accéléré vérifient la tenue de la formule.'),
  ('c4-q1', 'c4', 1, 'Quelle est la différence entre un lait et un baume ?', 'Le lait corporel est une émulsion fluide ; le baume est un mélange de beurres et d’huiles.'),
  ('c4-q2', 'c4', 2, 'Le beurre de karité est surtout…', 'Riche en acides gras et insaponifiables, il nourrit et protège la barrière cutanée.'),
  ('c4-q3', 'c4', 3, 'Comment éviter un lait corporel « collant » ?', 'Jojoba, amande douce ou coco fractionnée pénètrent vite ; on dose le karité.'),
  ('c4-q4', 'c4', 4, 'À quoi sert la vitamine E dans une formule ?', 'Antioxydant : elle protège les huiles du rancissement.'),
  ('c4-q5', 'c4', 5, 'Quelle précaution avec les huiles essentielles ?', 'Généralement 0,5 à 1 % maximum, avec contre-indications à connaître.'),
  ('c4-q6', 'c4', 6, 'Que doit contenir une fiche de fabrication ?', 'La traçabilité du lot est indispensable pour la qualité et la vente.'),
  ('c5-q1', 'c5', 1, 'Le savon noir africain traditionnel est fabriqué à partir de…', 'La potasse issue des cendres saponifie l’huile de palmiste : c’est un savon à chaud.'),
  ('c5-q2', 'c5', 2, 'Quelle argile est la plus adaptée à une peau sensible ?', 'Rose et blanche sont les plus douces ; la verte est plus absorbante.'),
  ('c5-q3', 'c5', 3, 'Un macérat, c’est…', 'On laisse infuser une plante séchée dans une huile végétale à l’abri de la lumière.'),
  ('c5-q4', 'c5', 4, 'Quel ingrédient du terroir est riche en vitamine E et en acides gras essentiels ?', 'L’huile de baobab est réputée nourrissante et antioxydante.'),
  ('c5-q5', 'c5', 5, 'Pourquoi contrôler le pH d’un savon traditionnel ?', 'Un pH élevé irrite : on vérifie et on laisse reposer le savon.'),
  ('c5-q6', 'c5', 6, 'Comment garantir la qualité d’un beurre de karité artisanal ?', 'Filtration et contrôle sensoriel font la différence pour l’export.'),
  ('c6-q1', 'c6', 1, 'Que signifie INCI ?', 'C’est la nomenclature internationale des ingrédients cosmétiques.'),
  ('c6-q2', 'c6', 2, 'Dans quel ordre apparaissent les ingrédients d’une liste INCI ?', 'Du plus concentré au moins concentré ; sous 1 % l’ordre est libre.'),
  ('c6-q3', 'c6', 3, 'Quelle mention est obligatoire sur un cosmétique ?', 'DLUO ou PAO (pot ouvert avec un mois), plus le lot et le responsable de mise sur le marché.'),
  ('c6-q4', 'c6', 4, 'Une allégation interdite serait…', 'Un cosmétique ne peut revendiquer un effet thérapeutique : c’est un médicament.'),
  ('c6-q5', 'c6', 5, 'À quoi sert un test de stabilité ?', 'Cycles chaud/froid et vieillissement accéléré révèlent séparations et contaminations.'),
  ('c6-q6', 'c6', 6, 'Comment fixer un prix de vente cohérent ?', 'On part du prix de revient complet : matières, emballage, énergie, temps de travail.')
on conflict (id) do update set enonce = excluded.enonce, explication = excluded.explication;
insert into quiz_options (id, question_id, ordre, texte, correct) values
  ('c1-q1-o1', 'c1-q1', 1, 'Du savon et de la glycérine', true),
  ('c1-q1-o2', 'c1-q1', 2, 'Une cire émulsifiante', false),
  ('c1-q1-o3', 'c1-q1', 3, 'Un gel douche', false),
  ('c1-q1-o4', 'c1-q1', 4, 'Un conservateur', false),
  ('c1-q2-o1', 'c1-q2', 1, 'Ajouter une huile parfumée', false),
  ('c1-q2-o2', 'c1-q2', 2, 'Réduire volontairement la soude pour garder une part d’huile libre', true),
  ('c1-q2-o3', 'c1-q2', 3, 'Chauffer la pâte plus longtemps', false),
  ('c1-q2-o4', 'c1-q2', 4, 'Ajouter de l’eau après la trace', false),
  ('c1-q3-o1', 'c1-q3', 1, '0 °C', false),
  ('c1-q3-o2', 'c1-q3', 2, 'Entre 35 et 45 °C', true),
  ('c1-q3-o3', 'c1-q3', 3, '100 °C', false),
  ('c1-q3-o4', 'c1-q3', 4, 'Peu importe', false),
  ('c1-q4-o1', 'c1-q4', 1, 'Le test du pH', false),
  ('c1-q4-o2', 'c1-q4', 2, 'Le moment où la pâte épaissit et laisse une marque', true),
  ('c1-q4-o3', 'c1-q4', 3, 'La coloration du savon', false),
  ('c1-q4-o4', 'c1-q4', 4, 'Le démoulage', false),
  ('c1-q5-o1', 'c1-q5', 1, '24 heures', false),
  ('c1-q5-o2', 'c1-q5', 2, '3 jours', false),
  ('c1-q5-o3', 'c1-q5', 3, 'Environ 4 semaines', true),
  ('c1-q5-o4', 'c1-q5', 4, '6 mois', false),
  ('c1-q6-o1', 'c1-q6', 1, 'Un mixeur plongeant', false),
  ('c1-q6-o2', 'c1-q6', 2, 'Gants, lunettes et ventilation', true),
  ('c1-q6-o3', 'c1-q6', 3, 'Un thermomètre infrarouge', false),
  ('c1-q6-o4', 'c1-q6', 4, 'Une centrifugeuse', false),
  ('c2-q1-o1', 'c2-q1', 1, 'Conserver le produit', false),
  ('c2-q1-o2', 'c2-q1', 2, 'Détacher et faire mousser en liant l’eau et les graisses', true),
  ('c2-q1-o3', 'c2-q1', 3, 'Épaissir la formule', false),
  ('c2-q1-o4', 'c2-q1', 4, 'Parfumer', false),
  ('c2-q2-o1', 'c2-q2', 1, 'Sa mousse abondante', false),
  ('c2-q2-o2', 'c2-q2', 2, 'Sa chaîne courte et son origine végétale', true),
  ('c2-q2-o3', 'c2-q2', 3, 'Son parfum', false),
  ('c2-q2-o4', 'c2-q2', 4, 'Sa couleur', false),
  ('c2-q3-o1', 'c2-q3', 1, 'pH 2', false),
  ('c2-q3-o2', 'c2-q3', 2, 'Autour de 5,5 (pH physiologique)', true),
  ('c2-q3-o3', 'c2-q3', 3, 'pH 9', false),
  ('c2-q3-o4', 'c2-q3', 4, 'pH 12', false),
  ('c2-q4-o1', 'c2-q4', 1, 'Pour mousser', false),
  ('c2-q4-o2', 'c2-q4', 2, 'Parce que l’eau favorise bactéries et moisissures', true),
  ('c2-q4-o3', 'c2-q4', 3, 'Pour épaissir', false),
  ('c2-q4-o4', 'c2-q4', 4, 'Pour colorer', false),
  ('c2-q5-o1', 'c2-q5', 1, 'En ajoutant du sel ou un épaississant végétal', true),
  ('c2-q5-o2', 'c2-q5', 2, 'En le chauffant', false),
  ('c2-q5-o3', 'c2-q5', 3, 'En ajoutant de l’huile', false),
  ('c2-q5-o4', 'c2-q5', 4, 'En le congelant', false),
  ('c2-q6-o1', 'c2-q6', 1, 'La couleur', false),
  ('c2-q6-o2', 'c2-q6', 2, 'Le pH une fois dissous et la tolérance cutanée', true),
  ('c2-q6-o3', 'c2-q6', 3, 'Le poids', false),
  ('c2-q6-o4', 'c2-q6', 4, 'L’odeur', false),
  ('c3-q1-o1', 'c3-q1', 1, 'Un mélange d’eau et d’huile stabilisé par un émulsifiant', true),
  ('c3-q1-o2', 'c3-q1', 2, 'Une huile pure', false),
  ('c3-q1-o3', 'c3-q1', 3, 'Un gel d’eau', false),
  ('c3-q1-o4', 'c3-q1', 4, 'Une poudre', false),
  ('c3-q2-o1', 'c3-q2', 1, 'Huile dans eau : phase externe aqueuse, toucher frais', true),
  ('c3-q2-o2', 'c3-q2', 2, 'Eau dans huile : toucher riche', false),
  ('c3-q2-o3', 'c3-q2', 3, 'Un mélange à parts égales', false),
  ('c3-q2-o4', 'c3-q2', 4, 'Une crème sans émulsifiant', false),
  ('c3-q3-o1', 'c3-q3', 1, 'L’acide hyaluronique', true),
  ('c3-q3-o2', 'c3-q3', 2, 'La cire d’abeille', false),
  ('c3-q3-o3', 'c3-q3', 3, 'L’huile de coco', false),
  ('c3-q3-o4', 'c3-q3', 4, 'Le talc', false),
  ('c3-q4-o1', 'c3-q4', 1, 'À chaud, 70 °C', false),
  ('c3-q4-o2', 'c3-q4', 2, 'Sous 40 °C', true),
  ('c3-q4-o3', 'c3-q4', 3, 'À 100 °C', false),
  ('c3-q4-o4', 'c3-q4', 4, 'Peu importe', false),
  ('c3-q5-o1', 'c3-q5', 1, 'La crème mousse', false),
  ('c3-q5-o2', 'c3-q5', 2, 'L’eau et l’huile se séparent', true),
  ('c3-q5-o3', 'c3-q5', 3, 'La crème durcit', false),
  ('c3-q5-o4', 'c3-q5', 4, 'Le parfum s’évapore', false),
  ('c3-q6-o1', 'c3-q6', 1, 'Le test de stabilité (chaleur, froid, vieillissement)', true),
  ('c3-q6-o2', 'c3-q6', 2, 'Le test de mousse', false),
  ('c3-q6-o3', 'c3-q6', 3, 'Le test de couleur', false),
  ('c3-q6-o4', 'c3-q6', 4, 'Aucun', false),
  ('c4-q1-o1', 'c4-q1', 1, 'La couleur', false),
  ('c4-q1-o2', 'c4-q1', 2, 'Le lait est fluide (beaucoup d’eau), le baume est anhydre et riche', true),
  ('c4-q1-o3', 'c4-q1', 3, 'Le baume contient plus d’eau', false),
  ('c4-q1-o4', 'c4-q1', 4, 'Aucune', false),
  ('c4-q2-o1', 'c4-q2', 1, 'Filmogène et nourrissant', true),
  ('c4-q2-o2', 'c4-q2', 2, 'Détachant', false),
  ('c4-q2-o3', 'c4-q2', 3, 'Exfoliant', false),
  ('c4-q2-o4', 'c4-q2', 4, 'Astringent', false),
  ('c4-q3-o1', 'c4-q3', 1, 'Augmenter l’huile', false),
  ('c4-q3-o2', 'c4-q3', 2, 'Réduire la phase grasse et choisir des huiles pénétrantes', true),
  ('c4-q3-o3', 'c4-q3', 3, 'Ajouter du sucre', false),
  ('c4-q3-o4', 'c4-q3', 4, 'Chauffer plus fort', false),
  ('c4-q4-o1', 'c4-q4', 1, 'À parfumer', false),
  ('c4-q4-o2', 'c4-q4', 2, 'À limiter l’oxydation des huiles (antioxydant)', true),
  ('c4-q4-o3', 'c4-q4', 3, 'À épaissir', false),
  ('c4-q4-o4', 'c4-q4', 4, 'À conserver', false),
  ('c4-q5-o1', 'c4-q5', 1, 'Doser à 15 %', false),
  ('c4-q5-o2', 'c4-q5', 2, 'Respecter un dosage faible et éviter chez la femme enceinte', true),
  ('c4-q5-o3', 'c4-q5', 3, 'Les chauffer à 80 °C', false),
  ('c4-q5-o4', 'c4-q5', 4, 'Les mélanger à l’eau', false),
  ('c4-q6-o1', 'c4-q6', 1, 'Uniquement le prix', false),
  ('c4-q6-o2', 'c4-q6', 2, 'Numéro de lot, date, ingrédients et quantités', true),
  ('c4-q6-o3', 'c4-q6', 3, 'Le nom du client', false),
  ('c4-q6-o4', 'c4-q6', 4, 'Rien', false),
  ('c5-q1-o1', 'c5-q1', 1, 'Cendres de cabosses ou de plantes et huile de palmiste', true),
  ('c5-q1-o2', 'c5-q1', 2, 'Savon de Marseille et argile', false),
  ('c5-q1-o3', 'c5-q1', 3, 'Beurre de cacao uniquement', false),
  ('c5-q1-o4', 'c5-q1', 4, 'Soude pure', false),
  ('c5-q2-o1', 'c5-q2', 1, 'L’argile rose ou blanche', true),
  ('c5-q2-o2', 'c5-q2', 2, 'L’argile verte', false),
  ('c5-q2-o3', 'c5-q2', 3, 'Le sable', false),
  ('c5-q2-o4', 'c5-q2', 4, 'Le talc', false),
  ('c5-q3-o1', 'c5-q3', 1, 'Une plante infusée dans une huile', true),
  ('c5-q3-o2', 'c5-q3', 2, 'Une huile essentielle', false),
  ('c5-q3-o3', 'c5-q3', 3, 'Un conservateur', false),
  ('c5-q3-o4', 'c5-q3', 4, 'Un émulsifiant', false),
  ('c5-q4-o1', 'c5-q4', 1, 'L’huile de baobab', true),
  ('c5-q4-o2', 'c5-q4', 2, 'Le sable', false),
  ('c5-q4-o3', 'c5-q4', 3, 'Le sel', false),
  ('c5-q4-o4', 'c5-q4', 4, 'Le talc', false),
  ('c5-q5-o1', 'c5-q5', 1, 'Pour la couleur', false),
  ('c5-q5-o2', 'c5-q5', 2, 'Parce qu’un savon trop alcalin agresse la peau', true),
  ('c5-q5-o3', 'c5-q5', 3, 'Pour le poids', false),
  ('c5-q5-o4', 'c5-q5', 4, 'Pour l’odeur', false),
  ('c5-q6-o1', 'c5-q6', 1, 'Filtrer, contrôler l’odeur et l’absence d’impuretés', true),
  ('c5-q6-o2', 'c5-q6', 2, 'Le colorer', false),
  ('c5-q6-o3', 'c5-q6', 3, 'Le chauffer fort', false),
  ('c5-q6-o4', 'c5-q6', 4, 'Le diluer à l’eau', false),
  ('c6-q1-o1', 'c6-q1', 1, 'International Nomenclature of Cosmetic Ingredients', true),
  ('c6-q1-o2', 'c6-q1', 2, 'Indice National Cosmétique', false),
  ('c6-q1-o3', 'c6-q1', 3, 'Inventaire des Colorants', false),
  ('c6-q1-o4', 'c6-q1', 4, 'Norme Internationale de Conditionnement', false),
  ('c6-q2-o1', 'c6-q2', 1, 'Par ordre alphabétique', false),
  ('c6-q2-o2', 'c6-q2', 2, 'Par ordre décroissant de quantité', true),
  ('c6-q2-o3', 'c6-q2', 3, 'Par couleur', false),
  ('c6-q2-o4', 'c6-q2', 4, 'Au hasard', false),
  ('c6-q3-o1', 'c6-q3', 1, 'La date limite d’utilisation ou la période après ouverture (PAO)', true),
  ('c6-q3-o2', 'c6-q3', 2, 'Le numéro de téléphone du client', false),
  ('c6-q3-o3', 'c6-q3', 3, 'Le prix d’achat', false),
  ('c6-q3-o4', 'c6-q3', 4, 'Le nom du fournisseur', false),
  ('c6-q4-o1', 'c6-q4', 1, '« Hydrate la peau »', false),
  ('c6-q4-o2', 'c6-q4', 2, '« Guérit l’eczéma »', true),
  ('c6-q4-o3', 'c6-q4', 3, '« Texture légère »', false),
  ('c6-q4-o4', 'c6-q4', 4, '« Parfum de rose »', false),
  ('c6-q5-o1', 'c6-q5', 1, 'À vérifier que la formule tient dans le temps', true),
  ('c6-q5-o2', 'c6-q5', 2, 'À mesurer la mousse', false),
  ('c6-q5-o3', 'c6-q5', 3, 'À calculer la marge', false),
  ('c6-q5-o4', 'c6-q5', 4, 'À choisir la couleur', false),
  ('c6-q6-o1', 'c6-q6', 1, 'Au hasard', false),
  ('c6-q6-o2', 'c6-q6', 2, 'Coût des matières + contenant + temps + marge', true),
  ('c6-q6-o3', 'c6-q6', 3, 'En copiant le voisin', false),
  ('c6-q6-o4', 'c6-q6', 4, 'Au poids du produit', false)
on conflict (id) do update set texte = excluded.texte, correct = excluded.correct;

-- Devoirs
insert into assignments (id, course_id, titre, type, points, echeance_label, niveau, consignes, quiz_id) values
  ('d1', 'c1', 'Formule de savon — 500 g à 8 % de surgraissage', 'Exercice noté', 20, 'j+0 18:00', 'urgent', '["Calculez la soude nécessaire avec un calculateur (SoapCalc ou Mendrulandia).","Justifiez le choix des huiles et le surgraissage retenu.","Déposez une fiche de formule PDF ou une photo de votre feuille de calcul.","Indiquez le temps de cure prévu et la date de disponibilité."]'::jsonb, null),
  ('d2', 'c2', 'Recette de gel douche doux — 250 ml', 'Devoir noté', 30, 'j+2 12:00', 'soon', '["Choisissez un tensioactif doux et justifiez-le.","Indiquez les pourcentages de chaque phase et le pH visé.","Précisez le système conservateur utilisé.","Rendez une fiche technique d’une page (PDF)."]'::jsonb, null),
  ('d3', 'c3', 'Crème de visage 100 ml — émulsion H/E', 'Projet', 40, 'j+5 23:59', 'normal', '["Formulez une crème H/E adaptée à un type de peau précis.","Détaillez phases aqueuse et grasse, émulsifiant et actifs.","Ajoutez le protocole de fabrication et le pH cible.","Bonus : joignez une photo de la crème réalisée."]'::jsonb, null),
  ('d4', 'c4', 'Lait corporel au karité — 300 ml', 'Exercice noté', 25, 'j+3 19:00', 'normal', '["Construisez une formule fluide non collante.","Respectez un dosage raisonnable en karité et justifiez-le.","Précisez les précautions liées aux huiles essentielles si vous en utilisez."]'::jsonb, null),
  ('d5', 'c5', 'Dossier matières premières du terroir', 'Étude de cas', 30, 'j+-2 23:59', 'past', '["Choisissez trois matières premières locales.","Documentez leur origine, leurs propriétés et leurs usages cosmétiques.","Comparez deux méthodes de fabrication du savon noir."]'::jsonb, null),
  ('d6', 'c6', 'Fiche produit, étiquette et liste INCI', 'Devoir noté', 35, 'j+6 23:59', 'normal', '["Rédigez la liste INCI complète de votre produit.","Ajoutez les mentions obligatoires (lot, PAO ou DLUO, responsable de mise sur le marché).","Vérifiez qu’aucune allégation interdite n’est présente.","Joignez la maquette d’étiquette."]'::jsonb, null),
  ('d7', 'c6', 'Prix de revient et tarif de vente', 'Exercice', 20, 'j+-1 20:00', 'past', '["Calculez le prix de revient d’un lot de 20 savons.","Intégrez matières, emballage, énergie et temps de travail.","Proposez un prix de vente et une marge argumentée."]'::jsonb, null),
  ('d8', 'c1', 'Sécurité à l’atelier — protocole', 'Exercice', 15, 'j+8 18:00', 'calme', '["Listez les risques liés à la soude et les équipements de protection.","Rédigez la procédure d’urgence en cas de projection.","Proposez un rangement type de l’atelier."]'::jsonb, null)
on conflict (id) do update set titre = excluded.titre, points = excluded.points, consignes = excluded.consignes;

-- Séances de l'agenda
insert into calendar_sessions (id, jour_semaine, heure, titre, type, duree_label, salle, course_id, prof, tags, accent, ico, description) values
  ('s1', 0, '09:00', 'Live — Calcul de soude en direct', 'Visioconférence', '1 h 30', 'Salle virtuelle A', 'c1', 'Awa Sossou', '["Live","Savon"]'::jsonb, 'purple', 'flask', 'On calcule ensemble une formule complète : indice SAP, surgraissage et quantité d’eau. Apportez votre calculateur ouvert.'),
  ('s2', 0, '16:00', 'Atelier — Pesée et sécurité à l’atelier', 'Présentiel', '2 h', 'Atelier · Calavi', 'c1', 'Awa Sossou', '["Atelier"]'::jsonb, 'blue', 'shield', 'Pesée précise, équipements de protection, gestion des projections : les bons réflexes avant de produire.'),
  ('s3', 1, '10:30', 'Cours — Émulsions et actifs', 'Live', '1 h', 'Salle virtuelle B', 'c3', 'Dr. Chabi', '["Visage"]'::jsonb, 'pink', 'jar', 'Phase aqueuse, phase grasse, émulsifiant et actifs : construire une crème stable et agréable.'),
  ('s4', 2, '16:00', 'Tutorat — Votre formule de gel douche', 'Tutorat', '45 min', 'Visio individuelle', 'c2', 'Bénédicte Ahouan', '["Tutorat"]'::jsonb, 'amber', 'drop', 'Revue individuelle de votre recette : choix du tensioactif, pH, viscosité et conservation.'),
  ('s5', 4, '11:00', 'Atelier — Savon noir et karité', 'Présentiel', '3 h', 'Atelier · Cotonou', 'c5', 'Rachidath Adjibi', '["Terroir"]'::jsonb, 'teal', 'leaf', 'Fabrication traditionnelle du savon noir, filtration du karité et contrôle de qualité du lot.'),
  ('s6', 6, '18:30', 'Q&A communauté CosmétiLab', 'Discussion', '1 h', 'Salon communauté', null, 'Équipe CosmétiLab', '["Communauté"]'::jsonb, 'green', 'chat', 'Questions libres, retours d’expérience et entraide entre apprenants et formatrices.')
on conflict (id) do update set titre = excluded.titre, heure = excluded.heure, description = excluded.description;

-- Badges
insert into badges (id, nom, ico, accent, description, cible) values
  ('premier', 'Premier savon', 'flask', 'purple', 'Terminer sa première leçon', 1),
  ('assidu', 'Assidu·e', 'school', 'green', 'Terminer 20 leçons', 20),
  ('regulier', 'Régulier·ère', 'clock', 'blue', 'Terminer 10 leçons', 10),
  ('streak', 'Marathonien·ne', 'fire', 'amber', 'Apprendre 7 jours d’affilée', 7),
  ('explor', 'Explorateur·rice', 'globe', 'teal', 'Suivre les 6 cours du catalogue', 6),
  ('perf', 'Perfectionniste', 'star', 'amber', 'Obtenir 5 quiz parfaits (100 %)', 5),
  ('mentor', 'Mentor·e', 'chat', 'purple', 'Publier 10 messages dans les discussions', 10),
  ('data', 'Maître des émulsions', 'jar', 'pink', 'Terminer « Crème de visage : émulsions & actifs »', 100),
  ('cyber', 'Étiquette conforme', 'check-circle', 'green', 'Terminer « Étiquetage, sécurité & vente »', 100)
on conflict (id) do update set nom = excluded.nom, description = excluded.description;

-- Messages de discussion (12)
insert into messages (course_id, auteur, role, contenu, created_at)
select v.course_id, v.auteur, v.role, v.contenu, now() - coalesce(v.min, 0) * interval '1 minute'
from (values
  ('c1', 'Awa Sossou', 'etudiant', 'Bienvenue dans l’atelier 🧼 Commencez par le module 1 : on ne touche à la soude qu’après avoir lu la fiche sécurité.', 180),
  ('c1', 'Ibrahim S.', 'etudiant', 'J’ai calculé un surgraissage de 5 % avec 60 % d’huile d’olive : est-ce assez doux pour une peau sensible ?', 120),
  ('c1', 'Awa Sossou', 'etudiant', 'Oui, 5 % convient. Passez à 8 % si vous ajoutez du karité : le savon restera plus crémeux.', 95),
  ('c2', 'Bénédicte Ahouan', 'etudiant', 'Pour un gel douche doux, visez pH 5,5 et moins de 10 % de tensioactif moussant. Le reste : eau, actifs et conservateur.', 150),
  ('c2', 'Amina D.', 'etudiant', 'J’ai testé le coco glucoside : mousse plus fine mais beaucoup plus douce sur ma peau. Merci pour le conseil !', 70),
  ('c2', 'Bénédicte Ahouan', 'etudiant', 'Parfait 👏 Notez bien le pH dans votre fiche de fabrication, c’est ce qui garantit la stabilité du lot.', 40),
  ('c3', 'Dr. Chabi', 'etudiant', 'Rappel : les phases se chauffent séparément à 70 °C, puis on verse l’eau dans l’huile hors du feu en fouettant.', 210),
  ('c3', 'Sylvie D.', 'etudiant', 'Ma crème a déphasé au bout de trois jours. J’ai utilisé 4 % d’émulsifiant seulement — c’est la cause ?', 60),
  ('c3', 'Dr. Chabi', 'etudiant', 'Très probablement : passez à 6 % et allongez le refroidissement sous agitation. Regardez la leçon « déphasage ».', 35),
  ('c4', 'Sylvie Dossou', 'etudiant', 'Astuce : fouettez le karité avec un peu de coco fractionnée pour obtenir une chantilly légère qui pénètre vite.', 300),
  ('c5', 'Rachidath Adjibi', 'etudiant', 'Le savon noir traditionnel se cuit plusieurs heures : patience et remuer sans arrêt 💪 la vidéo d’immersion au Bénin montre tout le procédé.', 420),
  ('c6', 'Josiane Kponou', 'etudiant', 'Avant de vendre, vérifiez trois choses : liste INCI complète, numéro de lot et responsable de mise sur le marché sur l’étiquette.', 520)
) as v(course_id, auteur, role, contenu, min)
where not exists (select 1 from messages m where m.course_id = v.course_id and m.contenu = v.contenu);

-- Notifications générales
insert into notifications (titre, texte, ico, kind, ref_id, created_at)
select v.titre, v.texte, v.ico, v.kind, v.ref_id, now() - v.min * interval '1 minute'
from (values
  ('Formule de savon à rendre aujourd’hui', 'Clôture à 18:00 — 20 points.', 'calendar', 'devoir', 'd1', 6),
  ('Nouveau message de Awa Sossou', '« Votre surgraissage est un peu haut, corrigez la soude. »', 'message', 'message', 'c1', 48),
  ('Nouvelle leçon disponible', 'Crème de visage — « Que faire quand la crème déphase ? ».', 'cours', 'cours', 'c3', 170),
  ('Badge débloqué : Premier savon 🎉', 'Votre première leçon de savonnerie est terminée.', 'badge', 'badge', '', 400),
  ('Résultat du quiz Savonnerie', 'Score : 83 % — attention à la leçon sur la cure.', 'quiz', 'quiz', 'c1', 1440),
  ('Téléchargement terminé', 'Savonnerie à froid disponible hors-ligne.', 'systeme', 'systeme', '', 1700),
  ('Dr. Chabi a répondu à votre question', '« Un déphasage se rattrape en réchauffant doucement l’émulsion. »', 'message', 'message', 'c3', 2500),
  ('Session live demain à 10:30', 'Émulsions et actifs — salle virtuelle B.', 'cours', 'cours', 's3', 3000)
) as v(titre, texte, ico, kind, ref_id, min)
where not exists (select 1 from notifications n where n.titre = v.titre);

-- Retrait des contenus qui n'existent plus dans cette version
delete from videos where id not in ('hJwIUUQYSQg', 'NT5q99x6LoA', 'wLv3geJ3Rv0', '-WB8UKJA5qU', '8pIZmfuzoHY', 'Ka6h2cM2Vrw', 'WUFqUncjdx0', '6fulOu4L7DA', 'LS8QMUwW2t0', 'NMvKGkwKFlE', 'CG2hYCv-uYs', 'eOzN4ga3S40', 'V39AGZT2smk', 't6TOv6jjafg', 'eVtOykfMCFE', 'bEToJO9DpFY', 'tqv-7SKGAOc', 'xNLTTCZmK4k', 'E4PYYrwG_cY', 'GB_2Du40hiw', 'NL9_Hn--Grs', '38x4CZUy3B8', 'SpX5x5VJGEU', '_2zvQyv4bBo', 'MXWeRqMYJVU', 'b6mr8u3QYG4', 'sHsXzakRf9E', 'KijtJer0710', 'JSKFU2M1vJM', 'I2E1I12KeEc', 'fiRiTUgB1VU', 'D2HBAj4zY9E', 'hIsLGB6WuhM', 'k-Z9RPbY7eQ', 'cZUhpblcch4', 'CHUChDe_GMk', 'TuJhqOzkmto');
delete from lessons where id not in ('c1-m1-l1', 'c1-m1-l2', 'c1-m1-l3', 'c1-m2-l1', 'c1-m2-l2', 'c1-m2-l3', 'c1-m3-l1', 'c1-m3-l2', 'c1-m3-l3', 'c1-m3-l4', 'c2-m1-l1', 'c2-m1-l2', 'c2-m1-l3', 'c2-m2-l1', 'c2-m2-l2', 'c2-m2-l3', 'c2-m2-l4', 'c2-m3-l1', 'c2-m3-l2', 'c2-m3-l3', 'c3-m1-l1', 'c3-m1-l2', 'c3-m1-l3', 'c3-m2-l1', 'c3-m2-l2', 'c3-m2-l3', 'c3-m2-l4', 'c3-m3-l1', 'c3-m3-l2', 'c3-m3-l3', 'c3-m3-l4', 'c4-m1-l1', 'c4-m1-l2', 'c4-m1-l3', 'c4-m2-l1', 'c4-m2-l2', 'c4-m2-l3', 'c4-m2-l4', 'c4-m3-l1', 'c4-m3-l2', 'c4-m3-l3', 'c5-m1-l1', 'c5-m1-l2', 'c5-m1-l3', 'c5-m2-l1', 'c5-m2-l2', 'c5-m2-l3', 'c5-m2-l4', 'c5-m3-l1', 'c5-m3-l2', 'c6-m1-l1', 'c6-m1-l2', 'c6-m1-l3', 'c6-m1-l4', 'c6-m2-l1', 'c6-m2-l2', 'c6-m2-l3', 'c6-m3-l1', 'c6-m3-l2');
delete from assignments where id not in ('d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8');
delete from quizzes where id not in ('c1', 'c2', 'c3', 'c4', 'c5', 'c6');
delete from calendar_sessions where id not in ('s1', 's2', 's3', 's4', 's5', 's6');
delete from badges where id not in ('premier', 'assidu', 'regulier', 'streak', 'explor', 'perf', 'mentor', 'data', 'cyber');

-- Progression de l'étudiante de démonstration
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into enrollments (user_id, course_id, progress, favori, statut)
select u.id, v.course_id, v.progress, v.favori, v.statut
from u, (values
  ('c1', 60, true, 'encours'),
  ('c2', 30, true, 'encours'),
  ('c3', 27, false, 'encours'),
  ('c4', 0, false, 'encours'),
  ('c5', 33, true, 'encours'),
  ('c6', 0, false, 'encours')
) as v(course_id, progress, favori, statut)
on conflict (user_id, course_id) do update set progress = excluded.progress, favori = excluded.favori, statut = excluded.statut;

-- Leçons déjà terminées
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into lesson_progress (user_id, lesson_id, done)
select u.id, v.lesson_id, true from u, (values
  ('c1-m1-l1'),
  ('c1-m1-l2'),
  ('c1-m1-l3'),
  ('c1-m2-l1'),
  ('c1-m2-l2'),
  ('c1-m2-l3'),
  ('c2-m1-l1'),
  ('c2-m1-l2'),
  ('c2-m1-l3'),
  ('c3-m1-l1'),
  ('c3-m1-l2'),
  ('c3-m1-l3'),
  ('c5-m1-l1'),
  ('c5-m1-l2'),
  ('c5-m1-l3')
) as v(lesson_id)
on conflict (user_id, lesson_id) do update set done = true;

-- Vidéos déjà vues / favorites
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into video_state (user_id, video_id, progress, liked, saved)
select u.id, v.video_id, v.progress, false, false from u, (values
  ('hJwIUUQYSQg', 100),
  ('NT5q99x6LoA', 100),
  ('wLv3geJ3Rv0', 62),
  ('-WB8UKJA5qU', 28),
  ('8pIZmfuzoHY', 100)
) as v(video_id, progress)
on conflict (user_id, video_id) do update set progress = greatest(video_state.progress, excluded.progress);

-- Réglages par défaut
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into settings (user_id, theme, langue) select u.id, 'sombre', 'fr' from u
on conflict (user_id) do nothing;

-- Activité des 12 derniers jours (série d'apprentissage)
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into activity (user_id, jour, minutes, lecons)
select u.id, current_date - g, 40 + (g * 7) % 55, 1 + g % 3
from u, generate_series(0, 11) as g
on conflict (user_id, jour) do update set minutes = excluded.minutes, lecons = excluded.lecons;

-- Badges déjà obtenus
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into user_badges (user_id, badge_id)
select u.id, v.badge_id from u, (values
  ('premier'),
  ('assidu'),
  ('regulier'),
  ('streak')
) as v(badge_id)
on conflict (user_id, badge_id) do nothing;

-- Téléchargements hors-ligne
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into downloads (user_id, course_id, titre, taille_label, etat, progres)
select u.id, v.course_id, v.titre, v.taille, v.etat, v.progres
from u, (values
  ('c1', 'Savonnerie à froid', '3 leçons · 180 Mo', 'ok', 100),
  ('c3', 'Crème de visage : émulsions', 'Module 2 · 140 Mo', 'pause', 52),
  (null, 'Saponification à froid : le tutoriel complet', 'Vidéo · 42 Mo', 'ok', 100),
  (null, 'Formuler une émulsion : crème hydratante visage', 'Vidéo · 13 min · 38 Mo', 'dl', 18)
) as v(course_id, titre, taille, etat, progres)
where not exists (select 1 from downloads d where d.titre = v.titre and d.user_id = u.id);

-- Résultats de quiz déjà obtenus
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into quiz_attempts (user_id, quiz_id, score, total, note_pct, duree_s)
select u.id, v.quiz_id, v.score, v.total, v.pct, v.duree from u, (values
  ('c1', 5, 6, 83, 412),
  ('c2', 6, 6, 100, 338)
) as v(quiz_id, score, total, pct, duree)
where not exists (select 1 from quiz_attempts a where a.user_id = u.id and a.quiz_id = v.quiz_id);

-- Une copie notée par la formatrice : elle apparaît dans « Corrections »
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into submissions (assignment_id, user_id, statut, note, commentaire, fichier_nom, fichier_taille)
select v.aid, u.id, 'note', 18, 'Très bon dossier : sources locales bien documentées.', 'dossier-matieres-premieres.pdf', 284000
from u, (values ('d5')) as v(aid)
where not exists (select 1 from submissions s where s.user_id = u.id and s.assignment_id = v.aid);

-- Une copie en attente de correction (pour l'écran Corrections du formateur)
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into submissions (assignment_id, user_id, statut, fichier_nom, fichier_taille, commentaire)
select v.aid, u.id, 'rendu', 'prix-de-revient-savon.xlsx', 64200, 'Prix de revient calculé sur un lot de 20 savons.'
from u, (values ('d7')) as v(aid)
where not exists (select 1 from submissions s where s.user_id = u.id and s.assignment_id = v.aid);

-- Rappels de séances activés pour la première séance
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into session_reminders (user_id, session_id, actif)
select u.id, s.id, true from u, (select id from calendar_sessions order by jour_semaine limit 2) s
on conflict (user_id, session_id) do nothing;


-- ---------------------------------------------------------- paiements (démonstration)
-- Amina (compte de démonstration) a acheté le cours de savonnerie et possède un
-- abonnement mensuel en cours : l'application affiche donc à la fois un achat définitif
-- et un abonnement actif, comme un vrai client.
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into orders (id, user_id, type, course_id, plan_id, amount, description, status, nova_session_id, nova_reference, method, paid_at, created_at)
select '11111111-1111-4111-8111-111111111111'::uuid, u.id, 'cours', 'c1', null, 3500,
       'CosmétiLab — cours Savonnerie à froid', 'paid', 'cs_demo_savon', 'NV10000001', 'balance',
       now() - interval '21 days', now() - interval '21 days'
from u where not exists (select 1 from orders o where o.id = '11111111-1111-4111-8111-111111111111'::uuid);
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into orders (id, user_id, type, course_id, plan_id, amount, description, status, nova_session_id, nova_reference, method, paid_at, created_at)
select '22222222-2222-4222-8222-222222222222'::uuid, u.id, 'abonnement', null, 'mensuel', 6000,
       'CosmétiLab — Abonnement mensuel', 'paid', 'cs_demo_abo', 'NV10000002', 'card',
       now() - interval '7 days', now() - interval '7 days'
from u where not exists (select 1 from orders o where o.id = '22222222-2222-4222-8222-222222222222'::uuid);
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into subscriptions (user_id, plan_id, statut, started_at, current_period_end, order_id, renewed_count)
select u.id, 'mensuel', 'actif', now() - interval '7 days', now() + interval '23 days',
       '22222222-2222-4222-8222-222222222222'::uuid, 1 from u
on conflict (user_id) do update
  set statut = 'actif',
      current_period_end = greatest(subscriptions.current_period_end, excluded.current_period_end),
      order_id = excluded.order_id, updated_at = now();
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into course_access (user_id, course_id, source, order_id, expires_at)
select u.id, c.id, 'abonnement', '22222222-2222-4222-8222-222222222222'::uuid, now() + interval '23 days'
from u, courses c
on conflict (user_id, course_id) do update
  set expires_at = excluded.expires_at,
      source = case when course_access.source = 'achat' then 'achat' else 'abonnement' end;
with u as (select id from users where email = 'amina@cosmetilab.bj')
insert into course_access (user_id, course_id, source, order_id, expires_at)
select u.id, 'c1', 'achat', '11111111-1111-4111-8111-111111111111'::uuid, null from u
on conflict (user_id, course_id) do update set source = 'achat', expires_at = null, started_at = now();

