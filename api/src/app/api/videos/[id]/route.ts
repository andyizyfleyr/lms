import { q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';
import { controleAccesPublic } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/videos/{id} — fiche d'une vidéo (+ état de visionnage de l'utilisateur). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    // le contrôle d'accès porte sur le COURS de la vidéo, pas sur l'identifiant vidéo
    const vid = await q1<{ course_id: string | null }>(`select course_id from videos where id = $1`, [id]);
    if (!vid) return notFound('Vidéo');
    const acces = await controleAccesPublic(req, vid.course_id);
    if (acces) return acces;
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
