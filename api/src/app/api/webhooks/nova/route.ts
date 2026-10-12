import { q1 } from '@/lib/db';
import { ok, fail, OPTIONS, handler } from '@/lib/http';
import { verifierSignatureNova, NOVA_WEBHOOK_SECRET, marquerPaye, Order } from '@/lib/paiement';
import { exec } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/webhooks/nova — notifications de NOVA (signature HMAC obligatoire, idempotent). */
export async function POST(req: Request) {
  return handler(async () => {
    const brut = await req.text();
    if (!NOVA_WEBHOOK_SECRET) return fail('Webhook non configuré (NOVA_WEBHOOK_SECRET absent).', 503, 'webhook_non_configure');
    if (!verifierSignatureNova(brut, req.headers.get('NOVA-Signature'), NOVA_WEBHOOK_SECRET)) {
      return fail('Signature invalide', 401, 'signature_invalide');
    }

    let evt: any;
    try { evt = JSON.parse(brut); } catch { return fail('Corps illisible'); }
    const id = String(evt?.id || '');
    const type = String(evt?.type || '');
    const objet = evt?.data?.object || {};

    // idempotence : le même évènement peut arriver plusieurs fois (relances NOVA)
    if (id && await q1('select id from payment_events where id = $1', [id])) return ok({ recu: true, deja: true });

    let order: Order | null = null;
    if (objet?.metadata?.order_id) order = await q1<Order>('select * from orders where id = $1', [objet.metadata.order_id]);
    if (!order && objet?.id) order = await q1<Order>('select * from orders where nova_session_id = $1', [objet.id]);

    if (type === 'checkout.session.paid' && order) {
      await marquerPaye(order.id, { reference: objet.reference, method: objet.method, paidAt: objet.paid_at });
    } else if (type === 'checkout.session.expired' && order && order.status === 'open') {
      await exec(`update orders set status = 'expired', updated_at = now() where id = $1`, [order.id]);
    }

    if (id) {
      await exec(
        `insert into payment_events (id, type, order_id, payload) values ($1, $2, $3, $4)
         on conflict (id) do nothing`,
        [id, type, order ? order.id : null, JSON.stringify(evt)]
      );
    }
    return ok({ recu: true, commande: order ? order.id : null, type });
  });
}
