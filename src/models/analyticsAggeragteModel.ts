import mongoose from "mongoose";

const aggregationSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // This will represent the date for daily, start of week/month/etc.
  type: {
    type: String,
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    required: true,
  },
  category: { type: String, required: true }, // e.g. Food, Travel
  totalAmount: { type: Number, required: true },
}, {
  timestamps: true,
  index: { type: 1, date: 1, category: 1 }, // for fast lookup
});

const AggregationAnalytics = mongoose.model("AggregationAnalytics", aggregationSchema);

module.exports = AggregationAnalytics;