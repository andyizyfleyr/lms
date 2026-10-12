/* Génère db/seed.sql à partir des données de l'application (src/*.js). */
const fs = require('fs');
const path = require('path');
const chemin = path.join(__dirname, '..', 'db', 'data.json');
if (!fs.existsSync(chemin)){
  console.error('db/data.json manquant : lancez d’abord « node scripts/extract-data.js »');
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(chemin, 'utf8'));
const q = v => v === null || v === undefined ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const n = v => (v === null || v === undefined || v === '') ? 'null' : Number(v);
const j = v => "'" + JSON.stringify(v === undefined ? [] : v).replace(/'/g, "''") + "'::jsonb";
const b = v => v ? 'true' : 'false';
const COURSE_IDS = new Set(d.COURS.map(c => c.id));
const courseOrNull = v => COURSE_IDS.has(v) ? q(v) : 'null';   // certaines séances/téléchargements ne visent pas un cours
const L = [];

/* mots de passe de démonstration (même format que src/lib/auth.ts) */
const crypto = require('crypto');
function hashPassword(pwd){
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pwd, salt, 64, { N: 16384, r: 8, p: 1 });
  return ['scrypt', 16384, 8, 1, salt.toString('base64'), key.toString('base64')].join('$');
}
const HASH_AMINA = hashPassword('demo1234');
const HASH_PROF = hashPassword('prof1234');
const HASH_ADMIN = hashPassword('admin1234');
const push = s => L.push(s);

push('-- ============================================================');
push('-- LearnHub — données de démonstration (relançable sans doublon)');
push('-- Généré depuis l\'application : cours, modules, vidéos, quiz, devoirs,');
push('-- ressources, agenda, badges, discussions, notifications, téléchargements.');
push('-- ============================================================');
push("create extension if not exists pgcrypto;");
push('');

/* --- utilisateurs de démonstration -------------------------- */
push('-- Comptes de démonstration : amina@learnhub.bj / demo1234 (étudiante),');
push('--                          adjovi@learnhub.bj / prof1234 (formatrice),');
push('--                          admin@learnhub.bj / admin1234 (administrateur)');
push(`insert into users (email, password_hash, nom, role, tel, ville, promo, bio, objectif_semaine_h) values
  ('amina@learnhub.bj', ${q(HASH_AMINA)}, 'Amina Dossou', 'etudiant', '+229 97 00 00 00', 'Abomey-Calavi', 'L3 Informatique', 'Passionnée de développement web et de design d''interface.', 8),
  ('adjovi@learnhub.bj', ${q(HASH_PROF)}, 'Mme Adjovi', 'enseignant', '', 'Cotonou', '', 'Formatrice UI/UX — Material Design 3.', 4),
  ('admin@learnhub.bj', ${q(HASH_ADMIN)}, 'Administrateur LearnHub', 'admin', '', 'Cotonou', '', 'Gère les cours, les comptes et les contenus.', 0)
on conflict (email) do nothing;`);
push('');

/* --- cours -------------------------------------------------- */
push('-- Cours');
push('insert into courses (id, titre, categorie, prof, image_key, accent, ico, statut, duree_label, total_lecons) values');
push(d.COURS.map(c => `  (${q(c.id)}, ${q(c.titre)}, ${q(c.cat)}, ${q(c.prof)}, ${q(c.img)}, ${q(c.acc)}, ${q(c.ico)}, ${q(c.statut)}, ${q(c.duree)}, ${n(c.total)})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, categorie = excluded.categorie, prof = excluded.prof, total_lecons = excluded.total_lecons;');
push('');

/* --- modules + leçons --------------------------------------- */
const lessons = [];
for (const cid of Object.keys(d.PROGRAMMES)){
  d.PROGRAMMES[cid].forEach((mod, mi) => {
    (mod.l || []).forEach((l, li) => {
      lessons.push({ id: `${cid}-m${mi + 1}-l${li + 1}`, course: cid, module: mod.m, mo: mi + 1, o: li + 1, titre: l.t, duree: l.d, kind: l.k, video: l.v || '', done: l.done });
    });
  });
}
push(`-- Modules et leçons (${lessons.length})`);
push('insert into lessons (id, course_id, module_titre, module_ordre, ordre, titre, duree_label, kind, video_id) values');
push(lessons.map(l => `  (${q(l.id)}, ${q(l.course)}, ${q(l.module)}, ${n(l.mo)}, ${n(l.o)}, ${q(l.titre)}, ${q(l.duree)}, ${q(l.kind)}, ${q(l.video)})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, module_titre = excluded.module_titre, duree_label = excluded.duree_label, video_id = excluded.video_id;');
push('');

/* --- vidéos ------------------------------------------------- */
push('-- Bibliothèque vidéo');
push('insert into videos (id, course_id, titre, chaine, duree_s, vues, image_key) values');
push(d.VIDEOS.map(v => `  (${q(v.yt)}, ${q(v.cours)}, ${q(v.titre)}, ${q(v.chaine)}, ${n(v.duree)}, ${n(v.vues)}, ${q(v.img)})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, chaine = excluded.chaine, duree_s = excluded.duree_s, vues = excluded.vues;');
push('');

/* --- ressources --------------------------------------------- */
const res = [];
for (const cid of Object.keys(d.RESSOURCES || {})){
  (d.RESSOURCES[cid] || []).forEach((r, i) => res.push({ id: cid + '-r' + (i + 1), course: cid, o: i + 1, r }));
}
push(`-- Ressources (${res.length})`);
push('insert into resources (id, course_id, ordre, titre, type_label, ico, accent) values');
push(res.map(x => `  (${q(x.id)}, ${q(x.course)}, ${n(x.o)}, ${q(x.r.n)}, ${q(x.r.t)}, ${q(x.r.ico)}, ${q(x.r.acc)})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, type_label = excluded.type_label;');
push('');

/* --- quiz --------------------------------------------------- */
const quizzes = [], questions = [], options = [];
for (const cid of Object.keys(d.QUIZZES || {})){
  const z = d.QUIZZES[cid];
  quizzes.push({ id: cid, course: cid, titre: z.titre, duree: z.duree });
  (z.questions || []).forEach((qq, qi) => {
    const qid = `${cid}-q${qi + 1}`;
    questions.push({ id: qid, quiz: cid, o: qi + 1, enonce: qq.q, expl: qq.e || '' });
    (qq.o || []).forEach((txt, oi) => options.push({ id: `${qid}-o${oi + 1}`, q: qid, o: oi + 1, texte: txt, correct: oi === qq.a }));
  });
}
push(`-- Quiz (${quizzes.length}) — questions (${questions.length}) — réponses (${options.length})`);
push('insert into quizzes (id, course_id, titre, duree_s) values');
push(quizzes.map(z => `  (${q(z.id)}, ${q(z.course)}, ${q(z.titre)}, ${n(z.duree)})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, duree_s = excluded.duree_s;');
push('insert into quiz_questions (id, quiz_id, ordre, enonce, explication) values');
push(questions.map(x => `  (${q(x.id)}, ${q(x.quiz)}, ${n(x.o)}, ${q(x.enonce)}, ${q(x.expl)})`).join(',\n') + '\non conflict (id) do update set enonce = excluded.enonce, explication = excluded.explication;');
push('insert into quiz_options (id, question_id, ordre, texte, correct) values');
push(options.map(x => `  (${q(x.id)}, ${q(x.q)}, ${n(x.o)}, ${q(x.texte)}, ${b(x.correct)})`).join(',\n') + '\non conflict (id) do update set texte = excluded.texte, correct = excluded.correct;');
push('');

/* --- devoirs ------------------------------------------------ */
push('-- Devoirs');
push('insert into assignments (id, course_id, titre, type, points, echeance_label, niveau, consignes, quiz_id) values');
push(d.DEVOIRS.map(x => `  (${q(x.id)}, ${q(x.cours)}, ${q(x.titre)}, ${q(x.type)}, ${n(x.points)}, ${q((x.echeance && x.echeance.h ? 'j+' + x.echeance.j + ' ' + x.echeance.h : '') || '')}, ${q(x.niveau)}, ${j(x.consignes)}, ${x.quiz ? q(x.quiz) : 'null'})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, points = excluded.points, consignes = excluded.consignes;');
push('');

/* --- agenda ------------------------------------------------- */
push('-- Séances de l\'agenda');
push('insert into calendar_sessions (id, jour_semaine, heure, titre, type, duree_label, salle, course_id, prof, tags, accent, ico, description) values');
push(d.SESS.map(s => `  (${q(s.id)}, ${n(s.jour)}, ${q(s.heure)}, ${q(s.titre)}, ${q(s.type)}, ${q(s.duree)}, ${q(s.salle)}, ${courseOrNull(s.cours)}, ${q(s.prof)}, ${j(s.tags)}, ${q(s.acc)}, ${q(s.ico)}, ${q(s.desc)})`).join(',\n') + '\non conflict (id) do update set titre = excluded.titre, heure = excluded.heure, description = excluded.description;');
push('');

/* --- badges ------------------------------------------------- */
push('-- Badges');
push('insert into badges (id, nom, ico, accent, description, cible) values');
push(d.BADGES_DEF.map(x => `  (${q(x.id)}, ${q(x.nom)}, ${q(x.ico)}, ${q(x.acc)}, ${q(x.desc)}, ${n(x.cible)})`).join(',\n') + '\non conflict (id) do update set nom = excluded.nom, description = excluded.description;');
push('');

/* --- discussions ------------------------------------------- */
const msgs = [];
for (const cid of Object.keys(d.DISC_SEED || {})){
  (d.DISC_SEED[cid] || []).forEach(m => msgs.push({ c: cid, m }));
}
push(`-- Messages de discussion (${msgs.length})`);
push("insert into messages (course_id, auteur, role, contenu, created_at)");
push('select v.course_id, v.auteur, v.role, v.contenu, now() - coalesce(v.min, 0) * interval \'1 minute\'');
push('from (values');
push(msgs.map(x => `  (${q(x.c)}, ${q(x.m.a)}, ${q(x.m.role === 'Formateur' || x.m.role === 'Prof' ? 'prof' : 'etudiant')}, ${q(x.m.txt)}, ${n(x.m.min)})`).join(',\n'));
push(") as v(course_id, auteur, role, contenu, min)");
push('where not exists (select 1 from messages m where m.course_id = v.course_id and m.contenu = v.contenu);');
push('');

/* --- notifications ----------------------------------------- */
push('-- Notifications générales');
push('insert into notifications (titre, texte, ico, kind, ref_id, created_at)');
push('select v.titre, v.texte, v.ico, v.kind, v.ref_id, now() - v.min * interval \'1 minute\'');
push('from (values');
push((d.NOTIFS_SEED || []).map(x => {
  const go = x.go || [];
  return `  (${q(x.t)}, ${q(x.b)}, ${q(x.type === 'devoir' ? 'calendar' : x.type)}, ${q(x.type)}, ${q(go[1] || '')}, ${n(x.min)})`;
}).join(',\n'));
push(') as v(titre, texte, ico, kind, ref_id, min)');
push('where not exists (select 1 from notifications n where n.titre = v.titre);');
push('');

/* --- état de l'étudiante de démo --------------------------- */
const u = "u.id";
push(`-- Progression de l'étudiante de démonstration
with u as (select id from users where email = 'amina@learnhub.bj')
insert into enrollments (user_id, course_id, progress, favori, statut)
select u.id, v.course_id, v.progress, v.favori, v.statut
from u, (values`);
push(d.COURS.map(c => `  (${q(c.id)}, ${n(c.prog)}, ${b(c.fav)}, ${q(c.statut)})`).join(',\n'));
push(`) as v(course_id, progress, favori, statut)
on conflict (user_id, course_id) do update set progress = excluded.progress, favori = excluded.favori, statut = excluded.statut;`);
push('');

push(`-- Leçons déjà terminées
with u as (select id from users where email = 'amina@learnhub.bj')
insert into lesson_progress (user_id, lesson_id, done)
select u.id, v.lesson_id, true from u, (values`);
const doneLessons = lessons.filter(l => l.done);
push(doneLessons.map(l => `  (${q(l.id)})`).join(',\n'));
push(`) as v(lesson_id)
on conflict (user_id, lesson_id) do update set done = true;`);
push('');

push(`-- Vidéos déjà vues / favorites
with u as (select id from users where email = 'amina@learnhub.bj')
insert into video_state (user_id, video_id, progress, liked, saved)
select u.id, v.video_id, v.progress, false, false from u, (values`);
push(d.VIDEOS.filter(v => v.prog > 0).map(v => `  (${q(v.yt)}, ${n(v.prog)})`).join(',\n'));
push(`) as v(video_id, progress)
on conflict (user_id, video_id) do update set progress = greatest(video_state.progress, excluded.progress);`);
push('');

push(`-- Réglages par défaut
with u as (select id from users where email = 'amina@learnhub.bj')
insert into settings (user_id, theme, langue) select u.id, 'sombre', 'fr' from u
on conflict (user_id) do nothing;`);
push('');

push(`-- Activité des 12 derniers jours (série d'apprentissage)
with u as (select id from users where email = 'amina@learnhub.bj')
insert into activity (user_id, jour, minutes, lecons)
select u.id, current_date - g, 40 + (g * 7) % 55, 1 + g % 3
from u, generate_series(0, 11) as g
on conflict (user_id, jour) do update set minutes = excluded.minutes, lecons = excluded.lecons;`);
push('');

push(`-- Badges déjà obtenus
with u as (select id from users where email = 'amina@learnhub.bj')
insert into user_badges (user_id, badge_id)
select u.id, v.badge_id from u, (values`);
push(d.BADGES_DEF.slice(0, 4).map(x => `  (${q(x.id)})`).join(',\n'));
push(`) as v(badge_id)
on conflict (user_id, badge_id) do nothing;`);
push('');

push(`-- Téléchargements hors-ligne
with u as (select id from users where email = 'amina@learnhub.bj')
insert into downloads (user_id, course_id, titre, taille_label, etat, progres)
select u.id, v.course_id, v.titre, v.taille, v.etat, v.progres
from u, (values`);
push((d.DL_SEED || []).map(x => `  (${courseOrNull(x.ref)}, ${q(x.t)}, ${q(x.s)}, ${q(x.st === 'done' ? 'ok' : x.st === 'pause' ? 'pause' : 'dl')}, ${n(x.p)})`).join(',\n'));
push(`) as v(course_id, titre, taille, etat, progres)
where not exists (select 1 from downloads d where d.titre = v.titre and d.user_id = u.id);`);
push('');
push("-- Rappels de séances activés pour la première séance");
push(`with u as (select id from users where email = 'amina@learnhub.bj')
insert into session_reminders (user_id, session_id, actif)
select u.id, s.id, true from u, (select id from calendar_sessions order by jour_semaine limit 2) s
on conflict (user_id, session_id) do nothing;`);
push('');

fs.writeFileSync('db/seed.sql', L.join('\n') + '\n');
console.log('db/seed.sql généré :', L.length, 'lignes,', fs.statSync('db/seed.sql').size, 'octets');
console.log('  cours:', d.COURS.length, '| leçons:', lessons.length, '(' + doneLessons.length + ' terminées) | vidéos:', d.VIDEOS.length,
            '| quiz:', quizzes.length, '| questions:', questions.length, '| options:', options.length,
            '| devoirs:', d.DEVOIRS.length, '| séances:', d.SESS.length, '| badges:', d.BADGES_DEF.length, '| messages:', msgs.length);
