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
console.log(`Debug:           http://localhost:${PORT}/debug/intercepted`);
console.log('='.repeat(60));

server.listen(PORT, () => {
  console.log(`\n✓ Server is running\n`);
  console.log(`Examples:`);
  console.log(`  curl http://localhost:${PORT}/proxy/posts/1`);
  console.log(`  curl http://localhost:${PORT}/debug/intercepted\n`);
});
