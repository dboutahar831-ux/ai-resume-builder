require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Connected. Running migration...');
    await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS sticker VARCHAR(10)');
    console.log('  - sticker column added');
    await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL');
    console.log('  - reply_to_id column added');
    await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE');
    console.log('  - deleted column added');
    await client.query('ALTER TABLE messages ALTER COLUMN content DROP NOT NULL');
    console.log('  - content NOT NULL constraint dropped (stickers send null content)');
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
