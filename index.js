import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import express from "express";
import StartWithAIRoute from "./routes/writing/StartWithAI.js";
import ExpandWithAIRoute from "./routes/writing/ExpandWithAI.js";
import SummarizeWithAIRoute from "./routes/writing/SummarizeWithAI.js";
import SearchWithAIRoute from "./routes/research/SearchWithAI.js";

const app = express();
app.use(cors());

const port = process.env.PORT || 8080;

app.use(express.json());

// Use the chat route
app.use("/v1/startwithai", StartWithAIRoute);
app.use("/v1/expandwithai", ExpandWithAIRoute);
app.use("/v1/summarizewithai", SummarizeWithAIRoute);
// search routes
app.use("/v1/searchwithai", SearchWithAIRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
