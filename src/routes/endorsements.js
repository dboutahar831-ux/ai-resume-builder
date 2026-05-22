const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/endorsements/:userId — get endorsements for a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT se.skill,
         json_agg(json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar)) AS endorsers,
         COUNT(*)::int AS count,
         EXISTS(SELECT 1 FROM skill_endorsements WHERE profile_user_id=$1 AND endorser_id=$2 AND skill=se.skill) AS endorsed_by_me
       FROM skill_endorsements se
       JOIN users u ON u.id = se.endorser_id
       WHERE se.profile_user_id=$1
       GROUP BY se.skill
       ORDER BY count DESC`,
      [req.params.userId, req.user.id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load endorsements.' }); }
});

// POST /api/endorsements/:userId/:skill — endorse a skill
router.post('/:userId/:skill', auth, async (req, res) => {
  const { userId, skill } = req.params;
  if (parseInt(userId) === req.user.id) return res.status(400).json({ error: 'Cannot endorse yourself.' });
  try {
    await pool.query(
      'INSERT INTO skill_endorsements (profile_user_id, endorser_id, skill) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [userId, req.user.id, skill]
    );
    res.json({ ok: true, endorsed: true });
  } catch { res.status(500).json({ error: 'Failed to endorse.' }); }
});

// DELETE /api/endorsements/:userId/:skill — remove endorsement
router.delete('/:userId/:skill', auth, async (req, res) => {
  const { userId, skill } = req.params;
  try {
    await pool.query(
      'DELETE FROM skill_endorsements WHERE profile_user_id=$1 AND endorser_id=$2 AND skill=$3',
      [userId, req.user.id, skill]
    );
    res.json({ ok: true, endorsed: false });
  } catch { res.status(500).json({ error: 'Failed to remove endorsement.' }); }
});

module.exports = router;
