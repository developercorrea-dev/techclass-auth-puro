const authService = require('../services/auth.service');

async function login(req, res) {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return sendJson(res, 400, { error: 'IDENTIFIER_AND_PASSWORD_REQUIRED' });
    }
    const result = await authService.login(identifier, password);
    if (!result.ok) {
      return sendJson(res, 401, { error: result.code });
    }
    return sendJson(res, 200, result.data);
  } catch (err) {
    console.error('[ERROR]', err);
    return sendJson(res, 500, { error: 'INTERNAL_SERVER_ERROR' });
  }
}

// helpers (sem Express)
function sendJson(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    // CORS básico (frontend estático)
    'Access-Control-Allow-Origin': 'http://localhost:5174',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(payload);
}

module.exports = { login, sendJson };
