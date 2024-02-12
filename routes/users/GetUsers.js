import express from "express";
import passport from "passport";
import User from "../../models/UserSchema.js";

const router = express.Router();

router.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Use the User model to find the user by their ID (stored in session)
      const user = await User.findById(
        req.user.id,
        "googleId name email picture createdAt"
      );
      if (user) {
        // Return the user information; ensure to exclude sensitive data if any
        console.log(JSON.stringify(user));
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Error fetching user information" });
    }
  } else {
    res.status(401).json({ message: "User not authenticated" });
  }
});

export default router;
