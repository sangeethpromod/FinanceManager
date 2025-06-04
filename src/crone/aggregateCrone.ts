const cron = require("node-cron");
const {
  aggregateDaily,
  aggregateWeekly,
  aggregateMonthly,
  aggregateQuarterly,
  aggregateYearly
} = require("../controllers/aggregationController");

// Log on cron setup start
console.log("🕒 Cron jobs initialization started");

// Daily - Midnight
cron.schedule("55 23 * * *", async () => {
  console.log("🕚 Running daily aggregation (11:55 PM)");
  try {
    await aggregateDaily();
    console.log("✅ Daily aggregation completed");
  } catch (err) {
    console.error("❌ Daily aggregation error:", err);
  }
});

// Weekly - Monday 1AM
cron.schedule("0 1 * * 1", async () => {
  console.log("🕐 Running weekly aggregation");
  try {
    await aggregateWeekly();
    console.log("✅ Weekly aggregation completed");
  } catch (err) {
    console.error("❌ Weekly aggregation error:", err);
  }
});

// Monthly - 1st day 2AM
cron.schedule("0 2 1 * *", async () => {
  console.log("🕑 Running monthly aggregation");
  try {
    await aggregateMonthly();
    console.log("✅ Monthly aggregation completed");
  } catch (err) {
    console.error("❌ Monthly aggregation error:", err);
  }
});

// Quarterly - 1st Jan/Apr/Jul/Oct 3AM
cron.schedule("0 3 1 1,4,7,10 *", async () => {
  console.log("🕒 Running quarterly aggregation");
  try {
    await aggregateQuarterly();
    console.log("✅ Quarterly aggregation completed");
  } catch (err) {
    console.error("❌ Quarterly aggregation error:", err);
  }
});

// Yearly - Jan 1st, 4AM
cron.schedule("0 4 1 1 *", async () => {
  console.log("🕓 Running yearly aggregation");
  try {
    await aggregateYearly();
    console.log("✅ Yearly aggregation completed");
  } catch (err) {
    console.error("❌ Yearly aggregation error:", err);
  }
});

// Log on successful cron jobs initialization
console.log("✅ Cron jobs initialized and scheduled");



// const now = new Date();
// const testHour = now.getHours();
// const testMinute = now.getMinutes();

// console.log(`🧪 Test cron job scheduled to run daily at ${testHour}:${testMinute.toString().padStart(2, '0')}`);

// cron.schedule(`${testMinute} ${testHour} * * *`, async () => {
//   console.log(`🧪 Running test cron job at ${new Date().toLocaleTimeString()}`);
//   try {
//     const { testAggregationSystem } = require("../controllers/aggregationController");
//     const result = await testAggregationSystem();
//     console.log("✅ Test result:", result);
//   } catch (err) {
//     console.error("❌ Test cron job error:", err);
//   }
// });