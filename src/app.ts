import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import transactionRoutes from "./routes/routes";
const startTxnWatcher = require("./listeners/txnWatcher");





dotenv.config();
const app = express();

// CORS: Allow frontend on port 3000
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Routes
app.use("/finance", transactionRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
// After mongoose.connect(...)
  startTxnWatcher();
  // Initialize cron jobs after server starts
  require("./crone/aggregateCrone");
});
