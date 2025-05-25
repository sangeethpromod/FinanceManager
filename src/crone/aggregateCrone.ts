const cron = require("node-cron");
const {
  aggregateDaily,
  aggregateWeekly,
  aggregateMonthly,
  aggregateQuarterly,
  aggregateYearly
} = require("../controllers/aggregationController");

// Daily - Midnight
cron.schedule("0 0 * * *", () => {
  console.log("Running daily aggregation");
  aggregateDaily();
});

// Weekly - Monday 1AM
cron.schedule("0 1 * * 1", () => {
  console.log("Running weekly aggregation");
  aggregateWeekly();
});

// Monthly - 1st day 2AM
cron.schedule("0 2 1 * *", () => {
  console.log("Running monthly aggregation");
  aggregateMonthly();
});

// Quarterly - 1st Jan/Apr/Jul/Oct 3AM
cron.schedule("0 3 1 1,4,7,10 *", () => {
  console.log("Running quarterly aggregation");
  aggregateQuarterly();
});

// Yearly - Jan 1st, 4AM
cron.schedule("0 4 1 1 *", () => {
  console.log("Running yearly aggregation");
  aggregateYearly();
});
