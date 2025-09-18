const { Pool } = require('pg');
const env = require('../config/env');

// valida o identificador do schema para evitar injeção
const schema = env.db.schema || 'techclass';
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
  throw new Error(`DB_SCHEMA inválido: ${schema}`);
}

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.pass,
  database: env.db.name,
  max: 10,
  idleTimeoutMillis: 30000,
});

// roda para cada conexão criada no pool
pool.on('connect', async (client) => {
  // cria o schema se não existir (idempotente)
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  // aplica o search_path priorizando o schema desejado e mantendo o public
  await client.query(`SET search_path TO ${schema}, public`);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
