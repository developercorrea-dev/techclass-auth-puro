const db = require('../utils/db');

async function findByIdentifier(identifier) {
  const idLower = String(identifier || '').trim().toLowerCase();
  if (!idLower) return null;
  const sql = `SELECT id, username, email, password_hash
               FROM usuario
               WHERE LOWER(username) = $1 OR LOWER(email) = $1
               LIMIT 1`;
  const { rows } = await db.query(sql, [idLower]);
  return rows[0] || null;
}

module.exports = { findByIdentifier };
