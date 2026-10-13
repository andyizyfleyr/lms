/* ============================================================
   ACCÈS AUX FICHIERS PDF — jeton signé
   Le navigateur ne peut pas envoyer d'en-tête d'authentification en
   ouvrant un fichier dans un nouvel onglet : on signe donc une URL
   courte durée (HMAC-SHA256), qui ne donne accès qu'à cet ouvrage-là,
   pour ce compte-là, pendant quelques minutes.
   ============================================================ */

import crypto from 'node:crypto';

const SECRET = process.env.PDF_SECRET
  || (process.env.NOVA_WEBHOOK_SECRET || 'cosmetilab-local') + ':pdf';

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const signature = (charge: string) => crypto.createHmac('sha256', SECRET).update(charge).digest('base64url');

export function signerPdf(uid: string, pdfId: string, minutes = 30): string {
  const exp = Date.now() + minutes * 60_000;
  const charge = uid + '|' + pdfId + '|' + exp;
  return b64(charge) + '.' + signature(charge);
}

export function verifierJeton(jeton: string, pdfId: string): { uid: string } | null {
  try {
    const [p, sig] = jeton.split('.');
    if (!p || !sig) return null;
    const charge = Buffer.from(p, 'base64url').toString('utf8');
    const [uid, id, exp] = charge.split('|');
    if (id !== pdfId) return null;
    if (Number(exp) < Date.now()) return null;
    const attendu = signature(charge);
    if (attendu.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(attendu), Buffer.from(sig))) return null;
    return { uid };
  } catch {
    return null;
  }
}
