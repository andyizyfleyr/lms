import { z } from 'zod';
import { q, q1 } from '@/lib/db';
import { auth, ok, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { offrirAcces } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  email: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  cours: z.array(z.string().min(1).max(40)).optional(),   // vide = tous les cours
  jours: z.number().int().min(1).max(3650).optional()      // absent = définitif
}).refine(v => v.email || v.userId, { message: 'email ou userId requis' });

/** POST /api/acces/offrir — geste commercial / support (administrateur uniquement). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['admin']);
    if ('error' in a) return a.error;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;

    const cible = p.data.userId
      ? await q1<{ id: string; email: string }>('select id, email from users where id = $1', [p.data.userId])
      : await q1<{ id: string; email: string }>('select id, email from users where email = $1', [p.data.email!]);
    if (!cible) return notFound('Compte');

    const tous = await q<{ id: string }>('select id from courses');
    const cours = p.data.cours && p.data.cours.length ? p.data.cours : tous.map(c => c.id);
    const r = await offrirAcces({ uid: cible.id, cours, jours: p.data.jours });
    return ok({ compte: cible.email, ...r }, 201);
  });
}
