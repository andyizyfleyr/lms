import { z } from 'zod';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { pdfParId, accesPdf } from '@/lib/pdf-livre';
import { signerPdf } from '@/lib/pdfacces';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({ pdfId: z.string().min(1).max(40) });

/** POST /api/p4-pdf/signer — lien de lecture signé, valable 30 minutes. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const doc = await pdfParId(p.data.pdfId);
    if (!doc || !doc.publie) return fail('Ouvrage introuvable', 404, 'introuvable');
    if (!(await accesPdf(a.session.user.id, doc.id))) return fail('Ouvrage non débloqué', 403, 'interdit');
    const t = signerPdf(a.session.user.id, doc.id, 30);
    return ok({ url: '/api/p4-pdf/' + doc.id + '/fichier?t=' + encodeURIComponent(t), expire: 30 });
  });
}
