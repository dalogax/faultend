const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
  isOwner,
  canAdminServer,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  setInviteToken,
  getInviteToken,
  clearInviteToken,
  findServerByInviteToken,
  makeAdmin,
  removeAdmin,
  transferOwnership
} = require('../storage/users');

function buildInviteUrl(token) {
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
  const port = process.env.PORT || 3000;
  const isLocalhost = rootDomain === 'localhost';
  const protocol = isLocalhost ? 'http' : 'https';
  const portSuffix = isLocalhost ? `:${port}` : '';
  return `${protocol}://app.${rootDomain}${portSuffix}/#invite/${token}`;
}

function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/', async (req, res) => {
  try {
    const serverId = req.serverId;
    const userId = req.session.userId;

    const canAdmin = await canAdminServer(serverId, userId);
    if (!canAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner or admin can generate invite links' });
    }

    const token = generateInviteToken();
    await setInviteToken(serverId, token);

    res.json({ inviteUrl: buildInviteUrl(token) });
  } catch (error) {
    console.error('[COLLABORATION] Error generating invite:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const serverId = req.serverId;
    const userId = req.session.userId;

    const canAdmin = await canAdminServer(serverId, userId);
    if (!canAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner or admin can view invite links' });
    }

    const token = await getInviteToken(serverId);
    res.json({ inviteUrl: token ? buildInviteUrl(token) : null });
  } catch (error) {
    console.error('[COLLABORATION] Error fetching invite:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const serverId = req.serverId;
    const userId = req.session.userId;

    const canAdmin = await canAdminServer(serverId, userId);
    if (!canAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner or admin can revoke invites' });
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
    const serverId = req.serverId;
    const collaborators = await getCollaborators(serverId);
    res.json({ collaborators });
  } catch (error) {
    console.error('[COLLABORATION] Error fetching collaborators:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/collaborators/me', async (req, res) => {
  try {
    const serverId = req.serverId;
    const userId = req.session.userId;

    const owner = await isOwner(serverId, userId);
    if (owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'The owner cannot leave the server. Transfer ownership first.' });
    }

    await removeCollaborator(serverId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error leaving server:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/collaborators/:userId', async (req, res) => {
  try {
    const serverId = req.serverId;
    const { userId: collaboratorId } = req.params;
    const userId = req.session.userId;

    const canAdmin = await canAdminServer(serverId, userId);
    if (!canAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner or admin can remove collaborators' });
    }

    await removeCollaborator(serverId, parseInt(collaboratorId, 10));
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error removing collaborator:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.put('/collaborators/:userId/admin', async (req, res) => {
  try {
    const serverId = req.serverId;
    const { userId: collaboratorId } = req.params;
    const userId = req.session.userId;

    const owner = await isOwner(serverId, userId);
    if (!owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can promote collaborators to admin' });
    }

    await makeAdmin(serverId, parseInt(collaboratorId, 10));
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error making admin:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.delete('/collaborators/:userId/admin', async (req, res) => {
  try {
    const serverId = req.serverId;
    const { userId: collaboratorId } = req.params;
    const userId = req.session.userId;

    const owner = await isOwner(serverId, userId);
    if (!owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can demote admins' });
    }

    await removeAdmin(serverId, parseInt(collaboratorId, 10));
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error removing admin:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.post('/transfer-ownership/:userId', async (req, res) => {
  try {
    const serverId = req.serverId;
    const { userId: newOwnerId } = req.params;
    const userId = req.session.userId;

    const owner = await isOwner(serverId, userId);
    if (!owner) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the owner can transfer ownership' });
    }

    await transferOwnership(serverId, parseInt(newOwnerId, 10));
    res.json({ success: true });
  } catch (error) {
    console.error('[COLLABORATION] Error transferring ownership:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
