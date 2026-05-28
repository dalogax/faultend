const express = require('express');
const router = express.Router();
const { getAdminUserList, getAdminUserDetail, setUserPlan } = require('../storage/users');

// All routes here are already guarded by requirePlatformAdmin in server.js.

// GET /api/admin/users?page=1&limit=50&search=&plan=
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const search = (req.query.search || '').trim();
    const plan = req.query.plan || '';

    const result = await getAdminUserList({ page, limit, search, plan });
    res.json(result);
  } catch (err) {
    console.error('[ADMIN] Error listing users:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await getAdminUserDetail(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[ADMIN] Error fetching user:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// POST /api/admin/users/:id/set-plan — body: { plan: 'free' | 'pro' }
router.post('/users/:id/set-plan', async (req, res) => {
  try {
    const { plan } = req.body || {};
    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Bad Request', message: 'plan must be "free" or "pro"' });
    }
    const user = await setUserPlan(req.params.id, plan);
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    res.json({ success: true, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    console.error('[ADMIN] Error setting plan:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
