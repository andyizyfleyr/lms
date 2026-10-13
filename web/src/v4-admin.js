/* ============================================================
   V4 — CONSOLE D'ADMINISTRATION, SÉCURITÉ, ÉQUIPE
   ------------------------------------------------------------
   La console sert à tenir la maison : voir ce qui se vend, qui
   s'inscrit, ce qui est signalé ; nommer un modérateur, bloquer un
   compte, corriger un prix, rouvrir un PDF. Le journal de sécurité
   et le code de secours complètent le dispositif côté membre,
   et la fiche apprenant donne au formateur de quoi conseiller
   quelqu'un en deux minutes.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte;
const fcfa = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' F CFA';
const quand = V3.quand || (d => (d ? new Date(d).toLocaleDateString('fr-FR') : ''));
const dateFr = d => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

/* ------------------------------------------------------------
   1. CONSOLE D'ADMINISTRATION
   ------------------------------------------------------------ */
let CONS = { chiffres: null, comptes: [], onglet: 'apercu', filtre: '' };

function pageConsole(){ return A.barPage('Console', '', `
  <div class="tabs" style="overflow-x:auto">
    ${[['apercu', 'Aperçu'], ['comptes', 'Comptes'], ['moderation', 'Modération'],
       ['paiements', 'Paiements'], ['ouvrages', 'Ouvrages PDF']]
      .map(([id, nom]) => `<button class="tab${CONS.onglet === id ? ' is-active' : ''}" data-conso="${id}">${esc(nom)}</button>`).join('')}
  </div>
  <div id="cnCorps" style="margin-top:14px"><p class="body-small muted">Chargement…</p></div>`); }

async function consoleCharger(){
  const zone = document.getElementById('cnCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-admin');
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Console inaccessible', `<p class="body-medium">${esc(r.erreur || 'Accès réservé à l\'administration.')}</p>`, { ico: 'lock' });
    return;
  }
  CONS.chiffres = r.data;
  zone.innerHTML = consoleOnglet(r.data);
  /* chaque onglet charge ses propres données juste après l'affichage */
  await monterOnglet();
}

async function monterOnglet(){
  if (CONS.onglet === 'comptes') await comptesCharger();
  else if (CONS.onglet === 'moderation') await moderationCharger();
  else if (CONS.onglet === 'paiements') await paiementsAdmin();
  else if (CONS.onglet === 'ouvrages') await ouvragesAdmin();
}

function consoleOnglet(c){
  if (CONS.onglet === 'apercu'){
    const f = c.chiffres || {};
    return `
      <div class="v4-console">
        <div class="v4-chiffre"><b>${f.comptes ?? 0}</b><span>comptes</span></div>
        <div class="v4-chiffre"><b>${f.comptesActifs ?? 0}</b><span>comptes actifs</span></div>
        <div class="v4-chiffre"><b>${f.cours ?? 0}</b><span>cours (${f.coursPublies ?? 0} publiés)</span></div>
        <div class="v4-chiffre"><b>${f.ventes ?? 0}</b><span>ventes payées</span></div>
        <div class="v4-chiffre"><b>${fcfa(f.encaisse || 0)}</b><span>encaissé au total</span></div>
        <div class="v4-chiffre"><b>${fcfa(f.encaisseMois || 0)}</b><span>encaissé ce mois</span></div>
        <div class="v4-chiffre"><b>${f.ouvragesPublies ?? 0}/${f.ouvrages ?? 0}</b><span>ouvrages publiés</span></div>
        <div class="v4-chiffre"><b>${f.signalementsOuverts ?? 0}</b><span>signalements ouverts</span></div>
      </div>
      ${carte('État du service', `
        <div class="v3-fiche">
          <div><span>Tables en base</span><b>${f.tables ?? 0}</b></div>
          <div><span>Messages d'entraide</span><b>${f.messagesForum ?? 0}</b></div>
          <div><span>Encaissé aujourd'hui</span><b>${fcfa(f.encaisseJour || 0)}</b></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <a class="btn btn--outlined btn--sm ripple" href="/etat" data-lien>État du service</a>
          <a class="btn btn--outlined btn--sm ripple" href="/securite" data-lien>Ma sécurité</a>
          <a class="btn btn--tonal btn--sm ripple" href="/boutique" data-lien>Boutique PDF</a>
        </div>`, { ico: 'shield' })}
      ${(c.dernieresCommandes || []).length ? carte('Dernières commandes', `<div class="v3-liste">${c.dernieresCommandes.slice(0, 6).map(o => `
        <div class="list-row"><span class="list-row__main"><h3>${esc(o.description || o.type)}</h3>
          <p>${esc(o.statut || '')} · ${fcfa(o.amount || 0)} · ${quand(o.created_at)}</p></span>
          <span class="v4-tag${o.status === 'paid' ? ' v4-tag--ok' : ''}">${esc(o.status || '')}</span></div>`).join('')}</div>`, { ico: 'card' }) : ''}
      ${(c.derniersSignalements || []).length ? carte('Signalements récents', `<div class="v3-liste">${c.derniersSignalements.slice(0, 5).map(s => `
        <div class="list-row"><span class="list-row__main"><h3>${esc(s.motif)} — ${esc(s.cible)}</h3>
          <p>${esc(s.details || '')} · ${quand(s.created_at)}</p></span>
          <span class="v4-tag${s.etat === 'ouvert' ? ' v4-tag--ko' : ' v4-tag--ok'}">${esc(s.etat)}</span></div>`).join('')}</div>`, { ico: 'bullhorn' }) : ''}`;
  }

  if (CONS.onglet === 'comptes'){
    return `
      <div class="v3-champ" style="margin-bottom:10px"><input id="cnQ" placeholder="Chercher un nom, un e-mail, une ville…" value="${esc(CONS.filtre)}"></div>
      <button class="btn btn--tonal btn--block ripple" style="margin-bottom:12px" data-act="cnChercher">${svg('search','icon icon--18')} Chercher</button>
      <div id="cnComptes"><p class="body-small muted">Chargement des comptes…</p></div>`;
  }

  if (CONS.onglet === 'moderation') return `<div id="cnMod"><p class="body-small muted">Chargement de la file…</p></div>`;
  if (CONS.onglet === 'paiements') return `<div id="cnPay"><p class="body-small muted">Chargement des paiements…</p></div>`;
  return `<div id="cnOuv"><p class="body-small muted">Chargement des ouvrages…</p></div>`;
}

async function comptesCharger(){
  const zone = document.getElementById('cnComptes');
  if (!zone) return;
  const r = await V3.lire('/api/p4-admin/utilisateurs' + (CONS.filtre ? '?q=' + encodeURIComponent(CONS.filtre) : ''));
  const d = (r.ok && r.data) ? r.data : { comptes: [] };
  zone.innerHTML = d.comptes.length ? `<div class="v3-liste">${d.comptes.map(u => `
    <div class="v4-admin-row">
      <span class="v4-admin-row__main"><b>${esc(u.nom || 'Sans nom')}</b>
        <span class="body-small muted">${esc(u.email)}${u.ville ? ' · ' + esc(u.ville) : ''}</span>
        <span class="body-small muted">${esc(u.role)}${u.moderateur ? ' · modérateur' : ''}${u.bloque ? ' · bloqué' : ''} · inscrit ${quand(u.created_at)}</span></span>
      <span style="display:flex;gap:6px;flex-wrap:wrap">
        <a class="btn btn--outlined btn--sm ripple" href="/formateur/apprenants/${esc(u.id)}" data-lien>Fiche</a>
        <button class="btn btn--tonal btn--sm ripple" data-act="cnRole" data-id="${esc(u.id)}" data-role="${u.role === 'enseignant' ? 'etudiant' : 'enseignant'}">
          ${u.role === 'enseignant' ? 'Repasser élève' : 'Nommer formateur'}</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="cnMod" data-id="${esc(u.id)}" data-valeur="${u.moderateur ? '0' : '1'}">
          ${u.moderateur ? 'Retirer modérateur' : 'Nommer modérateur'}</button>
        <button class="btn ${u.bloque ? 'btn--tonal' : 'btn--danger'} btn--sm ripple" data-act="cnBloque" data-id="${esc(u.id)}" data-valeur="${u.bloque ? '0' : '1'}">
          ${u.bloque ? 'Débloquer' : 'Bloquer'}</button>
      </span>
    </div>`).join('')}</div>` : carte('Aucun compte', '<p class="body-medium">Aucun compte ne correspond à cette recherche.</p>', { ico: 'person' });
}

async function moderationCharger(){
  const zone = document.getElementById('cnMod');
  if (!zone) return;
  const r = await V3.lire('/api/p4-admin/moderation');
  const d = (r.ok && r.data) ? r.data : { signalements: [] };
  zone.innerHTML = d.signalements.length ? `<div class="v3-liste">${d.signalements.map(s => `
    <div class="v4-etape">
      <h3>${esc(s.motif)} — ${esc(s.cible)}</h3>
      <p class="body-small muted">signalé par ${esc(s.par_nom || 'un membre')} · ${quand(s.created_at)} · état ${esc(s.etat)}</p>
      ${s.details ? `<p class="body-medium">${esc(s.details)}</p>` : ''}
      ${s.contenu ? `<p class="body-small" style="margin-top:6px"><b>Contenu visé :</b> ${esc(String(s.contenu).slice(0, 320))}</p>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${s.etat === 'ouvert' ? `
          <button class="btn btn--filled btn--sm ripple" data-act="mdMasquer" data-id="${esc(s.id)}">Masquer le contenu</button>
          <button class="btn btn--outlined btn--sm ripple" data-act="mdRetablir" data-id="${esc(s.id)}">Rétablir</button>
          <button class="btn btn--outlined btn--sm ripple" data-act="mdRejeter" data-id="${esc(s.id)}">Signalement infondé</button>`
        : `<span class="v4-tag v4-tag--ok">traité ${quand(s.traite_le)}</span>`}
      </div>
    </div>`).join('')}</div>` : carte('File vide', '<p class="body-medium">Aucun signalement à traiter. La modération se fait ici : masquer, rétablir, ou classer sans suite.</p>', { ico: 'shield' });
}

async function paiementsAdmin(){
  const zone = document.getElementById('cnPay');
  if (!zone) return;
  const r = await V3.lire('/api/p4-admin/paiements');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Paiements indisponibles', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  const t = d.totaux || {};
  zone.innerHTML = `
    <div class="v4-console">
      <div class="v4-chiffre"><b>${fcfa(t.encaisse || 0)}</b><span>encaissé</span></div>
      <div class="v4-chiffre"><b>${fcfa(t.encours || 0)}</b><span>en attente de paiement</span></div>
      <div class="v4-chiffre"><b>${t.echecs || 0}</b><span>paiements échoués</span></div>
      <div class="v4-chiffre"><b>${t.jour || 0}</b><span>paiements aujourd'hui</span></div>
    </div>
    ${carte('Par moyen de paiement', `<div class="v3-liste">${(d.parMoyen || []).map(m => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(m.moyen || 'non précisé')}</h3><p>${m.n} paiement(s)</p></span>
        <b>${fcfa(m.total || 0)}</b></div>`).join('') || '<p class="body-small muted">Aucun paiement enregistré.</p>'}</div>`, { ico: 'card' })}
    ${(d.parOuvrage || []).length ? carte('Ventes par ouvrage', `<div class="v3-liste">${d.parOuvrage.map(o => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(o.titre || o.id)}</h3><p>${o.n} vente(s)</p></span>
        <b>${fcfa(o.total || 0)}</b></div>`).join('')}</div>`, { ico: 'book' }) : ''}
    ${(d.parJour || []).length ? carte('Jour par jour', `<div class="v3-liste">${d.parJour.map(j => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(j.jour)}</h3><p>${j.n} paiement(s)</p></span>
        <b>${fcfa(j.total || 0)}</b></div>`).join('')}</div>`, { ico: 'chart' }) : ''}`;
}

async function ouvragesAdmin(){
  const zone = document.getElementById('cnOuv');
  if (!zone) return;
  const r = await V3.lire('/api/p4-admin/ouvrages');
  const d = (r.ok && r.data) ? r.data : { ouvrages: [] };
  zone.innerHTML = `<div class="v3-liste">${d.ouvrages.map(o => `
    <div class="v4-admin-row">
      <span class="v4-admin-row__main"><b>${esc(o.titre)}</b>
        <span class="body-small muted">${o.pages} pages · ${o.gratuit ? 'gratuit' : fcfa(o.prix)} · ordre ${o.ordre}</span>
        <span class="body-small muted">${o.publie ? 'publié' : 'brouillon'} · ${o.fichier ? 'PDF généré' : 'à générer'}</span></span>
      <span style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn--outlined btn--sm ripple" data-act="ovPrix" data-id="${esc(o.id)}" data-prix="${o.prix}">Prix</button>
        <button class="btn btn--tonal btn--sm ripple" data-act="ovPublie" data-id="${esc(o.id)}" data-valeur="${o.publie ? '0' : '1'}">${o.publie ? 'Dépublier' : 'Publier'}</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="ovRegenerer" data-id="${esc(o.id)}">Régénérer</button>
        <a class="btn btn--outlined btn--sm ripple" href="/boutique/${esc(o.id)}" data-lien>Voir</a>
      </span>
    </div>`).join('') || '<p class="body-small muted">Aucun ouvrage.</p>'}</div>`;
}

/* ------------------------------------------------------------
   2. SÉCURITÉ DU COMPTE
   ------------------------------------------------------------ */
function pageSecurite(){ return A.barPage('Sécurité', '', `<div id="seCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function securiteCharger(){
  const zone = document.getElementById('seCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-securite');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Journal indisponible', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  const c = d.codeSecours || {};
  zone.innerHTML = `
    ${carte('Code de secours', `
      <p class="body-medium">Un code à six chiffres, noté sur un carnet (pas dans le téléphone) : il permet de rentrer
      dans votre compte si vous perdez votre mot de passe. Il ne s'affiche qu'une fois et sert une seule fois.</p>
      <p class="body-small muted" style="margin-top:8px">${c.existe
        ? 'Code créé le ' + dateFr(c.creeLe) + (c.utilise ? ' · déjà utilisé' : ' · encore valable')
        : 'Aucun code de secours pour l\'instant.'}</p>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="seGenerer">
        ${svg('lock','icon icon--18')} ${c.existe ? 'Créer un nouveau code' : 'Créer mon code de secours'}</button>
      <div id="seCode" style="margin-top:10px"></div>`, { ico: 'lock' })}
    ${carte('Sessions ouvertes', `
      <p class="body-medium">${d.appareils.length} appareil(s) connecté(s). Fermez ce que vous ne reconnaissez pas : l'accès est coupé immédiatement.</p>
      <div class="v3-liste" style="margin-top:10px">${d.appareils.map(a => `
        <div class="v4-admin-row">
          <span class="v4-admin-row__main"><b>${esc(a.device)}</b>
            <span class="body-small muted">${esc((a.ip || '').slice(0, 20))} · ouvert le ${dateFr(a.created_at)}</span></span>
          <button class="btn btn--outlined btn--sm ripple" data-act="seFermer" data-token="${esc(a.token)}">Fermer</button>
        </div>`).join('')}</div>`, { ico: 'person' })}
    ${carte('Journal', d.journal.length ? `<div class="v3-liste">${d.journal.map(j => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(j.type)}</h3>
        <p>${esc(j.detail || '')} · ${quand(j.created_at)}${j.appareil ? ' · ' + esc(j.appareil.slice(0, 40)) : ''}</p></span></div>`).join('')}</div>`
      : '<p class="body-medium">Aucun évènement pour l\'instant. Les connexions, changements de rôle et codes de secours s\'inscrivent ici.</p>', { ico: 'clock' })}
    <p class="body-small muted" style="margin-top:12px">Un code de secours utilisé se reconnecte directement : gardez-le hors du téléphone, et créez-en un nouveau dès qu'il a servi.</p>`;
}

/* ------------------------------------------------------------
   3. FICHE APPRENANT (formateur)
   ------------------------------------------------------------ */
function pageApprenant(){ return A.barPage('Fiche apprenant', '', `<div id="apCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function apprenantCharger(params){
  const zone = document.getElementById('apCorps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez un apprenant', '<p class="body-medium">Cet écran s\'ouvre depuis la console ou la liste des apprenants.</p>', { ico: 'person' }); return; }
  const r = await V3.lire('/api/p4-formateur/apprenants/' + encodeURIComponent(id));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Fiche indisponible', `<p class="body-medium">${esc(r.erreur || 'Cet apprenant n\'existe pas.')}</p>`, { ico: 'help' });
    return;
  }
  const d = r.data, u = d.profil;
  A.titreOnglet && A.titreOnglet(u.nom);
  const minutes = (d.activite || []).reduce((n, a) => n + (a.minutes || 0), 0);
  zone.innerHTML = `
    ${carte('', `
      <div class="v4-fiche">
        <span class="list-row__ico" style="width:56px;height:56px;background:var(--md-primary-container);color:var(--md-on-primary-container);font-size:20px">${esc(A.initials ? A.initials(u.nom) : (u.nom || '?').slice(0, 2))}</span>
        <div>
          <h2 class="titre-page">${esc(u.nom)}</h2>
          <p class="body-small muted">${esc(u.email)}${u.tel ? ' · ' + esc(u.tel) : ''}${u.ville ? ' · ' + esc(u.ville) : ''}</p>
          <p class="body-small muted">Inscrit le ${dateFr(u.created_at)} · ${u.points} points · ${minutes} minutes d'activité récente</p>
          ${u.bio ? `<p class="body-medium" style="margin-top:6px">${esc(u.bio)}</p>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <a class="btn btn--tonal btn--sm ripple" href="/formateur/notation" data-lien>Noter ses devoirs</a>
            <a class="btn btn--outlined btn--sm ripple" href="/formateur/annonce" data-lien>Envoyer une annonce</a>
          </div>
        </div>
      </div>`, { ico: 'person' })}
    ${carte('Sa progression', d.cours.length ? `<div class="v3-liste">${d.cours.map(c => `
      <div class="v4-etape">
        <h3>${esc(c.titre)}</h3>
        <p class="body-small muted">${c.faites}/${c.lecons} leçons · ${c.progress || 0} % · ${esc(c.statut || '')}${c.expires_at ? ' · accès jusqu\'au ' + dateFr(c.expires_at) : (c.source ? ' · accès ' + esc(c.source) : '')}</p>
        <div class="v4-jauge"><i style="width:${Math.min(100, c.progress || 0)}%"></i></div>
      </div>`).join('')}</div>` : '<p class="body-medium">Aucun cours suivi pour l\'instant.</p>', { ico: 'school' })}
    ${d.notes.length ? carte('Ses résultats', `<div class="v3-liste">${d.notes.map(n => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(n.titre)} <span class="v4-tag">${esc(n.genre)}</span></h3>
        <p>${quand(n.created_at)}</p></span><b>${n.sur ? n.note + '/' + n.sur : n.note + ' %'}</b></div>`).join('')}</div>`, { ico: 'medal' }) : ''}
    ${d.presences.length ? carte('Assiduité', `<div class="v3-liste">${d.presences.map(p => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(p.titre || 'Séance')}</h3>
        <p>${p.date_session ? dateFr(p.date_session) : ''} ${esc(p.salle || '')}</p></span><span class="v4-tag v4-tag--ok">présent</span></div>`).join('')}</div>`, { ico: 'check-circle' }) : ''}
    ${d.devoirs.length ? carte('Devoirs rendus', `<div class="v3-liste">${d.devoirs.map(dv => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(dv.titre)}</h3>
        <p>${esc(dv.statut || '')} · ${quand(dv.updated_at)}</p></span><b>${dv.note !== null && dv.note !== undefined ? dv.note : '—'}</b></div>`).join('')}</div>`, { ico: 'task' }) : ''}
    ${d.paiements.length ? carte('Ses paiements', `<div class="v3-liste">${d.paiements.map(p => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(p.description || p.type)}</h3>
        <p>${esc(p.status)} · ${quand(p.created_at)}</p></span><b>${fcfa(p.amount)}</b></div>`).join('')}</div>`, { ico: 'card' }) : ''}
    ${d.messages.length ? carte('Ses messages', `<div class="v3-liste">${d.messages.map(m => `
      <div class="v4-glr"><span class="body-small">${esc(m.contenu)}</span><span class="body-small muted">${quand(m.created_at)}</span></div>`).join('')}</div>`, { ico: 'chat' }) : ''}`;
}

/* ------------------------------------------------------------
   4. ÉQUIPE D'UN COURS (co-formateurs)
   ------------------------------------------------------------ */
let EQ = { cours: [], actuel: '' };
function pageEquipe(){ return A.barPage('Équipe du cours', '', `<div id="eqCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function equipeCharger(){
  const zone = document.getElementById('eqCorps');
  if (!zone) return;
  const r0 = await V3.lire('/api/p4-examens');
  const cours = (r0.ok && r0.data && r0.data.cours) || [];
  if (!EQ.actuel && cours.length) EQ.actuel = cours[0].id;
  EQ.cours = cours;
  const r = EQ.actuel ? await V3.lire('/api/p4-cours/' + encodeURIComponent(EQ.actuel) + '/co-formateurs') : null;
  const d = (r && r.ok && r.data) ? r.data : null;
  zone.innerHTML = `
    ${carte('Choisir le cours', `
      <label class="v3-champ"><span>Cours</span><select id="eqCours" class="v3-select">
        ${cours.map(c => `<option value="${esc(c.id)}" ${c.id === EQ.actuel ? 'selected' : ''}>${esc(c.titre)}</option>`).join('')}</select></label>`, { ico: 'school' })}
    ${!d ? carte('Équipe indisponible', '<p class="body-medium">Choisissez un cours pour voir qui le partage.</p>', { ico: 'users' }) : `
      ${carte('Co-formateurs — ' + d.cours.titre, `
        <p class="body-medium">Un co-formateur voit le cours, ses apprenants et son relevé de revenus, à la part convenue.
        C\'est la façon la plus simple de partager un cours entre deux ateliers.</p>
        ${d.equipe.length ? `<div class="v3-liste" style="margin-top:10px">${d.equipe.map(e => `
          <div class="v4-admin-row">
            <span class="v4-admin-row__main"><b>${esc(e.nom)}</b>
              <span class="body-small muted">${esc(e.email)}${e.ville ? ' · ' + esc(e.ville) : ''} · part ${e.part} %</span></span>
            <button class="btn btn--danger btn--sm ripple" data-act="eqRetirer" data-id="${esc(e.user_id)}">Retirer</button>
          </div>`).join('')}</div>` : '<p class="body-small muted" style="margin-top:10px">Aucun co-formateur pour l\'instant.</p>'}
        ${d.mien ? `
          <div class="v3-grille v3-grille--2" style="margin-top:12px">
            <label class="v3-champ"><span>Personne</span><select id="eqQui" class="v3-select">
              ${(d.candidats || []).map(c => `<option value="${esc(c.id)}">${esc(c.nom)}</option>`).join('')}</select></label>
            <label class="v3-champ"><span>Sa part (%)</span><input id="eqPart" type="number" min="0" max="100" value="40"></label>
          </div>
          <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="eqAjouter">${svg('users','icon icon--18')} Ajouter à l'équipe</button>`
        : '<p class="body-small muted" style="margin-top:10px">Seul l\'auteur du cours peut nommer un co-formateur.</p>'}`, { ico: 'users' })}`}`;
}

/* ------------------------------------------------------------ écrans */
A.PAGES.console = { single: true, render: pageConsole, mount(){ consoleCharger(); } };
A.PAGES.securite = { single: true, render: pageSecurite, mount(){ securiteCharger(); } };
A.PAGES.apprenant = { single: true, render: pageApprenant, mount(el, params){ apprenantCharger(params); } };
A.PAGES.equipe = { single: true, render: pageEquipe, mount(){ equipeCharger(); } };

window.LHV4ADMIN = { console: consoleCharger, securite: securiteCharger, apprenant: apprenantCharger, equipe: equipeCharger };

/* ------------------------------------------------------------ gestes */
document.addEventListener('click', async e => {
  const t = e.target;

  const ong = t.closest('[data-conso]');
  if (ong){
    CONS.onglet = ong.dataset.conso;
    document.querySelectorAll('[data-conso]').forEach(x => x.classList.toggle('is-active', x === ong));
    consoleCharger();
    return;
  }
  if (t.closest('[data-act="cnChercher"]')){
    CONS.filtre = ((document.getElementById('cnQ') || {}).value || '').trim();
    comptesCharger();
    return;
  }
  const role = t.closest('[data-act="cnRole"]');
  if (role){
    const r = await V3.api('/api/p4-admin/utilisateurs/' + encodeURIComponent(role.dataset.id), { method: 'PATCH', body: JSON.stringify({ role: role.dataset.role }) });
    A.toast(r.ok ? 'Rôle mis à jour ✅' : (r.erreur || 'Action impossible'));
    if (r.ok) comptesCharger();
    return;
  }
  const mod = t.closest('[data-act="cnMod"]');
  if (mod){
    const r = await V3.api('/api/p4-admin/utilisateurs/' + encodeURIComponent(mod.dataset.id), { method: 'PATCH', body: JSON.stringify({ moderateur: mod.dataset.valeur === '1' }) });
    A.toast(r.ok ? 'Modérateur mis à jour ✅' : (r.erreur || 'Action impossible'));
    if (r.ok) comptesCharger();
    return;
  }
  const blq = t.closest('[data-act="cnBloque"]');
  if (blq){
    const bloquer = blq.dataset.valeur === '1';
    const ok = await A.dialog({ title: bloquer ? 'Bloquer ce compte ?' : 'Débloquer ce compte ?',
      text: bloquer ? 'Ses sessions sont fermées immédiatement et il ne peut plus se reconnecter.' : 'Le compte retrouvera l\'accès aussitôt.',
      confirmLabel: bloquer ? 'Bloquer' : 'Débloquer', danger: bloquer, ico: 'lock' });
    if (!ok) return;
    const r = await V3.api('/api/p4-admin/utilisateurs/' + encodeURIComponent(blq.dataset.id), { method: 'PATCH', body: JSON.stringify({ bloque: bloquer }) });
    A.toast(r.ok ? (bloquer ? 'Compte bloqué' : 'Compte débloqué') : (r.erreur || 'Action impossible'));
    if (r.ok) comptesCharger();
    return;
  }
  const md = t.closest('[data-act="mdMasquer"], [data-act="mdRetablir"], [data-act="mdRejeter"]');
  if (md){
    const action = md.dataset.act === 'mdMasquer' ? 'masquer' : (md.dataset.act === 'mdRetablir' ? 'retablir' : 'rejeter');
    const r = await V3.ecrire('/api/p4-admin/moderation/' + encodeURIComponent(md.dataset.id), { action: action });
    A.toast(r.ok ? 'Décision enregistrée ✅' : (r.erreur || 'Action impossible'));
    if (r.ok) moderationCharger();
    return;
  }
  const ovPrix = t.closest('[data-act="ovPrix"]');
  if (ovPrix){
    const valeur = window.prompt('Nouveau prix en francs CFA :', ovPrix.dataset.prix);
    if (valeur === null) return;
    const prix = parseInt(String(valeur).replace(/[^0-9]/g, ''), 10);
    if (!prix || prix < 0){ A.toast('Prix invalide'); return; }
    const r = await V3.api('/api/p4-admin/ouvrages', { method: 'PATCH', body: JSON.stringify({ id: ovPrix.dataset.id, prix: prix }) });
    A.toast(r.ok ? 'Prix mis à jour ✅' : (r.erreur || 'Action impossible'));
    if (r.ok) ouvragesAdmin();
    return;
  }
  const ovPub = t.closest('[data-act="ovPublie"]');
  if (ovPub){
    const r = await V3.api('/api/p4-admin/ouvrages', { method: 'PATCH', body: JSON.stringify({ id: ovPub.dataset.id, publie: ovPub.dataset.valeur === '1' }) });
    A.toast(r.ok ? 'Publication mise à jour ✅' : (r.erreur || 'Action impossible'));
    if (r.ok) ouvragesAdmin();
    return;
  }
  const ovRe = t.closest('[data-act="ovRegenerer"]');
  if (ovRe){
    A.toast('Régénération du PDF…');
    const r = await V3.api('/api/p4-admin/ouvrages', { method: 'PATCH', body: JSON.stringify({ id: ovRe.dataset.id, regenerer: true }) });
    A.toast(r.ok ? 'PDF régénéré ✅' : (r.erreur || 'Régénération impossible'));
    if (r.ok) ouvragesAdmin();
    return;
  }

  if (t.closest('[data-act="seGenerer"]')){
    const ok = await A.dialog({ title: 'Créer un code de secours ?', text: 'Le code précédent, s\'il existe, ne fonctionnera plus.', confirmLabel: 'Créer', ico: 'lock' });
    if (!ok) return;
    const r = await V3.ecrire('/api/p4-securite', { action: 'generer' });
    const zone = document.getElementById('seCode');
    if (r.ok && r.data && r.data.code && zone){
      zone.innerHTML = carte('Votre code de secours', `
        <p class="v4-minuteur">${esc(r.data.code)}</p>
        <p class="body-medium">${esc(r.data.message || '')}</p>
        <button class="btn btn--tonal btn--block ripple" data-act="seCopier" data-code="${esc(r.data.code)}">${svg('share','icon icon--18')} Copier le code</button>`, { ico: 'lock' });
    }
    A.toast(r.ok ? 'Code de secours créé' : (r.erreur || 'Création impossible'));
    if (r.ok) securiteCharger();
    return;
  }
  const seCop = t.closest('[data-act="seCopier"]');
  if (seCop){
    (navigator.clipboard ? navigator.clipboard.writeText(seCop.dataset.code) : Promise.reject())
      .then(() => A.toast('Code copié — collez-le dans votre carnet'))
      .catch(() => A.dialog({ title: 'Code de secours', text: seCop.dataset.code, confirmLabel: 'Fermer', cancel: false, ico: 'lock' }));
    return;
  }
  const fermer = t.closest('[data-act="seFermer"]');
  if (fermer){
    const ok = await A.dialog({ title: 'Fermer cette session ?', text: 'L\'appareil devra se reconnecter.', confirmLabel: 'Fermer', danger: true, ico: 'logout' });
    if (!ok) return;
    const r = await V3.ecrire('/api/p4-securite', { action: 'revoquer', token: fermer.dataset.token });
    A.toast(r.ok ? 'Session fermée ✅' : (r.erreur || 'Action impossible'));
    if (r.ok) securiteCharger();
    return;
  }

  if (t.closest('[data-act="eqAjouter"]')){
    const qui = (document.getElementById('eqQui') || {}).value || '';
    const part = parseInt((document.getElementById('eqPart') || {}).value, 10) || 40;
    if (!qui){ A.toast('Choisissez une personne'); return; }
    const r = await V3.ecrire('/api/p4-cours/' + encodeURIComponent(EQ.actuel) + '/co-formateurs', { userId: qui, part: part });
    A.toast(r.ok ? 'Co-formateur ajouté ✅' : (r.erreur || 'Ajout impossible'));
    if (r.ok) equipeCharger();
    return;
  }
  const eqRet = t.closest('[data-act="eqRetirer"]');
  if (eqRet){
    const r = await V3.api('/api/p4-cours/' + encodeURIComponent(EQ.actuel) + '/co-formateurs?userId=' + encodeURIComponent(eqRet.dataset.id), { method: 'DELETE' });
    A.toast(r.ok ? 'Retiré de l\'équipe' : (r.erreur || 'Retrait impossible'));
    if (r.ok) equipeCharger();
    return;
  }
});

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'eqCours'){ EQ.actuel = e.target.value; equipeCharger(); }
});
})();
