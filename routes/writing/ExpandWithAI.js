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
async function* expandResponse(content, preset) {
  const { config, description } = presets[preset] || presets.default;
  const systemMessage = `You are a helpful assistant, focused to ${description}`;
  const userMessage = `Expand on the following content with additional information and analysis, add argumentation: ${content}`;

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

    for await (const chunk of expandResponse(content, preset)) {
      if (chunk) {
        res.write(JSON.stringify({ type: "expand", content: chunk }) + "\n");
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
