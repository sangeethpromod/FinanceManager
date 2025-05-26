
import mongoose from "mongoose";

const partyCategoryMapSchema = new mongoose.Schema({
  party: { type: String, required: true, unique: true },
  label: { type: String, required: true }, // e.g., "LunchSpot"
  category: { type: String, required: true }, // e.g., "Food"
}, { timestamps: true });

const PartyCategoryMap = mongoose.model("PartyCategoryMap", partyCategoryMapSchema);

module.exports = PartyCategoryMap;
