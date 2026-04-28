const express = require('express');
const router = express.Router();
const {
  addCollaborator,
  findServerByInviteToken,
  isCollaborator
} = require('../storage/users');

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const server = await findServerByInviteToken(token);
    
    if (!server) {
      return res.status(404).json({ error: 'Not Found', message: 'Invalid or expired invite link' });
    }
    
    res.json({
      serverId: server.server_id,
      serverName: server.name,
      ownerName: server.owner_name
    });
  } catch (error) {
    console.error('[INVITE] Error previewing invite:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.post('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.session.userId;
    
    const server = await findServerByInviteToken(token);
    if (!server) {
      return res.status(404).json({ error: 'Not Found', message: 'Invalid or expired invite link' });
    }
    
    if (server.owner_id === userId) {
      return res.status(400).json({ error: 'Bad Request', message: 'You are already the owner of this server' });
    }
    
    const alreadyCollaborator = await isCollaborator(server.server_id, userId);
    if (alreadyCollaborator) {
      return res.status(400).json({ error: 'Bad Request', message: 'You are already a collaborator on this server' });
    }
    
    await addCollaborator(server.server_id, userId);
    
    res.json({
      serverId: server.server_id,
      serverName: server.name,
      message: 'You have been added as a collaborator'
    });
  } catch (error) {
    console.error('[INVITE] Error accepting invite:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
