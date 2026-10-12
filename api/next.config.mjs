import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICI = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // L'application peut aussi être servie depuis un AUTRE domaine (site statique
  // Netlify, GitHub Pages, site Vercel séparé, copie locale…) : on autorise donc
  // les appels depuis n'importe quelle origine, avec des en-têtes explicites.
  // Les pré-vols OPTIONS sont exportés par chaque route (44 routes) via src/lib/http.ts.

  // Déploiement « tout sur une seule adresse » : l'application (fichier unique)
  // est servie sur / et l'API sur /api/*, dans le même projet Vercel.
  // public/index.html est une copie publiée de web/index.html
  // (régénérée par : node api/scripts/sync-site.js).
  // La documentation de l'API reste disponible sur /api-doc.
  async rewrites() {
    /* Chaque écran de l'application a sa propre adresse : /cours/c1, /notifications,
       /quiz/c1, /formateur/apprenants… Le serveur répond à chacune d'elles avec
       l'application (public/index.html), qui ouvre l'écran demandé. La liste vit
       dans web/src/routes.json → api/routes-site.json (copiée par sync-site.js) :
       le serveur et l'application ne peuvent donc pas diverger.
       Les adresses inconnues ne sont pas réécrites : Next.js renvoie un vrai 404. */
    const adresses = JSON.parse(readFileSync(join(ICI, 'routes-site.json'), 'utf8'));
    return adresses.map(a => ({ source: a.motif, destination: '/index.html' }));
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' }
        ]
      }
    ];
  }
};

export default config;
