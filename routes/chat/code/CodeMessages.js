import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Chat from "../../../models/ChatSchema.js";
import { OpenAI } from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

async function fetchLastSixMessages(chatId) {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    console.log("Chat not found");
    return [];
  }
  // Assuming 'messages' is an array of message objects and you want the last 6 messages
  const lastSixMessages = chat.messages.slice(-6).map((msg) => ({
    sender: msg.sender,
    content: msg.content,
  }));

  return lastSixMessages;
}

// generate summary of conversation
async function* generateSummary(chatId) {
  // Fetch the last 3 messages from the chat
  const lastMessages = await fetchLastSixMessages(chatId);

  let conversationText = lastMessages
    .map(
      (msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.content}`
    )
    .join("\n");

  if (!conversationText) {
    conversationText = "No previous conversation.";
  }

  const systemMessage = `You are a summarization assistant designed to extract key points, context, and the most important logic from the conversation provided. Your goal is to generate a summary that captures the essence of the discussion, highlighting any significant details, context, and conclusions. This summary will be used to inform another AI system about the ongoing conversation, enabling it to understand the discussion's current state and main topics.`;
  const userMessage = `I want you to summarize this conversation for me, get context of it, what is topic about and keypoints, this conversation is between user and AI assistant, conversation: ${conversationText}`;

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

    for await (const chunk of completion) {
      yield chunk.choices[0].delta.content; // Yield each expanded chunk
    }

    // return summary.trim();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

// Function to handle the OpenAI API request
async function* streamAIResponse(content, systemMessage) {
  const userMessage = `${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "system",
          content: `your are helpful chat assistant, focused on return high quality and well structured code with error handling, you goal also is to keep conversation relevand and close to topic, latest conversation summary: ${systemMessage}`,
        },
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

// original route
// router.post("/:chatId", async (req, res) => {
//   const { chatId } = req.params;

//   try {
//     let summary = ""; // Initialize summary variable here

//     // Assuming generateSummary yields chunks of the summary text
//     for await (const chunk of generateSummary(chatId)) {
//       summary += chunk; // Accumulate summary content
//     }

//     // Update the chat document with the new summary
//     await Chat.findByIdAndUpdate(chatId, { $set: { summary: summary } });

//     res.json({
//       message: "Summary generated and saved successfully.",
//       summary: summary,
//     });
//   } catch (error) {
//     console.error("Error during summary generation and saving:", error);
//     res.status(500).json({
//       message: "Error generating or saving summary",
//       error: error.toString(),
//     });
//   }
// });

// summary test route
// router.post("/:chatId", async (req, res) => {
//   const { chatId } = req.params;
//   const { content: userInput } = req.body;

//   try {
//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       return res.status(404).send("Chat not found");
//     }

//     // Add user message
//     chat.messages.push({
//       sender: "user",
//       content: userInput,
//     });

//     // Check if it's time to update the summary (every 3 messages)
//     if (chat.messages.length % 3 === 0) {
//       // Generate a new summary
//       const newSummary = await generateSummary(chatId);
//       // Update the summary in the chat document
//       chat.summary = newSummary;
//     }

//     // Initialize a variable to collect the full AI response
//     let fullAIResponse = "";

//     // Collect chunks
//     try {
//       for await (const chunk of streamAIResponse(userInput)) {
//         console.log("Received chunk:", chunk); // Log the chunk for monitoring
//         fullAIResponse += chunk; // Concatenate the chunk to the full response
//       }
//     } catch (error) {
//       console.error("Error streaming AI response:", error);
//       return res.status(500).json({
//         message: "Error processing AI response",
//         error: error.toString(),
//       });
//     }

//     // Once all chunks are collected, save the full response
//     if (fullAIResponse) {
//       chat.messages.push({
//         sender: "assistant",
//         content: fullAIResponse,
//       });
//     }

//     // Save the chat document after processing all chunks
//     await chat.save();

//     res.json({
//       message: "Chat updated successfully with user and AI messages.",
//     });
//   } catch (error) {
//     console.error("Failed to process chat message:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to process message", error: error.toString() });
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

    let systemMessage = chat.summary || "You are a helpful assistant.";

    // Check if it's time to update the summary (every 3 messages)
    let summaryText = "";
    if (chat.messages.length % 3 === 0) {
      for await (const chunk of generateSummary(chatId)) {
        summaryText += chunk;
      }
      chat.summary = summaryText; // Ensure this is a string
    }

    // Initialize a variable to collect the full AI response
    let fullAIResponse = "";

    // Collect chunks from the AI response using the summary as context
    for await (const chunk of streamAIResponse(userInput, systemMessage)) {
      fullAIResponse += chunk; // Concatenate the chunk to form the full response
      console.log(chunk);
    }

    // Add the AI response to the chat
    if (fullAIResponse) {
      chat.messages.push({
        sender: "assistant",
        content: fullAIResponse,
      });
    }
    console.log(typeof chat.summary, chat.summary);

    // Save the updated chat document
    await chat.save();

    res.json({
      message: "Chat updated successfully with user and AI messages.",
      fullAIResponse,
    });
  } catch (error) {
    console.error("Failed to process chat message:", error);
    res
      .status(500)
      .json({ message: "Failed to process message", error: error.toString() });
  }
});

export default router;
