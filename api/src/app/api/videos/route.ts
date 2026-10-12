import { q } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/videos — bibliothèque vidéo.
 * Filtres : ?q=, ?courseId=, ?filtre=tout|encours|termine|fav, ?tri=vues|recent|duree
 */
export async function GET(req: Request) {
  return handler(async () => {
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const url = new URL(req.url);
    const rech = (url.searchParams.get('q') || '').trim();
    const courseId = url.searchParams.get('courseId') || '';
    const filtre = url.searchParams.get('filtre') || 'tout';
    const tri = url.searchParams.get('tri') || 'vues';

    const rows = await q(
      `select v.*, c.titre as cours_titre, s.progress, coalesce(s.liked, false) as liked, coalesce(s.saved, false) as saved, s.position_s
         from videos v
         left join courses c on c.id = v.course_id
         left join video_state s on s.video_id = v.id and s.user_id = $1
        where ($2 = '' or v.titre ilike '%' || $2 || '%' or v.chaine ilike '%' || $2 || '%')
          and ($3 = '' or v.course_id = $3)
          and ($4 = 'tout'
               or ($4 = 'encours' and coalesce(s.progress, 0) > 0 and coalesce(s.progress, 0) < 100)
               or ($4 = 'termine' and coalesce(s.progress, 0) >= 100)
               or ($4 = 'fav' and (coalesce(s.liked, false) or coalesce(s.saved, false))))
        order by case when $5 = 'recent' then v.created_at end desc nulls last,
                 case when $5 = 'duree' then v.duree_s end asc,
                 v.vues desc`,
      [uid, rech, courseId, filtre, tri]
    );
    return ok({ videos: rows, total: rows.length });
  });
}

/** POST /api/videos — ajouter une vidéo de tutoriel (enseignant / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const schema = z.object({
      id: z.string().trim().min(5).max(20, 'identifiant YouTube invalide'),
      courseId: z.string().trim().max(30).nullable().optional(),
      titre: z.string().trim().min(3).max(200),
      chaine: z.string().trim().max(120).default(''),
      dureeS: z.number().int().min(0).max(86400).default(0),
      imageKey: z.string().trim().max(40).default('code')
    });
    const parsed = await parseBody(req, schema);
    if ('error' in parsed) return parsed.error;
    const v = parsed.data;
    const { q1 } = await import('@/lib/db');
    const row = await q1(
      `insert into videos (id, course_id, titre, chaine, duree_s, image_key)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set titre = excluded.titre, chaine = excluded.chaine, duree_s = excluded.duree_s
       returning *`,
      [v.id, v.courseId ?? null, v.titre, v.chaine, v.dureeS, v.imageKey]
    );
    return ok({ video: row }, 201);
  });
}
