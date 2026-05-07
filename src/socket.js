const jwt = require('jsonwebtoken');
const pool = require('./db');

const onlineUsers = new Map();

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
    onlineUsers.set(userId, true);

    // Notify others that user is online
    socket.broadcast.emit('user:online', { userId });

    // Handle sending a message
    socket.on('message:send', async ({ receiverId, content, image_url, voice_url }, callback) => {
      try {
        const result = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, content, image_url, voice_url)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [userId, receiverId, content || null, image_url || null, voice_url || null]
        );
        const msg = result.rows[0];
        const enriched = {
          ...msg,
          image_url: msg.image_url ? `/api/messages/img/${msg.id}` : null,
          voice_url: msg.voice_url ? `/api/messages/voice/${msg.id}` : null,
          sender_name: socket.user.name || 'Unknown',
          sender_avatar: socket.user.avatar || null,
        };

        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:new', enriched);
        // Acknowledge to sender
        callback?.({ ok: true, message: enriched });
      } catch (err) {
        callback?.({ ok: false, error: err.message });
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
      } catch {}
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
    });
  });

  return io;
}

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

module.exports = { setupSocket, isUserOnline };
