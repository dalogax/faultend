const { canAccessServer, isOwner, findUserById } = require('../storage/users');

async function authRequired(req, res, next) {
  if (req.routeType === 'landing' || req.routeType === 'fault-server') {
    return next();
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      loginUrl: '/api/auth/google'
    });
  }
  
  try {
    const user = await findUserById(req.session.userId);
    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error('[AUTH] Failed to destroy invalid session:', err);
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists',
        loginUrl: '/api/auth/google'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH] Error verifying user:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify authentication'
    });
  }
}

async function requireServerAccess(req, res, next) {
  const serverId = req.params.id || req.params.serverId;
  const userId = req.session.userId;
  
  if (!serverId || !userId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID and authentication required'
    });
  }
  
  const hasAccess = await canAccessServer(serverId, userId);
  if (!hasAccess) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Server '${serverId}' not found`
    });
  }
  
  next();
}

async function requireOwner(req, res, next) {
  const serverId = req.params.id || req.params.serverId;
  const userId = req.session.userId;
  
  if (!serverId || !userId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Server ID and authentication required'
    });
  }
  
  const owner = await isOwner(serverId, userId);
  if (!owner) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only the server owner can perform this action'
    });
  }
  
  next();
}

/**
 * Requires the logged-in user to be a platform admin (users.is_admin = true).
 * Must run after authRequired (which populates req.user).
 * NOTE: This is unrelated to server-level admin roles (server_collaborators.role).
 */
async function requirePlatformAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Platform admin access required'
    });
  }
  next();
}

module.exports = {
  authRequired,
  requireServerAccess,
  requireOwner,
  requirePlatformAdmin
};
