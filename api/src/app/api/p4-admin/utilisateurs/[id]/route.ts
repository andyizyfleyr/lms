import { z } from 'zod';
import { q1, q, exec } from '@/lib/db';
import { ok, fail, notFound, parseBody, OPTIONS, handler } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { estAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  role: z.enum(['etudiant', 'enseignant', 'admin']).optional(),
  moderateur: z.boolean().optional(),
  bloque: z.boolean().optional(),
  nom: z.string().trim().min(2).max(80).optional(),
  ville: z.string().trim().max(60).optional(),
  nouveauMotDePasse: z.string().min(6).max(200).optional()
});

/** PATCH /api/p4-admin/utilisateurs/{id} — rôle, modération, blocage, mot de passe.
 *  Chaque geste est journalisé : c'est le journal de sécurité du compte concerné. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handler(async () => {
    const a = await estAdmin(req);
    if ('error' in a) return a.error;
    const { id } = await params;
    const cible = await q1<{ id: string; nom: string; email: string; role: string; bloque: boolean; moderateur: boolean }>(
      'select id, nom, email, role, moderateur, bloque from users where id = $1', [id]);
    if (!cible) return notFound('Compte');
    if (cible.id === a.session.user.id && (cible.role === 'admin')) {
      const p0 = await parseBody(req, corps);
      if ('error' in p0) return p0.error;
      if (p0.data.bloque === true) return fail('Vous ne pouvez pas bloquer votre propre compte', 400);
      if (p0.data.role && p0.data.role !== 'admin') return fail('Vous ne pouvez pas retirer votre propre rôle d\'administration', 400);
    }
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;
    const journal: string[] = [];
    if (d.role && d.role !== cible.role) { journal.push('rôle : ' + cible.role + ' → ' + d.role); }
    if (d.moderateur !== undefined && d.moderateur !== cible.moderateur) journal.push(d.moderateur ? 'nommé modérateur' : 'retiré de la modération');
    if (d.bloque !== undefined && d.bloque !== cible.bloque) journal.push(d.bloque ? 'compte bloqué' : 'compte débloqué');
    if (d.nouveauMotDePasse) journal.push('mot de passe réinitialisé par l\'administration');

    await exec(
      `update users set role = coalesce($2, role), moderateur = coalesce($3, moderateur), bloque = coalesce($4, bloque),
              nom = coalesce($5, nom), ville = coalesce($6, ville), updated_at = now()
        where id = $1`,
      [id, d.role ?? null, d.moderateur ?? null, d.bloque ?? null, d.nom ?? null, d.ville ?? null]
    );
    if (d.nouveauMotDePasse) {
      await exec('update users set password_hash = $2 where id = $1', [id, hashPassword(d.nouveauMotDePasse)]);
      /* on coupe les sessions ouvertes : un mot de passe changé par l'admin doit
         obliger à se reconnecter */
      await exec('delete from auth_tokens where user_id = $1', [id]);
    }
    if (d.bloque === true) await exec('delete from auth_tokens where user_id = $1', [id]);

    for (const ligne of journal) {
      await exec(`insert into journal_securite (user_id, type, detail, appareil) values ($1, 'admin', $2, $3)`,
        [id, ligne, 'depuis la console d\'administration']);
    }
    const compte = await q1('select id, nom, email, role, moderateur, bloque, ville from users where id = $1', [id]);
    const securite = await q(`select type, detail, appareil, created_at from journal_securite where user_id = $1 order by created_at desc limit 20`, [id]);
    return ok({ compte, journal: securite, gestes: journal });
  });
}
