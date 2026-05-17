const express = require('express');
const router = express.Router();
const passport = require('./passport');
const { findUserById } = require('../storage/users');

function handleOAuthCallback(req, res) {
  const userId = req.user.id;
  const redirectTo = req.session.redirectTo || '/';

  req.session.regenerate((err) => {
    if (err) {
      console.error('[AUTH] Session regenerate error:', err);
      return res.redirect('/?error=session_error');
    }

    req.session.userId = userId;
    req.session.save((err) => {
      if (err) console.error('[AUTH] Session save error:', err);
      res.redirect(redirectTo);
    });
  });
}

router.get('/google', (req, res, next) => {
  const redirectTo = req.query.redirectTo || '/';
  req.session.redirectTo = redirectTo;
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
  handleOAuthCallback
);

router.get('/github', (req, res, next) => {
  const redirectTo = req.query.redirectTo || '/';
  req.session.redirectTo = redirectTo;
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/?error=auth_failed' }),
  handleOAuthCallback
);

if (process.env.MOCK_AUTH_ENABLED === 'true') {
  router.get('/dev-login', async (req, res) => {
    const { findUserByEmail, createUser, linkProvider } = require('../storage/users');
    const email = 'dev@faultend.local';
    let user = await findUserByEmail(email);

    if (!user) {
      user = await createUser({
        email,
        name: 'Developer',
        avatarUrl: null
      });
      await linkProvider(user.id, 'mock', 'dev-user-123');
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('[AUTH] Dev login session error:', err);
        return res.redirect('/?error=session_error');
      }

      req.session.userId = user.id;
      const redirectTo = req.query.redirectTo || '/';
      res.redirect(redirectTo);
    });
  });
}

router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Not logged in' });
  }

  try {
    const user = await findUserById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url
    });
  } catch (error) {
    console.error('[AUTH] Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH] Logout error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to logout' });
    }
    res.clearCookie('faultend.sid');
    res.json({ success: true });
  });
});

module.exports = router;