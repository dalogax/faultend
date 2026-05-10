process.env.SAMPLE_DATA = 'false';
process.env.ROOT_DOMAIN = 'localhost';
process.env.PORT = '3001';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/faultend_test';
process.env.MOCK_AUTH_ENABLED = 'true';
process.env.SESSION_SECRET = 'test-secret-key';

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

async function login() {
  const res = await request('GET', '/api/auth/dev-login', null, {}, 'app');
  assertEqual(res.status, 302, 'Dev login should redirect');
  assertTrue(sessionCookie, 'Session cookie should be set');
}

async function logout() {
  const res = await request('POST', '/api/auth/logout', null, {}, 'app');
  assertEqual(res.status, 200, 'Logout should succeed');
  sessionCookie = null;
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('Faultend Integration Tests');
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

  console.log('Section 1: Authentication');
  console.log('-'.repeat(70));

  await test('Health check is public', async () => {
    const res = await request('GET', '/health', null, {}, 'app');
    assertEqual(res.status, 200, 'Health check should work');
  });

  await test('Protected endpoints return 401 without auth', async () => {
    sessionCookie = null;
    const res = await request('GET', '/api/servers', null, {}, 'app');
    assertEqual(res.status, 401, 'Should require auth');
  });

  await test('Dev login creates session', async () => {
    await login();
    assertTrue(sessionCookie, 'Session cookie should be set');
  });

  await test('Auth me returns user when logged in', async () => {
    const res = await request('GET', '/api/auth/me', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return user');
    assertTrue(res.body.email, 'Should have email');
  });

  await test('Logout clears session', async () => {
    await logout();
    const res = await request('GET', '/api/auth/me', null, {}, 'app');
    assertEqual(res.status, 401, 'Should be logged out');
  });

  console.log('');
  console.log('Section 2: Server Management');
  console.log('-'.repeat(70));

  await test('Create server requires auth', async () => {
    sessionCookie = null;
    const res = await request('POST', '/api/servers', { id: 'server1' }, {}, 'app');
    assertEqual(res.status, 401, 'Should require auth');
  });

  await test('Create server when authenticated', async () => {
    await login();
    const res = await request('POST', '/api/servers', { id: 'test-server', name: 'Test Server' }, {}, 'app');
    assertEqual(res.status, 201, 'Should create server');
    assertEqual(res.body.server_id, 'test-server', 'Should return server ID');
  });

  await test('List servers returns only owned servers', async () => {
    const res = await request('GET', '/api/servers', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return servers');
    assertTrue(Array.isArray(res.body.servers), 'Should be array');
    assertTrue(res.body.servers.length > 0, 'Should have at least one server');
  });

  await test('Get server requires access', async () => {
    const res = await request('GET', '/api/servers/test-server', null, {}, 'app');
    assertEqual(res.status, 200, 'Owner should have access');
  });

  console.log('');
  console.log('Section 3: Proxy Routes (Public)');
  console.log('-'.repeat(70));

  await test('Proxy health check is public', async () => {
    const res = await request('GET', '/health', null, {}, 'test-server');
    assertEqual(res.status, 200, 'Health check should work without auth');
    assertEqual(res.body.routeType, 'fault-server', 'Should detect fault-server route');
  });

  console.log('');
  console.log('Section 4: Rules');
  console.log('-'.repeat(70));

  await test('Create rule requires auth', async () => {
    sessionCookie = null;
    const res = await request('POST', '/api/servers/test-server/rules', {
      priority: 100,
      method: '*',
      pathRegex: '.*',
      action: 'proxy',
      target: 'https://jsonplaceholder.typicode.com'
    }, {}, 'app');
    assertEqual(res.status, 401, 'Should require auth');
  });

  await test('Create rule when authenticated', async () => {
    await login();
    const res = await request('POST', '/api/servers/test-server/rules', {
      priority: 100,
      method: '*',
      pathRegex: '.*',
      action: 'proxy',
      target: 'https://jsonplaceholder.typicode.com'
    }, {}, 'app');
    assertEqual(res.status, 201, 'Should create rule');
  });

  await test('List rules requires access', async () => {
    const res = await request('GET', '/api/servers/test-server/rules', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return rules');
    assertTrue(Array.isArray(res.body.rules), 'Should be array');
  });

  console.log('');
  console.log('Section 5: Collaboration');
  console.log('-'.repeat(70));

  await test('Invite endpoints require auth', async () => {
    sessionCookie = null;
    const res = await request('POST', '/api/servers/test-server/invite', {}, {}, 'app');
    assertEqual(res.status, 401, 'Should require auth');
  });

  await test('Generate invite link as owner', async () => {
    await login();
    const res = await request('POST', '/api/servers/test-server/invite', {}, {}, 'app');
    assertEqual(res.status, 200, 'Should generate invite');
    assertTrue(res.body.inviteUrl, 'Should have invite URL');
  });

  await test('Get collaborators as owner', async () => {
    const res = await request('GET', '/api/servers/test-server/invite/collaborators', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return collaborators');
    assertTrue(Array.isArray(res.body.collaborators), 'Should be array');
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
