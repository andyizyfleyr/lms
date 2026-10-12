#!/usr/bin/env node
/* ============================================================
   Nettoyage des comptes de test — CosmétiLab

   Les suites automatisées (`smoke.js`, `tests/navigateur.js`,
   `tests/comptes.js`) créent des comptes jetables à chaque passage
   (inscription, rôle formateur, temps réel). Ce script les retire
   de la base Neon ; leurs données partent avec eux (clés étrangères
   en `on delete cascade`).

   Les trois comptes de démonstration ne sont JAMAIS touchés.

   Utilisation (depuis le dossier api/) :
     node scripts/nettoyer-comptes.js --liste     → montre les comptes
     node scripts/nettoyer-comptes.js             → supprime les comptes de test
     node scripts/nettoyer-comptes.js --tout      → supprime tout sauf les comptes de démo
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const GARDES = ['amina@cosmetilab.bj', 'awa@cosmetilab.bj', 'admin@cosmetilab.bj'];
const MOTIFS_TEST = ['eleve-%@cosmetilab.bj', 'direct-%@cosmetilab.bj',
                     'verif-%@cosmetilab.bj', 'dbg-%@cosmetilab.bj', 'dbg2-%@cosmetilab.bj'];

/* --- chaîne de connexion : .env.local, puis environnement --- */
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
  const liste = await sql`select email, role, created_at from users order by created_at`;
  console.log('Comptes en base : ' + liste.length);
  liste.forEach(u => console.log('  • ' + u.email + '  [' + u.role + ']'));
  if (process.argv.includes('--liste')) return;

  const tout = process.argv.includes('--tout');
  const jetables = liste.filter(u => !GARDES.includes(u.email));
  const cibles = tout ? jetables : liste.filter(u =>
    MOTIFS_TEST.some(m => {
      const re = new RegExp('^' + m.replace(/[.]/g, '\\.').replace(/[%*]/g, '.*') + '$');
      return re.test(u.email);
    }) && !GARDES.includes(u.email));

  if (!cibles.length) { console.log('\nRien à supprimer.'); return; }

  let n = 0;
  for (const u of cibles) {
    const r = await sql`delete from users where email = ${u.email} returning id`;
    n += r.length;
  }
  const reste = await sql`select count(*)::int as n from users`;
  console.log('\n✓ ' + n + ' compte(s) de test supprimé(s) — ' + reste[0].n + ' compte(s) restant(s).');
})().catch(e => { console.error('❌ ' + e.message); process.exit(1); });
