require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('./db');
const { setupSocket } = require('./socket');
const resumesRouter = require('./routes/resumes');
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const aiRouter = require('./routes/ai');
const friendsRouter = require('./routes/friends');
const messagesRouter = require('./routes/messages');
const coverLettersRouter = require('./routes/coverLetters');
const postsRouter = require('./routes/posts');
const notificationsRouter = require('./routes/notifications');
const storiesRouter    = require('./routes/stories');
const highlightsRouter = require('./routes/highlights');
const notesRouter      = require('./routes/notes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://nexly-app-green.vercel.app',
        ],
    credentials: true,
  },
});
setupSocket(io);

// Trust proxy for rate limiter behind reverse proxies (e.g. Render, Netlify)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://nexly-app-green.vercel.app',
      ],
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check — also verifies DB connectivity
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', detail: err.message });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/cover-letters', coverLettersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/stories',       storiesRouter);
app.use('/api/highlights',    highlightsRouter);
app.use('/api/notes',         notesRouter);

// Serve React frontend (only when client/dist exists — local dev / single-server deploy)
const clientDist = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler — never leak internal details to client
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Internal server error' });
});

// Start server only when run directly (not when imported by Vercel serverless)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports.io = io;
