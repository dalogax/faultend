const server = require('./server');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://jsonplaceholder.typicode.com';

console.log('='.repeat(60));
console.log('Fault-end Proxy Server');
console.log('='.repeat(60));
console.log(`Port:            ${PORT}`);
console.log(`Default Backend: ${BACKEND_URL}`);
console.log(`UI:              http://localhost:${PORT}`);
console.log(`Proxy:           http://localhost:${PORT}/proxy/*`);
console.log(`Traffic API:     http://localhost:${PORT}/api/traffic`);
console.log(`Stats:           http://localhost:${PORT}/api/traffic/stats`);
console.log('='.repeat(60));

server.listen(PORT, () => {
  console.log(`\n✓ Server is running\n`);
  console.log(`Examples:`);
  console.log(`  # Make proxied requests`);
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
