// src/models/financeModel.ts
import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  accountid: { type: String, required: true },
  intialBalance: { type: String, required: true },
  currentBalance: { type: String, required: true },
  accountName: { type: String, required: true },
  fetcherName: { type: String, required: true },
  accountType: { type: String, required: true },
  lastupdate: { type: Date, default: Date.now },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;