const mongoose = require("mongoose");

const categoryBreakdownSchema = new mongoose.Schema({
  category: { type: String, required: true },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const aggregationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    required: true,
  },
  totalAmount: { type: Number, required: true },
  categories: [categoryBreakdownSchema],
}, {
  timestamps: true,
});

aggregationSchema.index({ type: 1, date: 1 }, { unique: true });

const AggregationAnalytics = mongoose.model("AggregationAnalytics", aggregationSchema);

module.exports = AggregationAnalytics;