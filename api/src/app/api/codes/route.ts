import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, OPTIONS, handler } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

type Code = {
  code: string; libelle: string; genre: string; valeur: number; course_id: string | null;
  utilisations_max: number; utilisations: number; expire_le: string | null; actif: boolean;
  created_at: string; cours_titre?: string | null;
};

const propre = (c: Code) => ({
  code: c.code, libelle: c.libelle, genre: c.genre, valeur: c.valeur, courseId: c.course_id,
  coursTitre: c.cours_titre || '', utilisations: c.utilisations, utilisationsMax: c.utilisations_max,
  expireLe: c.expire_le, actif: c.actif, creeLe: c.created_at
});

/**
 * GET /api/codes — les codes que j'ai créés (formateur / admin)
 * ou, pour un apprenant, ceux qu'il a déjà utilisés.
 */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const prof = a.session.user.role === 'enseignant' || a.session.user.role === 'admin';
    if (prof) {
      const rows = await q<Code>(
        `select cp.*, c.titre as cours_titre from codes_promo cp
           left join courses c on c.id = cp.course_id
          where cp.cree_par = $1 or $2 = 'admin'
          order by cp.created_at desc limit 100`,
        [uid, a.session.user.role]
      );
      return ok({ codes: rows.map(propre), mesCodes: rows.map(propre), role: a.session.user.role });
    }
    const rows = await q<Code>(
      `select cp.*, c.titre as cours_titre from codes_promo cp
         left join courses c on c.id = cp.course_id
         join code_utilisations cu on cu.code = cp.code and cu.user_id = $1
        order by cu.created_at desc`,
      [uid]
    );
    return ok({ codes: rows.map(propre), mesCodes: [], role: a.session.user.role });
  });
}

/** POST /api/codes — créer un code (formateur / admin). */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    let b: { code?: string; libelle?: string; genre?: string; valeur?: number; courseId?: string;
             utilisationsMax?: number; jours?: number } = {};
    try { b = await req.json(); } catch { /* corps vide */ }

    const genre = b.genre === 'acces' ? 'acces' : 'reduction';
    const valeur = Math.max(0, Math.min(100, Math.round(Number(b.valeur) || 0)));
    const max = Math.max(0, Math.min(10000, Math.round(Number(b.utilisationsMax) || 0)));
    const auto = () => {
      const car = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let s = '';
      for (let i = 0; i < 6; i++) s += car[Math.floor(Math.random() * car.length)];
      return s;
    };
    let code = String(b.code || auto()).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (code.length < 3) code = auto();
    if (genre === 'acces' && !b.courseId) return fail('Un accès offert doit viser un cours', 400);
    if (genre === 'reduction' && valeur <= 0) return fail('Indiquez un pourcentage de réduction', 400);

    const jours = Math.max(0, Math.min(3650, Math.round(Number(b.jours) || 0)));
    const expire = jours ? new Date(Date.now() + jours * 86400_000).toISOString() : null;

    const existe = await q1<{ n: number }>(`select count(*)::int as n from codes_promo where code = $1`, [code]);
    if (existe && existe.n) return fail('Ce code existe déjà — choisissez-en un autre', 409);

    const row = await q1<Code>(
      `insert into codes_promo (code, libelle, genre, valeur, course_id, utilisations_max, expire_le, cree_par)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [code, String(b.libelle || '').slice(0, 120), genre, valeur, b.courseId || null, max, expire, a.session.user.id]
    );
    return ok({ code: row ? propre(row) : null }, 201);
  });
}

/** DELETE /api/codes?code=XXXX — désactiver un code que j'ai créé. */
export async function DELETE(req: Request) {
  return handler(async () => {
    const a = await auth(req, ['enseignant', 'admin']);
    if ('error' in a) return a.error;
    const code = (new URL(req.url).searchParams.get('code') || '').toUpperCase();
    if (!code) return fail('Code manquant', 400);
    const n = await exec(
      `update codes_promo set actif = false where code = $1 and (cree_par = $2 or $3 = 'admin')`,
      [code, a.session.user.id, a.session.user.role]
    );
    return ok({ desactive: n > 0 });
  });
}
