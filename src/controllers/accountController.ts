// src/controllers/cardController.ts
import { Request, Response } from "express";
const Account = require("../models/accountModel");
const { updateBalance } = require("../services/accountService");
const Finance = require("../models/financeModel");
import { v4 as uuidv4 } from "uuid";

// Create a new account
const createAccount = async (req: Request, res: Response) => {
  try {
    const {
      accountid,
      intialBalance,
      currentBalance,
      accountName,
      accountType,
      lastupdate,
      fetcherName,
    } = req.body;

    if (
      !accountid ||
      !intialBalance ||
      !currentBalance ||
      !accountName ||
      !accountType ||
      !lastupdate ||
      !fetcherName
    ) {
      return res.status(400).json({ error: "Missing required account details" });
    }

    const newAccount = new Account({
      accountid,
      intialBalance,
      currentBalance,
      accountName,
      accountType,
      lastupdate,
      fetcherName,
    });

    await newAccount.save();
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving account:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// Update balance based on Finance transaction
interface UpdateAccountBalanceRequestBody {
    account: string;
    amount: number;
    type: string;
}

const updateAccountBalance = async (
    req: Request<{}, {}, UpdateAccountBalanceRequestBody>,
    res: Response
) => {
    try {
        const { account, amount, type } = req.body;
        const updatedBalance = await updateBalance(account, amount, type);
        return res.status(200).json({ success: true, updatedBalance });
    } catch (err: any) {
        console.error("Error updating account balance:", err);
        return res.status(500).json({ error: err.message });
    }
};

const addManualTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, account, party, category, label, type, note, comment } = req.body;

    if (!amount || !account || !party || !category || !type) {
      return res.status(400).json({ error: "Missing required transaction details" });
    }

    // Step 1: Validate account exists FIRST
    const accountDoc = await Account.findOne({ fetcherName: account });
    if (!accountDoc) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Step 2: Validate transaction type
    if (type !== "DEBIT" && type !== "CREDIT") {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    // Step 3: Calculate new balance
    const amt = parseFloat(amount);
    if (isNaN(amt)) {
      return res.status(400).json({ error: "Invalid amount format" });
    }

    let newBalance = parseFloat(accountDoc.currentBalance);
    if (type === "DEBIT") {
      newBalance -= amt;
    } else {
      newBalance += amt;
    }

    // Step 4: Create and save transaction (only after all validations pass)
    const transaction = new Finance({
      uuid: uuidv4(),
      amount,
      account,
      party,
      category,
      label,
      type,
      note,
      comment
    });

    await transaction.save();

    // Step 5: Update account balance
    accountDoc.currentBalance = newBalance.toFixed(2);
    accountDoc.lastupdate = new Date();
    await accountDoc.save();

    return res.status(201).json({
      success: true,
      transaction,
      updatedBalance: accountDoc.currentBalance
    });

  } catch (err: any) {
    console.error("Error in manual transaction:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get all accounts
const getAllAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = await Account.find();
    return res.status(200).json(accounts);
  } catch (err: any) {
    console.error("Error fetching accounts:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createAccount,
  updateAccountBalance,
  addManualTransaction,
  getAllAccounts,
};
