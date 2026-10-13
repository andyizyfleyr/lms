import { q, q1, exec } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { tagDe } from '@/lib/attestation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/parrainage — mon code de parrainage (créé à la première visite),
 * combien de filleuls l'ont utilisé, et mes récompenses.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const code = 'COPAIN-' + tagDe(uid, 'parrainage');
    const existe = await q1<{ code: string }>(`select code from codes_promo where code = $1`, [code]);
    if (!existe) {
      await exec(
        `insert into codes_promo (code, libelle, genre, valeur, utilisations_max, parrain, cree_par, expire_le)
         values ($1, $2, 'reduction', 20, 0, $3, $3, now() + interval '365 days') on conflict do nothing`,
        [code, 'Parrainage — 20 % pour un ami', uid]
      );
    }
    const usages = await q<{ qui: string; quand: string }>(
      `select coalesce(u.nom, 'Un ami') as qui, cu.created_at as quand
         from code_utilisations cu left join users u on u.id = cu.user_id
        where cu.code = $1 order by cu.created_at desc limit 30`, [code]
    );
    const recompenses = await q<{ code: string; valeur: number; utilisations: number; utilisations_max: number }>(
      `select code, valeur, utilisations, utilisations_max from codes_promo
        where cree_par = $1 and code like 'MERCI-%' order by created_at desc`, [uid]
    );
    return ok({ code, utilisations: usages.length, filleuls: usages, recompenses, reductionFilleul: 20, reductionParrain: 30 });
  });
}

/**
 * POST /api/parrainage — un ami saisit le code reçu. Même logique que /api/codes/utiliser
 * (réduction appliquée au prochain paiement), plus la notification du parrain.
 */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    let b: { code?: string } = {};
    try { b = await req.json(); } catch { /* vide */ }
    const code = String(b.code || '').trim().toUpperCase();
    if (!code) return ok({ ok: false, message: 'Saisissez le code reçu de votre ami' });
    const lisible = code.replace(/^COPAIN-/, '');
    const brut = lisible.replace(/([A-Z0-9]{4})$/, m => m).replace(/-/g, '-');
    const rang = await q1<{ n: number }>(`select count(*)::int as n from codes_promo where code = $1`, [code]);
    if (!rang || !rang.n) return ok({ ok: false, message: 'Ce code de parrainage est inconnu (' + brut + ')' });
    return ok({ ok: true, message: 'Code de parrainage reconnu — débloquez-le dans « Codes promo »', code });
  });
}
