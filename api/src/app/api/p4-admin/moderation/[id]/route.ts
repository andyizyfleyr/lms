import { z } from 'zod';
import { q1, exec } from '@/lib/db';
import { ok, fail, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { estAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  decision: z.enum(['masquer', 'retablir', 'rejeter']),
  note: z.string().trim().max(400).default('')
});

const TABLES: Record<string, { table: string }> = {
  sujet: { table: 'forum_sujets' },
  reponse: { table: 'forum_reponses' },
  photo: { table: 'galerie' },
  produit: { table: 'produits' }
};

/** POST /api/p4-admin/moderation/{id} — masquer, rétablir ou rejeter un signalement. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await estAdmin(req, true);
    if ('error' in a) return a.error;
    const { id } = await params;
    const s = await q1<{ id: string; cible: string; cible_id: string }>(
      'select id, cible, cible_id from signalements where id = $1', [id]);
    if (!s) return notFound('Signalement');
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;

    if (d.decision !== 'rejeter') {
      if (s.cible === 'utilisateur') {
        if (a.session.user.role !== 'admin') return fail('Bloquer un compte est réservé à l\'administration');
        await exec('update users set bloque = $2 where id = $1', [s.cible_id, d.decision === 'masquer']);
        await exec('delete from auth_tokens where user_id = $1', [s.cible_id]);
      } else {
        const t = TABLES[s.cible];
        if (!t) return fail('Type de contenu inconnu');
        await exec(`update ${t.table} set masque = $2 where id = $1`, [s.cible_id, d.decision === 'masquer']);
      }
    }
    await exec(
      `update signalements set etat = $2, traite_par = $3, traite_le = now(), details = concat(details, $4)
        where id = $1`,
      [id, d.decision === 'rejeter' ? 'rejete' : 'traite', a.session.user.id, d.note ? ' | ' + d.note : '']);
    const ouverts = await q1<{ n: number }>(`select count(*)::int n from signalements where etat = 'nouveau'`);
    return ok({ traite: true, decision: d.decision, ouverts: ouverts?.n ?? 0 });
  });
}
