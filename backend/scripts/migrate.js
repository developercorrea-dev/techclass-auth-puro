// scripts/migrate.js
const { Pool } = require('pg');
const env = require('../src/config/env');

async function up() {
  const adminPool = new Pool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.pass,
    database: env.db.name,
    max: 1, // só precisa de uma conexão para migration
    idleTimeoutMillis: 10000,
  });

  const client = await adminPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA IF NOT EXISTS techclass');
    await client.query('SET LOCAL search_path TO techclass, public');

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(200) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS usuario_username_idx ON usuario (username);
      CREATE INDEX IF NOT EXISTS usuario_email_idx   ON usuario (email);
    `);

    await client.query('COMMIT');
    console.log('Migration OK');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
    await adminPool.end();  // encerra somente o pool de migration
  }
}

up().catch(err => {
  console.error(err);
  process.exit(1);
});
