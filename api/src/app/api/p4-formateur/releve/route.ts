import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { estAdmin } from '@/lib/admin';
import { ok, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-formateur/releve — ce que mes cours ont rapporté, mois par mois,
 *  ma part, et les versements que j'ai déjà reçus. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    /* requête directe, plus simple à tenir : les ventes réelles par cours */
    const ventes = await q(
      `select c.id, c.titre, coalesce(cf.part, 70) part,
              count(o.id)::int ventes, coalesce(sum(o.amount), 0)::int brut,
              max(o.paid_at) dernier
         from courses c
         left join co_formateurs cf on cf.course_id = c.id and cf.user_id = $1::uuid
         left join orders o on o.course_id = c.id and o.status = 'paid' and o.type = 'cours'
        where c.cree_par = $1::uuid or cf.user_id = $1::uuid or $2 = 'admin'
        group by c.id, c.titre, cf.part
        order by brut desc`, [uid, a.session.user.role]);
    const mois = await q<{ mois: string; ventes: number; brut: number; part: number }>(
      `select to_char(date_trunc('month', o.paid_at), 'YYYY-MM') mois,
              count(*)::int ventes, coalesce(sum(o.amount),0)::int brut,
              coalesce(sum(round(o.amount * coalesce(cf.part, 70) / 100.0)),0)::int part
         from orders o
         left join co_formateurs cf on cf.course_id = o.course_id and cf.user_id = $1::uuid
        where o.status = 'paid' and o.type = 'cours'
          and (o.course_id in (select course_id from co_formateurs where user_id = $1::uuid
                               union select id from courses where cree_par = $1::uuid) or $2 = 'admin')
        group by 1 order by 1 desc limit 12`, [uid, a.session.user.role]);
    const versements = await q1<{ valeur: { montant: number; date: string; note: string }[] }>(
      `select valeur from user_data where user_id = $1 and cle = 'lh_versements'`, [uid]);
    const liste = Array.isArray(versements?.valeur) ? versements!.valeur : [];
    const totalPart = mois.reduce((n, m) => n + m.part, 0);
    const verse = liste.reduce((n, v) => n + (v.montant || 0), 0);
    return ok({
      ventes, mois, versements: liste.slice(-24).reverse(),
      totalPart, verse, aRecevoir: Math.max(0, totalPart - verse),
      part: 70, conseil: ventes.length
        ? 'Le relevé se télécharge en une feuille : utile pour tenir vos comptes ou pour justifier un financement.'
        : 'Aucun cours ne vous est rattaché pour l\'instant. Créez un cours ou proposez à un formateur d\'être co-formateur sur le sien.'
    });
  });
}

const corps = z.object({
  montant: z.number().int().min(1).max(10_000_000),
  note: z.string().trim().max(200).default(''),
  date: z.string().trim().max(20).default('')
});

/** POST /api/p4-formateur/releve — noter un versement reçu (acompte, virement, espèces). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const uid = a.session.user.id;
    const ligne = {
      montant: p.data.montant,
      note: p.data.note,
      date: p.data.date || new Date().toISOString().slice(0, 10)
    };
    const actuel = await q1<{ valeur: unknown }>('select valeur from user_data where user_id = $1 and cle = $2', [uid, 'lh_versements']);
    const liste = Array.isArray(actuel?.valeur) ? (actuel!.valeur as unknown[]) : [];
    liste.push(ligne);
    await exec(
      `insert into user_data (user_id, cle, valeur, updated_at) values ($1, $2, $3::jsonb, now())
       on conflict (user_id, cle) do update set valeur = $3::jsonb, updated_at = now()`,
      [uid, 'lh_versements', JSON.stringify(liste)]);
    return ok({ versements: liste.slice(-24).reverse() }, 201);
  });
}
