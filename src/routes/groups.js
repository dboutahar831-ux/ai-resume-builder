const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/groups — list user's groups
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT gc.*, gm.role AS my_role,
              (SELECT COUNT(*) FROM group_members WHERE group_id = gc.id) AS member_count,
              (SELECT content FROM messages WHERE group_id = gc.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages WHERE group_id = gc.id ORDER BY created_at DESC LIMIT 1) AS last_at
       FROM group_chats gc
       JOIN group_members gm ON gm.group_id = gc.id
       WHERE gm.user_id = $1
       ORDER BY last_at DESC NULLS LAST, gc.created_at DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load groups.' });
  }
});

// POST /api/groups — create a group
router.post('/', async (req, res) => {
  const { name, description, member_ids } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Group name is required.' });
  try {
    const result = await pool.query(
      `INSERT INTO group_chats (name, description, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [name.trim(), description?.trim() || null, req.user.id]
    );
    const group = result.rows[0];
    // Add creator as admin
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1,$2,'admin')`,
      [group.id, req.user.id]
    );
    // Add other members
    if (Array.isArray(member_ids)) {
      for (const uid of member_ids) {
        if (uid === req.user.id) continue;
        await pool.query(
          `INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [group.id, uid]
        );
      }
    }
    res.status(201).json({ ...group, my_role: 'admin', member_count: 1 + (member_ids?.length || 0) });
  } catch {
    res.status(500).json({ error: 'Failed to create group.' });
  }
});

// GET /api/groups/:id — group details with members
router.get('/:id', async (req, res) => {
  try {
    const member = await pool.query(
      'SELECT id, role FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(403).json({ error: 'Not a member.' });

    const group = await pool.query(
      `SELECT gc.*,
              (SELECT COUNT(*) FROM group_members WHERE group_id = gc.id) AS member_count
       FROM group_chats gc WHERE gc.id = $1`,
      [req.params.id]
    );
    const members = await pool.query(
      `SELECT gm.user_id, gm.role, gm.joined_at,
              u.name, u.avatar, u.last_seen_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.role = 'admin' DESC, gm.joined_at ASC`,
      [req.params.id]
    );
    res.json({ ...group.rows[0], my_role: member.rows[0].role, members: members.rows });
  } catch {
    res.status(500).json({ error: 'Failed to load group.' });
  }
});

// PATCH /api/groups/:id — edit group name/description (admin)
router.patch('/:id', async (req, res) => {
  const { name, description, avatar } = req.body;
  try {
    const admin = await pool.query(
      "SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 AND role='admin'",
      [req.params.id, req.user.id]
    );
    if (!admin.rows[0]) return res.status(403).json({ error: 'Only admins can edit the group.' });

    const sets = [];
    const vals = [];
    let idx = 1;
    if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(name.trim()); }
    if (description !== undefined) { sets.push(`description = $${idx++}`); vals.push(description); }
    if (avatar !== undefined) { sets.push(`avatar = $${idx++}`); vals.push(avatar); }
    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update.' });
    vals.push(req.params.id);

    const r = await pool.query(
      `UPDATE group_chats SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    res.json(r.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update group.' });
  }
});

// DELETE /api/groups/:id — delete group (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const admin = await pool.query(
      "SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 AND role='admin'",
      [req.params.id, req.user.id]
    );
    if (!admin.rows[0]) return res.status(403).json({ error: 'Only admins can delete the group.' });

    await pool.query('DELETE FROM group_chats WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete group.' });
  }
});

// POST /api/groups/:id/leave — leave group
router.post('/:id/leave', async (req, res) => {
  try {
    const member = await pool.query(
      'SELECT id, role FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(400).json({ error: 'Not a member.' });

    await pool.query(
      'DELETE FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );

    // If last admin left, promote another member to admin
    if (member.rows[0].role === 'admin') {
      const remaining = await pool.query(
        'SELECT id FROM group_members WHERE group_id=$1 LIMIT 1',
        [req.params.id]
      );
      if (remaining.rows[0]) {
        await pool.query(
          "UPDATE group_members SET role='admin' WHERE id=$1",
          [remaining.rows[0].id]
        );
      } else {
        // No members left, delete the group
        await pool.query('DELETE FROM group_chats WHERE id=$1', [req.params.id]);
      }
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to leave group.' });
  }
});

// PUT /api/groups/:id/members/:userId/role — change member role (admin)
router.put('/:id/members/:userId/role', async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  try {
    const admin = await pool.query(
      "SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 AND role='admin'",
      [req.params.id, req.user.id]
    );
    if (!admin.rows[0]) return res.status(403).json({ error: 'Only admins can change roles.' });

    await pool.query(
      'UPDATE group_members SET role=$1 WHERE group_id=$2 AND user_id=$3',
      [role, req.params.id, req.params.userId]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

// GET /api/groups/:id/members — list group members
router.get('/:id/members', async (req, res) => {
  try {
    // Verify membership
    const member = await pool.query(
      'SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(403).json({ error: 'Not a member.' });

    const r = await pool.query(
      `SELECT gm.*, u.name, u.avatar, u.last_seen_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.role = 'admin' DESC, gm.joined_at ASC`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load members.' });
  }
});

// POST /api/groups/:id/members — add members
router.post('/:id/members', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required.' });
  try {
    // Check admin
    const admin = await pool.query(
      "SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 AND role='admin'",
      [req.params.id, req.user.id]
    );
    if (!admin.rows[0]) return res.status(403).json({ error: 'Only admins can add members.' });

    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

// DELETE /api/groups/:id/members/:userId — remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const admin = await pool.query(
      "SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2 AND role='admin'",
      [req.params.id, req.user.id]
    );
    if (!admin.rows[0]) return res.status(403).json({ error: 'Only admins can remove members.' });

    await pool.query(
      'DELETE FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.params.userId]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// GET /api/groups/:id/messages — group messages
router.get('/:id/messages', async (req, res) => {
  try {
    const member = await pool.query(
      'SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(403).json({ error: 'Not a member.' });

    const r = await pool.query(
      `SELECT m.id, m.sender_id, m.content,
              CASE WHEN m.image_url IS NOT NULL AND m.image_url <> ''
                   THEN '/api/messages/img/' || m.id ELSE NULL END AS image_url,
              m.read, m.read_at, m.created_at,
              u.name AS sender_name, u.avatar AS sender_avatar,
              COALESCE(
                (SELECT jsonb_agg(jsonb_build_object('emoji', mr.emoji, 'user_id', mr.user_id))
                 FROM message_reactions mr WHERE mr.message_id = m.id),
                '[]'::jsonb
              ) AS reactions
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.group_id = $1
       ORDER BY m.created_at ASC LIMIT 200`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// POST /api/groups/:id/messages — send group message
router.post('/:id/messages', async (req, res) => {
  const { content, image_url } = req.body;
  if (!content?.trim() && !image_url) return res.status(400).json({ error: 'Message cannot be empty.' });
  try {
    const member = await pool.query(
      'SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(403).json({ error: 'Not a member.' });

    const result = await pool.query(
      `INSERT INTO messages (sender_id, group_id, content, image_url)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, req.params.id, content?.trim() || null, image_url || null]
    );
    const msg = result.rows[0];
    const sender = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [req.user.id]);
    res.json({
      ...msg,
      image_url: msg.image_url ? `/api/messages/img/${msg.id}` : null,
      sender_name: sender.rows[0]?.name || 'Unknown',
      sender_avatar: sender.rows[0]?.avatar || null,
      reactions: [],
    });
  } catch {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// GET /api/groups/available-friends — friends to add to group
router.get('/available-friends', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.name, u.avatar
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END
       WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='accepted'
       ORDER BY u.name ASC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load friends.' });
  }
});

module.exports = router;
