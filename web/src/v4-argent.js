/* ============================================================
   V4 — PRODUCTION, VENTE, ARGENT
   ------------------------------------------------------------
   Ce que l'atelier fait au quotidien : composer un produit,
   imprimer une étiquette conforme, ouvrir un lot, suivre ses
   clients, ses devis, ses lots et ses kits, et savoir combien
   tout cela rapporte.

   Règle tenue partout : les montants sont calculés côté serveur,
   aucune donnée d'un compte n'est visible depuis un autre compte.
   ============================================================ */
(function(){
'use strict';
const A = window.APPX, V3 = window.LHV3;
const esc = A.esc, svg = A.svg, carte = V3.carte;
const fcfa = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' F CFA';
const quand = V3.quand || (d => (d ? new Date(d).toLocaleDateString('fr-FR') : ''));
const dateFr = d => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const INGREDIENTS_RAPIDES = ['Beurre de karité', 'Huile de coco', 'Huile d\'olive', 'Huile de tournesol',
  'Eau déminéralisée', 'Glycérine', 'Conservateur', 'Huile essentielle de lavande', 'Amidon de maïs', 'Argile blanche'];

/* transforme « Nom = 45 » (ou « Nom 45 ») en ingrédients */
function lireIngredients(texte){
  return String(texte || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = /^(.*?)[\s:=]+([0-9]+(?:[.,][0-9]+)?)\s*%?$/.exec(l);
    if (m) return { nom: m[1].trim(), pourcent: parseFloat(m[2].replace(',', '.')) };
    return { nom: l, pourcent: 0 };
  }).filter(i => i.nom);
}
const ecrireIngredients = liste => (liste || []).map(i => i.nom + ' = ' + (i.pourcent || 0)).join('\n');

function pageProduits(){ return A.barPage('Mes produits', '', `<div id="prCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function produitsCharger(){
  const zone = document.getElementById('prCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-produits');
  const d = (r.ok && r.data) ? r.data : null;
  zone.innerHTML = `
    ${carte('Créer un produit vendable', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Nom</span><input id="prNom" placeholder="Baume karité du jardin"></label>
        <label class="v3-champ"><span>Prix (F)</span><input id="prPrix" type="number" min="0" step="25" value="2500"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Contenance</span><input id="prCont" placeholder="100 ml"></label>
        <label class="v3-champ"><span>Catégorie</span><input id="prCat" placeholder="Baume"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Lot</span><input id="prLot" placeholder="L-2026-01"></label>
        <label class="v3-champ"><span>PAO</span><input id="prPao" value="6M"></label>
      </div>
      <label class="v3-champ" style="display:block"><span>Ingrédients — un par ligne, avec son pourcentage</span>
        <textarea id="prIng" class="v3-textarea" rows="5" placeholder="Beurre de karité = 45&#10;Huile de coco = 20&#10;Huile essentielle de lavande = 1"></textarea></label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">
        ${INGREDIENTS_RAPIDES.map(n => `<button class="text-btn ripple" data-act="prAjout" data-nom="${esc(n)}">+ ${esc(n)}</button>`).join('')}
      </div>
      <label class="v4-coche" style="margin:6px 0"><input type="checkbox" id="prPublie"> Publier la fiche publique (elle sert de preuve d'authenticité)</label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="prCreer">${svg('plus','icon icon--18')} Enregistrer le produit</button>
      <p class="body-small muted" style="margin-top:8px">Le nom INCI, l'ordre décroissant des ingrédients et les allergènes sont calculés automatiquement.</p>`, { ico: 'jar' })}
    ${d && d.produits.length ? `<div class="v3-liste">${d.produits.map(p => `
      <a class="v4-admin-row" href="/produits/${esc(p.id)}" data-lien>
        <span class="v4-admin-row__main"><b>${esc(p.nom)}</b>
          <span class="body-small muted">${esc(p.categorie || 'sans catégorie')} · ${esc(p.contenance || 'contenance à préciser')} · ${fcfa(p.prix)}</span>
          <span class="body-small muted">${p.publie ? 'fiche publique ouverte' : 'fiche publique fermée'}${p.commandes ? ' · ' + p.commandes + ' commande(s)' : ''}</span></span>
        <span class="v4-tag${p.publie ? ' v4-tag--ok' : ''}">${p.publie ? 'en vente' : 'privé'}</span>
      </a>`).join('')}</div>`
      : carte('Aucun produit', '<p class="body-medium">Créez votre premier produit : l\'étiquette conforme et la fiche publique se remplissent à partir des ingrédients.</p>', { ico: 'jar' })}
    <p class="body-small muted" style="margin-top:12px">Besoin de calculer le prix ? <a class="texte-lien" href="/outils/prix" data-lien>Analyse de rentabilité</a></p>`;
}

function pageProduitDetail(){ return A.barPage('Produit', '', `<div id="p1Corps"><p class="body-small muted">Chargement…</p></div>`); }
async function produitDetail(params){
  const zone = document.getElementById('p1Corps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez un produit', '<p class="body-medium">Cet écran s\'ouvre depuis la liste de vos produits.</p>', { ico: 'jar' }); return; }
  const r = await V3.lire('/api/p4-produits/' + encodeURIComponent(id));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Produit introuvable', '<p class="body-medium">Il a peut-être été supprimé.</p>', { ico: 'help' });
    return;
  }
  const p = r.data.produit;
  A.titreOnglet && A.titreOnglet(p.nom);
  const r2 = await V3.ecrire('/api/p4-etiquette', { nom: p.nom, fonction: p.categorie || 'Soin cosmétique artisanal', contenance: p.contenance, lot: p.lot, pao: p.pao, responsable: p.responsable, ingredients: p.ingredients || [] });
  const et = (r2.ok && r2.data) ? r2.data : { listeInci: p.inci, allergenes: [], inconnus: [], mentions: [] };
  const lienPublic = location.origin + '/p/' + (p.slug || '');
  zone.innerHTML = `
    ${carte('', `
      <div class="v4-fiche">
        ${p.photo ? `<img class="v4-couv v4-couv--grand" style="object-fit:cover" src="${esc(p.photo)}" alt="${esc(p.nom)}">` : ''}
        <div>
          <h2 class="titre-page">${esc(p.nom)}</h2>
          <p class="body-small muted">${esc(p.categorie || '')} · ${esc(p.contenance || 'contenance à préciser')}</p>
          <p class="v3-big">${fcfa(p.prix)}</p>
          <p class="body-small muted">Lot ${esc(p.lot || '—')} · PAO ${esc(p.pao || '6M')}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <button class="btn btn--tonal btn--sm ripple" data-act="prEtiquette" data-id="${esc(p.id)}">${svg('tag','icon icon--18')} Étiquette</button>
            <button class="btn btn--outlined btn--sm ripple" data-act="prBascule" data-id="${esc(p.id)}" data-valeur="${p.publie ? '0' : '1'}">${p.publie ? 'Fermer la fiche publique' : 'Publier la fiche'}</button>
          </div>
        </div>
      </div>`, { ico: 'jar' })}
    ${carte('Formule et INCI', `
      <div class="v3-fiche">${(p.ingredients || []).map(i => `<div><span>${esc(i.nom)}</span><b>${i.pourcent || 0} %</b></div>`).join('') || '<div><span>Aucun ingrédient enregistré</span><b>—</b></div>'}</div>
      <p class="body-small" style="margin-top:10px"><b>INCI :</b> ${esc(et.listeInci || '—')}</p>
      ${et.allergenes && et.allergenes.length ? `<p class="body-small" style="margin-top:6px"><b>Allergènes à déclarer :</b> ${et.allergenes.map(esc).join(', ')}</p>` : ''}
      ${et.inconnus && et.inconnus.length ? `<p class="body-small muted" style="margin-top:6px">À vérifier avant impression : ${et.inconnus.map(esc).join(', ')}</p>` : ''}
      <p class="body-small muted" style="margin-top:8px">${esc(p.precautions || '')}</p>`, { ico: 'leaf' })}
    ${carte('Fiche publique', `
      <p class="body-medium">Celle que la cliente ouvre en scannant l'étiquette : nom, INCI, précautions, lot et fabricant.</p>
      <div class="v4-lignes" style="margin-top:10px">
        <button class="btn btn--outlined btn--block ripple" data-act="prCopier" data-lien="${esc(lienPublic)}">${svg('share','icon icon--18')} Copier le lien public</button>
        <a class="btn btn--tonal btn--block ripple" href="/p/${esc(p.slug || '')}" data-lien>${svg('globe','icon icon--18')} Ouvrir la fiche publique</a>
      </div>`, { ico: 'globe' })}
    <div class="v3-grille v3-grille--2">
      <a class="btn btn--outlined btn--block ripple" href="/lots" data-lien>Ouvrir un lot</a>
      <a class="btn btn--outlined btn--block ripple" href="/commandes" data-lien>Vendre / devis</a>
    </div>`;
}

/* ------------------------------------------------------------ étiquette seule */
function pageEtiquette(){
  return A.barPage('Étiquette conforme', '',
    `<div id="etCorps">${carte('Composer une étiquette', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Nom du produit</span><input id="etNom" placeholder="Baume karité-cacao"></label>
        <label class="v3-champ"><span>Fonction</span><input id="etFonction" value="Baume nourrissant corps"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Contenance</span><input id="etCont" placeholder="100 ml"></label>
        <label class="v3-champ"><span>Numéro de lot</span><input id="etLot" placeholder="L-2026-01"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Date de fabrication</span><input id="etDate" type="date"></label>
        <label class="v3-champ"><span>PAO</span><input id="etPao" value="6M"></label>
      </div>
      <label class="v3-champ" style="display:block"><span>Responsable (nom et ville)</span><input id="etResp" placeholder="Atelier … , Cotonou"></label>
      <label class="v3-champ" style="display:block"><span>Ingrédients — un par ligne, avec son pourcentage</span>
        <textarea id="etIng" class="v3-textarea" rows="6" placeholder="Beurre de karité = 45&#10;Huile de coco = 20&#10;Huile essentielle de lavande = 1"></textarea></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="etCalculer">${svg('refresh','icon icon--18')} Calculer l'étiquette</button>
      <p class="body-small muted" style="margin-top:8px">L'ordre décroissant des ingrédients, les noms INCI et les allergènes des huiles essentielles sont vérifiés par le serveur.</p>`, { ico: 'tag' })}<div id="etResultat"></div></div>`);
}

const listeMentions = m => `<div class="v4-lignes">${m.map(x => `<div class="v4-glr"><span class="body-medium">${esc(x)}</span></div>`).join('')}</div>`;

/* ------------------------------------------------------------ clients */
function pageClients(){ return A.barPage('Clients', '', `<div id="clCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function clientsCharger(){
  const zone = document.getElementById('clCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-clients');
  const d = (r.ok && r.data) ? r.data : { clients: [] };
  zone.innerHTML = `
    ${carte('Ajouter un client', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Nom</span><input id="clNom" placeholder="Mme Adjovi"></label>
        <label class="v3-champ"><span>Téléphone</span><input id="clTel" placeholder="+229 …"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Ville</span><input id="clVille" placeholder="Cotonou"></label>
        <label class="v3-champ"><span>Note</span><input id="clNote" placeholder="préfère les savons sans parfum"></label>
      </div>
      <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="clAjouter">${svg('plus','icon icon--18')} Ajouter au carnet</button>`, { ico: 'users' })}
    ${d.clients.length ? `<div class="v3-liste">${d.clients.map(c => `
      <div class="v4-admin-row">
        <span class="v4-admin-row__main"><b>${esc(c.nom)}</b>
          <span class="body-small muted">${esc([c.ville, c.tel].filter(Boolean).join(' · ') || 'coordonnées à compléter')}</span>
          <span class="body-small muted">${c.commandes} commande(s) · ${fcfa(c.achete)} déjà payés${c.reste > 0 ? ' · ' + fcfa(c.reste) + ' à recevoir' : ''}</span></span>
        <button class="text-btn ripple" data-act="clSupprimer" data-id="${esc(c.id)}">Retirer</button>
      </div>`).join('')}</div>`
      : carte('Carnet vide', '<p class="body-medium">Ajoutez vos premiers clients : devis, paiements et relances s\'appuient dessus.</p>', { ico: 'users' })}`;
}

/* ------------------------------------------------------------ commandes */
function pageCommandes(){ return A.barPage('Commandes & devis', '', `<div id="coCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function commandesCharger(){
  const zone = document.getElementById('coCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-commandes');
  const d = (r.ok && r.data) ? r.data : { commandes: [], totaux: {} };
  const clients = (await V3.lire('/api/p4-clients')).data || { clients: [] };
  const t = d.totaux || {};
  zone.innerHTML = `
    ${carte('Nouvelle commande', `
      <label class="v3-champ"><span>Client</span><select id="coClient" class="v3-select">
        <option value="">— sans client enregistré —</option>
        ${(clients.clients || []).map(c => `<option value="${esc(c.id)}">${esc(c.nom)}</option>`).join('')}</select></label>
      <label class="v3-champ" style="display:block"><span>Lignes — « désignation | quantité | prix »</span>
        <textarea id="coLignes" class="v3-textarea" rows="3" placeholder="Savon karité 100 g | 10 | 1000"></textarea></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Statut</span><select id="coStatut" class="v3-select"><option value="devis">Devis</option><option value="envoye">Commande envoyée</option><option value="paye">Payée</option></select></label>
        <label class="v3-champ"><span>Paiement déjà reçu (F)</span><input id="coPaye" type="number" min="0" step="25" value="0"></label>
      </div>
      <label class="v3-champ"><span>Échéance</span><input id="coEch" type="date"></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="coCreer">${svg('plus','icon icon--18')} Enregistrer</button>`, { ico: 'card' })}
    <div class="v3-grille v3-grille--2">
      <div class="v4-kpi"><b>${fcfa(t.encaisse || 0)}</b><span>encaissé</span></div>
      <div class="v4-kpi"><b>${fcfa(t.du || 0)}</b><span>reste à recevoir</span></div>
    </div>
    ${d.commandes.length ? `<div class="v3-liste">${d.commandes.map(c => `
      <a class="v4-admin-row" href="/commandes/${esc(c.id)}" data-lien>
        <span class="v4-admin-row__main"><b>${esc(c.client_nom || 'Client de passage')}</b>
          <span class="body-small muted">${esc((c.lignes || []).map(l => l.designation).slice(0, 2).join(', ') || 'commande vide')}</span>
          <span class="body-small muted">${quand(c.created_at)} · ${fcfa(c.total)}${c.paye ? ' · ' + fcfa(c.paye) + ' payé' : ''}${c.echeance ? ' · échéance ' + dateFr(c.echeance) : ''}</span></span>
        <span class="v4-tag${c.statut === 'paye' ? ' v4-tag--ok' : c.statut === 'annule' ? ' v4-tag--ko' : ''}">${esc(c.statut)}</span>
      </a>`).join('')}</div>`
      : carte('Aucune commande', '<p class="body-medium">Créez un devis : il se transforme en commande payée en un geste.</p>', { ico: 'card' })}`;
}

function pageCommandeDetail(){ return A.barPage('Commande', '', `<div id="c1Corps"><p class="body-small muted">Chargement…</p></div>`); }
async function commandeDetail(params){
  const zone = document.getElementById('c1Corps');
  if (!zone) return;
  const id = (params && params.id) || '';
  if (!id){ zone.innerHTML = carte('Choisissez une commande', '<p class="body-medium">Cet écran s\'ouvre depuis la liste des commandes.</p>', { ico: 'card' }); return; }
  const r = await V3.lire('/api/p4-commandes/' + encodeURIComponent(id));
  if (!r.ok || !r.data){ zone.innerHTML = carte('Commande introuvable', '<p class="body-medium">Elle a peut-être été supprimée.</p>', { ico: 'help' }); return; }
  const c = r.data.commande;
  const reste = Math.max(0, (c.total || 0) - (c.paye || 0));
  zone.innerHTML = `
    ${carte(c.client_nom || 'Client de passage', `
      <div class="v3-fiche">
        <div><span>Statut</span><b>${esc(c.statut)}</b></div>
        <div><span>Total</span><b>${fcfa(c.total)}</b></div>
        <div><span>Déjà payé</span><b>${fcfa(c.paye || 0)}</b></div>
        <div><span>Reste</span><b>${fcfa(reste)}</b></div>
        <div><span>Échéance</span><b>${c.echeance ? dateFr(c.echeance) : 'non fixée'}</b></div>
        ${c.client_tel ? `<div><span>Téléphone</span><b>${esc(c.client_tel)}</b></div>` : ''}
        ${c.client_ville ? `<div><span>Ville</span><b>${esc(c.client_ville)}</b></div>` : ''}
      </div>`, { ico: 'person' })}
    ${carte('Lignes', `<div class="v3-liste">${(c.lignes || []).map(l => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(l.designation)}</h3><p>${l.quantite} × ${fcfa(l.prix)}</p></span><b>${fcfa(l.quantite * l.prix)}</b></div>`).join('')}</div>`, { ico: 'task' })}
    ${carte('Encaisser / changer le statut', `
      <label class="v3-champ"><span>Montant reçu (F)</span><input id="c1Paye" type="number" min="0" step="25" value="${c.total}"></label>
      <label class="v3-champ"><span>Moyen</span><select id="c1Moyen" class="v3-select">
        <option value="espece">Espèces</option><option value="mtn">MTN MoMo</option><option value="moov">Moov Money</option><option value="autre">Autre</option></select></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn--filled btn--sm ripple" data-act="c1Encaisser" data-id="${esc(c.id)}">${svg('check-circle','icon icon--18')} Marquer payée</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="c1Statut" data-id="${esc(c.id)}" data-statut="envoye">Envoyée</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="c1Statut" data-id="${esc(c.id)}" data-statut="annule">Annuler</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="c1Relance" data-id="${esc(c.id)}">Relancer</button>
      </div>
      <p class="body-small muted" style="margin-top:8px">La relance est notée dans votre journal : vous gardez la trace des rappels faits au client.</p>`, { ico: 'card' })}`;
}

/* ------------------------------------------------------------ lots */
function pageLots(){ return A.barPage('Lots de fabrication', '', `<div id="loCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function lotsCharger(){
  const zone = document.getElementById('loCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-lots');
  const d = (r.ok && r.data) ? r.data : { lots: [], produits: [], stats: {} };
  zone.innerHTML = `
    ${carte('Ouvrir un lot', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Numéro de lot</span><input id="loNum" placeholder="L-2026-01"></label>
        <label class="v3-champ"><span>Date de fabrication</span><input id="loDate" type="date"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Produit</span><select id="loProduit" class="v3-select">
          <option value="">— aucun —</option>
          ${(d.produits || []).map(p => `<option value="${esc(p.id)}">${esc(p.nom)}</option>`).join('')}</select></label>
        <label class="v3-champ"><span>Quantité fabriquée</span><input id="loQte" type="number" min="0" value="30"></label>
      </div>
      <label class="v3-champ" style="display:block"><span>Recette utilisée</span><input id="loRecette" placeholder="Baume karité-cacao"></label>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>pH mesuré</span><input id="loPh" type="number" step="0.1" value="6.2"></label>
        <label class="v3-champ"><span>Poids réel (g)</span><input id="loPoids" type="number" step="1" value="104"></label>
      </div>
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Aspect</span><input id="loAspect" placeholder="lisse"></label>
        <label class="v3-champ"><span>Odeur</span><input id="loOdeur" placeholder="karité"></label>
      </div>
      <label class="v4-coche" style="margin:6px 0"><input type="checkbox" id="loConforme" checked> Tout est conforme (sinon le lot passe « à surveiller »)</label>
      <label class="v4-coche" style="margin:6px 0"><input type="checkbox" id="loPublie"> Publier la fiche du lot (page publique, indexable)</label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="loCreer">${svg('plus','icon icon--18')} Enregistrer le lot</button>`, { ico: 'layers' })}
    <div class="v4-console">
      <div class="v4-chiffre"><b>${(d.stats || {}).total || 0}</b><span>lots enregistrés</span></div>
      <div class="v4-chiffre"><b>${(d.stats || {}).conformes || 0}</b><span>conformes</span></div>
      <div class="v4-chiffre"><b>${(d.stats || {}).publies || 0}</b><span>fiches publiques</span></div>
      <div class="v4-chiffre"><b>${(d.stats || {}).aSurveiller || 0}</b><span>à surveiller</span></div>
    </div>
    ${d.lots.length ? `<div class="v3-liste">${d.lots.map(l => `
      <div class="v4-admin-row">
        <span class="v4-admin-row__main"><b>${esc(l.numero)} — ${esc(l.produit_nom || l.recette || 'sans produit')}</b>
          <span class="body-small muted">${dateFr(l.date_fab)} · ${l.quantite} unité(s) · ${esc((l.controles || {}).aspect || '')}</span>
          <span class="body-small muted">pH ${esc(String((l.controles || {}).ph ?? '—'))} · ${l.publie ? 'fiche publique ouverte' : 'fiche privée'}</span></span>
        <span class="v4-tag${l.statut === 'conforme' ? ' v4-tag--ok' : ' v4-tag--ko'}">${esc(l.statut || 'conforme')}</span>
        <button class="text-btn ripple" data-act="loBascule" data-id="${esc(l.id)}" data-valeur="${l.publie ? '0' : '1'}">${l.publie ? 'Fermer' : 'Publier'}</button>
        ${l.publie ? `<a class="text-btn ripple" href="/l/${esc(l.slug)}" data-lien>Voir</a>` : ''}
      </div>`).join('')}</div>`
      : carte('Aucun lot', '<p class="body-medium">Un lot enregistré, c\'est la traçabilité : si une cliente signale un produit, vous savez exactement de quand il date.</p>', { ico: 'layers' })}`;
}

function pageLotPublic(){ return A.barPage('Fiche de lot', '', `<div id="lpCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function lotPublic(params){
  const zone = document.getElementById('lpCorps');
  if (!zone) return;
  const slug = (params && params.slug) || '';
  if (!slug){ zone.innerHTML = carte('Choisissez un lot', '<p class="body-medium">Cet écran s\'ouvre depuis vos lots.</p>', { ico: 'layers' }); return; }
  const r = await V3.lire('/api/p4-lots/' + encodeURIComponent(slug));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Lot introuvable', '<p class="body-medium">Cette fiche n\'existe pas ou n\'est pas publiée.</p>', { ico: 'help' });
    return;
  }
  const l = r.data.lot;
  const c = l.controles || {};
  A.titreOnglet && A.titreOnglet('Lot ' + l.numero);
  zone.innerHTML = `
    ${carte('Lot ' + l.numero, `
      <div class="v3-fiche">
        <div><span>Produit</span><b>${esc(l.produit || l.recette || '—')}</b></div>
        <div><span>Fabricant</span><b>${esc(l.fabricant || '—')}</b></div>
        <div><span>Atelier</span><b>${esc(l.atelier || '—')}</b></div>
        <div><span>Date de fabrication</span><b>${dateFr(l.date_fab)}</b></div>
        <div><span>Quantité</span><b>${l.quantite} unité(s)</b></div>
        <div><span>État</span><b>${esc(l.statut || 'conforme')}</b></div>
      </div>`, { ico: 'layers' })}
    ${carte('Contrôles du lot', `
      <div class="v3-fiche">
        <div><span>pH</span><b>${esc(String(c.ph ?? '—'))}</b></div>
        <div><span>Poids réel</span><b>${esc(String(c.poids ?? '—'))} g</b></div>
        <div><span>Aspect</span><b>${esc(c.aspect || '—')}</b></div>
        <div><span>Odeur</span><b>${esc(c.odeur || '—')}</b></div>
        <div><span>Couleur</span><b>${esc(c.couleur || '—')}</b></div>
      </div>
      ${l.observation ? `<p class="body-small" style="margin-top:8px">${esc(l.observation)}</p>` : ''}`, { ico: 'check-circle' })}
    ${l.inci ? carte('Composition (INCI)', `<p class="body-medium">${esc(l.inci)}</p>${l.precautions ? `<p class="body-small muted" style="margin-top:8px">${esc(l.precautions)}</p>` : ''}`, { ico: 'leaf' }) : ''}
    <p class="body-small muted" style="margin-top:12px">Fiche publiée par l'atelier. CosmétiLab ne fabrique pas les produits : cette page sert à vérifier qu'un produit vient bien de l'atelier indiqué.</p>`;
}

/* ------------------------------------------------------------ fiche produit publique */
function pageProduitPublic(){ return A.barPage('Fiche produit', '', `<div id="ppCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function produitPublic(params){
  const zone = document.getElementById('ppCorps');
  if (!zone) return;
  const slug = (params && params.slug) || '';
  if (!slug){ zone.innerHTML = carte('Fiche produit', '<p class="body-medium">Cette adresse s\'ouvre depuis une étiquette ou un partage.</p>', { ico: 'globe' }); return; }
  const r = await V3.lire('/api/p4-produits/public/' + encodeURIComponent(slug));
  if (!r.ok || !r.data){
    zone.innerHTML = carte('Fiche introuvable', '<p class="body-medium">Ce produit n\'a pas de fiche publique, ou elle a été refermée par son atelier.</p>', { ico: 'help' });
    return;
  }
  const p = r.data.produit;
  A.titreOnglet && A.titreOnglet(p.nom);
  zone.innerHTML = `
    ${carte('', `
      <div class="v4-fiche">
        ${p.photo ? `<img class="v4-couv v4-couv--grand" style="object-fit:cover" src="${esc(p.photo)}" alt="${esc(p.nom)}">` : ''}
        <div>
          <h2 class="titre-page">${esc(p.nom)}</h2>
          <p class="body-small muted">${esc(p.categorie || '')} · ${esc(p.contenance || '')}</p>
          <p class="v3-big">${fcfa(p.prix)}</p>
          <p class="body-small muted">Atelier : ${esc(p.vendeur || '')}${p.ville ? ' — ' + esc(p.ville) : ''}</p>
          <p class="body-small muted">Lot ${esc(p.lot || '—')} · PAO ${esc(p.pao || '6M')}</p>
        </div>
      </div>`, { ico: 'jar' })}
    ${carte('Composition (INCI)', `<p class="body-medium">${esc(p.inci || '—')}</p>`, { ico: 'leaf' })}
    ${carte('Précautions d\'usage', `<p class="body-medium">${esc(p.precautions || 'Usage externe.')}</p>
      <p class="body-small muted" style="margin-top:8px">Produit artisanal fabriqué au Bénin. En cas de réaction, arrêtez l'utilisation et consultez.</p>`, { ico: 'shield' })}
    <p class="body-small muted" style="margin-top:12px">Fiche publiée par l'atelier ${esc(p.vendeur || '')} via CosmétiLab.</p>`;
}

/* ------------------------------------------------------------ kits */
function pageKits(){ return A.barPage('Kits de démarrage', '', `<div id="kiCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function kitsCharger(){
  const zone = document.getElementById('kiCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-kits');
  const d = (r.ok && r.data) ? r.data : { kits: [], prof: false };
  zone.innerHTML = `
    ${d.prof ? carte('Composer un kit', `
      <label class="v3-champ"><span>Nom du kit</span><input id="kiNom" placeholder="Kit savon à froid — démarrage"></label>
      <label class="v3-champ" style="display:block"><span>Description</span><input id="kiDesc" placeholder="Tout pour fabriquer 10 pains"></label>
      <label class="v3-champ" style="display:block"><span>Contenu — « article | quantité | prix unitaire »</span>
        <textarea id="kiContenu" class="v3-textarea" rows="4" placeholder="Soude caustique 500 g | 1 | 2500&#10;Moule silicone | 1 | 4500"></textarea></label>
      <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="kiCreer">${svg('plus','icon icon--18')} Publier le kit</button>
      <p class="body-small muted" style="margin-top:8px">Le coût et le prix conseillé se calculent : 30 % de marge pour la vente directe, 45 % pour un revendeur.</p>`, { ico: 'grid' }) : ''}
    ${d.kits.length ? `<div class="v4-livres">${d.kits.map(k => `
      <div class="v4-livre">
        <div class="v4-livre__tete">
          <span class="v4-couv">${svg('grid','icon icon--24')}<b>${esc(k.nom)}</b><i>kit</i></span>
          <span class="v4-livre__txt">
            <h3>${esc(k.nom)}</h3>
            <p class="body-small muted">${esc(k.description || '')}</p>
            ${(k.lignes || []).length ? `<p class="body-small">${(k.lignes || []).map(l => esc(l.nom)).join(' · ')}</p>` : ''}
            <p class="body-small">Coût : ${fcfa(k.cout)} · prix conseillé ${fcfa(k.prixConseille)} (revendeur ${fcfa(k.prixRevendeur)})</p>
          </span>
        </div>
        <div class="v4-livre__pied">
          <button class="btn btn--filled btn--sm ripple" data-act="kiCommander" data-id="${esc(k.id)}">Commander ce kit</button>
          <span class="v4-tag v4-tag--ok">marge ${fcfa(k.gain)}</span>
        </div>
      </div>`).join('')}</div>`
      : carte('Aucun kit publié', '<p class="body-medium">Un kit, c\'est la liste du matériel et des matières pour démarrer : utile à vendre, utile à offrir.</p>', { ico: 'grid' })}`;
}

/* ------------------------------------------------------------ points & défis */
function pagePoints(){ return A.barPage('Points & défis', '', `<div id="poCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function pointsCharger(){
  const zone = document.getElementById('poCorps');
  if (!zone) return;
  const [rp, rd] = await Promise.all([V3.lire('/api/p4-points'), V3.lire('/api/p4-defis')]);
  const p = (rp.ok && rp.data) ? rp.data : { solde: 0, journal: [], recompenses: [], comment: [] };
  const d = (rd.ok && rd.data) ? rd.data : { defi: null };
  const cible = d.defi ? (d.defi.cible || 1) : 0;
  const pct = cible ? Math.min(100, Math.round((d.avance / cible) * 100)) : 0;
  zone.innerHTML = `
    ${carte('Mes points', `
      <p class="v3-big">${p.solde} points</p>
      <p class="body-small muted">${p.rang}ᵉ sur ${p.participants} membre(s) · ${p.gagnes} gagnés · ${p.depenses} dépensés</p>
      <div class="v3-liste" style="margin-top:10px">
        ${p.comment.map(c => `<div class="list-row"><span class="list-row__ico">${svg(c.ico,'icon icon--20')}</span>
          <span class="list-row__main"><h3>${esc(c.action)}</h3></span><b>${esc(c.points)}</b></div>`).join('')}
      </div>`, { ico: 'trophy' })}
    ${d.defi ? carte('Défi du mois — ' + d.defi.titre, `
      <p class="body-medium">${esc(d.defi.texte || '')}</p>
      <div class="v4-jauge" style="margin-top:10px"><i style="width:${pct}%"></i></div>
      <p class="body-small muted" style="margin-top:6px">${d.avance} / ${cible} ${esc(d.defi.unite || '')} · ${d.defi.participants} participant(s)${d.recompense ? ' · objectif déjà atteint (+20 points)' : ''}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${d.inscription ? '' : `<button class="btn btn--filled btn--sm ripple" data-act="dfRejoindre">Rejoindre le défi</button>`}
        <button class="btn btn--tonal btn--sm ripple" data-act="dfAvancer">+1 pas</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="dfAvancer" data-pas="5">+5 pas</button>
        ${d.inscription ? `<button class="btn btn--outlined btn--sm ripple" data-act="dfQuitter">Quitter</button>` : ''}
      </div>`, { ico: 'fire' }) : carte('Aucun défi en cours', '<p class="body-medium">Le défi du mois est annoncé au début de chaque mois.</p>', { ico: 'fire' })}
    ${d.classement && d.classement.length ? carte('Classement du mois', `<div class="v3-liste">${d.classement.map((c, i) => `
      <div class="list-row"><span class="list-row__ico">${i + 1}</span>
        <span class="list-row__main"><h3>${esc(c.nom)}</h3><p>${esc(c.ville || '')}</p></span><b>${c.avance}</b></div>`).join('')}</div>`, { ico: 'trending' }) : ''}
    ${carte('Échanger mes points', `<div class="v3-liste">${p.recompenses.map(r => `
      <div class="v4-admin-row">
        <span class="v4-admin-row__main"><b>${esc(r.nom)}</b>
          <span class="body-small muted">${esc(r.texte)}</span>
          <span class="body-small muted">${r.points} points${r.possible ? '' : ' · encore ' + r.manque + ' à gagner'}</span></span>
        <button class="btn ${r.possible ? 'btn--filled' : 'btn--outlined'} btn--sm ripple" data-act="poEchanger" data-id="${esc(r.id)}" ${r.possible ? '' : 'disabled'}>Échanger</button>
      </div>`).join('')}</div>`, { ico: 'star' })}
    ${carte('Mes échanges', p.echanges.length ? `<div class="v3-liste">${p.echanges.map(e => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(e.nom)}</h3>
        <p>${quand(e.le)}${e.code ? ' · code ' + esc(e.code) : ''}</p></span><b>−${e.points}</b></div>`).join('')}</div>`
      : '<p class="body-medium">Aucun échange pour l\'instant. Vos premiers points viennent de l\'entraide et de vos réalisations partagées.</p>', { ico: 'medal' })}
    ${carte('Historique', p.journal.length ? `<div class="v3-liste">${p.journal.slice(0, 15).map(j => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(j.motif)}</h3><p>${quand(j.created_at)}</p></span>
        <b>${j.points > 0 ? '+' : ''}${j.points}</b></div>`).join('')}</div>` : '<p class="body-small muted">Pas encore de mouvement.</p>', { ico: 'clock' })}`;
}

/* ------------------------------------------------------------ relevé de revenus */
function pageReleve(){ return A.barPage('Relevé de revenus', '', `<div id="reCorps"><p class="body-small muted">Chargement…</p></div>`); }
async function releveCharger(){
  const zone = document.getElementById('reCorps');
  if (!zone) return;
  const r = await V3.lire('/api/p4-formateur/releve');
  const d = (r.ok && r.data) ? r.data : null;
  if (!d){ zone.innerHTML = carte('Relevé indisponible', '<p class="body-medium">Réessayez dans un instant.</p>', { ico: 'cloud' }); return; }
  zone.innerHTML = `
    <div class="v4-console">
      <div class="v4-chiffre"><b>${fcfa(d.totalPart)}</b><span>ma part cumulée</span></div>
      <div class="v4-chiffre"><b>${fcfa(d.verse)}</b><span>déjà versé</span></div>
      <div class="v4-chiffre"><b>${fcfa(d.aRecevoir)}</b><span>à recevoir</span></div>
      <div class="v4-chiffre"><b>${d.ventes.length}</b><span>cours suivis financièrement</span></div>
    </div>
    ${carte('Mes cours', d.ventes.length ? `<div class="v3-liste">${d.ventes.map(v => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(v.titre)}</h3>
        <p>${v.ventes} vente(s) · ${fcfa(v.brut)} encaissés · ma part ${v.part} %</p></span>
        <b>${fcfa(Math.round(v.brut * v.part / 100))}</b></div>`).join('')}</div>` : `<p class="body-medium">${esc(d.conseil)}</p>`, { ico: 'school' })}
    ${carte('Mois par mois', d.mois.length ? `<div class="v3-liste">${d.mois.map(m => `
      <div class="list-row"><span class="list-row__main"><h3>${esc(m.mois)}</h3><p>${m.ventes} vente(s) · ${fcfa(m.brut)}</p></span>
        <b>${fcfa(m.part)}</b></div>`).join('')}</div>` : '<p class="body-small muted">Aucune vente enregistrée pour l\'instant.</p>', { ico: 'chart' })}
    ${carte('Noter un versement reçu', `
      <div class="v3-grille v3-grille--2">
        <label class="v3-champ"><span>Montant (F)</span><input id="reMontant" type="number" min="1" step="100" value="5000"></label>
        <label class="v3-champ"><span>Date</span><input id="reDate" type="date"></label>
      </div>
      <label class="v3-champ" style="display:block"><span>Note</span><input id="reNote" placeholder="Virement MoMo reçu"></label>
      <button class="btn btn--tonal btn--block ripple" style="margin-top:8px" data-act="reAjouter">${svg('plus','icon icon--18')} Enregistrer le versement</button>
      ${d.versements.length ? `<div class="v3-liste" style="margin-top:10px">${d.versements.map(v => `
        <div class="list-row"><span class="list-row__main"><h3>${fcfa(v.montant)}</h3><p>${esc(v.date)} · ${esc(v.note || '')}</p></span></div>`).join('')}</div>` : ''}`, { ico: 'card' })}
    <p class="body-small muted" style="margin-top:12px">${esc(d.conseil)}</p>`;
}

/* ------------------------------------------------------------ écrans */
A.PAGES.produits = { single: true, render: pageProduits, mount(){ produitsCharger(); } };
A.PAGES.produitDetail = { single: true, render: pageProduitDetail, mount(el, params){ produitDetail(params); } };
A.PAGES.etiquette = { single: true, render: pageEtiquette };
A.PAGES.clients = { single: true, render: pageClients, mount(){ clientsCharger(); } };
A.PAGES.commandes = { single: true, render: pageCommandes, mount(){ commandesCharger(); } };
A.PAGES.commandeDetail = { single: true, render: pageCommandeDetail, mount(el, params){ commandeDetail(params); } };
A.PAGES.lots = { single: true, render: pageLots, mount(){ lotsCharger(); } };
A.PAGES.lotPublic = { single: true, render: pageLotPublic, mount(el, params){ lotPublic(params); } };
A.PAGES.kits = { single: true, render: pageKits, mount(){ kitsCharger(); } };
A.PAGES.points = { single: true, render: pagePoints, mount(){ pointsCharger(); } };
A.PAGES.releve = { single: true, render: pageReleve, mount(){ releveCharger(); } };
A.PAGES.produitPublic = { single: true, render: pageProduitPublic, mount(el, params){ produitPublic(params); } };

/* l'analyse de rentabilité s'ajoute à /outils/prix : un guide, un calcul, un verdict */
(function(){
  const base = A.PAGES['outils'];
  if (!base) return;
  const ancien = base.render;
  A.PAGES['outils'] = Object.assign({}, base, { render(p){
    return ancien(p).replace('</div>', '</div>').replace(/<div class="page__pad">/,
      '<div class="page__pad"><a class="v4-carte-lien" href="/outils/prix" data-lien>' +
      '<span class="list-row__ico">' + svg('chart', 'icon icon--20') + '</span>' +
      '<span><b>Analyse de rentabilité</b><span class="body-small muted">Coût de revient, marge, prix conseillé et prix revendeur — avec le guide.</span></span></a>' +
      PORTES.map(x => '<a class="v4-carte-lien" href="' + x.lien + '" data-lien><span class="list-row__ico">' + svg(x.ico, 'icon icon--20') +
        '</span><span><b>' + x.titre + '</b><span class="body-small muted">' + x.texte + '</span></span></a>').join(''));
  } });
  const pagePrix = () => A.barPage('Analyse de rentabilité', '', `
    <div id="pxCorps">
      ${carte('Le guide du prix juste', `
        <div class="v3-liste">
          ${GUIDE.map(g => `<div class="v4-glr"><b>${esc(g.titre)}</b><span class="body-small">${esc(g.texte)}</span></div>`).join('')}
        </div>`, { ico: 'help' })}
      ${carte('Calculer mon prix', `
        <label class="v3-champ"><span>Nom de la recette</span><input id="pxRecette" value="Savon karité 100 g"></label>
        <div class="v3-grille v3-grille--2">
          <label class="v3-champ"><span>Unités du lot</span><input id="pxLot" type="number" min="1" value="10"></label>
          <label class="v3-champ"><span>Marge voulue (%)</span><input id="pxMarge" type="number" min="0" max="90" value="35"></label>
        </div>
        <label class="v3-champ" style="display:block"><span>Matières — « nom | quantité | prix unitaire »</span>
          <textarea id="pxMat" class="v3-textarea" rows="5"></textarea></label>
        <div class="v3-grille v3-grille--2">
          <label class="v3-champ"><span>Emballage + étiquette par unité</span><input id="pxEmb" type="number" min="0" value="150"></label>
          <label class="v3-champ"><span>Frais du lot (gaz, transport)</span><input id="pxFixes" type="number" min="0" value="1500"></label>
        </div>
        <div class="v3-grille v3-grille--2">
          <label class="v3-champ"><span>Minutes de travail</span><input id="pxMin" type="number" min="0" value="45"></label>
          <label class="v3-champ"><span>Votre heure (F)</span><input id="pxTaux" type="number" min="0" value="1000"></label>
        </div>
        <div class="v3-grille v3-grille--2">
          <label class="v3-champ"><span>Commission revendeur (%)</span><input id="pxComm" type="number" min="0" max="55" value="25"></label>
          <label class="v3-champ"><span>Prix déjà pratiqué (F)</span><input id="pxPrix" type="number" min="0" value="0"></label>
        </div>
        <button class="btn btn--filled btn--block ripple" style="margin-top:10px" data-act="pxCalculer">${svg('chart','icon icon--18')} Calculer</button>`, { ico: 'chart' })}
      <div id="pxResultat"></div>
      <p class="body-small muted" style="margin-top:12px">Retrouvez aussi vos <a class="texte-lien" href="/produits" data-lien>produits</a>,
      vos <a class="texte-lien" href="/clients" data-lien>clients</a> et vos <a class="texte-lien" href="/commandes" data-lien>commandes</a>.</p>
    </div>`);
  A.PAGES.prix = { single: true, render: pagePrix, mount(){
    const t = document.getElementById('pxMat');
    if (t && !t.value) t.value = 'Beurre de karité | 250 | 12\nHuile de coco | 150 | 6\nSoude caustique | 60 | 3\nHuile essentielle de lavande | 5 | 90';
  } };
})();
/* les portes d'entrée : le même bloc sur /outils et sur /profil, aucune page orpheline */
const PORTES = [
  { lien: '/produits', ico: 'jar', titre: 'Mes produits', texte: 'Fiches, prix et étiquettes conformes (INCI).' },
  { lien: '/etiquette', ico: 'tag', titre: 'Étiquette conforme', texte: 'Noms INCI, allergènes et mentions obligatoires.' },
  { lien: '/lots', ico: 'layers', titre: 'Lots de fabrication', texte: 'Traçabilité, contrôles qualité, fiche publique.' },
  { lien: '/clients', ico: 'users', titre: 'Clients', texte: 'Carnet, historique d\'achats et soldes à recevoir.' },
  { lien: '/commandes', ico: 'card', titre: 'Commandes & devis', texte: 'Encaissements, relances, devis imprimables.' },
  { lien: '/kits', ico: 'grid', titre: 'Kits de démarrage', texte: 'Matériel et matières, coût et prix conseillé.' },
  { lien: '/boutique', ico: 'book', titre: 'Boutique des livres PDF', texte: 'Les cours en livre, à lire ou à télécharger.' },
  { lien: '/glossaire', ico: 'help', titre: 'Glossaire', texte: 'Les mots du métier expliqués en français.' }
];
const PORTESVIE = [
  { lien: '/communaute', ico: 'chat', titre: 'Entraide', texte: 'Poser une question, répondre, marquer résolu.' },
  { lien: '/galerie', ico: 'grid', titre: 'Réalisations', texte: 'Montrer ce que l\'atelier a produit.' },
  { lien: '/ateliers', ico: 'users', titre: 'Ateliers & voisinage', texte: 'Rencontres, prêts de matériel, ateliers près de chez vous.' },
  { lien: '/examens', ico: 'medal', titre: 'Examens blancs', texte: 'Se tester avant l\'évaluation, correction immédiate.' },
  { lien: '/emargement', ico: 'check-circle', titre: 'Émargement', texte: 'Pointer sa présence avec le code de la séance.' },
  { lien: '/points', ico: 'trophy', titre: 'Points & défis', texte: 'Entraide, assiduité, défi du mois, échanges.' },
  { lien: '/securite', ico: 'lock', titre: 'Sécurité', texte: 'Code de secours, sessions ouvertes, journal.' },
  { lien: '/console', ico: 'shield', titre: 'Console', texte: 'Comptes, modération, paiements, ouvrages (administration).' }
];
const GUIDE = [
  { titre: '1. Compter la matière première', texte: 'Additionnez le prix réellement payé, puis ramenez-le à la quantité utilisée dans la recette.' },
  { titre: '2. Ajouter ce qu\'on oublie', texte: 'Flacon, étiquette, gaz, transport — et votre temps. Un produit vendu sans compter la main-d\'œuvre fait travailler gratuitement.' },
  { titre: '3. Fixer la marge', texte: 'Visez 30 à 40 % de marge sur le prix de vente : c\'est ce qui permet de racheter la matière au prix du jour.' },
  { titre: '4. Arrondir vers le haut', texte: 'Un prix rond et lisible (500 F, 1 500 F) se retient mieux et supporte une hausse de matière.' },
  { titre: '5. Prévoir le revendeur', texte: 'S\'il prend 25 %, votre prix doit être divisé par 0,75 : la commission ne doit jamais sortir de votre poche.' },
  { titre: '6. Réviser tous les trois mois', texte: 'Refaites le calcul à chaque changement de fournisseur ou de prix.' }
];

/* ------------------------------------------------------------ réabonnement et paliers */
(function(){
  const ab = A.PAGES.abonnement;
  if (ab){
    const rendu = ab.render;
    A.PAGES.abonnement = Object.assign({}, ab, { render(p){
      return rendu(p) + '<div id="abV4" style="margin-top:14px"></div>';
    }, mount(el, params){
      ab.mount && ab.mount(el, params);
      (async () => {
        const zone = el.querySelector('#abV4');
        if (!zone) return;
        const r = await V3.lire('/api/p4-abonnement');
        const d = (r.ok && r.data) ? r.data : null;
        if (!d){ zone.innerHTML = ''; return; }
        const a = d.abonnement;
        zone.innerHTML = `
          ${carte('Renouvellement', `
            <p class="body-medium">${a.actif
              ? 'Abonnement actif : ' + esc(a.planNom || d.plan.nom) + ' — il reste ' + d.restants + ' jour(s).'
              : 'Aucun abonnement en cours : chaque cours s\'achète alors à l\'unité.'}</p>
            ${d.palier ? `<p class="body-small" style="margin-top:6px">Fidélité : ${d.palier} % de remise sur le prochain renouvellement (${a.renouvellements} renouvellement(s)).</p>` : ''}
            <div class="v3-liste" style="margin-top:10px">
              ${d.plans.map(p => `<div class="v4-admin-row">
                <span class="v4-admin-row__main"><b>${esc(p.nom)}</b>
                  <span class="body-small muted">${esc(p.accroche)}${p.avantage ? ' · ' + esc(p.avantage) : ''}</span></span>
                <button class="btn btn--filled btn--sm ripple" data-act="ab4Payer" data-plan="${esc(p.id)}">${fcfa(p.montant)}</button>
              </div>`).join('')}
            </div>
            ${d.relances.length ? `<p class="body-small" style="margin-top:8px">${esc(d.relances[0].texte)}</p>` : ''}
            <p class="body-small muted" style="margin-top:8px">Les six cours achetés à l'unité coûteraient ${fcfa(d.prixCoursTotal)} : l'abonnement mensuel revient à environ ${d.joursEconomises} F par jour.</p>`, { ico: 'refresh' })}
          ${d.historique.length ? carte('Mes abonnements', `<div class="v3-liste">${d.historique.map(h => `
            <div class="list-row"><span class="list-row__main"><h3>${esc(h.description || h.plan_id || 'Abonnement')}</h3>
              <p>${esc(h.status)} · ${fcfa(h.amount)} · ${quand(h.paid_at || h.created_at)}</p></span></div>`).join('')}</div>`, { ico: 'clock' }) : ''}
          ${carte('Ce que l\'abonnement ouvre', `<div class="v3-liste">${d.avantages.map(v => `
            <div class="list-row"><span class="list-row__ico">${svg(v.ico,'icon icon--20')}</span>
              <span class="list-row__main"><h3>${esc(v.titre)}</h3><p>${esc(v.texte)}</p></span></div>`).join('')}</div>`, { ico: 'star' })}`;
      })();
    } });
  }
  const pa = A.PAGES.parrainage;
  if (pa){
    const rendu = pa.render;
    A.PAGES.parrainage = Object.assign({}, pa, { render(p){ return rendu(p) + '<div id="paV4" style="margin-top:14px"></div>'; },
      mount(el, params){
        pa.mount && pa.mount(el, params);
        (async () => {
          const zone = el.querySelector('#paV4');
          if (!zone) return;
          const r = await V3.lire('/api/p4-parrainage');
          const d = (r.ok && r.data) ? r.data : null;
          if (!d){ zone.innerHTML = ''; return; }
          zone.innerHTML = carte('Paliers de parrainage', `
            <div class="v3-liste">
              ${d.paliers.map(p => `
                <div class="v4-admin-row">
                  <span class="v4-admin-row__main"><b>${esc(p.nom)} — ${p.filleuls} filleul(s)</b>
                    <span class="body-small muted">${esc(p.avantage)} · bonus ${fcfa(p.bonus)}</span>
                    ${p.atteint ? '' : `<span class="body-small muted">encore ${p.reste} inscription(s)</span>`}</span>
                  <span class="v4-tag${p.atteint ? ' v4-tag--ok' : ''}">${p.atteint ? 'atteint' : 'en cours'}</span>
                </div>`).join('')}
            </div>
            <p class="body-small muted" style="margin-top:10px">${d.filleulsActifs} filleul(s) actif(s) · ${fcfa(d.gains)} de commandes apportées.</p>
            <p class="body-small muted" style="margin-top:6px">${esc(d.conseil)}</p>
            ${d.filleuls.length ? `<div class="v3-liste" style="margin-top:10px">${d.filleuls.map(f => `
              <div class="list-row"><span class="list-row__main"><h3>${esc(f.nom)}</h3>
                <p>${esc(f.ville || '')} · code ${esc(f.code)} · ${quand(f.created_at)}</p></span></div>`).join('')}</div>` : ''}`, { ico: 'crown' });
        })();
      } });
  }
  const pf = A.PAGES['profil'];
  if (pf && pf.render){
    const ancienProfil = pf.render;
    A.PAGES['profil'] = Object.assign({}, pf, { render(p){
      return ancienProfil(p);
    }, mount(el, params){
      pf.mount && pf.mount(el, params);
      const pad = el.querySelector('.page__pad');
      if (!pad || pad.querySelector('.v4-portes')) return;
      const bloc = document.createElement('div');
      bloc.className = 'v4-portes';
      bloc.innerHTML = PORTESVIE.map(x => '<a class="v4-carte-lien" href="' + x.lien + '" data-lien><span class="list-row__ico">' +
        svg(x.ico, 'icon icon--20') + '</span><span><b>' + x.titre + '</b><span class="body-small muted">' + x.texte + '</span></span></a>').join('');
      pad.appendChild(bloc);
    } });
  }
  const qu = A.PAGES.questions;
  if (qu){
    const rendu = qu.render;
    A.PAGES.questions = Object.assign({}, qu, { render(p){ return rendu(p) + '<div id="qqV4" style="margin-top:14px"></div>'; },
      mount(el, params){
        qu.mount && qu.mount(el, params);
        const zone = el.querySelector('#qqV4');
        if (!zone) return;
        zone.innerHTML = carte('Importer des questions en masse', `
          <label class="v3-champ"><span>Cours</span><select id="qqCours" class="v3-select"><option value="">— choisir —</option></select></label>
          <label class="v3-champ" style="display:block"><span>Une question par ligne : « énoncé | bonne réponse | mauvaise | mauvaise | explication »</span>
            <textarea id="qqTexte" class="v3-textarea" rows="6" placeholder="Quel est le pH d'un savon fini ? | Entre 8 et 10 | Entre 1 et 3 | 14 | Un savon fini se situe entre 8 et 10."></textarea></label>
          <div class="v3-grille v3-grille--2">
            <label class="v3-champ"><span>Thème</span><input id="qqTheme" placeholder="qualité"></label>
            <label class="v3-champ"><span>Difficulté</span><select id="qqDiff" class="v3-select"><option value="facile">facile</option><option value="moyen" selected>moyen</option><option value="difficile">difficile</option></select></label>
          </div>
          <button class="btn btn--filled btn--block ripple" style="margin-top:8px" data-act="qqImporter">${svg('upload','icon icon--18')} Importer les questions</button>
          <div id="qqResultat" style="margin-top:8px"></div>`, { ico: 'upload' });
        (async () => {
          const r = await V3.lire('/api/p4-examens');
          const cours = (r.ok && r.data && r.data.cours) || [];
          const sel = el.querySelector('#qqCours');
          if (sel) sel.insertAdjacentHTML('beforeend', cours.map(c => `<option value="${esc(c.id)}">${esc(c.titre)}</option>`).join(''));
        })();
      } });
  }
})();

window.LHV4ARGENT = { produits: produitsCharger, clients: clientsCharger, commandes: commandesCharger, lots: lotsCharger, kits: kitsCharger, points: pointsCharger, releve: releveCharger, lireIngredients };

/* ------------------------------------------------------------ gestes */
document.addEventListener('click', async e => {
  const t = e.target;

  const rapide = t.closest('[data-act="prAjout"]');
  if (rapide){
    const zone = document.getElementById('prIng');
    if (zone){ zone.value = (zone.value ? zone.value.replace(/\s*$/, '') + '\n' : '') + rapide.dataset.nom + ' = '; zone.focus(); }
    return;
  }
  if (t.closest('[data-act="prCreer"]')){
    const val = id => (document.getElementById(id) || {}).value || '';
    if (val('prNom').trim().length < 2){ A.toast('Donnez un nom au produit'); return; }
    const r = await V3.ecrire('/api/p4-produits', {
      nom: val('prNom'), categorie: val('prCat'), prix: parseInt(val('prPrix'), 10) || 0,
      contenance: val('prCont'), lot: val('prLot'), pao: val('prPao') || '6M',
      ingredients: lireIngredients(val('prIng')),
      publie: !!(document.getElementById('prPublie') || {}).checked
    });
    A.toast(r.ok ? 'Produit enregistré ✅' : (r.erreur || 'Enregistrement impossible'));
    if (r.ok){ produitsCharger(); if (r.data && r.data.produit) A.pushPage('produitDetail', { id: r.data.produit.id }); }
    return;
  }
  const etq = t.closest('[data-act="prEtiquette"]');
  if (etq){
    const r = await V3.lire('/api/p4-produits/' + encodeURIComponent(etq.dataset.id));
    if (!r.ok || !r.data){ A.toast('Produit introuvable'); return; }
    const p = r.data.produit;
    A.pushPage('etiquette', {});
    setTimeout(() => {
      const met = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
      met('etNom', p.nom); met('etFonction', p.categorie || 'Soin cosmétique artisanal'); met('etCont', p.contenance);
      met('etLot', p.lot); met('etPao', p.pao || '6M'); met('etResp', p.responsable);
      met('etIng', ecrireIngredients(p.ingredients));
      etiquetteCalculer();
    }, 120);
    return;
  }
  const basc = t.closest('[data-act="prBascule"]');
  if (basc){
    const r = await V3.api('/api/p4-produits/' + encodeURIComponent(basc.dataset.id), { method: 'PATCH', body: JSON.stringify({ publie: basc.dataset.valeur === '1' }) });
    A.toast(r.ok ? 'Fiche mise à jour' : (r.erreur || 'Action impossible'));
    if (r.ok) produitDetail({ id: basc.dataset.id });
    return;
  }
  const copier = t.closest('[data-act="prCopier"]');
  if (copier){
    const lien = copier.dataset.lien;
    (navigator.clipboard ? navigator.clipboard.writeText(lien) : Promise.reject())
      .then(() => A.toast('Lien public copié'))
      .catch(() => A.dialog({ title: 'Lien public', text: lien, confirmLabel: 'Fermer', cancel: false, ico: 'share' }));
    return;
  }
  if (t.closest('[data-act="etCalculer"]')){ etiquetteCalculer(); return; }

  if (t.closest('[data-act="clAjouter"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    if (val('clNom').length < 2){ A.toast('Écrivez le nom du client'); return; }
    const r = await V3.ecrire('/api/p4-clients', { nom: val('clNom'), tel: val('clTel'), ville: val('clVille'), note: val('clNote') });
    A.toast(r.ok ? 'Client ajouté ✅' : (r.erreur || 'Ajout impossible'));
    if (r.ok) clientsCharger();
    return;
  }
  const clSup = t.closest('[data-act="clSupprimer"]');
  if (clSup){
    const ok = await A.dialog({ title: 'Retirer ce client ?', text: 'Ses commandes restent dans le carnet, mais sans son nom.', confirmLabel: 'Retirer', ico: 'person' });
    if (!ok) return;
    const r = await V3.api('/api/p4-clients/' + encodeURIComponent(clSup.dataset.id), { method: 'DELETE' });
    A.toast(r.ok ? 'Client retiré' : (r.erreur || 'Action impossible'));
    if (r.ok) clientsCharger();
    return;
  }

  if (t.closest('[data-act="coCreer"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    const lignes = val('coLignes').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [nom, qte, prix] = l.split('|').map(x => (x || '').trim());
      return { designation: nom || 'Article', quantite: parseInt(qte, 10) || 1, prix: parseInt(prix, 10) || 0 };
    });
    if (!lignes.length){ A.toast('Ajoutez au moins une ligne'); return; }
    const r = await V3.ecrire('/api/p4-commandes', {
      clientId: val('coClient') || undefined, lignes: lignes, statut: val('coStatut') || 'devis',
      echeance: val('coEch'), paye: parseInt(val('coPaye'), 10) || 0
    });
    A.toast(r.ok ? 'Commande enregistrée ✅' : (r.erreur || 'Enregistrement impossible'));
    if (r.ok){ const id = r.data && r.data.commande && r.data.commande.id; if (id) A.pushPage('commandeDetail', { id }); else commandesCharger(); }
    return;
  }
  const maj = t.closest('[data-act="c1Encaisser"], [data-act="c1Statut"]');
  if (maj){
    const id = maj.dataset.id;
    if (maj.dataset.act === 'c1Encaisser'){
      const montant = parseInt(((document.getElementById('c1Paye') || {}).value || '0').replace(/[^0-9]/g, ''), 10) || 0;
      const moyen = ((document.getElementById('c1Moyen') || {}).value) || 'espece';
      const r = await V3.api('/api/p4-commandes/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ statut: 'paye', paye: montant, moyen: moyen }) });
      A.toast(r.ok ? 'Commande marquée payée ✅' : (r.erreur || 'Action impossible'));
      if (r.ok) commandeDetail({ id });
      return;
    }
    const r = await V3.api('/api/p4-commandes/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ statut: maj.dataset.statut }) });
    A.toast(r.ok ? 'Statut mis à jour' : (r.erreur || 'Action impossible'));
    if (r.ok) commandeDetail({ id });
    return;
  }
  const rel = t.closest('[data-act="c1Relance"]');
  if (rel){
    const r = await V3.api('/api/p4-commandes/' + encodeURIComponent(rel.dataset.id), { method: 'PATCH', body: JSON.stringify({ relance: true }) });
    A.toast(r.ok ? 'Relance notée dans votre journal' : (r.erreur || 'Action impossible'));
    return;
  }

  if (t.closest('[data-act="loCreer"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    if (val('loNum').length < 1){ A.toast('Indiquez un numéro de lot'); return; }
    const r = await V3.ecrire('/api/p4-lots', {
      numero: val('loNum'), dateFab: val('loDate') || new Date().toISOString().slice(0, 10),
      produitId: val('loProduit') || null, quantite: parseInt(val('loQte'), 10) || 0,
      recette: val('loRecette'), publie: !!(document.getElementById('loPublie') || {}).checked,
      controles: { ph: parseFloat(val('loPh')) || null, poids: parseFloat(val('loPoids')) || null,
        aspect: val('loAspect'), odeur: val('loOdeur'), couleur: '', conforme: !!(document.getElementById('loConforme') || {}).checked }
    });
    A.toast(r.ok ? 'Lot enregistré ✅' : (r.erreur || 'Enregistrement impossible'));
    if (r.ok) lotsCharger();
    return;
  }
  const loB = t.closest('[data-act="loBascule"]');
  if (loB){
    const r = await V3.api('/api/p4-lots', { method: 'PATCH', body: JSON.stringify({ id: loB.dataset.id, publie: loB.dataset.valeur === '1' }) });
    A.toast(r.ok ? (loB.dataset.valeur === '1' ? 'Fiche du lot publiée' : 'Fiche refermée') : (r.erreur || 'Action impossible'));
    if (r.ok) lotsCharger();
    return;
  }

  if (t.closest('[data-act="kiCreer"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    const contenu = val('kiContenu').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [nom, qte, prix] = l.split('|').map(x => (x || '').trim());
      return { nom: nom || 'Article', quantite: parseFloat(qte) || 1, prixUnite: parseFloat(prix) || 0 };
    });
    if (val('kiNom').length < 3 || !contenu.length){ A.toast('Nom et contenu du kit sont nécessaires'); return; }
    const r = await V3.ecrire('/api/p4-kits', { nom: val('kiNom'), description: val('kiDesc'), contenu: contenu });
    A.toast(r.ok ? 'Kit publié ✅' : (r.erreur || 'Publication impossible'));
    if (r.ok) kitsCharger();
    return;
  }
  const kiC = t.closest('[data-act="kiCommander"]');
  if (kiC){
    const r = await V3.ecrire('/api/p4-kits/' + encodeURIComponent(kiC.dataset.id) + '/commander', { quantite: 1 });
    A.toast(r.ok ? 'Commande créée : ' + fcfa(r.data.total) : (r.erreur || 'Commande impossible'));
    if (r.ok) A.pushPage('commandes', {});
    return;
  }

  if (t.closest('[data-act="poEchanger"]')){
    const b = t.closest('[data-act="poEchanger"]');
    if (b.disabled) return;
    const ok = await A.dialog({ title: 'Échanger ces points ?', text: 'Vos points sont déduits tout de suite. Pour un bon, un code promo utilisable au paiement est créé.', confirmLabel: 'Échanger', ico: 'star' });
    if (!ok) return;
    const r = await V3.ecrire('/api/p4-points/echanger', { recompenseId: b.dataset.id });
    A.toast(r.ok ? (r.data.code ? 'Bon créé : ' + r.data.code : 'Échange enregistré ✅') : (r.erreur || 'Échange impossible'));
    if (r.ok) pointsCharger();
    return;
  }
  if (t.closest('[data-act="dfRejoindre"], [data-act="dfAvancer"], [data-act="dfQuitter"]')){
    const b = t.closest('[data-act]');
    const action = b.dataset.act === 'dfRejoindre' ? 'rejoindre' : (b.dataset.act === 'dfAvancer' ? 'avancer' : 'quitter');
    const r = await V3.ecrire('/api/p4-defis', { action: action, pas: parseInt(b.dataset.pas, 10) || 1 });
    A.toast(r.ok ? (r.data.bonus ? 'Défi atteint : +' + r.data.bonus + ' points 🎉' : 'Défi mis à jour') : (r.erreur || 'Action impossible'));
    if (r.ok) pointsCharger();
    return;
  }

  if (t.closest('[data-act="reAjouter"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    const r = await V3.ecrire('/api/p4-formateur/releve', { montant: parseInt(val('reMontant'), 10) || 0, date: val('reDate'), note: val('reNote') });
    A.toast(r.ok ? 'Versement noté ✅' : (r.erreur || 'Enregistrement impossible'));
    if (r.ok) releveCharger();
    return;
  }

  if (t.closest('[data-act="pxCalculer"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    const matieres = val('pxMat').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const [nom, qte, prix] = l.split('|').map(x => (x || '').trim());
      return { nom: nom || 'Matière', quantite: parseFloat((qte || '').replace(',', '.')) || 0, prixUnite: parseFloat((prix || '').replace(',', '.')) || 0 };
    });
    const r = await V3.ecrire('/api/p4-prix', {
      recette: val('pxRecette'), lot: parseFloat(val('pxLot')) || 1, matieres: matieres,
      emballage: parseFloat(val('pxEmb')) || 0, fraisFixes: parseFloat(val('pxFixes')) || 0,
      mainOeuvreMinutes: parseFloat(val('pxMin')) || 0, tauxHoraire: parseFloat(val('pxTaux')) || 0,
      margeVoulue: parseFloat(val('pxMarge')) || 35, commissionVente: parseFloat(val('pxComm')) || 0,
      prixAffiche: parseFloat(val('pxPrix')) || 0
    });
    const zone = document.getElementById('pxResultat');
    if (!zone) return;
    if (!r.ok || !r.data){ zone.innerHTML = carte('Calcul impossible', `<p class="body-medium">${esc(r.erreur || 'Réessayez')}</p>`, { ico: 'cloud' }); return; }
    const e = r.data.etiquette;
    zone.innerHTML = `
      ${carte('Résultat', `
        <div class="v3-fiche">
          <div><span>Coût matière par unité</span><b>${fcfa(e.coutMatiere)}</b></div>
          <div><span>Emballage + étiquette</span><b>${fcfa(e.emballage)}</b></div>
          <div><span>Main-d'œuvre</span><b>${fcfa(e.mainOeuvre)}</b></div>
          <div><span>Frais du lot</span><b>${fcfa(e.fixes)}</b></div>
          <div><span>Coût de revient par unité</span><b>${fcfa(e.coutUnite)}</b></div>
          <div><span>Prix conseillé</span><b>${fcfa(e.prixConseille)}</b></div>
          <div><span>Prix revendeur</span><b>${fcfa(e.prixRevendeur)}</b></div>
          <div><span>Marge sur le prix conseillé</span><b>${e.margePourcent} %</b></div>
          <div><span>Gain sur tout le lot</span><b>${fcfa(e.gainLot)}</b></div>
          ${e.margeAffiche !== null ? `<div><span>Marge au prix actuel</span><b>${fcfa(e.margeAffiche)}</b></div>` : ''}
        </div>
        <div class="v4-lignes" style="margin-top:12px">
          ${(r.data.lignes || []).map(l => `<div class="list-row"><span class="list-row__main"><h3>${esc(l.nom)}</h3>
            <p>${l.quantite} × ${fcfa(l.prixUnite)} · ${l.part} % du coût matière</p></span><b>${fcfa(l.cout)}</b></div>`).join('')}
        </div>`, { ico: 'chart' })}
      ${r.data.conseils.length ? carte('Ce que ça dit de votre production', `<div class="v3-liste">
        ${r.data.conseils.map(c => `<div class="v4-glr"><span class="body-medium">${esc(c)}</span></div>`).join('')}</div>`, { ico: 'info' }) : ''}`;
    return;
  }

  if (t.closest('[data-act="qqImporter"]')){
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    const r = await V3.ecrire('/api/p4-formateur/questions/importer', {
      courseId: val('qqCours'), texte: val('qqTexte'), theme: val('qqTheme'), difficulte: val('qqDiff') || 'moyen' });
    const zone = document.getElementById('qqResultat');
    if (zone) zone.innerHTML = r.ok
      ? `<p class="body-medium">${r.data.ajoutees} question(s) ajoutée(s) — ${r.data.banque} au total dans la banque du cours.${
          r.data.rejets.length ? ' ' + r.data.rejets.length + ' ligne(s) écartée(s).' : ''}</p>`
      : `<p class="body-medium">${esc(r.erreur || 'Import impossible')}</p>`;
    A.toast(r.ok ? r.data.ajoutees + ' question(s) importée(s) ✅' : (r.erreur || 'Import impossible'));
    return;
  }

  const ab4 = t.closest('[data-act="ab4Payer"]');
  if (ab4){
    const r = await V3.ecrire('/api/paiements/session', { type: 'abonnement', planId: ab4.dataset.plan });
    if (!r.ok){ A.toast(r.erreur || 'Paiement impossible'); return; }
    A.toast('Redirection vers le paiement sécurisé NOVA…');
    setTimeout(() => { location.assign(r.data.url); }, 250);
    return;
  }
});

async function etiquetteCalculer(){
  const val = id => ((document.getElementById(id) || {}).value || '').trim();
  const r = await V3.ecrire('/api/p4-etiquette', {
    nom: val('etNom') || 'Produit', fonction: val('etFonction'), contenance: val('etCont'), lot: val('etLot'),
    fabrique: val('etDate'), pao: val('etPao') || '6M', responsable: val('etResp'), ingredients: lireIngredients(val('etIng'))
  });
  const zone = document.getElementById('etResultat');
  if (!zone) return;
  if (!r.ok || !r.data){ A.toast(r.erreur || 'Calcul impossible'); return; }
  const d = r.data;
  zone.innerHTML = `
    ${carte('Étiquette prête', `
      ${d.avertissement ? `<p class="body-small" style="margin-bottom:8px">${esc(d.avertissement)}</p>` : ''}
      <div class="v4-print" id="etiquetteApercu" data-print="etiquette">${d.mentions.map(m => `<p class="body-medium" style="margin:0 0 6px">${esc(m)}</p>`).join('')}</div>
      <div class="v3-liste" style="margin-top:12px">
        ${(d.lignes || []).map(l => `<div class="list-row"><span class="list-row__main"><h3>${esc(l.nom)}</h3>
          <p>${esc(l.inci)}${l.allergenes.length ? ' · allergènes : ' + l.allergenes.map(esc).join(', ') : ''}</p></span>
          <b>${l.pourcent || 0} %</b></div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn--filled btn--sm ripple" data-act="etImprimer">${svg('print','icon icon--18')} Imprimer l'étiquette</button>
        <button class="btn btn--outlined btn--sm ripple" data-act="etCopier">${svg('share','icon icon--18')} Copier le texte</button>
      </div>`, { ico: 'tag' })}`;
  window.LHV4ARGENT.mentionsCourantes = d.mentions.join('\n');
  A.toast('Étiquette calculée ✅');
}

document.addEventListener('click', async e => {
  const imp = e.target.closest('[data-act="etImprimer"]');
  if (imp){
    const zone = document.getElementById('etiquetteApercu');
    if (!zone){ A.toast('Calculez d\'abord l\'étiquette'); return; }
    const copie = zone.cloneNode(true);
    copie.className = 'v4-print-copie';
    document.body.appendChild(copie);
    document.body.classList.add('v4-impression');
    setTimeout(() => { window.print(); setTimeout(() => { document.body.classList.remove('v4-impression'); copie.remove(); }, 600); }, 80);
    return;
  }
  if (e.target.closest('[data-act="etCopier"]')){
    const texte = window.LHV4ARGENT.mentionsCourantes || '';
    (navigator.clipboard ? navigator.clipboard.writeText(texte) : Promise.reject())
      .then(() => A.toast('Texte copié'))
      .catch(() => A.dialog({ title: 'Mentions de l\'étiquette', text: texte, confirmLabel: 'Fermer', cancel: false, ico: 'tag' }));
    return;
  }
});
})();
