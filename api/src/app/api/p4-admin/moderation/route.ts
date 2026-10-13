import { q } from '@/lib/db';
import { ok, OPTIONS, handler } from '@/lib/http';
import { estAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-admin/moderation — la file des signalements, avec le contenu visé. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req, true);
    if ('error' in a) return a.error;
    const signalements = await q(
      `select s.*, u.nom as signale_par_nom from signalements s
        left join users u on u.id = s.par
        order by (s.etat = 'nouveau') desc, s.created_at desc limit 200`);
    /* on joint le contenu visé pour pouvoir juger sur pièce */
    const details: Record<string, unknown> = {};
    for (const s of signalements as Array<{ cible: string; cible_id: string }>) {
      const id = s.cible_id;
      if (s.cible === 'sujet') details[id] = (await q('select titre, question, masque from forum_sujets where id = $1', [id]))[0] || null;
      if (s.cible === 'reponse') details[id] = (await q('select texte, masque from forum_reponses where id = $1', [id]))[0] || null;
      if (s.cible === 'photo') details[id] = (await q('select titre, legende, masque from galerie where id = $1', [id]))[0] || null;
      if (s.cible === 'produit') details[id] = (await q('select nom, description, publie from produits where id = $1', [id]))[0] || null;
      if (s.cible === 'utilisateur') details[id] = (await q('select nom, email, bloque from users where id = $1', [id]))[0] || null;
    }
    const [ouverts] = await q<{ n: number }>(`select count(*)::int n from signalements where etat = 'nouveau'`);
    return ok({ signalements, details, ouverts: ouverts.n });
  });
}
