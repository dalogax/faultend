// Configuration

// Extract base domain from hostname (remove subdomain)
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

const port = window.location.port || 3000;
const baseDomain = getBaseDomain();

export const API_BASE = {
  admin: `http://admin.${baseDomain}:${port}`,
  app: `http://app.${baseDomain}:${port}`
};

export const STORAGE_KEYS = {
  selectedServerId: 'selectedServerId'
};
