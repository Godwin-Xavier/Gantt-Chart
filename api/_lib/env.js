const normalizeBaseUrl = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
};

export const getBaseUrl = (req) => {
  const fromEnv = normalizeBaseUrl(process.env.APP_URL);
  if (fromEnv) return fromEnv;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  if (!host) return null;
  return `${proto}://${host}`;
};

export const getEnv = (key) => {
  const value = process.env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const optionalEnv = (key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const authProvidersConfigured = () => ({
  google: Boolean(optionalEnv('GOOGLE_CLIENT_ID') && optionalEnv('GOOGLE_CLIENT_SECRET')),
  github: Boolean(optionalEnv('GITHUB_CLIENT_ID') && optionalEnv('GITHUB_CLIENT_SECRET'))
});
