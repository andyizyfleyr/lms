import { z } from 'zod';
import { createHash } from 'node:crypto';
import { q, q1, exec } from '@/lib/db';
import { auth, ok, fail, parseBody, OPTIONS, handler } from '@/lib/http';
import { createToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { OPTIONS };

const empreinte = (code: string) => createHash('sha256').update('lh-secours:' + code).digest('hex');

/** GET /api/p4-securite — mon journal de sécurité, mes appareils, mon code de secours. */
export async function GET(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const journal = await q(
      `select type, detail, appareil, created_at from journal_securite where user_id = $1 order by created_at desc limit 40`, [uid]);
    const appareils = await q(
      `select token, coalesce(device,'Appareil inconnu') device, user_agent, ip, created_at, expires_at
         from auth_tokens where user_id = $1 and expires_at > now() order by created_at desc limit 12`, [uid]);
    const code = await q1<{ cree_le: string; utilise_le: string | null; essais: number }>(
      'select cree_le, utilise_le, essais from codes_secours where user_id = $1', [uid]);
    return ok({
      journal, appareils,
      codeSecours: code
        ? { existe: true, creeLe: code.cree_le, utilise: !!code.utilise_le, essais: code.essais }
        : { existe: false, creeLe: null, utilise: false, essais: 0 },
      sessionCourante: a.session.token.slice(0, 8) + '…'
    });
  });
}

const corps = z.object({
  action: z.enum(['generer', 'verifier', 'journal', 'revoquer']),
  code: z.string().trim().max(20).optional(),
  token: z.string().trim().max(200).optional()
});

/** POST /api/p4-securite — code de secours (à garder hors du téléphone),
 *  ou fermeture d'une session ouverte sur un autre appareil. */
export async function POST(req: Request) {
  return handler(async () => {
    const a = await auth(req);
    if ('error' in a) return a.error;
    const uid = a.session.user.id;
    const p = await parseBody(req, corps);
    if ('error' in p) return p.error;
    const d = p.data;

    if (d.action === 'generer') {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await exec(
        `insert into codes_secours (user_id, empreinte, essais, cree_le, utilise_le)
         values ($1, $2, 0, now(), null)
         on conflict (user_id) do update set empreinte = $2, essais = 0, cree_le = now(), utilise_le = null`,
        [uid, empreinte(code)]);
      await exec(
        `insert into journal_securite (user_id, type, detail, appareil) values ($1, 'code_secours', 'nouveau code de secours créé', $2)`,
        [uid, req.headers.get('user-agent')?.slice(0, 120) || 'inconnu']);
      return ok({ code, message: 'Notez ce code maintenant : il ne sera plus affiché. Il sert à rentrer dans votre compte si vous perdez votre mot de passe.' }, 201);
    }

    if (d.action === 'verifier') {
      if (!d.code) return fail('Entrez le code de secours');
      const c = await q1<{ empreinte: string; essais: number; utilise_le: string | null; user_id: string }>(
        'select empreinte, essais, utilise_le, user_id from codes_secours where user_id = $1', [uid]);
      if (!c || c.utilise_le) return fail('Aucun code de secours actif pour ce compte');
      if (c.essais >= 5) return fail('Trop d\'essais : générez un nouveau code depuis vos paramètres', 429, 'trop_essais');
      if (c.empreinte !== empreinte(d.code.replace(/\s/g, ''))) {
        await exec('update codes_secours set essais = essais + 1 where user_id = $1', [uid]);
        await exec(
          `insert into journal_securite (user_id, type, detail) values ($1, 'code_secours_essai', 'code de secours erroné')`, [uid]);
        return fail('Code incorrect (il reste ' + (4 - c.essais) + ' essai(s))', 400, 'code_incorrect');
      }
      await exec('update codes_secours set utilise_le = now(), essais = 0 where user_id = $1', [uid]);
      const jeton = await createToken(uid, { device: 'Code de secours', userAgent: req.headers.get('user-agent') || '' });
      await exec(
        `insert into journal_securite (user_id, type, detail, appareil) values ($1, 'code_secours_utilise', 'connexion par code de secours', $2)`,
        [uid, req.headers.get('user-agent')?.slice(0, 120) || 'inconnu']);
      return ok({ token: jeton, message: 'Code accepté : vous êtes reconnecté. Le code est désormais utilisé.' });
    }

    if (d.action === 'revoquer') {
      if (!d.token) return fail('Précisez la session à fermer');
      if (d.token === a.session.token) return fail('Impossible de fermer la session en cours depuis cet écran');
      await exec('delete from auth_tokens where token = $1 and user_id = $2', [d.token, uid]);
      await exec(
        `insert into journal_securite (user_id, type, detail) values ($1, 'session_fermee', 'session fermée à distance')`, [uid]);
      return ok({ ferme: true });
    }

    const journal = await q(
      `select type, detail, appareil, created_at from journal_securite where user_id = $1 order by created_at desc limit 60`, [uid]);
    return ok({ journal });
  });
}
