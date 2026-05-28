const express = require('express');
const router = express.Router();
const { getUserQuota } = require('../storage/users');

// GET /api/me/quota — returns usage vs limits for the authenticated user
router.get('/quota', async (req, res) => {
  try {
    const quota = await getUserQuota(req.session.userId);
    res.json(quota);
  } catch (error) {
    console.error('[ME] Error fetching quota:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
