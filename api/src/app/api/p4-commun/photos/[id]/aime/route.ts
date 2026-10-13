import { z } from 'zod';
import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({ aime: z.boolean().default(true) });

/** POST /api/p4-commun/photos/{id}/aime — « j'aime » (une fois par compte). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const g = await q1<{ id: string; likes: number }>('select id, likes from galerie where id = $1', [id]);
    if (!g) return notFound('Publication');
    const deja = await q1('select 1 from galerie_likes where photo_id = $1 and user_id = $2', [id, a.session.user.id]);
    if (p.data.aime && !deja) {
      await exec('insert into galerie_likes (photo_id, user_id) values ($1, $2) on conflict do nothing', [id, a.session.user.id]);
      await exec('update galerie set likes = likes + 1 where id = $1', [id]);
    } else if (!p.data.aime && deja) {
      await exec('delete from galerie_likes where photo_id = $1 and user_id = $2', [id, a.session.user.id]);
      await exec('update galerie set likes = greatest(likes - 1, 0) where id = $1', [id]);
    }
    const maj = await q1<{ likes: number }>('select likes from galerie where id = $1', [id]);
    return ok({ likes: maj?.likes ?? 0, aime: !deja });
  });
}
