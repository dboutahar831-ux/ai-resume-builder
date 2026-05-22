const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const VALID_REASONS = ['spam', 'harassment', 'misinformation', 'inappropriate', 'other'];

// POST /api/reports — submit a report
router.post('/', auth, async (req, res) => {
  const { post_id, reported_user_id, reason } = req.body;
  if (!VALID_REASONS.includes(reason)) return res.status(400).json({ error: 'Invalid reason.' });
  if (!post_id && !reported_user_id) return res.status(400).json({ error: 'Must provide post_id or reported_user_id.' });
  try {
    await pool.query(
      `INSERT INTO reports (reporter_id, post_id, reported_user_id, reason)
       VALUES ($1,$2,$3,$4)`,
      [req.user.id, post_id || null, reported_user_id || null, reason]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to submit report.' }); }
});

// GET /api/reports — admin: all reports
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.reason, r.status, r.created_at,
        reporter.name AS reporter_name, reporter.avatar AS reporter_avatar,
        ru.name AS reported_user_name, ru.avatar AS reported_user_avatar,
        p.content AS post_content, r.post_id, r.reported_user_id
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      LEFT JOIN users ru ON ru.id = r.reported_user_id
      LEFT JOIN posts p ON p.id = r.post_id
      ORDER BY r.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load reports.' }); }
});

// PUT /api/reports/:id — admin: update report status
router.put('/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'dismissed', 'actioned'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  try {
    const result = await pool.query(
      'UPDATE reports SET status=$1 WHERE id=$2 RETURNING id, status',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found.' });
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to update report.' }); }
});

module.exports = router;
