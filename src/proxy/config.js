// Proxy configuration settings
module.exports = {
  // Default target backend - can be overridden via environment variable
  defaultTarget: process.env.BACKEND_URL || 'https://jsonplaceholder.typicode.com',
  
  // Proxy options
  changeOrigin: true,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Timeout settings (in milliseconds)
  timeout: 30000,
  proxyTimeout: 30000,
  
  // Request size limits
  bodyParserLimit: '10mb'
};
