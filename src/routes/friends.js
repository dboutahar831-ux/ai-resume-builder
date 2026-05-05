const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/friends/search?q=
router.get('/search', auth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.location, u.avatar, u.last_seen_at,
        (SELECT status FROM friendships
         WHERE (requester_id=$1 AND addressee_id=u.id)
            OR (requester_id=u.id AND addressee_id=$1)
         LIMIT 1) AS friendship_status,
        (SELECT requester_id FROM friendships
         WHERE (requester_id=$1 AND addressee_id=u.id)
            OR (requester_id=u.id AND addressee_id=$1)
         LIMIT 1) AS requester_id
       FROM users u
       WHERE u.id != $1 AND u.verified = TRUE
         AND (u.name ILIKE $2 OR u.email ILIKE $2)
       LIMIT 20`,
      [req.user.id, `%${q}%`]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/friends — accepted friends
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.location, u.avatar, u.last_seen_at
       FROM friendships f
       JOIN users u ON (
         CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END = u.id
       )
       WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='accepted'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/friends/requests — incoming pending requests
router.get('/requests', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar, f.created_at
       FROM friendships f
       JOIN users u ON f.requester_id = u.id
       WHERE f.addressee_id=$1 AND f.status='pending'
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/friends/profile/:userId — public profile
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.location, u.linkedin, u.avatar, u.bio, u.created_at, u.last_seen_at,
        (SELECT status FROM friendships
         WHERE (requester_id=$1 AND addressee_id=$2)
            OR (requester_id=$2 AND addressee_id=$1)
         LIMIT 1) AS friendship_status,
        (SELECT requester_id FROM friendships
         WHERE (requester_id=$1 AND addressee_id=$2)
            OR (requester_id=$2 AND addressee_id=$1)
         LIMIT 1) AS requester_id
       FROM users u WHERE u.id=$2`,
      [req.user.id, req.params.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/friends/request/:userId — send request
router.post('/request/:userId', auth, async (req, res) => {
  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself.' });
  try {
    await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, targetId]
    );
    res.json({ message: 'Request sent.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/friends/accept/:userId — accept request
router.put('/accept/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE friendships SET status='accepted'
       WHERE requester_id=$1 AND addressee_id=$2 AND status='pending'`,
      [req.params.userId, req.user.id]
    );
    res.json({ message: 'Request accepted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/friends/reject/:userId — reject request
router.put('/reject/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE requester_id=$1 AND addressee_id=$2 AND status='pending'`,
      [req.params.userId, req.user.id]
    );
    res.json({ message: 'Request rejected.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/friends/:userId — unfriend
router.delete('/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id=$1 AND addressee_id=$2)
          OR (requester_id=$2 AND addressee_id=$1)`,
      [req.user.id, req.params.userId]
    );
    res.json({ message: 'Unfriended.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
