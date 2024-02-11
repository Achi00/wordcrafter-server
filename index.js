import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import "./config/passport-setup.js";
import StartWithAIRoute from "./routes/writing/StartWithAI.js";
import ExpandWithAIRoute from "./routes/writing/ExpandWithAI.js";
import SummarizeWithAIRoute from "./routes/writing/SummarizeWithAI.js";
import SearchWithAIRoute from "./routes/research/SearchWithAI.js";
import authRoutes from "./routes/auth/AuthWithGoogle.js";
import logoutRoutes from "./routes/auth/Logout.js";
import usersRoutes from "./routes/users/GetUsers.js";
// import cookieSession from "cookie-session";
import session from "express-session";
import passport from "passport";
import connectDB from "./db/Database.js";

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
    secret: process.env.COOKIE_KEY, // Secret used to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      secure: process.env.NODE_ENV === "production", // Secure cookies in production (requires HTTPS)
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
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
app.use("v1/users", usersRoutes);

// check user auth status
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    // isAuthenticated() is a Passport.js function that checks if the user is logged in
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

// Use the chat route
app.use("/v1/startwithai", StartWithAIRoute);
app.use("/v1/expandwithai", ExpandWithAIRoute);
app.use("/v1/summarizewithai", SummarizeWithAIRoute);
// search routes
app.use("/v1/searchwithai", SearchWithAIRoute);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
