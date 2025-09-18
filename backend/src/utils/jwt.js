const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signJwt(payload) {
  return jwt.sign(payload, env.auth.jwtSecret, { expiresIn: env.auth.jwtExpiresIn });
}

module.exports = { signJwt };
