import { json, redirect } from '../_lib/http.js';
import { clearSessionCookie } from '../_lib/session.js';
import { getBaseUrl } from '../_lib/env.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  clearSessionCookie(req, res);

  if (req.method === 'GET') {
    const baseUrl = getBaseUrl(req) || '/';
    return redirect(res, baseUrl, 302);
  }

  return json(res, 200, { ok: true });
}
