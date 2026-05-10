const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = await pool.connect();
  
  try {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('[MIGRATE] Schema applied successfully');
    
  } catch (error) {
    console.error('[MIGRATE] Error applying schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function migrateWithRetry(retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await migrate();
      return;
    } catch (error) {
      console.error(`[MIGRATE] Migration failed (attempt ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        console.log(`[MIGRATE] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function reset() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      DROP TABLE IF EXISTS traffic CASCADE;
      DROP TABLE IF EXISTS rules CASCADE;
      DROP TABLE IF EXISTS server_collaborators CASCADE;
      DROP TABLE IF EXISTS servers CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS "session" CASCADE;
    `);
    console.log('[MIGRATE] Database reset successfully');
  } catch (error) {
    console.error('[MIGRATE] Error resetting database:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    reset().then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    migrate().then(() => process.exit(0)).catch(() => process.exit(1));
  }
}

module.exports = { migrate, migrateWithRetry, reset };
