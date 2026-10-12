/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // L'application HTML (fichier unique) est servie depuis un autre domaine
  // (site Vercel statique, Netlify, file://, aperçu local…).
  // → on autorise les appels API depuis n'importe quelle origine, avec en-têtes explicites.
  // Les pré-vols OPTIONS sont exportés par chaque route (45 routes) via src/lib/http.ts.
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
