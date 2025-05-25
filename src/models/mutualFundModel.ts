import mongoose from "mongoose";

const mfSchema = new mongoose.Schema(
  {
    fundID: { type: String, required: true, unique: true },           // e.g., "120828"
    fundName: { type: String, required: true },
    fundNav: { type: String },           // Latest NAV (optional on create)

    monthlySip: { type: String, required: true },       // e.g., "5000"
    sipDeductionDate: { type: String, required: true },           // e.g., "5"
    sipStartDate: { type: String, required: true },            // Format: YYYY-MM-DD

    totalAmountInvested: { type: String, default: "0" },     // Total Rs invested till now
    totalUnitsHeld: { type: Number, default: 0 },     // Units bought till now
    currentAmount: { type: String, default: "0" },     // totalUnitsHeld * latest NAV

    assetclass: { type: String, required: true },     // Equity, Debt etc.
    fundtype: { type: String, required: true },       // Direct, Regular
    fundway: { type: String, required: true },        // Lumpsum / SIP
    platform: { type: String },                       // Groww, Zerodha, etc.

    lastNavUpdated: { type: Date },    
    lastSipExecutedDate: { type: Date },                // Latest NAV fetched time
  },
  { timestamps: true }
);

const MutualFund = mongoose.model("MutualFund", mfSchema);
export default MutualFund;
