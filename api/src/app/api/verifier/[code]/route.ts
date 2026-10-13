import { q } from '@/lib/db';
import { ok, notFound, OPTIONS, handler } from '@/lib/http';
import { analyserNumero, tagDe } from '@/lib/attestation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/**
 * GET /api/verifier/{numero} — vérification PUBLIQUE d'une attestation.
 *
 * Aucun compte requis : c'est tout l'intérêt. Le numéro porte le cours
 * (CL-C1-7F3A) ; on recherche, parmi les apprenants de ce cours, celui dont
 * l'empreinte correspond, et on confirme que le cours est bien terminé.
 * On ne révèle jamais l'e-mail : uniquement le nom et la date.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  return handler(async () => {
    const { code } = await params;
    const n = analyserNumero(decodeURIComponent(code));
    if (!n) return ok({ valide: false, raison: 'Numéro illisible' });

    const cours = await q<{ id: string; titre: string; prof: string; lecons_total: number }>(
      `select c.id, c.titre, c.prof,
              (select count(*)::int from lessons l where l.course_id = c.id) as lecons_total
         from courses c where lower(c.id) = $1`, [n.cours]
    );
    if (!cours.length) return ok({ valide: false, raison: 'Cours inconnu' });

    const candidats = await q<{ user_id: string; nom: string; faites: number; termine_le: string | null }>(
      `select u.id as user_id, u.nom,
              (select count(*)::int from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = $1 and lp.user_id = u.id and lp.done) as faites,
              (select max(lp.updated_at) from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = $1 and lp.user_id = u.id and lp.done) as termine_le
         from users u join enrollments e on e.user_id = u.id and e.course_id = $1`,
      [n.cours]
    );

    for (const c of candidats) {
      if (tagDe(c.user_id, cours[0].id) !== n.tag) continue;
      const termine = cours[0].lecons_total > 0 && c.faites >= cours[0].lecons_total;
      const [prenom, ...reste] = String(c.nom || '').split(' ');
      return ok({
        valide: termine,
        raison: termine ? '' : 'Cours non terminé à ce jour',
        numero: 'CL-' + cours[0].id.toUpperCase() + '-' + n.tag,
        cours: { id: cours[0].id, titre: cours[0].titre, formateur: cours[0].prof },
        apprenant: prenom + (reste.length ? ' ' + reste.map(p => p.charAt(0) + '.').join(' ') : ''),
        termineLe: c.termine_le,
        lecons: { faites: c.faites, total: cours[0].lecons_total },
        verifieLe: new Date().toISOString()
      });
    }
    return ok({ valide: false, raison: 'Aucune attestation ne correspond à ce numéro' });
  });
}
