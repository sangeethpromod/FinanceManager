// src/controllers/mutualFundController.ts
// Controller for handling Mutual Fund related API endpoints
import MutualFund from "../models/mutualFundModel";
import axios from "axios";
import { Request, Response } from "express";

// Request body interface for adding or updating a mutual fund
interface AddOrUpdateFundRequestBody {
    fundID: string;
    monthlySip: string;
    assetclass?: string;
    fundtype?: string;
    platform?: string;
    fundway?: string;
    sipStartDate: string;
    sipDeductionDate: string;
    currentAmount?: string;
    totalUnitsHeld?: number;
    totalAmountInvested?: string;
}

// Add or update a mutual fund entry in the database
const addOrUpdateFund = async (
    req: Request<{}, {}, AddOrUpdateFundRequestBody>,
    res: Response
): Promise<Response | void> => {
    try {
        // Destructure request body
        const {
            fundID,
            monthlySip,
            assetclass,
            fundtype,
            platform,
            fundway,
            sipStartDate,
            sipDeductionDate,
            currentAmount,
            totalUnitsHeld,
            totalAmountInvested,
        } = req.body;

        // Validate required fields
        if (!fundID || !monthlySip || !sipDeductionDate || !sipStartDate) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        // Fetch latest NAV and scheme name from external API
        const mfApi = `https://api.mfapi.in/mf/${fundID}/latest`;
        let schemeName = "";
        let latestNav = "0";

        try {
          const resApi = await axios.get(mfApi);
            schemeName = resApi.data.meta.scheme_name || "";
            latestNav = resApi.data.data[0]?.nav || "0";
        } catch (apiErr) {
            return res.status(400).json({ error: "Invalid Fund ID or API failed" });
        }

        // Calculate units and current amount
        const units =
            totalUnitsHeld ||
            parseFloat(
                (
                    parseFloat(totalAmountInvested || "0") / parseFloat(latestNav)
                ).toFixed(3)
            );
        const updatedCurrentAmount = (units * parseFloat(latestNav)).toFixed(2);

        // Upsert (insert or update) the mutual fund document
        const updatedFund = await MutualFund.findOneAndUpdate(
            { fundID },
            {
                fundName: schemeName,
                fundNav: latestNav,
                monthlySip,
                assetclass,
                fundtype,
                platform,
                fundway,
                sipStartDate,
                sipDeductionDate,
                currentAmount: currentAmount || updatedCurrentAmount,
                totalUnitsHeld: totalUnitsHeld || units,
                totalAmountInvested:
                    totalAmountInvested || (units * parseFloat(latestNav)).toFixed(2),
                lastNavUpdated: new Date(),
            },
            { upsert: true, new: true }
        );

        // Respond with the updated fund
        return res.status(200).json({ success: true, data: updatedFund });
    } catch (err) {
        console.error("❌ Error saving fund:", err);
        return res.status(500).json({ error: "Server error" });
    }
};




// Response interface for getAllFunds
interface GetAllFundsResponse {
    status: string;
    data: any;
}

// Error response interface
interface ErrorResponse {
    status: string;
    message: string;
}

// Get all mutual funds from the database
const getAllFunds = async (
    req: Request,
    res: Response<GetAllFundsResponse | ErrorResponse>
): Promise<void> => {
    try {
        const funds = await MutualFund.find();
        res.json({ status: "ok", data: funds });
    } catch (err: any) {
        res.status(500).json({ status: "error", message: err.message });
    }
};





// Get a mutual fund by its name
const getFundByName = async (
  req: Request<{ name: string }>,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.params;
    const fund = await MutualFund.findOne({ fundName: name });

    if (!fund) {
      res.status(404).json({ status: "error", message: "Not found" });
      return;
    }
    res.json({ status: "ok", data: fund });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};





// Get a summary of the user's mutual fund portfolio
const getPortfolioSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const funds = await MutualFund.find();

    let totalCurrent = 0;
    let totalInvested = 0;

    // Aggregate total current value and invested amount
    for (const fund of funds) {
      totalCurrent += parseFloat(fund.currentAmount || "0");
      totalInvested += parseFloat(fund.totalAmountInvested || "0");
    }

    const margin = (totalCurrent - totalInvested).toFixed(2);

    res.status(200).json({
      status: "ok",
      data: {
        totalInvestmentValue: totalCurrent.toFixed(2),
        totalInvestedAmount: totalInvested.toFixed(2),
        margin,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Export all controller functions
export {
  addOrUpdateFund,
  getAllFunds,
  getFundByName,
  getPortfolioSummary,
};
