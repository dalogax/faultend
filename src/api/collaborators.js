const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
  isOwner,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  setInviteToken,
  clearInviteToken,
  findServerByInviteToken
} = require('../storage/users');

function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/', async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.session.userId;
    
    const owner = await isOwner(serverId, userId);
    if (!owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can generate invite links' });
    }
    
    const token = generateInviteToken();
    await setInviteToken(serverId, token);
    
    const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
    const port = process.env.PORT || 3000;
    const isLocalhost = rootDomain === 'localhost';
    const protocol = isLocalhost ? 'http' : 'https';
    const portSuffix = isLocalhost ? `:${port}` : '';
    
    res.json({
      inviteUrl: `${protocol}://app.${rootDomain}${portSuffix}/invite/${token}`
    });
  } catch (error) {
    console.error('[COLLABORATION] Error generating invite:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.session.userId;
    
    const owner = await isOwner(serverId, userId);
    if (!owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can revoke invites' });
    }
    
    await clearInviteToken(serverId);
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error revoking invite:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.get('/collaborators', async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.session.userId;
    
    const { canAccessServer } = require('../storage/users');
    const hasAccess = await canAccessServer(serverId, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Not Found', message: 'Server not found' });
    }
    
    const collaborators = await getCollaborators(serverId);
    res.json({ collaborators });
  } catch (error) {
    console.error('[COLLABORATION] Error fetching collaborators:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/collaborators/:userId', async (req, res) => {
  try {
    const { serverId, userId: collaboratorId } = req.params;
    const userId = req.session.userId;
    
    const owner = await isOwner(serverId, userId);
    if (!owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can remove collaborators' });
    }
    
    await removeCollaborator(serverId, parseInt(collaboratorId, 10));
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error removing collaborator:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
