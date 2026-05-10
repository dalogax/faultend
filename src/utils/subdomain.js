

/**
 * Extract subdomain from request
 * @param {Express.Request} req - Express request object
 * @returns {string} Subdomain (empty string if none)
 * 
 * Examples:
 * - localhost → ''
 * - app.localhost → 'app'
 * - customer1.localhost → 'customer1'
 * - acme.faultend.com → 'acme'
 */
function getSubdomain(req) {
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
  
  // Get hostname from req.hostname or parse from Host header
  let hostname = req.hostname;
  if (!hostname && req.headers.host) {
    // Remove port if present in Host header
    hostname = req.headers.host.split(':')[0];
  }
  
  if (!hostname) {
    return '';
  }
  
  // If hostname equals root domain exactly, no subdomain
  if (hostname === rootDomain) {
    return '';
  }
  
  // Extract subdomain by removing root domain suffix
  // Example: customer1.localhost.split('.') = ['customer1', 'localhost']
  //          localhost.split('.') = ['localhost']
  const hostParts = hostname.split('.');
  const rootParts = rootDomain.split('.');
  
  // Check if hostname ends with root domain
  // Compare last N parts where N = rootParts.length
  const rootLength = rootParts.length;
  const hostRootParts = hostParts.slice(-rootLength);
  
  // Verify hostname ends with root domain
  const isSubdomain = hostRootParts.join('.') === rootDomain;
  
  if (!isSubdomain) {
    // Hostname doesn't end with root domain - treat as no subdomain
    return '';
  }
  
  // Calculate subdomain parts (everything before root domain)
  const subdomainParts = hostParts.slice(0, hostParts.length - rootLength);
  
  return subdomainParts.join('.');
}

/**
 * Determine routing type based on subdomain
 * @param {string} subdomain - Subdomain extracted from request
 * @returns {'landing'|'app'|'fault-server'} Route type
 * 
 * Examples:
 * - '' → 'landing'
 * - 'app' → 'app'
 * - 'customer1' → 'fault-server'
 * - 'acme' → 'fault-server'
 */
function getRouteType(subdomain) {
  if (!subdomain || subdomain === '') {
    return 'landing';
  }
  if (subdomain === 'app') {
    return 'app';
  }
  return 'fault-server';
}

module.exports = {
  getSubdomain,
  getRouteType
};
