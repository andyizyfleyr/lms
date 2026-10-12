import { q, q1, exec } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, notFound, forbidden, parseBody, OPTIONS, handler } from '@/lib/http';
import { cours } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/courses/{id} — fiche complète : modules + leçons, ressources, quiz, devoirs, vidéos, progression. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;

    const c = await q1(
      `select c.*, e.progress, e.favori, e.statut as mon_statut, (e.user_id is not null) as inscrit
         from courses c left join enrollments e on e.course_id = c.id and e.user_id = $1
        where c.id = $2`, [uid, id]
    );
    if (!c) return notFound('Cours');

    type Lecon = { module_titre: string; module_ordre: number; ordre: number; done: boolean; [k: string]: unknown };
    const lecons = await q<Lecon>(
      `select l.*, coalesce(lp.done, false) as done
         from lessons l left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = $1
        where l.course_id = $2 order by l.module_ordre, l.ordre`, [uid, id]
    );
    const [ressources, videos, quiz, devoirs, avis] = await Promise.all([
      q('select * from resources where course_id = $1 order by ordre', [id]),
      q('select * from videos where course_id = $1 order by vues desc', [id]),
      q(`select z.id, z.titre, z.duree_s, z.note_min,
                (select count(*)::int from quiz_questions qq where qq.quiz_id = z.id) as questions,
                (select max(note_pct) from quiz_attempts a where a.quiz_id = z.id and a.user_id = $1) as meilleure_note
           from quizzes z where z.course_id = $2`, [uid, id]),
      q(`select a.id, a.titre, a.type, a.points, a.echeance_label, a.niveau,
                (select s.statut from submissions s where s.assignment_id = a.id and s.user_id = $1 order by s.created_at desc limit 1) as mon_statut
           from assignments a where a.course_id = $2`, [uid, id]),
      q(`select count(*)::int as messages from messages where course_id = $1`, [id])
    ]);

    // regroupement des leçons par module
    const modules: Array<{ titre: string; ordre: number; lecons: Lecon[] }> = [];
    for (const l of lecons) {
      let m = modules.find(x => x.titre === l.module_titre);
      if (!m) { m = { titre: l.module_titre, ordre: l.module_ordre, lecons: [] }; modules.push(m); }
      m.lecons.push(l);
    }
    const faites = lecons.filter(l => l.done).length;
    return ok({
      cours: c, modules, ressources, videos, quiz, devoirs, discussion: avis[0]?.messages ?? 0,
      progression: { leconsFaites: faites, leconsTotal: lecons.length, pourcent: lecons.length ? Math.round(faites / lecons.length * 100) : 0 }
    });
  });
}

/** PATCH /api/courses/{id} — modifier un cours (enseignant / admin). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const parsed = await parseBody(req, cours.partial());
    if ('error' in parsed) return parsed.error;
    const c = parsed.data;
    const row = await q1(
      `update courses set titre = coalesce($2, titre), categorie = coalesce($3, categorie),
              prof = coalesce($4, prof), image_key = coalesce($5, image_key), accent = coalesce($6, accent),
              ico = coalesce($7, ico), total_lecons = coalesce($8, total_lecons),
              duree_label = coalesce($9, duree_label), description = coalesce($10, description)
        where id = $1 returning *`,
      [id, c.titre ?? null, c.categorie ?? null, c.professeur ?? null, c.imageKey ?? null, c.accent ?? null,
       c.ico ?? null, c.totalLecons ?? null, c.dureeLabel ?? null, c.description ?? null]
    );
    if (!row) return notFound('Cours');
    return ok({ cours: row });
  });
}

/** DELETE /api/courses/{id} — supprimer un cours (admin uniquement). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec('delete from courses where id = $1 returning id', [id]);
    if (!n) return notFound('Cours');
    return ok({ supprime: true });
  });
}
