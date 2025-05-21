import { Request, Response } from "express";
import Transaction from "../models/txnModel";

// Create a new transaction
const createTransaction = async (req: Request, res: Response) => {
  try {
    const {message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const newTxn = new Transaction({message });
    await newTxn.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving transaction:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get all transactions
// const getTransactions = async (req: Request, res: Response) => {
//   try {
//     const transactions = await Transaction.find();
//     return res.status(200).json(transactions);
//   } catch (err) {
//     console.error("Error fetching transactions:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

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
//   getTransactions,
//   deleteTransactionById,
};
