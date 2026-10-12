import { z } from 'zod';
import { q1, exec } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { Order, novaLireSession, marquerPaye, accesDe } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  orderId: z.string().uuid().optional(),
  sessionId: z.string().min(4).max(120).optional()
}).refine(v => v.orderId || v.sessionId, { message: 'orderId ou sessionId requis' });

/** POST /api/paiements/verifier — confirme le paiement auprès de NOVA et ouvre l'accès.
 *  Ne jamais se fier au seul retour du navigateur : c'est cet appel qui débloque. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const uid = a.session.user.id;

    const order = p.data.orderId
      ? await q1<Order>('select * from orders where id = $1 and user_id = $2', [p.data.orderId, uid])
      : await q1<Order>('select * from orders where nova_session_id = $1 and user_id = $2', [p.data.sessionId!, uid]);
    if (!order) return notFound('Commande');

    if (order.status === 'paid') {
      return ok({ statut: 'paid', commande: order, acces: await accesDe(uid), dejaPaye: true });
    }

    const s = await novaLireSession(order.nova_session_id || '');
    if (!s) {
      return ok({ statut: order.status, commande: order, acces: await accesDe(uid), note: 'session inconnue de NOVA' });
    }
    if (s.status === 'paid') {
      const maj = await marquerPaye(order.id, { reference: s.reference, method: s.method, paidAt: s.paid_at });
      return ok({ statut: 'paid', commande: maj, acces: await accesDe(uid) });
    }
    if ((s.status === 'expired' || s.status === 'cancelled') && order.status === 'open') {
      await exec(`update orders set status = $2, updated_at = now() where id = $1`, [order.id, s.status]);
    }
    return ok({ statut: s.status, commande: order, acces: await accesDe(uid) });
  });
}
