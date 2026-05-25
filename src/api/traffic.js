const express = require('express');
const {
  getAllLogs,
  getLogById,
  filterLogs,
  clearLogs,
  getStats
} = require('../storage/traffic');

const router = express.Router();

router.get('/', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required. Access via /api/servers/:serverId/...'
    });
  }
  
  const {
    method,
    statusCode,
    path,
    limit
  } = req.query;

  const filters = {};
  
  if (method) filters.method = method.toUpperCase();
  if (statusCode) filters.statusCode = parseInt(statusCode, 10);
  if (path) filters.path = path;
  if (limit) filters.limit = parseInt(limit, 10);

  let logs = Object.keys(filters).length > 0 
    ? await filterLogs(serverId, filters) 
    : await getAllLogs(serverId);

  res.json({
    serverId: serverId,
    count: logs.length,
    logs: logs
  });
});

router.get('/stats', async (req, res) => {
  const serverId = req.serverId;

  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }

  const stats = await getStats(serverId);
  res.json({ serverId, ...stats });
});

router.get('/:id', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const { id } = req.params;
  const log = await getLogById(serverId, id);

  if (!log) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Transaction with ID '${id}' not found`
    });
  }

  res.json(log);
});

router.delete('/', async (req, res) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID required'
    });
  }
  
  const clearedCount = await clearLogs(serverId);
  
  res.json({
    message: 'All traffic logs cleared',
    serverId: serverId,
    clearedCount: clearedCount
  });
});

module.exports = router;
