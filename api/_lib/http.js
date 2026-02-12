export const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

export const redirect = (res, location, statusCode = 302) => {
  res.statusCode = statusCode;
  res.setHeader('Location', location);
  res.end();
};

export const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (raw.length === 0) return {};

  return JSON.parse(raw);
};
