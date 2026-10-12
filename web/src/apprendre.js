/* ============================================================
   EXPÉRIENCE D'APPRENTISSAGE (v2)
   ------------------------------------------------------------
   Ce que l'apprenant retrouve d'un appareil à l'autre :

   • reprise de lecture : la position exacte de chaque vidéo est
     enregistrée sur le compte (positionS) et le lecteur propose de
     reprendre là où l'on s'était arrêté ;
   • historique des tentatives : chaque quiz passé, son score, sa durée ;
   • recherche serveur : cours, leçons, vidéos, ressources, quiz, devoirs ;
   • attestations : les cours achevés donnent un certificat imprimable,
     avec numéro et date ;
   • hors-ligne : état du mode local, contenus disponibles, renvoi des
     actions en attente dès le retour du réseau.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX;
const { S, barPage, svg, toast, pushPage, emptyBox } = A;

const esc = t => String(t === null || t === undefined ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const compte = () => (window.LHCOMPTE && window.LHCOMPTE.compte) ? window.LHCOMPTE.compte() : null;
const jeton  = () => { const c = compte(); return (c && c.token) || ''; };
const api = (chemin, opts) => window.LHCOMPTE.api(chemin, opts).catch(() => new Response('{"ok":false}',
  { status: 503, headers: { 'Content-Type': 'application/json' } }));
const lire = async (chemin, opts) => { const r = await api(chemin, opts); return r.json().catch(() => ({})); };
const duree = s => Math.floor((s || 0) / 60) + ':' + String(Math.round((s || 0) % 60)).padStart(2, '0');
/* la liste des vidéos est définie par le contenu du site (app.js) */
const listeVideos = () => (typeof VIDEOS !== 'undefined' && VIDEOS) || (A.VIDEOS || []) || [];
const quand = iso => { try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };

/* ------------------------------------------------------------
   1. REPRISE DE LECTURE — la position part sur le compte
   ------------------------------------------------------------ */
const positionsEnvoyees = {};
window.onPositionLue = function(yt, secondes){
  if (!jeton() || !yt || secondes < 5) return;
  const dernier = positionsEnvoyees[yt];
  if (dernier && Math.abs(dernier - secondes) < 20) return;      /* on n'écrit pas à chaque seconde */
  positionsEnvoyees[yt] = secondes;
  const local = A.vstate[yt] || {};
  const video = listeVideos().find(v => v.yt === yt);
  const total = video && video.duree ? video.duree * 60 : 0;
  const estime = total ? Math.round(secondes / total * 100) : 0;
  const pourcent = Math.max(0, Math.min(99, Math.max(local.prog || 0, estime)));
  api('/api/videos/' + encodeURIComponent(yt) + '/progress', {
    method: 'PATCH',
    body: JSON.stringify({ positionS: secondes, progress: pourcent })
  }).catch(() => {});
};

/* ------------------------------------------------------------
   2. HISTORIQUE DES TENTATIVES DE QUIZ
   ------------------------------------------------------------ */
function pageTentatives(){
  return barPage('Mes tentatives de quiz', `<button class="text-btn ripple" data-tent="recharger">Actualiser</button>`, `
    <div id="tentats"><p class="body-small muted">Chargement…</p></div>`);
}
function peintTentatives(el, liste){
  const zone = el.querySelector('#tentats');
  if (!zone) return;
  if (!liste.length){
    zone.innerHTML = emptyBox('chart', 'Aucune tentative', 'Les quiz passés apparaîtront ici avec leur score.');
    return;
  }
  const meilleur = Math.max.apply(null, liste.map(t => t.note_pct || 0));
  const moyenne = Math.round(liste.reduce((n, t) => n + (t.note_pct || 0), 0) / liste.length);
  zone.innerHTML = `
    <div class="card card--pad" style="display:flex;gap:12px;margin-bottom:14px">
      <div style="flex:1"><div class="body-small muted">Tentatives</div><div class="body-large">${liste.length}</div></div>
      <div style="flex:1"><div class="body-small muted">Meilleur score</div><div class="body-large">${meilleur} %</div></div>
      <div style="flex:1"><div class="body-small muted">Moyenne</div><div class="body-large">${moyenne} %</div></div>
    </div>
    <div class="card">${liste.map(t => `<div class="list-row">
        <span class="list-row__ico acc-${(t.note_pct || 0) >= 70 ? 'green' : (t.note_pct || 0) >= 40 ? 'amber' : 'purple'}">${svg('chart', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>${esc(t.titre || 'Quiz')}</h3>
          <p>${esc(quand(t.created_at))}${t.duree_s ? ' · ' + esc(duree(t.duree_s)) : ''}</p></div>
        <span class="pill ${(t.note_pct || 0) >= 70 ? 'pill--ok' : 'pill--normal'}">${esc(t.score)}/${esc(t.total)} · ${esc(t.note_pct)} %</span>
      </div>`).join('')}</div>`;
}
async function chargerTentatives(el){
  const zone = el.querySelector('#tentats');
  if (!zone) return;
  if (!jeton()){
    zone.innerHTML = `<div class="note">${svg('info', 'icon')}<span>Connectez-vous pour retrouver vos tentatives sur tous vos appareils. Les scores locaux restent disponibles dans chaque cours.</span></div>`;
    return;
  }
  const j = await lire('/api/attempts');
  peintTentatives(el, (j && j.data && j.data.tentatives) || []);
}

/* ------------------------------------------------------------
   3. RECHERCHE SERVEUR (repli local hors connexion)
   ------------------------------------------------------------ */
function rechercheLocale(q){
  q = q.toLowerCase();
  const cours = (A.COURS || []).filter(c => (c.titre + ' ' + c.cat + ' ' + c.prof).toLowerCase().includes(q));
  const lecons = [];
  (A.COURS || []).forEach(c => ((A.LESSONS[c.id]) || []).forEach((l, i) => {
    if (String(l.t).toLowerCase().includes(q)) lecons.push({ id: c.id + ':' + i, titre: l.t, course_id: c.id, cours_titre: c.titre });
  }));
  const videos = listeVideos().filter(v => (v.titre + ' ' + v.chaine).toLowerCase().includes(q));
  return { cours, lecons, videos, ressources: [], quiz: [], devoirs: [] };
}
function ligneResultat(genre, r){
  if (genre === 'cours') return `<button class="list-row ripple" data-page="cours" data-id="${esc(r.id)}">
      <span class="list-row__ico acc-${esc(r.accent || 'purple')}">${svg(r.ico || 'school', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.categorie || '')} · ${esc(r.prof || '')}</p></div>
      ${A.IC.chev}</button>`;
  if (genre === 'lecons') return `<button class="list-row ripple" data-page="cours" data-id="${esc(r.course_id)}" data-tab="programme">
      <span class="list-row__ico acc-blue">${svg(r.done ? 'check-circle' : 'task', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.cours_titre || '')}</p></div>
      ${A.IC.chev}</button>`;
  if (genre === 'videos') return `<button class="list-row ripple" data-yt="${esc(r.yt || r.id)}">
      <span class="list-row__ico acc-amber">${svg('play', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.chaine || '')}</p></div>
      ${A.IC.chev}</button>`;
  if (genre === 'ressources') return `<button class="list-row ripple" data-page="cours" data-id="${esc(r.course_id)}" data-tab="ressources">
      <span class="list-row__ico acc-green">${svg('download', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.type_label || '')} · ${esc(r.cours_titre || '')}</p></div>
      ${A.IC.chev}</button>`;
  if (genre === 'quiz') return `<button class="list-row ripple" data-page="cours" data-id="${esc(r.course_id)}" data-tab="quiz">
      <span class="list-row__ico acc-purple">${svg('help', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.cours_titre || '')}</p></div>
      ${A.IC.chev}</button>`;
  return `<button class="list-row ripple" data-page="cours" data-id="${esc(r.course_id)}" data-tab="devoirs">
      <span class="list-row__ico acc-purple">${svg('edit', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${esc(r.titre)}</h3><p>${esc(r.cours_titre || '')}</p></div>
      ${A.IC.chev}</button>`;
}
function corpsResultats(rep, local){
  const groupes = [['cours', 'Cours', 'school'], ['lecons', 'Leçons', 'task'], ['videos', 'Vidéos', 'play'],
                   ['ressources', 'Ressources', 'download'], ['quiz', 'Quiz', 'help'], ['devoirs', 'Devoirs', 'edit']];
  const total = groupes.reduce((n, [g]) => n + ((rep[g] || []).length), 0);
  if (!total) return `<div class="note">${svg('info', 'icon')}<span>Aucun résultat pour « ${esc(rep.terme || '')} ».</span></div>`;
  return (local ? `<p class="body-small muted" style="padding:0 2px 10px">${svg('info', 'icon icon--16')} Recherche effectuée hors connexion, dans le contenu enregistré.</p>` : '') +
    groupes.filter(([g]) => (rep[g] || []).length)
      .map(([g, libelle, ico]) => `<div class="res-group"><div class="res-group__h">${svg(ico, 'icon icon--16')} ${libelle.toUpperCase()} (${rep[g].length})</div>
        ${rep[g].map(r => ligneResultat(g, r)).join('')}</div>`).join('');
}
A.PAGES.recherche = {
  single: true,
  render(){
    return barPage('Recherche', '', `
      <div class="search-bar ripple" style="background:var(--md-surface-high)">
        ${svg('search')}
        <input class="q-input" type="search" placeholder="Cours, leçon, vidéo, devoir…" aria-label="Rechercher" autocomplete="off">
      </div>
      <div class="q-body" style="margin-top:16px"></div>`);
  },
  mount(el){
    const input = el.querySelector('.q-input');
    const body  = el.querySelector('.q-body');
    let minuteur = null, dernier = '';
    const peindre = html => { body.innerHTML = html;
      body.querySelectorAll('.lp__bar[data-prog]').forEach(b => { b.style.width = b.dataset.prog + '%'; }); };
    const suggestions = () => {
      const mots = ['savon', 'karité', 'émulsion', 'étiquetage', 'baume', 'quiz', 'devoir'];
      peindre(`<div class="res-group"><div class="res-group__h">${svg('fire', 'icon icon--16')} SUGGESTIONS</div>
        <div class="sug">${mots.map(m => `<button class="chip ripple" data-q="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
        ${(S.recent || []).length ? `<div class="res-group"><div class="res-group__h">${svg('clock', 'icon icon--16')} RECHERCHES RÉCENTES
          <button class="text-btn ripple" style="margin-left:auto" data-act="clearRecent">Effacer</button></div>
          <div class="sug">${S.recent.map(r => `<button class="chip ripple" data-q="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>` : ''}`);
    };
    suggestions();
    const chercher = async q => {
      const terme = q.trim();
      if (terme.length < 2){ suggestions(); return; }
      if (terme === dernier) return;
      dernier = terme;
      const reponseServeur = await lire('/api/search?q=' + encodeURIComponent(terme));
      if (reponseServeur && reponseServeur.ok && reponseServeur.data){
        peindre(corpsResultats(reponseServeur.data, false));
        return;
      }
      peindre(corpsResultats(Object.assign(rechercheLocale(terme), { terme }), true));
    };
    input.addEventListener('input', () => { clearTimeout(minuteur); minuteur = setTimeout(() => chercher(input.value), 280); });
    el.addEventListener('click', e => {
      const chip = e.target.closest('[data-q]');
      if (chip){ input.value = chip.dataset.q; dernier = ''; chercher(input.value); return; }
      const yt = e.target.closest('[data-yt]');
      if (yt){ A.openVideo(yt.dataset.yt, A.vstate[yt.dataset.yt] ? A.vstate[yt.dataset.yt].pos : 0); return; }
      const t = e.target.closest('[data-tent]');
      if (t && t.dataset.tent === 'recharger') chargerTentatives(el);
    });
  }
};

/* ------------------------------------------------------------
   4. ATTESTATIONS (certificats)
   ------------------------------------------------------------ */
function pageCertificats(){
  return barPage('Mes attestations', `<button class="text-btn ripple" data-cert="recharger">Actualiser</button>`, `
    <div id="certs"><p class="body-small muted">Chargement…</p></div>`);
}
function corpsCertificat(c, apprenant){
  return `<div class="card card--pad certificat" data-certificat="${esc(c.course_id)}">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span class="list-row__ico acc-amber">${svg('medal', 'icon icon--20')}</span>
      <div><div class="body-small muted">Attestation de réussite</div><h3 class="body-large">${esc(c.titre)}</h3></div>
    </div>
    <p class="body-small muted" style="margin:0 0 8px">Décernée à <b>${esc(apprenant || '')}</b> pour avoir terminé l'intégralité du cours
      ${esc(c.categorie ? '« ' + c.titre + ' » (' + c.categorie + ')' : '')}.</p>
    <p class="body-small muted" style="margin:0 0 8px">Formateur : ${esc(c.prof || '')} · ${esc(c.lecons_total)} leçons${c.quiz_moyenne === null || c.quiz_moyenne === undefined ? '' : ' · moyenne aux quiz ' + esc(c.quiz_moyenne) + ' %'}</p>
    <p class="body-small muted" style="margin:0 0 12px">Terminé le ${esc(quand(c.termine_le))} · N° ${esc(c.numero)}</p>
    <div style="display:flex;gap:10px">
      <button class="btn btn--tonal btn--sm ripple" data-cert="imprimer" data-id="${esc(c.course_id)}">${svg('download', 'icon icon--18')} Imprimer / PDF</button>
      <button class="btn btn--text btn--sm ripple" data-cert="partager" data-id="${esc(c.course_id)}">${svg('share', 'icon icon--18')} Copier le lien</button>
    </div>
  </div>`;
}
function peintCertificats(el, rep){
  const zone = el.querySelector('#certs');
  if (!zone) return;
  const obtenus = rep.certificats || [];
  const enCours = rep.enCours || [];
  if (!rep.totalObtenus && !enCours.length){
    zone.innerHTML = emptyBox('medal', 'Aucune attestation pour l\'instant', 'Inscrivez-vous à un cours et terminez toutes ses leçons : l\'attestation apparaît ici.');
    return;
  }
  zone.innerHTML = `
    ${obtenus.length ? `<div class="sec__h" style="margin-bottom:8px"><h2>Obtenues (${obtenus.length})</h2></div>
      ${obtenus.map(c => corpsCertificat(c, rep.apprenant)).join('')}` : ''}
    ${enCours.length ? `<div class="sec__h" style="margin-top:16px;margin-bottom:8px"><h2>En cours (${enCours.length})</h2></div>
      <div class="card">${enCours.map(c => `<div class="list-row">
        <span class="list-row__ico acc-purple">${svg('book', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>${esc(c.titre)}</h3>
          <div class="lp" style="margin:6px 0 4px"><div class="lp__track"></div><div class="lp__bar" style="width:${esc(c.pourcent)}%"></div></div>
          <span class="body-small muted">${esc(c.lecons_faites)}/${esc(c.lecons_total)} leçons · ${esc(c.pourcent)} %</span></div>
      </div>`).join('')}</div>` : ''}`;
}
async function chargerCertificats(el){
  const zone = el.querySelector('#certs');
  if (!zone) return;
  if (!jeton()){
    zone.innerHTML = `<div class="note">${svg('info', 'icon')}<span>Les attestations sont rattachées à votre compte : connectez-vous pour les retrouver ici et les imprimer.</span></div>`;
    return;
  }
  const j = await lire('/api/certificats');
  if (!j || !j.ok){ zone.innerHTML = `<div class="note">${svg('info', 'icon')}<span>Attestations indisponibles pour le moment.</span></div>`; return; }
  peintCertificats(el, j.data || {});
}
function imprimerCertificat(c, apprenant){
  const f = window.open('', '_blank');
  if (!f){ toast('Autorisez les fenêtres pour imprimer l\'attestation'); return; }
  f.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Attestation — ${esc(c.titre)}</title>
    <style>body{font-family:Georgia,serif;margin:0;padding:48px;color:#1c1b1f}
      .cadre{border:6px double #6750A4;padding:40px;text-align:center;max-width:720px;margin:0 auto}
      h1{font-size:30px;margin:6px 0 18px;color:#6750A4}h2{font-size:22px;margin:18px 0;font-weight:600}
      .petit{font-size:14px;color:#49454f;line-height:1.6}.n{font-family:monospace;font-size:13px;margin-top:22px}
      .ligne{margin-top:36px;border-top:1px solid #79747e;display:inline-block;padding-top:6px;font-size:13px}</style></head>
    <body><div class="cadre"><div class="petit">CosmétiLab — Académie de cosmétique</div>
      <h1>Attestation de réussite</h1>
      <div class="petit">décernée à</div><h2>${esc(apprenant || '')}</h2>
      <div class="petit">pour avoir suivi et terminé l'intégralité du cours</div>
      <h2>${esc(c.titre)}</h2>
      <div class="petit">${esc(c.categorie || '')} · ${esc(c.lecons_total)} leçons · formateur : ${esc(c.prof || '')}</div>
      <div class="petit" style="margin-top:14px">Terminé le ${esc(quand(c.termine_le))}</div>
      <div class="n">N° ${esc(c.numero)}</div>
      <div class="ligne">CosmétiLab · Abomey-Calavi, Bénin</div></div>
    <script>window.onload = function(){ window.print(); }<\/script></body></html>`);
  f.document.close();
}

/* ------------------------------------------------------------
   5. MODE HORS-LIGNE : ce qui est disponible, et ce qui attend le réseau
   ------------------------------------------------------------ */
function attente(){
  try { return JSON.parse(localStorage.getItem('lh_file') || '[]'); } catch (e) { return []; }
}
function pageHorsLigne(){
  const enLigne = navigator.onLine !== false;
  const dl = (S.dl || []).filter(d => d.st === 'done').length;
  const lecons = Object.keys(S.lessons || {}).length;
  const notes = Object.keys(S.notes || {}).length;
  const copie = `Le cours, ses leçons, ses notes et l'extrait vidéo sont enregistrés dans l'application : ils restent consultables sans réseau.`;
  return barPage('Mode hors-ligne', '', `
    <div class="card card--pad" style="margin-bottom:14px;display:flex;gap:12px;align-items:center">
      <span class="list-row__ico acc-${enLigne ? 'green' : 'amber'}">${svg(enLigne ? 'cloud' : 'info', 'icon icon--20')}</span>
      <div class="list-row__main"><h3>${enLigne ? 'Connecté' : 'Hors connexion'}</h3>
        <p>${enLigne ? 'Vos actions partent sur votre compte immédiatement.' : 'Vos actions sont conservées et partiront au retour du réseau.'}</p></div>
    </div>
    <div class="card card--pad" style="margin-bottom:14px">
      <div class="sec__h" style="margin-bottom:8px"><h2>Disponible sans réseau</h2></div>
      <div class="list-row"><span class="list-row__ico acc-purple">${svg('task', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>${lecons} leçon(s) terminée(s)</h3><p>${esc(copie)}</p></div></div>
      <div class="list-row"><span class="list-row__ico acc-blue">${svg('edit', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>${notes} note(s) de cours</h3><p>Écrites hors connexion, envoyées au retour du réseau.</p></div></div>
      <div class="list-row"><span class="list-row__ico acc-green">${svg('download', 'icon icon--20')}</span>
        <div class="list-row__main"><h3>${dl} contenu(s) téléchargé(s)</h3><p>Lisibles et écoutables sans connexion.</p></div></div>
    </div>
    <div class="note" style="margin-bottom:14px">${svg('info', 'icon')}
      <span>Le lecteur bascule automatiquement sur l'extrait intégré au site quand YouTube n'est pas joignable.</span></div>
    <button class="btn btn--filled btn--block ripple" data-hl="sync">${svg('refresh', 'icon icon--18')} Envoyer ce qui attend</button>
    <button class="btn btn--text btn--block ripple" data-hl="recharger" style="margin-top:8px">${svg('download', 'icon icon--18')} Voir mes téléchargements</button>`);
}

/* ------------------------------------------------------------
   6. PAGES + BRANCHEMENTS
   ------------------------------------------------------------ */
A.PAGES.tentatives = {
  single: true,
  render(){ return pageTentatives(); },
  mount(el){ chargerTentatives(el); }
};
A.PAGES.certificats = {
  single: true,
  render(){ return pageCertificats(); },
  mount(el){
    chargerCertificats(el);
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-cert]');
      if (!b) return;
      if (b.dataset.cert === 'recharger'){ chargerCertificats(el); return; }
      const j = await lire('/api/certificats?cours=' + encodeURIComponent(b.dataset.id));
      const c = (j && j.data && j.data.certificats && j.data.certificats[0]) || null;
      if (!c){ toast('Attestation indisponible'); return; }
      if (b.dataset.cert === 'imprimer'){ imprimerCertificat(c, (j.data && j.data.apprenant) || ''); return; }
      const lien = location.origin + location.pathname + '#certificat=' + encodeURIComponent(c.course_id);
      try { await navigator.clipboard.writeText(lien); toast('Lien copié : ' + lien); }
      catch (err){ toast('Lien : ' + lien); }
    });
  }
};
A.PAGES['hors-ligne'] = {
  single: true,
  render(){ return pageHorsLigne(); },
  mount(el){
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-hl]');
      if (!b) return;
      if (b.dataset.hl === 'recharger'){ pushPage('telechargements', {}); return; }
      if (b.dataset.hl === 'sync'){
        if (!window.LHSYNC) { toast('Synthèse locale déjà à jour'); return; }
        try { await window.LHSYNC.pousser(); toast('Tout est envoyé sur votre compte'); }
        catch (err){ toast('Pas de réseau pour le moment — réessai automatique'); }
        if (window.LHSYNC2 && window.LHSYNC2.tirerTout) await window.LHSYNC2.tirerTout().catch(() => {});
      }
    });
  }
};

/* bandeau discret quand le réseau disparaît : l'apprenant sait où il en est */
(function veillerReseau(){
  const bandeau = document.createElement('div');
  bandeau.id = 'hlBandeau';
  bandeau.setAttribute('role', 'status');
  bandeau.style.cssText = 'position:fixed;left:0;right:0;bottom:64px;z-index:60;display:none;padding:8px 14px;' +
    'background:var(--md-surface-high);color:var(--md-on-surface);font-size:12.5px;box-shadow:0 -2px 10px rgba(0,0,0,.12)';
  const maj = () => {
    const enLigne = navigator.onLine !== false;
    bandeau.style.display = enLigne ? 'none' : 'block';
    bandeau.innerHTML = svg('info', 'icon icon--16') + ' <span style="margin-left:6px">Hors connexion — vos cours et vos notes restent accessibles. <b>Mode hors-ligne</b></span>';
  };
  const poser = () => { if (!document.body.contains(bandeau)) document.body.appendChild(bandeau); maj();
    bandeau.addEventListener('click', () => pushPage('hors-ligne', {})); };
  window.addEventListener('online', maj); window.addEventListener('offline', maj);
  document.addEventListener('DOMContentLoaded', poser);
  setTimeout(poser, 1500);
})();

window.LHAPPRENDRE = {
  tentatives: () => pushPage('tentatives', {}),
  certificats: () => pushPage('certificats', {}),
  horsLigne: () => pushPage('hors-ligne', {}),
  imprimerCertificat,
  ouvrir: (yt, sec) => A.openVideo(yt, sec || 0)
};
})();
