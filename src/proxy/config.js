module.exports = {
  // Proxy options
  changeOrigin: true,
  xfwd: false,  // Don't add X-Forwarded-* headers that reveal proxy
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Timeout settings (in milliseconds)
  timeout: 30000,
  proxyTimeout: 30000,
  
  // Request size limits
  bodyParserLimit: '10mb'
};
