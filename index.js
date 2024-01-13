import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import express from "express";
import StartWithAIRoute from "./routes/StartWithAI.js";
import ExpandWithAIRoute from "./routes/ExpandWithAI.js";
import SummarizeWithAIRoute from "./routes/SummarizeWithAI.js";

const app = express();
app.use(cors());

const port = process.env.PORT || 8080;

app.use(express.json());

// Use the chat route
app.use("/startwithai", StartWithAIRoute);
app.use("/expandwithai", ExpandWithAIRoute);
app.use("/summarizewithai", SummarizeWithAIRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
