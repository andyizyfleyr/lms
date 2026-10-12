import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Ligne = {
  course_id: string; titre: string; categorie: string; prof: string; accent: string; ico: string;
  lecons_faites: number; lecons_total: number; pourcent: number; termine_le: string | null;
  quiz_moyenne: number | null; minutes: number;
};

/**
 * GET /api/certificats — attestations de l'utilisateur connecté.
 *
 * Un cours donne droit à une attestation lorsque TOUTES ses leçons sont terminées.
 * La route renvoie, pour chaque cours suivi, l'avancement et — s'il est achevé —
 * la date d'achèvement (dernière leçon validée) et un numéro d'attestation stable
 * (dérivé de l'utilisateur et du cours, donc reproductible et vérifiable).
 * Filtres : ?cours=c1 pour une seule attestation.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const cours = new URL(req.url).searchParams.get('cours') || '';

    const rows = await q<Ligne>(
      `select c.id as course_id, c.titre, c.categorie, c.prof, c.accent, c.ico,
              (select count(*)::int from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = c.id and lp.user_id = $1 and lp.done) as lecons_faites,
              (select count(*)::int from lessons l where l.course_id = c.id) as lecons_total,
              (select max(lp.updated_at) from lesson_progress lp
                 join lessons l on l.id = lp.lesson_id
                where l.course_id = c.id and lp.user_id = $1 and lp.done) as termine_le,
              (select round(avg(z.note_pct))::int from quiz_attempts z
                 join quizzes qz on qz.id = z.quiz_id
                where qz.course_id = c.id and z.user_id = $1) as quiz_moyenne,
              (select coalesce(sum(act.minutes), 0)::int from activity act where act.user_id = $1) as minutes
         from courses c
         join enrollments e on e.course_id = c.id and e.user_id = $1
        where ($2 = '' or c.id = $2)
        order by c.titre`,
      [uid, cours]
    );

    const sous = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const empreinte = (txt: string) => {
      /* petite empreinte lisible : stable pour un couple (utilisateur, cours) */
      let h1 = 0x811c9dc5, h2 = 0x1000193;
      for (let i = 0; i < txt.length; i++){
        h1 = (h1 ^ txt.charCodeAt(i)) * 16777619 >>> 0;
        h2 = (h2 + txt.charCodeAt(i) * (i + 7)) >>> 0;
      }
      const mot = (n: number) => { let s = ''; for (let i = 0; i < 4; i++){ s += sous[n % sous.length]; n = Math.floor(n / sous.length); } return s.toUpperCase(); };
      return mot(h1) + '-' + mot(h2);
    };

    const liste = rows.map(r => ({
      ...r,
      pourcent: r.lecons_total ? Math.round(r.lecons_faites / r.lecons_total * 100) : 0,
      termine: r.lecons_total > 0 && r.lecons_faites >= r.lecons_total,
      numero: empreinte(uid + '/' + r.course_id),
      apprenant: a.session.user.nom
    }));

    const total = await q1<{ n: number }>(
      `select count(*)::int as n from enrollments where user_id = $1`, [uid]
    );
    return ok({
      certificats: liste.filter(c => c.termine),
      enCours: liste.filter(c => !c.termine),
      totalObtenus: liste.filter(c => c.termine).length,
      coursSuivis: (total && total.n) || 0,
      apprenant: a.session.user.nom,
      email: a.session.user.email
    });
  });
}
