const express = require('express');
const path = require('path');
const proxyRouter = require('./proxy/router');
const debugRouter = require('./api/debug');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'fault-end',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoints (temporary for Phase 2 testing)
app.use('/debug', debugRouter);

// Proxy routes - must be last to catch all unmatched routes
// Note: Body parsing happens inside proxy router to preserve stream
app.use('/proxy', proxyRouter);

// 404 handler for non-proxied routes
app.use((req, res) => {
  // If request accepts JSON, return JSON error
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Route not found. Use /proxy/* for proxied requests.',
      availableRoutes: ['/health', '/debug/intercepted', '/proxy/*']
    });
  }
  
  // Otherwise serve the frontend
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;
