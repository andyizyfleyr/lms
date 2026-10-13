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


-- ============================================================
-- V3 : données par compte, codes promo, séances en direct
-- (idempotent : peut être relancé sans casser la base)
-- ============================================================

-- Données libres et propres à chaque compte (recettes, lots de production,
-- révision espacée, objectifs, parcours, file hors-ligne…). Une ligne par
-- clé, valeur JSON : un seul point de passage, aucune table à multiplier.
create table if not exists user_data (
  user_id    uuid not null references users(id) on delete cascade,
  cle        text not null,
  valeur     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, cle)
);

-- Codes promo / accès offerts créés par un formateur ou un administrateur.
create table if not exists codes_promo (
  code            text primary key,
  libelle         text not null default '',
  genre           text not null default 'reduction',   -- reduction | acces
  valeur          int  not null default 0,             -- % de réduction
  course_id       text references courses(id) on delete cascade,
  utilisations_max int not null default 0,             -- 0 = illimité
  utilisations    int  not null default 0,
  expire_le       timestamptz,
  actif           boolean not null default true,
  cree_par        uuid references users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists code_utilisations (
  code       text not null references codes_promo(code) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  order_id   uuid,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);

-- Cours : prix affiché, brouillon/publié, auteur (création par un formateur).
alter table courses add column if not exists prix int not null default 0;
alter table courses add column if not exists publie boolean not null default true;
alter table courses add column if not exists cree_par uuid references users(id) on delete set null;
alter table courses add column if not exists updated_at timestamptz not null default now();

-- Commandes : contenu de la commande (cours du panier, code promo appliqué, réduction).
alter table orders add column if not exists meta jsonb not null default '{}'::jsonb;

-- Codes de parrainage : qui a créé le code (pour le remercier quand il sert).
alter table codes_promo add column if not exists parrain uuid references users(id) on delete set null;

-- Banque de questions : les questions écrites par les formateurs, réutilisables
-- dans les quiz (tirage aléatoire, entraînement) et dans les fiches de révision.
create table if not exists question_bank (
  id         uuid primary key default gen_random_uuid(),
  course_id  text references courses(id) on delete cascade,
  theme      text not null default '',
  type       text not null default 'simple',        -- simple | multiple | vraifaux
  question   text not null,
  options    jsonb not null default '[]'::jsonb,
  bonnes     jsonb not null default '[]'::jsonb,    -- indices des bonnes réponses
  explication text not null default '',
  difficulte int not null default 2,                -- 1 facile → 3 difficile
  cree_par   uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Séances en direct : lien de visioconférence et émargement.
alter table calendar_sessions add column if not exists lien text not null default '';
alter table calendar_sessions add column if not exists enligne boolean not null default false;

-- Notation assistée : commentaire type laissé avec la note.
alter table submissions add column if not exists commentaire_type text not null default '';

/* ============================================================
   V4 — communauté · produit vendu · enseignement · fidélité ·
   exploitation · boutique PDF
   Ces tables existaient déjà en base (brouillon V4) : elles sont
   recréées ici à l'identique pour qu'une base neuve soit complète,
   puis complétées de ce qui manquait. Tout est idempotent.
   ============================================================ */

-- ---------- G1 forum d'entraide ----------
create table if not exists forum_sujets (
  id         uuid primary key default gen_random_uuid(),
  course_id  text,
  theme      text not null default '',
  titre      text not null,
  question   text not null default '',
  auteur     uuid,
  epingle    boolean not null default false,
  resolu     boolean not null default false,
  vues       int not null default 0,
  masque     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forum_sujets_idx on forum_sujets(masque, created_at desc);

create table if not exists forum_reponses (
  id         uuid primary key default gen_random_uuid(),
  sujet_id   uuid not null,
  auteur     uuid,
  texte      text not null,
  utils      int not null default 0,
  masque     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists forum_reponses_sujet_idx on forum_reponses(sujet_id, created_at);

create table if not exists forum_votes (
  reponse_id uuid not null,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (reponse_id, user_id)
);

-- ---------- G2 galerie des réalisations ----------
create table if not exists galerie (
  id         uuid primary key default gen_random_uuid(),
  auteur     uuid,
  cours_id   text,
  titre      text not null,
  legende    text not null default '',
  photo      text not null default '',        -- image compressée (data URI)
  likes      int not null default 0,
  masque     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists galerie_idx on galerie(masque, created_at desc);

create table if not exists galerie_likes (
  photo_id   uuid not null,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

-- ---------- G3 ateliers & voisinage ----------
create table if not exists ateliers (
  id         uuid primary key default gen_random_uuid(),
  auteur     uuid,
  ville      text not null default '',
  titre      text not null,
  texte      text not null default '',
  quand      timestamptz,
  contact    text not null default '',
  masque     boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists atelier_participants (
  atelier    uuid not null,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  primary key (atelier, user_id)
);

-- ---------- G4 signalements & modération ----------
create table if not exists signalements (
  id         uuid primary key default gen_random_uuid(),
  cible      text not null,                    -- sujet | reponse | photo | produit | utilisateur
  cible_id   text not null,
  motif      text not null default '',
  details    text not null default '',
  par        uuid,
  etat       text not null default 'nouveau',  -- nouveau | traite | rejete
  traite_par uuid,
  traite_le  timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists signalements_idx on signalements(etat, created_at desc);

-- ---------- H1 produits vendus par l'élève ----------
create table if not exists produits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  recette     text not null default '',
  nom         text not null,
  categorie   text not null default '',
  prix        int not null default 0,
  contenance  text not null default '',
  lot         text not null default '',
  pao         text not null default '',
  responsable text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  inci        text not null default '',
  precautions text not null default '',
  photo       text not null default '',
  slug        text,
  publie      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists produits_slug_idx on produits(slug) where slug is not null;

-- ---------- H3 clients & commandes ----------
create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  nom        text not null,
  tel        text not null default '',
  ville      text not null default '',
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists commandes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  client_id  uuid,
  lignes     jsonb not null default '[]'::jsonb,
  statut     text not null default 'devis',    -- devis | envoye | paye | annule
  total      int not null default 0,
  devise     text not null default 'xof',
  echeance   date,
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commandes_idx on commandes(user_id, created_at desc);

-- ---------- I3 examens blancs ----------
create table if not exists examens (
  id           uuid primary key default gen_random_uuid(),
  course_id    text,
  titre        text not null,
  duree        int not null default 20,
  nb_questions int not null default 10,
  seuil        int not null default 60,
  cree_par     uuid,
  publie       boolean not null default true,
  created_at   timestamptz not null default now()
);
create table if not exists examen_tentatives (
  id         uuid primary key default gen_random_uuid(),
  examen_id  uuid not null,
  user_id    uuid not null,
  note       int not null default 0,
  sur        int not null default 20,
  detail     jsonb not null default '[]'::jsonb,
  duree_s    int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists examen_tentatives_idx on examen_tentatives(examen_id, created_at desc);

-- ---------- I4 émargement par code ----------
create table if not exists codes_seance (
  session_id text not null,
  code       text not null,
  expire_le  timestamptz not null,
  cree_par   uuid,
  created_at timestamptz not null default now(),
  primary key (session_id, code)
);
create table if not exists presences (
  id         uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id    uuid not null,
  cours_id   text default '',
  code       text default '',
  created_at timestamptz not null default now()
);
create unique index if not exists presences_idx on presences(session_id, user_id);

-- ---------- I6 co-formateurs ----------
create table if not exists co_formateurs (
  course_id  text not null,
  user_id    uuid not null,
  part       int not null default 50,
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

-- ---------- J1 points & J2 défis ----------
create table if not exists points (
  user_id uuid primary key,
  total   int not null default 0,
  maj     timestamptz not null default now()
);
create table if not exists points_journal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  points     int not null,
  motif      text not null default '',
  ref        text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists defis (
  id         uuid primary key default gen_random_uuid(),
  mois       text not null,
  titre      text not null,
  texte      text not null default '',
  cible      int not null default 20,
  unite      text not null default 'photos',
  created_at timestamptz not null default now()
);
create table if not exists defis_participations (
  defi_id  uuid not null,
  user_id  uuid not null,
  avance   int not null default 0,
  maj      timestamptz not null default now(),
  primary key (defi_id, user_id)
);

-- ---------- K2 code de secours & K3 journal de sécurité ----------
create table if not exists codes_secours (
  user_id    uuid primary key,
  empreinte  text not null,
  essais     int not null default 0,
  cree_le    timestamptz not null default now(),
  utilise_le timestamptz
);
create table if not exists journal_securite (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  type       text not null,
  detail     text not null default '',
  appareil   text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists journal_securite_idx on journal_securite(user_id, created_at desc);

-- ---------- K4 lots (traçabilité) ----------
create table if not exists lots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  produit_id uuid,
  numero     text not null,
  recette    text not null default '',
  quantite   int not null default 0,
  date_fab   date,
  controles  jsonb not null default '[]'::jsonb,
  observation text not null default '',
  slug       text,
  publie     boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists lots_slug_idx on lots(slug) where slug is not null;

-- ---------- K5 kits d'installation ----------
create table if not exists kits (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  description text not null default '',
  contenu     jsonb not null default '{}'::jsonb,
  cree_par    uuid,
  created_at  timestamptz not null default now()
);

-- ---------- Boutique : PDF de cours ----------
create table if not exists pdfs (
  id         text primary key,
  titre      text not null,
  sous_titre text not null default '',
  description text not null default '',
  sommaire   jsonb not null default '[]'::jsonb,
  pages      int not null default 12,
  prix       int not null default 0,
  gratuit    boolean not null default false,
  accent     text not null default 'purple',
  ico        text not null default 'book',
  couverture text not null default '',
  fichier    text not null default '',
  extrait    text not null default '',
  niv        text not null default 'Débutant',
  publie     boolean not null default true,
  ordre      int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pdf_acces (
  user_id  uuid not null,
  pdf_id   text not null,
  order_id uuid,
  source   text not null default 'achat',
  created_at timestamptz not null default now(),
  primary key (user_id, pdf_id)
);

-- ---------- compléments ----------
alter table users      add column if not exists moderateur boolean not null default false;
alter table users      add column if not exists bloque     boolean not null default false;
alter table ateliers   add column if not exists lieu       text not null default '';
alter table ateliers   add column if not exists places     int  not null default 6;
alter table ateliers   add column if not exists ferme      boolean not null default false;
alter table commandes  add column if not exists paye       int  not null default 0;
alter table commandes  add column if not exists moyen      text not null default '';
alter table lots       add column if not exists statut     text not null default 'ok';
alter table lots       add column if not exists prochain_controle date;
alter table pdfs       add column if not exists source     text not null default '';
alter table pdfs       add column if not exists genre      text not null default 'cours';

-- Le catalogue des PDF : modifiable ensuite depuis la console d'administration.
insert into pdfs (id, titre, sous_titre, description, sommaire, pages, prix, gratuit, accent, ico, couverture, extrait, niv, ordre, source, genre) values
  ('livre-c1', 'Savonnerie à froid', 'Le guide complet, du calcul de la soude à la découpe',
   'Le cours Savonnerie à froid mis en pages pour être imprimé : matière grasse, indice de saponification, surgraissage, trace, cure, découpe, erreurs de débutant et leurs solutions.',
   '["Pourquoi la saponification à froid","Choisir ses huiles et son beurre de karité","Calculer la soude : méthode pas à pas","Surgraissage : pourquoi et combien","La trace : reconnaître le bon moment","Moule, cure et découpe","Les 8 erreurs du débutant","Fiche recette de base"]'::jsonb,
   44, 3500, false, 'purple', 'flask', 'savon', 'Fabriquer un savon qui tient, sans se tromper de soude : le chapitre 3 détaille le calcul à partir de l''indice de saponification, avec un exemple complet à 1 kg d''huile d''olive.', 'Débutant', 1, 'c1', 'cours'),
  ('livre-c2', 'Gels douche & shampoings doux', 'Formuler des tensioactifs respectueux du cuir chevelu',
   'Le cours Gel douche mis en pages : choisir ses tensioactifs, viser le bon pH, épaissir sans casser, conserver, tester.',
   '["Les familles de tensioactifs","Le pH de la peau et du cheveu","Construire une base lavante","Épaissir : les bons couples","Conservation et sécurité","Tests d''usage et corrections"]'::jsonb,
   38, 3500, false, 'teal', 'droplet', 'gel', 'Un gel douche doux se joue sur deux choses : la douceur du tensioactif principal et un pH entre 4,5 et 5,5. Le chapitre 2 explique comment le mesurer et le corriger.', 'Intermédiaire', 2, 'c2', 'cours'),
  ('livre-c3', 'Crèmes de visage', 'Émulsions et actifs : réussir du premier coup',
   'Le cours Crème de visage mis en pages : phases, émulsifiants, actifs, texture, stabilité dans le temps.',
   '["Comprendre une émulsion","Phase aqueuse : hydrolats et gélifiants","Phase huileuse : huiles et beurres","Choisir son émulsifiant","Actifs : dosages utiles","Texture et toucher","Stabilité : tests simples"]'::jsonb,
   42, 3500, false, 'rose', 'flower', 'creme', 'Une émulsion qui se sépare vient presque toujours de la même cause : la phase grasse ajoutée trop vite, à la mauvaise température. Le chapitre 1 montre comment l''éviter.', 'Intermédiaire', 3, 'c3', 'cours'),
  ('livre-c4', 'Laits corporels & baumes au karité', 'Le karité au cœur de vos formules',
   'Le cours Lait corporel mis en pages, avec les fiches de baumes et tous les dosages utiles.',
   '["Le beurre de karité : qualité et dosage","Lait corporel fluide","Baume nourrissant","Huiles de massage","Parfumer sans irriter","Conservation"]'::jsonb,
   36, 3500, false, 'amber', 'leaf', 'karite', 'Un lait corporel réussi tient à deux chiffres : la part de phase grasse et le taux d''émulsifiant. Le chapitre 2 donne les repères, du plus fluide au plus riche.', 'Débutant', 4, 'c4', 'cours'),
  ('livre-c5', 'Cosmétique africaine', 'Karité, argiles, huiles : les matières du continent',
   'Le cours Cosmétique africaine mis en pages : argiles, huiles, poudres, synergies et précautions.',
   '["Les argiles et leurs usages","Huiles de baobab, dattier, moringa","Poudres et plantes","Dosages et synergies","Précautions et contre-indications","Trois formules signature"]'::jsonb,
   40, 3500, false, 'green', 'leaf', 'argile', 'Chaque argile a son usage : la verte pour les peaux grasses, la blanche pour les peaux réactives. Le chapitre 1 les classe et donne les dosages par type de peau.', 'Débutant', 5, 'c5', 'cours'),
  ('livre-c6', 'Étiquetage, sécurité & vente', 'Ce qu''une étiquette doit porter, ce que la loi demande',
   'Le cours Étiquetage mis en pages : mentions obligatoires, INCI, PAO, tests de stabilité et mise en vente.',
   '["Les mentions obligatoires","La liste INCI sans se tromper","PAO et date de fabrication","Tests de stabilité","Allégations : ce qu''il ne faut pas écrire","Mettre son produit en vente"]'::jsonb,
   34, 3000, false, 'indigo', 'tag', 'etiquette', 'Une étiquette conforme se vérifie en dix points. Le chapitre 1 les liste dans l''ordre, avec un exemple d''étiquette complète commentée.', 'Débutant', 6, 'c6', 'cours'),
  ('recueil-recettes', 'Recueil de recettes', '24 formules complètes, prêtes à refaire',
   'Toutes les recettes du site réunies : savons, crèmes, gels, baumes, masques à l''argile — pourcentages, mode opératoire, coût et prix conseillé.',
   '["Savons (6 recettes)","Crèmes et laits (5)","Gels douche et shampoings (4)","Baumes et huiles (4)","Masques et argiles (3)","Conservation et étiquetage","Tableau des coûts"]'::jsonb,
   52, 4500, false, 'purple', 'book', 'recettes', 'Chaque recette est donnée en pourcentages pour pouvoir la refaire à n''importe quelle quantité, avec le calcul du coût unitaire déjà fait.', 'Tous niveaux', 7, 'recettes', 'recueil'),
  ('guide-prix', 'Fixer ses prix et gagner de l''argent', 'Coût de revient, marge et prix juste en francs CFA',
   'Le guide du calcul : ingrédients, emballage, étiquette, main d''œuvre, électricité, pertes, frais de vente, seuil de rentabilité — exemples chiffrés en F CFA.',
   '["Ce qu''on oublie toujours de compter","Coût matière par unité","Emballage et étiquette","Main d''œuvre et temps réel","Pertes et ratés","Charges fixes par unité","Marge et prix de vente","Seuil de rentabilité"]'::jsonb,
   26, 2500, false, 'amber', 'card', 'prix', 'Neuf produits sur dix sont vendus à perte parce que trois postes ne sont jamais comptés : l''emballage, l''étiquette et le temps. Le chapitre 1 les remet dans le calcul.', 'Tous niveaux', 8, 'guide-prix', 'guide')
on conflict (id) do nothing;

-- Défi du mois en cours (s'il n'existe pas encore pour ce mois).
insert into defis (mois, titre, texte, cible, unite)
select to_char(now(), 'YYYY-MM'), 'Le défi du mois : 20 réalisations',
       'Fabriquez et partagez 20 réalisations dans la galerie ce mois-ci. Chaque photo compte, même imparfaite : c''est comme ça qu''on progresse.',
       20, 'photos'
where not exists (select 1 from defis where mois = to_char(now(), 'YYYY-MM'));
