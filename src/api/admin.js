

const express = require('express');
const router = express.Router();
const {
  getAllServers,
  getServer,
  createServer,
  deleteServer
} = require('../storage/storage');

router.use(express.json());

/**
 * GET /servers
 * List all fault servers
 */
router.get('/servers', (req, res) => {
  try {
    const servers = getAllServers();
    res.json({ 
      servers, 
      count: servers.length 
    });
  } catch (error) {
    console.error('[ADMIN API] Error listing servers:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /servers/:id
 * Get specific fault server details
 */
router.get('/servers/:id', (req, res) => {
  try {
    const customer = getServer(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Fault server '${req.params.id}' not found`
      });
    }
    
    res.json({
      ...customer.metadata,
      rulesCount: customer.rules.length,
      trafficCount: customer.traffic.length
    });
  } catch (error) {
    console.error('[ADMIN API] Error getting server:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /servers
 * Create new fault server
 * 
 * Body: { id: "customer1", name: "Customer 1", description: "..." }
 */
router.post('/servers', (req, res) => {
  const { id, name, description } = req.body;
  
  // Validate ID
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'id is required and must be a string'
    });
  }
  
  if (!/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'id must contain only lowercase letters, numbers, and hyphens'
    });
  }
  
  // Reserved subdomains
  const reservedSubdomains = ['admin', 'app', 'www', 'api', 'web'];
  if (reservedSubdomains.includes(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `'${id}' is a reserved subdomain and cannot be used`
    });
  }
  
  try {
    const customer = createServer(id, { name, description });
    console.log(`[ADMIN API] Created fault server: ${id}`);
    
    const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
    const port = process.env.PORT || 3000;
    
    // Build URLs based on environment
    // In production (behind reverse proxy), use standard ports
    // In development, include explicit port
    const isLocalhost = rootDomain === 'localhost';
    const protocol = isLocalhost ? 'http' : 'https';
    const portSuffix = isLocalhost ? `:${port}` : '';
    
    res.status(201).json({
      ...customer.metadata,
      url: `${protocol}://${id}.${rootDomain}${portSuffix}`,
      managementUrl: `${protocol}://app.${rootDomain}${portSuffix}?serverId=${id}`
    });
  } catch (error) {
    console.error('[ADMIN API] Error creating server:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

/**
 * DELETE /servers/:id
 * Delete fault server and all its data
 */
router.delete('/servers/:id', (req, res) => {
  try {
    deleteServer(req.params.id);
    console.log(`[ADMIN API] Deleted fault server: ${req.params.id}`);
    
    res.json({
      message: 'Fault server deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('[ADMIN API] Error deleting server:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
