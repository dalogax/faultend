const express = require('express');
const { 
  getAllLogs, 
  getLogById, 
  filterLogs, 
  clearLogs, 
  getStats 
} = require('../traffic/trafficLogger');

const router = express.Router();

/**
 * GET /servers/:serverId/traffic
 * 
 * Query Parameters:
 * - method: Filter by HTTP method (GET, POST, etc.)
 * - statusCode: Filter by response status code
 * - path: Substring match in request path
 * - regex: Regex pattern to match request path
 * - sinceTimestamp: ISO timestamp - logs after this time
 * - untilTimestamp: ISO timestamp - logs before this time
 * - target: Filter by backend target URL
 * - hasError: 'true' or 'false' - filter by error presence
 * - limit: Maximum number of results (default: all)
 */
router.get('/', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required. Access via /servers/:serverId/...'
    });
  }
  
  const {
    method,
    statusCode,
    path,
    regex,
    sinceTimestamp,
    untilTimestamp,
    target,
    hasError,
    limit
  } = req.query;

  // Build filter object
  const filters = {};
  
  if (method) filters.method = method.toUpperCase();
  if (statusCode) filters.statusCode = parseInt(statusCode, 10);
  if (path) filters.path = path;
  if (regex) filters.regex = regex;
  if (sinceTimestamp) filters.sinceTimestamp = sinceTimestamp;
  if (untilTimestamp) filters.untilTimestamp = untilTimestamp;
  if (target) filters.target = target;
  if (hasError) filters.hasError = hasError === 'true';

  // Get filtered logs for customer
  let logs = Object.keys(filters).length > 0 
    ? filterLogs(serverId, filters) 
    : getAllLogs(serverId);

  // Apply limit if specified
  if (limit) {
    const maxResults = parseInt(limit, 10);
    logs = logs.slice(0, maxResults);
  }

  res.json({
    serverId: serverId,
    count: logs.length,
    logs: logs
  });
});

router.get('/stats', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const stats = getStats(serverId);
  res.json({ serverId, ...stats });
});

/**
 * GET /servers/:serverId/traffic/:id
 * Get a specific transaction by ID
 * Phase 6.1: Scoped per serverId
 */
router.get('/:id', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const { id } = req.params;
  const log = getLogById(serverId, id);

  if (!log) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Transaction with ID '${id}' not found`
    });
  }

  res.json(log);
});

/**
 * DELETE /servers/:serverId/traffic
 * Clear all traffic logs
 * Phase 6.1: Scoped per serverId
 */
router.delete('/', (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const clearedCount = clearLogs(serverId);
  
  res.json({
    message: 'All traffic logs cleared',
    serverId: serverId,
    clearedCount: clearedCount
  });
});

module.exports = router;
