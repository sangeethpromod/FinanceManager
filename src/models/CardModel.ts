// src/models/financeModel.ts
import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  CardName: { type: String, required: true },
  ExpDate: { type: String, required: true },
  CVV: { type: String, required: true },
  CardNumber: { type: String, required: true },
  BillingCycle: { type: String, required: true },
  BillGenerationDate: { type: String },
  BillDueDate: { type: String, required: true },
  PaymentStatus: { type: String, required: true },
});

const Cards = mongoose.model("Cards", cardSchema);

module.exports = Cards;