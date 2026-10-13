import { z } from 'zod';
import { q, exec } from '@/lib/db';
import { estAdmin } from '@/lib/admin';
import { ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  courseId: z.string().trim().min(1).max(40),
  theme: z.string().trim().max(60).default(''),
  difficulte: z.enum(['facile', 'moyen', 'difficile']).default('moyen'),
  texte: z.string().trim().min(10).max(60_000),
  dansQuiz: z.boolean().default(false)
});

/** POST /api/p4-formateur/questions/importer — coller 20 questions d'un coup.
 *  Une question par ligne : « Énoncé | bonne réponse | mauvaise | mauvaise | explication » */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const cours = await q<{ id: string }>('select id from courses where id = $1', [d.courseId]);
    if (!cours.length) return fail('Cours inconnu');

    const lignes = d.texte.split('\n').map(l => l.trim()).filter(l => l && l.indexOf('|') > 0);
    if (!lignes.length) return fail('Aucune ligne exploitable : séparez les champs par des barres verticales');
    const retenues: Array<{ question: string; options: string[]; bonnes: number[]; explication: string }> = [];
    const rejets: Array<{ ligne: string; raison: string }> = [];
    for (const ligne of lignes.slice(0, 300)) {
      const champs = ligne.split('|').map(c => c.trim()).filter((c, i) => i === 0 || c !== '');
      const [question, ...reste] = champs;
      if (!question || reste.length < 2) { rejets.push({ ligne: ligne.slice(0, 120), raison: 'il faut au moins une bonne réponse et une mauvaise' }); continue; }
      const explication = reste.length > 1 ? reste[reste.length - 1] : '';
      const propositions = reste.slice(0, Math.max(2, reste.length - (explication ? 1 : 0)));
      if (propositions.length < 2) { rejets.push({ ligne: ligne.slice(0, 120), raison: 'deux propositions minimum' }); continue; }
      /* la première proposition est la bonne : on mélange ensuite l'ordre des colonnes */
      retenues.push({ question, options: propositions, bonnes: [0], explication });
    }
    if (!retenues.length) return fail('Aucune question valide trouvée', 400, 'vide', rejets);

    let ajoutees = 0;
    for (const r of retenues) {
      const deja = await q<{ id: string }>('select id from question_bank where course_id = $1 and question = $2', [d.courseId, r.question]);
      if (deja.length) continue;
      await exec(
        `insert into question_bank (course_id, theme, type, question, options, bonnes, explication, difficulte, cree_par)
         values ($1, $2, 'qcm', $3, $4::jsonb, $5::jsonb, $6, $7, $8)`,
        [d.courseId, d.theme, r.question, JSON.stringify(r.options), JSON.stringify(r.bonnes),
         r.explication, d.difficulte === 'facile' ? 1 : d.difficulte === 'difficile' ? 3 : 2, a.session.user.id]);
      ajoutees++;
    }
    return ok({ ajoutees, rejets, total: lignes.length, banque: (await q<{ n: number }>('select count(*)::int n from question_bank where course_id = $1', [d.courseId]))[0]?.n ?? 0 });
  });
}
