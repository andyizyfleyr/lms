import { z } from 'zod';
import { q, q1 } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  cible: z.enum(['sujet', 'reponse', 'photo', 'produit', 'utilisateur']),
  cibleId: z.string().trim().min(1).max(60),
  motif: z.enum(['spam', 'incorrect', 'dangereux', 'desagreable', 'autre']).default('autre'),
  details: z.string().trim().max(600).default('')
});

/** POST /api/p4-commun/signaler — signaler un contenu à la modération. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const deja = await q1(
      `select 1 from signalements where cible = $1 and cible_id = $2 and par = $3 and etat = 'nouveau'`,
      [d.cible, d.cibleId, a.session.user.id]);
    if (deja) return ok({ deja: true, message: 'Votre signalement est déjà enregistré : la modération va le traiter.' });
    await q(
      `insert into signalements (cible, cible_id, motif, details, par) values ($1, $2, $3, $4, $5)`,
      [d.cible, d.cibleId, d.motif, d.details, a.session.user.id]);
    /* la modération est prévenue sans attendre le prochain passage */
    const moderateurs = await q<{ id: string }>(
      `select id from users where role in ('admin','enseignant') or moderateur`);
    for (const m of moderateurs) {
      await q(
        `insert into notifications (user_id, titre, texte, ico, kind)
         values ($1, 'Nouveau signalement', $2, 'flag', 'moderation')`,
        [m.id, 'Un contenu de type « ' + d.cible + ' » a été signalé (' + d.motif + ').']);
    }
    const [ouverts] = await q<{ n: number }>(`select count(*)::int n from signalements where etat = 'nouveau'`);
    if (!ouverts) return fail('Signalement non enregistré', 500, 'erreur_serveur');
    return ok({ enregistre: true, ouverts: ouverts.n }, 201);
  });
}
