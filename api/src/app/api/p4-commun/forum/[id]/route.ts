import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { peutModerer } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-commun/forum/{id} — le sujet et ses réponses. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const a = await auth(req);
    const uid = 'error' in a ? null : a.session.user.id;
    const sujet = await q(
      `select s.*, coalesce(u.nom, 'Membre') auteur_nom, (s.auteur = $2) as mien
         from forum_sujets s left join users u on u.id = s.auteur where s.id = $1`, [id, uid]);
    if (!sujet.length) return notFound('Sujet');
    const s = sujet[0] as { masque: boolean; auteur: string | null; vues: number };
    if (s.masque) return fail('Ce sujet a été masqué par la modération', 410, 'masque');
    await exec('update forum_sujets set vues = vues + 1 where id = $1', [id]);
    const reponses = await q(
      `select r.id, r.texte, r.utils, r.created_at, coalesce(u.nom, 'Membre') auteur_nom,
              (r.auteur = $2) as mien, u.role,
              exists (select 1 from forum_votes v where v.reponse_id = r.id and v.user_id = $2) as vote
         from forum_reponses r left join users u on u.id = r.auteur
        where r.sujet_id = $1 and not r.masque
        order by r.utils desc, r.created_at asc`, [id, uid]);
    return ok({ sujet: sujet[0], reponses, modere: peutModerer('error' in a ? null : a.session.user) });
  });
}

const corps = z.object({
  texte: z.string().trim().max(3000).optional(),
  resolu: z.boolean().optional(),
  epingle: z.boolean().optional(),
  masquer: z.boolean().optional()
});

/** POST = répondre · PATCH = marquer résolu / épingler / masquer (auteur ou modération). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    if (!p.data.texte || p.data.texte.length < 2) return fail('Écrivez votre réponse');
    const row = await q(
      `insert into forum_reponses (sujet_id, auteur, texte) values ($1, $2, $3) returning id, created_at`,
      [id, a.session.user.id, p.data.texte]);
    await exec('update forum_sujets set updated_at = now() where id = $1', [id]);
    const u = a.session.user;
    return ok({ reponse: row[0], auteur_nom: u.nom }, 201);
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const s = await q1<{ auteur: string | null }>('select auteur from forum_sujets where id = $1', [id]);
    if (!s) return notFound('Sujet');
    const moi = s.auteur === a.session.user.id;
    const mod = peutModerer(a.session.user);
    if (!moi && !mod) return fail('Seul l\'auteur du sujet ou la modération peut faire cela', 403, 'interdit');
    await exec(
      `update forum_sujets set resolu = coalesce($2, resolu), epingle = coalesce($3, epingle),
              masque = coalesce($4, masque), updated_at = now() where id = $1`,
      [id, p.data.resolu ?? null, p.data.epingle ?? null, p.data.masquer ?? null]);
    const sujet = await q1('select id, resolu, epingle, masque from forum_sujets where id = $1', [id]);
    return ok({ sujet });
  });
}
