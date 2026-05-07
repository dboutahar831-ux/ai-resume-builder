const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/stories/feed — friends' active stories grouped by user
router.get('/feed', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      WITH viewed_stories AS (
        SELECT story_id FROM story_views WHERE viewer_id = $1
      )
      SELECT
        u.id AS user_id, u.name, u.avatar,
        json_agg(
          json_build_object(
            'id', s.id, 'media_url', s.media_url, 'media_type', s.media_type,
            'caption', s.caption, 'music_name', s.music_name, 'music_url', s.music_url,
            'created_at', s.created_at,
            'viewed', vs.story_id IS NOT NULL
          ) ORDER BY s.created_at ASC
        ) AS stories,
        COUNT(*)::int AS story_count,
        BOOL_AND(vs.story_id IS NOT NULL) AS all_seen
      FROM stories s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN viewed_stories vs ON vs.story_id = s.id
      WHERE s.expires_at > NOW()
        AND (
          s.user_id = $1 OR
          s.user_id IN (
            SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END
            FROM friendships
            WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'
          )
        )
      GROUP BY u.id, u.name, u.avatar
      ORDER BY
        CASE WHEN u.id = $1 THEN 0 ELSE 1 END,
        BOOL_AND(vs.story_id IS NOT NULL) ASC,
        MAX(s.created_at) DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load stories.' }); }
});

// POST /api/stories — create story
router.post('/', auth, async (req, res) => {
  const { media_url, media_type = 'image', caption, music_url, music_name } = req.body;
  if (!media_url) return res.status(400).json({ error: 'media_url is required.' });
  try {
    const result = await pool.query(
      `INSERT INTO stories (user_id, media_url, media_type, caption, music_url, music_name)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, media_url, media_type, caption, music_name, created_at, expires_at`,
      [req.user.id, media_url, media_type, caption || null, music_url || null, music_name || null]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to create story.' }); }
});

// POST /api/stories/:id/view
router.post('/:id/view', auth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO story_views (story_id, viewer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to record view.' }); }
});

// DELETE /api/stories/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(`DELETE FROM stories WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete story.' }); }
});

module.exports = router;
