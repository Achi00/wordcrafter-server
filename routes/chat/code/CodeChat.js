import express from "express";

const router = express.Router();

// Authenticate with Google
router.post("/chat", async (req, res) => {
  try {
    // Create a new chat with participants
    const newChat = await new Chat({
      participants: [req.user._id /* other participant's user ID */],
      messages: [], // Starting with an empty array of messages
    }).save();

    // Add the chat to the user's chats
    await User.findByIdAndUpdate(req.user._id, {
      $push: { chats: newChat._id },
    });

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat", error: error });
  }
});

export default router;
