const { getServer } = require('../storage/users');
const {
  getAllRules,
  getRuleById,
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  reorderRules,
  importRules,
  exportRules,
  clearRules
} = require('../storage/rules');

function generateRuleId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `rule-${timestamp}-${random}`;
}

function generateRuleName(pathRegex, action) {
  let simplified = pathRegex
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\.\*/g, '*')
    .replace(/\([^)]*\)/g, '*')
    .substring(0, 50);
  
  if (!simplified || simplified === '*') {
    simplified = 'All paths';
  }
  
  const actionLabel = action === 'mock' ? 'Mock' : 'Proxy';
  return `${actionLabel}: ${simplified}`;
}

function validateRule(ruleData) {
  const errors = [];

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
    try {
      new RegExp(ruleData.pathRegex);
    } catch (e) {
      errors.push(`pathRegex is not a valid regular expression: ${e.message}`);
    }
  }

  if (!['mock', 'proxy'].includes(ruleData.action)) {
    errors.push('action must be either "mock" or "proxy"');
  }

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
        if (!['exists', 'notExists'].includes(condition.operator) && condition.value === undefined) {
          errors.push(`conditions[${index}].value is required for operator "${condition.operator}"`);
        }
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

  if (ruleData.latency !== undefined) {
    if (typeof ruleData.latency === 'number') {
      if (ruleData.latency < 0) {
        errors.push('latency must be a non-negative number');
      }
    } else if (typeof ruleData.latency === 'object') {
      const { type, value, min, max } = ruleData.latency;
      if (!['fixed', 'range'].includes(type)) {
        errors.push('latency.type must be "fixed" or "range"');
      }
      if (type === 'fixed' && (typeof value !== 'number' || value < 0)) {
        errors.push('latency.value must be a non-negative number for fixed type');
      }
      if (type === 'range') {
        if (typeof min !== 'number' || min < 0) {
          errors.push('latency.min must be a non-negative number for range type');
        }
        if (typeof max !== 'number' || max < 0) {
          errors.push('latency.max must be a non-negative number for range type');
        }
        if (typeof min === 'number' && typeof max === 'number' && min > max) {
          errors.push('latency.min must be less than or equal to max');
        }
      }
    } else {
      errors.push('latency must be a number or object');
    }
  }

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

  if (ruleData.transform !== undefined && ruleData.transform !== null) {
    if (typeof ruleData.transform !== 'string') {
      errors.push('transform must be a string containing JavaScript code');
    } else {
      try {
        const vm = require('vm');
        new vm.Script(ruleData.transform);
      } catch (e) {
        errors.push(`transform is not valid JavaScript: ${e.message}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Rule validation failed:\n- ${errors.join('\n- ')}`);
  }
}

function getConditionValue(request, condition) {
  const { type, key, path } = condition;
  
  switch (type) {
    case 'header':
      return request.req.headers[key.toLowerCase()];
    case 'query':
      return request.req.query[key];
    case 'body':
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

function matchesConditions(conditions, request) {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  
  for (const condition of conditions) {
    if (!evaluateCondition(condition, request)) {
      return false;
    }
  }
  
  return true;
}

async function findMatchingRule(serverId, request) {
  const rules = await getAllRules(serverId);
  if (!rules || rules.length === 0) {
    return null;
  }
  
  for (const rule of rules) {
    if (!rule.enabled) {
      continue;
    }

    const methodMatches = rule.method === '*' || rule.method === request.method;
    if (!methodMatches) {
      continue;
    }

    try {
      const regex = new RegExp(rule.pathRegex);
      const pathMatches = regex.test(request.path);
      
      if (pathMatches) {
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

async function executeMockRule(serverId, rule, req, res) {
  const { statusCode, body, headers, latency } = rule.mockResponse;

  const startTime = Date.now();

  const { renderTemplate } = require('./templateEngine');
  const renderedBody = renderTemplate(body, req);

  // Build mutable response object for transform
  let responseObj = {
    status: statusCode,
    headers: headers ? { ...headers } : {},
    body: renderedBody
  };

  // Apply transform (runs after mock but before latency)
  if (rule.transform) {
    const { runTransform } = require('./transformEngine');
    try {
      responseObj = runTransform(rule.transform, responseObj);
      console.log(`[MOCK] Transform applied for rule: ${rule.name}`);
    } catch (e) {
      console.error(`[MOCK] Transform error in rule ${rule.name}:`, e.message);
    }
  }

  let actualLatency = 0;
  if (latency) {
    if (typeof latency === 'number') {
      actualLatency = latency;
    } else if (typeof latency === 'object') {
      if (latency.type === 'fixed') {
        actualLatency = latency.value;
      } else if (latency.type === 'range') {
        actualLatency = Math.floor(Math.random() * (latency.max - latency.min + 1)) + latency.min;
      }
    }
  } else if (req.serverConfig?.defaultLatencyMs) {
    actualLatency = req.serverConfig.defaultLatencyMs;
  }

  console.log(`[MOCK] Executing mock rule: ${rule.name} (${responseObj.status}, latency: ${actualLatency}ms)`);

  if (actualLatency > 0) {
    await new Promise(resolve => setTimeout(resolve, actualLatency));
  }

  if (responseObj.headers) {
    Object.entries(responseObj.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.status(responseObj.status).json(responseObj.body);

  const { logTransaction } = require('../storage/traffic');

  const duration = Date.now() - startTime;

  if (req.serverConfig?.recordingEnabled === false) return;

  await logTransaction(serverId, {
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
      statusCode: responseObj.status,
      statusMessage: res.statusMessage,
      headers: responseObj.headers || {},
      body: responseObj.body,
      bodySize: Buffer.byteLength(JSON.stringify(responseObj.body)),
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

function computeLatencyMs(latency) {
  if (!latency) return 0;
  if (typeof latency === 'number') return latency;
  if (latency.type === 'fixed') return latency.value || 0;
  if (latency.type === 'range') {
    return Math.floor(Math.random() * (latency.max - latency.min + 1)) + latency.min;
  }
  return 0;
}

async function executeProxyRule(serverId, rule, req, res, next) {
  console.log(`[PROXY RULE] Executing proxy rule: ${rule.name} → ${rule.target}`);

  let delay = computeLatencyMs(rule.latency);
  if (!rule.latency && req.serverConfig?.defaultLatencyMs) {
    delay = req.serverConfig.defaultLatencyMs;
  }
  if (delay > 0) {
    console.log(`[PROXY RULE] Applying latency: ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const { executeProxy, executeProxyWithTransform } = require('../proxy/proxyHandler');

  req.serverId = serverId;
  req.matchedRule = {
    id: rule.id,
    name: rule.name,
    action: rule.action,
    priority: rule.priority,
    ...(rule.modifyRequestHeaders && { modifyRequestHeaders: rule.modifyRequestHeaders })
  };

  if (rule.transform) {
    const { runTransform } = require('./transformEngine');
    executeProxyWithTransform(rule.target, req, res, next, runTransform, rule.transform);
  } else {
    executeProxy(rule.target, req, res, next);
  }
}

async function executeRule(serverId, rule, req, res, next) {
  if (rule.action === 'mock') {
    await executeMockRule(serverId, rule, req, res);
  } else if (rule.action === 'proxy') {
    await executeProxyRule(serverId, rule, req, res, next);
  } else {
    console.error(`[RULES ENGINE] Unknown action: ${rule.action}`);
    res.status(500).json({ error: 'Internal Server Error', message: 'Unknown rule action' });
  }
}

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
  reorderRules,
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
