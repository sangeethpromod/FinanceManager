import { Request, Response } from "express";
const AggregationAnalytics = require("../models/analyticsAggeragteModel");
const Targets = require("../models/targetModel");

// GET daily actual vs target
const getDailyVsTarget = async (_req: Request, res: Response) => {
  try {
    const dailyAggregates = await AggregationAnalytics.find({ type: "daily" }).sort({ date: 1 });
    const targetDoc = await Targets.findOne().sort({ _id: -1 });

    if (!targetDoc) {
      return res.status(404).json({ error: "Target data not found" });
    }

    const response = dailyAggregates.map((entry: any) => ({
      date: entry.formattedDate,                  // e.g., "24 May 2025"
      actual: entry.totalAmount,                  // e.g., 5400
      target: parseFloat(targetDoc.dailyTarget),  // from target doc (string to number)
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Error in getDailyVsTarget:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getDailyVsTarget,
};
