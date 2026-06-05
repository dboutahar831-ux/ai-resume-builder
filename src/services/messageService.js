const pool = require('../db');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

async function getConversations(userId) {
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
    [userId]
  );
  return r.rows;
}

async function getUnreadCount(userId) {
  const result = await pool.query(
    'SELECT COUNT(*) AS count FROM messages WHERE receiver_id=$1 AND read=FALSE AND deleted=FALSE',
    [userId]
  );
  return { count: parseInt(result.rows[0].count) };
}

async function getMessageImage(msgId, userId) {
  const r = await pool.query('SELECT image_url, sender_id, receiver_id FROM messages WHERE id=$1', [msgId]);
  const msg = r.rows[0];
  if (!msg) throw new NotFoundError('Message');
  if (msg.sender_id !== userId && msg.receiver_id !== userId) throw new ForbiddenError();
  return msg;
}

async function getMessageVoice(msgId, userId) {
  const r = await pool.query('SELECT voice_url, sender_id, receiver_id FROM messages WHERE id=$1', [msgId]);
  const msg = r.rows[0];
  if (!msg) throw new NotFoundError('Message');
  if (msg.sender_id !== userId && msg.receiver_id !== userId) throw new ForbiddenError();
  return msg;
}

async function getTypingStatus(fromUserId, toUserId) {
  const result = await pool.query(
    'SELECT typed_at FROM typing_status WHERE user_id=$1 AND to_user_id=$2',
    [fromUserId, toUserId]
  );
  if (!result.rows[0]) return { typing: false };
  const diff = Date.now() - new Date(result.rows[0].typed_at).getTime();
  return { typing: diff < 3000 };
}

async function setTypingStatus(userId, targetUserId) {
  await pool.query(
    `INSERT INTO typing_status (user_id, to_user_id, typed_at) VALUES ($1,$2,NOW())
     ON CONFLICT (user_id, to_user_id) DO UPDATE SET typed_at=NOW()`,
    [userId, targetUserId]
  );
  return { ok: true };
}

async function getMessages(userId, otherUserId, offset = 0) {
  const r = await pool.query(
    `SELECT m.id, m.sender_id, m.receiver_id, m.content,
            m.image_url, m.voice_url, m.sticker, m.reply_to_id, m.deleted,
            m.deleted_for_sender, m.edited, m.edited_at, m.read, m.read_at, m.created_at,
            u.name AS sender_name, u.avatar AS sender_avatar,
            COALESCE(
              (SELECT jsonb_agg(jsonb_build_object('emoji', mr.emoji, 'user_id', mr.user_id))
               FROM message_reactions mr WHERE mr.message_id = m.id),
              '[]'::jsonb
            ) AS reactions
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE ((m.sender_id=$1 AND m.receiver_id=$2 AND m.deleted_for_sender IS NOT TRUE)
        OR (m.sender_id=$2 AND m.receiver_id=$1 AND m.deleted_for_receiver IS NOT TRUE))
     ORDER BY m.created_at DESC LIMIT 50 OFFSET $3`,
    [userId, otherUserId, offset]
  );
  const rows = r.rows;

  const replyIds = rows.filter(r => r.reply_to_id).map(r => r.reply_to_id);
  let replyMap = {};
  if (replyIds.length > 0) {
    const replyRes = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.sticker, m.image_url, u.name AS sender_name
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ANY($1::int[])`,
      [replyIds]
    );
    for (const rr of replyRes.rows) {
      replyMap[rr.id] = { id: rr.id, sender_id: rr.sender_id, sender_name: rr.sender_name, content: rr.content, sticker: rr.sticker, image_url: rr.image_url };
    }
  }

  return rows.map(r => ({ ...r, reply_to: r.reply_to_id ? (replyMap[r.reply_to_id] || null) : null })).reverse();
}

async function sendMessage(userId, receiverId, data) {
  const { content, image_url, voice_url, sticker, reply_to_id } = data;
  if (!content?.trim() && !image_url && !voice_url && !sticker) throw new ValidationError('Message cannot be empty.');

  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content, image_url, voice_url, sticker, reply_to_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, receiverId, content?.trim() || null, image_url || null, voice_url || null, sticker || null, reply_to_id || null]
  );
  const msg = result.rows[0];
  const sender = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [userId]);

  let reply_preview = null;
  if (msg.reply_to_id) {
    const replyRes = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.sticker,
              CASE WHEN m.image_url IS NOT NULL AND m.image_url <> '' THEN '/api/messages/img/' || m.id ELSE NULL END AS image_url,
              u.name AS sender_name
       FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id=$1`,
      [msg.reply_to_id]
    );
    if (replyRes.rows[0]) reply_preview = replyRes.rows[0];
  }

  return {
    ...msg,
    image_url: msg.image_url || null,
    voice_url: msg.voice_url || null,
    sender_name: sender.rows[0]?.name || 'Unknown',
    sender_avatar: sender.rows[0]?.avatar || null,
    reply_to: reply_preview,
  };
}

async function deleteConversation(userId, otherUserId) {
  await pool.query(
    `DELETE FROM messages WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)`,
    [userId, otherUserId]
  );
  return { ok: true };
}

async function deleteMessage(userId, msgId) {
  const msgRes = await pool.query('SELECT sender_id FROM messages WHERE id=$1', [msgId]);
  if (!msgRes.rows[0]) throw new NotFoundError('Message');
  if (msgRes.rows[0].sender_id !== userId) throw new ForbiddenError('You can only delete your own messages.');
  await pool.query('UPDATE messages SET deleted=TRUE WHERE id=$1', [msgId]);
  return { ok: true };
}

async function editMessage(userId, msgId, content) {
  if (!content?.trim()) throw new ValidationError('Content cannot be empty.');
  const msgRes = await pool.query('SELECT sender_id FROM messages WHERE id=$1', [msgId]);
  if (!msgRes.rows[0]) throw new NotFoundError('Message');
  if (msgRes.rows[0].sender_id !== userId) throw new ForbiddenError('You can only edit your own messages.');
  await pool.query('UPDATE messages SET content=$1, edited=TRUE, edited_at=NOW() WHERE id=$2', [content.trim(), msgId]);
  return { ok: true, content: content.trim() };
}

async function hideMessage(userId, msgId) {
  const msgRes = await pool.query('SELECT sender_id FROM messages WHERE id=$1', [msgId]);
  if (!msgRes.rows[0]) throw new NotFoundError('Message');
  if (msgRes.rows[0].sender_id !== userId) throw new ForbiddenError('You can only hide your own messages.');
  await pool.query('UPDATE messages SET deleted_for_sender=TRUE WHERE id=$1', [msgId]);
  return { ok: true };
}

async function hideReceivedMessage(userId, msgId) {
  const msgRes = await pool.query('SELECT receiver_id FROM messages WHERE id=$1', [msgId]);
  if (!msgRes.rows[0]) throw new NotFoundError('Message');
  if (msgRes.rows[0].receiver_id !== userId) throw new ForbiddenError('Not your received message.');
  await pool.query('UPDATE messages SET deleted_for_receiver=TRUE WHERE id=$1', [msgId]);
  return { ok: true };
}

async function reactToMessage(userId, msgId, emoji) {
  if (!emoji) throw new ValidationError('Emoji is required.');
  const msg = await pool.query('SELECT sender_id, receiver_id FROM messages WHERE id=$1', [msgId]);
  if (!msg.rows[0]) throw new NotFoundError('Message');
  const m = msg.rows[0];
  if (m.sender_id !== userId && m.receiver_id !== userId) throw new ForbiddenError('Not a participant.');

  const existing = await pool.query('SELECT emoji FROM message_reactions WHERE message_id=$1 AND user_id=$2', [msgId, userId]);
  if (existing.rows[0]?.emoji === emoji) {
    await pool.query('DELETE FROM message_reactions WHERE message_id=$1 AND user_id=$2', [msgId, userId]);
    return { action: 'removed' };
  }
  await pool.query(
    `INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1,$2,$3)
     ON CONFLICT (message_id, user_id) DO UPDATE SET emoji=$3`,
    [msgId, userId, emoji]
  );
  return { action: 'added', emoji };
}

async function getMessageReactions(msgId) {
  const r = await pool.query(
    `SELECT mr.*, u.name AS user_name, u.avatar AS user_avatar
     FROM message_reactions mr JOIN users u ON u.id = mr.user_id
     WHERE mr.message_id=$1 ORDER BY mr.created_at ASC`,
    [msgId]
  );
  return r.rows;
}

module.exports = {
  getConversations, getUnreadCount, getMessageImage, getMessageVoice,
  getTypingStatus, setTypingStatus, getMessages, sendMessage, deleteConversation,
  deleteMessage, editMessage, hideMessage, hideReceivedMessage, reactToMessage, getMessageReactions,
};
