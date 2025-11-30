const express = require('express');
const cors = require('cors');
const path = require('path');
const subdomainRouter = require('./middleware/subdomainRouter');
const proxyRouter = require('./proxy/router');
const trafficRouter = require('./api/traffic');
const rulesRouter = require('./api/rules');
const adminRouter = require('./api/admin');

const app = express();

// Enable CORS for all subdomains
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

app.use(subdomainRouter);

// Health check endpoint (available on all subdomains)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Faultend',
    version: '0.1.0',
    subdomain: req.subdomain,
    routeType: req.routeType,
    serverId: req.serverId || null,
    timestamp: new Date().toISOString()
  });
});

// Route based on subdomain type
app.use((req, res, next) => {
  const { routeType } = req;
  
  // Landing page (no subdomain)
  if (routeType === 'landing') {
    // Serve static files (CSS, JS, SVG, etc.)
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/fonts/') || req.path === '/faultend.svg') {
      return express.static(path.join(__dirname, '../public'))(req, res, next);
    }
    // Serve landing.html for root path
    if (req.path === '/' || req.path === '/index.html') {
      return res.sendFile(path.join(__dirname, '../public/landing.html'));
    }
    return res.status(404).json({
      error: 'Not Found',
      message: 'Landing page only. Use admin.* for management, app.* for UI, or [server].* for fault servers.',
      availableRoutes: ['/health']
    });
  }
  
  // Admin API
  if (routeType === 'admin') {
    // All non-health routes go to admin router
    return next();
  }
  
  // App UI
  if (routeType === 'app') {
    // Serve static files (CSS, JS, etc.)
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/fonts/') || req.path === '/faultend.svg') {
      return express.static(path.join(__dirname, '../public'))(req, res, next);
    }
    // Serve app.html for root path
    if (req.path === '/' || req.path === '/index.html' || req.path === '/app.html') {
      return res.sendFile(path.join(__dirname, '../public/app.html'));
    }
    // All other routes go to routers (no /api prefix needed)
    return next();
  }
  
  // Fault server - proxy all requests
  if (routeType === 'fault-server') {
    return next(); // Let proxy router handle it
  }
  
  res.status(500).json({ error: 'Unknown route type' });
});

// Admin API routes (only on admin.*)
app.use((req, res, next) => {
  if (req.routeType !== 'admin') {
    return next();
  }
  // Mount admin router directly (no /api/admin prefix)
  adminRouter(req, res, next);
});

// Traffic and Rules APIs (only on app.*) - nested under /servers/:serverId
app.use('/servers/:serverId/traffic', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  // serverId already set by subdomainRouter middleware from path
  trafficRouter(req, res, next);
});

app.use('/servers/:serverId/rules', (req, res, next) => {
  if (req.routeType !== 'app') {
    return next();
  }
  // serverId already set by subdomainRouter middleware from path
  rulesRouter(req, res, next);
});

// Proxy router - handles ALL requests on fault-server subdomains
// No /proxy prefix - all paths go through rules engine
app.use((req, res, next) => {
  if (req.routeType === 'fault-server') {
    return proxyRouter(req, res, next);
  }
  next();
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found',
    subdomain: req.subdomain,
    routeType: req.routeType
  });
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
