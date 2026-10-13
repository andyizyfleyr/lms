import { z } from 'zod';
import { q } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { THEMES_FORUM as THEMES } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-commun/forum — les sujets, filtrables par thème ou par recherche. */
export async function GET(req: Request) {
  return handler(async () => {
    const url = new URL(req.url);
    const theme = (url.searchParams.get('theme') || '').trim().toLowerCase();
    const recherche = (url.searchParams.get('q') || '').trim().slice(0, 60);
    const a = await auth(req);
    const uid = 'error' in a ? null : a.session.user.id;

    const sujets = await q(
      `select s.id, s.course_id, s.theme, s.titre, s.question, s.epingle, s.resolu, s.vues, s.created_at,
              coalesce(u.nom, 'Membre') auteur_nom, (s.auteur = $1) as mien,
              (select count(*)::int from forum_reponses r where r.sujet_id = s.id and not r.masque) reponses,
              (select coalesce(sum(r.utils),0)::int from forum_reponses r where r.sujet_id = s.id and not r.masque) utils
         from forum_sujets s left join users u on u.id = s.auteur
        where not s.masque
          and ($2 = '' or s.theme = $2)
          and ($3 = '' or s.titre ilike '%' || $3 || '%' or s.question ilike '%' || $3 || '%')
        order by s.epingle desc, s.created_at desc limit 120`,
      [uid, theme && theme !== 'tous' ? theme : '', recherche]
    );
    const [total] = await q<{ n: number }>(`select count(*)::int n from forum_sujets where not masque`);
    const parTheme = await q(
      `select theme, count(*)::int n from forum_sujets where not masque group by 1 order by 2 desc`);
    return ok({ sujets, total: total.n, themes: THEMES, parTheme, connecte: !!uid });
  });
}

const creation = z.object({
  titre: z.string().trim().min(6, 'Un titre clair aide à obtenir une réponse').max(140),
  question: z.string().trim().min(10, 'Expliquez votre question en quelques lignes').max(3000),
  theme: z.enum(THEMES).default('general'),
  courseId: z.string().trim().max(40).default('')
});

/** POST /api/p4-commun/forum — ouvrir un sujet d'entraide. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, creation);
    if ('error' in p) return p.error;
    const d = p.data;
    const row = await q(
      `insert into forum_sujets (course_id, theme, titre, question, auteur)
       values (nullif($1, ''), $2, $3, $4, $5) returning id, titre, theme, created_at`,
      [d.courseId, d.theme, d.titre, d.question, a.session.user.id]
    );
    if (!row.length) return fail('Sujet non enregistré', 500, 'erreur_serveur');
    return ok({ sujet: row[0] }, 201);
  });
}
