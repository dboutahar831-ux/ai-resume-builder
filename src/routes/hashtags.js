const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/hashtags/trending — top hashtags
router.get('/trending', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT tag, post_count FROM hashtags ORDER BY post_count DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load trending hashtags.' });
  }
});

// GET /api/hashtags/:tag — posts for a hashtag
router.get('/:tag', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name, u.avatar,
              (SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id) AS reactions_count,
              (SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comments_count
       FROM posts p
       JOIN post_hashtags ph ON ph.post_id = p.id
       JOIN hashtags h ON h.id = ph.hashtag_id
       JOIN users u ON u.id = p.user_id
       WHERE h.tag = $1
       ORDER BY p.created_at DESC LIMIT 50`,
      [req.params.tag.toLowerCase()]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load hashtag posts.' });
  }
});

module.exports = router;
