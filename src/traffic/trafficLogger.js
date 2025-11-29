/**
 * Traffic Logger Module
 * Handles capturing, storing, and querying HTTP traffic
 */

// Traffic storage
let trafficLogs = [];
let maxLogs = 1000; // Maximum number of logs to keep in memory

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
    
    // Phase 4: Include matched rule information
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
 */
function logTransaction(transactionData) {
  const transaction = new Transaction(transactionData);
  
  trafficLogs.push(transaction);
  
  // Enforce max logs limit (FIFO)
  if (trafficLogs.length > maxLogs) {
    trafficLogs.shift();
  }
  
  return transaction;
}

/**
 * Get all traffic logs
 */
function getAllLogs() {
  return trafficLogs;
}

/**
 * Get transaction by ID
 */
function getLogById(id) {
  return trafficLogs.find(log => log.id === id);
}

/**
 * Filter logs by criteria
 */
function filterLogs(criteria = {}) {
  let filtered = [...trafficLogs];
  
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
 */
function clearLogs() {
  const count = trafficLogs.length;
  trafficLogs = [];
  return count;
}

/**
 * Get statistics
 */
function getStats() {
  return {
    total: trafficLogs.length,
    byMethod: countByMethod(),
    byStatusCode: countByStatusCode(),
    errors: trafficLogs.filter(log => log.error !== null).length,
    averageDuration: calculateAverageDuration()
  };
}

function countByMethod() {
  const counts = {};
  trafficLogs.forEach(log => {
    counts[log.request.method] = (counts[log.request.method] || 0) + 1;
  });
  return counts;
}

function countByStatusCode() {
  const counts = {};
  trafficLogs.forEach(log => {
    const code = log.response.statusCode;
    counts[code] = (counts[code] || 0) + 1;
  });
  return counts;
}

function calculateAverageDuration() {
  if (trafficLogs.length === 0) return 0;
  const total = trafficLogs.reduce((sum, log) => sum + log.duration, 0);
  return Math.round(total / trafficLogs.length);
}

/**
 * Set maximum logs to keep
 */
function setMaxLogs(max) {
  maxLogs = max;
  // Trim if necessary
  if (trafficLogs.length > maxLogs) {
    trafficLogs = trafficLogs.slice(-maxLogs);
  }
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
