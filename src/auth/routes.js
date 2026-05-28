const express = require('express');
const router = express.Router();
const passport = require('./passport');
const { findUserById, deleteUser } = require('../storage/users');

/**
 * Prevent open-redirect abuse of the post-OAuth redirectTo parameter.
 * Only relative paths starting with a single / are accepted; everything
 * else (absolute URLs, protocol-relative //evil.com, etc.) falls back to /.
 */
function sanitizeRedirect(raw) {
  if (typeof raw === 'string' && /^\/(?!\/)/.test(raw)) {
    return raw;
  }
  return '/';
}

function handleOAuthCallback(provider) {
  return (req, res) => {
    const userId = req.user.id;
    const redirectTo = req.session.redirectTo || '/';

    req.session.regenerate((err) => {
      if (err) {
        console.error('[AUTH] Session regenerate error:', err);
        return res.redirect('/?error=session_error');
      }

      req.session.userId = userId;
      // Consumed once by /api/auth/me so the frontend can fire user_signed_in.
      req.session.signedIn = provider;
      req.session.save((err) => {
        if (err) console.error('[AUTH] Session save error:', err);
        res.redirect(redirectTo);
      });
    });
  };
}

router.get('/google', (req, res, next) => {
  const redirectTo = sanitizeRedirect(req.query.redirectTo);
  req.session.redirectTo = redirectTo;
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
  handleOAuthCallback('google')
);

router.get('/github', (req, res, next) => {
  const redirectTo = sanitizeRedirect(req.query.redirectTo);
  req.session.redirectTo = redirectTo;
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/?error=auth_failed' }),
  handleOAuthCallback('github')
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
      const redirectTo = sanitizeRedirect(req.query.redirectTo);
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

    // Consume the one-shot signedIn flag so the frontend can fire user_signed_in.
    const signedIn = req.session.signedIn || null;
    if (signedIn) {
      delete req.session.signedIn;
      req.session.save((err) => {
        if (err) console.error('[AUTH] Failed to clear signedIn flag:', err);
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      plan: user.plan || 'free',
      isAdmin: user.is_admin || false,
      signedIn  // 'google' | 'github' | null — present only once after OAuth
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

router.delete('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Not logged in' });
  }

  const userId = req.session.userId;

  try {
    // Destroy the session first so the user is logged out immediately
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    res.clearCookie('faultend.sid');

    // Delete the user — cascades to servers, rules, traffic, collaborators, sessions
    await deleteUser(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Account deletion error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;