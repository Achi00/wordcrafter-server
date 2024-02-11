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
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      // If an error occurs, redirect to the Next.js app with an error parameter
      return res.redirect(`http://localhost:3000/auth?error=${err.message}`);
    }
    if (!user) {
      return res.redirect("http://localhost:3000/auth?error=authFailed");
    }
    req.logIn(user, (err) => {
      if (err) {
        // Example of refining the error message
        const userFriendlyError = err.message; // Transform this based on expected errors
        return res.redirect(
          `http://localhost:3000/auth?error=${encodeURIComponent(
            userFriendlyError
          )}`
        );
      }
      // Successful authentication, redirect to the home page.
      return res.redirect("http://localhost:3000/");
    });
  })(req, res, next);
});

export default router;
