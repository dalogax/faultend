// Proxy configuration settings
module.exports = {
  // Proxy options
  changeOrigin: true,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Timeout settings (in milliseconds)
  timeout: 30000,
  proxyTimeout: 30000,
  
  // Request size limits
  bodyParserLimit: '10mb'
};
