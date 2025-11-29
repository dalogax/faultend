/**
 * Integration tests for Fault-end Phase 3
 * Run with: node test/integration.test.js
 * Assumes server is running on port 3000
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

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
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Set Content-Length if we have a body
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
    
    if (bodyData) {
      req.write(bodyData);
    }
    
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
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

// Main test suite
async function runTests() {
  console.log('='.repeat(60));
  console.log('Fault-end Phase 3 Integration Tests');
  console.log('='.repeat(60));
  console.log('');

  // Clear any existing traffic
  await request('DELETE', '/api/traffic');

  // Test 1: Health check
  await test('Health endpoint returns OK', async () => {
    const res = await request('GET', '/health');
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.body.status, 'ok', 'Status should be ok');
  });

  // Test 2: Proxy GET request
  await test('Proxy GET request and capture response body', async () => {
    const res = await request('GET', '/proxy/posts/1');
    assertEqual(res.status, 200, 'Proxy should return 200');
    assertExists(res.body.id, 'Response should have id field');
    assertExists(res.body.title, 'Response should have title field');
  });

  // Test 3: Verify traffic was logged
  await test('Traffic log captures GET request', async () => {
    const res = await request('GET', '/api/traffic');
    assertEqual(res.body.count, 1, 'Should have 1 logged transaction');
    const log = res.body.logs[0];
    assertEqual(log.request.method, 'GET', 'Method should be GET');
    assertEqual(log.request.path, '/posts/1', 'Path should be /posts/1');
    assertEqual(log.response.statusCode, 200, 'Status code should be 200');
    assertExists(log.response.body, 'Response body should be captured');
    assertExists(log.response.body.id, 'Response body should have id');
  });

  // Test 4: Proxy POST with body
  await test('Proxy POST request with JSON body', async () => {
    const postData = { title: 'Test Post', body: 'Test content', userId: 1 };
    const res = await request('POST', '/proxy/posts', postData);
    // Should get a successful response
    assert(res.status >= 200 && res.status < 300, `POST should return 2xx, got ${res.status}`);
    assertExists(res.body, 'Response should have body');
    // If it's a successful response, it should have the data
    if (res.status === 201 || res.status === 200) {
      assertExists(res.body.id, 'Response should have id');
    }
  });

  // Test 5: Verify POST body was captured
  await test('Traffic log captures POST request body', async () => {
    const res = await request('GET', '/api/traffic?method=POST');
    assertEqual(res.body.count, 1, 'Should have 1 POST transaction');
    const log = res.body.logs[0];
    assertEqual(log.request.method, 'POST', 'Method should be POST');
    assertExists(log.request.body, 'Request body should be captured');
    assertEqual(log.request.body.title, 'Test Post', 'Request body should match');
    assertExists(log.response.body, 'Response body should be captured');
  });

  // Test 6: Multiple requests for filtering tests
  await test('Make multiple requests for filtering', async () => {
    await request('GET', '/proxy/posts/2');
    await request('GET', '/proxy/users/1');
    await request('GET', '/proxy/comments/1');
    const res = await request('GET', '/api/traffic');
    assert(res.body.count >= 5, 'Should have at least 5 transactions');
  });

  // Test 7: Filter by method
  await test('Filter traffic by method', async () => {
    const res = await request('GET', '/api/traffic?method=GET');
    assert(res.body.count >= 4, 'Should have multiple GET requests');
    res.body.logs.forEach(log => {
      assertEqual(log.request.method, 'GET', 'All logs should be GET');
    });
  });

  // Test 8: Filter by status code
  await test('Filter traffic by status code', async () => {
    const res = await request('GET', '/api/traffic?statusCode=200');
    assert(res.body.count >= 1, 'Should have 200 responses');
    res.body.logs.forEach(log => {
      assertEqual(log.response.statusCode, 200, 'All logs should have status 200');
    });
  });

  // Test 9: Filter by path
  await test('Filter traffic by path substring', async () => {
    const res = await request('GET', '/api/traffic?path=posts');
    assert(res.body.count >= 2, 'Should have posts requests');
    res.body.logs.forEach(log => {
      assert(log.request.path.includes('posts'), 'Path should contain "posts"');
    });
  });

  // Test 10: Filter by regex
  await test('Filter traffic by regex pattern', async () => {
    const res = await request('GET', '/api/traffic?regex=posts');
    // Should find at least the POST requests we made
    assert(res.body.count >= 1, `Should match posts requests, got ${res.body.count}`);
    // Verify at least one log has 'posts' in the path
    const hasPostsPath = res.body.logs.some(log => log.request.path.includes('posts'));
    assert(hasPostsPath, 'At least one log should have "posts" in path');
  });

  // Test 11: Get traffic stats
  await test('Get traffic statistics', async () => {
    const res = await request('GET', '/api/traffic/stats');
    assertExists(res.body.total, 'Should have total');
    assertExists(res.body.byMethod, 'Should have byMethod stats');
    assertExists(res.body.byStatusCode, 'Should have byStatusCode stats');
    assertExists(res.body.averageDuration, 'Should have averageDuration');
    assert(res.body.total >= 5, 'Should have multiple transactions');
  });

  // Test 12: Get specific transaction by ID
  await test('Get specific transaction by ID', async () => {
    const allRes = await request('GET', '/api/traffic');
    const firstLog = allRes.body.logs[0];
    const res = await request('GET', `/api/traffic/${firstLog.id}`);
    assertEqual(res.status, 200, 'Should return 200');
    assertEqual(res.body.id, firstLog.id, 'ID should match');
    assertExists(res.body.request, 'Should have request');
    assertExists(res.body.response, 'Should have response');
  });

  // Test 13: Test 404 for non-existent transaction
  await test('Return 404 for non-existent transaction ID', async () => {
    const res = await request('GET', '/api/traffic/nonexistent-id');
    assertEqual(res.status, 404, 'Should return 404');
    assertExists(res.body.error, 'Should have error message');
  });

  // Test 14: Clear traffic logs
  await test('Clear all traffic logs', async () => {
    const res = await request('DELETE', '/api/traffic');
    assertEqual(res.status, 200, 'Should return 200');
    assertExists(res.body.clearedCount, 'Should have clearedCount');
    
    // Verify logs are cleared
    const checkRes = await request('GET', '/api/traffic');
    assertEqual(checkRes.body.count, 0, 'Logs should be cleared');
  });

  // Test 15: Error handling - invalid proxy target
  await test('Error logging for proxy failures', async () => {
    const res = await request('GET', '/proxy/invalid-endpoint-xyz');
    // Either 404 from backend or 502 from proxy error
    assert(res.status === 404 || res.status === 502, 'Should handle error');
    
    // Check if error was logged
    const logsRes = await request('GET', '/api/traffic');
    assert(logsRes.body.count >= 1, 'Error should be logged');
  });

  // Print summary
  console.log('');
  console.log('='.repeat(60));
  console.log('Test Results');
  console.log('='.repeat(60));
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(60));

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
