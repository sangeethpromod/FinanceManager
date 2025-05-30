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
  date: { type: String, required: true },
  time: { type: String, required: true },
  note: { type: String },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 14 },
}, { timestamps: true });

const Finance = mongoose.model("Finance", financeSchema);

module.exports = Finance;