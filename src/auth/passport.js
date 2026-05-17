const passport = require('passport');
const { findUserByEmail, findUserByProvider, findUserByGoogleId, createUser, linkProvider } = require('../storage/users');

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
const isLocalhost = ROOT_DOMAIN === 'localhost' || ROOT_DOMAIN.endsWith('.localhost');
const protocol = isLocalhost ? 'http' : 'https';

async function handleOAuthProfile(provider, profile, done) {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

    if (!email) {
      return done(new Error('No email provided by OAuth provider'), null);
    }

    let user = await findUserByProvider(provider, profile.id);

    if (!user && provider === 'google') {
      user = await findUserByGoogleId(profile.id);
      if (user) {
        await linkProvider(user.id, provider, profile.id);
      }
    }

    if (!user) {
      user = await findUserByEmail(email);

      if (user) {
        await linkProvider(user.id, provider, profile.id);
      } else {
        const name = profile.displayName || email;
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        user = await createUser({
          email,
          name,
          avatarUrl
        });

        await linkProvider(user.id, provider, profile.id);
      }
    }

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  const googleCallbackURL = `${protocol}://app.${ROOT_DOMAIN}/api/auth/google/callback`;

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackURL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    await handleOAuthProfile('google', profile, done);
  }));

  console.log('[AUTH] Google OAuth configured');
} else {
  console.log('[AUTH] Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const GitHubStrategy = require('passport-github2').Strategy;

  const githubCallbackURL = `${protocol}://app.${ROOT_DOMAIN}/api/auth/github/callback`;

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: githubCallbackURL,
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    await handleOAuthProfile('github', profile, done);
  }));

  console.log('[AUTH] GitHub OAuth configured');
} else {
  console.log('[AUTH] GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { findUserById } = require('../storage/users');
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;