# techclass-auth-puro
Exemplo para ensinar autenticação em aplicações web usando Node.js puro.
Trata-se de um projeto full stack mínimo de autenticação escrito sem frameworks.  
Backend em Node.js puro com PostgreSQL, e frontend vanilla (HTML + CSS + JavaScript).

## Funcionalidades
- Login com usuário ou e-mail e senha
- Hash de senha com bcrypt
- Geração de JWT para sessão stateless
- Scripts de setup, migração e seed do banco
- API com rotas básicas: `/api/login` e `/api/health`

## Estrutura de diretórios
```
backend/
  src/
    controllers/   # Lógica de entrada (HTTP)
    routes/        # Definição das rotas
    services/      # Regras de negócio
    repositories/  # Consultas ao banco
    utils/         # DB, JWT, senha
  scripts/         # Setup, migração e seed
  package.json
frontend/
  public/
    index.html     # Página de login
    login.js       # Lógica de autenticação (vanilla JS)
    style.css      # Estilos básicos
```

## Pré-requisitos
- Node.js 18 ou superior
- PostgreSQL 13 ou superior

## Instalação e execução

### Backend
```bash
cd backend
npm install
# Configure .env (veja seção abaixo)
npm run db:init   # cria DB, aplica migração e insere usuário admin
npm start         # inicia API em http://localhost:3002
```

### Frontend
Pode ser servido por qualquer servidor estático. Exemplo:
```bash
npx serve frontend/public -l 5174
```
A API já permite CORS para `http://localhost:5174`.

Usuário inicial:
```
username: admin
senha: admin123
```

## Variáveis de ambiente

Crie um arquivo `.env` em `backend/` (baseado em `.env.example`):

```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_USER=techclass
DB_PASSWORD=techclass
DB_DATABASE=techclass
DB_SCHEMA=techclass
JWT_SECRET=supersecret
JWT_EXPIRES_IN=1h
```

## Endpoints da API

### GET /api/health
Retorna status do servidor.

### POST /api/login
Body:
```json
{
  "identifier": "admin",
  "password": "admin123"
}
```
Resposta 200 OK:
```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@localhost"
  }
}
```

## Considerações de segurança
- Senhas armazenadas com bcrypt (saltRounds=10)
- JWT assinado com segredo definido no `.env`
- CORS restrito ao frontend local
- Usuário do banco com permissões limitadas
- Funcionalidades não implementadas: refresh tokens, rate limiting, auditoria

## Melhorias sugeridas
- Rota protegida de exemplo (`/api/me`)
- Cadastro e recuperação de senha
- Refresh tokens e cookies HttpOnly
- Migrations versionadas
- Testes automatizados (Jest)
- Docker Compose para subir API e Postgres

## Licença
MIT.


## Baixar o projeto no Github
```CMD
git clone https://github.com/developercorrea-dev/techclass-auth-puro.git
cd techclass-auth-puro
```

## Executar script setup.js
```cd backend
npm install
npm run db:init
```

## Para rodar a API (Back-end) e o Front-end
```
-- API (Back-end)
CMD
cd C:\Users\Instrutor\Documents\techclass-auth-puro\backend
npm start

-- Front-end
CMD
cd C:\Users\Instrutor\Documents\techclass-auth-puro\frontend
npx serve public -l 5174
Abrir no navegador http://localhost:5174

Informe:
username: admin
password: admin123
``` 