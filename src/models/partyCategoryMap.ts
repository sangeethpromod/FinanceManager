import mongoose from "mongoose";

const partyCategoryMapSchema = new mongoose.Schema({
  parties: [String], // Changed from 'party' to 'parties' to match the request body
  label: { type: String, required: true }, // e.g., "Trans Asia Cafe"
  category: { type: String, required: true }, // e.g., "Food"
  description: { type: String, default: "" }, // Optional notes, metadata
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

const PartyCategoryMap = mongoose.model("PartyCategoryMap", partyCategoryMapSchema);

module.exports = PartyCategoryMap;