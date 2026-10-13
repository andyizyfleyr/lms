import { q, q1, exec } from '@/lib/db';
import { ok, fail, OPTIONS, handler } from '@/lib/http';
import { marquerPaye, NOVA_WEBHOOK_SECRET, verifierSignatureNova } from '@/lib/paiement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

/* ============================================================
   Webhook NOVA Checkout
   ------------------------------------------------------------
   Adresse à déclarer dans NOVA :  https://…/api/nova/webhook

   Deux règles tenues ici, tirées de la documentation NOVA :
     • la signature se vérifie sur le corps BRUT, avant tout
       analyse JSON, avec une tolérance de 5 minutes ;
     • la route est idempotente : un évènement rejoué (NOVA relance
       jusqu'à 6 fois) ne délivre jamais deux fois la même chose,
       parce que `marquerPaye` ne fait rien si la commande est
       déjà payée.
   ============================================================ */

export async function POST(req: Request) {
  return handler(async () => {
    const brut = await req.text();
    const signature = req.headers.get('nova-signature');
    if (!NOVA_WEBHOOK_SECRET) {
      return fail('Webhook non configuré : NOVA_WEBHOOK_SECRET est absent des variables d\'environnement', 503, 'non_configure');
    }
    if (!verifierSignatureNova(brut, signature, NOVA_WEBHOOK_SECRET)) {
      /* jamais de journalisation du secret ni du corps : seulement le constat */
      await exec(`insert into payment_events (type, order_id, payload) values ('webhook_signature_invalide', null, $1::jsonb)`,
        [JSON.stringify({ recu: new Date().toISOString(), entete: signature ? 'présent' : 'absent' })]).catch(() => 0);
      return fail('Signature invalide', 401, 'signature_invalide');
    }

    let event: { type?: string; id?: string; data?: { id?: string; status?: string; reference?: string; method?: string; paid_at?: string } };
    try { event = JSON.parse(brut); } catch { return fail('Corps illisible', 400, 'corps_invalide'); }
    const type = String(event.type || '').slice(0, 60);
    const sessionId = String(event.data?.id || event.id || '').slice(0, 80);

    await exec(
      `insert into payment_events (type, order_id, payload) values ($1, null, $2::jsonb)`,
      [type || 'evenement', JSON.stringify({ sessionId, statut: event.data?.status || null })]).catch(() => 0);

    if (type !== 'checkout.session.paid') {
      /* expired ou autre : on accuse réception, rien à délivrer */
      return ok({ traite: false, type: type || 'inconnu' });
    }
    if (!sessionId) return fail('Session absente de l\'évènement', 400, 'session_absente');

    const commande = await q1<{ id: string; status: string }>(
      'select id, status from orders where nova_session_id = $1', [sessionId]);
    if (!commande) {
      /* commande inconnue (autre marchand, ou base différente) : 200 pour ne pas provoquer de relance */
      return ok({ traite: false, raison: 'commande inconnue' });
    }
    if (commande.status === 'paid') return ok({ traite: false, raison: 'déjà payée' });

    await marquerPaye(commande.id, {
      reference: (event.data as { reference?: string } | undefined)?.reference || null,
      method: (event.data as { method?: string } | undefined)?.method || null,
      paidAt: (event.data as { paid_at?: string } | undefined)?.paid_at || null
    });
    const apres = await q1<{ status: string }>('select status from orders where id = $1', [commande.id]);
    return ok({ traite: apres?.status === 'paid', commande: commande.id });
  });
}

/** GET — petit contrôle de vie : dit seulement si le secret est en place. */
export async function GET() {
  return handler(async () => ok({
    pret: !!NOVA_WEBHOOK_SECRET,
    route: '/api/nova/webhook',
    note: 'Déclarez cette adresse dans NOVA (webhooks). Un POST sans signature valide reçoit une réponse 401.'
  }));
}
