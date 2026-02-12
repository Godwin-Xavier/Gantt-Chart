import { getBaseUrl } from '../../_lib/env.js';
import { json, redirect } from '../../_lib/http.js';
import { exchangeGoogleCodeForProfile } from '../../_lib/oauth.js';
import {
  clearOAuthStateCookie,
  createSessionUser,
  setSessionCookie,
  verifyOAuthStateFromRequest
} from '../../_lib/session.js';
import { resolveUserFromIdentity } from '../../_lib/users.js';

const withAuthResult = (baseUrl, status, detail = '') => {
  if (typeof baseUrl !== 'string' || !/^https?:\/\//i.test(baseUrl)) {
    const search = new URLSearchParams({ auth: status });
    if (detail) search.set('detail', detail);
    return `/?${search.toString()}`;
  }

  const url = new URL(baseUrl);
  url.searchParams.set('auth', status);
  if (detail) url.searchParams.set('detail', detail);
  return url.toString();
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const baseUrl = getBaseUrl(req) || '/';
  const { code, state, error } = req.query;

  if (error) {
    clearOAuthStateCookie(req, res);
    return redirect(res, withAuthResult(baseUrl, 'error', String(error)), 302);
  }

  if (!code || !state || !verifyOAuthStateFromRequest(req, 'google', String(state))) {
    clearOAuthStateCookie(req, res);
    return redirect(res, withAuthResult(baseUrl, 'error', 'state_mismatch'), 302);
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(req, String(code));
    const user = await resolveUserFromIdentity(profile);
    setSessionCookie(req, res, createSessionUser(user));
    clearOAuthStateCookie(req, res);
    return redirect(res, withAuthResult(baseUrl, 'success'), 302);
  } catch (authError) {
    clearOAuthStateCookie(req, res);
    return redirect(res, withAuthResult(baseUrl, 'error', 'oauth_failed'), 302);
  }
}
