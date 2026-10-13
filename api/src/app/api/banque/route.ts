import { q, q1 } from '@/lib/db';
import { auth, ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Ligne = {
  id: string; course_id: string | null; theme: string; type: string; question: string;
  options: string[]; bonnes: number[]; explication: string; difficulte: number; created_at: string;
  cours_titre?: string | null;
};

const propre = (l: Ligne) => ({
  id: l.id, courseId: l.course_id, coursTitre: l.cours_titre || '', theme: l.theme, type: l.type,
  question: l.question, options: l.options || [], bonnes: l.bonnes || [], explication: l.explication,
  difficulte: l.difficulte, creeLe: l.created_at
});

/**
 * GET /api/banque — les questions de la banque.
 * ?courseId= filtre par cours. Les apprenants voient les questions publiées
 * (elles alimentent l'entraînement et les fiches de révision) ; les formateurs
 * voient aussi les leurs pour les modifier.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') || '';
    const rows = await q<Ligne>(
      `select qb.*, c.titre as cours_titre from question_bank qb
         left join courses c on c.id = qb.course_id
        where ($1 = '' or qb.course_id = $1)
        order by c.titre, qb.difficulte, qb.created_at desc
        limit 400`,
      [courseId]
    );
    return ok({ questions: rows.map(propre), total: rows.length });
  });
}

/** POST /api/banque — ajouter une question (formateur / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    let b: { courseId?: string; theme?: string; type?: string; question?: string;
             options?: string[]; bonnes?: number[]; explication?: string; difficulte?: number } = {};
    try { b = await req.json(); } catch { /* vide */ }
    const question = String(b.question || '').trim();
    const options = (b.options || []).map(o => String(o).trim()).filter(Boolean).slice(0, 6);
    const type = b.type === 'multiple' ? 'multiple' : b.type === 'vraifaux' ? 'vraifaux' : 'simple';
    const bonnes = (b.bonnes || []).map(Number).filter(n => n >= 0 && n < options.length);
    if (question.length < 5) return fail('Écrivez la question', 400);
    if (options.length < 2) return fail('Il faut au moins deux propositions', 400);
    if (!bonnes.length) return fail('Indiquez la ou les bonnes réponses', 400);
    if (type === 'simple' && bonnes.length > 1) bonnes.splice(1);
    const row = await q1<Ligne>(
      `insert into question_bank (course_id, theme, type, question, options, bonnes, explication, difficulte, cree_par)
       values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9) returning *`,
      [b.courseId || null, String(b.theme || '').slice(0, 60), type, question.slice(0, 500),
       JSON.stringify(options), JSON.stringify(bonnes), String(b.explication || '').slice(0, 600),
       Math.max(1, Math.min(3, Math.round(Number(b.difficulte) || 2))), a.session.user.id]
    );
    return ok({ question: row ? propre(row) : null }, 201);
  });
}
