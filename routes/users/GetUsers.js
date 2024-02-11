import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    // Use the User model to find the user by their ID (stored in session)
    User.findById(
      req.user.id,
      "googleId name email picture createdAt",
      (err, user) => {
        // Select specific fields
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ message: "Error fetching user information" });
        }
        if (user) {
          // Return the user information; ensure to exclude sensitive data if any
          res.json(user);
        } else {
          res.status(404).json({ message: "User not found" });
        }
      }
    );
  } else {
    res.status(401).json({ message: "User not authenticated" });
  }
});

export default router;
