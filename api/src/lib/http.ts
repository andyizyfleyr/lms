import { NextResponse } from 'next/server';
import { ZodError, ZodTypeAny, z } from 'zod';
import { sessionFrom, Session } from './auth';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status, headers: CORS });
}

export function fail(message: string, status = 400, code = 'requete_invalide', details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status, headers: CORS });
}

export const unauthorized = () => fail('Authentification requise', 401, 'non_authentifie');
export const forbidden = (m = 'Action réservée aux enseignants') => fail(m, 403, 'interdit');
export const notFound = (quoi = 'Ressource') => fail(quoi + ' introuvable', 404, 'introuvable');

/** Options (pré-vol CORS) pour toutes les routes API. */
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Valide le corps JSON avec un schéma zod. Renvoie soit {data} soit {error}. */
export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<{ data: z.output<S> } | { error: ReturnType<typeof fail> }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: fail('Corps JSON illisible') };
  }
  try {
    return { data: schema.parse(raw) };
  } catch (e) {
    const err = e as ZodError;
    return { error: fail('Données invalides', 422, 'donnees_invalides',
      err.issues.map(i => ({ champ: i.path.join('.'), probleme: i.message }))) };
  }
}

/** Exige un utilisateur connecté. Renvoie soit {session} soit {error}. */
export async function auth(req: Request, roles?: Array<'etudiant' | 'enseignant' | 'admin'>): Promise<{ session: Session } | { error: ReturnType<typeof fail> }> {
  const session = await sessionFrom(req);
  if (!session) return { error: unauthorized() };
  if (roles && !roles.includes(session.user.role)) return { error: forbidden() };
  return { session };
}

/** Enveloppe : capture les erreurs inattendues et évite les 500 muets. */
export function handler(fn: () => Promise<Response>) {
  return fn().catch(e => {
    console.error('[cosmetilab] ' + (e instanceof Error ? e.message : String(e)));
    return fail('Erreur serveur : ' + (e instanceof Error ? e.message : 'inconnue'), 500, 'erreur_serveur');
  });
}
