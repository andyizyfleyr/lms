/* Vérification de bout en bout du parcours paiement (serveur local reconstruit).
   Fichier temporaire : supprimé après usage. */
const fs = require('fs');
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const B = process.env.URL_API || 'http://127.0.0.1:3000';
const api = (chemin, opts) => fetch(B + chemin, opts).then(async r => ({ s: r.status, j: await r.json().catch(() => null) }));
const J = b => ({ 'Content-Type': 'application/json', ...(b || {}) });
let ko = 0;
const ok = (cond, txt, extra) => { if (!cond) ko++; console.log((cond ? '✅' : '❌') + ' ' + txt + (extra !== undefined ? '  → ' + extra : '')); };

(async () => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const sql = neon(env.match(/DATABASE_URL\s*=\s*(.+)/)[1].trim().replace(/^["']|["']$/g, ''));
  const secret = env.match(/NOVA_WEBHOOK_SECRET\s*=\s*(.+)/)[1].trim();

  /* 1. catalogue public */
  const cat = await api('/api/paiements/catalogue');
  ok(cat.s === 200 && cat.j.data.cours.length === 6, 'catalogue public', cat.s + ' · ' + cat.j.data.plans.map(p => p.id + '=' + p.montant).join(' '));
  console.log('   prix cours :', cat.j.data.cours.map(c => c.id + '=' + c.prix).join(' '), '| paiement actif :', cat.j.data.paiementActif);

  /* 2. inscription */
  const mail = 'verif-' + Date.now() + '@cosmetilab.bj';
  const reg = await api('/api/auth/register', { method: 'POST', headers: J(), body: JSON.stringify({ email: mail, motDePasse: 'test1234', nom: 'Vérif Paiement', role: 'etudiant' }) });
  ok(reg.s === 201 || reg.s === 200, 'inscription', reg.s);
  const T = reg.j.data.token, H = J({ Authorization: 'Bearer ' + T });

  /* 3. sans accès : tout est fermé */
  const a0 = await api('/api/acces', { headers: H });
  ok(a0.j.data.cours.length === 0 && !a0.j.data.toutPaye, 'accès vide au départ', JSON.stringify(a0.j.data.abonnement));
  const l0 = await api('/api/lessons/c1-m1-l1/complete', { method: 'POST', headers: H, body: '{}' });
  ok(l0.s === 402, 'leçon verrouillée', l0.s + ' ' + (l0.j.error ? l0.j.error.code : ''));
  const r0 = await api('/api/courses/c1/resources', { headers: H });
  ok(r0.s === 402, 'ressources verrouillées', r0.s);
  const q0 = await api('/api/quizzes/c1/attempts', { method: 'POST', headers: H, body: JSON.stringify({ answers: {}, score: 0 }) });
  ok(q0.s === 402, 'quiz verrouillé', q0.s);
  const m0 = await api('/api/courses/c1/messages', { headers: H });
  ok(m0.s === 402, 'discussion verrouillée', m0.s);
  const e0 = await api('/api/courses/c1/enroll', { method: 'POST', headers: H, body: '{}' });
  ok(e0.s === 402, 'inscription au cours verrouillée', e0.s);
  const v0 = await api('/api/videos/wLv3geJ3Rv0', { headers: H });
  ok(v0.s === 402, 'vidéo verrouillée (cours non acheté)', v0.s + ' ' + (v0.j.error ? v0.j.error.code : ''));

  /* 4. session de paiement sans clé NOVA → 502 propre */
  const s0 = await api('/api/paiements/session', { method: 'POST', headers: H, body: JSON.stringify({ type: 'cours', courseId: 'c1' }) });
  ok(s0.s === 502, 'session sans clé NOVA → 502', s0.s + ' ' + (s0.j.error ? s0.j.error.code : ''));

  /* 5. admin offre l'accès c1 */
  const ad = await api('/api/auth/login', { method: 'POST', headers: J(), body: JSON.stringify({ email: 'admin@cosmetilab.bj', motDePasse: 'admin1234' }) });
  const HA = J({ Authorization: 'Bearer ' + ad.j.data.token });
  const off = await api('/api/acces/offrir', { method: 'POST', headers: HA, body: JSON.stringify({ email: mail, cours: ['c1'], jours: 30 }) });
  ok(off.s === 200 || off.s === 201, 'admin offre c1', JSON.stringify(off.j.data));
  const a1 = await api('/api/acces', { headers: H });
  ok(a1.j.data.cours.includes('c1'), 'c1 débloqué', a1.j.data.cours.join(','));
  const l1 = await api('/api/lessons/c1-m1-l1/complete', { method: 'POST', headers: H, body: '{}' });
  ok(l1.s === 200, 'leçon c1 accessible', l1.s);
  const l2 = await api('/api/lessons/c5-m1-l1/complete', { method: 'POST', headers: H, body: '{}' });
  ok(l2.s === 402, 'autre cours toujours fermé', l2.s);
  const v1 = await api('/api/videos/CG2hYCv-uYs', { headers: H });   // vidéo du cours c2
  ok(v1.s === 402, 'vidéo c2 fermée pour un acheteur de c1', v1.s + ' ' + (v1.j.error ? v1.j.error.code : ''));

  /* 6. abonné (amina) : tout ouvert */
  const am = await api('/api/auth/login', { method: 'POST', headers: J(), body: JSON.stringify({ email: 'amina@cosmetilab.bj', motDePasse: 'demo1234' }) });
  const HM = J({ Authorization: 'Bearer ' + am.j.data.token });
  const a2 = await api('/api/acces', { headers: HM });
  ok(a2.j.data.toutPaye === true, 'amina : abonnement → tout ouvert', a2.j.data.abonnement.joursRestants + ' j, ' + a2.j.data.cours.length + ' cours');
  const l3 = await api('/api/lessons/c3-m1-l1/complete', { method: 'POST', headers: HM, body: '{}' });
  ok(l3.s === 200, 'leçon c3 pour l’abonnée', l3.s);
  const v2 = await api('/api/videos/D2HBAj4zY9E', { headers: HM });
  ok(v2.s === 200, 'vidéo c5 pour l’abonnée', v2.s);

  /* 7. webhook signé */
  const uid = (await sql`select id from users where email = ${mail}`)[0].id;
  const cs = 'cs_verif_' + Date.now();
  const id = (await sql`insert into orders (user_id, type, course_id, amount, description, status, nova_session_id)
    values (${uid}, 'cours', 'c2', 4500, 'CosmétiLab — Gel douche', 'open', ${cs}) returning id`)[0].id;
  const t = Math.floor(Date.now() / 1000);
  const brut = JSON.stringify({ id: 'evt_' + Date.now(), object: 'event', type: 'checkout.session.paid', created: t,
    data: { object: { id: cs, status: 'paid', amount: 4500, reference: 'NV555', method: 'balance', metadata: { order_id: id }, paid_at: new Date().toISOString() } } });
  const sig = v => crypto.createHmac('sha256', secret).update(v).digest('hex');
  const faux = await api('/api/webhooks/nova', { method: 'POST', headers: J({ 'NOVA-Signature': 't=' + t + ',v1=' + 'f'.repeat(64) }), body: brut });
  ok(faux.s === 401 || faux.s === 400, 'signature falsifiée refusée', faux.s);
  const bon = await api('/api/webhooks/nova', { method: 'POST', headers: J({ 'NOVA-Signature': 't=' + t + ',v1=' + sig(t + '.' + brut) }), body: brut });
  ok(bon.s === 200, 'webhook signé accepté', JSON.stringify(bon.j.data));
  const rejoue = await api('/api/webhooks/nova', { method: 'POST', headers: J({ 'NOVA-Signature': 't=' + t + ',v1=' + sig(t + '.' + brut) }), body: brut });
  ok(rejoue.s === 200, 'webhook rejoué (idempotent)', JSON.stringify(rejoue.j.data));
  const a3 = await api('/api/acces', { headers: H });
  ok(a3.j.data.cours.includes('c2'), 'c2 ouvert par le webhook', a3.j.data.cours.join(','));
  const pay = await api('/api/paiements', { headers: H });
  ok(pay.j.data.commandes.length >= 2, 'historique des achats', pay.j.data.commandes.map(c => c.type + '/' + (c.planNom || c.courseId) + ' ' + c.statut).join(' | '));

  /* 8. abonnement : achat d'un plan (simulation de paiement) */
  const cs2 = 'cs_abo_' + Date.now();
  const id2 = (await sql`insert into orders (user_id, type, plan_id, amount, description, status, nova_session_id)
    values (${uid}, 'abonnement', 'mensuel', 6000, 'CosmétiLab — abonnement', 'open', ${cs2}) returning id`)[0].id;
  const t2 = Math.floor(Date.now() / 1000);
  const brut2 = JSON.stringify({ id: 'evt2_' + Date.now(), type: 'checkout.session.paid', created: t2,
    data: { object: { id: cs2, status: 'paid', amount: 6000, reference: 'NV556', method: 'card', metadata: { order_id: id2 }, paid_at: new Date().toISOString() } } });
  const abo = await api('/api/webhooks/nova', { method: 'POST', headers: J({ 'NOVA-Signature': 't=' + t2 + ',v1=' + sig(t2 + '.' + brut2) }), body: brut2 });
  ok(abo.s === 200, 'webhook abonnement', JSON.stringify(abo.j.data));
  const a4 = await api('/api/acces', { headers: H });
  ok(a4.j.data.toutPaye === true && a4.j.data.abonnement.actif === true, 'abonnement actif → tous les cours', a4.j.data.cours.length + ' cours, fin ' + a4.j.data.abonnement.fin);

  /* 9. page API : la doc doit citer le paiement */
  const doc = await fetch(B + '/api-doc');
  const html = await doc.text();
  ok(doc.status === 200 && /paiements/.test(html), '/api-doc cite le paiement', doc.status);

  /* 10. site servi */
  const site = await fetch(B + '/');
  ok(site.status === 200, 'site servi sur /', site.status);

  await sql`delete from users where email = ${mail}`;
  console.log('\ncompte de test supprimé');
  console.log(ko === 0 ? '\n✅ PARCOURS PAIEMENT COMPLET — tout est vert' : '\n❌ ' + ko + ' contrôle(s) en échec');
  process.exit(ko === 0 ? 0 : 1);
})().catch(e => { console.error('💥 ' + e.message); process.exit(2); });
