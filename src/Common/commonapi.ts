import { Request, Response } from "express";
const Account = require("../models/accountModel");
const MutualFund = require("../models/mutualFundModel");

interface BankSummary {
  bankName: string;
  amount: number;
}

interface BanksCollection {
  [key: string]: BankSummary;
}

interface AccountDocument {
  accountName: string;
  currentBalance: string | number;
}

interface MutualFundDocument {
  currentinvestment: string | number;
}

interface NetWorthResponse {
  banks: BanksCollection;
  mfInvestment: number;
  networth: number;
}

const getNetWorthSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const accounts: AccountDocument[] = await Account.find();

    const banks: BanksCollection = {};
    let totalBankBalance = 0;

    accounts.forEach((acc: AccountDocument, index: number) => {
      const balance = parseFloat(String(acc.currentBalance || "0"));
      const key = `bank${index + 1}`;
      banks[key] = {
        bankName: acc.accountName,
        amount: balance
      };
      totalBankBalance += balance;
    });

    const mutualFunds: MutualFundDocument[] = await MutualFund.find();

    let totalMfInvestment = 0;
    mutualFunds.forEach((mf: MutualFundDocument) => {
      totalMfInvestment += parseFloat(String(mf.currentinvestment || "0"));
    });

    const stocksValue = 27537.9;
    const networth = totalBankBalance + totalMfInvestment + stocksValue;

    const response: NetWorthResponse & { stocks: number } = {
      banks,
      mfInvestment: totalMfInvestment,
      stocks: stocksValue,
      networth
    };

    res.status(200).json(response);
  } catch (err: unknown) {
    console.error("🔥 NetWorth API Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { getNetWorthSummary };