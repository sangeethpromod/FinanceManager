import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    uuid: { type: String, required: true },
    message: { type: String, required: true },
    parsedDetails: { type: Object },
    date: { type: String, required: true },
    createdAt: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 330); // UTC +5:30
        return now;
      },
      expires: 3 * 24 * 60 * 60 // TTL index, still in UTC
    }
  },
  { timestamps: true }
);

const Transaction = mongoose.model("PreTransaction", transactionSchema);

module.exports = Transaction;
