import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String },
  createdAt: { type: Date, default: Date.now },
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
});

export default mongoose.model("user", userSchema);
