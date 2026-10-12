import { q, q1 } from '@/lib/db';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/** GET /api/stats — tableau de bord : série, heures, badges, objectif de la semaine, activité. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;

    const [global, semaine, jours, badges, cours, devoirs] = await Promise.all([
      q1<{
        lecons_faites: number; minutes: number; badges: number; cours_suivis: number;
        cours_termines: number; quiz_passes: number; moyenne_quiz: number;
      }>(
        `select
           (select count(*)::int from lesson_progress where user_id = $1 and done) as lecons_faites,
           (select coalesce(sum(minutes),0)::int from activity where user_id = $1) as minutes,
           (select count(*)::int from user_badges where user_id = $1) as badges,
           (select count(*)::int from enrollments where user_id = $1) as cours_suivis,
           (select count(*)::int from enrollments where user_id = $1 and statut = 'termine') as cours_termines,
           (select count(*)::int from quiz_attempts where user_id = $1) as quiz_passes,
           (select coalesce(round(avg(note_pct)),0)::int from quiz_attempts where user_id = $1) as moyenne_quiz`,
        [uid]
      ),
      q1<{ minutes: number; lecons: number }>(
        `select coalesce(sum(minutes),0)::int as minutes, coalesce(sum(lecons),0)::int as lecons
           from activity where user_id = $1 and jour >= date_trunc('week', current_date)`, [uid]
      ),
      q<{ jour: string; minutes: number; lecons: number }>('select jour::text as jour, minutes, lecons from activity where user_id = $1 order by jour desc limit 30', [uid]),
      q<{ id: string; nom: string; ico: string; accent: string; obtenu_at: string }>(`select b.id, b.nom, b.ico, b.accent, ub.obtenu_at from user_badges ub join badges b on b.id = ub.badge_id
          where ub.user_id = $1 order by ub.obtenu_at desc`, [uid]),
      q<{ id: string; titre: string; accent: string; ico: string; progress: number; statut: string; updated_at: string }>(`select c.id, c.titre, c.accent, c.ico, e.progress, e.statut, e.updated_at
           from enrollments e join courses c on c.id = e.course_id where e.user_id = $1 order by e.updated_at desc`, [uid]),
      q1<{ total: number; a_rendre: number }>(`select count(*)::int as total, count(*) filter (where s.id is null)::int as a_rendre
            from assignments a left join submissions s on s.assignment_id = a.id and s.user_id = $1`, [uid])
    ]);

    // série : jours consécutifs d'activité jusqu'à aujourd'hui
    const set = new Set(jours.map(j => j.jour));
    let serie = 0;
    const d = new Date();
    for (;;) { const k = d.toISOString().slice(0, 10); if (set.has(k)) { serie++; d.setDate(d.getDate() - 1); } else break; }

    const objectif = a.session.user.objectif_semaine_h;
    const minutesSemaine = semaine?.minutes ?? 0;
    return ok({
      serie,
      heures: Math.round((global?.minutes ?? 0) / 60 * 10) / 10,
      minutesTotal: global?.minutes ?? 0,
      badges: { obtenus: global?.badges ?? 0, liste: badges },
      coursSuivis: global?.cours_suivis ?? 0,
      coursTermines: global?.cours_termines ?? 0,
      leconsFaites: global?.lecons_faites ?? 0,
      quiz: { passes: global?.quiz_passes ?? 0, moyenne: global?.moyenne_quiz ?? 0 },
      devoirs: devoirs,
      semaine: {
        objectifH: objectif,
        minutes: minutesSemaine,
        heures: Math.round(minutesSemaine / 60 * 10) / 10,
        pourcent: Math.min(100, Math.round(minutesSemaine / (objectif * 60) * 100)),
        lecons: semaine?.lecons ?? 0
      },
      activite: jours,
      cours
    });
  });
}
