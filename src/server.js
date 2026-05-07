require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { app, corsOrigins } = require('./app');
const { setupSocket } = require('./socket');

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { origin: corsOrigins, credentials: true },
});
setupSocket(io);

// Start server only when run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports.io = io;
