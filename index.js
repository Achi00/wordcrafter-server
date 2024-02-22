import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import "./config/passport-setup.js";
// writing AI assistants
import StartWithAIRoute from "./routes/writing/StartWithAI.js";
import ExpandWithAIRoute from "./routes/writing/ExpandWithAI.js";
import SummarizeWithAIRoute from "./routes/writing/SummarizeWithAI.js";
import SearchWithAIRoute from "./routes/research/SearchWithAI.js";
// auth
import authRoutes from "./routes/auth/AuthWithGoogle.js";
import logoutRoutes from "./routes/auth/Logout.js";
import usersRoutes from "./routes/users/GetUsers.js";
import session from "express-session";
import passport from "passport";
// mongodb
import connectDB from "./db/Database.js";
// chat AI assistants
import codeChatRouter from "./routes/chat/code/CodeChat.js";
import codeMessagesRouter from "./routes/chat/code/CodeMessages.js";
import GetCodeMessagesRouter from "./routes/chat/code/GetCodeMessages.js";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from your Next.js frontend
    credentials: true, // Allow cookies to be sent with requests
  })
);

const port = process.env.PORT || 8080;

connectDB();

app.use(express.json());

// Cookie session
app.use(
  session({
    secret: process.env.COOKIE_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Adjust as necessary
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// auth
app.use("/auth", authRoutes);

// logout
app.use("/auth/logout", logoutRoutes);

// get users info
app.use("/v1/users", usersRoutes);

// check user auth status
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    // isAuthenticated() is a Passport.js function that checks if the user is logged in
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

// chat AI assistants
app.use("/v1/codechat", codeChatRouter);
app.use("/v1/codemessages", codeMessagesRouter);
app.use("/v1/getcodemessages", GetCodeMessagesRouter);
// writing AI assistants
app.use("/v1/startwithai", StartWithAIRoute);
app.use("/v1/expandwithai", ExpandWithAIRoute);
app.use("/v1/summarizewithai", SummarizeWithAIRoute);
// search routes
app.use("/v1/searchwithai", SearchWithAIRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
