// src/models/financeModel.ts
import mongoose from "mongoose";

const financeSchema = new mongoose.Schema({
  uuid: { type: String, required: true },
  amount: { type: String, required: true },
  account: { type: String, required: true },
  party: { type: String, required: true },
  category: { type: String, required: true },
  label: { type: String, required: false },
  type: { type: String, required: true },
  note: { type: String },
  comment: { type: String },
}, { timestamps: true });

const Finance = mongoose.model("Finance", financeSchema);

module.exports = Finance;