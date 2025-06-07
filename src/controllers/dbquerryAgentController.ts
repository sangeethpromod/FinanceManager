import { Request, Response } from "express";
const PreTransaction = require("../models/txnModel"); // raw message model
const { DataExtractor_Agent } = require("../agent/messageQueryAgent");

// Helper to get today’s date string in dd/mm/yyyy (or adjust if your DB uses ISO)
function getTodayDate() {
  const today = new Date();
  const d = today.getDate().toString().padStart(2, "0");
  const m = (today.getMonth() + 1).toString().padStart(2, "0");
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;  // adjust if your date format is different in DB
}

const importTransaction = async (_req: Request, res: Response) => {
  try {
    const today = getTodayDate();

    // Fetch only today's transactions
    const pendingMessages = await PreTransaction.find({ date: today });

    if (!pendingMessages.length) {
      return res.status(200).json({ message: "No transactions to process for today" });
    }

    // Process only transactions not already in Finance handled inside processTransactions
    await DataExtractor_Agent(pendingMessages);

    return res.status(200).json({ success: true, processed: pendingMessages.length });
  } catch (err) {
    console.error("Error processing transactions:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get all transactions, sorted by latest
const getAllTransactions = async (_req: Request, res: Response) => {
  try {
    // Sort by 'date' descending. Adjust field if your model uses 'createdAt' or similar.
    const transactions = await PreTransaction.find().sort({ date: -1 });
    return res.status(200).json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { importTransaction, getAllTransactions };