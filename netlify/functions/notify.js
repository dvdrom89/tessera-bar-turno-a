// Funzione Netlify: invia le push via FCM. Nessuna dipendenza da installare.
// Variabile d'ambiente su Netlify: FIREBASE_SERVICE_ACCOUNT_JSON (contenuto del JSON account di servizio)
const crypto = require('crypto');
const b64 = b => Buffer.from(b).toString('base64url');

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + head + '.' + body + '.' + sig
  });
  const result = await r.json();
  if (!r.ok || !result.access_token) throw Error('Autenticazione FCM non riuscita.');
  return result.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' } };
  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'Richiesta non valida.' }; }
  const { tokens, title, body } = payload || {};
  if (!Array.isArray(tokens) || !tokens.length || tokens.length > 300 ||
      tokens.some(token => typeof token !== 'string' || !token || token.length > 4096)) {
    return { statusCode: 400, body: 'Destinatari non validi.' };
  }
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const at = await accessToken(sa);
    const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    const deliveries = await Promise.allSettled([...new Set(tokens)].map(async token => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { token, data: {
          title: String(title || 'Tessera Bar Turno A').slice(0, 100),
          body: String(body || '').slice(0, 300)
        } } })
      });
      if (!response.ok) throw Error('FCM ha rifiutato il messaggio.');
    }));
    const sent = deliveries.filter(result => result.status === 'fulfilled').length;
    const failed = deliveries.length - sent;
    return { statusCode: failed ? 502 : 200, body: JSON.stringify({ sent, failed }) };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Invio FCM non riuscito.' }) };
  }
};
