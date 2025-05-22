// src/models/financeModel.ts
import mongoose from "mongoose";

const financeSchema = new mongoose.Schema({
  uuid: { type: String, required: true },
  amount: { type: String, required: true },
  account: { type: String, required: true },
  party: { type: String, required: true },
  category: { type: String, required: true },
  note: { type: String },
  comment: { type: String },
});

const Finance = mongoose.model("Finance", financeSchema);

module.exports = Finance;