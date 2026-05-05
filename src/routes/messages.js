const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/messages/conversations — all conversations with last message
router.get('/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_id)
         other_id,
         u.name AS other_name, u.avatar AS other_avatar, u.last_seen_at AS other_last_seen_at,
         m.content AS last_message,
         m.created_at AS last_at,
         m.sender_id AS last_sender_id,
         (SELECT COUNT(*) FROM messages
          WHERE receiver_id=$1 AND sender_id=other_id AND read=FALSE) AS unread
       FROM (
         SELECT CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS other_id,
                id, content, created_at, sender_id
         FROM messages WHERE sender_id=$1 OR receiver_id=$1
       ) m
       JOIN users u ON u.id = m.other_id
       ORDER BY other_id, m.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/messages/:userId — messages with specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.read, m.created_at,
              u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2)
          OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.user.id, req.params.userId]
    );
    // Mark as read
    await pool.query(
      `UPDATE messages SET read=TRUE
       WHERE sender_id=$2 AND receiver_id=$1 AND read=FALSE`,
      [req.user.id, req.params.userId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messages/:userId — send message
router.post('/:userId', auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.id, req.params.userId, content.trim()]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/messages/unread/count — total unread count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM messages WHERE receiver_id=$1 AND read=FALSE`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
