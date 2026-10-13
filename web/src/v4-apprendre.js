/* ============================================================
   V4 — APPRENDRE AUTREMENT : examens blancs, émargement,
   écoute des leçons, mode atelier, glossaire
   ------------------------------------------------------------
   Ces écrans servent sur le téléphone, souvent les mains prises :
   un examen blanc pour se tester avant la vraie évaluation, un
   code à taper pour pointer sa présence, une voix qui lit la leçon
   pendant qu'on pèse la soude, des étapes une par une, et les mots
   du métier expliqués en français.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte;
const quand = V3.quand || (d => (d ? new Date(d).toLocaleDateString('fr-FR') : ''));

/* ------------------------------------------------------------
   1. EXAMENS BLANCS
   ------------------------------------------------------------ */
let EX = { profil: false, liste: [], cours: [], charge: false };

function pageExamens(){ return A.barPage('Examens blancs', '', `<div id="exCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function examensCharger(){
  const zone = document.getElementById('exCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-examens');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){
    zone.innerHTML = carte('Examens indisponibles', `<p class="body-medium">Impossible de joindre le serveur pour le moment.</p>
      <button class="btn btn--tonal btn--block ripple" style="margin-top:10px" data-act="exRecharger">${svg('refresh','icon icon--18')} Réessayer</button>`, { ico: 'cloud' });
    return;
  }
  EX = { profil: !!d.prof, liste: d.examens || [], cours: d.cours || [], charge: true };
  if (EX.profil){
    zone.innerHTML = `
      ${carte('Créer un examen blanc', `
        <p class="body-medium">Le tirage se fait dans la banque de questions du cours. Si elle est vide, les
        questions des quiz du cours y sont copiées automatiquement : vous n'avez rien à ressaisir.</p>
        <label class="v3-champ"><span>Cours</span><select id="exCours" class="v3-select">
          ${EX.cours.map(c => `<option value="${esc(c.id)}">${esc(c.titre)}</option>`).join('')}</select></label>
        <label class="v3-champ" style="display:block"><span>Titre</span><input id="exTitre" placeholder="Examen blanc — savonnerie"></label>
        <div class="v3-grille v3-grille--2">
          <label class="v3-champ"><span>Durée (min)</span><input id="exDuree" type="number" min="5" max="180" value="30"></label>
          <label class="v3-champ"><span>Questions</span><input id="exNb" type="number" min="3" max="60" value="10"></label>
        </div>
        <div class="v3-grille v3-grille--2">
          <label class="v3-champ"><span>Seuil de réussite (%)</span><input id="exSeuil" type="number" min="0" max="100" value="60"></label>
          <label class="v3-champ"><span>Thème</span><input id="exTheme" placeholder="qualité"></label>
        </div>
        <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="exCreer">${svg('plus','icon icon--18')} Ouvrir l'examen</button>
        <p class="body-small muted" style="margin-top:8px">Pour ajouter vos propres questions en masse :
          <a class="texte-lien" href="/formateur/questions" data-lien>banque de questions</a>.</p>`, { ico: 'medal' })}
      ${EX.liste.length ? `<div class="v3-liste">${EX.liste.map(x => `
        <a class="v4-admin-row" href="/examens/${esc(x.id)}" data-lien>
          <span class="v4-admin-row__main"><b>${esc(x.titre)}</b>
            <span class="body-small muted">${esc(x.cours_titre || '')} · ${x.nb_questions} questions · ${x.duree} min · seuil ${x.seuil} %</span>
            <span class="body-small muted">${x.passages} passage(s)${x.moyenne ? ' · moyenne ' + x.moyenne + ' %' : ''} · ${x.publie ? 'ouvert' : 'brouillon'}</span></span>
          <span class="v4-tag${x.publie ? ' v4-tag--ok' : ''}">${x.publie ? 'ouvert' : 'fermé'}</span>
        </a>`).join('')}</div>`
        : carte('Aucun examen', '<p class="body-medium">Ouvrez un examen blanc : vos apprenants se testent avant l\'évaluation finale.</p>', { ico: 'medal' })}`;
    return;
  }
  zone.innerHTML = `
    ${carte('À quoi sert un examen blanc', `
      <p class="body-medium">Il dure le temps de l'épreuve réelle, se corrige tout de suite, et vous gagnez
      15 points quand vous passez le seuil. Les questions viennent du cours que vous avez débloqué.</p>`, { ico: 'medal' })}
    ${EX.liste.length ? `<div class="v3-liste">${EX.liste.map(x => {
      const dernier = x.dernier_sur ? Math.round((x.derniere_note * 100) / x.dernier_sur) : null;
      return `<a class="v4-admin-row" href="/examens/${esc(x.id)}" data-lien>
        <span class="v4-admin-row__main"><b>${esc(x.titre)}</b>
          <span class="body-small muted">${esc(x.cours_titre || '')} · ${x.nb_questions} questions · ${x.duree} min</span>
          <span class="body-small muted">${x.essais ? x.essais + ' essai(s)' + (dernier !== null ? ' · dernier score ' + dernier + ' %' : '') : 'jamais passé'}</span></span>
        <span class="v4-tag${dernier !== null && dernier >= x.seuil ? ' v4-tag--ok' : ''}">${dernier !== null ? dernier + ' %' : 'à passer'}</span>
      </a>`; }).join('')}</div>`
      : carte('Aucun examen ouvert', `<p class="body-medium">Votre formateur n'a pas encore ouvert d'examen blanc sur vos cours.
         En attendant, les <a class="texte-lien" href="/quiz/c1" data-lien>quiz</a> et les
         <a class="texte-lien" href="/revision" data-lien>révisions</a> préparent très bien.</p>`, { ico: 'clock' })}`;
}

/* --- passer un examen --- */
let PASS = { examen: null, questions: [], reponses: {}, debut: 0, minuteur: null };
function pageExamenDetail(){ return A.barPage('Examen blanc', '', `<div id="edCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function examenDetail(params){
  const zone = document.getElementById('edCorps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez un examen', '<p class="body-medium">Cet écran s\'ouvre depuis la liste des examens blancs.</p>', { ico: 'medal' }); return; }
  const r = await V3.lire('/api/p4-examens/' + encodeURIComponent(id));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Examen indisponible', `<p class="body-medium">${esc(r.erreur || 'Cet examen n\'existe pas ou n\'est pas ouvert.')}</p>`, { ico: 'help' });
    return;
  }
  const x = r.data.examen, questions = r.data.questions || [];
  PASS = { examen: x, questions: questions, reponses: {}, debut: Date.now(), minuteur: null };
  A.titreOnglet && A.titreOnglet(x.titre);
  zone.innerHTML = `
    ${carte(x.titre, `
      <p class="body-medium">${esc((r.data.cours && r.data.cours.titre) || '')} · ${x.nb_questions} questions · ${x.duree} minutes · réussite à ${x.seuil} %</p>
      <p class="v4-minuteur" id="edMinuteur">${String(x.duree).padStart(2, '0')}:00</p>
      <p class="body-small muted">Une seule réponse par question. Aucune correction n'apparaît avant la remise de la copie.</p>
      ${r.data.tentatives.length ? `<p class="body-small muted" style="margin-top:8px">Déjà passé : ${r.data.tentatives.map(t => t.note + '/' + t.sur + ' le ' + quand(t.created_at)).join(' · ')}</p>` : ''}`, { ico: 'medal' })}
    <div class="v3-liste" id="edQuestions">
      ${questions.map((q, i) => `
        <div class="v4-etape" data-question="${esc(q.id)}">
          <h3>${i + 1}. ${esc(q.question)}</h3>
          <div class="v3-liste">
            ${(q.options || []).map((o, j) => `
              <label class="v4-coche" style="align-items:flex-start">
                <input type="radio" name="q${esc(q.id)}" data-rep="${esc(q.id)}" value="${j}">
                <span class="body-medium">${esc(o)}</span>
              </label>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <button class="btn btn--filled btn--block ripple" data-act="edRendre" data-id="${esc(x.id)}">${svg('check-circle','icon icon--18')} Remettre ma copie</button>
    <div id="edResultat" style="margin-top:14px"></div>`;
  /* minuteur : à zéro, la copie part toute seule */
  const restant = () => Math.max(0, x.duree * 60 - Math.floor((Date.now() - PASS.debut) / 1000));
  const tic = () => {
    const el = document.getElementById('edMinuteur');
    if (!el) return;
    const s = restant();
    el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    if (s <= 0){ clearInterval(PASS.minuteur); A.toast('Temps écoulé : la copie est remise'); rendre(id); }
  };
  tic();
  PASS.minuteur = setInterval(tic, 1000);
}

async function rendre(id){
  if (PASS.minuteur){ clearInterval(PASS.minuteur); PASS.minuteur = null; }
  const reponses = PASS.questions.map(q => {
    const sel = document.querySelector('input[name="q' + q.id + '"]:checked');
    return { questionId: q.id, option: sel ? parseInt(sel.value, 10) : null };
  });
  const vide = reponses.filter(r => r.option === null).length;
  if (vide){
    const ok = await A.dialog({
      title: 'Questions sans réponse',
      text: vide + ' question(s) n\'ont pas de réponse. Elles compteront comme fausses.',
      confirmLabel: 'Remettre', cancelLabel: 'Continuer', ico: 'help'
    });
    if (!ok) return;
  }
  const dureeS = Math.round((Date.now() - (PASS.debut || Date.now())) / 1000);
  const r = await V3.ecrire('/api/p4-examens/' + encodeURIComponent(id), { reponses: reponses, dureeS: dureeS });
  const zone = document.getElementById('edResultat');
  if (!r.ok || !r.data){
    if (zone) zone.innerHTML = carte('Copie non enregistrée', `<p class="body-medium">${esc(r.erreur || 'Réessayez')}</p>`, { ico: 'cloud' });
    return;
  }
  const d = r.data;
  if (zone){
    zone.innerHTML = `
      ${carte(d.reussi ? 'Réussi' : 'À retravailler', `
        <p class="v3-big">${d.note} / ${d.sur} — ${d.pourcent} %</p>
        <p class="body-medium">${d.reussi
          ? 'Vous passez le seuil de ' + d.seuil + ' % : +15 points d\'entraînement.'
          : 'Le seuil est de ' + d.seuil + ' %. Relisez les corrections ci-dessous et retentez quand vous voulez : +2 points à chaque passage.'}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn btn--tonal btn--sm ripple" data-act="edRefaire" data-id="${esc(id)}">Repasser</button>
          <a class="btn btn--outlined btn--sm ripple" href="/examens" data-lien>Tous les examens</a>
          <a class="btn btn--outlined btn--sm ripple" href="/points" data-lien>Mes points</a>
        </div>`, { ico: d.reussi ? 'trophy' : 'refresh' })}
      ${carte('Correction', `<div class="v3-liste">${d.detail.map((q, i) => `
        <div class="v4-etape">
          <h3>${q.juste ? '✅' : '❌'} ${i + 1}. ${esc(q.question)}</h3>
          <p class="body-small">Bonne réponse : <b>${q.bonnes.map(b => esc((PASS.questions.find(x => x.id === q.id) || {}).options ? PASS.questions.find(x => x.id === q.id).options[b] : b)).join(', ')}</b></p>
          ${q.choisi !== null && !q.juste ? `<p class="body-small muted">Votre réponse : ${esc((PASS.questions.find(x => x.id === q.id) || {}).options ? (PASS.questions.find(x => x.id === q.id).options[q.choisi] || '') : '')}</p>` : ''}
          ${q.explication ? `<p class="body-small" style="margin-top:4px">${esc(q.explication)}</p>` : ''}
        </div>`).join('')}</div>`, { ico: 'task' })}`;
  }
  A.toast(d.reussi ? 'Examen réussi ✅' : 'Copie corrigée');
  setTimeout(() => { if (zone) zone.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
}

/* ------------------------------------------------------------
   2. ÉMARGEMENT PAR CODE
   ------------------------------------------------------------ */
function pageEmargement(){
  return A.barPage('Émargement', '', `
    ${carte('Pointer ma présence', `
      <p class="body-medium">Votre formateur affiche un code à six chiffres pendant la séance.
      Tapez-le ici : votre présence est enregistrée et vous gagnez 5 points d'assiduité.</p>
      <label class="v3-champ" style="display:block"><span>Code affiché à l'écran</span>
        <input id="emCode" inputmode="numeric" maxlength="8" placeholder="123456" style="width:100%;font-size:22px;letter-spacing:6px;text-align:center"></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="emPointer">${svg('check-circle','icon icon--18')} Pointer ma présence</button>
      <div id="emResultat" style="margin-top:12px"></div>`, { ico: 'check-circle' })}
    ${carte('Formateur', `
      <p class="body-medium">Le code se génère depuis l'écran des séances : il change à chaque fois et expire au bout de 25 minutes.</p>
      <a class="btn btn--tonal btn--block ripple" style="margin-top:10px" href="/formateur/seances" data-lien>${svg('calendar','icon icon--18')} Ouvrir mes séances</a>`, { ico: 'code' })}`);
}

/* ------------------------------------------------------------
   3. ÉCOUTE DES LEÇONS (voix du téléphone, hors ligne)
   ------------------------------------------------------------ */
const LECT = { files: [], index: 0, enCours: false, voix: null, debit: 1 };

function pageEcoute(){ return A.barPage('Écoute du cours', '', `<div id="ecCorps"><p class="body-small muted">Chargement…</p></div>`); }
function ecouteCharger(params){
  const zone = document.getElementById('ecCorps');
  if (!zone) return;
  const cid = (params && params.id) || 'c1';
  const c = A.coursById ? A.coursById(cid) : null;
  const prog = (A.PROGRAMMES && A.PROGRAMMES[cid]) || [];
  const quiz = (A.QUIZZES && A.QUIZZES[cid] && A.QUIZZES[cid].questions) || [];
  const deck = (window.LHV3APPRENDRE && window.LHV3APPRENDRE.DECK || []).filter(x => x.c === cid);
  const fichiers = [];
  fichiers.push({ titre: 'Présentation du cours', texte: (c ? c.titre + '. ' + (c.cat || '') + '. Cours animé par ' + (c.prof || 'votre formateur') + '. ' + (c.desc || '') : 'Cours ' + cid) });
  prog.forEach(m => {
    fichiers.push({ titre: 'Module — ' + m.m, texte: m.m + '. ' + m.l.map(l => l.t + ', ' + l.d + '.').join(' ') });
  });
  if (deck.length) fichiers.push({ titre: 'À retenir', texte: deck.map(x => x.q.replace(/\?$/, '') + ' : ' + x.a + '.').join(' ') });
  if (quiz.length) fichiers.push({ titre: 'Auto-contrôle', texte: quiz.map(q => q.q + ' Réponse : ' + q.o[q.a] + '.').join(' ') });
  LECT.files = fichiers;
  const dispo = 'speechSynthesis' in window;
  zone.innerHTML = `
    ${carte('Écouter le cours', `
      <p class="body-medium">${dispo
        ? 'La voix du téléphone lit le cours à voix haute : utile les mains occupées, ou pour réviser les yeux fermés. La lecture fonctionne hors connexion et n\'envoie rien à l\'extérieur.'
        : 'Ce navigateur ne propose pas de synthèse vocale : le texte reste lisible ci-dessous, à voix haute ou à voix basse.'}</p>
      <div class="v3-grille v3-grille--2" style="margin-top:10px">
        <div class="v4-kpi"><b>${fichiers.length}</b><span>pistes</span></div>
        <div class="v4-kpi"><b>${fichiers.reduce((n, f) => n + f.texte.split(/\s+/).length, 0)}</b><span>mots environ</span></div>
      </div>
      <div class="v3-champ"><span>Vitesse</span><input id="ecDebit" type="range" min="0.6" max="1.6" step="0.1" value="1"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn--filled btn--sm ripple" data-act="ecLire" ${dispo ? '' : 'disabled'}>${svg('volume','icon icon--18')} Lire</button>
        <button class="btn btn--tonal btn--sm ripple" data-act="ecPause" ${dispo ? '' : 'disabled'}>Pause</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="ecStop" ${dispo ? '' : 'disabled'}>Arrêter</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="ecSuivant" ${dispo ? '' : 'disabled'}>Piste suivante</button>
      </div>
      <p class="body-small muted" style="margin-top:8px" id="ecEtat">Prêt.</p>`, { ico: 'volume' })}
    <div class="v3-liste">${fichiers.map((f, i) => `
      <div class="v4-etape" id="ecPiste${i}">
        <h3>${i + 1}. ${esc(f.titre)}</h3>
        <p class="body-medium">${esc(f.texte)}</p>
        <button class="text-btn ripple" data-act="ecLirePiste" data-index="${i}" ${dispo ? '' : 'disabled'}>${svg('play','icon icon--18')} Lire cette piste</button>
      </div>`).join('')}</div>
    <p class="body-small muted" style="margin-top:12px">Autres cours :
      ${(A.COURS || []).map(x => `<a class="texte-lien" href="/ecoute/${esc(x.id)}" data-lien>${esc(x.titre)}</a>`).join(' · ')}</p>`;
}

function lire(piste){
  const f = LECT.files[piste];
  if (!f){ A.toast('Aucune piste à lire'); return; }
  /* l'écran réagit tout de suite : la piste en cours s'affiche, même sans voix installée */
  LECT.enCours = true; LECT.index = piste;
  const etat = document.getElementById('ecEtat');
  if (etat) etat.textContent = 'Lecture : ' + f.titre;
  document.querySelectorAll('[id^="ecPiste"]').forEach((el, i) => el.classList.toggle('v4-etape--actif', i === piste));
  if (!('speechSynthesis' in window)){
    if (etat) etat.textContent = 'Piste ' + (piste + 1) + ' : ' + f.titre + ' — cet appareil n\'a pas de voix, le texte reste affiché.';
    A.toast('Pas de synthèse vocale sur cet appareil');
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(f.texte);
  u.lang = 'fr-FR';
  u.rate = LECT.debit;
  const voix = window.speechSynthesis.getVoices().find(v => /fr/i.test(v.lang));
  if (voix) u.voice = voix;
  u.onstart = () => {
    const etat = document.getElementById('ecEtat');
    if (etat) etat.textContent = 'Lecture en cours : ' + f.titre;
  };
  u.onend = () => {
    LECT.enCours = false;
    if (window.__lhEcouteContinue && piste + 1 < LECT.files.length) lire(piste + 1);
    else {
      const etat = document.getElementById('ecEtat');
      if (etat) etat.textContent = 'Fin de la lecture.';
    }
  };
  window.speechSynthesis.speak(u);
}

/* ------------------------------------------------------------
   4. MODE ATELIER — les mains occupées
   ------------------------------------------------------------ */
let ATL = { id: '', etapes: [], etape: 0, minuteur: null, fin: 0 };
const MINUTEURS = [5, 10, 15, 30, 45];

function pageAtelierPratique(){ return A.barPage('Atelier pas-à-pas', '', `<div id="atpCorps"><p class="body-small muted">Chargement…</p></div>`); }
function atelierCharger(params){
  const zone = document.getElementById('atpCorps');
  if (!zone) return;
  const cid = (params && params.id) || 'c1';
  const c = A.coursById ? A.coursById(cid) : null;
  const prog = (A.PROGRAMMES && A.PROGRAMMES[cid]) || [];
  const etapes = [];
  prog.forEach(m => m.l.forEach(l => etapes.push({ module: m.m, titre: l.t, duree: l.d, video: l.v || '' })));
  const fiches = (window.LHV3APPRENDRE && window.LHV3APPRENDRE.DECK || []).filter(x => x.c === cid);
  ATL = { id: cid, etapes: etapes, etape: 0, minuteur: null, fin: 0 };
  zone.innerHTML = `
    ${carte('Mode atelier', `
      <p class="body-medium">${esc(c ? c.titre : 'Cours')} — ${etapes.length} étapes. On affiche une seule étape à la fois,
      en gros, avec un minuteur. Le bouton « lire » fait la voix pour vous quand vous avez les mains dans la pâte.</p>
      ${fiches.length ? `<p class="body-small muted" style="margin-top:8px">Pensez à garder la fiche sous les yeux :
        <a class="texte-lien" href="/fiche/${esc(cid)}" data-lien>fiche de révision</a>.</p>` : ''}`, { ico: 'flask' })}
    <div id="atlEtape"></div>
    <div id="atlMinuteur"></div>
    <div class="v3-liste">${etapes.map((e, i) => `
      <div class="v4-etape${i === 0 ? ' v4-etape--actif' : ''}" id="atpEtape${i}">
        <h3>${i + 1}. ${esc(e.titre)}</h3>
        <p class="body-small muted">${esc(e.module)} · ${esc(e.duree || '')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          <button class="btn btn--tonal btn--sm ripple" data-act="atlLire" data-index="${i}" data-titre="${esc(e.titre)}">${svg('volume','icon icon--18')} Lire</button>
          <button class="btn btn--outlined btn--sm ripple" data-act="atlSelect" data-index="${i}">Étape en cours</button>
          ${e.video ? `<a class="btn btn--outlined btn--sm ripple" href="/video/${esc(e.video)}" data-lien>Voir la vidéo</a>` : ''}
        </div>
      </div>`).join('')}</div>
    <p class="body-small muted" style="margin-top:12px">La vidéo s'ouvre dans le lecteur, la fiche reste accessible :
      rien ne ferme ce que vous êtes en train de faire.</p>`;
  peindreEtape();
}

function peindreEtape(){
  const zone = document.getElementById('atlEtape');
  if (!zone) return;
  const e = ATL.etapes[ATL.etape];
  if (!e){ zone.innerHTML = ''; return; }
  zone.innerHTML = carte('Étape ' + (ATL.etape + 1) + ' / ' + ATL.etapes.length, `
    <p class="headline-small" style="margin:0 0 4px">${esc(e.titre)}</p>
    <p class="body-medium muted">${esc(e.module)} · ${esc(e.duree || '')}</p>
    <p class="body-small muted" id="atlEtat">${esc(ATL.etat || 'Étape ' + (ATL.etape + 1) + ' affichée')}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn btn--outlined btn--sm ripple" data-act="atlPrec" ${ATL.etape === 0 ? 'disabled' : ''}>← Précédente</button>
      <button class="btn btn--filled btn--sm ripple" data-act="atlSuiv" ${ATL.etape + 1 >= ATL.etapes.length ? 'disabled' : ''}>Suivante →</button>
      <button class="btn btn--tonal btn--sm ripple" data-act="atlLire" data-index="${ATL.etape}" data-titre="${esc(e.titre)}">${svg('volume','icon icon--18')} Lire</button>
    </div>`, { ico: 'flask' });
  const mz = document.getElementById('atlMinuteur');
  if (mz) mz.innerHTML = carte('Minuteur', `
    <p class="v4-minuteur" id="atlChrono">--:--</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${MINUTEURS.map(m => `<button class="btn btn--outlined btn--sm ripple" data-act="atlMinuteur" data-min="${m}">${m} min</button>`).join('')}
      <button class="btn btn--tonal btn--sm ripple" data-act="atlStopMinuteur">Arrêter</button>
    </div>
    <p class="body-small muted" style="margin-top:8px">À la fin du temps, un signal sonore et une phrase vous préviennent : vous pouvez avoir les mains occupées.</p>`, { ico: 'clock' });
}

function minuteur(minutes){
  if (ATL.minuteur) clearInterval(ATL.minuteur);
  ATL.fin = Date.now() + minutes * 60_000;
  const tic = () => {
    const el = document.getElementById('atlChrono');
    if (!el) return;
    const s = Math.max(0, Math.round((ATL.fin - Date.now()) / 1000));
    el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    if (s <= 0){
      clearInterval(ATL.minuteur); ATL.minuteur = null;
      signalMinuteur(minutes);
    }
  };
  tic();
  ATL.minuteur = setInterval(tic, 1000);
  A.toast('Minuteur lancé : ' + minutes + ' minutes');
}

function signalMinuteur(minutes){
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx){
      const ctx = new Ctx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.08;
      o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 900);
    }
  } catch (e) {}
  if ('speechSynthesis' in window){
    const u = new SpeechSynthesisUtterance(minutes + ' minutes écoulées. Étape suivante.');
    u.lang = 'fr-FR';
    window.speechSynthesis.speak(u);
  }
  A.toast('Temps écoulé : ' + minutes + ' minutes');
}

/* ------------------------------------------------------------
   5. GLOSSAIRE (français)
   ------------------------------------------------------------ */
let GLO = { termes: [], familles: [], q: '', famille: '' };
function pageGlossaire(){ return A.barPage('Glossaire', '', `<div id="glCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function glossaireCharger(){
  const zone = document.getElementById('glCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-glossaire' + (GLO.famille ? '?famille=' + encodeURIComponent(GLO.famille) : ''));
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Glossaire indisponible', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  GLO.termes = d.termes; GLO.familles = d.familles;
  zone.innerHTML = `
    <div class="v3-champ" style="margin-bottom:10px"><input id="glQ" placeholder="Chercher un mot : INCI, trace, surgras…" value="${esc(GLO.q)}"></div>
    <div class="tabs" style="overflow-x:auto;margin-bottom:12px">
      <button class="tab${GLO.famille === '' ? ' is-active' : ''}" data-glfamille="">Tout</button>
      ${d.familles.map(f => `<button class="tab${GLO.famille === f ? ' is-active' : ''}" data-glfamille="${esc(f)}">${esc(f)}</button>`).join('')}
    </div>
    <p class="body-small muted">${d.termes.length} mot(s) expliqué(s) — ${d.total} au total.</p>
    <div class="v3-liste">${d.termes.map(t => `
      <div class="v4-etape">
        <h3>${esc(t.mot)} <span class="v4-tag-texte">${esc(t.famille)}</span></h3>
        <p class="body-medium">${esc(t.definition)}</p>
        ${t.pratique ? `<p class="body-small" style="margin-top:6px"><b>En pratique :</b> ${esc(t.pratique)}</p>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          <button class="text-btn ripple" data-act="glLire" data-mot="${esc(t.mot)}" data-texte="${esc(t.definition + ' ' + (t.pratique || ''))}">${svg('volume','icon icon--18')} Écouter</button>
          ${(t.voir || []).map(v => `<span class="body-small muted">voir aussi ${esc(v)}</span>`).join('')}
        </div>
      </div>`).join('')}</div>`;
}

/* ------------------------------------------------------------
   6. MODE TEXTE SEUL — on coupe les images et les vidéos
   ------------------------------------------------------------ */
const CLE_TEXTE = 'lh_texte_seul';
function appliquerTexteSeul(){
  let actif = false;
  try { actif = localStorage.getItem(CLE_TEXTE) === '1'; } catch (e) {}
  document.body.classList.toggle('v4-texte-seul', actif);
  return actif;
}
(function(){
  const base = A.PAGES.accessibilite;
  if (!base) return;
  const ancien = base.render;
  A.PAGES.accessibilite = Object.assign({}, base, { render(p){
    const actif = (() => { try { return localStorage.getItem(CLE_TEXTE) === '1'; } catch (e) { return false; } })();
    return ancien(p).replace('<div class="page__scroll">',
      '<label class="v4-coche" style="margin:0 0 12px"><input type="checkbox" id="txSeul" ' + (actif ? 'checked' : '') + '> Mode texte seul — je coupe les images et les vidéos</label>' +
      '<div class="page__scroll">');
  } });
  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'txSeul'){
      try { localStorage.setItem(CLE_TEXTE, e.target.checked ? '1' : '0'); } catch (err) {}
      appliquerTexteSeul();
      A.toast(e.target.checked ? 'Mode texte seul activé : rien ne se télécharge' : 'Images et vidéos de nouveau affichées');
    }
  });
})();

/* ------------------------------------------------------------ écrans */
A.PAGES.examens = { single: true, render: pageExamens, mount(){ examensCharger(); } };
A.PAGES.examenDetail = { single: true, render: pageExamenDetail, mount(el, params){ examenDetail(params); } };
A.PAGES.emargement = { single: true, render: pageEmargement };
A.PAGES.ecoute = { single: true, render: pageEcoute, mount(el, params){ ecouteCharger(params); } };
A.PAGES.atelierPratique = { single: true, render: pageAtelierPratique, mount(el, params){ atelierCharger(params); } };
A.PAGES.glossaire = { single: true, render: pageGlossaire, mount(){ glossaireCharger(); } };

window.LHV4APPRENDRE = { examen: examenDetail, ecoute: ecouteCharger, atelier: atelierCharger, glossaire: glossaireCharger, appliquerTexteSeul };

/* ------------------------------------------------------------ gestes */
document.addEventListener('click', async e => {
  const t = e.target;

  if (t.closest('[data-act="exRecharger"]')){ examensCharger(); return; }
  if (t.closest('[data-act="exCreer"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    if (val('exTitre').length < 4){ A.toast('Donnez un titre à l\'examen'); return; }
    const r = await V3.ecrire('/api/p4-examens', {
      courseId: val('exCours'), titre: val('exTitre'), duree: parseInt(val('exDuree'), 10) || 30,
      nbQuestions: parseInt(val('exNb'), 10) || 10, seuil: parseInt(val('exSeuil'), 10) || 60,
      theme: val('exTheme'), publie: true });
    A.toast(r.ok ? 'Examen ouvert ✅' : (r.erreur || 'Création impossible'));
    if (r.ok) examensCharger();
    return;
  }
  const rend = t.closest('[data-act="edRendre"]');
  if (rend){ rendre(rend.dataset.id); return; }
  const refaire = t.closest('[data-act="edRefaire"]');
  if (refaire){
    if (PASS.minuteur){ clearInterval(PASS.minuteur); PASS.minuteur = null; }
    examenDetail({ id: refaire.dataset.id });
    return;
  }

  if (t.closest('[data-act="emPointer"]')){
    const champ = document.getElementById('emCode');
    const code = ((champ && champ.value) || '').replace(/\s/g, '');
    if (code.length < 4){ A.toast('Tapez le code affiché en séance'); return; }
    const b = t.closest('[data-act="emPointer"]');
    b.disabled = true;
    const r = await V3.ecrire('/api/p4-seances/emarger', { code: code });
    b.disabled = false;
    const zone = document.getElementById('emResultat');
    if (zone){
      zone.innerHTML = r.ok
        ? carte(r.data.deja ? 'Déjà pointé' : 'Présence enregistrée', `
            <p class="body-medium">${esc(r.data.message || '')}</p>
            ${r.data.seance ? `<div class="v3-fiche" style="margin-top:8px">
              <div><span>Séance</span><b>${esc(r.data.seance.titre || '')}</b></div>
              <div><span>Date</span><b>${esc(r.data.seance.date_session ? new Date(r.data.seance.date_session).toLocaleDateString('fr-FR') : 'à venir')}</b></div>
              ${r.data.seance.heure ? `<div><span>Heure</span><b>${esc(r.data.seance.heure)}</b></div>` : ''}
              ${r.data.seance.salle ? `<div><span>Salle</span><b>${esc(r.data.seance.salle)}</b></div>` : ''}
            </div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
              <a class="btn btn--tonal btn--sm ripple" href="/points" data-lien>Mes points</a>
              <a class="btn btn--outlined btn--sm ripple" href="/agenda" data-lien>Agenda</a>
            </div>`, { ico: 'check-circle' })
        : carte('Code refusé', `<p class="body-medium">${esc(r.erreur || 'Ce code n\'est pas valable')}</p>`, { ico: 'lock' });
    }
    A.toast(r.ok ? (r.data.message || 'Présence enregistrée') : (r.erreur || 'Émargement impossible'));
    if (r.ok && champ) champ.value = '';
    return;
  }

  const lirTout = t.closest('[data-act="ecLire"]');
  if (lirTout){ window.__lhEcouteContinue = true; lire(0); return; }
  const lirSuivant = t.closest('[data-act="ecSuivant"]');
  if (lirSuivant){ lire(Math.min(LECT.files.length - 1, LECT.index + 1)); return; }
  const lirPiste = t.closest('[data-act="ecLirePiste"]');
  if (lirPiste){ lire(parseInt(lirPiste.dataset.index, 10) || 0); return; }
  const lirAtelier = t.closest('[data-act="atlLire"]');
  if (lirAtelier){
    const i = parseInt(lirAtelier.dataset.index, 10) || 0;
    /* mode atelier : on lit la leçon et l'étape en cours */
    const e = ATL.etapes[i];
    if (!e) return;
    const fiche = (window.LHV3APPRENDRE && window.LHV3APPRENDRE.DECK || []).filter(x => x.c === ATL.id);
    const complement = fiche.filter(x => e.titre.toLowerCase().indexOf(x.q.toLowerCase().slice(0, 12)) >= 0)
      .map(x => x.a).join(' ');
    ATL.etat = 'Lecture de l\'étape ' + (i + 1) + ' : ' + e.titre;
    const etat = document.getElementById('atlEtat');
    if (etat) etat.textContent = ATL.etat;
    document.querySelectorAll('[id^="atpEtape"]').forEach((el, j) => el.classList.toggle('v4-etape--actif', j === i));
    lireTexte('Étape ' + (i + 1) + '. ' + e.titre + '. ' + (e.module || '') + '. ' + complement);
    return;
  }
  if (t.closest('[data-act="ecPause"]')){
    if ('speechSynthesis' in window){ window.speechSynthesis.paused ? window.speechSynthesis.resume() : window.speechSynthesis.pause(); }
    return;
  }
  if (t.closest('[data-act="ecStop"]')){
    window.__lhEcouteContinue = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const etat = document.getElementById('ecEtat');
    if (etat) etat.textContent = 'Lecture arrêtée.';
    document.querySelectorAll('.v4-etape--actif').forEach(el => el.classList.remove('v4-etape--actif'));
    return;
  }
  if (t.closest('[data-act="atlSelect"]')){
    ATL.etape = parseInt(t.closest('[data-act="atlSelect"]').dataset.index, 10) || 0;
    document.querySelectorAll('[id^="atpEtape"]').forEach((el, i) => el.classList.toggle('v4-etape--actif', i === ATL.etape));
    peindreEtape();
    return;
  }
  if (t.closest('[data-act="atlPrec"]')){ ATL.etape = Math.max(0, ATL.etape - 1); document.querySelectorAll('[id^="atpEtape"]').forEach((el, i) => el.classList.toggle('v4-etape--actif', i === ATL.etape)); peindreEtape(); return; }
  if (t.closest('[data-act="atlSuiv"]')){ ATL.etape = Math.min(ATL.etapes.length - 1, ATL.etape + 1); document.querySelectorAll('[id^="atpEtape"]').forEach((el, i) => el.classList.toggle('v4-etape--actif', i === ATL.etape)); peindreEtape(); return; }
  if (t.closest('[data-act="atlMinuteur"]')){ minuteur(parseInt(t.closest('[data-act="atlMinuteur"]').dataset.min, 10) || 10); return; }
  if (t.closest('[data-act="atlStopMinuteur"]')){
    if (ATL.minuteur){ clearInterval(ATL.minuteur); ATL.minuteur = null; }
    const el = document.getElementById('atlChrono');
    if (el) el.textContent = '--:--';
    A.toast('Minuteur arrêté');
    return;
  }

  const gl = t.closest('[data-glfamille]');
  if (gl){ GLO.famille = gl.dataset.glfamille; glossaireCharger(); return; }
  const glLire = t.closest('[data-act="glLire"]');
  if (glLire){ lireTexte(glLire.dataset.mot + '. ' + glLire.dataset.texte); return; }
});

function lireTexte(texte){
  if (!('speechSynthesis' in window)){ A.toast('Pas de synthèse vocale sur cet appareil'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(texte || ''));
  u.lang = 'fr-FR';
  const voix = window.speechSynthesis.getVoices().find(v => /fr/i.test(v.lang));
  if (voix) u.voice = voix;
  window.speechSynthesis.speak(u);
  A.toast('Lecture en cours');
}

document.addEventListener('keyup', e => {
  if (e.target && e.target.id === 'glQ' && (e.key === 'Enter' || (e.target.value || '').length >= 3)){
    GLO.q = e.target.value.trim();
    clearTimeout(window.__lhGlT);
    window.__lhGlT = setTimeout(async () => {
      const r = await V3.lire('/api/p4-glossaire?q=' + encodeURIComponent(GLO.q) + (GLO.famille ? '&famille=' + encodeURIComponent(GLO.famille) : ''));
      if (r.ok && r.data && document.getElementById('glQ')){
        GLO.termes = r.data.termes;
        glossaireCharger();
        const champ = document.getElementById('glQ');
        if (champ) champ.value = GLO.q;
      }
    }, 320);
  }
});

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'ecDebit'){ LECT.debit = parseFloat(e.target.value) || 1; A.toast('Vitesse : ×' + LECT.debit); }
});

/* le mode texte seul s'applique dès l'ouverture de l'application */
window.addEventListener('load', appliquerTexteSeul);
if (document.readyState === 'complete') appliquerTexteSeul();
})();
