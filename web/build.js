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
     4. src/app.js        données, utilitaires, lecteur vidéo, synchronisation
        (tout ce qui précède sa dernière balise </script>)
     5. src/core.js       noyau : état persistant, routeur de pages, tableaux de bord
     6. src/lms.js        pages pédagogiques : cours, quiz, devoirs
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
const app = lire('app.js');
const core = lire('core.js');
const lms = lire('lms.js');

const iFin = app.lastIndexOf('</script>');
if (iFin < 0) throw new Error('src/app.js : balise </script> introuvable');
const appAvant = app.slice(0, iFin), appApres = app.slice(iFin);

const html =
  /* shell.html se termine sur « const IMG = » : images.json enchaîne l'objet, sans séparateur */
  shell + images + '\n' + clip + '\n' +
  '\n/* ==================== APPLICATION (données, lecteur, synchronisation) ==================== */\n' + appAvant +
  '\n/* ==================== NOYAU (état, routeur de pages) ==================== */\n' + core +
  '\n/* ==================== PAGES PÉDAGOGIQUES (cours, quiz, devoirs) ==================== */\n' + lms +
  '\n' + appApres;

fs.writeFileSync(SORTIE, html);

const controles = [
  ['structure HTML', /<html[\s>]/i], ['sprite d’icônes', /id="ic-home"/],
  ['images intégrées', /const IMG\s*=/], ['extrait vidéo intégré', /const CLIP_MP4\s*=/],
  ['noyau applicatif', /window\.APPX\s*=/], ['pages LMS', /PAGES\.quiz\s*=/],
  ['synchronisation serveur', /window\.LHSYNC\s*=/], ['fin de document', /<\/html>\s*$/]
];
const manquants = controles.filter(([, motif]) => !motif.test(html)).map(([nom]) => nom);
const ko = n => Math.round(n / 1024) + ' Ko';
console.log('index.html assemblé : ' + ko(html.length) + ' · ' + html.length + ' caractères');
console.log('  sources → shell ' + ko(shell.length) + ' · images ' + ko(images.length) + ' · vidéo ' + ko(clip.length) +
            ' · app ' + ko(app.length) + ' · noyau ' + ko(core.length) + ' · pages ' + ko(lms.length));
if (manquants.length){ console.error('✗ briques manquantes : ' + manquants.join(', ')); process.exit(1); }
console.log('✓ intégrité vérifiée (' + controles.length + ' contrôles)');
