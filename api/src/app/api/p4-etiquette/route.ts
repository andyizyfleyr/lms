import { z } from 'zod';
import { auth, ok, OPTIONS, handler } from '@/lib/http';
import { listeInci } from '@/lib/inci';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const corps = z.object({
  nom: z.string().trim().min(2).max(120).default('Produit'),
  fonction: z.string().trim().max(80).default('Soin cosmétique artisanal'),
  contenance: z.string().trim().max(40).default(''),
  lot: z.string().trim().max(40).default(''),
  fabrique: z.string().trim().max(20).default(''),
  pao: z.string().trim().max(10).default('6M'),
  responsable: z.string().trim().max(160).default(''),
  origine: z.string().trim().max(80).default('Fabriqué au Bénin'),
  ingredients: z.array(z.object({
    nom: z.string().trim().min(1).max(120),
    pourcent: z.number().min(0).max(100).default(0)
  })).min(1).max(40)
});

/** POST /api/p4-etiquette — noms INCI, ordre décroissant, allergènes et mentions
 *  obligatoires, à partir des ingrédients d'une recette. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    /* on accepte le corps brut : la route est aussi utile sans validation stricte */
    let brut: unknown;
    try { brut = await req.json(); } catch { brut = null; }
    const p = corps.safeParse(brut);
    if (!p.success) {
      return ok({
        erreur: 'Données incomplètes',
        details: p.error.issues.map(i => ({ champ: i.path.join('.'), probleme: i.message }))
      });
    }
    const d = p.data;
    const r = listeInci(d.ingredients);

    const mentions = [
      (d.nom || 'Produit') + ' — ' + (d.fonction || 'soin cosmétique'),
      r.liste || 'Aqua',
      d.contenance ? 'Contenance : ' + d.contenance : 'Contenance : … (à compléter)',
      d.lot ? 'Lot : ' + d.lot : 'Lot : …',
      d.fabrique ? 'Fabriqué le ' + d.fabrique : 'Fabriqué le : …',
      'PAO : ' + (d.pao || '6M') + ' (à utiliser dans les mois suivant l\'ouverture)',
      d.responsable ? 'Responsable : ' + d.responsable : 'Responsable : … (nom et ville)',
      d.origine,
      'Usage externe. Éviter le contact avec les yeux. Tenir hors de portée des enfants.',
      'Conserver à l\'abri de la chaleur et de la lumière (moins de 30 °C).'
    ];
    if (r.allergenes.length) {
      mentions.push('Allergènes déclarés : ' + r.allergenes.join(', ') + '.');
    }
    return ok({
      listeInci: r.liste, lignes: r.lignes, allergenes: r.allergenes, mentions,
      inconnus: r.inconnus,
      avertissement: r.inconnus.length
        ? 'Ces ingrédients n\'ont pas de correspondance INCI enregistrée : vérifiez-les avant l\'impression.'
        : ''
    });
  });
}
