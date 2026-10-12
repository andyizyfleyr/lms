import { q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/sync — état de synchronisation de l'utilisateur connecté.
 *
 * Réponse volontairement minuscule : elle est appelée en continu par
 * l'application (toutes les 4 s au premier plan). La chaîne `revision`
 * change dès que l'une des données de l'utilisateur évolue — y compris
 * lorsqu'un AUTRE appareil (ou un formateur) les modifie. L'application
 * compare cet empreinte à la précédente et recharge alors la progression
 * complète : c'est ce qui rend la synchronisation « en temps réel » sans
 * connexion permanente ni websocket.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const id = a.session.user.id;

    const row = await q1<{
      revision: string; lecons: number; videos: number; quiz: number;
      depots: number; cours: number; jour: string;
    }>(
      `select
         (select coalesce(count(*), 0) from lesson_progress where user_id = $1)::text || ':' ||
         (select coalesce(count(*), 0) from video_state     where user_id = $1)::text || ':' ||
         (select coalesce(count(*), 0) from quiz_attempts   where user_id = $1)::text || ':' ||
         (select coalesce(count(*), 0) from submissions     where user_id = $1)::text || ':' ||
         (select coalesce(max(updated_at), '1970-01-01')::text from lesson_progress where user_id = $1) || ':' ||
         (select coalesce(max(updated_at), '1970-01-01')::text from video_state     where user_id = $1) || ':' ||
         (select coalesce(max(created_at), '1970-01-01')::text from quiz_attempts   where user_id = $1) as revision,
         (select count(*) from lesson_progress where user_id = $1)::int as lecons,
         (select count(*) from video_state     where user_id = $1)::int as videos,
         (select count(*) from quiz_attempts   where user_id = $1)::int as quiz,
         (select count(*) from submissions     where user_id = $1)::int as depots,
         (select count(*) from enrollments     where user_id = $1)::int as cours,
         to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS') as jour`,
      [id]
    );

    return ok({
      revision: (row && row.revision) || 'vide',
      lecons: row ? row.lecons : 0,
      videos: row ? row.videos : 0,
      quiz: row ? row.quiz : 0,
      depots: row ? row.depots : 0,
      cours: row ? row.cours : 0,
      serveur: (row && row.jour) || '',
      utilisateur: a.session.user.email
    });
  });
}
