

// In-memory storage for multiple fault servers
// Structure: Map<serverId, { metadata, rules, traffic }>
const customers = new Map();

/**
 * Initialize customer if not exists
 * @param {string} serverId - Customer identifier
 * @returns {Object} Customer data object
 */
function ensureServer(serverId) {
  if (!customers.has(serverId)) {
    customers.set(serverId, {
      metadata: {
        id: serverId,
        createdAt: new Date().toISOString(),
        name: serverId,
        description: `Fault server for ${serverId}`
      },
      rules: [],
      traffic: []
    });
  }
  return customers.get(serverId);
}

/**
 * Get customer data
 * @param {string} serverId - Customer identifier
 * @returns {Object|undefined} Customer data or undefined if not found
 */
function getServer(serverId) {
  return customers.get(serverId);
}

/**
 * Get all customers (metadata only)
 * @returns {Array} Array of customer metadata objects
 */
function getAllServers() {
  return Array.from(customers.values()).map(c => ({
    ...c.metadata,
    rulesCount: c.rules.length,
    trafficCount: c.traffic.length
  }));
}

/**
 * Check if customer exists
 * @param {string} serverId - Customer identifier
 * @returns {boolean} True if customer exists
 */
function customerExists(serverId) {
  return customers.has(serverId);
}

/**
 * Create new customer
 * @param {string} serverId - Customer identifier (must be unique)
 * @param {Object} metadata - Optional metadata { name, description }
 * @returns {Object} Created customer data
 * @throws {Error} If customer already exists
 */
function createServer(serverId, metadata = {}) {
  // Validate serverId
  if (!serverId || typeof serverId !== 'string') {
    throw new Error('Server ID is required and must be a string');
  }
  
  // Check for valid characters (lowercase letters, numbers, hyphens)
  if (!/^[a-z0-9-]+$/.test(serverId)) {
    throw new Error('Server ID must contain only lowercase letters, numbers, and hyphens');
  }
  
  // Check if already exists
  if (customers.has(serverId)) {
    throw new Error(`Customer '${serverId}' already exists`);
  }
  
  // Create customer object
  const customer = {
    metadata: {
      id: serverId,
      createdAt: new Date().toISOString(),
      name: metadata.name || serverId,
      description: metadata.description || `Fault server for ${serverId}`
    },
    rules: [],
    traffic: []
  };
  
  customers.set(serverId, customer);
  
  console.log(`[STORAGE] Created server: ${serverId}`);
  
  return customer;
}

/**
 * Delete customer and all its data
 * @param {string} serverId - Customer identifier
 * @throws {Error} If customer not found
 */
function deleteServer(serverId) {
  if (!customers.has(serverId)) {
    throw new Error(`Customer '${serverId}' not found`);
  }
  
  const customer = customers.get(serverId);
  const rulesCount = customer.rules.length;
  const trafficCount = customer.traffic.length;
  
  customers.delete(serverId);
  
  console.log(`[STORAGE] Deleted server '${serverId}' (${rulesCount} rules, ${trafficCount} traffic logs)`);
}

/**
 * Get customer count
 * @returns {number} Total number of customers
 */
function getServerCount() {
  return customers.size;
}

/**
 * Clear all customers (for testing)
 */
function clearAllServers() {
  customers.clear();
  console.log('[STORAGE] Cleared all servers');
}

module.exports = {
  ensureServer,
  getServer,
  getAllServers,
  customerExists,
  createServer,
  deleteServer,
  getServerCount,
  clearAllServers
};
