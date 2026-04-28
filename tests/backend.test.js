process.env.SAMPLE_DATA = 'false';
process.env.ROOT_DOMAIN = 'localhost';
process.env.PORT = '3001';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/faultend_test';

const http = require('http');
const pool = require('../src/db/pool');

const PORT = 3001;
let testsPassed = 0;
let testsFailed = 0;
let testServer = null;
let sessionCookie = null;

function request(method, path, body = null, headers = {}, subdomain = null) {
  return new Promise((resolve, reject) => {
    const host = subdomain ? `${subdomain}.localhost` : 'localhost';
    const bodyData = body ? JSON.stringify(body) : null;
    
    const options = {
      method,
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      headers: { 
        'Host': `${host}:${PORT}`,
        'Content-Type': 'application/json',
        ...headers 
      },
      timeout: 5000
    };

    if (sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    if (bodyData) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        }
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n    Expected: ${expected}\n    Actual: ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Expected true');
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resetDatabase() {
  await pool.query(`
    DROP TABLE IF EXISTS traffic CASCADE;
    DROP TABLE IF EXISTS rules CASCADE;
    DROP TABLE IF EXISTS server_collaborators CASCADE;
    DROP TABLE IF EXISTS servers CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS "session" CASCADE;
  `);
  
  const { migrate } = require('../src/db/migrate');
  await migrate();
}

async function createTestUser() {
  const { createUser } = require('../src/storage/users');
  return createUser({
    googleId: 'test-google-id-123',
    email: 'test@faultend.local',
    name: 'Test User',
    avatarUrl: null
  });
}

async function loginAsUser(user) {
  const { session } = require('../src/server');
  session.userId = user.id;
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('Faultend Phase 11 Integration Tests');
  console.log('='.repeat(70));
  console.log('');

  console.log('Resetting database...');
  await resetDatabase();
  console.log('Database reset complete.\n');

  console.log('Starting test server...');
  const app = require('../src/server');
  testServer = app.listen(PORT);
  await wait(1000);
  console.log('Test server running.\n');

  const testUser = await createTestUser();
  console.log(`Test user created: ${testUser.email} (ID: ${testUser.id})\n`);

  const loginRes = await request('POST', '/auth/me', null, {}, 'app');
  
  console.log('Section 1: Authentication');
  console.log('-'.repeat(70));

  await test('Auth endpoints are accessible without login', async () => {
    const res = await request('GET', '/health', null, {}, 'app');
    assertEqual(res.status, 200, 'Health check should work');
  });

  await test('Protected endpoints return 401 without auth', async () => {
    sessionCookie = null;
    const res = await request('GET', '/servers', null, {}, 'admin');
    assertEqual(res.status, 401, 'Should require auth');
    sessionCookie = 'faultend.sid=test-session';
  });

  console.log('');
  console.log('Section 2: Server Management with Auth');
  console.log('-'.repeat(70));

  await test('Create server requires auth', async () => {
    sessionCookie = null;
    const res = await request('POST', '/servers', { id: 'server1' }, {}, 'admin');
    assertEqual(res.status, 401, 'Should require auth');
  });

  console.log('');
  console.log('Section 3: Proxy Routes (Public)');
  console.log('-'.repeat(70));

  await test('Proxy health check is public', async () => {
    const res = await request('GET', '/health', null, {}, 'server1');
    assertEqual(res.status, 200, 'Health check should work without auth');
    assertEqual(res.body.routeType, 'fault-server', 'Should detect fault-server route');
  });

  console.log('');
  console.log('Section 4: Collaboration');
  console.log('-'.repeat(70));

  await test('Invite endpoints require auth', async () => {
    sessionCookie = null;
    const res = await request('POST', '/servers/server1/invite', {}, {}, 'app');
    assertEqual(res.status, 401, 'Should require auth');
  });

  console.log('');

  testServer.close();
  await pool.end();

  console.log('='.repeat(70));
  console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(70));

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
