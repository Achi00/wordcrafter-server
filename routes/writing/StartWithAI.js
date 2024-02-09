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
async function* fetchGPTResponse(prompt, preset) {
  const { config, description } = presets[preset] || presets.default;
  console.log(prompt);

  try {
    const systemMessage = `You are a helpful assistant, focused on ${description}, When asked to write about a topic, use common knowledge and publicly available information to write an informative and engaging introduction. Do not request additional information or suggest creating a generic response.`;
    const userMessage = `${prompt}. Provide an introductory paragraph or opening sentences based on provided info.`;

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
      yield chunk.choices[0].delta.content; // Yield each chunk
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Function to generate a list of 5 topics based on the user's prompt
async function* fetchTopicList(prompt, preset = "default") {
  const { config, description } = presets[preset] || presets.default;
  const systemMessage = `You are a helpful assistant, focused to ${description}`;
  const userMessage = `${prompt}, list five key topics or questions related to this subject, presented in a neutral and informative manner, each in a few words, starting with a number.`;

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
      yield chunk.choices[0].delta.content; // Yield each chunk
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Router endpoint for streaming response
router.post("/", async (req, res) => {
  try {
    const { prompt, preset } = req.body;

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    for await (const chunk of fetchGPTResponse(prompt, preset)) {
      if (chunk) {
        res.write(JSON.stringify({ type: "intro", content: chunk }) + "\n");
      }
    }

    for await (const chunk of fetchTopicList(prompt, preset)) {
      if (chunk) {
        res.write(JSON.stringify({ type: "topics", content: chunk }) + "\n");
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
