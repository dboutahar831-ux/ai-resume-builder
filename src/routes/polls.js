const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// POST /api/polls/:pollId/vote
router.post('/:pollId/vote', auth, async (req, res) => {
  const { option_id } = req.body;
  const pollId = parseInt(req.params.pollId);
  if (!option_id) return res.status(400).json({ error: 'option_id required.' });
  try {
    const poll = await pool.query('SELECT id, ends_at FROM polls WHERE id=$1', [pollId]);
    if (!poll.rows[0]) return res.status(404).json({ error: 'Poll not found.' });
    if (poll.rows[0].ends_at && new Date(poll.rows[0].ends_at) < new Date())
      return res.status(400).json({ error: 'Poll has ended.' });

    const opt = await pool.query('SELECT id FROM poll_options WHERE id=$1 AND poll_id=$2', [option_id, pollId]);
    if (!opt.rows[0]) return res.status(404).json({ error: 'Option not found.' });

    await pool.query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1,$2,$3)
       ON CONFLICT (poll_id, user_id) DO UPDATE SET option_id=$2`,
      [pollId, option_id, req.user.id]
    );
    const results = await getPollResults(pollId, req.user.id);
    res.json(results);
  } catch { res.status(500).json({ error: 'Failed to vote.' }); }
});

// DELETE /api/polls/:pollId/vote
router.delete('/:pollId/vote', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM poll_votes WHERE poll_id=$1 AND user_id=$2', [req.params.pollId, req.user.id]);
    const results = await getPollResults(parseInt(req.params.pollId), req.user.id);
    res.json(results);
  } catch { res.status(500).json({ error: 'Failed to remove vote.' }); }
});

// GET /api/polls/:pollId
router.get('/:pollId', auth, async (req, res) => {
  try {
    const results = await getPollResults(parseInt(req.params.pollId), req.user.id);
    if (!results) return res.status(404).json({ error: 'Poll not found.' });
    res.json(results);
  } catch { res.status(500).json({ error: 'Failed to load poll.' }); }
});

async function getPollResults(pollId, userId) {
  const poll = await pool.query('SELECT id, question, ends_at, created_at FROM polls WHERE id=$1', [pollId]);
  if (!poll.rows[0]) return null;
  const options = await pool.query(
    `SELECT po.id, po.text,
      COUNT(pv.id)::int AS votes,
      EXISTS(SELECT 1 FROM poll_votes WHERE option_id=po.id AND user_id=$2) AS my_vote
     FROM poll_options po
     LEFT JOIN poll_votes pv ON pv.option_id = po.id
     WHERE po.poll_id=$1
     GROUP BY po.id ORDER BY po.id`,
    [pollId, userId]
  );
  const total = options.rows.reduce((s, o) => s + o.votes, 0);
  const myVote = await pool.query('SELECT option_id FROM poll_votes WHERE poll_id=$1 AND user_id=$2', [pollId, userId]);
  return {
    ...poll.rows[0],
    options: options.rows.map(o => ({ ...o, pct: total ? Math.round((o.votes / total) * 100) : 0 })),
    total_votes: total,
    my_vote_option_id: myVote.rows[0]?.option_id || null,
    ended: poll.rows[0].ends_at ? new Date(poll.rows[0].ends_at) < new Date() : false,
  };
}

module.exports = router;
