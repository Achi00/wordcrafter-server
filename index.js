import dotenv from "dotenv";
dotenv.config();

import express from "express";
import chatRoute from "./routes/chat.js";

const app = express();
console.log(process.env.OPENAI_API_KEY);

const port = process.env.PORT || 8080;

app.use(express.json());

// Use the chat route
app.use("/chat", chatRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
