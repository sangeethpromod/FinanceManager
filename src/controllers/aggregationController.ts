import { DateTime } from "luxon";
const FinanceAggregation = require("../models/financeModel");
const AggregationAnalyticsRun = require("../models/analyticsAggeragteModel");

type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const getStartEndDates = (period: Period): { start: Date; end: Date } => {
  const now = DateTime.utc(); // use UTC time

  let start: DateTime;
  let end: DateTime;

  switch (period) {
    case "daily":
      start = now.startOf("day");
      end = now.endOf("day");
      break;
    case "weekly":
      start = now.startOf("week");
      end = now.endOf("week");
      break;
    case "monthly":
      start = now.startOf("month");
      end = now.endOf("month");
      break;
    case "quarterly": {
      const quarter = Math.floor((now.month - 1) / 3) + 1;
      start = DateTime.utc(now.year, (quarter - 1) * 3 + 1, 1).startOf("day");
      end = start.plus({ months: 3 }).minus({ days: 1 }).endOf("day");
      break;
    }
    case "yearly":
      start = now.startOf("year");
      end = now.endOf("year");
      break;
    default:
      throw new Error("Invalid period");
  }

  return {
    start: start.toJSDate(), // already UTC
    end: end.toJSDate(),
  };
};

interface CategoryAggregation {
  _id: string;
  totalAmount: number;
}

interface AggregationCategory {
  category: string;
  totalAmount: number;
}

const runAggregation = async (period: Period): Promise<string> => {
  try {
    const { start, end } = getStartEndDates(period);

    const results: CategoryAggregation[] = await FinanceAggregation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const totalAmount: number = results.reduce(
      (acc: number, cur: CategoryAggregation) => acc + cur.totalAmount,
      0
    );

    const categories: AggregationCategory[] = results.map((item: CategoryAggregation) => ({
      category: item._id,
      totalAmount: item.totalAmount,
    }));

    await AggregationAnalyticsRun.updateOne(
      { date: DateTime.utc().startOf("day").toJSDate(), type: period },
      {
        $set: {
          totalAmount,
          categories,
        },
      },
      { upsert: true }
    );

    return `✅ Aggregation complete for ${period}. Total: ₹${totalAmount}. Categories: ${results.length}`;
  } catch (error) {
    console.error(`❌ Aggregation failed for ${period}:`, error);
    throw error;
  }
};

// Helper to get start/end for a specific date (daily)
const getStartEndForDate = (dateStr: string): { start: Date; end: Date } => {
  const dt = DateTime.fromISO(dateStr, { zone: "utc" });
  if (!dt.isValid) throw new Error("Invalid date format. Use YYYY-MM-DD");
  return {
    start: dt.startOf("day").toJSDate(),
    end: dt.endOf("day").toJSDate(),
  };
};

// Custom daily aggregation for a specific date
const aggregateDailyCustom = async (dateStr: string): Promise<string> => {
  try {
    const { start, end } = getStartEndForDate(dateStr);
    const results: CategoryAggregation[] = await FinanceAggregation.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", totalAmount: { $sum: { $toDouble: "$amount" } } } },
    ]);
    const totalAmount: number = results.reduce((acc, cur) => acc + cur.totalAmount, 0);
    const categories: AggregationCategory[] = results.map((item) => ({
      category: item._id,
      totalAmount: item.totalAmount,
    }));
    await AggregationAnalyticsRun.updateOne(
      { date: DateTime.fromISO(dateStr, { zone: "utc" }).startOf("day").toJSDate(), type: "daily" },
      { $set: { totalAmount, categories } },
      { upsert: true }
    );
    return `✅ Custom daily aggregation complete for ${dateStr}. Total: ₹${totalAmount}. Categories: ${results.length}`;
  } catch (error) {
    console.error(`❌ Custom daily aggregation failed for ${dateStr}:`, error);
    throw error;
  }
};

// Exporting individual functions to use in API + cron
module.exports = {
  runAggregation,
  aggregateDaily: () => runAggregation("daily"),
  aggregateWeekly: () => runAggregation("weekly"),
  aggregateMonthly: () => runAggregation("monthly"),
  aggregateQuarterly: () => runAggregation("quarterly"),
  aggregateYearly: () => runAggregation("yearly"),
  aggregateDailyCustom, // export the new function
};
