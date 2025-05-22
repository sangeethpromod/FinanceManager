const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    uuid: { type: String, required: true },
    message: { type: String, required: true },
    parsedDetails: { type: Object }, // Optional for now
    date: { type: String, required: true }, 
  },
  { timestamps: true }
);

const Transaction = mongoose.model("PreTransaction", transactionSchema);

module.exports = Transaction;
