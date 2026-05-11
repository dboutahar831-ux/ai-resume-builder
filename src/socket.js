const jwt = require('jsonwebtoken');
const pool = require('./db');

const onlineUsers = new Map(); // userId -> Set of socketIds

function setupSocket(io) {
  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Notify others that user is online
    socket.broadcast.emit('user:online', { userId });

    // Handle sending a message
    socket.on('message:send', async ({ receiverId, content, image_url, voice_url, sticker, reply_to_id }, callback) => {
      try {
        const result = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, content, image_url, voice_url, sticker, reply_to_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [userId, receiverId, content || null, image_url || null, voice_url || null, sticker || null, reply_to_id || null]
        );
        const msg = result.rows[0];
        let reply_preview = null;
        if (msg.reply_to_id) {
          const replyRes = await pool.query(
            'SELECT id, sender_id, content, sticker, image_url FROM messages WHERE id=$1',
            [msg.reply_to_id]
          );
          if (replyRes.rows[0]) {
            const r = replyRes.rows[0];
            const replySender = await pool.query('SELECT name FROM users WHERE id=$1', [r.sender_id]);
            reply_preview = {
              id: r.id,
              sender_id: r.sender_id,
              sender_name: replySender.rows[0]?.name || 'Unknown',
              content: r.content,
              sticker: r.sticker,
              image_url: r.image_url ? '/api/messages/img/' + r.id : null,
            };
          }
        }
        const enriched = {
          ...msg,
          image_url: msg.image_url ? `/api/messages/img/${msg.id}` : null,
          voice_url: msg.voice_url ? `/api/messages/voice/${msg.id}` : null,
          sender_name: socket.user.name || 'Unknown',
          sender_avatar: socket.user.avatar || null,
          reply_to: reply_preview,
        };

        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:new', enriched);
        // Acknowledge to sender
        callback?.({ ok: true, message: enriched });
      } catch (err) {
        console.error('[Socket] message:send error:', err.message);
        callback?.({ ok: false, error: 'Failed to send message.' });
      }
    });

    // Handle deleting a message (soft delete, only sender)
    socket.on('message:delete', async ({ messageId }, callback) => {
      try {
        const msgRes = await pool.query('SELECT sender_id, receiver_id FROM messages WHERE id=$1', [messageId]);
        if (!msgRes.rows[0]) return callback?.({ ok: false, error: 'Message not found.' });
        if (msgRes.rows[0].sender_id !== userId) return callback?.({ ok: false, error: 'Not your message.' });

        await pool.query('UPDATE messages SET deleted=TRUE WHERE id=$1', [messageId]);

        const receiverId = msgRes.rows[0].sender_id === userId ? msgRes.rows[0].receiver_id : msgRes.rows[0].sender_id;
        io.to(`user:${receiverId}`).emit('message:deleted', { messageId, userId });
        callback?.({ ok: true });
      } catch (err) {
        console.error('[Socket] message:delete error:', err.message);
        callback?.({ ok: false, error: 'Failed to delete message.' });
      }
    });

    // Handle editing a message (only sender, text only)
    socket.on('message:edit', async ({ messageId, content }, callback) => {
      try {
        if (!content?.trim()) return callback?.({ ok: false, error: 'Content cannot be empty.' });
        const msgRes = await pool.query(
          'SELECT sender_id, receiver_id FROM messages WHERE id=$1',
          [messageId]
        );
        if (!msgRes.rows[0]) return callback?.({ ok: false, error: 'Message not found.' });
        if (msgRes.rows[0].sender_id !== userId) return callback?.({ ok: false, error: 'Not your message.' });

        await pool.query(
          'UPDATE messages SET content=$1, edited=TRUE, edited_at=NOW() WHERE id=$2',
          [content.trim(), messageId]
        );
        io.to(`user:${msgRes.rows[0].receiver_id}`).emit('message:edited', { messageId, content: content.trim() });
        callback?.({ ok: true });
      } catch (err) {
        console.error('[Socket] message:edit error:', err.message);
        callback?.({ ok: false, error: 'Failed to edit message.' });
      }
    });

    // Handle hide-for-me (delete only from sender's view)
    socket.on('message:hide', async ({ messageId }, callback) => {
      try {
        const msgRes = await pool.query('SELECT sender_id FROM messages WHERE id=$1', [messageId]);
        if (!msgRes.rows[0]) return callback?.({ ok: false, error: 'Message not found.' });
        if (msgRes.rows[0].sender_id !== userId) return callback?.({ ok: false, error: 'Not your message.' });
        await pool.query('UPDATE messages SET deleted_for_sender=TRUE WHERE id=$1', [messageId]);
        callback?.({ ok: true });
      } catch (err) {
        console.error('[Socket] message:hide error:', err.message);
        callback?.({ ok: false, error: 'Failed to hide message.' });
      }
    });

    // Handle clearing entire conversation
    socket.on('conversation:clear', async ({ targetUserId }, callback) => {
      try {
        await pool.query(
          `DELETE FROM messages
           WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)`,
          [userId, targetUserId]
        );
        io.to(`user:${targetUserId}`).emit('conversation:cleared', { byUserId: userId });
        callback?.({ ok: true });
      } catch (err) {
        console.error('[Socket] conversation:clear error:', err.message);
        callback?.({ ok: false, error: 'Failed to clear conversation.' });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ toUserId }) => {
      socket.to(`user:${toUserId}`).emit('typing', { userId, typing: true });
    });

    socket.on('typing:stop', ({ toUserId }) => {
      socket.to(`user:${toUserId}`).emit('typing', { userId, typing: false });
    });

    // Mark messages as read
    socket.on('messages:read', async ({ fromUserId }) => {
      try {
        const me = await pool.query(
          `SELECT COALESCE(show_read_receipts, TRUE) AS show_read_receipts FROM users WHERE id=$1`,
          [userId]
        );
        const myReceiptsOn = me.rows[0]?.show_read_receipts !== false;
        if (myReceiptsOn) {
          await pool.query(
            `UPDATE messages SET read=TRUE, read_at=COALESCE(read_at, NOW())
             WHERE sender_id=$1 AND receiver_id=$2 AND read=FALSE`,
            [fromUserId, userId]
          );
        } else {
          await pool.query(
            `UPDATE messages SET read=TRUE WHERE sender_id=$1 AND receiver_id=$2 AND read=FALSE`,
            [fromUserId, userId]
          );
        }
        // Notify the other user that their messages were read
        io.to(`user:${fromUserId}`).emit('messages:seen', { byUserId: userId });
      } catch (err) { console.error('[Socket] messages:read error:', err.message); }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });

  return io;
}

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

module.exports = { setupSocket, isUserOnline };
