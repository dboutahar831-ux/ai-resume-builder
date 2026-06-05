const pool = require('../db');
const { ValidationError, ForbiddenError, NotFoundError } = require('../utils/errors');

let _io = null;
function setIo(io) { _io = io; }

async function searchUsers(query, userId) {
  const q = (query || '').trim();
  if (!q) return [];
  const result = await pool.query(
    `SELECT u.id, u.name, u.location, u.avatar,
            CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at,
            (SELECT status FROM friendships
             WHERE (requester_id=$1 AND addressee_id=u.id) OR (requester_id=u.id AND addressee_id=$1) LIMIT 1) AS friendship_status,
            (SELECT requester_id FROM friendships
             WHERE (requester_id=$1 AND addressee_id=u.id) OR (requester_id=u.id AND addressee_id=$1) LIMIT 1) AS requester_id
     FROM users u
     WHERE u.id != $1 AND u.verified = TRUE
       AND (u.name ILIKE $2 OR u.email ILIKE $2)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)
     LIMIT 20`,
    [userId, `%${q}%`]
  );
  return result.rows;
}

async function searchMentionFriends(query, userId) {
  const q = (query || '').trim();
  const result = await pool.query(
    `SELECT u.id, u.name, u.avatar, u.bio, u.location
     FROM users u
     JOIN friendships f ON ((f.requester_id=$1 AND f.addressee_id=u.id) OR (f.requester_id=u.id AND f.addressee_id=$1))
     WHERE f.status='accepted' AND u.id != $1 AND ($2 = '' OR u.name ILIKE $3)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
     ORDER BY u.name ASC LIMIT 10`,
    [userId, q, `%${q}%`]
  );
  return result.rows;
}

async function getSuggestions(userId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.avatar, u.bio, u.location
     FROM users u
     WHERE u.id != $1 AND u.verified = TRUE
       AND NOT EXISTS (SELECT 1 FROM friendships f WHERE (f.requester_id=$1 AND f.addressee_id=u.id) OR (f.requester_id=u.id AND f.addressee_id=$1))
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)
     ORDER BY RANDOM() LIMIT 4`,
    [userId]
  );
  return result.rows;
}

async function getFriends(userId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.location, u.avatar,
            CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at
     FROM friendships f
     JOIN users u ON (CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END = u.id)
     WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='accepted'
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)`,
    [userId]
  );
  return result.rows;
}

async function getUserFriends(viewerId, targetUserId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.avatar, u.location,
            CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at
     FROM friendships f
     JOIN users u ON (CASE WHEN f.requester_id=$2 THEN f.addressee_id ELSE f.requester_id END = u.id)
     WHERE (f.requester_id=$2 OR f.addressee_id=$2) AND f.status='accepted'
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=u.id)
       AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id=u.id AND blocked_id=$1)
     LIMIT 50`,
    [viewerId, targetUserId]
  );
  return result.rows;
}

async function getFriendRequests(userId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.avatar, f.created_at
     FROM friendships f
     JOIN users u ON f.requester_id = u.id
     WHERE f.addressee_id=$1 AND f.status='pending'
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getProfile(userId, viewerId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.nickname, u.location, u.linkedin, u.avatar, u.bio, u.cover_image, u.created_at,
            CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS last_seen_at,
            (SELECT status FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1) LIMIT 1) AS friendship_status,
            (SELECT requester_id FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1) LIMIT 1) AS requester_id
     FROM users u WHERE u.id=$2`,
    [viewerId, userId]
  );
  if (!result.rows[0]) throw new NotFoundError('User');

  const blockCheck = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=$2) AS blocked,
            EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$2 AND blocked_id=$1) AS blocked_by_them`,
    [viewerId, userId]
  );
  result.rows[0].blocked = blockCheck.rows[0].blocked;
  result.rows[0].blocked_by_them = blockCheck.rows[0].blocked_by_them;

  if (viewerId !== parseInt(userId)) {
    pool.query(
      `INSERT INTO profile_views (profile_user_id, viewer_id, viewed_at) VALUES ($1,$2,NOW())
       ON CONFLICT (profile_user_id, viewer_id) DO UPDATE SET viewed_at=NOW()`,
      [userId, viewerId]
    ).catch(() => {});
  }

  return result.rows[0];
}

async function sendFriendRequest(userId, targetId) {
  if (isNaN(targetId) || targetId < 1) throw new ValidationError('Invalid user ID.');
  if (targetId === userId) throw new ValidationError('Cannot add yourself.');

  const checkBlock = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=$2) AS blocked,
            EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$2 AND blocked_id=$1) AS blocked_by_them`,
    [userId, targetId]
  );
  if (checkBlock.rows[0].blocked) throw new ForbiddenError('You have blocked this user.');
  if (checkBlock.rows[0].blocked_by_them) throw new ForbiddenError('This user has blocked you.');

  await pool.query(
    `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [userId, targetId]
  );

  if (_io) {
    _io.to(`user:${targetId}`).emit('friend:request', { id: userId, name: reqUser.name, avatar: reqUser.avatar || null });
  }
  return { message: 'Request sent.' };
}

async function acceptFriendRequest(requesterId, addresseeId) {
  const result = await pool.query(
    `UPDATE friendships SET status='accepted' WHERE requester_id=$1 AND addressee_id=$2 AND status='pending'`,
    [requesterId, addresseeId]
  );
  if (_io) {
    _io.to(`user:${requesterId}`).emit('friend:accepted', { id: addresseeId });
  }
  return { message: 'Request accepted.' };
}

async function rejectFriendRequest(requesterId, addresseeId) {
  await pool.query(
    `DELETE FROM friendships WHERE requester_id=$1 AND addressee_id=$2 AND status='pending'`,
    [requesterId, addresseeId]
  );
  return { message: 'Request rejected.' };
}

async function unfriend(userId, targetId) {
  await pool.query(
    `DELETE FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
    [userId, targetId]
  );
  return { message: 'Unfriended.' };
}

async function blockUser(userId, targetId) {
  if (isNaN(targetId) || targetId < 1) throw new ValidationError('Invalid user ID.');
  if (targetId === userId) throw new ValidationError('Cannot block yourself.');

  await pool.query(
    `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [userId, targetId]
  );
  await pool.query(
    `DELETE FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
    [userId, targetId]
  );
  return { message: 'User blocked.' };
}

async function unblockUser(userId, targetId) {
  await pool.query(
    `DELETE FROM blocks WHERE blocker_id=$1 AND blocked_id=$2`,
    [userId, targetId]
  );
  return { message: 'User unblocked.' };
}

async function getBlockedUsers(userId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.avatar, u.bio, b.created_at AS blocked_at
     FROM blocks b JOIN users u ON u.id = b.blocked_id
     WHERE b.blocker_id=$1 ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function checkBlocked(userId, targetId) {
  const result = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$1 AND blocked_id=$2) AS blocked`,
    [userId, targetId]
  );
  const blockedByThem = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id=$2 AND blocked_id=$1) AS blocked_by_them`,
    [userId, targetId]
  );
  return { blocked: result.rows[0].blocked, blocked_by_them: blockedByThem.rows[0].blocked_by_them };
}

module.exports = {
  setIo, searchUsers, searchMentionFriends, getSuggestions, getFriends, getUserFriends,
  getFriendRequests, getProfile, sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
  unfriend, blockUser, unblockUser, getBlockedUsers, checkBlocked,
};
