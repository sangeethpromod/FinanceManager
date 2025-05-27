import { Request, Response } from 'express';
import axios from 'axios';
import MutualFund from '../models/mutualFundModel'; // Use ES Module import for TypeScript
import { calculatePortfolioSummary } from '../utils/calculatePortfolioSummary';

// ------------------ Types ------------------

interface AddFundRequestBody {
  fundID: string;
  monthlySip: string;
  assetclass: string;
  fundtype: string;
  platform?: string;
  fundway: string;
  sipStartDate: string;
  sipDeductionDate: string;
  sipStatus?: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  existingInvestment?: {
    totalAmountInvested: string;
    totalUnitsHeld: number;
    purchaseDate?: string;
  };
}

interface LumpsumRequestBody {
  fundID: string;
  amount: string;
  investmentDate?: string;
}

interface UpdateSipStatusBody {
  fundID: string;
  sipStatus: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  monthlySip?: string;
}

// ------------------ Helper ------------------

const fetchFundDetails = async (fundID: string) => {
  try {
    const res = await axios.get(`https://api.mfapi.in/mf/${fundID}/latest`);
    return {
      schemeName: res.data.meta.scheme_name,
      latestNav: parseFloat(res.data.data[0]?.nav || '0'),
    };
  } catch (err) {
    console.error(`❌ Failed to fetch fund ${fundID} details:`, err);
    return null;
  }
};

// ------------------ Controllers ------------------

// Add Mutual Fund
const addFund = async (req: Request<{}, {}, AddFundRequestBody>, res: Response) => {
  try {
    const {
      fundID,
      monthlySip,
      assetclass,
      fundtype,
      platform,
      fundway,
      sipStartDate,
      sipDeductionDate,
      sipStatus = 'ACTIVE',
      existingInvestment,
    } = req.body;

    if (!fundID || !monthlySip || !sipDeductionDate || !sipStartDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const existing = await MutualFund.findOne({ fundID });
    if (existing) {
      return res.status(400).json({ error: 'Fund already exists' });
    }

    const details = await fetchFundDetails(fundID);
    if (!details) {
      return res.status(400).json({ error: 'Invalid Fund ID or API error' });
    }

    const newFund = new MutualFund({
      fundID,
      fundName: details.schemeName,
      fundNav: details.latestNav,
      monthlySip,
      assetclass,
      fundtype,
      platform,
      fundway,
      sipStartDate,
      sipDeductionDate,
      sipStatus,
      lastNavUpdated: new Date(),
      transactions: [],
    });

    if (existingInvestment) {
      const { totalAmountInvested, totalUnitsHeld, purchaseDate } = existingInvestment;
      const amount = parseFloat(totalAmountInvested);
      const units = totalUnitsHeld;

      if (amount <= 0 || units <= 0) {
        return res.status(400).json({ error: 'Invalid existing investment values' });
      }

      const avgNav = parseFloat((amount / units).toFixed(3));
      newFund.transactions.push({
        date: purchaseDate ? new Date(purchaseDate) : new Date(),
        amount,
        nav: avgNav,
        units,
        type: 'INITIAL',
      });
    }

    calculatePortfolioSummary(newFund);
    await newFund.save();

    const invested = parseFloat(newFund.totalAmountInvested || '0');
    const current = parseFloat(newFund.currentAmount || '0');
    const gain = current - invested;

    return res.status(201).json({
      success: true,
      message: 'Fund added successfully',
      data: {
        ...newFund.toObject(),
        calculations: {
          absoluteGain: gain.toFixed(2),
          gainPercent: invested > 0 ? ((gain / invested) * 100).toFixed(2) : '0.00',
          isProfit: gain >= 0,
        },
      },
    });
  } catch (err) {
    console.error('❌ Error in addFund:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Add Lumpsum
const addLumpsum = async (req: Request<{}, {}, LumpsumRequestBody>, res: Response) => {
  try {
    const { fundID, amount, investmentDate } = req.body;

    if (!fundID || !amount) {
      return res.status(400).json({ error: 'Fund ID and amount required' });
    }

    const fund = await MutualFund.findOne({ fundID });
    if (!fund) return res.status(404).json({ error: 'Fund not found' });

    const date = investmentDate ? new Date(investmentDate) : new Date();
    const nav = parseFloat(fund.fundNav);
    const units = parseFloat((parseFloat(amount) / nav).toFixed(3));

    fund.transactions.push({
      date,
      amount: parseFloat(amount),
      nav,
      units,
      type: 'LUMPSUM',
    });

    calculatePortfolioSummary(fund);
    await fund.save();

    return res.status(200).json({
      success: true,
      message: 'Lumpsum added',
      data: {
        unitsAllotted: units,
        newTotalUnits: fund.totalUnitsHeld,
        newCurrentValue: fund.currentAmount,
      },
    });
  } catch (err) {
    console.error('❌ Error in addLumpsum:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Update SIP
const updateSipStatus = async (req: Request<{}, {}, UpdateSipStatusBody>, res: Response) => {
  try {
    const { fundID, sipStatus, monthlySip } = req.body;
    const update: any = { sipStatus };
    if (monthlySip) update.monthlySip = monthlySip;

    const fund = await MutualFund.findOneAndUpdate({ fundID }, update, { new: true });
    if (!fund) return res.status(404).json({ error: 'Fund not found' });

    return res.status(200).json({
      success: true,
      message: 'SIP updated',
      data: {
        fundID: fund.fundID,
        sipStatus: fund.sipStatus,
        monthlySip: fund.monthlySip,
      },
    });
  } catch (err) {
    console.error('❌ Error in updateSipStatus:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get All Funds
const getAllFunds = async (_req: Request, res: Response) => {
  try {
    const funds = await MutualFund.find().sort({ createdAt: -1 });

    const summary = funds.reduce(
      (acc: any, fund: any) => {
        acc.totalInvested += parseFloat(fund.totalAmountInvested || '0');
        acc.currentValue += parseFloat(fund.currentAmount || '0');
        return acc;
      },
      { totalInvested: 0, currentValue: 0 }
    );

    summary.totalGain = summary.currentValue - summary.totalInvested;
    summary.totalGainPercent = summary.totalInvested
      ? ((summary.totalGain / summary.totalInvested) * 100).toFixed(2)
      : '0.00';

    return res.status(200).json({
      success: true,
      data: funds,
      summary: {
        totalInvested: summary.totalInvested.toFixed(2),
        currentValue: summary.currentValue.toFixed(2),
        totalGain: summary.totalGain.toFixed(2),
        gainPercent: summary.totalGainPercent,
      },
    });
  } catch (err) {
    console.error('❌ Error in getAllFunds:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get By Name
const getFundByName = async (req: Request<{ name: string }>, res: Response) => {
  try {
    const { name } = req.params;
    const fund = await MutualFund.findOne({ fundName: name });

    if (!fund) {
      return res.status(404).json({ status: "error", message: "Not found" });
    }

    res.json({ status: "ok", data: fund });
    return;
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
    return;
  }
};

// Portfolio Summary
const getPortfolioSummary = async (_req: Request, res: Response) => {
  try {
    const funds = await MutualFund.find();

    let totalInvested = 0;
    let totalCurrent = 0;
    let totalYesterday = 0;

    for (const fund of funds) {
      const invested = parseFloat(fund.totalAmountInvested || "0");
      const current = parseFloat(fund.currentAmount || "0");
      const yesterday = parseFloat(String(fund.yesterdayAmount ?? "0"));

      totalInvested += invested;
      totalCurrent += current;
      totalYesterday += yesterday;
    }

    const unrealisedGain = totalCurrent - totalInvested;
    const unrealisedGainPercent = totalInvested > 0
      ? ((unrealisedGain / totalInvested) * 100)
      : 0;

    const oneDayChange = totalCurrent - totalYesterday;
    const oneDayChangePercent = totalYesterday > 0
      ? ((oneDayChange / totalYesterday) * 100)
      : 0;

    return res.status(200).json({
      status: "ok",
      data: {
        totalInvestedAmount: totalInvested.toFixed(2),
        totalCurrentAmount: totalCurrent.toFixed(2),
        unrealisedGain: unrealisedGain.toFixed(2),
        unrealisedGainPercent: unrealisedGainPercent.toFixed(2),
        oneDayChange: oneDayChange.toFixed(2),
        oneDayChangePercent: oneDayChangePercent.toFixed(2),
      },
    });
  } catch (err: any) {
    console.error("❌ Portfolio Summary Error:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// ------------------ Export ------------------

export {
  addFund,
  addLumpsum,
  updateSipStatus,
  getAllFunds,
  getFundByName,
  getPortfolioSummary,
};
