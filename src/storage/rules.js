const pool = require('../db/pool');
const { getServer } = require('./users');

function generateRuleId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `rule-${timestamp}-${random}`;
}

async function getAllRules(serverId) {
  const server = await getServer(serverId);
  if (!server) return [];
  
  const result = await pool.query(
    'SELECT * FROM rules WHERE server_id = $1 ORDER BY priority DESC',
    [server.id]
  );
  return result.rows.map(row => ruleFromRow(row, serverId));
}

async function getRuleById(serverId, ruleId) {
  const server = await getServer(serverId);
  if (!server) return null;
  
  const result = await pool.query(
    'SELECT * FROM rules WHERE server_id = $1 AND id = $2',
    [server.id, ruleId]
  );
  return result.rows[0] ? ruleFromRow(result.rows[0], serverId) : null;
}

async function addRule(serverId, ruleData) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  const ruleId = ruleData.id || generateRuleId();
  const name = ruleData.name || generateRuleName(ruleData.pathRegex, ruleData.action);
  
  const result = await pool.query(
    `INSERT INTO rules (id, server_id, priority, enabled, name, method, path_regex, action, target, mock_response, conditions, request_headers, transform)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      ruleId,
      server.id,
      ruleData.priority,
      ruleData.enabled !== undefined ? ruleData.enabled : true,
      name,
      ruleData.method,
      ruleData.pathRegex,
      ruleData.action,
      ruleData.target || null,
      ruleData.mockResponse ? JSON.stringify(ruleData.mockResponse) : null,
      ruleData.conditions ? JSON.stringify(ruleData.conditions) : '[]',
      ruleData.requestHeaders ? JSON.stringify(ruleData.requestHeaders) : '{}',
      ruleData.transform || null
    ]
  );
  
  return ruleFromRow(result.rows[0], serverId);
}

async function updateRule(serverId, ruleId, updates) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  const existing = await getRuleById(serverId, ruleId);
  if (!existing) throw new Error(`Rule with ID '${ruleId}' not found`);
  
  const merged = { ...existing, ...updates, id: ruleId };

  await pool.query(
    `UPDATE rules
     SET priority = $1, enabled = $2, name = $3, method = $4, path_regex = $5,
         action = $6, target = $7, mock_response = $8, conditions = $9, request_headers = $10,
         transform = $11, updated_at = NOW()
     WHERE id = $12 AND server_id = $13`,
    [
      merged.priority,
      merged.enabled,
      merged.name,
      merged.method,
      merged.pathRegex,
      merged.action,
      merged.target || null,
      merged.mockResponse ? JSON.stringify(merged.mockResponse) : null,
      merged.conditions ? JSON.stringify(merged.conditions) : '[]',
      merged.requestHeaders ? JSON.stringify(merged.requestHeaders) : '{}',
      merged.transform || null,
      ruleId,
      server.id
    ]
  );
  
  return getRuleById(serverId, ruleId);
}

async function deleteRule(serverId, ruleId) {
  const server = await getServer(serverId);
  if (!server) throw new Error(`Server '${serverId}' not found`);
  
  const result = await pool.query(
    'DELETE FROM rules WHERE id = $1 AND server_id = $2',
    [ruleId, server.id]
  );
  
  if (result.rowCount === 0) {
    throw new Error(`Rule with ID '${ruleId}' not found`);
  }
  
  return true;
}

async function toggleRule(serverId, ruleId) {
  const rule = await getRuleById(serverId, ruleId);
  if (!rule) throw new Error(`Rule with ID '${ruleId}' not found`);
  
  await pool.query(
    'UPDATE rules SET enabled = NOT enabled WHERE id = $1',
    [ruleId]
  );
  
  return getRuleById(serverId, ruleId);
}

async function importRules(serverId, rulesArray, mode = 'merge') {
  if (mode === 'replace') {
    const server = await getServer(serverId);
    if (server) {
      await pool.query('DELETE FROM rules WHERE server_id = $1', [server.id]);
    }
  }
  
  const imported = [];
  for (const ruleData of rulesArray) {
    imported.push(await addRule(serverId, ruleData));
  }
  return imported;
}

async function exportRules(serverId) {
  const rules = await getAllRules(serverId);
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    serverId,
    rules,
    count: rules.length
  };
}

async function clearRules(serverId) {
  const server = await getServer(serverId);
  if (!server) return;
  
  await pool.query('DELETE FROM rules WHERE server_id = $1', [server.id]);
}

function ruleFromRow(row, serverId) {
  const rule = {
    id: row.id,
    priority: row.priority,
    enabled: row.enabled,
    name: row.name,
    method: row.method,
    pathRegex: row.path_regex,
    action: row.action,
  };
  
  if (row.conditions) {
    rule.conditions = typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions;
  }
  if (row.request_headers) {
    rule.requestHeaders = typeof row.request_headers === 'string' ? JSON.parse(row.request_headers) : row.request_headers;
  }
  
  if (row.action === 'proxy' && row.target) {
    rule.target = row.target;
  }

  if (row.action === 'mock' && row.mock_response) {
    rule.mockResponse = typeof row.mock_response === 'string' ? JSON.parse(row.mock_response) : row.mock_response;
  }

  if (row.transform) {
    rule.transform = row.transform;
  }

  return rule;
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

module.exports = {
  getAllRules,
  getRuleById,
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  importRules,
  exportRules,
  clearRules
};
