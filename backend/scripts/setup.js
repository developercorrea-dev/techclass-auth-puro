// scripts/setup.js
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Client } = require('pg');

// --- instala pg-format se não estiver presente ---
async function ensurePgFormatInstalled() {
  const projectRoot = path.resolve(__dirname, '..');

  // tenta resolver sem carregar
  try {
    require.resolve('pg-format', { paths: [projectRoot] });
    return; // já está instalado
  } catch (_) {
    // não instalado
  }

  console.log('[..] pg-format não encontrado. Instalando com npm i pg-format ...');

  await new Promise((resolve, reject) => {
    const child = spawn(
      'npm',
      ['i', 'pg-format', '--save', '--no-audit', '--no-fund'],
      { cwd: projectRoot, shell: true, stdio: 'inherit' } // shell:true funciona bem no Windows
    );
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Falha ao instalar pg-format (exit ${code})`));
    });
  });

  // valida novamente
  try {
    require.resolve('pg-format', { paths: [projectRoot] });
  } catch (e) {
    throw new Error('pg-format ainda não foi resolvido após o npm i.');
  }
}

function assertIdent(name, label) {
  const v = (name || '').trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)) {
    throw new Error(`${label} inválido: ${v}`);
  }
  return v;
}

const ADMIN = {
  host: process.env.ADMIN_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.ADMIN_PORT || process.env.DB_PORT || 5432),
  database: process.env.ADMIN_DB || 'postgres',
  user: process.env.ADMIN_USER || process.env.DB_USER || 'postgres',
  // remova qualquer senha hardcoded; use somente variáveis de ambiente
  password: process.env.ADMIN_PASSWORD || process.env.DB_PASSWORD,
};

const TARGET = {
  dbname: process.env.DB_NAME || 'dbtechclass',
  dbuser: process.env.DB_USER || 'techclass',
  dbpass: process.env.DB_PASSWORD || 'techclass',
  schema: process.env.DB_SCHEMA || 'techclass',
  host: process.env.DB_HOST || ADMIN.host,
  port: Number(process.env.DB_PORT || ADMIN.port),
};

TARGET.dbname = assertIdent(TARGET.dbname, 'DB_NAME');
TARGET.dbuser = assertIdent(TARGET.dbuser, 'DB_USER');
TARGET.schema = assertIdent(TARGET.schema, 'DB_SCHEMA');

async function withClient(cfg, fn) {
  const c = new Client(cfg);
  await c.connect();
  try { return await fn(c); }
  finally { await c.end(); }
}

async function ensureDatabaseAndUser(format) {
  // 1) Conecta ao banco "postgres" como ADMIN
  await withClient(ADMIN, async (c) => {
    // 1.1) ROLE
    const roleRes = await c.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [TARGET.dbuser]
    );

    if (roleRes.rowCount === 0) {
      console.log(`[..] Criando usuário/role ${TARGET.dbuser}...`);
      await c.query(format('CREATE ROLE %I LOGIN PASSWORD %L', TARGET.dbuser, TARGET.dbpass));
      console.log(`[OK] Role ${TARGET.dbuser} criada`);
    } else {
      console.log(`[OK] Role ${TARGET.dbuser} já existe (atualizando senha)`);
      await c.query(format('ALTER ROLE %I WITH PASSWORD %L', TARGET.dbuser, TARGET.dbpass));
    }

    // 1.2) DATABASE
    const dbRes = await c.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TARGET.dbname]
    );
    if (dbRes.rowCount === 0) {
      console.log(`[..] Criando database ${TARGET.dbname}...`);
      await c.query(`CREATE DATABASE ${TARGET.dbname}`);
      // (opcional) tornar o techclass dono da DB
      await c.query(format('ALTER DATABASE %I OWNER TO %I', TARGET.dbname, TARGET.dbuser));
      console.log(`[OK] Database ${TARGET.dbname} criada`);
    } else {
      console.log(`[OK] Database ${TARGET.dbname} já existe`);
    }
  });
}

async function configureInsideTarget(format) {
  // 2) Conecta na database alvo
  const cfgTarget = {
    host: TARGET.host,
    port: TARGET.port,
    database: TARGET.dbname,
    user: ADMIN.user,        // usa admin para ajustar owner/permissões
    password: ADMIN.password,
  };

  await withClient(cfgTarget, async (c) => {
    // 2.1) Schema + owner
    await c.query(format('CREATE SCHEMA IF NOT EXISTS %I', TARGET.schema));
    await c.query(format('ALTER SCHEMA %I OWNER TO %I', TARGET.schema, TARGET.dbuser));

    // 2.2) search_path padrão da database
    await c.query(format('ALTER DATABASE %I SET search_path = %I, public', TARGET.dbname, TARGET.schema));

    // 2.3) Conectar permissão na DB
    await c.query(format('GRANT CONNECT ON DATABASE %I TO %I', TARGET.dbname, TARGET.dbuser));

    // 2.4) Permissões existentes
    await c.query(format('GRANT USAGE ON SCHEMA %I TO %I', TARGET.schema, TARGET.dbuser));
    await c.query(format('GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA %I TO %I', TARGET.schema, TARGET.dbuser));
    await c.query(format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I TO %I', TARGET.schema, TARGET.dbuser));
    await c.query(format('GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA %I TO %I', TARGET.schema, TARGET.dbuser));

    // 2.5) Default privileges para objetos FUTUROS criados por techclass
    await c.query(format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ALL ON TABLES TO %I',
      TARGET.dbuser, TARGET.schema, TARGET.dbuser
    ));
    await c.query(format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ALL ON SEQUENCES TO %I',
      TARGET.dbuser, TARGET.schema, TARGET.dbuser
    ));
    await c.query(format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT ALL ON FUNCTIONS TO %I',
      TARGET.dbuser, TARGET.schema, TARGET.dbuser
    ));

    console.log(`[OK] Configurado schema ${TARGET.schema} na DB ${TARGET.dbname} para o usuário ${TARGET.dbuser}`);
  });
}

(async () => {
  try {
    console.log('==== Setup TechClass (DB/ROLE/SCHEMA) ====');

    // garante pg-format instalado e carrega
    await ensurePgFormatInstalled();
    const format = require('pg-format');

    // sanity check: senha admin precisa existir
    if (!ADMIN.password) {
      throw new Error('ADMIN_PASSWORD (ou DB_PASSWORD) não definido no .env');
    }

    await ensureDatabaseAndUser(format);
    await configureInsideTarget(format);
    console.log('==== Setup concluído com sucesso ====');
  } catch (err) {
    console.error('Falhou:', err.message);
    process.exit(1);
  }
})();
