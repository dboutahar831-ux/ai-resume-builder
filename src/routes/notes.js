const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/notes/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT content, updated_at FROM user_notes WHERE user_id=$1`,
      [req.params.userId]
    );
    res.json(result.rows[0] || null);
  } catch { res.status(500).json({ error: 'Failed to load note.' }); }
});

// PUT /api/notes
router.put('/', auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content is required.' });
  if (content.trim().length > 60) return res.status(400).json({ error: 'Max 60 characters.' });
  try {
    const result = await pool.query(
      `INSERT INTO user_notes (user_id, content) VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET content=$2, updated_at=NOW()
       RETURNING content, updated_at`,
      [req.user.id, content.trim()]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to save note.' }); }
});

// DELETE /api/notes
router.delete('/', auth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM user_notes WHERE user_id=$1`, [req.user.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete note.' }); }
});

module.exports = router;
