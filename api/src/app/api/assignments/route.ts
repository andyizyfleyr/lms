import { q, q1 } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const creation = z.object({
  id: z.string().trim().max(40).optional(),
  courseId: z.string().trim().min(1),
  titre: z.string().trim().min(3).max(180),
  type: z.string().trim().max(40).default('Devoir'),
  points: z.number().int().min(1).max(100).default(20),
  echeanceLabel: z.string().trim().max(60).default(''),
  niveau: z.enum(['urgent', 'normal', 'calme']).default('normal'),
  consignes: z.array(z.string().max(500)).max(20).default([]),
  quizId: z.string().trim().max(30).nullable().optional()
});

/**
 * GET /api/assignments — devoirs.
 * Filtres : ?courseId=, ?niveau=, ?statut=a_rendre|depose|note, ?tri=echeance
 */
export async function GET(req: Request) {
  return handler(async () => {
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') || '';
    const niveau = url.searchParams.get('niveau') || '';
    const statut = url.searchParams.get('statut') || '';
    const rows = await q(
      `select a.*, c.titre as cours_titre, c.accent, c.ico,
              s.id as depot_id, s.statut as mon_statut, s.note as ma_note, s.created_at as depose_le,
              (s.fichier_nom <> '' or s.lien <> '') as a_piece
         from assignments a
         join courses c on c.id = a.course_id
         left join lateral (
            select * from submissions x where x.assignment_id = a.id and x.user_id = $1
            order by x.created_at desc limit 1
         ) s on true
        where ($2 = '' or a.course_id = $2)
          and ($3 = '' or a.niveau = $3)
          and ($4 = '' or ($4 = 'a_rendre' and s.id is null)
                       or ($4 = 'depose' and s.statut = 'depose')
                       or ($4 = 'note' and s.note is not null))
        order by case a.niveau when 'urgent' then 0 when 'normal' then 1 else 2 end, a.titre`,
      [uid, courseId, niveau, statut]
    );
    const compteurs = {
      total: rows.length,
      aRendre: rows.filter(r => !r.depot_id).length,
      deposes: rows.filter(r => r.mon_statut === 'depose').length,
      notes: rows.filter(r => r.ma_note !== null).length
    };
    return ok({ devoirs: rows, compteurs });
  });
}

/** POST /api/assignments — créer un devoir (enseignant / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const parsed = await parseBody(req, creation);
    if ('error' in parsed) return parsed.error;
    const d = parsed.data;
    const id = d.id || `d${Date.now().toString(36)}`;
    const row = await q1(
      `insert into assignments (id, course_id, titre, type, points, echeance_label, niveau, consignes, quiz_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9) returning *`,
      [id, d.courseId, d.titre, d.type, d.points, d.echeanceLabel, d.niveau, JSON.stringify(d.consignes), d.quizId ?? null]
    );
    return ok({ devoir: row }, 201);
  });
}
