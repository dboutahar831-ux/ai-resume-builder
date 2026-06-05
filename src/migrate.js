require('dotenv').config();
const pool = require('./db');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

const MIGRATIONS = [
  // v1 — tables that must exist before dependent migrations
  `CREATE TABLE IF NOT EXISTS _migrations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // messages columns
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_sender BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_receiver BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE`,

  // posts columns
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_metadata JSONB`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0`,

  // polls
  `CREATE TABLE IF NOT EXISTS polls (
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    question   TEXT NOT NULL,
    ends_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id)
  )`,
  `CREATE TABLE IF NOT EXISTS poll_options (
    id      SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text    TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS poll_votes (
    id        SERIAL PRIMARY KEY,
    poll_id   INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
  )`,

  // profile_views
  `CREATE TABLE IF NOT EXISTS profile_views (
    id              SERIAL PRIMARY KEY,
    profile_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewer_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_user_id, viewer_id)
  )`,

  // skill_endorsements
  `CREATE TABLE IF NOT EXISTS skill_endorsements (
    id              SERIAL PRIMARY KEY,
    profile_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endorser_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill           TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_user_id, endorser_id, skill)
  )`,

  // user_projects
  `CREATE TABLE IF NOT EXISTS user_projects (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    url         TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // reports
  `CREATE TABLE IF NOT EXISTS reports (
    id               SERIAL PRIMARY KEY,
    reporter_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id          INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason           TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // post_bookmarks
  `CREATE TABLE IF NOT EXISTS post_bookmarks (
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
  )`,
];

const NAMED_MIGRATIONS = [
  {
    name: '001_nickname_column',
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) DEFAULT ''`,
  },
  {
    name: '002_verification_codes',
    sql: `CREATE TABLE IF NOT EXISTS verification_codes (
      id          SERIAL PRIMARY KEY,
      email       VARCHAR(255) NOT NULL,
      code        VARCHAR(10)  NOT NULL,
      expires_at  TIMESTAMPTZ  NOT NULL,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )`,
  },
];

async function runMigrations() {
  logger.info('[Migration] Starting...');

  for (const sql of MIGRATIONS) {
    try {
      await pool.query(sql);
    } catch (err) {
      logger.error('[Migration] Statement failed:', err.message);
      logger.error('[Migration] SQL:', sql.substring(0, 100));
    }
  }

  for (const m of NAMED_MIGRATIONS) {
    try {
      const exists = await pool.query('SELECT id FROM _migrations WHERE name=$1', [m.name]);
      if (exists.rows.length === 0) {
        await pool.query(m.sql);
        await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [m.name]);
        logger.info(`[Migration] Applied: ${m.name}`);
      }
    } catch (err) {
      logger.error(`[Migration] Failed ${m.name}:`, err.message);
    }
  }

  if (fs.existsSync(MIGRATIONS_DIR)) {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const name = file.replace('.sql', '');
      try {
        const exists = await pool.query('SELECT id FROM _migrations WHERE name=$1', [name]);
        if (exists.rows.length === 0) {
          const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
          await pool.query(sql);
          await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
          logger.info(`[Migration] Applied: ${name}`);
        }
      } catch (err) {
        logger.error(`[Migration] Failed ${name}:`, err.message);
      }
    }
  }

  logger.info('[Migration] Complete.');
}

if (require.main === module) {
  runMigrations().then(() => pool.end()).catch(() => pool.end());
}

module.exports = runMigrations;
