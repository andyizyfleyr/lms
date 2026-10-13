import { z } from 'zod';
import { q, q1, exec } from '@/lib/db';
import { ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { estAdmin } from '@/lib/admin';
import { genererPdf } from '@/lib/pdf-livre';
import { SITE_URL } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };
export const maxDuration = 60;

/** GET /api/p4-admin/ouvrages — le catalogue des PDF, y compris les non publiés. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const ouvrages = await q(
      `select p.*, (select count(*)::int from pdf_acces a where a.pdf_id = p.id) acquereurs
         from pdfs p order by p.ordre, p.titre`);
    return ok({ ouvrages });
  });
}

const corps = z.object({
  id: z.string().trim().min(3).max(40),
  prix: z.number().int().min(0).max(500_000).optional(),
  publie: z.boolean().optional(),
  ordre: z.number().int().min(0).max(999).optional(),
  titre: z.string().trim().min(3).max(120).optional(),
  sousTitre: z.string().trim().max(160).optional(),
  niveau: z.string().trim().max(30).optional(),
  regeneration: z.boolean().optional()
});

/** PATCH /api/p4-admin/ouvrages — prix, publication, ordre ; et régénération du PDF. */
export async function PATCH(req: Request) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const existe = await q1<{ id: string }>('select id from pdfs where id = $1', [d.id]);
    if (!existe) return fail('Ouvrage introuvable', 404, 'introuvable');
    await exec(
      `update pdfs set prix = coalesce($2, prix), publie = coalesce($3, publie), ordre = coalesce($4, ordre),
              titre = coalesce($5, titre), sous_titre = coalesce($6, sous_titre), niv = coalesce($7, niv)
        where id = $1`,
      [d.id, d.prix ?? null, d.publie ?? null, d.ordre ?? null, d.titre ?? null, d.sousTitre ?? null, d.niveau ?? null]);
    if (!d.publie) await exec(`insert into journal_securite (user_id, type, detail) values ($1, 'admin', $2)`,
      [a.session.user.id, 'ouvrage ' + d.id + ' : publication ' + (d.publie ? 'activée' : 'désactivée')]);
    let pages: number | null = null;
    if (d.regeneration) {
      const r = await genererPdf(d.id, 'Vérification administration', SITE_URL);
      pages = r ? r.pages : null;
    }
    const ouvrage = await q1('select * from pdfs where id = $1', [d.id]);
    return ok({ ouvrage, pages });
  });
}
