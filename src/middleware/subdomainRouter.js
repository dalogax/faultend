const url = require('url');
const { getSubdomain, getRouteType } = require('../utils/subdomain');

function subdomainRouter(req, res, next) {
  const subdomain = getSubdomain(req);
  const routeType = getRouteType(subdomain);
  
  // Set routing context on request
  req.subdomain = subdomain;
  req.routeType = routeType;
  
  // For fault-server routes, set serverId for data isolation
  if (routeType === 'fault-server') {
    req.serverId = subdomain;
  }
  
  // For app routes, extract serverId from path: /api/servers/:serverId/...
  // This enables the UI to manage multiple servers from one subdomain
  if (routeType === 'app') {
    // Extract serverId from path like /api/servers/server1/rules
    const serverPathMatch = req.url.match(/^\/api\/servers\/([^\/\?]+)/);
    if (serverPathMatch) {
      req.serverId = serverPathMatch[1];
    }
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SUBDOMAIN] ${req.hostname} → subdomain: '${subdomain}', type: ${routeType}, serverId: ${req.serverId || 'N/A'}`);
  }
  
  next();
}

module.exports = subdomainRouter;
