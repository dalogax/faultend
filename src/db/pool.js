const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/faultend',
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

async function testConnection(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`[DB] Connection successful (attempt ${i + 1}/${retries})`);
      return true;
    } catch (error) {
      console.error(`[DB] Connection failed (attempt ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        console.log(`[DB] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed to connect to database after ${retries} attempts`);
}

module.exports = pool;
module.exports.testConnection = testConnection;
