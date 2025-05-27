import { Request, Response } from "express";
const PreTransaction = require("../models/txnModel");
const { v4: uuidv4 } = require("uuid");

// Helper to format date as dd/mm/yyyy
function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0"); // zero-based month
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Create a new transaction
const createTransaction = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const newTxn = new PreTransaction({
      uuid: uuidv4(),
      message,
      date: formatDate(new Date()), // add formatted date here
    });

    await newTxn.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving transaction:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get all transactions
const getAllTransactions = async (_req: Request, res: Response) => {
  try {
    const FindTransactions = await PreTransaction.find();
    return res.status(200).json(FindTransactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// Delete transaction by ID
// const deleteTransactionById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const txn = await Transaction.findByIdAndDelete(id);
//     if (!txn) {
//       return res.status(404).json({ error: "Transaction not found" });
//     }

//     return res.status(200).json({ success: true });
//   } catch (err) {
//     console.error("Error deleting transaction:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

module.exports = {
  createTransaction,
  getAllTransactions,
//   deleteTransactionById,
};
