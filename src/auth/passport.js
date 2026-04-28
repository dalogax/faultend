const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findUserByGoogleId, createUser } = require('../storage/users');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
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
