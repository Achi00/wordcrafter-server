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
      max_tokens: 1000,
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

// async function streamAIResponse(content) {
//   const systemMessage = `You are a helpful assistant.`;
//   const userMessage = content;
//   let fullResponse = "";

//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo-0125",
//       messages: [
//         { role: "system", content: systemMessage },
//         { role: "user", content: userMessage },
//       ],
//       temperature: 0.1,
//       max_tokens: 100,
//       top_p: 0.1,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//       stream: true,
//     });

//     for await (const chunk of completion) {
//       // Check if 'content' exists in the chunk before concatenating
//       if (chunk.choices[0].delta && "content" in chunk.choices[0].delta) {
//         fullResponse += chunk.choices[0].delta.content;
//       }
//     }
//   } catch (error) {
//     console.error("Error streaming AI response:", error);
//     throw error;
//   }

//   return fullResponse; // Return the full, concatenated response
// }

// Endpoint to add a message to a specific chat
// router.post("/:chatId", async (req, res) => {
//   const { chatId } = req.params;
//   const { content } = req.body; // User's message

//   try {
//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       return res.status(404).send("Chat not found");
//     }

//     // Add the user's message to the chat
//     chat.messages.push({ sender: "user", content });

//     // Collect the full AI response
//     const aiResponse = await streamAIResponse(content);

//     // Now, save the full AI response to the chat
//     if (aiResponse) {
//       chat.messages.push({ sender: "assistant", content: aiResponse });
//       chat.updatedAt = new Date();
//     }

//     await chat.save();

//     // Confirm completion to the client
//     res.json({ message: "Chat updated successfully with AI response." });
//   } catch (error) {
//     console.error("Failed to process chat message:", error);
//     if (!res.headersSent) {
//       res
//         .status(500)
//         .json({ message: "Failed to process message", error: error.message });
//     }
//   }
// });

router.post("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { content: userInput } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    // Add user message
    chat.messages.push({
      sender: "user",
      content: userInput,
    });

    // Initialize a variable to collect the full AI response
    let fullAIResponse = "";

    // Collect chunks
    try {
      for await (const chunk of streamAIResponse(userInput)) {
        console.log("Received chunk:", chunk); // Log the chunk for monitoring
        fullAIResponse += chunk; // Concatenate the chunk to the full response
      }
    } catch (error) {
      console.error("Error streaming AI response:", error);
      return res.status(500).json({
        message: "Error processing AI response",
        error: error.toString(),
      });
    }

    // Once all chunks are collected, save the full response
    if (fullAIResponse) {
      chat.messages.push({
        sender: "assistant",
        content: fullAIResponse,
      });
    }

    // Save the chat document after processing all chunks
    await chat.save();

    res.json({
      message: "Chat updated successfully with user and AI messages.",
    });
  } catch (error) {
    console.error("Failed to process chat message:", error);
    res
      .status(500)
      .json({ message: "Failed to process message", error: error.toString() });
  }
});

export default router;
