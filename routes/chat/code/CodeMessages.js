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
// async function* streamAIResponse(content, chatId) {
//   const systemMessage = `You are a helpful assistant`;
//   const userMessage = `${content}`;

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
//       yield chunk.choices[0].delta.content; // Yield each expanded chunk
//     }
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

async function streamAIResponse(content) {
  const systemMessage = `You are a helpful assistant.`;
  const userMessage = content;
  let fullResponse = "";

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
      // Check if 'content' exists in the chunk before concatenating
      if (chunk.choices[0].delta && "content" in chunk.choices[0].delta) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }
  } catch (error) {
    console.error("Error streaming AI response:", error);
    throw error;
  }

  return fullResponse; // Return the full, concatenated response
}

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
async function simulateAIResponse(userInput) {
  // Simulate a delay and return a simple string response
  return `Simulated response for "${userInput}"`;
}

router.post("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { content: userInput } = req.body;

  console.log("Received userInput:", userInput); // Log the user input for debugging

  try {
    const chat = await Chat.findById(chatId);
    console.log("Chat found:", !!chat); // Confirm chat is found

    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    // Log the state of messages before adding the user message
    console.log("Messages before adding user message:", chat.messages);

    // Add user message
    chat.messages.push({
      sender: "user",
      content: userInput,
    });

    console.log("Messages after adding user message:", chat.messages);

    // Get AI response and add it
    const aiResponse = await simulateAIResponse(userInput);
    console.log("AI response:", aiResponse); // Log the AI response for debugging

    if (aiResponse) {
      chat.messages.push({
        sender: "assistant",
        content: aiResponse,
      });
    }

    // Log the state of messages before saving
    console.log("Messages before saving:", chat.messages);

    // Save the updated chat document
    await chat.save();

    console.log("Chat saved successfully"); // Confirm chat was saved

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
