// scripts/seed.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'dbtechclass',
  user: process.env.DB_USER || 'techclass',
  password: process.env.DB_PASSWORD || 'techclass',
  schema: (process.env.DB_SCHEMA || 'techclass').trim(),
};

async function seed() {
  const pool = new Pool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    max: 1,
    idleTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${cfg.schema}`);
    await client.query(`SET LOCAL search_path TO ${cfg.schema}, public`);

    const password_hash = await bcrypt.hash('Admin@123', 10);

    await client.query(
      `INSERT INTO usuario (username, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', 'admin@techclass.local', password_hash]
    );

    await client.query('COMMIT');
    console.log('Seed OK (admin)');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
    await pool.end(); // encerra só o pool do seed
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
