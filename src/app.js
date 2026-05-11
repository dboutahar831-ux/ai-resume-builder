require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('./db');
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
const passwordResetRouter = require('./routes/passwordReset');
const hashtagsRouter   = require('./routes/hashtags');
const linkPreviewRouter = require('./routes/linkPreview');
const groupsRouter     = require('./routes/groups');
const oauthRouter      = require('./routes/oauth');
const adminRouter      = require('./routes/admin');

const app = express();

// Run DB migrations idempotently on every cold start
pool.query(`
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_sender BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_receiver BOOLEAN NOT NULL DEFAULT FALSE
`).catch(err => console.error('[Migration] messages columns:', err.message));

// Trust proxy for rate limiter behind reverse proxies
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://nexly-app-green.vercel.app',
    ];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(passport.initialize());
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
app.use('/api/auth', passwordResetRouter);
app.use('/api/hashtags', hashtagsRouter);
app.use('/api/link-preview', linkPreviewRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/auth', oauthRouter);
app.use('/api/admin', adminRouter);

// Serve React frontend (only when client/dist exists)
const clientDist = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Internal server error' });
});

module.exports = { app, corsOrigins };
