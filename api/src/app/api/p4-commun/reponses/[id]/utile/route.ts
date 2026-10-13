import { z } from 'zod';
import { q1, exec } from '@/lib/db';
import { auth, ok, fail, notFound, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({ utile: z.boolean().default(true) });

/** POST /api/p4-commun/reponses/{id}/utile — « ça m'a aidé » (une fois par compte). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const r = await q1<{ id: string; utils: number }>('select id, utils from forum_reponses where id = $1', [id]);
    if (!r) return notFound('Réponse');
    const deja = await q1('select 1 from forum_votes where reponse_id = $1 and user_id = $2', [id, a.session.user.id]);
    if (p.data.utile && !deja) {
      await exec('insert into forum_votes (reponse_id, user_id) values ($1, $2) on conflict do nothing', [id, a.session.user.id]);
      await exec('update forum_reponses set utils = utils + 1 where id = $1', [id]);
      /* l'auteur de la réponse gagne des points d'entraide */
      const auteur = await q1<{ auteur: string | null }>('select auteur from forum_reponses where id = $1', [id]);
      if (auteur?.auteur && auteur.auteur !== a.session.user.id) {
        await exec(`insert into points (user_id, total) values ($1, 2)
                    on conflict (user_id) do update set total = points.total + 2, maj = now()`, [auteur.auteur]);
        await exec(`insert into points_journal (user_id, points, motif, ref) values ($1, 2, 'réponse utile', $2)`,
          [auteur.auteur, id]);
      }
    } else if (!p.data.utile && deja) {
      await exec('delete from forum_votes where reponse_id = $1 and user_id = $2', [id, a.session.user.id]);
      await exec('update forum_reponses set utils = greatest(utils - 1, 0) where id = $1', [id]);
      const auteur = await q1<{ auteur: string | null }>('select auteur from forum_reponses where id = $1', [id]);
      if (auteur?.auteur && auteur.auteur !== a.session.user.id) {
        await exec(`update points set total = greatest(total - 2, 0), maj = now() where user_id = $1`, [auteur.auteur]);
      }
    }
    const maj = await q1<{ utils: number }>('select utils from forum_reponses where id = $1', [id]);
    return ok({ utils: maj?.utils ?? 0, utile: !deja });
  });
}
