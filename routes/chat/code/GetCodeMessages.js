import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Chat from "../../../models/ChatSchema.js";

const router = express.Router();

router.get("/:chatId", async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const chat = await Chat.findById(chatId).populate("messages"); // Populate if messages are a separate collection
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.json(chat); // Or, if you just want to send messages: res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
