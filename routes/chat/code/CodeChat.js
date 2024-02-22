import express from "express";
import Chat from "../../../models/ChatSchema.js";
import User from "../../../models/UserSchema.js";

const router = express.Router();

// Endpoint to create a new chat
router.post("/", async (req, res) => {
  const { userId } = req.body; // Assuming the frontend sends the ID of the user who initiates the chat

  if (!userId) {
    return res.status(404).send("no userId provided");
  }

  try {
    // Verify if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).send("User not found");
    }

    // Create a new chat instance
    const newChat = new Chat({
      userId: userId,
      messages: [], // Start with an empty messages array
    });

    // Save the chat
    const savedChat = await newChat.save();

    // Optionally, update the user's chats array
    userExists.chats.push(savedChat._id);
    await userExists.save();

    res.status(201).json(savedChat);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to start chat", error: error.message });
  }
});

export default router;
