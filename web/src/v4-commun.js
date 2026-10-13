/* ============================================================
   V4 — COMMUNAUTÉ (forum d'entraide, galerie, ateliers)
   ------------------------------------------------------------
   Le forum répond à la question de 22 h, la galerie montre ce qui
   sort de l'atelier, les ateliers rapprochent les élèves d'une même
   ville. Chaque écran a son adresse, chaque contenu peut être
   signalé : c'est ce qui permet d'ouvrir la parole sans la laisser
   partir à vau-l'eau.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte;

const THEMES = [['general', 'Toutes les questions', 'chat'],
  ['saponification', 'Saponification', 'flask'], ['emulsion', 'Émulsions & crèmes', 'jar'],
  ['conservation', 'Conservation', 'shield'], ['etiquetage', 'Étiquetage & vente', 'tag'],
  ['vente', 'Vendre ses produits', 'card']];

/* ------------------------------------------------------------ forum */
let FIL = { theme: '', q: '', sujets: [], parTheme: [], charge: false };

function pageCommunaute(){
  return A.barPage('Entraide', '', `
    <div class="tabs n-tabs" style="overflow-x:auto">
      ${THEMES.map(([id, nom]) => `<button class="tab${FIL.theme === id ? ' is-active' : ''}" data-filtheme="${id}">${esc(nom)}</button>`).join('')}
    </div>
    <div id="foCorps" style="margin-top:14px"><p class="body-small muted">Chargement…</p></div>`);
}
async function forumCharger(){
  const zone = document.getElementById('foCorps');
  if (!zone) return;
  const q = FIL.q ? '&q=' + encodeURIComponent(FIL.q) : '';
  const th = FIL.theme && FIL.theme !== 'general' ? '&theme=' + encodeURIComponent(FIL.theme) : '';
  const r = await V3.lire('/api/p4-commun/forum?' + q + th);
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Entraide indisponible', '<p class="body-medium">Le serveur ne répond pas pour le moment.</p>', { ico: 'cloud' }); return; }
  FIL.sujets = d.sujets || []; FIL.parTheme = d.parTheme || []; FIL.charge = true;
  const total = d.total || 0;
  zone.innerHTML = `
    ${carte('Poser une question', `
      <label class="v3-champ"><span>Titre</span><input id="foTitre" placeholder="Ma pâte trace trop vite avec la coco"></label>
      <label class="v3-champ"><span>Thème</span><select id="foTheme" class="v3-select">
        ${THEMES.map(([id, nom]) => `<option value="${id}">${esc(nom)}</option>`).join('')}</select></label>
      <label class="v3-champ"><span>Votre question</span>
        <textarea id="foQuestion" class="v3-textarea" rows="4" placeholder="Décrivez votre recette, ce que vous avez observé, et ce que vous avez déjà essayé."></textarea></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="foPublier">${svg('chat','icon icon--18')} Publier la question</button>
      <p class="body-small muted" style="margin-top:8px">Plus votre question est précise, plus la réponse sera utile — et elle servira à tous ceux qui liront après vous.</p>`, { ico: 'chat' })}
    <div class="v3-champ" style="margin:14px 0 6px"><input id="foRecherche" placeholder="Rechercher dans l'entraide…" value="${esc(FIL.q)}"></div>
    <p class="body-small muted">${total} question(s) au total${FIL.parTheme.length ? ' · ' + FIL.parTheme.slice(0, 3).map(t => esc(t.theme || 'général') + ' ' + t.n).join(' · ') : ''}</p>
    ${FIL.sujets.length ? `<div class="v3-liste">${FIL.sujets.map(sujetLigne).join('')}</div>`
      : carte('Aucune question ici', `<p class="body-medium">Soyez le premier à ouvrir le sujet : la réponse aidera les suivants.</p>`, { ico: 'help' })}`;
}

const sujetLigne = s => `
  <a class="v4-sujet${s.resolu ? ' v4-sujet--resolu' : ''}" href="/communaute/${esc(s.id)}" data-lien>
    <span class="v4-sujet__tete">
      ${s.epingle ? '<span class="pill">épinglé</span>' : ''}
      ${s.resolu ? '<span class="pill pill--ok">résolu</span>' : ''}
      <span class="pill">${esc(s.theme || 'général')}</span>
      <span class="v4-sujet__date">${esc(V3.quand(s.created_at))}</span>
    </span>
    <b>${esc(s.titre)}</b>
    <span class="body-small muted">${esc(s.auteur_nom)} · ${s.reponses} réponse(s) · ${s.utils} « ça m'a aidé » · ${s.vues} vue(s)</span>
  </a>`;

/* --- un sujet --- */
function pageSujet(){ return A.barPage('Question', '', `<div id="fsCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function sujetCharger(params){
  const zone = document.getElementById('fsCorps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez une question', '<p class="body-medium">Cet écran s\'ouvre depuis l\'entraide.</p>', { ico: 'chat' }); return; }
  const r = await V3.lire('/api/p4-commun/forum/' + encodeURIComponent(id));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Question introuvable', `<p class="body-medium">${esc(r.erreur || 'Ce sujet n\'existe plus.')}</p>`, { ico: 'help' });
    return;
  }
  const s = r.data.sujet, reponses = r.data.reponses || [], modere = r.data.modere;
  zone.innerHTML = `
    ${carte('', `
      <span class="v4-sujet__tete"><span class="pill">${esc(s.theme || 'général')}</span>
        ${s.resolu ? '<span class="pill pill--ok">résolu</span>' : ''}
        <span class="v4-sujet__date">${esc(V3.quand(s.created_at))}</span></span>
      <h2 class="v3-chapitre">${esc(s.titre)}</h2>
      <p class="body-medium">${esc(s.question)}</p>
      <p class="body-small muted">par ${esc(s.auteur_nom)}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${s.mien ? `<button class="btn btn--tonal btn--sm ripple" data-act="fsResolu" data-id="${esc(s.id)}" data-valeur="${s.resolu ? '0' : '1'}">
          ${svg('check-circle','icon icon--18')} ${s.resolu ? 'Marquer non résolu' : 'Marquer résolu'}</button>` : ''}
        ${modere ? `<button class="btn btn--outlined btn--sm ripple" data-act="fsEpingler" data-id="${esc(s.id)}" data-valeur="${s.epingle ? '0' : '1'}">
          ${svg('bookmark','icon icon--18')} ${s.epingle ? 'Désépingler' : 'Épingler'}</button>
          <button class="btn btn--outlined btn--sm ripple" data-act="fsMasquer" data-id="${esc(s.id)}">Masquer</button>` : ''}
        <button class="btn btn--outlined btn--sm ripple" data-act="foSignaler" data-cible="sujet" data-id="${esc(s.id)}">Signaler</button>
      </div>`, { ico: 'chat' })}
    ${reponses.length ? `<div class="v3-liste">${reponses.map(x => `
      <div class="v4-reponse${x.vote ? ' v4-reponse--utile' : ''}">
        <span class="v4-reponse__tete"><b>${esc(x.auteur_nom)}</b>
          <span class="v4-sujet__date">${esc(V3.quand(x.created_at))}</span></span>
        <p class="body-medium">${esc(x.texte)}</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="text-btn ripple" data-act="fsUtile" data-id="${esc(x.id)}" data-valeur="${x.vote ? '0' : '1'}">
            ${svg('star','icon icon--18')} ${x.vote ? 'Retirer mon merci' : 'Ça m\'a aidé'} (${x.utils})</button>
          <button class="text-btn ripple" data-act="foSignaler" data-cible="reponse" data-id="${esc(x.id)}">Signaler</button>
        </div>
      </div>`).join('')}</div>` : `<p class="body-small muted" style="margin:12px 0">Aucune réponse pour l'instant. Vous pouvez répondre — même une piste aide.</p>`}
    ${carte('Répondre', `
      <label class="v3-champ"><span>Votre réponse</span>
        <textarea id="fsTexte" class="v3-textarea" rows="4" placeholder="Expliquez ce qui a marché chez vous, avec les quantités si possible."></textarea></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="fsRepondre" data-id="${esc(s.id)}">
        ${svg('chat','icon icon--18')} Envoyer</button>`, { ico: 'chat' })}`;
}

/* ------------------------------------------------------------ galerie */
let GAL = { publications: [], charge: false, cours: '' };
function pageGalerie(){ return A.barPage('Réalisations', '', `<div id="gaCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function galerieCharger(){
  const zone = document.getElementById('gaCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-commun/galerie' + (GAL.cours ? '?cours=' + encodeURIComponent(GAL.cours) : ''));
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Galerie indisponible', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  GAL.publications = d.publications || []; GAL.charge = true;
  zone.innerHTML = `
    ${carte('Montrer ce que vous avez fabriqué', `
      <label class="v3-champ"><span>Titre</span><input id="gaTitre" placeholder="Savon à froid au karité — premier essai"></label>
      <label class="v3-champ"><span>Ce que vous racontez</span>
        <textarea id="gaLegende" class="v3-textarea" rows="3" placeholder="Ce qui a marché, ce que vous changerez la prochaine fois…"></textarea></label>
      <label class="v3-champ"><span>Photo (elle est réduite automatiquement)</span>
        <input id="gaPhoto" type="file" accept="image/*" capture="environment"></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="gaPublier">${svg('upload','icon icon--18')} Publier</button>
      <p class="body-small muted" style="margin-top:8px">Une photo par réalisation, jusqu'à 900 Ko après réduction. Les ratés ont leur place aussi : c'est là qu'on apprend.</p>`, { ico: 'upload' })}
    <p class="body-small muted" style="margin:12px 0 6px">${d.total} réalisation(s) partagée(s) — les plus récentes d'abord.</p>
    ${GAL.publications.length ? `<div class="v4-galerie">${GAL.publications.map(pubCarte).join('')}</div>`
      : carte('Aucune réalisation encore', '<p class="body-medium">Publiez la première : une photo, une phrase, et la communauté voit votre travail.</p>', { ico: 'grid' })}`;
}

const pubCarte = p => `
  <article class="v4-pub">
    ${p.photo ? `<a href="/galerie/${esc(p.id)}" data-lien><img src="${esc(p.photo)}" alt="${esc(p.titre)}" loading="lazy"></a>`
      : `<a class="v4-pub__vide" href="/galerie/${esc(p.id)}" data-lien>${svg('grid','icon icon--24')}<span>sans photo</span></a>`}
    <div class="v4-pub__txt">
      <a href="/galerie/${esc(p.id)}" data-lien><b>${esc(p.titre)}</b></a>
      <span class="body-small muted">${esc(p.auteur_nom)} · ${esc(V3.quand(p.created_at))}</span>
      ${p.legende ? `<p class="body-small">${esc(p.legende.slice(0, 110))}${p.legende.length > 110 ? '…' : ''}</p>` : ''}
      <div class="v4-pub__pied">
        <button class="text-btn ripple" data-act="gaAime" data-id="${esc(p.id)}" data-valeur="${p.aime ? '0' : '1'}">
          ${svg('star','icon icon--18')} ${p.likes} j'aime</button>
        <button class="text-btn ripple" data-act="foSignaler" data-cible="photo" data-id="${esc(p.id)}">Signaler</button>
      </div>
    </div>
  </article>`;

function pageGalerieDetail(){ return A.barPage('Réalisation', '', `<div id="gdCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function galerieDetail(params){
  const zone = document.getElementById('gdCorps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez une réalisation', '<p class="body-medium">Cet écran s\'ouvre depuis la galerie.</p>', { ico: 'grid' }); return; }
  const r = await V3.lire('/api/p4-commun/galerie');
  const p = (r.ok && r.data && (r.data.publications || []).find(x => x.id === id)) || null;
  if (!p){ zone.innerHTML = carte('Réalisation introuvable', '<p class="body-medium">Elle a peut-être été retirée.</p>', { ico: 'help' }); return; }
  zone.innerHTML = `
    ${p.photo ? `<img class="v4-photo" src="${esc(p.photo)}" alt="${esc(p.titre)}">` : ''}
    ${carte('', `
      <h2 class="v3-chapitre">${esc(p.titre)}</h2>
      <p class="body-small muted">par ${esc(p.auteur_nom)} · ${esc(V3.quand(p.created_at))}</p>
      ${p.legende ? `<p class="body-medium" style="margin-top:10px">${esc(p.legende)}</p>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn--tonal btn--sm ripple" data-act="gaAime" data-id="${esc(p.id)}" data-valeur="${p.aime ? '0' : '1'}">
          ${svg('star','icon icon--18')} ${p.likes} j'aime</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="foSignaler" data-cible="photo" data-id="${esc(p.id)}">Signaler</button>
        <a class="btn btn--outlined btn--sm ripple" href="/galerie" data-lien>Toute la galerie</a>
      </div>`, { ico: 'grid' })}`;
  A.titreOnglet && A.titreOnglet(p.titre);
}

/* ------------------------------------------------------------ ateliers */
function pageAteliers(){ return A.barPage('Ateliers & voisinage', '', `<div id="atCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function ateliersCharger(){
  const zone = document.getElementById('atCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-commun/ateliers');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Ateliers indisponibles', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  const liste = d.ateliers || [];
  zone.innerHTML = `
    ${carte('Proposer un atelier, une rencontre, un prêt de matériel', `
      <label class="v3-champ"><span>Titre</span><input id="atTitre" placeholder="Saponification à froid — atelier pratique"></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Ville</span><input id="atVille" placeholder="Cotonou"></label>
        <label class="v3-champ"><span>Lieu</span><input id="atLieu" placeholder="Atelier Sainte-Rita, Akpakpa"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Date et heure</span><input id="atQuand" type="datetime-local"></label>
        <label class="v3-champ"><span>Places</span><input id="atPlaces" type="number" min="1" max="200" value="6"></label>
      </div>
      <label class="v3-champ"><span>Détails</span><textarea id="atTexte" class="v3-textarea" rows="3" placeholder="Ce qu'on fait, ce qu'il faut apporter, participation…"></textarea></label>
      <label class="v3-champ"><span>Contact</span><input id="atContact" placeholder="Téléphone ou e-mail"></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="atPublier">${svg('users','icon icon--18')} Publier</button>`, { ico: 'users' })}
    ${(d.villes && d.villes.length) ? `<p class="body-small muted" style="margin:12px 0 6px">Villes actives : ${d.villes.map(v => esc(v.ville) + ' (' + v.n + ')').join(' · ')}</p>` : ''}
    ${liste.length ? `<div class="v3-liste">${liste.map(at => `
      <div class="v4-atelier">
        <span class="v4-sujet__tete">
          ${at.ville ? `<span class="pill">${esc(at.ville)}</span>` : ''}
          <span class="pill">${at.participants}/${at.places} inscrit(s)</span>
          ${at.ferme ? '<span class="pill">complet</span>' : ''}
        </span>
        <b>${esc(at.titre)}</b>
        <span class="body-small muted">${at.lieu ? esc(at.lieu) + ' · ' : ''}${at.quand ? new Date(at.quand).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'date à préciser'} · par ${esc(at.auteur_nom)}</span>
        ${at.texte ? `<p class="body-small">${esc(at.texte)}</p>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn ${at.inscrit ? 'btn--outlined' : 'btn--tonal'} btn--sm ripple" data-act="atParticiper" data-id="${esc(at.id)}">
            ${at.inscrit ? 'Me retirer' : "Je m'inscris"}</button>
          ${at.contact ? `<a class="btn btn--outlined btn--sm ripple" href="tel:${esc(at.contact.replace(/[^0-9+]/g, ''))}">Contacter</a>` : ''}
        </div>
      </div>`).join('')}</div>`
      : carte('Aucun atelier pour l\'instant', '<p class="body-medium">Proposez le premier : même une rencontre de deux personnes dans une cour fait avancer.</p>', { ico: 'users' })}`;
}

/* ------------------------------------------------------------ signalement */
async function signaler(cible, id){
  const motifs = [['spam', 'Publicité ou spam'], ['incorrect', 'Information fausse ou dangereuse'],
    ['dangereux', 'Recette dangereuse'], ['desagreable', 'Propos désagréables'], ['autre', 'Autre chose']];
  const choix = window.prompt('Motif du signalement :\n' + motifs.map((m, i) => (i + 1) + '. ' + m[1]).join('\n') + '\n\nNuméro :', '1');
  if (!choix) return;
  const m = motifs[Math.max(0, Math.min(motifs.length - 1, (parseInt(choix, 10) || 1) - 1))];
  const precisions = window.prompt('Précisez en une phrase (facultatif) :', '') || '';
  const r = await V3.ecrire('/api/p4-commun/signaler', { cible: cible, cibleId: id, motif: m[0], details: precisions });
  A.toast(r.ok ? (r.data && r.data.deja ? r.data.message : 'Merci : la modération va regarder.') : (r.erreur || 'Signalement impossible'));
}

/* ------------------------------------------------------------ réduction de photo */
function reduirePhoto(fichier){
  return new Promise((resolve, reject) => {
    if (!fichier) { resolve(''); return; }
    if (fichier.size > 8_000_000) { reject(new Error('Photo trop lourde (8 Mo maximum)')); return; }
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error('Lecture impossible'));
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image illisible'));
      img.onload = () => {
        const max = 900;
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(lecteur.result);
    };
    lecteur.readAsDataURL(fichier);
  });
}

/* ------------------------------------------------------------ écrans et gestes */
A.PAGES.communaute = { single: true, render: pageCommunaute, mount(){ forumCharger(); } };
A.PAGES.sujet = { single: true, render: pageSujet, mount(el, params){ sujetCharger(params); } };
A.PAGES.galerie = { single: true, render: pageGalerie, mount(){ galerieCharger(); } };
A.PAGES.galerieDetail = { single: true, render: pageGalerieDetail, mount(el, params){ galerieDetail(params); } };
A.PAGES.ateliers = { single: true, render: pageAteliers, mount(){ ateliersCharger(); } };

window.LHV4COMMUN = { forum: forumCharger, galerie: galerieCharger, ateliers: ateliersCharger, signaler: signaler };

document.addEventListener('click', async e => {
  const t = e.target;
  const th = t.closest('[data-filtheme]');
  if (th){
    FIL.theme = th.dataset.filtheme;
    document.querySelectorAll('[data-filtheme]').forEach(x => x.classList.toggle('is-active', x === th));
    forumCharger(); return;
  }
  if (t.closest('[data-act="foPublier"]')){
    const titre = (document.getElementById('foTitre') || {}).value || '';
    const question = (document.getElementById('foQuestion') || {}).value || '';
    const theme = (document.getElementById('foTheme') || {}).value || 'general';
    if (titre.trim().length < 6){ A.toast('Écrivez un titre clair'); return; }
    if (question.trim().length < 10){ A.toast('Expliquez votre question en quelques lignes'); return; }
    const r = await V3.ecrire('/api/p4-commun/forum', { titre: titre, question: question, theme: theme });
    if (!r.ok){ A.toast(r.erreur || 'Publication impossible'); return; }
    A.toast('Question publiée ✅');
    const id = r.data && r.data.sujet && r.data.sujet.id;
    if (id) A.pushPage('sujet', { id: id }); else forumCharger();
    return;
  }
  const rep = t.closest('[data-act="fsRepondre"]');
  if (rep){
    const texte = (document.getElementById('fsTexte') || {}).value || '';
    if (texte.trim().length < 2){ A.toast('Écrivez votre réponse'); return; }
    const r = await V3.ecrire('/api/p4-commun/forum/' + encodeURIComponent(rep.dataset.id), { texte: texte });
    A.toast(r.ok ? 'Réponse envoyée ✅' : (r.erreur || 'Envoi impossible'));
    if (r.ok) sujetCharger({ id: rep.dataset.id });
    return;
  }
  const utile = t.closest('[data-act="fsUtile"]');
  if (utile){
    const m = /^\/communaute\/([^/?#]+)/.exec(location.pathname);
    const r = await V3.ecrire('/api/p4-commun/reponses/' + encodeURIComponent(utile.dataset.id) + '/utile', { utile: utile.dataset.valeur === '1' });
    A.toast(r.ok ? (utile.dataset.valeur === '1' ? 'Merci envoyé ✅' : 'Merci retiré') : (r.erreur || 'Action impossible'));
    if (r.ok && m) sujetCharger({ id: decodeURIComponent(m[1]) });
    return;
  }
  const resolu = t.closest('[data-act="fsResolu"], [data-act="fsEpingler"], [data-act="fsMasquer"]');
  if (resolu){
    const act = resolu.dataset.act;
    const corps = act === 'fsResolu' ? { resolu: resolu.dataset.valeur === '1' }
      : act === 'fsEpingler' ? { epingle: resolu.dataset.valeur === '1' } : { masquer: true };
    const r = await V3.api('/api/p4-commun/forum/' + encodeURIComponent(resolu.dataset.id), { method: 'PATCH', body: JSON.stringify(corps) });
    A.toast(r.ok ? 'C\'est fait' : (r.erreur || 'Action impossible'));
    if (r.ok){ if (corps.masquer) A.popPage(); else sujetCharger({ id: resolu.dataset.id }); }
    return;
  }
  const signal = t.closest('[data-act="foSignaler"]');
  if (signal){ signaler(signal.dataset.cible, signal.dataset.id); return; }
  if (t.closest('[data-act="gaPublier"]')){
    const titre = (document.getElementById('gaTitre') || {}).value || '';
    const legende = (document.getElementById('gaLegende') || {}).value || '';
    const fichier = (document.getElementById('gaPhoto') || {}).files && document.getElementById('gaPhoto').files[0];
    if (titre.trim().length < 3){ A.toast('Donnez un titre'); return; }
    let photo = '';
    try { photo = await reduirePhoto(fichier); }
    catch (err) { A.toast(err.message || 'Photo refusée'); return; }
    const r = await V3.ecrire('/api/p4-commun/galerie', { titre: titre, legende: legende, photo: photo });
    A.toast(r.ok ? 'Réalisation publiée ✅' : (r.erreur || 'Publication impossible'));
    if (r.ok) galerieCharger();
    return;
  }
  const jaime = t.closest('[data-act="gaAime"]');
  if (jaime){
    const r = await V3.ecrire('/api/p4-commun/photos/' + encodeURIComponent(jaime.dataset.id) + '/aime', { aime: jaime.dataset.valeur === '1' });
    if (!r.ok){ A.toast(r.erreur || 'Action impossible'); return; }
    const pub = GAL.publications.find(x => x.id === jaime.dataset.id);
    if (pub){ pub.likes = r.data.likes; pub.aime = r.data.aime; }
    const page = document.querySelector('.page[data-page="galerie"]');
    if (page && !GAL.publications.find(x => x.id === jaime.dataset.id)) return;
    if (document.querySelector('.page[data-page="galerie"]')) galerieCharger();
    else galerieDetail({ id: jaime.dataset.id });
    return;
  }
  if (t.closest('[data-act="atPublier"]')){
    const corps = {
      titre: ((document.getElementById('atTitre') || {}).value || '').trim(),
      ville: ((document.getElementById('atVille') || {}).value || '').trim(),
      lieu: ((document.getElementById('atLieu') || {}).value || '').trim(),
      quand: ((document.getElementById('atQuand') || {}).value || '').trim(),
      texte: ((document.getElementById('atTexte') || {}).value || '').trim(),
      contact: ((document.getElementById('atContact') || {}).value || '').trim(),
      places: parseInt((document.getElementById('atPlaces') || {}).value, 10) || 6
    };
    if (corps.titre.length < 4){ A.toast('Donnez un titre à l\'atelier'); return; }
    const r = await V3.ecrire('/api/p4-commun/ateliers', corps);
    A.toast(r.ok ? 'Atelier publié ✅' : (r.erreur || 'Publication impossible'));
    if (r.ok) ateliersCharger();
    return;
  }
  const part = t.closest('[data-act="atParticiper"]');
  if (part){
    const r = await V3.ecrire('/api/p4-commun/ateliers/' + encodeURIComponent(part.dataset.id) + '/participer', {});
    A.toast(r.ok ? (r.data && r.data.inscrit ? 'Inscription faite ✅' : 'Vous êtes retiré') : (r.erreur || 'Action impossible'));
    if (r.ok) ateliersCharger();
    return;
  }
});
})();
