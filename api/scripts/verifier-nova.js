#!/usr/bin/env node
/* ============================================================
   Vérification des clés NOVA Checkout (clés réelles).

   Ce script ne débite rien : il ouvre une session de paiement pour un
   compte de test, lit son état auprès de NOVA, puis l'annule (expire)
   et supprime le compte de test.

   Utilisation :
     node scripts/verifier-nova.js                 (API locale sur :3000)
     URL_API=https://lms-lovat-five.vercel.app node scripts/verifier-nova.js

   Lecture de `.env.local` pour NOVA_SECRET_KEY / NOVA_WEBHOOK_SECRET.
   Aucune clé n'est affichée ni écrite ailleurs.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const env = {};
try {
  fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8').split('\n').forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
} catch (e) { /* pas de fichier : on se rabat sur l'environnement */ }

const CLE = process.env.NOVA_SECRET_KEY || env.NOVA_SECRET_KEY || '';
const SECRET = process.env.NOVA_WEBHOOK_SECRET || env.NOVA_WEBHOOK_SECRET || '';
const API_NOVA = (process.env.NOVA_API_URL || env.NOVA_API_URL || 'https://nova-azure-psi.vercel.app').replace(/\/+$/, '');
const API = (process.env.URL_API || 'http://127.0.0.1:3000').replace(/\/+$/, '');
let ko = 0;
const ok = (cond, txt, info) => { if (!cond) ko++; console.log((cond ? '✅' : '❌') + ' ' + txt + (info ? '  → ' + info : '')); };
const j = (url, opts) => fetch(url, opts).then(async r => ({ s: r.status, j: await r.json().catch(() => null) }));
const masque = v => v ? v.slice(0, 8) + '…' + v.slice(-4) + ' (' + v.length + ' caractères)' : '(absente)';

(async () => {
  console.log('NOVA Checkout — vérification des clés\n');
  console.log('  clé marchande : ' + masque(CLE));
  console.log('  secret webhook: ' + masque(SECRET));
  console.log('  adresse NOVA  : ' + API_NOVA);
  console.log('  API testée    : ' + API + '\n');

  ok(/^sk_live_/.test(CLE), 'clé marchande de production (sk_live_…)');
  ok(/^whsec_/.test(SECRET), 'secret de webhook (whsec_…)');

  /* 1. NOVA répond et la clé est acceptée */
  const sonde = await j(API_NOVA + '/api/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CLE },
    body: JSON.stringify({ amount: 1000, description: 'CosmétiLab — test de clé (non payé)', success_url: 'https://example.com/ok', cancel_url: 'https://example.com/ko' })
  });
  if (sonde.s !== 201 || !sonde.j || !sonde.j.id) {
    ok(false, 'création d’une session NOVA', sonde.s + ' ' + JSON.stringify(sonde.j && sonde.j.error ? sonde.j.error : sonde.j).slice(0, 140));
    console.log('\n❌ Vérification interrompue — les clés ne sont pas acceptées par NOVA.');
    process.exit(1);
  }
  ok(true, 'session créée par NOVA', sonde.j.id + ' · statut ' + sonde.j.status);
  ok(/^https:\/\/.+\/pay\//.test(sonde.j.url || ''), 'adresse de paiement renvoyée', sonde.j.url);

  /* 2. Relecture de la session (c'est ce que fait /api/paiements/verifier) */
  const lu = await j(API_NOVA + '/api/v1/checkout/sessions/' + sonde.j.id, { headers: { Authorization: 'Bearer ' + CLE } });
  ok(lu.s === 200 && lu.j && ['open', 'expired'].includes(lu.j.status), 'relecture de la session', (lu.j && lu.j.status) || lu.s);

  /* 3. Nos routes de paiement voient bien la clé */
  const cat = await j(API + '/api/paiements/catalogue');
  ok(cat.s === 200 && cat.j.data.paiementActif === true, 'l’API locale annonce paiementActif : true',
     cat.s + ' · paiement actif : ' + (cat.j.data && cat.j.data.paiementActif));

  const mail = 'nova-' + Date.now() + '@cosmetilab.bj';
  const reg = await j(API + '/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: mail, motDePasse: 'test1234', nom: 'Test NOVA', ville: 'Abomey-Calavi' })
  });
  const T = reg.j && reg.j.data && reg.j.data.token;
  ok(!!T, 'compte de test créé', mail);
  if (!T) { await j(API_NOVA + '/api/v1/checkout/sessions/' + sonde.j.id + '/expire', { method: 'POST', headers: { Authorization: 'Bearer ' + CLE } }); process.exit(1); }
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T };

  const sess = await j(API + '/api/paiements/session', { method: 'POST', headers: H, body: JSON.stringify({ type: 'cours', courseId: 'c3' }) });
  ok(sess.s === 201 && sess.j.data && /^https:\/\//.test(sess.j.data.url || ''), 'notre API ouvre une session de cours',
     sess.s + ' · ' + ((sess.j.data && sess.j.data.url) || JSON.stringify(sess.j.error)));
  if (!(sess.s === 201 && sess.j && sess.j.data && sess.j.data.commande)) {
    ok(false, 'abandon : notre API ne délivre pas de session',
       'déclarez NOVA_SECRET_KEY dans .env.local (local) ou dans Vercel, puis redémarrez le serveur');
    await j(API_NOVA + '/api/v1/checkout/sessions/' + sonde.j.id + '/expire', { method: 'POST', headers: { Authorization: 'Bearer ' + CLE } });
    process.exit(1);
  }
  const idSession = sess.j.data.commande.session;

  const verif = await j(API + '/api/paiements/verifier', { method: 'POST', headers: H, body: JSON.stringify({ orderId: sess.j.data.commande.id }) });
  ok(verif.s === 200 && verif.j.data && verif.j.data.statut !== 'paid', 'vérification serveur (aucun débit, statut réel)',
     verif.s + ' · statut ' + (verif.j.data && verif.j.data.statut));
  const bouclier = await j(API + '/api/lessons/c3-m1-l1/complete', { method: 'POST', headers: H, body: '{}' });
  ok(bouclier.s === 402, 'le cours reste fermé tant que ce n’est pas payé', bouclier.s + ' ' + (bouclier.j.error ? bouclier.j.error.code : ''));

  /* 3b. Boutique des livres PDF : même chaîne, autre catalogue */
  const sessPdf = await j(API + '/api/paiements/session', { method: 'POST', headers: H, body: JSON.stringify({ type: 'pdf', pdfId: 'livre-c1' }) });
  const cmdPdf = sessPdf.j && sessPdf.j.data && sessPdf.j.data.commande;
  ok(sessPdf.s === 201 && cmdPdf && cmdPdf.montant === 3500, 'notre API ouvre une session pour un livre PDF',
     sessPdf.s + ' · ' + ((cmdPdf && cmdPdf.montant + ' F') || JSON.stringify(sessPdf.j.error)));
  const pdfFerme = await fetch(API + '/api/p4-pdf/livre-c1/fichier', { headers: { Authorization: 'Bearer ' + T } });
  ok(pdfFerme.status === 403, 'le livre reste fermé tant que ce n\'est pas payé', 'HTTP ' + pdfFerme.status);
  const ficheLivre = await j(API + '/api/p4-pdf/livre-c1');
  const livre = ficheLivre.j && ficheLivre.j.data && ficheLivre.j.data.ouvrage;
  ok(!!livre && (livre.sommaire || []).length > 0 && livre.extrait === undefined,
     'la fiche du livre montre le sommaire, jamais le texte',
     (livre ? (livre.sommaire || []).length + ' titre(s) de chapitre' : 'pas de données'));
  const idSessionPdf = cmdPdf && cmdPdf.session;

  /* 4. On n'annule rien du côté de l'apprenant : on annule les sessions de test */
  for (const id of [sonde.j.id, idSession, idSessionPdf]) {
    if (!id) continue;
    const e = await j(API_NOVA + '/api/v1/checkout/sessions/' + id + '/expire', { method: 'POST', headers: { Authorization: 'Bearer ' + CLE } });
    ok(e.s === 200 || e.s === 400, 'session de test annulée', id + ' → ' + e.s);
  }

  /* 5. Ménage : SEUL le compte de test est supprimé (jamais un compte de démo) */
  const suppr = await j(API + '/api/auth/me', { method: 'DELETE', headers: { Authorization: 'Bearer ' + T } });
  ok(suppr.s === 200 || suppr.s === 204, 'compte de test supprimé (et sa commande)');

  console.log('\n' + (ko === 0
    ? '✅ CLÉS NOVA VALIDES — aucune somme n’a été débitée (sessions de test annulées).\n   Pensez à les déclarer dans Vercel → Settings → Environment Variables.'
    : '❌ ' + ko + ' contrôle(s) en échec — voir ci-dessus.'));
  process.exit(ko === 0 ? 0 : 1);
})().catch(e => { console.error('💥 ' + e.message); process.exit(2); });
