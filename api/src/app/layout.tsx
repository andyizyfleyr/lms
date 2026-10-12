import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'LearnHub API — Next.js + Neon',
  description: 'API REST complète du tableau de bord LMS LearnHub (cours, leçons, vidéos, quiz, devoirs, notes, agenda, badges).'
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#6750a4' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', background: '#f7f2fa', color: '#1d1b20' }}>
        {children}
      </body>
    </html>
  );
}
