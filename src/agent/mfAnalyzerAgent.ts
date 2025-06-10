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

// Fetch user's portfolio
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

// Fetch market news
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

// Main controller
const getMFInvestmentAdvice = async (_: Request, res: Response): Promise<void> => {
  const model = getGeminiModel();

  try {
    const portfolio = await fetchUserPortfolio();
    const news = await fetchMarketNews();

    const prompt = `
You are a financial advisor AI. Analyse the following mutual fund portfolio and recent market news.

Portfolio:
${JSON.stringify(portfolio, null, 2)}

Market News:
${news.join("\n")}

Instructions:
Return a clean JSON with 4 fields:
1. "overallAnalysis": A short summary on portfolio performance, risk level and any notable concentration.
2. "fundRecommendations": A list of objects where each has a "fund" and a short direct "advice".
3. "portfolioActions": 3 to 5 concise action items for rebalancing, diversification, or risk optimisation.
4. "newsActions": A list of 3-5 news headlines or summaries that are most relevant to the funds in the portfolio, each as a string. If no relevant news, say so.

Respond with only valid JSON. No text outside JSON.
`;

    const result = await model.generateContent(prompt);
    let raw = result.response.text();

    // Try to extract JSON if extra text is present
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    // Attempt to safely parse
    let parsedAdvice;
    try {
      parsedAdvice = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Failed to parse Gemini response as JSON. Raw response:", raw);
      res.status(500).json({ error: "Invalid AI response format" });
      return;
    }

    res.status(200).json(parsedAdvice);
    return;
  } catch (err: any) {
    console.error("❌ Error generating investment advice:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export { getMFInvestmentAdvice };
