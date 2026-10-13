import { q, q1 } from '@/lib/db';
import { auth, ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** PATCH /api/sessions/{id} — le formateur met un lien de visioconférence (séance en direct). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const { id } = await params;
    let b: { lien?: string; enligne?: boolean; titre?: string; heure?: string } = {};
    try { b = await req.json(); } catch { /* vide */ }
    const lien = String(b.lien || '').trim();
    if (lien && !/^https?:\/\//.test(lien)) return fail('Le lien doit commencer par http:// ou https://', 400);
    const row = await q1(
      `update calendar_sessions set lien = $2, enligne = $3,
              titre = coalesce($4, titre), heure = coalesce($5, heure)
        where id = $1 returning *`,
      [id, lien.slice(0, 300), b.enligne !== false && !!lien, b.titre ? String(b.titre).slice(0, 160) : null,
       b.heure ? String(b.heure).slice(0, 10) : null]
    );
    if (!row) return fail('Séance introuvable', 404, 'introuvable');
    return ok({ seance: row });
  });
}

/** GET /api/sessions/{id} — une séance (lien compris). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const rows = await q(`select * from calendar_sessions where id = $1`, [id]);
    if (!rows.length) return fail('Séance introuvable', 404, 'introuvable');
    return ok({ seance: rows[0] });
  });
}
