const server = require('./server');
const { getAllRules, addRule, getDefaultProxyRule } = require('./rules/rulesEngine');

const PORT = process.env.PORT || 3000;

/**
 * Initialize rules on startup
 * Just displays existing rules, doesn't create any defaults
 */
function initializeRules() {
  const rules = getAllRules();
  
  if (rules.length === 0) {
    console.log('[INIT] No rules configured');
    console.log('[INIT] Unmatched requests will return 502 Bad Gateway');
    console.log('[INIT] Create rules via API: POST /api/rules');
  } else {
    console.log(`[INIT] Loaded ${rules.length} rule(s):`);
    rules.forEach(rule => {
      const status = rule.enabled ? '✓' : '✗';
      const action = rule.action === 'proxy' ? `→ ${rule.target}` : 'MOCK';
      console.log(`  ${status} [${rule.priority}] ${rule.name} (${rule.method} ${rule.pathRegex}) ${action}`);
    });
  }
}

console.log('='.repeat(60));
console.log('Fault-end Proxy Server');
console.log('='.repeat(60));
console.log(`Port:            ${PORT}`);
console.log(`UI:              http://localhost:${PORT}`);
console.log(`Proxy:           http://localhost:${PORT}/proxy/*`);
console.log(`Traffic API:     http://localhost:${PORT}/api/traffic`);
console.log(`Stats:           http://localhost:${PORT}/api/traffic/stats`);
console.log('='.repeat(60));
console.log('');

// Initialize rules before starting server
initializeRules();

console.log('');

server.listen(PORT, () => {
  console.log(`✓ Server is running\n`);
  console.log(`Examples:`);
  console.log(`  # Make proxied requests (routed by rules)`);
  console.log(`  curl http://localhost:${PORT}/proxy/posts/1`);
  console.log(`  curl -X POST http://localhost:${PORT}/proxy/posts \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"title":"Test","body":"Content","userId":1}'`);
  console.log(``);
  console.log(`  # View traffic logs`);
  console.log(`  curl http://localhost:${PORT}/api/traffic`);
  console.log(`  curl http://localhost:${PORT}/api/traffic/stats`);
  console.log(`  curl "http://localhost:${PORT}/api/traffic?method=POST&statusCode=201"\n`);
});
