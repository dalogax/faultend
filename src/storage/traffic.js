const pool = require('../db/pool');
const { getServer } = require('./users');

const MAX_LOGS = 1000;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function logTransaction(serverId, transactionData) {
  const server = await getServer(serverId);
  if (!server) {
    console.log(`[TRAFFIC] Cannot log transaction - server '${serverId}' does not exist`);
    return null;
  }
  
  const requestId = transactionData.id || generateId();
  
  await pool.query(
    `INSERT INTO traffic (server_id, request_id, request, response, duration, target, matched_rule_id, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      server.id,
      requestId,
      JSON.stringify(transactionData.request),
      transactionData.response ? JSON.stringify(transactionData.response) : null,
      transactionData.duration || 0,
      transactionData.target || null,
      transactionData.matchedRule?.id || null,
      transactionData.error || null
    ]
  );
  
  await enforceMaxLogs(server.id);
  
  return { id: requestId, ...transactionData };
}

async function enforceMaxLogs(serverInternalId) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM traffic WHERE server_id = $1',
    [serverInternalId]
  );
  
  const count = parseInt(result.rows[0].count, 10);
  if (count > MAX_LOGS) {
    const toDelete = count - MAX_LOGS;
    await pool.query(
      `DELETE FROM traffic WHERE id IN (
        SELECT id FROM traffic WHERE server_id = $1 ORDER BY timestamp ASC LIMIT $2
      )`,
      [serverInternalId, toDelete]
    );
  }
}

async function getAllLogs(serverId) {
  const server = await getServer(serverId);
  if (!server) return [];
  
  const result = await pool.query(
    'SELECT * FROM traffic WHERE server_id = $1 ORDER BY timestamp DESC',
    [server.id]
  );
  return result.rows.map(row => logFromRow(row));
}

async function getLogById(serverId, id) {
  const server = await getServer(serverId);
  if (!server) return null;
  
  const result = await pool.query(
    'SELECT * FROM traffic WHERE server_id = $1 AND request_id = $2',
    [server.id, id]
  );
  return result.rows[0] ? logFromRow(result.rows[0]) : null;
}

async function filterLogs(serverId, criteria = {}) {
  let query = 'SELECT * FROM traffic WHERE server_id = $1';
  const params = [serverId];
  let paramIndex = 2;
  
  const server = await getServer(serverId);
  if (!server) return [];
  params[0] = server.id;
  
  if (criteria.method) {
    query += ` AND request->>'method' = $${paramIndex++}`;
    params.push(criteria.method.toUpperCase());
  }
  
  if (criteria.statusCode) {
    query += ` AND response->>'statusCode' = $${paramIndex++}`;
    params.push(String(criteria.statusCode));
  }
  
  if (criteria.path) {
    query += ` AND request->>'path' ILIKE $${paramIndex++}`;
    params.push(`%${criteria.path}%`);
  }
  
  query += ' ORDER BY timestamp DESC';
  
  if (criteria.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(parseInt(criteria.limit, 10));
  }
  
  const result = await pool.query(query, params);
  return result.rows.map(row => logFromRow(row));
}

async function clearLogs(serverId) {
  const server = await getServer(serverId);
  if (!server) return 0;
  
  const result = await pool.query(
    'DELETE FROM traffic WHERE server_id = $1',
    [server.id]
  );
  return result.rowCount;
}

async function getStats(serverId) {
  const server = await getServer(serverId);
  if (!server) {
    return { total: 0, byMethod: {}, byStatusCode: {}, errors: 0, averageDuration: 0 };
  }
  
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE error IS NOT NULL) as errors,
      COALESCE(AVG(duration), 0) as average_duration
     FROM traffic WHERE server_id = $1`,
    [server.id]
  );
  
  const methodsResult = await pool.query(
    `SELECT request->>'method' as method, COUNT(*) as count
     FROM traffic WHERE server_id = $1 GROUP BY request->>'method'`,
    [server.id]
  );
  
  const statusResult = await pool.query(
    `SELECT response->>'statusCode' as status, COUNT(*) as count
     FROM traffic WHERE server_id = $1 GROUP BY response->>'statusCode'`,
    [server.id]
  );
  
  const byMethod = {};
  methodsResult.rows.forEach(row => {
    byMethod[row.method] = parseInt(row.count, 10);
  });
  
  const byStatusCode = {};
  statusResult.rows.forEach(row => {
    byStatusCode[row.status] = parseInt(row.count, 10);
  });
  
  return {
    total: parseInt(result.rows[0].total, 10),
    byMethod,
    byStatusCode,
    errors: parseInt(result.rows[0].errors, 10),
    averageDuration: Math.round(parseFloat(result.rows[0].average_duration))
  };
}

async function getLiveStats(serverId) {
  const server = await getServer(serverId);
  if (!server) return { reqPerSec: 0, p50Ms: 0, p95Ms: 0, errorRate: 0 };

  const rs = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM traffic WHERE server_id = $1 AND timestamp > NOW() - INTERVAL '60 seconds')::float / 60.0 AS req_per_sec,
       COALESCE((SELECT percentile_cont(0.50) WITHIN GROUP (ORDER BY duration)
                  FROM traffic WHERE server_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes'), 0) AS p50,
       COALESCE((SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY duration)
                  FROM traffic WHERE server_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes'), 0) AS p95,
       (SELECT COUNT(*) FROM traffic WHERE server_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes')::int AS total,
       (SELECT COUNT(*) FROM traffic WHERE server_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes' AND (response->>'statusCode')::int >= 500)::int AS errs`,
    [server.id]
  );
  const r = rs.rows[0];
  const total = parseInt(r.total) || 0;
  const errs = parseInt(r.errs) || 0;
  return {
    reqPerSec: parseFloat(r.req_per_sec) || 0,
    p50Ms: Math.round(parseFloat(r.p50) || 0),
    p95Ms: Math.round(parseFloat(r.p95) || 0),
    errorRate: total > 0 ? errs / total : 0
  };
}

function logFromRow(row) {
  return {
    id: row.request_id,
    timestamp: row.timestamp,
    request: typeof row.request === 'string' ? JSON.parse(row.request) : row.request,
    response: row.response ? (typeof row.response === 'string' ? JSON.parse(row.response) : row.response) : null,
    duration: row.duration,
    target: row.target,
    matchedRule: row.matched_rule_id,
    error: row.error
  };
}

module.exports = {
  logTransaction,
  getAllLogs,
  getLogById,
  filterLogs,
  clearLogs,
  getLiveStats,
  getStats
};
