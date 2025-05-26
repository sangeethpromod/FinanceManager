import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import transactionRoutes from "./routes/routes";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/finance", transactionRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
  
  // Initialize cron jobs after server starts
  require("./crone/aggregateCrone");
});