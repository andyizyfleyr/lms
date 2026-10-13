/* ============================================================
   MOTEUR PDF — CosmétiLab
   Écrit un vrai PDF (1.4) sans aucune dépendance : les livres de la
   boutique sont fabriqués ici, page par page, à partir des données
   du site (programme, quiz, tables d'huiles, recettes) et des textes
   pédagogiques de `pdf-contenu.ts`.

   Choix : A4 portrait (595 × 842 points), polices de base Helvetica
   (toujours présentes dans les lecteurs), encodage WinAnsi pour les
   accents français. Aucun fichier externe, aucun appel réseau.
   ============================================================ */

export type Bloc =
  | { t: 'titre'; texte: string }
  | { t: 'sous'; texte: string }
  | { t: 'chapitre'; numero: number; texte: string }
  | { t: 'para'; texte: string }
  | { t: 'puce'; texte: string }
  | { t: 'point'; texte: string; genre?: 'ok' | 'attention' | 'info' }
  | { t: 'encadre'; titre: string; lignes: string[] }
  | { t: 'tableau'; entetes: string[]; lignes: string[][]; largeurs?: number[] }
  | { t: 'espace'; h: number }
  | { t: 'regle' }
  | { t: 'page' };

const L = 595.28, H = 841.89, MARGE = 56, BAS = 74;
const NOIR = '0.10 0.10 0.12', VIOLET = '0.404 0.314 0.643', GRIS = '0.42 0.42 0.46';

/* WinAnsi : les caractères typographiques français doivent devenir un octet.
   Le fichier est ensuite encodé en Latin-1, donc chaque octet reste tel quel. */
const REMPLACEMENTS: Array<[RegExp, string]> = [
  [/[\u2019\u2018\u02bc]/g, '\x92'],
  [/[\u201c\u201d]/g, '\x94'],
  [/[\u2013]/g, '\x96'],
  [/[\u2014]/g, '\x97'],
  [/[\u2026]/g, '\x85'],
  [/[\u2022]/g, '\x95'],
  [/[\u20ac]/g, '\x80'],
  [/[\u00a0\u202f\u2009]/g, ' '],
  [/[\u2192\u279c]/g, '->'],
  [/[\u00b7\u30fb]/g, '\xb7'],
  [/[^\x00-\xff]/g, '']
];

const octets = (s: string): Buffer => {
  let t = s;
  for (const [r, v] of REMPLACEMENTS) t = t.replace(r, v);
  return Buffer.from(t, 'latin1');
};

const echapper = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/** Largeur approchée d'un texte (Helvetica ≈ 0,5 em par caractère). */
const largeur = (s: string, taille: number, gras = false) => s.length * taille * (gras ? 0.53 : 0.5);

/** Découpe un texte en lignes qui tiennent dans `w` points. */
function couper(texte: string, w: number, taille: number, gras = false): string[] {
  const mots = String(texte).split(/\s+/).filter(Boolean);
  const lignes: string[] = [];
  let courant = '';
  for (const mot of mots) {
    const essai = courant ? courant + ' ' + mot : mot;
    if (largeur(essai, taille, gras) <= w) { courant = essai; continue; }
    if (courant) lignes.push(courant);
    /* un mot plus long que la ligne est coupé à la dure */
    let reste = mot;
    while (largeur(reste, taille, gras) > w && reste.length > 4) {
      let n = Math.max(4, Math.floor(w / (taille * 0.5)));
      lignes.push(reste.slice(0, n));
      reste = reste.slice(n);
    }
    courant = reste;
  }
  if (courant) lignes.push(courant);
  return lignes.length ? lignes : [''];
}

type Ctx = {
  pages: string[][];
  page: string[];
  y: number;
  titre: string;
  pied: string;
  /** en mode « mesure », on ne construit pas le fichier : on compte les pages
      et on relève la page de départ de chaque chapitre (pour le sommaire). */
  mesure?: boolean;
  /** la page en cours a-t-elle reçu quelque chose ? (vrai dans les deux modes) */
  ecrit?: boolean;
  numPage: number;
  chapitres: Array<{ texte: string; page: number }>;
};

const op = (c: Ctx, s: string) => { c.ecrit = true; if (!c.mesure) c.page.push(s); };

function nouvellePage(c: Ctx) {
  if (c.ecrit) {
    if (!c.mesure) c.pages.push(c.page);
    c.numPage++;
  }
  c.page = [];
  c.ecrit = false;
  c.y = H - MARGE - 12;
}

function place(c: Ctx, h: number) {
  if (c.y - h < BAS) nouvellePage(c);
}

function texte(c: Ctx, s: string, o: {
  taille?: number; gras?: boolean; italique?: boolean; x?: number; w?: number;
  couleur?: string; interligne?: number;
} = {}) {
  const taille = o.taille ?? 10.5;
  const w = o.w ?? (L - 2 * MARGE);
  const x = o.x ?? MARGE;
  const inter = o.interligne ?? taille * 1.45;
  const police = o.gras ? '/F2' : o.italique ? '/F3' : '/F1';
  for (const ligne of couper(s, w, taille, o.gras)) {
    place(c, inter);
    op(c, `BT ${o.couleur || NOIR} rg ${police} ${taille} Tf 1 0 0 1 ${x.toFixed(1)} ${c.y.toFixed(1)} Tm (${echapper(ligne)}) Tj ET`);
    c.y -= inter;
  }
  c.y -= 2;
}

function filet(c: Ctx, epaisseur = 0.8, couleur = GRIS, x = MARGE, w = L - 2 * MARGE) {
  place(c, 8);
  c.y -= 2;
  op(c, `q ${couleur} RG ${epaisseur} w ${x} ${c.y.toFixed(1)} m ${(x + w).toFixed(1)} ${c.y.toFixed(1)} l S Q`);
  c.y -= 8;
}

function encadre(c: Ctx, titre: string, lignes: string[]) {
  const w = L - 2 * MARGE;
  const inter = 10 * 1.42;
  let h = 16;
  for (const l of lignes) h += couper(l, w - 26, 10).length * inter + 2;
  h += 10;
  place(c, h + 6);
  const haut = c.y + 6;
  op(c, `q 0.957 0.949 0.984 rg 0 0 0 rg ${MARGE} ${(haut - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f Q`);
  op(c, `q ${VIOLET} RG 1.6 w ${MARGE + 1} ${(haut - h + 1).toFixed(1)} m ${MARGE + 1} ${(haut - 1).toFixed(1)} l S Q`);
  const x = MARGE + 12;
  c.y = haut - 12;
  texte(c, titre, { taille: 11, gras: true, x, w: w - 24, couleur: VIOLET, interligne: 14 });
  for (const l of lignes) texte(c, l, { taille: 10, x, w: w - 24, interligne: inter });
  c.y -= 8;
}

function tableau(c: Ctx, entetes: string[], lignes: string[][], largeurs?: number[]) {
  const w = L - 2 * MARGE;
  const n = entetes.length;
  const parts = largeurs && largeurs.length === n ? largeurs : new Array(n).fill(1 / n);
  const cols = parts.map(p => p * w);
  const xs: number[] = [];
  let acc = MARGE;
  for (const cw of cols) { xs.push(acc); acc += cw; }

  const ligne = (cellules: string[], gras: boolean, taille: number) => {
    const hauteurs = cellules.map((v, i) => couper(String(v), cols[i] - 8, taille, gras).length * (taille * 1.35));
    const h = Math.max(...hauteurs, taille * 1.5) + 6;
    place(c, h);
    c.y -= h;
    if (gras) op(c, `q 0.925 0.914 0.960 rg ${MARGE} ${c.y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f Q`);
    cellules.forEach((v, i) => {
      const ls = couper(String(v), cols[i] - 8, taille, gras);
      let yy = c.y + h - 4 - taille;
      for (const l of ls) {
        op(c, `BT ${gras ? VIOLET : NOIR} rg ${gras ? '/F2' : '/F1'} ${taille} Tf 1 0 0 1 ${(xs[i] + 4).toFixed(1)} ${yy.toFixed(1)} Tm (${echapper(l)}) Tj ET`);
        yy -= taille * 1.35;
      }
      if (i > 0) op(c, `q 0.85 0.85 0.87 RG 0.6 w ${xs[i].toFixed(1)} ${c.y.toFixed(1)} m ${xs[i].toFixed(1)} ${(c.y + h).toFixed(1)} l S Q`);
    });
    op(c, `q 0.85 0.85 0.87 RG 0.6 w ${MARGE} ${c.y.toFixed(1)} m ${(MARGE + w).toFixed(1)} ${c.y.toFixed(1)} l S Q`);
  };

  ligne(entetes, true, 10);
  for (const l of lignes) ligne(l, false, 9.6);
  c.y -= 8;
}

function dessinerPage(c: Ctx, contenu: string[], index: number, total: number, pied: string, titre: string) {
  const t = octets(titre).toString('latin1');
  const p = octets(pied + '  ·  page ' + (index + 1) + ' / ' + total).toString('latin1');
  contenu.push(`q 0.85 0.85 0.87 RG 0.6 w ${MARGE} 0 ${L - 2 * MARGE} 56  re S Q`);
  contenu.push(`BT ${GRIS} rg /F1 8 Tf 1 0 0 1 ${MARGE} 38 Tm (${echapper(t)}) Tj ET`);
  contenu.push(`BT ${GRIS} rg /F1 8 Tf 1 0 0 1 ${MARGE} 26 Tm (${echapper(p)}) Tj ET`);
}

export type Mesure = { pages: number; chapitres: Array<{ texte: string; page: number }> };

/** Compose le PDF complet à partir d'une suite de blocs. */
export function composerPDF(o: { titre: string; pied: string; blocs: Bloc[] }): Buffer {
  const c: Ctx = { pages: [], page: [], y: H - MARGE - 12, titre: o.titre, pied: o.pied,
                   numPage: 0, chapitres: [], ecrit: false };

  let premier = true;
  for (const b of o.blocs) {
    switch (b.t) {
      case 'page': if (!premier) nouvellePage(c); break;
      case 'titre':
        place(c, 46);
        texte(c, b.texte, { taille: 24, gras: true, interligne: 30 });
        c.y -= 4; filet(c, 1.4, VIOLET); c.y -= 4;
        break;
      case 'sous':
        texte(c, b.texte, { taille: 13, gras: true, couleur: VIOLET, interligne: 19 });
        break;
      case 'chapitre':
        if (!premier) nouvellePage(c);
        c.chapitres.push({ texte: b.texte, page: c.numPage + 1 });
        c.y = H - MARGE - 26;
        texte(c, 'Chapitre ' + b.numero, { taille: 9.5, gras: true, couleur: GRIS });
        texte(c, b.texte, { taille: 19, gras: true, interligne: 25 });
        filet(c, 1, VIOLET);
        c.y -= 6;
        break;
      case 'para':
        texte(c, b.texte);
        break;
      case 'puce':
        place(c, 16);
        texte(c, '•  ' + b.texte, { x: MARGE, w: L - 2 * MARGE });
        break;
      case 'point': {
        const marque = b.genre === 'attention' ? '!  ' : b.genre === 'info' ? '>  ' : '+  ';
        texte(c, marque + b.texte, { couleur: b.genre === 'attention' ? '0.62 0.20 0.20' : NOIR });
        break;
      }
      case 'encadre':
        encadre(c, b.titre, b.lignes);
        break;
      case 'tableau':
        tableau(c, b.entetes, b.lignes, b.largeurs);
        break;
      case 'regle':
        filet(c);
        break;
      case 'espace':
        c.y -= b.h;
        break;
    }
    premier = false;
  }
  if (c.page.length) c.pages.push(c.page);

  /* ---- assemblage du fichier ---- */
  const morceaux: Buffer[] = [];
  let position = 0;
  const decalages: number[] = [];
  const ajouter = (s: string | Buffer) => {
    const b = typeof s === 'string' ? octets(s) : s;
    morceaux.push(b);
    position += b.length;
  };
  const objet = (num: number, contenu: string) => {
    decalages[num] = position;
    ajouter(num + ' 0 obj\n' + contenu + '\nendobj\n');
  };

  const total = c.pages.length;
  ajouter('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
  const idPolice = 3 + total * 2;
  const idsPage: number[] = [];
  c.pages.forEach((p, i) => idsPage.push(3 + i * 2));
  const idsContenu: number[] = [];
  c.pages.forEach((_, i) => idsContenu.push(4 + i * 2));

  objet(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objet(2, '<< /Type /Pages /Kids [' + idsPage.map(n => n + ' 0 R').join(' ') + '] /Count ' + total + ' >>');

  c.pages.forEach((p, i) => {
    const flux: string[] = p.slice();
    dessinerPage(c, flux, i, total, o.pied, o.titre);
    objet(idsPage[i], '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + L + ' ' + H + '] ' +
      '/Resources << /Font << /F1 ' + idPolice + ' 0 R /F2 ' + (idPolice + 1) + ' 0 R /F3 ' + (idPolice + 2) + ' 0 R >> >> /Contents ' + idsContenu[i] + ' 0 R >>');
    const corps = flux.join('\n');
    const b = octets(corps);
    decalages[idsContenu[i]] = position;
    ajouter(idsContenu[i] + ' 0 obj\n<< /Length ' + b.length + ' >>\nstream\n');
    ajouter(b);
    ajouter('\nendstream\nendobj\n');
  });

  objet(idPolice, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objet(idPolice + 1, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  objet(idPolice + 2, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

  const nbObjets = idPolice + 3;
  const debutXref = position;
  let xref = 'xref\n0 ' + nbObjets + '\n0000000000 65535 f \n';
  for (let n = 1; n < nbObjets; n++) {
    xref += String(decalages[n] || 0).padStart(10, '0') + ' 00000 n \n';
  }
  ajouter(xref);
  ajouter('trailer\n<< /Size ' + nbObjets + ' /Root 1 0 R >>\nstartxref\n' + debutXref + '\n%%EOF\n');

  return Buffer.concat(morceaux);
}

/** Passe les mêmes blocs en « mesure » : nombre de pages et page de chaque chapitre. */
export function mesurerPDF(o: { titre: string; pied: string; blocs: Bloc[] }): Mesure {
  const c: Ctx = { pages: [], page: [], y: H - MARGE - 12, titre: o.titre, pied: o.pied,
                   mesure: true, numPage: 0, chapitres: [], ecrit: false };
  let premier = true;
  for (const b of o.blocs) {
    switch (b.t) {
      case 'page': if (!premier) nouvellePage(c); break;
      case 'titre': place(c, 46); texte(c, b.texte, { taille: 24, gras: true, interligne: 30 });
        c.y -= 4; filet(c, 1.4, VIOLET); c.y -= 4; break;
      case 'sous': texte(c, b.texte, { taille: 13, gras: true, couleur: VIOLET, interligne: 19 }); break;
      case 'chapitre':
        if (!premier) nouvellePage(c);
        c.chapitres.push({ texte: b.texte, page: c.numPage + 1 });
        c.y = H - MARGE - 26;
        texte(c, 'Chapitre ' + b.numero, { taille: 9.5, gras: true, couleur: GRIS });
        texte(c, b.texte, { taille: 19, gras: true, interligne: 25 });
        filet(c, 1, VIOLET); c.y -= 6; break;
      case 'para': texte(c, b.texte); break;
      case 'puce': place(c, 16); texte(c, '•  ' + b.texte, { x: MARGE, w: L - 2 * MARGE }); break;
      case 'point': texte(c, '·  ' + b.texte); break;
      case 'encadre': encadre(c, b.titre, b.lignes); break;
      case 'tableau': tableau(c, b.entetes, b.lignes, b.largeurs); break;
      case 'regle': filet(c); break;
      case 'espace': c.y -= b.h; break;
    }
    premier = false;
  }
  return { pages: c.ecrit ? c.numPage + 1 : c.numPage, chapitres: c.chapitres };
}
