const express = require('express');
const router = express.Router();
const {
  getAllServers,
  getServer,
  createServer,
  deleteServer,
  serverExists,
  updateServerBehaviour
} = require('../storage/storage');

router.use(express.json());

function deriveServerStatus(server) {
  if (server.recording_enabled === false) return 'off';
  const live = parseInt(server.live_count) || 0;
  const total = parseInt(server.recent_total) || 0;
  const errors = parseInt(server.recent_errors) || 0;
  if (total > 0 && (errors / total) >= 0.05) return 'warn';
  if (live > 0) return 'live';
  return 'idle';
}

router.get('/servers', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    
    const servers = await getAllServers(req.user.id);
    const decorated = servers.map(s => ({ ...s, status: deriveServerStatus(s) }));
    res.json({
      servers: decorated,
      count: decorated.length
    });
  } catch (error) {
    console.error('[SERVERS API] Error listing servers:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

router.get('/servers/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    
    const server = await getServer(req.params.id);
    
    if (!server) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Fault server '${req.params.id}' not found`
      });
    }
    
    const { canAccessServer, isOwner, getCollaborators } = require('../storage/storage');
    const hasAccess = await canAccessServer(req.params.id, req.user.id);
    if (!hasAccess) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Fault server '${req.params.id}' not found`
      });
    }
    
    const owner = await isOwner(req.params.id, req.user.id);
    const collaborators = await getCollaborators(req.params.id);
    
    res.json({
      ...server,
      status: deriveServerStatus(server),
      isOwner: owner,
      collaborators: collaborators.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        avatarUrl: c.avatar_url,
        joinedAt: c.joined_at
      }))
    });
  } catch (error) {
    console.error('[SERVERS API] Error getting server:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

router.post('/servers', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
  
  const { id, name, description } = req.body;
  
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
  
  const reservedSubdomains = ['admin', 'app', 'www', 'api', 'web'];
  if (reservedSubdomains.includes(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `'${id}' is a reserved subdomain and cannot be used`
    });
  }
  
  const exists = await serverExists(id);
  if (exists) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Server '${id}' already exists`
    });
  }
  
  try {
    const server = await createServer({ 
      serverId: id, 
      name: name || id, 
      description: description || '', 
      ownerId: req.user.id 
    });
    console.log(`[SERVERS API] Created fault server: ${id}`);
    
    const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
    const port = process.env.PORT || 3000;
    const isLocalhost = rootDomain === 'localhost';
    const protocol = isLocalhost ? 'http' : 'https';
    const portSuffix = isLocalhost ? `:${port}` : '';
    
    res.status(201).json({
      ...server,
      url: `${protocol}://${id}.${rootDomain}${portSuffix}`,
      managementUrl: `${protocol}://app.${rootDomain}${portSuffix}?serverId=${id}`
    });
  } catch (error) {
    console.error('[SERVERS API] Error creating server:', error);
    
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

router.patch('/servers/:id/behaviour', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    const { canAdminServer } = require('../storage/storage');
    const canAdmin = await canAdminServer(req.params.id, req.user.id);
    if (!canAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner or admin can change behaviour settings' });
    }

    const { recordingEnabled, defaultLatencyMs, preserveHeaders } = req.body || {};
    if (defaultLatencyMs !== undefined && (typeof defaultLatencyMs !== 'number' || defaultLatencyMs < 0)) {
      return res.status(400).json({ error: 'Validation Error', message: 'defaultLatencyMs must be a non-negative number' });
    }
    if (preserveHeaders !== undefined && typeof preserveHeaders !== 'string') {
      return res.status(400).json({ error: 'Validation Error', message: 'preserveHeaders must be a string' });
    }

    const updated = await updateServerBehaviour(req.params.id, { recordingEnabled, defaultLatencyMs, preserveHeaders });
    if (!updated) {
      return res.status(404).json({ error: 'Not Found', message: `Fault server '${req.params.id}' not found` });
    }
    res.json({
      recordingEnabled: updated.recording_enabled,
      defaultLatencyMs: updated.default_latency_ms,
      preserveHeaders:  updated.preserve_headers || ''
    });
  } catch (error) {
    console.error('[SERVERS API] Error updating behaviour:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/servers/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    
    const { isOwner } = require('../storage/storage');
    const owner = await isOwner(req.params.id, req.user.id);
    if (!owner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the server owner can delete it'
      });
    }
    
    await deleteServer(req.params.id);
    console.log(`[SERVERS API] Deleted fault server: ${req.params.id}`);
    
    res.json({
      message: 'Fault server deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('[SERVERS API] Error deleting server:', error);
    
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
