const cron = require("node-cron");
const {
  aggregateDaily,
  aggregateWeekly,
  aggregateMonthly,
  aggregateQuarterly,
  aggregateYearly
} = require("../controllers/aggregationController");

console.log("🕒 Cron jobs initialization started");

// 🔹 Daily - Every day at 12:00 AM (for previous day's data)
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 Running daily aggregation (12:00 AM)");
  try {
    await aggregateDaily();
    console.log("✅ Daily aggregation completed");
  } catch (err) {
    console.error("❌ Daily aggregation error:", err);
  }
});

// 🔹 Weekly - Every Monday at 1:00 AM (for last Monday to Sunday)
cron.schedule("0 1 * * 1", async () => {
  console.log("🕐 Running weekly aggregation (1:00 AM)");
  try {
    await aggregateWeekly();
    console.log("✅ Weekly aggregation completed");
  } catch (err) {
    console.error("❌ Weekly aggregation error:", err);
  }
});

// 🔹 Monthly - 1st of each month at 2:00 AM (for previous month)
cron.schedule("0 2 1 * *", async () => {
  console.log("🕑 Running monthly aggregation (2:00 AM)");
  try {
    await aggregateMonthly();
    console.log("✅ Monthly aggregation completed");
  } catch (err) {
    console.error("❌ Monthly aggregation error:", err);
  }
});

// 🔹 Quarterly - Jan/Apr/Jul/Oct 1st at 3:00 AM (for previous quarter)
cron.schedule("0 3 1 1,4,7,10 *", async () => {
  console.log("🕒 Running quarterly aggregation (3:00 AM)");
  try {
    await aggregateQuarterly();
    console.log("✅ Quarterly aggregation completed");
  } catch (err) {
    console.error("❌ Quarterly aggregation error:", err);
  }
});

// 🔹 Yearly - Jan 1st at 4:00 AM (for previous year)
cron.schedule("0 4 1 1 *", async () => {
  console.log("🕓 Running yearly aggregation (4:00 AM)");
  try {
    await aggregateYearly();
    console.log("✅ Yearly aggregation completed");
  } catch (err) {
    console.error("❌ Yearly aggregation error:", err);
  }
});

console.log("✅ Cron jobs initialized and scheduled");
