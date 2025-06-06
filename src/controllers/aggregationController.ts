import { DateTime } from "luxon";
const FinanceAggregation = require("../models/financeModel");
const AggregationAnalyticsRun = require("../models/analyticsAggeragteModel");

type Period = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

interface CategoryAggregation {
  _id: string;
  creditAmount: number;
  debitAmount: number;
}

interface AggregationCategory {
  category: string;
  creditAmount: number;
  debitAmount: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

const getStartEndDates = (period: Period): { range: DateRange; labelDate: DateTime } => {
  const now = DateTime.utc();

  let labelDate: DateTime;
  let start: DateTime;
  let end: DateTime;

  switch (period) {
    case "daily":
      labelDate = now.minus({ days: 1 });
      start = labelDate.startOf("day");
      end = labelDate.endOf("day");
      break;
    case "weekly":
      labelDate = now.minus({ weeks: 1 }).startOf("week");
      start = labelDate;
      end = labelDate.endOf("week");
      break;
    case "monthly":
      labelDate = now.minus({ months: 1 }).startOf("month");
      start = labelDate;
      end = labelDate.endOf("month");
      break;
    case "quarterly": {
      const current = now.minus({ months: 3 });
      const quarter = Math.floor((current.month - 1) / 3) + 1;
      const monthStart = (quarter - 1) * 3 + 1;
      labelDate = DateTime.utc(current.year, monthStart, 1);
      start = labelDate;
      end = labelDate.plus({ months: 3 }).minus({ days: 1 }).endOf("day");
      break;
    }
    case "yearly":
      labelDate = now.minus({ years: 1 }).startOf("year");
      start = labelDate;
      end = labelDate.endOf("year");
      break;
    default:
      throw new Error("Invalid period");
  }

  return {
    range: { start: start.toJSDate(), end: end.toJSDate() },
    labelDate,
  };
};

const buildMetaFields = (labelDate: DateTime) => ({
  formattedDate: labelDate.toFormat("dd LLL yyyy"),
  week: `Week ${labelDate.weekNumber}`,
  month: labelDate.toFormat("LLLL"),
  quarter: `Q${Math.ceil(labelDate.month / 3)}`,
  year: labelDate.year,
});

const buildAggregationPipeline = (range: DateRange) => [
  { $match: { createdAt: { $gte: range.start, $lte: range.end } } },
  {
    $group: {
      _id: "$category",
      creditAmount: {
        $sum: {
          $cond: [{ $eq: ["$type", "credit"] }, { $toDouble: "$amount" }, 0],
        },
      },
      debitAmount: {
        $sum: {
          $cond: [{ $eq: ["$type", "debit"] }, { $toDouble: "$amount" }, 0],
        },
      },
    },
  },
];

const runAggregation = async (period: Period): Promise<string> => {
  try {
    const { range, labelDate } = getStartEndDates(period);

    const results: CategoryAggregation[] = await FinanceAggregation.aggregate(buildAggregationPipeline(range));

    const totalCredit = results.reduce((acc, cur) => acc + cur.creditAmount, 0);
    const totalDebit = results.reduce((acc, cur) => acc + cur.debitAmount, 0);

    const categories: AggregationCategory[] = results.map(item => ({
      category: item._id,
      creditAmount: item.creditAmount,
      debitAmount: item.debitAmount,
    }));

    const meta = buildMetaFields(labelDate);

    await AggregationAnalyticsRun.updateOne(
      { type: period, date: labelDate.startOf("day").toJSDate() },
      {
        $set: {
          creditAmount: totalCredit,
          debitAmount: totalDebit,
          categories,
          ...meta,
        },
      },
      { upsert: true }
    );

    return `✅ Aggregation complete for ${period}. ₹${totalCredit} credited, ₹${totalDebit} debited across ${results.length} categories.`;
  } catch (error) {
    console.error(`❌ Aggregation failed for ${period}:`, error);
    throw error;
  }
};

const getStartEndForDate = (dateStr: string): { dt: DateTime; range: DateRange } => {
  const dt = DateTime.fromISO(dateStr, { zone: "utc" });
  if (!dt.isValid) throw new Error("Invalid date format. Use YYYY-MM-DD");

  return {
    dt,
    range: {
      start: dt.startOf("day").toJSDate(),
      end: dt.endOf("day").toJSDate(),
    },
  };
};

const aggregateDailyCustom = async (dateStr: string): Promise<string> => {
  try {
    const { dt, range } = getStartEndForDate(dateStr);

    const results: CategoryAggregation[] = await FinanceAggregation.aggregate(buildAggregationPipeline(range));

    const totalCredit = results.reduce((acc, cur) => acc + cur.creditAmount, 0);
    const totalDebit = results.reduce((acc, cur) => acc + cur.debitAmount, 0);

    const categories: AggregationCategory[] = results.map(item => ({
      category: item._id,
      creditAmount: item.creditAmount,
      debitAmount: item.debitAmount,
    }));

    const meta = buildMetaFields(dt);

    await AggregationAnalyticsRun.updateOne(
      { type: "daily", date: dt.startOf("day").toJSDate() },
      {
        $set: {
          creditAmount: totalCredit,
          debitAmount: totalDebit,
          categories,
          ...meta,
        },
      },
      { upsert: true }
    );

    return `✅ Custom daily aggregation complete for ${dateStr}. ₹${totalCredit} credited, ₹${totalDebit} debited.`;
  } catch (error) {
    console.error(`❌ Custom daily aggregation failed for ${dateStr}:`, error);
    throw error;
  }
};

module.exports = {
  runAggregation,
  aggregateDaily: () => runAggregation("daily"),
  aggregateWeekly: () => runAggregation("weekly"),
  aggregateMonthly: () => runAggregation("monthly"),
  aggregateQuarterly: () => runAggregation("quarterly"),
  aggregateYearly: () => runAggregation("yearly"),
  aggregateDailyCustom,
};
