import Link from 'next/link';

/* Adresse inconnue : le serveur répond un vrai 404 (statut correct pour les
   moteurs et les liens partagés) avec une page aux couleurs de CosmétiLab.
   Les adresses connues, elles, sont réécrites vers l'application
   (voir next.config.mjs → web/src/routes.json). */
export default function AdresseInconnue() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 20px',
        background: '#FEF7FF',
        color: '#1D1B20',
        textAlign: 'center'
      }}
    >
      <div style={{ maxWidth: '420px' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 18px',
            borderRadius: '20px',
            background: '#EADDFF',
            color: '#6750A4',
            display: 'grid',
            placeItems: 'center',
            fontSize: '34px'
          }}
        >
          ⚗️
        </div>
        <h1 style={{ fontSize: '26px', margin: '0 0 10px', color: '#6750A4' }}>Erreur 404</h1>
        <p style={{ fontSize: '15px', lineHeight: 1.55, color: '#49454F', margin: '0 0 22px' }}>
          Cette adresse ne mène à aucun écran de CosmétiLab. Elle a peut-être changé,
          ou le lien est incomplet.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              padding: '12px 22px',
              borderRadius: '999px',
              background: '#6750A4',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Revenir à l&apos;accueil
          </Link>
          <Link
            href="/cours"
            style={{
              padding: '12px 22px',
              borderRadius: '999px',
              border: '1px solid #79747E',
              color: '#6750A4',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Mes cours
          </Link>
        </div>
        <p style={{ fontSize: '13px', color: '#79747E', marginTop: '26px' }}>
          Adresses utiles : /cours · /agenda · /notifications · /certificats · /aide
        </p>
      </div>
    </main>
  );
}
