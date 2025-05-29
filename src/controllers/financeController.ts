import { Request, Response } from "express";
const Finance = require("../models/financeModel"); // raw message model


const getAllFinanceTransactions = async (_req: Request, res: Response) => {
  try {
    // Sort by 'date' descending. Adjust field if your model uses 'createdAt' or similar.
    const financeTransactions = await Finance.find().sort({ date: -1 });
    return res.status(200).json(financeTransactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


module.exports = { getAllFinanceTransactions };