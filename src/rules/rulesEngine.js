/**
 * Rules Engine - Phase 4
 * Manages routing rules for proxy and mock actions
 */

// In-memory rules storage (sorted by priority, high to low)
let rules = [];

/**
 * Generate unique rule ID
 */
function generateRuleId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `rule-${timestamp}-${random}`;
}

/**
 * Validate rule data
 * @param {Object} ruleData - Rule definition to validate
 * @throws {Error} If validation fails
 */
function validateRule(ruleData) {
  const errors = [];

  // Required fields
  if (!ruleData.name || typeof ruleData.name !== 'string') {
    errors.push('name is required and must be a string');
  } else if (ruleData.name.length > 100) {
    errors.push('name must be 100 characters or less');
  }

  if (typeof ruleData.priority !== 'number' || !Number.isInteger(ruleData.priority)) {
    errors.push('priority is required and must be an integer');
  }

  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', '*'].includes(ruleData.method)) {
    errors.push('method must be one of: GET, POST, PUT, PATCH, DELETE, *');
  }

  if (!ruleData.pathRegex || typeof ruleData.pathRegex !== 'string') {
    errors.push('pathRegex is required and must be a string');
  } else {
    // Validate regex syntax
    try {
      new RegExp(ruleData.pathRegex);
    } catch (e) {
      errors.push(`pathRegex is not a valid regular expression: ${e.message}`);
    }
  }

  if (!['mock', 'proxy'].includes(ruleData.action)) {
    errors.push('action must be either "mock" or "proxy"');
  }

  // Action-specific validation
  if (ruleData.action === 'proxy') {
    if (!ruleData.target || typeof ruleData.target !== 'string') {
      errors.push('target is required for proxy action and must be a non-empty string');
    }
  }

  if (ruleData.action === 'mock') {
    if (!ruleData.mockResponse || typeof ruleData.mockResponse !== 'object') {
      errors.push('mockResponse is required for mock action');
    } else {
      if (typeof ruleData.mockResponse.statusCode !== 'number') {
        errors.push('mockResponse.statusCode is required and must be a number');
      }
      if (ruleData.mockResponse.body === undefined) {
        errors.push('mockResponse.body is required');
      }
      if (ruleData.mockResponse.latency !== undefined) {
        if (typeof ruleData.mockResponse.latency !== 'number' || ruleData.mockResponse.latency < 0) {
          errors.push('mockResponse.latency must be a non-negative number');
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Rule validation failed:\n- ${errors.join('\n- ')}`);
  }
}

/**
 * Add a new rule
 * @param {Object} ruleData - Rule definition
 * @returns {Object} - Created rule with generated ID
 */
function addRule(ruleData) {
  // Validate rule
  validateRule(ruleData);

  // Create rule with defaults
  const rule = {
    id: ruleData.id || generateRuleId(),
    priority: ruleData.priority,
    enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
    name: ruleData.name,
    method: ruleData.method,
    pathRegex: ruleData.pathRegex,
    action: ruleData.action,
    ...(ruleData.action === 'proxy' && { target: ruleData.target }),
    ...(ruleData.action === 'mock' && { 
      mockResponse: {
        statusCode: ruleData.mockResponse.statusCode,
        body: ruleData.mockResponse.body,
        headers: ruleData.mockResponse.headers || {},
        latency: ruleData.mockResponse.latency || 0
      }
    })
  };

  // Add to rules array
  rules.push(rule);

  // Sort by priority (high to low)
  rules.sort((a, b) => b.priority - a.priority);

  return rule;
}

/**
 * Get all rules sorted by priority
 * @returns {Array} - Rules array
 */
function getAllRules() {
  return [...rules];
}

/**
 * Get rule by ID
 * @param {String} id - Rule ID
 * @returns {Object|null} - Rule or null if not found
 */
function getRuleById(id) {
  return rules.find(r => r.id === id) || null;
}

/**
 * Update an existing rule
 * @param {String} id - Rule ID
 * @param {Object} updates - Updated rule data
 * @returns {Object} - Updated rule
 * @throws {Error} - If rule not found or validation fails
 */
function updateRule(id, updates) {
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  // Merge updates with existing rule
  const updatedRule = { ...rules[index], ...updates, id };

  // Validate updated rule
  validateRule(updatedRule);

  // Update in array
  rules[index] = updatedRule;

  // Re-sort by priority
  rules.sort((a, b) => b.priority - a.priority);

  return updatedRule;
}

/**
 * Delete a rule
 * @param {String} id - Rule ID
 * @returns {Boolean} - True if deleted
 * @throws {Error} - If rule not found
 */
function deleteRule(id) {
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  rules.splice(index, 1);
  return true;
}

/**
 * Toggle rule enabled state
 * @param {String} id - Rule ID
 * @returns {Object} - Updated rule
 * @throws {Error} - If rule not found
 */
function toggleRule(id) {
  const rule = getRuleById(id);
  if (!rule) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  rule.enabled = !rule.enabled;
  return rule;
}

/**
 * Import rules from array
 * @param {Array} rulesArray - Array of rule definitions
 * @param {String} mode - "merge" or "replace"
 * @returns {Array} - Imported rules with generated IDs
 */
function importRules(rulesArray, mode = 'merge') {
  if (!Array.isArray(rulesArray)) {
    throw new Error('Invalid import data: rules array is required');
  }

  // Validate all rules first
  rulesArray.forEach((rule, index) => {
    try {
      validateRule(rule);
    } catch (error) {
      throw new Error(`Validation failed for rule at index ${index}: ${error.message}`);
    }
  });

  // Clear existing rules if replace mode
  if (mode === 'replace') {
    rules = [];
  }

  // Import rules
  const importedRules = rulesArray.map(ruleData => addRule(ruleData));

  return importedRules;
}

/**
 * Export all rules
 * @returns {Object} - Export data with metadata
 */
function exportRules() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    rules: getAllRules(),
    count: rules.length
  };
}

/**
 * Clear all rules (for testing)
 */
function clearRules() {
  rules = [];
}

/**
 * Find the first matching rule for a request
 * @param {Object} request - { method, path }
 * @returns {Object|null} - Matching rule or null
 */
function findMatchingRule(request) {
  // Iterate through rules in priority order (already sorted)
  for (const rule of rules) {
    // Skip disabled rules
    if (!rule.enabled) {
      continue;
    }

    // Check method match
    const methodMatches = rule.method === '*' || rule.method === request.method;
    if (!methodMatches) {
      continue;
    }

    // Check path regex match
    try {
      const regex = new RegExp(rule.pathRegex);
      const pathMatches = regex.test(request.path);
      
      if (pathMatches) {
        console.log(`[RULES ENGINE] Matched rule: ${rule.name} (priority: ${rule.priority}, action: ${rule.action})`);
        return rule;
      }
    } catch (e) {
      console.error(`[RULES ENGINE] Invalid regex in rule ${rule.id}:`, e.message);
      continue;
    }
  }

  console.log(`[RULES ENGINE] No matching rule found for ${request.method} ${request.path}`);
  return null;
}

/**
 * Execute a mock rule
 * @param {Object} rule - The mock rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function executeMockRule(rule, req, res) {
  const { statusCode, body, headers, latency } = rule.mockResponse;

  console.log(`[MOCK] Executing mock rule: ${rule.name} (${statusCode}, latency: ${latency}ms)`);

  const startTime = Date.now();

  // Apply artificial latency if specified
  if (latency > 0) {
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  // Set custom headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  // Send response
  res.status(statusCode).json(body);

  // Log the mock transaction
  const { logTransaction } = require('../traffic/trafficLogger');
  
  const duration = Date.now() - startTime;
  
  logTransaction({
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: req.headers,
      query: req.query,
      body: req.rawBody || req.body || null,
      bodySize: req.rawBodySize || (req.body ? Buffer.byteLength(JSON.stringify(req.body)) : 0),
      contentType: req.headers['content-type'] || null
    },
    response: {
      statusCode: statusCode,
      statusMessage: res.statusMessage,
      headers: headers || {},
      body: body,
      bodySize: Buffer.byteLength(JSON.stringify(body)),
      contentType: 'application/json'
    },
    duration: duration,
    target: 'MOCK',
    matchedRule: {
      id: rule.id,
      name: rule.name,
      action: rule.action,
      priority: rule.priority
    }
  });
}

/**
 * Execute a proxy rule
 * @param {Object} rule - The proxy rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function executeProxyRule(rule, req, res, next) {
  console.log(`[PROXY RULE] Executing proxy rule: ${rule.name} → ${rule.target}`);
  
  // Import here to avoid circular dependency
  const { executeProxy } = require('../proxy/proxyHandler');
  
  // Store rule info for logging
  req.matchedRule = {
    id: rule.id,
    name: rule.name,
    action: rule.action,
    priority: rule.priority
  };
  
  // Execute proxy with rule's target
  executeProxy(rule.target, req, res, next);
}

/**
 * Execute a rule - either mock or proxy
 * @param {Object} rule - The matched rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function executeRule(rule, req, res, next) {
  if (rule.action === 'mock') {
    await executeMockRule(rule, req, res);
  } else if (rule.action === 'proxy') {
    executeProxyRule(rule, req, res, next);
  } else {
    console.error(`[RULES ENGINE] Unknown action: ${rule.action}`);
    res.status(500).json({ error: 'Internal Server Error', message: 'Unknown rule action' });
  }
}

/**
 * Get default catch-all proxy rule
 * @param {String} target - Target backend URL
 * @returns {Object} - Default rule
 */
function getDefaultProxyRule(target) {
  return {
    priority: 0,
    enabled: true,
    name: 'Default Catch-All Proxy',
    method: '*',
    pathRegex: '.*',
    action: 'proxy',
    target: target
  };
}

module.exports = {
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  getAllRules,
  getRuleById,
  clearRules,
  findMatchingRule,
  executeRule,
  getDefaultProxyRule,
  validateRule,
  importRules,
  exportRules
};
