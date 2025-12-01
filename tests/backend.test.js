/**
 * Faultend Integration Tests
 * Run with: npm test
 * 
 * Tests multi-server subdomain-based architecture:
 * - Admin API (create/list/delete fault servers)
 * - Rules Management API per customer
 * - Traffic logging per customer
 * - Subdomain routing (landing, admin, app, fault-server)
 * - Multi-server data isolation
 */

// Disable sample data for tests (before any requires)
process.env.SAMPLE_DATA = 'false';

const http = require('http');

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
const PORT = 3000;
let testsPassed = 0;
let testsFailed = 0;
let testServer = null;

// Helper to make HTTP requests with subdomain support
function request(method, path, body = null, headers = {}, subdomain = null) {
  return new Promise((resolve, reject) => {
    const host = subdomain ? `${subdomain}.${ROOT_DOMAIN}` : ROOT_DOMAIN;
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

    if (bodyData) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
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

// Test helper
async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

// Assertion helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertExists(value, message) {
  if (!value) {
    throw new Error(message || 'Value should exist');
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

// Main test suite
async function runTests() {
  console.log('='.repeat(70));
  console.log('Faultend Integration Tests');
  console.log('='.repeat(70));
  console.log('');

  // Start the server
  console.log('Starting test server...\n');
  const app = require('../src/server');
  const { clearAllServers } = require('../src/storage/storage');
  
  // Clear all servers to start fresh
  clearAllServers();
  console.log('[TEST INIT] Cleared all servers\n');
  
  testServer = app.listen(PORT);
  await wait(1000);

  // ===========================================
  // Section 1: Basic Subdomain Routing
  // ===========================================
  console.log('Section 1: Subdomain Routing');
  console.log('-'.repeat(70));

  await test('Health check on root domain', async () => {
    const res = await request('GET', '/health', null, {}, null);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.status, 'ok', 'Status should be ok');
    assertEqual(res.body.routeType, 'landing', 'Should detect landing route');
  });

  await test('Health check on admin subdomain', async () => {
    const res = await request('GET', '/health', null, {}, 'admin');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.routeType, 'admin', 'Should detect admin route');
  });

  await test('Health check on app subdomain', async () => {
    const res = await request('GET', '/health', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.routeType, 'app', 'Should detect app route');
  });

  await test('Health check on fault-server subdomain', async () => {
    const res = await request('GET', '/health', null, {}, 'server1');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.routeType, 'fault-server', 'Should detect fault-server route');
  });

  console.log('');

  // ===========================================
  // Section 2: Admin API - Fault Server Management
  // ===========================================
  console.log('Section 2: Admin API - Fault Server Management');
  console.log('-'.repeat(70));

  await test('List fault servers (empty initially)', async () => {
    const res = await request('GET', '/servers', null, {}, 'admin');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 0, 'Should have 0 servers initially');
  });

  await test('Create fault server: server1', async () => {
    const res = await request('POST', '/servers', {
      id: 'server1',
      name: 'Server 1',
      description: 'Test customer 1'
    }, {}, 'admin');
    assertEqual(res.status, 201, 'Should return 201');
    assertEqual(res.body.id, 'server1', 'Should have server1 id');
    assertExists(res.body.url, 'Should have URL');
  });

  await test('Create fault server: server2', async () => {
    const res = await request('POST', '/servers', {
      id: 'server2',
      name: 'Server 2'
    }, {}, 'admin');
    assertEqual(res.status, 201, 'Should return 201');
    assertEqual(res.body.id, 'server2', 'Should have server2 id');
  });

  await test('List fault servers (should have 2)', async () => {
    const res = await request('GET', '/servers', null, {}, 'admin');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 2, 'Should have 2 servers');
  });

  await test('Get specific fault server', async () => {
    const res = await request('GET', '/servers/server1', null, {}, 'admin');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.id, 'server1', 'Should be server1');
    assertEqual(res.body.rulesCount, 0, 'Should have 0 rules initially');
  });

  await test('Reject reserved subdomain (admin)', async () => {
    const res = await request('POST', '/servers', {
      id: 'admin',
      name: 'Admin'
    }, {}, 'admin');
    assertEqual(res.status, 400, 'Should return 400');
    assertTrue(res.body.message.includes('reserved'), 'Should mention reserved');
  });

  console.log('');

  // ===========================================
  // Section 3: Rules API - Per Customer
  // ===========================================
  console.log('Section 3: Rules API - Per Customer Isolation');
  console.log('-'.repeat(70));

  let server1RuleId;
  let server2RuleId;

  await test('Create rule for server1', async () => {
    const res = await request('POST', '/servers/server1/rules', {
      priority: 100,
      name: 'Server1 Proxy Rule',
      method: '*',
      pathRegex: '.*',
      action: 'proxy',
      target: 'https://jsonplaceholder.typicode.com'
    }, {}, 'app');
    assertEqual(res.status, 201, 'Should create rule');
    assertExists(res.body.id, 'Should have rule ID');
    server1RuleId = res.body.id;
  });

  await test('Create rule for server2', async () => {
    const res = await request('POST', '/servers/server2/rules', {
      priority: 100,
      name: 'Server2 Mock Rule',
      method: 'GET',
      pathRegex: '^/test$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: { message: 'Server 2 mock' }
      }
    }, {}, 'app');
    assertEqual(res.status, 201, 'Should create rule');
    server2RuleId = res.body.id;
  });

  await test('List rules for server1 (should have 1)', async () => {
    const res = await request('GET', '/servers/server1/rules', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 1, 'Server1 should have 1 rule');
    assertEqual(res.body.rules[0].name, 'Server1 Proxy Rule', 'Should be server1 rule');
  });

  await test('List rules for server2 (should have 1)', async () => {
    const res = await request('GET', '/servers/server2/rules', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 1, 'Server2 should have 1 rule');
    assertEqual(res.body.rules[0].name, 'Server2 Mock Rule', 'Should be server2 rule');
  });

  console.log('');

  // ===========================================
  // Section 4: Fault Server Proxying (NO /proxy prefix!)
  // ===========================================
  console.log('Section 4: Fault Server Proxying (No /proxy prefix)');
  console.log('-'.repeat(70));

  await test('Server1: Proxy request to /posts/1', async () => {
    const res = await request('GET', '/posts/1', null, {}, 'server1');
    assertEqual(res.status, 200, 'Should return 200 from proxy');
    assertExists(res.body.id, 'Should have post data');
    assertEqual(res.body.id, 1, 'Should be post 1');
  });

  await test('Server2: Mock request to /test', async () => {
    const res = await request('GET', '/test', null, {}, 'server2');
    assertEqual(res.status, 200, 'Should return 200 from mock');
    assertEqual(res.body.message, 'Server 2 mock', 'Should return mock response');
  });

  await test('Server2: Unmatched request returns 502', async () => {
    const res = await request('GET', '/unmatched', null, {}, 'server2');
    assertEqual(res.status, 502, 'Should return 502 for unmatched');
    assertTrue(res.body.message.includes('No proxy or mock rule'), 'Should explain no rule');
  });

  console.log('');

  // ===========================================
  // Section 5: Traffic Logging - Per Customer
  // ===========================================
  console.log('Section 5: Traffic Logging - Per Customer Isolation');
  console.log('-'.repeat(70));

  await test('Get traffic for server1', async () => {
    const res = await request('GET', '/servers/server1/traffic', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.serverId, 'server1', 'Should be for server1');
    assertTrue(res.body.count >= 1, 'Should have at least 1 traffic log');
  });

  await test('Get traffic for server2', async () => {
    const res = await request('GET', '/servers/server2/traffic', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.serverId, 'server2', 'Should be for server2');
    assertTrue(res.body.count >= 1, 'Should have at least 1 traffic log');
  });

  await test('Get traffic stats for server1', async () => {
    const res = await request('GET', '/servers/server1/traffic/stats', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertTrue(res.body.total >= 1, 'Should have traffic');
  });

  await test('502 responses are logged when no rule matches', async () => {
    const resGet = await request('GET', '/servers/server2/rules', null, {}, 'app');
    const server2Rule = resGet.body.rules[0];
    
    await request('DELETE', `/servers/server2/rules/${server2Rule.id}`, null, {}, 'app');
    
    const res502 = await request('GET', '/unmatched-path', null, {}, 'server2');
    assertEqual(res502.status, 502, 'Should return 502 for unmatched request');
    assertEqual(res502.body.error, 'No matching rule', 'Should have error message');
    
    const trafficRes = await request('GET', '/servers/server2/traffic', null, {}, 'app');
    const unmatchedLog = trafficRes.body.logs.find(log => 
      log.request.path === '/unmatched-path' && log.response.statusCode === 502
    );
    assertTrue(unmatchedLog !== undefined, 'Should have logged 502 response');
    assertEqual(unmatchedLog.target, 'UNMATCHED', 'Target should be UNMATCHED');
    assertEqual(unmatchedLog.matchedRule, null, 'Should have no matched rule');
    
    const recreateRes = await request('POST', '/servers/server2/rules', {
      priority: server2Rule.priority,
      name: server2Rule.name,
      method: server2Rule.method,
      pathRegex: server2Rule.pathRegex,
      action: server2Rule.action,
      mockResponse: server2Rule.mockResponse
    }, {}, 'app');
    assertEqual(recreateRes.status, 201, 'Should recreate rule successfully');
  });

  console.log('');

  // ===========================================
  // Section 6: Server Isolation
  // ===========================================
  console.log('Section 6: Server Data Isolation');
  console.log('-'.repeat(70));

  await test('Delete server1 rule does not affect server2', async () => {
    await request('DELETE', `/servers/server1/rules/${server1RuleId}`, null, {}, 'app');
    
    // Server1 should have 0 rules
    const res1 = await request('GET', '/servers/server1/rules', null, {}, 'app');
    assertEqual(res1.body.count, 0, 'Server1 should have 0 rules');
    
    // Server2 should still have 1 rule
    const res2 = await request('GET', '/servers/server2/rules', null, {}, 'app');
    assertEqual(res2.body.count, 1, 'Server2 should still have 1 rule');
  });

  await test('Delete fault server server1', async () => {
    const res = await request('DELETE', '/servers/server1', null, {}, 'admin');
    assertEqual(res.status, 200, 'Should delete successfully');
    
    // Verify deleted
    const listRes = await request('GET', '/servers', null, {}, 'admin');
    assertEqual(listRes.body.count, 1, 'Should have 1 server left');
  });

  console.log('');

  // ===========================================
  // Section 7: Extended Server Isolation Tests
  // ===========================================
  console.log('Section 7: Extended Server Isolation Tests');
  console.log('-'.repeat(70));

  // Create server3 for isolation testing
  await test('Create fault server: server3 for isolation testing', async () => {
    const res = await request('POST', '/servers', {
      id: 'server3',
      name: 'Server 3',
      description: 'Isolation test customer'
    }, {}, 'admin');
    assertEqual(res.status, 201, 'Should return 201');
    assertEqual(res.body.id, 'server3', 'Should have server3 id');
  });

  // Create rules for both server2 and server3
  let server3ProxyRuleId;
  await test('Create proxy rule for server3', async () => {
    const res = await request('POST', '/servers/server3/rules', {
      priority: 100,
      name: 'Server3 Proxy Rule',
      method: 'GET',
      pathRegex: '^/posts/.*',
      action: 'proxy',
      target: 'https://jsonplaceholder.typicode.com'
    }, {}, 'app');
    assertEqual(res.status, 201, 'Should create rule');
    server3ProxyRuleId = res.body.id;
  });

  await test('Server2 and Server3 rules are isolated', async () => {
    // Server2 should have its rules (mock rules from earlier)
    const res2 = await request('GET', '/servers/server2/rules', null, {}, 'app');
    assertTrue(res2.body.count >= 1, 'Server2 should have at least 1 rule');
    const server2HasProxy = res2.body.rules.some(r => r.name === 'Server3 Proxy Rule');
    assertEqual(server2HasProxy, false, 'Server2 should NOT have Server3 rules');
    
    // Server3 should only have its proxy rule
    const res3 = await request('GET', '/servers/server3/rules', null, {}, 'app');
    assertEqual(res3.body.count, 1, 'Server3 should have exactly 1 rule');
    assertEqual(res3.body.rules[0].name, 'Server3 Proxy Rule', 'Should be server3 proxy rule');
  });

  await test('Server3 proxy request works independently', async () => {
    const res = await request('GET', '/posts/2', null, {}, 'server3');
    assertEqual(res.status, 200, 'Should return 200 from proxy');
    assertEqual(res.body.id, 2, 'Should be post 2');
  });

  await test('Traffic logs are isolated between server2 and server3', async () => {
    // Get server2 traffic
    const res2 = await request('GET', '/servers/server2/traffic', null, {}, 'app');
    assertEqual(res2.status, 200, 'Should return 200');
    const server2HasServer3Traffic = res2.body.logs.some(log => 
      log.request.path === '/posts/2'
    );
    assertEqual(server2HasServer3Traffic, false, 'Server2 should NOT see server3 traffic');
    
    // Get server3 traffic
    const res3 = await request('GET', '/servers/server3/traffic', null, {}, 'app');
    assertEqual(res3.status, 200, 'Should return 200');
    const server3HasOwnTraffic = res3.body.logs.some(log => 
      log.request.path === '/posts/2'
    );
    assertTrue(server3HasOwnTraffic, 'Server3 should see its own traffic');
  });

  await test('Update rule for server3 does not affect server2', async () => {
    // Update server3 rule
    const updateRes = await request('PUT', `/servers/server3/rules/${server3ProxyRuleId}`, {
      priority: 90,
      name: 'Updated Server3 Rule',
      method: 'GET',
      pathRegex: '^/posts/.*',
      action: 'proxy',
      enabled: true,
      target: 'https://jsonplaceholder.typicode.com'
    }, {}, 'app');
    assertEqual(updateRes.status, 200, 'Should update rule');
    
    // Verify server3 has updated rule
    const res3 = await request('GET', '/servers/server3/rules', null, {}, 'app');
    assertEqual(res3.body.rules[0].name, 'Updated Server3 Rule', 'Server3 rule should be updated');
    assertEqual(res3.body.rules[0].priority, 90, 'Priority should be updated');
    
    // Verify server2 rules unchanged
    const res2 = await request('GET', '/servers/server2/rules', null, {}, 'app');
    const hasUpdatedRule = res2.body.rules.some(r => r.name === 'Updated Server3 Rule');
    assertEqual(hasUpdatedRule, false, 'Server2 should not have server3 updated rule');
  });

  await test('Delete server3 server removes all its data', async () => {
    const deleteRes = await request('DELETE', '/servers/server3', null, {}, 'admin');
    assertEqual(deleteRes.status, 200, 'Should delete successfully');
    
    // Verify server3 no longer exists
    const serverRes = await request('GET', '/servers/server3', null, {}, 'admin');
    assertEqual(serverRes.status, 404, 'Server3 should not be found');
    
    // Verify server2 still exists and unaffected
    const res2 = await request('GET', '/servers/server2', null, {}, 'admin');
    assertEqual(res2.status, 200, 'Server2 should still exist');
    assertEqual(res2.body.id, 'server2', 'Should be server2');
  });

  await test('Cannot access deleted server3 rules', async () => {
    const res = await request('GET', '/servers/server3/rules', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 0, 'Deleted customer should have 0 rules');
  });

  await test('Cannot access deleted server3 traffic', async () => {
    const res = await request('GET', '/servers/server3/traffic', null, {}, 'app');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 0, 'Deleted customer should have 0 traffic logs');
  });

  console.log('');

  // ===========================================
  // Section 8: Advanced Rules (Phase 6 features)
  // ===========================================
  console.log('Section 8: Advanced Rules (Template Variables, Latency, Conditions)');
  console.log('-'.repeat(70));

  await test('Create mock rule with template variables', async () => {
    const res = await request('POST', '/servers/server2/rules', {
      priority: 110,
      name: 'Template Test',
      method: 'GET',
      pathRegex: '^/template$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: {
          timestamp: '{{timestamp()}}',
          uuid: '{{uuid()}}',
          path: '{{request.path}}'
        }
      }
    }, {}, 'app');
    assertEqual(res.status, 201, 'Should create rule');
  });

  await test('Template variables render correctly', async () => {
    const res = await request('GET', '/template', null, {}, 'server2');
    assertEqual(res.status, 200, 'Should return 200');
    assertExists(res.body.timestamp, 'Should have timestamp');
    assertExists(res.body.uuid, 'Should have uuid');
    assertEqual(res.body.path, '/template', 'Should have request path');
  });

  await test('Create rule with enhanced latency (range)', async () => {
    const res = await request('POST', '/servers/server2/rules', {
      priority: 120,
      name: 'Latency Test',
      method: 'GET',
      pathRegex: '^/slow$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: { slow: true },
        latency: { type: 'range', min: 50, max: 100 }
      }
    }, {}, 'app');
    assertEqual(res.status, 201, 'Should create rule');
  });

  await test('Latency applies correctly', async () => {
    const start = Date.now();
    const res = await request('GET', '/slow', null, {}, 'server2');
    const duration = Date.now() - start;
    assertEqual(res.status, 200, 'Should return 200');
    assertTrue(duration >= 50, 'Should take at least 50ms');
  });

  console.log('');

  // ===========================================
  // Summary
  // ===========================================
  console.log('='.repeat(70));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('='.repeat(70));

  // Cleanup
  await new Promise(resolve => testServer.close(resolve));
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(async err => {
  console.error('Fatal test error:', err);
  if (testServer) await new Promise(resolve => testServer.close(resolve));
  process.exit(1);
});
