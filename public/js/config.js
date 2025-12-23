// Configuration

/**
 * Extract base domain from hostname (remove subdomain)
 */
const getBaseDomain = () => {
  const hostname = window.location.hostname;
  
  // For localhost development (app.localhost -> localhost)
  if (hostname.endsWith('localhost')) {
    return 'localhost';
  }
  
  // For production (e.g., app.faultend.com -> faultend.com)
  // Take last 2 parts (domain.tld)
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
};

/**
 * Build a URL for a given subdomain
 * Centralized URL construction that handles protocol and port correctly
 * 
 * @param {string} subdomain - The subdomain (e.g., 'admin', 'app', or server ID)
 * @returns {string} Complete URL with protocol, subdomain, domain, and port (if applicable)
 */
export const buildSubdomainUrl = (subdomain) => {
  const protocol = window.location.protocol; // http: or https:
  const port = window.location.port;
  const baseDomain = getBaseDomain();
  
  // Include port only if present
  const portSuffix = port ? `:${port}` : '';
  
  return `${protocol}//${subdomain}.${baseDomain}${portSuffix}`;
};

export const API_BASE = {
  admin: buildSubdomainUrl('admin'),
  app: buildSubdomainUrl('app')
};

export const STORAGE_KEYS = {
  selectedServerId: 'selectedServerId'
};
