

const { ensureServer } = require('../storage/storage');

// Traffic storage configuration
let maxLogs = 10000; // Maximum number of logs to keep in memory per customer

/**
 * Transaction data model
 */
class Transaction {
  constructor(data) {
    this.id = data.id || generateId();
    this.timestamp = data.timestamp || new Date().toISOString();
    this.request = {
      method: data.request.method,
      url: data.request.url,
      path: data.request.path,
      headers: data.request.headers || {},
      query: data.request.query || {},
      body: data.request.body || null,
      bodySize: data.request.bodySize || 0,
      contentType: data.request.contentType || null
    };
    this.response = {
      statusCode: data.response.statusCode,
      statusMessage: data.response.statusMessage,
      headers: data.response.headers || {},
      body: data.response.body || null,
      bodySize: data.response.bodySize || 0,
      contentType: data.response.contentType || null
    };
    this.duration = data.duration || 0;
    this.target = data.target;
    this.error = data.error || null;
    this.matchedRule = data.matchedRule || null;
  }
}

/**
 * Generate unique transaction ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log a new transaction
 * @param {string} serverId - Customer identifier
 * @param {Object} transactionData - Transaction data
 * @returns {Object} - Created transaction
 */
function logTransaction(serverId, transactionData) {
  const customer = ensureServer(serverId);
  const transaction = new Transaction(transactionData);
  
  customer.traffic.push(transaction);
  
  // Update lastActivity timestamp
  customer.metadata.lastActivity = transaction.timestamp;
  
  // Enforce max logs limit (FIFO)
  if (customer.traffic.length > maxLogs) {
    customer.traffic.shift();
  }
  
  return transaction;
}

/**
 * Get all traffic logs
 * @param {string} serverId - Customer identifier
 * @returns {Array} - Traffic logs array
 */
function getAllLogs(serverId) {
  const customer = ensureServer(serverId);
  return customer.traffic;
}

/**
 * Get transaction by ID
 * @param {string} serverId - Customer identifier
 * @param {string} id - Transaction ID
 * @returns {Object|undefined} - Transaction or undefined if not found
 */
function getLogById(serverId, id) {
  const customer = ensureServer(serverId);
  return customer.traffic.find(log => log.id === id);
}

/**
 * Filter logs by criteria
 * @param {string} serverId - Customer identifier
 * @param {Object} criteria - Filter criteria
 * @returns {Array} - Filtered traffic logs
 */
function filterLogs(serverId, criteria = {}) {
  const customer = ensureServer(serverId);
  let filtered = [...customer.traffic];
  
  // Filter by HTTP method
  if (criteria.method) {
    filtered = filtered.filter(log => 
      log.request.method.toUpperCase() === criteria.method.toUpperCase()
    );
  }
  
  // Filter by status code
  if (criteria.statusCode) {
    filtered = filtered.filter(log => 
      log.response.statusCode === parseInt(criteria.statusCode)
    );
  }
  
  // Filter by status code range
  if (criteria.statusCodeMin) {
    filtered = filtered.filter(log => 
      log.response.statusCode >= parseInt(criteria.statusCodeMin)
    );
  }
  if (criteria.statusCodeMax) {
    filtered = filtered.filter(log => 
      log.response.statusCode <= parseInt(criteria.statusCodeMax)
    );
  }
  
  // Filter by path (simple contains)
  if (criteria.path) {
    filtered = filtered.filter(log => 
      log.request.path.includes(criteria.path)
    );
  }
  
  // Filter by path regex
  if (criteria.pathRegex) {
    try {
      const regex = new RegExp(criteria.pathRegex);
      filtered = filtered.filter(log => regex.test(log.request.path));
    } catch (e) {
      // Invalid regex, skip filtering
    }
  }
  
  // Filter by timestamp range
  if (criteria.timestampFrom) {
    filtered = filtered.filter(log => 
      new Date(log.timestamp) >= new Date(criteria.timestampFrom)
    );
  }
  if (criteria.timestampTo) {
    filtered = filtered.filter(log => 
      new Date(log.timestamp) <= new Date(criteria.timestampTo)
    );
  }
  
  // Filter by target
  if (criteria.target) {
    filtered = filtered.filter(log => 
      log.target.includes(criteria.target)
    );
  }
  
  // Filter by has error
  if (criteria.hasError !== undefined) {
    filtered = filtered.filter(log => 
      criteria.hasError ? log.error !== null : log.error === null
    );
  }
  
  return filtered;
}

/**
 * Clear all logs
 * @param {string} serverId - Customer identifier
 * @returns {number} - Number of logs cleared
 */
function clearLogs(serverId) {
  const customer = ensureServer(serverId);
  const count = customer.traffic.length;
  customer.traffic = [];
  return count;
}

/**
 * Get statistics
 * @param {string} serverId - Customer identifier
 * @returns {Object} - Traffic statistics
 */
function getStats(serverId) {
  const customer = ensureServer(serverId);
  return {
    total: customer.traffic.length,
    byMethod: countByMethod(customer.traffic),
    byStatusCode: countByStatusCode(customer.traffic),
    errors: customer.traffic.filter(log => log.error !== null).length,
    averageDuration: calculateAverageDuration(customer.traffic)
  };
}

function countByMethod(trafficLogs) {
  const counts = {};
  trafficLogs.forEach(log => {
    counts[log.request.method] = (counts[log.request.method] || 0) + 1;
  });
  return counts;
}

function countByStatusCode(trafficLogs) {
  const counts = {};
  trafficLogs.forEach(log => {
    const code = log.response.statusCode;
    counts[code] = (counts[code] || 0) + 1;
  });
  return counts;
}

function calculateAverageDuration(trafficLogs) {
  if (trafficLogs.length === 0) return 0;
  const total = trafficLogs.reduce((sum, log) => sum + log.duration, 0);
  return Math.round(total / trafficLogs.length);
}

/**
 * Set maximum logs to keep per customer
 * @param {number} max - Maximum number of logs
 */
function setMaxLogs(max) {
  maxLogs = max;
}

module.exports = {
  Transaction,
  logTransaction,
  getAllLogs,
  getLogById,
  filterLogs,
  clearLogs,
  getStats,
  setMaxLogs
};
