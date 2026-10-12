#!/usr/bin/env node
/* ============================================================
   Copie l'application (web/index.html) dans api/public/index.html
   pour le déploiement « tout sur une seule adresse » :

     https://mon-projet.vercel.app/       → l'application CosmétiLab
     https://mon-projet.vercel.app/api/*  → l'API Next.js + Neon

   Une seule source de vérité : web/index.html (assemblé depuis web/src/).
   Ce script ne fait qu'en publier une copie, avec un contrôle d'intégrité.

   Utilisation :
     node scripts/sync-site.js             copie (et vérifie la taille)
     node scripts/sync-site.js --verifier  échoue si la copie a divergé
   ============================================================ */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', '..', 'web', 'index.html');
const CIBLE = path.join(__dirname, '..', 'public', 'index.html');
const verifier = process.argv.includes('--verifier');
const ko = n => Math.round(n / 1024) + ' Ko';

if (!fs.existsSync(SOURCE)) {
  console.error('✗ Source introuvable : ' + SOURCE + '\n  → assemble d\'abord l\'application : cd web && npm run build');
  process.exit(1);
}
const source = fs.readFileSync(SOURCE);

if (verifier) {
  if (!fs.existsSync(CIBLE)) { console.error('✗ api/public/index.html absent → lancer : node api/scripts/sync-site.js'); process.exit(1); }
  const cible = fs.readFileSync(CIBLE);
  if (Buffer.compare(source, cible) !== 0) {
    console.error('✗ api/public/index.html a divergé de web/index.html (' + ko(cible.length) + ' au lieu de ' + ko(source.length) + ')');
    console.error('  → relancer : node api/scripts/sync-site.js');
    process.exit(1);
  }
  console.log('✅ api/public/index.html est identique à web/index.html (' + ko(source.length) + ')');
  process.exit(0);
}

fs.mkdirSync(path.dirname(CIBLE), { recursive: true });
fs.writeFileSync(CIBLE, source);
console.log('✅ api/public/index.html ← web/index.html (' + ko(source.length) + ')');

/* Les adresses des écrans sont la source unique partagée avec le serveur :
   next.config.js s'en sert pour répondre à chaque adresse, et les tests aussi. */
const ADRESSES = path.join(__dirname, '..', '..', 'web', 'src', 'routes.json');
const CIBLE_ADRESSES = path.join(__dirname, '..', 'routes-site.json');
fs.copyFileSync(ADRESSES, CIBLE_ADRESSES);
const liste = JSON.parse(fs.readFileSync(ADRESSES, 'utf8'));
console.log('✅ api/routes-site.json ← web/src/routes.json (' + liste.length + ' adresses)');
console.log('   Le site sera servi sur chaque adresse (/cours/c1, /notifications…) et l\'API sur /api/*.');
