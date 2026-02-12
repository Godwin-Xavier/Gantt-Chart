import crypto from 'node:crypto';
import { authProvidersConfigured } from '../../_lib/env.js';
import { json, redirect } from '../../_lib/http.js';
import { buildGithubAuthorizeUrl } from '../../_lib/oauth.js';
import { setOAuthStateCookie } from '../../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const providers = authProvidersConfigured();
  if (!providers.github) {
    return json(res, 503, {
      error: 'GitHub sign-in is not configured for this deployment yet.'
    });
  }

  try {
    const state = crypto.randomUUID();
    const authUrl = buildGithubAuthorizeUrl(req, state);
    setOAuthStateCookie(req, res, {
      provider: 'github',
      state
    });
    return redirect(res, authUrl, 302);
  } catch (error) {
    return json(res, 500, {
      error: 'Failed to start GitHub sign-in',
      detail: error.message
    });
  }
}
