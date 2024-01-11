import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import express from "express";
import StartWithAIRoute from "./routes/StartWithAI.js";

const app = express();
app.use(cors());

const port = process.env.PORT || 8080;

app.use(express.json());

// Use the chat route
app.use("/startwithai", StartWithAIRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
