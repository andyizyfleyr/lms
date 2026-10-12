-- ============================================================
-- CosmétiLab — schéma PostgreSQL (Neon)
-- Idempotent : peut être relancé sans casser la base.
-- ============================================================
create extension if not exists pgcrypto;

-- ---------------------------------------------------------- utilisateurs
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  nom           text not null,
  role          text not null default 'etudiant',   -- etudiant | enseignant | admin
  tel           text default '',
  ville         text default '',
  promo         text default '',
  bio           text default '',
  objectif_semaine_h int not null default 8,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists auth_tokens (
  token      text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  device     text default '',
  user_agent text default '',
  ip         text default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists auth_tokens_user_idx on auth_tokens(user_id);

-- ---------------------------------------------------------- catalogue
create table if not exists courses (
  id           text primary key,
  titre        text not null,
  categorie    text not null,
  prof         text not null,
  image_key    text default '',
  accent       text default 'purple',
  ico          text default 'code',
  statut       text default 'encours',
  duree_label  text default '',
  total_lecons int  not null default 0,
  description  text default '',
  created_at   timestamptz not null default now()
);

create table if not exists lessons (
  id           text primary key,
  course_id    text not null references courses(id) on delete cascade,
  module_titre text not null,
  module_ordre int  not null default 1,
  ordre        int  not null default 1,
  titre        text not null,
  duree_label  text default '',
  kind         text default 'lecture',      -- lecture | video | quiz | exercice
  video_id     text default '',
  created_at   timestamptz not null default now()
);
create index if not exists lessons_course_idx on lessons(course_id, module_ordre, ordre);

create table if not exists resources (
  id        text primary key,
  course_id text not null references courses(id) on delete cascade,
  ordre     int  not null default 1,
  titre     text not null,
  type_label text default '',
  ico       text default 'task',
  accent    text default 'purple',
  url       text default ''
);
create index if not exists resources_course_idx on resources(course_id, ordre);

create table if not exists videos (
  id        text primary key,               -- identifiant YouTube
  course_id text references courses(id) on delete set null,
  titre     text not null,
  chaine    text default '',
  duree_s   int  not null default 0,
  vues      int  not null default 0,
  image_key text default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------- progression
create table if not exists enrollments (
  user_id    uuid not null references users(id) on delete cascade,
  course_id  text not null references courses(id) on delete cascade,
  progress   int  not null default 0,
  favori     boolean not null default false,
  statut     text default 'encours',
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists lesson_progress (
  user_id    uuid not null references users(id) on delete cascade,
  lesson_id  text not null references lessons(id) on delete cascade,
  done       boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists video_state (
  user_id    uuid not null references users(id) on delete cascade,
  video_id   text not null references videos(id) on delete cascade,
  progress   int  not null default 0,
  liked      boolean not null default false,
  saved      boolean not null default false,
  position_s int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists activity (
  user_id uuid not null references users(id) on delete cascade,
  jour    date not null,
  minutes int  not null default 0,
  lecons  int  not null default 0,
  primary key (user_id, jour)
);

-- ---------------------------------------------------------- quiz
create table if not exists quizzes (
  id        text primary key,
  course_id text not null references courses(id) on delete cascade,
  titre     text not null,
  duree_s   int  not null default 600,
  note_min  int  not null default 50
);

create table if not exists quiz_questions (
  id          text primary key,
  quiz_id     text not null references quizzes(id) on delete cascade,
  ordre       int  not null default 1,
  enonce      text not null,
  explication text default ''
);
create index if not exists quiz_questions_quiz_idx on quiz_questions(quiz_id, ordre);

create table if not exists quiz_options (
  id          text primary key,
  question_id text not null references quiz_questions(id) on delete cascade,
  ordre       int  not null default 1,
  texte       text not null,
  correct     boolean not null default false
);
create index if not exists quiz_options_q_idx on quiz_options(question_id, ordre);

create table if not exists quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  quiz_id    text not null references quizzes(id) on delete cascade,
  score      int  not null default 0,
  total      int  not null default 0,
  note_pct   int  not null default 0,
  duree_s    int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_idx on quiz_attempts(user_id, created_at desc);

create table if not exists quiz_answers (
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  question_id text not null references quiz_questions(id) on delete cascade,
  option_id   text,
  correct     boolean not null default false,
  primary key (attempt_id, question_id)
);

-- ---------------------------------------------------------- devoirs
create table if not exists assignments (
  id             text primary key,
  course_id      text not null references courses(id) on delete cascade,
  titre          text not null,
  type           text default 'Devoir',
  points         int  not null default 20,
  echeance_label text default '',
  niveau         text default 'normal',      -- urgent | normal | calme
  consignes      jsonb not null default '[]'::jsonb,
  quiz_id        text references quizzes(id) on delete set null
);

create table if not exists submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id text not null references assignments(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  statut        text not null default 'depose',   -- depose | rendu | note
  note          int,
  commentaire   text default '',
  lien          text default '',
  fichier_nom   text default '',
  fichier_type  text default '',
  fichier_taille int default 0,
  fichier_data  text default '',                  -- contenu base64 (≤ 2 Mo conseillé)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists submissions_user_idx on submissions(user_id, created_at desc);
create index if not exists submissions_assignment_idx on submissions(assignment_id);

-- ---------------------------------------------------------- notes, discussion
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  course_id  text references courses(id) on delete cascade,
  lesson_id  text default '',
  titre      text not null default '',
  contenu    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_idx on notes(user_id, updated_at desc);

create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  course_id  text not null references courses(id) on delete cascade,
  user_id    uuid references users(id) on delete set null,
  auteur     text not null,
  role       text default 'etudiant',        -- etudiant | prof
  contenu    text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_course_idx on messages(course_id, created_at);

-- ---------------------------------------------------------- notifications
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,   -- null = pour tout le monde
  titre      text not null,
  texte      text default '',
  ico        text default 'bell',
  kind       text default '',                -- telechargements | badges | aide | session | quiz | devoir
  ref_id     text default '',
  lu         boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

-- ---------------------------------------------------------- agenda
create table if not exists calendar_sessions (
  id           text primary key,
  jour_semaine int  not null default 0,      -- 0 = lundi
  date_session date,
  heure        text default '09:00',
  titre        text not null,
  type         text default 'Cours',
  duree_label  text default '1 h',
  salle        text default '',
  course_id    text references courses(id) on delete set null,
  prof         text default '',
  tags         jsonb not null default '[]'::jsonb,
  accent       text default 'purple',
  ico          text default 'video',
  description  text default ''
);

create table if not exists session_reminders (
  user_id    uuid not null references users(id) on delete cascade,
  session_id text not null references calendar_sessions(id) on delete cascade,
  actif      boolean not null default true,
  minutes_avant int not null default 15,
  primary key (user_id, session_id)
);

-- ---------------------------------------------------------- badges
create table if not exists badges (
  id          text primary key,
  nom         text not null,
  ico         text default 'star',
  accent      text default 'purple',
  description text default '',
  cible       int  not null default 1
);

create table if not exists user_badges (
  user_id    uuid not null references users(id) on delete cascade,
  badge_id   text not null references badges(id) on delete cascade,
  obtenu_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------------------------------------------------------- réglages, téléchargements
create table if not exists settings (
  user_id             uuid primary key references users(id) on delete cascade,
  theme               text not null default 'clair',     -- clair | sombre
  langue              text not null default 'fr',
  notifications_email boolean not null default true,
  notifications_push  boolean not null default true,
  rappels_sessions    boolean not null default true,
  donnees_mobiles     boolean not null default false,
  avatar              text not null default '',          -- avatar choisi (suit le compte)
  updated_at          timestamptz not null default now()
);

create table if not exists downloads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  resource_id  text references resources(id) on delete set null,
  course_id    text references courses(id) on delete cascade,
  titre        text not null,
  taille_label text default '',
  etat         text not null default 'dl',    -- dl | ok | pause
  progres      int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists downloads_user_idx on downloads(user_id, created_at desc);

-- ---------------------------------------------------------- paiements (NOVA Checkout)
-- Chaque commande suit une session NOVA : ouverte → payée / annulée / expirée.
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  type            text not null,                        -- cours | abonnement
  course_id       text references courses(id) on delete set null,
  plan_id         text,
  amount          int  not null,
  currency        text not null default 'xof',
  description     text not null,
  status          text not null default 'open',         -- open | paid | cancelled | expired | failed
  nova_session_id text unique,
  nova_reference  text,
  method          text,
  paid_at         timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_user_idx   on orders(user_id, created_at desc);
create index if not exists orders_statut_idx on orders(status, created_at desc);

-- Accès débloqués : un cours par ligne (achat à l'unité, abonnement, offre commerciale).
create table if not exists course_access (
  user_id    uuid not null references users(id) on delete cascade,
  course_id  text not null references courses(id) on delete cascade,
  source     text not null default 'achat',             -- achat | abonnement | offre
  order_id   uuid references orders(id) on delete set null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,                               -- null = définitif
  primary key (user_id, course_id)
);

-- Abonnement en cours (NOVA v1 n'effectue pas de prélèvement récurrent :
-- l'abonnement est une période payée, que le client renouvelle).
create table if not exists subscriptions (
  user_id            uuid primary key references users(id) on delete cascade,
  plan_id            text not null,
  statut             text not null default 'actif',     -- actif | expire
  started_at         timestamptz not null default now(),
  current_period_end timestamptz not null,
  order_id           uuid references orders(id) on delete set null,
  renewed_count      int not null default 0,
  updated_at         timestamptz not null default now()
);

-- Journal des évènements NOVA reçus (idempotence des webhooks).
create table if not exists payment_events (
  id          text primary key,                         -- evt_…
  type        text not null,
  order_id    uuid references orders(id) on delete set null,
  payload     jsonb,
  received_at timestamptz not null default now()
);
