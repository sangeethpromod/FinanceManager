const mongoose = require("mongoose");

const categoryBreakdownSchema = new mongoose.Schema({
  category: { type: String, required: true },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const aggregationSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // Still store original date
  formattedDate: { type: String },      // E.g., "24 May 2025"
  type: {
    type: String,
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    required: true,
  },
  totalAmount: { type: Number, required: true },
  categories: [categoryBreakdownSchema],

  // New fields for clarity and indexing
  week: { type: String },     // e.g., "Week 21"
  month: { type: String },    // e.g., "May"
  quarter: { type: String },  // e.g., "Q2"
  year: { type: Number },     // e.g., 2025
}, {
  timestamps: true,
});

aggregationSchema.index({ type: 1, date: 1 }, { unique: true });

const AggregationAnalytics = mongoose.model("AggregationAnalytics", aggregationSchema);
module.exports = AggregationAnalytics;


