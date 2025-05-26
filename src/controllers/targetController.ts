// src/controllers/cardController.ts
import { Request, Response } from "express";
const Targets = require("../models/targetModel");
const AggregationAnalytics = require("../models/analyticsAggeragteModel");

const createTarget = async (req: Request, res: Response) => {
  try {
    const {
      dailyTarget,
      monthlyTarget,
      weeklyTarget,
      quarterlyTarget,
      yearlyTarget,
    } = req.body;

    // Mandatory field check
    if (
      !dailyTarget ||
      !weeklyTarget ||
      !monthlyTarget ||
      !quarterlyTarget ||
      !yearlyTarget
    ) {
      return res.status(400).json({ error: "Missing required card details" });
    }

    const newCard = new Targets({
      dailyTarget,
      weeklyTarget,
      monthlyTarget,
      quarterlyTarget,
      yearlyTarget,
    });

    await newCard.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving card:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const getAllTargets = async (req: Request, res: Response) => {
  try {
    const FindTargets = await Targets.find();
    return res.status(200).json(FindTargets);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



const getDailyTargetComparison= async (req: Request, res: Response) => {
  const { period = "daily" } = req.query;

  try {
    const targetDoc = await Targets.findOne().sort({ createdAt: -1 });
    if (!targetDoc) {
      return res.status(404).json({ error: "No target set." });
    }

    const periodMap = {
      daily: { unit: "day", total: 30 },
      weekly: { unit: "week", total: 12 },
      monthly: { unit: "month", total: 12 },
      quarterly: { unit: "quarter", total: 4 },
      yearly: { unit: "year", total: 5 },
    };

    const config = periodMap[period as string];
    if (!config) return res.status(400).json({ error: "Invalid period." });

    const today = new Date();
    const labels = [];

    for (let i = config.total - 1; i >= 0; i--) {
      const date = new Date(today);

      switch (config.unit) {
        case "day":
          date.setDate(today.getDate() - i);
          date.setHours(0, 0, 0, 0);
          break;
        case "week":
          const startOfWeek = new Date(date);
          startOfWeek.setDate(today.getDate() - today.getDay() - (i * 7));
          startOfWeek.setHours(0, 0, 0, 0);
          date.setTime(startOfWeek.getTime());
          break;
        case "month":
          date.setMonth(today.getMonth() - i);
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          break;
        case "quarter":
          const quarter = Math.floor(today.getMonth() / 3);
          const quarterStart = new Date(today.getFullYear(), (quarter - i) * 3, 1);
          date.setTime(quarterStart.getTime());
          break;
        case "year":
          date.setFullYear(today.getFullYear() - i);
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          break;
      }

      labels.push(new Date(date));
    }

    const targetValue = {
      daily: parseFloat(targetDoc.dailyTarget),
      weekly: parseFloat(targetDoc.weeklyTarget),
      monthly: parseFloat(targetDoc.monthlyTarget),
      quarterly: parseFloat(targetDoc.quarterlyTarget),
      yearly: parseFloat(targetDoc.yearlyTarget),
    }[period];

    const analytics = await AggregationAnalytics.find({
      type: period,
      date: { $in: labels },
    });

    const result = labels.map((labelDate) => {
      const record = analytics.find(a => new Date(a.date).getTime() === labelDate.getTime());

      const actualAmount = record?.totalAmount || 0;
      return {
        date: labelDate.toISOString().split("T")[0],
        targetAmount: targetValue,
        actualAmount,
        difference: actualAmount - targetValue
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Target comparison error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createTarget, getAllTargets, getDailyTargetComparison };
