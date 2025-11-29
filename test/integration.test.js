/**
 * Fault-end Integration Tests - Phase 4-6
 * Run with: npm test
 * 
 * Comprehensive test suite covering:
 * - Rules Management API (CRUD, toggle, export/import)
 * - Traffic logging with rule metadata
 * - Mock and proxy rules in action
 * - End-to-end request routing scenarios
 * - Phase 6: Template variables, enhanced latency, conditions
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;
let testServer = null;

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...headers },
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
    if (error.stack) {
      console.error(`  ${error.stack.split('\n').slice(1, 3).join('\n')}`);
    }
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
  if (value === null || value === undefined) {
    throw new Error(message || 'Value should exist');
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Expected true');
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(`${message}\n  Expected > ${expected}\n  Actual: ${actual}`);
  }
}

// Wait helper
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Main test suite
async function runTests() {
  console.log('='.repeat(70));
  console.log('Fault-end Integration Tests - Phase 4-6');
  console.log('='.repeat(70));
  console.log('');

  // Start the server
  console.log('Starting test server...\n');
  const app = require('../src/server');
  const { getAllRules, addRule, clearRules } = require('../src/rules/rulesEngine');
  
  // Clear any existing rules to start fresh
  clearRules();
  console.log('[TEST INIT] Server starting with no rules configured\n');
  
  // Start server
  testServer = app.listen(3000);
  await wait(1000); // Wait for server to be ready

  // ===========================================
  // Section 1: Health Check & Setup
  // ===========================================
  console.log('Section 1: Health Check & Setup');
  console.log('-'.repeat(70));

  await test('Health check endpoint returns OK', async () => {
    const res = await request('GET', '/health');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.status, 'ok', 'Status should be ok');
    assertEqual(res.body.service, 'fault-end', 'Service should be fault-end');
  });

  await test('Server starts with no rules', async () => {
    const res = await request('GET', '/api/rules');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.count, 0, 'Should start with 0 rules');
    assertEqual(res.body.rules.length, 0, 'Rules array should be empty');
  });

  await test('Unmatched request returns 502', async () => {
    const res = await request('GET', '/proxy/posts/1');
    assertEqual(res.status, 502, 'Should return 502 when no rule matches');
    assertExists(res.body.error, 'Should have error message');
  });

  // Create a default proxy rule for tests that need actual proxying
  await test('Create default proxy rule for testing', async () => {
    const defaultRule = {
      priority: 0,
      name: 'Test Default Proxy',
      method: '*',
      pathRegex: '.*',
      action: 'proxy',
      target: 'https://jsonplaceholder.typicode.com'
    };
    
    const res = await request('POST', '/api/rules', defaultRule);
    assertEqual(res.status, 201, 'Should create default rule');
  });

  await test('Same request now works after adding proxy rule', async () => {
    const res = await request('GET', '/proxy/posts/1');
    assertEqual(res.status, 200, 'Should return 200 from proxied backend');
    assertExists(res.body.id, 'Should have response body from backend');
    assertEqual(res.body.id, 1, 'Should be post with ID 1');
  });

  console.log('');

  // ===========================================
  // Section 2: Rules CRUD Operations
  // ===========================================
  console.log('Section 2: Rules CRUD Operations');
  console.log('-'.repeat(70));

  let createdMockRuleId;
  let createdProxyRuleId;

  await test('Create mock rule via API', async () => {
    const newRule = {
      priority: 100,
      name: 'Test Mock Rule',
      method: 'GET',
      pathRegex: '^/test/mock$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: { message: 'Mocked response' },
        latency: 100
      }
    };
    
    const res = await request('POST', '/api/rules', newRule);
    assertEqual(res.status, 201, 'Should return 201 Created');
    assertExists(res.body.id, 'Should have generated ID');
    assertEqual(res.body.name, 'Test Mock Rule', 'Name should match');
    assertEqual(res.body.action, 'mock', 'Action should be mock');
    createdMockRuleId = res.body.id;
  });

  await test('Create proxy rule via API', async () => {
    const newRule = {
      priority: 90,
      name: 'Test Proxy Rule',
      method: 'POST',
      pathRegex: '^/test/proxy$',
      action: 'proxy',
      target: 'https://jsonplaceholder.typicode.com'
    };
    
    const res = await request('POST', '/api/rules', newRule);
    assertEqual(res.status, 201, 'Should return 201 Created');
    assertExists(res.body.id, 'Should have generated ID');
    assertEqual(res.body.name, 'Test Proxy Rule', 'Name should match');
    assertEqual(res.body.action, 'proxy', 'Action should be proxy');
    createdProxyRuleId = res.body.id;
  });

  await test('List all rules returns newly created rules', async () => {
    const res = await request('GET', '/api/rules');
    assertEqual(res.status, 200, 'Should return 200');
    assertGreaterThan(res.body.count, 1, 'Should have multiple rules');
    
    const mockRule = res.body.rules.find(r => r.id === createdMockRuleId);
    assertExists(mockRule, 'Mock rule should exist in list');
    
    const proxyRule = res.body.rules.find(r => r.id === createdProxyRuleId);
    assertExists(proxyRule, 'Proxy rule should exist in list');
  });

  await test('Get specific rule by ID', async () => {
    const res = await request('GET', `/api/rules/${createdMockRuleId}`);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.id, createdMockRuleId, 'Should return correct rule');
    assertEqual(res.body.name, 'Test Mock Rule', 'Name should match');
  });

  await test('Update rule via API', async () => {
    const updates = {
      priority: 95,
      name: 'Updated Mock Rule',
      method: 'GET',
      pathRegex: '^/test/mock$',
      action: 'mock',
      enabled: true,
      mockResponse: {
        statusCode: 404,
        body: { error: 'Not Found' },
        latency: 0
      }
    };
    
    const res = await request('PUT', `/api/rules/${createdMockRuleId}`, updates);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.name, 'Updated Mock Rule', 'Name should be updated');
    assertEqual(res.body.priority, 95, 'Priority should be updated');
    assertEqual(res.body.mockResponse.statusCode, 404, 'Status code should be updated');
  });

  await test('Toggle rule to disabled', async () => {
    const res = await request('PATCH', `/api/rules/${createdMockRuleId}/toggle`);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.enabled, false, 'Rule should be disabled');
  });

  await test('Toggle rule back to enabled', async () => {
    const res = await request('PATCH', `/api/rules/${createdMockRuleId}/toggle`);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.enabled, true, 'Rule should be enabled');
  });

  console.log('');

  // ===========================================
  // Section 3: Rule Validation
  // ===========================================
  console.log('Section 3: Rule Validation');
  console.log('-'.repeat(70));

  await test('Reject rule with invalid regex pattern', async () => {
    const invalidRule = {
      priority: 100,
      name: 'Invalid Rule',
      method: 'GET',
      pathRegex: '[invalid(regex',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: {}
      }
    };
    
    const res = await request('POST', '/api/rules', invalidRule);
    assertEqual(res.status, 400, 'Should return 400 Bad Request');
    assertExists(res.body.error, 'Should have error message');
  });

  await test('Reject mock rule without mockResponse', async () => {
    const invalidRule = {
      priority: 100,
      name: 'Invalid Mock',
      method: 'GET',
      pathRegex: '^/test$',
      action: 'mock'
    };
    
    const res = await request('POST', '/api/rules', invalidRule);
    assertEqual(res.status, 400, 'Should return 400 Bad Request');
  });

  await test('Reject proxy rule without target', async () => {
    const invalidRule = {
      priority: 100,
      name: 'Invalid Proxy',
      method: 'GET',
      pathRegex: '^/test$',
      action: 'proxy'
    };
    
    const res = await request('POST', '/api/rules', invalidRule);
    assertEqual(res.status, 400, 'Should return 400 Bad Request');
  });

  await test('Reject rule with missing name', async () => {
    const invalidRule = {
      priority: 100,
      method: 'GET',
      pathRegex: '^/test$',
      action: 'mock',
      mockResponse: { statusCode: 200, body: {} }
    };
    
    const res = await request('POST', '/api/rules', invalidRule);
    assertEqual(res.status, 400, 'Should return 400 Bad Request');
  });

  console.log('');

  // ===========================================
  // Section 4: Export/Import Rules
  // ===========================================
  console.log('Section 4: Export/Import Rules');
  console.log('-'.repeat(70));

  let exportedData;

  await test('Export all rules', async () => {
    const res = await request('POST', '/api/rules/export');
    assertEqual(res.status, 200, 'Should return 200');
    assertExists(res.body.version, 'Should have version');
    assertExists(res.body.exportedAt, 'Should have exportedAt timestamp');
    assertExists(res.body.rules, 'Should have rules array');
    assertGreaterThan(res.body.count, 0, 'Should have at least one rule');
    exportedData = res.body;
  });

  await test('Import rules in merge mode', async () => {
    const newRules = [
      {
        priority: 80,
        name: 'Imported Mock Rule',
        method: 'GET',
        pathRegex: '^/imported/mock$',
        action: 'mock',
        mockResponse: {
          statusCode: 200,
          body: { imported: true }
        }
      }
    ];
    
    const res = await request('POST', '/api/rules/import', {
      mode: 'merge',
      rules: newRules
    });
    
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.mode, 'merge', 'Mode should be merge');
    assertEqual(res.body.imported, 1, 'Should import 1 rule');
    assertGreaterThan(res.body.total, res.body.imported, 'Total should be greater than imported');
  });

  await test('Import rules in replace mode', async () => {
    const newRules = [
      {
        priority: 100,
        name: 'Only Rule After Replace',
        method: '*',
        pathRegex: '.*',
        action: 'proxy',
        target: 'https://jsonplaceholder.typicode.com'
      }
    ];
    
    const res = await request('POST', '/api/rules/import', {
      mode: 'replace',
      rules: newRules
    });
    
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.mode, 'replace', 'Mode should be replace');
    assertEqual(res.body.total, 1, 'Should only have 1 rule after replace');
  });

  await test('Restore exported rules', async () => {
    // Re-import the previously exported data to restore state
    const res = await request('POST', '/api/rules/import', {
      mode: 'replace',
      rules: exportedData.rules
    });
    
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.mode, 'replace', 'Mode should be replace');
  });

  await test('Reject import with invalid data', async () => {
    const res = await request('POST', '/api/rules/import', {
      mode: 'merge'
      // Missing rules array
    });
    
    assertEqual(res.status, 400, 'Should return 400 Bad Request');
  });

  console.log('');

  // ===========================================
  // Section 5: End-to-End Request Routing
  // ===========================================
  console.log('Section 5: End-to-End Request Routing');
  console.log('-'.repeat(70));

  // Clear traffic logs first
  await request('DELETE', '/api/traffic');

  // Create a high-priority mock rule for testing
  const mockRuleRes = await request('POST', '/api/rules', {
    priority: 200,
    name: 'E2E Mock Test',
    method: 'GET',
    pathRegex: '^/e2e/mock/test$',
    action: 'mock',
    mockResponse: {
      statusCode: 201,
      body: { test: 'mock', success: true },
      latency: 50
    }
  });
  const e2eMockRuleId = mockRuleRes.body.id;

  await test('Mock rule returns custom response', async () => {
    const res = await request('GET', '/proxy/e2e/mock/test');
    assertEqual(res.status, 201, 'Should return custom status code 201');
    assertEqual(res.body.test, 'mock', 'Should return custom body');
    assertEqual(res.body.success, true, 'Should return custom body');
  });

  await test('Mock rule is logged with matchedRule metadata', async () => {
    await wait(100); // Give logger time to process
    
    const res = await request('GET', '/api/traffic');
    assertEqual(res.status, 200, 'Should return 200');
    
    const logs = res.body.logs;
    const mockLog = logs.find(l => l.request.path === '/e2e/mock/test');
    
    assertExists(mockLog, 'Should have logged the mock request');
    assertEqual(mockLog.target, 'MOCK', 'Target should be MOCK');
    assertExists(mockLog.matchedRule, 'Should have matchedRule metadata');
    assertEqual(mockLog.matchedRule.id, e2eMockRuleId, 'Should match rule ID');
    assertEqual(mockLog.matchedRule.action, 'mock', 'Should be mock action');
  });

  await test('Disabled rule is not matched', async () => {
    // Disable the mock rule
    await request('PATCH', `/api/rules/${e2eMockRuleId}/toggle`);
    
    // Request should not match disabled rule
    const res = await request('GET', '/proxy/e2e/mock/test');
    // With the rule disabled, it should fall through to the default catch-all proxy
    // The default proxy should forward to jsonplaceholder which returns 404 for this path
    assertEqual(res.status, 404, 'Should get 404 from default proxy backend');
  });

  await test('Re-enabled rule works again', async () => {
    // Re-enable the mock rule
    await request('PATCH', `/api/rules/${e2eMockRuleId}/toggle`);
    
    // Request should match again
    const res = await request('GET', '/proxy/e2e/mock/test');
    assertEqual(res.status, 201, 'Should return custom status code 201');
  });

  console.log('');

  // ===========================================
  // Section 6: Traffic Logging & Filtering
  // ===========================================
  console.log('Section 6: Traffic Logging & Filtering');
  console.log('-'.repeat(70));

  // Clear logs and create some test traffic
  await request('DELETE', '/api/traffic');

  // Create different types of traffic
  await request('GET', '/proxy/e2e/mock/test');
  await request('POST', '/api/rules', {
    priority: 50,
    name: 'Temp Rule',
    method: 'GET',
    pathRegex: '^/temp$',
    action: 'mock',
    mockResponse: { statusCode: 404, body: { error: 'temp' } }
  });

  await wait(100);

  await test('Get all traffic logs', async () => {
    const res = await request('GET', '/api/traffic');
    assertEqual(res.status, 200, 'Should return 200');
    assertExists(res.body.logs, 'Should have logs array');
    assertGreaterThan(res.body.logs.length, 0, 'Should have logged traffic');
  });

  await test('Filter traffic by method', async () => {
    const res = await request('GET', '/api/traffic?method=GET');
    assertEqual(res.status, 200, 'Should return 200');
    
    const allGet = res.body.logs.every(log => log.request.method === 'GET');
    assertTrue(allGet, 'All logs should be GET requests');
  });

  await test('Filter traffic by status code', async () => {
    const res = await request('GET', '/api/traffic?statusCode=201');
    assertEqual(res.status, 200, 'Should return 200');
    
    if (res.body.logs.length > 0) {
      const allMatch = res.body.logs.every(log => log.response.statusCode === 201);
      assertTrue(allMatch, 'All logs should have status 201');
    }
  });

  await test('Get traffic statistics', async () => {
    const res = await request('GET', '/api/traffic/stats');
    assertEqual(res.status, 200, 'Should return 200');
    assertExists(res.body.total, 'Should have total');
    assertExists(res.body.byMethod, 'Should have byMethod');
    assertExists(res.body.byStatusCode, 'Should have byStatusCode');
  });

  await test('Clear traffic logs', async () => {
    const res = await request('DELETE', '/api/traffic');
    assertEqual(res.status, 200, 'Should return 200');
    
    const checkRes = await request('GET', '/api/traffic');
    assertEqual(checkRes.body.logs.length, 0, 'Logs should be cleared');
  });

  console.log('');

  // ===========================================
  // Section 7: Delete Rules & Cleanup
  // ===========================================
  console.log('Section 7: Delete Rules & Cleanup');
  console.log('-'.repeat(70));

  await test('Delete rule via API', async () => {
    const res = await request('DELETE', `/api/rules/${e2eMockRuleId}`);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.id, e2eMockRuleId, 'Should return deleted rule ID');
  });

  await test('Deleted rule no longer exists', async () => {
    const res = await request('GET', `/api/rules/${e2eMockRuleId}`);
    assertEqual(res.status, 404, 'Should return 404 Not Found');
  });

  await test('Cannot delete non-existent rule', async () => {
    const res = await request('DELETE', '/api/rules/non-existent-id');
    assertEqual(res.status, 404, 'Should return 404 Not Found');
  });

  await test('Cannot update non-existent rule', async () => {
    const res = await request('PUT', '/api/rules/non-existent-id', {
      priority: 100,
      name: 'Test',
      method: 'GET',
      pathRegex: '.*',
      action: 'mock',
      mockResponse: { statusCode: 200, body: {} }
    });
    assertEqual(res.status, 404, 'Should return 404 Not Found');
  });

  console.log('');

  // ===========================================
  // Phase 6: Template Variables Tests
  // ===========================================
  console.log('--- Phase 6: Template Variables ---');

  await test('Template variables render in mock responses', async () => {
    // Create rule with template variables
    const createRes = await request('POST', '/api/rules', {
      priority: 100,
      name: 'Template Test',
      method: 'GET',
      pathRegex: '^/template/.*',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: {
          path: '{{request.path}}',
          method: '{{request.method}}',
          timestamp: '{{timestamp()}}'
        }
      }
    });
    assertEqual(createRes.status, 201, 'Rule should be created');

    // Make request to trigger template rendering
    const res = await request('GET', '/proxy/template/test');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.path, '/template/test', 'Path should be rendered');
    assertEqual(res.body.method, 'GET', 'Method should be rendered');
    assertExists(res.body.timestamp, 'Timestamp should exist');
    assertTrue(res.body.timestamp.includes('T'), 'Timestamp should be ISO format');
  });

  await test('Template variables handle query parameters', async () => {
    const createRes = await request('POST', '/api/rules', {
      priority: 99,
      name: 'Query Template',
      method: 'GET',
      pathRegex: '^/query-test$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: {
          userId: '{{request.query.userId}}',
          name: '{{request.query.name}}'
        }
      }
    });
    assertEqual(createRes.status, 201, 'Rule should be created');

    // Make request with query params
    const res = await request('GET', '/proxy/query-test?userId=123&name=John');
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.userId, '123', 'Query param should be rendered');
    assertEqual(res.body.name, 'John', 'Query param should be rendered');
  });

  console.log('');

  // ===========================================
  // Phase 6: Enhanced Latency Tests
  // ===========================================
  console.log('--- Phase 6: Enhanced Latency ---');

  await test('Fixed latency object works', async () => {
    const createRes = await request('POST', '/api/rules', {
      priority: 98,
      name: 'Fixed Latency',
      method: 'GET',
      pathRegex: '^/fixed-latency$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: { test: true },
        latency: {
          type: 'fixed',
          value: 100
        }
      }
    });
    assertEqual(createRes.status, 201, 'Rule should be created');

    // Make request and check latency
    const start = Date.now();
    const res = await request('GET', '/proxy/fixed-latency');
    const duration = Date.now() - start;
    
    assertEqual(res.status, 200, 'Should return 200');
    assertTrue(duration >= 100, `Duration should be at least 100ms (was ${duration}ms)`);
  });

  await test('Range latency produces variable delays', async () => {
    const createRes = await request('POST', '/api/rules', {
      priority: 97,
      name: 'Range Latency',
      method: 'GET',
      pathRegex: '^/range-latency$',
      action: 'mock',
      mockResponse: {
        statusCode: 200,
        body: { test: true },
        latency: {
          type: 'range',
          min: 50,
          max: 150
        }
      }
    });
    assertEqual(createRes.status, 201, 'Rule should be created');

    // Make multiple requests to test range
    let allInRange = true;
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const res = await request('GET', '/proxy/range-latency');
      const duration = Date.now() - start;
      
      assertEqual(res.status, 200, 'Should return 200');
      if (duration < 50 || duration > 200) { // Allow some tolerance
        allInRange = false;
      }
    }
    assertTrue(allInRange, 'All requests should have latency in range');
  });

  console.log('');

  // ===========================================
  // Phase 6: Conditions Tests
  // ===========================================
  console.log('--- Phase 6: Conditions ---');

  await test('Header condition matches correctly', async () => {
    // Delete default proxy rule to ensure 502 for non-matching requests
    const rulesRes = await request('GET', '/api/rules');
    const defaultRule = rulesRes.body.rules.find(r => r.name === 'Test Default Proxy');
    if (defaultRule) {
      await request('DELETE', `/api/rules/${defaultRule.id}`);
    }

    // Create rule with header condition
    const createRes = await request('POST', '/api/rules', {
      priority: 96,
      name: 'Admin Only',
      method: 'GET',
      pathRegex: '^/admin$',
      action: 'mock',
      conditions: [
        {
          type: 'header',
          key: 'x-user-role',
          operator: 'equals',
          value: 'admin'
        }
      ],
      mockResponse: {
        statusCode: 200,
        body: { access: 'granted' }
      }
    });
    assertEqual(createRes.status, 201, 'Rule should be created');

    // Request with correct header should match
    const res1 = await request('GET', '/proxy/admin', null, { 'X-User-Role': 'admin' });
    assertEqual(res1.status, 200, 'Should return 200 with correct header');
    assertEqual(res1.body.access, 'granted', 'Should return mock response');

    // Request without header should not match (502)
    const res2 = await request('GET', '/proxy/admin');
    assertEqual(res2.status, 502, 'Should return 502 without header');
  });

  await test('Query parameter condition works', async () => {
    const createRes = await request('POST', '/api/rules', {
      priority: 95,
      name: 'Debug Mode',
      method: 'GET',
      pathRegex: '^/debug-endpoint$',
      action: 'mock',
      conditions: [
        {
          type: 'query',
          key: 'debug',
          operator: 'exists'
        }
      ],
      mockResponse: {
        statusCode: 200,
        body: { debug: true }
      }
    });
    assertEqual(createRes.status, 201, 'Rule should be created');

    // With query param should match
    const res1 = await request('GET', '/proxy/debug-endpoint?debug=true');
    assertEqual(res1.status, 200, 'Should return 200 with debug param');

    // Without query param should not match
    const res2 = await request('GET', '/proxy/debug-endpoint');
    assertEqual(res2.status, 502, 'Should return 502 without debug param');
  });

  console.log('');

  // ===========================================
  // Summary
  // ===========================================
  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log(`Total Tests:  ${testsPassed + testsFailed}`);
  console.log('='.repeat(70));

  // Cleanup
  if (testServer) {
    testServer.close();
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (testServer) {
    testServer.close();
  }
  process.exit(1);
});
