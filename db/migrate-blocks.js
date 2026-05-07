require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/db');

async function migrate() {
  console.log('Running migration: create blocks table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id          SERIAL PRIMARY KEY,
        blocker_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE(blocker_id, blocked_id)
      );
    `);
    console.log('blocks table created (or already exists)');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
    `);
    console.log('idx_blocks_blocker index created');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
    `);
    console.log('idx_blocks_blocked index created');

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
  pool.end();
}

migrate();
