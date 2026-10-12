#!/usr/bin/env node
/* ============================================================
   Réinitialisation de la démonstration — CosmétiLab

   Les suites de tests terminent des leçons sur le compte de démonstration
   (synchronisation application ↔ API). Ce script remet la démo dans son
   état d'origine : il efface la progression du compte de démonstration
   puis réapplique le jeu de données (db:seed).

   Utilisation (depuis le dossier api/) :
     node scripts/reinitialiser-demo.js            (compte amina)
     node scripts/reinitialiser-demo.js --compte awa@cosmetilab.bj
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const i = process.argv.indexOf('--compte');
const COMPTE = i > -1 ? process.argv[i + 1] : 'amina@cosmetilab.bj';

function chaine() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of ['.env.local', '.env']) {
    const p = path.join(RACINE, f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  console.error('❌ DATABASE_URL introuvable (api/.env.local).');
  process.exit(2);
}
let neon;
try { ({ neon } = require(path.join(RACINE, 'node_modules', '@neondatabase/serverless'))); }
catch (e) { console.error('❌ Dépendances absentes : lancez `npm ci` dans api/.'); process.exit(2); }
const sql = neon(chaine());

(async () => {
  const u = await sql`select id, email from users where email = ${COMPTE}`;
  if (!u.length) { console.error('❌ Compte introuvable : ' + COMPTE); process.exit(2); }
  const id = u[0].id;
  const avant = await sql`select count(*)::int as n from lesson_progress where user_id = ${id}`;
  await sql`delete from lesson_progress where user_id = ${id}`;
  console.log('🧹 ' + COMPTE + ' : ' + avant[0].n + ' leçon(s) effacée(s)');
  console.log('   réapplication du jeu de démonstration (db:seed)…');
  execFileSync(process.execPath, [path.join(__dirname, 'db.js'), 'seed'], { cwd: RACINE, stdio: 'inherit' });
})().catch(e => { console.error('💥 ' + (e && e.message || e)); process.exit(3); });
