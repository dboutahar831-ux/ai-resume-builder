const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/highlights/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.id, h.title, h.cover_url, h.created_at,
        (SELECT json_agg(json_build_object(
           'id', hi.id, 'media_url', hi.media_url, 'media_type', hi.media_type, 'caption', hi.caption
         ) ORDER BY hi.created_at ASC)
         FROM highlight_items hi WHERE hi.highlight_id = h.id
        ) AS items,
        (SELECT COUNT(*) FROM highlight_items WHERE highlight_id = h.id)::int AS item_count
      FROM highlights h
      WHERE h.user_id = $1
      ORDER BY h.created_at DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load highlights.' }); }
});

// POST /api/highlights
router.post('/', auth, async (req, res) => {
  const { title, cover_url } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required.' });
  try {
    const result = await pool.query(
      `INSERT INTO highlights (user_id, title, cover_url) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.id, title.trim(), cover_url || null]
    );
    res.json({ ...result.rows[0], items: [], item_count: 0 });
  } catch { res.status(500).json({ error: 'Failed to create highlight.' }); }
});

// POST /api/highlights/:id/items
router.post('/:id/items', auth, async (req, res) => {
  const { media_url, media_type = 'image', caption } = req.body;
  if (!media_url) return res.status(400).json({ error: 'media_url is required.' });
  try {
    const hl = await pool.query(`SELECT id FROM highlights WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    if (!hl.rows[0]) return res.status(403).json({ error: 'Not authorized.' });
    const result = await pool.query(
      `INSERT INTO highlight_items (highlight_id, media_url, media_type, caption)
       VALUES ($1,$2,$3,$4) RETURNING id, media_url, media_type, caption, created_at`,
      [req.params.id, media_url, media_type, caption || null]
    );
    await pool.query(`UPDATE highlights SET cover_url = COALESCE(cover_url, $1) WHERE id=$2`, [media_url, req.params.id]);
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to add item.' }); }
});

// DELETE /api/highlights/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM highlights WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete highlight.' }); }
});

module.exports = router;
