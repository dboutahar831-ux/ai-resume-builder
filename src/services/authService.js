const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError, UnauthorizedError, ConflictError, NotFoundError } = require('../utils/errors');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function registerUser({ name, email, password, age, phone, location, linkedin }) {
  if (!name || !email || !password) throw new ValidationError('Name, email and password are required.');
  if (typeof name !== 'string' || name.trim().length < 1) throw new ValidationError('Name must be a non-empty string.');
  if (!isValidEmail(email)) throw new ValidationError('A valid email is required.');
  if (password.length < 6) throw new ValidationError('Password must be at least 6 characters.');
  if (age && (isNaN(age) || age < 10 || age > 150)) throw new ValidationError('Age must be between 10 and 150.');

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing.rows.length > 0) throw new ConflictError('Email already registered.');

  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, age, phone, location, linkedin, verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
     RETURNING id, name, email, age, phone, location, linkedin, avatar, is_admin, created_at`,
    [name.trim(), email.toLowerCase().trim(), password_hash, age ? parseInt(age) : null, phone || null, location || null, linkedin || null]
  );
  const user = result.rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
  return { user, token };
}

async function loginUser({ email, password }) {
  if (!email || !password) throw new ValidationError('Email and password are required.');
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  const user = result.rows[0];
  if (!user) throw new UnauthorizedError('Invalid email or password.');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid email or password.');

  await pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [user.id]);
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
  return {
    user: { id: user.id, name: user.name, email: user.email, age: user.age, phone: user.phone, location: user.location, linkedin: user.linkedin, avatar: user.avatar, is_admin: user.is_admin },
    token,
  };
}

async function getProfile(userId) {
  const result = await pool.query(
    `SELECT id, name, nickname, email, age, phone, location, linkedin, avatar, bio, cover_image,
            skills, availability_status, is_admin,
            COALESCE(show_online_status, TRUE) AS show_online_status,
            COALESCE(show_read_receipts, TRUE) AS show_read_receipts,
            created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) throw new NotFoundError('User');
  return result.rows[0];
}

async function updateProfile(userId, data) {
  const { name, nickname, age, phone, location, linkedin, avatar, bio, cover_image, skills, availability_status, show_online_status, show_read_receipts } = data;
  if (!name) throw new ValidationError('Name is required.');

  const result = await pool.query(
    `UPDATE users SET name=$1, nickname=$2, age=$3, phone=$4, location=$5, linkedin=$6, avatar=$7, bio=$8,
            cover_image=$9, skills=$10, availability_status=$11, show_online_status=$12, show_read_receipts=$13
     WHERE id=$14
     RETURNING id, name, nickname, email, age, phone, location, linkedin, avatar, bio, cover_image, skills,
               availability_status,
               COALESCE(show_online_status, TRUE) AS show_online_status,
               COALESCE(show_read_receipts, TRUE) AS show_read_receipts`,
    [name, nickname || '', age || null, phone || null, location || null, linkedin || null, avatar || null, bio || null,
     cover_image || null,
     skills ? JSON.stringify(skills) : '[]',
     ['open_to_work', 'not_looking', 'all'].includes(availability_status) ? availability_status : 'all',
     show_online_status !== undefined ? show_online_status : true,
     show_read_receipts !== undefined ? show_read_receipts : true,
     userId]
  );
  return result.rows[0];
}

async function changePassword(userId, current_password, new_password) {
  if (!current_password || !new_password) throw new ValidationError('Both passwords are required.');
  if (new_password.length < 6) throw new ValidationError('New password must be at least 6 characters.');

  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!result.rows[0]) throw new NotFoundError('User');
  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect.');

  const password_hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [password_hash, userId]);
  return { message: 'Password updated successfully.' };
}

async function searchUsers(query, currentUserId) {
  const q = (query || '').toLowerCase().trim();
  const result = await pool.query(
    `SELECT id, name, avatar FROM users
     WHERE LOWER(name) LIKE $2 AND id != $1
     ORDER BY name ASC LIMIT 6`,
    [currentUserId, `%${q}%`]
  );
  return result.rows;
}

async function heartbeat(userId) {
  await pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [userId]);
  return { ok: true };
}

async function deleteAccount(userId, password) {
  if (!password) throw new ValidationError('Password is required to delete your account.');
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!result.rows[0]) throw new NotFoundError('User');
  const valid = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!valid) throw new UnauthorizedError('Incorrect password.');
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return { message: 'Account deleted successfully.' };
}

module.exports = { registerUser, loginUser, getProfile, updateProfile, changePassword, searchUsers, heartbeat, deleteAccount };
