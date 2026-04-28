const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/faultend',
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
