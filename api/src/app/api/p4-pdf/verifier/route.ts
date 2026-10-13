import { z } from 'zod';
import { q, q1 } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { Order, novaLireSession, marquerPaye } from '@/lib/paiement';
import { deverrouillerPdf, accesPdfListe } from '@/lib/pdf-livre';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  orderId: z.string().uuid().optional(),
  sessionId: z.string().min(4).max(120).optional()
}).refine(v => v.orderId || v.sessionId, { message: 'orderId ou sessionId requis' });

/** POST /api/p4-pdf/verifier — filet de sécurité de la boutique :
 *  on redemande le statut à NOVA, puis on ouvre les documents payés. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const uid = a.session.user.id;

    const commande = p.data.orderId
      ? await q1<Order>('select * from orders where id = $1 and user_id = $2', [p.data.orderId, uid])
      : await q1<Order>('select * from orders where nova_session_id = $1 and user_id = $2', [p.data.sessionId!, uid]);
    if (!commande) return fail('Commande introuvable', 404, 'introuvable');
    if (commande.type !== 'pdf' && commande.type !== 'pdfs') return fail('Cette commande n\'est pas une commande de documents');

    if (commande.status === 'paid') {
      const ids = (commande.meta && commande.meta.pdfIds) || [];
      await deverrouillerPdf(uid, ids, commande.id);
      return ok({ statut: 'paid', dejaPaye: true, acces: await accesPdfListe(uid) });
    }

    const s = await novaLireSession(commande.nova_session_id || '');
    if (s && s.status === 'paid') {
      await marquerPaye(commande.id, { reference: s.reference, method: s.method, paidAt: s.paid_at });
      return ok({ statut: 'paid', acces: await accesPdfListe(uid) });
    }
    /* filet supplémentaire : le webhook NOVA a pu passer avant nous */
    const etait = await q<{ id: string }>(`select id from orders where id = $1 and status = 'paid'`, [commande.id]);
    if (etait.length) {
      await deverrouillerPdf(uid, (commande.meta && commande.meta.pdfIds) || [], commande.id);
      return ok({ statut: 'paid', dejaPaye: true, acces: await accesPdfListe(uid) });
    }
    return ok({ statut: s ? s.status : commande.status, acces: await accesPdfListe(uid) });
  });
}
