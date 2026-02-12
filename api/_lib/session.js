import crypto from 'node:crypto';
import { getEnv } from './env.js';

const SESSION_COOKIE_NAME = 'gantt_session';
const OAUTH_STATE_COOKIE_NAME = 'gantt_oauth_state';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL_SECONDS = 60 * 10;

const parseCookies = (headerValue) => {
  if (!headerValue || typeof headerValue !== 'string') return {};

  return headerValue
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const index = item.indexOf('=');
      if (index <= 0) return acc;
      const key = decodeURIComponent(item.slice(0, index));
      const value = decodeURIComponent(item.slice(index + 1));
      acc[key] = value;
      return acc;
    }, {});
};

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  parts.push(`Path=${options.path || '/'}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');

  return parts.join('; ');
};

const appendSetCookie = (res, cookieValue) => {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieValue]);
    return;
  }

  res.setHeader('Set-Cookie', [existing, cookieValue]);
};

const isSecureRequest = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.includes('https');
  }

  return process.env.NODE_ENV === 'production';
};

const sign = (value) => {
  const secret = getEnv('AUTH_SECRET');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
};

const createSignedPayload = (payload) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const verifySignedPayload = (token) => {
  if (typeof token !== 'string') return null;

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const a = Buffer.from(providedSignature);
  const b = Buffer.from(expectedSignature);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

export const createSessionUser = ({ id, email, displayName, avatarUrl }) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    uid: id,
    email,
    name: displayName || null,
    avatar: avatarUrl || null,
    exp: now + SESSION_TTL_SECONDS
  };
};

export const setSessionCookie = (req, res, sessionUser) => {
  const token = createSignedPayload(sessionUser);
  const cookie = serializeCookie(SESSION_COOKIE_NAME, token, {
    maxAge: SESSION_TTL_SECONDS,
    sameSite: 'Lax',
    secure: isSecureRequest(req),
    httpOnly: true,
    path: '/'
  });

  appendSetCookie(res, cookie);
};

export const clearSessionCookie = (req, res) => {
  const cookie = serializeCookie(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    sameSite: 'Lax',
    secure: isSecureRequest(req),
    httpOnly: true,
    path: '/'
  });

  appendSetCookie(res, cookie);
};

export const getSessionFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  let payload = null;
  try {
    payload = verifySignedPayload(token);
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;

  if (typeof payload.uid !== 'string' || !payload.uid) return null;
  if (typeof payload.email !== 'string' || !payload.email) return null;

  return {
    userId: payload.uid,
    email: payload.email,
    displayName: typeof payload.name === 'string' ? payload.name : null,
    avatarUrl: typeof payload.avatar === 'string' ? payload.avatar : null,
    exp: payload.exp
  };
};

export const setOAuthStateCookie = (req, res, data) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    provider: data.provider,
    state: data.state,
    exp: now + OAUTH_STATE_TTL_SECONDS
  };

  const token = createSignedPayload(payload);
  const cookie = serializeCookie(OAUTH_STATE_COOKIE_NAME, token, {
    maxAge: OAUTH_STATE_TTL_SECONDS,
    sameSite: 'Lax',
    secure: isSecureRequest(req),
    httpOnly: true,
    path: '/'
  });

  appendSetCookie(res, cookie);
};

export const clearOAuthStateCookie = (req, res) => {
  const cookie = serializeCookie(OAUTH_STATE_COOKIE_NAME, '', {
    maxAge: 0,
    sameSite: 'Lax',
    secure: isSecureRequest(req),
    httpOnly: true,
    path: '/'
  });

  appendSetCookie(res, cookie);
};

export const verifyOAuthStateFromRequest = (req, expectedProvider, expectedState) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[OAUTH_STATE_COOKIE_NAME];
  if (!token) return false;

  let payload = null;
  try {
    payload = verifySignedPayload(token);
  } catch {
    return false;
  }

  if (!payload || typeof payload !== 'object') return false;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return false;
  if (payload.provider !== expectedProvider) return false;
  if (payload.state !== expectedState) return false;

  return true;
};
