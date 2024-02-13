import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Chat from "../../../models/ChatSchema.js";
import { OpenAI } from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

async function fetchLastThreeMessages(chatId) {
  const chat = await Chat.findById(chatId);
  // Assuming 'messages' is an array of message objects
  return chat.messages.slice(-3).map((msg) => {
    return { role: msg.sender, content: msg.content };
  });
}
// generate summary of conversation
async function generateSummary(chatId) {
  // Fetch the last 3 messages from the chat
  const lastMessages = await fetchLastThreeMessages(chatId);
  const conversationForSummary = lastMessages.map((msg) => {
    return {
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    };
  });

  // Concatenate the last few messages to form the input for the summarization
  const summaryInput = conversationForSummary
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const systemMessage = `You are a summarization assistant designed to extract key points, context, and the most important logic from the conversation provided. Your goal is to generate a summary that captures the essence of the discussion, highlighting any significant details, context, and conclusions. This summary will be used to inform another AI system about the ongoing conversation, enabling it to understand the discussion's current state and main topics.`;
  const userMessage = `I want you to summarize this conversation for me, get context of it, what is topic about and keypoints, conversation: ${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      top_p: 0.1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    });

    // Extract the summary text from the response
    const summary = response.data.choices[0].text.trim();
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

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
