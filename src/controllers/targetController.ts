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

const getAllTargets = async (_req: Request, res: Response) => {
  try {
    const FindTargets = await Targets.find();
    return res.status(200).json(FindTargets);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return res.status(500).json({ error: "Server error" });
  }
};



// Define the AggregationAnalyticsDoc type based on your analytics model structure
type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

type AggregationAnalyticsDoc = {
  date: Date | string;
  totalAmount: number;
  category: string;
  type: string;
  [key: string]: any;
};

type ComparisonResult = {
  date: string;
  targetAmount: number;
  actualAmount: number;
  difference: number;
  percentageOfTarget: number;
  status: 'under' | 'over' | 'met';
};

const getTargetComparison = async (req: Request, res: Response) => {
  try {
    // Get period from query params, default to 'daily'
    let period = req.query.period ?? "daily";
    
    // Handle array case and ensure it's a valid string
    if (Array.isArray(period)) {
      period = period[0];
    }
    if (typeof period !== "string") {
      period = "daily";
    }

    // Validate period
    const validPeriods: Period[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];
    if (!validPeriods.includes(period as Period)) {
      return res.status(400).json({ 
        error: "Invalid period. Must be one of: daily, weekly, monthly, quarterly, yearly" 
      });
    }

    const periodType = period as Period;

    // Get the latest target configuration
    const targetDoc = await Targets.findOne().sort({ createdAt: -1 });
    if (!targetDoc) {
      return res.status(404).json({ error: "No target configuration found. Please set targets first." });
    }

    // Get target value for the specified period
    const targetValue = getTargetValue(targetDoc, periodType);

    // Get date ranges for the comparison
    const dateRanges = getDateRanges(periodType);

    // Get aggregated spending data for all categories in the date ranges
    const spendingData = await getSpendingData(periodType, dateRanges);

    // Create comparison results
    const comparisonResults = createComparisonResults(dateRanges, spendingData, targetValue);

    return res.status(200).json({
      period: periodType,
      targetAmount: targetValue,
      results: comparisonResults,
      summary: createSummary(comparisonResults)
    });

  } catch (err) {
    console.error("Target comparison error:", err);
    return res.status(500).json({ error: "Server error while comparing targets" });
  }
};

// Helper function to get target value based on period
function getTargetValue(targetDoc: any, period: Period): number {
  const targetMap = {
    daily: parseFloat(targetDoc.dailyTarget || 0),
    weekly: parseFloat(targetDoc.weeklyTarget || 0),
    monthly: parseFloat(targetDoc.monthlyTarget || 0),
    quarterly: parseFloat(targetDoc.quarterlyTarget || 0),
    yearly: parseFloat(targetDoc.yearlyTarget || 0),
  };
  
  return targetMap[period];
}

// Helper function to generate date ranges for comparison
function getDateRanges(period: Period): Date[] {
  const today = new Date();
  const ranges: Date[] = [];
  
  const periodConfig = {
    daily: { count: 30, unit: 'day' },
    weekly: { count: 12, unit: 'week' },
    monthly: { count: 12, unit: 'month' },
    quarterly: { count: 4, unit: 'quarter' },
    yearly: { count: 5, unit: 'year' }
  };

  const config = periodConfig[period];

  for (let i = config.count - 1; i >= 0; i--) {
    const date = new Date(today);

    switch (config.unit) {
      case 'day':
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() - (i * 7));
        startOfWeek.setHours(0, 0, 0, 0);
        date.setTime(startOfWeek.getTime());
        break;
      case 'month':
        date.setMonth(today.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const targetQuarter = currentQuarter - i;
        date.setFullYear(today.getFullYear());
        date.setMonth(targetQuarter * 3);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'year':
        date.setFullYear(today.getFullYear() - i);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        break;
    }

    ranges.push(new Date(date));
  }

  return ranges;
}

// Helper function to get spending data from aggregation
async function getSpendingData(period: Period, dateRanges: Date[]): Promise<AggregationAnalyticsDoc[]> {
  return await AggregationAnalytics.find({
    type: period,
    date: { $in: dateRanges }
  });
}

// Helper function to create comparison results
function createComparisonResults(
  dateRanges: Date[], 
  spendingData: AggregationAnalyticsDoc[], 
  targetValue: number
): ComparisonResult[] {
  return dateRanges.map((dateRange) => {
    // Sum all spending for this date across all categories
    const totalSpending = spendingData
      .filter(record => new Date(record.date).getTime() === dateRange.getTime())
      .reduce((sum, record) => sum + record.totalAmount, 0);

    const difference = totalSpending - targetValue;
    const percentageOfTarget = targetValue > 0 ? (totalSpending / targetValue) * 100 : 0;
    
    let status: 'under' | 'over' | 'met' = 'under';
    if (Math.abs(difference) < 0.01) { // Account for floating point precision
      status = 'met';
    } else if (difference > 0) {
      status = 'over';
    }

    return {
      date: dateRange.toISOString().split('T')[0],
      targetAmount: targetValue,
      actualAmount: totalSpending,
      difference: difference,
      percentageOfTarget: Math.round(percentageOfTarget * 100) / 100,
      status: status
    };
  });
}

// Helper function to create summary statistics
function createSummary(results: ComparisonResult[]) {
  const totalPeriods = results.length;
  const periodsOverTarget = results.filter(r => r.status === 'over').length;
  const periodsUnderTarget = results.filter(r => r.status === 'under').length;
  const periodsMetTarget = results.filter(r => r.status === 'met').length;
  
  const avgActualAmount = results.reduce((sum, r) => sum + r.actualAmount, 0) / totalPeriods;
  const avgTargetAmount = results.length > 0 ? results[0].targetAmount : 0;
  
  return {
    totalPeriods,
    periodsOverTarget,
    periodsUnderTarget, 
    periodsMetTarget,
    averageActualAmount: Math.round(avgActualAmount * 100) / 100,
    averageTargetAmount: avgTargetAmount,
    overallPerformance: avgTargetAmount > 0 ? Math.round((avgActualAmount / avgTargetAmount) * 100) : 0
  };
}

// Additional API for getting current period status
const getCurrentPeriodStatus = async (req: Request, res: Response) => {
  try {
    let period = req.query.period ?? "daily";
    
    if (Array.isArray(period)) period = period[0];
    if (typeof period !== "string") period = "daily";
    
    const validPeriods: Period[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];
    if (!validPeriods.includes(period as Period)) {
      return res.status(400).json({ error: "Invalid period" });
    }

    const periodType = period as Period;
    
    // Get current period's start date
    const currentPeriodStart = getCurrentPeriodStart(periodType);
    
    const targetDoc = await Targets.findOne().sort({ createdAt: -1 });
    if (!targetDoc) {
      return res.status(404).json({ error: "No target set" });
    }

    const targetValue = getTargetValue(targetDoc, periodType);
    
    // Get current spending
    const currentSpending = await AggregationAnalytics.find({
      type: periodType,
      date: currentPeriodStart
    });

    const totalCurrentSpending: number = (currentSpending as AggregationAnalyticsDoc[]).reduce(
      (sum: number, record: AggregationAnalyticsDoc) => sum + record.totalAmount,
      0
    );
    const difference = totalCurrentSpending - targetValue;
    const percentageOfTarget = targetValue > 0 ? (totalCurrentSpending / targetValue) * 100 : 0;

    return res.status(200).json({
      period: periodType,
      currentPeriodStart: currentPeriodStart.toISOString().split('T')[0],
      targetAmount: targetValue,
      currentSpending: totalCurrentSpending,
      difference: difference,
      percentageOfTarget: Math.round(percentageOfTarget * 100) / 100,
      remainingBudget: targetValue - totalCurrentSpending,
      status: difference > 0 ? 'over' : difference < 0 ? 'under' : 'met'
    });

  } catch (err) {
    console.error("Current period status error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

function getCurrentPeriodStart(period: Period): Date {
  const now = new Date();
  
  switch (period) {
    case 'daily':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'weekly':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    case 'yearly':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.setHours(0, 0, 0, 0));
  }
}


module.exports = { createTarget, getAllTargets, getCurrentPeriodStatus, getTargetComparison };
