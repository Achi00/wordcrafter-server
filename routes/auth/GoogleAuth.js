import express from "express";
import passport from "passport";

const router = express.Router();

// Authenticate with Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Callback route for Google to redirect to
router.get("/google/callback", passport.authenticate("google"), (req, res) => {
  // User is authenticated, redirect them
  res.send("you are in callback url");
  // res.redirect("/profile");
});

export default router;
