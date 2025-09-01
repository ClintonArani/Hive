// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import { ENV } from "./configs/env.js";
import { clerkMiddleware } from "@clerk/express";

// Routers
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoute.js";
import messageRoute from "./routes/messageRoutes.js";
import commentRouter from "./routes/commentRoutes.js";

const app = express();

// ----------------------------
// Middleware
// ----------------------------
app.use(express.json());

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:5173",            // local frontend
  "https://hive-orpin.vercel.app"     // production frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Clerk auth middleware
app.use(clerkMiddleware());

// ----------------------------
// Routes
// ----------------------------
app.get("/", (req, res) => res.send("✅ Server is running"));
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/message", messageRoute);
app.use("/api/comments", commentRouter);

// ----------------------------
// Error handler
// ----------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
});

// ----------------------------
// Start Server
// ----------------------------
const startServer = async () => {
  try {
    await connectDB();

    // On Vercel, don't call app.listen() → Vercel uses serverless functions
    // On Render/Railway/Heroku, we start a real server
    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.PORT, () => {
        console.log(`🚀 Server running locally on port ${ENV.PORT}`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Export app for serverless/production environments (Vercel needs this)
export default app;
