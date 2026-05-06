const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res) => {
  // Try full query (with image_url / voice_url), fall back to basic if columns missing
  let rows;
  try {
    const r = await pool.query(
      `SELECT DISTINCT ON (other_id)
         other_id,
         u.name AS other_name, u.avatar AS other_avatar, u.last_seen_at AS other_last_seen_at,
         m.content AS last_message,
         m.image_url AS last_image_url,
         m.voice_url AS last_voice_url,
         m.created_at AS last_at,
         m.sender_id AS last_sender_id,
         (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND sender_id=other_id AND read=FALSE) AS unread
       FROM (
         SELECT CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS other_id,
                id, content, image_url, voice_url, created_at, sender_id
         FROM messages WHERE sender_id=$1 OR receiver_id=$1
       ) m
       JOIN users u ON u.id = m.other_id
       ORDER BY other_id, m.created_at DESC`,
      [req.user.id]
    );
    rows = r.rows;
  } catch {
    try {
      const r = await pool.query(
        `SELECT DISTINCT ON (other_id)
           other_id,
           u.name AS other_name, u.avatar AS other_avatar, u.last_seen_at AS other_last_seen_at,
           m.content AS last_message,
           NULL AS last_image_url, NULL AS last_voice_url,
           m.created_at AS last_at,
           m.sender_id AS last_sender_id,
           (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND sender_id=other_id AND read=FALSE) AS unread
         FROM (
           SELECT CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS other_id,
                  id, content, created_at, sender_id
           FROM messages WHERE sender_id=$1 OR receiver_id=$1
         ) m
         JOIN users u ON u.id = m.other_id
         ORDER BY other_id, m.created_at DESC`,
        [req.user.id]
      );
      rows = r.rows;
    } catch (err2) { return res.status(500).json({ error: err2.message }); }
  }
  res.json(rows);
});

// GET /api/messages/unread/count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM messages WHERE receiver_id=$1 AND read=FALSE`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/messages/typing/:userId — is userId currently typing to me?
router.get('/typing/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT typed_at FROM typing_status WHERE user_id=$1 AND to_user_id=$2`,
      [req.params.userId, req.user.id]
    );
    if (!result.rows[0]) return res.json({ typing: false });
    const diff = Date.now() - new Date(result.rows[0].typed_at).getTime();
    res.json({ typing: diff < 3000 });
  } catch { res.json({ typing: false }); }
});

// POST /api/messages/typing/:userId — I am typing to userId
router.post('/typing/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO typing_status (user_id, to_user_id, typed_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (user_id, to_user_id) DO UPDATE SET typed_at=NOW()`,
      [req.user.id, req.params.userId]
    );
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

// GET /api/messages/:userId — messages with a specific user
router.get('/:userId', auth, async (req, res) => {
  // Try full query (with new columns), fall back to basic if migration hasn't run
  let rows;
  try {
    const r = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content,
              m.image_url, m.voice_url, m.read, m.read_at, m.created_at,
              u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2)
          OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.created_at ASC LIMIT 100`,
      [req.user.id, req.params.userId]
    );
    rows = r.rows;
  } catch {
    try {
      const r = await pool.query(
        `SELECT m.id, m.sender_id, m.receiver_id, m.content,
                NULL AS image_url, NULL AS voice_url, m.read, NULL AS read_at, m.created_at,
                u.name AS sender_name, u.avatar AS sender_avatar
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE (m.sender_id=$1 AND m.receiver_id=$2)
            OR (m.sender_id=$2 AND m.receiver_id=$1)
         ORDER BY m.created_at ASC LIMIT 100`,
        [req.user.id, req.params.userId]
      );
      rows = r.rows;
    } catch (err2) { return res.status(500).json({ error: err2.message }); }
  }

  // Send messages to client immediately
  res.json(rows);

  // Mark as read in background — separate try-catch, never blocks the response
  try {
    const me = await pool.query(
      `SELECT COALESCE(show_read_receipts, TRUE) AS show_read_receipts FROM users WHERE id=$1`,
      [req.user.id]
    );
    const myReceiptsOn = me.rows[0]?.show_read_receipts !== false;
    if (myReceiptsOn) {
      await pool.query(
        `UPDATE messages SET read=TRUE, read_at=COALESCE(read_at, NOW())
         WHERE sender_id=$2 AND receiver_id=$1 AND read=FALSE`,
        [req.user.id, req.params.userId]
      );
    } else {
      await pool.query(
        `UPDATE messages SET read=TRUE WHERE sender_id=$2 AND receiver_id=$1 AND read=FALSE`,
        [req.user.id, req.params.userId]
      );
    }
  } catch {}
});

// POST /api/messages/:userId — send a message (text / image / voice)
router.post('/:userId', auth, async (req, res) => {
  const { content, image_url, voice_url } = req.body;
  if (!content?.trim() && !image_url && !voice_url)
    return res.status(400).json({ error: 'Message cannot be empty.' });
  try {
    // Try insert with new columns first
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, image_url, voice_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, req.params.userId, content?.trim() || null, image_url || null, voice_url || null]
    );
    res.json(result.rows[0]);
  } catch {
    try {
      // Fallback: insert without new columns (only text)
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING *`,
        [req.user.id, req.params.userId, content?.trim() || null]
      );
      res.json(result.rows[0]);
    } catch (err2) { res.status(500).json({ error: err2.message }); }
  }
});

module.exports = router;
