import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  nav: { type: Number, required: true },
  units: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['SIP', 'LUMPSUM', 'INITIAL'], 
    required: true 
  },
  sipMonth: { type: String },
}, { timestamps: true });

const mfSchema = new mongoose.Schema({
  fundID: { type: String, required: true, unique: true },
  fundName: { type: String, required: true },
  fundNav: { type: String, default: "0" },

  monthlySip: { type: String, required: true },
  sipDeductionDate: { type: String, required: true },
  sipStartDate: { type: String, required: true },
  sipStatus: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE', 'PAUSED'], 
    default: 'ACTIVE' 
  },

  totalAmountInvested: { type: String, default: "0" },
  currentinvestment: { type: String, default: "0" },
  totalUnitsHeld: { type: Number, default: 0 },
  currentAmount: { type: String, default: "0" },

  assetclass: { type: String, required: true },
  fundtype: { type: String, required: true },
  fundway: { type: String, required: true },
  platform: { type: String },
  yesterdayAmount: {type: Number,default: 0},

  lastNavUpdated: { type: Date },
  lastSipExecutedDate: { type: Date },
  lastSipExecutedMonth: { type: String },
  

  transactions: [transactionSchema],
}, { timestamps: true });

const MutualFund = mongoose.model("MutualFund", mfSchema);
export default MutualFund;
