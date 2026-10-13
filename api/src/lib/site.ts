/** Adresse publique du site (Vercel, ou variable d'environnement). */
export function SITE(): string {
  const v = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lms-lovat-five.vercel.app';
  return v.replace(/\/+$/, '');
}
