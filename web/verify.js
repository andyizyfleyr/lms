#!/usr/bin/env node
/* ============================================================
   Contrôle du livrable : web/index.html
   • briques obligatoires présentes, aucune dépendance externe
   • anti-dérive : réassemble depuis src/ et vérifie que le fichier
     versionné est exactement le résultat des sources
   Utilisation : node verify.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ICI = __dirname;
const FICHIER = path.join(ICI, 'index.html');
const html = fs.readFileSync(FICHIER, 'utf8');

let ok = 0, ko = 0;
const test = (nom, condition, detail = '') => {
  console.log((condition ? '✅' : '❌') + ' ' + nom + (detail ? ' ⟵ ' + detail : ''));
  condition ? ok++ : ko++;
};

console.log('=== Contenu du livrable ===');
/* Le livrable reste un fichier unique : aucun script ni feuille de style externe.
   Seules les déclarations PWA (manifest, icônes, lien canonique) pointent vers
   des fichiers du même site — elles n'ajoutent aucune dépendance pour lire l'app. */
const externes = (html.match(/<script[^>]+src=|<link[^>]+href="(?!#)[^"]*/gi) || [])
  .filter(x => !/manifest\.webmanifest|apple-touch-icon|rel="icon"|rel="canonical"/i.test(x));
test('fichier unique et autonome', externes.length === 0,
     externes.length ? externes.slice(0, 3).join(' · ') : 'aucun script ni feuille externe');
test('aucune dépendance CDN', !/https?:\/\/(unpkg|cdn|jsdelivr)/i.test(html));
 test('contenu cosmétique', /const COURS\s*=\s*\[/.test(html) && /Savonnerie à froid/.test(html));
 test('comptes séparés et temps réel', /lh:u:/.test(html) && /\/api\/sync/.test(html));
const images = (html.match(/data:image\/(png|jpeg|webp);base64,/g) || []).length;
test('images en base64', images >= 10, images + ' images');
test('extrait vidéo intégré (MP4 + WebM)', /data:video\/mp4;base64,/.test(html) && /data:video\/webm;base64,/.test(html));
const icones = (html.match(/<symbol id="ic-/g) || []).length;
test('sprite d’icônes', icones >= 30, icones + ' icônes');
test('routeur de pages', /function pushPage\(/.test(html) && /function popPage\(/.test(html));
test('historique du navigateur', /addEventListener\('popstate'/.test(html));
test('lecteur YouTube + repli local', /YT\.Player/.test(html) && /CLIP_MP4/.test(html));
test('synchronisation API', /window\.LHSYNC/.test(html) && /\/api\/progress\?format=app/.test(html));
test('thème clair / sombre', /setTheme\(/.test(html));
test('persistance locale', /localStorage/.test(html));
test('taille maîtrisée (< 2,6 Mo)', html.length < 2_600_000, Math.round(html.length / 1024) + ' Ko');

console.log('\n=== Anti-dérive (sources → livrable) ===');
const os = require('os');
let tmp = path.join(os.tmpdir(), 'cosmetilab-index-' + process.pid + '.html');
try {
  execFileSync(process.execPath, [path.join(ICI, 'build.js'), tmp], { cwd: ICI, stdio: 'pipe' });
  const reconstruit = fs.readFileSync(tmp, 'utf8');
  test('index.html correspond aux sources', reconstruit === html,
       reconstruit === html ? 'réassemblage identique au fichier versionné'
                            : 'écart de ' + (reconstruit.length - html.length) + ' caractères → relancer build.js');
} catch (e) {
  test('réassemblage depuis src/', false, String(e.message).slice(0, 120));
} finally { try { fs.unlinkSync(tmp); } catch (_) {} }

console.log('\n' + ok + ' OK / ' + ko + ' échec(s)');
process.exit(ko ? 1 : 0);
