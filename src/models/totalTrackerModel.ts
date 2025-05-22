import mongoose from "mongoose";

const trackerSchema = new mongoose.Schema({
  account: { type: String, required: true },
  periodType: { type: String, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  totalCredit: { type: Number, required: true },
  totalDebit: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

const Tracker = mongoose.model("Tracker", trackerSchema);

module.exports = Tracker;