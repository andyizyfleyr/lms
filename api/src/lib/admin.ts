/* Rôle d'administration : une seule définition, réutilisée par toutes les routes de la console. */
import { auth, forbidden } from './http';
import type { Session } from './auth';

export async function estAdmin(req: Request, moderationSeule = false): Promise<{ error: Response } | { session: Session }> {
  const a = await auth(req);
  if ('error' in a) return { error: a.error };
  const u = a.session.user;
  const autorise = moderationSeule
    ? (u.role === 'admin' || u.role === 'enseignant' || u.moderateur === true)
    : u.role === 'admin';
  if (!autorise) {
    return { error: forbidden(moderationSeule ? 'Action réservée à la modération' : 'Action réservée à l\'administration') };
  }
  return { session: a.session };
}

export const THEMES_FORUM = ['general', 'saponification', 'emulsion', 'conservation', 'etiquetage', 'vente'] as const;
