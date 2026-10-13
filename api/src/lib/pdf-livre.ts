/* ============================================================
   LIVRES PDF — assemblage
   Un livre = le programme du cours + les chapitres écrits + les
   questions du quiz + les recettes de base + les fiches à imprimer.
   Rien n'est inventé : le programme et les questions viennent de la
   base, les tables du tableau des huiles, tout le reste du texte est
   écrit une fois dans `pdf-contenu.ts`.
   ============================================================ */

import { q, q1, exec } from './db';
import { Bloc, composerPDF, mesurerPDF, Mesure } from './pdf';
import {
  COMMUN, THEMES, HUILES, DENSITES, CHECKLIST_ETIQUETTE, RECETTES_BASE, FICHES, Chapitre
} from './pdf-contenu';

export type LignePdf = {
  id: string; titre: string; sous_titre: string; description: string; sommaire: string[];
  pages: number; prix: number; gratuit: boolean; accent: string; ico: string; couverture: string;
  extrait: string; niv: string; publie: boolean; ordre: number; source: string; genre: string;
};

type Lecon = { module_titre: string; module_ordre: number; ordre: number; titre: string; duree_label: string; kind: string };
type Question = { enonce: string; explication: string; options: Array<{ texte: string; correct: boolean }> };

export const listePdf = (uid: string | null) =>
  q<LignePdf & { possede: boolean }>(
    `select p.*, ($1::uuid is not null and exists (
        select 1 from pdf_acces a where a.pdf_id = p.id and a.user_id = $1::uuid)) as possede
       from pdfs p where p.publie order by p.ordre, p.titre`,
    [uid]
  );

export const pdfParId = (id: string) =>
  q1<LignePdf>('select * from pdfs where id = $1', [id]);

/* Les formateurs et l'administration lisent la bibliothèque entière :
   même règle que pour les cours, ils n'ont pas à acheter leurs propres ouvrages. */
const bibliothequeLibre = async (uid: string) => {
  const u = await q1<{ role: string }>('select role from users where id = $1', [uid]);
  return !!u && (u.role === 'admin' || u.role === 'enseignant');
};

export const accesPdf = async (uid: string, id: string) => {
  if (await bibliothequeLibre(uid)) return true;
  const a = await q1<{ pdf_id: string }>('select pdf_id from pdf_acces where user_id = $1 and pdf_id = $2', [uid, id]);
  if (a) return true;
  const p = await q1<{ gratuit: boolean }>('select gratuit from pdfs where id = $1', [id]);
  return !!p?.gratuit;
};

export const accesPdfListe = async (uid: string): Promise<string[]> => {
  const tous = await q<{ id: string }>('select id from pdfs where publie');
  if (await bibliothequeLibre(uid)) return tous.map(x => x.id);
  const r = await q<{ pdf_id: string }>('select pdf_id from pdf_acces where user_id = $1', [uid]);
  const g = await q<{ id: string }>('select id from pdfs where gratuit');
  return Array.from(new Set(r.map(x => x.pdf_id).concat(g.map(x => x.id))));
};

export const deverrouillerPdf = async (uid: string, ids: string[], orderId: string | null, source = 'achat') => {
  for (const id of ids) {
    await exec(
      `insert into pdf_acces (user_id, pdf_id, order_id, source) values ($1, $2, $3, $4)
       on conflict (user_id, pdf_id) do nothing`,
      [uid, id, orderId, source]
    );
  }
};

/* ------------------------------------------------------------ données du cours */
async function contexte(source: string) {
  const cours = source
    ? await q1<{ id: string; titre: string; description: string; prof: string; duree_label: string; categorie: string }>(
        'select id, titre, description, prof, duree_label, categorie from courses where id = $1', [source])
    : null;
  const lecons = source
    ? await q<Lecon>(
        `select module_titre, module_ordre, ordre, titre, duree_label, kind from lessons
          where course_id = $1 order by module_ordre, ordre`, [source])
    : [];
  const questions: Question[] = source
    ? await q<Question>(
        `select qq.enonce, qq.explication,
                coalesce(json_agg(json_build_object('texte', qo.texte, 'correct', qo.correct) order by qo.ordre)
                         filter (where qo.id is not null), '[]') as options
           from quiz_questions qq
           join quizzes z on z.id = qq.quiz_id and z.course_id = $1
           left join quiz_options qo on qo.question_id = qq.id
          group by qq.id, qq.enonce, qq.explication, qq.ordre
          order by qq.ordre`, [source])
    : [];
  return { cours, lecons, questions };
}

/* ------------------------------------------------------------ mise en blocs */
const moduleDe = (lecons: Lecon[]) => {
  const mods: Array<{ titre: string; lecons: Lecon[] }> = [];
  for (const l of lecons) {
    const dernier = mods[mods.length - 1];
    if (!dernier || dernier.titre !== l.module_titre) mods.push({ titre: l.module_titre || 'Programme', lecons: [l] });
    else dernier.lecons.push(l);
  }
  return mods;
};

function blocsLivre(o: {
  pdf: LignePdf; proprio: string; date: string; site: string;
  cours: Awaited<ReturnType<typeof contexte>>['cours'];
  lecons: Lecon[]; questions: Question[];
  sommaire?: Array<{ texte: string; page: number }>;
}): Bloc[] {
  const b: Bloc[] = [];
  const themes: Chapitre[] = THEMES[o.pdf.source] || [];
  const commun = COMMUN[0];

  /* ---- couverture ---- */
  b.push({ t: 'espace', h: 90 });
  b.push({ t: 'sous', texte: 'COSMÉTILAB · COLLECTION COSMÉTIQUE ARTISANALE' });
  b.push({ t: 'espace', h: 10 });
  b.push({ t: 'titre', texte: o.pdf.titre });
  b.push({ t: 'sous', texte: o.pdf.sous_titre });
  b.push({ t: 'espace', h: 20 });
  b.push({ t: 'para', texte: o.pdf.description });
  b.push({ t: 'espace', h: 14 });
  b.push({
    t: 'encadre', titre: 'Cet exemplaire',
    lignes: [
      'Propriétaire : ' + o.proprio,
      'Édition du ' + o.date,
      o.cours ? 'Cours associé : ' + o.cours.titre + ' — formateur : ' + o.cours.prof : 'Ouvrage de la boutique CosmétiLab',
      'Exemplaire personnel : toute revente ou diffusion de ce fichier est interdite.'
    ]
  });
  b.push({ t: 'espace', h: 10 });
  b.push({ t: 'para', texte: 'CosmétiLab — la plateforme d\'apprentissage de la cosmétique artisanale. ' + o.site });

  /* ---- sommaire (repère de pages réel) ---- */
  if (o.sommaire && o.sommaire.length) {
    b.push({ t: 'chapitre', numero: 0, texte: 'Sommaire' });
    for (const l of o.sommaire) {
      b.push({ t: 'point', texte: l.texte + '  ' + '·'.repeat(Math.max(2, 58 - l.texte.length)) + '  page ' + l.page });
    }
  }

  /* ---- chapitres ---- */
  let n = 0;
  const chapitre = (c: Chapitre) => {
    n++;
    b.push({ t: 'chapitre', numero: n, texte: c.t });
    for (const p of c.paras) b.push({ t: 'para', texte: p });
    if (c.cles && c.cles.length) {
      b.push({ t: 'espace', h: 6 });
      b.push({ t: 'encadre', titre: 'À retenir', lignes: c.cles });
    }
    if (c.err && c.err.length) {
      b.push({ t: 'espace', h: 4 });
      b.push({ t: 'sous', texte: 'Erreurs à éviter' });
      for (const e of c.err) b.push({ t: 'point', texte: e, genre: 'attention' });
    }
  };

  chapitre(commun);

  /* le programme du cours, chapitre 2 des livres de cours */
  if (o.cours && o.lecons.length) {
    n++;
    b.push({ t: 'chapitre', numero: n, texte: 'Le programme du cours' });
    b.push({ t: 'para', texte: 'Voici le parcours complet, tel qu\'il apparaît en ligne. Chaque module se termine par un travail : c\'est ce travail qui transforme une lecture en savoir-faire.' });
    for (const m of moduleDe(o.lecons)) {
      b.push({ t: 'sous', texte: m.titre });
      for (const l of m.lecons) {
        const type = l.kind === 'video' ? 'vidéo' : l.kind === 'exercice' ? 'exercice' : l.kind === 'quiz' ? 'quiz' : 'lecture';
        b.push({ t: 'point', texte: l.titre + (l.duree_label ? '  (' + l.duree_label + ', ' + type + ')' : '') });
      }
      b.push({ t: 'espace', h: 4 });
    }
  }

  for (const c of COMMUN.slice(1)) chapitre(c);

  /* chapitre des conversions : le tableau des densités est utile juste après */
  if (n >= 1 && o.pdf.genre === 'cours') {
    b.push({ t: 'sous', texte: 'Tableau des densités (volume → poids)' });
    b.push({ t: 'tableau', entetes: ['Matière', 'Densité', '100 ml pèsent'],
      lignes: DENSITES.map(d => [d.nom, String(d.d), Math.round(d.d * 100) + ' g']),
      largeurs: [0.5, 0.25, 0.25] });
  }

  for (const c of themes) chapitre(c);

  /* questions du quiz du cours, avec la correction */
  if (o.questions.length) {
    n++;
    b.push({ t: 'chapitre', numero: n, texte: 'Questions du cours et corrections' });
    b.push({ t: 'para', texte: 'Ces questions viennent du quiz en ligne. Répondez d\'abord sur un papier, puis lisez la correction : c\'est l\'explication qui fait apprendre, pas la note.' });
    let i = 0;
    for (const quest of o.questions) {
      i++;
      b.push({ t: 'sous', texte: 'Question ' + i + '. ' + quest.enonce });
      for (const opt of quest.options || []) b.push({ t: 'puce', texte: opt.texte });
      const bonne = (quest.options || []).find(x => x.correct);
      b.push({ t: 'point', texte: 'Bonne réponse : ' + (bonne ? bonne.texte : 'voir le cours'), genre: 'ok' });
      if (quest.explication) b.push({ t: 'para', texte: quest.explication });
      b.push({ t: 'espace', h: 4 });
    }
  }

  /* recettes de base */
  const recettes = RECETTES_BASE[o.pdf.source] || (o.pdf.genre === 'recueil' ? RECETTES_BASE.recettes : []);
  if (recettes.length) {
    n++;
    b.push({ t: 'chapitre', numero: n, texte: 'Recettes de base' });
    b.push({ t: 'para', texte: 'Chaque recette est donnée en pourcentages : pour changer la taille du lot, multipliez toutes les lignes par le même nombre. Les grammes exacts se calculent dans l\'application (Formulation, Saponification).' });
    for (const r of recettes) {
      b.push({ t: 'sous', texte: r.nom });
      b.push({ t: 'para', texte: r.lot });
      b.push({ t: 'tableau', entetes: ['Ingrédient', '%'], largeurs: [0.8, 0.2],
        lignes: r.ing.map(([nom, pct]) => [nom, String(pct) + ' %']) });
      r.mode.forEach((etape, i) => b.push({ t: 'point', texte: (i + 1) + '. ' + etape }));
      if (r.astuce) b.push({ t: 'encadre', titre: 'Le conseil de l\'atelier', lignes: [r.astuce] });
      b.push({ t: 'espace', h: 6 });
    }
  }

  /* fiches à imprimer */
  n++;
  b.push({ t: 'chapitre', numero: n, texte: 'Fiches à imprimer' });
  b.push({ t: 'para', texte: 'Ces pages sont faites pour être imprimées, pliées et gardées près du plan de travail. Elles remplacent les notes griffonnées sur un coin de cahier.' });

  b.push({ t: 'sous', texte: 'Tableau des huiles (indices et qualités)' });
  b.push({ t: 'para', texte: 'Indice SAP en grammes de soude par gramme d\'huile. Dur = dureté, Net = pouvoir nettoyant, Cond = conditionnement, Mouss = mousse, Crém = crémeux, Max = pourcentage maximum conseillé.' });
  b.push({ t: 'tableau',
    entetes: ['Huile', 'SAP', 'Dur', 'Net', 'Cond', 'Mouss', 'Crém', 'Max'],
    largeurs: [0.34, 0.10, 0.09, 0.09, 0.09, 0.10, 0.09, 0.10],
    lignes: HUILES.map(h => [h.nom, h.sap.toFixed(3), String(h.dur), String(h.net), String(h.cond), String(h.mousse), String(h.cremeux), h.max + ' %']) });
  b.push({ t: 'para', texte: 'Prix indicatifs (F CFA les 1 000 g) : ' +
    HUILES.map(h => h.nom + ' ' + h.prix).join(' · ') + '. Remplacez-les par vos prix d\'achat réels dans le calcul du coût de revient.' });

  b.push({ t: 'sous', texte: 'Checklist d\'étiquetage (16 points)' });
  b.push({ t: 'tableau', entetes: ['Point', 'Ce qu\'il faut écrire'],
    largeurs: [0.34, 0.66],
    lignes: CHECKLIST_ETIQUETTE.map(c => [c.t, c.d]) });

  for (const f of FICHES) {
    b.push({ t: 'espace', h: 8 });
    b.push({ t: 'sous', texte: f.titre });
    for (const l of f.lignes) b.push({ t: 'point', texte: l });
  }

  return b;
}

/* ------------------------------------------------------------ fabrication */
export async function fabriquerLivre(o: { pdf: LignePdf; proprio: string; site: string; date: string }): Promise<{ fichier: Buffer; pages: number }> {
  const ctx = await contexte(o.pdf.source || '');
  const entete = { pdf: o.pdf, proprio: o.proprio, date: o.date, site: o.site,
                   cours: ctx.cours, lecons: ctx.lecons, questions: ctx.questions,
                   sommaire: undefined as undefined | Array<{ texte: string; page: number }> };

  /* 1er passage : on mesure pour connaître les pages de chaque chapitre */
  const mesure: Mesure = mesurerPDF({ titre: o.pdf.titre, pied: 'CosmétiLab · ' + o.pdf.titre, blocs: blocsLivre(entete) });

  /* 2e passage : avec un vrai sommaire (numéroté) */
  /* le sommaire occupe lui-même une page : les chapitres décalent d'une page.
     On mesure deux fois pour que les numéros affichés soient exacts. */
  const sommaire = mesure.chapitres.map(c => ({ texte: c.texte, page: c.page + 1 }));
  const blocs = blocsLivre(Object.assign({}, entete, { sommaire }));
  const fichier = composerPDF({ titre: o.pdf.titre, pied: 'CosmétiLab · ' + o.pdf.titre, blocs });
  const final = mesurerPDF({ titre: o.pdf.titre, pied: 'CosmétiLab · ' + o.pdf.titre, blocs });
  return { fichier, pages: final.pages };
}

/** Génère (ou régénère) le fichier d'un ouvrage et met à jour son nombre de pages. */
export async function genererPdf(id: string, proprio: string, site: string) {
  const pdf = await pdfParId(id);
  if (!pdf) return null;
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const r = await fabriquerLivre({ pdf, proprio, site, date });
  await exec('update pdfs set pages = $2 where id = $1', [id, r.pages]);
  return { pdf, ...r };
}
