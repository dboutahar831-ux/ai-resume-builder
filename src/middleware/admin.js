const pool = require('../db');

module.exports = async function adminAuth(req, res, next) {
  try {
    const r = await pool.query('SELECT is_admin FROM users WHERE id=$1', [req.user.id]);
    if (!r.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin access required.' });
    next();
  } catch {
    res.status(500).json({ error: 'Auth check failed.' });
  }
};
