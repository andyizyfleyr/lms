#!/usr/bin/env node
/* ------------------------------------------------------------
   Extrait les données de démonstration depuis les sources de l'application
   (../web/src/*.js) et écrit db/data.json.
   Utilisation : node scripts/extract-data.js
   C'est ce fichier que lit scripts/gen-seed.js pour produire db/seed.sql.
   ------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'web', 'src');
const SORTIE = path.join(__dirname, '..', 'db', 'data.json');

/** Lit un littéral de tableau/objet `const NOM = [...]` dans un fichier JS. */
function extraire(fichier, nom){
  const source = fs.readFileSync(path.join(SRC, fichier), 'utf8');
  const depart = source.indexOf('const ' + nom + ' =');
  if (depart < 0) throw new Error(nom + ' introuvable dans ' + fichier);
  const iTab = source.indexOf('[', depart), iObj = source.indexOf('{', depart);
  const estTableau = iTab >= 0 && (iObj < 0 || iTab < iObj);
  let i = estTableau ? iTab : iObj, profondeur = 0, j = i;
  for (; j < source.length; j++){
    const c = source[j];
    if (c === '[' || c === '{') profondeur++;
    else if (c === ']' || c === '}'){ profondeur--; if (!profondeur){ j++; break; } }
  }
  return eval('(' + source.slice(i, j) + ')');   // littéraux simples, sans dépendance
}

const donnees = {
  COURS:       extraire('app.js', 'COURS'),
  VIDEOS:      extraire('app.js', 'VIDEOS'),
  PROGRAMMES:  extraire('core.js', 'PROGRAMMES'),
  QUIZZES:     extraire('core.js', 'QUIZZES'),
  DEVOIRS:     extraire('core.js', 'DEVOIRS'),
  RESSOURCES:  extraire('core.js', 'RESSOURCES'),
  SESS:        extraire('core.js', 'SESS'),
  BADGES_DEF:  extraire('core.js', 'BADGES_DEF'),
  NOTIFS_SEED: extraire('core.js', 'NOTIFS_SEED'),
  DL_SEED:     extraire('core.js', 'DL_SEED'),
  DISC_SEED:   extraire('core.js', 'DISC_SEED'),
  FAQ:         extraire('core.js', 'FAQ')
};

fs.writeFileSync(SORTIE, JSON.stringify(donnees, null, 1) + '\n');
const resume = Object.keys(donnees).map(k => k + '=' + (Array.isArray(donnees[k]) ? donnees[k].length : Object.keys(donnees[k]).length));
console.log('db/data.json écrit (' + Math.round(fs.statSync(SORTIE).size / 1024) + ' Ko)');
console.log('  ' + resume.join(' '));
