import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { serve } from 'inngest/express';
import { inngest, functions } from "./inngest/index.js"
import { ENV } from "./configs/env.js";
import { clerkMiddleware } from '@clerk/express'
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoute.js";
import messageRoute from "./routes/messageRoutes.js";
import commentRouter from "./routes/commentRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

//middleware 
app.use(clerkMiddleware())

app.get("/", (req, res) => res.send("✅ Server is running"));
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRoute)
app.use('/api/comments', commentRouter)


//error handling middleware
app.use((err, req, res, next)=>{
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: err.message || "Internal Server Error",
  })
})



// Connect to DB, then start server
const startServer = async () => {
  try {
    await connectDB()
    //listen for local development
    if (ENV.NODE_ENV !== 'production') {
      app.listen(ENV.PORT, () => {
        console.log(`🚀 Server running on port ${ENV.PORT}`);
        
      })
    }
  } catch (error) {
      console.error("Failed to start server:", error)
      process.exit(1)
  }
  
};

startServer();
export default app
