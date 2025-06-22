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
  date: { type: String }, // Add date field
  time: { type: String }, // Add time field
  expiresAt: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setDate(now.getDate() + 14); // 14 days from now
      return now;
    },
    expires: 14 * 24 * 60 * 60 // 14 days in seconds
  }
}, { timestamps: true });

const Finance = mongoose.model("Finance", financeSchema);

module.exports = Finance;