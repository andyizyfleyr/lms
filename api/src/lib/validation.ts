import { z } from 'zod';

export const email = z.string().trim().toLowerCase().email('Adresse e-mail invalide');
export const motDePasse = z.string().min(6, '6 caractères minimum').max(200);

export const inscription = z.object({
  email,
  motDePasse,
  nom: z.string().trim().min(3, '3 caractères minimum').max(80),
  promo: z.string().trim().max(80).optional(),
  ville: z.string().trim().max(80).optional(),
  /* L'apprenant s'inscrit lui-même comme étudiant ou comme formateur :
     aucun autre rôle (admin) ne peut être obtenu par ce formulaire. */
  role: z.enum(['etudiant', 'enseignant']).optional()
});

export const connexion = z.object({ email, motDePasse: z.string().min(1, 'Mot de passe requis') });

export const profil = z.object({
  nom: z.string().trim().min(3).max(80).optional(),
  tel: z.string().trim().max(40).optional(),
  ville: z.string().trim().max(80).optional(),
  promo: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  objectifSemaineH: z.number().int().min(1).max(60).optional()
});

export const changementMotDePasse = z.object({
  actuel: z.string().min(1, 'Mot de passe actuel requis'),
  nouveau: motDePasse
});

export const note = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().default(''),
  titre: z.string().trim().max(140).default(''),
  contenu: z.string().max(20000).default('')
});

export const message = z.object({ contenu: z.string().trim().min(1, 'Message vide').max(4000) });

export const progressionLecon = z.object({ done: z.boolean().default(true), minutes: z.number().int().min(0).max(600).default(0) });

export const etatVideo = z.object({
  progress: z.number().int().min(0).max(100).optional(),
  liked: z.boolean().optional(),
  saved: z.boolean().optional(),
  positionS: z.number().int().min(0).optional()
});

export const tentativeQuiz = z.object({
  reponses: z.array(z.object({ questionId: z.string().min(1), optionId: z.string().min(1) })).min(1, 'Aucune réponse envoyée'),
  dureeS: z.number().int().min(0).max(36000).default(0)
});

export const depot = z.object({
  lien: z.string().trim().max(500).default(''),
  commentaire: z.string().trim().max(2000).default(''),
  fichierNom: z.string().trim().max(200).default(''),
  fichierType: z.string().trim().max(120).default(''),
  fichierTaille: z.number().int().min(0).max(5_000_000).default(0),
  fichierData: z.string().max(8_000_000).default('')   // base64 — 2 Mo de fichier ≈ 2,7 Mo de base64
});

export const cours = z.object({
  id: z.string().trim().min(1).max(30).optional(),
  titre: z.string().trim().min(3).max(140),
  categorie: z.string().trim().min(2).max(60),
  professeur: z.string().trim().min(2).max(80),
  imageKey: z.string().trim().max(40).default('code'),
  accent: z.string().trim().max(20).default('purple'),
  ico: z.string().trim().max(30).default('code'),
  totalLecons: z.number().int().min(0).max(500).default(0),
  dureeLabel: z.string().trim().max(30).default(''),
  description: z.string().trim().max(2000).default('')
});

export const lecon = z.object({
  moduleTitre: z.string().trim().min(2).max(120),
  moduleOrdre: z.number().int().min(1).max(99).default(1),
  ordre: z.number().int().min(1).max(99).default(1),
  titre: z.string().trim().min(2).max(160),
  dureeLabel: z.string().trim().max(30).default(''),
  kind: z.enum(['lecture', 'video', 'quiz', 'exercice']).default('lecture'),
  videoId: z.string().trim().max(40).default('')
});

export const ressource = z.object({
  titre: z.string().trim().min(2).max(160),
  typeLabel: z.string().trim().max(40).default(''),
  ico: z.string().trim().max(30).default('task'),
  accent: z.string().trim().max(20).default('purple'),
  url: z.string().trim().max(500).default('')
});

export const seance = z.object({
  titre: z.string().trim().min(3).max(160),
  jourSemaine: z.number().int().min(0).max(6).default(0),
  dateSession: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  heure: z.string().trim().max(10).default('09:00'),
  type: z.string().trim().max(40).default('Cours'),
  dureeLabel: z.string().trim().max(20).default('1 h'),
  salle: z.string().trim().max(80).default(''),
  courseId: z.string().trim().max(30).nullable().optional(),
  prof: z.string().trim().max(80).default(''),
  description: z.string().trim().max(2000).default(''),
  rappel: z.boolean().default(true)
});

export const notification = z.object({
  titre: z.string().trim().min(3).max(160),
  texte: z.string().trim().max(500).default(''),
  ico: z.string().trim().max(30).default('bell'),
  kind: z.string().trim().max(30).default(''),
  refId: z.string().trim().max(60).default(''),
  userId: z.string().uuid().nullable().optional(),
  toutLeMonde: z.boolean().default(false)
});

export const reglages = z.object({
  theme: z.enum(['clair', 'sombre']).optional(),
  langue: z.enum(['fr', 'en']).optional(),
  notificationsEmail: z.boolean().optional(),
  notificationsPush: z.boolean().optional(),
  rappelsSessions: z.boolean().optional(),
  donneesMobiles: z.boolean().optional()
});

export const telechargement = z.object({
  courseId: z.string().trim().max(30).nullable().optional(),
  resourceId: z.string().trim().max(60).nullable().optional(),
  titre: z.string().trim().min(2).max(160),
  tailleLabel: z.string().trim().max(40).default(''),
  etat: z.enum(['dl', 'ok', 'pause']).default('dl'),
  progres: z.number().int().min(0).max(100).default(0)
});

export const majTelechargement = z.object({
  etat: z.enum(['dl', 'ok', 'pause']).optional(),
  progres: z.number().int().min(0).max(100).optional()
});

export const noteDepot = z.object({
  note: z.number().int().min(0).max(100),
  statut: z.enum(['rendu', 'note']).default('note'),
  commentaire: z.string().trim().max(2000).default('')
});
