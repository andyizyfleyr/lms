#!/usr/bin/env node
/* ============================================================
   Assemble l'application en un seul fichier : web/index.html

   Le livrable est un fichier unique et autonome (HTML + CSS + JS, images et
   extrait vidéo en base64) ; son code est maintenu dans src/ sous forme de
   modules lisibles. Ce script est la seule façon de produire index.html :
   pas de copie manuelle, donc pas de dérive possible.

   Modules et ordre d'assemblage :
     1. src/shell.html    structure HTML, <style> complet, sprite d'icônes
     2. src/images.json   const IMG = { … }        (images des cours, base64)
     3. src/clip.json     const CLIP_MP4 / CLIP_WEBM (extrait vidéo, base64)
     3b. src/content.js   cours, vidéos, quiz, devoirs (contenu cosmétique)
     4. src/app.js        données, utilitaires, lecteur vidéo, synchronisation
        (tout ce qui précède sa dernière balise </script>)
     4b. src/routes.json  adresses : une adresse par écran (source unique, partagée avec le serveur)
    4c. src/routes.js    construction des liens et lecture de l'adresse ouverte
    5. src/core.js       noyau : état persistant, routeur de pages, tableaux de bord
     6. src/lms.js        pages pédagogiques : cours, quiz, devoirs
    6b. src/paiement.js  cours payants, abonnements, paiement NOVA Checkout
    6c. src/profil.js    avatar, mot de passe, appareils, héros et activité réels
    6d. src/sync2.js     notifications, discussions, agenda, téléchargements, notes : tout par compte
    6e. src/prof.js      espace formateur : cours, leçons, ressources, séances, suivi des apprenants
    6f. src/apprendre.js reprise de lecture, historique, attestations, recherche serveur, hors-ligne
     6g. src/v3-base.js   V3 : socle (API, données par compte, écrans publics, état du service)
    6h. src/v3-apprendre.js  V3 : parcours, quiz enrichis, flashcards, objectifs, compétences, fiches
    6i. src/v3-outils.js     V3 : formulation, saponification, convertisseur, réglementaire, recettes, production
    6j. src/v3-formateur.js  V3 : revenus, création de cours, banque de questions, annonce, notation, séances
    6k. src/v3-argent.js     V3 : reçus, codes promo, parrainage, panier groupé, relances
    6l. src/v3-qualite.js    V3 : hors-ligne, économie de données, accessibilité, sauvegarde, PWA
    6m. src/v4-boutique.js   V4 : boutique des livres PDF, panier, bibliothèque, lecture signée
    6n. src/v4-commun.js     V4 : entraide, galerie des réalisations, ateliers, signalement
    6o. src/v4-argent.js     V4 : produits et étiquettes INCI, clients, commandes, lots, kits, points, relevé
    6p. src/v4-apprendre.js  V4 : examens blancs, émargement par code, écoute, mode atelier, glossaire
    6q. src/v4-admin.js      V4 : console d'administration, sécurité, fiche apprenant, co-formateurs
    7. src/compte.js     comptes, espaces de données séparés, temps réel, corrections
     7. src/app.js (fin)  fermeture </script></body></html>

   Utilisation :  node build.js [chemin de sortie]     (défaut : web/index.html)
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ICI = __dirname;
const SORTIE = path.resolve(process.argv[2] || path.join(ICI, 'index.html'));
const lire = f => fs.readFileSync(path.join(ICI, 'src', f), 'utf8');

const shell = lire('shell.html');
const images = lire('images.json');
const clip = lire('clip.json');
const contenu = lire('content.js');
const app = lire('app.js');
const core = lire('core.js');
const lms = lire('lms.js');
const comptes = lire('compte.js');
const paiement = lire('paiement.js');
const profil = lire('profil.js');
const sync2 = lire('sync2.js');
const prof = lire('prof.js');
const v3base = lire('v3-base.js');
const v3apprendre = lire('v3-apprendre.js');
const v3outils = lire('v3-outils.js');
const v3formateur = lire('v3-formateur.js');
const v3argent = lire('v3-argent.js');
const v3qualite = lire('v3-qualite.js');
const v4boutique = lire('v4-boutique.js');
const v4commun = lire('v4-commun.js');
const v4argent = lire('v4-argent.js');
const v4apprendre = lire('v4-apprendre.js');
const v4admin = lire('v4-admin.js');
const apprendre = lire('apprendre.js');
const routes = lire('routes.js');
const adresses = lire('routes.json').trim();

const iFin = app.lastIndexOf('</script>');
if (iFin < 0) throw new Error('src/app.js : balise </script> introuvable');
const appAvant = app.slice(0, iFin), appApres = app.slice(iFin);

const html =
  /* shell.html se termine sur « const IMG = » : images.json enchaîne l'objet, sans séparateur */
  shell + images + '\n' + clip + '\n' +
  '\n/* ==================== CONTENU (cours, vidéos, quiz) ==================== */\n' + contenu +
  '\n/* ==================== APPLICATION (données, lecteur, synchronisation) ==================== */\n' + appAvant +
  '\n/* ==================== ADRESSES DES PAGES (une adresse par écran) ==================== */\nconst ADRESSES = ' + adresses + ';\n' + routes +
  '\n/* ==================== NOYAU (état, routeur de pages) ==================== */\n' + core +
  '\n/* ==================== PAGES PÉDAGOGIQUES (cours, quiz, devoirs) ==================== */\n' + lms +
  '\n/* ==================== COMPTES (inscription, espaces séparés, temps réel) ==================== */\n' + comptes +
  '\n/* ==================== PAIEMENTS (cours payants, abonnements NOVA) ==================== */\n' + paiement +
  '\n/* ==================== PROFIL, AVATARS, ACCUEIL RÉEL ==================== */\n' + profil +
  '\n/* ==================== SYNCHRONISATION COMPLÈTE PAR COMPTE ==================== */\n' + sync2 +
  '\n/* ==================== ESPACE FORMATEUR ==================== */\n' + prof +
  "\n/* ==================== EXPÉRIENCE D'APPRENTISSAGE ==================== */\n" + apprendre +
  '\n/* ==================== V3 : SOCLE (API, données par compte, écrans publics) ==================== */\n' + v3base +
  '\n/* ==================== V3 : APPRENDRE (parcours, révision, objectifs, compétences) ==================== */\n' + v3apprendre +
  '\n/* ==================== V3 : OUTILS (formulation, saponification, conversion, production) ==================== */\n' + v3outils +
  '\n/* ==================== V3 : FORMATEUR (cours, questions, revenus, notation) ==================== */\n' + v3formateur +
  '\n/* ==================== V3 : ARGENT (reçus, codes, parrainage, panier) ==================== */\n' + v3argent +
  '\n/* ==================== V3 : TÉLÉPHONE ET QUALITÉ (hors-ligne, confort, sauvegarde) ==================== */\n' + v3qualite +
  '\n/* ==================== V4 : BOUTIQUE DES LIVRES PDF ==================== */\n' + v4boutique +
  '\n/* ==================== V4 : COMMUNAUTÉ (entraide, galerie, ateliers) ==================== */\n' + v4commun +
  '\n/* ==================== V4 : PRODUCTION ET VENTE (produits, clients, commandes, lots, kits) ==================== */\n' + v4argent +
  '\n/* ==================== V4 : EXAMENS, ÉMARGEMENT, ÉCOUTE, ATELIER, GLOSSAIRE ==================== */\n' + v4apprendre +
  '\n/* ==================== V4 : CONSOLE, SÉCURITÉ, ÉQUIPE ==================== */\n' + v4admin +
  '\n' + appApres;

fs.writeFileSync(SORTIE, html);

const controles = [
  ['structure HTML', /<html[\s>]/i], ['sprite d’icônes', /id="ic-home"/],
  ['images intégrées', /const IMG\s*=/], ['contenu cosmétique', /const COURS\s*=/], ['extrait vidéo intégré', /const CLIP_MP4\s*=/],
  ['noyau applicatif', /window\.APPX\s*=/], ['adresses des pages', /window\.LHROUTES\s*=/], ['pages LMS', /PAGES\.quiz\s*=/],
  ['synchronisation serveur', /window\.LHSYNC\s*=/], ['comptes et temps réel', /window\.LHCOMPTE\s*=/], ['paiements et abonnements', /window\.LHPAIE\s*=/], ['profil réel', /window\.LHPROFIL\s*=/], ['synchronisation complète', /window\.LHSYNC2\s*=/], ['espace formateur', /window\.LHPROF\s*=/], ['expérience d\'apprentissage', /window\.LHAPPRENDRE\s*=/], ['écran abonnement', /PAGES\.abonnement\s*=/], ['fin de document', /<\/html>\s*$/],
  ['V3 — socle', /window\.LHV3\s*=/], ['V3 — apprendre', /window\.LHV3APPRENDRE\s*=/],
  ['V3 — outils', /window\.LHV3OUTILS\s*=/], ['V3 — formateur', /window\.LHV3FORMATEUR\s*=/],
  ['V3 — argent', /window\.LHV3ARGENT\s*=/], ['V3 — qualité', /window\.LHQUALITE\s*=/],
  ['V3 — panier groupé', /type: 'panier'/], ['V3 — vérification publique', /PAGES\.verifier\s*=/],
  ['V4 — boutique PDF', /window\.LHV4BOUTIQUE\s*=/], ['V4 — communauté', /window\.LHV4COMMUN\s*=/],
  ['V4 — production et vente', /window\.LHV4ARGENT\s*=/], ['V4 — examens et atelier', /window\.LHV4APPRENDRE\s*=/],
  ['V4 — console', /window\.LHV4ADMIN\s*=/], ['V4 — analyse de rentabilité', /Analyse de rentabilité/],
  ['V4 — glossaire', /PAGES\.glossaire\s*=/], ['V4 — fiches publiques', /case 'l':|case 'p':/]
];
const manquants = controles.filter(([, motif]) => !motif.test(html)).map(([nom]) => nom);
const ko = n => Math.round(n / 1024) + ' Ko';
console.log('index.html assemblé : ' + ko(html.length) + ' · ' + html.length + ' caractères');
console.log('  sources → shell ' + ko(shell.length) + ' · images ' + ko(images.length) + ' · vidéo ' + ko(clip.length) +
            ' · contenu ' + ko(contenu.length) + ' · app ' + ko(app.length) + ' · noyau ' + ko(core.length) + ' · pages ' + ko(lms.length));
if (manquants.length){ console.error('✗ briques manquantes : ' + manquants.join(', ')); process.exit(1); }
console.log('✓ intégrité vérifiée (' + controles.length + ' contrôles)');
