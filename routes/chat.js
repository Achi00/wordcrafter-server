import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import { presets } from "../utils/index.js";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

// Function to handle the OpenAI API request
async function fetchGPTResponse(prompt, preset) {
  const { config, description } = presets[preset] || presets.default;
  try {
    const systemMessage = `You are a helpful assistant, focused on ${description}`;
    const userMessage = `${prompt}. Provide an introductory paragraph or a few opening sentences based on the above focus.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      ...config,
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of completion) {
      fullResponse += chunk.choices[0].delta.content;
      console.log(fullResponse);
    }

    return fullResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Function to generate a list of 5 topics based on the user's prompt
async function fetchTopicList(prompt, preset = "default") {
  const { config, description } = presets[preset] || presets.default;
  const systemMessage = `You are a helpful assistant, focused on ${description}`;
  const userMessage = `${prompt} List five key topics or questions to consider when writing about this`;

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

    let fullResponse = "";
    for await (const chunk of completion) {
      fullResponse += chunk.choices[0].delta.content;
      console.log(fullResponse);
    }

    // Process the complete response here
    const topicsList = fullResponse
      .split("\n")
      .filter((topic) => topic.trim() !== "" && !topic.startsWith("undefined"))
      .slice(0, 5); // Limit to 5 topics

    return topicsList;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

router.post("/", async (req, res) => {
  try {
    const { prompt, preset } = req.body;
    const contentResponse = await fetchGPTResponse(prompt, preset);
    const topics = await fetchTopicList(prompt, preset);

    if (contentResponse && topics) {
      res.json({ content: contentResponse, topics });
    } else {
      throw new Error("Incomplete response");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
