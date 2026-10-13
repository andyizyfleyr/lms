import { z } from 'zod';
import { auth, ok, parseBody, OPTIONS, handler } from '@/lib/http';
import { creerCommande } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  type: z.enum(['cours', 'abonnement', 'panier', 'pdf', 'pdfs']),
  courseId: z.string().min(1).max(40).optional(),
  planId: z.string().min(1).max(40).optional(),
  courseIds: z.array(z.string().min(1).max(40)).max(20).optional(),
  pdfId: z.string().min(1).max(40).optional(),
  pdfIds: z.array(z.string().min(1).max(40)).max(20).optional(),
  code: z.string().min(2).max(40).optional()
});

/** POST /api/paiements/session — ouvre une session NOVA : un cours, un panier de cours, ou un abonnement. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;

    const r = await creerCommande(a.session.user.id, p.data);
    if (!r.ok) return r.error;
    return ok({
      commande: {
        id: r.order.id, type: r.order.type, courseId: r.order.course_id, planId: r.order.plan_id,
        montant: r.order.amount, devise: r.order.currency, description: r.order.description,
        statut: r.order.status, session: r.order.nova_session_id
      },
      url: r.url,
      meta: r.order.meta || {}
    }, 201);
  });
}
