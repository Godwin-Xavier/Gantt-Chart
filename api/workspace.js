import { json, readJsonBody } from './_lib/http.js';
import { getSessionFromRequest } from './_lib/session.js';
import { query } from './_lib/db.js';

const MAX_WORKSPACE_SIZE_BYTES = 4_500_000;

const requireSession = (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    json(res, 401, { error: 'Unauthorized' });
    return null;
  }
  return session;
};

const normalizeWorkspacePayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid workspace payload');
  }

  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_WORKSPACE_SIZE_BYTES) {
    throw new Error('Workspace payload is too large');
  }

  return payload;
};

export default async function handler(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

  try {
    if (req.method === 'GET') {
      const result = await query(
        `SELECT payload, updated_at FROM user_workspace WHERE user_id = $1 LIMIT 1`,
        [session.userId]
      );

      if (result.rowCount === 0) {
        return json(res, 200, {
          workspace: null,
          updatedAt: null
        });
      }

      return json(res, 200, {
        workspace: result.rows[0].payload,
        updatedAt: result.rows[0].updated_at
      });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const workspace = normalizeWorkspacePayload(body.workspace);

      const upsert = await query(
        `
          INSERT INTO user_workspace (user_id, payload, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            payload = EXCLUDED.payload,
            updated_at = NOW()
          RETURNING updated_at
        `,
        [session.userId, JSON.stringify(workspace)]
      );

      return json(res, 200, {
        ok: true,
        updatedAt: upsert.rows[0].updated_at
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, {
      error: 'Workspace sync failed',
      detail: error.message
    });
  }
}
