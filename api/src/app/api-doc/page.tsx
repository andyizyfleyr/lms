const GROUPES: Array<{ titre: string; emoji: string; routes: Array<[string, string, string]> }> = [
  { titre: 'Authentification', emoji: '🔐', routes: [
    ['POST', '/api/auth/register', 'Créer un compte (e-mail, mot de passe, nom)'],
    ['POST', '/api/auth/login', 'Se connecter → jeton valable 30 jours'],
    ['POST', '/api/auth/logout', 'Fermer la session'],
    ['GET', '/api/auth/me', 'Profil + réglages de l’utilisateur connecté'],
    ['PATCH', '/api/auth/me', 'Modifier son profil'],
    ['DELETE', '/api/auth/me', 'Supprimer son compte et ses données'],
    ['POST', '/api/auth/password', 'Changer son mot de passe'],
    ['GET', '/api/auth/devices', 'Appareils connectés'],
    ['DELETE', '/api/auth/devices/{token}', 'Déconnecter un appareil à distance']
  ] },
  { titre: 'Catalogue', emoji: '📚', routes: [
    ['GET', '/api/courses', 'Catalogue (recherche, filtres, tri)'],
    ['GET', '/api/courses/{id}', 'Fiche complète : modules, leçons, ressources, quiz, devoirs'],
    ['POST', '/api/courses', 'Créer un cours (enseignant)'],
    ['PATCH', '/api/courses/{id}', 'Modifier un cours'],
    ['DELETE', '/api/courses/{id}', 'Supprimer un cours (admin)'],
    ['GET', '/api/courses/{id}/lessons', 'Leçons du cours'],
    ['POST', '/api/courses/{id}/lessons', 'Ajouter une leçon (enseignant)'],
    ['GET', '/api/courses/{id}/resources', 'Supports de cours'],
    ['GET|POST', '/api/courses/{id}/messages', 'Fil de discussion du cours'],
    ['POST|DELETE', '/api/courses/{id}/enroll', 'S’inscrire / quitter le cours']
  ] },
  { titre: 'Progression', emoji: '📈', routes: [
    ['GET', '/api/progress', 'Toute ma progression (?format=app pour l’app HTML)'],
    ['DELETE', '/api/progress', 'Remettre ma progression à zéro'],
    ['POST|DELETE', '/api/lessons/{id}/complete', 'Cocher / décocher une leçon terminée'],
    ['PATCH', '/api/videos/{id}/progress', 'Progression, position, j’aime, enregistrer'],
    ['GET', '/api/videos', 'Bibliothèque vidéo (filtres et tri)'],
    ['GET', '/api/videos/{id}', 'Détail d’une vidéo'],
    ['POST', '/api/videos', 'Ajouter un tutoriel YouTube (enseignant)']
  ] },
  { titre: 'Quiz', emoji: '🧠', routes: [
    ['GET', '/api/quizzes', 'Quiz disponibles + meilleure note'],
    ['GET', '/api/quizzes/{id}', 'Questions sans les réponses'],
    ['POST', '/api/quizzes/{id}/attempts', 'Soumettre → correction côté serveur'],
    ['GET', '/api/attempts', 'Mes tentatives'],
    ['GET', '/api/attempts/{id}', 'Correction détaillée']
  ] },
  { titre: 'Devoirs', emoji: '📝', routes: [
    ['GET', '/api/assignments', 'Devoirs + mon statut de dépôt'],
    ['POST', '/api/assignments', 'Créer un devoir (enseignant)'],
    ['GET', '/api/assignments/{id}', 'Consignes + mes dépôts'],
    ['POST', '/api/assignments/{id}/submissions', 'Déposer (fichier base64, lien, commentaire)'],
    ['GET', '/api/submissions', 'Tous mes dépôts'],
    ['GET|PATCH|DELETE', '/api/submissions/{id}', 'Détail / noter (prof) / retirer'],
    ['DELETE', '/api/assignments/{id}', 'Supprimer un devoir (enseignant)']
  ] },
  { titre: 'Notes, agenda et vie du compte', emoji: '🗓️', routes: [
    ['GET|POST', '/api/notes', 'Mes notes de cours'],
    ['GET|PATCH|DELETE', '/api/notes/{id}', 'Lire / modifier / supprimer une note'],
    ['GET|POST', '/api/sessions', 'Agenda des séances'],
    ['GET|DELETE', '/api/sessions/{id}', 'Détail / annulation d’une séance'],
    ['POST|DELETE', '/api/sessions/{id}/reminder', 'Activer / couper le rappel'],
    ['GET|POST|DELETE', '/api/notifications', 'Notifications'],
    ['POST', '/api/notifications/read-all', 'Tout marquer comme lu'],
    ['PATCH|DELETE', '/api/notifications/{id}', 'Une notification']
  ] },
  { titre: 'Badges, statistiques, réglages', emoji: '🏆', routes: [
    ['GET', '/api/badges', 'Badges + attribution automatique'],
    ['GET', '/api/stats', 'Série, heures, objectif hebdo, activité'],
    ['GET', '/api/search?q=', 'Recherche globale'],
    ['GET|PATCH', '/api/settings', 'Réglages (thème, notifications…)'],
    ['GET|POST|DELETE', '/api/downloads', 'Téléchargements hors-ligne'],
    ['PATCH|DELETE', '/api/downloads/{id}', 'Un téléchargement'],
    ['GET', '/api/health', 'État de l’API et de la base']
  ] }
];

const COULEUR: Record<string, string> = { GET: '#0b6bcb', POST: '#1b7f4b', PATCH: '#8a5300', DELETE: '#b3261e', 'GET|POST': '#4a4458', 'POST|DELETE': '#4a4458', 'GET|PATCH': '#4a4458', 'GET|DELETE': '#4a4458', 'PATCH|DELETE': '#4a4458', 'GET|PATCH|DELETE': '#4a4458' };

export default function Accueil() {
  const total = GROUPES.reduce((s, g) => s + g.routes.length, 0);
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 64px' }}>
      <header style={{ background: 'linear-gradient(135deg,#6750a4,#4f378a)', color: '#fff', borderRadius: 28, padding: '28px 26px' }}>
        <p style={{ margin: 0, opacity: .85, fontSize: 14, letterSpacing: .6 }}>LearnHub · backend</p>
        <h1 style={{ margin: '6px 0 4px', fontSize: 30 }}>API REST — Next.js + Neon</h1>
        <p style={{ margin: 0, opacity: .9, fontSize: 15 }}>
          {total} points d’entrée couvrant toute l’application mobile : authentification, cours, leçons, vidéos,
          quiz corrigés côté serveur, devoirs et dépôts de fichiers, notes, agenda, notifications, badges et statistiques.
        </p>
        <p style={{ margin: '16px 0 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/api/health" style={{ background: 'rgba(255,255,255,.18)', color: '#fff', textDecoration: 'none', padding: '10px 16px', borderRadius: 999, fontSize: 15 }}>Vérifier l’état de l’API</a>
          <a href="/api/courses" style={{ background: '#fff', color: '#6750a4', textDecoration: 'none', padding: '10px 16px', borderRadius: 999, fontWeight: 600, fontSize: 15 }}>Voir les cours</a>
        </p>
      </header>

      <section style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginTop: 22, fontSize: 15, lineHeight: 1.65 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 19 }}>Comment appeler l’API</h2>
        <p style={{ margin: '0 0 10px' }}>
          Toutes les réponses sont enveloppées : <code>{'{ "ok": true, "data": … }'}</code> en cas de succès,
          <code>{' { "ok": false, "error": { "code", "message", "details" } }'}</code> sinon.
          Après connexion, envoyez le jeton dans l’en-tête <code>Authorization: Bearer &lt;jeton&gt;</code>.
        </p>
        <pre style={{ background: '#f3edf7', padding: 14, borderRadius: 14, overflowX: 'auto', fontSize: 13.5, margin: 0 }}>{`# connexion
curl -s -X POST https://VOTRE-API.vercel.app/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"amina@learnhub.bj","motDePasse":"demo1234"}'

# cours (jeton requis pour la progression)
curl -s https://VOTRE-API.vercel.app/api/courses -H "Authorization: Bearer $TOKEN"

# soumettre un quiz (correction côté serveur)
curl -s -X POST .../api/quizzes/c1/attempts -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{"reponses":[{"questionId":"c1-q1","optionId":"c1-q1-o3"}]}'`}</pre>
      </section>

      {GROUPES.map(g => (
        <section key={g.titre} style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginTop: 18 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 19 }}>{g.emoji} {g.titre}</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {g.routes.map(([methode, chemin, desc]) => (
              <li key={chemin + methode} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '9px 0', borderTop: '1px solid #f0eaf4' }}>
                <span style={{ color: COULEUR[methode] || '#4a4458', fontWeight: 700, fontSize: 11.5, minWidth: 96, letterSpacing: .4 }}>{methode}</span>
                <code style={{ fontSize: 14, color: '#4f378a', minWidth: 250 }}>{chemin}</code>
                <span style={{ fontSize: 14.5, color: '#49454f' }}>{desc}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer style={{ textAlign: 'center', color: '#79747e', fontSize: 13.5, marginTop: 26 }}>
        Base de données : Neon (PostgreSQL) · Comptes de démonstration : amina@learnhub.bj / demo1234 (étudiante), adjovi@learnhub.bj / prof1234 (formatrice), admin@learnhub.bj / admin1234 (admin)
      </footer>
    </main>
  );
}
