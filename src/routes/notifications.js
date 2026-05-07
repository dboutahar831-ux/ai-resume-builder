const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.id, n.type, n.post_id, n.comment_id, n.read, n.created_at,
        u.id AS actor_id, u.name AS actor_name, u.avatar AS actor_avatar
      FROM notifications n
      JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 40
    `, [req.user.id]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load notifications.' }); }
});

// GET /api/notifications/unread/count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND read=FALSE',
      [req.user.id]
    );
    res.json({ count: result.rows[0].count });
  } catch { res.status(500).json({ error: 'Failed to load unread count.' }); }
});

// PUT /api/notifications/read-all
router.put('/read-all', auth, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read=TRUE WHERE user_id=$1', [req.user.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to mark as read.' }); }
});

module.exports = router;
