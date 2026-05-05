require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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

// Serve React frontend
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
