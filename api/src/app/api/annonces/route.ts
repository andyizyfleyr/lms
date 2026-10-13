import { q, q1 } from '@/lib/db';
import { auth, ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Dest = { user_id: string };

/**
 * POST /api/annonces — un formateur écrit à ses élèves.
 * Corps : { courseId, titre, texte, kind? } — courseId vide = tous ses cours.
 * Chaque apprenant inscrit reçoit une notification nominative.
 */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    let b: { courseId?: string; titre?: string; texte?: string; kind?: string } = {};
    try { b = await req.json(); } catch { /* vide */ }
    const titre = String(b.titre || '').trim().slice(0, 120);
    const texte = String(b.texte || '').trim().slice(0, 800);
    if (!titre) return fail('Écrivez un titre d\'annonce', 400);

    const cible = String(b.courseId || '');
    const cours = await q<{ id: string; titre: string }>(
      `select id, titre from courses
        where ($1 <> '' and id = $1) or ($1 = '' and ($2 = 'admin' or prof = $3))`,
      [cible, a.session.user.role, a.session.user.nom]
    );
    if (!cours.length) return fail('Aucun cours trouvé pour cette annonce', 404);

    const dest = await q<Dest>(
      `select distinct e.user_id from enrollments e where e.course_id = any($1::text[])`,
      [cours.map(c => c.id)]
    );
    let envoyees = 0;
    for (const d of dest) {
      if (d.user_id === a.session.user.id) continue;
      await q1(
        `insert into notifications (user_id, titre, texte, ico, kind, ref_id)
         values ($1, $2, $3, 'bullhorn', 'cours', $4)`,
        [d.user_id, titre, texte, cours.length === 1 ? cours[0].id : '']
      );
      envoyees++;
    }
    return ok({ envoyees, cours: cours.map(c => c.titre) }, 201);
  });
}
