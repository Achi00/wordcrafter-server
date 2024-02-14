import mongoose from "mongoose";
import { messageSchema } from "./messageSchema.js"; // Adjust the path as necessary

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messages: [messageSchema], // This now correctly uses the schema
  createdAt: {
    type: Date,
    default: Date.now,
  },
  newestSummary: {
    type: String,
    default: "", // Start with an empty summary
  },
  fullSummary: {
    type: String,
    default: "", // Start with an empty summary
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("chat", chatSchema);
