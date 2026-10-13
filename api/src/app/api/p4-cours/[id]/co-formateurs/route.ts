import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { estAdmin } from '@/lib/admin';
import { ok, fail, notFound, parseBody, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/p4-cours/{id}/co-formateurs — qui partage ce cours, et à quelle part. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const cours = await q1<{ id: string; titre: string; cree_par: string | null }>(
      'select id, titre, cree_par from courses where id = $1', [id]);
    if (!cours) return notFound('Cours');
    const equipe = await q(
      `select cf.user_id, cf.part, cf.created_at, u.nom, u.email, u.ville
         from co_formateurs cf join users u on u.id = cf.user_id where cf.course_id = $1 order by cf.created_at`, [id]);
    const candidats = await q(
      `select id, nom, email, ville from users where role in ('enseignant','admin') and id <> $1
         and id not in (select user_id from co_formateurs where course_id = $2) order by nom`, [a.session.user.id, id]);
    return ok({ cours, equipe, candidats, mien: cours.cree_par === a.session.user.id });
  });
}

const corps = z.object({
  userId: z.string().uuid(),
  part: z.number().int().min(0).max(100).default(50)
});

/** POST — ajouter un co-formateur ; il reçoit une notification et voit le cours. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const cours = await q1<{ titre: string; cree_par: string | null }>('select titre, cree_par from courses where id = $1', [id]);
    if (!cours) return notFound('Cours');
    if (cours.cree_par && cours.cree_par !== a.session.user.id && a.session.user.role !== 'admin') {
      return fail('Seul l\'auteur du cours peut nommer un co-formateur', 403, 'interdit');
    }
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    if (d.userId === a.session.user.id) return fail('Vous êtes déjà l\'auteur du cours');
    await exec(
      `insert into co_formateurs (course_id, user_id, part) values ($1, $2, $3)
       on conflict (course_id, user_id) do update set part = $3`,
      [id, d.userId, d.part]);
    await exec(
      `insert into notifications (user_id, titre, texte, ico, kind, ref_id)
       values ($1, 'Vous êtes co-formateur', $2, 'school', 'cours', $3)`,
      [d.userId, 'Vous partagez désormais « ' + cours.titre + ' » à ' + d.part + ' %.', id]);
    const equipe = await q(
      `select cf.user_id, cf.part, u.nom, u.email from co_formateurs cf join users u on u.id = cf.user_id
        where cf.course_id = $1 order by cf.created_at`, [id]);
    return ok({ equipe }, 201);
  });
}

/** DELETE /api/p4-cours/{id}/co-formateurs?userId=… — retirer un co-formateur. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const uid = new URL(req.url).searchParams.get('userId') || '';
    if (!uid) return fail('Précisez la personne à retirer');
    const cours = await q1<{ cree_par: string | null }>('select cree_par from courses where id = $1', [id]);
    if (!cours) return notFound('Cours');
    if (cours.cree_par && cours.cree_par !== a.session.user.id && a.session.user.role !== 'admin') {
      return fail('Seul l\'auteur du cours peut retirer un co-formateur', 403, 'interdit');
    }
    const n = await exec('delete from co_formateurs where course_id = $1 and user_id = $2', [id, uid]);
    return ok({ retire: !!n });
  });
}
