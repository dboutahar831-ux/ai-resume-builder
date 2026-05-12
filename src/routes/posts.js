const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const VALID_REACTIONS = ['like', 'heart', 'laugh', 'sad', 'angry'];

async function notify(recipientId, actorId, type, postId, commentId = null) {
  if (recipientId === actorId) return;
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [recipientId, actorId, type, postId, commentId || null]
    );
  } catch {}
}

// GET /api/posts/feed
router.get('/feed', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.content, p.image_url, p.video_url, p.created_at,
        p.original_post_id, p.repost_text,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        CASE WHEN COALESCE(u.show_online_status, TRUE) THEN u.last_seen_at ELSE NULL END AS user_last_seen_at,
        op.content AS original_content,
        op.image_url AS original_image_url,
        op.video_url AS original_video_url,
        op.created_at AS original_created_at,
        ou.id AS original_user_id,
        ou.name AS original_user_name,
        ou.avatar AS original_user_avatar,
        COALESCE((SELECT COUNT(*)::int FROM post_reactions WHERE post_id = p.id), 0) AS reactions_count,
        COALESCE((SELECT COUNT(*)::int FROM comments WHERE post_id = p.id), 0) AS comments_count,
        (SELECT json_agg(json_build_object('type', t.type, 'count', t.cnt))
         FROM (SELECT type, COUNT(*)::int AS cnt FROM post_reactions WHERE post_id = p.id GROUP BY type ORDER BY cnt DESC) t
        ) AS reactions_summary,
        (SELECT type FROM post_reactions WHERE post_id = p.id AND user_id = $1 LIMIT 1) AS my_reaction
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN posts op ON op.id = p.original_post_id
      LEFT JOIN users ou ON ou.id = op.user_id
      WHERE (p.user_id = $1
         OR p.user_id IN (
            SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END
            FROM friendships
            WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'
          ))
      AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load feed.' }); }
});

// GET /api/posts/scheduled — user's upcoming scheduled posts
router.get('/scheduled', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, content, image_url, video_url, scheduled_at
       FROM posts
       WHERE user_id = $1 AND scheduled_at > NOW()
       ORDER BY scheduled_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load scheduled posts.' }); }
});

// GET /api/posts/trending — top hashtags from last 7 days
router.get('/trending', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tag, COUNT(*)::int AS count FROM (
        SELECT LOWER((REGEXP_MATCHES(content, '#[A-Za-zÀ-ÿ0-9_]+', 'g'))[1]) AS tag
        FROM posts WHERE created_at > NOW() - INTERVAL '7 days' AND content IS NOT NULL
      ) t
      WHERE tag IS NOT NULL
      GROUP BY tag ORDER BY count DESC LIMIT 8
    `);
    res.json(result.rows.map(r => r.tag));
  } catch { res.json([]); }
});

// GET /api/posts/user/:userId — all posts by a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.content, p.image_url, p.video_url, p.created_at,
        p.original_post_id, p.repost_text,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        COALESCE((SELECT COUNT(*)::int FROM post_reactions WHERE post_id = p.id), 0) AS reactions_count,
        COALESCE((SELECT COUNT(*)::int FROM comments WHERE post_id = p.id), 0) AS comments_count,
        (SELECT json_agg(json_build_object('type', t.type, 'count', t.cnt))
         FROM (SELECT type, COUNT(*)::int AS cnt FROM post_reactions WHERE post_id = p.id GROUP BY type ORDER BY cnt DESC) t
        ) AS reactions_summary,
        (SELECT type FROM post_reactions WHERE post_id = p.id AND user_id = $1 LIMIT 1) AS my_reaction
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $2
        AND (p.scheduled_at IS NULL OR p.scheduled_at <= NOW())
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id, req.params.userId]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load user posts.' }); }
});

// POST /api/posts
router.post('/', auth, async (req, res) => {
  const { content, image_url, video_url, scheduled_at, mention_ids } = req.body;
  if (!content?.trim() && !image_url && !video_url)
    return res.status(400).json({ error: 'Post cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url, video_url, scheduled_at) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, content, image_url, video_url, created_at, scheduled_at`,
      [req.user.id, content?.trim() || null, image_url || null, video_url || null, scheduled_at || null]
    );
    const post = result.rows[0];
    // Extract hashtags
    const tags = (content || '').match(/#(\w+)/g);
    if (tags) {
      const unique = [...new Set(tags.map(t => t.slice(1).toLowerCase()))];
      for (const tag of unique) {
        await pool.query(
          `INSERT INTO hashtags (tag) VALUES ($1) ON CONFLICT (tag) DO UPDATE SET post_count = hashtags.post_count + 1`,
          [tag]
        );
        const ht = await pool.query('SELECT id FROM hashtags WHERE tag=$1', [tag]);
        await pool.query(
          'INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [post.id, ht.rows[0].id]
        );
      }
    }
    const u = await pool.query(
      'SELECT name, avatar, last_seen_at, COALESCE(show_online_status, TRUE) AS show_online FROM users WHERE id=$1',
      [req.user.id]
    );
    if (Array.isArray(mention_ids)) {
      for (const uid of mention_ids) {
        await notify(uid, req.user.id, 'mention', post.id);
      }
    }
    res.json({
      ...post,
      user_id: req.user.id,
      user_name: u.rows[0].name,
      user_avatar: u.rows[0].avatar,
      user_last_seen_at: u.rows[0].show_online ? u.rows[0].last_seen_at : null,
      reactions_count: 0, comments_count: 0, reactions_summary: null, my_reaction: null,
    });
  } catch { res.status(500).json({ error: 'Failed to create post.' }); }
});

// POST /api/posts/:postId/repost
router.post('/:postId/repost', auth, async (req, res) => {
  const { repost_text } = req.body;
  try {
    const original = await pool.query('SELECT id, user_id FROM posts WHERE id=$1', [req.params.postId]);
    if (!original.rows[0]) return res.status(404).json({ error: 'Post not found.' });

    const result = await pool.query(
      `INSERT INTO posts (user_id, original_post_id, repost_text) VALUES ($1,$2,$3)
       RETURNING id, content, image_url, video_url, original_post_id, repost_text, created_at`,
      [req.user.id, req.params.postId, repost_text?.trim() || null]
    );
    const post = result.rows[0];
    const u = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [req.user.id]);
    const orig = await pool.query(`
      SELECT p.content, p.image_url, p.video_url, p.created_at,
        u.id AS user_id, u.name, u.avatar
      FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id=$1
    `, [req.params.postId]);
    const o = orig.rows[0];

    await notify(original.rows[0].user_id, req.user.id, 'repost', parseInt(req.params.postId));

    res.json({
      ...post,
      user_id: req.user.id, user_name: u.rows[0].name, user_avatar: u.rows[0].avatar,
      original_content: o?.content, original_image_url: o?.image_url, original_video_url: o?.video_url,
      original_created_at: o?.created_at, original_user_id: o?.user_id,
      original_user_name: o?.name, original_user_avatar: o?.avatar,
      reactions_count: 0, comments_count: 0, reactions_summary: null, my_reaction: null,
    });
  } catch { res.status(500).json({ error: 'Failed to repost.' }); }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM posts WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Deleted.' });
  } catch { res.status(500).json({ error: 'Failed to delete post.' }); }
});

// POST /api/posts/:postId/react
router.post('/:postId/react', auth, async (req, res) => {
  const { type } = req.body;
  if (!VALID_REACTIONS.includes(type)) return res.status(400).json({ error: 'Invalid type.' });
  try {
    const ex = await pool.query(
      'SELECT type FROM post_reactions WHERE post_id=$1 AND user_id=$2',
      [req.params.postId, req.user.id]
    );
    if (ex.rows.length > 0 && ex.rows[0].type === type) {
      await pool.query('DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2', [req.params.postId, req.user.id]);
      return res.json({ my_reaction: null });
    }
    if (ex.rows.length > 0) {
      await pool.query('UPDATE post_reactions SET type=$1 WHERE post_id=$2 AND user_id=$3', [type, req.params.postId, req.user.id]);
    } else {
      await pool.query('INSERT INTO post_reactions (post_id, user_id, type) VALUES ($1,$2,$3)', [req.params.postId, req.user.id, type]);
      const owner = await pool.query('SELECT user_id FROM posts WHERE id=$1', [req.params.postId]);
      if (owner.rows[0]) await notify(owner.rows[0].user_id, req.user.id, 'reaction', parseInt(req.params.postId));
    }
    res.json({ my_reaction: type });
  } catch { res.status(500).json({ error: 'Failed to react.' }); }
});

// GET /api/posts/:postId/comments
router.get('/:postId/comments', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id, c.content, c.image_url, c.created_at, c.parent_id,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        (SELECT u2.name FROM comments c2 JOIN users u2 ON u2.id = c2.user_id WHERE c2.id = c.parent_id) AS parent_user_name,
        (SELECT json_agg(json_build_object('type', t.type, 'count', t.cnt))
         FROM (SELECT type, COUNT(*)::int AS cnt FROM comment_reactions WHERE comment_id = c.id GROUP BY type) t
        ) AS reactions_summary,
        (SELECT type FROM comment_reactions WHERE comment_id = c.id AND user_id = $2 LIMIT 1) AS my_reaction
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.postId, req.user.id]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load comments.' }); }
});

// POST /api/posts/:postId/comments
router.post('/:postId/comments', auth, async (req, res) => {
  const { content, image_url, parent_id, mention_ids } = req.body;
  if (!content?.trim() && !image_url) return res.status(400).json({ error: 'Comment cannot be empty.' });
  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content, image_url, parent_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, content, image_url, created_at, parent_id`,
      [req.params.postId, req.user.id, content?.trim() || null, image_url || null, parent_id || null]
    );
    const c = result.rows[0];
    const u = await pool.query('SELECT name, avatar FROM users WHERE id=$1', [req.user.id]);

    const owner = await pool.query('SELECT user_id FROM posts WHERE id=$1', [req.params.postId]);
    if (owner.rows[0]) {
      if (parent_id) {
        const parentComment = await pool.query('SELECT user_id FROM comments WHERE id=$1', [parent_id]);
        if (parentComment.rows[0]) {
          await notify(parentComment.rows[0].user_id, req.user.id, 'reply', parseInt(req.params.postId), c.id);
        }
      } else {
        await notify(owner.rows[0].user_id, req.user.id, 'comment', parseInt(req.params.postId), c.id);
      }
    }
    if (Array.isArray(mention_ids)) {
      for (const uid of mention_ids) {
        await notify(uid, req.user.id, 'mention', parseInt(req.params.postId), c.id);
      }
    }

    res.json({
      ...c,
      user_id: req.user.id,
      user_name: u.rows[0].name,
      user_avatar: u.rows[0].avatar,
      parent_user_name: null,
      reactions_summary: null,
      my_reaction: null,
    });
  } catch { res.status(500).json({ error: 'Failed to create comment.' }); }
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id=$1 AND user_id=$2', [req.params.commentId, req.user.id]);
    res.json({ message: 'Deleted.' });
  } catch { res.status(500).json({ error: 'Failed to delete comment.' }); }
});

// POST /api/posts/:postId/comments/:commentId/react
router.post('/:postId/comments/:commentId/react', auth, async (req, res) => {
  const { type } = req.body;
  if (!VALID_REACTIONS.includes(type)) return res.status(400).json({ error: 'Invalid type.' });
  try {
    const ex = await pool.query(
      'SELECT type FROM comment_reactions WHERE comment_id=$1 AND user_id=$2',
      [req.params.commentId, req.user.id]
    );
    if (ex.rows.length > 0 && ex.rows[0].type === type) {
      await pool.query('DELETE FROM comment_reactions WHERE comment_id=$1 AND user_id=$2', [req.params.commentId, req.user.id]);
      return res.json({ my_reaction: null });
    }
    if (ex.rows.length > 0) {
      await pool.query('UPDATE comment_reactions SET type=$1 WHERE comment_id=$2 AND user_id=$3', [type, req.params.commentId, req.user.id]);
    } else {
      await pool.query('INSERT INTO comment_reactions (comment_id, user_id, type) VALUES ($1,$2,$3)', [req.params.commentId, req.user.id, type]);
    }
    res.json({ my_reaction: type });
  } catch { res.status(500).json({ error: 'Failed to react.' }); }
});

module.exports = router;
