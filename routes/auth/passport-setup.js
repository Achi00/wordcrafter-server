const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User"); // Assuming you have a User model

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      // Check if user already exists in our db
      const existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        return cb(null, existingUser);
      }
      // If not, create a new user
      const newUser = await new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
      }).save();
      cb(null, newUser);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});
