const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cover_letters WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load cover letters.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cover_letters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Cover letter not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to load cover letter.' });
  }
});

router.post('/', async (req, res) => {
  const { title, job_title, company, recipient, tone, content } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cover_letters (user_id, title, job_title, company, recipient, tone, content)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title || 'Untitled Cover Letter', job_title || '', company || '', recipient || '', tone || 'professional', content || '']
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create cover letter.' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, job_title, company, recipient, tone, content } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cover_letters SET title=$1, job_title=$2, company=$3, recipient=$4, tone=$5, content=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [title, job_title || '', company || '', recipient || '', tone || 'professional', content || '', req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Cover letter not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update cover letter.' });
  }
});

router.post('/:id/duplicate', async (req, res) => {
  try {
    const src = await pool.query('SELECT * FROM cover_letters WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!src.rows[0]) return res.status(404).json({ error: 'Not found' });
    const s = src.rows[0];
    const result = await pool.query(
      `INSERT INTO cover_letters (user_id, title, job_title, company, recipient, tone, content)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, `${s.title} (Copy)`, s.job_title, s.company, s.recipient, s.tone, s.content]
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to duplicate cover letter.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cover_letters WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Cover letter not found' });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete cover letter.' });
  }
});

module.exports = router;
