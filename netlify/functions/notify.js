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
  return (await r.json()).access_token;
}

exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors };
  try {
    const { tokens = [], title, body } = JSON.parse(event.body || '{}');
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const at = await accessToken(sa);
    const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    await Promise.all(tokens.slice(0, 300).map(token => fetch(url, {
      method: 'POST', headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token, data: { title: String(title || 'Tessera Bar Turno A'), body: String(body || '') } } })
    })));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
