import { q, q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { cours } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Ligne = {
  id: string; titre: string; categorie: string; prof: string; image_key: string; accent: string; ico: string;
  statut: string; duree_label: string; total_lecons: number; description: string;
  lecons_faites: number; progress: number | null; favori: boolean | null; inscrit: boolean;
  videos: number; quiz: number; devoirs: number;
};

/**
 * GET /api/courses — catalogue complet.
 * Filtres : ?q= (recherche), ?categorie=, ?statut=, ?favori=1, ?inscrit=1, ?tri=recent|progress|titre
 */
export async function GET(req: Request) {
  return handler(async () => {
    const url = new URL(req.url);
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const recherche = (url.searchParams.get('q') || '').trim();
    const categorie = url.searchParams.get('categorie') || '';
    const statut = url.searchParams.get('statut') || '';
    const favori = url.searchParams.get('favori') === '1';
    const inscrit = url.searchParams.get('inscrit') === '1';
    const tri = url.searchParams.get('tri') || 'titre';

    const rows = await q<Ligne>(
      `select c.id, c.titre, c.categorie, c.prof, c.image_key, c.accent, c.ico, c.statut,
              c.duree_label, c.total_lecons, c.description,
              (select count(*)::int from lessons l
                 join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = $1 and lp.done
                where l.course_id = c.id) as lecons_faites,
              e.progress, e.favori, (e.user_id is not null) as inscrit,
              (select count(*)::int from videos v where v.course_id = c.id) as videos,
              (select count(*)::int from quizzes z where z.course_id = c.id) as quiz,
              (select count(*)::int from assignments a where a.course_id = c.id) as devoirs
         from courses c
         left join enrollments e on e.course_id = c.id and e.user_id = $1
        where ($2 = '' or c.titre ilike '%' || $2 || '%' or c.categorie ilike '%' || $2 || '%' or c.prof ilike '%' || $2 || '%')
          and ($3 = '' or c.categorie = $3)
          and ($4 = '' or c.statut = $4)
          and (not $5 or coalesce(e.favori, false))
          and (not $6 or e.user_id is not null)
        order by case when $7 = 'recent' then c.created_at end desc nulls last,
                 case when $7 = 'progress' then coalesce(e.progress, 0) end desc nulls last,
                 c.titre asc`,
      [uid, recherche, categorie, statut, favori, inscrit, tri]
    );

    const categories = await q<{ categorie: string; n: number }>(
      'select categorie, count(*)::int as n from courses group by categorie order by categorie'
    );
    return ok({ cours: rows, total: rows.length, categories, connecte: !!session });
  });
}

/** POST /api/courses — créer un cours (enseignant / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, cours);
    if ('error' in parsed) return parsed.error;
    const c = parsed.data;

    const id = c.id || (await q1<{ id: string }>(
      `select 'c' || (coalesce(max(nullif(regexp_replace(id, '\\D', '', 'g'), '')::int), 0) + 1) as id from courses`
    ))!.id;

    const row = await q1(
      `insert into courses (id, titre, categorie, prof, image_key, accent, ico, total_lecons, duree_label, description)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *`,
      [id, c.titre, c.categorie, c.professeur, c.imageKey, c.accent, c.ico, c.totalLecons, c.dureeLabel, c.description]
    );
    return ok({ cours: row }, 201);
  });
}
