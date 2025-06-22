import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
  billName: { type: String, required: true },
  billAmount: { type: Number, required: true },
  billStatus: { type: String, required: true },
});

const EmiSchema = new mongoose.Schema({
  emiName: { type: String, required: true },
  monthlyAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  emiStartDate:{type: String, required:true },
  tenure:{type: Number, required:true },
  pendingAmount: { type: Number, required: true },
  payPercentage: { type: Number, required: true }, // e.g. 75 for 75%
  deductionDate: { type: String, required: true },
});

const SubSchema = new mongoose.Schema({
  subName: { type: String, required: true },
  subAmount: { type: Number, required: true },
  subStatus: { type: String, required: true },
  deductionDate: { type: String, required: true },
});

const AutoPayManagerSchema = new mongoose.Schema({
  bills: [BillSchema],
  emis: [EmiSchema],
  subs: [SubSchema],
}, { timestamps: true });

const AutoPayManager = mongoose.model("AutoPayManager", AutoPayManagerSchema);

module.exports = AutoPayManager;
