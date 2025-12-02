require('dotenv').config();
const server = require('./server');
const { createServer } = require('./storage/storage');
const { addRule } = require('./rules/rulesEngine');

const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
const SAMPLE_DATA = process.env.SAMPLE_DATA === 'true';

// Sample servers for development/testing
const sampleServers = [
  { id: 'dev-api' },
  { id: 'staging' },
  { id: 'mobile-api' }
];

function initSampleData() {
  console.log('[INIT] Creating sample servers...');
  sampleServers.forEach(server => {
    try {
      createServer(server.id);
      console.log(`  ✓ Created server: ${server.id}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  - Server already exists: ${server.id}`);
      } else {
        console.log(`  ✗ Failed to create ${server.id}: ${error.message}`);
      }
    }
  });
  
  console.log('[INIT] Creating sample rules...');
  
  addRule('dev-api', {
    priority: 100,
    name: 'Default API Proxy',
    method: '*',
    pathRegex: '.*',
    action: 'proxy',
    target: 'https://jsonplaceholder.typicode.com'
  });
  console.log('  ✓ dev-api: Default API Proxy');
  
  addRule('dev-api', {
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
  
  addRule('dev-api', {
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
  
  addRule('staging', {
    priority: 100,
    name: 'API Proxy',
    method: '*',
    pathRegex: '.*',
    action: 'proxy',
    target: 'https://jsonplaceholder.typicode.com'
  });
  console.log('  ✓ staging: API Proxy');
  
  addRule('staging', {
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
  
  addRule('staging', {
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
  
  addRule('mobile-api', {
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

console.log('='.repeat(60));
console.log('Faultend Proxy Server');
console.log('='.repeat(60));
console.log(`Port:            ${PORT}`);
console.log(`Root Domain:     ${ROOT_DOMAIN}`);
console.log(`Landing:         http://${ROOT_DOMAIN}:${PORT}`);
console.log(`Admin API:       http://admin.${ROOT_DOMAIN}:${PORT}/servers`);
console.log(`User App:        http://app.${ROOT_DOMAIN}:${PORT}`);
console.log(`Fault Servers:   http://[server-id].${ROOT_DOMAIN}:${PORT}`);
console.log('='.repeat(60));
console.log('');

console.log('[INIT] Starting with subdomain-based architecture');
console.log('[INIT] No fault servers created yet');
console.log('[INIT] Create fault servers via Admin API');

console.log('');

// Initialize sample data BEFORE starting server if enabled
if (SAMPLE_DATA) {
  initSampleData();
}

server.listen(PORT, () => {
  console.log(`✓ Server is running\n`);
  
  console.log(`Examples:`);
  console.log(`  # Create a fault server`);
  console.log(`  curl -X POST http://admin.${ROOT_DOMAIN}:${PORT}/servers \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"id":"server1","name":"Server 1","description":"Test instance"}'`);
  console.log(``);
  console.log(`  # Create a proxy rule for server1`);
  console.log(`  curl -X POST http://app.${ROOT_DOMAIN}:${PORT}/servers/server1/rules \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"priority":100,"name":"API Proxy","method":"*","pathRegex":".*","action":"proxy","target":"https://jsonplaceholder.typicode.com"}'`);
  console.log(``);
  console.log(`  # Send request through server1's fault server`);
  console.log(`  curl http://server1.${ROOT_DOMAIN}:${PORT}/posts/1`);
  console.log(``);
  console.log(`  # View traffic for server1`);
  console.log(`  curl http://app.${ROOT_DOMAIN}:${PORT}/servers/server1/traffic`);
  console.log('');
});
