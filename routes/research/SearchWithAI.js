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
async function* analyzeHtml(text) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable assistant capable of deeply analyzing both technical and non-technical documentation, providing detailed explanations, comprehensive summaries, and applicable insights.",
        },
        {
          role: "user",
          content: `Please analyze this documentation in depth: ${text}. Focus on providing detailed code explanations, practical code examples, and expand on related concepts and real-world applications. Include any related external links or resources for further reading.`,
        },
        {
          role: "assistant",
          content:
            "Begin with a thorough explanation of the first code segment found in the documentation. Provide a step-by-step walkthrough and discuss its practical implications in depth.",
        },
        {
          role: "assistant",
          content:
            "Next, connect this code analysis to broader concepts in the documentation. Expand on how these concepts are implemented and their significance in real-world scenarios.",
        },
        {
          role: "assistant",
          content:
            "Discuss a specific real-world application of this information. Detail the implementation process and any potential challenges.",
        },
        {
          role: "assistant",
          content:
            "Identify and explain in detail three common mistakes related to these concepts and provide strategies to avoid them.",
        },
        {
          role: "assistant",
          content:
            "List detailed related links or external resources that can provide further in-depth information on the topics covered in the documentation.",
        },
        {
          role: "system",
          content:
            "Summarize the analysis, emphasizing the depth of information covered and inquire if the user needs further detailed information on any specific section or topic.",
        },
      ],
      max_tokens: 100,
      temperature: 0.4,
      frequency_penalty: 0.6,
      presence_penalty: 0.2,
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
    const { topic, text } = req.body;

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    for await (const chunk of analyzeHtml(text)) {
      if (chunk) {
        res.write(
          JSON.stringify({ type: "analyzedHtml", content: chunk }) + "\n"
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
