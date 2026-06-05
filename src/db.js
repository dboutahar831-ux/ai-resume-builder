const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: true }
      : false,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
});

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error:', err.message);
});

module.exports = pool;
