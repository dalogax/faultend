

/**
 * Generate UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate random string
 */
function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random email
 */
function randomEmail() {
  const username = randomString(8).toLowerCase();
  return `user-${username}@example.com`;
}

/**
 * Predefined template functions
 */
const templateFunctions = {
  // Timestamp functions
  timestamp: () => new Date().toISOString(),
  timestampMs: () => Date.now(),
  
  // Random generators
  uuid: () => generateUUID(),
  random: (min, max) => {
    const minNum = parseInt(min);
    const maxNum = parseInt(max);
    return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  },
  randomFloat: (min, max, decimals = 2) => {
    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);
    const dec = parseInt(decimals);
    const value = Math.random() * (maxNum - minNum) + minNum;
    return parseFloat(value.toFixed(dec));
  },
  randomString: (length = 8) => randomString(parseInt(length)),
  randomEmail: () => randomEmail()
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Source object
 * @param {String} path - Dot-separated path (e.g., "user.name")
 * @returns {*} - Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  
  return current;
}

/**
 * Parse and execute a template function
 * @param {String} expression - Function call like "random(1, 100)"
 * @param {Object} context - Request context
 * @returns {*} - Function result
 */
function executeFunction(expression, context) {
  // Match function name and arguments: functionName(arg1, arg2, ...)
  const match = expression.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
  
  if (match) {
    const funcName = match[1];
    const argsString = match[2].trim();
    
    // Parse arguments
    const args = argsString ? argsString.split(',').map(arg => {
      const trimmed = arg.trim();
      // Remove quotes if present
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }
      // Try to parse as number
      const num = parseFloat(trimmed);
      return isNaN(num) ? trimmed : num;
    }) : [];
    
    // Execute function
    if (templateFunctions[funcName]) {
      return templateFunctions[funcName](...args);
    }
    
    throw new Error(`Unknown template function: ${funcName}`);
  }
  
  // Not a function call - try as request accessor
  return getNestedValue(context, expression);
}

/**
 * Process a single template variable
 * @param {String} variable - Variable without {{ }}
 * @param {Object} context - Request context
 * @returns {*} - Resolved value
 */
function processVariable(variable, context) {
  const trimmed = variable.trim();
  
  // Check if it's a function call (contains parentheses)
  if (trimmed.includes('(') && trimmed.includes(')')) {
    return executeFunction(trimmed, context);
  }
  
  // Otherwise, treat as request accessor
  return getNestedValue(context, trimmed);
}

/**
 * Render template string with variables
 * @param {String} str - String with {{...}} variables
 * @param {Object} context - Request context
 * @returns {String} - Rendered string
 */
function renderString(str, context) {
  if (typeof str !== 'string') return str;
  
  // Find all {{...}} patterns
  return str.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    try {
      const value = processVariable(variable, context);
      return value !== undefined ? String(value) : match;
    } catch (error) {
      console.error(`[TEMPLATE] Error processing variable ${variable}:`, error.message);
      return match; // Keep original if error
    }
  });
}

/**
 * Deep clone and render object with template variables
 * @param {*} obj - Object to render (can be nested)
 * @param {Object} context - Request context
 * @returns {*} - Rendered object
 */
function renderObject(obj, context) {
  if (obj === null || obj === undefined) return obj;
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return typeof obj === 'string' ? renderString(obj, context) : obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => renderObject(item, context));
  }
  
  // Handle objects
  const rendered = {};
  for (const [key, value] of Object.entries(obj)) {
    rendered[key] = renderObject(value, context);
  }
  return rendered;
}

/**
 * Build request context from Express request object
 * @param {Object} req - Express request
 * @returns {Object} - Context for template rendering
 */
function buildRequestContext(req) {
  return {
    request: {
      method: req.method,
      path: req.path,
      url: req.url,
      query: req.query || {},
      header: Object.keys(req.headers || {}).reduce((acc, key) => {
        acc[key.toLowerCase()] = req.headers[key];
        return acc;
      }, {}),
      body: req.body || {},
      
      // Helper methods (these are strings, can be used in templates)
      // Example: {{request.path}} will work directly
    }
  };
}

/**
 * Render template (main function)
 * @param {*} template - Template to render (object, string, or primitive)
 * @param {Object} req - Express request object
 * @returns {*} - Rendered template
 */
function renderTemplate(template, req) {
  const context = buildRequestContext(req);
  return renderObject(template, context);
}

module.exports = {
  renderTemplate,
  templateFunctions,
  // Exported for testing
  processVariable,
  renderString,
  buildRequestContext,
  getNestedValue
};
