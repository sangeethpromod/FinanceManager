import { Request, Response } from "express";
const MutualFund = require("../models/mutualFundModel");
import { getGeminiModel } from "../agentConfig/agentic_initialization";
import axios from "axios";

interface FundSummary {
  fundName: string;
  currentValue: number;
  investedAmount: number;
  unitsHeld: number;
  nav: number;
}

// Utility: Fetch user’s mutual fund portfolio
const fetchUserPortfolio = async (): Promise<FundSummary[]> => {
  const funds = await MutualFund.find();
  return funds.map((fund: any): FundSummary => ({
    fundName: fund.fundName,
    currentValue: fund.currentAmount,
    investedAmount: fund.totalAmountInvested,
    unitsHeld: fund.totalUnitsHeld,
    nav: fund.fundNav,
  }));
};

// Utility: Fetch current market news
const fetchMarketNews = async (): Promise<string[]> => {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey=${apiKey}`
    );

    return response.data.articles
      .slice(0, 5)
      .map((article: any) => `- ${article.title}`);
  } catch (err: any) {
    console.error("❌ Failed to fetch market news:", err.message);
    return ["- Market data temporarily unavailable. Proceed with caution."];
  }
};

// ✅ Public GET API to serve advice to frontend
const getMFInvestmentAdvice = async (_: Request, res: Response) => {
  const model = getGeminiModel();

  try {
    console.log("📥 Fetching portfolio...");
    const portfolio = await fetchUserPortfolio();

    console.log("📰 Fetching market news...");
    const news = await fetchMarketNews();

    const prompt = `
You are a financial advisor AI. Analyze the following mutual fund portfolio and provide recommendations based on current market trends.

Portfolio:
${JSON.stringify(portfolio, null, 2)}

Market News:
${news.join("\n")}

Instructions:
- Analyse performance of the portfolio (growth, allocation, risk).
- Recommend rebalancing, new investments or exits.
- Use insights from market news to justify.
- Avoid generic advice. Be direct, sharp and value-driven.
-Give a short advice Recommend rebalancing, new investments or exits for each mf keep it short to point.
`;

    console.log("🧠 Generating investment recommendations...");
    const result = await model.generateContent(prompt);
    const advice = result.response.text();

    res.status(200).json({ advice });
  } catch (err: any) {
    console.error("❌ Error generating investment advice:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getMFInvestmentAdvice };
