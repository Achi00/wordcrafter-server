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

  // Fetch the last 6 messages and trim the assistant's messages to 1000 characters
  const lastSixMessages = chat.messages.slice(-6).map((msg) => {
    // For the user, return the message as is
    if (msg.sender === "user") {
      return {
        sender: msg.sender,
        content: msg.content,
      };
    }
    // For the assistant, trim the message content to the first 1000 characters
    else if (msg.sender === "assistant") {
      return {
        sender: msg.sender,
        content: msg.content.slice(0, 1000), // Trim to 1000 characters
      };
    }
  });

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

router.post("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { content: userInput } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    // Add user message
    chat.messages.push({ sender: "user", content: userInput });
    await chat.save();

    // Calculate the newest summary here
    let newestSummary = "";
    try {
      for await (const summaryChunk of generateSummary(chatId)) {
        newestSummary += summaryChunk;
      }
    } catch (error) {
      console.error("Error while generating summary:", error);
      // Handle summary generation error, perhaps by setting a default summary
      newestSummary = "Error generating summary.";
    }

    chat.newestSummary = newestSummary;
    await chat.save();

    // Immediately write the header to start the response
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    // Respond with the user's message immediately
    res.write(
      JSON.stringify({ type: "userMessage", content: userInput }) + "\n"
    );

    // Stream AI response chunks
    let fullAIResponse = "";
    try {
      for await (const aiChunk of streamAIResponse(userInput, newestSummary)) {
        if (typeof aiChunk === "string" && aiChunk.trim() !== "undefined") {
          fullAIResponse += aiChunk; // Concatenate for saving to DB later
          console.log("Streaming AI response chunk:", aiChunk);
          res.write(
            JSON.stringify({ type: "aiResponse", content: aiChunk.trim() }) +
              "\n"
          );
        }
      }
    } catch (error) {
      console.error("Error while streaming AI response:", error);
      // Notify the client of the error without appending it to fullAIResponse
      res.write(
        JSON.stringify({
          type: "error",
          content: "Error generating AI response.",
        }) + "\n"
      );
    }

    // After streaming, save the AI response
    if (fullAIResponse.trim()) {
      // Append AI response to the chat document
      chat.messages.push({
        sender: "assistant",
        content: fullAIResponse.trim(),
      });
      await chat.save();
      console.log("AI response saved to database");
    }

    // Optionally adjust how you handle chat.fullSummary based on your requirements
    chat.fullSummary = (chat.fullSummary || "") + "\n" + fullAIResponse.trim();
    await chat.save();

    res.end();
  } catch (error) {
    console.error("Failed to process chat message:", error);
    res.end(
      JSON.stringify({
        error: "Failed to process message",
        details: error.toString(),
      })
    );
  }
});

// router.post("/:chatId", async (req, res) => {
//   const { chatId } = req.params;
//   const { content: userInput } = req.body;

//   try {
//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       return res.status(404).send("Chat not found");
//     }

//     // Add user message
//     chat.messages.push({ sender: "user", content: userInput });

//     // Fetch the last six messages for the newest summary
//     const lastSixMessages = await fetchLastSixMessages(chatId);
//     const conversationTextForNewest = lastSixMessages
//       .map(
//         (msg) =>
//           `${msg.sender === "user" ? "User: " : "Assistant: "}${msg.content}`
//       )
//       .join("\n");

//     // Generate the newest summary
//     let newestSummary = "";
//     for await (const chunk of generateSummary(chatId)) {
//       // Adjust to ensure correct implementation
//       newestSummary += chunk; // Concatenate summary content
//     }

//     // Update newestSummary and append it to fullSummary
//     chat.newestSummary = newestSummary;
//     chat.fullSummary = chat.fullSummary
//       ? chat.fullSummary + "\n\n" + newestSummary
//       : newestSummary;

//     // Save the updated chat document
//     await chat.save();

//     // Generate AI response using the newest summary as context
//     let fullAIResponse = "";
//     for await (const chunk of streamAIResponse(userInput, newestSummary)) {
//       // Adjust this call to use the correct context
//       fullAIResponse += chunk; // Concatenate the chunk to form the full AI response
//     }

//     // Add the AI response to the chat
//     chat.messages.push({ sender: "assistant", content: fullAIResponse });
//     await chat.save();

//     res.json({
//       message: "Chat updated successfully with user and AI messages.",
//       newestSummary: newestSummary,
//       fullAIResponse,
//     });
//   } catch (error) {
//     console.error("Failed to process chat message:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to process message", error: error.toString() });
//   }
// });

export default router;
