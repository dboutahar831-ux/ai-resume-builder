const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT ON (other_id)
         other_id,
         u.name AS other_name, u.avatar AS other_avatar, u.last_seen_at AS other_last_seen_at,
         m.content AS last_message,
         COALESCE(m.image_url != '' AND m.image_url IS NOT NULL, FALSE) AS has_image,
         COALESCE(m.voice_url != '' AND m.voice_url IS NOT NULL, FALSE) AS has_voice,
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
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations.' });
  }
});

// GET /api/messages/unread/count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM messages WHERE receiver_id=$1 AND read=FALSE`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch { res.status(500).json({ error: 'Failed to load unread count.' }); }
});

// GET /api/messages/img/:msgId — serve image for a message (avoids large bulk response)
router.get('/img/:msgId', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT image_url, sender_id, receiver_id FROM messages WHERE id=$1', [req.params.msgId]);
    const msg = r.rows[0];
    if (!msg) return res.status(404).end();
    // Only allow sender or receiver to fetch
    if (msg.sender_id !== req.user.id && msg.receiver_id !== req.user.id)
      return res.status(403).end();
    const url = msg.image_url;
    if (!url) return res.status(404).end();
    if (url.startsWith('data:')) {
      const [header, data] = url.split(',');
      const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
      const buf = Buffer.from(data, 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.send(buf);
    }
    res.redirect(url);
  } catch { res.status(500).json({ error: 'Failed to load image.' }); }
});

// GET /api/messages/voice/:msgId — serve voice for a message
router.get('/voice/:msgId', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT voice_url, sender_id, receiver_id FROM messages WHERE id=$1', [req.params.msgId]);
    const msg = r.rows[0];
    if (!msg) return res.status(404).end();
    if (msg.sender_id !== req.user.id && msg.receiver_id !== req.user.id)
      return res.status(403).end();
    const url = msg.voice_url;
    if (!url) return res.status(404).end();
    if (url.startsWith('data:')) {
      const [header, data] = url.split(',');
      const mime = (header.match(/data:([^;]+)/) || [])[1] || 'audio/webm';
      const buf = Buffer.from(data, 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.send(buf);
    }
    res.redirect(url);
  } catch { res.status(500).json({ error: 'Failed to load voice message.' }); }
});

// GET /api/messages/typing/:userId
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

// POST /api/messages/typing/:userId
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

// GET /api/messages/:userId — messages list
router.get('/:userId', auth, async (req, res) => {
  let rows;
  try {
    const r = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content,
              CASE WHEN m.image_url IS NOT NULL AND m.image_url <> ''
                   THEN '/api/messages/img/' || m.id ELSE NULL END AS image_url,
              CASE WHEN m.voice_url IS NOT NULL AND m.voice_url <> ''
                   THEN '/api/messages/voice/' || m.id ELSE NULL END AS voice_url,
              m.read, m.read_at, m.created_at,
              u.name AS sender_name, u.avatar AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2)
          OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.created_at ASC LIMIT 100`,
      [req.user.id, req.params.userId]
    );
    rows = r.rows;
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load messages.' });
  }

  res.json(rows);

  // Mark as read in background
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

// POST /api/messages/:userId — send message
router.post('/:userId', auth, async (req, res) => {
  const { content, image_url, voice_url } = req.body;
  if (!content?.trim() && !image_url && !voice_url)
    return res.status(400).json({ error: 'Message cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, image_url, voice_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, req.params.userId, content?.trim() || null, image_url || null, voice_url || null]
    );
    const msg = result.rows[0];
    res.json({
      ...msg,
      image_url: msg.image_url ? `/api/messages/img/${msg.id}` : null,
      voice_url: msg.voice_url ? `/api/messages/voice/${msg.id}` : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
