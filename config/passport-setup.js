import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/User.js"; // Make sure you include the file extension if using native ES6 modules

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;
        const photo =
          profile.photos && profile.photos.length > 0
            ? profile.photos[0].value
            : null;

        if (!email) {
          throw new Error("No email associated with this account!");
        }

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            picture: photo, // Save the profile picture URL
          });
          await user.save();
          console.log("New user created: " + user);
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// console.log(passport._strategies);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
