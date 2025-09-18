const http = require('http');
const env = require('./config/env');
const { handleRequest } = require('./routes');

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(env.port, () => {
  console.log(`API (pura) rodando em http://localhost:${env.port}`);
});
