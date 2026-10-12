import { q, q1, exec } from '@/lib/db';
import { sessionFrom } from '@/lib/auth';
import { auth, ok, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Badge = { id: string; nom: string; ico: string; accent: string; description: string; cible: number; obtenu_at: string | null; valeur: number | null };

/**
 * GET /api/badges — catalogue des badges + état de déblocage.
 * Les valeurs (série, leçons, quiz, heures) sont calculées en SQL, le badge est
 * attribué automatiquement s'il ne l'était pas encore.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const session = await sessionFrom(req);
    const uid = session?.user.id ?? null;

    const valeurs = uid ? await q1<{ serie: number; lecons: number; quiz: number; heures: number; parfaits: number }>(
      `select
         (select count(*)::int from (
            select jour, jour - (row_number() over (order by jour desc))::int as grp
              from activity where user_id = $1 order by jour desc
          ) t where true) as serie,
         (select count(*)::int from lesson_progress where user_id = $1 and done) as lecons,
         (select count(*)::int from quiz_attempts where user_id = $1) as quiz,
         (select coalesce(sum(minutes), 0)::int / 60 from activity where user_id = $1) as heures,
         (select count(*)::int from quiz_attempts where user_id = $1 and note_pct = 100) as parfaits`,
      [uid]
    ) : null;

    // série réelle (jours consécutifs jusqu'à aujourd'hui) — calculée en JS à partir des jours d'activité
    let serie = 0;
    if (uid) {
      const jours = await q<{ jour: string }>('select jour::text from activity where user_id = $1 order by jour desc limit 90', [uid]);
      const set = new Set(jours.map(r => r.jour));
      const d = new Date();
      for (;;) {
        const key = d.toISOString().slice(0, 10);
        if (set.has(key)) { serie++; d.setDate(d.getDate() - 1); } else break;
      }
    }
    const valeur = (id: string) =>
      id === 'streak' ? serie
      : id === 'perf' ? (valeurs?.parfaits ?? 0)
      : id === 'explo' ? (valeurs?.lecons ?? 0)
      : id === 'data' ? (valeurs?.heures ?? 0)
      : (valeurs?.lecons ?? 0);

    if (uid) {
      const aAttribuer = (await q<Badge>(
        `select b.id, b.cible from badges b
          where not exists (select 1 from user_badges ub where ub.badge_id = b.id and ub.user_id = $1)`, [uid]
      )).filter(b => valeur(b.id) >= b.cible);
      for (const b of aAttribuer) {
        await exec('insert into user_badges (user_id, badge_id) values ($1, $2) on conflict do nothing', [uid, b.id]);
      }
    }

    const badges = await q<Badge>(
      `select b.*, ub.obtenu_at from badges b
        left join user_badges ub on ub.badge_id = b.id and ub.user_id = $1
        order by (ub.obtenu_at is not null) desc, b.cible`,
      [uid]
    );
    const liste = badges.map(b => ({ ...b, valeur: valeur(b.id), obtenu: !!b.obtenu_at, progression: Math.min(100, Math.round(valeur(b.id) / Math.max(b.cible, 1) * 100)) }));
    return ok({
      badges: liste,
      compteurs: { total: liste.length, obtenus: liste.filter(b => b.obtenu).length, serie, heures: valeurs?.heures ?? 0,
                   lecons: valeurs?.lecons ?? 0, quiz: valeurs?.quiz ?? 0 }
    });
  });
}
