/* ============================================================
   V3 — ARGENT ET FIDÉLISATION
   ------------------------------------------------------------
   D1 mes paiements et mes reçus · D2 codes promo (côté élève et
   côté formateur) · D3 parrainage · D4 panier groupé (−10 %) ·
   D5 rappels d'échéance et cours vus mais non débloqués.
   Le paiement reste 100 % NOVA Checkout : l'application ne fait
   qu'ouvrir la session et vérifier le statut auprès du serveur.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte, fcfa = V3.fcfa;

let PAY = { commandes: [], acces: null, plans: [], choix: {} };

/* ------------------------------------------------------------
   D1 — MES PAIEMENTS
   ------------------------------------------------------------ */
/* le code reçu par un lien de parrainage, gardé pour ce navigateur */
function codeAmi(){
  try { return (sessionStorage.getItem('lh_code_ami') || '').toUpperCase(); } catch (e) { return ''; }
}
function pagePaiements(){
  return A.barPage('Mes paiements',
    `<button class="text-btn ripple" data-act="paySync">Vérifier</button>`,
    `<div id="payCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function paiementsCharger(){
  const zone = document.getElementById('payCorps');
  if (!zone) return;
  const r = await V3.lire('/api/paiements');
  if (!r.ok || !r.data){ zone.innerHTML = V3.vide('help', 'Paiements indisponibles', r.erreur || 'Le serveur n\'a pas répondu.'); return; }
  PAY.commandes = r.data.commandes || [];
  PAY.acces = r.data.acces || { cours: [], abonnement: {}, toutPaye: false };
  PAY.plans = r.data.plans || [];
  const payees = PAY.commandes.filter(o => o.statut === 'paid');
  const total = payees.reduce((s, o) => s + (o.montant || 0), 0);
  const abo = PAY.acces.abonnement || {};
  const ouverts = PAY.commandes.filter(o => o.statut === 'open');
  const catalogue = await V3.lire('/api/courses');
  const cours = (catalogue.ok && catalogue.data && catalogue.data.cours) ? catalogue.data.cours : [];
  const debloques = PAY.acces.toutPaye ? cours.map(c => c.id) : (PAY.acces.cours || []);
  const aDebloquer = cours.filter(c => !debloques.includes(c.id));

  zone.innerHTML = `
    <div class="v3-grille">
      ${carte('Total réglé', `<p class="v3-big">${fcfa(total)}</p><p class="body-small muted">${payees.length} paiement(s) confirmé(s)</p>`, { ico: 'card' })}
      ${carte('Abonnement', abo.actif
        ? `<p class="v3-big">${abo.joursRestants} j</p><p class="body-small muted">${esc(abo.planNom || '')} · jusqu'au ${esc(V3.dateFr(abo.fin))}</p>`
        : `<p class="v3-big">—</p><p class="body-small muted">Aucun abonnement en cours</p>`, { ico: 'crown' })}
    </div>

    ${abo.actif && abo.joursRestants <= 7 ? `<div class="card card--pad" style="border-color:var(--md-error);margin-top:12px">
      <p class="title-small">${svg('bell', 'icon icon--20')} Votre abonnement se termine dans ${abo.joursRestants} jour(s)</p>
      <p class="body-small" style="margin-top:6px">Renouvelez pour ne pas perdre l'accès aux cours. Vos achats à l'unité restent acquis.</p>
      <button class="btn btn--filled btn--sm ripple" style="margin-top:10px" data-page="abonnement">Renouveler</button></div>` : ''}

    ${ouverts.length ? carte('Paiements en attente', `<div class="v3-table">${ouverts.map(o => `
      <div class="v3-tr v3-tr--2"><span class="v3-td">${esc(o.description)}<br><span class="body-small muted">ouverte ${esc(V3.quand(o.creeLe))}</span></span>
      <span class="v3-td">${fcfa(o.montant)}<br><button class="btn btn--sm btn--tonal ripple" data-act="payVerifier" data-id="${esc(o.id)}">Vérifier</button></span></div>`).join('')}</div>`, { ico: 'clock' }) : ''}

    ${carte('Payer plusieurs cours d\'un coup (−10 %)', aDebloquer.length < 2
      ? '<p class="body-small muted">Tous vos cours sont déjà débloqués 👌</p>'
      : `<div class="v3-liste">${aDebloquer.map(c => `
          <label class="v3-panier">
            <input type="checkbox" data-panier="${esc(c.id)}" ${PAY.choix[c.id] ? 'checked' : ''}>
            <span><b>${esc(c.titre)}</b><p>${esc(c.prof)} · ${fcfa(c.prix || 0)}</p></span>
          </label>`).join('')}</div>
        <label class="v3-champ" style="margin-top:10px"><span>Code promo (facultatif)</span><input id="payCode" placeholder="EX: MERCI-… " value="${esc(codeAmi())}"></label>
        ${codeAmi() ? `<p class="body-small muted" style="margin-top:-6px">Code de votre parrain appliqué : <b>${esc(codeAmi())}</b></p>` : ''}
        <div class="v3-tr v3-tr--total"><span id="panierN">0 cours</span><b id="panierP">0 F</b></div>
        <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="payPanier">${svg('card', 'icon icon--18')} Payer le panier</button>
        <p class="body-small muted" style="margin-top:8px">Le montant exact est calculé par le serveur : la remise de 10 % s'applique dès deux cours, le code promo en plus.</p>`,
      { ico: 'card' })}

    ${carte('Mes reçus', payees.length ? `<div class="v3-liste">${payees.map((o, i) => `
      <div class="v3-recu">
        <div class="v3-recu__t"><b>${esc(o.description)}</b><span class="pill">${o.statut === 'paid' ? 'payé' : esc(o.statut)}</span></div>
        <p class="body-small muted">${fcfa(o.montant)} · ${esc(V3.dateFr(o.payeLe || o.creeLe))}${o.methode ? ' · ' + esc(o.methode) : ''}</p>
        <p class="body-small muted">Référence : <b>${esc(o.reference || o.session || '—')}</b></p>
        ${o.meta && o.meta.code ? `<p class="body-small muted">Code appliqué : ${esc(o.meta.code)} (−${fcfa(o.meta.reduction || 0)})</p>` : ''}
        ${o.meta && o.meta.pack ? `<p class="body-small muted">Remise panier : −${fcfa(o.meta.pack)}</p>` : ''}
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button class="btn btn--sm btn--tonal ripple" data-act="recuVoir" data-i="${i}">Voir le reçu</button>
          <button class="btn btn--sm btn--outlined ripple" data-act="recuPartager" data-i="${i}">${svg('share', 'icon icon--16')} Partager</button>
        </div>
      </div>`).join('')}</div>` : '<p class="body-small muted">Aucun paiement pour l\'instant. Le reçu apparaît ici dès qu\'un paiement est confirmé.</p>', { ico: 'check-circle' })}

    ${aDebloquer.length ? carte('Cours vus mais non débloqués', `<div class="v3-liste">${aDebloquer.filter(c => A.leconsFaites(c.id) > 0).map(c => `
      <div class="list-row"><span class="list-row__ico" style="background:var(--md-secondary-container)">${svg(c.ico || 'school', 'icon icon--20')}</span>
        <span class="list-row__main"><h3>${esc(c.titre)}</h3><p>${A.leconsFaites(c.id)} leçon(s) suivie(s) · ${fcfa(c.prix || 0)}</p></span>
        <button class="btn btn--sm btn--filled ripple" data-act="payUn" data-id="${esc(c.id)}">Payer</button></div>`).join('') || '<p class="body-small muted">Rien en attente.</p>'}</div>`, { ico: 'bell' }) : ''}
    ${V3.info('Paiement par NOVA Checkout : carte, solde NOVA ou bon. L\'accès s\'ouvre uniquement après confirmation du serveur — jamais sur le seul retour du navigateur.', 'lock')}`;
  paiementsPanierMaj();
}
function paiementsPanierMaj(){
  const cases = [...document.querySelectorAll('[data-panier]')];
  const choisis = cases.filter(c => c.checked);
  const somme = choisis.reduce((s, c) => {
    const carte = document.querySelector('label.v3-panier input[value="' + c.dataset.panier + '"]');
    return s;
  }, 0);
  const n = document.getElementById('panierN'), p = document.getElementById('panierP');
  if (!n || !p) return;
  const prix = choisis.map(c => +((c.closest('label').querySelector('p') || {}).textContent || '').replace(/[^0-9]/g, '') || 0);
  const brut = prix.reduce((s, x) => s + x, 0);
  const remise = choisis.length >= 2 ? Math.round(brut * 0.1) : 0;
  n.textContent = choisis.length + ' cours' + (remise ? ' (−10 %)' : '');
  p.textContent = fcfa(brut - remise);
}

/* ------------------------------------------------------------
   D2 — CODES PROMO
   ------------------------------------------------------------ */
function pageCodes(){
  return A.barPage('Codes promo', '', `<div id="cdCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function codesCharger(){
  const zone = document.getElementById('cdCorps');
  if (!zone) return;
  const prof = V3.estProf();
  const r = await V3.lire('/api/codes');
  const codes = (r.ok && r.data && r.data.codes) ? r.data.codes : [];
  const cours = window.LHV3FORMATEUR && window.LHV3FORMATEUR.coursRef
    ? await window.LHV3FORMATEUR.coursRef() : (window.__V3COURS || []);
  zone.innerHTML = `
    ${carte('J\'ai reçu un code', `
      <label class="v3-champ"><span>Code</span><input id="cdSaisie" placeholder="EX: SAVON10" autocapitalize="characters" style="text-transform:uppercase"></label>
      <button class="btn btn--filled btn--block ripple" data-act="cdUtiliser">${svg('check', 'icon icon--18')} Utiliser ce code</button>
      <p class="body-small muted" style="margin-top:8px">Un code d'accès ouvre un cours immédiatement ; un code de réduction s'applique à votre prochain paiement.</p>`, { ico: 'card' })}
    ${prof ? carte('Créer un code', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Genre</span><select id="cdGenre" class="v3-select">
          <option value="reduction">Réduction (%)</option><option value="acces">Accès offert à un cours</option></select></label>
        <label class="v3-champ"><span>Valeur</span><input id="cdValeur" type="number" min="0" max="100" step="5" value="20"><b>%</b></label>
      </div>
      <label class="v3-champ"><span>Cours (si accès offert)</span><select id="cdCours" class="v3-select">
        <option value="">—</option>${cours.map(c => `<option value="${esc(c.id)}">${esc(c.titre)}</option>`).join('')}</select></label>
      <label class="v3-champ"><span>Code (vide = automatique)</span><input id="cdCode" placeholder="SAVON10" style="text-transform:uppercase"></label>
      <label class="v3-champ"><span>Libellé</span><input id="cdLibelle" placeholder="Lancement janvier"></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Limite d'utilisations</span><input id="cdMax" type="number" min="0" step="1" value="0" placeholder="0 = illimité"></label>
        <label class="v3-champ"><span>Durée (jours)</span><input id="cdJours" type="number" min="0" step="30" value="90"></label>
      </div>
      <button class="btn btn--filled btn--block ripple" data-act="cdCreer">${svg('plus', 'icon icon--18')} Créer le code</button>`, { ico: 'star' }) : ''}
    ${carte(prof ? 'Codes que j\'ai créés' : 'Codes que j\'ai utilisés', codes.length ? `<div class="v3-table">${codes.map(c => `
      <div class="v3-tr v3-tr--2">
        <span class="v3-td"><b>${esc(c.code)}</b><br><span class="body-small muted">${esc(c.libelle || (c.genre === 'acces' ? 'Accès offert' : 'Réduction ' + c.valeur + ' %') + (c.coursTitre ? ' · ' + c.coursTitre : ''))}</span></span>
        <span class="v3-td">${esc(c.utilisations)}${c.utilisationsMax ? '/' + c.utilisationsMax : ''} usage(s)<br>
          <span class="body-small muted">${c.expireLe ? 'expire ' + esc(V3.dateFr(c.expireLe)) : 'sans date'}${c.actif === false ? ' · désactivé' : ''}</span>
          ${prof && c.actif !== false ? `<br><button class="text-btn ripple" data-act="cdDesactiver" data-code="${esc(c.code)}">Désactiver</button>` : ''}</span>
      </div>`).join('')}</div>` : '<p class="body-small muted">Aucun code encore.</p>', { ico: 'layers' })}`;
  const genre = document.getElementById('cdGenre');
  if (genre) genre.onchange = () => {
    const acc = genre.value === 'acces';
    document.getElementById('cdValeur').disabled = acc;
    document.getElementById('cdCours').disabled = !acc;
  };
}

/* ------------------------------------------------------------
   D3 — PARRAINAGE
   ------------------------------------------------------------ */
function pageParrainage(){
  return A.barPage('Parrainage', '', `<div id="paCorps"><p class="body-small muted">Chargement…</p></div>`);
}
async function parrainageCharger(){
  const zone = document.getElementById('paCorps');
  if (!zone) return;
  const r = await V3.lire('/api/parrainage');
  if (!r.ok || !r.data){ zone.innerHTML = V3.vide('help', 'Parrainage indisponible', r.erreur || ''); return; }
  const d = r.data;
  const lien = location.origin + '/codes?code=' + encodeURIComponent(d.code);
  zone.innerHTML = `
    <div class="v3-hero" data-ton="amber">
      <span class="v3-hero__ico">${svg('star', 'icon icon--28')}</span>
      <div><p class="body-medium">Votre code : <b>${esc(d.code)}</b></p>
        <p class="body-small muted">${d.utilisations} filleul(s) · vos amis ont ${d.reductionFilleul} % de réduction · vous gagnez ${d.reductionParrain} % à chaque filleul.</p></div>
    </div>
    ${carte('Inviter un ami', `
      <p class="body-small muted">Partagez ce lien : votre ami l'ouvre, saisit le code, et obtient sa réduction. Vous recevez la vôtre dès qu'il l'utilise pour payer.</p>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
        <button class="btn btn--filled ripple" data-act="paPartager">${svg('share', 'icon icon--18')} Partager mon code</button>
        <button class="btn btn--tonal ripple" data-act="paCopier" data-lien="${esc(lien)}">Copier le lien</button>
      </div>`, { ico: 'bullhorn' })}
    ${carte('J\'ai un code reçu d\'un ami', `
      <label class="v3-champ"><span>Code de parrainage</span><input id="paCode" placeholder="COPAIN-XXXX" style="text-transform:uppercase"></label>
      <button class="btn btn--tonal btn--block ripple" data-act="paVerifier">Utiliser ce code</button>`, { ico: 'person' })}
    ${carte('Mes filleuls', d.filleuls && d.filleuls.length ? `<div class="v3-table">${d.filleuls.map(f => `
      <div class="v3-tr v3-tr--2"><span class="v3-td">${esc(f.qui)}</span><span class="v3-td muted">${esc(V3.quand(f.quand))}</span></div>`).join('')}</div>`
      : '<p class="body-small muted">Personne encore. Un message à un ami suffit souvent.</p>', { ico: 'person' })}
    ${carte('Mes récompenses', d.recompenses && d.recompenses.length ? `<div class="v3-table">${d.recompenses.map(r => `
      <div class="v3-tr v3-tr--2"><span class="v3-td"><b>${esc(r.code)}</b><br><span class="body-small muted">${r.valeur} % de réduction · usage ${r.utilisations}/${r.utilisationsMax || '∞'}</span></span>
        <span class="v3-td"><button class="btn btn--sm btn--tonal ripple" data-act="cdUtiliserCode" data-code="${esc(r.code)}">Utiliser au paiement</button></span></div>`).join('')}</div>`
      : '<p class="body-small muted">Vos récompenses apparaîtront ici dès qu\'un filleul paie avec votre code.</p>', { ico: 'crown' })}`;
}

/* ------------------------------------------------------------
   D5 — RAPPELS
   ------------------------------------------------------------ */
async function relancesVerifier(){
  const r = await V3.lire('/api/paiements');
  if (!r.ok || !r.data) return;
  const abo = (r.data.acces && r.data.acces.abonnement) || {};
  const cle = 'relance_abo_' + (abo.fin || 'aucun');
  const memoire = await V3.donnees('relances', { faits: [] });
  if (abo.actif && abo.joursRestants <= 7 && abo.joursRestants > 0 && !(memoire.faits || []).includes(cle)){
    A.notification('aide', 'Abonnement : plus que ' + abo.joursRestants + ' jour(s)',
      'Renouvelez dans « Mes paiements » pour garder tous les cours ouverts.', ['paiements', '']);
    memoire.faits = (memoire.faits || []).concat([cle]).slice(-20);
    await V3.enregistrer('relances', memoire);
  }
}

/* ------------------------------------------------------------
   CLICS
   ------------------------------------------------------------ */
document.addEventListener('click', async e => {
  const t = e.target;

  if (t.closest('[data-act="paySync"]')){
    A.toast('Vérification des paiements…');
    await paiementsCharger(); return;
  }
  const pv = t.closest('[data-act="payVerifier"]');
  if (pv){
    const r = await V3.api('/api/paiements/verifier', { method: 'POST', body: JSON.stringify({ orderId: pv.dataset.id }) });
    A.toast(r.ok ? 'Statut : ' + ((r.data && r.data.statut) || 'inconnu') : (r.erreur || 'Vérification impossible'));
    paiementsCharger();
    return;
  }
  const pu = t.closest('[data-act="payUn"]');
  if (pu){
    const r = await V3.api('/api/paiements/session', { method: 'POST', body: JSON.stringify({ type: 'cours', courseId: pu.dataset.id }) });
    if (!r.ok){ A.toast(r.erreur || 'Paiement impossible'); return; }
    if (r.data && r.data.url) location.href = r.data.url;
    return;
  }
  if (t.closest('[data-act="payPanier"]')){
    const ids = [...document.querySelectorAll('[data-panier]')].filter(c => c.checked).map(c => c.dataset.panier);
    if (ids.length < 2){ A.toast('Choisissez au moins deux cours'); return; }
    const code = (document.getElementById('payCode') || {}).value || '';
    const r = await V3.api('/api/paiements/session', { method: 'POST', body: JSON.stringify({ type: 'panier', courseIds: ids, code: code || undefined }) });
    if (!r.ok){ A.toast(r.erreur || 'Paiement impossible'); return; }
    if (r.data && r.data.url) location.href = r.data.url;
    return;
  }
  const rv = t.closest('[data-act="recuVoir"]');
  if (rv){
    const o = PAY.commandes[+rv.dataset.i];
    if (!o) return;
    const lignes = [
      'CosmétiLab — reçu de paiement',
      'Objet : ' + o.description,
      'Montant : ' + fcfa(o.montant) + ' ' + (o.devise || 'XOF'),
      'Statut : ' + o.statut,
      'Date : ' + V3.dateFr(o.payeLe || o.creeLe),
      'Méthode : ' + (o.methode || '—'),
      'Référence : ' + (o.reference || o.session || '—'),
      (o.meta && o.meta.pack ? 'Remise panier : −' + fcfa(o.meta.pack) : ''),
      (o.meta && o.meta.code ? 'Code ' + o.meta.code + ' : −' + fcfa(o.meta.reduction || 0) : ''),
      'Compte : ' + V3.nomCompte(),
      'Fournisseur : NOVA Checkout'
    ].filter(Boolean).join('\n');
    A.dialog({ title: 'Reçu', text: lignes, confirmLabel: 'Fermer', cancel: false, ico: 'card' });
    return;
  }
  const rp = t.closest('[data-act="recuPartager"]');
  if (rp){
    const o = PAY.commandes[+rp.dataset.i];
    if (!o) return;
    V3.partager('Reçu CosmétiLab', o.description + ' — ' + fcfa(o.montant) + ' · ' + V3.dateFr(o.payeLe || o.creeLe) + ' · réf. ' + (o.reference || o.session || '—'));
    return;
  }

  const cc = t.closest('[data-act="cdCreer"]');
  if (cc){
    const corps = {
      genre: (document.getElementById('cdGenre') || {}).value || 'reduction',
      valeur: +(document.getElementById('cdValeur') || {}).value || 0,
      courseId: (document.getElementById('cdCours') || {}).value || '',
      code: (document.getElementById('cdCode') || {}).value || '',
      libelle: (document.getElementById('cdLibelle') || {}).value || '',
      utilisationsMax: +(document.getElementById('cdMax') || {}).value || 0,
      jours: +(document.getElementById('cdJours') || {}).value || 0
    };
    const r = await V3.ecrire('/api/codes', corps);
    if (!r.ok){ A.toast(r.erreur || 'Création impossible'); return; }
    A.toast('Code ' + ((r.data && r.data.code && r.data.code.code) || '') + ' créé ✅');
    codesCharger();
    return;
  }
  const cd = t.closest('[data-act="cdDesactiver"]');
  if (cd){
    const r = await V3.api('/api/codes?code=' + encodeURIComponent(cd.dataset.code), { method: 'DELETE' });
    A.toast(r.ok ? 'Code désactivé' : (r.erreur || 'Impossible'));
    codesCharger();
    return;
  }
  if (t.closest('[data-act="cdUtiliser"]')){
    await utiliserCode((document.getElementById('cdSaisie') || {}).value || '');
    return;
  }
  const uc = t.closest('[data-act="cdUtiliserCode"]');
  if (uc){ await utiliserCode(uc.dataset.code); return; }

  if (t.closest('[data-act="paPartager"]')){
    const r = await V3.lire('/api/parrainage');
    const code = (r.ok && r.data && r.data.code) || '';
    V3.partager('Mon code de parrainage CosmétiLab',
      'Rejoins CosmétiLab avec mon code ' + code + ' : ' + location.origin + '/codes?code=' + code + ' — on gagne tous les deux une réduction.');
    return;
  }
  const pc = t.closest('[data-act="paCopier"]');
  if (pc){
    (navigator.clipboard ? navigator.clipboard.writeText(pc.dataset.lien) : Promise.reject())
      .then(() => A.toast('Lien copié'))
      .catch(() => A.dialog({ title: 'Lien de parrainage', text: pc.dataset.lien, confirmLabel: 'Fermer', cancel: false, ico: 'share' }));
    return;
  }
  if (t.closest('[data-act="paVerifier"]')){
    const code = ((document.getElementById('paCode') || {}).value || '').toUpperCase();
    if (!code){ A.toast('Saisissez le code reçu'); return; }
    const r = await V3.ecrire('/api/parrainage', { code: code });
    if (!r.ok){ A.toast(r.erreur || 'Code inconnu'); return; }
    if (r.data && r.data.ok) await utiliserCode(code);
    else A.toast((r.data && r.data.message) || 'Code inconnu');
    return;
  }
});

async function utiliserCode(code){
  code = String(code || '').trim().toUpperCase();
  if (!code){ A.toast('Saisissez un code'); return; }
  const r = await V3.ecrire('/api/codes/utiliser', { code: code });
  A.toast(r.ok ? ((r.data && r.data.message) || 'Code accepté ✅') : (r.erreur || 'Code refusé'));
  if (r.ok) codesCharger();
}

document.addEventListener('input', e => {
  if (e.target.dataset && e.target.dataset.panier !== undefined){ PAY.choix[e.target.dataset.panier] = e.target.checked; paiementsPanierMaj(); }
});

/* ------------------------------------------------------------
   ÉCRANS + AMORÇAGE
   ------------------------------------------------------------ */
A.PAGES.paiements = { single: true, render: pagePaiements, mount(){ paiementsCharger(); relancesVerifier(); } };
A.PAGES.codes = { single: true, render: pageCodes, mount(el, params){
  codesCharger().then(() => {
    const code = (params && params.code) || (new URLSearchParams(location.search).get('code') || '')
      || (() => { try { return sessionStorage.getItem('lh_code_ami') || ''; } catch (e) { return ''; } })();
    const i = document.getElementById('cdSaisie');
    if (code && i){ i.value = code.toUpperCase(); }
  });
} };
A.PAGES.parrainage = { single: true, render: pageParrainage, mount(){ parrainageCharger(); } };

/* le lien /codes?code=… d'un parrain : on retient le code pour l'élève */
(function(){
  const c = new URLSearchParams(location.search).get('code');
  if (c && location.pathname.indexOf('/codes') === 0){
    try { sessionStorage.setItem('lh_code_ami', c.toUpperCase()); } catch (e) {}
  }
})();

window.LHV3ARGENT = { paiementsCharger: paiementsCharger, utiliserCode: utiliserCode, relancesVerifier: relancesVerifier };
})();
