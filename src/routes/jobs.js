const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET all jobs for logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load jobs.' });
  }
});

// POST create job
router.post('/', async (req, res) => {
  const { company, role, status, location, url, notes, applied_at, interview_date } = req.body;
  if (!company || !role) return res.status(400).json({ error: 'company and role are required' });
  try {
    const result = await pool.query(
      `INSERT INTO jobs (user_id, company, role, status, location, url, notes, applied_at, interview_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, company, role, status || 'pending', location || '', url || '', notes || '', applied_at || new Date(), interview_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create job.' });
  }
});

// PUT update job
router.put('/:id', async (req, res) => {
  const { company, role, status, location, url, notes, applied_at, interview_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE jobs SET company=$1, role=$2, status=$3, location=$4, url=$5, notes=$6, applied_at=$7, interview_date=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [company, role, status, location || '', url || '', notes || '', applied_at, interview_date || null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update job.' });
  }
});

// DELETE job
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM jobs WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete job.' });
  }
});

module.exports = router;
