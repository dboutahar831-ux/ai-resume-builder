const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const pool = require('../db');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      const resetUrl = `${process.env.CLIENT_URL || 'https://nexly.onrender.com'}/reset-password?token=${token}`;
      if (resend) {
        await resend.emails.send({
          from: 'Nexly <onboarding@resend.dev>',
          to: email,
          subject: 'Reset your Nexly password',
          html: `<p>Hi,</p><p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
        }).catch(err => console.error('[PasswordReset] Email send failed:', err.message));
      } else {
        console.warn('[PasswordReset] RESEND_API_KEY not set — reset link:', resetUrl);
      }
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
