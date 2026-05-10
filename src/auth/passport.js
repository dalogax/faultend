const passport = require('passport');
const { findUserByGoogleId, createUser } = require('../storage/users');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';
  const isLocalhost = ROOT_DOMAIN === 'localhost' || ROOT_DOMAIN.endsWith('.localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const callbackURL = `${protocol}://app.${ROOT_DOMAIN}/auth/google/callback`;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await findUserByGoogleId(profile.id);
      
      if (!user) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const name = profile.displayName || email;
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        
        user = await createUser({
          googleId: profile.id,
          email,
          name,
          avatarUrl
        });
      }
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
  
  console.log('[AUTH] Google OAuth configured');
} else {
  console.log('[AUTH] Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
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
