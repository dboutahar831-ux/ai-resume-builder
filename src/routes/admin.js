const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

router.use(auth, adminAuth);

// GET /api/admin/stats — site statistics
router.get('/stats', async (req, res) => {
  try {
    const [users, posts, resumes, jobs, messages, groups] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM posts'),
      pool.query('SELECT COUNT(*) FROM resumes'),
      pool.query('SELECT COUNT(*) FROM jobs'),
      pool.query('SELECT COUNT(*) FROM messages'),
      pool.query('SELECT COUNT(*) FROM group_chats'),
    ]);
    res.json({
      users: parseInt(users.rows[0].count),
      posts: parseInt(posts.rows[0].count),
      resumes: parseInt(resumes.rows[0].count),
      jobs: parseInt(jobs.rows[0].count),
      messages: parseInt(messages.rows[0].count),
      groups: parseInt(groups.rows[0].count),
    });
  } catch {
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, email, avatar, verified, is_admin, created_at,
              (SELECT COUNT(*) FROM posts WHERE user_id = users.id) AS post_count,
              (SELECT COUNT(*) FROM resumes WHERE user_id = users.id) AS resume_count
       FROM users ORDER BY created_at DESC LIMIT 100`
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

// PUT /api/admin/users/:id/toggle-admin — toggle admin status
router.put('/users/:id/toggle-admin', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'Cannot change your own admin status.' });
    const r = await pool.query(
      `UPDATE users SET is_admin = NOT is_admin WHERE id=$1 RETURNING id, name, is_admin`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(r.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to toggle admin.' });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'Cannot delete yourself.' });
    const r = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// GET /api/admin/recent-activity — latest posts and users
router.get('/recent-activity', async (req, res) => {
  try {
    const [recentPosts, recentUsers] = await Promise.all([
      pool.query(
        `SELECT p.id, p.content, p.created_at, u.name AS user_name
         FROM posts p JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC LIMIT 20`
      ),
      pool.query(
        `SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10`
      ),
    ]);
    res.json({ posts: recentPosts.rows, users: recentUsers.rows });
  } catch {
    res.status(500).json({ error: 'Failed to load activity.' });
  }
});

module.exports = router;
