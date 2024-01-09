import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

// Function to handle the OpenAI API request
async function fetchGPTResponse(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of completion) {
      fullResponse += chunk.choices[0].delta.content;
      console.log(fullResponse);
    }

    return fullResponse;
  } catch (error) {
    throw error;
  }
}

router.post("/", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    const response = await fetchGPTResponse(userPrompt);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
