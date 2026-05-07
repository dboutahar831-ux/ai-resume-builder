const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');

// POST /api/auth/forgot-password — request reset token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  try {
    const user = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    // Always return success (don't reveal if email exists)
    if (user.rows[0]) {
      const token = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `INSERT INTO password_resets (email, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [email, token]
      );
      // In production, send email with link: /reset-password?token=${token}
      console.log(`Password reset token for ${email}: ${token}`);
    }
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch {
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// POST /api/auth/reset-password — use reset token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  try {
    const result = await pool.query(
      `SELECT email FROM password_resets
       WHERE token=$1 AND used=FALSE AND expires_at > NOW()`,
      [token]
    );
    if (!result.rows[0]) return res.status(400).json({ error: 'Invalid or expired token.' });

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, result.rows[0].email]);
    await pool.query('UPDATE password_resets SET used=TRUE WHERE token=$1', [token]);
    res.json({ message: 'Password reset successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
