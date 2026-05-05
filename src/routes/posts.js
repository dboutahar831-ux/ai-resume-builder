const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/posts/feed
router.get('/feed', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.content, p.image_url, p.created_at,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        COALESCE((SELECT COUNT(*)::int FROM post_reactions WHERE post_id = p.id), 0) AS reactions_count,
        COALESCE((SELECT COUNT(*)::int FROM comments WHERE post_id = p.id), 0) AS comments_count,
        (SELECT json_agg(json_build_object('type', t.type, 'count', t.cnt))
         FROM (SELECT type, COUNT(*)::int AS cnt FROM post_reactions WHERE post_id = p.id GROUP BY type) t
        ) AS reactions_summary,
        (SELECT type FROM post_reactions WHERE post_id = p.id AND user_id = $1 LIMIT 1) AS my_reaction
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
         OR p.user_id IN (
           SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END
           FROM friendships
           WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'
         )
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts
router.post('/', auth, async (req, res) => {
  const { content, image_url } = req.body;
  if (!content?.trim() && !image_url) return res.status(400).json({ error: 'Post cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url) VALUES ($1,$2,$3)
       RETURNING id, content, image_url, created_at`,
      [req.user.id, content?.trim() || null, image_url || null]
    );
    const post = result.rows[0];
    const u = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [req.user.id]);
    res.json({ ...post, user_id: req.user.id, user_name: u.rows[0].name, user_avatar: u.rows[0].avatar, reactions_count: 0, comments_count: 0, reactions_summary: null, my_reaction: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:postId/react
router.post('/:postId/react', auth, async (req, res) => {
  const { type } = req.body;
  if (!['like', 'laugh', 'sad', 'angry'].includes(type)) return res.status(400).json({ error: 'Invalid type.' });
  try {
    const ex = await pool.query('SELECT type FROM post_reactions WHERE post_id=$1 AND user_id=$2', [req.params.postId, req.user.id]);
    if (ex.rows.length > 0 && ex.rows[0].type === type) {
      await pool.query('DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2', [req.params.postId, req.user.id]);
      return res.json({ my_reaction: null });
    }
    if (ex.rows.length > 0) {
      await pool.query('UPDATE post_reactions SET type=$1 WHERE post_id=$2 AND user_id=$3', [type, req.params.postId, req.user.id]);
    } else {
      await pool.query('INSERT INTO post_reactions (post_id, user_id, type) VALUES ($1,$2,$3)', [req.params.postId, req.user.id, type]);
    }
    res.json({ my_reaction: type });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/posts/:postId/comments
router.get('/:postId/comments', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id, c.content, c.image_url, c.created_at,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        (SELECT json_agg(json_build_object('type', t.type, 'count', t.cnt))
         FROM (SELECT type, COUNT(*)::int AS cnt FROM comment_reactions WHERE comment_id = c.id GROUP BY type) t
        ) AS reactions_summary,
        (SELECT type FROM comment_reactions WHERE comment_id = c.id AND user_id = $2 LIMIT 1) AS my_reaction
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.postId, req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:postId/comments
router.post('/:postId/comments', auth, async (req, res) => {
  const { content, image_url } = req.body;
  if (!content?.trim() && !image_url) return res.status(400).json({ error: 'Comment cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content, image_url) VALUES ($1,$2,$3,$4)
       RETURNING id, content, image_url, created_at`,
      [req.params.postId, req.user.id, content?.trim() || null, image_url || null]
    );
    const c = result.rows[0];
    const u = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [req.user.id]);
    res.json({ ...c, user_id: req.user.id, user_name: u.rows[0].name, user_avatar: u.rows[0].avatar, reactions_summary: null, my_reaction: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id=$1 AND user_id=$2', [req.params.commentId, req.user.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/posts/:postId/comments/:commentId/react
router.post('/:postId/comments/:commentId/react', auth, async (req, res) => {
  const { type } = req.body;
  if (!['like', 'laugh', 'sad', 'angry'].includes(type)) return res.status(400).json({ error: 'Invalid type.' });
  try {
    const ex = await pool.query('SELECT type FROM comment_reactions WHERE comment_id=$1 AND user_id=$2', [req.params.commentId, req.user.id]);
    if (ex.rows.length > 0 && ex.rows[0].type === type) {
      await pool.query('DELETE FROM comment_reactions WHERE comment_id=$1 AND user_id=$2', [req.params.commentId, req.user.id]);
      return res.json({ my_reaction: null });
    }
    if (ex.rows.length > 0) {
      await pool.query('UPDATE comment_reactions SET type=$1 WHERE comment_id=$2 AND user_id=$3', [type, req.params.commentId, req.user.id]);
    } else {
      await pool.query('INSERT INTO comment_reactions (comment_id, user_id, type) VALUES ($1,$2,$3)', [req.params.commentId, req.user.id, type]);
    }
    res.json({ my_reaction: type });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
