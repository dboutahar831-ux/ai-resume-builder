const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/analytics/me
router.get('/me', auth, async (req, res) => {
  const uid = req.user.id;
  try {
    const [
      postStats,
      profileViewsTotal,
      profileViewsWeek,
      profileViewers,
      reactionStats,
      commentStats,
      friendGrowth,
      topPosts,
    ] = await Promise.all([
      pool.query(
        `SELECT
          COUNT(*)::int AS total_posts,
          COALESCE(SUM(views_count),0)::int AS total_views,
          COALESCE(SUM((SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id)),0)::int AS total_reactions,
          COALESCE(SUM((SELECT COUNT(*) FROM comments WHERE post_id=p.id)),0)::int AS total_comments
         FROM posts p WHERE user_id=$1 AND scheduled_at IS NULL`,
        [uid]
      ),
      pool.query('SELECT COUNT(*)::int AS count FROM profile_views WHERE profile_user_id=$1', [uid]),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM profile_views WHERE profile_user_id=$1 AND viewed_at > NOW() - INTERVAL '7 days'",
        [uid]
      ),
      pool.query(
        `SELECT u.id, u.name, u.avatar, pv.viewed_at
         FROM profile_views pv JOIN users u ON u.id=pv.viewer_id
         WHERE pv.profile_user_id=$1
         ORDER BY pv.viewed_at DESC LIMIT 10`,
        [uid]
      ),
      pool.query(
        `SELECT type, COUNT(*)::int AS count
         FROM post_reactions WHERE post_id IN (SELECT id FROM posts WHERE user_id=$1)
         GROUP BY type ORDER BY count DESC`,
        [uid]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM comments
         WHERE post_id IN (SELECT id FROM posts WHERE user_id=$1) AND user_id != $1`,
        [uid]
      ),
      pool.query(
        `SELECT DATE_TRUNC('month', created_at)::DATE AS month, COUNT(*)::int AS count
         FROM friendships
         WHERE (requester_id=$1 OR addressee_id=$1) AND status='accepted'
           AND created_at > NOW() - INTERVAL '6 months'
         GROUP BY month ORDER BY month`,
        [uid]
      ),
      pool.query(
        `SELECT p.id, p.content, p.created_at, p.views_count,
           COALESCE((SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id),0)::int AS reactions_count,
           COALESCE((SELECT COUNT(*) FROM comments WHERE post_id=p.id),0)::int AS comments_count
         FROM posts p WHERE user_id=$1 AND scheduled_at IS NULL
         ORDER BY (COALESCE((SELECT COUNT(*) FROM post_reactions WHERE post_id=p.id),0)
                 + COALESCE((SELECT COUNT(*) FROM comments WHERE post_id=p.id),0)) DESC
         LIMIT 5`,
        [uid]
      ),
    ]);

    res.json({
      posts: postStats.rows[0],
      profile_views: {
        total: profileViewsTotal.rows[0].count,
        this_week: profileViewsWeek.rows[0].count,
        recent_viewers: profileViewers.rows,
      },
      reactions: reactionStats.rows,
      comments_received: commentStats.rows[0].count,
      friend_growth: friendGrowth.rows,
      top_posts: topPosts.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

module.exports = router;
