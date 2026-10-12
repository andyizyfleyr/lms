#!/usr/bin/env node
/* ------------------------------------------------------------
   Outils base de données CosmétiLab (Neon) — migrate / seed / check / reset
   Usage : npm run db:migrate | db:seed | db:check | db:reset
   ------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const root = path.join(__dirname, '..');

function env(){
  const file = path.join(root, '.env.local');
  const out = {};
  if (fs.existsSync(file)){
    for (const line of fs.readFileSync(file, 'utf8').split('\n')){
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/&amp;/g, '&');
    }
  }
  return { ...out, ...process.env };
}

async function connect(){
  const { DATABASE_URL } = env();
  if (!DATABASE_URL) throw new Error('DATABASE_URL absente : renseigne .env.local');
  // on retire sslmode/channel_binding de l'URL : l'option ssl ci-dessous fait le travail
  const url = new URL(DATABASE_URL);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('channel_binding');
  const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

const run = async (client, file) => {
  const sql = fs.readFileSync(path.join(root, file), 'utf8');
  await client.query(sql);
  console.log('  ✓ ' + file + ' appliqué');
};

(async () => {
  const cmd = process.argv[2] || 'check';
  const client = await connect();
  const host = env().DATABASE_URL.split('@')[1].split('/')[0];
  console.log('Neon : ' + host + '  →  ' + cmd + '\n');
  try {
    if (cmd === 'migrate') await run(client, 'db/schema.sql');
    else if (cmd === 'seed') await run(client, 'db/seed.sql');
    else if (cmd === 'reset'){
      console.log('  ⚠ remise à zéro de toutes les tables CosmétiLab…');
      await client.query(`drop table if exists quiz_answers, quiz_attempts, quiz_options, quiz_questions, quizzes,
        submissions, assignments, notes, messages, lesson_progress, enrollments, video_state, activity,
        downloads, session_reminders, user_badges, settings, notifications, auth_tokens, badges,
        calendar_sessions, resources, lessons, videos, courses, users cascade;`);
      await run(client, 'db/schema.sql');
      await run(client, 'db/seed.sql');
    } else if (cmd !== 'check') throw new Error('commande inconnue : ' + cmd);

    const t = await client.query(`select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`);
    const tables = t.rows.map(r => r.table_name);
    console.log('\n  ' + tables.length + ' tables : ' + tables.join(', '));
    const counts = ['users','courses','lessons','videos','quizzes','quiz_questions','quiz_options',
                    'assignments','resources','calendar_sessions','badges','messages','notifications','enrollments'];
    const parts = [];
    for (const tab of counts){
      const r = await client.query('select count(*)::int as c from ' + tab);
      parts.push(tab + '=' + r.rows[0].c);
    }
    console.log('  lignes : ' + parts.join(' '));
    const u = await client.query('select email, role from users order by created_at limit 5');
    console.log('  comptes : ' + u.rows.map(r => r.email + ' (' + r.role + ')').join(', '));
  } catch (e) {
    console.error('\n  ✗ ' + e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
