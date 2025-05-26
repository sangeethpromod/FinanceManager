const FinanceAggregation = require("../models/financeModel");
const AggregationAnalytics = require("../models/analyticsAggeragteModel");

function getStartEndDates(period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly") {
  const now = new Date();
  let start, end;

  switch (period) {
    case "daily":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;

    case "weekly":
      const day = now.getDay(); // Sunday = 0
      start = new Date(now);
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "quarterly":
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
  }

  return { start, end };
}

async function runAggregation(period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly") {
  const { start, end } = getStartEndDates(period);

  const results = await FinanceAggregation.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: { $toDouble: "$amount" } }
      }
    }
  ]);

  for (const item of results) {
    await AggregationAnalytics.updateOne(
      { date: start, type: period, category: item._id },
      {
        $set: {
          totalAmount: item.totalAmount,
        }
      },
      { upsert: true }
    );
  }

  return `Aggregation complete for ${period}. ${results.length} categories processed.`;
}


// Test function to check database connection and basic functionality
// async function testAggregationSystem() {
//   try {
//     // Test database connection
//     const totalRecords = await FinanceAggregation.countDocuments();
//     const totalAnalytics = await AggregationAnalytics.countDocuments();
    
//     console.log(`📊 Database Status:`);
//     console.log(`   - Finance records: ${totalRecords}`);
//     console.log(`   - Analytics records: ${totalAnalytics}`);
    
//     // Test a quick daily aggregation (non-destructive)
//     const { start, end } = getStartEndDates("daily");
//     const todayRecords = await FinanceAggregation.countDocuments({
//       createdAt: { $gte: start, $lte: end }
//     });
    
//     console.log(`   - Today's records: ${todayRecords}`);
//     console.log(`✅ Aggregation system test completed successfully`);
    
//     return `Test completed: ${totalRecords} total records, ${todayRecords} today`;
//   } catch (error) {
//     console.error(`❌ Aggregation system test failed:`, error);
//     throw error;
//   }
// }

// Exporting individual functions to use in API + cron
module.exports = {
  aggregateDaily: () => runAggregation("daily"),
  aggregateWeekly: () => runAggregation("weekly"),
  aggregateMonthly: () => runAggregation("monthly"),
  aggregateQuarterly: () => runAggregation("quarterly"),
  aggregateYearly: () => runAggregation("yearly"),
  // testAggregationSystem: testAggregationSystem
};
