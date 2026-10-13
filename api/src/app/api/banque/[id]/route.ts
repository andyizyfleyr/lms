import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/banque/{id} — corriger une question de la banque (auteur ou admin). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Question introuvable', 404, 'introuvable');
    const ancienne = await q1<{ id: string; cree_par: string | null; options: string[] }>(
      `select id, cree_par, options from question_bank where id = $1`, [id]
    );
    if (!ancienne) return fail('Question introuvable', 404, 'introuvable');
    if (a.session.user.role !== 'admin' && ancienne.cree_par !== a.session.user.id) return fail('Cette question ne vous appartient pas', 403, 'interdit');

    let b: { question?: string; explication?: string; difficulte?: number; options?: string[]; bonnes?: number[]; theme?: string; type?: string } = {};
    try { b = await req.json(); } catch { /* vide */ }
    const options = (b.options || ancienne.options || []).map(o => String(o).trim()).filter(Boolean).slice(0, 6);
    const bonnes = (b.bonnes || []).map(Number).filter(n => n >= 0 && n < options.length);
    const row = await q1(
      `update question_bank set question = coalesce($2, question), explication = coalesce($3, explication),
              difficulte = coalesce($4, difficulte), theme = coalesce($5, theme), type = coalesce($6, type),
              options = coalesce($7::jsonb, options), bonnes = case when $8::jsonb = '[]'::jsonb then bonnes else $8::jsonb end
        where id = $1 returning *`,
      [id, b.question ? String(b.question).slice(0, 500) : null, b.explication !== undefined ? String(b.explication).slice(0, 600) : null,
       b.difficulte ? Math.max(1, Math.min(3, Math.round(b.difficulte))) : null, b.theme ? String(b.theme).slice(0, 60) : null,
       b.type || null, JSON.stringify(options), JSON.stringify(bonnes)]
    );
    return ok({ question: row });
  });
}

/** DELETE /api/banque/{id} — retirer une question (auteur ou admin). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    const n = await exec(
      `delete from question_bank where id = $1 and (cree_par = $2 or $3 = 'admin')`,
      [id, a.session.user.id, a.session.user.role]
    );
    return ok({ supprimee: n > 0 });
  });
}
