// src/cron/updateNavCron.ts
import MutualFund from "../models/mutualFundModel";
import axios from "axios";

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
