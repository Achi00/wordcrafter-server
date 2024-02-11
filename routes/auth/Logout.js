import express from "express";
import passport from "passport";

const router = express.Router();

// Assuming you're using express-session
router.get("/", (req, res) => {
  req.logout(); // Passport.js's way to log out the user
  req.session.destroy(); // Destroys session data
  res.redirect("http://localhost:3000/auth"); // Redirects user to homepage or login page after logging out
});

export default router;
