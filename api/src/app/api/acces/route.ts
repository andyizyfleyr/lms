import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { accesDe, accesGratuit } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/acces — ce que ce compte peut ouvrir (abonnement + cours débloqués). */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const gratuit = accesGratuit(a.session.user.role);
    const acces = await accesDe(a.session.user.id);
    return ok(gratuit ? { ...acces, toutPaye: true, gratuit: true } : { ...acces, gratuit: false });
  });
}
