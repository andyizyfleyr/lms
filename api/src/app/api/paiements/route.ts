import { q } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { Order, accesDe } from '@/lib/paiement';
import { PLANS, planParId } from '@/lib/catalogue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/paiements — mes achats, mon abonnement, mes accès. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const commandes = await q<Order>('select * from orders where user_id = $1 order by created_at desc limit 40', [uid]);
    const acces = await accesDe(uid);
    return ok({
      acces,
      commandes: commandes.map(o => ({
        id: o.id, type: o.type, courseId: o.course_id, planId: o.plan_id, planNom: o.plan_id ? (planParId(o.plan_id)?.nom || o.plan_id) : null,
        montant: o.amount, devise: o.currency, description: o.description, statut: o.status,
        session: o.nova_session_id, reference: o.nova_reference, methode: o.method,
        payeLe: o.paid_at, creeLe: o.created_at
      })),
      plans: PLANS
    });
  });
}
