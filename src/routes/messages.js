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
         m.sticker IS NOT NULL AS has_sticker,
         m.created_at AS last_at,
         m.sender_id AS last_sender_id,
         (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND sender_id=other_id AND read=FALSE AND deleted=FALSE) AS unread
       FROM (
         SELECT CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS other_id,
                id, content, image_url, voice_url, sticker, created_at, sender_id
         FROM messages WHERE (sender_id=$1 OR receiver_id=$1) AND deleted=FALSE
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
      `SELECT COUNT(*) AS count FROM messages WHERE receiver_id=$1 AND read=FALSE AND deleted=FALSE`,
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
              m.sticker, m.reply_to_id, m.deleted, m.read, m.read_at, m.created_at,
              u.name AS sender_name, u.avatar AS sender_avatar,
              COALESCE(
                (SELECT jsonb_agg(jsonb_build_object('emoji', mr.emoji, 'user_id', mr.user_id))
                 FROM message_reactions mr WHERE mr.message_id = m.id),
                '[]'::jsonb
              ) AS reactions
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

  // Attach reply_to previews
  const replyIds = rows.filter(r => r.reply_to_id).map(r => r.reply_to_id);
  let replyMap = {};
  if (replyIds.length > 0) {
    try {
      const replyRes = await pool.query(
        `SELECT m.id, m.sender_id, m.content, m.sticker,
                CASE WHEN m.image_url IS NOT NULL AND m.image_url <> ''
                     THEN '/api/messages/img/' || m.id ELSE NULL END AS image_url,
                u.name AS sender_name
         FROM messages m JOIN users u ON u.id = m.sender_id
         WHERE m.id = ANY($1::int[])`,
        [replyIds]
      );
      for (const r of replyRes.rows) {
        replyMap[r.id] = { id: r.id, sender_id: r.sender_id, sender_name: r.sender_name, content: r.content, sticker: r.sticker, image_url: r.image_url };
      }
    } catch {}
  }
  rows = rows.map(r => ({ ...r, reply_to: r.reply_to_id ? (replyMap[r.reply_to_id] || null) : null }));

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
  const { content, image_url, voice_url, sticker, reply_to_id } = req.body;
  if (!content?.trim() && !image_url && !voice_url && !sticker)
    return res.status(400).json({ error: 'Message cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, image_url, voice_url, sticker, reply_to_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, req.params.userId, content?.trim() || null, image_url || null, voice_url || null, sticker || null, reply_to_id || null]
    );
    const msg = result.rows[0];
    const sender = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [req.user.id]);
    let reply_preview = null;
    if (msg.reply_to_id) {
      const replyRes = await pool.query(
        'SELECT m.id, m.sender_id, m.content, m.sticker, CASE WHEN m.image_url IS NOT NULL AND m.image_url <> \'\' THEN \'/api/messages/img/\' || m.id ELSE NULL END AS image_url, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id=$1',
        [msg.reply_to_id]
      );
      if (replyRes.rows[0]) reply_preview = replyRes.rows[0];
    }
    res.json({
      ...msg,
      image_url: msg.image_url ? `/api/messages/img/${msg.id}` : null,
      voice_url: msg.voice_url ? `/api/messages/voice/${msg.id}` : null,
      sender_name: sender.rows[0]?.name || 'Unknown',
      sender_avatar: sender.rows[0]?.avatar || null,
      reply_to: reply_preview,
    });
  } catch (err) {
    console.error('[POST /messages/:userId] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/messages/conversation/:userId — delete all messages with a user
router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM messages
       WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)`,
      [req.user.id, req.params.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear conversation.' });
  }
});

// DELETE /api/messages/:msgId — soft delete a message (only sender)
router.delete('/:msgId', auth, async (req, res) => {
  try {
    const msgRes = await pool.query('SELECT sender_id FROM messages WHERE id=$1', [req.params.msgId]);
    if (!msgRes.rows[0]) return res.status(404).json({ error: 'Message not found.' });
    if (msgRes.rows[0].sender_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own messages.' });

    await pool.query('UPDATE messages SET deleted=TRUE WHERE id=$1', [req.params.msgId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// POST /api/messages/:msgId/react — react to a message
router.post('/:msgId/react', auth, async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required.' });
  try {
    // Verify message exists and user is participant
    const msg = await pool.query('SELECT sender_id, receiver_id FROM messages WHERE id=$1', [req.params.msgId]);
    if (!msg.rows[0]) return res.status(404).json({ error: 'Message not found.' });
    const m = msg.rows[0];
    if (m.sender_id !== req.user.id && m.receiver_id !== req.user.id)
      return res.status(403).json({ error: 'Not a participant.' });

    // Upsert reaction (toggle if same emoji)
    const existing = await pool.query('SELECT emoji FROM message_reactions WHERE message_id=$1 AND user_id=$2', [req.params.msgId, req.user.id]);
    if (existing.rows[0]?.emoji === emoji) {
      await pool.query('DELETE FROM message_reactions WHERE message_id=$1 AND user_id=$2', [req.params.msgId, req.user.id]);
      return res.json({ action: 'removed' });
    }
    await pool.query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1,$2,$3)
       ON CONFLICT (message_id, user_id) DO UPDATE SET emoji=$3`,
      [req.params.msgId, req.user.id, emoji]
    );
    res.json({ action: 'added', emoji });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add reaction.' });
  }
});

// GET /api/messages/:msgId/reactions — get reactions for a message
router.get('/:msgId/reactions', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT mr.*, u.name AS user_name, u.avatar AS user_avatar
       FROM message_reactions mr
       JOIN users u ON u.id = mr.user_id
       WHERE mr.message_id=$1
       ORDER BY mr.created_at ASC`,
      [req.params.msgId]
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load reactions.' });
  }
});

module.exports = router;
