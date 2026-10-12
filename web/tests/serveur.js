#!/usr/bin/env node
/* ============================================================
   Serveur de fichiers statiques — aperçu local et base des tests.

   L'application est un fichier unique : ce serveur ne fait que le
   distribuer en HTTP, comme le feront Vercel, Netlify ou GitHub Pages.

   Utilisation :
     node tests/serveur.js            → http://localhost:8000/index.html
     node tests/serveur.js 3001       → autre port
   Ou depuis un autre script :
     const { demarrer } = require('./tests/serveur');
     const s = await demarrer('/chemin/vers/web', 0);   // port libre choisi par l'OS
     … s.url … ; s.fermer();
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

/** Démarre le serveur ; renvoie { url, port, serveur, fermer() }. */
function demarrer(racine, port = 0, hote = '127.0.0.1') {
  return new Promise((resoudre, rejeter) => {
    const serveur = http.createServer((req, rep) => {
      let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (chemin.endsWith('/')) chemin += 'index.html';
      const fichier = path.join(racine, path.normalize(chemin).replace(/^(\.\.[/\\])+/, ''));
      if (!fichier.startsWith(racine)) { rep.writeHead(403).end('Interdit'); return; }
      fs.readFile(fichier, (err, contenu) => {
        if (err) { rep.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 — ' + chemin); return; }
        rep.writeHead(200, {
          'Content-Type': TYPES[path.extname(fichier).toLowerCase()] || 'application/octet-stream',
          'Content-Length': contenu.length,
          'Cache-Control': 'no-store'
        });
        rep.end(contenu);
      });
    });
    serveur.on('error', rejeter);
    serveur.listen(port, hote, () => {
      const p = serveur.address().port;
      resoudre({
        url: 'http://' + hote + ':' + p,
        port: p,
        serveur,
        fermer: () => new Promise(r => serveur.close(r))
      });
    });
  });
}

if (require.main === module) {
  const port = Number(process.argv[2] || 8000);
  demarrer(path.join(__dirname, '..'), port, '0.0.0.0').then(s => {
    console.log('Aperçu LearnHub : http://localhost:' + s.port + '/index.html');
    console.log('(Ctrl+C pour arrêter)');
  });
}

module.exports = { demarrer };
