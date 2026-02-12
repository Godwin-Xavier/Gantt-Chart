import { json } from '../_lib/http.js';
import { authProvidersConfigured } from '../_lib/env.js';
import { clearSessionCookie, getSessionFromRequest } from '../_lib/session.js';
import { getUserById } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const providers = authProvidersConfigured();
    const session = getSessionFromRequest(req);

    if (!session) {
      return json(res, 200, {
        authenticated: false,
        user: null,
        providers
      });
    }

    const dbUser = await getUserById(session.userId);
    if (!dbUser) {
      clearSessionCookie(req, res);
      return json(res, 200, {
        authenticated: false,
        user: null,
        providers
      });
    }

    return json(res, 200, {
      authenticated: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        displayName: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl
      },
      providers
    });
  } catch (error) {
    return json(res, 500, {
      error: 'Failed to load session',
      detail: error.message
    });
  }
}
