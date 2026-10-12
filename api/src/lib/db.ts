import { neon } from '@neondatabase/serverless';

/**
 * Client SQL Neon (pilote HTTP : parfait pour les fonctions serverless / Vercel).
 * On utilise la forme appelable : sql('select ...', [param]).
 */
const url = process.env.DATABASE_URL;
if (!url) console.warn('[cosmetilab] DATABASE_URL manquante : copiez .env.example en .env.local');

export const sql = neon(url || 'postgresql://user:pass@localhost/neondb');

/** Exécute une requête et renvoie les lignes (typées si besoin). */
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const rows = await sql(text, params as unknown[]);
  return (rows ?? []) as T[];
}

/** Exécute une requête et renvoie la première ligne (ou null). */
export async function q1<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows.length ? rows[0] : null;
}

/** Exécute une écriture et renvoie le nombre de lignes touchées (quand la requête les renvoie). */
export async function exec(text: string, params: unknown[] = []): Promise<number> {
  const rows = await q(text, params);
  return rows.length;
}
