// src/cron/updateNavCron.ts
const MutualFund = require("../models/mutualFundModel");import axios from "axios";
import cron from "node-cron";

export const runDailyNavUpdateCron = async (): Promise<void> => {
  const allFunds = await MutualFund.find();
  let updatedCount = 0;

  for (const fund of allFunds) {
    const navApi = `https://api.mfapi.in/mf/${fund.fundID}/latest`;

    try {
      const res = await axios.get(navApi);
      const latestNav = parseFloat(res.data.data?.[0]?.nav);

      if (isNaN(latestNav)) {
        console.warn(`⚠️ Invalid NAV for fundID: ${fund.fundID}`);
        continue;
      }

      fund.fundNav = latestNav.toString();
      fund.lastNavUpdated = new Date();
      fund.currentAmount = (fund.totalUnitsHeld * latestNav).toFixed(2);

      await fund.save();
      updatedCount++;
    } catch (err: any) {
      console.error(`❌ Failed to update NAV for fundID ${fund.fundID}:`, err.message);
    }
  }

  console.log(`✅ Daily NAV update completed. Funds updated: ${updatedCount}`);
};

// Schedule the cron job to run daily at 11:55pm
cron.schedule("55 23 * * *", async () => {
  console.log("⏰ Daily NAV update cron initialized and running at 11:55pm");
  await runDailyNavUpdateCron();
});
