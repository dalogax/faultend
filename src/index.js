const server = require('./server');

const PORT = process.env.PORT || 3000;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

console.log('='.repeat(60));
console.log('Fault-end Proxy Server');
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
