import { q1, exec } from '@/lib/db';
import { auth, ok, fail, notFound, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** POST /api/p4-commun/ateliers/{id}/participer — je m'inscris / je me retire. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const { id } = await params;
    const a = await auth(req);
    if ('error' in a) return a.error;
    const t = await q1<{ id: string; places: number; ferme: boolean; auteur: string | null }>(
      'select id, places, ferme, auteur from ateliers where id = $1', [id]);
    if (!t) return notFound('Atelier');
    const inscrit = await q1('select 1 from atelier_participants where atelier = $1 and user_id = $2', [id, a.session.user.id]);
    if (inscrit) {
      await exec('delete from atelier_participants where atelier = $1 and user_id = $2', [id, a.session.user.id]);
      return ok({ inscrit: false });
    }
    if (t.ferme) return fail('Cet atelier n\'accepte plus d\'inscriptions');
    const n = await q1<{ n: number }>('select count(*)::int n from atelier_participants where atelier = $1', [id]);
    if ((n?.n ?? 0) >= t.places) return fail('Cet atelier est complet : écrivez à l\'organisateur pour une place supplémentaire');
    await exec('insert into atelier_participants (atelier, user_id) values ($1, $2) on conflict do nothing', [id, a.session.user.id]);
    if (t.auteur && t.auteur !== a.session.user.id) {
      await exec(`insert into notifications (user_id, titre, texte, ico, kind)
                  values ($1, 'Quelqu\'un rejoint votre atelier', $2, 'users', 'atelier')`,
        [t.auteur, a.session.user.nom + ' s\'est inscrit à votre atelier.']);
    }
    return ok({ inscrit: true, participants: (n?.n ?? 0) + 1 });
  });
}
