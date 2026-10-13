import { z } from 'zod';
import { q, exec } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-commun/galerie — les réalisations partagées. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    const uid = 'error' in a ? null : a.session.user.id;
    const url = new URL(req.url);
    const cours = (url.searchParams.get('cours') || '').trim().slice(0, 40);
    const publications = await q(
      `select g.id, g.cours_id, g.titre, g.legende, g.photo, g.likes, g.created_at,
              coalesce(u.nom, 'Membre') auteur_nom, (g.auteur = $1) as mien,
              exists (select 1 from galerie_likes l where l.photo_id = g.id and l.user_id = $1) as aime
         from galerie g left join users u on u.id = g.auteur
        where not g.masque and ($2 = '' or g.cours_id = $2)
        order by g.created_at desc limit 60`, [uid, cours]);
    const total = await q<{ n: number }>('select count(*)::int n from galerie where not masque');
    const parCours = await q(
      `select cours_id, count(*)::int n from galerie where not masque and cours_id is not null group by 1 order by 2 desc`);
    return ok({ publications, total: total[0]?.n ?? 0, parCours, connecte: !!uid });
  });
}

const creation = z.object({
  titre: z.string().trim().min(3, 'Donnez un titre à votre réalisation').max(120),
  legende: z.string().trim().max(1500).default(''),
  photo: z.string().trim().max(900_000, 'Photo trop lourde : réduisez-la').default(''),
  coursId: z.string().trim().max(40).default('')
});

/** POST /api/p4-commun/galerie — publier une réalisation (photo compressée côté application). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, creation);
    if ('error' in p) return p.error;
    const d = p.data;
    if (d.photo && !/^data:image\/(png|jpe?g|webp);base64,/i.test(d.photo)) {
      return fail('Format d\'image non reconnu (JPEG, PNG ou WebP)');
    }
    const row = await q(
      `insert into galerie (auteur, cours_id, titre, legende, photo)
       values ($1, nullif($2, ''), $3, $4, $5) returning id, titre, created_at`,
      [a.session.user.id, d.coursId, d.titre, d.legende, d.photo]);
    if (d.photo) {
      await exec(`insert into points (user_id, total) values ($1, 5)
                  on conflict (user_id) do update set total = points.total + 5, maj = now()`, [a.session.user.id]);
      await exec(`insert into points_journal (user_id, points, motif) values ($1, 5, 'réalisation partagée')`, [a.session.user.id]);
      /* la réalisation compte comme un pas dans le défi du mois, s'il y en a un */
      await exec(`update defis_participations p set avance = least(coalesce(d.cible, 1), p.avance + 1), maj = now()
                   from defis d where d.id = p.defi_id and d.mois = to_char(now(), 'YYYY-MM')
                     and p.user_id = $1`, [a.session.user.id]);
    }
    return ok({ publication: row[0] }, 201);
  });
}
