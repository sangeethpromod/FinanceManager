import MutualFund from "../models/mutualFundModel";
import axios from "axios";

export const runMonthlySipCron = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalise to 00:00

  const allFunds = await MutualFund.find();
  let processed = 0;

  for (const fund of allFunds) {
    const sipDay = parseInt(fund.sipDeductionDate || "");
    const lastExecuted = fund.lastSipExecutedDate
      ? new Date(fund.lastSipExecutedDate)
      : new Date("2000-01-01");

    if (isNaN(sipDay)) continue;

    const expectedExecutionDate = new Date(today.getFullYear(), today.getMonth(), sipDay + 1);
    expectedExecutionDate.setHours(0, 0, 0, 0);

    // Only process if:
    // 1. Today is on/after expectedExecutionDate
    // 2. We haven't already processed this month's SIP
    if (today < expectedExecutionDate || lastExecuted >= expectedExecutionDate) continue;

    const navApi = `https://api.mfapi.in/mf/${fund.fundID}/latest`;

    try {
      const res = await axios.get(navApi);
      const latestNav = parseFloat(res.data.data[0].nav);
      const sipAmount = parseFloat(fund.monthlySip);

      if (isNaN(latestNav) || isNaN(sipAmount)) continue;

      const newUnits = sipAmount / latestNav;

      fund.totalUnitsHeld = (fund.totalUnitsHeld || 0) + newUnits;
      fund.fundNav = latestNav.toString();
      fund.lastNavUpdated = new Date();
      fund.totalAmountInvested = (
        parseFloat(fund.totalAmountInvested || "0") + sipAmount
      ).toFixed(2);
      fund.currentAmount = (fund.totalUnitsHeld * latestNav).toFixed(2);
      fund.lastSipExecutedDate = today;

      await fund.save();
      processed++;
    } catch (err) {
      console.error(`❌ Failed to process ${fund.fundID}:`, err);
    }
  }

  console.log(`✅ SIP cron completed. Funds updated: ${processed}`);
};
