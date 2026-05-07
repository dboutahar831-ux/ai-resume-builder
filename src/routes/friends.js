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
      `SELECT u.id, u.name, u.location, u.avatar,
        CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at,
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
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)
       LIMIT 20`,
      [req.user.id, `%${q}%`]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to search users.' }); }
});

// GET /api/friends/suggestions — users not yet connected
router.get('/suggestions', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar, u.bio, u.location
       FROM users u
       WHERE u.id != $1 AND u.verified = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM friendships f
         WHERE (f.requester_id = $1 AND f.addressee_id = u.id)
            OR (f.requester_id = u.id AND f.addressee_id = $1)
       )
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)
       ORDER BY RANDOM()
       LIMIT 4`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load suggestions.' }); }
});

// GET /api/friends — accepted friends
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.location, u.avatar,
        CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at
       FROM friendships f
       JOIN users u ON (
         CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END = u.id
       )
       WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='accepted'
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
         AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load friends.' }); }
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
  } catch { res.status(500).json({ error: 'Failed to load requests.' }); }
});

// GET /api/friends/profile/:userId — public profile
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.location, u.linkedin, u.avatar, u.bio, u.cover_image, u.created_at,
        CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at,
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

    // Check block status
    const blockCheck = await pool.query(
      `SELECT
        EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=$2) AS blocked,
        EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$2 AND blocked_id=$1) AS blocked_by_them`,
      [req.user.id, req.params.userId]
    );
    result.rows[0].blocked = blockCheck.rows[0].blocked;
    result.rows[0].blocked_by_them = blockCheck.rows[0].blocked_by_them;

    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to load profile.' }); }
});

// POST /api/friends/request/:userId — send request
router.post('/request/:userId', auth, async (req, res) => {
  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself.' });
  // Check if blocked
  const checkBlock = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=$2) AS blocked,
            EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$2 AND blocked_id=$1) AS blocked_by_them`,
    [req.user.id, targetId]
  );
  if (checkBlock.rows[0].blocked) return res.status(400).json({ error: 'You have blocked this user.' });
  if (checkBlock.rows[0].blocked_by_them) return res.status(400).json({ error: 'This user has blocked you.' });
  try {
    await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, targetId]
    );
    res.json({ message: 'Request sent.' });
  } catch { res.status(500).json({ error: 'Failed to send request.' }); }
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
  } catch { res.status(500).json({ error: 'Failed to accept request.' }); }
});

// PUT /api/friends/reject/:userId — reject request
router.put('/reject/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships WHERE requester_id=$1 AND addressee_id=$2 AND status='pending'`,
      [req.params.userId, req.user.id]
    );
    res.json({ message: 'Request rejected.' });
  } catch { res.status(500).json({ error: 'Failed to reject request.' }); }
});

// DELETE /api/friends/:userId — unfriend
router.delete('/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
      [req.user.id, req.params.userId]
    );
    res.json({ message: 'Unfriended.' });
  } catch { res.status(500).json({ error: 'Failed to unfriend.' }); }
});

// ─── BLOCK / UNBLOCK ─────────────────────────────────────────

// POST /api/friends/block/:userId — block a user
router.post('/block/:userId', auth, async (req, res) => {
  const targetId = parseInt(req.params.userId);
  if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot block yourself.' });
  try {
    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, targetId]
    );
    // Also remove friendship if exists
    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
      [req.user.id, targetId]
    );
    res.json({ message: 'User blocked.' });
  } catch { res.status(500).json({ error: 'Failed to block user.' }); }
});

// POST /api/friends/unblock/:userId — unblock a user
router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM blocks WHERE blocker_id=$1 AND blocked_id=$2`,
      [req.user.id, req.params.userId]
    );
    res.json({ message: 'User unblocked.' });
  } catch { res.status(500).json({ error: 'Failed to unblock user.' }); }
});

// GET /api/friends/blocked — get blocked users list
router.get('/blocked', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar, u.bio, b.created_at AS blocked_at
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id=$1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load blocked users.' }); }
});

// GET /api/friends/is-blocked/:userId — check if user is blocked
router.get('/is-blocked/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM blocks
         WHERE blocker_id=$1 AND blocked_id=$2
       ) AS blocked`,
      [req.user.id, req.params.userId]
    );
    const blockedByThem = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM blocks
         WHERE blocker_id=$2 AND blocked_id=$1
       ) AS blocked_by_them`,
      [req.user.id, req.params.userId]
    );
    res.json({
      blocked: result.rows[0].blocked,
      blocked_by_them: blockedByThem.rows[0].blocked_by_them,
    });
  } catch { res.status(500).json({ error: 'Failed to check.' }); }
});

module.exports = router;
