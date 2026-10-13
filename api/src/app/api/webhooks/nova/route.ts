/* ============================================================
   POST /api/webhooks/nova — ALIAS historique de /api/nova/webhook.

   L'adresse à déclarer dans NOVA Checkout est /api/nova/webhook.
   Cette route ne contient plus de logique propre : elle réexporte
   exactement le même traitement, pour qu'aucune adresse déjà
   déclarée quelque part ne tombe en 404.
   ============================================================ */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export { GET, POST, OPTIONS } from '../../nova/webhook/route';
