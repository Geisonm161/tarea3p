const config = require('./config');
const createApp = require('./app');

const server = createApp();

server.listen(config.port, () => {
  console.log(`TaskFlow disponible en http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
