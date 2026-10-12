import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { accesDe, accesGratuit } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/* ============================================================
   GET /api/activite — l'activité réelle de l'apprenant (ou du formateur).

   Remplace le bloc « Activité du formateur » qui affichait un retour
   inventé : ici, rien n'est fabriqué — si la personne n'a encore rien
   reçu ni déposé, les listes sont vides et l'application masque le bloc.
   ============================================================ */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const encadrant = accesGratuit(a.session.user.role);

    /* cours dont la personne peut lire la discussion */
    const acces = await accesDe(uid);
    let mesCours: string[];
    if (encadrant || acces.toutPaye) {
      mesCours = (await q<{ id: string }>('select id from courses order by id')).map(r => r.id);
    } else {
      mesCours = acces.cours;
    }

    const messages = mesCours.length
      ? await q(
          `select m.id, m.course_id, c.titre as cours_titre, m.auteur, m.role, m.contenu, m.created_at
             from messages m join courses c on c.id = m.course_id
            where m.course_id = any($1::text[])
            order by m.created_at desc limit 4`,
          [mesCours]
        )
      : [];

    /* le dernier dépôt de la personne (ou le dernier dépôt à corriger pour un formateur) */
    const derniere = await q1(
      `select s.id, s.statut, s.note, s.commentaire, s.created_at,
              a.titre as devoir_titre, a.points, c.titre as cours_titre, c.id as course_id
         from submissions s
         join assignments a on a.id = s.assignment_id
         join courses c on c.id = a.course_id
        where s.user_id = $1
        order by s.created_at desc limit 1`,
      [uid]
    );

    let aNoter = 0, dernierDepot = null;
    if (encadrant) {
      const c = await q1<{ n: number }>(`select count(*)::int as n from submissions where statut = 'rendu'`);
      aNoter = c ? c.n : 0;
      dernierDepot = await q1(
        `select s.id, s.statut, s.created_at, a.titre as devoir_titre, c.titre as cours_titre,
                u.nom as eleve_nom, c.id as course_id
           from submissions s
           join assignments a on a.id = s.assignment_id
           join courses c on c.id = a.course_id
           join users u on u.id = s.user_id
          order by s.created_at desc limit 1`
      );
    }

    return ok({
      encadrant,
      messages,
      derniere: derniere || null,
      aNoter,
      dernierDepot: dernierDepot || null
    });
  });
}
