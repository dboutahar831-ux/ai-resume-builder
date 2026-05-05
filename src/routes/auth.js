const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');
const { sendVerificationCode } = require('../utils/mailer');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, age, phone, location, linkedin } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered.' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, age, phone, location, linkedin, verified) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE) RETURNING id, name, email, age, phone, location, linkedin, avatar, created_at',
      [name, email, password_hash, age || null, phone || null, location || null, linkedin || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'email and code are required.' });

  try {
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    const entry = result.rows[0];
    if (!entry) return res.status(400).json({ error: 'No pending verification for this email.' });
    if (new Date() > new Date(entry.expires_at)) {
      await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);
      return res.status(400).json({ error: 'Code expired. Please register again.' });
    }
    if (entry.code !== String(code)) return res.status(400).json({ error: 'Incorrect code. Please try again.' });

    await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);
    const update = await pool.query(
      'UPDATE users SET verified=TRUE WHERE email=$1 RETURNING id, name, email, age, phone, location, linkedin, avatar, created_at',
      [email]
    );
    const user = update.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required.' });
  try {
    const user = await pool.query('SELECT id FROM users WHERE email=$1 AND verified=FALSE', [email]);
    if (!user.rows.length) return res.status(400).json({ error: 'No unverified account with this email.' });

    await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);
    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('INSERT INTO verification_codes (email, code, expires_at) VALUES ($1,$2,$3)', [email, code, expires]);
    try { await sendVerificationCode(email, code); } catch (e) { console.error('Email error:', e.message); }
    res.json({ message: 'Code resent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    await pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, age: user.age, phone: user.phone, location: user.location, linkedin: user.linkedin, avatar: user.avatar },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, age, phone, location, linkedin, avatar, bio, cover_image, COALESCE(show_online_status, TRUE) AS show_online_status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  const { name, age, phone, location, linkedin, avatar, bio, cover_image, show_online_status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, age=$2, phone=$3, location=$4, linkedin=$5, avatar=$6, bio=$7,
        cover_image=$8, show_online_status=$9
       WHERE id=$10
       RETURNING id, name, email, age, phone, location, linkedin, avatar, bio, cover_image, COALESCE(show_online_status, TRUE) AS show_online_status`,
      [name, age || null, phone || null, location || null, linkedin || null, avatar || null, bio || null,
       cover_image || null, show_online_status !== undefined ? show_online_status : true, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords are required.' });
  if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [password_hash, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/heartbeat — update last_seen_at
router.put('/heartbeat', auth, async (req, res) => {
  try {
    await pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/auth/account
router.delete('/account', auth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required to delete your account.' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password.' });
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
