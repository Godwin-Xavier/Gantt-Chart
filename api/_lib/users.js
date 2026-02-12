import crypto from 'node:crypto';
import { query, withTransaction } from './db.js';

const createId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const mapUserRow = (row) => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name || null,
  avatarUrl: row.avatar_url || null
});

export const getUserById = async (userId) => {
  const result = await query(
    `SELECT id, email, display_name, avatar_url FROM app_user WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) return null;
  return mapUserRow(result.rows[0]);
};

export const resolveUserFromIdentity = async ({ provider, providerUserId, email, displayName, avatarUrl }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('A verified email is required for sign-in.');
  }

  return withTransaction(async (client) => {
    const existingIdentity = await client.query(
      `
        SELECT u.id, u.email, u.display_name, u.avatar_url
        FROM user_identity i
        JOIN app_user u ON u.id = i.user_id
        WHERE i.provider = $1 AND i.provider_user_id = $2
        LIMIT 1
      `,
      [provider, providerUserId]
    );

    let userRow = existingIdentity.rows[0] || null;

    if (!userRow) {
      const existingEmailUser = await client.query(
        `SELECT id, email, display_name, avatar_url FROM app_user WHERE LOWER(email) = $1 LIMIT 1`,
        [normalizedEmail]
      );

      if (existingEmailUser.rowCount > 0) {
        userRow = existingEmailUser.rows[0];
      } else {
        const insertedUser = await client.query(
          `
            INSERT INTO app_user (id, email, display_name, avatar_url)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, display_name, avatar_url
          `,
          [createId('user'), normalizedEmail, displayName || null, avatarUrl || null]
        );
        userRow = insertedUser.rows[0];
      }

      await client.query(
        `
          INSERT INTO user_identity (id, user_id, provider, provider_user_id, email)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (provider, provider_user_id)
          DO UPDATE SET
            user_id = EXCLUDED.user_id,
            email = EXCLUDED.email,
            updated_at = NOW()
        `,
        [createId('identity'), userRow.id, provider, providerUserId, normalizedEmail]
      );
    }

    const refreshed = await client.query(
      `
        UPDATE app_user
        SET
          email = $2,
          display_name = $3,
          avatar_url = $4,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, display_name, avatar_url
      `,
      [userRow.id, normalizedEmail, displayName || null, avatarUrl || null]
    );

    return mapUserRow(refreshed.rows[0]);
  });
};
