const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const r = await pool.query('SELECT id, name, email, avatar FROM users WHERE id=$1', [id]);
    done(null, r.rows[0] || null);
  } catch { done(null, null); }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(null, false, { message: 'No email from Google.' });
      const existing = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
      if (existing.rows[0]) return done(null, existing.rows[0]);
      const r = await pool.query(
        `INSERT INTO users (name, email, password_hash, avatar, verified)
         VALUES ($1,$2,$3,$4,TRUE) RETURNING *`,
        [profile.displayName, email, 'oauth_' + Math.random().toString(36), profile.photos?.[0]?.value || null]
      );
      done(null, r.rows[0]);
    } catch (err) { done(err); }
  }));
}

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/api/auth/linkedin/callback',
    scope: ['openid', 'profile', 'email'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || profile.email;
      if (!email) return done(null, false, { message: 'No email from LinkedIn.' });
      const existing = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
      if (existing.rows[0]) return done(null, existing.rows[0]);
      const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'LinkedIn User';
      const r = await pool.query(
        `INSERT INTO users (name, email, password_hash, avatar, verified)
         VALUES ($1,$2,$3,$4,TRUE) RETURNING *`,
        [name, email, 'oauth_' + Math.random().toString(36), profile.photos?.[0]?.value || null]
      );
      done(null, r.rows[0]);
    } catch (err) { done(err); }
  }));
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
  const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '30d' });
  const safeUser = JSON.stringify({ id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar });
  const encoded = encodeURIComponent(safeUser);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const redirectUrl = new URL('/login', clientUrl);
  redirectUrl.searchParams.set('token', token);
  redirectUrl.searchParams.set('user', encoded);
  res.redirect(redirectUrl.toString());
});

router.get('/linkedin', passport.authenticate('linkedin', { state: true, session: false }));

router.get('/linkedin/callback', passport.authenticate('linkedin', { session: false, failureRedirect: '/login' }), (req, res) => {
  const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '30d' });
  const safeUser = JSON.stringify({ id: req.user.id, name: req.user.name, email: req.user.email, avatar: req.user.avatar });
  const encoded = encodeURIComponent(safeUser);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const redirectUrl = new URL('/login', clientUrl);
  redirectUrl.searchParams.set('token', token);
  redirectUrl.searchParams.set('user', encoded);
  res.redirect(redirectUrl.toString());
});

router.get('/oauth/status', (_req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID,
    linkedin: !!process.env.LINKEDIN_CLIENT_ID,
  });
});

module.exports = router;
