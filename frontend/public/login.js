const API_BASE = 'http://localhost:3002';

const form = document.getElementById('login-form');
const logged = document.getElementById('logged');
const tokenEl = document.getElementById('token');
const errorEl = document.getElementById('error');
const btnLogout = document.getElementById('logout');

// restaura
const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');
if (savedToken && savedUser) {
  form.hidden = true;
  logged.hidden = false;
  tokenEl.textContent = savedToken;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  const identifier = document.getElementById('identifier').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Falha no login');
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    tokenEl.textContent = data.token;
    form.hidden = true;
    logged.hidden = false;
  } catch (err) {
    errorEl.textContent = 'Credenciais inválidas.';
    errorEl.hidden = false;
  }
});

btnLogout.addEventListener('click', () => {
  localStorage.clear();
  form.hidden = false;
  logged.hidden = true;
  tokenEl.textContent = '';
});
