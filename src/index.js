require('dotenv').config();
const server = require('./server');
const { migrateWithRetry } = require('./db/migrate');
const { testConnection } = require('./db/pool');
const { createUser, findUserByGoogleId, createServer, serverExists } = require('./storage/users');
const { addRule } = require('./rules/rulesEngine');

const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
const SAMPLE_DATA = process.env.SAMPLE_DATA === 'true';

const sampleServers = [
  { id: 'dev-api' },
  { id: 'staging' },
  { id: 'mobile-api' }
];

async function getOrCreateSampleUser() {
  let user = await findUserByGoogleId('sample-user-123');
  if (!user) {
    user = await createUser({
      googleId: 'sample-user-123',
      email: 'sample@faultend.local',
      name: 'Sample User',
      avatarUrl: null
    });
  }
  return user;
}

async function initSampleData() {
  console.log('[INIT] Creating sample data...');
  
  const user = await getOrCreateSampleUser();
  console.log(`  ✓ Sample user: ${user.email}`);
  
  for (const serverData of sampleServers) {
    try {
      const exists = await serverExists(serverData.id);
      if (!exists) {
        await createServer({
          serverId: serverData.id,
          name: serverData.id,
          description: '',
          ownerId: user.id
        });
        console.log(`  ✓ Created server: ${serverData.id}`);
      } else {
        console.log(`  - Server already exists: ${serverData.id}`);
      }
    } catch (error) {
      console.log(`  ✗ Failed to create ${serverData.id}: ${error.message}`);
    }
  }
  
  console.log('[INIT] Creating sample rules...');
  
  await addRule('dev-api', {
    priority: 100,
    name: 'Default API Proxy',
    method: '*',
    pathRegex: '.*',
    action: 'proxy',
    target: 'https://jsonplaceholder.typicode.com'
  });
  console.log('  ✓ dev-api: Default API Proxy');
  
  await addRule('dev-api', {
    priority: 110,
    name: 'Mock User 1',
    method: 'GET',
    pathRegex: '^/users/1$',
    action: 'mock',
    mockResponse: {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser'
      },
      latency: { type: 'fixed', value: 500 }
    }
  });
  console.log('  ✓ dev-api: Mock User 1');
  
  await addRule('dev-api', {
    priority: 90,
    name: 'Mock 404',
    method: '*',
    pathRegex: '^/not-found$',
    action: 'mock',
    enabled: false,
    mockResponse: {
      statusCode: 404,
      body: { error: 'Not Found', message: 'Resource does not exist' }
    }
  });
  console.log('  ✓ dev-api: Mock 404 (disabled)');
  
  await addRule('staging', {
    priority: 100,
    name: 'API Proxy',
    method: '*',
    pathRegex: '.*',
    action: 'proxy',
    target: 'https://jsonplaceholder.typicode.com'
  });
  console.log('  ✓ staging: API Proxy');
  
  await addRule('staging', {
    priority: 120,
    name: 'Dynamic Posts Response',
    method: 'GET',
    pathRegex: '^/posts$',
    action: 'mock',
    mockResponse: {
      statusCode: 200,
      body: {
        posts: [],
        count: 0,
        timestamp: '{{timestamp()}}',
        requestId: '{{uuid()}}'
      },
      latency: { type: 'range', min: 100, max: 300 }
    }
  });
  console.log('  ✓ staging: Dynamic Posts Response');
  
  await addRule('staging', {
    priority: 105,
    name: 'Conditional User Mock',
    method: 'GET',
    pathRegex: '^/users/123$',
    conditions: [
      {
        type: 'header',
        key: 'x-api-version',
        operator: 'equals',
        value: '2.0'
      }
    ],
    action: 'mock',
    mockResponse: {
      statusCode: 200,
      body: {
        id: 123,
        name: 'API v2 User',
        version: '2.0',
        createdAt: '{{timestamp()}}'
      }
    }
  });
  console.log('  ✓ staging: Conditional User Mock');
  
  await addRule('mobile-api', {
    priority: 100,
    name: 'Mobile API Proxy',
    method: '*',
    pathRegex: '.*',
    action: 'proxy',
    target: 'https://jsonplaceholder.typicode.com'
  });
  console.log('  ✓ mobile-api: Mobile API Proxy');
  
  console.log('[INIT] Sample data initialized\n');
}

async function start() {
  console.log('='.repeat(60));
  console.log('Faultend Proxy Server');
  console.log('='.repeat(60));
  console.log(`Port:            ${PORT}`);
  console.log(`Root Domain:     ${ROOT_DOMAIN}`);
  console.log(`Landing:         http://${ROOT_DOMAIN}:${PORT}`);
  console.log(`API:             http://app.${ROOT_DOMAIN}:${PORT}/api`);
  console.log(`User App:        http://app.${ROOT_DOMAIN}:${PORT}`);
  console.log(`Fault Servers:   http://[server-id].${ROOT_DOMAIN}:${PORT}`);
  console.log('='.repeat(60));
  console.log('');
  
  console.log('[INIT] Environment Variables:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || '***MISSING***');
  console.log('  PORT:', process.env.PORT || '***MISSING***');
  console.log('  ROOT_DOMAIN:', process.env.ROOT_DOMAIN || '***MISSING***');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '***configured***' : '***MISSING***');
  console.log('  SESSION_SECRET:', process.env.SESSION_SECRET ? '***configured***' : '***MISSING***');
  console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '***configured***' : '***MISSING***');
  console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '***configured***' : '***MISSING***');
  console.log('  SAMPLE_DATA:', process.env.SAMPLE_DATA || '***MISSING***');
  console.log('');
  
  try {
    console.log('[INIT] Testing database connection...');
    await testConnection();
    console.log('[INIT] Database connection established');
    
    await migrateWithRetry();
    console.log('[INIT] Database migrated successfully');
  } catch (error) {
    console.error('[INIT] Database setup failed:', error.message);
    console.log('[INIT] Continuing without database - auth and persistence features disabled');
  }
  
  if (SAMPLE_DATA) {
    try {
      await initSampleData();
    } catch (error) {
      console.error('[INIT] Sample data error (non-fatal):', error.message);
    }
  }
  
  server.listen(PORT, () => {
    console.log('✓ Server is running\n');
    
    console.log('Examples:');
  console.log(`  # Create a fault server`);
  console.log(`  curl -X POST http://app.${ROOT_DOMAIN}:${PORT}/api/servers \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"id":"server1"}'`);
    console.log('');
    console.log(`  # Create a proxy rule for server1`);
    console.log(`  curl -X POST http://app.${ROOT_DOMAIN}:${PORT}/api/servers/server1/rules \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"priority":100,"name":"API Proxy","method":"*","pathRegex":".*","action":"proxy","target":"https://jsonplaceholder.typicode.com"}'`);
    console.log('');
    console.log(`  # Send request through server1's fault server`);
    console.log(`  curl http://server1.${ROOT_DOMAIN}:${PORT}/posts/1`);
    console.log('');
    console.log(`  # View traffic for server1`);
    console.log(`  curl http://app.${ROOT_DOMAIN}:${PORT}/api/servers/server1/traffic`);
    console.log('');
  });
}

start().catch(error => {
  console.error('[INIT] Startup error:', error);
  process.exit(1);
});
