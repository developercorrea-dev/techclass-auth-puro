const { findByIdentifier } = require('../repositories/user.repository');
const { comparePassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');

async function login(identifier, password) {
  const user = await findByIdentifier(identifier);
  if (!user) return { ok: false, code: 'INVALID_CREDENTIALS' };

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) return { ok: false, code: 'INVALID_CREDENTIALS' };

  const token = signJwt({ sub: user.id, username: user.username, email: user.email });
  return {
    ok: true,
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    }
  };
}

module.exports = { login };
