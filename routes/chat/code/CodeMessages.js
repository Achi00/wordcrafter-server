import express from "express";
import Chat from "../../../models/ChatSchema.js";

const router = express.Router();

// Endpoint to add a message to a specific chat
router.post("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { sender, text } = req.body; // Assume sender is 'user' or 'assistant', text is the message content

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    chat.messages.push({ sender, text });
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to add message", error: error.message });
  }
});

export default router;
