// src/controllers/cardController.ts
import { Request, Response } from "express";
const Account = require("../models/accountModel");
const { updateBalance } = require("../services/accountService");

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


module.exports = {
  createAccount,
  updateAccountBalance,
};
