const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Public route — no auth required
router.get('/public/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM resumes WHERE public_slug = $1',
      [req.params.slug]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to load resume.' });
  }
});

// All routes below require a valid JWT
router.use(auth);

// POST /api/resumes
router.post('/', async (req, res) => {
  const { personal_info, experience, education, skills } = req.body;

  if (!personal_info || !personal_info.full_name) {
    return res.status(400).json({ error: 'personal_info.full_name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO resumes (user_id, personal_info, experience, education, skills)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        JSON.stringify(personal_info),
        JSON.stringify(experience || []),
        JSON.stringify(education || []),
        JSON.stringify(skills || []),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create resume.' });
  }
});

// GET /api/resumes — only returns resumes belonging to the logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load resumes.' });
  }
});

// GET /api/resumes/user/:userId — public resumes for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, personal_info, experience, education, skills, created_at, updated_at FROM resumes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to load resumes.' });
  }
});

// GET /api/resumes/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to load resume.' });
  }
});

// PUT /api/resumes/:id — update a resume
router.put('/:id', async (req, res) => {
  const { personal_info, experience, education, skills } = req.body;

  if (!personal_info || !personal_info.full_name) {
    return res.status(400).json({ error: 'personal_info.full_name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE resumes
       SET personal_info = $1, experience = $2, education = $3, skills = $4, updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        JSON.stringify(personal_info),
        JSON.stringify(experience || []),
        JSON.stringify(education || []),
        JSON.stringify(skills || []),
        req.params.id,
        req.user.id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update resume.' });
  }
});

// POST /api/resumes/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  try {
    const src = await pool.query('SELECT * FROM resumes WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!src.rows[0]) return res.status(404).json({ error: 'Resume not found' });
    const s = src.rows[0];
    const result = await pool.query(
      `INSERT INTO resumes (user_id, personal_info, experience, education, skills)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, JSON.stringify(s.personal_info), JSON.stringify(s.experience), JSON.stringify(s.education), JSON.stringify(s.skills)]
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to duplicate resume.' }); }
});

// DELETE /api/resumes/:id — delete a resume
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete resume.' });
  }
});

module.exports = router;
