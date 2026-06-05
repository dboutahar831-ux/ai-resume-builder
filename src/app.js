require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const runMigrations = require('./migrate');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validate');

const resumesRouter = require('./routes/resumes');
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const aiRouter = require('./routes/ai');
const friendsRouter = require('./routes/friends');
const messagesRouter = require('./routes/messages');
const coverLettersRouter = require('./routes/coverLetters');
const postsRouter = require('./routes/posts');
const notificationsRouter = require('./routes/notifications');
const storiesRouter = require('./routes/stories');
const highlightsRouter = require('./routes/highlights');
const notesRouter = require('./routes/notes');
const passwordResetRouter = require('./routes/passwordReset');
const hashtagsRouter = require('./routes/hashtags');
const linkPreviewRouter = require('./routes/linkPreview');
const groupsRouter = require('./routes/groups');
const oauthRouter = require('./routes/oauth');
const adminRouter = require('./routes/admin');
const pollsRouter = require('./routes/polls');
const analyticsRouter = require('./routes/analytics');
const reportsRouter = require('./routes/reports');
const projectsRouter = require('./routes/projects');
const endorsementsRouter = require('./routes/endorsements');

const app = express();

app.set('trust proxy', 1);

// ─── Security Middleware ────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://nexly-app-green.vercel.app'];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);
app.use(passport.initialize());

// ─── Rate Limiting ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);
app.use('/api/posts', writeLimiter);
app.use('/api/messages', writeLimiter);
app.use('/api/groups', writeLimiter);

// ─── Health Check ──────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ─── Run Migrations (async, non-blocking) ──────────────────
if (process.env.NODE_ENV !== 'test') {
  runMigrations().catch(err => console.error('[Startup] Migration error:', err.message));
}

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/cover-letters', coverLettersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/highlights', highlightsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/auth', passwordResetRouter);
app.use('/api/hashtags', hashtagsRouter);
app.use('/api/link-preview', linkPreviewRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/auth', oauthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/endorsements', endorsementsRouter);

// ─── Serve React Frontend ──────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Error Handler ─────────────────────────────────────────
app.use(errorHandler);

module.exports = { app, corsOrigins };
