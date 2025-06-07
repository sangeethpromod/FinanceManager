const { startCronJobs } = require("./aggregateCrone"); // Adjust path
const { aggregateDaily1 } = require("../controllers/aggregationController");

async function runDev(): Promise<void> {
  startCronJobs(); // kick off scheduled crons

  console.log("⚡ Running daily aggregation immediately for dev test");
  try {
    await aggregateDaily1();
    console.log("✅ Immediate daily aggregation completed");
  } catch (err) {
    console.error("❌ Immediate daily aggregation error:", err);
  }
}

runDev();
