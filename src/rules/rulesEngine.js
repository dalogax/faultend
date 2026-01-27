

const { getServer, ensureServer } = require('../storage/storage');

/**
 * Generate unique rule ID
 */
function generateRuleId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `rule-${timestamp}-${random}`;
}

/**
 * Generate a rule name from path regex
 * @param {string} pathRegex - The path regex pattern
 * @param {string} action - The rule action (mock/proxy)
 * @returns {string} Generated name
 */
function generateRuleName(pathRegex, action) {
  // Simplify regex for display
  let simplified = pathRegex
    .replace(/^\^/, '')    // Remove start anchor
    .replace(/\$$/, '')    // Remove end anchor
    .replace(/\.\*/g, '*') // Replace .* with *
    .replace(/\([^)]*\)/g, '*') // Replace groups with *
    .substring(0, 50);     // Limit length
  
  if (!simplified || simplified === '*') {
    simplified = 'All paths';
  }
  
  const actionLabel = action === 'mock' ? 'Mock' : 'Proxy';
  return `${actionLabel}: ${simplified}`;
}

/**
 * Validate rule data
 * @param {Object} ruleData - Rule definition to validate
 * @throws {Error} If validation fails
 */
function validateRule(ruleData) {
  const errors = [];

  // Name is optional - auto-generate if not provided
  if (ruleData.name !== undefined && typeof ruleData.name !== 'string') {
    errors.push('name must be a string if provided');
  } else if (ruleData.name && ruleData.name.length > 100) {
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

  // Phase 6: Validate conditions array
  if (ruleData.conditions !== undefined) {
    if (!Array.isArray(ruleData.conditions)) {
      errors.push('conditions must be an array');
    } else {
      ruleData.conditions.forEach((condition, index) => {
        if (!condition.type || !['header', 'query', 'body', 'cookie'].includes(condition.type)) {
          errors.push(`conditions[${index}].type must be one of: header, query, body, cookie`);
        }
        if (!condition.key || typeof condition.key !== 'string') {
          errors.push(`conditions[${index}].key is required and must be a string`);
        }
        if (!condition.operator || !['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'exists', 'notExists', 'matches'].includes(condition.operator)) {
          errors.push(`conditions[${index}].operator must be one of: equals, notEquals, contains, startsWith, endsWith, exists, notExists, matches`);
        }
        // Value required for all operators except exists/notExists
        if (!['exists', 'notExists'].includes(condition.operator) && condition.value === undefined) {
          errors.push(`conditions[${index}].value is required for operator "${condition.operator}"`);
        }
        // Validate regex for matches operator
        if (condition.operator === 'matches' && condition.value) {
          try {
            new RegExp(condition.value);
          } catch (e) {
            errors.push(`conditions[${index}].value is not a valid regex: ${e.message}`);
          }
        }
      });
    }
  }

  // Action-specific validation
  if (ruleData.action === 'proxy') {
    if (!ruleData.target || typeof ruleData.target !== 'string') {
      errors.push('target is required for proxy action and must be a non-empty string');
    }
    
    if (ruleData.modifyRequestHeaders !== undefined) {
      if (typeof ruleData.modifyRequestHeaders !== 'object') {
        errors.push('modifyRequestHeaders must be an object');
      } else {
        const { add, set, remove } = ruleData.modifyRequestHeaders;
        if (add !== undefined && typeof add !== 'object') {
          errors.push('modifyRequestHeaders.add must be an object');
        }
        if (set !== undefined && typeof set !== 'object') {
          errors.push('modifyRequestHeaders.set must be an object');
        }
        if (remove !== undefined && !Array.isArray(remove)) {
          errors.push('modifyRequestHeaders.remove must be an array');
        }
      }
    }
  }
  
  if (ruleData.action === 'mock' && ruleData.modifyRequestHeaders !== undefined) {
    errors.push('modifyRequestHeaders is only allowed for proxy rules');
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
        if (typeof ruleData.mockResponse.latency === 'number') {
          if (ruleData.mockResponse.latency < 0) {
            errors.push('mockResponse.latency must be a non-negative number');
          }
        } else if (typeof ruleData.mockResponse.latency === 'object') {
          const { type, value, min, max } = ruleData.mockResponse.latency;
          if (!['fixed', 'range'].includes(type)) {
            errors.push('mockResponse.latency.type must be "fixed" or "range"');
          }
          if (type === 'fixed' && (typeof value !== 'number' || value < 0)) {
            errors.push('mockResponse.latency.value must be a non-negative number for fixed type');
          }
          if (type === 'range') {
            if (typeof min !== 'number' || min < 0) {
              errors.push('mockResponse.latency.min must be a non-negative number for range type');
            }
            if (typeof max !== 'number' || max < 0) {
              errors.push('mockResponse.latency.max must be a non-negative number for range type');
            }
            if (typeof min === 'number' && typeof max === 'number' && min > max) {
              errors.push('mockResponse.latency.min must be less than or equal to max');
            }
          }
        } else {
          errors.push('mockResponse.latency must be a number or object');
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
 * @param {string} serverId - Customer identifier
 * @param {Object} ruleData - Rule definition
 * @returns {Object} - Created rule with generated ID
 */
function addRule(serverId, ruleData) {
  const customer = ensureServer(serverId);
  
  // Validate rule
  validateRule(ruleData);

  // Auto-generate name if not provided
  const name = ruleData.name || generateRuleName(ruleData.pathRegex, ruleData.action);

  // Create rule with defaults
  const rule = {
    id: ruleData.id || generateRuleId(),
    priority: ruleData.priority,
    enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
    name: name,
    method: ruleData.method,
    pathRegex: ruleData.pathRegex,
    action: ruleData.action,
    ...(ruleData.conditions && { conditions: ruleData.conditions }),
    ...(ruleData.action === 'proxy' && { 
      target: ruleData.target,
      ...(ruleData.modifyRequestHeaders && { modifyRequestHeaders: ruleData.modifyRequestHeaders })
    }),
    ...(ruleData.action === 'mock' && { 
      mockResponse: {
        statusCode: ruleData.mockResponse.statusCode,
        body: ruleData.mockResponse.body,
        headers: ruleData.mockResponse.headers || {},
        latency: ruleData.mockResponse.latency || 0
      }
    })
  };

  // Add to customer's rules array
  customer.rules.push(rule);

  // Sort by priority (high to low)
  customer.rules.sort((a, b) => b.priority - a.priority);

  return rule;
}

/**
 * Get all rules sorted by priority
 * @param {string} serverId - Customer identifier
 * @returns {Array} - Rules array
 */
function getAllRules(serverId) {
  const customer = ensureServer(serverId);
  return [...customer.rules];
}

/**
 * Get rule by ID
 * @param {string} serverId - Customer identifier
 * @param {String} id - Rule ID
 * @returns {Object|null} - Rule or null if not found
 */
function getRuleById(serverId, id) {
  const customer = ensureServer(serverId);
  return customer.rules.find(r => r.id === id) || null;
}

/**
 * Update an existing rule
 * @param {string} serverId - Customer identifier
 * @param {String} id - Rule ID
 * @param {Object} updates - Updated rule data
 * @returns {Object} - Updated rule
 * @throws {Error} - If rule not found or validation fails
 */
function updateRule(serverId, id, updates) {
  const customer = ensureServer(serverId);
  const index = customer.rules.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  // Merge updates with existing rule
  const updatedRule = { ...customer.rules[index], ...updates, id };

  // Validate updated rule
  validateRule(updatedRule);

  // Update in array
  customer.rules[index] = updatedRule;

  // Re-sort by priority
  customer.rules.sort((a, b) => b.priority - a.priority);

  return updatedRule;
}

/**
 * Delete a rule
 * @param {string} serverId - Customer identifier
 * @param {String} id - Rule ID
 * @returns {Boolean} - True if deleted
 * @throws {Error} - If rule not found
 */
function deleteRule(serverId, id) {
  const customer = ensureServer(serverId);
  const index = customer.rules.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  customer.rules.splice(index, 1);
  return true;
}

/**
 * Toggle rule enabled state
 * @param {string} serverId - Customer identifier
 * @param {String} id - Rule ID
 * @returns {Object} - Updated rule
 * @throws {Error} - If rule not found
 */
function toggleRule(serverId, id) {
  const rule = getRuleById(serverId, id);
  if (!rule) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  rule.enabled = !rule.enabled;
  return rule;
}

/**
 * Import rules from array
 * @param {string} serverId - Customer identifier
 * @param {Array} rulesArray - Array of rule definitions
 * @param {String} mode - "merge" or "replace"
 * @returns {Array} - Imported rules with generated IDs
 */
function importRules(serverId, rulesArray, mode = 'merge') {
  const customer = ensureServer(serverId);
  
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
    customer.rules = [];
  }

  // Import rules
  const importedRules = rulesArray.map(ruleData => addRule(serverId, ruleData));

  return importedRules;
}

/**
 * Export all rules
 * @param {string} serverId - Customer identifier
 * @returns {Object} - Export data with metadata
 */
function exportRules(serverId) {
  const customer = ensureServer(serverId);
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    serverId: serverId,
    rules: getAllRules(serverId),
    count: customer.rules.length
  };
}

/**
 * Clear all rules (for testing)
 * @param {string} serverId - Customer identifier
 */
function clearRules(serverId) {
  const customer = ensureServer(serverId);
  customer.rules = [];
}

/**
 * Phase 6: Get value from request based on condition type
 * @param {Object} request - Request object with req field
 * @param {Object} condition - Condition definition
 * @returns {*} - Value from request or undefined
 */
function getConditionValue(request, condition) {
  const { type, key, path } = condition;
  
  switch (type) {
    case 'header':
      return request.req.headers[key.toLowerCase()];
    case 'query':
      return request.req.query[key];
    case 'body':
      // Support nested paths with dot notation
      if (path) {
        const keys = path.split('.');
        let value = request.req.body;
        for (const k of keys) {
          if (value === null || value === undefined) return undefined;
          value = value[k];
        }
        return value;
      }
      return request.req.body[key];
    case 'cookie':
      // Parse cookies if available
      const cookieHeader = request.req.headers.cookie;
      if (!cookieHeader) return undefined;
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      return cookies[key];
    default:
      return undefined;
  }
}

/**
 * Phase 6: Evaluate a single condition
 * @param {Object} condition - Condition definition
 * @param {Object} request - Request object with req field
 * @returns {Boolean} - True if condition matches
 */
function evaluateCondition(condition, request) {
  const { operator, value: expectedValue } = condition;
  const actualValue = getConditionValue(request, condition);
  
  switch (operator) {
    case 'exists':
      return actualValue !== undefined && actualValue !== null;
    case 'notExists':
      return actualValue === undefined || actualValue === null;
    case 'equals':
      return actualValue === expectedValue;
    case 'notEquals':
      return actualValue !== expectedValue;
    case 'contains':
      return actualValue && String(actualValue).includes(String(expectedValue));
    case 'startsWith':
      return actualValue && String(actualValue).startsWith(String(expectedValue));
    case 'endsWith':
      return actualValue && String(actualValue).endsWith(String(expectedValue));
    case 'matches':
      try {
        const regex = new RegExp(expectedValue);
        return actualValue && regex.test(String(actualValue));
      } catch (e) {
        console.error(`[CONDITION] Invalid regex in condition: ${e.message}`);
        return false;
      }
    default:
      return false;
  }
}

/**
 * Phase 6: Check if all conditions match (AND logic)
 * @param {Array} conditions - Array of conditions
 * @param {Object} request - Request object with req field
 * @returns {Boolean} - True if all conditions match
 */
function matchesConditions(conditions, request) {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always match
  }
  
  for (const condition of conditions) {
    if (!evaluateCondition(condition, request)) {
      return false; // One failed condition = rule doesn't match
    }
  }
  
  return true; // All conditions matched
}

/**
 * Find the first matching rule for a request
 * @param {string} serverId - Customer identifier
 * @param {Object} request - { method, path, req } (req = Express request object)
 * @returns {Object|null} - Matching rule or null
 */
function findMatchingRule(serverId, request) {
  const customer = getServer(serverId);
  if (!customer) {
    return null; // Server doesn't exist
  }
  
  // Iterate through rules in priority order (already sorted)
  for (const rule of customer.rules) {
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
        // Phase 6: Check conditions if present
        if (rule.conditions && !matchesConditions(rule.conditions, request)) {
          console.log(`[RULES ENGINE] Rule ${rule.name} matched path but failed conditions`);
          continue;
        }
        
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
 * @param {string} serverId - Customer identifier
 * @param {Object} rule - The mock rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function executeMockRule(serverId, rule, req, res) {
  const { statusCode, body, headers, latency } = rule.mockResponse;

  const startTime = Date.now();

  // Phase 6: Calculate actual latency (enhanced - supports fixed/range)
  let actualLatency = 0;
  if (latency) {
    if (typeof latency === 'number') {
      // Backward compatible: number = fixed latency
      actualLatency = latency;
    } else if (typeof latency === 'object') {
      if (latency.type === 'fixed') {
        actualLatency = latency.value;
      } else if (latency.type === 'range') {
        // Random value between min and max
        actualLatency = Math.floor(Math.random() * (latency.max - latency.min + 1)) + latency.min;
      }
    }
  }

  console.log(`[MOCK] Executing mock rule: ${rule.name} (${statusCode}, latency: ${actualLatency}ms)`);

  // Apply artificial latency if specified
  if (actualLatency > 0) {
    await new Promise(resolve => setTimeout(resolve, actualLatency));
  }

  // Phase 6: Render template variables in response body
  const { renderTemplate } = require('./templateEngine');
  const renderedBody = renderTemplate(body, req);

  // Set custom headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  // Send response with rendered body
  res.status(statusCode).json(renderedBody);

  // Log the mock transaction
  const { logTransaction } = require('../traffic/trafficLogger');
  
  const duration = Date.now() - startTime;
  
  logTransaction(serverId, {
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
      body: renderedBody,
      bodySize: Buffer.byteLength(JSON.stringify(renderedBody)),
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
 * @param {string} serverId - Customer identifier
 * @param {Object} rule - The proxy rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function executeProxyRule(serverId, rule, req, res, next) {
  console.log(`[PROXY RULE] Executing proxy rule: ${rule.name} → ${rule.target}`);
  
  // Import here to avoid circular dependency
  const { executeProxy } = require('../proxy/proxyHandler');
  
  // Phase 6.1: Store serverId and rule info
  req.serverId = serverId;
  req.matchedRule = {
    id: rule.id,
    name: rule.name,
    action: rule.action,
    priority: rule.priority,
    // Include header modifications if present
    ...(rule.modifyRequestHeaders && { modifyRequestHeaders: rule.modifyRequestHeaders })
  };
  
  // Execute proxy with rule's target
  executeProxy(rule.target, req, res, next);
}

/**
 * Execute a rule - either mock or proxy
 * @param {string} serverId - Customer identifier
 * @param {Object} rule - The matched rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function executeRule(serverId, rule, req, res, next) {
  if (rule.action === 'mock') {
    await executeMockRule(serverId, rule, req, res);
  } else if (rule.action === 'proxy') {
    executeProxyRule(serverId, rule, req, res, next);
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
