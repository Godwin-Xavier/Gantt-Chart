import { Pool } from 'pg';
import { getEnv } from './env.js';

const getPool = () => {
  if (!globalThis.__ganttPgPool) {
    globalThis.__ganttPgPool = new Pool({
      connectionString: getEnv('DATABASE_URL')
    });
  }

  return globalThis.__ganttPgPool;
};

const ensureSchema = async () => {
  if (!globalThis.__ganttSchemaReadyPromise) {
    globalThis.__ganttSchemaReadyPromise = (async () => {
      const pool = getPool();
      const client = await pool.connect();

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS app_user (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        await client.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS app_user_email_lower_idx
          ON app_user (LOWER(email));
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS user_identity (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
            provider TEXT NOT NULL,
            provider_user_id TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(provider, provider_user_id)
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS user_workspace (
            user_id TEXT PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
            payload JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
      } finally {
        client.release();
      }
    })();
  }

  return globalThis.__ganttSchemaReadyPromise;
};

export const query = async (text, params = []) => {
  await ensureSchema();
  return getPool().query(text, params);
};

export const withTransaction = async (callback) => {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
