/* ============================================================
   PAGES LMS — cours, quiz, devoirs (dépend de core.js)
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const { svg, IC, PAGES, pushPage, popPage, dialog, openSheet, closeSheet, barPage, emptyBox,
        S, persist, refreshUI, refreshPages, LESSONS, PROGRAMMES, QUIZZES, DEVOIRS, RESSOURCES, SESS,
        totalLecons, leconsFaites, progCours, isFav, toggleFav, devoirStatut, devoirDate,
        fmtQuand, badgeVal, badgeUnlocked, BADGES_DEF, notification, addDownload, initials, defilerVers } = A;

const lessonIcon = k => k === 'video' ? 'play' : k === 'quiz' ? 'help' : k === 'devoir' ? 'upload' : k === 'exercice' ? 'edit' : k === 'projet' ? 'layers' : 'task';
const lessonLabel = k => ({video:'Vidéo', quiz:'Quiz', devoir:'Devoir', exercice:'Exercice', projet:'Projet', lecture:'Lecture'})[k] || 'Leçon';
const curLessonIdx = cid => LESSONS[cid].findIndex((l, i) => !S.lessons[cid + ':' + i]);

/* ============================================================
   1. DÉTAIL DU COURS
   ============================================================ */
PAGES.cours = {
  render(params){
    const c = coursById(params.id) || COURS[0];
    params.id = c.id;
    const total = totalLecons(c.id);
    const done = leconsFaites(c.id);
    const next = LESSONS[c.id][curLessonIdx(c.id)] || LESSONS[c.id][LESSONS[c.id].length - 1];
    return `
      <div class="page__media">
        <img data-img="${c.img}" alt="Visuel du cours ${esc(c.titre)}">
        <button class="icon-btn ripple page__back" data-back aria-label="Retour">${IC.back}</button>
        <div class="page__media-body">
          <h1>${esc(c.titre)}</h1>
          <p>${svg('person', 'icon icon--16')} ${esc(c.prof)} · ${esc(c.cat)} · ${total} leçons</p>
        </div>
      </div>
      <div class="page__scroll c-scroll" id="cScroll">
        <div class="tabs" id="cTabs">
          <button class="tab is-active" data-ctab="programme">${svg('task', 'icon')} Programme</button>
          <button class="tab" data-ctab="ressources">${svg('layers', 'icon')} Ressources</button>
          <button class="tab" data-ctab="discussion">${svg('chat', 'icon')} Discussion</button>
          <button class="tab" data-ctab="notes">${svg('edit', 'icon')} Notes</button>
        </div>
        <div id="cBody" class="page__pad c-body" style="padding-bottom:28px"></div>
      </div>
      <div class="cta-bar" id="cCta">
        <button class="icon-btn ripple" data-act="fav" aria-label="Favori"><svg class="icon"><use href="#ic-bookmark"/></svg></button>
        <button class="btn btn--filled ripple" style="flex:1" data-act="continue">
          ${svg('play', 'icon icon--18')} <span id="ctaLabel">${done >= total ? 'Cours terminé' : 'Continuer : ' + esc(next.t.slice(0, 22)) + (next.t.length > 22 ? '…' : '')}</span>
        </button>
        <button class="icon-btn ripple" data-act="dlCourse" aria-label="Télécharger hors-ligne">${svg('download', 'icon icon--20')}</button>
      </div>`;
  },
  mount(el, params){
    const c = coursById(params.id);
    el.dataset.coursId = c.id;
    const tab = params.tab || 'programme';
    $$('#cTabs .tab', el).forEach(t => t.classList.toggle('is-active', t.dataset.ctab === tab));
    paintTab(el, c, tab);
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-ctab]');
      if (t){
        $$('#cTabs .tab', el).forEach(x => x.classList.toggle('is-active', x === t));
        paintTab(el, c, t.dataset.ctab);
        $('.c-scroll', el).scrollTop = 0;
        return;
      }
      const mod = e.target.closest('.mod__h');
      if (mod){ mod.closest('.mod').classList.toggle('is-open'); return; }
      const chk = e.target.closest('[data-lesson-done]');
      if (chk){
        e.stopPropagation();
        const i = chk.dataset.lessonDone, k = c.id + ':' + i;
        if (S.lessons[k]){ delete S.lessons[k]; toast('Leçon marquée comme non terminée'); }
        else { S.lessons[k] = 1; toast('Leçon terminée 🎉'); }
        persist(); refreshUI(); paintTab(el, c, 'programme'); return;
      }
      const row = e.target.closest('[data-lesson]');
      if (row){
        const l = LESSONS[c.id][+row.dataset.lesson];
        /* Une leçon « quiz » porte l'identifiant du cours dans `v` : on la
           traite AVANT la vidéo, sinon elle ne s'ouvrait jamais (et se
           terminait toute seule au bout de 2,5 s). */
        if (l.k === 'quiz'){ pushPage('quiz', {quiz:c.id, id:c.id}); return; }
        if (l.v){ openVideoId(l.v, c.id, +row.dataset.lesson); return; }
        openSheet(`<h3 class="title-medium">${esc(l.t)}</h3>
          <p class="body-small muted" style="padding:0 6px 14px">${lessonLabel(l.k)} · ${esc(l.d)} · ${esc(l.module)}</p>
          <div class="card card--pad" style="margin-bottom:12px">
            <p class="body-medium">${lessonTypeText(l.k)}</p>
          </div>
          <button class="btn btn--filled btn--block ripple" data-act="completeLesson" data-id="${c.id}" data-i="${row.dataset.lesson}">
            ${svg('check', 'icon icon--18')} ${S.lessons[c.id + ':' + row.dataset.lesson] ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
          </button>`);
        return;
      }
      const res = e.target.closest('[data-res]');
      if (res){
        const r = RESSOURCES[c.id][+res.dataset.res];
        addDownload('cours', r.n + ' — ' + c.titre.slice(0, 18), r.t.split('·')[1] ? r.t.split('·')[1].trim() : '1 Mo');
        return;
      }
      const q = e.target.closest('[data-openquiz]');
      if (q){ pushPage('quiz', {quiz:c.id, id:c.id}); return; }
      const fav = e.target.closest('[data-act="fav"]');
      if (fav){ toggleFav(c.id); paintCta(el, c); toast(isFav(c.id) ? 'Cours ajouté aux favoris' : 'Retiré des favoris'); }
    });
    paintCta(el, c);
  },
  refresh(el, params){
    const c = coursById(params.id);
    if (!c) return;
    paintCta(el, c);
    const active = $('#cTabs .tab.is-active', el);
    if (active && active.dataset.ctab === 'programme') paintTab(el, c, 'programme');
  }
};
function lessonTypeText(k){
  return ({
    lecture : "Contenu de lecture : prenez des notes dans l'onglet « Notes » du cours.",
    video   : 'Vidéo hébergée par YouTube — la lecture s\'ouvre dans le lecteur de l\'application.',
    exercice: 'Exercice pratique à réaliser dans votre environnement de travail.',
    quiz    : 'Quiz noté : une seule tentative, la meilleure note est conservée.',
    devoir  : 'Devoir à déposer dans la rubrique Échéances.',
    projet  : 'Projet évalué : livrable à déposer avant la date limite.'
  })[k] || '';
}
function paintCta(el, c){
  const btn = $('[data-act="fav"]', el);
  if (btn){
    btn.style.background = isFav(c.id) ? 'var(--md-secondary-container)' : '';
    btn.style.color = isFav(c.id) ? 'var(--md-on-secondary-container)' : '';
    btn.setAttribute('aria-pressed', String(isFav(c.id)));
  }
}
function paintTab(el, c, tab){
  const body = $('.c-body', el);
  if (tab === 'programme')      body.innerHTML = tabProgramme(c);
  else if (tab === 'ressources') body.innerHTML = tabRessources(c);
  else if (tab === 'discussion'){ body.innerHTML = tabDiscussion(c); hydrate(body); }
  else if (tab === 'notes')      body.innerHTML = tabNotes(c);
  hydrate(body);
  animateProgress(body);
}
function tabProgramme(c){
  const total = totalLecons(c.id), done = leconsFaites(c.id), p = progCours(c.id);
  const cur = curLessonIdx(c.id);
  const q = S.quiz[c.id];
  const modules = PROGRAMMES[c.id].map((mod, mi) => {
    const idxs = LESSONS[c.id].map((l, i) => (l.mi === mi ? i : -1)).filter(i => i > -1);
    const md = idxs.filter(i => S.lessons[c.id + ':' + i]).length;
    const open = cur > -1 && LESSONS[c.id][cur].mi === mi;
    return `<div class="mod${open ? ' is-open' : ''}">
      <button class="mod__h ripple">
        <span class="mod__n">${md === idxs.length ? '✓' : mi + 1}</span>
        <div><h3>${esc(mod.m)}</h3><p>${md}/${idxs.length} leçons · ${Math.max(1, Math.round(idxs.length * 12))} min</p></div>
        <span class="mod__chev">${IC.chev}</span>
      </button>
      <div class="mod__body">
        ${idxs.map(i => lessonRow(c, LESSONS[c.id][i], i, cur)).join('')}
      </div>
    </div>`;
  }).join('');
  return `
    <div class="metrics" style="margin-bottom:16px">
      <div class="metric"><b><span class="rating">${svg('star', 'icon icon--16')} ${c.rating || '4,7'}</span></b><span>Note</span></div>
      <div class="metric"><b>${c.eleves || '1 248'}</b><span>Étudiants</span></div>
      <div class="metric"><b>${Math.max(1, Math.round(total * 12 / 60))} h</b><span>Durée totale</span></div>
      <div class="metric"><b>${q ? q.best + ' %' : '—'}</b><span>Meilleur quiz</span></div>
    </div>

    <div class="card card--pad" style="display:flex;gap:16px;align-items:center;margin-bottom:18px">
      <div class="ring-wrap" style="width:76px;height:76px">
        <svg class="ring" viewBox="0 0 100 100" style="width:76px;height:76px">
          <circle class="ring__track" cx="50" cy="50" r="42" stroke-width="9"/>
          <circle class="ring__val" cx="50" cy="50" r="42" stroke-width="9" data-prog="${p}"/>
        </svg>
        <span class="ring-wrap__label"><strong style="font-size:17px">${p}%</strong></span>
      </div>
      <div style="flex:1">
        <p class="title-small">${done}/${total} leçons terminées</p>
        <p class="body-small muted" style="margin-top:3px">${cur > -1 ? 'En cours : ' + esc(LESSONS[c.id][cur].t) : 'Toutes les leçons sont terminées 🎉'}</p>
        ${q ? `<p class="body-small muted" style="margin-top:6px">Quiz : ${q.attempts} tentative(s) · meilleur score ${q.best} %</p>` : ''}
      </div>
    </div>

    <div class="sec__h"><h2>Programme du cours</h2><span class="pill pill--normal">${PROGRAMMES[c.id].length} modules</span></div>
    ${modules}`;
}
function lessonRow(c, l, i, cur){
  const done = !!S.lessons[c.id + ':' + i];
  const state = done ? 'is-done' : i === cur ? 'is-current' : '';
  const yt = l.v && typeof VIDEOS !== 'undefined' ? VIDEOS.find(v => v.yt === l.v) : null;
  return `<button class="lesson ${state}" data-lesson="${i}">
    <span class="lesson__state" data-lesson-done="${i}" role="checkbox" aria-checked="${done}" aria-label="Marquer comme terminée">${IC.check}</span>
    <span class="lesson__main">
      <h4>${esc(l.t)}</h4>
      <p>${svg(lessonIcon(l.k), 'icon icon--16')} ${lessonLabel(l.k)} · ${esc(l.d)}
        ${yt ? ` · <span class="yt-badge">${svg('ytplay', 'icon')}YT</span>` : ''}
        ${!!S.lessons[c.id + ':' + i] ? ' · terminée' : i === cur ? ' · <b>à suivre</b>' : ''}</p>
    </span>
    <span class="lesson__go">${IC.chev}</span>
  </button>`;
}
function tabRessources(c){
  const list = RESSOURCES[c.id] || [];
  if (!list.length) return emptyBox('layers', 'Aucune ressource', 'Le formateur n\'a pas encore publié de support.');
  return `<div class="note" style="margin-bottom:14px">${svg('info', 'icon')}
      <span>Touchez une ressource pour la télécharger et la consulter hors-ligne.</span></div>
    ${list.map((r, i) => `<button class="list-row ripple" data-res="${i}">
      <span class="list-row__ico acc-${r.acc}">${svg(r.ico, 'icon icon--20')}</span>
      <span class="list-row__main"><h3>${esc(r.n)}</h3><p>${esc(r.t)}</p></span>
      ${svg('download', 'icon icon--18')}
    </button>`).join('')}`;
}
function tabDiscussion(c){
  const msgs = (S.disc[c.id] || []);
  return `${msgs.length ? msgs.map(msgHTML).join('') : emptyBox('chat', 'Aucun message', 'Posez la première question à ' + esc(c.prof) + '.')}
    <div class="card card--pad" style="margin-top:8px">
      <p class="title-small" style="margin-bottom:10px">Écrire à ${esc(c.prof)}</p>
      <div class="field field--area" style="margin-bottom:10px">
        <textarea class="disc-txt" id="discTxt" placeholder=" "></textarea><label for="discTxt">Votre message…</label>
      </div>
      <button class="btn btn--filled btn--block ripple" data-act="postMsg" data-id="${c.id}">${svg('chat', 'icon icon--18')} Publier</button>
    </div>`;
}
function msgHTML(m){
  const liked = !!S.liked[m.id];
  return `<div class="msg">
    <span class="msg__av acc-${m.acc}">${esc(m.ini)}</span>
    <div class="msg__body">
      <div class="msg__head"><b>${esc(m.a)}</b>
        ${m.role === 'Formateur' ? '<span class="pill pill--ok">Formateur</span>' : m.me ? '<span class="pill pill--normal">Vous</span>' : ''}
        <time>${notifAge_(m.min)}</time></div>
      <p>${esc(m.txt)}</p>
      <div class="msg__acts">
        <button class="ripple${liked ? ' is-on' : ''}" data-like="${m.id}" data-cours="${m.cours || ''}">${svg('like', 'icon icon--16')} ${m.likes + (liked ? 1 : 0)}</button>
        <button class="ripple" data-act="replyTo" data-name="${esc(m.a)}">${svg('chat', 'icon icon--16')} Répondre</button>
      </div>
    </div>
  </div>`;
}
const notifAge_ = min => min < 60 ? 'il y a ' + min + ' min'
  : min < 1440 ? 'il y a ' + Math.round(min / 60) + ' h'
  : min < 2880 ? 'hier' : 'il y a ' + Math.round(min / 1440) + ' j';
function tabNotes(c){
  const note = S.notes[c.id] || '';
  return `<div class="note" style="margin-bottom:12px">${svg('edit', 'icon')}
      <span>Vos notes sont enregistrées automatiquement sur cet appareil.</span></div>
    <div class="field field--area">
      <textarea id="noteTxt" placeholder=" " style="min-height:190px">${esc(note)}</textarea>
      <label for="noteTxt">Mes notes sur ce cours…</label>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
      <span class="body-small muted note-info" id="noteInfo">${note.trim() ? note.trim().split(/\s+/).length + ' mots' : 'Aucune note pour le moment'}</span>
      <span class="body-small note-saved" id="noteSaved" style="color:var(--md-success)"></span>
    </div>
    ${note ? `<button class="btn btn--danger btn--block ripple" style="margin-top:16px" data-act="clearNote" data-id="${c.id}">${svg('close', 'icon icon--18')} Effacer la note</button>` : ''}`;
}
function openVideoId(yt, cid, li){
  if (typeof openVideo === 'function'){ openVideo(yt); }
  const key = cid + ':' + li;
  if (!S.lessons[key]){
    setTimeout(() => {
      S.lessons[key] = 1; persist();
      toast('Leçon marquée comme terminée');
      refreshUI();
    }, 2500);
  }
}

/* ============================================================
   2. ACTIONS DES PAGES LMS (branchées sur le délégué global)
   ============================================================ */
Object.assign(A.PAGES, PAGES);
window.APPX.ACTIONS = window.APPX.ACTIONS || {};
/* Ouvre le module de la leçon en cours, la surligne et défile jusqu'à elle */
function focusLesson(el, coursId){
  if (!el) return;
  const cur = curLessonIdx(coursId);
  if (cur < 0){ toast('Ce cours est déjà terminé 🎉'); return; }
  const l = LESSONS[coursId][cur];
  const mods = $$('.mod', el);
  mods.forEach((m, i) => m.classList.toggle('is-open', i === l.mi));
  const row = $('.lesson.is-current', el) || $$('.lesson', el)[cur];
  if (!row) return;
  defilerVers(row, $('.c-scroll', el) || $('.page__scroll', el), 'centre');
  row.style.boxShadow = 'inset 0 0 0 2px var(--md-primary)';
  setTimeout(() => { row.style.boxShadow = ''; }, 1800);
  toast(l.done ? ('Leçon ' + (cur + 1) + ' : ' + l.t) : ('Reprise — leçon ' + (cur + 1) + ' : ' + l.t));
}

const ACTIONS = {
  completeLesson(btn){
    const k = btn.dataset.id + ':' + btn.dataset.i;
    if (S.lessons[k]) delete S.lessons[k]; else S.lessons[k] = 1;
    persist(); closeSheet(); refreshUI();
    toast(S.lessons[k] ? 'Leçon terminée 🎉' : 'Leçon rouverte');
  },
  continue(btn){
    const pg = btn.closest('.page');
    /* le bouton peut viser un cours précis (héros « Reprendre », cartes) */
    const coursId = (btn.dataset && btn.dataset.cours) || (pg && pg.dataset.coursId) || 'c1';
    const cur = curLessonIdx(coursId);
    if (cur === -1){ toast('Ce cours est déjà terminé 🎉'); return; }
    const l = LESSONS[coursId][cur];
    if (l.k === 'quiz'){ pushPage('quiz', {quiz:coursId, id:coursId}); return; }
    if (l.v){ openVideoId(l.v, coursId, cur); return; }
    const onCours = pg && pg.dataset.page === 'cours';
    const el = onCours ? pg : pushPage('cours', {id:coursId, tab:'programme'});
    focusLesson(el, coursId);
  },
  dlCourse(btn){
    const el = btn.closest('.page');
    const cid = el.dataset.coursId || 'c1';
    const c = coursById(cid);
    addDownload(cid, c.titre, (totalLecons(cid) * 30) + ' Mo');
    pushPage('telechargements', {});
  },
  postMsg(btn){
    const cid = btn.dataset.id;
    const txt = btn.closest('.page').querySelector('.disc-txt').value.trim();
    if (txt.length < 2){ toast('Écrivez votre message avant de publier'); return; }
    S.disc[cid] = (S.disc[cid] || []).concat([{
      id:'m' + Date.now(), a:S.profile.nom, role:'Vous', ini:initials(S.profile.nom), acc:'amber', min:0, txt:txt, likes:0, me:1
    }]);
    persist();
    /* le message rejoint la discussion du compte : tous les appareils le voient */
    if (window.LHSYNC2 && window.LHSYNC2.publierMessage) window.LHSYNC2.publierMessage(cid, txt);
    notification('message', 'Message publié', 'Votre message sur « ' + (coursById(cid) || {}).titre + ' » a été envoyé.', ['cours', cid, {tab:'discussion'}]);
    refreshUI();
    const el = $('.page[data-page="cours"]');
    if (el){ paintTab(el, coursById(cid), 'discussion'); const sc = el.querySelector('.c-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; }
    toast('Message publié');
  },
  replyTo(btn){
    const t = btn.closest('.page').querySelector('.disc-txt');
    if (t){ t.value = '@' + btn.dataset.name + ' '; t.focus(); }
  },
  clearNote(btn){
    const cid = btn.dataset.id;
    dialog({title:'Effacer la note ?', text:'Votre note sur ce cours sera supprimée définitivement.', confirmLabel:'Effacer', danger:true, ico:'edit'})
      .then(ok => { if (!ok) return; delete S.notes[cid]; persist(); refreshUI(); refreshPages(); toast('Note effacée'); });
  },
  startQuiz(btn){ pushPage('quiz', {quiz:btn.dataset.id, id:btn.dataset.id}); },
  chooseFile(){
    const f = document.querySelector('.f-file');
    if (!f){ toast('Sélecteur de fichier indisponible dans cet aperçu'); return; }
    try { f.click(); } catch (err) { toast('Sélecteur de fichier indisponible ici'); }
  },
  linkFile(){
    askLink().then(url => {
      if (!url || url.length < 6) return;
      const el = $('.page[data-page="devoir"]');
      setFile(el, url.replace(/^https?:\/\//, '').slice(0, 42), 'lien externe');
      if (filePick) filePick.lien = url;
      toast('Lien joint au rendu');
    });
  },
  clearFile(){
    filePick = null;
    const el = $('.page[data-page="devoir"]');
    if (el){
      const chip = $('.file-slot', el); if (chip) chip.innerHTML = '';
      const dt = $('.drop-title', el); if (dt) dt.textContent = 'Choisir un fichier';
    }
    toast('Fichier retiré');
  },
  submit(){
    const el = $('.page[data-page="devoir"]');
    const d = DEVOIRS.find(x => x.id === el.dataset.devoirId);
    if (!filePick){ toast('Joignez un fichier ou un lien avant de déposer'); return; }
    const label = $('.sub-label', el);
    const html = label ? label.innerHTML : '';
    if (label) label.innerHTML = '<span class="spin-sm"></span> Envoi en cours…';
    const bar = document.createElement('div');
    bar.className = 'lp';
    bar.style.cssText = 'margin:16px 0 0';
    bar.innerHTML = '<div class="lp__track"></div><div class="lp__bar" style="width:0%;transition:width .4s linear"></div>';
    el.querySelector('.page__pad').appendChild(bar);
    let p = 0;
    const tick = setInterval(() => {
      p += 12 + Math.round(Math.random() * 14);
      bar.querySelector('.lp__bar').style.width = Math.min(100, p) + '%';
      if (p >= 100){
        clearInterval(tick);
        const now = new Date();
        S.devoirs[d.id] = {
          statut:'rendu', fichier:filePick.nom, taille:filePick.taille,
          commentaire:(($('.sub-comment', el) || {}).value || '').trim(),
          date: now.getDate() + ' ' + MOIS[now.getMonth()] + ' à ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0')
        };
        persist();
        notification('devoir', 'Devoir déposé', d.titre + ' — transmis le ' + S.devoirs[d.id].date + '.', ['devoir', d.id]);
        if (window.LHSYNC && window.LHSYNC.actif()) window.LHSYNC.rendre(d.id, S.devoirs[d.id]);
        filePick = null;
        refreshUI();
        popPage();
        setTimeout(() => pushPage('devoir', {id:d.id}), 360);
        toast('Devoir déposé ✅');
      } else if (label) label.innerHTML = html;
    }, 320);
  },
  unsubmit(){
    const el = $('.page[data-page="devoir"]');
    const id = el.dataset.devoirId;
    dialog({title:'Retirer le rendu ?', text:'Votre fichier sera retiré : vous pourrez en déposer un nouveau avant l\'échéance.', confirmLabel:'Retirer', danger:true, ico:'upload'})
      .then(ok => {
        if (!ok) return;
        delete S.devoirs[id]; persist();
        if (window.LHSYNC && window.LHSYNC.actif()) window.LHSYNC.retirerRendu(id);
        refreshUI(); refreshPages();
        toast('Rendu retiré');
      });
  }
};
Object.assign(window.APPX.ACTIONS, ACTIONS);   // partagé avec le délégué global (core.js)

document.addEventListener('click', e => {
  const act = e.target.closest('[data-act]');
  if (act && ACTIONS[act.dataset.act]){ ACTIONS[act.dataset.act](act, e); return; }
  const like = e.target.closest('[data-like]');
  if (like){
    const id = like.dataset.like;
    S.liked[id] = !S.liked[id]; persist();
    like.classList.toggle('is-on', !!S.liked[id]);
    const el = like.closest('.msg');
    if (el){
      const b = el.querySelector('.msg__acts button');
      const m = Object.values(S.disc).flat().find(x => x.id === id);
      if (m) b.innerHTML = svg('like', 'icon icon--16') + ' ' + (m.likes + (S.liked[id] ? 1 : 0));
    }
  }
});

/* ============================================================
   3. PAGE QUIZ
   ============================================================ */
let Q = null, qTimer = null;
PAGES.quiz = {
  render(params){
    const cid = params.quiz || params.id || 'c2';
    const c = coursById(cid) || COURS[1];
    return `<div class="page__bar">
        <button class="icon-btn ripple page__back--bar" data-act="quitQuiz" aria-label="Quitter">${IC.close}</button>
        <h1>Quiz — ${esc(c.titre)}</h1>
        <span class="pill pill--normal">${(QUIZZES[cid] || {questions:[]}).questions.length} questions</span>
      </div>
      <div class="page__scroll"><div class="page__pad q-body-page" id="qBody" style="padding-bottom:40px"></div></div>`;
  },
  mount(el, params){
    const cid = params.quiz || params.id || 'c2';
    el.dataset.coursId = cid;
    const def = QUIZZES[cid];
    if (!def){
      $('.q-body-page', el).innerHTML = emptyBox('help', 'Quiz indisponible', 'Aucun quiz n\'est associé à ce cours.');
      return;
    }
    Q = {cid:cid, i:0, ans:def.questions.map(() => -1), left:def.duree || 420, done:false};
    clearInterval(qTimer);
    qTimer = setInterval(() => {
      if (!Q || Q.done) return;
      Q.left--;
      const t = el.querySelector('.q-time');
      if (t){
        t.textContent = fmtTimer(Q.left);
        t.parentElement.classList.toggle('is-low', Q.left <= 60);
      }
      if (Q.left <= 0){ finishQuiz(el); }
    }, 1000);
    paintQuestion(el);
  },
  unmount(){ clearInterval(qTimer); qTimer = null; Q = null; }
};
const fmtTimer = s => Math.max(0, Math.floor(s / 60)) + ':' + String(Math.max(0, s % 60)).padStart(2, '0');
function qHead(){
  const def = QUIZZES[Q.cid], n = def.questions.length;
  return `<div class="quiz-top">
      <span class="q-num">QUESTION ${Q.i + 1} / ${n}</span>
      <span class="timer${Q.left <= 60 ? ' is-low' : ''}">${svg('clock', 'icon icon--16')}<span class="q-time" id="qTime">${fmtTimer(Q.left)}</span></span>
    </div>
    <div class="lp" style="margin-bottom:20px"><div class="lp__track"></div><div class="lp__bar" style="width:${Math.round((Q.i) / n * 100)}%"></div></div>`;
}
function paintQuestion(el){
  const def = QUIZZES[Q.cid], q = def.questions[Q.i];
  const last = Q.i === def.questions.length - 1;
  $('.q-body-page', el).innerHTML = `${qHead()}
    <p class="q-text">${esc(q.q)}</p>
    ${q.o.map((o, i) => `<button class="ropt ripple${Q.ans[Q.i] === i ? ' is-sel' : ''}" data-opt="${i}">
      <span class="ropt__dot"></span><span class="ropt__t">${esc(o)}</span></button>`).join('')}
    <div style="display:flex;gap:10px;margin-top:18px">
      ${Q.i > 0 ? `<button class="btn btn--outlined ripple" data-qnav="-1">${IC.back} Précédent</button>` : ''}
      <button class="btn btn--filled ripple" style="flex:1" data-qnav="1" ${Q.ans[Q.i] === -1 ? 'disabled class="btn btn--filled ripple is-disabled"' : ''}>
        ${last ? 'Terminer le quiz' : 'Suivant'} ${svg('arrow', 'icon icon--18')}</button>
    </div>
    <p class="body-small muted" style="margin-top:14px">${svg('info', 'icon icon--16')} Une seule tentative — votre meilleur score est conservé.</p>`;
}
function finishQuiz(el){
  if (!Q || Q.done) return;
  Q.done = true; clearInterval(qTimer);
  const def = QUIZZES[Q.cid];
  const n = def.questions.length;
  let bon = 0;
  def.questions.forEach((q, i) => { if (Q.ans[i] === q.a) bon++; });
  const score = Math.round(bon / n * 100);
  const prev = S.quiz[Q.cid] || {best:0, attempts:0};
  S.quiz[Q.cid] = {best:Math.max(prev.best, score), last:score, attempts:(prev.attempts || 0) + 1};
  persist();
  const perfect = score === 100;
  notification('quiz', 'Quiz terminé : ' + score + ' %', def.titre + ' — ' + bon + '/' + n + ' bonnes réponses.', ['quiz', Q.cid]);
  if (perfect) notification('badge', 'Score parfait sur un quiz 🎯', 'Continuez pour débloquer « Perfectionniste ».', ['badges','']);
  /* envoi au serveur : la correction officielle est recalculée côté API */
  if (window.LHSYNC && window.LHSYNC.actif()){
    const reponses = def.questions.map((q, i) => ({ i:i, choix:(Q.ans[i] === undefined ? -1 : Q.ans[i]) })).filter(r => r.choix >= 0);
    const duree = (QUIZZES[Q.cid] && QUIZZES[Q.cid].duree) || 0;
    window.LHSYNC.quiz(Q.cid, reponses, duree);
  }
  showResult(el, def, bon, n, score);
  refreshUI();
}
function showResult(el, def, bon, n, score){
  const msg = score >= 80 ? 'Excellent travail !' : score >= 60 ? 'Bien joué, continuez !' : 'À retravailler — relisez les leçons puis réessayez.';
  const C = 2 * Math.PI * 42;
  const body = $('.q-body-page', el);
  body.innerHTML = `
    <div class="q-result">
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="ring__track" cx="50" cy="50" r="42"/>
          <circle class="ring__val" cx="50" cy="50" r="42" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-prog="${score}" style="stroke:${score >= 60 ? 'var(--md-success)' : 'var(--md-error)'}"/>
        </svg>
        <span class="ring-wrap__label"><strong>${score}%</strong></span>
      </div>
      <h2 class="title-large">${msgsFirst(score)}</h2>
      <p>${bon} ${bon > 1 ? 'bonnes réponses' : 'bonne réponse'} sur ${n} · ${msg}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <span class="pill pill--normal">Meilleur score : ${S.quiz[Q.cid].best} %</span>
        <span class="pill pill--normal">Tentative n°${S.quiz[Q.cid].attempts}</span>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin:18px 0">
      <button class="btn btn--filled ripple" style="flex:1" data-act="retryQuiz">${svg('refresh', 'icon icon--18')} Refaire</button>
      <button class="btn btn--outlined ripple" style="flex:1" data-act="backCourse">${svg('school', 'icon icon--18')} Retour au cours</button>
    </div>
    <div class="sec__h"><h2>Correction détaillée</h2></div>
    <div class="q-review">
      ${def.questions.map((q, i) => {
        const ok = Q.ans[i] === q.a;
        const sel = Q.ans[i] === -1 ? '(sans réponse)' : q.o[Q.ans[i]];
        return `<div class="rev ${ok ? 'rev--ok' : 'rev--ko'}">
          <h4>${svg(ok ? 'check-circle' : 'close', 'icon icon--18')} <span>${esc(q.q)}</span></h4>
          <p class="ans">Votre réponse : <b>${esc(sel)}</b>${ok ? '' : '<br>Bonne réponse : <b>' + esc(q.o[q.a]) + '</b>'}</p>
          <p class="ans muted">${esc(q.e)}</p>
        </div>`;
      }).join('')}
    </div>`;
  animateProgress(body);
  defilerVers(body, $('.page__scroll', el), 'debut');   /* haut des résultats, sans déplacer l'application */
}
const msgsFirst = s => s === 100 ? 'Sans faute ! 🎉' : s >= 80 ? 'Bravo ! 👏' : s >= 60 ? 'C\'est validé ✅' : 'Presque !';
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-qnav]');
  if (nav && Q){
    const d = +nav.dataset.qnav;
    if (d > 0 && Q.ans[Q.i] === -1){ toast('Choisissez une réponse'); return; }
    const el = nav.closest('.page');
    if (d < 0) Q.i--;
    else if (Q.i < QUIZZES[Q.cid].questions.length - 1) Q.i++;
    else { finishQuiz(el); return; }
    paintQuestion(el); return;
  }
  const opt = e.target.closest('[data-opt]');
  if (opt && Q){
    Q.ans[Q.i] = +opt.dataset.opt;
    paintQuestion(opt.closest('.page'));
    return;
  }
  const quit = e.target.closest('[data-act="quitQuiz"]');
  if (quit && Q && !Q.done){
    dialog({title:'Quitter le quiz ?', text:'Votre progression dans ce quiz sera perdue (le meilleur score reste enregistré).', confirmLabel:'Quitter', danger:true, ico:'help'})
      .then(ok => { if (ok){ clearInterval(qTimer); popPage(); } });
  }
  const retry = e.target.closest('[data-act="retryQuiz"]');
  if (retry){ const el = retry.closest('.page'); clearInterval(qTimer); const cid = Q.cid; popPage(); setTimeout(() => pushPage('quiz', {quiz:cid, id:cid}), 340); }
  const back = e.target.closest('[data-act="backCourse"]');
  if (back){ const cid = Q.cid; popPage(); pushPage('cours', {id:cid}); }
});

/* ============================================================
   4. PAGE DEVOIR (+ dépôt)
   ============================================================ */
let filePick = null, linkPick = '';
PAGES.devoir = {
  render(params){
    const d = DEVOIRS.find(x => x.id === params.id) || DEVOIRS[0];
    params.id = d.id;
    const c = coursById(d.cours) || {};
    const st = devoirStatut(d);
    const date = devoirDate(d);
    const st2 = S.devoirs[d.id] || {};
    const conf = st2.statut === 'rendu';
    return `<div class="page__bar">
        <button class="icon-btn ripple page__back--bar" data-back aria-label="Retour">${IC.back}</button>
        <h1>${d.quiz ? 'Quiz noté' : 'Devoir'}</h1>
        <span class="pill ${st.k === 'rendre' ? (d.niveau === 'urgent' ? 'pill--urgent' : 'pill--soon') : 'pill--ok'}">${esc(st.label)}</span>
      </div>
      <div class="page__scroll">
        <div class="cta-bar" style="margin-bottom:0">
          ${d.quiz
            ? `<button class="btn btn--filled ripple" style="flex:1" ${conf ? 'disabled' : ''} data-act="startQuiz" data-id="${d.cours}">${svg('play', 'icon icon--18')} ${conf ? 'Quiz déjà passé' : 'Démarrer le quiz'}</button>`
            : conf
              ? `<button class="btn btn--outlined ripple" style="flex:1" data-act="unsubmit">${svg('close', 'icon icon--18')} Retirer mon rendu</button>`
              : `<button class="btn btn--filled ripple" style="flex:1" data-act="submit"><span class="sub-label" id="subBtnLabel">${svg('upload', 'icon icon--18')} Déposer le devoir</span></button>`}
        </div>
        <div class="page__pad" id="dBody">
          <h2 class="title-large" style="margin-bottom:8px">${esc(d.titre)}</h2>
          <p class="body-medium muted" style="margin-bottom:16px">${esc(c.titre || '')} · ${esc(d.type)}</p>

          <div class="card card--pad" style="display:grid;gap:2px;margin-bottom:16px">
            <div class="kv"><span>Échéance</span><b>${esc(fmtQuand(d))} à ${esc(d.echeance.h)}</b></div>
            <div class="kv"><span>Date limite</span><b>${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]}</b></div>
            <div class="kv"><span>Notation</span><b>${d.points} points</b></div>
            <div class="kv"><span>Statut</span><b>${esc(st.label)}</b></div>
            ${st2.date ? `<div class="kv"><span>Déposé le</span><b>${esc(st2.date)}</b></div>` : ''}
            ${d.note ? `<div class="kv"><span>Note obtenue</span><b>${d.note}/${d.points}</b></div>` : ''}
          </div>

          <div class="sec__h"><h2>Consignes</h2></div>
          <ol style="padding-left:18px;display:grid;gap:8px;margin-bottom:6px">
            ${d.consignes.map(x => `<li class="body-medium" style="line-height:21px">${esc(x)}</li>`).join('')}
          </ol>

          ${d.quiz ? `
            <div class="note" style="margin-top:16px">${svg('help', 'icon')}
              <span>Ce devoir est un quiz noté : lancez-le depuis le bouton en bas de page. Vous pourrez consulter la correction à la fin.</span></div>
            ${S.quiz[d.cours] ? `<div class="note note--ok" style="margin-top:10px">${svg('check-circle', 'icon')}
              <span>Quiz passé — meilleur score : <b>${S.quiz[d.cours].best} %</b> (${S.quiz[d.cours].attempts} tentative(s)).</span></div>` : ''}
          ` : `
            <div class="sec" style="margin-top:20px"><div class="sec__h"><h2>Votre rendu</h2></div>
              ${conf ? `
                <div class="file-chip">
                  ${svg('task', 'icon icon--20')}
                  <div><h4>${esc(st2.fichier || 'rendu.pdf')}</h4><p>Déposé le ${esc(st2.date || '')}${st2.taille ? ' · ' + esc(st2.taille) : ''}</p></div>
                  <span class="pill pill--ok">Rendu</span>
                </div>
                ${st2.commentaire ? `<p class="body-medium muted" style="margin-top:10px">« ${esc(st2.commentaire)} »</p>` : ''}
                <div class="note note--ok" style="margin-top:12px">${svg('check-circle', 'icon')}
                  <span>Votre fichier a bien été transmis. Vous recevrez une notification dès la correction.</span></div>
              ` : `
                <div class="drop drop-zone" id="dropZone">
                  ${svg('upload', 'icon')}
                  <p><b class="drop-title" id="dropTitle">Choisir un fichier</b><br>PDF, DOCX, ZIP ou IPYNB — 25 Mo max.</p>
                </div>
                <input type="file" class="f-file" id="fFile" hidden>
                <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
                  <button class="btn btn--tonal ripple" data-act="chooseFile">${svg('upload', 'icon icon--18')} Parcourir</button>
                  <button class="btn btn--outlined ripple" data-act="linkFile">${svg('external', 'icon icon--18')} Joindre un lien</button>
                </div>
                <div class="file-slot" id="fileChip"></div>
                <div class="sec" style="margin-top:18px"><div class="sec__h"><h2>Commentaire (facultatif)</h2></div>
                  <div class="field field--area"><textarea class="sub-comment" id="subComment" placeholder=" "></textarea><label for="subComment">Un mot pour votre formateur…</label></div>
                </div>
              `}
            </div>
          `}
        </div>
      </div>`;
  },
  mount(el, params){
    const d = DEVOIRS.find(x => x.id === params.id);
    el.dataset.devoirId = d.id;
    el.dataset.coursId = d.cours;
    if (el._bound) return;
    el._bound = true;
    const f = $('.f-file', el);
    if (f){
      f.addEventListener('change', () => {
        if (f.files && f.files[0]) setFile(el, f.files[0].name, fmtPoids(f.files[0].size));
      });
      const zone = $('.drop-zone', el);
      if (zone) zone.addEventListener('click', () => f.click());
    }
  },
  refresh(el, params){
    el.innerHTML = PAGES.devoir.render(params);
    hydrate(el);
    PAGES.devoir.mount(el, params);
  }
};
function fmtPoids(o){
  if (o >= 1048576) return (o / 1048576).toFixed(1) + ' Mo';
  if (o >= 1024) return Math.max(1, Math.round(o / 1024)) + ' Ko';
  return Math.max(1, o) + ' o';
}
function setFile(el, nom, taille){
  filePick = {nom:nom, taille:taille};
  const chip = $('.file-slot', el);
  const dt = $('.drop-title', el);
  if (dt) dt.textContent = 'Remplacer le fichier';
  if (chip) chip.innerHTML = `<div class="file-chip">
      ${svg('task', 'icon icon--20')}
      <div><h4>${esc(nom)}</h4><p>${esc(taille)} · prêt à être déposé</p></div>
      <button class="icon-btn ripple" data-act="clearFile" aria-label="Retirer">${svg('close', 'icon icon--20')}</button>
    </div>`;
}
function askLink(){
  let val = '';
  return new Promise(res => {
    dialog({
      title:'Joindre un lien', confirmLabel:'Ajouter', ico:'external',
      onOpen(box){
        box.querySelector('.dialog__card').insertAdjacentHTML('beforeend',
          `<p style="text-align:left;margin-top:12px"></p>`);
        const p = box.querySelector('.dialog__card p:last-of-type');
        p.innerHTML = `<span class="field dialog__field" style="display:block;margin:0"><input id="dlink" placeholder=" " style="width:100%"><label for="dlink">https://…</label></span>`;
        const i = box.querySelector('#dlink');
        i.addEventListener('input', () => { val = i.value.trim(); });
        setTimeout(() => i.focus(), 120);
        box.addEventListener('click', e => {
          const b = e.target.closest('[data-d="1"]');
          if (b) res((i.value || val).trim());     // lit le champ au moment de valider
        });
      }
    }).then(ok => { if (!ok) res(''); });          // annuler débloque la promesse
  });
}

/* ============================================================
   5. ÉCRITURE DES NOTES (autosave) + ANIMATIONS
   ============================================================ */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'noteTxt'){
    const el = t.closest('.page');
    const cid = el && el.dataset.coursId ? el.dataset.coursId : (A.topPage() && A.topPage().params.id);
    clearTimeout(t._t);
    t._t = setTimeout(() => {
      S.notes[cid] = t.value; persist();
      const info = $('.note-info', el), saved = $('.note-saved', el);
      if (info) info.textContent = t.value.trim() ? t.value.trim().split(/\s+/).length + ' mots' : 'Aucune note pour le moment';
      if (saved){ saved.textContent = 'Enregistré ✓'; setTimeout(() => { saved.textContent = ''; }, 1600); }
    }, 600);
  }
  if (t.id === 'fFile') return;
});

/* ============================================================
   6. INITIALISATION : vue mois de l'agenda
   ============================================================ */
(function initAgenda(){
  const seg = $('#segView');
  const box = $('#monthBox');
  function apply(mode){
    if (!box) return;
    if (mode === 'mois'){
      $('#weekStrip').style.display = 'none';
      box.hidden = false;
      A.renderMonth();
      const t = $('#timelineTitle');
      if (t) t.hidden = false;
    } else {
      box.hidden = true;
      $('#weekStrip').style.display = '';
      const t = $('#timelineTitle');
      if (t) t.hidden = true;
      const active = $('#weekStrip .is-active');
      A.renderTimeline ? A.renderTimeline(+(active ? active.dataset.day : (today.getDay() + 6) % 7)) : null;
    }
  }
  if (seg) seg.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) apply(b.dataset.seg);
  });
})();

})();
