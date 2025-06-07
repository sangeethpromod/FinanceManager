// src/models/financeModel.ts
import mongoose from "mongoose";

const TargetSchema = new mongoose.Schema({
  dailyTarget: { type: String, required: true },
  monthlyTarget: { type: String, required: true },
  weeklyTarget: { type: String, required: true },
  quarterlyTarget: { type: String, required: true },
  yearlyTarget: { type: String, required: true },
});

const Targets = mongoose.model("Targets", TargetSchema);

module.exports = Targets;