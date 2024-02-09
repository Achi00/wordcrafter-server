import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import { presets } from "../../utils/index.js";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

// Function to handle the OpenAI API request
async function* summarizeResponse(content, preset) {
  const { config, description } = presets[preset] || presets.default;
  const systemMessage = `You are a highly efficient assistant designed to provide summaries for various types of content. Your task is to identify and extract key information from any given text, regardless of its subject matter. The summary should be concise, clear, and informative, focusing on the main points and technical details without resorting to a narrative or storytelling approach. Avoid lists or bullet points, and ensure that the summary forms a coherent paragraph that is easy to understand and directly addresses the user's inquiry.`;

  const userMessage = `Please provide a concise, informative summary of the following content: ${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      ...config,
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
async function* summarizeResponseList(content, preset) {
  const { config, description } = presets[preset] || presets.default;
  const systemMessage = `You are a highly efficient assistant, your task is to provide a concise summary and list key points from the given content, focusing on ${description}`;
  const userMessage = `Please provide a brief summary but only as list of five, also key points for the following content: ${content}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      ...config,
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

// Router endpoint for streaming response
router.post("/", async (req, res) => {
  try {
    const { content, preset } = req.body;

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    for await (const chunk of summarizeResponse(content, preset)) {
      if (chunk) {
        res.write(JSON.stringify({ type: "summary", content: chunk }) + "\n");
      }
    }
    for await (const chunk of summarizeResponseList(content, preset)) {
      if (chunk) {
        res.write(
          JSON.stringify({ type: "summaryList", content: chunk }) + "\n"
        );
      }
    }

    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
