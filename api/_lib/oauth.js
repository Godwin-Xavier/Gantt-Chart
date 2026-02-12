import { getBaseUrl, getEnv } from './env.js';

const toUrlWithQuery = (base, params) => {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export const getRedirectUri = (req, provider) => {
  const baseUrl = getBaseUrl(req);
  if (!baseUrl) {
    throw new Error('Unable to resolve APP_URL for OAuth callback.');
  }

  return `${baseUrl}/api/auth/callback/${provider}`;
};

export const buildGoogleAuthorizeUrl = (req, state) => {
  const redirectUri = getRedirectUri(req, 'google');

  return toUrlWithQuery('https://accounts.google.com/o/oauth2/v2/auth', {
    client_id: getEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state
  });
};

export const exchangeGoogleCodeForProfile = async (req, code) => {
  const redirectUri = getRedirectUri(req, 'google');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    const responseText = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${responseText}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    throw new Error('Google token response did not include an access token.');
  }

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!profileResponse.ok) {
    const responseText = await profileResponse.text();
    throw new Error(`Failed to fetch Google user profile: ${responseText}`);
  }

  const profile = await profileResponse.json();
  if (!profile.email || profile.email_verified !== true) {
    throw new Error('Google account must have a verified email address.');
  }

  return {
    provider: 'google',
    providerUserId: String(profile.sub),
    email: String(profile.email),
    displayName: typeof profile.name === 'string' ? profile.name : null,
    avatarUrl: typeof profile.picture === 'string' ? profile.picture : null
  };
};

export const buildGithubAuthorizeUrl = (req, state) => {
  const redirectUri = getRedirectUri(req, 'github');

  return toUrlWithQuery('https://github.com/login/oauth/authorize', {
    client_id: getEnv('GITHUB_CLIENT_ID'),
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state
  });
};

export const exchangeGithubCodeForProfile = async (req, code) => {
  const redirectUri = getRedirectUri(req, 'github');

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: getEnv('GITHUB_CLIENT_ID'),
      client_secret: getEnv('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    const responseText = await tokenResponse.text();
    throw new Error(`GitHub token exchange failed: ${responseText}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error('GitHub token response did not include an access token.');
  }

  const headers = {
    Authorization: `Bearer ${tokenData.access_token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'gantt-chart'
  };

  const [profileResponse, emailResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers }),
    fetch('https://api.github.com/user/emails', { headers })
  ]);

  if (!profileResponse.ok) {
    const responseText = await profileResponse.text();
    throw new Error(`Failed to fetch GitHub profile: ${responseText}`);
  }

  if (!emailResponse.ok) {
    const responseText = await emailResponse.text();
    throw new Error(`Failed to fetch GitHub emails: ${responseText}`);
  }

  const profile = await profileResponse.json();
  const emails = await emailResponse.json();
  const verifiedEmail = Array.isArray(emails)
    ? emails.find((item) => item && item.verified && item.primary)
      || emails.find((item) => item && item.verified)
    : null;

  if (!verifiedEmail || !verifiedEmail.email) {
    throw new Error('GitHub account must expose at least one verified email address.');
  }

  return {
    provider: 'github',
    providerUserId: String(profile.id),
    email: String(verifiedEmail.email),
    displayName: typeof profile.name === 'string' && profile.name.length > 0
      ? profile.name
      : (typeof profile.login === 'string' ? profile.login : null),
    avatarUrl: typeof profile.avatar_url === 'string' ? profile.avatar_url : null
  };
};
