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
 * GET /api/traffic
 * Get all traffic logs with optional filtering
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

  // Get filtered logs
  let logs = Object.keys(filters).length > 0 
    ? filterLogs(filters) 
    : getAllLogs();

  // Apply limit if specified
  if (limit) {
    const maxResults = parseInt(limit, 10);
    logs = logs.slice(0, maxResults);
  }

  res.json({
    count: logs.length,
    logs: logs
  });
});

/**
 * GET /api/traffic/stats
 * Get traffic statistics
 */
router.get('/stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

/**
 * GET /api/traffic/:id
 * Get a specific transaction by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const log = getLogById(id);

  if (!log) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Transaction with ID '${id}' not found`
    });
  }

  res.json(log);
});

/**
 * DELETE /api/traffic
 * Clear all traffic logs
 */
router.delete('/', (req, res) => {
  const clearedCount = clearLogs();
  
  res.json({
    message: 'All traffic logs cleared',
    clearedCount: clearedCount
  });
});

module.exports = router;
