const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/projects/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, description, url, image_url, created_at FROM user_projects WHERE user_id=$1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Failed to load projects.' }); }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  const { title, description, url, image_url } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });
  try {
    const result = await pool.query(
      'INSERT INTO user_projects (user_id, title, description, url, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, title.trim(), description?.trim() || null, url?.trim() || null, image_url || null]
    );
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to create project.' }); }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  const { title, description, url, image_url } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });
  try {
    const result = await pool.query(
      'UPDATE user_projects SET title=$1, description=$2, url=$3, image_url=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [title.trim(), description?.trim() || null, url?.trim() || null, image_url || null, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Project not found.' });
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to update project.' }); }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_projects WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete project.' }); }
});

module.exports = router;
