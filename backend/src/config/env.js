const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

module.exports = {
  port: Number(process.env.PORT || 3002),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'dbtechclass',
    user: process.env.DB_USER || 'techclass',
    pass: process.env.DB_PASSWORD || 'techclass',
	schema: (process.env.DB_SCHEMA || 'techclass').trim(),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret-dev',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  }
};
