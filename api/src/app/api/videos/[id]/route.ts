import { q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/videos/{id} — fiche d'une vidéo (+ état de visionnage de l'utilisateur). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const session = await sessionFrom(req);
    const row = await q1(
      `select v.*, c.titre as cours_titre, s.progress, coalesce(s.liked,false) as liked,
              coalesce(s.saved,false) as saved, s.position_s,
              round(v.duree_s / 60.0)::int as duree_min
         from videos v
         left join courses c on c.id = v.course_id
         left join video_state s on s.video_id = v.id and s.user_id = $1
        where v.id = $2`,
      [session?.user.id ?? null, id]
    );
    if (!row) return notFound('Vidéo');
    return ok({ video: row });
  });
}
