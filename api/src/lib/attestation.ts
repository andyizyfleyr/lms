/* ============================================================
   Attestations vérifiables
   ------------------------------------------------------------
   Le numéro d'attestation est stable pour un couple (compte, cours) et
   porte le cours en clair, ce qui permet à n'importe qui — sans compte —
   de vérifier qu'une attestation est authentique : /verifier/CL-C1-XXXX
   ============================================================ */
const SOUS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function mot(n: number): string {
  let s = '';
  for (let i = 0; i < 4; i++) { s += SOUS[n % SOUS.length]; n = Math.floor(n / SOUS.length); }
  return s.toUpperCase();
}

/** Empreinte courte et stable d'un texte (aucune dépendance, reproductible). */
export function empreinte(txt: string): string {
  let h1 = 0x811c9dc5, h2 = 0x1000193;
  for (let i = 0; i < txt.length; i++) {
    h1 = ((h1 ^ txt.charCodeAt(i)) * 16777619) >>> 0;
    h2 = (h2 + txt.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return mot(h1) + '-' + mot(h2);
}

/** Partie vérifiable : 4 caractères qui ne dépendent que du compte et du cours. */
export const tagDe = (uid: string, courseId: string) => mot(empreinteNum(uid + '/' + courseId));

function empreinteNum(txt: string): number {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < txt.length; i++) h1 = ((h1 ^ txt.charCodeAt(i)) * 16777619) >>> 0;
  return h1;
}

/** Numéro imprimé sur l'attestation : CL-<COURS>-<TAG> (oui, vérifiable à l'œil). */
export const numeroDe = (uid: string, courseId: string) =>
  'CL-' + courseId.toUpperCase() + '-' + tagDe(uid, courseId);

/** Analyse inverse : /verifier/CL-C1-7F3A -> { cours: 'c1', tag: '7F3A' }. */
export function analyserNumero(numero: string): { cours: string; tag: string } | null {
  const n = String(numero || '').trim().toUpperCase().replace(/^CL-/, '');
  const p = n.split('-').filter(Boolean);
  if (p.length < 2) return null;
  const tag = p[p.length - 1];
  const cours = p.slice(0, -1).join('-').toLowerCase();
  if (!/^[A-Z0-9]{4}$/.test(tag) || !cours) return null;
  return { cours, tag };
}
