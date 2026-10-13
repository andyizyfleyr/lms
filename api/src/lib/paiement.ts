import crypto from 'node:crypto';
import { q, q1, exec } from './db';
import { fail } from './http';
import { sessionFrom, type Session } from './auth';
import { PLANS, planParId, prixCours, MONTANT_MIN, MONTANT_MAX, DEVISE } from './catalogue';

/* ============================================================
   PAIEMENT — NOVA Checkout (https://nova-azure-psi.vercel.app)
   Le serveur seul connaît la clé marchande : le navigateur ne voit
   jamais `sk_live_…`. Les montants sont toujours calculés ici, à partir
   du catalogue, jamais reçus du client.
   ============================================================ */

export const NOVA_API = (process.env.NOVA_API_URL || 'https://nova-azure-psi.vercel.app').replace(/\/+$/, '');
const NOVA_CLE = process.env.NOVA_SECRET_KEY || '';
export const NOVA_WEBHOOK_SECRET = process.env.NOVA_WEBHOOK_SECRET || '';
export const SITE_URL = (process.env.SITE_URL || 'https://lms-lovat-five.vercel.app').replace(/\/+$/, '');
export const novaConfigure = () => !!NOVA_CLE;

export type Order = {
  id: string;
  user_id: string;
  type: 'cours' | 'abonnement' | 'panier' | 'pdf' | 'pdfs';
  course_id: string | null;
  plan_id: string | null;
  amount: number;
  currency: string;
  description: string;
  status: 'open' | 'paid' | 'cancelled' | 'expired' | 'failed';
  meta: { courseIds?: string[]; pdfIds?: string[]; code?: string; reduction?: number; pack?: number } | null;
  nova_session_id: string | null;
  nova_reference: string | null;
  method: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Abonnement = {
  actif: boolean;
  planId: string | null;
  planNom: string | null;
  fin: string | null;
  joursRestants: number;
  renouvellements: number;
};

export type Acces = {
  abonnement: Abonnement;
  /** tous les cours sont ouverts (abonnement en cours) */
  toutPaye: boolean;
  /** identifiants des cours débloqués définitivement ou pour la période en cours */
  cours: string[];
};

const JOUR = 86_400_000;
export const joursRestants = (date: string | null): number =>
  date ? Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / JOUR)) : 0;

/* ------------------------------------------------------------ NOVA : client HTTP */

type NovaSession = {
  id: string;
  status: 'open' | 'paid' | 'cancelled' | 'expired';
  amount: number;
  url: string;
  reference?: string | null;
  method?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
};

async function nova(chemin: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: any }> {
  const r = await fetch(NOVA_API + chemin, {
    ...init,
    headers: {
      Authorization: 'Bearer ' + NOVA_CLE,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  let body: any = null;
  try { body = await r.json(); } catch { body = null; }
  return { ok: r.ok, status: r.status, body };
}

/** Message lisible à partir d'une erreur NOVA (`error.message`). */
const msgNova = (body: any, defaut: string) => (body && body.error && body.error.message) || defaut;

/** Crée une session de paiement. `idempotency` évite les doublons (double-clic, reprise réseau). */
export async function novaCreerSession(p: {
  amount: number; description: string; metadata: Record<string, string>; idempotency: string; secondes?: number;
}): Promise<{ session?: NovaSession; erreur?: string; statut?: number }> {
  if (!novaConfigure()) return { erreur: 'Paiement non configuré sur le serveur (clé NOVA absente).' };
  if (!Number.isInteger(p.amount) || p.amount < MONTANT_MIN || p.amount > MONTANT_MAX)
    return { erreur: `Montant invalide (${MONTANT_MIN} à ${MONTANT_MAX} F CFA).` };

  const r = await nova('/api/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Idempotency-Key': p.idempotency.slice(0, 80) },
    body: JSON.stringify({
      amount: p.amount,
      description: p.description.slice(0, 120),
      success_url: SITE_URL + '/?paiement=retour',
      cancel_url: SITE_URL + '/?paiement=annule',
      expires_in: Math.min(Math.max(p.secondes || 1800, 300), 86_400),
      metadata: p.metadata
    })
  });

  if (!r.ok || !r.body || !r.body.id) {
    return { erreur: msgNova(r.body, `Paiement indisponible (NOVA ${r.status}).`), statut: r.status };
  }
  return { session: r.body as NovaSession };
}

export async function novaLireSession(id: string): Promise<NovaSession | null> {
  if (!novaConfigure() || !id) return null;
  const r = await nova('/api/v1/checkout/sessions/' + encodeURIComponent(id));
  return r.ok && r.body && r.body.id ? (r.body as NovaSession) : null;
}

/** Vérifie la signature d'un webhook NOVA (HMAC-SHA256 sur « t.corps brut »). */
export function verifierSignatureNova(rawBody: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  const parts: Record<string, string> = {};
  for (const morceau of header.split(',')) {
    const i = morceau.indexOf('=');
    if (i > 0) parts[morceau.slice(0, i).trim()] = morceau.slice(i + 1).trim();
  }
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const attendu = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const a = Buffer.from(attendu), b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------ ACCÈS */

export async function accesDe(uid: string): Promise<Acces> {
  const ab = await q1<{ plan_id: string; statut: string; current_period_end: string; renewed_count: number }>(
    'select plan_id, statut, current_period_end, renewed_count from subscriptions where user_id = $1', [uid]);
  const actif = !!ab && ab.statut === 'actif' && new Date(ab.current_period_end).getTime() > Date.now();
  const lignes = await q<{ course_id: string; expires_at: string | null }>(
    'select course_id, expires_at from course_access where user_id = $1', [uid]);
  const cours = lignes.filter(l => !l.expires_at || new Date(l.expires_at).getTime() > Date.now()).map(l => l.course_id);
  return {
    abonnement: {
      actif,
      planId: ab ? ab.plan_id : null,
      planNom: ab ? (planParId(ab.plan_id)?.nom || ab.plan_id) : null,
      fin: ab ? ab.current_period_end : null,
      joursRestants: actif ? joursRestants(ab!.current_period_end) : 0,
      renouvellements: ab ? ab.renewed_count : 0
    },
    toutPaye: actif,
    cours
  };
}

export async function aAcces(uid: string, courseId: string): Promise<boolean> {
  const a = await accesDe(uid);
  return a.toutPaye || a.cours.includes(courseId);
}

/** Les enseignants et l'administrateur ne paient pas. */
export const accesGratuit = (role: string) => role === 'admin' || role === 'enseignant';

/** Refus à renvoyer quand le cours n'est pas débloqué (sinon null). */
export async function controleAcces(session: Session, courseId: string | null): Promise<Response | null> {
  if (accesGratuit(session.user.role) || !courseId) return null;
  if (await aAcces(session.user.id, courseId)) return null;
  return fail('Ce cours est payant : débloquez-le pour continuer.', 402, 'acces_paye_requis', { courseId });
}

/** Contrôle d'accès pour une route ouverte : sans compte, le cours payant reste fermé. */
export async function controleAccesPublic(req: Request, courseId: string | null): Promise<Response | null> {
  const s = await sessionFrom(req);
  if (!s) return fail('Ce cours est payant : connectez-vous puis débloquez-le.', 402, 'acces_paye_requis', { courseId });
  return controleAcces(s, courseId);
}

const TABLES_RESSOURCE = {
  lessons: 'lessons',
  videos: 'videos',
  quizzes: 'quizzes',
  assignments: 'assignments',
  resources: 'resources'
} as const;

/** Contrôle d'accès à partir d'une ressource (leçon, vidéo, quiz…). */
export async function controleAccesRessource(
  session: Session, table: keyof typeof TABLES_RESSOURCE, id: string
): Promise<Response | null> {
  if (accesGratuit(session.user.role)) return null;
  const t = TABLES_RESSOURCE[table];
  const ligne = await q1<{ course_id: string }>(`select course_id from ${t} where id = $1`, [id]);
  if (!ligne) return null;               // la route répondra « introuvable »
  return controleAcces(session, ligne.course_id);
}

/* ------------------------------------------------------------ COMMANDES */

/** Crée la commande en base et la session de paiement NOVA correspondante. */
export async function creerCommande(
  uid: string,
  p: { type: 'cours' | 'abonnement' | 'panier' | 'pdf' | 'pdfs'; courseId?: string; planId?: string;
       courseIds?: string[]; pdfId?: string; pdfIds?: string[]; code?: string }
): Promise<{ ok: true; order: Order; url: string } | { ok: false; error: Response }> {
  let amount: number, description: string, courseId: string | null = null, planId: string | null = null;
  const meta: { courseIds?: string[]; pdfIds?: string[]; code?: string; reduction?: number; pack?: number } = {};

  if (p.type === 'pdf' || p.type === 'pdfs') {
    const ids = Array.from(new Set((p.type === 'pdf' ? [p.pdfId] : (p.pdfIds || [])).filter(Boolean))).slice(0, 20) as string[];
    if (!ids.length) return { ok: false, error: fail('Aucun document choisi') };
    const choix = await q<{ id: string; titre: string; prix: number; gratuit: boolean }>(
      `select id, titre, prix, gratuit from pdfs where id = any($1::text[]) and publie`, [ids]);
    if (choix.length !== ids.length) return { ok: false, error: fail('Un des documents choisis est introuvable', 404, 'introuvable') };
    const possede = await q<{ pdf_id: string }>(`select pdf_id from pdf_acces where user_id = $1 and pdf_id = any($2::text[])`, [uid, ids]);
    if (possede.length) return { ok: false, error: fail('Ce document est déjà dans votre bibliothèque.', 409, 'deja_debloque') };
    if (choix.some(c => c.gratuit)) return { ok: false, error: fail('Un des documents est gratuit : prenez-le directement, sans payer') };
    let brut = choix.reduce((n, c) => n + c.prix, 0);
    if (choix.length > 1) meta.pack = Math.round(brut * 0.1);       // 10 % dès deux documents
    let total = brut - (meta.pack || 0);
    if (p.code) {
      const cv = await validerCode(p.code, uid);
      if (cv) { meta.code = cv.code; meta.reduction = Math.round(total * cv.valeur / 100); total -= meta.reduction; }
    }
    if (total < MONTANT_MIN) total = MONTANT_MIN;
    if (total > MONTANT_MAX) return { ok: false, error: fail('Montant hors des limites du paiement', 400) };
    meta.pdfIds = choix.map(c => c.id);
    amount = total;
    description = ('CosmétiLab — ' + (choix.length > 1 ? choix.length + ' ouvrages PDF : ' : 'PDF : ')
                   + choix.map(c => c.titre).join(', ')).slice(0, 120);
  } else if (p.type === 'panier') {
    const ids = Array.from(new Set((p.courseIds || []).filter(Boolean))).slice(0, 20);
    if (ids.length < 2) return { ok: false, error: fail('Choisissez au moins deux cours pour payer en une fois') };
    const choix = await q<{ id: string; titre: string }>(`select id, titre from courses where id = any($1::text[])`, [ids]);
    if (choix.length !== ids.length) return { ok: false, error: fail('Un des cours choisis est introuvable', 404, 'introuvable') };
    let brut = 0;
    for (const c of choix) {
      if (await aAcces(uid, c.id)) return { ok: false, error: fail('Le cours « ' + c.titre + ' » est déjà débloqué sur votre compte.', 409, 'deja_debloque') };
      brut += prixCours(c.id);
    }
    meta.pack = Math.round(brut * 0.1);                       // 10 % de remise dès deux cours
    let total = brut - meta.pack;
    if (p.code) {
      const cv = await validerCode(p.code, uid);
      if (cv) { meta.code = cv.code; meta.reduction = Math.round(total * cv.valeur / 100); total -= meta.reduction; }
    }
    if (total < MONTANT_MIN) total = MONTANT_MIN;
    if (total > MONTANT_MAX) return { ok: false, error: fail('Montant hors des limites du paiement', 400) };
    meta.courseIds = choix.map(c => c.id);
    amount = total;
    description = ('CosmétiLab — ' + choix.length + ' cours : ' + choix.map(c => c.titre).join(', ')).slice(0, 120);
  } else if (p.type === 'cours') {
    if (!p.courseId) return { ok: false, error: fail('Cours manquant') };
    const c = await q1<{ id: string; titre: string }>('select id, titre from courses where id = $1', [p.courseId]);
    if (!c) return { ok: false, error: fail('Cours introuvable', 404, 'introuvable') };
    const deja = await aAcces(uid, c.id);
    if (deja) return { ok: false, error: fail('Ce cours est déjà débloqué sur votre compte.', 409, 'deja_debloque') };
    amount = prixCours(c.id);
    courseId = c.id;
    description = 'CosmétiLab — cours ' + c.titre;
    if (p.code) {
      const cv = await validerCode(p.code, uid);
      if (cv) { meta.code = cv.code; meta.reduction = Math.round(amount * cv.valeur / 100); amount -= meta.reduction; }
    }
  } else {
    const plan = planParId(p.planId || 'mensuel');
    if (!plan) return { ok: false, error: fail('Formule d’abonnement inconnue') };
    amount = plan.montant;
    planId = plan.id;
    description = 'CosmétiLab — ' + plan.nom;
  }

  const order = await q1<Order>(
    `insert into orders (user_id, type, course_id, plan_id, amount, currency, description, meta)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) returning *`,
    [uid, p.type, courseId, planId, amount, DEVISE.toLowerCase(), description, JSON.stringify(meta)]
  );
  if (!order) return { ok: false, error: fail('Commande non enregistrée', 500, 'erreur_serveur') };

  const r = await novaCreerSession({
    amount,
    description,
    metadata: { order_id: order.id, user_id: uid, type: p.type,
                cours: courseId || (meta.courseIds || []).join(','),
                pdf: (meta.pdfIds || []).join(','), formule: planId || '' },
    idempotency: 'order-' + order.id
  });

  if (!r.session) {
    await exec(`update orders set status = 'failed', updated_at = now() where id = $1`, [order.id]);
    /* NOVA distingue un refus de requête (400 : adresse non HTTPS, montant hors
       bornes…) d'une panne (401 clé révoquée, 5xx indisponible) : le message
       remonte tel quel pour que la cause soit lisible sans les journaux. */
    const st = r.statut || 502;
    const cle = st === 401 || st === 403;
    return {
      ok: false,
      error: fail(r.erreur || 'Paiement indisponible', st === 400 ? 400 : 502,
                  st === 400 ? 'paiement_refuse' : cle ? 'nova_cle_invalide' : 'nova_indisponible')
    };
  }

  const maj = await q1<Order>(
    `update orders set nova_session_id = $2, expires_at = $3, updated_at = now()
      where id = $1 returning *`,
    [order.id, r.session.id, r.session.expires_at || null]
  );
  return { ok: true, order: maj || order, url: r.session.url };
}

/** Marque une commande payée et ouvre l'accès correspondant (idempotent). */
export async function marquerPaye(orderId: string, info: { reference?: string | null; method?: string | null; paidAt?: string | null }) {
  const o = await q1<Order>('select * from orders where id = $1', [orderId]);
  if (!o) return null;
  if (o.status !== 'paid') {
    await exec(
      `update orders set status = 'paid', nova_reference = coalesce(nullif($2,''), nova_reference),
              method = coalesce(nullif($3,''), method), paid_at = coalesce($4::timestamptz, now()), updated_at = now()
        where id = $1`,
      [o.id, info.reference || '', info.method || '', info.paidAt || null]
    );
    await accorderAcces({ ...o, status: 'paid' });
  }
  return q1<Order>('select * from orders where id = $1', [orderId]);
}

/* ------------------------------------------------- commandes et remises */

export type CodeValide = { code: string; valeur: number; genre: string; courseId: string | null };

/**
 * Valide un code promo de réduction pour un compte donné (0 % si inutilisable).
 * Le code n'est consommé qu'au paiement confirmé : `utiliserCode`.
 */
export async function validerCode(code: string, uid: string): Promise<CodeValide | null> {
  const c = await q1<{ code: string; genre: string; valeur: number; course_id: string | null;
                       utilisations: number; utilisations_max: number; expire_le: string | null; actif: boolean }>(
    `select * from codes_promo where code = $1`, [String(code || '').trim().toUpperCase()]
  );
  if (!c || !c.actif || c.genre !== 'reduction' || c.valeur <= 0) return null;
  if (c.expire_le && new Date(c.expire_le).getTime() < Date.now()) return null;
  if (c.utilisations_max > 0 && c.utilisations >= c.utilisations_max) return null;
  const deja = await q1<{ n: number }>(`select count(*)::int as n from code_utilisations where code = $1 and user_id = $2`, [c.code, uid]);
  if (deja && deja.n) return null;
  return { code: c.code, valeur: c.valeur, genre: c.genre, courseId: c.course_id };
}

/** Consomme un code (au paiement confirmé) et remercie le parrain s'il s'agit d'un parrainage. */
export async function utiliserCode(code: string, uid: string, orderId: string) {
  const c = await q1<{ code: string; parrain: string | null; libelle: string; valeur: number; genre: string }>(
    `select code, parrain, libelle, valeur, genre from codes_promo where code = $1`, [code]
  );
  if (!c) return;
  await exec(`insert into code_utilisations (code, user_id, order_id) values ($1, $2, $3) on conflict do nothing`,
             [c.code, uid, orderId]);
  await exec(`update codes_promo set utilisations = utilisations + 1 where code = $1`, [c.code]);
  if (c.parrain && c.parrain !== uid) {
    await exec(
      `insert into notifications (user_id, titre, texte, ico, kind) values ($1, $2, $3, 'star', 'parrainage')`,
      [c.parrain, 'Votre parrainage a servi 🎉',
       'Un filleul a utilisé votre code ' + c.code + '. Merci ! Votre réduction de 30 % vous attend dans « Codes promo ».']
    );
    /* récompense du parrain : un code de réduction personnel */
    const rw = 'MERCI-' + c.code;
    await exec(
      `insert into codes_promo (code, libelle, genre, valeur, utilisations_max, parrain, cree_par)
       values ($1, $2, 'reduction', 30, 1, $3, $3) on conflict (code) do nothing`,
      [rw, 'Récompense de parrainage', c.parrain]
    );
  }
}

/** Ouvre les accès prévus par la commande (cours à l'unité, panier ou période d'abonnement). */
export async function accorderAcces(o: Order) {
  if ((o.type === 'pdf' || o.type === 'pdfs') && o.meta && Array.isArray(o.meta.pdfIds)) {
    for (const id of o.meta.pdfIds) {
      await exec(
        `insert into pdf_acces (user_id, pdf_id, order_id, source) values ($1, $2, $3, 'achat')
         on conflict (user_id, pdf_id) do nothing`,
        [o.user_id, id, o.id]
      );
    }
    if (o.meta.code) await utiliserCode(o.meta.code, o.user_id, o.id);
    return;
  }
  if (o.type === 'panier' && o.meta && Array.isArray(o.meta.courseIds)) {
    for (const cid of o.meta.courseIds) {
      await exec(
        `insert into course_access (user_id, course_id, source, order_id)
         values ($1, $2, 'achat', $3)
         on conflict (user_id, course_id) do update
           set source = 'achat', order_id = excluded.order_id, expires_at = null, started_at = now()`,
        [o.user_id, cid, o.id]
      );
    }
    if (o.meta.code) await utiliserCode(o.meta.code, o.user_id, o.id);
    return;
  }
  if (o.type === 'cours' && o.course_id) {
    await exec(
      `insert into course_access (user_id, course_id, source, order_id)
       values ($1, $2, 'achat', $3)
       on conflict (user_id, course_id) do update
         set source = 'achat', order_id = excluded.order_id, expires_at = null, started_at = now()`,
      [o.user_id, o.course_id, o.id]
    );
    if (o.meta && o.meta.code) await utiliserCode(o.meta.code, o.user_id, o.id);
    return;
  }
  if (o.type === 'abonnement') {
    const plan = planParId(o.plan_id || 'mensuel') || PLANS[0];
    const courant = await q1<{ current_period_end: string; statut: string; renewed_count: number }>(
      'select current_period_end, statut, renewed_count from subscriptions where user_id = $1', [o.user_id]);
    const base = courant && courant.statut === 'actif' && new Date(courant.current_period_end).getTime() > Date.now()
      ? new Date(courant.current_period_end).getTime() : Date.now();
    const fin = new Date(base + plan.jours * JOUR).toISOString();
    await exec(
      `insert into subscriptions (user_id, plan_id, statut, started_at, current_period_end, order_id, renewed_count)
       values ($1, $2, 'actif', now(), $3, $4, 1)
       on conflict (user_id) do update
         set plan_id = $2, statut = 'actif', current_period_end = $3, order_id = $4,
             renewed_count = subscriptions.renewed_count + 1, updated_at = now()`,
      [o.user_id, plan.id, fin, o.id]
    );
    const cours = await q<{ id: string }>('select id from courses');
    for (const c of cours) {
      await exec(
        `insert into course_access (user_id, course_id, source, order_id, expires_at)
         values ($1, $2, 'abonnement', $3, $4)
         on conflict (user_id, course_id) do update
           set source = case when course_access.source = 'achat' then 'achat' else 'abonnement' end,
               order_id = excluded.order_id,
               expires_at = case when course_access.source = 'achat' then null else excluded.expires_at end`,
        [o.user_id, c.id, o.id, fin]
      );
    }
  }
}

/** Offre commerciale (support, geste commercial) — réservé à l'administrateur. */
export async function offrirAcces(cible: { uid: string; cours: string[]; jours?: number; orderId?: string | null }) {
  const fin = cible.jours ? new Date(Date.now() + cible.jours * JOUR).toISOString() : null;
  for (const cid of cible.cours) {
    await exec(
      `insert into course_access (user_id, course_id, source, order_id, expires_at)
       values ($1, $2, 'offre', $3, $4)
       on conflict (user_id, course_id) do update
         set source = 'offre', order_id = excluded.order_id, expires_at = excluded.expires_at, started_at = now()`,
      [cible.uid, cid, cible.orderId || null, fin]
    );
  }
  return { cours: cible.cours.length, fin };
}

/** Formate un montant en franc CFA. */
export const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' F';
