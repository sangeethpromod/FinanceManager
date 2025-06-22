const MutualFund = require("../models/mutualFundModel");
import axios from "axios";
const cron = require("node-cron");

// ===============================
// DAILY NAV UPDATE CRON
// ===============================
export const runDailyNavUpdateCron = async (): Promise<void> => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday

  // Skip Sunday and Monday
  if (dayOfWeek === 0 || dayOfWeek === 1) {
    console.log(`📅 Skipping NAV update for ${today.toDateString()} (Weekend/Monday)`);
    return;
  }

  console.log(`🔄 Starting NAV update for ${today.toDateString()}`);

  const allFunds = await MutualFund.find();
  let updatedCount = 0;
  let failedCount = 0;

  for (const fund of allFunds) {
    try {
      const fundDetails = await fetchFundDetailsForCron(fund.fundID);
      if (!fundDetails) {
        console.warn(`⚠️ Skipped NAV update - FundID: ${fund.fundID}`);
        failedCount++;
        continue;
      }

      const previousNav = parseFloat(fund.fundNav || "0");
      const newNav = parseFloat(fundDetails.latestNav);

      // Store yesterday’s value BEFORE update
      fund.yesterdayAmount = parseFloat(fund.currentAmount || "0");

      // Update NAV + Timestamp
      fund.fundNav = fundDetails.latestNav;
      fund.lastNavUpdated = new Date();

      // Recalculate new current value
      const newCurrentAmount = fund.totalUnitsHeld * newNav;
      fund.currentAmount = newCurrentAmount.toFixed(2);

      await fund.save();
      updatedCount++;

      const navChangePercent = ((newNav - previousNav) / previousNav) * 100;
      if (Math.abs(navChangePercent) > 2) {
        console.log(`📈 ${fund.fundName}: NAV ${previousNav} → ${newNav} (${navChangePercent.toFixed(2)}%)`);
      }

    } catch (err: any) {
      console.error(`❌ ${fund.fundName}: NAV update failed - ${err.message}`);
      failedCount++;
    }
  }

  console.log(`✅ NAV update complete. Updated: ${updatedCount}, Failed: ${failedCount}`);
};

// ===============================
// MONTHLY SIP PROCESSING CRON
// ===============================
export const runSipProcessingCron = async (): Promise<void> => {
  const today = new Date();
  const currentDate = today.getDate();
  const currentMonth = today.toISOString().slice(0, 7); // "YYYY-MM"

  console.log(`🔄 SIP check on ${today.toDateString()}`);

  const funds = await MutualFund.find({
    sipStatus: "ACTIVE",
    sipDeductionDate: currentDate.toString(),
  });

  let processedCount = 0;
  let skippedCount = 0;

  for (const fund of funds) {
    try {
      // Skip if SIP already done this month
      if (fund.lastSipExecutedMonth === currentMonth) {
        console.log(`⏭️ Skipped: ${fund.fundName} - already processed for ${currentMonth}`);
        skippedCount++;
        continue;
      }

      // Skip if SIP start date is in the future
      if (new Date(fund.sipStartDate) > today) {
        console.log(`⏳ Skipped: ${fund.fundName} - SIP start date not reached`);
        skippedCount++;
        continue;
      }

      // Get latest NAV
      const fundDetails = await fetchFundDetailsForCron(fund.fundID);
      if (!fundDetails) {
        console.warn(`⚠️ Failed NAV fetch for ${fund.fundName} during SIP processing`);
        continue;
      }

      const nav = parseFloat(fundDetails.latestNav);
      const sipAmount = parseFloat(fund.monthlySip);
      const units = parseFloat((sipAmount / nav).toFixed(3));

      // Record transaction
      fund.transactions.push({
        date: today,
        amount: sipAmount,
        nav: nav,
        units: units,
        type: "SIP",
        sipMonth: currentMonth,
      });

      // Update SIP meta
      fund.lastSipExecutedDate = today;
      fund.lastSipExecutedMonth = currentMonth;

      // Recalculate portfolio state
      fund.totalUnitsHeld = fund.transactions.reduce((sum: number, txn: any) => sum + (txn.units || 0), 0);
      fund.currentAmount = (fund.totalUnitsHeld * nav).toFixed(2);

      await fund.save();

      console.log(`💰 SIP Success: ${fund.fundName} - ₹${sipAmount} @ NAV ${nav} = ${units} units`);
      processedCount++;

    } catch (err: any) {
      console.error(`❌ SIP failed for ${fund.fundName}: ${err.message}`);
    }
  }

  console.log(`✅ SIP processing complete. Processed: ${processedCount}, Skipped: ${skippedCount}`);
};

// ===============================
// HELPER FUNCTION - NAV FETCHER
// ===============================
const fetchFundDetailsForCron = async (fundID: string) => {
  try {
    const response = await axios.get(`https://api.mfapi.in/mf/${fundID}/latest`, {
      timeout: 10000,
    });

    return {
      schemeName: response.data.meta.scheme_name || "",
      latestNav: response.data.data[0]?.nav || "0",
    };
  } catch (error) {
    return null;
  }
};

// Schedule NAV update daily at 6:00 AM local time
cron.schedule("0 6 * * *", async () => {
  console.log("🕕 Running daily NAV update cron");
  await runDailyNavUpdateCron();
});
