import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Chat from "../../../models/ChatSchema.js";
import { OpenAI } from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

// Function to handle the OpenAI API request
async function* streamAIResponse(content, chatId) {
  const systemMessage = `You are a helpful assistant`;
  const userMessage = `${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 100,
      top_p: 0.1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    });

    for await (const chunk of completion) {
      yield chunk.choices[0].delta.content; // Yield each expanded chunk
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Endpoint to add a message to a specific chat
router.post("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body; // User's message

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    for await (const chunk of streamAIResponse(content)) {
      if (chunk) {
        res.write(JSON.stringify({ type: "chat", content: chunk }) + "\n");
      }
    }

    res.end();
  } catch (error) {
    console.error("Failed to process chat message:", error);
    // Handle error. Note: This might not work as expected due to async nature of streams.
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Failed to process message", error: error.message });
    }
  }
});

export default router;
