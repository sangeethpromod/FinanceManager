import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    parsedDetails: { type: Object }, // Optional for now
  },
  { timestamps: true }
);

const Transaction = mongoose.model("PreTransaction", transactionSchema);

export default Transaction;
