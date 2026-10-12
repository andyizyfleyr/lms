;

const COURS = [
  {id:'c1', titre:'Développement Web Full-Stack', cat:'Développement', prof:'M. Kouassi', lecon:12, total:24, prog:62, ico:'code',     img:'code',      acc:'purple', statut:'encours', fav:true,  duree:'12 min'},
  {id:'c2', titre:'UI/UX Design & Material 3',    cat:'Design',       prof:'Mme Adjovi',  lecon:8,  total:18, prog:44, ico:'layers',   img:'design',    acc:'blue',   statut:'encours', fav:true,  duree:'25 min'},
  {id:'c3', titre:'Data Science avec Python',     cat:'Data',         prof:'Dr. Bio',     lecon:15, total:20, prog:75, ico:'chart',    img:'data',      acc:'green',  statut:'encours', fav:false, duree:'18 min'},
  {id:'c4', titre:'Marketing Digital & Réseaux',  cat:'Business',     prof:'M. Tossou',   lecon:4,  total:16, prog:25, ico:'bullhorn', img:'marketing', acc:'amber',  statut:'encours', fav:false, duree:'9 min'},
  {id:'c5', titre:'Anglais professionnel B2',     cat:'Langues',      prof:'Ms. Clark',   lecon:20, total:20, prog:100,ico:'globe',    img:'anglais',   acc:'pink',   statut:'termine', fav:true,  duree:'—'},
  {id:'c6', titre:'Cybersécurité — Fondamentaux', cat:'Sécurité',     prof:'M. Sanni',    lecon:0,  total:12, prog:0,  ico:'shield',   img:'cyber',     acc:'teal',   statut:'avenir',  fav:false, duree:'30 min'}
];

/* ============================================================
   TUTORIELS YOUTUBE — ID, durées, vues et chaînes vérifiés
   (API oEmbed + pages publiques YouTube)
   ============================================================ */
const VIDEOS = [
  {yt:'5IcZPL-zJYc', cours:'c4', titre:'Formation Marketing Digital : le cours complet',       chaine:'Ludo Salenne',              duree:6371,  vues:853817, img:'marketing', prog:0},
  {yt:'VLr0mTzYfRE', cours:'c6', titre:'Cybersécurité : guide complet pour démarrer',           chaine:'Techno',                    duree:1057,  vues:503575, img:'cyber',     prog:0},
  {yt:'iyoXejosxGg', cours:'c5', titre:'Learn Business English — conversation & vocabulary',    chaine:'Shaw English Online',       duree:6325,  vues:411346, img:'anglais',   prog:100},
  {yt:'zZkNOdBWgFQ', cours:'c3', titre:'Pandas Python — introduction et analyse du Titanic',    chaine:'Machine Learnia',           duree:1049,  vues:296829, img:'data',      prog:70},
  {yt:'h_JYW2hdI8U', cours:'c2', titre:'Everything you need to know about Material Design 3',  chaine:'Stevdza-San',               duree:1465,  vues:134508, img:'design',    prog:0},
  {yt:'7nrhTdS7dHg', cours:'c2', titre:'Material 3 : du design au déploiement',                 chaine:'Flutter',                   duree:970,   vues:106907, img:'design',    prog:0},
  {yt:'syb15o27GEE', cours:'c6', titre:'Débuter le hacking éthique et la cybersécurité',        chaine:'Fransosiche',               duree:1214,  vues:63762,  img:'cyber',     prog:0},
  {yt:'agj8_3xpuYI', cours:'c1', titre:'Les bases de JavaScript — tuto débutant',               chaine:'Bertrand . Tech',           duree:3754,  vues:44254,  img:'code',      prog:12},
  {yt:'LwkWwxg10IU', cours:'c3', titre:'Python, NumPy et Pandas pour la Data Science',          chaine:'J.A DATATECH CONSULTING',   duree:21916, vues:40411,  img:'data',      prog:0},
  {yt:'asN3B33wOzo', cours:'c2', titre:'Prototyper un FAB Material 3 sur Figma',                chaine:'The indieDev',              duree:1409,  vues:19967,  img:'design',    prog:0},
  {yt:'ldxt9FNUc50', cours:'c1', titre:'Apprendre JavaScript en 1 h — cours complet débutant',  chaine:'Comment Coder',             duree:3740,  vues:12304,  img:'code',      prog:45},
  {yt:'vzIEBqBexf4', cours:'c5', titre:"18 mots d'anglais des affaires à connaître",            chaine:'Anglais Avec un Anglophone',duree:1247,  vues:9927,   img:'anglais',   prog:0},
  {yt:'3WFYTiHi5TU', cours:'c4', titre:'Construire une stratégie réseaux sociaux en 7 étapes',  chaine:'Metricool en français',     duree:531,   vues:2919,   img:'marketing', prog:30}
];

const ECHEANCES = [
  {titre:'Quiz — Les composants Material 3', cours:'UI/UX Design & Material 3', quand:"Aujourd'hui", heure:'18:00', niveau:'urgent', ico:'task', acc:'purple', offset:0},
  {titre:'Projet — Portfolio responsive',    cours:'Développement Web Full-Stack', quand:'Demain', heure:'23:59', niveau:'soon', ico:'upload', acc:'blue', offset:1},
  {titre:'Devoir — Régression linéaire',     cours:'Data Science avec Python', quand:'Vendredi', heure:'12:00', niveau:'normal', ico:'chart', acc:'green', offset:4}
];

const SESSIONS = [
  {jour:0, heure:'09:00', titre:'Live — Composants Material 3', type:'Visioconférence', duree:'1 h 30', salle:'Salle virtuelle A', tags:['Live','UI/UX'], acc:'purple', ico:'video'},
  {jour:0, heure:'14:00', titre:'Atelier — Maquette responsive', type:'Présentiel', duree:'2 h', salle:'Amphi 2 · Calavi', tags:['Atelier'], acc:'blue', ico:'grid'},
  {jour:1, heure:'10:30', titre:'Cours — Hooks React avancés', type:'Live', duree:'1 h', salle:'Salle virtuelle B', tags:['Dev','React'], acc:'green', ico:'code'},
  {jour:2, heure:'16:00', titre:'Tutorat Data Science', type:'Tutorat', duree:'45 min', salle:'Visio individuelle', tags:['Tutorat'], acc:'amber', ico:'chart'},
  {jour:4, heure:'11:00', titre:'Examen blanc — Anglais B2', type:'Évaluation', duree:'2 h', salle:"Centre d'examen", tags:['Examen'], acc:'pink', ico:'globe'},
  {jour:6, heure:'18:30', titre:'Q&A communauté LearnHub', type:'Discussion', duree:'1 h', salle:'Discord LearnHub', tags:['Communauté'], acc:'teal', ico:'chat'}
];

const BADGES = [
  {nom:'Marathonien', desc:"7 jours d'affilée", ico:'fire',   acc:'amber',  obt:true},
  {nom:'Perfectionniste', desc:'5 quiz parfaits', ico:'star',   acc:'blue',   obt:true},
  {nom:'Assidu', desc:'20 leçons ce mois', ico:'school', acc:'green',  obt:false},
  {nom:'Mentor', desc:'10 réponses forum', ico:'chat',   acc:'purple', obt:false}
];

const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS  = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

/* ============================================================
   HELPERS
   ============================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const today = new Date();
const addDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
const labelJour = d => `${JOURS[d.getDay()]} ${d.getDate()}`;

/* ---------- Utilitaires médias ---------- */
const coursById = id => COURS.find(c => c.id === id);
function fmtDur(s){
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}` : `${m}:${String(x).padStart(2,'0')}`;
}
function fmtViews(n){
  return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M'
       : n >= 1e3 ? Math.round(n / 1e3) + ' k' : String(n);
}
/* Posters embarqués en base64 : <img data-img="code"> */
function hydrate(root = document){
  $$('[data-img]', root).forEach(el => {
    const src = IMG[el.dataset.img];
    if (src && !el.getAttribute('src')) el.setAttribute('src', src);
  });
}
/* localStorage tolérant : l'aperçu Arena tourne en origine opaque */
const store = {
  get(k, d){ try { const v = localStorage.getItem('lh_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem('lh_' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- Snackbar ---------- */
let snackTimer;
function toast(msg){
  const bar = $('#snackbar');
  $('#snackbarText').textContent = msg;
  bar.classList.add('is-open');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => bar.classList.remove('is-open'), 3200);
}
$('#snackbarAction').addEventListener('click', () => {
  clearTimeout(snackTimer);
  $('#snackbar').classList.remove('is-open');
});

/* ---------- Ripple Material 3 ---------- */
document.addEventListener('pointerdown', e => {
  const host = e.target.closest('.ripple');
  if (!host) return;
  const r = host.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.4;
  const ink = document.createElement('span');
  ink.className = 'ripple__ink';
  ink.style.width = ink.style.height = size + 'px';
  ink.style.left = (e.clientX - r.left) + 'px';
  ink.style.top  = (e.clientY - r.top) + 'px';
  host.appendChild(ink);
  setTimeout(() => ink.remove(), 650);
}, {passive:true});

/* ---------- Thème clair / sombre ---------- */
function setTheme(dark){
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  $('#themeIcon').innerHTML = `<use href="${dark ? '#ic-sun' : '#ic-moon'}"/>`;
  const sw = $('[data-switch="dark"] .switch');
  if (sw) sw.setAttribute('aria-checked', String(dark));
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#141218' : '#6750A4');
}
$('#themeBtn').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  setTheme(dark);
  toast(dark ? 'Thème sombre activé' : 'Thème clair activé');
});

/* ---------- Salutation ---------- */
(function greet(){
  const h = new Date().getHours();
  $('#greeting').textContent = h < 12 ? 'Bonjour 👋' : h < 18 ? 'Bon après-midi 👋' : 'Bonsoir 👋';
})();

/* ============================================================
   CARTES DE COURS (horizontales, avec visuel)
   ============================================================ */
function hcardHTML(c){
  return `<article class="hcard ripple" data-toast="${esc(c.titre)}">
    <div class="hcard__thumb thumb">
      <img data-img="${c.img}" alt="Visuel du cours ${esc(c.titre)}">
      <span class="thumb__shade"></span>
      <span class="hcard__cat">${esc(c.cat).toUpperCase()}</span>
      <span class="hcard__play"><svg class="icon"><use href="#ic-play"/></svg></span>
    </div>
    <div class="hcard__body">
      <h3>${esc(c.titre)}</h3>
      <div class="hcard__meta">
        <span>Leçon ${c.lecon}/${c.total}</span>
        <span class="prog-label">${c.prog} %</span>
      </div>
      <div class="lp lp--sm" role="progressbar" aria-valuenow="${c.prog}" aria-valuemin="0" aria-valuemax="100">
        <div class="lp__track"></div>
        <div class="lp__bar" data-prog="${c.prog}"></div>
        <div class="lp__stop"></div>
      </div>
    </div>
  </article>`;
}
const hscrollBox = $('#hscroll');
hscrollBox.innerHTML = COURS.filter(c => c.statut === 'encours').map(hcardHTML).join('');
hydrate(hscrollBox);
animateProgress(hscrollBox);

/* ============================================================
   ÉCHÉANCES
   ============================================================ */
function deadlineHTML(e){
  const label = e.niveau === 'urgent' ? 'URGENT' : e.niveau === 'soon' ? 'BIENTÔT' : 'CETTE SEMAINE';
  const cls   = e.niveau === 'urgent' ? 'urgent' : e.niveau === 'soon' ? 'soon' : 'normal';
  return `<button class="deadline ripple" data-toast="Ouverture : ${esc(e.titre)}">
    <span class="deadline__ico acc-${e.acc}"><svg class="icon icon--20"><use href="#ic-${e.ico}"/></svg></span>
    <span class="deadline__main">
      <h3>${esc(e.titre)}</h3>
      <p>${esc(e.cours)} · ${esc(e.heure)}</p>
    </span>
    <span class="pill pill--${cls}">${label}</span>
  </button>`;
}
$('#deadlines').innerHTML = ECHEANCES.map(deadlineHTML).join('');

/* ============================================================
   LISTE DES COURS + FILTRES + RECHERCHE
   ============================================================ */
function courseRowHTML(c){
  return `<button class="course-card ripple" data-toast="Ouverture du cours : ${esc(c.titre)}">
    <span class="course-card__thumb thumb">
      <img data-img="${c.img}" alt="">
      <span class="thumb__shade"></span>
    </span>
    <span class="course-card__main">
      <h3>${esc(c.titre)}</h3>
      <p>${esc(c.prof)} · ${c.lecon}/${c.total} leçons</p>
      <span class="course-card__row">
        <span class="lp" role="progressbar" aria-valuenow="${c.prog}" aria-valuemin="0" aria-valuemax="100">
          <span class="lp__track"></span><span class="lp__bar" data-prog="${c.prog}"></span><span class="lp__stop"></span>
        </span>
        <b>${c.prog} %</b>
      </span>
    </span>
    <span class="course-card__more"><svg class="icon icon--18"><use href="#ic-more"/></svg></span>
  </button>`;
}
function renderCourses(filter = 'tous', query = ''){
  const q = query.trim().toLowerCase();
  let list = COURS.filter(c => filter === 'tous' ? true : filter === 'favoris' ? c.fav : c.statut === filter);
  if (q) list = list.filter(c => (c.titre + ' ' + c.cat + ' ' + c.prof).toLowerCase().includes(q));
  const box = $('#courseList');
  box.innerHTML = list.length
    ? list.map(courseRowHTML).join('')
    : `<div class="empty">
         <span class="empty__ico"><svg class="icon icon--28"><use href="#ic-search"/></svg></span>
         <p class="title-medium">Aucun cours trouvé</p>
         <p class="body-small">Essayez un autre mot-clé ou un autre filtre.</p>
       </div>`;
  $('#coursesCount').textContent = list.length + ' cours';
  animateProgress(box);
  hydrate(box);
  renderVideoList(filter, query);
}

let vidFilter = 'tous';
$('#courseFilters').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('#courseFilters .chip').forEach(c => {
    const on = c === chip;
    c.classList.toggle('is-selected', on);
    c.setAttribute('aria-selected', String(on));
  });
  vidFilter = chip.dataset.filter;
  renderCourses(chip.dataset.filter, $('#searchInput').value);
  renderVideoScroll();
});
renderCourses();
hydrate();
animateProgress($('#view-accueil'));

/* ============================================================
   TUTORIELS VIDÉO — cartes, lignes, filtres
   ============================================================ */
function videoMatches(v, filter, q){
  const c = coursById(v.cours) || {};
  const okF = filter === 'tous' || filter === v.cours
             || (filter === 'favoris' && c.fav)
             || (filter === 'termine' && v.prog === 100)
             || (filter === 'encours' && v.prog > 0 && v.prog < 100);
  if (!okF) return false;
  if (!q) return true;
  return (v.titre + ' ' + v.chaine + ' ' + (c.titre || '')).toLowerCase().includes(q);
}
function vcardHTML(v){
  const c = coursById(v.cours) || {};
  return `<article class="vcard ripple" data-video="${v.yt}" role="button" tabindex="0" aria-label="Lire : ${esc(v.titre)}">
    <div class="vcard__poster">
      <img data-img="${v.img}" alt="">
      <span class="vcard__shade"></span>
      <span class="vcard__play"><svg class="icon"><use href="#ic-play"/></svg></span>
      <span class="yt-badge vcard__flip"><svg class="icon"><use href="#ic-ytplay"/></svg>YT</span>
      <span class="vcard__dur">${fmtDur(v.duree)}</span>
      <span class="vcard__seen"><b data-prog="${v.prog}"></b></span>
    </div>
    <div class="vcard__body">
      <h3>${esc(v.titre)}</h3>
      <div class="vcard__meta">
        <span>${esc(v.chaine)} · ${fmtViews(v.vues)} vues</span>
        <span class="icon-btn" style="width:24px;height:24px"><svg class="icon icon--18"><use href="#ic-more"/></svg></span>
      </div>
      <p class="body-small muted" style="margin-top:4px">${esc(c.titre || '')}</p>
    </div>
  </article>`;
}
function vrowHTML(v){
  const c = coursById(v.cours) || {};
  const label = v.prog === 100 ? 'Terminée' : v.prog > 0 ? 'Reprendre' : 'Lecture';
  return `<button class="vrow ripple" data-video="${v.yt}">
    <span class="vrow__thumb">
      <img data-img="${v.img}" alt="">
      <span class="vcard__dur">${fmtDur(v.duree)}</span>
      <span class="vcard__seen"><b data-prog="${v.prog}"></b></span>
    </span>
    <span class="vrow__main">
      <h3>${esc(v.titre)}</h3>
      <p><svg class="icon icon--16"><use href="#ic-play"/></svg><b>${esc(v.chaine)} · ${fmtViews(v.vues)} vues</b></p>
      <p class="dim" style="margin-top:4px">${esc(c.titre || '')} · ${label}</p>
    </span>
    <span class="vrow__go"><svg class="icon icon--20"><use href="#ic-chevron"/></svg></span>
  </button>`;
}
function renderVideoScroll(){
  const box = $('#videoScroll');
  box.innerHTML = VIDEOS.filter(v => videoMatches(v, vidFilter, '')).slice(0, 8).map(vcardHTML).join('');
  hydrate(box);
  animateProgress(box);
}
function renderVideoList(filter = vidFilter, query = ''){
  const box = $('#videoList');
  const list = VIDEOS.filter(v => videoMatches(v, filter, query.trim().toLowerCase()));
  box.innerHTML = list.length ? list.map(vrowHTML).join('')
    : `<div class="empty">
         <span class="empty__ico"><svg class="icon icon--28"><use href="#ic-ytplay"/></svg></span>
         <p class="title-medium">Aucun tutoriel vidéo</p>
         <p class="body-small">Aucune vidéo ne correspond à cette recherche.</p>
       </div>`;
  $('#videosCount').textContent = list.length + ' vidéos';
  hydrate(box);
  animateProgress(box);
}
renderVideoScroll();
renderVideoList();
/* « Voir tout » des tutoriels : la bibliothèque vidéo est ouverte par le module APP CORE
   (on ne change plus la vue courante, sinon l'utilisateur se retrouve sur « Cours » après fermeture) */

/* ---------- Recherche (bascule sur la vue Cours) ---------- */
let searchTimer;
$('#searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = e.target.value;
    if (q.trim().length > 0 && currentView !== 'cours') setView('cours');
    renderCourses($('#courseFilters .chip.is-selected').dataset.filter, q);
  }, 160);
});

/* ============================================================
   AGENDA : semaine, timeline, devoirs
   ============================================================ */
(function buildWeek(){
  const dayIdx = (today.getDay() + 6) % 7;             // lundi = 0
  const strip = [], dots = [];
  for (let i = 0; i < 7; i++){
    const d = addDays(i - dayIdx);
    const hasEv = SESSIONS.some(s => s.jour === i);
    const isToday = i === dayIdx;
    strip.push(`<button class="ripple${isToday ? ' is-today is-active' : ''}${hasEv ? ' has-event' : ''}" data-day="${i}" aria-label="${d.toDateString()}">
        <span>${JOURS[d.getDay()]}</span><b>${d.getDate()}</b><i></i></button>`);
    dots.push(`<span class="day${i <= dayIdx ? ' is-done' : ''}${isToday ? ' is-today' : ''}"><span>${JOURS[d.getDay()][0]}</span><i></i></span>`);
  }
  $('#weekStrip').innerHTML = strip.join('');
  $('#weekDots').innerHTML  = dots.join('');

  $$('#weekStrip button').forEach(btn => btn.addEventListener('click', () => {
    $$('#weekStrip button').forEach(b => b.classList.toggle('is-active', b === btn));
    renderTimeline(Number(btn.dataset.day));
  }));
})();

function renderTimeline(jour = (today.getDay() + 6) % 7){
  const items = SESSIONS.filter(s => s.jour === jour);
  const d = addDays(jour - (today.getDay() + 6) % 7);
  $('#timeline').innerHTML = items.length ? items.map(s => `
    <div class="tl-item">
      <span class="tl-item__dot"></span>
      <div class="tl-item__time">${esc(s.heure)}</div>
      <button class="tl-card ripple" data-toast="Session : ${esc(s.titre)}">
        <h3>${esc(s.titre)}</h3>
        <div class="meta"><svg class="icon"><use href="#ic-${s.ico}"/></svg>${esc(s.type)} · ${esc(s.duree)} · ${esc(s.salle)}</div>
        <div class="tags">
          <span class="pill pill--normal">${esc(s.tags.join(' · '))}</span>
          <span class="pill pill--ok">Confirmé</span>
        </div>
      </button>
    </div>`).join('')
    : `<div class="empty">
         <span class="empty__ico"><svg class="icon icon--28"><use href="#ic-calendar"/></svg></span>
         <p class="title-medium">Journée libre</p>
         <p class="body-small">Aucune session le ${labelJour(d)}. Profitez-en pour réviser 🌿</p>
       </div>`;
}
renderTimeline();

$('#segView').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#segView button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  if (b.dataset.seg === 'mois'){
    $('#weekStrip').style.display = 'none';
    toast('Vue mensuelle : 4 sessions planifiées');
  } else {
    $('#weekStrip').style.display = '';
  }
});

$('#agendaTasks').innerHTML = ECHEANCES.map(e => {
  const d = addDays(e.offset);
  const quand = e.offset === 0 ? "Aujourd'hui" : e.offset === 1 ? 'Demain' : labelJour(d) + ' ' + MOIS[d.getMonth()];
  return `<button class="deadline ripple" data-toast="Devoir : ${esc(e.titre)}">
    <span class="deadline__ico acc-${e.acc}"><svg class="icon icon--20"><use href="#ic-${e.ico}"/></svg></span>
    <span class="deadline__main"><h3>${esc(e.titre)}</h3><p>${esc(e.cours)}</p></span>
    <span class="pill pill--${e.niveau === 'urgent' ? 'urgent' : e.niveau === 'soon' ? 'soon' : 'normal'}">${esc(quand)}</span>
  </button>`;
}).join('');

/* ---------- Badges ---------- */
$('#badges').innerHTML = BADGES.map(b => `
  <button class="badge-item ripple${b.obt ? '' : ' is-locked'}" data-toast="${b.obt ? 'Badge obtenu : ' : 'À débloquer : '}${esc(b.nom)}">
    <span class="badge-item__ico acc-${b.acc}"><svg class="icon"><use href="#ic-${b.ico}"/></svg></span>
    <span>${esc(b.nom)}</span>
  </button>`).join('');
$('#badges').addEventListener('click', e => {
  const b = e.target.closest('.badge-item');
  if (b && b.classList.contains('is-locked')) toast('Continuez pour débloquer ce badge 💪');
});

/* ============================================================
   LECTEUR VIDÉO YOUTUBE + MINI-LECTEUR
   ============================================================ */
const ytLink = id => 'https://www.youtube.com/watch?v=' + id;
const player = $('#player'), mini = $('#miniPlayer'), appEl = $('#app');
const MODULES = ['Introduction au module','Concepts fondamentaux','Démonstration guidée','Atelier pratique','Étude de cas','Évaluation du module'];

let curVid = null, ytPlayer = null, ytTimer = null, ytReady = false, ytFailed = false, ytPlaying = false;
let ytWatch = null, ytSawBuffer = false, ytForce = false;   // surveillance du démarrage réel de YouTube

/* état persistant : progression, j'aime, enregistrement */
const vstate = {};
(function initState(){
  const saved = store.get('videos', {});
  VIDEOS.forEach(v => {
    const s = saved[v.yt] || {};
    vstate[v.yt] = {prog: typeof s.prog === 'number' ? s.prog : v.prog, like: !!s.like, save: !!s.save};
    v.prog = vstate[v.yt].prog;
  });
})();
const persist = () => store.set('videos', vstate);
renderVideoScroll();
renderVideoList();

function toggleAct(sel, on){
  const el = $(sel);
  el.classList.toggle('is-on', on);
  el.setAttribute('aria-pressed', String(on));
}
function setMiniIcon(playing){
  ytPlaying = playing;
  $('#mpToggle').innerHTML = `<svg class="icon"><use href="#ic-${playing ? 'pause' : 'play'}"/></svg>`;
}
function updateMini(){
  if (!curVid) return;
  $('#mpPoster').src = IMG[curVid.img] || '';
  $('#mpTitle').textContent = curVid.titre;
  const p = Math.min(100, Math.round(vstate[curVid.yt].prog));
  $('#mpMeta').textContent = curVid.chaine + ' · ' + p + ' %';
  $('#mpBar').style.width = p + '%';
}
function renderModules(v){
  const c = coursById(v.cours) || {total:6};
  const total = Math.max(3, Math.min(6, c.total || 6));
  const p = vstate[v.yt].prog;
  const done = Math.round(total * p / 100);
  const cur = Math.min(total - 1, done);
  $('#playerModules').innerHTML = Array.from({length: total}, (_, i) => {
    const state = i < done ? 'is-done' : (i === cur && done < total) ? 'is-current' : '';
    return `<div class="pmod ${state}">
      <span class="pmod__n">${i < done ? '✓' : i + 1}</span>
      <span class="pmod__main">
        <h4>${MODULES[i]}</h4>
        <p>${i < done ? 'Terminé' : (i === cur && done < total) ? 'En cours' : 'À venir'} · ${Math.max(3, Math.round(v.duree / total / 60))} min</p>
      </span>
      <span class="pmod__n" style="visibility:${state ? 'visible' : 'hidden'}">
        <svg class="icon icon--16"><use href="#ic-${i < done ? 'check' : 'play'}"/></svg>
      </span>
    </div>`;
  }).join('');
}
function renderQueue(v){
  $('#playerQueue').innerHTML = VIDEOS.filter(x => x.yt !== v.yt).slice(0, 3).map(vrowHTML).join('');
  hydrate($('#playerQueue'));
  animateProgress($('#playerQueue'));
}

function openVideo(id){
  const v = VIDEOS.find(x => x.yt === id);
  if (!v) return false;
  curVid = v; ytFailed = false; ytReady = false;
  stopYt();
  hideLocal();
  setStatus(null);
  store.set('lastVideo', v.yt);

  $('#playerPoster').src = IMG[v.img] || '';
  $('#playerPoster').hidden = false;
  $('#playerPlay').hidden = false;
  $('#playerLoading').hidden = true;
  $('#playerDur').textContent = fmtDur(v.duree);
  $('#playerBarTitle').textContent = v.titre;
  $('#playerTitle').textContent = v.titre;
  $('#playerChan').textContent = v.chaine;
  $('#playerChanAvatar').textContent = (v.chaine.replace(/[^A-Za-zÀ-ÿ]/g, '')[0] || 'Y').toUpperCase();
  $('#playerStats').textContent = fmtViews(v.vues) + ' vues · ' + ((coursById(v.cours) || {}).titre || '');
  $('#playerYt').href = ytLink(v.yt);

  const st = vstate[v.yt];
  $('#watchPct').textContent = Math.round(st.prog) + ' %';
  $('#watchBar').style.width = st.prog + '%';
  $('#watchBarWrap').setAttribute('aria-valuenow', Math.round(st.prog));
  $('#watchInfo').textContent = st.prog >= 100
    ? 'Vidéo terminée — bien joué !'
    : st.prog > 0 ? `Reprise possible à ${fmtDur(v.duree * st.prog / 100)}` : 'Première lecture';
  toggleAct('#actLike', st.like);
  toggleAct('#actSave', st.save);

  renderModules(v);
  renderQueue(v);
  player.classList.add('is-open');
  $('#playerScroll').scrollTop = 0;
  updateMini();
  setMiniIcon(false);
  return true;
}

/* ------------------------------------------------------------------
   LECTURE : l'API IFrame YouTube n'est disponible qu'après le
   chargement asynchrone de widgetapi.js -> on attend réellement
   window.YT.Player (callback officiel + scrutation) avant de créer
   le lecteur, sinon « YT.Player is not a constructor ».
   ------------------------------------------------------------------ */
let ytApiPromise = null;
function loadYtApi(){
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    let settled = false, poll = null;
    const ok = () => { if (settled) return; settled = true; clearInterval(poll); resolve(window.YT); };
    const ko = m => { if (settled) return; settled = true; clearInterval(poll); ytApiPromise = null; reject(new Error(m)); };
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch (e) {} ok(); };
    if (!document.querySelector('script[data-ytapi]')){
      const sc = document.createElement('script');
      sc.src = 'https://www.youtube.com/iframe_api'; sc.async = true; sc.dataset.ytapi = '1';
      sc.onerror = () => ko('API YouTube injoignable (réseau)');
      document.head.appendChild(sc);
    }
    let tries = 0;
    poll = setInterval(() => {
      if (window.YT && window.YT.Player) ok();
      else if (++tries > 120) ko('API YouTube indisponible');
    }, 250);                                  // jusqu'à 30 s avant d'abandonner
  });
  return ytApiPromise;
}
function errText(code){
  return code === 101 || code === 150 || code === 153 ? 'intégration interdite'
       : code === 100 ? 'vidéo introuvable ou supprimée'
       : code === 2   ? 'identifiant vidéo invalide'
       : code === 5   ? 'lecteur HTML5 non pris en charge' : 'erreur de lecture YouTube';
}
function rndTime(){ return curVid ? Math.round((curVid.duree || 0) * vstate[curVid.yt].prog / 100) : 0; }

/* Lecteur local intégré : se lance quand YouTube n'est pas joignable (hors-ligne, aperçu sans réseau) */
/* les moteurs sans lecteur multimédia (tests, aperçus bridés) ne doivent pas lever d'erreur */
function mediaReady(v){ return !!(v && v.readyState > 0); }
function safePlay(v){ try { if (!v || v.paused === false) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
function safePause(v){ try { if (mediaReady(v) && !v.paused) v.pause(); } catch (e) {} }
function playLocal(msg){
  if (ytFailed) return;
  ytFailed = true;
  setMiniIcon(false);
  $('#playerLoading').hidden = true;
  $('#playerPlay').hidden = true;
  const v = vstate[curVid.yt];
  if (!v.prog || v.prog >= 100) v.prog = 0;
  const vid = $('#offlineVid');
  disposeYt();
  $('#playerPoster').hidden = true;
  setStatus(msg || 'Extrait intégré au site — lecture locale', true, hostileCtx() ? 'Essayer YouTube' : 'Réessayer');
  vid.hidden = false;
  vid.muted = true;
  try {
    vid.currentTime = rndTime() % Math.max(1, vid.duration || 24);
  } catch (e) {}
  const go = () => safePlay(vid);
  if (vid.readyState >= 2) go(); else vid.addEventListener('canplay', go, {once:true});
  toast('Lecture locale : extrait intégré au site');
}
function hideLocal(){
  const vid = $('#offlineVid');
  if (vid){ safePause(vid); vid.hidden = true; }
}
function setStatus(txt, retry, label){
  const box = $('#playerStatus'), lab = $('#playerStatusTxt'), rb = $('#playerRetry');
  if (!box) return;
  if (!txt){ box.hidden = true; if (rb) rb.hidden = true; return; }
  lab.textContent = txt;
  box.hidden = false;
  if (rb){ rb.hidden = !retry; if (label) rb.textContent = label; }
}
/* contextes où YouTube refuse de jouer : aperçu en iframe protégée (origine opaque) ou fichier ouvert en double-clic */
function hostileCtx(){
  try { return location.protocol === 'file:' || String(location.origin) === 'null'; } catch (e) { return false; }
}
/* on retire le lecteur YouTube quand il ne peut/veut pas jouer : il afficherait
   « Ce contenu est bloqué. Pour résoudre le problème, contactez le propriétaire du site. » */
function disposeYt(){
  clearInterval(ytWatch); ytWatch = null;
  ytSawBuffer = false; ytReady = false; ytPlaying = false;
  if (ytPlayer && ytPlayer.destroy){ try { ytPlayer.destroy(); } catch (e) {} }
  ytPlayer = null;
  const host = $('.yt-host'); if (host) host.remove();
  const ld = $('#playerLoading'); if (ld) ld.hidden = true;
}
/* le lecteur YouTube n'apparaît qu'une fois prêt : aucun message de blocage possible avant */
function ytReveal(){
  const host = $('.yt-host');
  if (host) host.style.visibility = 'visible';
  const p = $('#playerPoster'); if (p) p.hidden = true;
  const ld = $('#playerLoading'); if (ld) ld.hidden = true;
  if ($('#offlineVid') && !$('#offlineVid').hidden) hideLocal();   // YouTube prend le relais
}
function armWatchdog(v){
  clearInterval(ytWatch);
  const t0 = Date.now();
  ytWatch = setInterval(() => {
    if (ytFailed || !curVid || curVid.yt !== v.yt || !player.classList.contains('is-open')){ clearInterval(ytWatch); ytWatch = null; return; }
    if (ytPlaying){ clearInterval(ytWatch); ytWatch = null; return; }      // la lecture a réellement démarré
    const waited = Date.now() - t0;
    const limit = ytSawBuffer ? 30000 : (ytReady ? 10000 : 5000);          // on laisse sa chance à un réseau lent
    if (waited > limit) playLocal(hostileCtx()
      ? 'YouTube bloqué dans ce contexte (aperçu ou fichier local) — extrait intégré au site.'
      : 'YouTube ne répond pas — extrait intégré au site.');
  }, 500);
}

function startYt(){
  const v = curVid; if (!v) return;
  ytFailed = false;
  hideLocal();
  setStatus(null);
  $('#playerPlay').hidden = true;
  $('#playerLoading').hidden = false;
  if ($('#offlineVid') && $('#offlineVid').hidden) $('#playerPoster').hidden = false;
  if ($('#offlineVid') && $('#offlineVid').hidden) $('#watchInfo').textContent = 'Connexion au lecteur YouTube…';

  if (navigator.onLine === false){
    playLocal('Hors connexion — extrait intégré au site ; la vidéo complète revient dès le retour du réseau.');
    return;
  }
  if (hostileCtx() && !ytForce){
    playLocal('YouTube bloqué dans ce contexte (aperçu ou fichier local) — extrait intégré au site.');
    return;
  }
  loadYtApi().then(YT => {
    if (!curVid || curVid.yt !== v.yt || ytFailed) return;
    try {
      if (ytPlayer && ytPlayer.loadVideoById){
        ytPlayer.loadVideoById(v.yt);
        ytPlayer.playVideo();
        return;
      }
      const host = document.createElement('div');
      host.className = 'yt-host';
      /* masquée tant que la lecture n'a pas commencé : impossible d'afficher
         « Ce contenu est bloqué. Pour résoudre le problème, contactez le propriétaire du site. » */
      host.style.visibility = 'hidden';
      $('#playerStage').appendChild(host);
      const vars = {autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, enablejsapi: 1};
      if (location.protocol === 'http:' || location.protocol === 'https:') vars.origin = location.origin;
      ytPlayer = new YT.Player(host, {
        videoId: v.yt,
        playerVars: vars,
        events: {
          onReady: e => {
            ytReady = true;
            ytReveal();
            $('#playerLoading').hidden = true;
            if (vstate[v.yt].prog > 1 && vstate[v.yt].prog < 98){
              try { e.target.seekTo(rndTime(), true); } catch (err) {}   // reprise là où l'élève s'était arrêté
            }
            try { e.target.playVideo(); } catch (err) {}
          },
          onStateChange: onYtState,
          onError: e => { $('#playerLoading').hidden = true; playLocal('Lecture YouTube bloquée (' + errText(e.data) + ') — extrait intégré au site.'); }
        }
      });
    } catch (err) {
      playLocal('Lecteur YouTube indisponible — extrait intégré au site.');
    }
  }).catch(err => playLocal((err && err.message ? err.message : 'YouTube injoignable') + ' — extrait intégré au site.'));
  armWatchdog(v);
}
/* relance manuelle depuis le bandeau d'état */
function retryYt(){
  ytFailed = false;
  ytForce = true;              // tentative explicite : on ignore le blocage présumé du contexte
  disposeYt();
  hideLocal();
  startYt();
  ytForce = false;
}
function onYtState(e){
  if (e.data === 1){                       // lecture
    ytReady = true;
    ytReveal();
    $('#playerLoading').hidden = true;
    clearInterval(ytTimer);
    ytTimer = setInterval(tick, 1000);
    setMiniIcon(true);
  } else if (e.data === 2){                // pause
    clearInterval(ytTimer); setMiniIcon(false);
    if (curVid) persist();
  } else if (e.data === 3 || e.data === 5){ // mise en mémoire tampon / vidéo chargée
    ytSawBuffer = true;
    if (!ytReady) $('#playerLoading').hidden = false;
  } else if (e.data === 0){                 // fin
    clearInterval(ytTimer); setMiniIcon(false);
    markProgress(100);
  }
}
let ytSaveTick = 0;
function tick(){
  if (!ytReady || !curVid || !ytPlayer || !ytPlayer.getCurrentTime) return;
  const t = ytPlayer.getCurrentTime() || 0;
  const total = ytPlayer.getDuration() || curVid.duree;
  const p = Math.min(100, Math.round(t / Math.max(total, 1) * 100));
  const st = vstate[curVid.yt];
  $('#watchInfo').textContent = 'Lecture en cours — ' + fmtDur(t) + ' / ' + fmtDur(total);
  if (p !== Math.round(st.prog)){
    st.prog = p;
    $('#watchPct').textContent = p + ' %';
    $('#watchBar').style.width = p + '%';
    $('#watchBarWrap').setAttribute('aria-valuenow', p);
    if (mini.classList.contains('is-open')) updateMini();
    if (++ytSaveTick % 10 === 0) persist();     // sauvegarde régulière de la position
  }
}
function markProgress(p){
  if (!curVid) return;
  vstate[curVid.yt].prog = p; persist();
  $('#watchPct').textContent = p + ' %';
  $('#watchBar').style.width = p + '%';
  $('#watchBarWrap').setAttribute('aria-valuenow', p);
  $('#watchInfo').textContent = 'Vidéo terminée — bien joué !';
  updateMini();
  renderVideoScroll();
  renderVideoList();
  toast('Progression enregistrée : ' + p + ' %');
}
function failYt(msg){ playLocal(msg); }
function stopYt(){
  clearInterval(ytTimer); ytTimer = null;
  ytPlaying = false;
  if (ytPlayer && ytPlayer.stopVideo){ try { ytPlayer.stopVideo(); } catch (e) {} }
  hideLocal();
}
function minimizePlayer(){
  if (curVid){ updateMini(); mini.classList.add('is-open'); appEl.classList.add('mp-on'); }
  player.classList.remove('is-open');
}

/* --- interactions du lecteur --- */
$('#playerPlay').addEventListener('click', startYt);
$('#playerClose').addEventListener('click', minimizePlayer);
$('#mpClose').addEventListener('click', () => {
  stopYt();
  mini.classList.remove('is-open');
  appEl.classList.remove('mp-on');
  toast('Lecture arrêtée');
});
$('#mpToggle').addEventListener('click', () => {
  const vid = $('#offlineVid');
  if (vid && !vid.hidden){                    // lecture de l'extrait intégré
    if (vid.paused) safePlay(vid); else safePause(vid);
    return;
  }
  if (!ytPlayer || !ytPlayer.getPlayerState){ toast('Lancez d\'abord la lecture'); return; }
  if (ytPlaying) ytPlayer.pauseVideo(); else ytPlayer.playVideo();
});
$('#playerRetry').addEventListener('click', retryYt);

/* ---------- extrait vidéo intégré (lecture hors-ligne) ---------- */
(function initLocalClip(){
  const vid = $('#offlineVid');
  if (!vid) return;
  try {
    const sources = [['video/mp4', typeof CLIP_MP4 === 'string' ? CLIP_MP4 : ''],
                     ['video/webm', typeof CLIP_WEBM === 'string' ? CLIP_WEBM : '']];
    vid.innerHTML = '';
    sources.forEach(([type, src]) => {
      if (!src) return;
      const el = document.createElement('source');
      el.type = type; el.src = src;
      vid.appendChild(el);
    });
    vid.addEventListener('error', () => setStatus('Extrait intégré illisible ici — la vidéo YouTube reste disponible en ligne.', false));
  } catch (e) {}
  vid.addEventListener('play',  () => setMiniIcon(true));
  vid.addEventListener('pause', () => setMiniIcon(false));
  vid.addEventListener('ended', () => {
    setMiniIcon(false);
    $('#watchInfo').textContent = 'Extrait intégré terminé — la vidéo complète se lit dès que le réseau est disponible';
    toast("Fin de l'extrait intégré — vidéo complète en ligne");
  });
  vid.addEventListener('timeupdate', () => {
    if (!curVid) return;
    const total = vid.duration || 24;
    const p = Math.min(100, Math.round(vid.currentTime / Math.max(total, 1) * 100));
    /* l'extrait est un aperçu : il ne compte pas comme progression du cours */
    $('#watchPct').textContent = p + ' %';
    $('#watchBar').style.width = p + '%';
    $('#watchBarWrap').setAttribute('aria-valuenow', p);
    $('#watchInfo').textContent = 'Extrait intégré — ' + fmtDur(vid.currentTime) + ' / ' + fmtDur(total);
    if (mini.classList.contains('is-open')) updateMini();
  });
  vid.addEventListener('loadedmetadata', () => {
    $('#playerDur').textContent = fmtDur(curVid ? curVid.duree : vid.duration);
  });
})();
/* retour du réseau : on retente automatiquement YouTube si on était en local */
window.addEventListener('online', () => {
  if (ytFailed && curVid && player.classList.contains('is-open')) retryYt();
});
$('#actLike').addEventListener('click', () => {
  const st = vstate[curVid.yt]; st.like = !st.like; persist(); toggleAct('#actLike', st.like);
  toast(st.like ? 'Ajouté à vos coups de cœur' : 'Retiré des coups de cœur');
});
$('#actSave').addEventListener('click', () => {
  const st = vstate[curVid.yt]; st.save = !st.save; persist(); toggleAct('#actSave', st.save);
  toast(st.save ? 'Enregistré pour plus tard' : 'Retiré des enregistrements');
});
$('#actShare').addEventListener('click', () => {
  const url = ytLink(curVid.yt);
  const fallback = () => window.APPX.dialog({title:'Partager la vidéo', text:url, confirmLabel:'Fermer', cancel:false, ico:'share'});
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(() => toast('Lien de la vidéo copié')).catch(fallback);
  } else fallback();
});
/* Poser une question au formateur : ouvre la discussion du cours, message pré-rempli */
$('#actShare2').addEventListener('click', () => {
  const cid = curVid.cours;
  minimizePlayer();
  const el = window.APPX.pushPage('cours', {id:cid, tab:'discussion'});
  const t = el && el.querySelector('.disc-txt');
  if (t){ t.value = 'Question sur la vidéo « ' + curVid.titre + ' » : '; t.focus(); }
  toast('Écrivez votre question — le formateur est notifié');
});
/* Quiz du module de la vidéo en cours */
$('#actQuiz').addEventListener('click', () => {
  const cid = curVid.cours;
  minimizePlayer();
  window.APPX.pushPage('quiz', {quiz:cid, id:cid});
  toast('Quiz — ' + ((coursById(cid) || {}).titre || cid));
});
/* Téléchargement hors-ligne de la vidéo */
$('#actDl').addEventListener('click', () => {
  window.APPX.addDownload(curVid.cours, curVid.titre, fmtDur(curVid.duree), curVid.yt);
  minimizePlayer();
  window.APPX.pushPage('telechargements', {});
  toast('Vidéo disponible hors-ligne');
});

/* --- ouvrir une vidéo depuis n'importe quelle carte / ligne --- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-video]');
  if (el) openVideo(el.dataset.video);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && player.classList.contains('is-open')) minimizePlayer();
  if (e.key === 'Enter' && e.target.closest && e.target.closest('[data-video]')){
    openVideo(e.target.closest('[data-video]').dataset.video);
  }
});

/* --- Ouverture auto (démo) : ?vid=ID dans l'URL, sinon dernière vidéo vue --- */
(function scheduleLoad(){
  let target = null;
  try { target = new URLSearchParams(location.search).get('vid'); } catch (e) {}
  const v = target && VIDEOS.find(x => x.yt === target);
  if (!v) return;                       // aucune lecture automatique : seuls les liens ?vid=… ouvrent le lecteur
  setTimeout(() => { if (!player.classList.contains('is-open')) openVideo(v.yt); }, 700);
})();

/* ============================================================
   NAVIGATION (bottom nav + liens)
   ============================================================ */
let currentView = 'accueil';
function setView(name){
  if (!name || !$('#view-' + name)) return;
  currentView = name;
  $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === name));
  $$('#navBar .nav-item').forEach(b => b.setAttribute('aria-selected', String(b.dataset.nav === name)));
  $('#main').scrollTop = 0;
  $('#fab').classList.toggle('is-hidden', name !== 'accueil' && name !== 'cours');
  animateProgress($('#view-' + name));
}
$$('[data-nav]').forEach(el => el.addEventListener('click', () => setView(el.dataset.nav)));
$('#avatarBtn').addEventListener('click', () => setView('profil'));

/* ============================================================
   ANIMATION DES BARRES ET ANNEAUX DE PROGRESSION
   ============================================================ */
function animateProgress(root = document){
  requestAnimationFrame(() => {
    $$('.lp__bar[data-prog]', root).forEach(bar => {
      if (bar.dataset.done) return;
      bar.style.width = Math.max(0, Math.min(100, +bar.dataset.prog)) + '%';
      bar.dataset.done = '1';
    });
    $$('.ring__val[data-prog]', root).forEach(c => {
      if (c.dataset.done) return;
      const C = 2 * Math.PI * 42;
      c.style.strokeDasharray = C;
      c.style.strokeDashoffset = C * (1 - (+c.dataset.prog) / 100);
      c.dataset.done = '1';
    });
    $$('.vcard__seen b[data-prog]', root).forEach(b => {
      if (b.dataset.done) return;
      b.style.width = Math.max(0, Math.min(100, +b.dataset.prog)) + '%';
      b.dataset.done = '1';
    });
  });
}

/* ============================================================
   BOTTOM SHEET + SCRIM
   ============================================================ */
const sheet = $('#sheet'), scrim = $('#scrim');
function openSheet(){ sheet.classList.add('is-open'); scrim.classList.add('is-open'); }
function closeSheet(){ sheet.classList.remove('is-open'); scrim.classList.remove('is-open'); }
$('#fab').addEventListener('click', openSheet);
scrim.addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
sheet.addEventListener('click', e => { if (e.target.closest('[data-toast]')) setTimeout(closeSheet, 120); });

/* ============================================================
   SWITCHES + TOAST GÉNÉRIQUE
   ============================================================ */
$$('[data-switch] .switch').forEach(sw => sw.addEventListener('click', () => {
  const on = sw.getAttribute('aria-checked') !== 'true';
  sw.setAttribute('aria-checked', String(on));
  const host = sw.closest('[data-switch]');
  if (host.dataset.switch === 'dark') setTheme(on);
  else toast((on ? 'Activé : ' : 'Désactivé : ') + host.querySelector('h3').textContent);
}));

document.addEventListener('click', e => {
  const t = e.target.closest('[data-toast]');
  if (t) toast(t.dataset.toast);
});

/* ---------- Top app bar : teinte au scroll (M3) ---------- */
$('#main').addEventListener('scroll', e => {
  $('#topBar').classList.toggle('is-scrolled', e.target.scrollTop > 8);
}, {passive:true});


/* ---------- Amorce ---------- */
if (IMG.hero) document.documentElement.style.setProperty('--hero-img', `url("${IMG.hero}")`);
setTheme(false);
</script>
</body>
</html>
