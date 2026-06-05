require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { app, corsOrigins } = require('./app');
const { setupSocket } = require('./socket');
const groupsRouter = require('./routes/groups');
const postsRouter = require('./routes/posts');
const friendsRouter = require('./routes/friends');
const logger = require('./utils/logger');

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { origin: corsOrigins, credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
});
setupSocket(io);
groupsRouter.setIo(io);
postsRouter.setIo(io);
friendsRouter.setIo(io);

if (require.main === module) {
  server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

// ─── Graceful Shutdown ─────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    require('./db').end().then(() => {
      logger.info('DB pool closed.');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
module.exports.io = io;
